# CropGenesis 🌱

An AI-powered platform for farmers providing personalized crop planning and disease diagnosis using Google's Gemini API.

## Features

- 🤖 **AI-Powered Crop Planning**: Generate personalized crop plans based on soil type, irrigation, season, and other factors
- 🔍 **Disease Diagnosis**: Upload images or videos to get AI-powered disease detection and remedies
- 🗣️ **Multilingual Support**: Text and audio explanations in English, Hindi, and local languages
- 📱 **Mobile-Friendly**: Responsive design optimized for farmers' devices
- 🔐 **Secure Authentication**: JWT-based user authentication and data protection
- 📊 **History Dashboard**: Track past crop plans and disease diagnoses

## Technology Stack

- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **AI**: Google Gemini API (text generation, disease analysis, TTS)
- **Authentication**: JWT
- **File Upload**: Multer
- **Database**: MongoDB Atlas

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd cropgenesis
   npm run install-all
   ```

   Or use the automated setup script:
   ```bash
   node setup.js
   ```

2. **Set up environment variables:**
   
   **Backend (.env file in `backend` folder):**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cropgenesis?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend (.env file in `frontend` folder):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=CropGenesis
   VITE_APP_VERSION=1.0.0
   VITE_NODE_ENV=development
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:5173`

### Manual Setup

If you prefer to set up manually:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Copy environment files:**
   ```bash
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env
   ```

5. **Update the .env files with your actual values**

6. **Start the servers:**
   ```bash
   npm run dev
   ```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/change-password` - Change password

#### Crop Planning
- `POST /api/cropplan/generate` - Generate crop plan
- `POST /api/cropplan/followup` - Follow-up questions

#### Disease Diagnosis
- `POST /api/diagnosis/upload` - Upload image/video for diagnosis

#### History
- `GET /api/history/get` - Get user history
- `DELETE /api/history/delete/:id` - Delete history item

## Project Structure

```
cropgenesis/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── controllers/     # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── utils/       # Utility functions
│   │   └── App.jsx      # Main app component
│   └── public/          # Static assets
└── README.md
```

## Environment Setup

### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file

### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to your `.env` file

## Development

- **Backend only**: `npm run server`
- **Frontend only**: `npm run client`
- **Both**: `npm run dev`

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Secure file upload handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
