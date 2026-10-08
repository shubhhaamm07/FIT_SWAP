// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import GymPhoto from "../src/components/common/GymPhoto.jsx";

afterEach(cleanup);

test("gym photos fall back to the bundled image when a remote image fails", () => {
  const remoteImage = "https://example.com/gym.jpg";
  render(<GymPhoto src={remoteImage} alt="Example gym" />);

  const image = screen.getByRole("img", { name: "Example gym" });
  expect(image.src).toBe(remoteImage);

  fireEvent.error(image);
  expect(image.src).not.toBe(remoteImage);

  const fallbackImage = image.src;
  fireEvent.error(image);
  expect(image.src).toBe(fallbackImage);
});
