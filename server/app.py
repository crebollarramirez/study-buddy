from flask import Flask, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
from flask_cors import CORS
import os
from dotenv import load_dotenv
from functools import wraps  # Add this import for the decorator
from pymongo import MongoClient
from bson import ObjectId
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
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Add these lines to fix cross-domain cookie issues
app.config['SESSION_COOKIE_SAMESITE'] = None  # Required for cross-domain cookies
app.config['SESSION_COOKIE_SECURE'] = False   # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevents JavaScript access to cookies

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
            }

        user_id = users.insert_one(new_user).inserted_id
        print("user_id: ", user_id)
        print(f"New user registered: {email} as {role}")
        return redirect("http://localhost:3000/login")

    elif auth_action == "login":
        print("You are logged in as... ", email)

        existing_user = users.find_one({"email": email})

        if not existing_user:
            # User not found, handle accordingly
            return "User not found", 404

        # Store user info in session
        session["email"] = email
        session["name"] = name
        session["role"] = existing_user.get("role", "Student")

    return redirect("http://localhost:3000/")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "http://localhost:3000/login"
    )  # Redirect to external frontend login page


@app.route("/brain_points", methods=["GET"])
@login_required
def get_brain_points():
    email = session.get("email")
    user = users.find_one({"email": email})
    if user:
        brain_points = user.get("brain_points", 0)
        return {"brain_points": brain_points}
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


@app.route("/bot/set-prompt", methods=["POST"])
def set_prompt():
    data = request.get_json()
    print(data["prompt"])
    return {"status": "success"}


if __name__ == "__main__":
    socketio.run(app, debug=True)
