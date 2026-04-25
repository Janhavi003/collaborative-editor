# CollabDocs

A real-time collaborative document editor built as a portfolio project — demonstrating WebSocket architecture, Operational Transformation, and full-stack product engineering.

 **Live demo:** https://your-app.vercel.app  
 **Backend API:** https://your-api.onrender.com/health  

---


## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| TipTap | Rich text editor (ProseMirror-based) |
| Socket.io Client | Real-time WebSocket communication |
| Framer Motion | Page transitions and animations |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server and REST API |
| Socket.io | WebSocket server with room support |
| Mongoose + MongoDB Atlas | Data persistence |
| Passport.js | Google OAuth 2.0 strategy |
| JSON Web Tokens | Stateless authentication |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting + CDN |
| Render | Backend hosting |
| MongoDB Atlas | Managed cloud database |
| Google Cloud | OAuth credentials |

---

## Features

- **Rich text editing** — Bold, italic, headings (H1–H3), bullet lists, ordered lists, blockquotes, inline code
- **Real-time sync** — Every keystroke is broadcast to all collaborators via WebSockets
- **Conflict resolution** — Operational Transformation (OT) engine handles concurrent edits with version vectors
- **Live presence** — Colored user avatars show who is editing in real time
- **Auto-save** — Debounced writes to MongoDB every 2 seconds
- **Google OAuth** — One-click sign-in, persistent identity via JWT
- **Multi-document dashboard** — Create, open, rename, and delete documents
- **Dark mode** — System-aware with manual toggle
- **Animated landing page** — Self-typing mock editor, feature showcase, CTA
- **Fully deployed** — Frontend on Vercel, backend on Render

---


## What This Project Demonstrates

**Real-time systems** — WebSocket room management, broadcast patterns, connection lifecycle, reconnection handling.

**Concurrency** — OT engine with version vectors, position transformation for concurrent operations, echo loop prevention via `isRemoteUpdate` ref.

**Distributed state** — In-memory document cache backed by persistent storage, debounced writes, state reconciliation on client join.

**Clean architecture** — Service layer, middleware, custom hooks, context providers. Separation of REST (loading/creating) from WebSocket (live editing).

**Authentication** — Full OAuth 2.0 flow, JWT issuance and verification, protected routes on both frontend and backend.

**Production engineering** — Environment-specific config, multi-origin CORS, health checks, automatic CI/CD via GitHub webhooks.

---
