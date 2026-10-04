// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { registerUser } from "../src/api/auth.api.js";
import RegisterForm from "../src/pages/auth/RegisterForm.jsx";

vi.mock("../src/api/auth.api.js", () => ({ registerUser: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("registration does not call the API when required information is missing", () => {
  render(<MemoryRouter><RegisterForm /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  expect(screen.getByText("First name is required.")).toBeTruthy();
  expect(screen.getByText("Please accept the Terms & Conditions.")).toBeTruthy();
  expect(registerUser).not.toHaveBeenCalled();
});

test("registration submits a valid member and shows confirmation", async () => {
  vi.mocked(registerUser).mockResolvedValue({});
  const { container } = render(<MemoryRouter><RegisterForm /></MemoryRouter>);
  const enter = (name, value) => {
    fireEvent.change(container.querySelector(`input[name="${name}"]`), { target: { value } });
  };

  enter("firstName", "Asha");
  enter("lastName", "Rao");
  enter("email", "asha@example.com");
  enter("phone", "9876543210");
  enter("password", "SecurePass123!");
  enter("confirmPassword", "SecurePass123!");
  fireEvent.click(container.querySelector('input[type="checkbox"]'));
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  expect(await screen.findByRole("heading", { name: "Account created" })).toBeTruthy();
  expect(registerUser).toHaveBeenCalledWith({
    firstName: "Asha",
    lastName: "Rao",
    email: "asha@example.com",
    phone: "9876543210",
    password: "SecurePass123!",
    role: "USER",
  });
});
