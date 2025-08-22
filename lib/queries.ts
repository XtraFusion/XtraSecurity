"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "./store"

// Mock API functions
const api = {
  // Team queries
  getTeamMembers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return [
      {
        id: "1",
        name: "John Doe",
        email: "john@company.com",
        role: "owner" as const,
        status: "active" as const,
        joinedAt: "2024-01-15",
        lastActive: "2024-01-20",
        projects: 12,
        department: "Engineering",
        location: "San Francisco, CA",
      },
      {
        id: "2",
        name: "Sarah Wilson",
        email: "sarah@company.com",
        role: "admin" as const,
        status: "active" as const,
        joinedAt: "2024-01-18",
        lastActive: "2024-01-20",
        projects: 8,
        invitedBy: "John Doe",
        department: "DevOps",
        location: "New York, NY",
      },
    ]
  },

  inviteTeamMember: async (data: { email: string; role: string; department?: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: Date.now().toString(),
      name: data.email.split("@")[0],
      email: data.email,
      role: data.role as any,
      status: "pending" as const,
      joinedAt: new Date().toISOString().split("T")[0],
      lastActive: "Never",
      projects: 0,
      department: data.department,
    }
  },

  // Audit log queries
  getAuditLogs: async (filters?: {
    search?: string
    category?: string
    severity?: string
    status?: string
    dateRange?: { from?: Date; to?: Date }
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const mockLogs = [
      {
        id: "1",
        timestamp: "2024-01-22T10:30:00Z",
        user: { name: "John Doe", email: "john@company.com", id: "1" },
        action: "Secret Updated",
        category: "secret" as const,
        severity: "info" as const,
        description: "Updated DATABASE_URL in production environment",
        details: {
          ip: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          location: "San Francisco, CA",
          resource: "project-1/production/DATABASE_URL",
        },
        status: "success" as const,
      },
      {
        id: "2",
        timestamp: "2024-01-22T09:15:00Z",
        user: { name: "Sarah Wilson", email: "sarah@company.com", id: "2" },
        action: "Failed Login Attempt",
        category: "auth" as const,
        severity: "warning" as const,
        description: "Multiple failed login attempts detected",
        details: {
          ip: "203.0.113.42",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          location: "Unknown",
        },
        status: "failed" as const,
      },
    ]

    // Apply filters
    let filteredLogs = mockLogs
    if (filters?.search) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.action.toLowerCase().includes(filters.search!.toLowerCase()) ||
          log.description.toLowerCase().includes(filters.search!.toLowerCase()),
      )
    }
    if (filters?.category && filters.category !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.category === filters.category)
    }

    return filteredLogs
  },

  // Project queries
  getProjects: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return [
      {
        id: "1",
        name: "Production API",
        description: "Main production environment",
        secretsCount: 24,
        lastUpdated: "2024-01-22T10:30:00Z",
        activeBranches: ["main", "staging"],
        status: "active" as const,
      },
      {
        id: "2",
        name: "Mobile App",
        description: "React Native mobile application",
        secretsCount: 12,
        lastUpdated: "2024-01-21T15:20:00Z",
        activeBranches: ["main", "dev", "feature/auth"],
        status: "active" as const,
      },
    ]
  },
}

// Team hooks
export function useTeamMembers() {
  const { actions } = useAppStore()

  return useQuery({
    queryKey: ["team-members"],
    queryFn: api.getTeamMembers,
    onError: () => {
      actions.addNotification({
        title: "Error",
        message: "Failed to load team members",
        type: "error",
        read: false,
      })
    },
  })
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient()
  const { actions } = useAppStore()

  return useMutation({
    mutationFn: api.inviteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] })
      actions.addNotification({
        title: "Invitation sent",
        message: "Team member invitation sent successfully",
        type: "success",
        read: false,
      })
    },
    onError: () => {
      actions.addNotification({
        title: "Error",
        message: "Failed to send invitation",
        type: "error",
        read: false,
      })
    },
  })
}

// Audit log hooks
export function useAuditLogs(filters?: {
  search?: string
  category?: string
  severity?: string
  status?: string
  dateRange?: { from?: Date; to?: Date }
}) {
  const { actions } = useAppStore()

  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => api.getAuditLogs(filters),
    onError: () => {
      actions.addNotification({
        title: "Error",
        message: "Failed to load audit logs",
        type: "error",
        read: false,
      })
    },
  })
}

// Project hooks
export function useProjects() {
  const { actions } = useAppStore()

  return useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    onError: () => {
      actions.addNotification({
        title: "Error",
        message: "Failed to load projects",
        type: "error",
        read: false,
      })
    },
  })
}
