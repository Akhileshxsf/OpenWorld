// src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import AuthPage from "./pages/HomePage/AuthPage/AuthPage";
import PageLayout from "./Layouts/PageLayout/PageLayout";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import MessageTab from "./components/Profile/MessageTab";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebase";

function App() {
  const [authUser] = useAuthState(auth);

  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!authUser ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/:username" element={<ProfilePage />} />
        <Route
          path="/chat/:receiverId"
          element={authUser ? <MessageTab /> : <Navigate to="/auth" />}
        />
        <Route
          path="/notification"
          element={authUser ? <NotificationsPage /> : <Navigate to="/auth" />}
        />
      </Routes>
    </PageLayout>
  );
}

export default App;