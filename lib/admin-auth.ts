// Role-based admin authentication
// Superuser (superadmin): Full access - can manage everything including workers
// Admin: Limited admin access - can manage products, orders, tasks but NOT workers
// Workers: Limited access (view/edit only, no create/delete)

export type UserRole = "superuser" | "admin" | "worker";

export interface AdminUser {
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

// Admin users database
// In production, use proper database with hashed passwords
export const ADMIN_USERS: AdminUser[] = [
  {
    username: "admin",
    password: process.env.SUPERUSER_PASSWORD || "admin2024",
    role: "superuser",
    name: "Super Admin",
  },
  {
    username: "worker1",
    password: process.env.WORKER1_PASSWORD || "worker2024",
    role: "worker",
    name: "Worker 1",
  },
  {
    username: "worker2",
    password: process.env.WORKER2_PASSWORD || "worker2024",
    role: "worker",
    name: "Worker 2",
  },
  {
    username: "worker3",
    password: process.env.WORKER3_PASSWORD || "worker2024",
    role: "worker",
    name: "Worker 3",
  },
];

export interface AdminSession {
  username: string;
  role: UserRole;
  name: string;
}

export function verifyAdminCredentials(
  username: string,
  password: string
): AdminUser | null {
  const user = ADMIN_USERS.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

export function setAdminSession(user: AdminUser) {
  if (typeof window !== "undefined") {
    const session: AdminSession = {
      username: user.username,
      role: user.role,
      name: user.name,
    };
    sessionStorage.setItem("admin_session", JSON.stringify(session));
  }
}

export function clearAdminSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("admin_session");
    // Also clear localStorage for AuthProvider compatibility
    localStorage.removeItem("va_admin_session_local");
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window !== "undefined") {
    // First try sessionStorage (used by admin-auth.ts)
    let sessionStr = sessionStorage.getItem("admin_session");
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr) as AdminSession;
      } catch {
        // If parsing fails, try localStorage
      }
    }
    
    // Fallback to localStorage (used by AuthProvider)
    sessionStr = localStorage.getItem("va_admin_session_local");
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr) as { username: string; role: string; name?: string };
        return {
          username: parsed.username,
          role: parsed.role as UserRole,
          name: parsed.name || "",
        };
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

export function getCurrentUserRole(): UserRole | null {
  const session = getAdminSession();
  return session?.role || null;
}

export function isSuperUser(): boolean {
  return getCurrentUserRole() === "superuser";
}

export function isAdmin(): boolean {
  const role = getCurrentUserRole();
  return role === "admin" || role === "superuser";
}

export function isSuperAdmin(): boolean {
  return getCurrentUserRole() === "superuser";
}

export function canManageWorkers(): boolean {
  // Only superadmin can manage workers
  return isSuperAdmin();
}

export function canCreateProduct(): boolean {
  // Both superuser and admin can create products
  return isAdmin();
}

export function canDeleteProduct(): boolean {
  // Both superuser and admin can delete products
  return isAdmin();
}

export function canEditProduct(): boolean {
  // Superuser, admin, and workers can edit
  return isAdminAuthenticated();
}

export function canViewProducts(): boolean {
  // Superuser, admin, and workers can view
  return isAdminAuthenticated();
}

