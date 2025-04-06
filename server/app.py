from flask import Flask, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
from flask_cors import CORS, cross_origin
import os
from dotenv import load_dotenv
from functools import wraps  # Add this import for the decorator
from pymongo import MongoClient
import json
from socket_handlers import init_socketio

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your_secret_key")
oauth = OAuth(app)

# Configure Google OAuth
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID", "your_client_id")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv(
    "GOOGLE_CLIENT_SECRET", "your_client_secret"
)
app.config["GOOGLE_DISCOVERY_URL"] = (
    "https://accounts.google.com/.well-known/openid-configuration"
)

MONGO_URL = os.getenv("MONGO_URL", "your_mongo_url")
client = MongoClient(MONGO_URL)
db = client["StudyBuddy"]
users = db["users"]
messages = db["messages"]

CORS(
    app,
    supports_credentials=True,  # Allow credentials
    resources={r"/*": {"origins": "http://localhost:3000"}},  # Restrict to frontend origin
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Allowed HTTP methods
    allow_headers=["Content-Type", "Authorization"],  # Allowed headers
)

# Add these session cookie configurations
app.config["SESSION_COOKIE_SAMESITE"] = "None"  # Allow cross-origin cookies
app.config["SESSION_COOKIE_SECURE"] = True  # Required for SameSite=None
app.config["SESSION_COOKIE_HTTPONLY"] = True  # Enhanced security
app.config["SESSION_COOKIE_DOMAIN"] = None  # Let browser handle domain


# Initialize SocketIO with the Flask app
socketio = init_socketio(app)

google = oauth.register(
    name="google",
    client_id=app.config["GOOGLE_CLIENT_ID"],
    client_secret=app.config["GOOGLE_CLIENT_SECRET"],
    server_metadata_url=app.config["GOOGLE_DISCOVERY_URL"],
    client_kwargs={"scope": "openid email profile"},
)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "email" not in session:
            # Redirect to external frontend login page on localhost:3000
            return redirect("http://localhost:3000/login")
        return f(*args, **kwargs)

    return decorated_function


@app.route("/")
@login_required
def home():
    print("Yuu were authorized")
    return "Welcome to the StudyBuddy API!"


@app.route("/register")
def register():
    session["auth_action"] = "register"
    role = request.args.get("role", "Student")
    session["role"] = role

    return google.authorize_redirect(url_for("authorize", _external=True))

@cross_origin(supports_credentials=True)
@app.route("/login")
def login():
    session["auth_action"] = "login"
    return google.authorize_redirect(url_for("authorize", _external=True))


@app.route("/login/callback")
def authorize():
    token = google.authorize_access_token()
    nonce = session.pop("nonce", None)

    user_info = google.parse_id_token(token, nonce=nonce)
    email = user_info.get("email")
    name = user_info.get("name")

    # Check if this is registration or login
    auth_action = session.pop("auth_action", "login")

    print("THIS IS THE AUTH ACTION: ", auth_action)

    if auth_action == "register":
        # Registration flow
        role = session.pop("role", "Student")

        # Check if user already exists
        existing_user = users.find_one({"email": email})

        if existing_user:
            return "User already registered", 404

        # Create new user in MongoDB
        if role == "student":
            new_user = {
                "email": email,
                "name": name,
                "role": role,
                "brain_points": 0,
            }
        else:
            new_user = {
                "email": email,
                "name": name,
                "role": role,
                "prompt": None,
                "brain_points": 0,
            }

        user_id = users.insert_one(new_user).inserted_id
        print("user_id: ", user_id)
        print(f"New user registered: {email} as {role}")
        return redirect("http://localhost:3000/login")

    print("You are logged in as... ", email)

    existing_user = users.find_one({"email": email})

    if not existing_user:
        # User not found, handle accordingly
        return "User not found", 404

    # Store user info in session
    session["email"] = email
    session["name"] = name
    session["role"] = existing_user.get("role", "Student")

    print("Session saved:", session)  # Debugging log to confirm session is saved

    return redirect("http://localhost:3000/")


@app.route("/logout")
@cross_origin(supports_credentials=True)
def logout():
    session.clear()
    return redirect(
        "http://localhost:3000/"
    )  # Redirect to external frontend login page


@login_required
@app.route("/brain_points", methods=["GET"])
def get_brain_points():
    email = session["email"]
    user = users.find_one({"email": email})
    if user:
        return {"brain_points": user["brain_points"]}
    else:
        return {"error": "User not found"}, 404


@app.route("/students", methods=["GET"])
def get_students():
    students = users.find({"role": "student"})
    student_list = [
        {
            "email": student["email"],
            "name": student["name"],
            "brain_points": student["brain_points"],
        }
        for student in students
    ]
    return {"students": student_list}

@app.route("/account-type", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_account_type():
    email = session.get("email")
    user = users.find_one({"email": email})
    if user:
        return {"account_type": user["role"]}
    return {"error": "User not found"}, 404



@app.route("/bot/set-prompt", methods=["POST"])
def set_prompt():
    data = request.get_json()
    email = session.get("email")
    
    if not email:
        return {"error": "User not authenticated"}, 401

    user = users.find_one({"email": email})
    if not user:
        return {"error": "User not found"}, 404

    prompt = data.get("prompt")
    if not prompt:
        return {"error": "Prompt is required"}, 400

    # Update the user's prompt in the database
    users.update_one({"email": email}, {"$set": {"prompt": prompt}})
    return {"status": "success", "message": "Prompt updated successfully"}

@app.route("/bot/get-prompt", methods=["GET"])
def get_prompt():
    email = session.get("email")
    
    if not email:
        return {"error": "User not authenticated"}, 401

    user = users.find_one({"email": email})
    if not user:
        return {"error": "User not found"}, 404

    prompt = user.get("prompt")
    if not prompt:
        return {"error": "Prompt not set"}, 404

    return {"prompt": prompt}

@app.route("/bot/delete-prompt", methods=["DELETE"])
def delete_prompt():
    email = session.get("email")
    
    if not email:
        return {"error": "User not authenticated"}, 401

    user = users.find_one({"email": email})
    if not user:
        return {"error": "User not found"}, 404

    # Update the user's prompt in the database
    users.update_one({"email": email}, {"$set": {"prompt": None}})
    return {"status": "success", "message": "Prompt deleted successfully"}

@app.route("/messages", methods=["GET"])
def get_all_student_messages():
    all_messages = messages.find({})  # Query all messages with no filter
    
    # Dictionary to group messages by email
    grouped_messages = {}
    
    for message in all_messages:
        email = message["email"]
        message_data = {
            "message": message["message"],
            "timestamp": message["timestamp"],
            "prompt": message["prompt"],
            "sender": message["sender"],
        }
        
        # Add message to the appropriate email group
        if email in grouped_messages:
            grouped_messages[email].append(message_data)
        else:
            grouped_messages[email] = [message_data]
    
    return {"messages": grouped_messages}

if __name__ == "__main__":
    socketio.run(app, debug=True)
