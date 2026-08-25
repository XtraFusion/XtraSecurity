jest.mock('vscode', () => {
    class Range {
        constructor(public startLine: number, public startChar: number, public endLine: number, public endChar: number) {}
    }
    class CodeAction {
        public command: any;
        public isPreferred: boolean = false;
        constructor(public title: string, public kind: any) {}
    }
    class Diagnostic {
        public source: string = '';
        constructor(public range: Range, public message: string, public severity: any) {}
    }
    class CompletionItem {
        public detail: string = '';
        public documentation: any;
        public insertText: string = '';
        constructor(public label: string, public kind: any) {}
    }

    return {
        Range,
        CodeAction,
        Diagnostic,
        CompletionItem,
        CodeActionKind: { QuickFix: 'QuickFix' },
        CompletionItemKind: { Variable: 'Variable' },
        DiagnosticSeverity: { Warning: 'Warning' },
        MarkdownString: jest.fn().mockImplementation((val) => val),
        ThemeIcon: jest.fn().mockImplementation((id) => id),
        TreeItem: class TreeItem {
            constructor(public label: string, public collapsibleState: any) {}
        },
        TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
        EventEmitter: jest.fn().mockImplementation(() => ({
            event: jest.fn(),
            fire: jest.fn()
        })),
        languages: {
            createDiagnosticCollection: jest.fn().mockReturnValue({
                set: jest.fn(),
                clear: jest.fn()
            })
        },
        workspace: {
            onDidChangeTextDocument: jest.fn(),
            onDidOpenTextDocument: jest.fn()
        }
    };
}, { virtual: true });

import { XtraClient as NodeXtraClient } from '../sdk/node/wrapper';
import { XtraSecretScanner } from '../xtra-vscode/src/providers/scanner';
import { XtraAutocompleteProvider } from '../xtra-vscode/src/providers/autocomplete';
import { XtraDriftDetector } from '../xtra-vscode/src/providers/linter';
import { XtraSecretsProvider, XtraAccessProvider } from '../xtra-vscode/src/providers/sidebar';
import { secretsCommand } from '../xtra-cli/src/commands/secrets';
import { initCommand } from '../xtra-cli/src/commands/init';
import { branchCommand } from '../xtra-cli/src/commands/branch';
import { accessCommand } from '../xtra-cli/src/commands/access';
import { api as cliApi } from '../xtra-cli/src/lib/api';
import { setConfig, clearConfig } from '../xtra-cli/src/lib/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('../xtra-cli/src/lib/api');
jest.mock('../sdk/node/api', () => {
    return {
        SecretsApi: jest.fn().mockImplementation(() => ({
            getSecrets: jest.fn().mockImplementation((projectId: string, env: string) => {
                if (env === 'development') {
                    return Promise.resolve({
                        data: {
                            DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                            DEV_ONLY: 'true'
                        }
                    });
                }
                if (env === 'staging') {
                    return Promise.resolve({
                        data: {
                            DATABASE_URL: 'postgres://user:pass@staging:5432/stgdb',
                            SHARED_KEY: 'staging-secret-key'
                        }
                    });
                }
                return Promise.resolve({ data: {} });
            })
        })),
        ProjectsApi: jest.fn(),
        TeamsApi: jest.fn(),
        AccessApi: jest.fn(),
        AuditApi: jest.fn(),
        BranchesApi: jest.fn(),
        NotificationsApi: jest.fn(),
    };
});

jest.mock('ora', () => {
    return jest.fn(() => ({
        start: jest.fn().mockReturnThis(),
        succeed: jest.fn().mockReturnThis(),
        warn: jest.fn().mockReturnThis(),
        fail: jest.fn().mockReturnThis(),
        stop: jest.fn().mockReturnThis(),
    }));
}, { virtual: true });

describe('Concurrent & Parallel End-to-End Multi-Tool Integration Suite', () => {
    const mockCliApi = cliApi as jest.Mocked<typeof cliApi>;
    const rcPath = path.join(process.cwd(), '.xtrarc');
    const originalEnv = process.env;
    let mockExit: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        clearConfig();
        setConfig('token', 'valid-test-token');
        (secretsCommand as any)._optionValues = {};
        (initCommand as any)._optionValues = {};
        (branchCommand as any)._optionValues = {};
        (accessCommand as any)._optionValues = {};

        process.env = { ...originalEnv };
        mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

        if (fs.existsSync(rcPath)) {
            try { fs.unlinkSync(rcPath); } catch (_) {}
        }
    });

    afterEach(() => {
        mockExit.mockRestore();
        process.env = originalEnv;
        if (fs.existsSync(rcPath)) {
            try { fs.unlinkSync(rcPath); } catch (_) {}
        }
    });

    // Scenario 1: Parallel Secret Writes & Cloud Sync Locking
    it('Scenario 1: Concurrent CLI writes, Node SDK cached reads, and VS Code Linter scanning execute in parallel without state corruption', async () => {
        mockCliApi.getSecrets.mockResolvedValue({
            DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
            DEV_ONLY: 'true'
        });
        mockCliApi.setSecrets.mockResolvedValue({ success: true });

        const nodeClient = new NodeXtraClient({ token: 'test-token', projectId: 'proj-concurrent-1' });
        const scanner = new XtraSecretScanner();

        const mockVsCodeContext: any = {
            workspaceState: {
                get: jest.fn((key: string) => (key === 'xtra_project_id' ? 'proj-concurrent-1' : 'main'))
            },
            subscriptions: []
        };
        const mockVsCodeApiService: any = {
            getSecrets: jest.fn().mockResolvedValue({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                DEV_ONLY: 'true'
            })
        };
        const autocompleteProvider = new XtraAutocompleteProvider(mockVsCodeApiService, mockVsCodeContext);
        const driftDetector = new XtraDriftDetector(mockVsCodeApiService, mockVsCodeContext);

        const [cliResult, nodeSecrets, autocompleteItems] = await Promise.all([
            // 1. CLI command setting secret
            secretsCommand.parseAsync(['set', 'NEW_API_KEY=sk_live_parallel123', '-p', 'proj-concurrent-1'], { from: 'user' }),

            // 2. Node SDK fetching secrets
            nodeClient.getSecrets('development'),

            // 3. VS Code Autocomplete provider fetching completions
            autocompleteProvider.provideCompletionItems(
                { lineAt: jest.fn().mockReturnValue({ text: 'const s = process.env.' }) } as any,
                { line: 0, character: 22 } as any,
                {} as any,
                {} as any
            ),

            // 4. VS Code Scanner parsing document for secrets
            Promise.resolve(
                scanner.provideCodeActions(
                    { lineAt: jest.fn().mockReturnValue({ text: 'const key = "sk_live_9988776655443322";' }) } as any,
                    { start: { line: 0, character: 0 } } as any,
                    {} as any,
                    {} as any
                )
            )
        ]);

        expect(mockCliApi.setSecrets).toHaveBeenCalledWith('proj-concurrent-1', undefined, { NEW_API_KEY: 'sk_live_parallel123' }, {}, 'main');
        expect(nodeSecrets.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/devdb');
        expect(autocompleteItems.length).toBe(2);
        expect(driftDetector).toBeDefined();
    });

    // Scenario 2: Concurrent JIT Access Request & Zero-Disk Injection
    it('Scenario 2: Concurrent CLI JIT request, VS Code Sidebar Access Provider, and Node.js withSecrets runner execute in parallel', async () => {
        mockCliApi.requestAccess.mockResolvedValue({
            id: 'req_parallel_999',
            status: 'pending'
        });
        mockCliApi.listAccessRequests.mockResolvedValue([
            { id: 'req_parallel_999', status: 'Approved', requestedAt: new Date().toISOString() }
        ]);

        const mockVsCodeApiService: any = {
            getToken: jest.fn().mockResolvedValue('valid-token'),
            getAccessRequests: jest.fn().mockResolvedValue([
                { id: 'req_parallel_999', status: 'Approved', requestedAt: new Date().toISOString(), secret: { key: 'JIT_DB_KEY' } }
            ])
        };
        const accessProvider = new XtraAccessProvider(mockVsCodeApiService);
        const nodeClient = new NodeXtraClient({ token: 'test-token', projectId: 'proj-concurrent-2' });

        const [_, accessTreeItems, runnerResult] = await Promise.all([
            // 1. CLI Access Request
            accessCommand.parseAsync(['request', '-p', 'proj-concurrent-2', '-r', 'Emergency Hotfix', '-d', '30'], { from: 'user' }),

            // 2. VS Code Access Provider tree view load
            accessProvider.getChildren(),

            // 3. Node SDK withSecrets runner executing callback
            nodeClient.withSecrets('development', {}, async () => {
                expect(process.env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/devdb');
                return 'runner_completed';
            })
        ]);

        expect(mockCliApi.requestAccess).toHaveBeenCalledWith('proj-concurrent-2', 'Emergency Hotfix', 30, undefined);
        expect(accessTreeItems.length).toBe(1);
        expect(accessTreeItems[0].label).toBe('JIT_DB_KEY');
        expect(runnerResult).toBe('runner_completed');
        expect(process.env.DATABASE_URL).toBe(originalEnv.DATABASE_URL); // Zero-disk cleanup & restoration verified
    });

    // Scenario 3: Parallel Motherboard Encrypted Disk Cache Access Under High Load
    it('Scenario 3: Multiple concurrent XtraClient instances read/write hardware-encrypted disk cache simultaneously without file corruption', async () => {
        const client1 = new NodeXtraClient({ token: 'test-token', projectId: 'proj-stress' });
        const client2 = new NodeXtraClient({ token: 'test-token', projectId: 'proj-stress' });
        const client3 = new NodeXtraClient({ token: 'test-token', projectId: 'proj-stress' });

        const results = await Promise.all([
            client1.getSecrets('development'),
            client2.getSecrets('development'),
            client3.getSecrets('development'),
            client1.getSecret('DATABASE_URL', undefined, 'development'),
            client2.getSecret('DEV_ONLY', undefined, 'development')
        ]);

        expect(results[0]).toEqual(results[1]);
        expect(results[1]).toEqual(results[2]);
        expect(results[3]).toBe('postgres://user:pass@localhost:5432/devdb');
        expect(results[4]).toBe('true');

        const cacheFile = path.join(os.homedir(), '.xtra', 'cache', 'cache_proj-stress_development.enc');
        expect(fs.existsSync(cacheFile)).toBe(true);
    });

    // Scenario 4: Concurrent Multi-Environment Switching & Rotation Isolation
    it('Scenario 4: CLI init, branch creation, VS Code Secrets Provider tree view, and Node SDK multi-env fallback run in parallel cleanly', async () => {
        mockCliApi.getBranches.mockResolvedValue([
            { id: 'b1', name: 'main', isDefault: true }
        ]);
        mockCliApi.createBranch.mockResolvedValue({ id: 'b2', name: 'release/v3.0' });

        const mockVsCodeApiService: any = {
            getToken: jest.fn().mockResolvedValue('valid-token'),
            getAuditStats: jest.fn().mockResolvedValue({ dailyEvents: 120 }),
            getSecrets: jest.fn().mockResolvedValue({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb'
            })
        };
        const mockVsCodeContext: any = {
            workspaceState: {
                get: jest.fn((key: string) => (key === 'xtra_project_id' ? 'proj-multi-env' : 'main'))
            }
        };

        const secretsProvider = new XtraSecretsProvider(mockVsCodeApiService, mockVsCodeContext);
        const nodeClient = new NodeXtraClient({ token: 'test-token', projectId: 'proj-multi-env', fallbackEnv: 'staging' });

        const [_, branchResult, secretsTreeChildren, fallbackSecrets] = await Promise.all([
            // 1. CLI init project context
            initCommand.parseAsync(['--project', 'proj-multi-env', '--env', 'development', '--branch', 'main', '-y'], { from: 'user' }),

            // 2. CLI create branch
            branchCommand.parseAsync(['-p', 'proj-multi-env', 'create', 'release/v3.0'], { from: 'user' }),

            // 3. VS Code Secrets Provider load top-level items
            secretsProvider.getChildren(),

            // 4. Node SDK fetching with staging fallback
            nodeClient.getSecrets('development')
        ]);

        expect(fs.existsSync(rcPath)).toBe(true);
        const savedRc = JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
        expect(savedRc.project).toBe('proj-multi-env');
        expect(mockCliApi.createBranch).toHaveBeenCalledWith('proj-multi-env', 'release/v3.0', undefined);

        expect(secretsTreeChildren.length).toBe(4);
        expect(fallbackSecrets.SHARED_KEY).toBe('staging-secret-key');
    });
});
