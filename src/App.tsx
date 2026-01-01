import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import HomePage from './pages/HomePage';
import UnifiedUploadPage from './pages/UnifiedUploadPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';
import MultiVideoProcessingPage from './pages/MultiVideoProcessingPage';
import MultiVideoResultsPage from './pages/MultiVideoResultsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import { useBackButton } from './hooks/useBackButton';

function App() {
  // Handle Android hardware back button
  useBackButton();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* OAuth Callback Routes */}
      <Route path="/auth/:provider/callback" element={<OAuthCallbackPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UnifiedUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/processing"
        element={
          <ProtectedRoute>
            <ProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:analysisId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      {/* Redirect old multi-upload route to unified upload page */}
      <Route
        path="/multi-upload"
        element={<Navigate to="/upload" replace />}
      />
      <Route
        path="/multi-processing"
        element={
          <ProtectedRoute>
            <MultiVideoProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/multi-results/:analysisId"
        element={
          <ProtectedRoute>
            <MultiVideoResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
