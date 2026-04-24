import { createMatchPathAsync } from "../match-path-async";
import * as Tests from "./data/match-path-data";

describe("match-path-async", () => {
  Tests.tests.forEach((t) =>
    it(t.name, (done) => {
      const matchPath = createMatchPathAsync(
        t.absoluteBaseUrl,
        t.paths,
        t.mainFields,
        t.addMatchAll
      );
      matchPath(
        t.requestedModule,
        (_path, callback) => callback(undefined, t.packageJson),
        (path, callback) =>
          callback(undefined, t.existingFiles.indexOf(path) !== -1),
        t.extensions,
        (_err, result) => {
          expect(result).toBe(t.expectedPath);
          done();
        }
      );
    })
  );

  it("does not fail when require.extensions is unavailable", (done) => {
    const patchedRequire = require as typeof require & {
      extensions?: typeof require.extensions;
    };
    const originalExtensions = patchedRequire.extensions;
    patchedRequire.extensions = undefined;

    try {
      const matchPath = createMatchPathAsync("/base", {});
      matchPath(
        "missing-module",
        undefined,
        undefined,
        undefined,
        (err, result) => {
          expect(err).toBeUndefined();
          expect(result).toBeUndefined();
          done();
        }
      );
    } finally {
      patchedRequire.extensions = originalExtensions;
    }
  });
});
