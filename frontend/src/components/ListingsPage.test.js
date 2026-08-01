import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import ListingsPage from "./ListingsPage";
import { fetchProperties } from "../api/client";

jest.mock("../api/client", () => ({
  fetchProperties: jest.fn()
}));

let container;
let root;
let scrollIntoViewMock;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildProperty(id, city = "Portland") {
  return {
    id: String(id),
    listingId: String(id),
    address: `${id} Main St`,
    city,
    state: "OR",
    zipcode: "97201",
    price: 500000 + id,
    beds: 3,
    baths: 2,
    photos: []
  };
}

async function renderComponent() {
  await act(async () => {
    root.render(<ListingsPage />);
  });
}

async function flushUpdates() {
  await act(async () => {
    await Promise.resolve();
  });
}

function changeField(selector, value) {
  const field = container.querySelector(selector);
  const prototype =
    field.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;

  act(() => {
    valueSetter.call(field, value);

    if (field.tagName === "SELECT") {
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  return field;
}

function clickButton(text) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === text
  );

  act(() => {
    button.click();
  });

  return button;
}

async function submitFilters() {
  await act(async () => {
    container.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  });
}

describe("ListingsPage", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    fetchProperties.mockReset();
    scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
    jest.restoreAllMocks();
  });

  test("renders the results summary and places pagination below the property grid", async () => {
    fetchProperties.mockResolvedValueOnce({
      total: 45,
      limit: 20,
      offset: 0,
      results: [buildProperty(1)]
    });

    await renderComponent();
    await flushUpdates();

    expect(container.textContent).toContain("Showing 1-1 of 45 properties");
    expect(container.querySelector(".property-grid + .pagination")).not.toBeNull();
  });

  test("changes pages with the applied filters and scrolls to the top", async () => {
    fetchProperties
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 0,
        results: [buildProperty(1)]
      })
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 0,
        results: [buildProperty(2, "Portland")]
      })
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 20,
        results: [buildProperty(3, "Portland")]
      });

    await renderComponent();
    await flushUpdates();

    changeField('input[name="city"]', "Portland");
    await submitFilters();
    await flushUpdates();

    changeField('input[name="city"]', "Seattle");
    clickButton("2");
    await flushUpdates();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: "Portland",
      limit: 20,
      offset: 20
    });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start"
    });
  });

  test("resets to page 1 when filters change and when a new search is applied", async () => {
    fetchProperties
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 0,
        results: [buildProperty(1)]
      })
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 0,
        results: [buildProperty(2, "Portland")]
      })
      .mockResolvedValueOnce({
        total: 40,
        limit: 20,
        offset: 20,
        results: [buildProperty(3, "Portland")]
      })
      .mockResolvedValueOnce({
        total: 20,
        limit: 20,
        offset: 0,
        results: [buildProperty(4, "Austin")]
      });

    await renderComponent();
    await flushUpdates();

    changeField('input[name="city"]', "Portland");
    await submitFilters();
    await flushUpdates();

    clickButton("2");
    await flushUpdates();

    expect(container.querySelector('[aria-current="page"]').textContent).toBe("2");

    changeField('input[name="city"]', "Austin");
    expect(container.querySelector('[aria-current="page"]').textContent).toBe("1");

    await submitFilters();
    await flushUpdates();

    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: "Austin",
      limit: 20,
      offset: 0
    });
    expect(container.querySelector(".pagination")).toBeNull();
  });
});
