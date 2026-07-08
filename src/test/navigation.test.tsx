/**
 * Reproduction harness for "navigation needs a manual refresh".
 * Renders the real App (real router, real providers) in jsdom and clicks
 * through every main destination. Any render crash or dead link fails here.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";

const SIGNED_IN = JSON.stringify({
  user: { name: "Marcus Ellison", firstName: "Marcus", email: "m@example.com", initials: "ME" },
  why: "To be present.",
  covenant: { signedName: "Marcus Ellison", dateISO: new Date().toISOString() },
  onboarded: true,
});

const startAt = (path: string) => window.history.pushState({}, "", path);

describe("app navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("lk-mock-auth-v1", SIGNED_IN);
  });

  it("walks every main nav destination without a reload", async () => {
    startAt("/app");
    render(<App />);

    await screen.findByText(/good (morning|afternoon|evening), marcus/i, undefined, {
      timeout: 4000,
    });

    fireEvent.click(screen.getAllByRole("link", { name: /brotherhood/i })[0]);
    await screen.findByRole("heading", { name: /brotherhood/i });

    fireEvent.click(screen.getAllByRole("link", { name: /grow/i })[0]);
    await screen.findByRole("heading", { name: /eight weeks of ground taken/i });

    fireEvent.click(screen.getAllByRole("link", { name: /profile/i })[0]);
    await screen.findByRole("heading", { name: /the man in the fight/i });

    fireEvent.click(screen.getAllByRole("link", { name: /stand firm/i })[0]);
    await screen.findByRole("heading", { name: /you're here\. good\./i });

    fireEvent.click(screen.getByRole("button", { name: /i'm being tempted/i }));
    await screen.findByRole("heading", { name: /this will pass/i });

    fireEvent.click(screen.getByRole("link", { name: /leave, back to today/i }));
    await screen.findByText(/good (morning|afternoon|evening), marcus/i);
  });

  it("the return flow (I already fell) records the fall", async () => {
    startAt("/stand-firm");
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /i already fell/i }));
    await screen.findByRole("heading", { name: /no condemnation/i });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /data, not condemnation/i });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /return, not self-punishment/i });
    const commitments = screen.getAllByRole("checkbox");
    fireEvent.click(commitments[0]);
    fireEvent.click(commitments[1]);

    // Keyboard users activate the hold button directly with Enter
    const hold = screen.getByRole("button", { name: /hold to return/i });
    await waitFor(() => expect(hold).toBeEnabled());
    fireEvent.keyDown(hold, { key: "Enter" });

    await screen.findByRole("heading", { name: /welcome back, brother/i });
  });

  it("check-in unlocks the reading, which opens the lesson", async () => {
    startAt("/app");
    render(<App />);
    await screen.findByText(/your path today/i, undefined, { timeout: 4000 });

    // Reading is locked until the morning check-in is done
    fireEvent.click(await screen.findByRole("button", { name: /begin/i }));
    fireEvent.click(await screen.findByText("Steady"));
    await screen.findByText(/psalm 16:8/i); // every emotional prompt gets a cited verse
    fireEvent.click(screen.getByText("Slept well"));
    fireEvent.click(screen.getByRole("button", { name: /log check-in/i }));

    const continueLink = await screen.findByRole("link", { name: /continue/i }, { timeout: 4000 });
    fireEvent.click(continueLink);
    await screen.findByRole("heading", { name: /the lie beneath the urge/i });

    fireEvent.click(screen.getByRole("link", { name: /the liberated path/i }));
    await screen.findByRole("heading", { name: /eight weeks of ground taken/i });
  });

  it("brotherhood channels open a chat thread", async () => {
    // URL-driven tab state (Radix tab clicks need real pointer events jsdom lacks)
    startAt("/app/brotherhood?tab=channels");
    render(<App />);
    await screen.findByRole("heading", { name: /brotherhood/i });

    fireEvent.click(await screen.findByRole("button", { name: /the hall/i }));
    await screen.findByText(/week 3 reading hit hard/i);
  });

  it("login lands on the dashboard even with invalid input (testing mode)", async () => {
    localStorage.clear();
    startAt("/login");
    render(<App />);

    fireEvent.change(await screen.findByLabelText(/email/i), {
      target: { value: "asd" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "asd" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText(/good (morning|afternoon|evening), asd/i, undefined, {
      timeout: 4000,
    });
  });

  it("signup lands on the dashboard", async () => {
    localStorage.clear();
    startAt("/signup");
    render(<App />);

    fireEvent.change(await screen.findByLabelText(/full name/i), {
      target: { value: "John Carter" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jc@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText(/good (morning|afternoon|evening), john/i, undefined, {
      timeout: 4000,
    });
  });

  it("landing CTA reaches the app when signed in", async () => {
    startAt("/");
    render(<App />);
    fireEvent.click(await screen.findByRole("link", { name: /^enter$/i }));
    await waitFor(() => expect(window.location.pathname).toBe("/app"));
    await screen.findByText(/good (morning|afternoon|evening), marcus/i, undefined, {
      timeout: 4000,
    });
  });
});
