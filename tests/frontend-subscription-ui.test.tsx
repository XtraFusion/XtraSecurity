import React from 'react';

// Mock UI Dialog component BEFORE importing SubscriptionUI
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => (open ? <div data-testid="mock-dialog">{children}</div> : null),
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock useGlobalContext BEFORE importing SubscriptionUI
const mockFetchUser = jest.fn();
jest.mock('@/hooks/useUser', () => ({
    useGlobalContext: () => ({
        fetchUser: mockFetchUser,
        user: { id: 'usr_test_1', email: 'owner@xtra.io', tier: 'free' }
    })
}));

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SubscriptionUI from '@/app/subscription/subscription-ui';

// Mock fetch
global.fetch = jest.fn();

describe('Frontend SubscriptionUI Component Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    const mockStats = {
        success: true,
        remaining: 80,
        limit: 100,
        reset: Date.now() + 3600000
    };

    const mockResourceUsage = {
        workspaces: { used: 1, limit: 3 },
        teams: { used: 2, limit: 5 },
        projects: { used: 3, limit: 10 }
    };

    it('1. Renders current plan badge and resource usage metrics accurately', () => {
        render(<SubscriptionUI tier="free" stats={mockStats} resourceUsage={mockResourceUsage} />);

        // Verify tier indicator
        expect(screen.getAllByText(/free Plan/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/20%/i)).toBeInTheDocument(); // 100 - 80 = 20 used

        // Verify resource metrics (split spans)
        expect(screen.getByText('Workspaces')).toBeInTheDocument();
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Projects Topology')).toBeInTheDocument();
    });

    it('2. Opens promo code modal when upgrading to Pro tier via card action', async () => {
        render(<SubscriptionUI tier="free" stats={mockStats} resourceUsage={mockResourceUsage} />);

        const proUpgradeBtn = screen.getByText('Upgrade to Pro Plan');
        fireEvent.click(proUpgradeBtn);

        const mockDialog = await screen.findByTestId('mock-dialog');
        expect(mockDialog).toBeInTheDocument();
    });

    it('3. Handles 100% free promo code application and triggers free tier upgrade', async () => {
        const mockFetch = jest.fn((url: string) => {
            if (url === '/api/payment/create-order') {
                return Promise.resolve({ ok: true, json: async () => ({ isFree: true, promoMessage: '100% discount applied! Plan is now free.' }) });
            }
            if (url === '/api/subscription/upgrade') {
                return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
        global.fetch = mockFetch as any;

        render(<SubscriptionUI tier="free" stats={mockStats} resourceUsage={mockResourceUsage} />);

        const proUpgradeBtn = screen.getByText('Upgrade to Pro Plan');
        fireEvent.click(proUpgradeBtn);

        const mockDialog = await screen.findByTestId('mock-dialog');
        expect(mockDialog).toBeInTheDocument();

        // Type promo code inside modal
        const promoInput = screen.getByPlaceholderText(/SYSADMIN100/i);
        fireEvent.change(promoInput, { target: { value: 'XTRA100' } });
        
        // Submit upgrade button inside modal
        const proceedBtn = screen.getByRole('button', { name: /Upgrade Now/i });
        fireEvent.click(proceedBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/payment/create-order', expect.any(Object));
            expect(mockFetch).toHaveBeenCalledWith('/api/subscription/upgrade', expect.any(Object));
            expect(mockFetchUser).toHaveBeenCalled();
        });
    });
});
