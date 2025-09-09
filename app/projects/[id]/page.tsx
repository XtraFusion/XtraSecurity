"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  GitBranch,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  History,
  Copy,
  Check,
  ChevronRight,
  Home,
  MoreVertical,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { ProjectController } from "@/util/ProjectController";
import axios from "axios";

interface SecretVersion {
  version: number;
  value: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
  changeReason?: string;
}

interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environmentType: "development" | "staging" | "production";
  lastUpdated: string;
  projectId: string;
  branchId: string;
  updatedBy?: string;
  version: number;
  history?: SecretVersion[];
  permission: string[];
  expiryDate: Date;
  rotationPolicy: string;
  rotationType:string;
  type: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  branches: string[];
  secrets: Record<string, Secret[]>;
}

const mockProject: Project = {
  id: "1",
  name: "Production API",
  description: "Main production environment for our API services",
  branches: ["main", "staging", "dev", "feature/auth"],
  secrets: {
    main: [
      {
        id: "1",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/prod",
        description: "Main database connection string",
        environmentType: "production",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "admin@example.com",
        version: 3,
        history: [
          {
            version: 3,
            value: "postgresql://user:pass@localhost:5432/prod",
            description: "Main database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-15T10:30:00Z",
            changeReason: "Updated connection pool settings",
          },
          {
            version: 2,
            value: "postgresql://user:pass@localhost:5432/prod_v2",
            description: "Main database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-14T14:20:00Z",
            changeReason: "Migrated to new database server",
          },
        ],
        permission: ["admin@example.com"],
        expiryDate: new Date("2024-12-31"),
        projectId: "1",
        branchId: "main",
        rotationPolicy: "auto",
        type: "Database",
      },
      {
        id: "2",
        key: "API_SECRET_KEY",
        value: "sk_live_abcd1234567890",
        description: "Secret key for API authentication",
        environmentType: "production",
        lastUpdated: "2024-01-14T16:45:00Z",
        updatedBy: "admin@example.com",
        version: 1,
        permission: ["admin@example.com"],
        expiryDate: new Date("2024-12-31"),
        projectId: "1",
        branchId: "main",
        rotationPolicy: "manual",
        type: "API Key",
      },
    ],
    staging: [
      {
        id: "4",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/staging",
        description: "Staging database connection string",
        environmentType: "staging",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "admin@example.com",
        version: 2,
        permission: ["admin@example.com", "dev@example.com"],
        expiryDate: new Date("2024-12-31"),
        projectId: "1",
        branchId: "staging",
        rotationPolicy: "manual",
        type: "Database",
      },
    ],
    dev: [
      {
        id: "5",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/dev",
        description: "Development database connection string",
        environmentType: "development",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "dev@example.com",
        version: 1,
        permission: ["dev@example.com"],
        expiryDate: new Date("2024-12-31"),
        projectId: "1",
        branchId: "dev",
        rotationPolicy: "manual",
        type: "Database",
      },
    ],
  },
};

const VaultManager: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();

  const { user } = useGlobalContext();

  const [project, setProject] = useState<Project | null>(null);
  const [secretList, setSecretList] = useState<Secret[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [isAddSecretOpen, setIsAddSecretOpen] = useState(false);
  const [isEditSecretOpen, setIsEditSecretOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySecret, setHistorySecret] = useState<Secret | null>(null);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [newBranchDesc, setNewBranchDesc] = useState("");
  const [branchList, setBranchList] = useState<any[]>([]);
  const [notification, setNotification] = useState<{
    type: "default" | "destructive";
    message: string;
  } | null>(null);
  const [newSecret, setNewSecret] = useState({
    key: "",
    value: "",
    description: "",
    projectId: projectId,
    branchId: selectedBranch.id ?? "",
    environmentType: "development" as const,
    permission: [] as string[],
    expiryDate: "",
    type: "",
    rotationPolicy: "manual" as const,
    rotationType:""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSecretList(selectedBranch.secrets || []);
  }, [selectedBranch]);

  const deleteSecret = async (secretId: string) => {
    return await axios.delete(`/api/secret?id=${secretId}`);
  };

  const loadProject = async () => {
    // const data = await fetchSecrets(projectId);
    const data1 = await ProjectController.fetchProjects(projectId);
    const branchRes = await axios.get(`/api/branch?projectId=${projectId}`);
    const branchData = branchRes.data;
    console.log(branchData);
    setBranchList(branchData || []);
    console.log(branchData);
    if (branchData && branchData.length >= 1) {
      // prefer branch name if available, otherwise id
      setSelectedBranch(branchData[0] ?? branchData[0] ?? {});
      setSecretList(branchData[0]?.secret || []);
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    setProject(mockProject);
    setIsLoading(false);
  };
  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const currentSecrets = secretList || [];
  const filteredSecrets = currentSecrets.filter(
    (secret) =>
      secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const branchOptions =
    project?.branches.map((branch) => ({
      value: branch,
      label: branch,
    })) || [];

  const environmentOptions = [
    { value: "development", label: "Development" },
    { value: "staging", label: "Staging" },
    { value: "production", label: "Production" },
  ];

  const rotationOptions = [
    { value: "manual", label: "Manual" },
    { value: "auto", label: "Automatic" },
    { value: "interval", label: "Interval-based" },
  ];

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const copyToClipboard = async (text: string, secretId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSecret(secretId);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch (err) {
      setNotification({
        type: "destructive",
        message: "Failed to copy to clipboard",
      });
    }
  };

  const handleAddSecret = async () => {
    console.log(selectedBranch);
    if (!project || !newSecret.key.trim() || !newSecret.value.trim()) return;

    const secret: Secret = {
      id: Date.now().toString(),
      key: newSecret.key,
      value: newSecret.value,
      description: newSecret.description,
      environmentType: newSecret.environmentType,
      lastUpdated: new Date().toISOString(),
      version: 1,
      projectId: projectId,
      branchId: selectedBranch.id,
      permission: selectedBranch.permissions,
      expiryDate: newSecret.expiryDate
        ? new Date(newSecret.expiryDate)
        : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      rotationPolicy: newSecret.rotationPolicy,
      rotationType: newSecret?.rotationType,
      type: newSecret.type,
    };

    try {
      await axios.post("/api/secret", secret);
    } catch (err) {
      console.error("createSecret failed", err);
    }
    // update local secret list for current branch
    setSecretList((prev: any) => [...prev, secret]);
    setNewSecret({
      key: "",
      value: "",
      description: "",
      environmentType: "development",
      permission: [],
      expiryDate: "",
      projectId: projectId,
      branchId: selectedBranch.id,
      type: "",
      rotationPolicy: "manual",
    });
    setIsAddSecretOpen(false);
    setNotification({ type: "default", message: "Secret added successfully" });
  };

  const handleEditSecret = async () => {
    if (!project || !editingSecret) return;

    setIsEditSecretOpen(false);
    setEditingSecret(null);
    setNotification({
      type: "default",
      message: "Secret updated successfully",
    });
    try {
      await axios.put(`/api/secret?id=${editingSecret.id}`, editingSecret);
    } catch (err) {
      console.error("updateSecret failed", err);
    }
    loadProject();
  };

  const handleDeleteSecret = (secretId: string) => {
    if (!project) return;
    const updatedSecrets = secretList.filter(
      (secret: Secret) => secret.id !== secretId
    );
    deleteSecret(secretId);
    setSecretList(updatedSecrets);
    setNotification({
      type: "default",
      message: "Secret deleted successfully",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const createBranch = async (name: string, description: string) => {
    try {
      const res = await axios.post("/api/branch", {
        projectId,
        name,
        description,
      });
      const branch = res.data;
      // optimistic update
      setBranchList((prev) => [...prev, branch]);
      setSelectedBranch(branch);
      setIsAddBranchOpen(false);
      setNewBranch("");
      setNewBranchDesc("");
      setNotification({ type: "default", message: "Branch created" });
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "destructive",
        message: "Failed to create branch",
      });
    }
  };

  const getEnvironmentBadge = (environment: string) => {
    switch (environment) {
      case "production":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            {environment}
          </Badge>
        );
      case "staging":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
          >
            {environment}
          </Badge>
        );
      case "development":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            {environment}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
          >
            {environment}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton with shimmer effect */}
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded-lg w-64 shimmer"></div>
          <div className="h-4 bg-muted rounded-lg w-96 shimmer"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted rounded-lg shimmer opacity-60"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Project not found</div>
          <Button onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
        <ChevronRight className="h-4 w-4" />
        <span>Projects</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-vault-gradient bg-clip-text text-transparent">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 shadow-card">
              <GitBranch className="h-4 w-4 text-primary" />
              {branchList.length >= 1 && (
                <Select
                  value={selectedBranch.id}
                  onValueChange={(v) => {
                    setSelectedBranch(branchList.find((b) => b.id === v) ?? {});
                  }}
                >
                  <SelectTrigger className="border-0 bg-transparent">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchList?.map((option: any) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAddBranchOpen(true)}
              className="bg-background hover:bg-accent/10"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsAddSecretOpen(true)}
            className="bg-background hover:bg-accent/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Secret
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search secrets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            {filteredSecrets.length} secrets in{" "}
            {selectedBranch?.name ??
              selectedBranch?.id ??
              selectedBranch ??
              "branch"}
          </span>
        </div>
      </div>

      {/* Secrets Grid */}
      <div className="grid gap-4">
        {secretList.length > 0 ? (
          secretList.map((secret: Secret) => (
            <Card
              key={secret.id}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-border/60 dark:border-border/40"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-vault-gradient opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-mono font-semibold text-foreground truncate">
                        {secret.key}
                      </h3>
                      {getEnvironmentBadge(secret.environmentType)}
                      <Badge variant="outline">{secret.type}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {secret.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <code className="bg-muted px-3 py-1 rounded text-sm font-mono max-w-xs truncate">
                        {visibleSecrets.has(secret.id)
                          ? secret.value
                          : "••••••••••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(secret.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {visibleSecrets.has(secret.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(secret.value, secret.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedSecret === secret.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(secret.lastUpdated)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {secret.updatedBy}
                      </div>
                      <div>v{secret.version}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSecret(secret);
                        setIsEditSecretOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHistorySecret(secret);
                        setIsHistoryModalOpen(true);
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSecret(secret.id)}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No secrets found matching your search."
                  : "No secrets in this branch yet."}
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsAddSecretOpen(true)}>
                  Add your first secret
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Secret Modal */}
      <Modal
        isOpen={isAddSecretOpen}
        onClose={() => setIsAddSecretOpen(false)}
        title="Add New Secret"
        description={`Add a new environment variable or secret to ${
          selectedBranch?.name ??
          selectedBranch?.id ??
          selectedBranch ??
          "branch"
        } branch.`}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secret-key">Key</Label>
            <Input
              id="secret-key"
              placeholder="e.g., DATABASE_URL"
              value={newSecret.key}
              onChange={(e) =>
                setNewSecret({ ...newSecret, key: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-value">Value</Label>
            <Textarea
              id="secret-value"
              placeholder="Enter the secret value"
              value={newSecret.value}
              onChange={(e) =>
                setNewSecret({ ...newSecret, value: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-type">Type</Label>
            <Input
              id="secret-type"
              placeholder="e.g., API Key, Database, Certificate"
              value={newSecret.type}
              onChange={(e) =>
                setNewSecret({ ...newSecret, type: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-description">Description</Label>
            <Input
              id="secret-description"
              placeholder="Brief description of this secret"
              value={newSecret.description}
              onChange={(e) =>
                setNewSecret({ ...newSecret, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-expiry-date">Expiry Date</Label>
            <Input
              id="secret-expiry-date"
              placeholder="Choose Expiry Date"
              type="date"
              value={newSecret.expiryDate}
              onChange={(e) =>
                setNewSecret({ ...newSecret, expiryDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-environment">Environment</Label>
            <Select
              value={newSecret.environmentType}
              onValueChange={(value) =>
                setNewSecret({ ...newSecret, environmentType: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-environment">Secret Rotation Type:</Label>
            <Select
              value={newSecret.rotationPolicy}
              onValueChange={(value) =>
                setNewSecret({ ...newSecret, rotationPolicy: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rotation type" />
              </SelectTrigger>
              <SelectContent>
                {rotationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddSecretOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSecret}>Add Secret</Button>
          </div>
        </div>
      </Modal>

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        title="Create Branch"
        description={`Create a new branch for project ${project?.name}`}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              placeholder="e.g., feature/login"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-desc">Description (optional)</Label>
            <Textarea
              id="branch-desc"
              placeholder="Short description"
              value={newBranchDesc}
              onChange={(e) => setNewBranchDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddBranchOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createBranch(newBranch.trim(), newBranchDesc.trim())
              }
            >
              Create Branch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Secret Modal */}
      <Modal
        isOpen={isEditSecretOpen}
        onClose={() => {
          setIsEditSecretOpen(false);
          setEditingSecret(null);
        }}
        title="Edit Secret"
        description="Update the secret value and description."
        className="max-w-lg"
      >
        {editingSecret && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={editingSecret.key}
                onChange={(e) =>
                  setEditingSecret({ ...editingSecret, key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Textarea
                id="edit-value"
                value={editingSecret.value}
                onChange={(e) =>
                  setEditingSecret({ ...editingSecret, value: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingSecret.description}
                onChange={(e) =>
                  setEditingSecret({
                    ...editingSecret,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditSecretOpen(false);
                  setEditingSecret(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSecret}>Update Secret</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistorySecret(null);
        }}
        title="Version History"
        description={
          historySecret
            ? `View and manage version history for ${historySecret.key}`
            : ""
        }
        className="max-w-2xl"
      >
        {historySecret && historySecret.history && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current version: {historySecret.version} •{" "}
              {historySecret.history.length} total versions
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historySecret.history.map((version) => (
                <Card
                  key={version.version}
                  className={
                    version.version === historySecret.version
                      ? "border-primary"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            version.version === historySecret.version
                              ? "default"
                              : "secondary"
                          }
                        >
                          Version {version.version}
                        </Badge>
                        {version.version === historySecret.version && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(version.updatedAt)}
                      </div>
                    </div>

                    <div className="text-sm mb-2">
                      <div>Updated by: {version.updatedBy}</div>
                      {version.changeReason && (
                        <div className="text-muted-foreground">
                          Reason: {version.changeReason}
                        </div>
                      )}
                    </div>

                    <div className="bg-muted rounded p-2 font-mono text-sm">
                      {visibleSecrets.has(
                        `${historySecret.id}-v${version.version}`
                      )
                        ? version.value
                        : "••••••••••••••••"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default VaultManager;
