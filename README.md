# Blinders Secure Chat

A hierarchical secure chat application with role-based access control, inspired by the BLINDERS theme.

## Architecture

- **Frontend**: React + TailwindCSS (deployable on Netlify)
- **Backend**: Node.js + Express + WebSocket + MongoDB (deployable on Render)
- **Security**: End-to-end encryption, JWT authentication, 2FA for admins

## Hierarchy & Roles

1. **President** 👑 - Super admin with full control
2. **Vice President** ⚔️ - Admin with almost full control
3. **Team Core** 🔑 - Trusted inner circle
4. **Study Circle** 📚 - Research & knowledge circle
5. **Shield Circle** 🛡️ - Protectors and moderators

## Features

- Role-based room access
- Real-time messaging with WebSocket
- End-to-end encryption
- File sharing
- Permanent message storage
- Admin controls for user/room management
- Dark theme with BLINDERS aesthetic

## Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Deployment

- Backend: Render
- Frontend: Netlify
