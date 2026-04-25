import React from "react";
import { 
  Github, Gitlab, Shield, Triangle, Globe, Lock, Flame, Activity, 
  Database, HardDrive, Zap, Ship, Building, Webhook, MessageSquare, 
  Mail, Box, Info, Send 
} from "lucide-react";

export type SyncProvider = 
  | "github" | "gitlab" | "vercel" | "netlify" | "aws" | "doppler" | "bitbucket" 
  | "gcp" | "azure" | "railway" | "fly" | "render" | "digitalocean" | "heroku" 
  | "slack" | "discord" | "teams" | "vault" | "circleci" | "cloudflare" | "jenkins" 
  | "pagerduty" | "travisci" | "supabase" | "telegram" | "email" | "terraform" 
  | "buildkite" | "opsgenie" | "checkly" | "hasura" | "postman" | "shopify" 
  | "twilio" | "kubernetes" | "linear" | "planetscale" | "bitwarden" | "ghost" 
  | "appwrite" | "onepassword" | "firebase" | "sentry" | "notion" | "googledrive" 
  | "zapier" | "bitbucketpipelines" | "gitlabselfmanaged" | "discordwebhook" | "mattermost";

export interface IntegrationMetadata {
  name: string;
  category: "source" | "deployment" | "cloud" | "notifications";
  icon: React.ReactNode;
  iconBg: string;
  repoLabel: string;
  detailText: string;
  tokenBased?: boolean;
}

const CloudLightning = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
    <path d="m13 12-3 5h4l-3 5" />
  </svg>
);

export const INTEGRATION_METADATA: Record<SyncProvider, IntegrationMetadata> = {
  github: { 
    name: "GitHub", category: "source", icon: <Github className="h-4 w-4 text-white" />, iconBg: "bg-[#24292e]", 
    repoLabel: "Repository", detailText: "Pushed to GitHub Actions" 
  },
  gitlab: { 
    name: "GitLab", category: "source", icon: <Gitlab className="h-4 w-4 text-white" />, iconBg: "bg-[#FC6D26]", 
    repoLabel: "GitLab Project", detailText: "Pushed to GitLab CI/CD" 
  },
  bitbucket: { 
    name: "Bitbucket", category: "source", icon: <img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className="h-4 w-4" />, iconBg: "bg-white shadow-inner", 
    repoLabel: "Bitbucket Repo", detailText: "Pushed to Bitbucket Repository Variables", tokenBased: true 
  },
  vercel: { 
    name: "Vercel", category: "deployment", icon: <Triangle className="h-4 w-4 text-white fill-white" />, iconBg: "bg-black", 
    repoLabel: "Vercel Project", detailText: "Pushed to Vercel Environment", tokenBased: true 
  },
  netlify: { 
    name: "Netlify", category: "deployment", icon: <img src="/Netlify Symbol SVG.svg" alt="Netlify" className="h-4 w-4 object-contain" />, iconBg: "bg-[#00C7B7]", 
    repoLabel: "Netlify Site", detailText: "Pushed to Netlify Site", tokenBased: true 
  },
  railway: { 
    name: "Railway", category: "deployment", icon: <img src="/Railway Symbol SVG.svg" alt="Railway" className="h-4 w-4 object-contain" />, iconBg: "bg-[#0B0D0E]", 
    repoLabel: "Railway Target", detailText: "Pushed to Railway Environment Variables", tokenBased: true 
  },
  fly: { 
    name: "Fly.io", category: "deployment", icon: <img src="/Fly (1)io Symbol SVG.svg" alt="Fly.io" className="h-4 w-4 object-contain" />, iconBg: "bg-[#4222E9]", 
    repoLabel: "Fly App", detailText: "Fly.io App Secrets", tokenBased: true 
  },
  render: { 
    name: "Render", category: "deployment", icon: <img src="/Render Symbol SVG.svg" alt="Render" className="h-4 w-4 object-contain" />, iconBg: "bg-white border shadow-sm", 
    repoLabel: "Render Target", detailText: "Pushed to Render Environment Variables", tokenBased: true 
  },
  heroku: { 
    name: "Heroku", category: "deployment", icon: <img src="/Heroku Symbol SVG.svg" alt="Heroku" className="h-4 w-4 object-contain" />, iconBg: "bg-[#6762A6]", 
    repoLabel: "Heroku App", detailText: "Pushed to Heroku Config Vars", tokenBased: true 
  },
  aws: { 
    name: "AWS", category: "cloud", icon: <img src="/Amazon Web Services Icon.png" alt="AWS" className="h-4 w-4 object-contain" />, iconBg: "bg-white", 
    repoLabel: "AWS Region", detailText: "Pushed to AWS Secrets Manager", tokenBased: true 
  },
  doppler: { 
    name: "Doppler", category: "cloud", icon: <img src="/Doppler.png" alt="Doppler" className="h-4 w-4 object-contain rounded" />, iconBg: "bg-white", 
    repoLabel: "Doppler Config", detailText: "Pushed to Doppler Config", tokenBased: true 
  },
  gcp: { 
    name: "Google Cloud", category: "cloud", icon: <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4" /><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853" /><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05" /><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335" /></svg>, iconBg: "bg-white border", 
    repoLabel: "GCP Project", detailText: "Pushed to Google Cloud Secret Manager", tokenBased: true 
  },
  azure: { 
    name: "Azure", category: "cloud", icon: <img src="/Microsoft Symbol SVG.svg" alt="Azure" className="h-4 w-4 object-contain" />, iconBg: "bg-[#0089D6]", 
    repoLabel: "Azure Vault", detailText: "Azure Key Vault", tokenBased: true 
  },
  digitalocean: { 
    name: "DigitalOcean", category: "cloud", icon: <img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className="h-4 w-4 object-contain" />, iconBg: "bg-white", 
    repoLabel: "DigitalOcean App", detailText: "Pushed to DigitalOcean App Platform", tokenBased: true 
  },
  slack: { 
    name: "Slack", category: "notifications", icon: <img src="/Slack Symbol SVG.svg" alt="Slack" className="h-4 w-4 object-contain" />, iconBg: "bg-[#4A154B]", 
    repoLabel: "N/A", detailText: "Sent to Slack", tokenBased: true 
  },
  discord: { 
    name: "Discord", category: "notifications", icon: <Webhook className="h-4 w-4 text-white" />, iconBg: "bg-[#5865F2]", 
    repoLabel: "N/A", detailText: "Sent to Discord", tokenBased: true 
  },
  teams: { 
    name: "Microsoft Teams", category: "notifications", icon: <img src="/Microsoft Symbol SVG.svg" alt="Teams" className="h-4 w-4 object-contain" />, iconBg: "bg-[#6264A7]", 
    repoLabel: "N/A", detailText: "Sent to Microsoft Teams", tokenBased: true 
  },
  vault: { 
    name: "HashiCorp Vault", category: "cloud", icon: <span className="font-bold text-[#FFCD00] text-xs">V</span>, iconBg: "bg-[#1A1A1A]", 
    repoLabel: "Secret Engine", detailText: "Pushed to HashiCorp Vault KV", tokenBased: true 
  },
  circleci: { 
    name: "CircleCI", category: "deployment", icon: <Activity className="h-4 w-4 text-[#04D361]" />, iconBg: "bg-[#343434]", 
    repoLabel: "CircleCI Org", detailText: "Pushed to CircleCI Env Variables", tokenBased: true 
  },
  cloudflare: { 
    name: "Cloudflare", category: "deployment", icon: <CloudLightning className="h-4 w-4 text-white" />, iconBg: "bg-[#F6821F]", 
    repoLabel: "Worker / Pages Project", detailText: "Pushed to Cloudflare Worker/Pages", tokenBased: true 
  },
  jenkins: { 
    name: "Jenkins", category: "deployment", icon: <span className="font-bold text-white text-xs">J</span>, iconBg: "bg-[#D33833]", 
    repoLabel: "Jenkins Job", detailText: "Pushed to Jenkins Credentials Store", tokenBased: true 
  },
  pagerduty: { 
    name: "PagerDuty", category: "notifications", icon: <span className="font-bold text-white text-[8px]">PD</span>, iconBg: "bg-[#06AC38]", 
    repoLabel: "PagerDuty Service", detailText: "Incident triggered in PagerDuty", tokenBased: true 
  },
  travisci: { 
    name: "Travis CI", category: "deployment", icon: <span className="font-bold text-white text-[8px]">CI</span>, iconBg: "bg-[#3EAAAF]", 
    repoLabel: "Repository", detailText: "Pushed to Travis CI Env Variables", tokenBased: true 
  },
  supabase: { 
    name: "Supabase", category: "cloud", icon: <span className="font-bold text-black text-[8px]">SB</span>, iconBg: "bg-[#3ECF8E]", 
    repoLabel: "Supabase Project", detailText: "Pushed to Supabase Project Secrets", tokenBased: true 
  },
  telegram: { 
    name: "Telegram", category: "notifications", icon: <Send className="h-4 w-4 text-white" />, iconBg: "bg-[#229ED9]", 
    repoLabel: "N/A", detailText: "Sent to Telegram", tokenBased: true 
  },
  email: { 
    name: "Email", category: "notifications", icon: <Mail className="h-4 w-4 text-white" />, iconBg: "bg-[#2563eb]", 
    repoLabel: "N/A", detailText: "Email alert sent via SMTP", tokenBased: true 
  },
  terraform: { 
    name: "Terraform Cloud", category: "cloud", icon: <span className="font-bold text-white text-[8px]">TF</span>, iconBg: "bg-[#7B42BC]", 
    repoLabel: "Workspace", detailText: "Pushed to Terraform Workspace Variables", tokenBased: true 
  },
  buildkite: { 
    name: "Buildkite", category: "deployment", icon: <span className="font-bold text-black text-[8px]">BK</span>, iconBg: "bg-[#23D381]", 
    repoLabel: "Pipeline", detailText: "Pushed to Buildkite Pipeline Env", tokenBased: true 
  },
  opsgenie: { 
    name: "Opsgenie", category: "notifications", icon: <span className="font-bold text-white text-[8px]">OG</span>, iconBg: "bg-[#2563EB]", 
    repoLabel: "N/A", detailText: "Alert triggered in Opsgenie", tokenBased: true 
  },
  checkly: { 
    name: "Checkly", category: "deployment", icon: <span className="font-bold text-white text-[8px]">C</span>, iconBg: "bg-[#4285F4]", 
    repoLabel: "Account Context", detailText: "Pushed to Checkly Global Variables", tokenBased: true 
  },
  hasura: { 
    name: "Hasura Cloud", category: "cloud", icon: <span className="font-bold text-[#3ECF8E] text-[8px]">H</span>, iconBg: "bg-[#191D31]", 
    repoLabel: "Project", detailText: "Pushed to Hasura Cloud Env Vars", tokenBased: true 
  },
  postman: { 
    name: "Postman", category: "source", icon: <span className="font-bold text-white text-[11px]">PM</span>, iconBg: "bg-[#FF6C37]", 
    repoLabel: "Environment", detailText: "Pushed to Postman Environment", tokenBased: true 
  },
  shopify: { 
    name: "Shopify", category: "cloud", icon: <span className="font-bold text-white text-[8px]">S</span>, iconBg: "bg-[#96BF48]", 
    repoLabel: "Store Context", detailText: "Pushed to Shopify Metafields", tokenBased: true 
  },
  twilio: { 
    name: "Twilio", category: "notifications", icon: <span className="font-bold text-white text-[8px]">TW</span>, iconBg: "bg-[#F22F46]", 
    repoLabel: "N/A", detailText: "SMS alert sent via Twilio", tokenBased: true 
  },
  kubernetes: { 
    name: "Kubernetes", category: "deployment", icon: <span className="font-bold text-white text-[8px]">K8S</span>, iconBg: "bg-[#326CE5]", 
    repoLabel: "Namespace", detailText: "Pushed to K8s Opaque Secret", tokenBased: true 
  },
  linear: { 
    name: "Linear", category: "notifications", icon: <Activity className="h-4 w-4 text-white" />, iconBg: "bg-[#5E6AD2]", 
    repoLabel: "Team Context", detailText: "Issue created in Linear", tokenBased: true 
  },
  planetscale: { 
    name: "PlanetScale", category: "cloud", icon: <Database className="h-4 w-4 text-white" />, iconBg: "bg-black", 
    repoLabel: "DB Branch", detailText: "Pushed to Database Infrastructure", tokenBased: true 
  },
  bitwarden: { 
    name: "Bitwarden", category: "source", icon: <Shield className="h-3 w-3 text-white" />, iconBg: "bg-[#175DDC]", 
    repoLabel: "BW Project", detailText: "Pushed to BW Secrets Manager", tokenBased: true 
  },
  ghost: { 
    name: "Ghost CMS", category: "notifications", icon: <Globe className="h-3 w-3 text-white" />, iconBg: "bg-[#15171A]", 
    repoLabel: "N/A", detailText: "Draft post created in Ghost", tokenBased: true 
  },
  appwrite: { 
    name: "Appwrite", category: "cloud", icon: <Box className="h-3 w-3 text-white" />, iconBg: "bg-[#F02E65]", 
    repoLabel: "Appwrite Target", detailText: "Pushed to Appwrite Variables", tokenBased: true 
  },
  onepassword: { 
    name: "1Password", category: "source", icon: <Lock className="h-3 w-3 text-white" />, iconBg: "bg-[#0094F5]", 
    repoLabel: "Vault", detailText: "Pushed to 1Password Vault", tokenBased: true 
  },
  firebase: { 
    name: "Firebase", category: "cloud", icon: <Flame className="h-3 w-3 text-white" />, iconBg: "bg-[#FFCA28]", 
    repoLabel: "Firebase Location", detailText: "Pushed to Firebase Secret Manager", tokenBased: true 
  },
  sentry: { 
    name: "Sentry", category: "notifications", icon: <Activity className="h-3 w-3 text-white" />, iconBg: "bg-[#362D59]", 
    repoLabel: "Sentry Project", detailText: "Event reported to Sentry", tokenBased: true 
  },
  notion: { 
    name: "Notion", category: "source", icon: <Database className="h-3 w-3 text-white" />, iconBg: "bg-[#000000]", 
    repoLabel: "Notion Database", detailText: "Pushed to Notion Database", tokenBased: true 
  },
  googledrive: { 
    name: "Google Drive", category: "cloud", icon: <HardDrive className="h-3 w-3 text-white" />, iconBg: "bg-[#4285F4]", 
    repoLabel: "Backup Folder", detailText: "Backup created in Google Drive", tokenBased: true 
  },
  zapier: { 
    name: "Zapier", category: "notifications", icon: <Zap className="h-3 w-3 text-white" />, iconBg: "bg-[#FF4F00]", 
    repoLabel: "Zapier Webhook", detailText: "Automation triggered in Zapier", tokenBased: true 
  },
  bitbucketpipelines: { 
    name: "Bitbucket Pipelines", category: "source", icon: <Ship className="h-3 w-3 text-white" />, iconBg: "bg-[#0052CC]", 
    repoLabel: "Pipelines Repo", detailText: "Pushed to BB Pipeline Variables", tokenBased: true 
  },
  gitlabselfmanaged: { 
    name: "GitLab Self-Managed", category: "source", icon: <Building className="h-3 w-3 text-white" />, iconBg: "bg-[#FC6D26]", 
    repoLabel: "Enterprise Project", detailText: "Pushed to Enterprise GitLab CI", tokenBased: true 
  },
  discordwebhook: { 
    name: "Discord Webhook", category: "notifications", icon: <Webhook className="h-3 w-3 text-white" />, iconBg: "bg-[#5865F2]", 
    repoLabel: "Discord Hook", detailText: "Sent to Discord Channel", tokenBased: true 
  },
  mattermost: { 
    name: "Mattermost", category: "notifications", icon: <MessageSquare className="h-3 w-3 text-white" />, iconBg: "bg-[#0058CC]", 
    repoLabel: "Mattermost Hook", detailText: "Sent to Mattermost Channel", tokenBased: true 
  },
};



export const AWS_REGIONS = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "eu-central-1", "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ca-central-1", "sa-east-1"];
