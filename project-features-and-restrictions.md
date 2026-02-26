# XtraSecurity Project Features and Restrictions

This document provides a comprehensive list of features (operations) and restrictions associated with the XtraSecurity website application.

---

## 1. Project Management (`/projects`)
**Description**: Central hub for managing secure applications and their configurations.

### Features (Operations):
*   **Project Listing**: View all projects belonging to the selected workspace in Grid or List view.
*   **Project Search**: Real-time filtering by project name or description.
*   **Project Creation**: Create new projects with name and optional description.
*   **Secret Management**:
    *   **Create/Edit/Delete Secrets**: Manage key-value pairs with descriptions and tags.
    *   **Environment Segregation**: Categorize secrets into Development, Staging, or Production.
    *   **Version History**: Roll back to previous versions of a secret or audit changes.
    *   **Bulk Import/Export**: Import from `.env` text or export as `.env` / `.env.example` files.
    *   **Secret Masking**: Toggle visibility of secret values in the UI.
    *   **Secure Sharing**: Create time-limited, view-limited public links for specific secrets.
*   **Branch Management**:
    *   **Create/Delete Branches**: Support for multiple configuration environments (stems from Git-like workflow).
    *   **Switching Context**: Seamlessly toggle between development branches.
*   **Stale Secret Detection**: Visual indicators for secrets that haven't been updated in over 90 days.

### Restrictions:
*   **Authentication**: Login is strictly required to access the dashboard.
*   **Context Requirement**: A workspace must be active to view associated projects.
*   **Resource Limits**: Free tier limits the number of projects per workspace.
*   **Access Control**: Only users with 'Owner' or 'Admin' roles can delete projects.

---

## 2. Team Management (`/teams`)
**Description**: Collaboration platform for managing user access and organizational units.

### Features (Operations):
*   **Team Creation**: Create cross-functional teams with custom names, descriptions, and color-coded branding.
*   **Member Management**:
    *   **Invite Members**: Invite users via email to join specific teams.
    *   **Role Assignment**: Assign roles (Owner, Admin, Developer, Viewer) to control permissions.
    *   **Remove Members**: Revoke team access from existing users.
    *   **Resend Invites**: Reactivate pending invitations.
*   **Privacy Control**: Toggle between Public (accessible to workspace) and Private (invite-only) teams.
*   **Team Performance Stats**: Monitor member activity and project counts per team.

### Restrictions:
*   **Invite Permissions**: Only Team Owners and Admins can send invitations.
*   **Admin Floor**: Cannot remove the last Admin or Owner from a team to prevent orphaned accounts.
*   **Tier Quotas**: Team creation count is restricted based on the subscription plan (Free vs Pro).

---

## 3. Project Settings & Security (`/projects/[id]/settings`)
**Description**: Advanced configuration for hardening project security and lifecycle management.

### Features (Operations):
*   **Team Linking**: Add or remove entire teams to/from projects for bulk access management.
*   **Security Policy Enforcement**:
    *   **2FA Requirement**: Force two-factor authentication for all project members.
    *   **Credential Complexity**: Set min length and special character requirements for password secrets.
*   **IP Restricting**: Add/Remove specific IP addresses or CIDR ranges allowed to access the project's secrets.
*   **Webhooks**: Configure endpoints to receive notifications on secret changes or rotations.
*   **Service Accounts**: Create non-human accounts for CI/CD or server-side access.
*   **Data Maintenance**: "Clear" operations to wipe secrets while preserving branch/project structure.

### Restrictions:
*   **Role Gate**: Strictly restricted to 'Owner' or 'Admin' roles. Developers and Viewers are redirected.
*   **Destructive Guardrails**: Deletion or clearing data requires typing the project name as a confirmation string.
*   **IP Formatting**: Only valid IPv4/IPv6 or CIDR blocks are accepted.

---

## 4. Secret Rotation (`/rotation`)
**Description**: Automated lifecycle management for programmatic credentials.

### Features (Operations):
*   **Rotation Scheduling**: Configure automated secret updates (Daily, Weekly, Monthly, Quarterly, or Custom days).
*   **Rotation Methods**:
    *   **Auto-Generate**: System-generated secure random strings.
    *   **Webhook**: Trigger external API endpoints to coordinate rotation.
    *   **Manual**: On-demand "Rotate Now" functionality.
*   **Status Monitoring**: Real-time status toggle (Enabled/Disabled) and overdue alerts.
*   **Rotation History**: Searchable audit log of rotated secrets with duration and type (Scheduled vs Manual).
*   **Rollback Capability**: Restore previous secret versions if rotation causes downstream issues.

### Restrictions:
*   **Webhook Dependency**: Webhook URL is mandatory if that method is selected.
*   **Scoped Access**: Rotation schedules are pinned to specific project branches.

---

## 5. Compliance Reports (`/compliance`)
**Description**: Dedicated reporting module for security auditing and standards adherence.

### Features (Operations):
*   **SOC2/GDPR Report Generation**: Dynamic generation of compliance snapshots for the entire workspace.
*   **Security Configuration Summary**: At-a-glance view of 2FA requirements and audit logging status per project.
*   **Access Control Audit**: Detailed mapping of which users have access to which projects, including role levels and expiration dates.
*   **Rotation Overdue Tracking**: Compliance-centric list of all secrets failing to meet rotation deadlines.
*   **PDF Export**: Official print-friendly formatting for external auditors.

### Restrictions:
*   **Dynamic Generation**: Reports reflect the real-time state and must be manually generated to capture a snapshot.
*   **Admin Access**: Restricted to workspace-level administrators.

---

## 6. Just-In-Time (JIT) Access (`/access-requests`)
**Description**: Temporary elevated access workflow for sensitive production environments.

### Features (Operations):
*   **Access Request**: Request temporary access to a secret or project with a duration and justification.
*   **Approval Workflow**: Admins review pending requests in a specialized approval dashboard.
*   **Auto-Expiry**: Access is automatically revoked by the system once the requested duration elapses.
*   **Notification**: Real-time toast notifications for approval/rejection decisions.

### Restrictions:
*   **Time Bounds**: Duration is strictly enforced and cannot be altered once approved.
*   **Approval Hierarchy**: Users cannot approve their own requests.

---

## 7. Audit Logging (`/audit`)
**Description**: Immutable trail of all system activities for compliance and debugging.

### Features (Operations):
*   **Event Monitoring**: Real-time log of every secret read, edit, delete, and invitation.
*   **Search & Filter**: Find specific events by User identity, Event type (e.g., SECRET_ROTATION), or Timestamp.
*   **Event Detail View**: Inspect technical metadata associated with each audit entry.

### Restrictions:
*   **Immutability**: Logs are read-only and cannot be edited or deleted by any user level.
*   **Tier Restriction**: Detailed audit retention history may be limited by the subscription tier.

---

## 8. Subscription & Usage (`/subscription`)
**Description**: Commercial and resource monitoring portal.

### Features (Operations):
*   **Usage Tracking**: Monitor API request volume and resource counts (Workspaces, Teams, Projects) against plan limits.
*   **Plan Upgrading**: Transition between Free, Pro, and Enterprise tiers.
*   **Promo Application**: Apply discount codes during the checkout process.
*   **Payment History**: Integrated checkout via Razorpay with automated invoicing.

### Restrictions:
*   **Hard Quotas**: Exceeding daily API request limits results in a 429 status code for SDK/CLI operations.
*   **Downgrade Guard**: Users cannot downgrade from Pro to Free if their current resource count exceeds Free tier limits.
