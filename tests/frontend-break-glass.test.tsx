import React from 'react';

// Mock UI Dialog Custom component BEFORE importing BreakGlassModal
jest.mock('@/components/ui/dialog-custom', () => ({
    Dialog: ({ children, isOpen, open }: any) => ((isOpen || open) ? <div data-testid="mock-dialog">{children}</div> : null),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BreakGlassModal } from '@/components/BreakGlassModal';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Frontend BreakGlassModal Component Integration Tests', () => {
    const mockOnClose = jest.fn();
    const mockOnActivated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. Renders warning alert and project context when open', () => {
        render(
            <BreakGlassModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_prod_vault_99"
                projectName="Production Core Secrets"
                onActivated={mockOnActivated}
            />
        );

        expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
        expect(screen.getByText(/Break Glass Access/i)).toBeInTheDocument();
        expect(screen.getByText(/Production Core Secrets/i)).toBeInTheDocument();
    });

    it('2. Advances to step 2 verification and disables activation until reason is entered', async () => {
        render(
            <BreakGlassModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_prod_vault_99"
                projectName="Production Core Secrets"
                onActivated={mockOnActivated}
            />
        );

        // Click next step button to move from Step 1 to Step 2
        const proceedBtn = screen.getByRole('button', { name: /Proceed to Verification/i });
        fireEvent.click(proceedBtn);

        // Verify Step 2 input and disabled Activate button when reason is empty
        await waitFor(() => {
            const activateBtn = screen.getByRole('button', { name: /Activate Root Access/i });
            expect(activateBtn).toBeDisabled();
        });
    });

    it('3. Inputs incident reason & ticket, and triggers emergency activation API POST', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
                session: {
                    id: 'bg_sess_101',
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                }
            }
        });

        render(
            <BreakGlassModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_prod_vault_99"
                projectName="Production Core Secrets"
                onActivated={mockOnActivated}
            />
        );

        // Step 1 -> Step 2
        const proceedBtn = screen.getByRole('button', { name: /Proceed to Verification/i });
        fireEvent.click(proceedBtn);

        // Enter emergency reason & incident ticket in Step 2
        const reasonInput = await screen.findByPlaceholderText(/Explain why emergency access is required/i);
        fireEvent.change(reasonInput, { target: { value: 'Production Outage - Emergency Database Credential Rotation' } });

        const ticketInput = screen.getByPlaceholderText(/e\.g\. INC-452 or JIRA-8892/i);
        fireEvent.change(ticketInput, { target: { value: 'INC-9912' } });

        // Click emergency activation trigger
        const activateBtn = screen.getByRole('button', { name: /Activate Root Access/i });
        expect(activateBtn).not.toBeDisabled();
        fireEvent.click(activateBtn);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                '/api/access/break-glass',
                expect.objectContaining({
                    projectId: 'proj_prod_vault_99',
                    reason: 'Production Outage - Emergency Database Credential Rotation',
                    ticketId: 'INC-9912'
                })
            );
            expect(mockOnActivated).toHaveBeenCalled();
        });
    });
});
