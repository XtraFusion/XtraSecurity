import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-middleware";
import {
  SecretService,
  SecretValidationError,
  SecretNotFoundError,
  SecretForbiddenError,
  SecretQuotaExceededError,
} from "@/lib/services/secret.service";

/**
 * Maps domain service errors to HTTP response envelopes
 */
function handleServiceError(error: any, fallbackMessage: string) {
  if (error instanceof SecretValidationError) {
    return NextResponse.json({ error: error.message, message: error.message }, { status: 400 });
  }
  if (error instanceof SecretNotFoundError) {
    return NextResponse.json({ error: error.message, message: error.message }, { status: 404 });
  }
  if (error instanceof SecretForbiddenError) {
    return NextResponse.json({ error: error.message, message: error.message }, { status: 403 });
  }
  if (error instanceof SecretQuotaExceededError) {
    return NextResponse.json({ error: error.errorName, message: error.message }, { status: 403 });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[SecretRoute] ${fallbackMessage}:`, errorMessage, error);
  return NextResponse.json(
    { error: fallbackMessage, message: fallbackMessage },
    { status: 500 }
  );
}

// GET /api/secret - Get all secrets for a project
export const GET = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    const branchId = searchParams.get("branchId");

    const secrets = await SecretService.listSecrets(session, { projectId, branchId });
    return NextResponse.json(secrets);
  } catch (error) {
    return handleServiceError(error, "Failed to fetch secrets");
  }
});

// POST /api/secret - Create a new secret
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const createdSecret = await SecretService.createSecret(session, body);
    return NextResponse.json(createdSecret, { status: 201 });
  } catch (error) {
    return handleServiceError(error, "Failed to create secret");
  }
});

// PUT /api/secret - Update a secret
export const PUT = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const body = await request.json();

    const updatedSecret = await SecretService.updateSecret(session, id, body);
    return NextResponse.json(updatedSecret, { status: 200 });
  } catch (error) {
    return handleServiceError(error, "Failed to update secret");
  }
});

// DELETE /api/secret - Delete a secret
export const DELETE = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    const result = await SecretService.deleteSecret(session, id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleServiceError(error, "Failed to delete secret");
  }
});
