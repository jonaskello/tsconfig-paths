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
        (path, callback) => {
          console.log("matchPath", path, t.existingFiles);
          callback(undefined, t.existingFiles.indexOf(path) !== -1);
        },
        t.extensions,
        (_err, result) => {
          console.log("result:", _err, result);
          expect(result).toBe(t.expectedPath);
          done();
        }
      );
    })
  );
  it("should resolve main file in the root directory", (done) => {
    const absoluteBaseUrl = "/";
    const requestedModule = "/src/main.ts";
    const expectedPath = "/src/main.ts";
    const matchPath = createMatchPathAsync(absoluteBaseUrl, {}, [], true);
    matchPath(
      requestedModule,
      (_path, callback) => callback(undefined, {}),
      (path, callback) =>
        callback(undefined, expectedPath.indexOf(path) !== -1),
      ["*.ts", "*.tsx"],
      (_err, result) => {
        expect(result).toBe(expectedPath);
        done();
      }
    );
  });
});
