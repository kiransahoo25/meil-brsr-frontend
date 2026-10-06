import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Suspense, lazy } from "react";
import AppShell from "./layouts/AppShell";
import RoleGuard from "./components/RoleGuard";

// Lazy-load all pages — they only download when first visited
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Collection = lazy(() => import("./pages/Collection"));
const Approvals = lazy(() => import("./pages/Approvals"));
const ESGReport = lazy(() => import("./pages/ESGReport"));
const SDGReport = lazy(() => import("./pages/SDGReport"));
const ConsolidatedReport = lazy(() => import("./pages/ConsolidatedReport"));
const Validation = lazy(() => import("./pages/Validation"));
const Audit = lazy(() => import("./pages/Audit"));
const LoginHistory = lazy(() => import("./pages/LoginHistory"));
const Archive = lazy(() => import("./pages/Archive"));
const Placeholder = lazy(() => import("./pages/Placeholder"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-green-500 animate-spin" />
        <div className="text-[13px] text-slate-500 font-medium">Loading…</div>
      </div>
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
                    <Validation />
                  </RoleGuard>
                }
              />
              <Route
                path="audit"
                element={
                  <RoleGuard path="/audit">
                    <Audit />
                  </RoleGuard>
                }
              />
              <Route
                path="login-history"
                element={
                  <RoleGuard path="/login-history">
                    <LoginHistory />
                  </RoleGuard>
                }
              />
              <Route
                path="archive"
                element={
                  <RoleGuard path="/archive">
                    <Archive />
                  </RoleGuard>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
