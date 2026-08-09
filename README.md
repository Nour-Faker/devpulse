# DevPulse 🚀

> A full-stack developer productivity tracker with AI-powered insights.

![DevPulse Dashboard](https://via.placeholder.com/1200x600/0d0f14/3b82f6?text=DevPulse+Dashboard)

## 🌐 Live Demo

**[devpulse-one-bice.vercel.app](https://devpulse-one-bice.vercel.app)**

> Backend API: [devpulse-backend-1juf.onrender.com](https://devpulse-backend-1juf.onrender.com/docs)

---

## ✨ Features

- **JWT Authentication** — Secure register, login, and protected routes
- **Project Management** — Create and track development projects
- **Work Session Logging** — Log coding sessions with duration and mood
- **AI Weekly Summary** — Personalized productivity insights powered by Groq/Llama 3
- **Smart Suggestions** — AI suggests session titles based on your history
- **Analytics Dashboard** — Area charts, donut charts, and real-time stats
- **Daily Goals** — Set and track daily coding hour targets with progress bar
- **Pomodoro Timer** — Built-in focus timer with SVG ring animation
- **Search & Filter** — Filter sessions by mood, project, or keyword
- **Export CSV** — Download all sessions as a spreadsheet
- **Dark / Light Mode** — Persistent theme with smooth transitions
- **Responsive UI** — Clean, professional design with animations

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **PostgreSQL** | Relational database |
| **SQLAlchemy** | ORM + database models |
| **Alembic** | Database migrations |
| **JWT (python-jose)** | Authentication tokens |
| **bcrypt (passlib)** | Password hashing |
| **Groq API (Llama 3)** | AI weekly summaries |
| **Docker** | Containerized environment |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TailwindCSS** | Utility-first styling |
| **Recharts** | Charts and data visualization |
| **Axios** | HTTP client |
| **React Router** | Client-side routing |
| **Lucide React** | Icon library |

### Infrastructure
| Service | Purpose |
|---|---|
| **Render** | Backend hosting + PostgreSQL |
| **Vercel** | Frontend hosting |
| **Docker Compose** | Local development environment |
| **GitHub** | Version control + CI/CD |

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTPS  │                 │   SQL   │                 │
│  React + Vite   │ ──────► │   FastAPI       │ ──────► │   PostgreSQL    │
│  (Vercel)       │         │   (Render)      │         │   (Render)      │
│                 │ ◄────── │                 │         │                 │
└─────────────────┘   JSON  └────────┬────────┘         └─────────────────┘
                                     │
                                     │ HTTP
                                     ▼
                            ┌─────────────────┐
                            │   Groq API      │
                            │   (Llama 3)     │
                            └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Nour-Faker/devpulse.git
cd devpulse
```

### 2. Set up environment variables

Create a `.env` file at the root:

```env
POSTGRES_USER=devpulse
POSTGRES_PASSWORD=devpulse123
POSTGRES_DB=devpulse_db
DATABASE_URL=postgresql://devpulse:devpulse123@db:5432/devpulse_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GROQ_API_KEY=your-groq-api-key
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 3. Start the backend

```bash
docker-compose up --build
```

API will be running at `http://localhost:8001`
Swagger docs at `http://localhost:8001/docs`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App will be running at `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/register    Create account
POST   /api/v1/auth/login       Get JWT token
GET    /api/v1/auth/me          Get current user
```

### Projects
```
GET    /api/v1/projects         List all projects
POST   /api/v1/projects         Create project
GET    /api/v1/projects/{id}    Get project
PUT    /api/v1/projects/{id}    Update project
DELETE /api/v1/projects/{id}    Delete project
```

### Work Sessions
```
GET    /api/v1/sessions         List all sessions
POST   /api/v1/sessions         Log session
GET    /api/v1/sessions/{id}    Get session
PUT    /api/v1/sessions/{id}    Update session
DELETE /api/v1/sessions/{id}    Delete session
```

### Stats & AI
```
GET    /api/v1/stats/summary         Productivity statistics
GET    /api/v1/ai/weekly-summary     AI-generated weekly report
GET    /api/v1/ai/suggest-title      AI session title suggestions
```

---

## 📁 Project Structure

```
devpulse/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Auth, projects, sessions, stats, AI
│   │   ├── core/            # Config, security, JWT
│   │   ├── db/              # Database session
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py          # FastAPI app entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + API functions
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth + Theme context
│   │   ├── pages/           # Dashboard, Login, Register
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🤖 AI Features

DevPulse uses **Groq's Llama 3** model (free tier) for:

- **Weekly Summary** — Analyzes your sessions, mood patterns, and hours to generate a personalized productivity report
- **Title Suggestions** — Learns from your session history to suggest relevant titles for your next session

---

## 🔐 Security

- Passwords hashed with **bcrypt**
- Authentication via **JWT tokens** (access token with expiry)
- Protected API routes — users can only access their own data
- Environment variables for all secrets — never committed to git

---

## 👨‍💻 Author

**Nour Faker**
- GitHub: [@Nour-Faker](https://github.com/Nour-Faker)
- Live App: [devpulse-one-bice.vercel.app](https://devpulse-one-bice.vercel.app)

---

## 📄 License

MIT License — feel free to use this project as a reference or starting point.