# ProjectFlow — Project Management Tool

A full-stack project management tool built with React, Node.js, Express, and MongoDB.

## Features
- User authentication (register/login with JWT)
- Create, edit, delete projects
- Assign tasks to projects with priorities and deadlines
- Track task progress (Todo → In Progress → Done)
- Dashboard with progress charts
- Responsive UI

## Tech Stack
- **Frontend**: React 18, React Router, Axios, Chart.js, Tailwind CSS
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB Atlas (free tier)
- **Auth**: JWT + bcrypt

## Deployment
- **Frontend**: Netlify
- **Backend**: Render (free tier)
- **Database**: MongoDB Atlas (free tier)

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup

1. Clone the repo
2. Setup backend:
```bash
cd server
npm install
cp .env.example .env
# Fill in your MongoDB URI and JWT_SECRET
npm run dev
```

3. Setup frontend:
```bash
cd client
npm install
cp .env.example .env
# Fill in REACT_APP_API_URL
npm start
```

## Deployment Guide

### MongoDB Atlas
1. Create free account at https://www.mongodb.com/atlas
2. Create a free M0 cluster
3. Get connection string

### Backend on Render
1. Push code to GitHub
2. Create new Web Service on https://render.com
3. Set root directory to `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

### Frontend on Netlify
1. Create account at https://netlify.com
2. Import from GitHub, set base directory to `client`
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add `REACT_APP_API_URL` env variable pointing to your Render backend URL
