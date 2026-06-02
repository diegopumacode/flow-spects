import type { ParsedFlow } from "./parser.js";

export function compileOverview(f: ParsedFlow): string {
  const l: string[] = [];
  l.push(`# ${f.name}  ·  ${f.domain}`);
  l.push(""); l.push("## Overview"); l.push(""); l.push(f.definition.purpose || "—");
  l.push(""); l.push("### Actors"); for (const a of f.definition.actors) l.push(`- ${a}`);
  l.push(""); l.push("### Triggers"); for (const t of f.definition.triggers) l.push(`- ${t}`);
  l.push(""); l.push("## Journey"); l.push("");
  for (const s of f.steps) { l.push(`### ${s.num}. ${s.name}  (${s.actor})`); l.push(`- **Action**: ${s.action}`); l.push(`- **Expected**: ${s.expected}`); l.push(""); }
  if (f.errors.length) { l.push("## Error Scenarios"); l.push(""); for (const e of f.errors) { const b = e.severity === "high" ? "🔴" : e.severity === "medium" ? "🟡" : "🟢"; l.push(`### ${b} ${e.title}`); l.push(`- ${e.condition} → ${e.expected}`); l.push(""); } }
  if (f.edgeCases.length) { l.push("## Edge Cases"); l.push(""); for (const e of f.edgeCases) { l.push(`### ${e.title}`); l.push(`- ${e.condition} → ${e.expected}`); l.push(""); } }
  if (f.definition.successCriteria.length) { l.push("## Success Criteria"); for (const c of f.definition.successCriteria) l.push(`- [ ] ${c}`); l.push(""); }
  return l.join("\n");
}

export function compileDesignSpec(f: ParsedFlow): string {
  const l: string[] = [];
  l.push(`# Design: ${f.name}`); l.push("");
  for (const s of f.screens) {
    l.push(`## ${s.name}`); if (s.route) l.push(`- **Route**: \`${s.route}\``); if (s.purpose) l.push(`- **Purpose**: ${s.purpose}`);
    l.push("");
    const states = Object.entries(s.states);
    if (states.length) { l.push("### States"); for (const [k, v] of states) l.push(`- **${k}**: ${v}`); l.push(""); }
    if (s.fields.length) { l.push("### Fields"); l.push("| Field | Type | Required | Validation |"); l.push("|-------|------|----------|------------|"); for (const f of s.fields) l.push(`| ${f.name} | ${f.type} | ${f.required} | ${f.validation} |`); l.push(""); }
    if (s.actions.length) { l.push("### Actions"); for (const a of s.actions) l.push(`- ${a}`); l.push(""); }
  }
  if (f.rules.validation.length) { l.push("## Validation"); for (const v of f.rules.validation) l.push(`- ${v}`); l.push(""); }
  if (f.rules.business.length) { l.push("## Business Rules"); for (const r of f.rules.business) l.push(`- ${r}`); l.push(""); }
  if (f.rules.permissions.length) { l.push("## Permissions"); for (const p of f.rules.permissions) l.push(`- ${p}`); l.push(""); }
  return l.join("\n");
}

export function compileCompact(f: ParsedFlow): string {
  const l: string[] = [];
  l.push(`# ${f.name}  ·  \`${f.domain}\``); l.push(""); l.push(f.definition.purpose); l.push("");
  l.push("## Journey"); l.push(f.steps.map((s, i) => `${i + 1}. **${s.name}** — ${s.action}`).join("\n")); l.push("");
  if (f.screens.length) { l.push("## Screens"); for (const s of f.screens) l.push(`- **${s.name}** \`${s.route}\` ${Object.keys(s.states).length} states, ${s.fields.length} fields`); l.push(""); }
  const totalEc = f.errors.length + f.edgeCases.length;
  if (totalEc) { l.push(`## Edge Cases (${totalEc})`); for (const e of f.errors) l.push(`- 🔴 ${e.title}`); for (const e of f.edgeCases) l.push(`- ⚡ ${e.title}`); l.push(""); }
  const totalRules = f.rules.business.length + f.rules.validation.length + f.rules.data.length;
  l.push(`## Rules (${totalRules})`); l.push(`- ${f.rules.business.length} business`); l.push(`- ${f.rules.validation.length} validation`); l.push(`- ${f.rules.data.length} data`);
  return l.join("\n");
}

export function toJSON(f: ParsedFlow): Record<string, unknown> {
  return {
    name: f.name, domain: f.domain,
    purpose: f.definition.purpose,
    actors: f.definition.actors,
    triggers: f.definition.triggers,
    steps: f.steps,
    rules: f.rules,
    errors: f.errors,
    edgeCases: f.edgeCases,
    screens: f.screens.map((s) => ({ name: s.name, route: s.route, states: s.states, fields: s.fields, actions: s.actions })),
    successCriteria: f.definition.successCriteria,
    summary: { screens: f.screens.length, steps: f.steps.length, rules: f.rules.business.length + f.rules.validation.length + f.rules.data.length, edgeCases: f.errors.length + f.edgeCases.length, criticalErrors: f.errors.filter((e) => e.severity === "high").length },
  };
}
