import React from 'react';

// Mock UI Dialog Custom component BEFORE importing SecretHistoryModal
jest.mock('@/components/ui/dialog-custom', () => ({
    Dialog: ({ children, isOpen, open }: any) => ((isOpen || open) ? <div data-testid="mock-dialog">{children}</div> : null),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecretHistoryModal } from '@/components/SecretHistoryModal';

// Mock fetch
global.fetch = jest.fn();

describe('Frontend SecretHistoryModal Component Integration Tests', () => {
    const mockOnOpenChange = jest.fn();
    const mockOnRollbackSuccess = jest.fn();

    const mockHistoryPayload = {
        currentVersion: '2',
        history: [
            {
                version: '2',
                updatedAt: '2026-08-26T10:00:00Z',
                updatedBy: 'admin@xtra.io',
                description: 'Updated production database host',
                value: 'db-prod-new.xtra.internal:5432'
            },
            {
                version: '1',
                updatedAt: '2026-08-20T08:00:00Z',
                updatedBy: 'dev@xtra.io',
                description: 'Initial secret provision',
                value: 'db-prod-old.xtra.internal:5432'
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. Fetches and renders secret version history list accurately', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistoryPayload
        });

        render(
            <SecretHistoryModal
                open={true}
                onOpenChange={mockOnOpenChange}
                projectId="proj_core_01"
                env="production"
                secretKey="DATABASE_URL"
                onRollbackSuccess={mockOnRollbackSuccess}
            />
        );

        expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
        expect(screen.getByText(/DATABASE_URL/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('v2')).toBeInTheDocument();
            expect(screen.getByText('v1')).toBeInTheDocument();
            expect(screen.getByText('Current')).toBeInTheDocument();
            expect(screen.getByText('admin@xtra.io')).toBeInTheDocument();
            expect(screen.getByText('dev@xtra.io')).toBeInTheDocument();
        });
    });

    it('2. Allows expanding version row and toggles secret value revelation', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistoryPayload
        });

        render(
            <SecretHistoryModal
                open={true}
                onOpenChange={mockOnOpenChange}
                projectId="proj_core_01"
                env="production"
                secretKey="DATABASE_URL"
                onRollbackSuccess={mockOnRollbackSuccess}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('v2')).toBeInTheDocument();
        });

        // Click expand button on version 2 row
        const buttons = screen.getAllByRole('button');
        const expandBtn = buttons.find(b => b.querySelector('svg.lucide-chevron-right'));
        if (expandBtn) {
            fireEvent.click(expandBtn);
        }

        // Click Reveal button inside expanded row
        const revealBtn = await screen.findByText(/Reveal/i);
        fireEvent.click(revealBtn);

        await waitFor(() => {
            expect(screen.getByText(/db-prod-new\.xtra\.internal/i)).toBeInTheDocument();
            expect(screen.getByText(/Hide/i)).toBeInTheDocument();
        });
    });

    it('3. Triggers 2-step inline rollback workflow to restore previous version v1', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockHistoryPayload
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, version: '3' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockHistoryPayload
            });

        render(
            <SecretHistoryModal
                open={true}
                onOpenChange={mockOnOpenChange}
                projectId="proj_core_01"
                env="production"
                secretKey="DATABASE_URL"
                onRollbackSuccess={mockOnRollbackSuccess}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('v1')).toBeInTheDocument();
        });

        // 1st Click on Rollback button triggers confirmation state
        const rollbackBtn = screen.getByRole('button', { name: /Rollback/i });
        fireEvent.click(rollbackBtn);

        // Verify confirmation banner appears
        await waitFor(() => {
            expect(screen.getByText(/Click/i)).toBeInTheDocument();
            expect(screen.getByText(/again on v/i)).toBeInTheDocument();
        });

        // 2nd Click confirms and executes rollback API
        fireEvent.click(rollbackBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/secret/rollback',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ targetVersion: '1', changeReason: 'Rollback to v1 via History Console' })
                })
            );
            expect(mockOnRollbackSuccess).toHaveBeenCalled();
        });
    });
});
