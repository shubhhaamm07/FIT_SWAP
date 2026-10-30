// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../src/context/contexts";
import MarketplacePage from "../src/pages/marketplace/MarketplacePage";
import ListingDetailsPage from "../src/pages/marketplace/ListingDetailsPage";
import GymDetailsPage from "../src/pages/gyms/GymDetailsPage";
import { getListingById, getMarketplaceListingPage, saveListing } from "../src/api/marketplace.api";
import { getGymById, getGymCrowdLevel, getGymPosts } from "../src/api/gym.api";
import { getMyMemberships } from "../src/api/membership.api";

vi.mock("../src/api/marketplace.api", () => ({ getListingById: vi.fn(), getMarketplaceListingPage: vi.fn(), saveListing: vi.fn(), removeSavedListing: vi.fn() }));
vi.mock("../src/api/gym.api", () => ({ getGymById: vi.fn(), getGymCrowdLevel: vi.fn(), reportGymCrowdLevel: vi.fn(), getGymPosts: vi.fn() }));
vi.mock("../src/api/membership.api", () => ({ getMyMemberships: vi.fn() }));
vi.mock("../src/components/marketplace/details/PurchaseCard", () => ({ default: () => <button>Private payment action</button> }));

const listing = { id: "pass-12345678", gym: "Example Gym", membership: "Annual Plan", location: "Kharar, Punjab", price: 5000, originalPrice: 10000, remainingDays: 90, validTill: "27 Jan 2027", minimumTransferDays: 30, requiresGymApproval: true, allowOnlinePayment: true, status: "ACTIVE", image: "https://example.com/gym.jpg", seller: "FitSwap Member" };
function view(path, page, pattern) {
  return render(<AuthContext.Provider value={{ user: null, isAuthenticated: false, loading: false }}><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern || path} element={page} /><Route path="/login" element={<h1>Sign in to FitSwap</h1>} /></Routes></MemoryRouter></AuthContext.Provider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getListingById).mockResolvedValue(listing);
  vi.mocked(getMarketplaceListingPage).mockResolvedValue({ items: [listing], pagination: { total: 1, totalPages: 1 } });
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("anonymous visitors see marketplace results and sign in only when saving", async () => {
  view("/marketplace", <MarketplacePage />);
  const link = await screen.findByRole("link", { name: /View Annual Plan at Example Gym, listing/ });
  expect(link.getAttribute("href")).toBe(`/marketplace/${listing.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Save Annual Plan at Example Gym" }));
  expect(screen.getByRole("heading", { name: "Sign in to FitSwap" })).toBeTruthy();
  expect(saveListing).not.toHaveBeenCalled();
});

test("public listing details show actual validity and conditions without checkout", async () => {
  view(`/marketplace/${listing.id}`, <ListingDetailsPage />, "/marketplace/:listingId");
  expect(await screen.findByRole("heading", { name: "Example Gym" })).toBeTruthy();
  expect(screen.getByText("27 Jan 2027")).toBeTruthy();
  expect(screen.getByText("Required")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Private payment action" })).toBeNull();
  expect(screen.getByRole("link", { name: "Sign in to continue" }).getAttribute("href")).toBe("/login?returnTo=%2Fmarketplace%2Fpass-12345678");
  expect(document.title).toBe("Annual Plan at Example Gym | FitSwap");
});

test("a missing listing shows a recovery path and is excluded from indexing", async () => {
  vi.mocked(getListingById).mockRejectedValue({ response: { status: 404, data: { message: "Listing not found." } } });
  view("/marketplace/missing", <ListingDetailsPage />, "/marketplace/:listingId");
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Browse available passes" })).toBeTruthy();
  expect(document.querySelector('meta[name="robots"]').content).toBe("noindex, follow");
});

test("public gym details avoid member-only reads and gate purchase actions", async () => {
  vi.mocked(getGymById).mockResolvedValue({ id: "gym-1", name: "Example Gym", city: "Kharar", state: "Punjab", plans: [{ id: "plan-1", name: "Annual Plan", price: 10000, durationInDays: 365 }] });
  view("/gyms/gym-1", <GymDetailsPage />, "/gyms/:gymId");
  expect(await screen.findByRole("heading", { name: "Example Gym" })).toBeTruthy();
  expect(getMyMemberships).not.toHaveBeenCalled();
  expect(getGymCrowdLevel).not.toHaveBeenCalled();
  expect(getGymPosts).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Get membership" }));
  expect(screen.getByRole("heading", { name: "Sign in to FitSwap" })).toBeTruthy();
});
