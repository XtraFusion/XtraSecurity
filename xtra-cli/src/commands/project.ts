import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { setConfig, getConfigValue } from "../lib/config";
import { api } from "../lib/api";
import * as fs from "fs";
import * as path from "path";

export const projectCommand = new Command("project")
  .alias("projects")
  .description("Manage project context");

const updateConfigs = (projectId: string, projectName: string) => {
    const oldProject = getConfigValue("project");
    
    // Always update global
    setConfig("project", projectId);
    
    // Clear branch if project changed
    if (oldProject !== projectId) {
        setConfig("branch", "main"); // Reset to main or clear? Projects have different branches.
    }

    // Update/Create local .xtrarc to make project context "sticky" to the directory
    const rcPath = path.join(process.cwd(), ".xtrarc");
    let rc: any = {};
    
    if (fs.existsSync(rcPath)) {
        try {
            rc = JSON.parse(fs.readFileSync(rcPath, "utf-8"));
        } catch (e: any) {
            console.error(chalk.yellow(`  ⚠ Could not parse existing local .xtrarc: ${e?.response?.data?.error || e?.message || "Unknown error"}`));
        }
    }

    rc.project = projectId;
    if (oldProject !== projectId) {
        rc.branch = "main"; // Reset branch on project change
    }
    
    // Add other relevant defaults if it's a new file
    if (!rc.env) rc.env = "development";
    if (!rc.apiUrl) rc.apiUrl = getConfigValue("apiUrl") || "https://www.xtrasecurity.in/api";

    try {
        fs.writeFileSync(rcPath, JSON.stringify(rc, null, 2), "utf8");
        console.log(chalk.gray(`  ✔ Updated local .xtrarc (Project context locked to this folder)`));
    } catch (e: any) {
        console.error(chalk.yellow(`  ⚠ Could not write local .xtrarc: ${e?.response?.data?.error || e?.message || "Unknown error"}`));
    }

    console.log(chalk.green(`✔ Default project set to '${projectName}'`));
    
    const currentBranch = getConfigValue("branch");
    if (currentBranch) {
        console.log(chalk.gray(`  Active branch: ${currentBranch}`));
    }
};

// SET
projectCommand
  .command("set")
  .description("Set the default project ID and optional vault passphrase")
  .argument("[projectId]", "Project ID to set as default (optional - will show list if not provided)")
  .option("--passphrase <passphrase>", "Save vault passphrase to hardware keyring for this project")
  .option("--generate", "Automatically generate a 24-word recovery phrase", false)
  .option("--scope <scope>", "Vault scope: 'workspace' or 'project'", "project")
  .option("-w, --workspace <id>", "Workspace ID for workspace-scoped key")
  .action(async (projectId, options) => {
    let { passphrase: pphrase, generate: shouldGenerate, scope, workspace } = options;

    if (shouldGenerate) {
      const { generateRecoveryMnemonic } = require("../lib/crypto");
      const mnemonicData = generateRecoveryMnemonic();
      pphrase = mnemonicData.mnemonic;
      console.log(chalk.bold("\n🔐 Generated 24-Word Master Passphrase:\n"));
      console.log(chalk.greenBright(`  ${pphrase}\n`));
      console.log(chalk.yellow("  Please record this recovery phrase safely.\n"));
    }

    // If projectId is provided, set it directly
    if (projectId) {
        updateConfigs(projectId, projectId);
        
        if (!pphrase && process.stdout.isTTY) {
            const answer = await inquirer.prompt([{
                type: "password",
                name: "passphrase",
                message: `Enter the Master Passphrase for project '${projectId}' to enable Zero-Knowledge Decryption (or press Enter to skip):`
            }]);
            pphrase = answer.passphrase;
        }

        if (pphrase && pphrase.trim()) {
            const { saveVaultPassphrase } = require("../lib/crypto");
            if (scope === "workspace" && workspace) {
              saveVaultPassphrase(pphrase.trim(), undefined, false, workspace);
              console.log(chalk.green(`✔ Workspace Master Key for '${workspace}' saved securely to local hardware keyring.`));
            } else {
              saveVaultPassphrase(pphrase.trim(), projectId);
              console.log(chalk.green("✔ Vault passphrase saved securely to local hardware keyring."));
            }
        }
        return;
    }

    // Otherwise, fetch projects and show interactive selector
    const spinner = ora("Fetching your projects...").start();
    try {
        const projects = await api.getProjects();
        spinner.stop();

        if (!Array.isArray(projects) || projects.length === 0) {
            console.log(chalk.yellow("No projects found."));
            return;
        }

        const choices = projects.map((p: any) => ({
            name: `${p.name} (${p.id})`,
            value: p.id,
            short: p.name
        }));

        const { selectedProject } = await inquirer.prompt([{
            type: "list",
            name: "selectedProject",
            message: "Select a project:",
            choices
        }]);

        const selectedName = projects.find((p: any) => p.id === selectedProject)?.name || selectedProject;
        updateConfigs(selectedProject, selectedName);

        if (!pphrase && process.stdout.isTTY) {
            const answer = await inquirer.prompt([{
                type: "password",
                name: "passphrase",
                message: `Enter the Master Passphrase for '${selectedName}' to enable Zero-Knowledge Decryption (or press Enter to skip):`
            }]);
            pphrase = answer.passphrase;
        }

        if (pphrase && pphrase.trim()) {
            const { saveVaultPassphrase } = require("../lib/crypto");
            if (scope === "workspace" && workspace) {
              saveVaultPassphrase(pphrase.trim(), undefined, false, workspace);
              console.log(chalk.green(`✔ Workspace Master Key for '${workspace}' saved securely to local hardware keyring.`));
            } else {
              saveVaultPassphrase(pphrase.trim(), selectedProject);
              console.log(chalk.green("✔ Vault passphrase saved securely to local hardware keyring."));
            }
        }

    } catch (error: any) {
        spinner.fail("Failed to fetch projects");
        if (error.response?.data?.error) {
            console.error(chalk.red(`Error: ${error.response.data.error}`));
        } else {
            console.error(chalk.red(error?.response?.data?.error || "An unexpected error occurred"));
        }
    }
  });

// GET (show current)
projectCommand
  .command("current")
  .description("Show the current default project")
  .action(async () => {
    const projectId = getConfigValue("project");
    const branch = getConfigValue("branch");
    
    if (projectId) {
        // Try to fetch project name
        try {
            const projects = await api.getProjects();
            const project = projects.find((p: any) => p.id === projectId);
            if (project) {
                console.log(chalk.cyan(`Project: ${project.name} (${projectId})`));
            } else {
                console.log(chalk.cyan(`Project: ${projectId}`));
            }
        } catch {
            console.log(chalk.cyan(`Project: ${projectId}`));
        }
    } else {
        console.log(chalk.yellow("No default project set. Use 'xtra project set' to set one."));
    }
    
    if (branch) {
        console.log(chalk.cyan(`Branch: ${branch}`));
    }
  });
