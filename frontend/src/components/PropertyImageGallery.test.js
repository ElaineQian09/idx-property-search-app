import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import PropertyImageGallery from "./PropertyImageGallery";

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(props) {
  act(() => {
    root.render(<PropertyImageGallery {...props} />);
  });
}

function clickBySelector(selector) {
  const element = container.querySelector(selector);

  act(() => {
    element.click();
  });

  return element;
}

describe("PropertyImageGallery", () => {
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

  test("renders the main image and thumbnail strip for multiple photos", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    expect(container.querySelector(".detail-gallery__main-image").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(container.querySelectorAll(".detail-gallery__thumb")).toHaveLength(2);
  });

  test("switches the main image when a thumbnail is clicked", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    clickBySelector('[aria-label="Show property image 2"]');

    expect(container.querySelector(".detail-gallery__main-image").getAttribute("src")).toBe(
      "https://example.com/2.jpg"
    );
    expect(container.querySelector('[aria-label="Show property image 2"]').getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  test("opens and closes the lightbox from the main image", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    clickBySelector('[aria-label="Open property image lightbox"]');

    expect(container.querySelector('.detail-lightbox[role="dialog"]')).not.toBeNull();
    expect(container.querySelector(".detail-lightbox__image").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );

    clickBySelector('[aria-label="Close property image lightbox"]');

    expect(container.querySelector(".detail-lightbox")).toBeNull();
  });

  test("closes the lightbox on Escape and navigates images with keyboard arrows", () => {
    renderComponent({
      photos: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg"
      ],
      alt: "123 Main St"
    });

    clickBySelector('[aria-label="Open property image lightbox"]');

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(container.querySelector(".detail-lightbox__image").getAttribute("src")).toBe(
      "https://example.com/2.jpg"
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });

    expect(container.querySelector(".detail-lightbox__image").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(container.querySelector(".detail-lightbox")).toBeNull();
  });

  test("navigates images with lightbox arrow buttons", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      alt: "123 Main St"
    });

    clickBySelector('[aria-label="Open property image lightbox"]');
    clickBySelector('[aria-label="Show next lightbox image"]');

    expect(container.querySelector(".detail-lightbox__image").getAttribute("src")).toBe(
      "https://example.com/2.jpg"
    );
  });

  test("hides the thumbnail strip when only one image is available", () => {
    renderComponent({
      photos: ["https://example.com/1.jpg"],
      alt: "123 Main St"
    });

    expect(container.querySelector(".detail-gallery__thumb-strip")).toBeNull();
  });

  test("skips a broken main image and promotes the next thumbnail", () => {
    renderComponent({
      photos: ["https://example.com/broken.jpg", "https://example.com/working.jpg"],
      alt: "123 Main St"
    });

    act(() => {
      container
        .querySelector(".detail-gallery__main-image")
        .dispatchEvent(new Event("error"));
    });

    expect(container.querySelector(".detail-gallery__main-image").getAttribute("src")).toBe(
      "https://example.com/working.jpg"
    );
    expect(container.querySelector(".detail-gallery__thumb-strip")).toBeNull();
  });

  test("parses the L_Photos JSON string format", () => {
    renderComponent({
      photos: JSON.stringify([
        { MediaURL: "https://example.com/1.jpg" },
        { MediaURL: "https://example.com/2.jpg" }
      ]),
      alt: "123 Main St"
    });

    expect(container.querySelector(".detail-gallery__main-image").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(container.querySelectorAll(".detail-gallery__thumb")).toHaveLength(2);
  });
});
