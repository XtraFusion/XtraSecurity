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
  Terminal,
  FileKey,
  FileText,
  Download,
  CheckSquare,
  Share2,
  Link as LinkIcon,
  Loader2,
  GitCompare,
  ArrowRight
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
import { SecretHistoryModal } from "@/components/SecretHistoryModal";
import { AccessRequestModal } from "@/components/AccessRequestModal";
import { AccessRequestAdmin } from "@/components/AccessRequestAdmin";
import { JitGenerateModal } from "@/components/JitGenerateModal";

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
  currentUserRole?: string;
  workspaceId?: string;
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
  onRequestAccess,
  onShare,
  onGenerateJit,
}: {
  secret: Secret;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  onRequestAccess: () => void;
  onShare: () => void;
  onGenerateJit: () => void;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const SecretIcon = SECRET_TYPES.find((t) => t.value === secret.type)?.icon || Key;
  const iconColor = SECRET_TYPES.find((t) => t.value === secret.type)?.color || "text-gray-500";

  // Stale detection: flag secrets not updated in > 90 days
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(secret.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSinceUpdate > 90;

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

      {/* Stale Warning Banner */}
      {isStale && (
        <div className="absolute top-2 right-2 z-20">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Stale ({daysSinceUpdate}d)
          </div>
        </div>
      )}

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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewHistory} className="gap-2">
                <History className="h-4 w-4" /> History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare} className="gap-2 text-primary focus:text-primary">
                <Share2 className="h-4 w-4" /> Share Secret
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onGenerateJit} className="gap-2 text-amber-500 focus:text-amber-500">
                <Shield className="h-4 w-4" /> JIT Access
                <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1 border-amber-500/50 text-amber-500">PRO</Badge>
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
  const { user, selectedWorkspace, setSelectedWorkspace, workspaces } = useGlobalContext();

  const [project, setProject] = React.useState<Project | null>(null);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null);
  const [secrets, setSecrets] = React.useState<Secret[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false); // New state

  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Initialize filterEnv from URL or default to "all"
  const [filterEnv, setFilterEnv] = React.useState<string>(searchParams.get("env") || "all");

  const [visibleSecrets, setVisibleSecrets] = React.useState<Set<string>>(new Set());
  const [copiedSecret, setCopiedSecret] = React.useState<string | null>(null);

  // Modals
  const [isAddSecretOpen, setIsAddSecretOpen] = React.useState(false);
  const [isEditSecretOpen, setIsEditSecretOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isAccessRequestOpen, setIsAccessRequestOpen] = React.useState(false);
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = React.useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = React.useState(false);
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [editingSecret, setEditingSecret] = React.useState<Secret | null>(null);
  const [historySecret, setHistorySecret] = React.useState<Secret | null>(null);
  const [requestAccessSecret, setRequestAccessSecret] = React.useState<Secret | null>(null);

  const [notification, setNotification] = React.useState<{ type: "default" | "destructive"; message: string } | null>(null);

  const [newSecret, setNewSecret] = React.useState({
    key: "",
    value: "",
    description: "",
    environmentType: "development" as const,
    type: "API Key",
    rotationPolicy: "manual" as const,
    rotationType: "30-days",
    expiryDate: "",
  });

  const [newBranch, setNewBranch] = React.useState({ name: "", description: "" });
  const [addSecretTab, setAddSecretTab] = React.useState("details");
  const [envImportText, setEnvImportText] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);

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

  // Action Loading States
  const [isSavingSecret, setIsSavingSecret] = React.useState(false);
  const [isEditingSecret, setIsEditingSecret] = React.useState(false);
  const [deletingSecretId, setDeletingSecretId] = React.useState<string | null>(null);
  const [secretToDelete, setSecretToDelete] = React.useState<Secret | null>(null);
  const [isCreatingBranch, setIsCreatingBranch] = React.useState(false);

  // Bulk Select State
  const [isBulkSelectMode, setIsBulkSelectMode] = React.useState(false);
  const [selectedSecretIds, setSelectedSecretIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  // Env Sync Modal State
  const [isEnvSyncOpen, setIsEnvSyncOpen] = React.useState(false);

  // Share State
  const [shareSecret, setShareSecret] = React.useState<Secret | null>(null);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [shareExpiry, setShareExpiry] = React.useState("24");
  const [shareMaxViews, setShareMaxViews] = React.useState<string>("1");
  const [shareLabel, setShareLabel] = React.useState("");
  const [isCreatingShare, setIsCreatingShare] = React.useState(false);
  const [shareResult, setShareResult] = React.useState<{ url: string; expiresAt: string } | null>(null);
  const [shareCopied, setShareCopied] = React.useState(false);

  // JIT Generate Modal State
  const [isJitModalOpen, setIsJitModalOpen] = React.useState(false);

  // Copy & Compare Modals State
  const [isCopyModalOpen, setIsCopyModalOpen] = React.useState(false);
  const [copySourceEnv, setCopySourceEnv] = React.useState("all");
  const [copyTargetBranch, setCopyTargetBranch] = React.useState("");
  const [copyTargetEnv, setCopyTargetEnv] = React.useState("all");
  const [copyOverwrite, setCopyOverwrite] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);

  const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);
  const [compareTargetBranch, setCompareTargetBranch] = React.useState("");
  const [isComparing, setIsComparing] = React.useState(false);
  const [compareResults, setCompareResults] = React.useState<{
    added: any[];
    removed: any[];
    modified: any[];
  } | null>(null);

  // --- Data Loading ---

  const loadProject = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      // Simulate API calls
      const [projectRes, branchesRes] = await Promise.all([
        ProjectController.fetchProjects(projectId),
        axios.get(`/api/branch?projectId=${projectId}`),
      ]);

      // Auto-switch workspace if needed
      if (projectRes && selectedWorkspace && projectRes.workspaceId !== selectedWorkspace.id) {
        console.log("Auto-switching workspace context:", projectRes.workspaceId);
        const targetWorkspace = workspaces.find((w: any) => w.id === projectRes.workspaceId);
        if (targetWorkspace) {
          setSelectedWorkspace(targetWorkspace);
        }
      }

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
      }

      setProject({
        id: projectId,
        name: projectRes?.name || "Project",
        description: projectRes?.description || "",
        currentUserRole: projectRes?.currentUserRole,
        workspaceId: projectRes?.workspaceId,
      });
    } catch (error) {
      setNotification({ type: "destructive", message: "Failed to load project data" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, searchParams, selectedWorkspace, workspaces, setSelectedWorkspace, selectedBranch]); // Added dependencies

  // Initial Load - minimal dependency
  React.useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Watch for notification clear
  React.useEffect(() => {
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

    setIsSavingSecret(true);
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
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to create secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    } finally {
      setIsSavingSecret(false);
    }
  };

  const handleBulkImport = async () => {
    if (!envImportText.trim()) {
      setNotification({ type: "destructive", message: "Please paste .env content to import" });
      return;
    }
    if (!selectedBranch) {
      setNotification({ type: "destructive", message: "Please select a branch first" });
      return;
    }

    // Parse dotenv format text
    const lines = envImportText.split('\n');
    const parsedSecrets: any[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();

        // Remove surrounding quotes if they exist
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }

        parsedSecrets.push({
          key,
          value: val,
          description: "Imported from .env",
          environmentType: newSecret.environmentType,
          type: "API Key",
          projectId: projectId as string,
          branchId: selectedBranch.id,
          rotationPolicy: "manual",
        });
      }
    }

    if (parsedSecrets.length === 0) {
      setNotification({ type: "destructive", message: "No valid keys found in input" });
      return;
    }

    setIsImporting(true);
    try {
      const response = await axios.post("/api/secret/bulk", {
        projectId: projectId as string,
        branchId: selectedBranch.id,
        secrets: parsedSecrets,
      });

      const createdSecrets = response.data.secrets;

      // Add the created secrets to local state
      setSecrets((prev) => [...createdSecrets, ...prev]);
      setIsAddSecretOpen(false);
      setEnvImportText("");
      setAddSecretTab("details");
      setNotification({ type: "default", message: `✓ ${createdSecrets.length} secrets imported successfully` });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to import secrets";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    } finally {
      setIsImporting(false);
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

    setIsEditingSecret(true);
    try {
      await axios.put(`/api/secret?id=${editingSecret.id}`, editingSecret);
      setSecrets((prev) => prev.map((s) => (s.id === editingSecret.id ? editingSecret : s)));
      setIsEditSecretOpen(false);
      setEditingSecret(null);
      setNotification({ type: "default", message: "✓ Secret updated successfully" });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    } finally {
      setIsEditingSecret(false);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    setDeletingSecretId(secretId);
    try {
      await axios.delete(`/api/secret?id=${secretId}`);
      setSecrets((prev) => prev.filter((s) => s.id !== secretId));
      setNotification({ type: "default", message: "✓ Secret deleted successfully" });
      setSecretToDelete(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to delete secret";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    } finally {
      setDeletingSecretId(null);
    }
  };

  const confirmDeleteSecret = () => {
    if (secretToDelete) handleDeleteSecret(secretToDelete.id);
  };

  // Feature 1: Export as .env
  const handleExportEnv = () => {
    const secretsToExport = filteredSecrets.length > 0 ? filteredSecrets : secrets;
    if (secretsToExport.length === 0) {
      setNotification({ type: "destructive", message: "No secrets to export" });
      return;
    }
    const lines = [
      `# XtraSecurity Export — Branch: ${selectedBranch?.name || "unknown"}`,
      `# Exported at: ${new Date().toISOString()}`,
      "",
      ...secretsToExport.map((s) => {
        const safeValue = s.value.includes(" ") || s.value.includes("#") ? `"${s.value}"` : s.value;
        return `${s.key}=${safeValue}`;
      }),
    ];
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.env.${selectedBranch?.name || "export"}`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: "default", message: `✓ Exported ${secretsToExport.length} secrets` });
  };

  // Feature 1b: Export as .env.example
  const handleExportEnvExample = () => {
    const secretsToExport = filteredSecrets.length > 0 ? filteredSecrets : secrets;
    if (secretsToExport.length === 0) {
      setNotification({ type: "destructive", message: "No secrets to export" });
      return;
    }
    const lines = [
      `# .env.example — XtraSecurity | Branch: ${selectedBranch?.name || "unknown"}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Replace placeholder values with your actual secrets before use.`,
      "",
      ...secretsToExport.map((s) => `${s.key}=`),
    ];
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.example";
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: "default", message: `✓ .env.example exported with ${secretsToExport.length} keys` });
  };

  // Feature 3: Share a secret
  const handleShare = (secret: Secret) => {
    setShareSecret(secret);
    setShareResult(null);
    setShareExpiry("24");
    setShareMaxViews("1");
    setShareLabel("");
    setShareCopied(false);
    setIsShareOpen(true);
  };

  const createShareLink = async () => {
    if (!shareSecret) return;
    setIsCreatingShare(true);
    try {
      const response = await axios.post("/api/secret/share", {
        secretId: shareSecret.id,
        expiresInHours: parseInt(shareExpiry),
        maxViews: shareMaxViews === "unlimited" ? null : parseInt(shareMaxViews),
        label: shareLabel || null,
      });
      setShareResult({ url: response.data.shareUrl, expiresAt: response.data.expiresAt });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to create share link";
      setNotification({ type: "destructive", message: `✗ ${errorMsg}` });
    } finally {
      setIsCreatingShare(false);
    }
  };

  // Feature 2: Bulk Delete
  const toggleBulkSelect = () => {
    setIsBulkSelectMode((prev) => !prev);
    setSelectedSecretIds(new Set()); // Clear selection on toggle
  };

  const toggleSecretSelect = (id: string) => {
    setSelectedSecretIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSecretIds.size === filteredSecrets.length) {
      setSelectedSecretIds(new Set());
    } else {
      setSelectedSecretIds(new Set(filteredSecrets.map((s) => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedSecretIds.size === 0) return;
    setIsBulkDeleteConfirmOpen(true); // show confirm first
  };

  const doHandleBulkDelete = async () => {
    setIsBulkDeleteConfirmOpen(false);
    setIsBulkDeleting(true);
    let successCount = 0;
    try {
      for (const id of Array.from(selectedSecretIds)) {
        try {
          await axios.delete(`/api/secret?id=${id}`);
          successCount++;
        } catch (e) {
          // continue with others
        }
      }
      setSecrets((prev) => prev.filter((s) => !selectedSecretIds.has(s.id)));
      setSelectedSecretIds(new Set());
      setIsBulkSelectMode(false);
      setNotification({ type: "default", message: `✓ Deleted ${successCount} secrets` });
    } catch (error: any) {
      setNotification({ type: "destructive", message: "Some secrets could not be deleted" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Copy Secrets Feature
  const handleCopySecrets = async () => {
    if (!selectedBranch) return;
    if (!copyTargetBranch) {
      setNotification({ type: "destructive", message: "Please select a target branch" });
      return;
    }
    setIsCopying(true);
    try {
      const res = await axios.post("/api/secret/copy", {
        sourceBranchId: selectedBranch.id,
        targetBranchId: copyTargetBranch,
        sourceEnvironment: copySourceEnv,
        targetEnvironment: copyTargetEnv,
        overwrite: copyOverwrite
      });
      setNotification({ type: "default", message: res.data.message });
      setIsCopyModalOpen(false);
      if (copyTargetBranch === selectedBranch.id) {
        handleRefresh(); // refresh if copied to same branch (different env)
      }
    } catch (e: any) {
      setNotification({ type: "destructive", message: e.response?.data?.error || "Failed to copy secrets" });
    } finally {
      setIsCopying(false);
    }
  };

  // Compare Branches Feature
  const handleCompareBranches = async () => {
    if (!selectedBranch || !compareTargetBranch) return;
    setIsComparing(true);
    try {
      const res = await axios.get(`/api/branch/compare?base=${selectedBranch.id}&compare=${compareTargetBranch}`);
      setCompareResults(res.data);
    } catch (e: any) {
      setNotification({ type: "destructive", message: "Failed to load comparison" });
    } finally {
      setIsComparing(false);
    }
  };

  const createBranch = async () => {
    // Validation
    if (!newBranch.name.trim()) {
      setNotification({ type: "destructive", message: "Branch name is required" });
      return;
    }

    setIsCreatingBranch(true);
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
    } finally {
      setIsCreatingBranch(false);
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

  // handleRevert removed as rollback is handled inside SecretHistoryModal

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
            <Button variant="outline" onClick={() => setIsDocsOpen(true)}>
              <Terminal className="h-4 w-4 mr-2" />
              CLI Setup
            </Button>
            {/* Permission Check for Settings/Requests */}
            {(project?.currentUserRole === 'owner' || project?.currentUserRole === 'admin') && (
              <Button variant="outline" onClick={() => window.location.href = `/projects/${project?.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
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
          {/* Toolbar - Restructured into 2 rows */}
          <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border/50">
            {/* Row 1: Branch/Env filters + Search + View toggle */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Branch Selector */}
              <Select value={selectedBranch?.id} onValueChange={handleBranchChange}>
                <SelectTrigger className="w-full sm:w-[190px] h-10 bg-background/50 hover:bg-muted/50 border-border/50 transition-colors font-medium">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-left"><SelectValue placeholder="Select branch" /></span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-px h-6 bg-border/50 hidden sm:block" />

              {/* Environment Filter */}
              <Select value={filterEnv} onValueChange={handleEnvChange}>
                <SelectTrigger className="w-full sm:w-[190px] h-10 bg-background/50 hover:bg-muted/50 border-border/50 transition-colors font-medium">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-left"><SelectValue placeholder="All Environments" /></span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search secrets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background/50 border-border/50 transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-border/50 rounded-lg p-1 bg-background/50 h-10 shrink-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-full px-2.5 transition-colors ${viewMode === "grid" ? "shadow-sm bg-background border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-full px-2.5 transition-colors ${viewMode === "list" ? "shadow-sm bg-background border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Row 2: Action buttons */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 p-0 border-border/50 bg-background/50 hover:bg-muted/50 transition-colors"
                title="Refresh Secrets"
              >
                <RotateCcw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              </Button>

              <div className="h-6 w-px bg-border/50" />

              {isBulkSelectMode ? (
                <>
                  <Button variant="outline" size="sm" className="h-9" onClick={toggleSelectAll}>
                    {selectedSecretIds.size === filteredSecrets.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9"
                    disabled={selectedSecretIds.size === 0 || isBulkDeleting}
                    onClick={handleBulkDelete}
                  >
                    {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete ({selectedSecretIds.size})
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9" onClick={toggleBulkSelect}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={handleExportEnv}>
                    <Download className="h-4 w-4 mr-2 text-muted-foreground" /> Export .env
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={handleExportEnvExample}>
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" /> .env.example
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={() => setIsEnvSyncOpen(true)}>
                    <Activity className="h-4 w-4 mr-2 text-muted-foreground" /> Env Sync
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={() => setIsCopyModalOpen(true)}>
                    <Copy className="h-4 w-4 mr-2 text-muted-foreground" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={() => setIsCompareModalOpen(true)}>
                    <GitCompare className="h-4 w-4 mr-2 text-muted-foreground" /> Compare
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={toggleBulkSelect}>
                    <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" /> Select
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 font-medium" onClick={() => setIsJitModalOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" /> JIT Link
                    <Badge variant="outline" className="ml-1.5 text-[9px] h-4 px-1 border-amber-500/50 text-amber-500">PRO</Badge>
                  </Button>

                  <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-9 border-border/50 bg-background/50 hover:bg-muted/50 font-medium" onClick={() => setIsAddBranchOpen(true)}>
                      <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" /> New Branch
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Secrets Display */}
          {secrets.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSecrets.map((secret) => (
                    <div key={secret.id} className="relative">
                      {isBulkSelectMode && (
                        <div
                          className={`absolute inset-0 z-10 rounded-xl border-2 cursor-pointer transition-colors ${selectedSecretIds.has(secret.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30"}`}
                          onClick={() => toggleSecretSelect(secret.id)}
                        >
                          <div className="absolute top-3 left-3">
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${selectedSecretIds.has(secret.id) ? "bg-primary border-primary" : "bg-background border-muted-foreground/40"}`}>
                              {selectedSecretIds.has(secret.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          </div>
                        </div>
                      )}
                      <SecretCard
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
                        onRequestAccess={() => {
                          setRequestAccessSecret(secret);
                          setIsAccessRequestOpen(true);
                        }}
                        onShare={() => handleShare(secret)}
                        onGenerateJit={() => setIsJitModalOpen(true)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredSecrets.map((secret) => (
                        <div
                          key={secret.id}
                          className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${isBulkSelectMode ? "cursor-pointer" : ""} ${isBulkSelectMode && selectedSecretIds.has(secret.id) ? "bg-primary/5" : ""}`}
                          onClick={isBulkSelectMode ? () => toggleSecretSelect(secret.id) : undefined}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {isBulkSelectMode && (
                              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${selectedSecretIds.has(secret.id) ? "bg-primary border-primary" : "bg-background border-muted-foreground/40"}`}>
                                {selectedSecretIds.has(secret.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                            )}
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
                                  <DropdownMenuItem onClick={() => setIsJitModalOpen(true)} className="text-amber-600">
                                    <Shield className="h-4 w-4 mr-2" /> Generate JIT Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setSecretToDelete(secret)}
                                    className="text-destructive cursor-pointer"
                                  >
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
        onClose={() => { setIsAddSecretOpen(false); setEnvImportText(""); setAddSecretTab("details"); }}
        title="Add New Secret"
        description={`Add a secret to ${selectedBranch?.name || "current branch"}`}
        className="max-w-lg"
      >
        <Tabs value={addSecretTab} onValueChange={setAddSecretTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rotation">Rotation</TabsTrigger>
            <TabsTrigger value="import">Import .env</TabsTrigger>
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

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Paste .env Content</Label>
                  <div>
                    <input
                      type="file"
                      id="env-upload"
                      className="hidden"
                      accept=".env,text/plain"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setEnvImportText(e.target?.result as string);
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('env-upload')?.click()}>
                      <FileText className="h-4 w-4 mr-2" /> Upload File
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Format: KEY=VALUE. Lines starting with # are ignored. Secrets will be imported into the currently selected Environment above.
                </div>
                <Textarea
                  placeholder={`API_KEY=your-secret-key\nDATABASE_URL=postgres://...\n# This is a comment`}
                  value={envImportText}
                  onChange={(e) => setEnvImportText(e.target.value)}
                  className="font-mono min-h-[150px] sm:min-h-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Environment</Label>
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => { setIsAddSecretOpen(false); setEnvImportText(""); setAddSecretTab("details"); }}>
            Cancel
          </Button>
          {addSecretTab === "import" ? (
            <Button onClick={handleBulkImport} disabled={isImporting || !envImportText.trim()}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Secrets
            </Button>
          ) : (
            <Button onClick={handleAddSecret} disabled={isSavingSecret}>
              {isSavingSecret && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Secret
            </Button>
          )}
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
              <Button onClick={handleEditSecret} disabled={isEditingSecret}>
                {isEditingSecret && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* History Modal */}
      <SecretHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projectId={projectId}
        env={historySecret?.environmentType || ""}
        secretKey={historySecret?.key || ""}
        onRollbackSuccess={() => loadProject(true)}
      />

      {/* CLI Setup Docs Modal */}
      <Dialog
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        title="CLI Setup Instructions"
        className="max-w-2xl"
      >
        <div className="space-y-4 flex flex-col max-h-[70vh] pr-2 overflow-y-auto mt-4">
          <p className="text-sm text-muted-foreground">
            Use the Xtra CLI to sync secrets directly to your local development environment. These commands are tailored to your currently selected branch and environment.
          </p>

          <div className="space-y-2 border rounded-lg p-4 bg-card">
            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">1</span>
              Login to Xtra CLI
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Authenticate your machine with your Xtra account.</p>
            <div className="relative group">
              <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50">
                xtra login
              </pre>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard("xtra login", "cmd-1")}>
                {copiedSecret === "cmd-1" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-card">
            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">2</span>
              Link Project
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Configure your current directory to pull secrets from this project.</p>
            <div className="relative group">
              <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50">
                xtra projects set {projectId}
              </pre>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard(`xtra projects set ${projectId}`, "cmd-2")}>
                {copiedSecret === "cmd-2" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 border rounded-lg p-4 bg-card h-full flex flex-col justify-between">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">3</span>
                  Set Active Branch
                </Label>
                <p className="text-xs text-muted-foreground mb-2 mt-2">Switch your CLI context to pull from this specific branch.</p>
              </div>
              <div className="relative group mt-auto">
                <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50">
                  xtra checkout {selectedBranch ? selectedBranch.name : 'main'}
                </pre>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard(`xtra checkout ${selectedBranch ? selectedBranch.name : "main"}`, "cmd-3")}>
                  {copiedSecret === "cmd-3" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-4 bg-card h-full flex flex-col justify-between">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">4</span>
                  Set Environment
                </Label>
                <p className="text-xs text-muted-foreground mb-2 mt-2">Set your default environment profile for this directory.</p>
              </div>
              <div className="relative group mt-auto">
                <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50">
                  xtra profile --env {filterEnv === 'all' ? 'development' : filterEnv}
                </pre>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard(`xtra profile --env ${filterEnv === "all" ? "development" : filterEnv}`, "cmd-4")}>
                  {copiedSecret === "cmd-4" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-card">
            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">5</span>
              Run with Injected Secrets (Recommended)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Securely inject secrets natively using the CLI without creating vulnerable .env files.</p>
            <div className="relative group">
              <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50 whitespace-pre-wrap">
                xtra run -e {filterEnv === 'all' ? 'development' : filterEnv} -b {selectedBranch ? selectedBranch.name : 'main'} -- npm run dev
              </pre>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard(`xtra run -e ${filterEnv === "all" ? "development" : filterEnv} -b ${selectedBranch ? selectedBranch.name : "main"} -- npm run dev`, "cmd-5")}>
                {copiedSecret === "cmd-5" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-card">
            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="flex items-center justify-center bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs shrink-0">6</span>
              Sync to .env.local (Alternative)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Pull down the secrets to an offline .env.local file if injection won't work.</p>
            <div className="relative group">
              <pre className="p-3 rounded-md bg-muted/80 font-mono text-sm overflow-x-auto text-foreground border border-border/50">
                xtra local sync -e {filterEnv === 'all' ? 'development' : filterEnv} -b {selectedBranch ? selectedBranch.name : 'main'}
              </pre>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm" onClick={() => copyToClipboard(`xtra local sync -e ${filterEnv === "all" ? "development" : filterEnv} -b ${selectedBranch ? selectedBranch.name : "main"}`, "cmd-6")}>
                {copiedSecret === "cmd-6" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-2">
            <Button onClick={() => setIsDocsOpen(false)}>Done</Button>
          </div>
        </div>
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
            <Button onClick={createBranch} disabled={isCreatingBranch}>
              {isCreatingBranch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Branch
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Custom Delete Confirmation Modal */}
      {secretToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !deletingSecretId && setSecretToDelete(null)}>
          <div
            className="bg-background w-full max-w-md flex flex-col rounded-lg border shadow-lg overflow-hidden m-4 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <Trash2 className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Delete Secret</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete the secret <strong>{secretToDelete.key}</strong>? This action cannot be undone and will permanently remove all of its version history.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSecretToDelete(null)} disabled={!!deletingSecretId}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteSecret} disabled={!!deletingSecretId}>
                {deletingSecretId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Env Sync Modal */}
      {isEnvSyncOpen && (() => {
        const envs = ["development", "staging", "production"] as const;
        const keysByEnv: Record<string, Set<string>> = {};
        for (const env of envs) {
          keysByEnv[env] = new Set(secrets.filter(s => s.environmentType === env).map(s => s.key));
        }
        const allKeys = new Set(secrets.map(s => s.key));
        const syncIssues: { key: string; missingIn: string[] }[] = [];
        for (const key of Array.from(allKeys)) {
          const missingIn = envs.filter(env => !keysByEnv[env].has(key));
          if (missingIn.length > 0) {
            syncIssues.push({ key, missingIn });
          }
        }
        const envColors: Record<string, string> = {
          development: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
          staging: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
          production: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsEnvSyncOpen(false)}>
            <div className="bg-background w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border shadow-lg overflow-hidden m-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary" /> Environment Sync Status
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Keys that exist in some environments but are missing in others</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEnvSyncOpen(false)}>✕</Button>
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30">
                {envs.map(env => (
                  <div key={env} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${envColors[env]}`}>
                    <span className="capitalize">{env}</span>
                    <span className="font-bold">{keysByEnv[env].size} keys</span>
                  </div>
                ))}
                <div className="ml-auto text-sm text-muted-foreground">
                  {syncIssues.length === 0
                    ? <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="h-4 w-4" /> All in sync!</span>
                    : <span className="text-amber-600 font-medium">{syncIssues.length} keys out of sync</span>
                  }
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4">
                {syncIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Check className="h-7 w-7 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-lg">All environments are in sync</h3>
                    <p className="text-sm text-muted-foreground mt-1">Every secret key exists across all three environments.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {syncIssues.map(({ key, missingIn }) => (
                      <div key={key} className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                          <code className="font-mono text-sm font-medium truncate">{key}</code>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className="text-xs text-muted-foreground">Missing in:</span>
                          {missingIn.map(env => (
                            <span key={env} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${envColors[env]}`}>
                              {env}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Based on {secrets.length} secret(s) in <strong>{selectedBranch?.name || "current"}</strong> branch
                </p>
                <Button onClick={() => setIsEnvSyncOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Delete Confirmation */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)}>
          <div
            className="bg-background w-full max-w-md flex flex-col rounded-xl border shadow-xl overflow-hidden m-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2 text-destructive">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Delete {selectedSecretIds.size} Secret{selectedSecretIds.size > 1 ? "s" : ""}?</h2>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <div className="my-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg max-h-40 overflow-y-auto">
              {Array.from(selectedSecretIds).map(id => {
                const s = secrets.find(sec => sec.id === id);
                return s ? (
                  <div key={id} className="flex items-center gap-2 py-1 text-sm">
                    <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <code className="font-mono text-foreground">{s.key}</code>
                    <span className="text-xs text-muted-foreground ml-auto">{s.environmentType}</span>
                  </div>
                ) : null;
              })}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doHandleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete {selectedSecretIds.size} Secret{selectedSecretIds.size > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Secret Dialog */}
      {isShareOpen && shareSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !isCreatingShare && setIsShareOpen(false)}>
          <div
            className="bg-background w-full max-w-md flex flex-col rounded-xl border shadow-xl overflow-hidden m-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Share Secret</h2>
                  <p className="text-xs text-muted-foreground font-mono">{shareSecret.key}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsShareOpen(false)}>✕</Button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!shareResult ? (
                <>
                  {/* Expiry */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Expires After</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[["1h", "1"], ["24h", "24"], ["7d", "168"], ["30d", "720"]].map(([label, val]) => (
                        <button
                          key={val}
                          onClick={() => setShareExpiry(val)}
                          className={`py-2 rounded-lg border text-sm font-medium transition-colors ${shareExpiry === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Views */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Max Views</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[["1x", "1"], ["5x", "5"], ["10x", "10"], ["∞", "unlimited"]].map(([label, val]) => (
                        <button
                          key={val}
                          onClick={() => setShareMaxViews(val)}
                          className={`py-2 rounded-lg border text-sm font-medium transition-colors ${shareMaxViews === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Label */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Note (optional)</Label>
                    <Input
                      placeholder="e.g. for new dev onboarding"
                      value={shareLabel}
                      onChange={e => setShareLabel(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsShareOpen(false)}>Cancel</Button>
                    <Button onClick={createShareLink} disabled={isCreatingShare}>
                      {isCreatingShare ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                      Generate Link
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                    Share link created!
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Share URL</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2.5 font-mono break-all">{shareResult.url}</code>
                      <Button
                        size="sm"
                        variant={shareCopied ? "default" : "outline"}
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard?.writeText(shareResult.url);
                          setShareCopied(true);
                          setTimeout(() => setShareCopied(false), 2000);
                        }}
                      >
                        {shareCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                    <div>⏱ Expires: {new Date(shareResult.expiresAt).toLocaleString()}</div>
                    <div>👁 Max views: {shareMaxViews === "unlimited" ? "Unlimited" : shareMaxViews}</div>
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <Button variant="outline" onClick={() => setShareResult(null)}>Create Another</Button>
                    <Button onClick={() => setIsShareOpen(false)}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Secrets Modal */}
      <Dialog
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Secrets"
        description="Duplicate secrets from the current branch to another branch or environment."
        className="max-w-md"
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
            <span>Source ({selectedBranch?.name})</span>
            <ArrowRight className="h-4 w-4" />
            <span>Target</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Environment</Label>
              <Select value={copySourceEnv} onValueChange={setCopySourceEnv}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Environment</Label>
              <Select value={copyTargetEnv} onValueChange={setCopyTargetEnv}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Keep Original</SelectItem>
                  <SelectItem value="development">Force Development</SelectItem>
                  <SelectItem value="staging">Force Staging</SelectItem>
                  <SelectItem value="production">Force Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label>Target Branch</Label>
            <Select value={copyTargetBranch} onValueChange={setCopyTargetBranch}>
              <SelectTrigger><SelectValue placeholder="Select target branch" /></SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mt-4 border p-3 rounded-lg bg-card">
            <input
              type="checkbox"
              id="overwrite-toggle"
              checked={copyOverwrite}
              onChange={(e) => setCopyOverwrite(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="overwrite-toggle" className="cursor-pointer font-normal m-0 text-foreground">
              Overwrite existing secrets (Conflict resolution)
            </Label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setIsCopyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCopySecrets} disabled={isCopying || !copyTargetBranch}>
              {isCopying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Copy Secrets
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Compare Branches Modal */}
      <Dialog
        isOpen={isCompareModalOpen}
        onClose={() => { setIsCompareModalOpen(false); setCompareResults(null); }}
        title="Compare Branches"
        description="See what secrets have changed between your current branch and another."
        className="max-w-3xl"
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Base Branch</Label>
              <div className="font-medium bg-background border rounded px-3 py-2 text-sm">
                {selectedBranch?.name}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground mt-4 shrink-0" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Compare With</Label>
              <Select value={compareTargetBranch} onValueChange={setCompareTargetBranch}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.filter(b => b.id !== selectedBranch?.id).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-4 shrink-0"
              onClick={handleCompareBranches}
              disabled={isComparing || !compareTargetBranch}
            >
              {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
            </Button>
          </div>

          {compareResults && (
            <div className="space-y-6 mt-6">
              {/* Added */}
              {compareResults.added.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Added in {branches.find(b => b.id === compareTargetBranch)?.name} ({compareResults.added.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden divide-y text-sm">
                    {compareResults.added.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">{s.environmentType.substring(0, 3)}</Badge>
                          <span className="font-mono">{s.key}</span>
                        </div>
                        <span className="text-muted-foreground text-xs truncate max-w-[200px]">New Secret</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed */}
              {compareResults.removed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Missing from {branches.find(b => b.id === compareTargetBranch)?.name} ({compareResults.removed.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden divide-y text-sm">
                    {compareResults.removed.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-950/20">
                        <div className="flex items-center gap-2">
                          <span className="line-through text-muted-foreground font-mono">{s.key}</span>
                        </div>
                        <Badge variant="outline" className="text-xs text-red-500 border-red-200">Missing</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified */}
              {compareResults.modified.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
                    <Edit2 className="h-4 w-4" /> Modified values ({compareResults.modified.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden divide-y text-sm">
                    {compareResults.modified.map((s, i) => (
                      <div key={i} className="flex flex-col p-3 bg-amber-50/50 dark:bg-amber-950/20 gap-2">
                        <div className="font-mono font-medium">{s.key}</div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-background rounded p-2 border border-red-100 dark:border-red-900/30 line-through text-muted-foreground overflow-hidden text-ellipsis">
                            {s.baseValue.substring(0, 15)}...
                          </div>
                          <div className="bg-background rounded p-2 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 overflow-hidden text-ellipsis">
                            {s.compareValue.substring(0, 15)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {compareResults.added.length === 0 && compareResults.removed.length === 0 && compareResults.modified.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  <Check className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p>Both branches have identical secrets.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* JIT Generate Modal */}
      <JitGenerateModal
        open={isJitModalOpen}
        onOpenChange={setIsJitModalOpen}
        projectId={projectId}
        branches={branches}
        secrets={secrets}
        currentBranchId={selectedBranch?.id}
        currentEnv={filterEnv !== "all" ? filterEnv : undefined}
      />
    </DashboardLayout>
  );
};

export default VaultManager;