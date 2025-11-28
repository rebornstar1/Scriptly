# Scriptly 📝

A real-time collaborative document editor with advanced version control, built with modern web technologies.

![Scriptly Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🚀 Features

### ✨ Core Functionality
- **Real-Time Collaboration**: Multiple users can edit documents simultaneously with live cursor tracking
- **Rich Text Editor**: Powered by Quill.js with comprehensive formatting options
- **Version Control**: Automatic document versioning with restore capabilities
- **Live Chat**: In-document messaging for seamless team communication
- **User Authentication**: Secure JWT-based authentication system
- **Document Sharing**: Granular permission system (read/write/admin) with public/private options

### 🔧 Technical Features
- **Auto-Save**: Automatic document saving every 2 seconds
- **Typing Indicators**: Real-time typing status for all collaborators
- **Document Permissions**: Owner/collaborator management with role-based access
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Error Handling**: Comprehensive error management and user feedback

## 🏗️ Architecture

### Backend (Node.js)
- **Express.js** REST API server
- **Socket.IO** for real-time WebSocket connections
- **MongoDB** with Mongoose ODM for data persistence
- **JWT Authentication** for secure user sessions
- **CORS** configuration for cross-origin requests

### Frontend (React)
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Socket.IO Client** for real-time communication
- **Quill.js** for rich text editing
- **Tailwind CSS** for responsive styling

### Database Schema
- **Users**: Authentication and profile management
- **Documents**: Content storage with ownership and collaboration
- **Versions**: Complete version history with restore functionality

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account (or local MongoDB installation)
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/rebornstar1/Scriptly.git
cd Scriptly
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your configurations:
PORT=3001
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/scriptly?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
touch .env.local

# Configure environment variables
# Add to .env.local:
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
# Server will run on http://localhost:3001
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Application will run on http://localhost:5173
```

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📂 Project Structure

```
Scriptly/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── auth.config.js
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── socket.middleware.js
│   │   │   └── validation.middleware.js
│   │   ├── models/
│   │   │   ├── document.model.js
│   │   │   ├── user.model.js
│   │   │   └── Version.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── document.routes.js
│   │   │   └── version.routes.js
│   │   ├── socket/
│   │   ├── utils/
│   │   │   ├── auth.utils.js
│   │   │   └── db.utils.js
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── sharing/
│   │   │   ├── ui/
│   │   │   └── VersionHistory/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   ├── package.json
│   └── .env.local
└── README.md
```

## 🌐 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from `.env`

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL` with your backend URL

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - Get user's documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get specific document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Version Control
- `GET /api/versions/:documentId` - Get document versions
- `GET /api/versions/:documentId/:versionNumber` - Get specific version

## 🔌 Socket.IO Events

### Client to Server
- `get-document` - Join document room and load content
- `send-changes` - Send text changes to other users
- `save-document` - Save document content
- `get-versions` - Request version history
- `load-version` - Load specific version
- `send-chat-message` - Send chat message
- `user-typing` - Send typing status

### Server to Client
- `load-document` - Initial document load
- `receive-changes` - Receive text changes from other users
- `document-saved` - Document save confirmation
- `versions-list` - Version history data
- `version-loaded` - Specific version content
- `receive-chat-message` - Incoming chat message
- `user-typing` - Other user typing status

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation for API changes
- Ensure TypeScript compliance

## 🐛 Known Issues & Limitations

- Large documents (>50MB) may experience performance issues
- Mobile editing experience can be improved
- Maximum 50 concurrent users per document room

## 🔮 Future Enhancements

- [ ] File upload and attachment support
- [ ] Document templates
- [ ] Advanced formatting options
- [ ] Integration with Google Drive/Dropbox
- [ ] Offline mode with sync
- [ ] Document export to PDF/Word
- [ ] Advanced user roles and permissions
- [ ] Real-time cursor positions
- [ ] Comment and suggestion system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



**⭐ Star this repository if you found it helpful!**
