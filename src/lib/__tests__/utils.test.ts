import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge simple class names correctly", () => {
    const result = cn("class-a", "class-b");
    expect(result).toBe("class-a class-b");
  });

  it("should handle conditional and falsy class names", () => {
    const isHidden = false;
    const isActive = true;
    const result = cn(
      "base-class",
      isHidden && "hidden",
      isActive && "active",
      null,
      undefined,
      0 && "zero",
    );
    expect(result).toBe("base-class active");
  });

  it("should resolve conflicting Tailwind CSS utility classes", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("should handle complex class combinations and overrides", () => {
    const result = cn(
      "text-sm font-medium text-gray-500",
      "text-red-500 hover:text-red-700",
    );
    expect(result).toBe("text-sm font-medium text-red-500 hover:text-red-700");
  });
});
