import { Command } from "commander";
import { api } from "../lib/api";
import { spawn } from "child_process";
import chalk from "chalk";
import ora from "ora";
import { setConfig, getConfigValue, getRcConfig } from "../lib/config";
import { encrypt, decrypt } from "../lib/crypto";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

export const runCommand = new Command("run")
  .description("Run a command with injected secrets")
  .option("-p, --project <projectId>", "Project ID")
  .option("-e, --env <environment>", "Environment (development, staging, production)", "development")
  .option("-b, --branch <branchName>", "Branch Name")
  .option("--shell", "Enable shell mode (needed for npm run, shell built-ins on Windows)", false)
  .option("--passphrase <passphrase>", "Vault passphrase for Level 3 Zero-Knowledge decryption")
  .option("--oidc-provider <provider>", "OIDC Provider (e.g., github, gitlab)")
  .option("--oidc-token <token>", "OIDC JWT Token")
  .argument("<command>", "Command to run")
  .argument("[args...]", "Command arguments")
  .addHelpText("after", `
Examples:
  $ xtra run npm start
  $ xtra run -e production -- npm run build
  $ xtra run --oidc-provider github --oidc-token $JWT_TOKEN -- npm start
  $ xtra run -p proj_123 -b feature-branch -- python script.py
  $ xtra run --shell "echo $SECRET_KEY"
`)
  .action(async (command, args, options) => {
    // console.log("Run Options:", options);
    let { project, env, branch, shell: useShell } = options;

    // Load .xtrarc from CWD first (project-local config), then fall back to global conf store
    const rc = getRcConfig();

    // Use active branch from config if not specified
    if (!branch) branch = rc.branch;

    // Normalize Env
    const envMap: Record<string, string> = { dev: "development", stg: "staging", prod: "production" };
    env = envMap[env] || env || rc.env;
    
    if (!project) project = rc.project;

    if (!project) {
      console.error(chalk.red("Error: Project ID is required. Use -p <id> or checkout a branch."));
      process.exit(1);
    }

    const spinner = ora(`Fetching secrets for ${env} (branch: ${branch})...`).start();
    let secrets: any = null;

    // ── Local mode override ──────────────────────────────────────────────────
    // If XTRA_LOCAL_MODE=true or localMode config flag is set,
    // read from .env.local instead of calling the API.
    const isLocal = getConfigValue("localMode") === true
      || process.env.XTRA_LOCAL_MODE === "true";

    if (isLocal) {
      const localFile = path.resolve(process.cwd(), ".env.local");
      if (!fs.existsSync(localFile)) {
        spinner.fail("Local mode is ON but .env.local not found. Run 'xtra local sync' first.");
        process.exit(1);
      }
      const parsed = dotenv.parse(fs.readFileSync(localFile, "utf8"));
      secrets = parsed;
      spinner.succeed(chalk.yellow(`🔌 Local mode: loaded ${Object.keys(secrets).length} secrets from .env.local`));
    } else {
    try {
      // OIDC Flow: Exchange OIDC Token for Ephemeral Token
      let ephemeralAuthToken = null;
      let workloadEnvelope = null;
      if (options.oidcProvider && options.oidcToken) {
        spinner.text = `Exchanging OIDC Token via ${options.oidcProvider}...`;
        const result = await api.exchangeOidcToken(options.oidcProvider, options.oidcToken);
        ephemeralAuthToken = result.accessToken;
        workloadEnvelope = result.envelope;
        spinner.succeed(chalk.green("OIDC Ephemeral Token issued."));
        spinner.start(`Fetching secrets for ${env} (branch: ${branch})...`);
      }

      // 1. Fetch Secrets
      secrets = await api.getSecrets(project, env, branch, options.passphrase, ephemeralAuthToken, workloadEnvelope);
      
      if (!secrets || Object.keys(secrets).length === 0) {
        spinner.warn(chalk.yellow("No secrets found for this environment."));
      } else {
        spinner.succeed(`Loaded ${Object.keys(secrets).length} secrets (Online).`);
        
        // Update manifest
        try {
            const { hash } = require("../lib/crypto");
            const { updateManifest } = require("../lib/manifest");
            updateManifest(project, env, secrets, hash);
        } catch (mErr) {
            // Manifest update failed
        }

        // Cache secrets locally
        try {
            const cacheKey = `cache.${project}.${env}.${branch}`;
            const encrypted = encrypt(JSON.stringify(secrets));
            setConfig(cacheKey as any, encrypted);
            // console.log(chalk.gray("Secrets cached successfully."));
        } catch (cacheErr) {
            console.error(chalk.yellow("Warning: Failed to cache secrets."));
        }
      }

    } catch (error: any) {
      const cacheKey = `cache.${project}.${env}.${branch}`;

      // SECURITY FIX: If the error is an Auth or Not Found error, it means the user was 
      // likely removed or doesn't have permission anymore. In this case, we MUST
      // delete the local cache and NOT fall back to offline mode.
      const isAuthError = error.response && [401, 403, 404].includes(error.response.status);

      if (error.message && error.message.includes('Zero-Knowledge')) {
          spinner.fail("Decryption Failed.");
          console.error(chalk.red(`\n[Decryption Error] ${error.message}`));
          console.log(chalk.yellow("Hint: Use 'xtra project set' to save your passphrase, or pass it using --passphrase"));
          process.exit(1);
      }

      if (isAuthError) {
          try {
              // @ts-ignore
              const { deleteConfig } = require("../lib/config");
              if (deleteConfig) deleteConfig(cacheKey);
          } catch (e) {}
          
          spinner.fail("Access Denied.");
          if (error.response.status === 404) {
              console.error(chalk.red(`\nError: Project '${project}' not found or your access has been revoked.`));
          } else if (error.response.status === 401) {
              console.error(chalk.red(`\nError: Unauthorized. Please run 'xtra login' again.`));
          } else {
              console.error(chalk.red(`\nError: ${error.response.data.error || "You do not have permission to access these secrets."}`));
          }
          process.exit(1);
      }

      // Offline fallback: ONLY for network errors or server internal errors
      const cachedData: any = getConfigValue(cacheKey);

      if (cachedData) {
          try {
              const decrypted = decrypt(cachedData);
              secrets = JSON.parse(decrypted);
              spinner.warn(chalk.yellow(`Offline Mode: Loaded ${Object.keys(secrets).length} secrets from cache.`));
          } catch (decryptErr) {
               spinner.fail("Failed to fetch secrets and cache is corrupt.");
               process.exit(1);
          }
      } else {
        spinner.fail("Failed to fetch secrets and no local cache available.");
        console.error(chalk.dim(`\nDetails: ${error?.response?.data?.error || "An unexpected error occurred"}`));
        process.exit(1);
      }
    } // end try/catch (cloud mode)
    } // end else (cloud mode)

    // Log Audit (Always)
    try {
        const { logAudit } = require("../lib/audit");
        // Only log if we have secrets
        if (secrets && Object.keys(secrets).length > 0) {
            logAudit("SECRET_ACCESS", project, env, { method: "run", keys: Object.keys(secrets), branch });
        }
    } catch (e) {
        console.error("Audit Error:", e);
    }

    // Decrypt any Level 3 Zero-Knowledge E2EE payloads before environment injection
    if (secrets && typeof secrets === 'object') {
      try {
        const { deriveProjectKey, decryptSecretValue, resolveVaultPassphrase } = require("../lib/crypto");
        const activePassphrase = resolveVaultPassphrase(options.passphrase, project);
        const projectKey = deriveProjectKey(project, activePassphrase);

        for (const [k, v] of Object.entries(secrets)) {
          if (typeof v === 'string' && v.startsWith('{')) {
            try {
              const parsed = JSON.parse(v);
              if (parsed.ciphertext && parsed.iv) {
                secrets[k] = decryptSecretValue(parsed, projectKey);
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    // 2. Prepare Environment
    const envVars = {
    ...process.env,
    ...secrets, // Overwrite local env with injected secrets
    };

    // 3. Spawn Child Process — shell: false by default to prevent command injection
    // When --shell is passed (e.g. for npm run start on Windows), allow shell mode
    const SHELL_UNSAFE = /[;&|`$<>\\\n]/g;
    if (!useShell && SHELL_UNSAFE.test(command)) {
        console.error(chalk.red("Error: Command contains unsafe characters. Use --shell if intentional."));
        process.exit(1);
    }

    // Production confirmation gate
    if (env === "production") {
        const inquirer = require("inquirer");
        const { confirm } = await inquirer.prompt([{
            type: "confirm",
            name: "confirm",
            message: chalk.red(`⚠ You are about to run a command in PRODUCTION with ${Object.keys(secrets || {}).length} injected secrets. Continue?`),
            default: false,
        }]);
        if (!confirm) { console.log(chalk.yellow("Aborted.")); return; }
    }

    console.log(chalk.gray(`> ${command} ${args.join(" ")}`));
    
    const isWindows = process.platform === "win32";
    
    const child = spawn(command, args, {
        env: envVars,
        stdio: "inherit",
        // Require explicit --shell on all platforms. Auto-enabling shell=true
        // on Windows amplifies shell-injection risk with injected secrets.
        shell: useShell,
    });

    // 4. Cleanup & Scrubbing
    const cleanup = () => {
        // Obfuscate secrets in memory
        if (secrets) {
            for (const key in secrets) {
                (secrets as any)[key] = "**********";
            }
        }
    };

    process.on("SIGINT", () => {
        cleanup();
        if (child) child.kill("SIGINT");
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        cleanup();
        if (child) child.kill("SIGTERM");
        process.exit(0);
    });

    child.on("exit", (code) => {
        cleanup();
        process.exit(code ?? 0);
    });

    child.on("error", (err) => {
      console.error(chalk.red(`Failed to start command: ${err.message}`));
      cleanup();
      process.exit(1);
    });
  });
