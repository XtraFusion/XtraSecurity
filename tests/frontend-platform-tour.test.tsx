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

describe('Interactive Platform Spotlight Tour Walkthrough Suite', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();

        // Setup DOM mock elements for spotlight targeting
        document.body.innerHTML = `
            <div data-tour="workspace-switcher" style="width: 200px; height: 50px;"></div>
            <div data-tour="new-project-btn" style="width: 140px; height: 40px;"></div>
            <div data-tour="create-project-dialog" style="width: 400px; height: 300px;"></div>
            <div data-tour="sidebar-projects" style="width: 180px; height: 35px;"></div>
            <div data-tour="sidebar-teams" style="width: 180px; height: 35px;"></div>
            <div data-tour="sidebar-secret-rotation" style="width: 180px; height: 35px;"></div>
            <div data-tour="sidebar-tour" style="width: 180px; height: 35px;"></div>
        `;

        // Mock getBoundingClientRect
        Element.prototype.getBoundingClientRect = function () {
            return {
                top: 100,
                left: 100,
                width: 150,
                height: 40,
                bottom: 140,
                right: 250,
                x: 100,
                y: 100,
                toJSON: () => {},
            };
        };

        // Mock scrollIntoView
        Element.prototype.scrollIntoView = jest.fn();
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

        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('CLICK TO CREATE');
        expect(screen.getByTestId('spotlight-popover-card')).toBeInTheDocument();
    });

    it('2. Does NOT automatically open if user has already seen the tour in localStorage', () => {
        localStorage.setItem('xtra_platform_tour_seen_usr_tour_test', 'true');
        render(<PlatformTourModal />);

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.queryByText('Click to Create Your Project')).not.toBeInTheDocument();
    });

    it('3. Successfully opens via openPlatformTour() event dispatch even if previously completed', () => {
        localStorage.setItem('xtra_platform_tour_seen_usr_tour_test', 'true');
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('CLICK TO CREATE');
    });

    it('4. Navigates sequentially through all 7 spotlight steps highlighting real UI elements', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        // Step 0: New Project Button Spotlight
        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('CLICK TO CREATE');

        // Advance to Step 1: Create Project Dialog Spotlight
        fireEvent.click(screen.getByRole('button', { name: /Open Project Creator/i }));
        expect(screen.getByText('Project Configuration Dialog')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('PROJECT DIALOG');

        // Advance to Step 2: Workspace Master Key & Sentinels
        fireEvent.click(screen.getByRole('button', { name: /Next: Workspace Sentinel/i }));
        expect(screen.getByText('Workspace Master Key & Sentinels')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('WORKSPACE VAULT');

        // Advance to Step 3: Projects & Environments
        fireEvent.click(screen.getByRole('button', { name: /Next: Secrets & Environments/i }));
        expect(screen.getByText('Project Creation & Environments')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('PROJECTS HUB');

        // Advance to Step 4: Teams & Granular RBAC
        fireEvent.click(screen.getByRole('button', { name: /Next: Team Access Control/i }));
        expect(screen.getByText('Team Creation & Assigning Roles')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('TEAMS & RBAC');

        // Advance to Step 5: Secret Rotation
        fireEvent.click(screen.getByRole('button', { name: /Next: Secret Rotation/i }));
        expect(screen.getByText('Secret Rotation & Security Health')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('AUTOMATED ROTATION');

        // Advance to Step 6: Final Tour Step
        fireEvent.click(screen.getByRole('button', { name: /Next: Final Overview/i }));
        expect(screen.getByText("You're Ready to Build Securely!")).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('TOUR ACCESS');

        // Completing the tour triggers celebration and saves to localStorage
        fireEvent.click(screen.getByRole('button', { name: /Get Started & Celebrate/i }));
        expect(localStorage.getItem('xtra_platform_tour_seen_usr_tour_test')).toBe('true');
    });

    it('5. Allows skipping the tour at any step and saves preference to localStorage', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Skip Tour' }));

        expect(localStorage.getItem('xtra_platform_tour_seen_usr_tour_test')).toBe('true');
    });

    it('6. Allows closing the tour via the top-right close icon', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('spotlight-close-btn'));

        expect(localStorage.getItem('xtra_platform_tour_seen_usr_tour_test')).toBe('true');
    });

    it('7. Automatically advances to dialog spotlight when user clicks the project button directly', () => {
        render(<PlatformTourModal />);

        act(() => {
            openPlatformTour();
        });

        expect(screen.getByText('Click to Create Your Project')).toBeInTheDocument();

        // User clicks the actual "New Project" button on the dashboard
        act(() => {
            window.dispatchEvent(new CustomEvent('tour-project-btn-clicked'));
        });

        expect(screen.getByText('Project Configuration Dialog')).toBeInTheDocument();
        expect(screen.getByTestId('spotlight-beacon-tag')).toHaveTextContent('PROJECT DIALOG');
    });
});
