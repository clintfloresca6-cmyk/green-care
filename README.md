# GreenCare - Virtual Plant Care Journal & Assistant

A comprehensive plant care management application that helps users track their plants, care schedules, health status, and gardening activities.

## 🌱 Overview

GreenCare is a full-stack application designed to help plant enthusiasts manage their plant collections with features for tracking care schedules, monitoring plant health, maintaining journals, and accessing plant libraries.

## 🏗️ Project Structure

```
green-care/
├── client/              # React + Vite frontend application
├── server/             # Node.js/Express/MySQL API
├── documentation/       # Project documentation and walkthroughs
└── README.md
```

### Frontend (client/)
- Built with React + Vite
- Uses Vertical Slice Architecture (VSA)
- Features React Compiler optimization
- Implements all 11 pages from the original prototype
- Responsive design with dark/light theme support

### Backend (server/)
- Node.js with Express framework
- MySQL database integration
- RESTful API endpoints
- Environment configuration with dotenv
- Development server with nodemon
- Real-time capabilities (WebSocket preparation)

### Documentation
- Detailed flowcharts and architecture diagrams
- Database schema and seed data
- API documentation (in progress)

### Prototype
- Original proof-of-concept demonstrating UI/UX
- Pure HTML/CSS/JS implementation
- Reference for feature implementation

## 🧱 Architecture Principle: Vertical Slice Architecture

The frontend follows **Vertical Slice Architecture (VSA)** organizing code by feature rather than by file type. This groups all code related to a specific feature together, making the codebase easier to navigate and maintain.

```
client/src/
├── app/              # Application routing and configuration
├── data/             # Mock data and constants
├── features/         # Feature-specific modules (dashboard, plants, etc.)
├── shared/           # Shared components, contexts, layouts, and utilities
└── styles/           # Global styles and design system
```

Each feature in `src/features/` contains:
- Page components
- Feature-specific components
- Styles
- Any feature-specific utilities

## 🔄 Project Flows

The application follows these key flows:

### 1. Authentication Flow
1. User starts at login/signup page
2. Credentials validated against backend
3. Upon success, auth token stored
4. User role determines access (Admin or regular User)
5. Admin sees admin shell; regular user sees app shell

### 2. Main Navigation Flow
After authentication, users access:
- Dashboard (overview)
- My Plants (collection management)
- Plant Library (species browsing)
- Care Schedule (calendar view)
- Care Journal (activity timeline)
- Plant Health (monitoring)
- Reports (analytics)
- Notifications (alerts)
- Settings (preferences)
- Profile (account management)
- Admin panel (for admins only)

### 3. Feature Interaction Flows
Each feature follows similar patterns:
- View list/grid of items
- Filter/search capabilities
- Add/create new items
- Edit/update existing items
- Delete/archive items
- View detailed information

## 💾 Data Flow

Data moves through the following layers:

### 1. User Interaction → Frontend
- User interacts with UI components (buttons, forms, etc.)
- Frontend state updated via React hooks/context
- Optimistic UI updates for immediate feedback

### 2. Frontend → Backend API
- HTTP requests (GET, POST, PUT, DELETE) to RESTful endpoints
- Authentication via Bearer tokens in headers
- Request/response payloads in JSON format
- Validation on both client and server sides

### 3. Backend → Database
- Controller functions call service layer
- Services interact with MySQL database via raw SQL or ORM
- Transactions used for related operations
- Error handling and logging

### 4. Backend → Frontend
- Processed data returned as JSON responses
- Frontend updates state and re-renders components
- Real-time updates prepared via WebSocket infrastructure

### 5. Database Schema Overview
Key tables and relationships:
- **Users** (authentication, roles, settings)
- **Plants** (user's plants with care schedules)
- **Species** (global plant library reference)
- **Tasks** (care schedule items)
- **Journal Entries** (care activity log)
- **Notifications** (system alerts)
- **Health Issues** (reference for plant problems)

See `server/db/schema.sql` for complete schema with seed data.

## 🚀 Features

### Core Modules
- **Dashboard**: Overview of stats, today's tasks, attention list, activity feed, and upcoming schedule
- **My Plants**: Manage your plant collection with filtering, search, and grid view
- **Plant Detail**: Detailed view of individual plants with care info, water progress, task list, growth timeline, and journal
- **Plant Library**: Browse and search plant species with detailed information
- **Care Schedule**: Interactive calendar view of care tasks with filtering capabilities
- **Care Journal**: Timeline of plant care activities with photo support
- **Plant Health**: Health monitoring per plant with issue tracking and diagnosis
- **Reports**: Analytics including bar charts, task completion metrics, plant health trends, and timelines
- **Notifications**: Alert system with read/unread status management
- **Settings**: User preferences including theme selection, reminder times, and week start
- **Profile**: User profile management with avatar and contact information
- **Admin**: Administrative controls for species database, user reports, and notification templates

### Technical Highlights
- **Vertical Slice Architecture**: Organized by feature rather than file type
- **React Compiler**: Enabled for optimized rendering performance
- **Modular Components**: Reusable UI components (avatars, modals, task rows, toasts)
- **Global State Management**: Centralized context for application state
- **Responsive Design**: Mobile-friendly layouts
- **Dark/Light Themes**: User-selectable theme preferences
- **RESTful API**: Well-defined endpoints for all features
- **MySQL Integration**: Robust data persistence with proper relationships
- **Environment Configuration**: Secure setup with .env files
- **Error Handling**: Comprehensive error boundaries and validation

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- MySQL database
- npm or yarn package manager

### Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example and configure:
   - Database connection details
   - Server port
   - Any required API keys
4. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The application will be available at `http://localhost:5174` (or another port if 5174 is in use)

### Database Initialization
The server will automatically initialize the database on first run using the schema in `server/db/schema.sql`.

## 📚 Documentation
- [Database Schema](server/db/schema.sql) - Complete table definitions and seed data
- [GreenCare.pdf](documentation/GreenCare.pdf) - Additional project documentation

## 🙏 Acknowledgments

- Built with React + Vite
- Uses MySQL for data persistence
- Inspired by plant care enthusiasts everywhere
- Special thanks to the open-source community for libraries and tools

---
*Developed with attention to maintainability, scalability, and user experience.*