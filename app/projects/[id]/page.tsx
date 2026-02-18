"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  GitBranch,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  History,
  Copy,
  Check,
  ChevronRight,
  Home,
  MoreHorizontal,
  Clock,
  User,
  Settings,
  Key,
  Shield,
  Activity,
  AlertCircle,
  Filter,
  RefreshCw,
  Lock,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  RotateCcw,
  Zap,
  Server,
  Database,
  Globe,
  FileKey,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog-custom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGlobalContext } from "@/hooks/useUser";
import { ProjectController } from "@/util/ProjectController";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

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
  rotationPolicy: "manual" | "auto" | "interval";
  rotationType?: string;
  type: string;
  status?: "active" | "expiring" | "expired" | "rotating";
}

interface Branch {
  id: string;
  name: string;
  description?: string;
  secrets?: Secret[];
}

interface Project {
  id: string;
  name: string;
  description: string;
}

// --- Mock Data ---

const SECRET_TYPES = [
  { value: "Database", icon: Database, color: "text-blue-500" },
  { value: "API Key", icon: Key, color: "text-amber-500" },
  { value: "Certificate", icon: ShieldCheck, color: "text-green-500" },
  { value: "OAuth", icon: Globe, color: "text-purple-500" },
  { value: "Encryption", icon: Lock, color: "text-red-500" },
  { value: "Other", icon: FileKey, color: "text-gray-500" },
];

const ROTATION_OPTIONS = [
  { value: "manual", label: "Manual", icon: User, desc: "Rotate manually when needed" },
  { value: "auto", label: "Automatic", icon: Zap, desc: "Auto-rotate on schedule" },
  { value: "interval", label: "Interval", icon: Calendar, desc: "Rotate every N days" },
];

// --- Components ---

const EnvironmentBadge = ({ environment }: { environment: string }) => {
  const styles = {
    production: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    staging: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    development: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  };

  const icons = {
    production: ShieldAlert,
    staging: Shield,
    development: Activity,
  };

  const Icon = icons[(environment === "dev" ? "development" : environment) as keyof typeof icons] || Shield;

  return (
    <Badge
      variant="outline"
      className={`${styles[(environment === "dev" ? "development" : environment) as keyof typeof styles] || styles.development} gap-1.5 px-2.5 py-0.5 font-medium`}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{environment === "dev" ? "development" : environment}</span>
    </Badge>
  );
};

const StatusIndicator = ({ status }: { status?: string }) => {
  const styles = {
    active: "bg-emerald-500",
    expiring: "bg-amber-500 animate-pulse",
    expired: "bg-red-500",
    rotating: "bg-blue-500 animate-spin",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${styles[status as keyof typeof styles] || styles.active}`} />
      <span className="text-xs text-muted-foreground capitalize">{status || "active"}</span>
    </div>
  );
};

const SecretCard = ({
  secret,
  isVisible,
  onToggleVisibility,
  onCopy,
  isCopied,
  onEdit,
  onDelete,
  onViewHistory,
}: {
  secret: Secret;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const SecretIcon = SECRET_TYPES.find((t) => t.value === secret.type)?.icon || Key;
  const iconColor = SECRET_TYPES.find((t) => t.value === secret.type)?.color || "text-gray-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-card border rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary/20"
    >
      {/* Top Gradient Line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-lg bg-muted ${iconColor}`}>
              <SecretIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate pr-2" title={secret.key}>
                {secret.key}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {secret.description || "No description"}
              </p>
            </div>
          </div>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 transition-opacity ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewHistory} className="gap-2">
                <History className="h-4 w-4" /> History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Secret Value */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 group/value">
            <code className="flex-1 font-mono text-sm truncate text-foreground/80">
              {isVisible ? secret.value : "•".repeat(Math.min(secret.value.length, 24))}
            </code>
            <div className="flex items-center gap-1 opacity-0 group-hover/value:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-7 w-7 p-0"
              >
                {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-7 w-7 p-0"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <EnvironmentBadge environment={secret.environmentType} />
            <StatusIndicator status={secret.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {secret.rotationPolicy !== "manual" && (
              <div className="flex items-center gap-1" title="Auto-rotation enabled">
                <RefreshCw className="h-3 w-3 text-primary" />
                <span>{secret.rotationType}</span>
              </div>
            )}
            <div className="flex items-center gap-1" title={`Updated ${new Date(secret.lastUpdated).toLocaleDateString()}`}>
              <Clock className="h-3 w-3" />
              <span>v{secret.version}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}) => (
  <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50">
    <div className={`absolute top-0 right-0 p-3 opacity-10 ${color}`}>
      <Icon className="h-16 w-16" />
    </div>
    <CardContent className="p-5">
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-end gap-2 mt-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && <span className="text-xs text-emerald-500 mb-1">{trend}</span>}
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- Main Component ---

const VaultManager: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter(); // Import needed
  const searchParams = useSearchParams(); // Import needed
  const { user } = useGlobalContext();

  const [project, setProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Initialize filterEnv from URL or default to "all"
  const [filterEnv, setFilterEnv] = useState<string>(searchParams.get("env") || "all");

  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  // Modals
  const [isAddSecretOpen, setIsAddSecretOpen] = useState(false);
  const [isEditSecretOpen, setIsEditSecretOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [historySecret, setHistorySecret] = useState<Secret | null>(null);

  const [notification, setNotification] = useState<{ type: "default" | "destructive"; message: string } | null>(null);

  const [newSecret, setNewSecret] = useState({
    key: "",
    value: "",
    description: "",
    environmentType: "development" as const,
    type: "API Key",
    rotationPolicy: "manual" as const,
    rotationType: "30-days",
    expiryDate: "",
  });

  const [newBranch, setNewBranch] = useState({ name: "", description: "" });

  // Helper to update URL
  const updateUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // --- Data Loading ---

  const loadProject = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      // Simulate API calls
      const [projectRes, branchesRes] = await Promise.all([
        ProjectController.fetchProjects(projectId),
        axios.get(`/api/branch?projectId=${projectId}`),
      ]);

      const branchData = branchesRes.data || [];
      setBranches(branchData);

      if (branchData.length > 0) {
        // Preference: URL param -> Current State -> First Branch
        const paramBranchId = searchParams.get("branch");
        const foundBranch = branchData.find((b: any) => b.id === paramBranchId) ||
          (selectedBranch ? branchData.find((b: any) => b.id === selectedBranch.id) : null) ||
          branchData[0];

        setSelectedBranch(foundBranch);
        setSecrets(foundBranch.secrets || []);

        // Sync URL if needed
        if (!paramBranchId && foundBranch) {
          // Don't force update URL on initial load if empty, actually it's better to reflect state
          // But let's avoid infinite loops.
        }
      }

      setProject({
        id: projectId,
        name: "Production API",
        description: "Main production environment for API services",
      });
    } catch (error) {
      setNotification({ type: "destructive", message: "Failed to load project data" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, searchParams]); // searchParams dependency is tricky, handled carefully

  // Initial Load - minimal dependency
  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Watch for notification clear
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handlers for persistence
  const handleBranchChange = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
      setSecrets(branch.secrets || []);
      updateUrl("branch", branch.id);
    }
  };

  const handleEnvChange = (env: string) => {
    setFilterEnv(env);
    updateUrl("env", env);
  };

  const handleRefresh = () => {
    loadProject(true);
  };

  // ... rest of handlers ...

  // --- Handlers ---

  const handleAddSecret = async () => {
    // Validation
    if (!newSecret.key.trim()) {
      setNotification({ type: "destructive", message: "Secret key is required" });
      return;
    }
    if (!newSecret.value.trim()) {
      setNotification({ type: "destructive", message: "Secret value is required" });
      return;
    }
    if (!selectedBranch) {
      setNotification({ type: "destructive", message: "Please select a branch first" });
      return;
    }

    // Prepare secret data WITHOUT id - let Prisma auto-generate it
    const secretData = {
      key: newSecret.key,
      value: newSecret.value,
      description: newSecret.description,
      environmentType: newSecret.environmentType,
      type: newSecret.type,
      rotationPolicy: newSecret.rotationPolicy,
      rotationType: newSecret.rotationType,
      projectId: projectId as string,
      branchId: selectedBranch.id,
      permission: [],
      expiryDate: newSecret.expiryDate || undefined,
    };

    try {
      const response = await axios.post("/api/secret", secretData);
      const createdSecret = response.data;

      // Add the created secret (with proper ID from DB) to local state
      setSecrets((prev) => [createdSecret, ...prev]);
      setIsAddSecretOpen(false);
      setNewSecret({
        key: "",
        value: "",
        description: "",
        environmentType: "development",
        type: "API Key",
        rotationPolicy: "manual",
        rotationType: "30-days",
        expiryDate: "",
      });
      setNotification({ type: "default", message: "✓ Secret created successfully" });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to create secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    }
  };

  const handleEditSecret = async () => {
    if (!editingSecret) return;

    // Validation
    if (!editingSecret.key.trim()) {
      setNotification({ type: "destructive", message: "Secret key cannot be empty" });
      return;
    }
    if (!editingSecret.value.trim()) {
      setNotification({ type: "destructive", message: "Secret value cannot be empty" });
      return;
    }

    try {
      await axios.put(`/api/secret?id=${editingSecret.id}`, editingSecret);
      setSecrets((prev) => prev.map((s) => (s.id === editingSecret.id ? editingSecret : s)));
      setIsEditSecretOpen(false);
      setEditingSecret(null);
      setNotification({ type: "default", message: "✓ Secret updated successfully" });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to update secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    try {
      await axios.delete(`/api/secret?id=${secretId}`);
      setSecrets((prev) => prev.filter((s) => s.id !== secretId));
      setNotification({ type: "default", message: "✓ Secret deleted successfully" });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to delete secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    }
  };

  const createBranch = async () => {
    // Validation
    if (!newBranch.name.trim()) {
      setNotification({ type: "destructive", message: "Branch name is required" });
      return;
    }

    try {
      const res = await axios.post("/api/branch", {
        projectId,
        name: newBranch.name.trim(),
        description: newBranch.description.trim(),
      });
      const branch = res.data;
      setBranches((prev) => [...prev, branch]);
      setSelectedBranch(branch);
      setIsAddBranchOpen(false);
      setNewBranch({ name: "", description: "" });
      setNotification({ type: "default", message: "✓ Branch created successfully" });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to create branch";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    }
  };

  const toggleSecretVisibility = (secretId: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(secretId)) next.delete(secretId);
      else next.add(secretId);
      return next;
    });
  };

  const copyToClipboard = async (text: string, secretId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSecret(secretId);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch (err) {
      setNotification({ type: "destructive", message: "Failed to copy to clipboard" });
    }
  };

  const handleRevert = async (secret: Secret, version: SecretVersion) => {
    // Confirm revert? Maybe not needed for now as it's non-destructive (adds new version)

    try {
      const revertData = {
        key: secret.key, // Keep original key
        value: version.value,
        description: version.description,
        changeReason: `Reverted to v${version.version}`,
        environmentType: secret.environmentType,
        type: secret.type,
      };

      await axios.put(`/api/secret?id=${secret.id}`, revertData);

      // Update local state - maybe reload all secrets to be safe or update manually
      // Reloading secrets for simplicity to ensure history is clear
      const branchesRes = await axios.get(`/api/branch?projectId=${projectId}`);
      const branchData = branchesRes.data || [];
      const updatedBranch = branchData.find((b: any) => b.id === selectedBranch?.id);
      if (updatedBranch) {
        setSecrets(updatedBranch.secrets || []);
        // Also update historySecret if it's open, or close it
        const updatedSecret = updatedBranch.secrets.find((s: any) => s.id === secret.id);
        if (updatedSecret) {
          setHistorySecret(updatedSecret);
        }
      }

      setNotification({ type: "default", message: `✓ Reverted to version ${version.version} successfully` });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to revert secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    }
  };

  // --- Derived State ---

  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch =
      secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv === "all" || secret.environmentType === filterEnv;
    return matchesSearch && matchesEnv;
  });

  const stats = {
    total: secrets.length,
    production: secrets.filter((s) => s.environmentType === "production").length,
    autoRotate: secrets.filter((s) => s.rotationPolicy !== "manual").length,
    expiringSoon: secrets.filter((s) => {
      const daysUntilExpiry = Math.ceil((new Date(s.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    }).length,
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <Alert variant={notification.type}>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{project?.name}</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
            <p className="text-muted-foreground mt-1">{project?.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.location.href = `/projects/${project?.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setIsAddSecretOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Secret
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Secrets"
            value={stats.total}
            icon={Key}
            color="text-primary"
          />
          <StatCard
            title="Production"
            value={stats.production}
            icon={ShieldAlert}
            color="text-red-500"
          />
          <StatCard
            title="Auto-Rotation"
            value={stats.autoRotate}
            icon={RefreshCw}
            trend="Enabled"
            color="text-emerald-500"
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            icon={AlertCircle}
            color="text-amber-500"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Branch Selector */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedBranch?.id}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger className="border-0 bg-transparent font-medium">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              {/* Environment Filter */}
              <Select value={filterEnv} onValueChange={handleEnvChange}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={isRefreshing ? "animate-spin" : ""}
                title="Refresh Secrets"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search secrets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-0"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsAddBranchOpen(true)}>
                <GitBranch className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </div>
          </div>

          {/* Secrets Display */}
          {secrets.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSecrets.map((secret) => (
                    <SecretCard
                      key={secret.id}
                      secret={secret}
                      isVisible={visibleSecrets.has(secret.id)}
                      onToggleVisibility={() => toggleSecretVisibility(secret.id)}
                      onCopy={() => copyToClipboard(secret.value, secret.id)}
                      isCopied={copiedSecret === secret.id}
                      onEdit={() => {
                        setEditingSecret(secret);
                        setIsEditSecretOpen(true);
                      }}
                      onDelete={() => handleDeleteSecret(secret.id)}
                      onViewHistory={() => {
                        setHistorySecret(secret);
                        setIsHistoryOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredSecrets.map((secret) => (
                        <div
                          key={secret.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {(() => {
                              const Icon = SECRET_TYPES.find((t) => t.value === secret.type)?.icon || Key;
                              const color = SECRET_TYPES.find((t) => t.value === secret.type)?.color || "text-gray-500";
                              return (
                                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                              );
                            })()}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{secret.key}</p>
                              <p className="text-sm text-muted-foreground truncate">{secret.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <EnvironmentBadge environment={secret.environmentType} />
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSecretVisibility(secret.id)}
                              >
                                {visibleSecrets.has(secret.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(secret.value, secret.id)}
                              >
                                {copiedSecret === secret.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingSecret(secret); setIsEditSecretOpen(true); }}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setHistorySecret(secret); setIsHistoryOpen(true); }}>
                                    <History className="h-4 w-4 mr-2" /> History
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteSecret(secret.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">No secrets found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first secret to this branch"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddSecretOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Secret
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Secret Modal */}
      <Dialog
        isOpen={isAddSecretOpen}
        onClose={() => setIsAddSecretOpen(false)}
        title="Add New Secret"
        description={`Add a secret to ${selectedBranch?.name || "current branch"}`}
        className="max-w-lg"
      >
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rotation">Rotation</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                placeholder="DATABASE_URL"
                value={newSecret.key}
                onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea
                placeholder="Enter secret value..."
                value={newSecret.value}
                onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSecret.type}
                  onValueChange={(v) => setNewSecret({ ...newSecret, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECRET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          {type.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={newSecret.environmentType}
                  onValueChange={(v) => setNewSecret({ ...newSecret, environmentType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description..."
                value={newSecret.description}
                onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="rotation" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rotation Policy</Label>
              <div className="grid gap-3">
                {ROTATION_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${newSecret.rotationPolicy === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                      }`}
                    onClick={() => setNewSecret({ ...newSecret, rotationPolicy: option.value as any })}
                  >
                    <option.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {newSecret.rotationPolicy !== "manual" && (
              <div className="space-y-2">
                <Label>Rotation Interval</Label>
                <Select
                  value={newSecret.rotationType}
                  onValueChange={(v) => setNewSecret({ ...newSecret, rotationType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7-days">Every 7 days</SelectItem>
                    <SelectItem value="30-days">Every 30 days</SelectItem>
                    <SelectItem value="60-days">Every 60 days</SelectItem>
                    <SelectItem value="90-days">Every 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={newSecret.expiryDate}
                onChange={(e) => setNewSecret({ ...newSecret, expiryDate: e.target.value })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsAddSecretOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddSecret}>Create Secret</Button>
        </div>
      </Dialog>

      {/* Edit Secret Modal */}
      <Dialog
        isOpen={isEditSecretOpen}
        onClose={() => { setIsEditSecretOpen(false); setEditingSecret(null); }}
        title="Edit Secret"
        className="max-w-lg"
      >
        {editingSecret && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input value={editingSecret.key} onChange={(e) => setEditingSecret({ ...editingSecret, key: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea
                value={editingSecret.value}
                onChange={(e) => setEditingSecret({ ...editingSecret, value: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editingSecret.description} onChange={(e) => setEditingSecret({ ...editingSecret, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setIsEditSecretOpen(false); setEditingSecret(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditSecret}>Save Changes</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* History Modal */}
      <Dialog
        isOpen={isHistoryOpen}
        onClose={() => { setIsHistoryOpen(false); setHistorySecret(null); }}
        title="Version History"
        description={historySecret?.key}
        className="max-w-2xl"
      >
        {historySecret && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {historySecret.history?.map((version, idx) => (
              <div
                key={version.version}
                className={`p-4 rounded-lg border ${idx === 0 ? "border-primary bg-primary/5" : "border-border"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={idx === 0 ? "default" : "secondary"}>
                      v{version.version}
                    </Badge>
                    {idx === 0 && <Badge variant="outline">Current</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(version.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">By {version.updatedBy}</span>
                  {version.changeReason && (
                    <span className="ml-2 text-foreground">• {version.changeReason}</span>
                  )}
                </div>
                <code className="block bg-muted p-2 rounded text-xs font-mono truncate">
                  {version.value}
                </code>
                {idx !== 0 && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => historySecret && handleRevert(historySecret, version)}
                      className="h-7 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      Revert to this version
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {/* Add Branch Modal */}
      <Dialog
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        title="Create New Branch"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Branch Name</Label>
            <Input
              placeholder="feature/new-integration"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What is this branch for?"
              value={newBranch.description}
              onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddBranchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createBranch}>Create Branch</Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
};

export default VaultManager;