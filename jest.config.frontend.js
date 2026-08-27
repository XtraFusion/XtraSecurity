/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^uuid$': '<rootDir>/tests/helpers/uuid-shim.js',
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/helpers/frontend-setup.ts'],
    testMatch: ['**/tests/**/*.test.tsx'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
                module: 'commonjs',
                moduleResolution: 'node',
                esModuleInterop: true,
                allowJs: true,
            },
        }],
    },
    testTimeout: 30000,
};
