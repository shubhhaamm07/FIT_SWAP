// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({
  getGymPosts: vi.fn(),
  getMyGymPosts: vi.fn(),
  saveGymPost: vi.fn(),
  deleteGymPost: vi.fn(),
}));

vi.mock("../src/api/gym.api.js", () => api);

import GymUpdatesFeed from "../src/components/gyms/GymUpdatesFeed.jsx";
import OwnerGymPosts from "../src/components/gym-owner/OwnerGymPosts.jsx";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("members see gym offers as announcements, not checkout prices", async () => {
  api.getGymPosts.mockResolvedValue([{
    id: "post-1", gymId: "gym-1", kind: "OFFER", title: "Student offer", body: "Bring student ID to the gym.",
    offerPrice: "499.00", posterUrl: null, createdAt: "2026-10-08T10:00:00.000Z", endsAt: "2099-01-01T00:00:00.000Z",
  }]);
  render(<GymUpdatesFeed gymId="gym-1" gymName="Fit Hub" />);

  expect(await screen.findByText("Student offer")).toBeTruthy();
  expect(screen.getByText("Advertised offer price")).toBeTruthy();
  expect(screen.getByText(/checkout prices are shown separately/i)).toBeTruthy();
});

test("non-members do not see the gym updates section", async () => {
  api.getGymPosts.mockRejectedValue({ response: { status: 403 } });
  render(<GymUpdatesFeed gymId="gym-1" gymName="Fit Hub" />);

  await waitFor(() => expect(api.getGymPosts).toHaveBeenCalledWith("gym-1", expect.any(Object)));
  await act(async () => { await Promise.resolve(); });
  expect(screen.queryByRole("heading", { name: "From Fit Hub" })).toBeNull();
});

test("an owner can create a gym offer from their gym card", async () => {
  api.getMyGymPosts.mockResolvedValue([]);
  api.saveGymPost.mockResolvedValue({ id: "post-1" });
  render(<OwnerGymPosts gym={{ id: "gym-1", status: "APPROVED" }} />);

  fireEvent.click(screen.getByRole("button", { name: "Manage posters & updates" }));
  await waitFor(() => expect(api.getMyGymPosts).toHaveBeenCalledWith("gym-1"));
  fireEvent.click(screen.getByRole("button", { name: "New update" }));
  fireEvent.change(screen.getByLabelText("Type"), { target: { value: "OFFER" } });
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Student offer" } });
  fireEvent.change(screen.getByLabelText(/^Details/), { target: { value: "Bring student ID to the gym." } });
  fireEvent.change(screen.getByLabelText(/Advertised price/), { target: { value: "499" } });
  fireEvent.change(screen.getByLabelText(/Show until/), { target: { value: "2099-01-01T12:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Create update" }));

  await waitFor(() => expect(api.saveGymPost).toHaveBeenCalledOnce());
  expect(api.saveGymPost.mock.calls[0][1]).toMatchObject({ kind: "OFFER", offerPrice: "499", title: "Student offer" });
});
