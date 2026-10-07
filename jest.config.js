/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    globalSetup: '<rootDir>/tests/helpers/global-setup.js',
    globalTeardown: '<rootDir>/tests/helpers/global-teardown.js',
    moduleNameMapper: {
        '^uuid$': '<rootDir>/tests/helpers/uuid-shim.js',
        '^@/(.*)$': '<rootDir>/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx', '**/tests-private/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
            },
        }],
    },
    testTimeout: 60000,
};
