const baseUrl = process.env.HOSTINGER_SITE_URL;
const expectedCommit = process.env.EXPECTED_COMMIT;

if (!baseUrl || !expectedCommit) {
  throw new Error(
    "HOSTINGER_SITE_URL and EXPECTED_COMMIT are required for deployment verification.",
  );
}

let lastError;
let verified = false;

for (let attempt = 1; attempt <= 12; attempt += 1) {
  try {
    const versionResponse = await fetch(new URL("/deploy-version.json", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!versionResponse.ok) {
      throw new Error(`Version check returned HTTP ${versionResponse.status}`);
    }

    const version = await versionResponse.json();
    if (version.commit !== expectedCommit) {
      throw new Error(`Expected commit ${expectedCommit}, found ${version.commit ?? "unknown"}`);
    }

    const apiResponse = await fetch(new URL("/api/auth.php?action=me", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const contentType = apiResponse.headers.get("content-type") ?? "";
    if (apiResponse.status !== 401 || !contentType.includes("application/json")) {
      const body = await apiResponse.text();
      throw new Error(
        `PHP auth API check returned HTTP ${apiResponse.status} (${contentType}): ${body.slice(0, 200)}`,
      );
    }

    const payload = await apiResponse.json();
    if (payload.error !== "Unauthorized") {
      throw new Error("PHP auth API did not return the expected unauthenticated response.");
    }

    console.log(
      `Hostinger is serving commit ${expectedCommit}; PHP auth API returned JSON as expected.`,
    );
    verified = true;
    break;
  } catch (error) {
    lastError = error;
    if (attempt < 12) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}

if (!verified) {
  throw new Error(
    `Hostinger deployment verification failed after 12 attempts: ${lastError.message}`,
  );
}
