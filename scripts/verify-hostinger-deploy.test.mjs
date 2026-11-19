import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

test("deployment verification requires the expected commit and a working PHP API", async (t) => {
  const expectedCommit = "0123456789abcdef0123456789abcdef01234567";
  const server = createServer((request, response) => {
    if (request.url === "/deploy-version.json") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ commit: expectedCommit }));
      return;
    }

    if (request.url === "/api/auth.php?action=me") {
      response.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "Unauthorized" }));
      return;
    }

    response.writeHead(404);
    response.end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const child = spawn(process.execPath, ["scripts/verify-hostinger-deploy.mjs"], {
    env: {
      ...process.env,
      HOSTINGER_SITE_URL: `http://127.0.0.1:${address.port}`,
      EXPECTED_COMMIT: expectedCommit,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  const [exitCode] = await once(child, "close");

  assert.equal(exitCode, 0, stderr);
  assert.match(stdout, new RegExp(`serving commit ${expectedCommit}`));
});
