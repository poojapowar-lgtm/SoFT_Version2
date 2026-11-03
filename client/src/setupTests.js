
import "@testing-library/jest-dom";

// Mock window.scrollTo because Jest's JSDOM environment
// does not implement browser scrolling.
beforeAll(() => {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: jest.fn(),
  });
});
