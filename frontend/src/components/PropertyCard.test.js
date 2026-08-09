import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import PropertyCard from "./PropertyCard";

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const property = {
  id: "123",
  listingId: "123",
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  zipcode: "78701",
  price: 725000,
  beds: 4,
  baths: 3,
  photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"]
};

function renderComponent() {
  act(() => {
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <PropertyCard property={property} />
      </MemoryRouter>
    );
  });
}

describe("PropertyCard", () => {
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

  test("renders the carousel inside the clickable listing card", () => {
    renderComponent();

    const link = container.querySelector('a[href="/property/123"]');

    expect(link).not.toBeNull();
    expect(link.querySelector("img").getAttribute("src")).toBe(
      "https://example.com/1.jpg"
    );
    expect(link.textContent).toContain("1 / 2");
  });
});
