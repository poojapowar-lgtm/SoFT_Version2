
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Login from "./Login";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("SOFT Admin Login", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    sessionStorage.clear();
    localStorage.clear();

    useNavigate.mockReturnValue(mockNavigate);
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders email, password, and login button", () => {
    render(<Login />);

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Login" })
    ).toBeInTheDocument();
  });

  test("prevents login when email and password are empty", async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(window.alert).toHaveBeenCalledWith(
      "Please enter email and password"
    );

    expect(axios.post).not.toHaveBeenCalled();
  });

  test("prevents login when email contains only spaces", async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "   ");
    await user.type(screen.getByPlaceholderText("Password"), "password123");

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(window.alert).toHaveBeenCalledWith(
      "Please enter email and password"
    );

    expect(axios.post).not.toHaveBeenCalled();
  });

  test("logs in successfully and stores the token in sessionStorage", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "old-token");
    localStorage.setItem("adminToken", "old-admin-token");
    localStorage.setItem("adminUser", '{"email":"old@example.com"}');

    axios.post.mockResolvedValue({
      data: {
        token: "test-jwt-token",
        user: {
          id: 1,
          email: "admin@example.com",
          role: "admin",
        },
      },
    });

    render(<Login />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "StrongPassword123!"
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/auth/secure-soft",
        {
          email: "admin@example.com",
          password: "StrongPassword123!",
        }
      );

      expect(sessionStorage.getItem("adminToken")).toBe(
        "test-jwt-token"
      );

      expect(JSON.parse(sessionStorage.getItem("adminUser"))).toEqual({
        id: 1,
        email: "admin@example.com",
        role: "admin",
      });

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("adminToken")).toBeNull();
      expect(localStorage.getItem("adminUser")).toBeNull();

      expect(mockNavigate).toHaveBeenCalledWith(
        "/admin/dashboard",
        { replace: true }
      );
    });
  });

  test("shows an error when the API does not return a token", async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValue({
      data: {
        user: { email: "admin@example.com" },
      },
    });

    render(<Login />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Login failed: Authentication token not received"
      );
    });

    expect(sessionStorage.getItem("adminToken")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows the backend error message when login fails", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    render(<Login />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "wrong-password"
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Invalid credentials");
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows a generic error when the API request fails unexpectedly", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValue(new Error("Network error"));

    render(<Login />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Login failed");
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("disables the button while login is pending", async () => {
    const user = userEvent.setup();

    let resolveRequest;

    axios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<Login />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "admin@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      screen.getByRole("button", { name: "Logging in..." })
    ).toBeDisabled();

    resolveRequest({
      data: {
        token: "test-jwt-token",
        user: { email: "admin@example.com" },
      },
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/admin/dashboard",
        { replace: true }
      );
    });
  });
});
