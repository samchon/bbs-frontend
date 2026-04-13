import { spawn } from "node:child_process";
import { createServer } from "node:net";
import process from "node:process";

const port = await findOpenPort();
const baseURL = `http://127.0.0.1:${port}`;
const server = await startAppServer(port);

try {
  await waitForServer(baseURL);
  const code = await runPlaywright(baseURL);
  process.exitCode = code;
} finally {
  await stopAppServer(server);
}

async function startAppServer(port) {
  const child =
    process.platform === "win32"
      ? spawn(
          "cmd.exe",
          ["/d", "/s", "/c", `pnpm exec next start --hostname 127.0.0.1 --port ${port}`],
          {
            cwd: process.cwd(),
            env: {
              ...process.env,
              NEXT_PUBLIC_BBS_SIMULATE: "true",
            },
            stdio: ["ignore", "pipe", "pipe"],
          },
        )
      : spawn(
          "pnpm",
          ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
          {
            cwd: process.cwd(),
            env: {
              ...process.env,
              NEXT_PUBLIC_BBS_SIMULATE: "true",
            },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopAppServer(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    await onceExit(killer);
    return;
  }

  child.kill("SIGTERM");
  await onceExit(child);
}

async function runPlaywright(baseURL) {
  return await new Promise((resolve) => {
    const env = {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseURL,
    };

    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", "pnpm exec playwright test"], {
            cwd: process.cwd(),
            env,
            stdio: "inherit",
          })
        : spawn("pnpm", ["exec", "playwright", "test"], {
            cwd: process.cwd(),
            env,
            stdio: "inherit",
          });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function findOpenPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(undefined));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to find an open port for Playwright.");
  }

  const { port } = address;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(undefined);
    });
  });
  return port;
}

async function waitForServer(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the local test server is ready.
    }
    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function onceExit(child) {
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", () => resolve(undefined));
  });
}
