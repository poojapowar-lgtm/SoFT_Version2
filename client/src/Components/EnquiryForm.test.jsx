
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import EnquiryForm from "./EnquiryForm";

jest.mock("axios");

describe("EnquiryForm", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test("renders all required form fields", () => {
    render(<EnquiryForm onClose={onClose} />);

    expect(screen.getByText("Quick Enquiry")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your full name")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your email address")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter 10-digit mobile number")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" }))
      .toBeInTheDocument();
  });

  test("submits enquiry successfully", async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValue({
      data: "Enquiry submitted successfully",
    });

    render(<EnquiryForm onClose={onClose} />);

    await user.type(
      screen.getByPlaceholderText("Enter your full name"),
      "Test Student"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your email address"),
      "student@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter 10-digit mobile number"),
      "9876543210"
    );

    await user.selectOptions(
      screen.getByRole("combobox"),
      "B. Tech. (Food Technology)"
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/api/enquiry",
        {
          name: "Test Student",
          email: "student@example.com",
          mobile: "9876543210",
          course: "B. Tech. (Food Technology)",
          captchaAnswer: "",
        }
      );

      expect(window.alert).toHaveBeenCalledWith(
        "Enquiry submitted successfully"
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("shows an error when API submission fails", async () => {
    const user = userEvent.setup();
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    axios.post.mockRejectedValue(new Error("Network error"));

    render(<EnquiryForm onClose={onClose} />);

    await user.type(
      screen.getByPlaceholderText("Enter your full name"),
      "Test Student"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your email address"),
      "student@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter 10-digit mobile number"),
      "9876543210"
    );

    await user.selectOptions(
      screen.getByRole("combobox"),
      "B. Tech. (Food Technology)"
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error submitting enquiry"
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });
});
