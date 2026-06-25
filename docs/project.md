# College Event Management System

A full-stack event management platform for colleges — built on MongoDB,
Express, React, and Node.js — featuring AI-assisted event data enrichment
via the Gemini 2.5 API and a personalized, zero-latency recommendation feed
for students.

---

## Value Proposition

Manually tagging and categorizing every event is tedious for club admins,
and untagged events are invisible to any kind of personalization. This
system solves both problems with a deliberately split architecture:

- **Admins write a free-text description. The system does the rest.** On
  event creation, the backend calls Gemini 2.5 Flash to read the
  description and generate a concise summary and a structured tag array —
  no manual categorization required.
- **Students get a personalized feed with no AI latency on read.**
  Recommendations are computed with a fast, native JavaScript tag-overlap
  algorithm against data that was already enriched at write-time — so
  browsing the recommendation feed is instant, not gated behind an LLM call.
- **Registrations never overbook a venue.** Seat counts are protected
  against race conditions using a single atomic MongoDB update, so a rush
  for the last few seats in a popular event cannot oversell capacity.
- **Clear separation of student and admin power.** Event creation and
  management are admin-only, enforced server-side — not just hidden in the
  UI.

---

## Core Features

### Student Features
- Sign up / log in with JWT-based authentication
- Set personal `interests` (used to drive recommendations)
- Browse all upcoming events
- View a personalized **Top 5 Recommended Events** feed, ranked by
  interest-to-tag match score
- Register for an event (atomic, race-condition-safe)
- Cancel an existing registration
- View AI-generated event summaries instead of having to read full
  descriptions

### Admin / Club Features
- Create events with a free-text title and description
- **Automatic AI enrichment on creation:** the backend sends the
  description to Gemini 2.5 Flash and stores the returned summary and tags
  directly on the event document — no manual tagging step
- Edit event details (date, capacity, category)
- Delete events
- View registration counts / rosters per event
- All admin routes are protected by server-side role checks, independent of
  the frontend

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Database | MongoDB | Flexible document model; atomic single-document updates are exactly what seat-locking needs |
| ODM | Mongoose | Schema validation and a clean query API on top of the native driver |
| API framework | Express.js | Minimal, well-understood, easy to layer auth/RBAC middleware onto |
| Frontend | React (Vite) | Component-based UI, fast dev server |
| AI enrichment | Gemini 2.5 Flash API | Fast, low-cost LLM call used only at write-time to generate event summaries and tags |
| Recommendation engine | Native JavaScript (tag-overlap) | Zero external dependency, zero latency on read — see `design.md` for why this pairs well with LLM-enriched data |
| Auth | JWT (jsonwebtoken) + bcrypt (bcryptjs) | Stateless auth, industry-standard password hashing |

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB 6+ running locally or via a hosted cluster (e.g. MongoDB Atlas)
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd college-event-management-system
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/college_event_system
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=2h
GEMINI_API_KEY=your-gemini-api-key-here
PORT=5000
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The React app runs at `http://localhost:5173` (Vite default) and talks to
the backend at `http://localhost:5000`.

### 4. Try it out

1. `POST /api/auth/signup` — create a student account with some `interests`
   (e.g. `["coding", "music", "robotics"]`).
2. `POST /api/auth/login` — get a JWT.
3. Promote a user to admin directly in MongoDB for your first admin
   account:
   ```js
   db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
   ```
4. As that admin, `POST /api/events` with just a `title` and
   `description` — watch the response come back with an AI-generated
   `summary` and `tags` array already populated.
5. As the student, `GET /api/recommendations` — see a personalized,
   tag-matched feed.
6. `POST /api/events/:id/register` — register for an event and watch
   `seatsLeft` decrement.

---

## Project Structure

```
college-event-management-system/
├── backend/
│   ├── config/          # db connection
│   ├── models/          # Mongoose schemas (User, Event, Registration)
│   ├── routes/          # auth, events, recommendations
│   ├── middleware/       # auth (JWT verify), requireAdmin (RBAC)
│   ├── services/         # geminiService.js, recommendationService.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # Login, Signup, EventList, Recommendations, AdminDashboard
│   │   ├── components/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
├── project.md
└── design.md
```
