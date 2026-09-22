# GreenCare - Virtual Plant Care Journal & Assistant

A comprehensive plant care management application that helps users track their plants, care schedules, health status, and gardening activities.

## 🌱 Overview

GreenCare is a full-stack application designed to help plant enthusiasts manage their plant collections with features for tracking care schedules, monitoring plant health, maintaining journals, and accessing plant libraries.

## 🏗️ Project Structure

```
GreenCare/
├── client/              # React + Vite frontend application
├── backend/             # Node.js/Express/MySQL API
├── documentation/       # Project documentation and walkthroughs
├── prototype/           # Original HTML/CSS/JS prototype
└── README.md
```

### Frontend (client/)
- Built with React + Vite
- Uses Vertical Slice Architecture (VSA)
- Features React Compiler optimization
- Implements all 11 pages from the original prototype
- Responsive design with dark/light theme support

### Backend (backend/)
- Node.js with Express framework
- MySQL database integration
- RESTful API endpoints
- Environment configuration with dotenv
- Development server with nodemon

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

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- MySQL database
- npm or yarn package manager

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example (if provided) and configure:
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

## 📚 Documentation

- [Walkthrough Documentation](documentation/walkthrough.md) - Detailed implementation summary
- [GreenCare.pdf](documentation/GreenCare.pdf) - Additional project documentation

## 🏗️ Architecture

The frontend follows Vertical Slice Architecture (VSA) organizing code by feature:

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

## 📱 Screenshots

*(No screenshot yet)*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [backend/package.json](backend/package.json) for details.

## 🙏 Acknowledgments

- Built with React + Vite
- Uses MySQL for data persistence
- Inspired by plant care enthusiasts everywhere