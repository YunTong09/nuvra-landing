import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ts from "typescript";

test("compiled API starts in plain Node without TypeScript source files or loaders", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const tempRoot = join(root, "node_modules", ".tmp");
  mkdirSync(tempRoot, { recursive: true });
  const output = mkdtempSync(join(tempRoot, "nuvra-api-"));
  try {
    writeFileSync(join(output, "package.json"), '{"type":"module"}');
    function compile(directory: string) {
      for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
        const relative = join(directory, entry.name);
        if (entry.isDirectory()) compile(relative);
        else if (entry.name.endsWith(".ts")) {
          const result = ts.transpileModule(readFileSync(join(root, relative), "utf8"), {
            fileName: relative,
            compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: true },
          });
          mkdirSync(join(output, directory), { recursive: true });
          writeFileSync(join(output, relative.replace(/\.ts$/, ".js")), result.outputText);
        }
      }
    }
    for (const directory of ["api", "server", "shared"]) compile(directory);
    const env = { ...process.env };
    delete env.DATABASE_URL;
    delete env.NODE_OPTIONS;
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", `
      import assert from 'node:assert/strict';
      import handler, { originalApiUrl } from './api/index.js';
      import { createPostgresApp } from './server/postgres.js';
      assert.equal(typeof createPostgresApp({}), 'function');
      assert.equal(originalApiUrl('/api/index?__route=tools'), '/api/tools');
      const response = {
        statusCode: 0, headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        end(body) { this.body = body; }
      };
      await handler({ url: '/api/index?__route=tools' }, response);
      assert.equal(response.statusCode, 503);
      assert.equal(response.headers['Content-Type'], 'application/json');
      assert.equal(JSON.parse(response.body).error, 'Database is not configured.');
    `], { cwd: output, env, encoding: "utf8", timeout: 15_000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
