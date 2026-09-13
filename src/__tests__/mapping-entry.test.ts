import { getAbsoluteMappingEntries } from "../mapping-entry";
import { resolve } from "path";

describe("mapping-entry", () => {
  it("should change to absolute paths and sort in longest prefix order", () => {
    const result = getAbsoluteMappingEntries(
      "/absolute/base/url",
      {
        "*": ["/foo1", "./foo2"],
        "longest/pre/fix/*": ["./foo2/bar"],
        "pre/fix/*": ["/foo3"],
      },
      true
    );
    expect(result).toEqual([
      {
        pattern: "longest/pre/fix/*",
        paths: [resolve("/absolute", "base", "url", "foo2", "bar")],
      },
      {
        pattern: "pre/fix/*",
        paths: [resolve("/foo3")],
      },
      {
        pattern: "*",
        paths: [resolve("/foo1"), resolve("/absolute", "base", "url", "foo2")],
      },
    ]);
  });

  it("should should add a match-all pattern when requested", () => {
    let result = getAbsoluteMappingEntries("/absolute/base/url", {}, true);
    expect(result).toEqual([
      {
        pattern: "*",
        paths: [resolve("/absolute", "base", "url", "*")],
      },
    ]);

    result = getAbsoluteMappingEntries("/absolute/base/url", {}, false);
    expect(result).toEqual([]);
  });
});
