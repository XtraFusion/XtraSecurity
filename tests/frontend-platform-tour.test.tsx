/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlatformTourModal, openPlatformTour } from '@/components/PlatformTourModal';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock useUser context
jest.mock('@/hooks/useUser', () => ({
    useUser: () => ({
        user: { id: 'usr_tour_test', email: 'tour@xtrasecurity.io', name: 'Tour Explorer' },
        selectedWorkspace: { id: 'ws_tour', name: 'Tour Workspace' },
    }),
}));

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('Interactive Platform Tour Walkthrough Suite', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('1. Automatically opens for first-time visitors who have not completed the tour', () => {
        render(<PlatformTourModal />);

        // Fast-forward initial auto-open timer
        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(screen.getByText(/Welcome to XtraSecurity/i)).toBeInTheDocument();
        expect(screen.getByText(/Level 3 Zero-Knowledge Secrets Orchestration/i)).toBeInTheDocument();
    });

    it('2. Does NOT automatically open if user has already seen the tour in localStorage', () => {
        localStorage.setItem('xtra_platform_tour_seen_usr_tour_test', 'true');
        render(<PlatformTourModal />);

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.queryByText(/Welcome to XtraSecurity/i)).not.toBeInTheDocument();
    });

    it('3. Successfully opens via openPlatformTour() event dispatch even if previously completed', () => {
        localStorage.setItem('xtra_platform_tour_seen_usr_tour_test', 'true');
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText(/Welcome to XtraSecurity/i)).toBeInTheDocument();
    });

    it('4. Navigates sequentially through all 6 core platform tour steps', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        // Step 0: Welcome
        expect(screen.getByText(/Welcome to XtraSecurity/i)).toBeInTheDocument();

        // Advance to Step 1: Master Key & Sentinels
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Workspace Master Key & Sentinels/i)).toBeInTheDocument();
        expect(screen.getByText(/24-Word BIP-39 Recovery Mnemonic/i)).toBeInTheDocument();

        // Advance to Step 2: Projects & Environments
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Project Creation & Environments/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Staging/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Production/i).length).toBeGreaterThan(0);

        // Advance to Step 3: Encrypted Secrets
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Encrypted Secrets & Sync/i)).toBeInTheDocument();
        expect(screen.getByText(/AES-256-GCM Active/i)).toBeInTheDocument();

        // Advance to Step 4: Teams & Granular RBAC
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Team Creation & Assigning Roles/i)).toBeInTheDocument();
        expect(screen.getByText(/Role Privileges/i)).toBeInTheDocument();

        // Advance to Step 5: JIT & Break-Glass Access
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Just-In-Time \(JIT\) & Break-Glass/i)).toBeInTheDocument();
        expect(screen.getByText(/SOC2 \/ ISO-27001 Ready/i)).toBeInTheDocument();

        // Advance to Step 6: CLI & SDKs
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/Developer CLI & Multi-Language SDKs/i)).toBeInTheDocument();
        expect(screen.getByText(/Terminal Workflow/i)).toBeInTheDocument();

        // Advance to Final Celebration Step
        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
        expect(screen.getByText(/You're Ready to Build Securely!/i)).toBeInTheDocument();
        expect(screen.getByText(/Create First Project/i)).toBeInTheDocument();
        expect(screen.getByText(/Invite Team Members/i)).toBeInTheDocument();

        // Completing the tour sets localStorage flag
        fireEvent.click(screen.getByRole('button', { name: /Get Started/i }));
        expect(localStorage.getItem('xtra_platform_tour_seen_usr_tour_test')).toBe('true');
    });

    it('5. Allows skipping the tour at any step and saves preference to localStorage', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText(/Welcome to XtraSecurity/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Skip Tour/i }));

        expect(localStorage.getItem('xtra_platform_tour_seen_usr_tour_test')).toBe('true');
    });
});
