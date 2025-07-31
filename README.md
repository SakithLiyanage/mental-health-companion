# Mental Health Companion 🌱

A comprehensive mental health companion application built with React, Node.js, and MongoDB. This application provides AI-powered chat support, journaling, emotion tracking, goal setting, and various wellness tools.

## Features ✨

- **🤖 AI Companion Chat**: Chat with Luna, your empathetic AI friend
- **📖 Digital Journal**: Express your thoughts with mood tracking
- **💙 Emotion Analytics**: Visualize your emotional patterns
- **🎯 Goal Setting**: Set and track mental health goals
- **🧘 Breathing Exercises**: Guided breathing techniques
- **🧘‍♀️ Guided Meditation**: Mindfulness and meditation sessions
- **🙏 Gratitude Log**: Practice gratitude daily
- **📊 Progress Tracking**: Monitor your wellbeing journey
- **🔒 Secure Authentication**: JWT-based user authentication
- **📱 Responsive Design**: Works on all devices

## Tech Stack 🛠️

### Frontend
- **React 19** with TypeScript support
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **Heroicons** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **OpenAI API** for AI chat features
- **Helmet** for security headers
- **CORS** for cross-origin requests

## Quick Start 🚀

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier works)
- OpenAI API key (optional, for AI chat features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mental-health-companion
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately:
npm run install:frontend
npm run install:backend
```

### 3. Environment Setup

#### Backend Environment
1. Copy the example environment file:
```bash
cd backend
cp env.example .env
```

2. Edit `.env` with your configuration:
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/mental-health-companion?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration (for AI chat features)
OPENAI_API_KEY=your-openai-api-key-here
```

#### Frontend Environment
1. Copy the example environment file:
```bash
cd frontend
cp env.example .env
```

2. Edit `.env` with your configuration:
```env
# API Configuration
REACT_APP_API_URL=https://mental-health-companion-wine.vercel.app/api
```

### 4. Start the Application

#### Development Mode
```bash
# Start both frontend and backend in development mode
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on https://mental-health-companion-wine.vercel.app
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: https://mental-health-companion-wine.vercel.app
- **Health Check**: https://mental-health-companion-wine.vercel.app/api/health

## Project Structure 📁

```
mental-health-companion/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── .env            # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── App.jsx      # Main app component
│   │   └── index.jsx    # App entry point
│   ├── package.json     # Frontend dependencies
│   └── .env            # Frontend environment variables
├── package.json         # Root package.json
└── README.md           # This file
```

## API Endpoints 🔌

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Chat
- `POST /api/chat/message` - Send message to AI companion

### Journal
- `GET /api/journal/entries` - Get journal entries
- `POST /api/journal/entries` - Create journal entry
- `PUT /api/journal/entries/:id` - Update journal entry
- `DELETE /api/journal/entries/:id` - Delete journal entry

### Emotions
- `GET /api/emotions/tracker` - Get emotion data
- `POST /api/emotions/tracker` - Log emotion
- `GET /api/emotions/analytics` - Get emotion analytics

### Goals
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent` - Get recent activities

## Deployment 🚀

### Vercel Deployment
The project is configured for Vercel deployment with serverless functions.

1. **Backend**: Deploy to Vercel using the `vercel.json` configuration
2. **Frontend**: Deploy to Vercel using the React build

### Environment Variables for Production
Make sure to set all environment variables in your deployment platform:
- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `FRONTEND_URL`

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security 🔒

- JWT tokens for authentication
- Password hashing with bcryptjs
- CORS protection
- Rate limiting on API endpoints
- Input validation and sanitization
- Helmet.js for security headers

## Support 💬

If you encounter any issues:
1. Check the console for error messages
2. Verify your environment variables
3. Ensure MongoDB is connected
4. Check that all dependencies are installed

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- OpenAI for AI chat capabilities
- MongoDB Atlas for database hosting
- Vercel for deployment platform
- Tailwind CSS for styling framework
- React community for excellent documentation

---

**Made with ❤️ for mental health awareness and support**
