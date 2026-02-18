export type Tier = 'free' | 'pro' | 'enterprise';

export interface RateLimitConfig {
  points: number; 
  duration: number; // seconds
  price: string;
  features: string[];
  maxTeams: number;
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
    features: ["1,000 requests/day", "Public Support", "Basic Access", "1 Team Limit"],
    maxTeams: 1
  },
  pro: { 
    points: 10000, 
    duration: 86400, 
    price: "$29", 
    features: ["10,000 requests/day", "Priority Support", "Advanced Analytics", "Team Collaboration", "10 Team Limit"],
    maxTeams: 10
  },
  enterprise: { 
    points: 100000, 
    duration: 86400, 
    price: "Custom", 
    features: ["100,000+ requests/day", "Dedicated Support", "SLA", "Custom Integrations", "On-premise Options", "100+ Team Limit"],
    maxTeams: 100
  },
};

export const BURST_LIMITS: Record<Tier, Omit<RateLimitConfig, 'price' | 'features'>> = {
  free: { points: 100, duration: 60, maxTeams: 1 },
  pro: { points: 1000, duration: 60, maxTeams: 10 },
  enterprise: { points: 10000, duration: 60, maxTeams: 100 },
};
