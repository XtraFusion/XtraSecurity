import { Command } from "commander";
import { api } from "../lib/api";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";
import { getConfigValue, getRcConfig } from "../lib/config";

export const exportCommand = new Command("export")
  .description("Export secrets to a file (JSON, Dotenv, CSV)")
  .option("-p, --project <projectId>", "Project ID")
  .option("-e, --env <environment>", "Environment (development, staging, production)", "development")
  .option("-b, --branch <branchName>", "Branch Name")
  .option("-f, --format <format>", "Output format (json, dotenv, csv)", "json")
  .option("-o, --output <file>", "Output file path (default: stdout)")
  .option("--passphrase <passphrase>", "Vault passphrase for Level 3 Zero-Knowledge decryption")
  .action(async (options) => {
    let { project, env, branch, format, output } = options;

    // Use config fallback
    if (!project) project = getRcConfig().project;
    if (!branch) {
        branch = getRcConfig().branch || "main";
    }

    // Normalize Env
    const envMap: Record<string, string> = { dev: "development", stg: "staging", prod: "production" };
    env = envMap[env] || env;

    if (!project) {
        console.error(chalk.red("Error: Project ID is required. Use -p <id> or run 'xtra project set' first."));
        process.exit(1);
    }

    const spinner = require("ora")(`Fetching secrets for export (${env} @ ${branch})...`).start();
    
    try {
        const secrets = await api.getSecrets(project, env, branch, options.passphrase);
        spinner.stop();

        if (!secrets || Object.keys(secrets).length === 0) {
            console.warn(chalk.yellow("No secrets found to export."));
            return;
        }



        let content = "";

        switch (format.toLowerCase()) {
            case "json":
                content = JSON.stringify(secrets, null, 2);
                break;
            case "dotenv":
                content = Object.entries(secrets)
                    .map(([key, value]) => `${key}="${String(value).replace(/"/g, '\\"')}"`)
                    .join("\n");
                break;
            case "csv":
                const records = Object.entries(secrets).map(([key, value]) => ({ key, value }));
                content = stringify(records, { header: true });
                break;
            default:
                console.error(chalk.red(`Error: Unsupported format '${format}'. Use json, dotenv, or csv.`));
                process.exit(1);
        }

        if (output) {
            const outputPath = path.resolve(process.cwd(), output);
            fs.writeFileSync(outputPath, content, "utf-8");
            console.log(chalk.green(`✔ Secrets exported to ${outputPath}`));
        } else {
            console.log(content);
        }

        // Log Audit
        try {
            const { logAudit } = require("../lib/audit");
            logAudit("SECRET_EXPORT", project, env, { format, destination: output || "stdout", branch });
        } catch (e) {}

    } catch (error: any) {
        spinner.fail("Export failed.");
        if (error.message && error.message.includes('Zero-Knowledge')) {
            console.error(chalk.red(`\n[Decryption Error] ${error.message}`));
            console.log(chalk.yellow("Hint: Use 'xtra project set' to save your passphrase, or pass it using --passphrase"));
            process.exit(1);
        }
        const safeErr = error?.response?.data?.error || error?.response?.data?.error || "An unexpected error occurred" || "Unknown error";
        console.error(chalk.red(safeErr));
        process.exit(1);
    }
  });
