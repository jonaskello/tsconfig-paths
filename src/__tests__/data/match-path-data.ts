import { join, dirname, resolve } from "path";
import { removeExtension } from "../../filesystem";

export interface OneTest {
  readonly name: string;
  readonly only?: boolean;
  readonly skip?: boolean;
  readonly absoluteBaseUrl: string;
  readonly paths: { [key: string]: Array<string> };
  readonly mainFields?: (string | string[])[];
  readonly addMatchAll?: boolean;
  readonly existingFiles: ReadonlyArray<string>;
  readonly requestedModule: string;
  readonly extensions: ReadonlyArray<string>;
  readonly packageJson?: {};
  readonly expectedPath: string | undefined;
}

const defaultExtensionsWhenRunningInTsNode = [
  ".js",
  ".json",
  ".node",
  ".ts",
  ".tsx",
];

export const tests: ReadonlyArray<OneTest> = [
  {
    name: "should locate path that matches with star and exists",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    existingFiles: [resolve("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    expectedPath: dirname(resolve("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve to correct path when many are specified",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["foo1/*", "foo2/*", "location/*", "foo3/*"],
    },
    existingFiles: [resolve("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    extensions: [".ts"],
    expectedPath: dirname(resolve("/root", "location", "mylib", "index.ts")),
  },
  {
    name:
      "should locate path that matches with star and prioritize pattern with longest prefix",
    absoluteBaseUrl: "/root/",
    paths: {
      "*": ["location/*"],
      "lib/*": ["location/*"],
    },
    existingFiles: [
      resolve("/root", "location", "lib", "mylib", "index.ts"),
      resolve("/root", "location", "mylib", "index.ts"),
    ],
    requestedModule: "lib/mylib",
    expectedPath: dirname(resolve("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should locate path that matches with star and exists with extension",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [resolve("/root", "location", "mylib.myext")],
    requestedModule: "lib/mylib",
    extensions: [".js", ".myext"],
    expectedPath: removeExtension(resolve("/root", "location", "mylib.myext")),
  },
  {
    name: "should resolve request with extension specified",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [resolve("/root", "location", "test.jpg")],
    requestedModule: "lib/test.jpg",
    expectedPath: resolve("/root", "location", "test.jpg"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should locate path that matches without star and exists",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/foo": ["location/foo"],
    },
    existingFiles: [resolve("/root", "location", "foo.ts")],
    requestedModule: "lib/foo",
    expectedPath: removeExtension(resolve("/root", "location", "foo.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve to parent folder when filename is in subfolder",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [resolve("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    expectedPath: dirname(resolve("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve from main field in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [resolve("/root", "location", "mylib", "kalle.ts")],
    packageJson: { main: "./kalle.ts" },
    requestedModule: "lib/mylib",
    expectedPath: resolve("/root", "location", "mylib", "kalle.ts"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve from main field in package.json (js)",
    absoluteBaseUrl: "/root",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [resolve("/root", "location", "mylib.js", "kalle.js")],
    packageJson: { main: "./kalle.js" },
    requestedModule: "lib/mylib.js",
    extensions: [".ts", ".js"],
    expectedPath: resolve("/root", "location", "mylib.js", "kalle.js"),
  },
  {
    name: "should resolve from list of fields by priority in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    mainFields: ["missing", "browser", "main"],
    packageJson: { main: "./main.js", browser: "./browser.js" },
    existingFiles: [
      resolve("/root", "location", "mylibjs", "main.js"), // mainFilePath
      resolve("/root", "location", "mylibjs", "browser.js"), // browserFilePath
    ],
    extensions: [".ts", ".js"],
    requestedModule: "lib/mylibjs",
    expectedPath: resolve("/root", "location", "mylibjs", "browser.js"),
  },
  {
    name: "should ignore field mappings to missing files in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    mainFields: ["browser", "main"],
    existingFiles: [resolve("/root", "location", "mylibjs", "kalle.js")],
    requestedModule: "lib/mylibjs",
    packageJson: {
      main: "./kalle.js",
      browser: "./nope.js",
    },
    extensions: [".ts", ".js"],
    expectedPath: resolve("/root", "location", "mylibjs", "kalle.js"),
  },
  {
    name: "should resolve nested main fields",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    mainFields: [["esnext", "main"]],
    packageJson: { esnext: { main: "./main.js" } },
    existingFiles: [resolve("/root", "location", "mylibjs", "main.js")],
    extensions: [".ts", ".js"],
    requestedModule: "lib/mylibjs",
    expectedPath: resolve("/root", "location", "mylibjs", "main.js"),
  },
  {
    name: "should ignore advanced field mappings in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [
      resolve("/root", "location", "mylibjs", "kalle.js"),
      resolve("/root", "location", "mylibjs", "browser.js"),
    ],
    requestedModule: "lib/mylibjs",
    packageJson: {
      main: "./kalle.js",
      browser: { mylibjs: "./browser.js", "./kalle.js": "./browser.js" },
    },
    extensions: [".ts", ".js"],
    expectedPath: resolve("/root", "location", "mylibjs", "kalle.js"),
  },
  {
    name: "should resolve to with the help of baseUrl when not explicitly set",
    absoluteBaseUrl: "/root/",
    paths: {},
    existingFiles: [resolve("/root", "mylib", "index.ts")],
    requestedModule: "mylib",
    expectedPath: dirname(resolve("/root", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not resolve with the help of baseUrl when asked not to",
    absoluteBaseUrl: "/root/",
    paths: {},
    addMatchAll: false,
    existingFiles: [resolve("/root", "mylib", "index.ts")],
    requestedModule: "mylib",
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not locate path that does not match",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    existingFiles: [join("root", "location", "mylib")],
    requestedModule: "mylib",
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not resolve typings file (index.d.ts)",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    existingFiles: [resolve("/root", "location", "mylib", "index.d.ts")],
    requestedModule: "lib/mylib",
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve main file with cjs file extension",
    absoluteBaseUrl: "/root/",
    paths: {},
    existingFiles: [resolve("/root", "mylib", "index.cjs")],
    packageJson: {
      main: "./index.cjs",
    },
    requestedModule: "mylib",
    expectedPath: resolve("/root", "mylib", "index.cjs"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve .ts from .js alias",
    absoluteBaseUrl: "/root/",
    paths: {
      "@/*": ["src/*"],
    },
    existingFiles: [resolve("/root", "src", "foo.ts")],
    requestedModule: "@/foo.js",
    expectedPath: resolve("/root", "src", "foo"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
];
