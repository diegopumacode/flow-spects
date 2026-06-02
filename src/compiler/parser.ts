function section(md: string, heading: string): string {
  const r = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`);
  const m = md.match(r);
  return m ? m[1].trim() : "";
}

function listItems(md: string, heading: string): string[] {
  return section(md, heading).split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

function subSections(md: string): { title: string; kv: Record<string, string> }[] {
  const items: { title: string; kv: Record<string, string> }[] = [];
  const r = /^### (.+)$\n([\s\S]*?)(?=^### |\z)/gm;
  let m;
  while ((m = r.exec(md)) !== null) {
    const kv: Record<string, string> = {};
    for (const l of m[2].split("\n")) {
      const p = l.match(/^-\s*\*\*(.+)\*\*:\s*(.+)/);
      if (p) kv[p[1].trim()] = p[2].trim();
    }
    items.push({ title: m[1].trim(), kv });
  }
  return items;
}

export interface ParsedFlow {
  name: string; domain: string;
  definition: { purpose: string; actors: string[]; triggers: string[]; successCriteria: string[]; outOfScope: string[] };
  steps: { num: number; name: string; actor: string; action: string; expected: string }[];
  rules: { business: string[]; validation: string[]; data: string[]; permissions: string[] };
  errors: { title: string; condition: string; expected: string; severity: string }[];
  edgeCases: { title: string; condition: string; expected: string }[];
  screens: { name: string; route: string; purpose: string; states: Record<string, string>; fields: { name: string; type: string; required: string; validation: string }[]; actions: string[] }[];
}

export function parseFlow(domain: string, data: Record<string, string | null>): ParsedFlow {
  const d = data["definition.md"] || "", u = data["user-flow.md"] || "", r = data["rules.md"] || "", e = data["edge-cases.md"] || "", s = data["screens.md"] || "";
  const name = d.match(/^# Flow:\s*(.+)$/m)?.[1]?.trim() || "";

  const steps: ParsedFlow["steps"] = [];
  const sr = /^### (\d+)\.\s+(.+)$\n([\s\S]*?)(?=^### |\z)/gm;
  let m;
  while ((m = sr.exec(u)) !== null) {
    const kv: Record<string, string> = {};
    for (const l of m[3].split("\n")) { const p = l.match(/^-\s*\*\*(.+)\*\*:\s*(.+)/); if (p) kv[p[1].trim()] = p[2].trim(); }
    steps.push({ num: parseInt(m[1]), name: m[2].trim(), actor: kv["Actor"] || "", action: kv["Action"] || "", expected: kv["Expected"] || "" });
  }

  const screenList: ParsedFlow["screens"] = [];
  const scr = /^## (.+)$\n([\s\S]*?)(?=^## |\z)/gm;
  while ((m = scr.exec(s)) !== null) {
    const b = m[2];
    const states: Record<string, string> = {};
    const stSec = b.match(/### States\n([\s\S]*?)(?=\n### |\n## |$)/);
    if (stSec) for (const l of stSec[1].split("\n")) { const p = l.match(/^-\s*\*\*(.+)\*\*:\s*(.+)/); if (p) states[p[1].trim()] = p[2].trim(); }
    const fields: ParsedFlow["screens"][0]["fields"] = [];
    const ft = b.match(/\| Field \|.*\n\|[-| ]+\|\n([\s\S]*?)(?=\n\n|\n###|\n##|$)/);
    if (ft) for (const row of ft[1].split("\n").filter(Boolean)) { const c = row.split("|").map((x) => x.trim()).filter(Boolean); if (c.length >= 4) fields.push({ name: c[0], type: c[1], required: c[2], validation: c[3] }); }
    const actions: string[] = [];
    const aSec = b.match(/### Actions\n([\s\S]*?)(?=\n### |\n## |$)/);
    if (aSec) for (const l of aSec[1].split("\n")) { const a = l.replace(/^-\s*/, "").trim(); if (a) actions.push(a); }
    screenList.push({ name: m[1].trim(), route: b.match(/\*\*Route\*\*:\s*(.+)/)?.[1]?.trim() || "", purpose: b.match(/\*\*Purpose\*\*:\s*(.+)/)?.[1]?.trim() || "", states, fields, actions });
  }

  return {
    name, domain,
    definition: { purpose: section(d, "Purpose") || "", actors: listItems(d, "Actors"), triggers: listItems(d, "Triggers"), successCriteria: listItems(d, "Success Criteria"), outOfScope: listItems(d, "Out of Scope") },
    steps,
    rules: { business: listItems(r, "Business Rules"), validation: listItems(r, "Validation Rules"), data: listItems(r, "Data Rules"), permissions: listItems(r, "Permissions") },
    errors: subSections(section(e, "Error Scenarios")).map((x) => ({ title: x.title, condition: x.kv["Condition"] || "", expected: x.kv["Expected Behavior"] || x.kv["Expected"] || "", severity: x.kv["Severity"] || "medium" })),
    edgeCases: subSections(section(e, "Edge Cases")).map((x) => ({ title: x.title, condition: x.kv["Condition"] || "", expected: x.kv["Expected Behavior"] || x.kv["Expected"] || "" })),
    screens: screenList,
  };
}
