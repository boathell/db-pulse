import { describe, expect, it } from "vitest";
import { scanStaticOutput } from "../scripts/scan-static-output.js";

describe("static output privacy gate", () => {
  it("accepts a privacy-safe DB Pulse fixture", async () => {
    await expect(scanStaticOutput("tests/fixtures/static-output/safe")).resolves.toEqual([]);
  });

  it("rejects legacy AI identity, private fields, local paths, and admin artifacts", async () => {
    const violations = await scanStaticOutput("tests/fixtures/static-output/unsafe");
    expect(new Set(violations.map((violation) => violation.rule))).toEqual(
      new Set([
        "legacy-ai-identity",
        "legacy-ai-route",
        "private-field",
        "local-path",
        "private-artifact-path",
      ]),
    );
    expect(
      violations.every((violation) => !JSON.stringify(violation).includes("fixture only")),
    ).toBe(true);
  });
});
