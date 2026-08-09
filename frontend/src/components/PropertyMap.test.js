import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import PropertyMap from "./PropertyMap";

let container;
let root;
const originalApiKey = process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(props) {
  act(() => {
    root.render(<PropertyMap {...props} />);
  });
}

describe("PropertyMap", () => {
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
    process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY = originalApiKey;
  });

  test("renders a Google Maps Embed iframe when an API key is available", () => {
    process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY = "test-key";

    renderComponent({
      property: {
        LMD_MP_Latitude: "30.2672",
        LMD_MP_Longitude: "-97.7431"
      }
    });

    const iframe = container.querySelector("iframe");

    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute("src")).toContain(
      "https://www.google.com/maps/embed/v1/place?key=test-key&q=30.2672%2C-97.7431"
    );
    expect(container.querySelector(".property-map__directions").getAttribute("href")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=30.2672%2C-97.7431"
    );
    expect(container.querySelector(".property-map__directions").getAttribute("target")).toBe(
      "_blank"
    );
  });

  test("shows a setup message when the API key is missing", () => {
    delete process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY;

    renderComponent({
      property: {
        LMD_MP_Latitude: "30.2672",
        LMD_MP_Longitude: "-97.7431"
      }
    });

    expect(container.textContent).toContain(
      "Add REACT_APP_GOOGLE_MAPS_EMBED_API_KEY to enable the map embed."
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  test("shows an unavailable message when latitude or longitude is missing", () => {
    process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY = "test-key";

    renderComponent({
      property: {
        LMD_MP_Latitude: "30.2672"
      }
    });

    expect(container.textContent).toContain("Map unavailable for this property.");
    expect(container.querySelector("iframe")).toBeNull();
  });
});
