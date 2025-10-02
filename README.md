# 🎯 AI-Powered Interview Assistant

A comprehensive React application that conducts AI-powered technical interviews with resume parsing, timed questions, and candidate evaluation.

## 🚀 Live Demo
Check it here - https://ai-powered-interview-assessment-swi.vercel.app/

## 📋 Project Overview

This application provides a complete interview solution with two main interfaces:
- **Interviewee Tab**: Chat-based interview interface with resume upload and AI-powered questioning
- **Interviewer Tab**: Dashboard to review candidate performance and interview results

## 🎯 Core Features Implemented

### ✅ Resume Processing & Profile Completion
- **PDF/DOCX Resume Upload** with automatic parsing using pdf.js and mammoth
- **Smart Field Extraction** (Name, Email, Phone) from resume content
- **AI Chatbot Assistant** that collects missing information through conversational interface
- **Form Validation** with real-time feedback and error handling

### ✅ Intelligent Interview System
- **6-Question Interview Flow** (2 Easy → 2 Medium → 2 Hard)
- **Timed Questions** with auto-submission (20s/60s/120s per difficulty)
- **AI-Powered Scoring** with detailed feedback for each answer
- **Progress Tracking** with visual indicators and completion status

### ✅ Candidate Management
- **Interviewer Dashboard** with search, sort, and filter capabilities
- **Detailed Candidate Profiles** showing full interview history
- **Performance Analytics** with scores, strengths, and improvement areas
- **Data Management** with delete individual/all candidates functionality

### ✅ Persistence & Recovery
- **Local Storage Integration** using Redux with automatic state persistence
- **Welcome Back Modal** for interrupted interviews with resume capability
- **Session Recovery** maintains progress across browser refreshes
- **State Management** with comprehensive Redux implementation

### ✅ User Experience
- **Responsive Design** using Ant Design components
- **Real-time Updates** between interviewer and interviewee tabs
- **Error Handling** with user-friendly messages and fallbacks
- **Loading States** and progress indicators throughout the application

## 🛠️ Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **Redux** for state management with localStorage persistence
- **Ant Design** for UI components and styling
- **Context API** for global state management

### File Processing
- **pdf.js** for PDF resume parsing
- **mammoth.js** for DOCX resume parsing
- **File validation** with size and type checking

### AI Integration
- **Hugging Face Inference API** for conversational AI
- **Rule-based fallback system** for reliable performance
- **Multiple model support** with automatic failover

### Development Tools
- **JavaScript ES6+** with modern syntax
- **CSS3** with responsive design principles
- **Local Storage** for data persistence
- **Console logging** for debugging and monitoring

## 📁 Project Structure
src/
├── components/
│ ├── IntervieweeTab.js # Main interview interface
│ ├── InterviewerTab.js # Candidate dashboard
│ ├── ResumeUpload.js # Resume upload with chatbot
│ ├── WelcomeBackModal.js # Interview recovery modal
│ └── ChatInterface.js # Question/answer interface
├── context/
│ └── AppContext.js # Redux-like state management
├── utils/
│ ├── aiService.js # Question generation & scoring
│ ├── resumeParser.js # PDF/DOCX parsing logic
│ └── chatbotService.js # AI conversation handling
├── App.js # Main application component
└── index.js # Application entry point

text

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-interview-assistant.git
   cd ai-interview-assistant
Install dependencies

bash
npm install
Configure API keys (optional)

Get free Hugging Face API key from https://huggingface.co/settings/tokens

Update chatbotService.js with your API key

Start development server

bash
npm start
Build for production

bash
npm run build
🎮 How to Use
For Candidates (Interviewee Tab)
Upload Resume: Upload PDF/DOCX resume file

Complete Profile: Chatbot assists with missing information

Start Interview: Answer 6 timed technical questions

View Results: Receive AI-generated score and feedback

For Interviewers (Interviewer Tab)
View Candidates: See all completed interviews

Search & Filter: Find candidates by name, score, or status

Review Details: Click any candidate to see full interview transcript

Manage Data: Delete individual or all candidates as needed

🔄 State Management
The application uses a custom Redux-like implementation:

javascript
// Key State Structure
{
  candidates: [],           // All completed candidates
  currentCandidate: null,   // Active candidate
  interview: {
    questions: [],          // Generated questions
    answers: [],           // Candidate answers with scores
    currentQuestion: null, // Active question
    interviewProgress: '', // 'not-started'|'ready-to-start'|'in-progress'|'completed'
    showWelcomeBack: false,// Modal visibility
    welcomeBackShown: false // Prevent repeated modals
  }
}
🎯 Key Implementation Details
Resume Parsing
Extracts text from PDF/DOCX files using specialized libraries

Uses regex patterns to identify name, email, and phone numbers

Provides fallback to manual entry with chatbot assistance

Interview Flow
Generates 6 questions with increasing difficulty

Implements countdown timers for each question

Auto-submits answers when time expires

Calculates comprehensive scores with AI feedback

Persistence Strategy
Automatic saving to localStorage on every state change

Recovery of incomplete interviews with Welcome Back modal

Data integrity checks with fallback to initial state

Error Handling
Graceful API failure handling with multiple fallbacks

User-friendly error messages for file upload issues

Robust state validation and recovery mechanisms

🚀 Deployment
The application is ready for deployment on:

Vercel: vercel --prod

Netlify: Drag and drop build folder

Any static hosting: Serve the build folder

📝 Future Enhancements
Real AI API integration for dynamic question generation

Video interview recording capabilities

Advanced analytics and reporting

Multi-language support

Export functionality for interview results

📄 License
This project is created for the Swipe Internship Assignment.

## **GitHub Repository Description**
🎯 AI-Powered Interview Assistant - React App with Resume Parsing & Timed Interviews

A comprehensive interview platform featuring:
• PDF/DOCX resume parsing with smart field extraction
• AI chatbot for collecting missing candidate information
• 6-question timed interview (2 Easy → 2 Medium → 2 Hard)
• Real-time scoring with detailed feedback
• Interviewer dashboard with candidate management
• Local storage persistence & session recovery
• Welcome Back modal for interrupted interviews

Built with React, Redux, Ant Design, and Hugging Face AI APIs.

## **Key Highlights to Emphasize for Swipe Team:**

### 🎯 **What Makes This Implementation Stand Out:**

1. **Complete Feature Implementation**: All core requirements implemented plus extra features
2. **Robust Error Handling**: Multiple fallback systems and graceful degradation
3. **Excellent User Experience**: Smooth flows, helpful chatbot, intuitive interface
4. **Production-Ready Code**: Proper state management, persistence, and error handling
5. **Smart Resume Processing**: Real PDF/DOCX parsing with intelligent field extraction
6. **Interview Recovery**: Welcome Back modal that actually works without being annoying

### 🔧 **Technical Excellence:**
- Custom Redux implementation with localStorage persistence
- Multiple AI API fallbacks for reliability
- Comprehensive state management for complex interview flows
- Responsive design with professional UI/UX
- Clean, maintainable code structure
