
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders the School of Food Technology heading", async () => {
  render(<App />);

  const heading = await screen.findByRole("heading", {
    name: /school of food technology/i,
  });

  expect(heading).toBeInTheDocument();
});
