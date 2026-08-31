import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("should render button with default text correctly", () => {
    render(<Button>Klik Saya</Button>);
    const button = screen.getByRole("button", { name: /klik saya/i });
    expect(button).toBeInTheDocument();
  });

  it("should apply variant classes properly", () => {
    const { rerender } = render(
      <Button variant="destructive">Hapus Data</Button>,
    );
    let button = screen.getByRole("button", { name: /hapus data/i });
    expect(button.className).toContain("bg-destructive");

    rerender(<Button variant="outline">Batal</Button>);
    button = screen.getByRole("button", { name: /batal/i });
    expect(button.className).toContain("border");
  });

  it("should apply size classes properly", () => {
    const { rerender } = render(<Button size="sm">Kecil</Button>);
    let button = screen.getByRole("button", { name: /kecil/i });
    expect(button.className).toContain("h-9");

    rerender(<Button size="lg">Besar</Button>);
    button = screen.getByRole("button", { name: /besar/i });
    expect(button.className).toContain("h-11");
  });

  it("should handle click events triggered by the user", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not trigger click when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>,
    );
    const button = screen.getByRole("button", { name: /disabled button/i });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
