import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import React from 'react';

// Configure testing-library to not ignore script and style
configure({ defaultIgnore: 'script, style' });

// Polyfill PointerEvent for Radix UI
if (typeof window !== 'undefined' && !window.PointerEvent) {
    class PointerEvent extends MouseEvent {
        public pointerId: number = 0;
        public pointerType: string = '';
        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            this.pointerId = params.pointerId || 0;
            this.pointerType = params.pointerType || 'mouse';
        }
    }
    window.PointerEvent = PointerEvent as any;
}

// Polyfill Element prototypes for Radix UI JSDOM support
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

// Mock framer-motion to execute immediately without animation delays in JSDOM
jest.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, prop) => ({ children, ...props }: any) => {
            const Tag = typeof prop === 'string' ? prop : 'div';
            const { initial, animate, exit, variants, transition, ...restProps } = props;
            return React.createElement(Tag, restProps, children);
        }
    }),
    AnimatePresence: ({ children }: any) => children,
}));

// Mock Radix Dialog primitives cleanly for JSDOM
jest.mock('@radix-ui/react-dialog', () => ({
    Root: ({ children, open }: any) => (open !== false ? React.createElement('div', { 'data-testid': 'radix-dialog-root' }, children) : null),
    Trigger: ({ children, onClick, ...props }: any) => React.createElement('button', { onClick, ...props }, children),
    Portal: ({ children }: any) => React.createElement('div', { 'data-testid': 'radix-portal' }, children),
    Overlay: ({ children }: any) => React.createElement('div', null, children),
    Content: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'radix-dialog-content', ...props }, children),
    Title: ({ children }: any) => React.createElement('h2', null, children),
    Description: ({ children }: any) => React.createElement('p', null, children),
    Close: ({ children, onClick, ...props }: any) => React.createElement('button', { onClick, ...props }, children),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/subscription',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());
