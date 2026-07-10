import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BackLink } from "@/components/forge/atoms";

describe("BackLink", () => {
  it("renders a link to the explicit target with the given label", () => {
    render(
      <MemoryRouter>
        <BackLink to="/app" label="Today" />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /today/i });
    expect(link).toHaveAttribute("href", "/app");
  });

  it("merges a passed className onto the link", () => {
    render(
      <MemoryRouter>
        <BackLink to="/admin" label="Admin" className="md:hidden" />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /admin/i })).toHaveClass("md:hidden");
  });
});
