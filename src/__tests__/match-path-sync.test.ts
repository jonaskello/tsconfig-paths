import { createMatchPath } from "../match-path-sync";
import * as Tests from "./data/match-path-data";

describe("match-path-sync", () => {
  Tests.tests.forEach((t) =>
    it(t.name, () => {
      const matchPath = createMatchPath(
        t.absoluteBaseUrl,
        t.paths,
        t.mainFields,
        t.addMatchAll
      );
      const result = matchPath(
        t.requestedModule,
        (_: string) => t.packageJson,
        (name: string) => t.existingFiles.indexOf(name) !== -1,
        t.extensions
      );
      expect(result).toBe(t.expectedPath);
    })
  );

  it("does not throw when require.extensions is unavailable", () => {
    const patchedRequire = require as typeof require & {
      extensions?: typeof require.extensions;
    };
    const originalExtensions = patchedRequire.extensions;
    patchedRequire.extensions = undefined;

    try {
      const matchPath = createMatchPath("/base", {});
      expect(() => matchPath("missing-module")).not.toThrow();
    } finally {
      patchedRequire.extensions = originalExtensions;
    }
  });
});
