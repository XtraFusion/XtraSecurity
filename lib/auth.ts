// Authentication utilities and state management

export interface User {
  email: string
  name: string
  role: "admin" | "developer" | "viewer"
}

export const mockUser: User = {
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("isAuthenticated") === "true"
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const email = localStorage.getItem("userEmail")
  if (!email) return null

  // In a real app, fetch user data from API
  return { ...mockUser, email }
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("rememberMe")
  window.location.href = "/login"
}
