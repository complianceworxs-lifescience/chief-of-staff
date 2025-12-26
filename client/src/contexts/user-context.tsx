import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "strategic_architect" | "qa_lead" | "operator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
}

interface UserContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  hasPermission: (permission: Permission) => boolean;
  availableRoles: { value: UserRole; label: string; description: string }[];
}

type Permission = 
  | "view_dashboard"
  | "upload_sop"
  | "request_review"
  | "approve_gap"
  | "mark_compliant"
  | "export_audit_log"
  | "manage_users"
  | "override_recommendation"
  | "simulate_audit"
  | "edit_settings";

const rolePermissions: Record<UserRole, Permission[]> = {
  strategic_architect: [
    "view_dashboard",
    "upload_sop",
    "request_review",
    "approve_gap",
    "mark_compliant",
    "export_audit_log",
    "manage_users",
    "override_recommendation",
    "simulate_audit",
    "edit_settings"
  ],
  qa_lead: [
    "view_dashboard",
    "upload_sop",
    "request_review",
    "approve_gap",
    "mark_compliant",
    "export_audit_log",
    "override_recommendation",
    "simulate_audit"
  ],
  operator: [
    "view_dashboard",
    "upload_sop",
    "request_review",
    "simulate_audit"
  ]
};

const availableRoles: { value: UserRole; label: string; description: string }[] = [
  { value: "strategic_architect", label: "Strategic Architect", description: "Full Control - System administration and all permissions" },
  { value: "qa_lead", label: "QA Lead", description: "Review & Approve - Can approve gaps and export audit logs" },
  { value: "operator", label: "Operator", description: "View & Upload - Basic access for document submission" }
];

const defaultUser: User = {
  id: "user-001",
  name: "Demo User",
  email: "demo@complianceworxs.com",
  role: "strategic_architect",
  lastLogin: new Date().toISOString()
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);

  const hasPermission = (permission: Permission): boolean => {
    return rolePermissions[currentUser.role].includes(permission);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, hasPermission, availableRoles }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
