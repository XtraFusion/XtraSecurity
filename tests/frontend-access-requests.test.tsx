import React from 'react';

// Mock dialog-custom BEFORE component import
jest.mock('@/components/ui/dialog-custom', () => ({
    Dialog: ({ isOpen, children, title }: any) => (
        isOpen ? (
            <div data-testid="mock-custom-dialog">
                {title && <h2>{title}</h2>}
                {children}
            </div>
        ) : null
    )
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessRequestModal } from '@/components/AccessRequestModal';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Frontend AccessRequestModal Component Integration Tests', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. Renders modal elements correctly when open', () => {
        render(
            <AccessRequestModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_test_123"
                secretKey="PROD_DATABASE_URL"
                resourceName="Production Secret"
            />
        );

        expect(screen.getByText(/Request Access to PROD_DATABASE_URL/i)).toBeInTheDocument();
        expect(screen.getByText(/Restricted Access/i)).toBeInTheDocument();
    });

    it('2. Shows validation error toast if submitted without reason', async () => {
        render(
            <AccessRequestModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_test_123"
                secretKey="PROD_DATABASE_URL"
            />
        );

        const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockedAxios.post).not.toHaveBeenCalled();
        });
    });

    it('3. Submits JIT access request payload via Axios POST /api/access-requests', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true, id: 'req_123' } });

        render(
            <AccessRequestModal
                open={true}
                onClose={mockOnClose}
                projectId="proj_test_123"
                secretId="sec_999"
                secretKey="AWS_SECRET_KEY"
            />
        );

        const reasonTextarea = screen.getByPlaceholderText(/I need to debug a production issue\.\.\./i);
        fireEvent.change(reasonTextarea, { target: { value: 'Production outage emergency debugging' } });

        const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith('/api/access-requests', {
                projectId: 'proj_test_123',
                secretId: 'sec_999',
                reason: 'Production outage emergency debugging',
                duration: 60,
            });
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
