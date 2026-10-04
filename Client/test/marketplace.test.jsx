// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import ErrorState from "../src/components/marketplace/states/ErrorState.jsx";
import Pagination from "../src/components/marketplace/pagination/Pagination.jsx";

afterEach(cleanup);

test("marketplace page controls request the selected page", () => {
  const onPageChange = vi.fn();
  render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "3" }));

  expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
  expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
});

test("a failed marketplace load lets the visitor retry", () => {
  const onRetry = vi.fn();
  render(<ErrorState message="Listings are unavailable" onRetry={onRetry} />);

  expect(screen.getByText("Listings are unavailable")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
