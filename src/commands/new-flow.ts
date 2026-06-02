import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFile } from "../utils/files.js";

type Answers = {
  name: string;
  domain: string;
  purpose: string;
  actors: { name: string; desc: string }[];
  triggers: string[];
  criteria: string[];
  steps: { num: number; name: string; actor: string; action: string; expected: string }[];
  businessRules: string[];
  validationRules: string[];
  dataRules: string[];
  permissions: string[];
  errorScenarios: { name: string; condition: string; expected: string; severity: string }[];
  edgeCases: { name: string; condition: string; expected: string }[];
  screens: {
    name: string; route: string; purpose: string;
    states: { name: string; desc: string }[];
    fields: { name: string; type: string; required: string; validation: string }[];
    actions: string[];
  }[];
};

async function prompt(rl: ReturnType<typeof createInterface>, q: string, def?: string): Promise<string> {
  const a = await rl.question(def ? `${q} [${def}]: ` : `${q}: `);
  return a.trim() || def || "";
}

async function multiPrompt(rl: ReturnType<typeof createInterface>, label: string, single: string): Promise<string[]> {
  const items: string[] = [];
  console.log(`\n--- ${label} (empty to finish) ---`);
  while (true) {
    const a = await prompt(rl, `  ${single}`);
    if (!a) break;
    items.push(a);
  }
  return items;
}

async function interactiveNew(name: string): Promise<Answers> {
  const rl = createInterface({ input, output });
  const ans: Answers = {
    name,
    domain: "",
    purpose: "",
    actors: [],
    triggers: [],
    criteria: [],
    steps: [],
    businessRules: [],
    validationRules: [],
    dataRules: [],
    permissions: [],
    errorScenarios: [],
    edgeCases: [],
    screens: [],
  };

  console.log(`\nCreating flow: ${name}\n`);

  ans.domain = await prompt(rl, "Domain", "default");

  ans.purpose = await prompt(rl, "What is the purpose of this flow");

  console.log(`\n--- Actors ---`);
  while (true) {
    const nameA = await prompt(rl, "  Actor name (empty to finish)");
    if (!nameA) break;
    const desc = await prompt(rl, `  Description for "${nameA}"`);
    ans.actors.push({ name: nameA, desc });
  }

  ans.triggers = await multiPrompt(rl, "Triggers", "Trigger");
  ans.criteria = await multiPrompt(rl, "Success Criteria", "Criterion");

  console.log(`\n--- User Flow Steps ---`);
  let stepNum = 1;
  while (true) {
    const stepName = await prompt(rl, `  Step ${stepNum} name (empty to finish)`);
    if (!stepName) break;
    const actor = await prompt(rl, `  Actor for "${stepName}"`, ans.actors[0]?.name || "User");
    const action = await prompt(rl, `  Action`);
    const expected = await prompt(rl, `  Expected result`);
    ans.steps.push({ num: stepNum++, name: stepName, actor, action, expected });
  }

  ans.businessRules = await multiPrompt(rl, "Business Rules", "Rule");
  ans.validationRules = await multiPrompt(rl, "Validation Rules", "Rule");
  ans.dataRules = await multiPrompt(rl, "Data Rules", "Rule");
  ans.permissions = await multiPrompt(rl, "Permissions", "Permission");

  console.log(`\n--- Error Scenarios ---`);
  while (true) {
    const eName = await prompt(rl, `  Error scenario name (empty to finish)`);
    if (!eName) break;
    const condition = await prompt(rl, `  Condition`);
    const expected = await prompt(rl, `  Expected behavior`);
    const severity = await prompt(rl, `  Severity (high/medium/low)`, "medium");
    ans.errorScenarios.push({ name: eName, condition, expected, severity });
  }

  console.log(`\n--- Edge Cases ---`);
  while (true) {
    const ecName = await prompt(rl, `  Edge case name (empty to finish)`);
    if (!ecName) break;
    const condition = await prompt(rl, `  Condition`);
    const expected = await prompt(rl, `  Expected behavior`);
    ans.edgeCases.push({ name: ecName, condition, expected });
  }

  console.log(`\n--- Screens ---`);
  while (true) {
    const screenName = await prompt(rl, `  Screen name (empty to finish)`);
    if (!screenName) break;
    const route = await prompt(rl, `  Route`, "/");
    const purpose = await prompt(rl, `  Purpose`);

    const states: { name: string; desc: string }[] = [];
    console.log(`  --- States for "${screenName}" ---`);
    while (true) {
      const sName = await prompt(rl, `    State name (empty to finish)`);
      if (!sName) break;
      const sDesc = await prompt(rl, `    Description`);
      states.push({ name: sName, desc: sDesc });
    }

    const fields: { name: string; type: string; required: string; validation: string }[] = [];
    console.log(`  --- Fields for "${screenName}" ---`);
    while (true) {
      const fName = await prompt(rl, `    Field name (empty to finish)`);
      if (!fName) break;
      const fType = await prompt(rl, `    Type`, "text");
      const fReq = await prompt(rl, `    Required`, "yes");
      const fVal = await prompt(rl, `    Validation`);
      fields.push({ name: fName, type: fType, required: fReq, validation: fVal });
    }

    const actions = await multiPrompt(rl, `Actions for "${screenName}"`, "Action");

    ans.screens.push({ name: screenName, route, purpose, states, fields, actions });
  }

  rl.close();
  return ans;
}

function writeFlow(cwd: string, ans: Answers): void {
  const base = `${cwd}/domains/${ans.domain}/flows/${ans.name}`;

  const esc = (s: string) => s.replace(/"/g, '\\"');

  // definition.md
  let def = `# Flow: ${ans.name}\n\n## Purpose\n${ans.purpose}\n\n## Actors\n`;
  for (const a of ans.actors) def += `- ${a.name}${a.desc ? ` (${a.desc})` : ""}\n`;
  if (ans.triggers.length) { def += `\n## Triggers\n`; for (const t of ans.triggers) def += `- ${t}\n`; }
  if (ans.criteria.length) { def += `\n## Success Criteria\n`; for (const c of ans.criteria) def += `- ${c}\n`; }
  writeFile(`${base}/definition.md`, def);

  // user-flow.md
  let uf = `# User Flow: ${ans.name}\n\n`;
  if (ans.steps.length) {
    const nodeNames = ans.steps.map((s) => s.name.replace(/\s+/g, "_"));
    uf += "## Diagram\n\n```mermaid\ngraph TD\n";
    uf += `    ${nodeNames.join(" --> ")}\n`;
    uf += "```\n\n## Steps\n\n";
    for (const s of ans.steps) {
      uf += `### ${s.num}. ${s.name}\n`;
      uf += `- **Actor**: ${s.actor}\n`;
      uf += `- **Action**: ${s.action}\n`;
      uf += `- **Expected**: ${s.expected}\n\n`;
    }
  }
  writeFile(`${base}/user-flow.md`, uf);

  // rules.md
  let rules = `# Rules: ${ans.name}\n\n`;
  if (ans.businessRules.length) { rules += `## Business Rules\n`; for (const r of ans.businessRules) rules += `- ${r}\n`; rules += "\n"; }
  if (ans.validationRules.length) { rules += `## Validation Rules\n`; for (const r of ans.validationRules) rules += `- ${r}\n`; rules += "\n"; }
  if (ans.dataRules.length) { rules += `## Data Rules\n`; for (const r of ans.dataRules) rules += `- ${r}\n`; rules += "\n"; }
  if (ans.permissions.length) { rules += `## Permissions\n`; for (const r of ans.permissions) rules += `- ${r}\n`; }
  writeFile(`${base}/rules.md`, rules);

  // edge-cases.md
  let ec = `# Edge Cases: ${ans.name}\n\n`;
  if (ans.errorScenarios.length) {
    ec += `## Error Scenarios\n\n`;
    for (const e of ans.errorScenarios) {
      ec += `### ${e.name}\n- **Condition**: ${e.condition}\n- **Expected Behavior**: ${e.expected}\n- **Severity**: ${e.severity}\n\n`;
    }
  }
  if (ans.edgeCases.length) {
    ec += `## Edge Cases\n\n`;
    for (const e of ans.edgeCases) {
      ec += `### ${e.name}\n- **Condition**: ${e.condition}\n- **Expected Behavior**: ${e.expected}\n\n`;
    }
  }
  writeFile(`${base}/edge-cases.md`, ec);

  // screens.md
  let screens = `# Screens: ${ans.name}\n\n`;
  for (const s of ans.screens) {
    screens += `## ${s.name}\n- **Route**: ${s.route}\n- **Purpose**: ${s.purpose}\n\n`;
    if (s.states.length) {
      screens += `### States\n`;
      for (const st of s.states) screens += `- **${st.name}**: ${st.desc}\n`;
      screens += "\n";
    }
    if (s.fields.length) {
      screens += "### Fields\n| Field | Type | Required | Validation |\n|-------|------|----------|------------|\n";
      for (const f of s.fields) screens += `| ${f.name} | ${f.type} | ${f.required} | ${f.validation} |\n`;
      screens += "\n";
    }
    if (s.actions.length) {
      screens += `### Actions\n`;
      for (const a of s.actions) screens += `- ${a}\n`;
      screens += "\n";
    }
  }
  writeFile(`${base}/screens.md`, screens);

  console.log(`\n  ✓ Flow "${ans.name}" created in ${base}`);
  console.log(`  Files: definition.md, user-flow.md, rules.md, edge-cases.md, screens.md`);
}

export async function newFlow(cwd: string, name: string): Promise<void> {
  const ans = await interactiveNew(name);
  writeFlow(cwd, ans);
}
