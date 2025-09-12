"use client";

import React, { useState } from 'react';
import { Trash2, UserPlus, Building2, AlertTriangle, Check, X } from 'lucide-react';
import { useParams } from 'next/navigation';
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

interface TransferWorkspaceData {
  workspaceId: string;
}

// Mock API functions - replace with actual API calls
const projectAPI = {
  transferToUser: async (projectId: string, data: TransferUserData): Promise<void> => {
    // POST /api/projects/{projectId}/transfer-user
    console.log('Transferring project to user:', data.email);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  },
  
  transferToWorkspace: async (projectId: string, data: TransferWorkspaceData): Promise<void> => {
    // POST /api/projects/{projectId}/transfer-workspace
    console.log('Transferring project to workspace:', data.workspaceId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  
  delete: async (projectId: string): Promise<void> => {
    // DELETE /api/projects/{projectId}
    console.log('Deleting project:', projectId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

interface ProjectSettingsProps {
  project: Project;
  onProjectDeleted?: () => void;
  onProjectTransferred?: () => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ 
  onProjectDeleted, 
  onProjectTransferred 
}) => {
  const {id} = useParams();

  const [project, setProject] = useState<any>({  });

  // State for transfer to user

  const [transferUserEmail, setTransferUserEmail] = useState('');
  const [isTransferringUser, setIsTransferringUser] = useState(false);
  
  // State for transfer to workspace
  const [transferWorkspaceId, setTransferWorkspaceId] = useState('');
  const [isTransferringWorkspace, setIsTransferringWorkspace] = useState(false);
  
  // State for project deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('delete');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success/error states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Clear messages after timeout
  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
  };


  // Handle transfer to user
  const handleTransferToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUserEmail.trim()) return;

    setIsTransferringUser(true);
    setErrorMessage('');
    
    try {
      await projectAPI.transferToUser(project.id, { email: transferUserEmail.trim() });
      setSuccessMessage(`Project transferred to ${transferUserEmail}`);
      setTransferUserEmail('');
      onProjectTransferred?.();
    } catch (error) {
      setErrorMessage('Failed to transfer project to user');
      clearMessages();
    } finally {
      setIsLoading(prev => ({ ...prev, transferUser: false }));
    }
  };

  const loadProject = async () => {
    const projects = await ProjectController.fetchProjects(id as string);
    if (projects.length > 0) {
      setProject(projects[0]);
    }
  };
  React.useEffect(() => {
    loadProject();
  } , [id]);

  // Handle transfer to workspace
  const handleTransferToWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferWorkspaceId.trim()) return;

    setIsTransferringWorkspace(true);
    setErrorMessage('');
    
    try {
      await projectAPI.transferToWorkspace(project.id, { workspaceId: transferWorkspaceId.trim() });
      setSuccessMessage(`Project transferred to workspace ${transferWorkspaceId}`);
      setTransferWorkspaceId('');
      onProjectTransferred?.();
    } catch (error) {
      setErrorMessage('Failed to transfer project to workspace');
      clearMessages();
    } finally {
      setIsLoading(prev => ({ ...prev, transferWorkspace: false }));
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (deleteConfirmText !== "delete") return;

    setIsDeleting(true);
    setErrorMessage('');
    
    try {
      await ProjectController.deleteProject(id);
      setSuccessMessage('Project deleted successfully');
      onProjectDeleted?.();
      router.push('/projects');
    } catch (error) {
      setErrorMessage('Failed to delete project');
      clearMessages();
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
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
    <div className="max-w-2xl mx-auto p-6 space-y-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Project Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage transfer and deletion options for "{project?.name}"
        </p>
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
      )}
      
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <X className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Transfer to User Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Transfer to User</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Transfer ownership of this project to another user by entering their email address.
        </p>
        
        <form onSubmit={handleTransferToUser} className="space-y-4">
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={newTeamMemberEmail}
              onChange={(e) => setNewTeamMemberEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isTransferringUser}
            />
          </div>
          
          <button
            type="submit"
            disabled={isTransferringUser || !transferUserEmail.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransferringUser ? 'Transferring...' : 'Transfer to User'}
          </button>
        </form>
      </div>

      {/* Transfer to Workspace Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-medium text-gray-900">Transfer to Workspace</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Move this project to a different workspace within your organization.
        </p>
        
        <form onSubmit={handleTransferToWorkspace} className="space-y-4">
          <div>
            <label htmlFor="workspace-id" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name or ID
            </label>
            <input
              type="text"
              id="workspace-id"
              value={transferWorkspaceId}
              onChange={(e) => setTransferWorkspaceId(e.target.value)}
              placeholder="workspace-name or ws-123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isTransferringWorkspace}
            />
          </div>
          
          <button
            type="submit"
            disabled={isTransferringWorkspace || !transferWorkspaceId.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransferringWorkspace ? 'Transferring...' : 'Transfer to Workspace'}
          </button>
        </form>
      </div>

      {/* Delete Project Section */}
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-medium text-gray-900">Delete Project</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete this project and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Project
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Confirm Project Deletion</span>
            </div>
            
            <p className="text-sm text-red-700">
              Type "{project?.name}" to confirm deletion:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={project?.name}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isDeleting}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting || deleteConfirmText !== "delete"}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;