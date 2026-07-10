import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormErrorSummary } from "./FormErrorSummary";
import { SubmitButton } from "./SubmitButton";
import type { FieldErrors } from "react-hook-form";

describe("form kit", () => {
  it("summary announces errors after a submit attempt", () => {
    render(<FormErrorSummary submitCount={1} errors={{ email: { message: "Required" } } as FieldErrors} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/required/i);
  });
  it("summary is empty before submit", () => {
    const { container } = render(
      <FormErrorSummary submitCount={0} errors={{ email: { message: "Required" } } as FieldErrors} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("SubmitButton disables + relabels when pending", () => {
    render(
      <SubmitButton pending pendingLabel="Saving…">
        Save
      </SubmitButton>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Saving…");
  });
});
