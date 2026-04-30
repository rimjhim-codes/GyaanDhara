import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import VoiceAssistant from './components/VoiceAssistant';
import Dashboard from './pages/Dashboard';
import TopicSetup from './pages/TopicSetup';
import LearningView from './pages/LearningView';
import QuizView from './pages/QuizView';
import AssignmentsView from './pages/AssignmentsView';
import SmartNotesView from './pages/SmartNotesView';
import FocusMode from './pages/FocusMode';
import AuthPage from './pages/AuthPage';
import DevicesPage from './pages/DevicesPage';

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  return isLoggedIn ? element : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ProgressProvider>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isLoggedIn && <Navbar />}
      <main style={{ flex: 1, padding: isLoggedIn ? '2rem 0' : 0 }}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/setup" element={<ProtectedRoute element={<TopicSetup />} />} />
          <Route path="/learn/:topicId/:subtopicId" element={<ProtectedRoute element={<LearningView />} />} />
          <Route path="/quiz/:topicId/:subtopicId" element={<ProtectedRoute element={<QuizView />} />} />
          <Route path="/assignment/:topicId/:subtopicId" element={<ProtectedRoute element={<AssignmentsView />} />} />
          <Route path="/notes/:topicId/:subtopicId" element={<ProtectedRoute element={<SmartNotesView />} />} />
          <Route path="/devices" element={<ProtectedRoute element={<DevicesPage />} />} />
        </Routes>
      </main>
      {isLoggedIn && <VoiceAssistant />}
    </div>
  );
}

export default App;
