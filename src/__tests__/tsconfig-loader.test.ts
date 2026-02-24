import { tsConfigLoader, walkForTsConfig } from "../tsconfig-loader";
import { join, resolve } from "path";
import { getTsconfig } from "get-tsconfig";

describe("tsconfig-loader", () => {
  it("should find tsconfig in cwd", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (_: string) => undefined,
      loadSync: (cwd: string) => {
        return {
          tsConfigPath: `${cwd}/tsconfig.json`,
          baseUrl: "./",
          paths: {},
        };
      },
    });

    expect(result.tsConfigPath).toBe("/foo/bar/tsconfig.json");
  });

  it("should return loaderResult.tsConfigPath as undefined when not found", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (_: string) => undefined,
      loadSync: (_: string) => {
        return {
          tsConfigPath: undefined,
          baseUrl: "./",
          paths: {},
        };
      },
    });

    expect(result.tsConfigPath).toBeUndefined();
  });

  it("should use TS_NODE_PROJECT env if exists", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (key: string) =>
        key === "TS_NODE_PROJECT" ? "/foo/baz" : undefined,
      loadSync: (cwd: string, fileName: string) => {
        if (cwd === "/foo/bar" && fileName === "/foo/baz") {
          return {
            tsConfigPath: "/foo/baz/tsconfig.json",
            baseUrl: "./",
            paths: {},
          };
        }

        return {
          tsConfigPath: undefined,
          baseUrl: "./",
          paths: {},
        };
      },
    });

    expect(result.tsConfigPath).toBe("/foo/baz/tsconfig.json");
  });

  it("should use TS_NODE_BASEURL env if exists", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (key: string) =>
        key === "TS_NODE_BASEURL" ? "SOME_BASEURL" : undefined,
      loadSync: (_0: string, _1: string, baseUrl: string) => {
        return {
          tsConfigPath: undefined,
          baseUrl,
          paths: {},
        };
      },
    });

    expect(result.baseUrl).toBe("SOME_BASEURL");
  });

  it("should not use TS_NODE_BASEURL env if it does not exist", () => {
    const result = tsConfigLoader({
      cwd: "/foo/bar",
      getEnv: (_: string) => {
        return undefined;
      },
      loadSync: (_0: string, _1: string, baseUrl: string) => {
        return {
          tsConfigPath: undefined,
          baseUrl,
          paths: {},
        };
      },
    });

    expect(result.baseUrl).toBeUndefined();
  });
});

describe("walkForTsConfig", () => {
  it("should find tsconfig in starting directory", () => {
    const pathToTsconfig = join("/root", "dir1", "tsconfig.json");
    const mockFiles: Record<string, string[]> = {
      "/root/dir1": ["tsconfig.json"],
    };
    const res = walkForTsConfig(
      join("/root", "dir1"),
      (path) => mockFiles[path] || []
    );
    expect(res).toBe(pathToTsconfig);
  });

  it("should find jsconfig in starting directory", () => {
    const pathToJsconfig = join("/root", "dir1", "jsconfig.json");
    const mockFiles: Record<string, string[]> = {
      "/root/dir1": ["jsconfig.json"],
    };
    const res = walkForTsConfig(
      join("/root", "dir1"),
      (path) => mockFiles[path] || []
    );
    expect(res).toBe(pathToJsconfig);
  });

  // see https://github.com/Microsoft/TypeScript/issues/15869#issuecomment-301845650
  it("tsconfig.json take precedence over jsconfig.json when both exist", () => {
    const pathToTsconfig = join("/root/dir1", "tsconfig.json");
    const mockFiles: Record<string, string[]> = {
      "/root/dir1": ["jsconfig.json", "tsconfig.json"],
    };
    const res = walkForTsConfig(
      join("/root", "dir1"),
      (path) => mockFiles[path] || []
    );
    expect(res).toBe(pathToTsconfig);
  });

  it("should find tsconfig in parent directory", () => {
    const pathToTsconfig = join("/root", "tsconfig.json");
    const mockFiles: Record<string, string[]> = {
      "/root": ["tsconfig.json"],
    };
    const res = walkForTsConfig(
      join("/root", "dir1"),
      (path) => mockFiles[path] || []
    );
    expect(res).toBe(pathToTsconfig);
  });

  it("should find jsconfig in parent directory", () => {
    const pathToTsconfig = join("/root", "jsconfig.json");
    const mockFiles: Record<string, string[]> = {
      "/root": ["jsconfig.json"],
    };
    const res = walkForTsConfig(
      join("/root", "dir1"),
      (path) => mockFiles[path] || []
    );
    expect(res).toBe(pathToTsconfig);
  });

  it("should return undefined when reaching the top", () => {
    const res = walkForTsConfig(join("/root", "dir1", "kalle"), () => []);
    expect(res).toBeUndefined();
  });
});

describe("loadSyncDefault", () => {
  it("should load a config", () => {
    const cwd = resolve(__dirname, "../../example/basic")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "./hej",
      paths: {},
      tsConfigPath: resolve(cwd, "tsconfig.json"),
    });
  });

  it("should load a config with comments", () => {
    const cwd = resolve(__dirname, "../../example/with-comments")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "./hej",
      paths: {},
      tsConfigPath: resolve(cwd, "tsconfig.json"),
    });
  });

  it("should load a config with trailing commas", () => {
    const cwd = resolve(__dirname, "../../example/with-trailing-commas")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "./hej",
      paths: {},
      tsConfigPath: resolve(cwd, "tsconfig.json"),
    });
  });

  it("should gracefully handle invalid JSON5", () => {
    const cwd = resolve(__dirname, "../../example/invalid")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: undefined,
      paths: { foo: ["bar"] },
      tsConfigPath: resolve(cwd, "tsconfig.json")
    });
  });

  it("should use baseUrl relative to location of extended tsconfig", () => {
    const cwd = resolve(__dirname, "../../example/resolve-closest/dir1/dir2")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "../..",
      paths: {},
      tsConfigPath: resolve(cwd, "tsconfig.json")
    });
  });

  it("should load a config with array extends and overwrite all options", () => {
    const cwd = resolve(__dirname, "../../example/extend-multiple")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "./dir1/dir2",
      paths: { foo: ["bar2"] },
      tsConfigPath: resolve(cwd, "tsconfig.json")
    });
  });

  it("should load a config with array extends without .json extension", () => {
    const cwd = resolve(__dirname, "../../example/extend-without-extension")

    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: "./",
      paths: { foo: ["bar"] },
      tsConfigPath: resolve(cwd, "tsconfig.json")
    });
  });

  it("should resolve multiple levels of tsconfig extension", () => {
    const cwd = resolve(__dirname, "../../example/inherited");
    const result = tsConfigLoader({ cwd, getEnv: () => undefined });

    expect(result).toEqual({
      baseUrl: undefined,
      paths: { "@": [] },
      tsConfigPath: resolve(cwd, "tsconfig.json"),
    });
  });
});

describe("getTsconfig", () => {
  it("should load a config with string extends and overwrite all options", () => {
    const tsConfigPath = resolve(__dirname, "../../example/extend-overwrite/nested/tsconfig.json");

    const result = getTsconfig(tsConfigPath);

    expect(result).toEqual({
      config: {
        compilerOptions: {
          baseUrl: "./kalle",
          paths: { foo: ["bar2"] },
          strict: true,
        }
      },
      path: tsConfigPath
    });
  });

  it("should load a config with string extends from node_modules and overwrite all options", () => {
    const tsConfigPath = resolve(__dirname, "../../example/extend-node-module/tsconfig.json")

    const result = getTsconfig(tsConfigPath);

    expect(result).toEqual({
      config: {
        compilerOptions: {
          baseUrl: "./kalle",
          paths: { foo: ["bar2"] },
          strict: true,
        }
      },
      path: tsConfigPath
    });
  });
});
