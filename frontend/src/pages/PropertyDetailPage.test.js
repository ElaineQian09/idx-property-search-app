import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PropertyDetailPage from "./PropertyDetailPage";
import { fetchPropertyById, fetchPropertyOpenHouses } from "../api/client";

jest.mock("../api/client", () => ({
  fetchPropertyById: jest.fn(),
  fetchPropertyOpenHouses: jest.fn()
}));

let container;
let root;
const originalApiKey = process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildProperty() {
  return {
    L_ListingID: "123",
    L_DisplayId: "MLS-123",
    L_Address: "123 Main St",
    L_City: "Austin",
    L_State: "TX",
    L_Zip: "78701",
    L_SystemPrice: 725000,
    L_Keyword2: 4,
    LM_Dec_3: 3,
    L_ApproximateSqFt: 2480,
    L_YearBuilt: 2018,
    LR_remarks22: "Modern finishes and a large fenced yard.",
    L_Class: "Residential",
    L_Type_: "Single Family Detached",
    L_Status: "Active",
    L_Area: "Central Austin",
    L_GarageCapacity: 2,
    L_LotSizeArea: 0.21,
    LMD_MP_Latitude: "30.2672",
    LMD_MP_Longitude: "-97.7431",
    L_Photos: []
  };
}

async function renderComponent(initialPath = "/property/123") {
  await act(async () => {
    root.render(
      <MemoryRouter
        initialEntries={[initialPath]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/property/:id" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  });
}

async function flushUpdates() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("PropertyDetailPage", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    fetchPropertyById.mockReset();
    fetchPropertyOpenHouses.mockReset();
    process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY = "test-key";
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
    process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  test("renders price, address, stats, description, details, and open houses", async () => {
    fetchPropertyById.mockResolvedValueOnce(buildProperty());
    fetchPropertyOpenHouses.mockResolvedValueOnce([
      {
        id: 1,
        openHouseDate: "2026-08-10T00:00:00.000Z",
        startTime: "13:00:00",
        endTime: "16:00:00",
        allData: JSON.stringify({
          OH_Remarks: "Hosted by appointment with refreshments provided."
        })
      }
    ]);

    await renderComponent();
    await flushUpdates();

    expect(fetchPropertyById).toHaveBeenCalledWith("123");
    expect(fetchPropertyOpenHouses).toHaveBeenCalledWith("123");
    expect(container.textContent).toContain("$725,000");
    expect(container.textContent).toContain("123 Main St Austin, TX 78701");
    expect(container.textContent).toContain("4 bd");
    expect(container.textContent).toContain("3 ba");
    expect(container.textContent).toContain("2,480 sqft");
    expect(container.textContent).toContain("Built 2018");
    expect(container.textContent).toContain("Modern finishes and a large fenced yard.");
    expect(container.textContent).toContain("Single Family Detached");
    expect(container.textContent).toContain("Central Austin");
    expect(container.textContent).toContain("2 cars");
    expect(container.textContent).toContain("0.21 acres");
    expect(container.textContent).toContain("Aug 10, 2026");
    expect(container.textContent).toContain("1:00 PM - 4:00 PM");
    expect(container.textContent).toContain(
      "Hosted by appointment with refreshments provided."
    );
    expect(container.querySelector(".detail-gallery__main-image")).not.toBeNull();
    expect(container.querySelector(".property-map__frame")).not.toBeNull();
    expect(container.querySelector(".property-map__frame").getAttribute("src")).toContain(
      "q=30.2672%2C-97.7431"
    );
    expect(container.querySelector(".property-map__directions")).not.toBeNull();
  });

  test("shows fallback text when description and open houses are missing", async () => {
    fetchPropertyById.mockResolvedValueOnce({
      ...buildProperty(),
      LR_remarks22: ""
    });
    fetchPropertyOpenHouses.mockResolvedValueOnce([]);

    await renderComponent();
    await flushUpdates();

    expect(container.textContent).toContain("No description available for this property.");
    expect(container.textContent).toContain("No open houses scheduled.");
  });
});
