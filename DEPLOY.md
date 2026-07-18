# Deployment Guide — ProjectFlow

## Step 1: MongoDB Atlas (Free Database)

1. Go to https://www.mongodb.com/atlas/database and sign up for free
2. Create a **free M0 cluster** (512 MB, forever free)
3. Under **Database Access** → Add a database user (note username + password)
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all, required for Render)
5. Click **Connect** → **Connect your application** → copy the URI
   - It looks like: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Append the DB name: `...mongodb.net/projectflow?retryWrites=true&w=majority`

---

## Step 2: Backend on Render (Free)

1. Push this project to a **GitHub repo** (see Git setup below)
2. Go to https://render.com → **New +** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your Atlas URI from Step 1 |
   | `JWT_SECRET` | Any long random string e.g. `s3cr3t_k3y_ch4ng3_m3_pl34s3` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | Your Netlify URL (add after Step 3) |
6. Click **Deploy** — note the URL e.g. `https://projectflow-api.onrender.com`

> ⚠️ Free Render instances spin down after 15 min of inactivity. First request after sleep takes ~30s.

---

## Step 3: Frontend on Netlify (Free)

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. Connect GitHub → select your repo
3. Settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
4. Add **Environment Variables** (Site Settings → Environment Variables):
   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://your-render-app.onrender.com/api` |
5. Click **Deploy site**
6. Copy your Netlify URL and update `CLIENT_URL` in Render (Step 2)

---

## Git Setup (push to GitHub)

```bash
cd C:\Users\mynks\OneDrive\Desktop\CodeSoft
git init
git add .
git commit -m "Initial commit: ProjectFlow"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/projectflow.git
git push -u origin main
```

---

## Local Development

### Terminal 1 — Backend
```bash
cd server
# Edit .env with your MongoDB URI and JWT_SECRET
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2 — Frontend
```bash
cd client
# .env already has REACT_APP_API_URL=http://localhost:5000/api
npm start
# Opens http://localhost:3000
```

---

## Project Structure

```
CodeSoft/
├── client/                  # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── _redirects       # Netlify SPA routing
│   ├── src/
│   │   ├── api/axios.js     # Axios instance with auth interceptor
│   │   ├── components/      # Layout, Modal, Toast
│   │   ├── context/         # AuthContext (JWT)
│   │   └── pages/           # Dashboard, Projects, ProjectDetail, Login, Register
│   └── netlify.toml
├── server/                  # Node/Express backend
│   ├── src/
│   │   ├── config/db.js     # MongoDB connection
│   │   ├── middleware/auth.js
│   │   ├── models/          # User, Project, Task
│   │   └── routes/          # /auth, /projects, /tasks
│   └── render.yaml
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project with tasks |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project + tasks |
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task |
| PUT | /api/tasks/:id | Update task / move status |
| DELETE | /api/tasks/:id | Delete task |
