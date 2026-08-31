import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TestimonialForm from "@/app/dashboard/testimonials/TestimonialForm";

// Mock server action
vi.mock("@/app/dashboard/testimonials/actions", () => ({
  submitTestimonial: vi.fn(),
}));

describe("TestimonialForm Component", () => {
  it("should render all 5 testimonial question labels and inputs correctly", () => {
    render(<TestimonialForm studentName="Budi" existingCount={0} />);

    expect(
      screen.getByText(/1\. Apa yang sudah kamu pelajari\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /2\. Menurut kamu gimana proses belajar di Super Coder\?/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /3\. Apa hal yang membuat kamu semangat belajar disini\?/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /4\. Apa hal yang masih harus diperbaiki dari Super Coder\?/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /5\. Kesan secara umum terhadap proses belajar di Super Coder\?/i,
      ),
    ).toBeInTheDocument();
  });

  it("should render rating selector and submit button", () => {
    render(<TestimonialForm studentName="Budi" existingCount={0} />);

    expect(
      screen.getByText(/Rating Pengalaman Belajar Kamu/i),
    ).toBeInTheDocument();
    const submitButton = screen.getByRole("button", {
      name: /kirim testimoni/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  it("should display prior submission notice if existingCount > 0", () => {
    render(<TestimonialForm studentName="Budi" existingCount={2} />);

    expect(
      screen.getByText(/Kamu sebelumnya sudah mengirimkan/i),
    ).toBeInTheDocument();
  });
});
