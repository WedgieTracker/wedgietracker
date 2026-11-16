import { describe, expect, it } from "vitest";
import { WEDGIE_NUMBER_RAMP, wedgieNumberColour } from "./wedgieNumberColour";

describe("wedgieNumberColour", () => {
  it("runs blue at #1 to pink at #13", () => {
    expect(wedgieNumberColour(1)).toBe(WEDGIE_NUMBER_RAMP[0]);
    expect(wedgieNumberColour(13)).toBe(WEDGIE_NUMBER_RAMP[12]);
  });

  it("steps back down after #13 rather than jumping to blue", () => {
    expect(wedgieNumberColour(14)).toBe(WEDGIE_NUMBER_RAMP[11]);
    expect(wedgieNumberColour(25)).toBe(WEDGIE_NUMBER_RAMP[0]);
    expect(wedgieNumberColour(26)).toBe(WEDGIE_NUMBER_RAMP[1]);
  });

  it("treats a missing number as #1", () => {
    expect(wedgieNumberColour(null)).toBe(WEDGIE_NUMBER_RAMP[0]);
    expect(wedgieNumberColour(undefined)).toBe(WEDGIE_NUMBER_RAMP[0]);
  });
});
