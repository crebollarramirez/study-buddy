# Flask to Express.js TypeScript Migration

This is the Express.js TypeScript version of your Flask Python application. The migration maintains all the original functionality while leveraging TypeScript's type safety and Express.js ecosystem.

## Migration Summary

### What was migrated:

- ✅ All Flask routes → Express.js routes
- ✅ Flask-SocketIO → Socket.IO
- ✅ MongoDB integration
- ✅ Google OAuth (Flask-Authlib → Passport.js)
- ✅ OpenAI integration
- ✅ Session management
- ✅ CORS configuration
- ✅ User authentication middleware

### Key Changes:

1. **Framework**: Flask → Express.js
2. **Language**: Python → TypeScript
3. **OAuth**: Authlib → Passport.js with Google Strategy
4. **WebSockets**: Flask-SocketIO → Socket.IO
5. **Session Store**: Flask sessions → express-session with MongoDB store

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your values:

```bash
cp .env.example .env
```

Update `.env` with your actual values:

- `MONGO_URL`: Your MongoDB connection string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `OPENAI_API_KEY`: Your OpenAI API key
- `SECRET_KEY`: A secure session secret

### 3. Google OAuth Setup

Make sure your Google OAuth application has the callback URL configured:

- Callback URL: `http://localhost:3000/auth/google/callback`

### 4. Run the Application

#### Development (with auto-restart):

```bash
npm run dev
```

#### Build and run in production:

```bash
npm run build
npm start
```

## API Endpoints

All original Flask endpoints have been migrated:

- `GET /` - Home page (login required)
- `GET /register?role=student` - User registration
- `GET /login` - User login
- `GET /logout` - User logout
- `GET /brain_points` - Get user's brain points
- `GET /students` - Get all students
- `GET /account-type` - Get user's account type
- `POST /bot/set-prompt` - Set teacher prompt
- `GET /bot/get-prompt` - Get teacher prompt
- `DELETE /bot/delete-prompt` - Delete teacher prompt
- `GET /messages` - Get all student messages

## Socket.IO Events

- `connect` - Client connection
- `disconnect` - Client disconnection
- `join` - Join a room
- `leave` - Leave a room
- `message` - Send/receive messages with AI bot

## Project Structure

```
server2/
├── src/
│   ├── config/
│   │   └── passport.ts          # Passport.js configuration
│   ├── types/
│   │   └── session.d.ts         # Session type definitions
│   ├── index.ts                 # Application entry point
│   └── server.ts                # Main server file
├── dist/                        # Compiled JavaScript
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Key Dependencies

- **express**: Web framework
- **socket.io**: Real-time communication
- **passport**: Authentication middleware
- **passport-google-oauth20**: Google OAuth strategy
- **mongodb**: Database driver
- **openai**: OpenAI API client
- **express-session**: Session management
- **connect-mongo**: MongoDB session store
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Development Notes

1. **Type Safety**: The application now has full TypeScript type checking
2. **Session Types**: Custom session properties are properly typed
3. **Error Handling**: Improved error handling with try-catch blocks
4. **Code Organization**: Better separation of concerns with config files
5. **Development Experience**: Nodemon for auto-restart during development

## Migration Benefits

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: IntelliSense and autocompletion
- **Modern JavaScript**: ES6+ features with TypeScript
- **Scalability**: Better code organization and maintainability
- **Performance**: Node.js performance benefits
- **Ecosystem**: Access to the vast npm ecosystem
