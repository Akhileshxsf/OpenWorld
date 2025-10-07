import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import AuthPage from "./pages/HomePage/AuthPage/AuthPage";
import PageLayout from "./Layouts/PageLayout/PageLayout";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import MessageTab from "./components/Profile/MessageTab";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import ChatbotPage from "./pages/ChatbotPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebase";

function App() {
  const [authUser] = useAuthState(auth);

  return (
    <PageLayout>
      <Routes>
        {/* Root path */}
        <Route
          path="/"
          element={!authUser ? <LandingPage /> : <Navigate to="/home" replace />}
        />
        
        {/* Home page */}
        <Route
          path="/home"
          element={authUser ? <HomePage /> : <Navigate to="/" replace />}
        />
        
        {/* Auth page */}
        <Route
          path="/auth"
          element={!authUser ? <AuthPage /> : <Navigate to="/home" replace />}
        />
        
        {/* Profile page */}
        <Route path="/:username" element={<ProfilePage />} />
        
        {/* Chatbot page */}
        <Route
          path="/chatbot"
          element={authUser ? <ChatbotPage /> : <Navigate to="/" replace />}
        />
        
        {/* Messages page - FIXED ROUTE */}
        <Route
          path="/messages"
          element={authUser ? <MessageTab /> : <Navigate to="/" replace />}
        />
        
        {/* Notifications page - FIXED ROUTE */}
        <Route
          path="/notification"
          element={authUser ? <NotificationsPage /> : <Navigate to="/" replace />}
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
  );
}

export default App;