# Quiz App

A modern, feature-rich quiz application built with Vue 3, TypeScript, and Firebase. This application provides an interactive learning experience with gamification elements, real-time analytics, and comprehensive admin tools.

## 🌟 Features

### For Users
- **Interactive Quiz Taking**: Take quizzes with multiple question types (multiple-choice, multiple-answer, short-text)
- **Real-time Scoring**: Get immediate feedback with detailed explanations
- **Gamification System**: Earn XP, unlock badges, and maintain streaks
- **Leaderboard**: Compete with other users and see your ranking
- **User Profile**: Track your progress, badges, and quiz history
- **Email Verification**: Secure account creation with email verification
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### For Administrators
- **Quiz Management**: Create, edit, delete, and preview quizzes
- **Question Builder**: Support for multiple question types with explanations
- **Analytics Dashboard**: Comprehensive insights into quiz performance
- **User Management**: Invite users, manage roles, and view user statistics
- **Data Export**: Export quizzes and analytics data
- **Real-time Monitoring**: Track quiz attempts, scores, and user engagement

### Technical Features
- **Real-time Updates**: Live leaderboard and analytics updates
- **Cross-tab Synchronization**: Seamless experience across multiple browser tabs
- **Progressive Scoring**: Partial credit for multiple-answer questions
- **Timer Support**: Optional time limits for quizzes
- **Dark Mode**: Full dark mode support throughout the application
- **TypeScript**: Full type safety and better development experience

## 🚀 Live Demo

**Live Demo**: [https://quiz-app-pkrl.onrender.com/leaderboard](https://quiz-app-pkrl.onrender.com/leaderboard)

> **Disclaimer**: This app is hosted on Render's free tier. Free web services on Render spin down after 15 minutes of inactivity and may take up to a minute to start up again when you visit the site. If the app takes a while to load, please be patient while the server wakes up. This is expected behavior for free-tier deployments.

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Backend**: Firebase (Authentication, Firestore)
- **Build Tool**: Vite
- **Testing**: Vitest with Vue Test Utils
- **Charts**: Chart.js with vue-chartjs
- **PDF Generation**: jsPDF
- **Validation**: Vuelidate
- **Notifications**: Vue Toastification

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/maksimKV/quiz-app.git
   cd quiz-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Set up security rules for Firestore
   - Add your Firebase configuration to the environment variables

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Quick Start with Sample Data

To get started quickly with sample quizzes, you can import the provided quiz data:

1. Navigate to the Admin Panel (`/admin`)
2. Click "Import Quizzes"
3. Select the file: `public/quizzes/quizzes.json`
4. The sample quizzes will be imported and ready to use

## 📁 Project Structure

```
quiz-app/
├── src/
│   ├── components/          # Vue components
│   │   ├── AdminAnalyticsModal.vue
│   │   ├── AdminLeaderboardModal.vue
│   │   ├── AdminQuestionBuilder.vue
│   │   ├── AdminQuizForm.vue
│   │   ├── AdminQuizList.vue
│   │   ├── AdminUserManagementModal.vue
│   │   ├── LoginForm.vue
│   │   ├── QuizList.vue
│   │   ├── QuizPlayerView.vue
│   │   ├── RegisterForm.vue
│   │   ├── UserProfile.vue
│   │   └── UserResults.vue
│   ├── composables/         # Vue composables
│   │   ├── useAuth.ts
│   │   ├── useGamification.ts
│   │   ├── useQuestionValidation.ts
│   │   ├── useQuizAnalytics.ts
│   │   ├── useQuizScoring.ts
│   │   └── useQuizTimer.ts
│   ├── services/            # API services
│   │   ├── quizService.ts
│   │   ├── userResultService.ts
│   │   └── userService.ts
│   ├── store/               # Pinia stores
│   │   ├── auth.ts
│   │   ├── index.ts
│   │   ├── quiz.ts
│   │   └── userResult.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── quiz.ts
│   │   ├── user.ts
│   │   └── userResult.ts
│   ├── views/               # Page components
│   │   ├── AdminPanel.vue
│   │   ├── Analytics.vue
│   │   ├── Leaderboard.vue
│   │   ├── QuizPlayer.vue
│   │   ├── UserManagement.vue
│   │   ├── Verified.vue
│   │   └── VerifyEmail.vue
│   ├── router/              # Vue Router configuration
│   ├── utils/               # Utility functions
│   ├── App.vue              # Root component
│   ├── main.ts              # Application entry point
│   └── firebase.ts          # Firebase configuration
├── public/                  # Static assets
│   └── quizzes/
│       └── quizzes.json     # Sample quiz data
├── admin-api/               # Admin API utilities
└── tests/                   # Test files
```

## 🎮 Usage

### For Regular Users

1. **Registration & Login**
   - Register with email and password
   - Verify your email address
   - Log in to access all features

2. **Taking Quizzes**
   - Browse available quizzes from the Quiz Player page
   - Click "Start" to begin a quiz
   - Answer questions (multiple-choice, multiple-answer, or short-text)
   - Submit to see your results and explanations

3. **Tracking Progress**
   - View your quiz history and scores
   - Check your XP, badges, and streaks
   - See your ranking on the leaderboard

### For Administrators

1. **Quiz Management**
   - Access the Admin Panel
   - Create new quizzes with the question builder
   - Edit existing quizzes
   - Preview quizzes before publishing
   - Import/export quiz data

2. **Analytics**
   - View comprehensive quiz analytics
   - Track user engagement and performance
   - Export analytics data as PDF
   - Monitor question difficulty and success rates

3. **User Management**
   - Invite new users
   - Manage user roles (admin/regular)
   - View user statistics and activity

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

## 📊 Question Types

The application supports three types of questions:

1. **Multiple Choice**: Single correct answer from multiple options
2. **Multiple Answer**: Multiple correct answers from a list of options
3. **Short Text**: Text input with exact match scoring

## 🏆 Gamification System

- **XP System**: Earn 10 XP per correct answer + 50 XP for quiz completion
- **Levels**: Level up every 1000 XP
- **Badges**: Unlock badges for achievements (First Quiz, Quiz Master, Streak Starter, Dedicated)
- **Streaks**: Maintain daily quiz streaks for bonus rewards

## 🔒 Security Features

- Email verification required for all users
- Role-based access control (admin/regular users)
- Firebase Authentication integration
- Secure Firestore rules
- Cross-tab authentication synchronization

## 🚀 Deployment

### Render (Recommended)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- Vercel
- Firebase Hosting
- GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Maksim Kanev**
- GitHub: [@maksimKV](https://github.com/maksimKV)
- Repository: [https://github.com/maksimKV/quiz-app](https://github.com/maksimKV/quiz-app)

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Firebase for the robust backend services
- Tailwind CSS for the beautiful styling system
- All contributors and users of this application

---

**Note**: This application is actively maintained and regularly updated with new features and improvements. For the latest updates, please check the repository regularly.
