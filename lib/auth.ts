// Authentication utilities and state management

import { useGlobalContext } from "@/hooks/useUser";
import { useSession } from "next-auth/react";

export interface User {
  email: string;
  name: string;
  userId: string;
  role: "admin" | "developer" | "viewer";
  tier: "free" | "pro" | "enterprise";
}

export const mockUser: User = {
  email: "admin@example.com",
  name: "Admin User",
  userId: "user-123",
  role: "admin",
  tier: "pro",
};




export function getCurrentUser(): User | null {
  const {user}= useGlobalContext();

  if (typeof window === "undefined") return null;
  if (user.email) {
    return { ...user };
  }
  return null;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("rememberMe");
  window.location.href = "/login";
}
