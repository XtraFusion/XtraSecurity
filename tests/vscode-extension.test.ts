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

import { XtraSecretScanner } from '../xtra-vscode/src/providers/scanner';

describe('VS Code Extension Unit Test Suite (xtra-vscode)', () => {
    describe('XtraSecretScanner (Hardcoded Secret Detector & QuickFix)', () => {
        const scanner = new XtraSecretScanner();

        it('detects hardcoded api keys and passwords matching sensitive regex patterns', () => {
            const mockLineText = 'const apiKey = "sk_live_1234567890abcdef1234";';
            const mockDocument: any = {
                lineAt: jest.fn().mockReturnValue({ text: mockLineText })
            };

            const mockRange: any = {
                start: { line: 5, character: 0 }
            };

            const actions = scanner.provideCodeActions(
                mockDocument,
                mockRange,
                {} as any,
                {} as any
            );

            expect(actions.length).toBe(1);
            expect(actions[0].title).toBe('Move secret to XtraSecurity');
            expect(actions[0].command?.command).toBe('xtra.migrateSecret');
            expect(actions[0].command?.arguments?.[2]).toBe('sk_live_1234567890abcdef1234');
        });

        it('ignores standard short strings or public variables', () => {
            const mockLineText = 'const name = "short_string";';
            const mockDocument: any = {
                lineAt: jest.fn().mockReturnValue({ text: mockLineText })
            };
            const mockRange: any = { start: { line: 0, character: 0 } };

            const actions = scanner.provideCodeActions(
                mockDocument,
                mockRange,
                {} as any,
                {} as any
            );

            expect(actions.length).toBe(0);
        });
    });

    describe('IntelliSense Secret Autocompletion', () => {
        it('parses cloud secrets and produces CompletionItems when typing process.env.', async () => {
            const mockApiService: any = {
                getSecrets: jest.fn().mockResolvedValue({
                    DATABASE_URL: 'postgres://db:5432/main',
                    STRIPE_KEY: 'sk_live_998877'
                })
            };

            const mockContext: any = {
                workspaceState: {
                    get: jest.fn((key: string) => {
                        if (key === 'xtra_project_id') return 'proj_test_123';
                        if (key === 'xtra_branch_name') return 'main';
                        return null;
                    })
                }
            };

            const { XtraAutocompleteProvider } = require('../xtra-vscode/src/providers/autocomplete');
            const provider = new XtraAutocompleteProvider(mockApiService, mockContext);

            const mockDocument: any = {
                lineAt: jest.fn().mockReturnValue({ text: 'const url = process.env.' })
            };
            const mockPosition: any = { line: 0, character: 24 };

            const items = await provider.provideCompletionItems(
                mockDocument,
                mockPosition,
                {} as any,
                {} as any
            );

            expect(items.length).toBe(2);
            expect(items[0].label).toBe('DATABASE_URL');
            expect(items[1].label).toBe('STRIPE_KEY');
        });

        it('returns empty list if prefix does not end with process.env.', async () => {
            const mockApiService: any = {};
            const mockContext: any = {};

            const { XtraAutocompleteProvider } = require('../xtra-vscode/src/providers/autocomplete');
            const provider = new XtraAutocompleteProvider(mockApiService, mockContext);

            const mockDocument: any = {
                lineAt: jest.fn().mockReturnValue({ text: 'const url = myVar.' })
            };
            const mockPosition: any = { character: 18 };

            const items = await provider.provideCompletionItems(
                mockDocument,
                mockPosition,
                {} as any,
                {} as any
            );

            expect(items.length).toBe(0);
        });
    });

    describe('Drift Detector & Cloud Sync', () => {
        it('initializes linter and handles refreshCache correctly', async () => {
            const mockApiService: any = {
                getSecrets: jest.fn().mockResolvedValue({
                    EXISTING_KEY: 'val'
                })
            };

            const mockContext: any = {
                workspaceState: {
                    get: jest.fn().mockReturnValue('proj_123'),
                },
                subscriptions: []
            };

            const { XtraDriftDetector } = require('../xtra-vscode/src/providers/linter');
            const linter = new XtraDriftDetector(mockApiService, mockContext);

            expect(linter).toBeDefined();
            expect(linter.refreshCache).toBeDefined();
            linter.refreshCache();
        });
    });

    describe('Sidebar Tree View Providers', () => {
        it('returns login prompt item when user is not authenticated', async () => {
            const mockApiService: any = {
                getToken: jest.fn().mockResolvedValue(undefined)
            };
            const mockContext: any = {
                workspaceState: { get: jest.fn() }
            };

            const { XtraSecretsProvider } = require('../xtra-vscode/src/providers/sidebar');
            const secretsProvider = new XtraSecretsProvider(mockApiService, mockContext);

            const children = await secretsProvider.getChildren();
            expect(children.length).toBe(1);
            expect(children[0].label).toBe('Login to XtraSecurity');
        });

        it('returns environments and stats when user is logged in and project is selected', async () => {
            const mockApiService: any = {
                getToken: jest.fn().mockResolvedValue('valid_token'),
                getAuditStats: jest.fn().mockResolvedValue({ dailyEvents: 42 })
            };
            const mockContext: any = {
                workspaceState: { get: jest.fn().mockReturnValue('proj_123') }
            };

            const { XtraSecretsProvider } = require('../xtra-vscode/src/providers/sidebar');
            const secretsProvider = new XtraSecretsProvider(mockApiService, mockContext);

            const children = await secretsProvider.getChildren();
            expect(children.length).toBe(4); // 1 stats item + 3 environments (Dev, Stg, Prod)
            expect(children[0].label).toBe('Daily API Usage: 42');
        });
    });
});
