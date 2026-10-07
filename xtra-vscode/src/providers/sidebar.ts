import * as vscode from 'vscode';
import { XtraApiService, deriveProjectKey, decryptSecretValue } from '../services/api';

export class XtraSecretsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private apiService: XtraApiService, private context: vscode.ExtensionContext) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		const token = await this.apiService.getToken();
		if (!token) return [new LoginItem()];

		const projectId = this.context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			return [new ProjectInfoItem()];
		}

		// Top level: Show Usage Stats followed by Environments
		if (!element) {
			const items: vscode.TreeItem[] = [];
			
			try {
				const stats = await this.apiService.getAuditStats();
				if (stats && typeof stats.dailyEvents === 'number') {
					items.push(new UsageStatsItem(stats.dailyEvents));
				}
			} catch (e) {
				console.error(`Failed to fetch usage stats:`, (e as any)?.response?.data?.error || "An unexpected error occurred");
			}

			items.push(
				new EnvironmentItem('Development', 'development'),
				new EnvironmentItem('Staging', 'staging'),
				new EnvironmentItem('Production', 'production')
			);

			return items;
		}

		// Second level: Show Secrets for that Environment
		if (element instanceof EnvironmentItem) {
			try {
				const branchName = this.context.workspaceState.get<string>('xtra_branch_name') || 'main';
				const secrets = await this.apiService.getSecrets(projectId, element.envType, branchName);
				
				const items = Object.entries(secrets).map(([key, value]) => {
					return new SecretItem(key, value as string);
				});

				if (items.length === 0) {
					return [new vscode.TreeItem('No secrets found', vscode.TreeItemCollapsibleState.None)];
				}
				
				return items;
			} catch (e: any) {
				if (e.message && e.message.includes('Zero-Knowledge')) {
					const errorItem = new vscode.TreeItem(`Locked: Passphrase Required`, vscode.TreeItemCollapsibleState.None);
					errorItem.command = { command: 'xtra.setVaultPassphrase', title: 'Set Vault Passphrase' };
					errorItem.iconPath = new vscode.ThemeIcon('key');
					errorItem.tooltip = "Click to enter your Zero-Knowledge Vault Passphrase to decrypt secrets.";
					return [errorItem];
				}
				console.error(`Fetch error:`, (e as any)?.response?.data?.error || "An unexpected error occurred");
				return [new vscode.TreeItem(`Error: ${e?.response?.data?.error || "An unexpected error occurred"}`, vscode.TreeItemCollapsibleState.None)];
			}
		}

		return [];
	}
}

class EnvironmentItem extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly envType: string) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'environment';
		this.iconPath = new vscode.ThemeIcon('folder');
		this.description = envType;
	}
}

class UsageStatsItem extends vscode.TreeItem {
	constructor(public readonly count: number) {
		super(`Daily API Usage: ${count}`, vscode.TreeItemCollapsibleState.None);
		this.description = 'Today';
		this.iconPath = new vscode.ThemeIcon('graph-line');
		this.tooltip = 'Number of security events and API calls recorded for your account today.';
		this.contextValue = 'stats';
	}
}

class LoginItem extends vscode.TreeItem {
	constructor() {
		super('Login to XtraSecurity', vscode.TreeItemCollapsibleState.None);
		this.command = { command: 'xtra.login', title: 'Login' };
		this.iconPath = new vscode.ThemeIcon('lock');
		this.tooltip = 'Click to login';
	}
}

class ProjectInfoItem extends vscode.TreeItem {
	constructor() {
		super('Select a Project', vscode.TreeItemCollapsibleState.None);
		this.command = { command: 'xtra.switchEnvironment', title: 'Switch Environment' };
		this.description = 'Required to see secrets';
		this.iconPath = new vscode.ThemeIcon('info');
	}
}

class SecretItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private value: string
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = `${this.label}=${this.value}`;
		this.description = '••••••••'; // Masked by default
		this.contextValue = 'secret';
		this.iconPath = new vscode.ThemeIcon('lock');
		
		// Add a copy command for easier access
		this.command = {
			command: 'xtra.revealSecret',
			title: 'Reveal Secret',
			arguments: [this.label, this.value]
		};
	}
}

export class XtraAccessProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private apiService: XtraApiService) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		const token = await this.apiService.getToken();
		if (!token) return [new LoginItem()];

		try {
			const requests = await this.apiService.getAccessRequests();
			if (!requests || requests.length === 0) {
				return [new vscode.TreeItem('No active requests', vscode.TreeItemCollapsibleState.None)];
			}

			return requests.map((req: any) => {
				const label = req.secret?.key || 'Access Request';
				const time = new Date(req.requestedAt).toLocaleTimeString();
				return new AccessRequestItem(label, req.status, time);
			});
		} catch (e) {
			return [new vscode.TreeItem('Failed to load requests', vscode.TreeItemCollapsibleState.None)];
		}
	}
}

class AccessRequestItem extends vscode.TreeItem {
	constructor(label: string, status: string, time: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = `${status} (${time})`;
		this.iconPath = status === 'Approved' ? new vscode.ThemeIcon('check') : new vscode.ThemeIcon('clock');
	}
}
