# Smart College Event Management System

A production-style full-stack MERN application for college event management, built with **React, Vite, Node.js, Express, and MongoDB**. The platform enables secure event management through role-based access control, AI-assisted event enrichment, personalized recommendations, and concurrency-safe event registration.

---

## Project Description

The Smart College Event Management System streamlines how colleges organize and manage campus events.

* **Admins** can create, edit, and delete events through a dedicated dashboard.
* Event descriptions are automatically enriched with **AI-generated summaries and tags** using **Gemini 2.5 Flash**.
* **Students** can browse upcoming events, register securely, cancel registrations, and receive personalized event recommendations based on their interests.
* The backend enforces **JWT authentication**, **role-based authorization**, and **atomic MongoDB operations** to prevent race conditions during event registration.

---

## Key Features

* 🔐 JWT-based authentication for students and administrators
* 👨‍💼 Dedicated admin dashboard for event management
* 🤖 AI-powered event summaries and tag generation using Gemini 2.5 Flash
* 🎯 Personalized event recommendations using a lightweight tag-overlap scoring algorithm
* ⚡ Race-condition-safe event registration with atomic MongoDB updates
* ↩️ Student registration cancellation with automatic seat restoration
* 🛡️ Role-based access control for protected admin routes
* 📱 Responsive user interface built with React and modular CSS
* 🐳 Docker-ready project structure

---

## Tech Stack

| Category             | Technologies                     |
| -------------------- | -------------------------------- |
| **Frontend**         | React, Vite, React Router, Axios |
| **Backend**          | Node.js, Express.js              |
| **Database**         | MongoDB, Mongoose                |
| **Authentication**   | JWT, bcrypt                      |
| **AI Integration**   | Gemini 2.5 Flash API             |
| **Logging**          | Winston                          |
| **Containerization** | Docker Compose                   |

---

## Repository Structure

```text
mern-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Future Improvements

* QR-code based attendance system
* Email notifications for registrations and reminders
* Event analytics dashboard
* Image upload support for events
