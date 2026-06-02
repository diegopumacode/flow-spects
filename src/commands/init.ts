import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeConfig, loadConfig } from "../config.js";

export async function initFlow(cwd: string): Promise<void> {
  const existing = loadConfig(cwd);
  const rl = createInterface({ input, output });

  console.log("Setting up FlowSpec...\n");

  const domain = await rl.question(`Default domain${existing.domain ? ` [${existing.domain}]` : ""}: `);
  const context = await rl.question(`Project context (optional, for AI)${existing.context ? ` [${existing.context}]` : ""}: `);

  rl.close();

  const config = {
    domain: domain.trim() || existing.domain || "default",
    context: context.trim() || existing.context || undefined,
  };

  writeConfig(cwd, config);
  console.log(`\n  ✓ FlowSpec config created at flowspec/config.yaml`);
}
