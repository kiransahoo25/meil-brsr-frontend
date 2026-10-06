import { useAuth } from "../context/AuthContext";

const RESTRICTED = {
  "/esg-report": ["unit-admin", "esg-officer", "group-admin"],
  "/sdg-report": ["unit-admin", "esg-officer", "group-admin"],
  "/consolidated": ["esg-officer", "group-admin"],
  "/validation": ["approver", "unit-admin", "esg-officer", "group-admin"],
  "/audit": ["unit-admin", "esg-officer", "group-admin"],
  "/approvals": ["approver", "unit-admin", "esg-officer", "group-admin"],
  "/collection": ["data-entry"],
  "/login-history": ["group-admin"],
  "/archive": ["unit-admin", "esg-officer", "group-admin"],
};

export default function RoleGuard({ path, children }) {
  const { user } = useAuth();
  const allowed = RESTRICTED[path];

  if (!allowed) return children;
  if (!user || !allowed.includes(user.role)) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          Your role ({user?.role}) doesn't have access to this page.
        </p>
      </div>
    );
  }
  return children;
}
