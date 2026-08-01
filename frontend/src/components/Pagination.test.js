import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import Pagination from "./Pagination";

let container;
let root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(props) {
  act(() => {
    root.render(<Pagination {...props} />);
  });
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

describe("Pagination", () => {
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

  test("renders nothing when there is only one page", () => {
    renderComponent({
      currentPage: 1,
      totalPages: 1,
      onPageChange: jest.fn(),
      isLoading: false
    });

    expect(container.innerHTML).toBe("");
  });

  test("renders all page numbers when total pages are small", () => {
    renderComponent({
      currentPage: 3,
      totalPages: 5,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const pageButtons = Array.from(
      container.querySelectorAll(".pagination__page")
    ).map((button) => button.textContent);

    expect(pageButtons).toEqual(["1", "2", "3", "4", "5"]);
    expect(container.querySelector(".pagination__ellipsis")).toBeNull();
  });

  test("disables previous on the first page and next on the last page", () => {
    renderComponent({
      currentPage: 1,
      totalPages: 5,
      onPageChange: jest.fn(),
      isLoading: false
    });

    expect(clickButton("Previous").disabled).toBe(true);
    expect(clickButton("Next").disabled).toBe(false);

    renderComponent({
      currentPage: 5,
      totalPages: 5,
      onPageChange: jest.fn(),
      isLoading: false
    });

    expect(clickButton("Previous").disabled).toBe(false);
    expect(clickButton("Next").disabled).toBe(true);
  });

  test("calls onPageChange for previous, next, and numbered page clicks", () => {
    const onPageChange = jest.fn();

    renderComponent({
      currentPage: 3,
      totalPages: 8,
      onPageChange,
      isLoading: false
    });

    clickButton("Previous");
    clickButton("4");
    clickButton("Next");

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
  });

  test("marks the current page as active and sets aria-current", () => {
    renderComponent({
      currentPage: 4,
      totalPages: 8,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const activeButton = container.querySelector(".pagination__page--active");

    expect(activeButton).not.toBeNull();
    expect(activeButton.textContent).toBe("4");
    expect(activeButton.getAttribute("aria-current")).toBe("page");
  });

  test("renders trailing ellipsis when the current page is near the start", () => {
    renderComponent({
      currentPage: 2,
      totalPages: 10,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const pageItems = Array.from(container.querySelector(".pagination__pages").children).map(
      (element) => element.textContent
    );

    expect(pageItems).toEqual(["1", "2", "3", "4", "5", "...", "10"]);
  });

  test("renders leading ellipsis when the current page is near the end", () => {
    renderComponent({
      currentPage: 9,
      totalPages: 10,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const pageItems = Array.from(container.querySelector(".pagination__pages").children).map(
      (element) => element.textContent
    );

    expect(pageItems).toEqual(["1", "...", "6", "7", "8", "9", "10"]);
  });

  test("does not duplicate the last page when the current page is near the end", () => {
    renderComponent({
      currentPage: 23,
      totalPages: 24,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const pageItems = Array.from(
      container.querySelector(".pagination__pages").children
    ).map((element) => element.textContent);

    expect(pageItems).toEqual(["1", "...", "20", "21", "22", "23", "24"]);
    expect(pageItems.filter((item) => item === "24")).toHaveLength(1);
  });

  test("renders ellipses on both sides when the current page is in the middle", () => {
    renderComponent({
      currentPage: 6,
      totalPages: 12,
      onPageChange: jest.fn(),
      isLoading: false
    });

    const pageItems = Array.from(container.querySelector(".pagination__pages").children).map(
      (element) => element.textContent
    );

    expect(pageItems).toEqual(["1", "...", "5", "6", "7", "...", "12"]);
  });

  test("disables all buttons while loading", () => {
    renderComponent({
      currentPage: 4,
      totalPages: 8,
      onPageChange: jest.fn(),
      isLoading: true
    });

    const buttons = Array.from(container.querySelectorAll("button"));

    expect(buttons.every((button) => button.disabled)).toBe(true);
  });
});
