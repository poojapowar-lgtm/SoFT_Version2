
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AdminRoute from "./AdminRoute";

jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(),
}));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/admin/dashboard"]}>
      <Routes>
        <Route
          path="/admin/secure-soft"
          element={<h1>Login Page</h1>}
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <h1>Admin Dashboard</h1>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminRoute security checks", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects when no token exists", () => {
    renderRoute();

    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument();
  });

  test("allows an unexpired token through the frontend guard", () => {
    sessionStorage.setItem("adminToken", "test-token");

    jwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    renderRoute();

    expect(
      screen.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeInTheDocument();
  });

  test("clears an expired token and redirects", () => {
    sessionStorage.setItem("adminToken", "expired-token");
    sessionStorage.setItem("adminUser", '{"email":"admin@example.com"}');

    jwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    renderRoute();

    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("adminToken")).toBeNull();
    expect(sessionStorage.getItem("adminUser")).toBeNull();
  });

  test("clears a malformed token and redirects", () => {
    sessionStorage.setItem("adminToken", "malformed-token");
    sessionStorage.setItem("adminUser", '{"email":"admin@example.com"}');

    jwtDecode.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    renderRoute();

    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("adminToken")).toBeNull();
    expect(sessionStorage.getItem("adminUser")).toBeNull();
  });

  test("rejects a token without an expiration claim", () => {
    sessionStorage.setItem("adminToken", "token-without-exp");

    jwtDecode.mockReturnValue({
      email: "admin@example.com",
    });

    renderRoute();

    expect(
      screen.getByRole("heading", { name: "Login Page" })
    ).toBeInTheDocument();

    expect(sessionStorage.getItem("adminToken")).toBeNull();
  });
});
