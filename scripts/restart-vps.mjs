import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";

// Local/Lovable builds do not manage a PM2 application. Only restart the
// matching checkout on the VPS, after npm's build command succeeds.
const inventory = spawnSync("pm2", ["jlist"], { encoding: "utf8" });
if (inventory.error?.code === "ENOENT") {
  console.log("Build complete. No PM2 installation; skipping VPS restart.");
  process.exit(0);
}
if (inventory.error || inventory.status !== 0) {
  console.error("Unable to inspect PM2. The build succeeded, but restart was not performed.");
  process.exit(1);
}
const processes = JSON.parse(inventory.stdout);
const app = processes.find((process) => process.name === "property-setu-web");
if (!app || realpathSync(app.pm2_env.pm_cwd) !== realpathSync(process.cwd())) {
  console.log("Build complete. This checkout has no matching PM2 app; skipping VPS restart.");
  process.exit(0);
}
const restart = spawnSync("pm2", ["restart", "property-setu-web", "--update-env"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3005",
    HOST: "127.0.0.1",
    NITRO_PORT: "3005",
    NITRO_HOST: "127.0.0.1",
  },
});
if (restart.error || restart.status !== 0) process.exit(1);
for (let attempt = 0; attempt < 15; attempt++) {
  try {
    const response = await fetch("http://127.0.0.1:3005/explore?view=home", {
      signal: AbortSignal.timeout(3000),
    });
    await response.body?.cancel();
    if (response.ok) {
      console.log("PropertySetu restarted and healthy on port 3005.");
      process.exit(0);
    }
  } catch {
    // Allow the new process time to open its listener.
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.error("Build succeeded, but PropertySetu failed its health check. Check pm2 logs property-setu-web.");
process.exit(1);
