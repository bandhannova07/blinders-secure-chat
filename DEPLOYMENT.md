# Blinders Secure Chat - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Git repository

## Backend Deployment (Render)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com) and sign up
   - Connect your GitHub repository
   - Create a new Web Service
   - Use these settings:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node
   - Add environment variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string
     - `JWT_EXPIRES_IN`: `7d`
     - `FRONTEND_URL`: Your Netlify URL (add after frontend deployment)

3. **MongoDB Setup**
   - Use MongoDB Atlas (cloud) or your own MongoDB instance
   - Create a database named `blinders-secure-chat`
   - Get the connection string and add to `MONGODB_URI`

## Frontend Deployment (Netlify)

1. **Build the frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up
   - Drag and drop the `dist` folder, or connect your GitHub repo
   - Set build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Add environment variables:
     - `VITE_API_URL`: Your Render backend URL + `/api`
     - `VITE_SOCKET_URL`: Your Render backend URL

## Local Development

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your local settings
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your local backend URL
npm install
npm run dev
```

## Default Credentials

**President Account:**
- Username: `president`
- Password: `BlindersPresident123!`

Use this account to:
1. Login to the system
2. Create other users with different roles
3. Manage rooms and permissions
4. Access the admin panel

## Security Features

- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ End-to-end message encryption
- ✅ 2FA for President/Vice President
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Helmet security headers

## Hierarchy System

1. **President** 👑 - Full system control
2. **Vice President** ⚔️ - Admin privileges (cannot manage President)
3. **Team Core** 🔑 - Trusted inner circle
4. **Study Circle** 📚 - Research and knowledge sharing
5. **Shield Circle** 🛡️ - Basic members and moderators

## Features

- Real-time messaging with WebSocket
- Role-based room access
- File sharing (images, documents)
- Admin dashboard for user/room management
- Dark theme with Peaky Blinders aesthetic
- PWA-ready frontend
- Permanent message storage
- Typing indicators
- Online user status

## Troubleshooting

### Backend Issues
- Check MongoDB connection
- Verify environment variables
- Check server logs in Render dashboard

### Frontend Issues
- Verify API URLs in environment variables
- Check browser console for errors
- Ensure CORS is properly configured

### WebSocket Issues
- Verify WebSocket URL matches backend
- Check for proxy/firewall blocking WebSocket connections
- Ensure proper authentication token is sent

## Support

For issues or questions, check the logs and ensure all environment variables are properly set.
