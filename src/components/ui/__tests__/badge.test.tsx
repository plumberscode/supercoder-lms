import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge Component", () => {
  it("should render badge with text correctly", () => {
    render(<Badge>Baru</Badge>);
    const badge = screen.getByText("Baru");
    expect(badge).toBeInTheDocument();
  });

  it("should apply default variant styling", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge.className).toContain("bg-primary");
  });

  it("should apply secondary variant styling", () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText("Secondary Badge");
    expect(badge.className).toContain("bg-secondary");
  });

  it("should apply destructive variant styling", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge.className).toContain("bg-destructive");
  });

  it("should allow custom className overrides", () => {
    render(<Badge className="custom-badge-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("custom-badge-class");
  });
});
