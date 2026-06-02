import { Command } from "commander";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirExists, listFlows, getAllFlowData } from "./utils/files.js";
import { newFlow } from "./commands/new-flow.js";
import { parseFlow } from "./compiler/parser.js";
import { compileOverview, compileDesignSpec, compileCompact, toJSON } from "./compiler/compile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function version(): string {
  try {
    return JSON.parse(readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")).version;
  } catch { return "0.0.0"; }
}

function findDomain(cwd: string, domain?: string): string | null {
  if (domain) return domain;
  const dd = path.join(cwd, "domains");
  if (!dirExists(dd)) return null;
  const dirs = readdirSync(dd).filter((d) => dirExists(path.join(dd, d)));
  if (dirs.length === 1) return dirs[0];
  return null;
}

const program = new Command();

program.name("flow").version(version()).description("FlowSpec: Product-driven development");

program
  .command("new")
  .description("Create a new flow interactively")
  .argument("<name>", "Flow name")
  .action(async (name: string) => {
    const dd = path.join(process.cwd(), "domains");
    if (!dirExists(dd)) {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(dd, { recursive: true });
    }
    await newFlow(process.cwd(), name);
  });

program
  .command("compile")
  .description("Compile flow into structured docs (overview, design, compact, json)")
  .argument("<flow>", "Flow name (e.g. default/my-flow)")
  .option("--design", "Design-focused spec (screens, states, validation)")
  .option("--compact", "One-page summary")
  .option("--json", "Structured JSON output")
  .action((flow: string, opts: { design?: boolean; compact?: boolean; json?: boolean }) => {
    const parts = flow.split("/");
    const domain = parts.length > 1 ? parts[0] : findDomain(process.cwd());
    const name = parts.length > 1 ? parts[1] : parts[0];
    if (!domain) { console.error("Specify domain: flow compile <domain>/<name>"); process.exit(1); }
    const data = getAllFlowData(process.cwd(), domain, name);
    const parsed = parseFlow(domain, data);
    if (opts.json) console.log(JSON.stringify(toJSON(parsed), null, 2));
    else if (opts.design) console.log(compileDesignSpec(parsed));
    else if (opts.compact) console.log(compileCompact(parsed));
    else console.log(compileOverview(parsed));
  });

program
  .command("list")
  .description("List all flows")
  .option("-d, --domain <domain>", "Filter by domain")
  .action((opts: { domain?: string }) => {
    const flows = listFlows(process.cwd(), opts.domain);
    if (!flows.length) { console.log("No flows found."); return; }
    console.log("Flows:");
    for (const f of flows) console.log(`  - ${f}`);
  });

program.parse(process.argv);
