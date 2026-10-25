// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import FitSwapJourneySection from "../src/components/landing/FitSwapJourneySection.jsx";

const mocks = vi.hoisted(() => ({
  appearance: { effectiveReducedMotion: false },
  create: vi.fn(),
  dispose: vi.fn(),
  setMotion: vi.fn(),
}));
vi.mock("../src/hooks/useAppearance", () => ({
  useAppearance: () => mocks.appearance,
}));
vi.mock("../src/components/landing/three/createJourneyScene", () => ({
  createJourneyScene: mocks.create,
}));
let observeVisibility;
function tree() {
  return (
    <MemoryRouter>
      <FitSwapJourneySection />
    </MemoryRouter>
  );
}
async function enterView() {
  await act(async () => {
    observeVisibility([{ isIntersecting: true }]);
  });
}
function canvas() {
  return screen.queryByTestId("fitswap-journey-canvas");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.appearance.effectiveReducedMotion = false;
  mocks.create.mockImplementation((element, options) => {
    options.onReady();
    return { dispose: mocks.dispose, setMotion: mocks.setMotion };
  });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback) {
        observeVisibility = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("the local renderer loads on screen and releases its resources off screen", async () => {
  render(tree());
  expect(mocks.create).not.toHaveBeenCalled();
  await enterView();
  expect(canvas()).not.toBeNull();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.setMotion).toHaveBeenLastCalledWith(true);
  act(() => observeVisibility([{ isIntersecting: false }]));
  expect(canvas()).toBeNull();
  expect(mocks.dispose).toHaveBeenCalledTimes(1);
});

test("reduced motion renders a still scene and updates when the preference changes", async () => {
  mocks.appearance.effectiveReducedMotion = true;
  const app = render(tree());
  await enterView();
  expect(canvas()).not.toBeNull();
  expect(mocks.setMotion).toHaveBeenLastCalledWith(false);
  mocks.appearance.effectiveReducedMotion = false;
  app.rerender(tree());
  expect(mocks.setMotion).toHaveBeenLastCalledWith(true);
});

test("playback remains keyboard accessible without visible controls or an embed", async () => {
  render(tree());
  await enterView();
  const scene = screen.getByRole("img", { name: /membership pass connects/ });
  fireEvent.keyDown(scene, { key: " " });
  expect(mocks.setMotion).toHaveBeenLastCalledWith(false);
  fireEvent.keyDown(scene, { key: "Enter" });
  expect(mocks.setMotion).toHaveBeenLastCalledWith(true);
  expect(screen.queryByRole("button")).toBeNull();
  expect(document.querySelector("iframe")).toBeNull();
  expect(
    screen.queryByText(/Built with Spline|Pause animation|Use still preview/),
  ).toBeNull();
});

test("hidden tabs release the GPU renderer and returning recreates it", async () => {
  render(tree());
  await enterView();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(canvas()).toBeNull();
  expect(mocks.dispose).toHaveBeenCalledTimes(1);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(mocks.create).toHaveBeenCalledTimes(2);
});

test("WebGL failures keep the transparent fallback, explanation, and login link", async () => {
  mocks.create.mockImplementation(() => {
    throw new Error("WebGL unavailable");
  });
  render(tree());
  await enterView();
  expect(canvas()).toBeNull();
  expect(document.querySelector(".fit-journey-poster")).not.toBeNull();
  expect(
    screen
      .getByRole("link", { name: /Find your next pass/ })
      .getAttribute("href"),
  ).toBe("/login");
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});

test("unmounting releases the renderer once", async () => {
  const app = render(tree());
  await enterView();
  app.unmount();
  expect(mocks.dispose).toHaveBeenCalledTimes(1);
});
