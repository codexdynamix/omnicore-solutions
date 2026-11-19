import { execSync, spawn } from "node:child_process";
import { existsSync, cpSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { resolve, join, dirname } from "node:path";

console.log("[build:hostinger] Starting production build for Hostinger...");

const requiredEnvironment = [
  "HOSTINGER_DB_HOST",
  "HOSTINGER_DB_NAME",
  "HOSTINGER_DB_USER",
  "HOSTINGER_DB_PASSWORD",
  "CRM_ADMIN_EMAIL",
  "CRM_ADMIN_PASSWORD",
];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing required deployment environment variables: ${missingEnvironment.join(", ")}`,
  );
}

const distDir = resolve("dist");

// 1. Clean existing dist directory
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// 2. Run Vite build to generate client assets and bundles
console.log("[build:hostinger] Running Vite production build...");
execSync("node scripts/with-app-env.mjs node node_modules/vite/bin/vite.js build", { stdio: "inherit" });

// 3. Copy static assets from build output
const staticOutput = resolve(".vercel/output/static");
if (existsSync(staticOutput)) {
  console.log("[build:hostinger] Copying static build output to dist/ ...");
  cpSync(staticOutput, distDir, { recursive: true });
}

// 4. Copy all public static assets (images, logos, and favicon)
const publicDir = resolve("public");
if (existsSync(publicDir)) {
  console.log("[build:hostinger] Copying public static assets to dist/ ...");
  cpSync(publicDir, distDir, { recursive: true });
}

// 5. Deploy the PHP API at the URL path used by the frontend
const apiSourceDir = resolve("server", "api");
const apiDestDir = join(distDir, "api");
for (const file of ["auth.php", "common.php", "crm.php"]) {
  if (!existsSync(join(apiSourceDir, file))) {
    throw new Error(`Required PHP API file is missing: ${join(apiSourceDir, file)}`);
  }
}
cpSync(apiSourceDir, apiDestDir, { recursive: true });

// Generate private credentials outside the public API directory
const privateDir = join(distDir, "private");
mkdirSync(privateDir, { recursive: true });
const escapePhpString = (value) => String(value ?? "")
  .replace(/\\/g, "\\\\")
  .replace(/'/g, "\\'")
  .replace(/\r/g, "")
  .replace(/\n/g, "");
const phpConfig = `<?php
// Generated during deployment. Never commit database credentials.
define("DB_HOST", '${escapePhpString(process.env.HOSTINGER_DB_HOST)}');
define("DB_NAME", '${escapePhpString(process.env.HOSTINGER_DB_NAME)}');
define("DB_USER", '${escapePhpString(process.env.HOSTINGER_DB_USER)}');
define("DB_PASSWORD", '${escapePhpString(process.env.HOSTINGER_DB_PASSWORD)}');
define("ADMIN_EMAIL", '${escapePhpString(process.env.CRM_ADMIN_EMAIL)}');
define("ADMIN_PASSWORD", '${escapePhpString(process.env.CRM_ADMIN_PASSWORD)}');
`;
writeFileSync(join(privateDir, "config.php"), phpConfig, "utf8");

writeFileSync(
  join(distDir, "deploy-version.json"),
  `${JSON.stringify({ commit: process.env.GITHUB_SHA || "local" }, null, 2)}\n`,
  "utf8",
);
// 5. Detect latest production JS and CSS bundles
const assetsDir = join(distDir, "assets");
let mainJsFile = "";
let mainCssFile = "";

if (existsSync(assetsDir)) {
  const assetFiles = readdirSync(assetsDir);
  const jsCandidates = assetFiles.filter((f) => f.startsWith("index-") && f.endsWith(".js"));
  if (jsCandidates.length > 0) {
    mainJsFile = jsCandidates[jsCandidates.length - 1];
  } else {
    const anyJs = assetFiles.find((f) => f.endsWith(".js") && !f.includes("chunk"));
    mainJsFile = anyJs || "index.js";
  }

  const cssCandidates = assetFiles.filter((f) => f.startsWith("styles-") && f.endsWith(".css"));
  if (cssCandidates.length > 0) {
    mainCssFile = cssCandidates[cssCandidates.length - 1];
  } else {
    const anyCss = assetFiles.find((f) => f.endsWith(".css"));
    mainCssFile = anyCss || "styles.css";
  }
}

console.log(`[build:hostinger] Detected production bundles: JS=${mainJsFile}, CSS=${mainCssFile}`);

// 6. Prerender all site routes
const ROUTES = [
  "/",
  "/catalogue",
  "/services",
  "/services/mining",
  "/services/hardware",
  "/services/hire",
  "/services/farming",
  "/services/industry",
  "/contact",
  "/quote",
  "/projects",
  "/insights",
  "/insights/wet-vs-dry-concrete-pump-hire",
  "/insights/farm-hammer-mill-this-season",
  "/insights/gold-processing-payback",
  "/insights/rainy-season-construction-hire",
  "/insights/feed-pellets-second-income",
  "/insights/fence-making-business-zimbabwe",
  "/admin",
];

async function isServerRunning(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureLocalServer() {
  const port = await reservePort();
  const checkUrl = `http://127.0.0.1:${port}/`;

  console.log("[build:hostinger] Starting temporary preview server to pre-render static HTML pages...");
  const child = spawn("node", [
    "scripts/with-app-env.mjs",
    "node",
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ], {
    stdio: "ignore",
    detached: true,
  });

  try {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (await isServerRunning(checkUrl)) {
        console.log(`[build:hostinger] Temporary server ready on ${checkUrl}`);
        return { process: child, baseUrl: `http://127.0.0.1:${port}` };
      }
    }
  } catch (error) {
    child.kill();
    throw error;
  }

  child.kill();
  throw new Error("Could not start local rendering server for Hostinger pre-rendering.");
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not reserve a port for Hostinger pre-rendering.");
  }
  await new Promise((resolvePromise, reject) => {
    server.close((error) => error ? reject(error) : resolvePromise());
  });
  return address.port;
}

function processHtmlForProduction(rawHtml) {
  let html = rawHtml;

  // Replace dev entry script with production hashed bundle
  if (mainJsFile) {
    html = html.replace(
      /<script[^>]*src=["'][^"']*virtual:tanstack-start-dev-client-entry[^"']*["'][^>]*><\/script>/gi,
      `<script type="module" crossorigin src="/assets/${mainJsFile}"></script>`
    );
  }

  // Replace dev styles with production stylesheet
  if (mainCssFile) {
    html = html.replace(
      /<link[^>]*href=["'][^"']*@tanstack-start\/styles\.css[^"']*["'][^>]*\/?>/gi,
      `<link rel="stylesheet" crossorigin href="/assets/${mainCssFile}">`
    );
  }

  // Strip Vite dev-only scripts if present
  html = html.replace(/<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi, "");
  html = html.replace(/<script[^>]*src=["'][^"']*@react-refresh[^"']*["'][^>]*><\/script>/gi, "");

  // Ensure resilient TSR fallback script is in head or body
  const tsrSafetyScript = `
<script>
  window.$R = window.$R || {};
  window.$R["tsr"] = window.$R["tsr"] || [];
  window.$_TSR = window.$_TSR || {
    h() { this.hydrated = true; },
    e() { this.streamEnded = true; },
    c() {},
    p(e) { typeof e === "function" && e(); },
    buffer: [],
    initialized: true,
    t: new Map(),
    router: { manifest: { routes: {} }, matches: [] }
  };
</script>`;

  if (!html.includes("window.$_TSR") && !html.includes("self.$_TSR")) {
    html = html.replace("</head>", `${tsrSafetyScript}\n</head>`);
  }

  return html;
}

async function renderAllRoutes() {
  const { process: serverProc, baseUrl } = await ensureLocalServer();

  try {
    for (const route of ROUTES) {
      const url = `${baseUrl}${route}`;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(route === "/admin" ? 25000 : 8000),
        });
        if (!res.ok) {
          console.warn(`[build:hostinger] Warning: Fetch ${route} returned status ${res.status}`);
          if (route === "/admin") writeAdminSpaFallback();
          continue;
        }

        const rawHtml = await res.text();
        const finalHtml = processHtmlForProduction(rawHtml);

        // Determine destination paths
        let targetFile;
        if (route === "/") {
          targetFile = join(distDir, "index.html");
        } else {
          const subDir = join(distDir, route.replace(/^\//, ""));
          mkdirSync(subDir, { recursive: true });
          targetFile = join(subDir, "index.html");

          // Also write flat fallback (e.g. dist/catalogue.html)
          const flatFile = join(distDir, `${route.replace(/^\//, "")}.html`);
          mkdirSync(dirname(flatFile), { recursive: true });
          writeFileSync(flatFile, finalHtml, "utf8");
        }

        writeFileSync(targetFile, finalHtml, "utf8");
        console.log(`[build:hostinger] Pre-rendered: ${route} (${finalHtml.length} bytes)`);
      } catch (err) {
        console.error(`[build:hostinger] Error rendering route ${route}:`, err.message);
        if (route === "/admin") {
          writeAdminSpaFallback();
        }
      }
    }

    // Guarantee /admin is always on disk even if prerender skipped it
    const adminHtml = join(distDir, "admin.html");
    const adminDirHtml = join(distDir, "admin", "index.html");
    if (!existsSync(adminHtml) && !existsSync(adminDirHtml)) {
      writeAdminSpaFallback();
    }
  } finally {
    if (serverProc && typeof serverProc.kill === "function") {
      try {
        serverProc.kill();
      } catch (error) {
        console.error("[build:hostinger] Could not stop the temporary preview server.", error);
      }
    }
  }
}

await renderAllRoutes();

function writeAdminSpaFallback() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Operations Backoffice Ã‚Â· Omnicore</title>
  ${mainCssFile ? `<link rel="stylesheet" crossorigin href="/assets/${mainCssFile}">` : ""}
  <script>
    window.$R = window.$R || {};
    window.$R["tsr"] = window.$R["tsr"] || [];
    window.$_TSR = window.$_TSR || {
      h() { this.hydrated = true; },
      e() { this.streamEnded = true; },
      c() {},
      p(e) { typeof e === "function" && e(); },
      buffer: [],
      initialized: true,
      t: new Map(),
      router: { manifest: { routes: {} }, matches: [] }
    };
  </script>
  ${mainJsFile ? `<script type="module" crossorigin src="/assets/${mainJsFile}"></script>` : ""}
</head>
<body></body>
</html>`;
  mkdirSync(join(distDir, "admin"), { recursive: true });
  writeFileSync(join(distDir, "admin.html"), html, "utf8");
  writeFileSync(join(distDir, "admin", "index.html"), html, "utf8");
  console.log("[build:hostinger] Wrote SPA fallback for /admin");
}

// 7. Write production Apache / LiteSpeed .htaccess for Hostinger
const htaccessPath = join(distDir, ".htaccess");
const htaccessContent = `# ========================================================
# Hostinger Apache / LiteSpeed Configuration
# Omnicore Solutions - Pre-rendered Static + PHP/MySQL
# ========================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Block direct access to generated database credentials
  RewriteRule ^private/ - [F,L]
  # Hide the old source-tree path left by earlier deployments
  RewriteRule ^server/ - [F,L]

  # Backoffice Ã¢â‚¬â€ map /admin before Hostinger/directory rules can 404 it
  RewriteRule ^admin$ /admin.html [L]
  RewriteRule ^admin/$ /admin.html [L]

  # API requests must reach PHP and must never fall through to the SPA
  RewriteRule ^api/ - [L]

  # Don't rewrite real existing files
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Check if route.html exists (e.g. /catalogue -> /catalogue.html)
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^([^/]+)/?$ $1.html [L]

  # Check if route/index.html exists (e.g. /services/mining -> /services/mining/index.html)
  RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
  RewriteRule ^(.*)/?$ $1/index.html [L]

  # Fallback to index.html for client-side SPA routing
  RewriteRule . /index.html [L]
</IfModule>

# Caching & Compression for High Performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "^(index\\.html|deploy-version\\.json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  <FilesMatch "\\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff2)$">
    Header set Cache-Control "max-age=2592000, public"
  </FilesMatch>
</IfModule>
`;

writeFileSync(htaccessPath, htaccessContent, "utf8");
console.log("[build:hostinger] Created production .htaccess");
console.log("[build:hostinger] Successfully finished Hostinger build in ./dist/");
