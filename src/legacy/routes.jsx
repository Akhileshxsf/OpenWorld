import { Route } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import AuthPage from "./pages/HomePage/AuthPage/AuthPage";
import DashboardPage from "./pages/HomePage/DashboardPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import ChatbotPage from "./pages/ChatbotPage";
import MessageTab from "../components/Profile/MessageTab";

/** Original OpenWorld “time seller” social app (feed, profiles, dashboard). */
export function legacyRoutes({ authUser, Navigate }) {
  return (
    <>
      <Route path="/home" element={authUser ? <HomePage /> : <Navigate to="/" replace />} />
      <Route path="/dashboard" element={authUser ? <DashboardPage /> : <Navigate to="/" replace />} />
      <Route path="/auth" element={!authUser ? <AuthPage /> : <Navigate to="/home" replace />} />
      <Route path="/:username" element={<ProfilePage />} />
      <Route path="/chatbot" element={authUser ? <ChatbotPage /> : <Navigate to="/" replace />} />
      <Route path="/messages" element={authUser ? <MessageTab /> : <Navigate to="/" replace />} />
      <Route path="/messages/:chatId" element={authUser ? <MessageTab /> : <Navigate to="/" replace />} />
      <Route path="/notification" element={authUser ? <NotificationsPage /> : <Navigate to="/" replace />} />
    </>
  );
}
