// TEMPORARY smoke test — exists only so the CI `test` step has at least one
// test to run and reports green while the suite is otherwise empty.
// Replace with real feature tests and delete this file once those exist.
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("runs the test suite", () => {
    expect(true).toBe(true);
  });
});
