import { spawn } from "node:child_process";
import process from "node:process";

await runOrThrow("pnpm", ["typecheck"], process.env);
await runOrThrow("pnpm", ["exec", "next", "build"], {
  ...process.env,
  NEXT_PUBLIC_BBS_SIMULATE: "true",
});

async function runOrThrow(command, args, env) {
  const result = await run(command, args, env);
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
}

async function run(command, args, env) {
  return await new Promise((resolve) => {
    const child =
      process.platform === "win32"
        ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", toWindowsCommand(command, args)], {
            cwd: process.cwd(),
            env,
            shell: false,
            windowsHide: true,
            stdio: "inherit",
          })
        : spawn(command, args, {
            cwd: process.cwd(),
            env,
            shell: false,
            stdio: "inherit",
          });

    child.on("close", (code) => resolve({ code: code ?? 1, stdout: "", stderr: "" }));
    child.on("error", (error) =>
      resolve({
        code: 1,
        stdout: "",
        stderr: error.message,
      }),
    );
  });
}

function toWindowsCommand(command, args) {
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
