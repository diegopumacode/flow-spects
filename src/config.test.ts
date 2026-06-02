import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { loadConfig, writeConfig, configPath, defaultDomain } from "./config.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = path.join(tmpdir(), `flowspec-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("config", () => {
  it("returns empty object when no config exists", () => {
    const cfg = loadConfig(tmpDir);
    expect(cfg).toEqual({});
  });

  it("writes and loads config", () => {
    writeConfig(tmpDir, { domain: "my-app", context: "Test project" });
    expect(existsSync(configPath(tmpDir))).toBe(true);
    const cfg = loadConfig(tmpDir);
    expect(cfg.domain).toBe("my-app");
    expect(cfg.context).toBe("Test project");
  });

  it("returns null defaultDomain when no config", () => {
    expect(defaultDomain(tmpDir)).toBeNull();
  });

  it("returns cliDomain over config domain", () => {
    writeConfig(tmpDir, { domain: "my-app" });
    expect(defaultDomain(tmpDir, "cli-domain")).toBe("cli-domain");
  });

  it("returns config domain when no cliDomain", () => {
    writeConfig(tmpDir, { domain: "my-app" });
    expect(defaultDomain(tmpDir)).toBe("my-app");
  });

  it("handles empty config file", () => {
    mkdirSync(path.dirname(configPath(tmpDir)), { recursive: true });
    writeFileSync(configPath(tmpDir), "", "utf-8");
    const cfg = loadConfig(tmpDir);
    expect(cfg).toEqual({});
  });
});
