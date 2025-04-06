from flask import Flask, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
import os
from dotenv import load_dotenv
from functools import wraps  # Add this import for the decorator
from pymongo import MongoClient
from bson import ObjectId
import json
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your_secret_key")
oauth = OAuth(app)

# Configure Google OAuth
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID", "your_client_id")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET", "your_client_secret")
app.config["GOOGLE_DISCOVERY_URL"] = "https://accounts.google.com/.well-known/openid-configuration"

MONGO_URL = os.getenv("MONGO_URL", "your_mongo_url")
client = MongoClient(MONGO_URL)
db = client['StudyBuddy']
print(db)
users = db["users"]

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
    return redirect("http://localhost:3000/login")  # Redirect to external frontend login page

if __name__ == "__main__":
    app.run(debug=True)
