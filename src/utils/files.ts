import fs from "node:fs";
import path from "node:path";

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function dirExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

export function listFlows(cwd: string, domain?: string): string[] {
  const domainsDir = path.join(cwd, "domains");
  if (!dirExists(domainsDir)) return [];
  const domains = domain ? [domain] : fs.readdirSync(domainsDir).filter((d) => fs.statSync(path.join(domainsDir, d)).isDirectory());
  const flows: string[] = [];
  for (const d of domains) {
    const flowsDir = path.join(domainsDir, d, "flows");
    if (dirExists(flowsDir)) {
      for (const f of fs.readdirSync(flowsDir)) {
        if (fs.statSync(path.join(flowsDir, f)).isDirectory()) flows.push(`${d}/${f}`);
      }
    }
  }
  return flows;
}

export function getAllFlowData(cwd: string, domain: string, flow: string): Record<string, string | null> {
  const flowDir = path.join(cwd, "domains", domain, "flows", flow);
  if (!dirExists(flowDir)) return {};
  const result: Record<string, string | null> = {};
  for (const file of ["definition.md", "user-flow.md", "rules.md", "edge-cases.md", "screens.md"]) {
    result[file] = readFile(path.join(flowDir, file));
  }
  return result;
}
