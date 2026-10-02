import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import Collection from "./pages/Collection";
import Approvals from "./pages/Approvals";
import ESGReport from "./pages/ESGReport";
import SDGReport from "./pages/SDGReport";
import ConsolidatedReport from "./pages/ConsolidatedReport";
import RoleGuard from "./components/RoleGuard";
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
            <Route
              path="collection"
              element={
                <RoleGuard path="/collection">
                  <Collection />
                </RoleGuard>
              }
            />
            <Route
              path="approvals"
              element={
                <RoleGuard path="/approvals">
                  <Approvals />
                </RoleGuard>
              }
            />
            <Route
              path="esg-report"
              element={
                <RoleGuard path="/esg-report">
                  <ESGReport />
                </RoleGuard>
              }
            />
            <Route
              path="sdg-report"
              element={
                <RoleGuard path="/sdg-report">
                  <SDGReport />
                </RoleGuard>
              }
            />
            <Route
              path="consolidated"
              element={
                <RoleGuard path="/consolidated">
                  <ConsolidatedReport />
                </RoleGuard>
              }
            />
            <Route
              path="validation"
              element={
                <RoleGuard path="/validation">
                  <Placeholder title="Validation Center" />
                </RoleGuard>
              }
            />
            <Route
              path="audit"
              element={
                <RoleGuard path="/audit">
                  <Placeholder title="Audit Trail" />
                </RoleGuard>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
