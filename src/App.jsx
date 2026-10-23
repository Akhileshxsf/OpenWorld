import { Navigate, Route, Routes } from "react-router-dom";
import PageLayout from "./Layouts/PageLayout/PageLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebase";
import { openWorldRoutes } from "./openworld/routes";
import { legacyRoutes } from "./legacy/routes";

function App() {
  const [authUser] = useAuthState(auth);
  const routeProps = { authUser, Navigate };

  return (
    <PageLayout>
      <Routes>
        {openWorldRoutes(routeProps)}
        {legacyRoutes(routeProps)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
  );
}

export default App;
