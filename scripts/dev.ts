import { spawn } from "bun";
import { resolve } from "path";

const root = resolve(import.meta.dir, "..");
const webDir = resolve(root, "web");

const watch = spawn({
    cmd: ["bun", "run", resolve(root, "scripts/watch-schema.ts")],
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
});

const next = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: webDir,
    stdout: "inherit",
    stderr: "inherit",
});

function shutdown(code = 0) {
    watch.kill();
    next.kill();
    process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const exited = await Promise.race([
    watch.exited.then((code) => ({ proc: "watch", code })),
    next.exited.then((code) => ({ proc: "next", code })),
]);

console.error(`[ozzyrm] ${exited.proc} exited with code ${exited.code}`);
shutdown(exited.code ?? 1);
