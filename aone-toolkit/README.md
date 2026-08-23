# Aone Toolkit

Aone is an AI workflow cockpit with a developer toolkit attached. The main path is:

1. Design the Agent context in Agent Studio.
2. Run the task in Multi-Agent Workbench.
3. Capture, inspect, format, compare, and package the output with focused tools.

The project is built with SvelteKit, Svelte 5, TypeScript, Vite, Tailwind CSS, and local browser storage.

## Core Workspaces

- Agent Studio: assemble Agents, Personas, Skills, Squads, and reusable Workflows.
- Multi-Agent Workbench: execute direct tasks, prepared Agents, Squads, and saved Workflows.
- Prompt Hub: preserve prompts, templates, collections, and reusable instructions.

## Toolkit Areas

- Data editors: JSON, YAML, and table editing.
- API tools: API response inspection and OpenAPI exploration.
- Data generation and analysis: mock data, charts, and SQL query review.
- Developer utilities: formatting, diffing, scanning, encoding, conversion, snippets, SVG, and CSS helpers.

## Development

Install dependencies:

```sh
npm install
```

Run the local app:

```sh
npm run dev
```

Check Svelte and TypeScript diagnostics:

```sh
npm run check
```

Create a production build:

```sh
npm run build
```

Preview a production build:

```sh
npm run preview
```

## Project Map

- `src/lib/config.ts` controls the global tool directory used by the homepage, sidebar, and command palette.
- `src/routes/+page.svelte` is the main dashboard and product entry point.
- `src/routes/agent-studio/` contains setup and resource-building workflows.
- `src/routes/multi-agent/` contains the execution workbench.
- `src/routes/developer-utilities/` contains compact single-purpose utilities.
- `src/routes/table-editor/lib/` contains shared structured-data conversion helpers.

## Product Principle

Prefer a task-first workflow over a tool-first maze. New features should either strengthen the Agent -> Workbench -> Asset loop or clearly support one of its handoff steps.
