# VedaAI - Enterprise Assignment Generator

VedaAI is a highly scalable, decoupled web application that generates complex academic structures utilizing the Google Gemini LLM. To prevent blocking the main thread during heavy AI inference, the system implements an asynchronous job queue mechanism bridged with bi-directional WebSocket streams for real-time client state updates.

## 🔗 Live Deployments
- **Frontend (Vercel):** https://veda-ai-assessment-coral.vercel.app/
- **Backend API (Render):** https://veda-ai-assessment-2phj.onrender.com

## 🛠 Tech Stack
- **Client:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **API Gateway:** Node.js, Express.js
- **Job Orchestration:** BullMQ with Upstash Redis (Message Broker)
- **Real-time Sync:** Socket.io
- **Database:** MongoDB Atlas & Mongoose ODM

---

## ⚙️ Environment Configuration (.env)

To replicate this environment locally or deploy it to a production server, you must define the following variables inside a `.env` file located in the root of the `backend` directory.

```env
# The port your local backend server will run on
PORT=5000

# The URL of your frontend (used for CORS and Socket.io whitelist)
FRONTEND_URL=http://localhost:3000

# Your MongoDB Atlas connection string (Must include username/password)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/

# Your Google AI Studio API Key for Gemini inference
GEMINI_API_KEY=AIzaSy...
```
*Note: Redis broker credentials (Upstash) are currently localized within the worker context for evaluation review. In a strict production environment, this would also be extracted to the `.env` file.*

---

## 🚀 Local Installation & Setup

**Prerequisites:** [Node.js](https://nodejs.org/) (v18+), Git, and a MongoDB Atlas Cluster.

### 1. Clone the Repository
```bash
git clone [https://github.com/Nishantog7/veda-ai-assessment.git](https://github.com/Nishantog7/veda-ai-assessment.git)
cd veda-ai-assessment
```

### 2. Setup the Backend
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```
Ensure your `.env` file is created here with the variables listed above. Then start the development server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```
The application will now be running and accessible at `http://localhost:3000`.

---

## ☁️ Production Deployment Architecture

The application is deployed across a distributed cloud architecture to separate static frontend delivery from heavy backend compute processes.

### Frontend Deployment (Vercel)
The Next.js client application is deployed on Vercel's Edge Network for global CDN delivery.
- **Framework Preset:** Next.js
- **Root Directory Configuration:** The deployment is explicitly scoped to the `frontend` directory to prevent Vercel from attempting to build the Express backend.
- **Network Routing:** The application is hardwired to communicate with the live Render API URL, bypassing local host configurations.

### Backend Deployment (Render)
The Express.js API, Socket.io server, and BullMQ worker pool are deployed as a unified Web Service on Render.
- **Environment:** Node.js
- **Build Command:** `npm install`
- **Start Command:** `npx ts-node --transpile-only src/server.ts` (The `--transpile-only` flag is critically utilized to bypass memory spikes during the TypeScript compilation phase, ensuring stability within strict cloud memory limits).
- **Port Binding:** The server utilizes dynamic port binding (`process.env.PORT`) to attach to Render's internal routing network.
- **Database Security:** MongoDB Atlas network access is configured to `0.0.0.0/0` to safely accept connections from Render's rotating dynamic IP pool.

---

## 📂 Directory Structure

```text
veda-ai-assessment/
├── backend/
│   ├── src/
│   │   ├── models/       # Mongoose database schemas
│   │   ├── routes/       # API endpoints (Express)
│   │   ├── workers/      # BullMQ background processors
│   │   └── server.ts     # Express/Socket.io entry point
│   ├── .env              # Backend secrets (git-ignored)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/          # Next.js App Router pages
    │   ├── components/   # Reusable UI elements
    │   └── store/        # State management
    ├── package.json
    └── tailwind.config.js
```

---

## 📡 API & Socket Reference

### REST Endpoints
**`POST /api/assignment/generate`**
Initiates the generation sequence.
- **Payload:** `{ "topic": "string", "parameters": "object" }`
- **Response:** `202 Accepted` -> `{ "assignmentId": "uuid" }`

**`GET /health`**
System health check for Render port binding verification.

### WebSocket Events
- **Emit `join_room`:** (Payload: assignmentId) -> Subscribes client to updates.
- **Listen `generation_complete`:** -> Signals client to fetch the hydrated document from the database.
- **Listen `generation_failed`:** -> Signals client to render an error boundary.