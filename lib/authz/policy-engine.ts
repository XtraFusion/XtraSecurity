
import prisma from "@/lib/db";
import { AccessRequest, Decision } from "./types";

export class PolicyEngine {
  
  static async authorize(req: AccessRequest): Promise<Decision> {
    const { userId, projectId, resource, action, environment = "all", ip } = req;
    
    // 1. ABAC Policy Check (Simplified Check First)
    // Fetch active policies that apply
    // For MVP, we skip complex ABAC query and assume DENY only if explicit Deny Policy exists.
    // TODO: Implement full ABAC rule evaluation (IP, Time)
    
    // 2. RBAC Check
    // Get User Roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: userId,
        OR: [
          { projectId: projectId }, // Project-specific roles
          { projectId: null }       // Global roles
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    let hasAllow = false;
    let requiresElevation = false;

    // Evaluate permissions
    for (const ur of userRoles) {
       // Check expiry
       if (ur.expiresAt && new Date() > ur.expiresAt) continue;

       for (const rp of ur.role.permissions) {
          // Match Resource & Action
          if (rp.permission.resource !== resource) continue;
          
          // Match Action (Wildcard support?)
          if (rp.permission.action !== action && rp.permission.action !== "*") continue;

          // Match Environment
          if (rp.environment !== "all" && rp.environment !== environment) continue;
          
          // Check Constraints
          if (rp.constraints) {
             const c = rp.constraints as any;
             // Example: JIT Requirement
             if (c.requires_jit) {
                // Check if JIT session exists (This logic can be moved to JIT check, 
                // but Policy Engine should signal elevation required)
                requiresElevation = true;
                continue; 
             }
             if (c.requires_dual_auth) {
                 // TODO: Check context for MFA
             }
          }

          hasAllow = true;
       }
    }

    if (hasAllow) return Decision.ALLOW;
    if (requiresElevation) return Decision.REQUIRES_ELEVATION;

    // 3. Fallback: Check Direct JIT Grants (AccessRequest / active session)
    // We reuse the logic from Phase 9 but formalized here.
    // If we return DENY here, the API might double check JIT if it handled it separately,
    // but ideally the Engine handles everything.
    
    // If user has specific JIT grant for this secret/project:
    // (Phase 9 implementation checked AccessRequest directly in API. We should integrate it here eventually)
    // For now, return DENY and let fallback logic (if any) or JIT logic handle it. 
    // Wait, if I return DENY here, access is blocked.
    // Phase 9 logic in `secrets/route.ts` handled JIT check *after* standard RBAC check.
    // So if PolicyEngine says DENY, the route logic might still check JIT.
    // BUT, the goal is "Unified Authz".
    
    // Let's check AccessRequest here too.
    if (projectId) {
        const now = new Date();
        const activeJit = await prisma.accessRequest.findFirst({
            where: {
                userId,
                status: "approved",
                expiresAt: { gt: now },
                OR: [
                    { projectId },
                    { secretId: req.context?.secretId }
                ]
            }
        });
        if (activeJit) return Decision.ALLOW;
    }

    return Decision.DENY;
  }
}
