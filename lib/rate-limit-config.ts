export type Tier = 'free' | 'pro' | 'enterprise';

export interface RateLimitConfig {
  points: number; 
  duration: number; // seconds
  price: string;
  features: string[];
  maxTeams: number;
  maxWorkspaces: number;
  maxProjectsPerWorkspace: number;
  maxSecretsPerProject: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  tier: Tier;
}

// Configuration
export const DAILY_LIMITS: Record<Tier, RateLimitConfig> = {
  free: { 
    points: 1000, 
    duration: 86400, 
    price: "$0", 
    features: [
      "1000 API requests / day",
      "1 Workspace & 1 Team",
      "3 Projects",
      "50 secrets per project",
      "20 branch limit",
      "30-day audit logs",
      "CLI & SDK access",
      "RBAC & Slack alerts"
    ],
    maxTeams: 1,
    maxWorkspaces: 1,
    maxProjectsPerWorkspace: 3,
    maxSecretsPerProject: 50
  },
  pro: { 
    points: 10000, 
    duration: 86400, 
    price: "$9", 
    features: [
      "10,000 API requests / day",
      "3 Workspaces (5 projects each)",
      "100 secrets per project",
      "30 branch limit",
      "1-year audit logs",
      "JIT Access & Secret Rotation",
      "IP Blocking & DDoS Detection",
      "RBAC + Slack Alerts"
    ],
    maxTeams: 10,
    maxWorkspaces: 3,
    maxProjectsPerWorkspace: 5,
    maxSecretsPerProject: 100
  },
  enterprise: { 
    points: 100000, 
    duration: 86400, 
    price: "Custom", 
    features: [
      "100,000+ API requests / day",
      "Unlimited everything",
      "SSO / SAML",
      "On-Premise Deployment",
      "SOC 2 / ISO 27001 Reports",
      "Dedicated Support",
      "SLA Guarantee",
      "Custom audit log retention"
    ],
    maxTeams: 100, // Practically unlimited
    maxWorkspaces: 1000,
    maxProjectsPerWorkspace: 1000,
    maxSecretsPerProject: 10000
  },
};

export const BURST_LIMITS: Record<Tier, Omit<RateLimitConfig, 'price' | 'features'>> = {
  free: { points: 100, duration: 60, maxTeams: 1, maxWorkspaces: 1, maxProjectsPerWorkspace: 3, maxSecretsPerProject: 50 },
  pro: { points: 1000, duration: 60, maxTeams: 10, maxWorkspaces: 3, maxProjectsPerWorkspace: 5, maxSecretsPerProject: 100 },
  enterprise: { points: 10000, duration: 60, maxTeams: 100, maxWorkspaces: 1000, maxProjectsPerWorkspace: 1000, maxSecretsPerProject: 10000 },
};
