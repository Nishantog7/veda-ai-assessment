<div align="center">
  <h1>VedaAI Architecture & Documentation</h1>
  <p>An enterprise-grade, event-driven AI generation pipeline.</p>
</div>

## System Overview

VedaAI is a highly scalable, decoupled web application that generates complex academic structures utilizing the Google Gemini LLM. To prevent blocking the main thread during heavy LLM inference, the system implements an asynchronous job queue mechanism bridged with bi-directional WebSocket streams for sub-millisecond client state reconciliation.

## Core Infrastructure

- Compute Layer: Next.js 15 App Router (Client) & Express.js (API Gateway)
- Job Orchestration: BullMQ with Upstash Redis acting as the message broker
- State Synchronization: Socket.io for real-time room-based client pub/sub
- Persistence: MongoDB Atlas with strict IP whitelisting and Mongoose ODM
- Deployment: Vercel (Edge Network) & Render (Node Environment)

## System Lifecycle & Event Flow

The platform mitigates REST API timeouts through an asynchronous worker pool:

1. Ingress Payload: Client submits constraints via HTTP POST to the gateway.
2. Queue Delegation: The API layer registers a task in the Redis queue and immediately returns HTTP 202 Accepted with a unique Assignment ID.
3. Socket Handshake: Client initializes a persistent WebSocket connection and joins a private room keyed to the Assignment ID.
4. Background Execution: An isolated worker process consumes the Redis job, orchestrates the Gemini API inference, and commits the structured Markdown to MongoDB.
5. Client Reconciliation: The worker triggers a completion event, causing the gateway to broadcast a payload down the WebSocket tunnel, instantly updating the client UI.

## Directory Structure

├── backend/
│   ├── src/
│   │   ├── routes/       # API endpoints 
│   │   ├── workers/      # BullMQ background processors
│   │   ├── models/       # Mongoose schemas
│   │   └── server.ts     # Express/Socket.io entry point
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/          # Next.js App Router pages
    │   ├── components/   # Reusable UI elements
    │   └── store/        # State management
    ├── package.json
    └── tailwind.config.js

## API & Socket Reference

### REST Endpoints
POST /api/assignment/generate
Initiates the generation sequence.
- Payload: { "topic": "string", "parameters": "object" }
- Response: 202 Accepted -> { "assignmentId": "uuid" }

GET /health
System health check for Render port binding verification.

### WebSocket Events
- Emit: join_room (Payload: assignmentId) -> Subscribes client to updates.
- Listen: generation_complete -> Signals client to fetch the hydrated document.
- Listen: generation_failed -> Signals client to render error boundary.

## Environment Configuration

To replicate this environment locally, define the following variables in the backend root:

PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=[ATLAS_CLUSTER_URL]
GEMINI_API_KEY=[GOOGLE_AI_STUDIO_KEY]

Note: Redis broker credentials (Upstash) are currently localized within the worker context for evaluation review.

## Deployment Topology

- Frontend Delivery: Pushed to Vercel connected to the GitHub main branch.
- Backend Compute: Hosted on Render Web Services. The start command utilizes ts-node --transpile-only to bypass free-tier RAM limits during boot sequence. Database IP access is globally permitted (0.0.0.0/0) to accommodate Render dynamic IP rotation.