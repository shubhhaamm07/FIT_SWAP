// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test } from "vitest";

import MarketplaceGuide from "../src/components/marketplace/hero/MarketplaceGuide.jsx";

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute("open");
};

afterEach(() => {
  cleanup();
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalClose;
});

test("marketplace guide explains buying and selling without a video", () => {
  render(<MemoryRouter><MarketplaceGuide /></MemoryRouter>);

  fireEvent.click(screen.getByRole("button", { name: "How it works" }));
  expect(screen.getByRole("dialog", { name: "How the marketplace works" })).toBeTruthy();
  expect(screen.getByText("Find a listing")).toBeTruthy();
  expect(screen.getByText(/does not hold the payment in escrow/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "I want to sell" }));
  expect(screen.getByText("Check eligibility")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Start a listing" }).getAttribute("href")).toBe("/marketplace/sell");

  fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
