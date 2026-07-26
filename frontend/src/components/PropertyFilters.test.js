import React, { act, useState } from "react";
import ReactDOM from "react-dom/client";
import PropertyFilters, { DEFAULT_FILTERS } from "./PropertyFilters";

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(props) {
  act(() => {
    root.render(<PropertyFilters {...props} />);
  });
}

function renderControlledComponent({ onSearch, onClear, initialFilters = DEFAULT_FILTERS }) {
  function ControlledFilters() {
    const [filters, setFilters] = useState(initialFilters);

    return (
      <PropertyFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={onSearch}
        onClear={onClear}
        isLoading={false}
      />
    );
  }

  act(() => {
    root.render(<ControlledFilters />);
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

describe("PropertyFilters", () => {
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

  test("renders all six filter inputs", () => {
    renderComponent({
      filters: DEFAULT_FILTERS,
      onFiltersChange: jest.fn(),
      onSearch: jest.fn(),
      onClear: jest.fn(),
      isLoading: false
    });

    expect(container.querySelector('input[name="city"]')).not.toBeNull();
    expect(container.querySelector('input[name="zipcode"]')).not.toBeNull();
    expect(container.querySelector('input[name="minPrice"]')).not.toBeNull();
    expect(container.querySelector('input[name="maxPrice"]')).not.toBeNull();
    expect(container.querySelector('select[name="beds"]')).not.toBeNull();
    expect(container.querySelector('select[name="baths"]')).not.toBeNull();
  });

  test("submits sanitized filters through onSearch", () => {
    const onSearch = jest.fn();
    renderControlledComponent({
      onSearch,
      onClear: jest.fn()
    });

    changeField('input[name="city"]', " Portland ");
    changeField('input[name="minPrice"]', "300000");
    changeField('select[name="beds"]', "3");

    act(() => {
      container.querySelector("form").dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });

    expect(onSearch).toHaveBeenCalledWith({
      city: "Portland",
      minPrice: "300000",
      beds: "3"
    });
  });

  test("clear resets the form and calls onClear with default filters", () => {
    const onClear = jest.fn();
    renderControlledComponent({
      onSearch: jest.fn(),
      onClear,
      initialFilters: {
        city: "Austin",
        zipcode: "73301",
        minPrice: "100000",
        maxPrice: "",
        beds: "2",
        baths: "1.5"
      }
    });

    act(() => {
      container.querySelector('button[type="button"]').click();
    });

    expect(onClear).toHaveBeenCalledWith(DEFAULT_FILTERS);
    expect(container.querySelector('input[name="city"]').value).toBe("");
    expect(container.querySelector('input[name="zipcode"]').value).toBe("");
    expect(container.querySelector('select[name="beds"]').value).toBe("");
    expect(container.querySelector('select[name="baths"]').value).toBe("");
  });
});
