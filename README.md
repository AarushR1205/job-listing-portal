# Job Listing Portal

A comprehensive, full-stack MERN (MongoDB, Express, React, Node.js) application designed to connect employers with job seekers seamlessly. The platform features robust tools for job posting, application tracking, skill assessments, and AI-powered enhancements.

## Features

### For Employers
- **Job Management:** Post, edit, and manage job listings securely.
- **Skill Assessments:** Create dynamic quizzes and skill assessments for job applicants.
- **Applicant Tracking:** Review applications, score quizzes, and manage candidates seamlessly.
- **Automated Job Expiration:** Automatically expire and archive older job postings.
- **Real-time Notifications:** Real-time updates via Socket.IO.

### For Job Seekers
- **Job Discovery:** Browse and search for active job listings.
- **Skill Quizzes:** Take employer-provided skill assessments directly through the portal during the application process.
- **Interactive Board:** Real-time dashboard with vibrant UI, utilizing Framer Motion and Recharts for a dynamic experience.

### Advanced Capabilities (AI & Automation)
- **AI-Powered Capabilities:** Integrates Google's Generative AI for smart resume parsing or automated recommendations.
- **Secure Authentication:** Utilizes Firebase Authentication to provide both Email/Password and Google OAuth Sign-In options, syncing with custom MongoDB Role schemas.
- **Automated Scheduling:** Uses `node-cron` for scheduling tasks (like expiring jobs).
- **Email Communications:** Email notifications via `nodemailer`.
- **Resume Uploads:** Uses `pdf-parse` and `multer` for secure document processing.

## Tech Stack

### Frontend
- **React 18** (built with **Vite**)
- **Tailwind CSS** (for responsive, atomic styling)
- **Framer Motion** (for smooth animations and transitions)
- **Recharts** (for data visualization)
- **Axios** (for API requests)
- **React Router Dom** (for client-side routing)
- **Firebase JS SDK** (for client-side Identity & Authentication)
- **Socket.io-client** (for real-time capabilities)

### Backend
- **Node.js & Express.js** (Server footprint)
- **MongoDB** (with **Mongoose** for schema definition)
- **Firebase Admin SDK** (for authenticating secure Firebase ID tokens from the frontend)
- **Socket.IO** (for real-time, bi-directional communication)
- **Google Generative AI** (for intelligent application features)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas setup)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd job-listing-portal
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `backend` directory referencing necessary environment variables:*
   ```env
   PORT=5000
   MONGODB_URI='mongodb://localhost:27017/job_portal'
   GEMINI_API_KEY='Your_AI_Key'
   FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```
   *Create a `.env` file in the `frontend` directory referencing necessary environment variables:*
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   VITE_FIREBASE_MEASUREMENT_ID="..."
   ```

### Running the Application

Foreman or concurrent scripts can be used, but generally you can run both servers independently:

**Start Backend Development Server:**
```bash
cd backend
npm run dev
```

**Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```
The frontend application will be accessible at standard Vite ports (e.g., `http://localhost:5173`).

## License

This project is licensed under the ISC License.
