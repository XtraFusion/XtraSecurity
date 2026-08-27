import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

// Mock useUser context
jest.mock('@/hooks/useUser', () => ({
    useUser: () => ({
        user: { id: 'usr_1', email: 'dev@xtrasecurity.io', tier: 'pro', name: 'Dev User' },
        selectedWorkspace: { id: 'ws_1', name: 'Dev Workspace', role: 'admin' },
        workspaceRole: 'admin',
    }),
    useGlobalContext: () => ({
        user: { id: 'usr_1', email: 'dev@xtrasecurity.io', tier: 'pro', name: 'Dev User' },
        selectedWorkspace: { id: 'ws_1', name: 'Dev Workspace', role: 'admin' },
        workspaceRole: 'admin',
    }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'dark', setTheme: jest.fn() }),
}));

describe('Frontend DashboardSidebar Navigation Integration Tests', () => {
    it('1. Renders primary branding and core navigation links', () => {
        render(<DashboardSidebar />);

        expect(screen.getAllByText(/XtraSecurity/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Projects/i)).toBeInTheDocument();
        expect(screen.getByText(/Teams/i)).toBeInTheDocument();
    });

    it('2. Displays Security section tools including Audit Logs & Secret Rotation', () => {
        render(<DashboardSidebar />);

        expect(screen.getByText(/Audit Logs/i)).toBeInTheDocument();
        expect(screen.getByText(/Rotation/i)).toBeInTheDocument();
    });

    it('3. Renders user details and active tier badge', () => {
        render(<DashboardSidebar />);

        expect(screen.getByText(/Dev User/i)).toBeInTheDocument();
        expect(screen.getAllByText(/PRO/i).length).toBeGreaterThan(0);
    });
});
