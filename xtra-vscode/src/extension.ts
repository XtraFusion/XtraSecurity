import * as vscode from 'vscode';
import { XtraApiService, deriveProjectKey, encryptSecretValue } from './services/api';
import { XtraSecretScanner } from './providers/scanner';
import { XtraSecretsProvider, XtraAccessProvider } from './providers/sidebar';
import { XtraAutocompleteProvider } from './providers/autocomplete';
import { XtraDriftDetector } from './providers/linter';

let apiService: XtraApiService;
let statusBarItem: vscode.StatusBarItem;
let secretsTreeView: vscode.TreeView<vscode.TreeItem>;
let secretsProvider: XtraSecretsProvider;
let accessProvider: XtraAccessProvider;

interface ProjectQuickPickItem extends vscode.QuickPickItem {
	projectId: string;
}

interface BranchQuickPickItem extends vscode.QuickPickItem {
	branchId: string;
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('XtraSecurity extension is now active!');

	apiService = new XtraApiService(context);
	await apiService.init();

	// Sidebar Providers
	secretsProvider = new XtraSecretsProvider(apiService, context);
	accessProvider = new XtraAccessProvider(apiService);
	secretsTreeView = vscode.window.createTreeView('xtra-secrets', { treeDataProvider: secretsProvider });
	context.subscriptions.push(secretsTreeView);
	vscode.window.registerTreeDataProvider('xtra-access', accessProvider);

	// 1. Initialize Providers and Linter
	const driftDetector = new XtraDriftDetector(apiService, context);
	
	// Create Status Bar Item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'xtra.switchEnvironment';
	context.subscriptions.push(statusBarItem);
	updateStatusBar(context);

	// Register .env watcher for background drift calculation
	const envWatcher = vscode.workspace.createFileSystemWatcher('**/.env*');
	envWatcher.onDidChange(() => updateDriftBadge(context));
	envWatcher.onDidCreate(() => updateDriftBadge(context));
	envWatcher.onDidDelete(() => updateDriftBadge(context));
	context.subscriptions.push(envWatcher);

	// 1. Login Command
	let loginCmd = vscode.commands.registerCommand('xtra.login', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your XtraSecurity API Key',
			password: true,
			placeHolder: 'xtra_...'
		});

		if (apiKey) {
			try {
				await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: 'Authenticating with XtraSecurity...',
					cancellable: false
				}, async () => {
					const response = await apiService.login(apiKey);
					await apiService.setToken(response.token);
					vscode.window.showInformationMessage(`Logged in as ${response.user?.email || response.user?.name || 'User'}`);
					updateDriftBadge(context);
				});
			} catch (err: any) {
				vscode.window.showErrorMessage(`Login failed: ${err?.response?.data?.error || "An unexpected error occurred"}`);
			}
		}
	});

	// 2. Switch Environment Command
	let switchEnvCmd = vscode.commands.registerCommand('xtra.switchEnvironment', async () => {
		const token = await apiService.getToken();
		if (!token) {
			const login = await vscode.window.showWarningMessage('You must login to switch environments.', 'Login');
			if (login === 'Login') vscode.commands.executeCommand('xtra.login');
			return;
		}

		try {
			const projects = await apiService.getProjects();
			const projectItems = projects.map((p: any) => ({
				label: p.name,
				description: p.id,
				projectId: p.id
			}));

			const selectedProject = await vscode.window.showQuickPick<ProjectQuickPickItem>(projectItems, { placeHolder: 'Select a Project' });
			if (!selectedProject) return;

			const branches = await apiService.getBranches(selectedProject.projectId);
			const branchItems = branches.map((b: any) => ({
				label: b.name,
				description: b.id,
				branchId: b.id
			}));

			const selectedBranch = await vscode.window.showQuickPick<BranchQuickPickItem>(branchItems, { placeHolder: 'Select a Branch' });
			if (!selectedBranch) return;

			// Store in workspace state
			await context.workspaceState.update('xtra_project_id', selectedProject.projectId);
			await context.workspaceState.update('xtra_project_name', selectedProject.label);
			await context.workspaceState.update('xtra_branch_id', selectedBranch.branchId);
			await context.workspaceState.update('xtra_branch_name', selectedBranch.label);

			updateStatusBar(context);
			secretsProvider.refresh();
			vscode.window.showInformationMessage(`Switched to ${selectedProject.label} / ${selectedBranch.label}`);
		} catch (err: any) {
			if (err.response?.status === 401) {
				const login = await vscode.window.showErrorMessage('Session expired or unauthorized. Please login again.', 'Login');
				if (login === 'Login') vscode.commands.executeCommand('xtra.login');
			} else {
				vscode.window.showErrorMessage(`Failed to switch environment: ${err?.response?.data?.error || "An unexpected error occurred"}`);
			}
		}
	});

	// 3. Logout Command
	let logoutCmd = vscode.commands.registerCommand('xtra.logout', async () => {
		await apiService.deleteToken();
		await context.workspaceState.update('xtra_project_id', undefined);
		await context.workspaceState.update('xtra_project_name', undefined);
		await context.workspaceState.update('xtra_branch_id', undefined);
		await context.workspaceState.update('xtra_branch_name', undefined);
		
		updateStatusBar(context);
		secretsProvider.refresh();
		vscode.window.showInformationMessage('Successfully logged out of XtraSecurity.');
	});

	// 4. Open Secure Terminal Command
	let openTerminalCmd = vscode.commands.registerCommand('xtra.openTerminal', async () => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			vscode.window.showWarningMessage('Please select a project first.');
			return;
		}

		const env = await vscode.window.showQuickPick(['development', 'staging', 'production'], {
			placeHolder: 'Select Environment to inject into Terminal'
		});
		if (!env) return;

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';

		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Injecting ${env} secrets into terminal...`,
				cancellable: false
			}, async () => {
				const secrets = await apiService.getSecrets(projectId, env, branchName);
				
				const envVars: Record<string, string> = {};
				Object.entries(secrets).forEach(([key, value]) => {
					envVars[key] = value as string;
				});

				const terminal = vscode.window.createTerminal({
					name: `Xtra: ${env}/${branchName}`,
					env: envVars
				});
				terminal.show();
				vscode.window.showInformationMessage(`Terminal opened with ${Object.keys(envVars).length} secrets injected.`);
			});
		} catch (err: any) {
			if (err.message && err.message.includes('Zero-Knowledge')) {
				vscode.window.showErrorMessage(`Failed to open terminal: Vault Passphrase required. Run "Xtra: Set Vault Passphrase" from the command palette.`);
			} else {
				vscode.window.showErrorMessage(`Failed to open secure terminal: ${err?.response?.data?.error || "An unexpected error occurred"}`);
			}
		}
	});

	// Register Hover Provider
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(['typescript', 'javascript', 'python', 'go'], {
			async provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position, /process\.env\.[A-Z0-9_]+/);
				if (!range) return;

				const word = document.getText(range);
				const envVarName = word.replace('process.env.', '');

				const projectId = context.workspaceState.get<string>('xtra_project_id');
				if (!projectId) return;

				try {
					const secrets = await apiService.getSecrets(projectId, 'development', context.workspaceState.get('xtra_branch_name') || 'main');
					const secret = secrets.find((s: any) => s.key === envVarName);

					if (secret) {
						const markdown = new vscode.MarkdownString();
						markdown.isTrusted = true; // Required for command links
						markdown.appendMarkdown(`### 🔐 XtraSecurity: ${envVarName}\n\n`);
						
						// Don't show the value directly (Shoulder-surfing protection)
						const revealCommandUri = vscode.Uri.parse(`command:xtra.revealSecret?${encodeURIComponent(JSON.stringify([envVarName, secret.value[0]]))}`);
						
						markdown.appendMarkdown(`[📄 Copy Secret Value](${revealCommandUri})\n\n`);
						markdown.appendMarkdown(`*Status: Synced from Cloud*`);
						
						return new vscode.Hover(markdown);
					}
				} catch (e) {
					return null;
				}
			}
		})
	);

	// 4. Secret Migration Command (Code Action)
	let migrateSecretCmd = vscode.commands.registerCommand('xtra.migrateSecret', async (document: vscode.TextDocument, range: vscode.Range, secretValue: string) => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			vscode.window.showErrorMessage('Please login and select a project first.');
			return;
		}

		const key = await vscode.window.showInputBox({
			prompt: 'Enter secret key name',
			placeHolder: 'e.g. STRIPE_API_KEY'
		});
		if (!key) return;

		const env = await vscode.window.showQuickPick(['development', 'staging', 'production'], {
			placeHolder: `Migrate '${key}' to which environment?`
		});
		if (!env) return;

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';

		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Migrating ${key} to XtraSecurity Cloud...`,
				cancellable: false
			}, async () => {
				// Zero-Knowledge Client-Side Encryption with v2 API
				try {
					const vaultPassphrase = await apiService.getVaultPassphrase(projectId);
					const projectKey = deriveProjectKey(projectId, vaultPassphrase);
					const encrypted = encryptSecretValue(secretValue, projectKey);
					await apiService.createSecretV2({
						key,
						ciphertext: encrypted.ciphertext,
						iv: encrypted.iv,
						authTag: encrypted.authTag,
						projectId,
						environmentType: env,
						branchId: branchName
					});
				} catch {
					// Fallback to legacy setSecrets
					await apiService.setSecrets(projectId, env, { [key]: secretValue }, branchName);
				}

				// Local replacement
				const edit = new vscode.WorkspaceEdit();
				const replacement = `process.env.${key}`;
				edit.replace(document.uri, range, replacement);
				await vscode.workspace.applyEdit(edit);
				
				vscode.window.showInformationMessage(`Secret ${key} migrated to ${env} successfully!`);
				secretsProvider.refresh();
			});
		} catch (err: any) {
			vscode.window.showErrorMessage(`Migration failed: ${err?.response?.data?.error || "An unexpected error occurred"}`);
		}
	});

	// Register Scanner
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			['javascript', 'typescript', 'python', 'go', 'yaml', 'env'],
			new XtraSecretScanner(),
			{ providedCodeActionKinds: XtraSecretScanner.providedCodeActionKinds }
		)
	);

	let refreshSecretsCmd = vscode.commands.registerCommand('xtra.refreshSecrets', () => {
		secretsProvider.refresh();
		driftDetector.refreshCache(); // Clear linter cache on manual refresh
	});

	let refreshAccessCmd = vscode.commands.registerCommand('xtra.refreshAccess', () => {
		accessProvider.refresh();
	});

	let revealSecretCmd = vscode.commands.registerCommand('xtra.revealSecret', async (key: string, value: string) => {
		await vscode.env.clipboard.writeText(value);
		vscode.window.showInformationMessage(`✅ ${key} copied to clipboard (Value hidden for security).`);
	});

	// 7. Right-Click "Copy Snippet"
	let copySnippetCmd = vscode.commands.registerCommand('xtra.copySnippet', (secretItem: any) => {
		if (secretItem && secretItem.label) {
			const snippet = `process.env.${secretItem.label}`;
			vscode.env.clipboard.writeText(snippet);
			vscode.window.showInformationMessage(`Copied '${snippet}' to clipboard!`);
		}
	});

	// 8. Right-Click "Request JIT Access"
	let requestJitCmd = vscode.commands.registerCommand('xtra.requestJit', async (secretItem: any) => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) return;
		
		const reason = await vscode.window.showInputBox({ 
			prompt: `Why do you need temporary access to '${secretItem?.label || 'this environment'}'?` 
		});
		if (!reason) return;

		const durationStr = await vscode.window.showQuickPick(['1 Hour', '8 Hours', '24 Hours'], {
			placeHolder: 'Select Duration'
		});
		if (!durationStr) return;

		let duration = 3600;
		if (durationStr.includes('8')) duration = 8 * 3600;
		if (durationStr.includes('24')) duration = 24 * 3600;

		try {
			await apiService.requestAccess(projectId, reason, duration);
			vscode.window.showInformationMessage(`Access request submitted successfully! Pending admin approval.`);
			accessProvider.refresh(); // Refresh JIT requests list
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to request access: ${err?.response?.data?.error || "An unexpected error occurred"}`);
		}
	});

	// 9. Environment Compare (Diff View)
	let compareEnvironmentsCmd = vscode.commands.registerCommand('xtra.compareEnvironments', async () => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			vscode.window.showErrorMessage('Please select a project first.');
			return;
		}

		const env1 = await vscode.window.showQuickPick(['development', 'staging', 'production'], { placeHolder: 'Select Base Environment (e.g., Development)' });
		if (!env1) return;

		const env2 = await vscode.window.showQuickPick(['development', 'staging', 'production'], { placeHolder: 'Select Target Environment (e.g., Production)' });
		if (!env2) return;

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';

		try {
			const secrets1 = await apiService.getSecrets(projectId, env1, branchName);
			const secrets2 = await apiService.getSecrets(projectId, env2, branchName);

			let content1 = `# XtraSecurity - ${env1.toUpperCase()}\n\n`;
			Object.entries(secrets1 || {}).forEach(([k, v]) => content1 += `${k}=${v}\n`);

			let content2 = `# XtraSecurity - ${env2.toUpperCase()}\n\n`;
			Object.entries(secrets2 || {}).forEach(([k, v]) => content2 += `${k}=${v}\n`);

			// Use vscode.workspace.fs to create temp files in system temp directory is better, but Virtual Documents are cleaner.
			// VS Code allows diffing unsaved contents but requires creating two complete Uri's with a custom scheme.
			// For simplicity, we create two read-only untitled documents by providing 'untitled:' uris.
			const uri1 = vscode.Uri.parse(`untitled:XtraSecurity_${env1}.env`);
			const uri2 = vscode.Uri.parse(`untitled:XtraSecurity_${env2}.env`);

			const doc1 = await vscode.workspace.openTextDocument(uri1);
			const edit1 = new vscode.WorkspaceEdit();
			edit1.insert(uri1, new vscode.Position(0, 0), content1);
			await vscode.workspace.applyEdit(edit1);

			const doc2 = await vscode.workspace.openTextDocument(uri2);
			const edit2 = new vscode.WorkspaceEdit();
			edit2.insert(uri2, new vscode.Position(0, 0), content2);
			await vscode.workspace.applyEdit(edit2);

			await vscode.commands.executeCommand('vscode.diff', uri1, uri2, `Environment Compare: ${env1} ↔ ${env2}`);

		} catch (err: any) {
			vscode.window.showErrorMessage(`Comparison failed: ${err?.response?.data?.error || "An unexpected error occurred"}`);
		}
	});

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			['javascript', 'typescript', 'python', 'go'],
			new XtraAutocompleteProvider(apiService, context),
			'.' // Trigger character
		)
	);

	// 5. Generate .env File Command
	let generateEnvCmd = vscode.commands.registerCommand('xtra.generateEnv', async () => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			vscode.window.showErrorMessage('Please login and select a project first.');
			return;
		}

		const env = await vscode.window.showQuickPick(['development', 'staging', 'production'], {
			placeHolder: 'Which environment secrets should be exported?'
		});
		if (!env) return;

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';

		try {
			const secrets = await apiService.getSecrets(projectId, env, branchName);
			if (!secrets || Object.keys(secrets).length === 0) {
				vscode.window.showInformationMessage(`No secrets found in ${env} to export.`);
				return;
			}

			let envContent = `# Generated by XtraSecurity from ${env}/${branchName}\n`;
			Object.entries(secrets).forEach(([key, value]) => {
				envContent += `${key}="${value}"\n`;
			});

			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				vscode.window.showErrorMessage('No workspace open to save .env file.');
				return;
			}

			const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, '.env');

			// Check if exists
			try {
				await vscode.workspace.fs.stat(uri);
				const existingData = await vscode.workspace.fs.readFile(uri);
				const existingContent = Buffer.from(existingData).toString('utf8');
				const existingSecrets = parseEnv(existingContent);
				
				let numNew = 0, numModified = 0, numUnchanged = 0;
				for (const [k, v] of Object.entries(secrets)) {
					if (!(k in existingSecrets)) numNew++;
					else if (existingSecrets[k] !== v) numModified++;
					else numUnchanged++;
				}

				const override = await vscode.window.showWarningMessage(
					`Overwriting .env will result in: ${numNew} New, ${numModified} Modified, and ${numUnchanged} Unchanged keys. Proceed?`, 
					{ modal: true }, 'Proceed'
				);
				if (override !== 'Proceed') return;
			} catch {
				// File does not exist, safe to write
			}

			await vscode.workspace.fs.writeFile(uri, Buffer.from(envContent, 'utf8'));
			vscode.window.showInformationMessage(`Successfully generated .env file from ${env}! Please ensure .env is in your .gitignore.`);
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to export .env: ${err?.response?.data?.error || "An unexpected error occurred"}`);
		}
	});

	// 6. Push local .env to Cloud (Mass Sync)
	let pushEnvCmd = vscode.commands.registerCommand('xtra.pushEnv', async () => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			vscode.window.showErrorMessage('Please login and select a project first.');
			return;
		}

		// Find .env files
		const envFiles = await vscode.workspace.findFiles('**/.env*', '**/node_modules/**');
		if (envFiles.length === 0) {
			vscode.window.showInformationMessage('No .env files found in workspace.');
			return;
		}

		const selectedFile = await vscode.window.showQuickPick(envFiles.map(f => f.fsPath), {
			placeHolder: 'Select the local .env file to upload to the cloud'
		});
		if (!selectedFile) return;

		const env = await vscode.window.showQuickPick(['development', 'staging', 'production'], {
			placeHolder: 'Upload these secrets to which cloud environment?'
		});
		if (!env) return;

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';

		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Analyzing secrets for ${env}...`,
				cancellable: false
			}, async () => {
				const fileData = await vscode.workspace.fs.readFile(vscode.Uri.file(selectedFile));
				const content = Buffer.from(fileData).toString('utf8');
				const parsedSecrets = parseEnv(content);

				const keyCount = Object.keys(parsedSecrets).length;
				if (keyCount === 0) {
					vscode.window.showInformationMessage('No valid secrets found in the selected file to upload.');
					return;
				}

				const cloudSecrets = await apiService.getSecrets(projectId, env, branchName);
				let numNew = 0, numModified = 0, numUnchanged = 0;
				
				for (const [k, v] of Object.entries(parsedSecrets)) {
					if (!cloudSecrets || !(k in cloudSecrets)) numNew++;
					else if (cloudSecrets[k] !== v) numModified++;
					else numUnchanged++;
				}

				const proceed = await vscode.window.showInformationMessage(
					`You are about to push to ${env.toUpperCase()}. This includes:\n\n• ${numNew} New keys\n• ${numModified} Modified keys\n• ${numUnchanged} Unchanged keys.\n\nProceed?`, 
					{ modal: true }, 'Proceed'
				);
				
				if (proceed !== 'Proceed') return;

				await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Uploading secrets to ${env} (Zero-Knowledge E2EE)...`,
					cancellable: false
				}, async () => {
					try {
						const vaultPassphrase = await apiService.getVaultPassphrase(projectId);
						const projectKey = deriveProjectKey(projectId, vaultPassphrase);
						const e2eeList = Object.entries(parsedSecrets).map(([k, v]) => {
							const enc = encryptSecretValue(v as string, projectKey);
							return {
								key: k,
								ciphertext: enc.ciphertext,
								iv: enc.iv,
								authTag: enc.authTag,
								environmentType: env,
								projectId
							};
						});
						await apiService.bulkImportV2(projectId, e2eeList, branchName, env);
					} catch {
						await apiService.setSecrets(projectId, env, parsedSecrets, branchName);
					}
					vscode.window.showInformationMessage(`Successfully uploaded ${keyCount} secrets to ${env}/${branchName}!`);
					secretsProvider.refresh();
					updateDriftBadge(context);
				});
			});
		} catch (err: any) {
			vscode.window.showErrorMessage(`Upload failed: ${err?.response?.data?.error || "An unexpected error occurred"}`);
		}
	});

	const setVaultPassphraseCmd = vscode.commands.registerCommand('xtra.setVaultPassphrase', async () => {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		const passphrase = await vscode.window.showInputBox({
			prompt: 'Enter Master Vault Passphrase for Level 3 Zero-Knowledge decryption',
			password: true,
			placeHolder: 'Enter passphrase or 24-word recovery phrase...'
		});
		if (passphrase !== undefined) {
			await apiService.setVaultPassphrase(passphrase, projectId);
			vscode.window.showInformationMessage('Vault passphrase stored securely in OS Keychain.');
			secretsProvider.refresh();
		}
	});

	context.subscriptions.push(loginCmd, switchEnvCmd, logoutCmd, openTerminalCmd, migrateSecretCmd, refreshSecretsCmd, revealSecretCmd, generateEnvCmd, pushEnvCmd, refreshAccessCmd, copySnippetCmd, requestJitCmd, compareEnvironmentsCmd, setVaultPassphraseCmd);
}

function updateStatusBar(context: vscode.ExtensionContext) {
	const projectName = context.workspaceState.get<string>('xtra_project_name') || 'Select Project';
	const branchName = context.workspaceState.get<string>('xtra_branch_name') || '';
	
	const display = branchName ? `${projectName} / ${branchName}` : projectName;
	statusBarItem.text = `$(lock) Xtra: ${display}`;
	statusBarItem.tooltip = 'Click to switch XtraSecurity Environment';
	statusBarItem.show();
	
	// Refresh badge whenever the active context shifts (e.g. login, switch env)
	updateDriftBadge(context);
}

function parseEnv(content: string): Record<string, string> {
	const parsed: Record<string, string> = {};
	content.split('\n').forEach(line => {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const parts = trimmed.split('=');
			if (parts.length >= 2) {
				const key = parts[0].trim();
				let value = parts.slice(1).join('=').trim();
				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.substring(1, value.length - 1);
				}
				if (key) parsed[key] = value;
			}
		}
	});
	return parsed;
}

export function deactivate() {}

async function updateDriftBadge(context: vscode.ExtensionContext) {
	try {
		const projectId = context.workspaceState.get<string>('xtra_project_id');
		if (!projectId) {
			secretsTreeView.badge = undefined;
			return;
		}

		const envFiles = await vscode.workspace.findFiles('**/.env*', '**/node_modules/**');
		if (envFiles.length === 0) {
			secretsTreeView.badge = undefined;
			return;
		}

		// Just parse the first matching file for simplicity
		const fileData = await vscode.workspace.fs.readFile(envFiles[0]);
		const content = Buffer.from(fileData).toString('utf8');
		const parsedSecrets = parseEnv(content);

		const branchName = context.workspaceState.get<string>('xtra_branch_name') || 'main';
		const cloudSecrets = await apiService.getSecrets(projectId, 'development', branchName);

		let driftCount = 0;
		for (const [k, v] of Object.entries(parsedSecrets)) {
			// Count as drift if key is new locally, or if value mismatches with development cloud
			if (!cloudSecrets || !(k in cloudSecrets) || cloudSecrets[k] !== v) {
				driftCount++;
			}
		}

		if (driftCount > 0) {
			secretsTreeView.badge = { value: driftCount, tooltip: `${driftCount} pending secret changes` };
		} else {
			secretsTreeView.badge = undefined; // Clear badge if fully synced
		}
	} catch (err) {
		// Suppress visual errors during silent background polling
		console.error(`Drift badge fetch error:`, (err as any)?.response?.data?.error || "An unexpected error occurred");
		secretsTreeView.badge = undefined;
	}
}
