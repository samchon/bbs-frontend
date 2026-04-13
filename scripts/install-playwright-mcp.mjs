import { spawn } from "node:child_process";
import process from "node:process";

async function main() {
  const results = [];

  results.push(await ensureCodexPlaywright());
  results.push(await ensureClaudePlaywright());

  console.log("");
  console.log("Playwright MCP setup summary:");
  for (const result of results) {
    console.log(`- ${result}`);
  }
}

async function ensureCodexPlaywright() {
  const executable = await resolveExecutable("codex");
  if (!executable) {
    return "Codex CLI not found; skipped";
  }

  const hasServer = await run(executable, ["mcp", "get", "playwright"]);
  if (hasServer.code === 0) {
    return "Codex CLI already has a 'playwright' MCP server";
  }

  const addServer = await run(executable, [
    "mcp",
    "add",
    "playwright",
    "--",
    "npx",
    "-y",
    "@playwright/mcp@latest",
  ]);

  if (addServer.code === 0) {
    return "Codex CLI 'playwright' MCP server installed";
  }

  throw new Error(`Failed to configure Codex MCP:\n${addServer.stderr || addServer.stdout}`);
}

async function ensureClaudePlaywright() {
  const executable = await resolveExecutable("claude");
  if (!executable) {
    return "Claude CLI not found; skipped";
  }

  const hasServer = await run(executable, ["mcp", "get", "playwright"], {
    cwd: process.cwd(),
  });
  if (hasServer.code === 0) {
    return "Claude Code already has a project 'playwright' MCP server";
  }

  const addServer = await run(
    executable,
    [
      "mcp",
      "add",
      "-s",
      "project",
      "playwright",
      "--",
      "pnpm",
      "dlx",
      "@playwright/mcp@latest",
    ],
    { cwd: process.cwd() },
  );

  if (addServer.code === 0) {
    return "Claude Code project 'playwright' MCP server installed";
  }

  throw new Error(`Failed to configure Claude MCP:\n${addServer.stderr || addServer.stdout}`);
}

async function resolveExecutable(command) {
  const result =
    process.platform === "win32"
      ? await run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `where ${command}`])
      : await run("sh", ["-lc", `command -v ${command}`]);

  if (result.code !== 0) {
    return null;
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (process.platform === "win32") {
    return (
      lines.find((line) => line.toLowerCase().endsWith(".exe")) ??
      lines.find((line) => line.toLowerCase().endsWith(".cmd")) ??
      lines[0] ??
      null
    );
  }

  return lines[0] ?? null;
}

async function run(command, args, options = {}) {
  return await new Promise((resolve) => {
    const cwd = options.cwd ?? process.cwd();
    const lowerCommand = command.toLowerCase();
    const isWindowsCmd =
      process.platform === "win32" &&
      (lowerCommand.endsWith(".cmd") || lowerCommand.endsWith(".bat"));

    const child = isWindowsCmd
      ? spawn(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", toWindowsCommandString(command, args)],
          {
            cwd,
            env: process.env,
            shell: false,
            windowsHide: true,
          },
        )
      : spawn(command, args, {
          cwd,
          env: process.env,
          shell: false,
          windowsHide: true,
        });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on("error", (error) => {
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}${error.message}`,
      });
    });
  });
}

function toWindowsCommandString(command, args) {
  return [command, ...args].map(quoteWindowsArg).join(" ");
}

function quoteWindowsArg(value) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[ \t"]/.test(value)) {
    return value;
  }

  return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, "$1$1")}"`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
