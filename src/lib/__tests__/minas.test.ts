import { describe, it, expect } from "vitest";
import {
  generatePassword,
  minasEmail,
  parseNameList,
  pickUsername,
  usernameBase,
} from "@/lib/minas";

describe("minasEmail", () => {
  it("maps a username to the MINAS email, case-insensitively", () => {
    expect(minasEmail("  Budi27 ")).toBe("budi27@minas.supercoder.id");
  });
});

describe("parseNameList", () => {
  it("keeps one trimmed name per non-empty line, including duplicates", () => {
    expect(parseNameList("Budi Santoso\r\n\n  Siti   Aisyah \nBudi Santoso\n")).toEqual([
      "Budi Santoso",
      "Siti Aisyah",
      "Budi Santoso",
    ]);
  });
});

describe("usernameBase", () => {
  it("takes the first word as lowercase letters only", () => {
    expect(usernameBase("Muhammad Ali")).toBe("muhammad");
    expect(usernameBase("Çinta Ramadhani")).toBe("cinta");
    expect(usernameBase("A'isyah Putri")).toBe("aisyah");
  });

  it("skips words without letters and falls back to 'siswa'", () => {
    expect(usernameBase("123 Rina")).toBe("rina");
    expect(usernameBase("!!!")).toBe("siswa");
  });

  it("caps long names at 12 characters", () => {
    expect(usernameBase("Fransiskusxaverius")).toBe("fransiskusxa");
  });
});

describe("pickUsername", () => {
  it("appends two digits", () => {
    expect(pickUsername("budi", new Set(), () => 0)).toBe("budi10");
  });

  it("avoids usernames that are already taken", () => {
    const values = [0, 0, 0.5];
    let i = 0;
    const random = () => values[i++] ?? 0.5;
    expect(pickUsername("budi", new Set(["budi10"]), random)).toBe("budi55");
  });

  it("falls back to three digits when two-digit names run out", () => {
    const taken = new Set(Array.from({ length: 90 }, (_, n) => `budi${n + 10}`));
    expect(pickUsername("budi", taken)).toMatch(/^budi\d{3}$/);
  });
});

describe("generatePassword", () => {
  it("returns a word followed by digits, at least 8 characters", () => {
    for (let n = 0; n < 200; n++) {
      const password = generatePassword();
      expect(password).toMatch(/^[a-z]+\d+$/);
      expect(password.length).toBeGreaterThanOrEqual(8);
    }
  });
});
