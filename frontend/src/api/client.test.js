import {
  fetchProperties,
  fetchPropertyById,
  fetchPropertyOpenHouses
} from "./client";

describe("fetchProperties", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("requests properties with query params and returns payload", async () => {
    const payload = {
      total: 1,
      limit: 20,
      offset: 0,
      results: [{ listingId: "123" }]
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload)
    });

    await expect(
      fetchProperties({ city: "Portland", limit: 20, offset: 0 })
    ).resolves.toEqual(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/properties?city=Portland&limit=20&offset=0"
    );
  });

  test("omits empty query params", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        total: 0,
        limit: 20,
        offset: 0,
        results: []
      })
    });

    await fetchProperties({ city: "", zipcode: null, limit: 20, offset: 0 });

    expect(global.fetch).toHaveBeenCalledWith("/api/properties?limit=20&offset=0");
  });

  test("throws backend error messages", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: "Database unavailable"
      })
    });

    await expect(fetchProperties()).rejects.toThrow("Database unavailable");
  });

  test("throws a helpful message when the backend cannot be reached", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(fetchProperties()).rejects.toThrow(
      "Cannot reach the backend. Make sure the Express server is running on port 5050."
    );
  });

  test("requests a single property by id", async () => {
    const payload = {
      L_ListingID: "123"
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload)
    });

    await expect(fetchPropertyById("123")).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith("/api/properties/123");
  });

  test("requests open houses for a property", async () => {
    const payload = [{ id: 1 }];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload)
    });

    await expect(fetchPropertyOpenHouses("123")).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith("/api/properties/123/openhouses");
  });
});
