import { Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import ResumeUploadPage from "./pages/ResumeUploadPage/ResumeUploadPage";
import HirePage from "./pages/HirePage/HirePage";

/** OpenWorldX product: marketing site, hire portal, candidate resume upload. */
export function openWorldRoutes({ authUser, Navigate }) {
  return (
    <>
      <Route path="/" element={!authUser ? <LandingPage /> : <Navigate to="/home" replace />} />
      <Route path="/upload-resume" element={<ResumeUploadPage />} />
      <Route path="/hire" element={<HirePage />} />
    </>
  );
}
