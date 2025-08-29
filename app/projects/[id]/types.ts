export interface SecretVersion {
  version: number;
  value: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
  changeReason?: string;
}

export interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environment_type: "development" | "staging" | "production";
  lastUpdated: string;
  updatedBy?: string;
  version: number;
  history?: SecretVersion[];
  permission: string[];
  expiryDate: Date;
  rotationPolicy: string;
  type: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  branches: string[];
  secrets: Record<string, Secret[]>;
}
