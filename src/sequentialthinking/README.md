# Sequential Thinking MCP Server

An MCP server implementation that provides a tool for dynamic and reflective problem-solving through a structured thinking process.

Published on npm as [`@modelcontextprotocol/server-sequential-thinking`](https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking).

## Features

- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Generate and verify solution hypotheses

## Tool

### sequentialthinking

Facilitates a detailed, step-by-step thinking process for problem-solving and analysis.

**Inputs:**
- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (integer): Current thought number
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

Use positive integers for thought numbers and totals. JSON numbers such as `1` and `5` are preferred; numeric strings such as `"1"` and `"5"` are also accepted. Use JSON booleans (`true` or `false`) for boolean fields; the strings `"true"` and `"false"` are also accepted.

## Usage

The Sequential Thinking tool is designed for:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

In practice, you do not call `sequentialthinking` directly by hand unless your client exposes raw tool calls. Instead, connect the server to an MCP-aware host and ask the model to work through a problem. The host can then decide to call the tool one or more times while it works.

### What it looks like in use

Example prompts that typically benefit from this tool:

- `Plan a database migration from PostgreSQL 14 to 16, list risks, and revise the plan if downtime exceeds 5 minutes.`
- `Debug why this deployment only fails in production and summarize the evidence and next checks.`
- `Compare three architecture options for a file sync engine and branch if one assumption turns out to be wrong.`

### How to tell it is working

If your host or inspector shows tool activity, look for calls to `sequentialthinking` with fields such as:

- `thought`
- `thoughtNumber`
- `totalThoughts`
- `nextThoughtNeeded`

When the reasoning changes course, you may also see revision or branching fields like `isRevision`, `revisesThought`, `branchFromThought`, or `branchId`.

### Raw tool-call examples

If your client exposes raw calls, select `sequentialthinking` and use these JSON arguments. The examples form a short sequence; each call records one step.

An ordinary step:

```json
{
  "thought": "Check the migration downtime budget before choosing an approach.",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "nextThoughtNeeded": true
}
```

A revision of the first step:

```json
{
  "thought": "The confirmed downtime budget is two minutes; evaluate approaches against that limit.",
  "thoughtNumber": 2,
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "isRevision": true,
  "revisesThought": 1
}
```

A branch from the first step:

```json
{
  "thought": "Record a staged migration as an alternative to evaluate in a rehearsal.",
  "thoughtNumber": 3,
  "totalThoughts": 3,
  "nextThoughtNeeded": false,
  "branchFromThought": 1,
  "branchId": "staged-migration"
}
```

The tool records steps and returns progress metadata. It does not independently validate the claims in a step or guarantee a correct solution.

### Quick manual verification

After installing the server in your MCP host:

1. Restart or reload the host so it reconnects to the server.
2. Confirm the `sequentialthinking` tool appears in the host's MCP tool list or inspector.
3. Run the raw examples if the host supports them, or ask the host to use the tool for a planning task.
4. Inspect the tool calls and returned progress metadata. The host decides whether to invoke the tool when responding to ordinary prompts.

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

On Windows, use `cmd /c` to launch `npx`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "sequentialthinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

To disable logging of thought information set env var: `DISABLE_THOUGHT_LOGGING` to `true`.

### Usage with VS Code

For quick installation, click one of the installation buttons below...

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D&quality=insiders)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D&quality=insiders)

For manual installation, you can configure the MCP server using one of these methods:

**Method 1: User Configuration (Recommended)**
Add the configuration to your user-level MCP configuration file. Open the Command Palette (`Ctrl + Shift + P`) and run `MCP: Open User Configuration`. This will open your user `mcp.json` file where you can add the server configuration.

**Method 2: Workspace Configuration**
Alternatively, you can add the configuration to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> For more details about MCP configuration in VS Code, see the [official VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

For NPX installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

On Windows, use:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

For Docker installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

### Usage with Codex CLI

Run the following:

#### npx

```bash
codex mcp add sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking
```

## Building

From the repository root, install dependencies and run this server's tests:

```bash
npm ci
npm test --workspace @modelcontextprotocol/server-sequential-thinking
```

The test command builds the current TypeScript source before running the unit and server integration tests with coverage. From `src/sequentialthinking`, you can also run `npm test`. To build without running tests, use `npm run build` in that directory.

Docker:

```bash
docker build -t mcp/sequentialthinking -f src/sequentialthinking/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
