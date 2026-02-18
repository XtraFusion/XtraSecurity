import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

// GET /api/projects/[projectId]/kubernetes - Generate K8s Secret manifest
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const url = new URL(req.url);
    const environment = url.searchParams.get("env") || "development";
    const namespace = url.searchParams.get("namespace") || "default";
    const secretName = url.searchParams.get("name");
    const format = url.searchParams.get("format") || "yaml";

    // Get project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId
      },
      select: { name: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get secrets for environment
    const secrets = await prisma.secret.findMany({
      where: {
        projectId,
        environmentType: environment
      },
      select: {
        key: true,
        value: true
      }
    });

    if (secrets.length === 0) {
      return NextResponse.json({ error: "No secrets found" }, { status: 404 });
    }

    // Build secret data
    const data: Record<string, string> = {};
    
    for (const secret of secrets) {
      try {
        const encryptedValue = JSON.parse(secret.value[0]);
        const decryptedValue = decrypt(encryptedValue);
        // Base64 encode for K8s
        data[secret.key] = Buffer.from(decryptedValue).toString("base64");
      } catch {
        data[secret.key] = Buffer.from("").toString("base64");
      }
    }

    const k8sSecretName = secretName || `${project.name.toLowerCase().replace(/\s+/g, "-")}-${environment}`;

    if (format === "json") {
      // Return JSON format
      const manifest = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: k8sSecretName,
          namespace,
          labels: {
            "app.kubernetes.io/managed-by": "xtrasync",
            "xtrasync.io/project": project.name,
            "xtrasync.io/environment": environment
          }
        },
        type: "Opaque",
        data
      };

      return NextResponse.json(manifest);
    }

    // Return YAML format
    const yaml = `apiVersion: v1
kind: Secret
metadata:
  name: ${k8sSecretName}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: xtrasync
    xtrasync.io/project: "${project.name}"
    xtrasync.io/environment: ${environment}
type: Opaque
data:
${Object.entries(data).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
`;

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "kubernetes_export",
        entity: "project",
        entityId: projectId,
        changes: { environment, namespace, secretsCount: secrets.length }
      }
    });

    return new NextResponse(yaml, {
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": `attachment; filename="${k8sSecretName}.yaml"`
      }
    });

  } catch (error: any) {
    console.error("Kubernetes export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
