import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { PolicyEngine } from "@/lib/authz/policy-engine";
import { Decision } from "@/lib/authz/types";
import { encrypt, decrypt } from "@/lib/encription";
import { triggerWebhooks } from "@/lib/webhook";

export const dynamic = 'force-dynamic';

export const GET = withSecurity(async (
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; env: string }> },
  session
) => {
  // Await params first (Next.js 15+ requirement)
  const { projectId, env } = await params;

  // 1. Authentication
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.userId;

  // 2. Authorization via Policy Engine
  const decision = await PolicyEngine.authorize({
      userId,
      projectId: projectId,
      resource: "secret",
      action: "value.read", // We assume 'value.read' for fetching
      environment: env
  });

  if (decision === Decision.DENY) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  
  // If Requires Elevation, checking strictly
  if (decision === Decision.REQUIRES_ELEVATION) {
      return NextResponse.json({ 
          error: "JIT Elevation Required", 
          action: "request_jit"
      }, { status: 403 });
  }

  // 3. Determine whether the caller can see plaintext values
  // Roles that allow reading plaintext: owner, admin, developer
  // viewer role can see key names only — values are masked
  const PLAINTEXT_ROLES = ["owner", "admin", "developer"];

  const callerRole = await prisma.userRole.findFirst({
    where: {
      userId,
      OR: [{ projectId }, { projectId: null }]
    },
    select: {
      role: { select: { name: true } }
    }
  });

  const roleName = callerRole?.role?.name?.toLowerCase() || "viewer";
  const canReadValues = PLAINTEXT_ROLES.includes(roleName);

  // 4. Authorization Success - Fetch Data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
        secrets: {
            include: { sourceSecret: true }
        }
    }
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });


  // 3. Filter Secrets
  const branchName = req.nextUrl.searchParams.get("branch") || "main";
  
  // Find branch ID
  const branch = await prisma.branch.findFirst({
      where: { 
          projectId: projectId,
          name: branchName 
      }
  });

  if (!branch) {
      // If branch specified doesn't exist, return empty or error?
      // For now returning empty list if strict, or maybe fall back?
      // Let's return empty if branch not found to be safe.
      return NextResponse.json({});
      // Or:
      // return NextResponse.json({ error: `Branch '${branchName}' not found` }, { status: 404 });
  }

  let envSecrets = project.secrets.filter(
    (s) => s.environmentType.toLowerCase() === env.toLowerCase() && 
           (s.branchId === branch.id || (branch.name === "main" && s.branchId === null))
  );

  // 4. Return formatted key-values
  const includeVersions = req.nextUrl.searchParams.get("includeVersions") === "true";
  
  if (includeVersions) {
      const detailedMap: Record<string, { value: string, version: string, isReference?: boolean, source?: string }> = {};
      envSecrets.forEach(secret => {
         let value = "";
         let rawValue = "";
         if (secret.isReference && secret.sourceSecret && secret.sourceSecret.value.length > 0) {
             rawValue = secret.sourceSecret.value[0];
         } else if (secret.value.length > 0) {
             rawValue = secret.value[0]; 
         }

         if (rawValue) {
             let decryptedValue = "";
             try {
                const encryptedObj = JSON.parse(rawValue);
                if (encryptedObj.iv && encryptedObj.encryptedData && encryptedObj.authTag) {
                    decryptedValue = decrypt(encryptedObj);
                } else {
                    decryptedValue = rawValue;
                }
             } catch (e) {
                 decryptedValue = rawValue;
             }

            detailedMap[secret.key] = { 
                value: canReadValues ? decryptedValue : "***",
                version: secret.version,
                isReference: secret.isReference,
                source: secret.isReference ? "linked" : "local"
            }; 
         }
      });
      return NextResponse.json(detailedMap);
  }

  const secretsMap: Record<string, string> = {};
  
  envSecrets.forEach(secret => {
     let rawValue = "";
     if (secret.isReference && secret.sourceSecret && secret.sourceSecret.value.length > 0) {
        rawValue = secret.sourceSecret.value[0];
     } else if (secret.value.length > 0) {
        rawValue = secret.value[0]; 
     }

     if (rawValue) {
        if (!canReadValues) {
            // Viewer role: expose key name but mask value
            secretsMap[secret.key] = "***";
        } else {
            try {
                const encryptedObj = JSON.parse(rawValue);
                if (encryptedObj.iv && encryptedObj.encryptedData && encryptedObj.authTag) {
                    secretsMap[secret.key] = decrypt(encryptedObj);
                } else {
                    secretsMap[secret.key] = rawValue;
                }
            } catch (e) {
                secretsMap[secret.key] = rawValue;
            }
        }
     }
  });

  // Attach viewer hint header so CLI can warn the user
  const headers: Record<string, string> = {};
  if (!canReadValues) {
    headers["X-Values-Masked"] = "true";
    headers["X-Mask-Reason"] = "viewer-role";
  }

  return NextResponse.json(secretsMap, { headers });
});

// POST logic also refactored to use verifyAuth
export const POST = withSecurity(async (
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; env: string }> },
  session
) => {
  // Await params first (Next.js 15+ requirement)
  const { projectId, env } = await params;

  // 1. Authentication
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.userId;

  // 2. RBAC Write Check — only owner, admin, developer can write secrets
  const WRITE_ROLES = ["owner", "admin", "developer"];

  const callerWriteRole = await prisma.userRole.findFirst({
    where: {
      userId,
      OR: [{ projectId }, { projectId: null }]
    },
    select: { role: { select: { name: true } } }
  });

  const writeRoleName = callerWriteRole?.role?.name?.toLowerCase() || "viewer";

  if (!WRITE_ROLES.includes(writeRoleName)) {
    return NextResponse.json(
      { error: "Forbidden: Your role does not permit writing secrets." },
      { status: 403 }
    );
  }

  // 3. Verify user has access to this project
  const project = await prisma.project.findFirst({
    where: { id: projectId }
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 3. Parse Body
  const body = await req.json();
  const secretsToUpdate: Record<string, string> = body.secrets || body; // Fallback
  const expectedVersions: Record<string, string> = body.expectedVersions || {};

  const type = "environment"; // default type
  const environmentType = env;

  const results = [];
  const conflicts: any[] = [];

  // 3.0 Resolve Branch
  const branchName = secretsToUpdate.branch || body.branch || req.nextUrl.searchParams.get("branch") || "main";
  
  // Remove special fields from payload if mixed (cleanup)
  if (secretsToUpdate.branch) delete secretsToUpdate.branch;

  const targetBranch = await prisma.branch.findFirst({
      where: { 
          projectId: project.id,
          name: branchName
      }
  });

  if (!targetBranch) {
      return NextResponse.json({ error: `Branch '${branchName}' not found` }, { status: 404 });
  }
  
  const targetBranchId = targetBranch.id;

  // 3.1 Check for conflicts first (Atomic check)
  for (const [key, value] of Object.entries(secretsToUpdate)) {
      const existing = await prisma.secret.findFirst({
          where: {
              projectId: project.id,
              key: key,
              environmentType: environmentType,
          }
      });

      if (existing && expectedVersions[key]) {
          if (existing.version !== expectedVersions[key]) {
              conflicts.push({
                  key,
                  expected: expectedVersions[key],
                  actual: existing.version,
                  remoteValue: existing.value[0] || ""
              });
          }
      }
  }

  if (conflicts.length > 0) {
      return NextResponse.json({ 
          error: "Conflict detected", 
          conflicts 
      }, { status: 409 });
  }

  // 4. Upsert Secrets
  for (const [key, value] of Object.entries(secretsToUpdate)) {
    // Check if secret exists (efficiently reused or fetched again - simplified for now)
    const existing = await prisma.secret.findFirst({
      where: {
        projectId: project.id,
        key: key,
        environmentType: environmentType,
        OR: targetBranch.name === "main" ? [
             { branchId: targetBranchId },
             { branchId: null }
            ] : [
             { branchId: targetBranchId }
            ]
      }
    });

    // Encrypt
    const encryptedValue = encrypt(value as string);
    const encryptedString = JSON.stringify(encryptedValue);

    if (existing) {
      // Update
      try {
        let newVersion = "2";
        if (existing.version && !isNaN(parseInt(existing.version))) {
             newVersion = (parseInt(existing.version) + 1).toString();
        }

        const historyEntry = {
            version: newVersion,
            value: [encryptedString], // Store NEW encrypted value
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            description: "Updated via CLI"
        };
        
        const currentHistory = Array.isArray(existing.history) ? existing.history : [];

        const updated = await prisma.secret.update({
            where: { id: existing.id },
            data: {
                value: [encryptedString],
                version: newVersion,
                updatedBy: userId,
                // Ensure branchId is set
                branchId: existing.branchId || targetBranchId, 
                history: [...currentHistory, historyEntry] // Append new version
            }
        });
        
        // Trigger Webhook (async, non-blocking)
        triggerWebhooks(project.id, "secret.update", {
          key: existing.key,
          environment: environmentType,
          branch: branchName,
          version: newVersion,
          updatedBy: userId
        });

        results.push(updated);
      } catch (err: any) {
        console.error("Update failed:", err);
        // ... err handling
      }
    } else {
      // Create
      const created = await prisma.secret.create({
        data: {
            key: key,
            value: [encryptedString],
            environmentType: environmentType,
            projectId: project.id,
            branchId: targetBranchId,
            type: "environment",
            description: "Created via CLI",
            version: "1",
            updatedBy: userId,
            rotationPolicy: "manual",
            history: [
                {
                    version: "1",
                    value: [encryptedString],
                    updatedAt: new Date().toISOString(),
                    updatedBy: userId,
                    description: "Created via CLI"
                }
            ]
        }
      });

      // Trigger Webhook
      triggerWebhooks(project.id, "secret.create", {
        key: key,
        environment: environmentType,
        branch: branchName,
        version: "1",
        updatedBy: userId
      });

      results.push(created);
    }
  }

  return NextResponse.json({ success: true, count: results.length });
});
