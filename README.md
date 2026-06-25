# MERN Stack Application

This is a MERN stack application that consists of a Node.js backend and a React frontend. The application is designed to demonstrate a simple authentication system.

## Project Structure

```
mern-app
├── backend
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── config
│   │   └── db.js
│   ├── controllers
│   │   └── authController.js
│   ├── models
│   │   └── User.js
│   ├── routes
│   │   └── authRoutes.js
│   ├── middleware
│   │   └── auth.js
│   └── utils
│       └── logger.js
├── frontend
│   ├── package.json
│   ├── .env
│   ├── public
│   │   └── index.html
│   └── src
│       ├── index.js
│       ├── App.js
│       ├── api
│       │   └── api.js
│       ├── components
│       │   └── Header.js
│       ├── pages
│       │   └── Home.js
│       ├── hooks
│       │   └── useAuth.js
│       └── styles
│           └── main.css
├── .gitignore
├── docker-compose.yml
├── README.md
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or cloud instance)
- Docker (optional, for running with Docker)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd mern-app
   ```

2. Navigate to the backend directory and install dependencies:

   ```
   cd backend
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` and fill in the required values.

4. Navigate to the frontend directory and install dependencies:

   ```
   cd ../frontend
   npm install
   ```

5. Set up environment variables for the frontend:

   - Create a `.env` file and specify the API endpoint.

### Running the Application

#### Backend

1. Start the backend server:

   ```
   cd backend
   npm start
   ```

#### Frontend

1. Start the frontend application:

   ```
   cd frontend
   npm start
   ```

### Docker Setup

To run the application using Docker, you can use the provided `docker-compose.yml` file. Make sure Docker is installed and running, then execute:

```
docker-compose up
```

### Usage

- Access the frontend application at `http://localhost:3000`.
- The backend API will be available at `http://localhost:5000/api`.

### Contributing

Feel free to submit issues or pull requests for any improvements or bug fixes.

### License

This project is licensed under the MIT License.