import { createServer } from "node:http";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const distDir = resolve("dist");
const artifactsDir = resolve(".artifacts/ui-review");
const tracePath = join(artifactsDir, "ui-review-trace.zip");
const summaryPath = join(artifactsDir, "summary.json");
const shouldManageServer = !process.env.UI_REVIEW_BASE_URL;

async function main() {
  await rm(artifactsDir, { force: true, recursive: true });
  await mkdir(artifactsDir, { recursive: true });

  const serverContext = shouldManageServer ? await startStaticServer() : null;
  const baseURL = process.env.UI_REVIEW_BASE_URL ?? serverContext?.baseURL;

  try {
    if (!baseURL) {
      throw new Error("A UI review base URL could not be determined.");
    }

    await waitForServer(baseURL);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      colorScheme: "light",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });

    const page = await context.newPage();
    const captures = [];

    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.locator("h2", { hasText: "Posts" }).waitFor({ timeout: 10000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    captures.push(await capture(page, "01-home-preview.png"));

    const compactButton = page.getByRole("button", { name: /compact/i });
    if (await compactButton.count()) {
      await compactButton.click();
      await page.locator(".board-table--compact").waitFor({ timeout: 5000 });
      captures.push(await capture(page, "02-home-compact.png"));
    }

    const searchButton = page.getByRole("button", { name: /search/i });
    if (await searchButton.count()) {
      await searchButton.click();
      await page.locator(".modal-card").waitFor({ timeout: 5000 });
      captures.push(await capture(page, "03-search-modal.png"));

      const closeButton = page.getByRole("button", { name: /^close$/i });
      if (await closeButton.count()) {
        await closeButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }

    const previewButton = page.getByRole("button", { name: /preview/i });
    if (await previewButton.count()) {
      await previewButton.click();
      await page.locator(".board-table--preview").waitFor({ timeout: 5000 });
    }

    const firstPostLink = page.locator(".board-table__link").first();
    if (await firstPostLink.count()) {
      await firstPostLink.click();
      await page.waitForURL(/\/articles\//, { timeout: 10000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      const loadingCommentNotice = page.getByText("The selected comment is loading.");
      if (await loadingCommentNotice.count()) {
        await loadingCommentNotice.waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
      }
      captures.push(await capture(page, "04-post-detail.png"));
    }

    await page.goto(`${baseURL}/articles/new`, { waitUntil: "domcontentloaded" });
    await page.locator("h2", { hasText: "Write a post" }).waitFor({ timeout: 10000 });
    captures.push(await capture(page, "05-write-post.png"));

    await context.tracing.stop({ path: tracePath });
    await browser.close();

    await writeFile(
      summaryPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseURL,
          captures,
          tracePath,
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`UI review artifacts saved to ${artifactsDir}`);
    captures.forEach((file) => console.log(`- ${file}`));
    console.log(`- ${tracePath}`);
  } finally {
    if (serverContext) {
      await stopStaticServer(serverContext.server);
    }
  }
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const filePath = await resolveRequestPath(requestUrl.pathname);
      const content = await readFile(filePath);

      response.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "no-store",
      });
      response.end(content);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(String(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(undefined));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine the local review server address.");
  }

  return {
    server,
    baseURL: `http://127.0.0.1:${address.port}`,
  };
}

async function stopStaticServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(undefined);
    });
  });
}

async function resolveRequestPath(pathname) {
  if (pathname === "/") {
    return join(distDir, "index.html");
  }

  const candidate = join(distDir, normalize(pathname).replace(/^\\|^\//, ""));
  try {
    const fileStat = await stat(candidate);
    if (fileStat.isFile()) {
      return candidate;
    }
  } catch {
    // Fall through to SPA index.
  }

  return join(distDir, "index.html");
}

function contentType(filePath) {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
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
      // Keep polling until the local review server is ready.
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function capture(page, fileName) {
  const absolutePath = join(artifactsDir, fileName);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return absolutePath;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
