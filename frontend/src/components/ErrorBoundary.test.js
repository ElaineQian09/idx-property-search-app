import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import ErrorBoundary from "./ErrorBoundary";

let container;
let root;
let assignMock;
let consoleErrorSpy;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function BrokenComponent() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    assignMock = jest.fn();
    delete window.location;
    window.location = {
      assign: assignMock
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
    consoleErrorSpy.mockRestore();
  });

  test("shows a recovery UI when a child throws during render", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
    });

    expect(container.textContent).toContain("Something went wrong.");
    expect(container.textContent).toContain("Try Again");
    expect(container.textContent).toContain("Reload Listings");
  });

  test("reloads the listings page from the recovery UI", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
    });

    const reloadButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Reload Listings"
    );

    act(() => {
      reloadButton.click();
    });

    expect(assignMock).toHaveBeenCalledWith("/");
  });
});
