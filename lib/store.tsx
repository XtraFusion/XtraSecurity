"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "developer" | "viewer"
  avatar?: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  theme: "light" | "dark" | "system"
  notifications: {
    count: number
    items: Notification[]
  }
  loading: {
    auth: boolean
    profile: boolean
    teams: boolean
    projects: boolean
  }
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
  read: boolean
}

type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "SET_THEME"; payload: "light" | "dark" | "system" }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "SET_LOADING"; payload: { key: keyof AppState["loading"]; value: boolean } }

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: "system",
  notifications: {
    count: 0,
    items: [],
  },
  loading: {
    auth: false,
    profile: false,
    teams: false,
    projects: false,
  },
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      }
    case "SET_AUTHENTICATED":
      return {
        ...state,
        isAuthenticated: action.payload,
      }
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      }
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: {
          count: state.notifications.count + 1,
          items: [action.payload, ...state.notifications.items],
        },
      }
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          count: Math.max(0, state.notifications.count - 1),
          items: state.notifications.items.map((item) => (item.id === action.payload ? { ...item, read: true } : item)),
        },
      }
    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: {
          count: 0,
          items: [],
        },
      }
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: {
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    updateProfile: (data: Partial<User>) => Promise<void>
    addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
    setLoading: (key: keyof AppState["loading"], value: boolean) => void
  }
} | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Initialize user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        dispatch({ type: "SET_USER", payload: user })
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const actions = {
    login: async (email: string, password: string): Promise<boolean> => {
      dispatch({ type: "SET_LOADING", payload: { key: "auth", value: true } })

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (email === "admin@company.com" && password === "password") {
          const user: User = {
            id: "1",
            name: "John Doe",
            email: "admin@company.com",
            role: "owner",
          }

          localStorage.setItem("user", JSON.stringify(user))
          dispatch({ type: "SET_USER", payload: user })

          actions.addNotification({
            title: "Welcome back!",
            message: "You have successfully logged in",
            type: "success",
            read: false,
          })

          return true
        } else {
          throw new Error("Invalid credentials")
        }
      } catch (error) {
        actions.addNotification({
          title: "Login failed",
          message: "Invalid email or password",
          type: "error",
          read: false,
        })
        return false
      } finally {
        dispatch({ type: "SET_LOADING", payload: { key: "auth", value: false } })
      }
    },

    logout: () => {
      localStorage.removeItem("user")
      dispatch({ type: "SET_USER", payload: null })
      dispatch({ type: "CLEAR_NOTIFICATIONS" })

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    },

    updateProfile: async (data: Partial<User>): Promise<void> => {
      dispatch({ type: "SET_LOADING", payload: { key: "profile", value: true } })

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const updatedUser = { ...state.user, ...data } as User
        localStorage.setItem("user", JSON.stringify(updatedUser))
        dispatch({ type: "SET_USER", payload: updatedUser })

        actions.addNotification({
          title: "Profile updated",
          message: "Your profile has been updated successfully",
          type: "success",
          read: false,
        })
      } catch (error) {
        actions.addNotification({
          title: "Update failed",
          message: "Failed to update profile",
          type: "error",
          read: false,
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { key: "profile", value: false } })
      }
    },

    addNotification: (notification: Omit<Notification, "id" | "timestamp">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      }
      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification })
    },

    setLoading: (key: keyof AppState["loading"], value: boolean) => {
      dispatch({ type: "SET_LOADING", payload: { key, value } })
    },
  }

  return <AppContext.Provider value={{ state, dispatch, actions }}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider")
  }
  return context
}

export function useAuth() {
  const { state, actions } = useAppStore()
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading.auth,
    login: actions.login,
    logout: actions.logout,
    updateProfile: actions.updateProfile,
  }
}

export function useNotifications() {
  const { state, dispatch, actions } = useAppStore()
  return {
    notifications: state.notifications.items,
    count: state.notifications.count,
    addNotification: actions.addNotification,
    markAsRead: (id: string) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: id }),
    clearAll: () => dispatch({ type: "CLEAR_NOTIFICATIONS" }),
  }
}
