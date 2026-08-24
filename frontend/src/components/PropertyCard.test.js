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

function renderComponent(cardProperty = property, withRouter = true) {
  const card = <PropertyCard property={cardProperty} />;

  act(() => {
    root.render(
      withRouter ? (
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {card}
        </MemoryRouter>
      ) : (
        card
      )
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

  test("formats the listing details", () => {
    renderComponent();

    expect(container.querySelector(".property-card__price").textContent).toBe(
      "$725,000"
    );
    expect(container.querySelector(".property-card__address").textContent).toBe(
      "123 Main St Austin, TX 78701"
    );
    expect(container.querySelector(".property-card__meta").textContent).toBe(
      "4 bd • 3 ba"
    );
  });

  test("uses the property id for the listing link when listingId is unavailable", () => {
    const propertyWithoutListingId = { ...property, listingId: undefined };

    renderComponent(propertyWithoutListingId);

    expect(container.querySelector('a[href="/property/123"]')).not.toBeNull();
  });

  test("renders fallback details and no link outside router context", () => {
    renderComponent(
      {
        id: "456",
        price: "not-a-price",
        beds: null,
        baths: undefined,
        photos: []
      },
      false
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector(".property-card__price").textContent).toBe(
      "Price unavailable"
    );
    expect(container.querySelector(".property-card__address").textContent).toBe(
      "Address unavailable"
    );
    expect(container.querySelector(".property-card__meta").textContent).toBe(
      "N/A bd • N/A ba"
    );
    expect(container.querySelector("img").alt).toBe("Address unavailable");
  });
});
