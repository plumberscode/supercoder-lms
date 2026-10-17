import { describe, it, expect } from "vitest";
import { isWebMode, webModeParts } from "@/lib/web-mode";

describe("webModeParts", () => {
  it("maps each mode to the editors it uses", () => {
    expect(webModeParts("html")).toEqual({ html: true, css: false, js: false });
    expect(webModeParts("html-css")).toEqual({
      html: true,
      css: true,
      js: false,
    });
    expect(webModeParts("html-css-js")).toEqual({
      html: true,
      css: true,
      js: true,
    });
    expect(webModeParts("js")).toEqual({ html: false, css: false, js: true });
  });
});

describe("isWebMode", () => {
  it("accepts only known modes", () => {
    expect(isWebMode("js")).toBe(true);
    expect(isWebMode("html-css-js")).toBe(true);
    expect(isWebMode("python")).toBe(false);
    expect(isWebMode(undefined)).toBe(false);
  });
});
