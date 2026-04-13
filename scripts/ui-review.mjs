import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";

const artifactsDir = resolve(".artifacts/ui-review");
const tracePath = join(artifactsDir, "ui-review-trace.zip");
const summaryPath = join(artifactsDir, "summary.json");
const shouldManageServer = !process.env.UI_REVIEW_BASE_URL;

async function main() {
  await rm(artifactsDir, { force: true, recursive: true });
  await mkdir(artifactsDir, { recursive: true });

  const serverContext = shouldManageServer ? await startAppServer() : null;
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
    const checks = {};

    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.locator("h2", { hasText: "Posts" }).waitFor({ timeout: 10000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    captures.push(await capture(page, "01-home-preview.png"));

    checks.list = await verifyListControls(page);

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
      const loadingCommentsNotice = page.getByText("The comment list is loading.");
      if (await loadingCommentsNotice.count()) {
        await loadingCommentsNotice
          .waitFor({ state: "detached", timeout: 10000 })
          .catch(() => {});
      }
      captures.push(await capture(page, "04-post-detail.png"));
    }

    checks.responsive = await verifyResponsiveLayouts(browser, baseURL);

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
          checks,
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
      await stopAppServer(serverContext.process);
    }
  }
}

async function startAppServer() {
  const port = await findOpenPort();
  const command =
    process.platform === "win32"
      ? "cmd.exe"
      : "pnpm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `pnpm exec next start --hostname 127.0.0.1 --port ${port}`]
      : ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)];
  const child = spawn(command, args, {
    cwd: resolve("."),
    env: {
      ...process.env,
      NEXT_PUBLIC_BBS_SIMULATE: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return {
    process: child,
    baseURL: `http://127.0.0.1:${port}`,
  };
}

async function stopAppServer(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const taskkill = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    await onceExit(taskkill);
    return;
  }

  child.kill("SIGTERM");
  await onceExit(child);
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
    throw new Error("Unable to determine a local port for ui review.");
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

async function onceExit(child) {
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", () => resolve(undefined));
  });
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

async function verifyListControls(page) {
  const initialTitles = await readTitles(page);

  await page.getByLabel("Page size").selectOption("5");
  const pageSizeValue = await page.getByLabel("Page size").inputValue();
  if (pageSizeValue !== "5") {
    throw new Error(`Expected the page size control to switch to 5, received ${pageSizeValue}.`);
  }

  await page.getByLabel("Sort").selectOption("title_asc");
  const sortValue = await page.getByLabel("Sort").inputValue();
  if (sortValue !== "title_asc") {
    throw new Error(`Expected the sort control to switch to title_asc, received ${sortValue}.`);
  }

  const titlesAfterSort = await readTitles(page);

  await page.getByRole("button", { name: /search/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 5000 });
  await dialog.getByRole("textbox", { name: "Writer" }).fill("alpha");
  await dialog.getByRole("button", { name: /apply search/i }).click();
  await page.waitForLoadState("networkidle").catch(() => {});

  const filterSummary = (await page.locator(".filter-summary").textContent())?.trim() ?? "";

  if (!filterSummary) {
    throw new Error("Expected a visible search summary after applying a search.");
  }

  await page.getByRole("button", { name: /clear search/i }).click();
  await page.waitForFunction(
    () => !document.querySelector(".filter-summary"),
    undefined,
    { timeout: 10000 },
  );
  await page.getByLabel("Sort").selectOption("updated_desc");
  await page.getByLabel("Page size").selectOption("10");

  return {
    initialTitles,
    pageSizeValue,
    sortValue,
    titlesAfterSort,
    filterSummary,
  };
}

async function verifyResponsiveLayouts(browser, baseURL) {
  const cases = [
    { name: "mobile-home", viewport: { width: 390, height: 844 }, path: "/" },
    { name: "tablet-home", viewport: { width: 768, height: 1024 }, path: "/" },
    {
      name: "mobile-detail",
      viewport: { width: 390, height: 844 },
      path: "/articles/cefdf5f1-64a9-4046-b726-26e27beab738",
    },
    {
      name: "tablet-detail",
      viewport: { width: 768, height: 1024 },
      path: "/articles/cefdf5f1-64a9-4046-b726-26e27beab738",
    },
  ];

  const results = [];

  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: testCase.viewport });

    try {
      await page.goto(`${baseURL}${testCase.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      const hasHorizontalOverflow = metrics.scrollWidth > metrics.clientWidth;

      if (hasHorizontalOverflow) {
        throw new Error(
          `Responsive overflow detected for ${testCase.name}: scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}.`,
        );
      }

      results.push({
        ...testCase,
        ...metrics,
        hasHorizontalOverflow,
      });
    } finally {
      await page.close();
    }
  }

  return results;
}

async function readTitles(page) {
  return page.locator(".board-table__link").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim() ?? ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
