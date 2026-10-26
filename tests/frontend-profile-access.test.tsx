/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'usr_abc123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        tier: 'free',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/profile',
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock useUser context for member/viewer/owner across any workspace
let mockGlobalContext = {
  user: { id: 'usr_abc123', name: 'Jane Doe', email: 'jane@example.com', tier: 'free' },
  selectedWorkspace: { id: 'ws_newly_created', name: 'New Custom Workspace', workspaceType: 'custom' },
  workspaceRole: 'member',
  loading: false,
};

jest.mock('@/hooks/useUser', () => ({
  useGlobalContext: () => mockGlobalContext,
  useUser: () => mockGlobalContext,
}));

// Mock dashboard layout
jest.mock('@/components/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

describe('ProfilePage Access & Permission Tests', () => {
  it('allows an authenticated user to view their personal profile without "Access Denied"', async () => {
    render(<ProfilePage />);

    // Should NOT show Access Denied
    expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/This page is restricted to workspace admins and owners/i)).not.toBeInTheDocument();

    // Should show User Profile heading and personal details
    expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Access Keys/i).length).toBeGreaterThan(0);
  });

  it('renders user details properly even if workspace was newly created or role is not admin', async () => {
    mockGlobalContext = {
      user: { id: 'usr_abc123', name: 'Jane Doe', email: 'jane@example.com', tier: 'pro' },
      selectedWorkspace: { id: 'ws_brand_new', name: 'My Own Workspace' },
      workspaceRole: 'owner',
      loading: false,
    };

    render(<ProfilePage />);

    expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate New Key/i)).toBeInTheDocument();
  });
});
