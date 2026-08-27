import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock context values interface
export interface MockUserContextType {
    user: any;
    setUser: jest.Mock;
    loading: boolean;
    sessionStatus: string;
    fetchUser: jest.Mock;
    selectedWorkspace: any;
    setSelectedWorkspace: jest.Mock;
    workspaceRole: string;
    workspaces: any[];
    refreshWorkspaces: jest.Mock;
}

export const createMockUserContext = (overrides: Partial<MockUserContextType> = {}): MockUserContextType => ({
    user: { id: 'usr_test_123', email: 'test@xtrasecurity.io', tier: 'pro', name: 'Test User' },
    setUser: jest.fn(),
    loading: false,
    sessionStatus: 'authenticated',
    fetchUser: jest.fn(),
    selectedWorkspace: { id: 'ws_test_999', name: 'Production Workspace', role: 'owner' },
    setSelectedWorkspace: jest.fn(),
    workspaceRole: 'owner',
    workspaces: [{ id: 'ws_test_999', name: 'Production Workspace', role: 'owner' }],
    refreshWorkspaces: jest.fn(),
    ...overrides,
});

// Mock module for hooks/useUser
export function setupUserContextMock(customContext?: Partial<MockUserContextType>) {
    const mockCtx = createMockUserContext(customContext);
    jest.mock('@/hooks/useUser', () => ({
        useGlobalContext: () => mockCtx,
        useUser: () => mockCtx,
        UserProvider: ({ children }: { children: React.ReactNode }) => children,
    }));
    return mockCtx;
}
