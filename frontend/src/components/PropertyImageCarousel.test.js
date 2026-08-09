import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import PropertyImageCarousel from "./PropertyImageCarousel";

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(props) {
  act(() => {
    root.render(<PropertyImageCarousel {...props} />);
  });
}

function clickButton(label) {
  const button = container.querySelector(`[aria-label="${label}"]`);

  act(() => {
    button.click();
  });

  return button;
}

describe("PropertyImageCarousel", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
  });

  test("renders the first photo and counter for multi-photo listings", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(container.textContent).toContain("1 / 2");
  });

  test("cycles through photos with previous and next arrows", () => {
    renderComponent({
      photos: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg"
      ],
      alt: "123 Main St"
    });

    clickButton("Show next property photo");
    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/2.jpg"
    );
    expect(container.textContent).toContain("2 / 3");

    clickButton("Show previous property photo");
    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(container.textContent).toContain("1 / 3");
  });

  test("wraps around when navigating past the first or last photo", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    clickButton("Show previous property photo");
    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/2.jpg"
    );

    clickButton("Show next property photo");
    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
  });

  test("hides arrows and counter when only one photo is available", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg"],
      alt: "123 Main St"
    });

    expect(container.querySelector('[aria-label="Show previous property photo"]')).toBeNull();
    expect(container.querySelector('[aria-label="Show next property photo"]')).toBeNull();
    expect(container.querySelector(".property-card__carousel-counter")).toBeNull();
  });

  test("skips a broken lead image and advances to the next photo", () => {
    renderComponent({
      photos: ["https://example.com/broken.jpg", "https://example.com/working.jpg"],
      alt: "123 Main St"
    });

    act(() => {
      container.querySelector("img").dispatchEvent(new Event("error"));
    });

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/working.jpg"
    );
    expect(container.textContent).toContain("2 / 2");
  });

  test("parses the L_Photos JSON string format", () => {
    renderComponent({
      photos: JSON.stringify([
        { MediaURL: "https://example.com/1.jpg" },
        { MediaURL: "https://example.com/2.jpg" }
      ]),
      alt: "123 Main St"
    });

    expect(container.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(container.textContent).toContain("1 / 2");
  });
});
