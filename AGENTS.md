# FlowSpec — Agent Guide

FlowSpec manages **product flow knowledge** as structured markdown files. Use it alongside OpenSpec (the real implementation spec tool).

## Directory Structure

```
domains/<domain>/flows/<flow-name>/
├── definition.md     # Purpose, actors, triggers, success criteria
├── user-flow.md      # Step-by-step user journey with scenarios
├── rules.md          # Business rules, validation, permissions
├── edge-cases.md     # Error scenarios and edge cases
└── screens.md        # Screen descriptions with states, fields, actions
```

## Commands

| Command | Purpose |
|---------|---------|
| `flow new <name>` | Create a new flow interactively (asks everything) |
| `flow compile <name>` | Print overview doc (product view) |
| `flow compile <name> --design` | Print design spec (screens, states, fields) |
| `flow compile <name> --compact` | Print one-page summary |
| `flow compile <name> --json` | Print structured JSON |
| `flow list` | List all flows |

## Integration with OpenSpec

1. **Read the flow** in `domains/<domain>/flows/<name>/` to understand product intent
2. **Create OpenSpec changes** manually with `/opsx:propose` referencing the flow
3. **Implement** using OpenSpec tasks
4. **Flow stays** as permanent product knowledge

## Principles

- Flow = permanent product knowledge (never delete)
- FlowSpec manages what you build and why
- OpenSpec manages how you build it
- Code is the final truth: Code > OpenSpec > Flow
