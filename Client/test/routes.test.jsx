// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthContext } from "../src/context/contexts.js";
import ProtectedRoute from "../src/routes/ProtectedRoute.jsx";
import RoleRoute from "../src/routes/RoleRoute.jsx";

afterEach(cleanup);

test("a signed-out visitor is sent to login", () => {
  render(
    <AuthContext.Provider value={{ loading: false, isAuthenticated: false, user: null }}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/private" element={<ProtectedRoute><h1>Private page</h1></ProtectedRoute>} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  expect(screen.getByRole("heading", { name: "Login page" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Private page" })).toBeNull();
});

test("a member cannot open the admin area", () => {
  render(
    <AuthContext.Provider value={{ loading: false, isAuthenticated: true, user: { role: "USER" } }}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<RoleRoute allowedRoles={["ADMIN"]}><h1>Admin page</h1></RoleRoute>} />
          <Route path="/dashboard" element={<h1>Member dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  expect(screen.getByRole("heading", { name: "Member dashboard" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Admin page" })).toBeNull();
});

test("an administrator can open the admin area", () => {
  render(
    <AuthContext.Provider value={{ loading: false, isAuthenticated: true, user: { role: "ADMIN" } }}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<RoleRoute allowedRoles={["ADMIN"]}><h1>Admin page</h1></RoleRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  expect(screen.getByRole("heading", { name: "Admin page" })).toBeTruthy();
});
