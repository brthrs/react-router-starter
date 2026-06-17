// Initial smoke test for react-router-starter: verifies the vitest harness and the
// `~/` path alias resolve, and keeps the CI test step green. Safe to replace once
// real feature tests exist — it only covers the cn() wrapper.
import { describe, it, expect } from "vitest";

import { cn } from "~/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("ignores falsy values", () => {
    expect(cn("base", false, undefined, null, "active")).toBe("base active");
  });

  it("resolves conflicting Tailwind classes in favor of the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
