# pulseGuard — AI Preventive Health Companion

pulseGuard is an AI-powered preventive health platform that enables users to monitor their health in real time, detect early risk factors, and receive intelligent recommendations — all without requiring hospital visits or wearable devices.

The platform combines computer vision, predictive analytics, and virtual assistance to empower individuals to take proactive control of their health.

---

# Problem Statement

Preventive healthcare remains inaccessible and underutilized for many people. Individuals often avoid hospital visits due to inconvenience, long waiting times, inconsistent care experiences, or lack of immediate need. As a result, early warning signs such as poor posture, dehydration, and unhealthy lifestyle patterns go unnoticed.

These silent risk factors gradually lead to preventable chronic conditions such as musculoskeletal disorders, fatigue, obesity, and cardiovascular disease.

At the same time, existing health monitoring solutions are fragmented, passive, or require expensive wearable devices, making proactive health management inaccessible to many.

There is a critical need for an accessible, intelligent, and real-time preventive health companion that enables continuous monitoring, early risk detection, and actionable preventive guidance.

---

# Solution

pulseGuard provides a unified platform that combines:

- Remote health monitoring using computer vision and user input
- Predictive analytics to assess health risks
- An AI-powered virtual assistant that provides preventive recommendations

The system allows users to monitor posture, hydration, and lifestyle health indicators while receiving real-time feedback and personalized health guidance.

---

# Core Features (Implemented)

## 1. Real-Time Posture Monitoring ✅
- Uses MediaPipe Pose for skeletal detection
- Analyzes shoulder levelness, head posture, spine alignment, and neck tilt
- Calculates posture score (0-100)
- Real-time canvas visualization with skeleton overlay
- Live score display with color-coded feedback (green/amber/red)
- Session history tracking (last 20 scores)
- Pause/Resume camera controls
- Demo mode for testing without camera
- Backend sync with posture data

## 2. Health Risk Assessment ✅
- Collects user biometric data: age, weight, height, activity level
- Auto-calculates BMI with real-time display
- Evaluates health risk based on multiple factors
- Identifies specific health issues and preventive actions
- Session storage for form persistence
- Clear form functionality

## 3. AI-Powered Recommendations ✅
- Integrates with OpenAI API (ChatGPT)
- Generates personalized health recommendations
- Analyzes posture, BMI, activity level, and risk factors
- Provides actionable preventive guidance
- Displays risk level with color coding
- Comprehensive health analysis report

## 4. Unified Health Dashboard ✅
- Real-time posture score display with circular progress indicator
- Overall health score (composite of posture and risk)
- Health risk visualization
- Activity bars for key metrics
- Hydration and activity level tracking
- Animated stat cards with delayed entrance
- Live data updates as scores change
- BMI indicator with status labels

## 5. Navigation & User Interface ✅
- Sidebar navigation with three main views: Dashboard, Posture Monitor, Health Assessment
- Active view highlighting
- System status indicator (online/syncing)
- App branding (pulseGuard, Team Quantum Pulse)
- Responsive layout that fits viewport
- Dark theme with accent colors (green/amber/red)
- Smooth transitions and animations

---

# System Architecture
User
│
▼
Frontend (React Dashboard)
│
▼
Backend (Node.js API Server)
│
├── Posture Detection (MediaPipe + JavaScript)
├── Health Risk Calculator
├── Hydration Prediction
└── AI Assistant Integration

---

# Tech Stack

## Frontend
- React.js with Vite
- HTML, CSS, JavaScript
- MediaPipe Pose for real-time posture detection
- Drawing utilities for skeleton visualization

## Backend
- Node.js
- Express.js
- CORS support for cross-origin requests

## Computer Vision
- MediaPipe Pose
- Canvas API for real-time visualization
- Webcam integration with getUserMedia API

## AI Integration
- OpenAI API (ChatGPT)
- Google Gemini API

## External APIs
- Health recommendation APIs

---

# Repository Structure
pulseGuard/
│
├── OpenAiIntegration/ # Main application
│   ├── server.js # Node.js backend server
│   ├── package.json
│   ├── .env # Environment variables (API keys)
│   ├── healthData.json # Sample health data
│   ├── routes/ # API endpoints
│   │   ├── posture.js # Posture data endpoints
│   │   └── recommendations.js # Health recommendations
│   ├── services/ # Business logic
│   │   └── openaiService.js # AI service integration
│   ├── utils/ # Utility functions
│   │   ├── buildHealthData.js
│   │   └── healthCalculations.js
│   │
│   └── client/ # React frontend (Vite)
│       ├── src/
│       │   ├── App.jsx # Main app component
│       │   ├── main.jsx # Entry point
│       │   ├── App.css
│       │   ├── index.css
│       │   ├── assets/
│       │   └── components/
│       │       ├── Navigation.jsx # Sidebar navigation
│       │       ├── Dashboard.jsx # Health overview dashboard
│       │       ├── PostureDetector.jsx # Real-time posture monitoring
│       │       └── HealthAssesment.jsx # Health assessment form
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       └── eslint.config.js
│
├── utils/ # Project-level utilities
│   └── healthUtils.js
│
├── README.md
└── .gitignore

---

# How It Works

1. **User navigates** to the dashboard or selects a view from the sidebar
2. **Posture Monitor view**: 
   - User grants camera permission
   - MediaPipe Pose analyzes skeletal landmarks in real-time
   - System calculates posture score based on alignment metrics
   - Score displays with live feedback and issue alerts
   - User can pause/resume camera or run demo mode
3. **Health Assessment view**:
   - User enters biometric data (age, weight, height, activity level)
   - System auto-calculates BMI
   - Form data persists in session storage
4. **AI Analysis**:
   - User clicks "Generate Recommendations"
   - System sends data to OpenAI API
   - AI generates personalized health analysis
   - Results display with risk assessment and actionable advice
5. **Dashboard view**:
   - Displays overall health score, posture data, and risk metrics
   - Shows real-time updates as new data arrives
   - Provides quick health overview

---

# Example Use Case

A user working long hours at a computer opens pulseGuard.

**Step 1: Posture Monitoring**
- Opens the Posture Monitor view
- Camera initializes and starts detecting posture
- System identifies: uneven shoulders, head forward posture
- Posture score: 62/100 (Fair)

**Step 2: Health Assessment**
- Navigates to Health Assessment view
- Enters: Age 28, Weight 75kg, Height 175cm, Activity: Sedentary
- BMI calculated: 24.5 (Normal weight)
- Clicks "Generate Recommendations"

**Step 3: AI Analysis**
- System analyzes all data via OpenAI API
- Generates comprehensive health assessment

**Step 4: Recommendations**
- System displays:
  - "Fair" posture with suggestions to improve alignment
  - Sedentary lifestyle risks and exercise recommendations
  - Hydration and break reminders
  - Preventive actions for long-term health

**Result**: User receives personalized, actionable health guidance without leaving home.

---

# Setup Instructions

## Prerequisites

- Node.js installed
- npm or yarn installed
- Modern web browser
- Webcam access

---

## Installation

Clone the repository:
https://github.com/Kwame-Michael361/pulseGuard.git

Navigate into project folder:
cd pulseGuard

---

## Backend Setup
```bash
cd OpenAiIntegration
npm install
node server.js
```
Server runs on `http://localhost:5000`

---

## Frontend Setup
```bash
cd OpenAiIntegration/client
npm install
npm run dev
```
Frontend runs on `http://localhost:5174`

---

## Environment Variables
Create a `.env` file in `OpenAiIntegration/` with:
```
PORT=5000
OPENAI_API_KEY=your_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

# Team (Team Quantum Pulse)

## Full-Stack Development
- **Frontend**: React.js with Vite, responsive UI design, real-time data visualization
- **Computer Vision**: MediaPipe Pose integration, skeletal detection, posture analysis algorithm
- **Backend**: Express.js API server, CORS configuration, data persistence
- **AI Integration**: OpenAI API integration, health recommendation engine, data analysis
- **Deployment**: Environment configuration, error handling, session management

---

# Current Status

✅ **MVP Complete** - Core features fully implemented and functional
- All major components integrated and working
- Real-time posture detection operational
- AI recommendations functional
- Dashboard displaying real-time data
- Session storage and persistence working

# Future Improvements

- Mobile application support (React Native)
- Integration with wearable devices (Apple Watch, Fitbit)
- Advanced predictive health models (machine learning)
- Long-term health tracking and analytics
- Clinical integration with healthcare providers
- Voice-activated health assistant
- Push notifications for health alerts
- Export health reports as PDF
- Multi-user account support
- Offline mode with data syncing

---

# Impact

pulseGuard empowers individuals to take control of their health by enabling early detection of preventable health risks, reducing dependence on reactive healthcare, and promoting proactive wellness.

---

# Troubleshooting

## Camera Not Working
- Ensure you've granted camera permissions in browser settings
- Check that no other app is using the camera
- Try the Demo Mode to test without camera

## CORS Errors
- Ensure backend server is running on port 5000
- Check that CORS is properly configured in server.js
- Restart both frontend and backend servers

## Form Data Not Persisting
- Check browser's sessionStorage is enabled
- Clear browser cache and try again
- Ensure you're not in private/incognito mode

## API Errors
- Verify API keys are correctly set in .env file
- Check internet connection
- Ensure API rate limits haven't been exceeded

---


