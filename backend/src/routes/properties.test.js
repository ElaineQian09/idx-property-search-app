const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn()
}));

const pool = require("../db");
const app = require("../app");

describe("properties routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/properties", () => {
    it("returns paginated properties with filters and stable sorting", async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 2 }]])
        .mockResolvedValueOnce([[
          {
            id: 2,
            listingId: "1002",
            displayId: "D-1002",
            address: "123 Main St",
            city: "Austin",
            state: "TX",
            zipcode: "78701",
            price: 450000,
            beds: 3,
            baths: 2.5,
            photos: "a.jpg,b.jpg",
            photoCount: 2
          }
        ]]);

      const response = await request(app)
        .get("/api/properties")
        .query({
          city: "Austin",
          zipcode: "78701",
          minPrice: 100000,
          maxPrice: 500000,
          beds: 3,
          baths: 2,
          sortBy: "L_SystemPrice",
          sortOrder: "desc",
          limit: 10,
          offset: 20
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        total: 2,
        limit: 10,
        offset: 20,
        results: [
          {
            id: 2,
            listingId: "1002",
            displayId: "D-1002",
            address: "123 Main St",
            city: "Austin",
            state: "TX",
            zipcode: "78701",
            price: 450000,
            beds: 3,
            baths: 2.5,
            photos: "a.jpg,b.jpg",
            photoCount: 2
          }
        ]
      });

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query.mock.calls[0][0]).toContain("SELECT COUNT(*) AS total");
      expect(pool.query.mock.calls[0][0]).toContain("WHERE `L_City` = ? AND `L_Zip` = ? AND `L_SystemPrice` >= ? AND `L_SystemPrice` <= ? AND `L_Keyword2` >= ? AND `LM_Dec_3` >= ?");
      expect(pool.query.mock.calls[0][1]).toEqual([
        "Austin",
        "78701",
        100000,
        500000,
        3,
        2
      ]);
      expect(pool.query.mock.calls[1][0]).toContain("ORDER BY `L_SystemPrice` desc, `id` ASC");
      expect(pool.query.mock.calls[1][0]).toContain("LIMIT 10 OFFSET 20");
      expect(pool.query.mock.calls[1][1]).toEqual([
        "Austin",
        "78701",
        100000,
        500000,
        3,
        2
      ]);
    });

    it("uses default pagination when limit and offset are omitted", async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 1 }]])
        .mockResolvedValueOnce([[{ id: 1, listingId: "1001" }]]);

      const response = await request(app).get("/api/properties");

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
      expect(pool.query.mock.calls[1][0]).toContain("ORDER BY `id` ASC");
      expect(pool.query.mock.calls[1][0]).toContain("LIMIT 20 OFFSET 0");
    });

    it("rejects invalid query parameters", async () => {
      const response = await request(app)
        .get("/api/properties")
        .query({ foo: "bar" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Unknown query parameter: foo"
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects invalid sort options", async () => {
      const response = await request(app)
        .get("/api/properties")
        .query({ sortBy: "ListPrice", sortOrder: "asc" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch("sortBy must be one of:");
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects sortOrder without sortBy", async () => {
      const response = await request(app)
        .get("/api/properties")
        .query({ sortOrder: "asc" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "sortOrder requires sortBy"
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects invalid numeric ranges", async () => {
      const response = await request(app)
        .get("/api/properties")
        .query({ minPrice: 900000, maxPrice: 100000 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "minPrice cannot be greater than maxPrice"
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 503 when the database is unavailable", async () => {
      const error = new Error("connect timeout");
      error.code = "ETIMEDOUT";
      pool.query.mockRejectedValue(error);

      const response = await request(app).get("/api/properties");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: "Database unavailable. Check that MySQL is running and backend .env values are correct."
      });
    });

    it("returns 500 for unexpected database errors", async () => {
      pool.query.mockRejectedValue(new Error("boom"));

      const response = await request(app).get("/api/properties");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "boom"
      });
    });
  });

  describe("GET /api/properties/:id", () => {
    it("returns the property when the listing exists", async () => {
      const property = {
        id: 7,
        L_ListingID: "1007",
        L_Address: "7 Oak Ave"
      };
      pool.query.mockResolvedValueOnce([[property]]);

      const response = await request(app).get("/api/properties/1007");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(property);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE `L_ListingID` = ?"),
        ["1007"]
      );
    });

    it("returns 404 when the property does not exist", async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app).get("/api/properties/9999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Property not found"
      });
    });

    it("rejects invalid listing ids", async () => {
      const response = await request(app).get("/api/properties/not-a-number");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "listing id must be a positive integer"
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 503 when the property lookup cannot reach the database", async () => {
      const error = new Error("connection lost");
      error.code = "PROTOCOL_CONNECTION_LOST";
      pool.query.mockRejectedValueOnce(error);

      const response = await request(app).get("/api/properties/1007");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: "Database unavailable. Check that MySQL is running and backend .env values are correct."
      });
    });
  });

  describe("GET /api/properties/:id/openhouses", () => {
    it("returns open houses for an existing property", async () => {
      pool.query
        .mockResolvedValueOnce([[{ L_ListingID: "1005" }]])
        .mockResolvedValueOnce([[
          {
            id: 1,
            listingId: "1005",
            displayId: "D-1005",
            openHouseDate: "2026-08-23",
            startTime: "13:00:00",
            endTime: "15:00:00",
            startDate: "2026-08-23",
            endDate: "2026-08-23",
            allData: "{}"
          }
        ]]);

      const response = await request(app).get("/api/properties/1005/openhouses");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 1,
          listingId: "1005",
          displayId: "D-1005",
          openHouseDate: "2026-08-23",
          startTime: "13:00:00",
          endTime: "15:00:00",
          startDate: "2026-08-23",
          endDate: "2026-08-23",
          allData: "{}"
        }
      ]);
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("ORDER BY OpenHouseDate ASC, OH_StartTime ASC"),
        ["1005"]
      );
    });

    it("returns 404 when the property is missing before querying open houses", async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app).get("/api/properties/7777/openhouses");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Property not found"
      });
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it("rejects invalid ids for open house lookups", async () => {
      const response = await request(app).get("/api/properties/0/openhouses");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "listing id must be a positive integer"
      });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns 503 when open house queries cannot reach the database", async () => {
      const error = new Error("connection refused");
      error.code = "ECONNREFUSED";
      pool.query.mockRejectedValueOnce(error);

      const response = await request(app).get("/api/properties/1005/openhouses");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: "Database unavailable. Check that MySQL is running and backend .env values are correct."
      });
    });
  });
});
