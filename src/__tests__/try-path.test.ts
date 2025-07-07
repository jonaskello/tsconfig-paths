import { getPathsToTry } from "../try-path";
import { join } from "path";

describe("mapping-entry", () => {
  const abosolutePathMappings = [
    {
      pattern: "longest/pre/fix/*",
      paths: [join("/absolute", "base", "url", "foo2", "bar")],
    },
    { pattern: "pre/fix/*", paths: [join("/absolute", "base", "url", "foo3")] },
    { pattern: "*", paths: [join("/absolute", "base", "url", "foo1")] },
  ];
  const abosolutePathMappingsStarstWithSlash = [
    {
      pattern: "/opt/*",
      paths: [join("/absolute", "src", "aws-layer")],
    },
    {
      pattern: "*",
      paths: [join("/absolute", "src")],
    },
  ];
  it("should return no paths for relative requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      abosolutePathMappings,
      "./requested-module"
    );
    expect(result).toBeUndefined();
  });

  it("should return no paths if no pattern match the requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      [
        {
          pattern: "longest/pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo2", "bar")],
        },
        {
          pattern: "pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo3")],
        },
      ],
      "requested-module"
    );
    expect(result).toBeUndefined();
  });

  it("should get all paths that matches requested module", () => {
    const result = getPathsToTry(
      [".ts", ".tsx"],
      abosolutePathMappings,
      "longest/pre/fix/requested-module"
    );
    expect(result).toEqual([
      // "longest/pre/fix/*"
      { type: "file", path: join("/absolute", "base", "url", "foo2", "bar") },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.ts"),
      },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.tsx"),
      },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo2", "bar", "package.json"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.ts"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.tsx"),
      },
      // "*"
      { type: "file", path: join("/absolute", "base", "url", "foo1") },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.ts") },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.tsx") },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo1", "package.json"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.ts"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.tsx"),
      },
    ]);
  });

  it.each(["js", "jsx", "mjs", "cjs"])(
    "should include paths with ending .%s removed that matches requested module",
    (extension) => {
      const result = getPathsToTry(
        [".ts", ".tsx"],
        [
          {
            pattern: "longest/pre/fix/*",
            paths: [join("/absolute", "base", "url", "foo2", "*")],
          },
        ],
        `longest/pre/fix/bar.${extension}`
      );

      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: "extension",
            path: join("/absolute", "base", "url", "foo2", "bar.ts"),
          },
          {
            type: "extension",
            path: join("/absolute", "base", "url", "foo2", "bar.tsx"),
          },
        ])
      );
    }
  );

  it.each([
    ["mjs", "mts"],
    ["cjs", "cts"],
  ])(
    "should include paths with ending .%s removed that matches requested module with extension .%s",
    (requestedModuleExtension, expectedExtension) => {
      const result = getPathsToTry(
        [".ts", ".tsx", `.${expectedExtension}`, `.${expectedExtension}x`],
        [
          {
            pattern: "longest/pre/fix/*",
            paths: [join("/absolute", "base", "url", "foo2", "*")],
          },
        ],
        `longest/pre/fix/bar.${requestedModuleExtension}`
      );

      expect(result).toEqual(
        expect.arrayContaining([
          {
            type: "extension",
            path: join(
              "/absolute",
              "base",
              "url",
              "foo2",
              `bar.${expectedExtension}`
            ),
          },
          {
            type: "extension",
            path: join(
              "/absolute",
              "base",
              "url",
              "foo2",
              `bar.${expectedExtension}x`
            ),
          },
        ])
      );
    }
  );

  it("should resolve paths starting with a slash", () => {
    const result = getPathsToTry(
      [".ts"],
      abosolutePathMappingsStarstWithSlash,
      "/opt/utils"
    );
    expect(result).toEqual([
      // "opt/*"
      {
        path: join("/absolute", "src", "aws-layer"),
        type: "file",
      },
      {
        path: join("/absolute", "src", "aws-layer.ts"),
        type: "extension",
      },
      {
        path: join("/absolute", "src", "aws-layer", "package.json"),
        type: "package",
      },
      {
        path: join("/absolute", "src", "aws-layer", "index.ts"),
        type: "index",
      },
      // "*"
      {
        path: join("/absolute", "src"),
        type: "file",
      },
      {
        path: join("/absolute", "src.ts"),
        type: "extension",
      },
      {
        path: join("/absolute", "src", "package.json"),
        type: "package",
      },
      {
        path: join("/absolute", "src", "index.ts"),
        type: "index",
      },
    ]);
  });

  it("should resolve paths exactly same as input path with trailing slash", () => {
    const result = getPathsToTry(
      [],
      [
        {
          pattern: "/opt/*",
          paths: [join("/absolute", "src", "*")],
        },
      ],
      "/opt/"
    );
    expect(result).toEqual([
      {
        path: join("/absolute", "src") + "/",
        type: "file",
      },
      {
        path: join("/absolute", "src", "package.json"),
        type: "package",
      },
    ]);
  });

  it("should resolve paths exactly same as input path without trailing slash", () => {
    const result = getPathsToTry(
      [],
      [
        {
          pattern: "/opt/*",
          paths: [join("/absolute", "src", "*")],
        },
      ],
      "/opt"
    );
    expect(result).toEqual([
      {
        path: join("/absolute", "src") + "/",
        type: "file",
      },
      {
        path: join("/absolute", "src", "package.json"),
        type: "package",
      },
    ]);
  });

  it("glob match with suffix part on result", () => {
    const result = getPathsToTry(
      [],
      [
        {
          pattern: "/opt/*",
          paths: [join("/absolute", "src", "*", "suffix", "part")],
        },
      ],
      "/opt/relative/part"
    );
    expect(result).toEqual([
      {
        path: join("/absolute", "src", "relative", "part", "suffix", "part"),
        type: "file",
      },
      {
        path: join(
          "/absolute",
          "src",
          "relative",
          "part",
          "suffix",
          "part",
          "package.json"
        ),
        type: "package",
      },
    ]);
  });
});
