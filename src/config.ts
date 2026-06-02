import { readFileSync, existsSync } from "node:fs";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import yaml from "yaml";

export interface FlowSpecConfig {
  domain?: string;
  context?: string;
  openspecPath?: string;
}

const CONFIG_FILE = "flowspec/config.yaml";

export function configPath(cwd: string): string {
  return path.join(cwd, CONFIG_FILE);
}

export function loadConfig(cwd: string): FlowSpecConfig {
  const file = configPath(cwd);
  if (!existsSync(file)) return {};
  try {
    const raw = readFileSync(file, "utf-8");
    const parsed = yaml.parse(raw);
    return (parsed && typeof parsed === "object" ? parsed : {}) as FlowSpecConfig;
  } catch {
    return {};
  }
}

export function defaultDomain(cwd: string, cliDomain?: string): string | null {
  if (cliDomain) return cliDomain;
  const cfg = loadConfig(cwd);
  return cfg.domain ?? null;
}

export function writeConfig(cwd: string, config: FlowSpecConfig): void {
  const file = configPath(cwd);
  mkdirSync(path.dirname(file), { recursive: true });
  const content = yaml.stringify(config);
  writeFileSync(file, content, "utf-8");
}
