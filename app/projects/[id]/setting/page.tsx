'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, UserPlus, Building2, AlertTriangle, Check, X, ArrowLeft, Users, GitBranch, Pencil } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectController } from '@/util/ProjectController';

// Types matching your project structure
interface Project {
  id: string;
  name: string;
  description: string;
  branches: string[];
  secrets: Record<string, Secret[]>;
  owner?: string;
  workspace?: string;
  teamMembers?: string[];
  securityLevel?: 'low' | 'medium' | 'high';
  accessControl?: 'private' | 'team' | 'public';
  auditLogging?: boolean;
  twoFactorRequired?: boolean;
  created_at?: string;
  updated_at?: string;
  lastSecurityAudit?: string;
}

interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environment_type: "development" | "staging" | "production";
  lastUpdated: string;
  updatedBy?: string;
  version: number;
  permission: string[];
  expiryDate: Date;
  rotationPolicy: string;
  type: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface ProjectSettingsProps {
  onProjectDeleted?: () => void;
  onProjectTransferred?: () => void;
}

// Custom UI Components (matching your project's component structure)
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, type = 'button', variant = 'primary', disabled, className = '' }) => {
  const baseClasses = 'px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    ghost: 'hover:bg-accent/10 text-accent-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', required, disabled, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    />
  </div>
);

const Select: React.FC<{
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}> = ({ label, value, onChange, options, disabled, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Project API wrapper with mock implementations
const projectApi = {
  ...ProjectController,
  updateProject: async (id: string, data: Partial<Project>): Promise<void> => {
    console.log('Updating project:', { id, data });
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  setDefaultBranch: async (id: string, branch: string): Promise<void> => {
    console.log('Setting default branch:', { id, branch });
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  addTeamMember: async (id: string, email: string): Promise<void> => {
    console.log('Adding team member:', { id, email });
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  transferToUser: async (projectId: string, email: string): Promise<void> => {
    console.log('Transferring project to user:', email);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  transferToWorkspace: async (projectId: string, workspaceId: string): Promise<void> => {
    console.log('Transferring project to workspace:', workspaceId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const ProjectSettings = ({ onProjectDeleted, onProjectTransferred }: ProjectSettingsProps): React.ReactElement => {
  const router = useRouter();
  const { id } = useParams();

  // Refs for scroll sections
  const generalRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const transferRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  // State management
  const [activeSection, setActiveSection] = useState<string>('general');
  const [project, setProject] = useState<Project | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  
  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newTeamMemberEmail, setNewTeamMemberEmail] = useState('');
  const [transferUserEmail, setTransferUserEmail] = useState('');
  const [transferWorkspaceId, setTransferWorkspaceId] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedDefaultBranch, setSelectedDefaultBranch] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState({
    rename: false,
    addTeamMember: false,
    transferUser: false,
    transferWorkspace: false,
    delete: false,
    setDefaultBranch: false
  });

  // UI states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Utility functions
  const showMessage = useCallback((text: string, type: Message['type']) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement>, section: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(section);
    }
  }, []);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        // Assuming ProjectController has a method to fetch single project
        const projects = await ProjectController.fetchProjects();
        const projectData = projects.find(p => p.id === id);
        
        if (projectData) {
          setProject(projectData);
          setNewProjectName(projectData.name);
          setNewProjectDescription(projectData.description || '');
          setSelectedDefaultBranch(projectData.branches[0] || '');
        } else {
          showMessage('Project not found', 'error');
        }
      } catch (error) {
        showMessage('Failed to load project data', 'error');
      }
    };

    loadProject();
  }, [id, showMessage]);

  // Event Handlers
  const handleUpdateProject = async (e: React.FormEvent | Partial<Project>) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    if (!project || !id) return;

    const updates = 'preventDefault' in e ? {
      name: newProjectName.trim(),
      description: newProjectDescription.trim()
    } : e;

    setIsLoading(prev => ({ ...prev, rename: true }));
    try {
      await projectApi.updateProject(id as string, updates);
      setProject({ 
        ...project,
        ...updates
      });
      showMessage('Project settings updated successfully', 'success');
    } catch (error) {
      showMessage('Failed to update project settings', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, rename: false }));
    }
  };

  const handleDefaultBranchChange = async (branchName: string) => {
    if (!id || !project) return;
    
    setIsLoading(prev => ({ ...prev, setDefaultBranch: true }));
    try {
      await projectApi.setDefaultBranch(id as string, branchName);
      // Update branches array to reflect new default
      const updatedBranches = [branchName, ...project.branches.filter(b => b !== branchName)];
      setProject({ ...project, branches: updatedBranches });
      setSelectedDefaultBranch(branchName);
      showMessage(`Default branch changed to ${branchName}`, 'success');
    } catch (error) {
      showMessage('Failed to change default branch', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, setDefaultBranch: false }));
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMemberEmail.trim() || !project || !id) return;

    setIsLoading(prev => ({ ...prev, addTeamMember: true }));
    try {
      await projectApi.addTeamMember(id as string, newTeamMemberEmail.trim());
      setProject({
        ...project,
        teamMembers: [...(project.teamMembers || []), newTeamMemberEmail.trim()]
      });
      showMessage('Team member added successfully', 'success');
      setNewTeamMemberEmail('');
    } catch (error) {
      showMessage('Failed to add team member', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, addTeamMember: false }));
    }
  };

  const handleTransferToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUserEmail.trim() || !project || !id) return;

    setIsLoading(prev => ({ ...prev, transferUser: true }));
    try {
      await projectApi.transferToUser(id as string, transferUserEmail.trim());
      showMessage('Project transferred successfully', 'success');
      setTransferUserEmail('');
      onProjectTransferred?.();
    } catch (error) {
      showMessage('Failed to transfer project', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, transferUser: false }));
    }
  };

  const handleTransferToWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferWorkspaceId.trim() || !project || !id) return;

    setIsLoading(prev => ({ ...prev, transferWorkspace: true }));
    try {
      await projectApi.transferToWorkspace(id as string, transferWorkspaceId.trim());
      showMessage('Project transferred to workspace successfully', 'success');
      setTransferWorkspaceId('');
      onProjectTransferred?.();
    } catch (error) {
      showMessage('Failed to transfer project to workspace', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, transferWorkspace: false }));
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project?.name || !id) return;

    setIsLoading(prev => ({ ...prev, delete: true }));
    try {
      await ProjectController.deleteProject(id as string);
      showMessage('Project deleted successfully', 'success');
      onProjectDeleted?.();
      router.push('/projects');
    } catch (error) {
      showMessage('Failed to delete project', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="loading-skeleton w-12 h-12 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading project settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar text-sidebar-foreground p-4 fixed h-full">
        <button
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
        
        <nav className="space-y-2">
          {[
            { key: 'general', label: 'General', ref: generalRef },
            { key: 'security', label: 'Security Controls', ref: generalRef },
            { key: 'team', label: 'Team & Access', ref: teamRef },
            { key: 'audit', label: 'Audit Settings', ref: generalRef },
            { key: 'branch', label: 'Branch Security', ref: branchRef },
            { key: 'transfer', label: 'Transfer Ownership', ref: transferRef },
            { key: 'delete', label: 'Delete Project', ref: deleteRef }
          ].map(({ key, label, ref }) => (
            <button
              key={key}
              onClick={() => scrollToSection(ref, key)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeSection === key 
                  ? 'bg-sidebar-primary/10 text-sidebar-primary' 
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-6 space-y-8 bg-background">
        {/* Page Header */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Project Security Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage security and access controls for "{project.name}"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                project.securityLevel === 'high' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : project.securityLevel === 'medium'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                Security Level: {project.securityLevel || 'Low'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                project.auditLogging
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {project.auditLogging ? 'Audit Logging Enabled' : 'Audit Logging Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md border animate-slide-up ${
            message.type === 'success' 
              ? 'bg-primary/10 border-primary/20 text-primary' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* General Section */}
        <div ref={generalRef} className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-lg transition-shadow duration-200">
          <div className="relative overflow-hidden rounded-t-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Pencil className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium text-card-foreground">General Settings</h2>
          </div>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <Input
              label="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              disabled={isLoading.rename}
            />
            <Input
              label="Project Description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Brief description of your project"
              disabled={isLoading.rename}
            />
            <Select
              label="Security Level"
              value={project.securityLevel || 'low'}
              onChange={(e) => handleUpdateProject({ ...project, securityLevel: e.target.value })}
              options={[
                { value: 'low', label: 'Low - Basic Security Controls' },
                { value: 'medium', label: 'Medium - Enhanced Security' },
                { value: 'high', label: 'High - Maximum Security' }
              ]}
            />
            <Select
              label="Access Control"
              value={project.accessControl || 'private'}
              onChange={(e) => handleUpdateProject({ ...project, accessControl: e.target.value })}
              options={[
                { value: 'private', label: 'Private - Owner Only' },
                { value: 'team', label: 'Team - Specified Members' },
                { value: 'public', label: 'Public - All Workspace Members' }
              ]}
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={project.auditLogging}
                  onChange={(e) => handleUpdateProject({ ...project, auditLogging: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Audit Logging</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={project.twoFactorRequired}
                  onChange={(e) => handleUpdateProject({ ...project, twoFactorRequired: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Require 2FA for Access</span>
              </label>
            </div>
            <Button
              type="submit"
              disabled={isLoading.rename || !newProjectName.trim() || (newProjectName === project.name && newProjectDescription === (project.description || ''))}
              className="mt-4"
            >
              {isLoading.rename ? 'Updating...' : 'Update Project'}
            </Button>
          </form>
        </div>

        {/* Team Section */}
        <div ref={teamRef} className="secret-card secret-card-hover p-6">
          <div className="secret-card-header"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Team Access Control</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              project.accessControl === 'private' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : project.accessControl === 'team'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {project.accessControl || 'Private'} Access
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Manage team access and security permissions. All changes are logged for audit purposes.
          </p>
          
          {/* Current team members */}
          {project.teamMembers && project.teamMembers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Current Members</h3>
              <div className="space-y-2">
                {project.teamMembers.map((member, index) => (
                  <div key={index} className="secret-value-container">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{member}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddTeamMember} className="space-y-4">
            <Input
              label="Add Team Member"
              type="email"
              value={newTeamMemberEmail}
              onChange={(e) => setNewTeamMemberEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isLoading.addTeamMember}
            />
            <Button
              type="submit"
              disabled={isLoading.addTeamMember || !newTeamMemberEmail.trim()}
            >
              {isLoading.addTeamMember ? 'Adding...' : 'Add Team Member'}
            </Button>
          </form>
        </div>

        {/* Branch Section */}
        <div ref={branchRef} className="secret-card secret-card-hover p-6">
          <div className="secret-card-header"></div>
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Branch Security</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Branch Protection</h3>
              <Select
                label="Protected Branch"
                value={selectedDefaultBranch}
                onChange={(e) => handleDefaultBranchChange(e.target.value)}
                options={project.branches.map(branch => ({
                  value: branch,
                  label: `${branch}${branch === project.branches[0] ? ' (current)' : ''}`
                }))}
                disabled={isLoading.setDefaultBranch}
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Branch Protection Rules</h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require pull request reviews</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require status checks</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include administrators</span>
                </label>
              </div>
            </div>
            {isLoading.setDefaultBranch && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Updating branch protection rules...</p>
            )}
          </div>
        </div>

        {/* Transfer Section */}
        <div ref={transferRef} className="space-y-6">
          {/* Transfer to User Section */}
          <div className="secret-card secret-card-hover p-6">
            <div className="secret-card-header"></div>
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transfer to User</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Transfer ownership of this project to another user by entering their email address.
            </p>
            <form onSubmit={handleTransferToUser} className="space-y-4">
              <Input
                label="Recipient Email Address"
                type="email"
                value={transferUserEmail}
                onChange={(e) => setTransferUserEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading.transferUser}
              />
              <Button
                type="submit"
                disabled={isLoading.transferUser || !transferUserEmail.trim()}
                variant="secondary"
              >
                {isLoading.transferUser ? 'Transferring...' : 'Transfer to User'}
              </Button>
            </form>
          </div>

          {/* Transfer to Workspace Section */}
          <div className="secret-card secret-card-hover p-6">
            <div className="secret-card-header"></div>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transfer to Workspace</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Move this project to a different workspace within your organization.
            </p>
            <form onSubmit={handleTransferToWorkspace} className="space-y-4">
              <Input
                label="Workspace Name or ID"
                value={transferWorkspaceId}
                onChange={(e) => setTransferWorkspaceId(e.target.value)}
                placeholder="workspace-name or ws-123456"
                required
                disabled={isLoading.transferWorkspace}
              />
              <Button
                type="submit"
                disabled={isLoading.transferWorkspace || !transferWorkspaceId.trim()}
                variant="secondary"
              >
                {isLoading.transferWorkspace ? 'Transferring...' : 'Transfer to Workspace'}
              </Button>
            </form>
          </div>
        </div>

        {/* Delete Section */}
        <div ref={deleteRef} className="bg-card/50 rounded-lg border border-destructive/20 p-6 hover:shadow-sm transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-medium text-destructive">Delete Project</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Permanently delete this project and all associated data. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
            >
              Delete Project
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Confirm Project Deletion</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Type "{project.name}" to confirm deletion:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.name}
                disabled={isLoading.delete}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteProject}
                  disabled={isLoading.delete || deleteConfirmText !== project.name}
                  variant="danger"
                >
                  {isLoading.delete ? 'Deleting...' : 'Delete Project'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isLoading.delete}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage(): React.ReactElement {
  return <ProjectSettings onProjectDeleted={() => {}} onProjectTransferred={() => {}} />;
}