// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { RouteMetadata } from "../src/seo/PageMetadata";
import { normalizeSiteUrl, publicPages, organizationSchema } from "../src/seo/site";
import { robotsFor, sitemapFor } from "../src/seo/crawlers";
import { safeReturnPath, signInPath } from "../src/utils/signInPath";
import Input from "../src/components/ui/Input";

beforeEach(() => { vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.head.querySelectorAll("[data-fitswap-seo]").forEach((tag) => tag.remove()); });

test("metadata follows navigation without duplicate tags or localhost canonicals", () => {
  render(<MemoryRouter><RouteMetadata /><Routes><Route path="/" element={<Link to="/login?returnTo=%2Fmarketplace%2Fpass">Sign in</Link>} /><Route path="/login" element={<Link to="/marketplace">Browse</Link>} /><Route path="/marketplace" element={<h1>Marketplace</h1>} /></Routes></MemoryRouter>);
  expect(document.title).toBe(publicPages["/"].title);
  expect(document.querySelector('link[rel="canonical"]').href).toBe("https://fitswapp.netlify.app/");
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  fireEvent.click(screen.getByRole("link", { name: "Sign in" }));
  expect(document.title).toBe("Sign In | FitSwap");
  expect(document.querySelector('meta[name="robots"]').content).toBe("noindex, follow");
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  fireEvent.click(screen.getByRole("link", { name: "Browse" }));
  expect(document.title).toBe(publicPages["/marketplace"].title);
  expect(document.querySelector('meta[name="robots"]').content).toBe("index, follow");
  expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
});

test("crawler files reference only public indexable HTTPS pages", () => {
  const origin = "https://fitswapp.netlify.app";
  const xml = sitemapFor(origin, publicPages);
  const sitemap = new DOMParser().parseFromString(xml, "application/xml");
  expect(sitemap.querySelector("parsererror")).toBeNull();
  expect([...sitemap.querySelectorAll("loc")].map((node) => node.textContent)).toContain(`${origin}/marketplace`);
  expect(xml).not.toMatch(/localhost|\/login|\/terms|\/privacy|\/dashboard/);
  expect(robotsFor(origin)).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const graph = organizationSchema(origin)["@graph"];
  expect(graph.map((entity) => entity["@type"])).toEqual(["Organization", "WebSite"]);
  expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|ExerciseGym/);
});

test("site origin validation rejects local addresses and URL credentials", () => {
  for (const value of ["http://localhost:5173", "https://127.0.0.1", "https://a.localhost", "https://user:secret@example.com", "https://example.com/path", "https://example.com/?secret=1"]) expect(() => normalizeSiteUrl(value)).toThrow();
  expect(normalizeSiteUrl("https://fitswapp.netlify.app/")).toBe("https://fitswapp.netlify.app");
});

test("sign-in resumes a local member action and rejects external redirects", () => {
  expect(signInPath("/marketplace/pass-1")).toBe("/login?returnTo=%2Fmarketplace%2Fpass-1");
  expect(safeReturnPath("/trials?gymId=gym-1")).toBe("/trials?gymId=gym-1");
  for (const value of ["//evil.example", "https://evil.example", "/marketplace\\evil", "/marketplace\n", "/admin/dashboard"]) expect(safeReturnPath(value)).toBe("");
});

test("shared form fields associate their label, error and password control", () => {
  render(<Input label="Password" name="password" type="password" value="" onChange={() => {}} rightIcon={<span>Eye</span>} onRightIconClick={() => {}} error="Password is required." minLength={12} />);
  const input = screen.getByLabelText("Password");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.minLength).toBe(12);
  expect(document.getElementById(input.getAttribute("aria-describedby")).textContent).toBe("Password is required.");
  expect(screen.getByRole("button", { name: "Show password" })).toBeTruthy();
});
