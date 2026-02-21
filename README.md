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

# Core Features

## 1. Real-Time Posture Monitoring
- Uses MediaPipe and computer vision through the webcam
- Detects posture alignment
- Calculates posture score
- Alerts users when poor posture is detected

## 2. Hydration Risk Prediction
- Calculates daily hydration requirements
- Uses weather data and personal metrics
- Detects dehydration risk
- Provides reminders and recommendations

## 3. Health Risk Calculator
- Calculates BMI using user inputs
- Evaluates overall health risk score
- Identifies potential lifestyle-related health risks

## 4. AI Virtual Health Assistant
- Provides real-time preventive health advice
- Explains user health status
- Suggests corrective actions and lifestyle improvements

## 5. Unified Health Dashboard
- Displays posture score
- Displays hydration status
- Displays health risk score
- Provides centralized health monitoring interface

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
- React.js
- HTML, CSS, JavaScript

## Backend
- Node.js
- Express.js

## Computer Vision
- MediaPipe
- JavaScript
- Webcam integration

## AI Integration
- OpenAI API

## External APIs
- OpenWeather API (hydration and heat risk prediction)

---

# Repository Structure
pulseGuard-platform/
│
├── frontend/ # React dashboard
│
├── backend/ # Node.js server and APIs
│
├── posture-service/ # MediaPipe posture detection logic
│
├── ai-assistant/ # AI assistant integration
│
└── README.md

---

# How It Works

1. User opens the dashboard
2. Webcam monitors posture in real time
3. User enters basic health information
4. System calculates hydration and health risk scores
5. AI assistant analyzes health data
6. User receives preventive recommendations

---

# Example Use Case

A user working long hours at a computer opens pulseGuard.

The system detects:
- Poor posture
- Low hydration level
- Moderate health risk score

The AI assistant responds:

"Your posture has been poor for extended periods and your hydration level is below recommended levels. Consider drinking 500ml of water and taking a short stretch break to reduce musculoskeletal strain."

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
cd backend
npm install
npm start


---

## Frontend Setup
cd frontend
npm install
npm start

---

# Hackathon Team Roles

## Developer 1 — Frontend
- Built React dashboard
- Designed UI and user experience
- Integrated chatbot interface

## Developer 2 — Computer Vision
- Implemented posture detection using MediaPipe
- Built real-time posture monitoring system

## Developer 3 — Backend
- Developed Node.js server
- Implemented health risk and hydration logic
- Created API endpoints

## Developer 4 — AI Integration
- Integrated OpenAI API
- Built virtual health assistant logic

---

# Future Improvements

- Mobile application support
- Integration with wearable devices
- Advanced predictive health models
- Long-term health tracking and analytics
- Clinical integration with healthcare providers

---

# Impact

pulseGuard empowers individuals to take control of their health by enabling early detection of preventable health risks, reducing dependence on reactive healthcare, and promoting proactive wellness.
---


