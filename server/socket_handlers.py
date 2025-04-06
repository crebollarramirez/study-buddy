from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import session
import json
from openai import OpenAI
import os

api_key = os.getenv("OPENAI_API_KEY", "your_openai_api_key")
client = OpenAI(api_key=api_key)

# SocketIO instance to be initialized with the Flask app
socketio = SocketIO()

def init_socketio(app):
    """Initialize SocketIO with the Flask app"""
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room)
    emit('status', {'msg': 'A user has joined the room.'}, room=room)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    leave_room(room)
    emit('status', {'msg': 'A user has left the room.'}, room=room)

@socketio.on('message') # This event is triggered when a message is sent
def handle_message(data):
    try:
        # Parse the incoming message
        json_data = json.loads(data)
        user_message = json_data.get("message", "")
        user_id = json_data.get("user_id", session.get('email', 'anonymous'))
        
        print(f"Message from user: {user_message}")
        
        # Emit a typing indicator
        emit('status', {'message': 'Assistant is thinking...'})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",  # or another model like "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": "You are a helpful study assistant. Be concise and clear in your responses."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500
        )
        
        # Extract assistant's response
        assistant_response = response.choices[0].message.content
        print(assistant_response)
        
        # Send response back to the user
        emit('response', {
            'message': assistant_response,
            'from': 'assistant'
        })
        
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        emit('error', {'msg': 'Error processing your request'},)