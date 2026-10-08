import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth } from '@/lib/server-auth';
import { getUserProjectRole } from '@/lib/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await verifyAuth(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require admin access to configure integrations
    const role = await getUserProjectRole(session.userId, params.projectId);
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      provider,
      subject,
      environmentType,
      branchName,
      workloadPublicKey,
      encryptedProjectKey,
      envelopeIv,
      envelopeAuthTag
    } = body;

    if (!provider || !subject || !environmentType || !workloadPublicKey || !encryptedProjectKey) {
      return NextResponse.json({ error: 'Missing required OIDC trust policy fields' }, { status: 400 });
    }

    const trustPolicy = await prisma.oidcTrustPolicy.create({
      data: {
        projectId: params.projectId,
        provider,
        subject,
        environmentType,
        branchName: branchName || 'main',
        workloadPublicKey,
        encryptedProjectKey,
        envelopeIv,
        envelopeAuthTag
      }
    });

    return NextResponse.json(trustPolicy, { status: 201 });
  } catch (error: any) {
    console.error('Error creating OIDC trust policy:', error);
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await verifyAuth(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserProjectRole(session.userId, params.projectId);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const policies = await prisma.oidcTrustPolicy.findMany({
      where: { projectId: params.projectId }
    });

    return NextResponse.json(policies);
  } catch (error: any) {
    console.error('Error fetching OIDC trust policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
