import { configLoader, ConfigLoaderSuccessResult } from "../config-loader";
import { join, dirname } from "path";
import * as fs from "fs";
import * as os from "os";

describe("paths defined in base config without baseUrl", () => {
  it("uses base config directory for absoluteBaseUrl and returns base config path", () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "tsconfig-paths-base-no-baseurl-"));

    try {
      // Create base config at repo root
      const baseConfigPath = join(tmpRoot, "tsconfig.base.json");
      fs.writeFileSync(
        baseConfigPath,
        JSON.stringify({
          compilerOptions: {
            paths: { "@lib/*": ["packages/lib/*"] },
          },
        }),
        "utf8"
      );

      // Create project tsconfig that extends the base, in a subdirectory
      const projectDir = join(tmpRoot, "packages", "app");
      fs.mkdirSync(projectDir, { recursive: true });
      const projectTsconfigPath = join(projectDir, "tsconfig.json");
      fs.writeFileSync(
        projectTsconfigPath,
        JSON.stringify({ extends: "../../tsconfig.base.json" }),
        "utf8"
      );

      const result = configLoader({ cwd: projectDir }) as ConfigLoaderSuccessResult;

      expect(result.resultType).toBe("success");
      // Should select the base config path because it declared `paths`
      expect(result.configFileAbsolutePath).toBe(baseConfigPath);
      // And resolve absoluteBaseUrl to that config directory when baseUrl is missing
      expect(result.absoluteBaseUrl).toBe(dirname(baseConfigPath));
      expect(result.paths).toEqual({ "@lib/*": ["packages/lib/*"] });
    } finally {
      // Cleanup
      try {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      } catch (_) {
        // ignore cleanup errors in CI
      }
    }
  });
});

