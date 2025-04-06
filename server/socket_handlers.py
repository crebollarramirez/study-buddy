from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import session
import json
from openai import OpenAI
from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "your_mongo_url")
client = MongoClient(MONGO_URL)
db = client["StudyBuddy"]
print(db)
users = db["users"]

api_key = os.getenv("OPENAI_API_KEY", "your_openai_api_key")
client = OpenAI(api_key=api_key)

# SocketIO instance to be initialized with the Flask app
socketio = SocketIO()


def init_socketio(app):
    """Initialize SocketIO with the Flask app"""
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio


# Socket.IO event handlers
@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("join")
def handle_join(data):
    room = data.get("room")
    join_room(room)
    emit("status", {"msg": "A user has joined the room."}, room=room)


@socketio.on("leave")
def handle_leave(data):
    room = data.get("room")
    leave_room(room)
    emit("status", {"msg": "A user has left the room."}, room=room)


@socketio.on("message")  # This event is triggered when a message is sent
def handle_message(data):
    teacher = users.find_one({"role": "teacher"})
    prompt = teacher["prompt"]
    if teacher["prompt"] is None:
        print("No prompt set by teacher")
        emit("response", {"message": "Your teacher hasn't set a prompt yet."})
        return

    try:
        # Parse the incoming message
        json_data = json.loads(data)
        user_message = json_data.get("message", "")
        user_id = json_data.get("user_id", session.get("email", "anonymous"))

        print(f"Message from user: {user_message}")

        # Emit a typing indicator
        emit("status", {"message": "Assistant is thinking..."})

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",  # or another model like "gpt-3.5-turbo"
            messages=[
                {
                    "role": "system",
                    "content": 'You are a mentor that only asks questions to students that will help poke holes in their knowledge so they know what to learn more of in the future. You primarily respond back to student answers with additional questions that allow them to think more deeply. An example conversation might go: Student: "A rabbit is a four-legged animal" Mentor: "What else do you know about rabbits?" Student: "I know that they are small and furry and are fast and they eat carrots." Mentor: "Would it make sense for a rabbit to eat a sandwich?" Student: "No, humans eat sandwiches -- not rabbits." Mentor: "What else do rabbits typically eat?" Make sure to encourage students to either ask their teacher and to look answers up if they do not know the answer. If the conversation deviates significantly from the original topic, guide the conversation back to the original topic. Please be kind to your students. Do not curse. Do not break character, please. Thank you. The topic that students will be learning is: ' + prompt,
                },
                {"role": "user", "content": user_message},
            ],
            max_tokens=500,
        )

        # Extract assistant's response
        assistant_response = response.choices[0].message.content
        print(assistant_response)

        # Send response back to the user
        emit("response", {"message": assistant_response, "from": "assistant"})

    except Exception as e:
        print(f"Error processing message: {str(e)}")
        emit(
            "error",
            {"msg": "Error processing your request"},
        )
