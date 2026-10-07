import { Command } from "commander";
import { api } from "../lib/api";
import chalk from "chalk";
import ora from "ora";
import { table } from "table";
import { setConfig, getConfigValue, getRcConfig } from "../lib/config";

export const secretsCommand = new Command("secrets")
  .description("Manage secrets (List, Set, Delete)")
  .option("-p, --project <projectId>", "Project ID")
  .option("-e, --env <environment>", "Environment (development, staging, production)", "development")
  .option("-b, --branch <branchName>", "Branch Name")
  .option("--passphrase <passphrase>", "Vault passphrase for Level 3 Zero-Knowledge decryption");

// LIST
secretsCommand
  .command("list")
  .description("List all secrets for a project/environment")
  .option("--show", "Reveal secret values", false)
  .option("--passphrase <passphrase>", "Vault passphrase for Level 3 Zero-Knowledge decryption")
  .addHelpText("after", `
Examples:
  $ xtra secrets list
  $ xtra secrets list -e production --show
`)
  .action(async (options) => {
    const parentOpts = secretsCommand.opts(); 
    let { project, env, branch } = parentOpts;

    // Load .xtrarc from CWD (local project config has priority over global conf store)
    const rc = getRcConfig();
    if (!project) project = rc.project;
    if (!branch)  branch  = rc.branch;
    if (!env || env === "development") env = rc.env;  // only override if still at default
    
    // Normalize Env
    const envMap: Record<string, string> = { dev: "development", stg: "staging", prod: "production" };
    env = envMap[env] || env;
    const { show } = options;

    if (!project) {
        console.error(chalk.red("Error: Project ID is required. Use -p <id> or run `xtra init` first."));
        process.exit(1);
    }

    const spinner = ora(`Fetching secrets for ${env} (branch: ${branch})...`).start();
    try {
        const secrets = await api.getSecrets(project, env, branch, options.passphrase || parentOpts.passphrase);
        spinner.stop();

        if (!secrets || Object.keys(secrets).length === 0) {
            console.log(chalk.yellow("No secrets found."));
            return;
        }

        if (show) {
            console.log(chalk.red("⚠ Warning: Secret values will be visible in your terminal and shell history!"));
        }

        const data: any[][] = [
            [chalk.bold("Key"), chalk.bold("Value"), chalk.bold("Env")]
        ];

        Object.entries(secrets).forEach(([key, value]) => {
            let displayVal = value;
            if (typeof value === "string" && value.startsWith("{")) {
                try {
                    const parsed = JSON.parse(value);
                    if (parsed.ciphertext && parsed.iv) {
                        try {
                            const { deriveProjectKey, decryptSecretValue, resolveVaultPassphrase } = require("../lib/crypto");
                            const activePassphrase = resolveVaultPassphrase(options.passphrase || parentOpts.passphrase, project);
                            const projectKey = deriveProjectKey(project, activePassphrase);
                            displayVal = decryptSecretValue(parsed, projectKey);
                        } catch (decryptErr: any) {
                            displayVal = chalk.yellow("[Decryption Failed: " + decryptErr.message + "]");
                        }
                    }
                } catch (_) {}
            }
            data.push([
                key, 
                show ? displayVal : "********", 
                env
            ]);
        });

        console.log(table(data));

        // Audit Log
        try {
            const { logAudit } = await import("../lib/audit");
            logAudit("SECRET_LIST", project, env, { branch, count: Object.keys(secrets).length });
        } catch (e) {}

    } catch (error: any) {
        spinner.fail("Failed to fetch secrets");
        console.error(chalk.red(error?.response?.data?.error || "An unexpected error occurred"));
    }
  });

// SET
secretsCommand
  .command("set")
  .description("Set one or more secrets (KEY=VALUE)")
  .argument("<secrets...>", "Secrets to set (format: KEY=VALUE)")
  .option("-f, --force", "Force update (overwrite remote changes without warning)", false)
  .addHelpText("after", `
Examples:
  $ xtra secrets set API_KEY=xyz
  $ xtra secrets set DB_USER=admin DB_PASS=secret -e staging
`)
  .action(async (args, options) => {
    const parentOpts = secretsCommand.opts(); 
    let { project, env, branch } = parentOpts;

    // Use active branch from config if not specified
    if (!branch) {
        branch = getConfigValue("branch") || "main";
    }
    
    // Normalize Env
    const envMap: Record<string, string> = { dev: "development", stg: "staging", prod: "production" };
    env = envMap[env] || env;

    if (!project) {
        project = getConfigValue("project");
    }

    if (!project) {
        console.error(chalk.red("Error: Project ID is required. Use -p <id> or run 'xtra project set' first."));
        process.exit(1);
    }
    
    // Parse key=value pairs
    const payload: Record<string, string> = {};
    args.forEach((arg: string) => {
        const idx = arg.indexOf("=");
        if (idx === -1) {
            console.warn(chalk.yellow(`Skipping invalid format: ${arg} (expected KEY=VALUE)`));
            return;
        }
        const key = arg.substring(0, idx);
        const value = arg.substring(idx + 1);
        payload[key] = value;
    });

    if (Object.keys(payload).length === 0) {
        console.error(chalk.red("No valid secrets provided."));
        return;
    }

    // 🔒 Production gate: require explicit confirmation before writing to production
    if (env === "production" && !options.force) {
        const inquirer = require("inquirer");
        const { confirm } = await inquirer.prompt([{
            type: "confirm",
            name: "confirm",
            message: chalk.red(`⚠  You are about to SET ${Object.keys(payload).length} secret(s) in PRODUCTION. Are you sure?`),
            default: false,
        }]);
        if (!confirm) {
            console.log(chalk.yellow("Aborted."));
            return;
        }
    }

    const spinner = ora(`Setting ${Object.keys(payload).length} secrets for ${env} (branch: ${branch})...`);
    if (options.force) {
        spinner.start();
    }

    try {
        let expectedVersions: Record<string, string> | undefined = undefined;

        if (!options.force) {
            // Fetch current versions for optimistic locking
            spinner.text = "Fetching current versions...";
            spinner.start();
            try {
                const remoteSecrets = await api.getSecretVersions(project, env, branch);
                expectedVersions = {};
                spinner.stop(); 

                // Populate expected versions for keys we are updating
                Object.keys(payload).forEach(key => {
                    if (remoteSecrets[key]) {
                        expectedVersions![key] = remoteSecrets[key].version;
                    }
                });

            } catch (verErr) {
                spinner.warn(chalk.yellow("Could not fetch remote versions. Conflict detection disabled."));
            }
        }

        spinner.start(`Updating secrets...`);
        await api.setSecrets(project, env, payload, expectedVersions, branch);
        spinner.succeed("Secrets updated successfully.");

        // Log Audit
        try {
            const { logAudit } = require("../lib/audit");
            logAudit("SECRET_UPDATE", project, env, { keys: Object.keys(payload), branch });
        } catch (e) {}

    } catch (error: any) {
        spinner.stop(); 
        
        if (error.response && error.response.status === 409) {
            // Conflict Detected
            const conflicts = error.response.data.conflicts || [];
            console.log(chalk.red("\n⚠ Conflict Detected! The following secrets have changed remotely:\n"));
            
            const conflictTable = [[chalk.bold("Key"), chalk.bold("Remote Version"), chalk.bold("Remote Value")]];
            conflicts.forEach((c: any) => {
                conflictTable.push([c.key, c.actual, c.remoteValue]);
            });
            console.log(table(conflictTable));

            const inquirer = require("inquirer");
            const { confirm } = await inquirer.prompt([{
                type: "confirm",
                name: "confirm",
                message: "Do you want to overwrite these changes exactly as you specified?",
                default: false
            }]);

            if (confirm) {
                const retrySpinner = ora("Overwriting secrets...").start();
                try {
                    // Start retry with Force (no expectedVersions)
                    await api.setSecrets(project, env, payload, undefined, branch);
                    retrySpinner.succeed("Secrets overwritten successfully.");
                     // Log Audit Force
                    try {
                        const { logAudit } = require("../lib/audit");
                        logAudit("SECRET_UPDATE_FORCE", project, env, { keys: Object.keys(payload), branch });
                    } catch (e) {}
                } catch (retryErr: any) {
                    retrySpinner.fail("Failed to overwrite secrets.");
                    console.error(chalk.red(retryErr.message));
                }
            } else {
                console.log(chalk.yellow("Update cancelled."));
            }
            return; // Handled
        }

        if (spinner.isSpinning) spinner.fail("Failed to update secrets");

        if (error.response && error.response.data && error.response.data.error) {
            console.error(chalk.red(`Server Error: ${error.response.data.error}`));
        } else {
            console.error(chalk.red(error?.response?.data?.error || "An unexpected error occurred"));
        }
    }
  });

// LINK
secretsCommand
  .command("link")
  .description("Link a secret to another secret (Reference)")
  .argument("<key>", "Key of the secret to create (e.g. DB_URL)")
  .requiredOption("--source <source>", "Source path (format: project/env/key)")
  .addHelpText("after", `
Examples:
  $ xtra secrets link SHARED_DB_URL --source shared-proj/production/DB_URL
`)
  .action(async (key, options) => {
    const parentOpts = secretsCommand.opts(); 
    let { project, env } = parentOpts;
    
    // Normalize Env
    const envMap: Record<string, string> = { dev: "development", stg: "staging", prod: "production" };
    env = envMap[env] || env;
    const { source } = options;

    if (!project) {
        project = getConfigValue("project");
    }

    if (!project) {
        console.error(chalk.red("Error: Project ID is required. Use -p <id> or run 'xtra project set' first."));
        process.exit(1);
    }
    
    // Parse Source: "proj-123/prod/DATABASE_URL"
    const parts = source.split("/");
    if (parts.length !== 3) {
        console.error(chalk.red("Error: Source must be in format 'projectId/env/key'"));
        return;
    }
    const [sourceProjectId, sourceEnv, sourceKey] = parts;

    const spinner = ora(`Linking ${key} to ${source}...`).start();

    try {
        await api.linkSecret(project, env, key, sourceProjectId, sourceEnv, sourceKey);
        spinner.succeed(chalk.green(`Secret '${key}' successfully linked to '${sourceKey}'`));
        // Audit log
        try {
            const { logAudit } = require("../lib/audit");
            logAudit("SECRET_LINKED", project, env, { key, source });
        } catch (e) {}
    } catch (error: any) {
        spinner.fail("Failed to link secret");
        const safeErr = error?.response?.data?.error || error?.response?.data?.error || "An unexpected error occurred" || "Unknown error";
        console.error(chalk.red(`Server Error: ${safeErr}`));
    }
  });
