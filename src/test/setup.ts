import "@testing-library/jest-dom";

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

// jsdom has no scrollIntoView / scrollTo.
// The stub returns a Promise on purpose: real browsers with smooth-scroll
// polyfills or automation instrumentation do the same, and an effect that
// implicitly returns that Promise hands React a non-function "cleanup",
// which crashes the whole tree on the next navigation. Keeping the stub
// hostile makes the test suite catch that class of bug.
Element.prototype.scrollIntoView = () => {};
window.scrollTo = (() => Promise.resolve()) as unknown as typeof window.scrollTo;
