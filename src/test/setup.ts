import "@testing-library/jest-dom";
import { vi } from "vitest";

// canvas-confetti calls HTMLCanvasElement.getContext + requestAnimationFrame,
// neither implemented in jsdom; completion celebrations would throw in a
// deferred timer and surface as an unhandled error. Stub it to a no-op.
vi.mock("canvas-confetti", () => ({ default: () => undefined }));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom has no ResizeObserver (Radix needs it)
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
// jsdom has no IntersectionObserver (Landing's scroll reveals need it)
(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }).IntersectionObserver =
  IntersectionObserverStub;

// jsdom has no rAF or document.fonts (the Landing loader waits on both).
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(0), 0) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id)) as typeof cancelAnimationFrame;
}
if (!(document as unknown as { fonts?: unknown }).fonts) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
      load: () => Promise.resolve([]),
    },
  });
}

// jsdom has no scrollIntoView / scrollTo.
// The stub returns a Promise on purpose: real browsers with smooth-scroll
// polyfills or automation instrumentation do the same, and an effect that
// implicitly returns that Promise hands React a non-function "cleanup",
// which crashes the whole tree on the next navigation. Keeping the stub
// hostile makes the test suite catch that class of bug.
Element.prototype.scrollIntoView = () => {};
window.scrollTo = (() => Promise.resolve()) as unknown as typeof window.scrollTo;
