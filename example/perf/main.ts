import { createMatchPath } from "../../src";
import * as Tsconfig from "tsconfig";
import * as path from "path";

// Load tsconfig
const loadResult = Tsconfig.loadSync(process.cwd());

// Create function that will match paths
const matchPath = createMatchPath(
  path.join(
    path.dirname(loadResult.path),
    loadResult.config.compilerOptions.baseUrl
  ),
  loadResult.config.compilerOptions.paths
);

const iterations = 100000;

console.time(`Matching path ${iterations} times`);
for (let i = 0; i < iterations; i++) {
  const result = matchPath("foo/mylib", undefined, undefined, [
    ".ts",
    ".tsx",
    ".js",
  ]);
}
console.timeEnd(`Matching path ${iterations} times`);
