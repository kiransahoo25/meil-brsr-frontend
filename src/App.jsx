import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";
import Approvals from "./pages/Approvals";
import ESGReport from "./pages/ESGReport";
import SDGReport from "./pages/SDGReport";
import Validation from "./pages/Validation";
import Audit from "./pages/Audit";
import AppShell from "./layouts/AppShell";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="collection" element={<Collection />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="esg-report" element={<ESGReport />} />
            <Route path="sdg-report" element={<SDGReport />} />
            <Route path="validation" element={<Validation />} />
            <Route path="audit" element={<Audit />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
