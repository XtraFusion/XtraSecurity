/**
 * Secret Domain & Application Service
 * Encapsulates business logic, RBAC checks, rate limit quotas, audit logging,
 * and background event dispatching according to SOLID principles.
 */

import prisma from "@/lib/db";
import { AuthSession } from "@/lib/server-auth";
import { getUserProjectRole, getUserSecretAccess } from "@/lib/permissions";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { queueSecretSync } from "@/lib/queue/sync-queue";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/engine";
import { SecretCryptoStrategy } from "@/lib/crypto/secret-crypto";

// ==========================================
// Domain Errors
// ==========================================
export class SecretValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretValidationError";
  }
}

export class SecretNotFoundError extends Error {
  constructor(message: string = "Secret not found") {
    super(message);
    this.name = "SecretNotFoundError";
  }
}

export class SecretForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "SecretForbiddenError";
  }
}

export class SecretQuotaExceededError extends Error {
  public readonly errorName: string;
  constructor(errorName: string, message: string) {
    super(message);
    this.name = "SecretQuotaExceededError";
    this.errorName = errorName;
  }
}

// ==========================================
// DTOs (Interface Segregation Principle)
// ==========================================
export interface ListSecretsFilter {
  projectId: string;
  branchId?: string | null;
}

export interface CreateSecretInput {
  key: string;
  value: string;
  description?: string;
  environmentType: string;
  projectId: string;
  type?: string;
  branchId?: string | null;
  permission?: string[];
  expiryDate?: string | Date | null;
  rotationPolicy?: string;
  rotationType?: string;
}

export interface UpdateSecretInput {
  key?: string;
  value?: string;
  description?: string;
  environmentType?: string;
  type?: string;
  permission?: string[];
  expiryDate?: string | Date | null;
  rotationPolicy?: string;
  changeReason?: string;
}

export class SecretService {
  /**
   * Retrieves all secrets for a project with RBAC redaction and decryption.
   */
  public static async listSecrets(session: AuthSession, filter: ListSecretsFilter) {
    const { projectId, branchId } = filter;

    if (!projectId) {
      throw new SecretValidationError("Project ID is required");
    }

    // Access Control
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) {
        throw new SecretForbiddenError("Forbidden: SA locked to project");
      }
      if (!session.permissions?.includes("read:secrets")) {
        throw new SecretForbiddenError("Forbidden: Missing read:secrets scope");
      }
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role) {
        throw new SecretForbiddenError("Forbidden");
      }
    }

    const query: any = { projectId };
    if (branchId) query.branchId = branchId;

    const secrets = await prisma.secret.findMany({
      where: query,
      include: {
        project: true,
      },
    });

    // Decrypt secrets & history with per-secret access check (handles JIT)
    const decryptedSecrets = await Promise.all(
      secrets.map(async (secret) => {
        const access = await getUserSecretAccess(session.userId, projectId, secret.id);
        const shouldRedact = !access.hasAccess || (access.role === "viewer" && !access.isJit);

        if (shouldRedact) {
          return SecretCryptoStrategy.redactForViewer(secret);
        }

        const decryptedValue = SecretCryptoStrategy.decryptValue(secret.value, secret.projectId);
        const decryptedHistory = SecretCryptoStrategy.decryptHistory(secret.history, secret.projectId);

        return {
          ...secret,
          value: decryptedValue,
          history: decryptedHistory,
          isJit: access.isJit,
          expiresAt: access.expiresAt,
        };
      })
    );

    return decryptedSecrets;
  }

  /**
   * Creates a new secret with input validation, quota enforcement, and event dispatch.
   */
  public static async createSecret(session: AuthSession, input: CreateSecretInput) {
    const {
      key,
      value,
      description,
      environmentType,
      projectId,
      type,
      branchId,
      permission = [],
      expiryDate,
      rotationPolicy = "manual",
    } = input;

    // Validation
    if (!key || !value || !projectId || !environmentType) {
      throw new SecretValidationError("Missing required fields (key, value, projectId, environmentType)");
    }

    if (typeof key === "string" && key.length > 256) {
      throw new SecretValidationError("Secret key cannot exceed 256 characters");
    }

    if (typeof key === "string" && !/^[A-Za-z0-9_.-]+$/.test(key)) {
      throw new SecretValidationError("Secret key contains illegal characters");
    }

    if (typeof value === "string" && value.length > 1024 * 1024) {
      throw new SecretValidationError("Secret value exceeds maximum allowable size (1MB)");
    }

    const cleanKey = key.toUpperCase().trim().replace(/\s+/g, "_");
    const cleanDescription = (description || "").trim();

    // Verify Project Exists
    const projectRecord = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    if (!projectRecord) {
      throw new SecretNotFoundError("Project not found");
    }

    // Rate Limiting Quota Check
    const ownerTier = (session.tier || "free") as Tier;
    const projectSecretsCount = await prisma.secret.count({ where: { projectId } });
    const resolvedMaxSecrets = DAILY_LIMITS[ownerTier]?.maxSecretsPerProject ?? DAILY_LIMITS.free.maxSecretsPerProject;

    if (projectSecretsCount >= resolvedMaxSecrets) {
      throw new SecretQuotaExceededError(
        `Project secret limit reached (${projectSecretsCount}/${resolvedMaxSecrets}).`,
        `The workspace owner's ${ownerTier} plan allows up to ${resolvedMaxSecrets} secrets per project. Please upgrade to add more.`
      );
    }

    // Access Control
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) {
        throw new SecretForbiddenError("Forbidden: SA locked to project");
      }
      if (!session.permissions?.includes("write:secrets")) {
        throw new SecretForbiddenError("Forbidden: Missing write:secrets scope");
      }
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role) {
        throw new SecretForbiddenError("Forbidden: You do not have access to this project");
      }
      if (role === "viewer") {
        throw new SecretForbiddenError("Viewers do not have permission to create secrets");
      }
      if (role === "developer" && environmentType === "production") {
        throw new SecretForbiddenError("Developers cannot create secrets in Production");
      }
    }

    // Encrypt payload
    const encryptedString = SecretCryptoStrategy.encryptValue(value);

    // Save to Database
    const newSecret = await prisma.secret.create({
      data: {
        key: cleanKey,
        value: [encryptedString],
        description: cleanDescription,
        environmentType,
        version: "1",
        projectId,
        branchId: branchId || null,
        rotationPolicy,
        type: type || "API Key",
        history: [
          {
            version: "1",
            value: [encryptedString],
            description: cleanDescription,
            updatedAt: new Date().toISOString(),
            updatedBy: session.email,
          },
        ],
        updatedBy: session.email,
        permission,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    // Trigger Distributed Sync
    await queueSecretSync(newSecret.id);

    // Audit Logging
    try {
      await logAudit(
        "SECRET_CREATED",
        session.userId,
        projectId,
        { secretId: newSecret.id, key: newSecret.key, environment: environmentType, branchId },
        projectRecord.workspaceId
      );
    } catch (e) {
      console.error("[SecretService] Audit log failed:", e);
    }

    // Notification Dispatch
    try {
      await notify({
        type: "secret_change",
        title: "Secret Created",
        message: `Secret "${key}" was created by ${session.email}`,
        description: `New secret added to environment "${environmentType}"`,
        severity: "info",
        workspaceId: projectRecord.workspaceId || "",
        projectId: projectId,
        branch: branchId || undefined,
        metadata: { key, environmentType, type: type || "API Key" },
        fields: [
          { label: "Key", value: key },
          { label: "Environment", value: environmentType },
          { label: "Created By", value: session.email || "" },
        ],
      });
    } catch (notifErr) {
      console.error("[SecretService] Failed to trigger notification for secret creation:", notifErr);
    }

    return SecretCryptoStrategy.maskSecret(newSecret, "[encrypted]");
  }

  /**
   * Updates an existing secret, increments version history, and dispatches events.
   */
  public static async updateSecret(session: AuthSession, id: string, input: UpdateSecretInput) {
    if (!id) {
      throw new SecretValidationError("Secret ID is required");
    }

    const {
      key,
      value,
      description,
      environmentType,
      type,
      permission,
      expiryDate,
      rotationPolicy,
      changeReason,
    } = input;

    // Verify secret exists
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingSecret) {
      throw new SecretNotFoundError("Secret not found");
    }

    const projectId = existingSecret.projectId;

    // Access Control
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) {
        throw new SecretForbiddenError("Forbidden: SA locked to project");
      }
      if (!session.permissions?.includes("write:secrets")) {
        throw new SecretForbiddenError("Forbidden: Missing write:secrets scope");
      }
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role) {
        throw new SecretForbiddenError("Forbidden: You do not have access to this project");
      }
      if (role === "viewer") {
        throw new SecretForbiddenError("Viewers do not have permission to update secrets");
      }
      if (role === "developer" && existingSecret.environmentType === "production") {
        throw new SecretForbiddenError("Developers cannot update secrets in Production");
      }
    }

    // Versioning
    const history = Array.isArray(existingSecret.history) ? existingSecret.history : [];
    const newVersion = (parseInt(existingSecret.version || "1") + 1).toString();

    const updateData: any = {
      version: newVersion,
      updatedBy: session.email,
    };

    if (key) updateData.key = key;
    if (description !== undefined) updateData.description = description;
    if (environmentType) updateData.environmentType = environmentType;
    if (type) updateData.type = type;
    if (permission) updateData.permission = permission;
    if (rotationPolicy) updateData.rotationPolicy = rotationPolicy;
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);

    // Value Encryption
    if (value) {
      const encryptedString = SecretCryptoStrategy.encryptValue(value);
      updateData.value = [encryptedString];
    }

    // Append to version history
    updateData.history = [
      {
        version: newVersion,
        value: value ? [SecretCryptoStrategy.encryptValue(value)] : existingSecret.value || "[unchanged]",
        description: description || existingSecret.description,
        updatedAt: new Date().toISOString(),
        updatedBy: session.email,
        changeReason,
      },
      ...history,
    ];

    const updatedSecret = await prisma.secret.update({
      where: { id },
      data: updateData,
    });

    // Trigger Distributed Sync
    await queueSecretSync(updatedSecret.id);

    // Audit Logging
    try {
      await logAudit(
        "SECRET_UPDATED",
        session.userId,
        projectId,
        {
          secretId: updatedSecret.id,
          key: updatedSecret.key,
          environment: updatedSecret.environmentType,
          branchId: updatedSecret.branchId,
          version: updatedSecret.version,
        },
        existingSecret.project?.workspaceId
      );
    } catch (e) {
      console.error("[SecretService] Audit log failed:", e);
    }

    // Notification Dispatch
    try {
      await notify({
        type: "secret_change",
        title: "Secret Updated",
        message: `Secret "${existingSecret.key}" was updated by ${session.email}`,
        description: `Modifications made to secret in "${existingSecret.environmentType}"`,
        severity: "warning",
        workspaceId: existingSecret.project?.workspaceId || "",
        projectId: existingSecret.projectId,
        branch: existingSecret.branchId || undefined,
        metadata: { key: existingSecret.key, id },
        fields: [
          { label: "Key", value: existingSecret.key },
          { label: "Updated By", value: session.email || "" },
          { label: "Environment", value: existingSecret.environmentType },
        ],
      });
    } catch (notifErr) {
      console.error("[SecretService] Failed to trigger notification for secret update:", notifErr);
    }

    return {
      ...updatedSecret,
      value: "[encrypted]",
      history: undefined,
    };
  }

  /**
   * Deletes a secret and logs critical audit events.
   */
  public static async deleteSecret(session: AuthSession, id: string) {
    if (!id) {
      throw new SecretValidationError("Secret ID is required");
    }

    const existingSecret = await prisma.secret.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingSecret) {
      throw new SecretNotFoundError("Secret not found");
    }

    const projectId = existingSecret.projectId;

    // Access Control
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) {
        throw new SecretForbiddenError("Forbidden: SA locked to project");
      }
      if (!session.permissions?.includes("write:secrets")) {
        throw new SecretForbiddenError("Forbidden: Missing write:secrets scope");
      }
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role) {
        throw new SecretForbiddenError("Forbidden: You do not have access to this project");
      }
      if (role === "viewer") {
        throw new SecretForbiddenError("Viewers do not have permission to delete secrets");
      }
      if (role === "developer" && existingSecret.environmentType === "production") {
        throw new SecretForbiddenError("Developers cannot delete secrets in Production");
      }
    }

    await prisma.secret.delete({
      where: { id },
    });

    // Audit Logging
    try {
      await logAudit(
        "SECRET_DELETED",
        session.userId,
        projectId,
        {
          secretId: existingSecret.id,
          key: existingSecret.key,
          environment: existingSecret.environmentType,
          branchId: existingSecret.branchId,
        },
        existingSecret.project?.workspaceId
      );
    } catch (e) {
      console.error("[SecretService] Audit log failed:", e);
    }

    // Notification Dispatch
    try {
      await notify({
        type: "secret_change",
        title: "Secret Deleted",
        message: `Secret "${existingSecret.key}" was deleted by ${session.email}`,
        description: `Permanent removal of secret from "${existingSecret.environmentType}"`,
        severity: "critical",
        workspaceId: existingSecret.project?.workspaceId || "",
        projectId: existingSecret.projectId,
        branch: existingSecret.branchId || undefined,
        metadata: { key: existingSecret.key },
        fields: [
          { label: "Key", value: existingSecret.key },
          { label: "Deleted By", value: session.email || "" },
          { label: "Environment", value: existingSecret.environmentType },
        ],
      });
    } catch (notifErr) {
      console.error("[SecretService] Failed to trigger notification for secret deletion:", notifErr);
    }

    return { message: "Secret deleted successfully" };
  }
}
