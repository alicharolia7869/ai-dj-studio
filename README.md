# AI DJ STUDIO — Real-Time Collaborative AI DJ Platform

**AI DJ Studio** is a modern, production-grade web platform where friends and music communities host live, interactive DJ lounges, collaboratively curate playback queues, chat in real time, battle tracks on the Soundclash stage, and experience mathematically harmonic transitions powered by AI.

---

## 🎧 Architecture & Core Features

### 1. Deterministic Acoustic Matching Engine
* **Camelot Notation System**: Enforces strict harmonic mixing using the 24 standard Camelot codes (`1A`–`12A` Minor, `1B`–`12B` Major).
* **Harmonic Rules**:
  * **Identical Key**: e.g., `8A` → `8A` (100% harmonic compatibility).
  * **Adjacent Key**: e.g., `8A` → `9A` (Energy Boost +1) or `8A` → `7A` (Deep Resonance -1), with full circular wrap-around (`12A` ↔ `1A`).
  * **Relative Major / Minor**: e.g., `8A` → `8B` (A minor to C major emotional transition).
  * Incompatible keys (e.g., `8A` → `2A`) are strictly rejected as immediate harmonic segues.
* **BPM Compatibility Rules**:
  * Direct match within **±8%** of the current track's tempo.
  * Valid **half-time** (e.g., 140 → 70 BPM) or **double-time** (e.g., 70 → 140 BPM) transitions within the same ±8% tolerance.
* **Deterministic Ranking Formula**:
  $$\text{Score} = (\text{Harmonic Closeness} \times 0.50) + (\text{Crowd Sentiment \& Room Vibe Fit} \times 0.30) + (\text{Recency Penalty} \times 0.20)$$

### 2. Real-Time Chat Sentiment & Room Energy NLP
* Analyzes chat messages using a calibrated music-room lexicon, emoji mood weights, and punctuation/exclamation intensity.
* Computes a rolling crowd sentiment score from **-1.0** (Fatigued / Low Energy) to **+1.0** (Positive / Energetic).
* Automatically adapts the AI DJ's energy curve:
  * High-energy chat triggers higher-energy segues (`> 0.80`).
  * Fatigued chat triggers atmospheric, smoother transitions.
  * Neutral chat preserves the configured lounge vibe profile.

### 3. Soundclash Battle Stage
* Real-time competitive voting arena pitting 2 to 4 candidate tracks against each other for the next queue spot.
* Host-controlled battle creation with configurable countdown timers (15s–180s).
* Server-side vote validation enforcing one vote per participant.
* Deterministic countdown expiration resolution with automatic queue insertion for the winner.

### 4. Interactive Web Audio & Harmonic Beat Synthesizer
* Native Web Audio API audio synthesis engine calibrated to each track's BPM and Camelot root frequency.
* Generates synchronized 4-on-the-floor kicks, snappy claps, offbeat hi-hats, and melodic bassline arpeggios when sample audio files are not present.
* Supports uploaded audio files (`.mp3`, `.wav`, `.ogg`, `.m4a`) up to 15MB.
* Real-time `AnalyserNode` frequency spectrum visualizer and animated waveforms.

### 5. Hybrid Recommendation Engine
* **Content-Based Filtering**: Matches favorite genres, preferred BPM windows, Camelot keys, energy, and valence.
* **Collaborative Filtering**: Analyzes co-listening patterns, completion rates, and track likes across users.
* **Honest Explanations**: Generates transparent, human-readable explanations (e.g., *"Recommended because you frequently listen to energetic house tracks around 124 BPM"*).

---

## 🛠 Technology Stack

* **Frontend**: React 18, Vite 5, Tailwind CSS, Framer Motion, Lucide React, Zustand, Recharts, React Router v6.
* **Backend**: Node.js 24, Express.js, Socket.IO 4.7, JWT Auth, Bcrypt, Mongoose 8.
* **Database**: MongoDB Atlas or automatic zero-config In-Memory MongoDB (`mongodb-memory-server`) for frictionless local development and testing.
* **Testing**: Jest 29, Supertest 7 with ECMAScript Modules (`--experimental-vm-modules`).

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
* Node.js v18+ (tested on Node v24.18.0)
* npm v9+

### 2. Clone and Setup
```bash
git clone <repo-url>
cd "Spotify AI DJ Engine"
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 4. Environment Configuration
Copy the provided `.env.example` file to `.env`:
```bash
cp .env.example .env
```
*(Leave `MONGODB_URI` blank to automatically use the zero-config in-memory database, or supply a MongoDB Atlas connection string).*

### 5. Running the Application
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Starts on http://localhost:5000 (auto-seeds demo catalog on fresh launch)
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Starts on http://localhost:5173
```

---

## 🧪 Automated Testing

AI DJ Studio includes a comprehensive test suite covering **39 automated unit and integration tests**:

```bash
cd server
npm test
```

### Test Coverage Highlights:
* **22+ Simulated Acoustic Segue Cases**:
  * Identical keys (`8A` → `8A`)
  * Adjacent keys (`8A` → `9A`, `8A` → `7A`)
  * Relative major/minor transitions (`8A` → `8B`, `10A` → `10B`)
  * Camelot circular wrap-around (`12A` ↔ `1A`, `12B` ↔ `1B`)
  * Incompatible key rejection (`8A` → `2A`, `8A` → `10A`, `8A` → `3B`)
  * BPM tolerance matching within ±8%
  * Double-time (`70` → `140` BPM) and half-time (`140` → `70` BPM) segues
  * BPM mismatch rejection (> 8%)
* **Real-Time Sentiment NLP**: Positive/hype detection, negative/fatigue detection, rolling trend window.
* **Hybrid Recommendations**: Content-based and collaborative rank ordering.
* **REST API Endpoints**: Registration, login, duplicate email rejection, session verification, lounge creation, queue voting, AI Q&A, and admin authorization guards.

---

## 👤 Demo Accounts (Local Development)

The database automatically seeds 4 role-hierarchical demo accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aidjstudio.io` | `StudioAdmin123!` | Track catalog management, upload audio, manage all rooms |
| **Host** | `host@aidjstudio.io` | `HostNexus123!` | Create & manage lounges, launch Soundclash battles, playback controls |
| **Co-DJ** | `codj@aidjstudio.io` | `CoDjPulse123!` | Queue reordering, resolve battles, playback controls |
| **Listener** | `listener@aidjstudio.io` | `ListenerVibe123!` | Join lounges, vote on tracks & battles, chat, ask AI questions |

*Default Live Lounge Invite Code:* **`NEXUS1`**

---

## 📡 Socket.IO Real-Time Events Reference

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `lounge:join` | Client → Server | `{ loungeId }` — Subscribes socket to lounge room & fetches full state |
| `lounge:state` | Server → Client | Authoritative room state, current track, queue, sentiment & messages |
| `queue:add` | Client → Server | `{ loungeId, trackId }` — Adds track with acoustic compatibility score |
| `queue:update` | Server → Client | Broadcasts updated queue order and vote scores |
| `queue:vote` | Client → Server | `{ loungeId, trackId }` — Toggles upvote (enforces 1 vote per user) |
| `queue:reorder` | Client → Server | `{ loungeId, reorderedQueueIds }` — Reorders queue (Host/Co-DJ only) |
| `soundclash:create`| Client → Server | `{ loungeId, candidateTrackIds, durationSeconds }` |
| `soundclash:opened`| Server → Client | Broadcasts battle countdown to all participants |
| `soundclash:vote` | Client → Server | `{ loungeId, battleId, candidateTrackId }` |
| `soundclash:resolved`| Server → Client| Broadcasts winner and automatically inserts track into queue top |
| `chat:send` | Client → Server | `{ loungeId, message }` |
| `chat:message` | Server → Client | Broadcasts message with NLP sentiment score |
| `sentiment:update` | Server → Client | Broadcasts room crowd sentiment score, category, and trend |
| `ai:ask` | Client → Server | `{ loungeId, question }` — Grounded AI DJ Q&A |
| `ai:announcement` | Server → Client | Broadcasts DJ Nexus AI answers to the entire room |
| `playback:command` | Client → Server | `{ loungeId, command, position }` (`play`, `pause`, `seek`, `next`) |
| `playback:update` | Server → Client | Broadcasts synchronized playback position and state |

---

## 🌐 REST API Endpoints (`/api/v1`)

### Authentication
* `POST /api/v1/auth/register` — Register new account
* `POST /api/v1/auth/login` — Login & receive JWT access + refresh tokens
* `POST /api/v1/auth/refresh` — Token rotation
* `POST /api/v1/auth/logout` — Revoke session
* `GET /api/v1/auth/me` — Current authenticated user profile

### Lounges & Real-Time Rooms
* `GET /api/v1/lounges` — List active lounges with search & vibe filters
* `POST /api/v1/lounges` — Create new lounge (generates unique invite code)
* `GET /api/v1/lounges/:loungeId` — Get lounge details by ID or 6-char code
* `POST /api/v1/lounges/:loungeId/join` — Join lounge session
* `PATCH /api/v1/lounges/:loungeId/settings` — Update lounge rules (Host/Co-DJ)
* `POST /api/v1/lounges/:loungeId/end` — End lounge session

### Queue Management
* `GET /api/v1/lounges/:loungeId/queue` — Get current queue
* `POST /api/v1/lounges/:loungeId/queue` — Add track to queue
* `POST /api/v1/lounges/:loungeId/queue/:trackId/vote` — Toggle track vote
* `PATCH /api/v1/lounges/:loungeId/queue/reorder` — Reorder queue
* `POST /api/v1/lounges/:loungeId/ai/segue` — Evaluate harmonic transition candidates

### Soundclash Battles
* `POST /api/v1/lounges/:loungeId/soundclash` — Open battle
* `POST /api/v1/lounges/:loungeId/soundclash/:battleId/vote` — Submit vote
* `POST /api/v1/lounges/:loungeId/soundclash/:battleId/resolve` — Deterministic resolution

### AI & Chat
* `GET /api/v1/lounges/:loungeId/messages` — Fetch message history
* `POST /api/v1/lounges/:loungeId/messages` — Post message & run sentiment NLP
* `GET /api/v1/lounges/:loungeId/sentiment` — Get crowd sentiment metrics
* `POST /api/v1/lounges/:loungeId/ai/ask` — Ask AI DJ grounded question

### Tracks Catalog & Admin
* `GET /api/v1/tracks` — Search catalog with BPM & Camelot key filters
* `GET /api/v1/tracks/:trackId` — Get track details & timeline
* `POST /api/v1/tracks` — Add track (Admin / Host only, audio upload support)
* `PATCH /api/v1/tracks/:trackId` — Update track metadata (Admin only)
* `DELETE /api/v1/tracks/:trackId` — Delete track (Admin only)

### User & Analytics
* `GET /api/v1/users/me/recommendations` — Personalized hybrid recommendations
* `GET /api/v1/users/me/history` — Listening interaction history
* `GET /api/v1/users/me/preferences` — Get musical preferences
* `PATCH /api/v1/users/me/preferences` — Update preferred genres, BPM & keys
* `GET /api/v1/analytics/lounges/:loungeId` — Session analytics & Recharts data
* `GET /health` — Service health check

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel
1. Set the root directory to `client`.
2. Configure build settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Set Environment Variables:
   * `VITE_API_URL`: URL of your deployed backend (e.g., `https://api.aidjstudio.io/api/v1`)
   * `VITE_SOCKET_URL`: URL of your deployed backend (e.g., `https://api.aidjstudio.io`)

### Deploying Backend to Node.js Hosting (Render, Railway, Heroku, or AKS)
1. Set the root directory to `server`.
2. Build / Start command: `npm start`
3. Set Environment Variables:
   * `PORT`: `5000` (or host-assigned)
   * `NODE_ENV`: `production`
   * `CLIENT_ORIGIN`: Your deployed frontend URL (e.g., `https://aidjstudio.vercel.app`)
   * `MONGODB_URI`: Your MongoDB Atlas connection URI
   * `JWT_SECRET`: Random 32+ character string
   * `JWT_REFRESH_SECRET`: Random 32+ character string
   * `AI_PROVIDER`: `heuristic` (built-in) or `openai` / `gemini`
   * `OPENAI_API_KEY`: Optional if using external LLM

---

## 🔒 Security Best Practices
* **No Hardcoded Secrets**: All keys, passwords, and tokens are read strictly from environment variables.
* **Bcrypt Password Hashing**: Passwords salted and hashed with 10 rounds.
* **Dual-Token Authentication**: Short-lived JWT access tokens (15m) with rotating refresh tokens (7d).
* **Strict Server-Side Validation**: All BPM values, Camelot keys, and role permissions are validated on the backend.
* **Sanitized Media Uploads**: Multer configured with 15MB file-size limits and mime-type whitelisting.
