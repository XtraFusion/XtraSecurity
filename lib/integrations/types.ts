export interface IntegrationStatus { 
  connected: boolean; 
  username?: string; 
  avatarUrl?: string; 
  connectedAt?: string; 
  authUrl?: string; 
  region?: string; 
  projectId?: string; 
  vaultName?: string; 
  error?: string; 
}

export interface Repo { 
  id: number | string; 
  name: string; 
  fullName: string; 
  owner: string; 
  private: boolean; 
  url: string; 
  framework?: string | null; 
  accountId?: string; 
  arn?: string; 
  dopplerProject?: string; 
  dopplerConfig?: string; 
  projectId?: string; 
  environmentId?: string; 
}

export interface DiffItem { 
  key: string; 
  status: "new" | "in_sync" | "only_vercel" | "only_netlify" | "only_remote" | "only_doppler"; 
  vercelId?: string; 
}

export interface CompareData { 
  items: DiffItem[]; 
  latestDeployment: { 
    id: string; 
    url: string | null; 
    state: string; 
    createdAt: number 
  } | null; 
  summary: { 
    new: number; 
    inSync: number; 
    onlyVercel?: number; 
    onlyNetlify?: number; 
    onlyDoppler?: number; 
  }; 
}

export type SyncProvider = 
  | "github" | "gitlab" | "vercel" | "netlify" | "aws" | "doppler" | "bitbucket" 
  | "gcp" | "azure" | "railway" | "fly" | "render" | "digitalocean" | "heroku" 
  | "slack" | "discord" | "teams" | "vault" | "circleci" | "cloudflare" | "jenkins" 
  | "pagerduty" | "travisci" | "supabase" | "telegram" | "email" | "terraform" 
  | "buildkite" | "opsgenie" | "checkly" | "hasura" | "postman" | "shopify" 
  | "twilio" | "kubernetes" | "linear" | "planetscale" | "bitwarden" | "ghost" 
  | "appwrite" | "onepassword" | "firebase" | "sentry" | "notion" | "googledrive" 
  | "zapier" | "bitbucketpipelines" | "gitlabselfmanaged" | "discordwebhook" | "mattermost";
