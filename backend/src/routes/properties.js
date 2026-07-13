const express = require("express");
const router = express.Router();

const pool = require("../db");

const TABLE = "rets_property";
const OPEN_HOUSE_TABLE = "rets_openhouse";

const COL = {
  id: "id",
  listingId: "L_ListingID",
  displayId: "L_DisplayId",
  city: "L_City",
  zipcode: "L_Zip",
  price: "L_SystemPrice",
  beds: "L_Keyword2",
  baths: "LM_Dec_3"
};

function quoteIdentifier(identifier) {
  return `\`${identifier.replace(/`/g, "``")}\``;
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function parseInteger(value, name, options = {}) {
  const { defaultValue, min, max } = options;

  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw createBadRequestError(`${name} must be an integer`);
  }

  if (min !== undefined && parsed < min) {
    throw createBadRequestError(`${name} must be at least ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw createBadRequestError(`${name} must be at most ${max}`);
  }

  return parsed;
}

function parseNumber(value, name, options = {}) {
  const { min } = options;

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw createBadRequestError(`${name} must be a valid number`);
  }

  if (min !== undefined && parsed < min) {
    throw createBadRequestError(`${name} must be at least ${min}`);
  }

  return parsed;
}

function parseListingId(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createBadRequestError("listing id must be a positive integer");
  }

  return String(parsed);
}

async function findPropertyByListingId(listingId) {
  const sql = `
    SELECT *
    FROM ${quoteIdentifier(TABLE)}
    WHERE ${quoteIdentifier(COL.listingId)} = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [listingId]);
  return rows[0] || null;
}

router.get("/", async (req, res) => {
  try {
    const allowedParams = new Set([
      "city",
      "zipcode",
      "minPrice",
      "maxPrice",
      "beds",
      "baths",
      "limit",
      "offset"
    ]);

    for (const param of Object.keys(req.query)) {
      if (!allowedParams.has(param)) {
        throw createBadRequestError(`Unknown query parameter: ${param}`);
      }
    }

    const limit = parseInteger(req.query.limit, "limit", {
      defaultValue: 20,
      min: 1,
      max: 100
    });

    const offset = parseInteger(req.query.offset, "offset", {
      defaultValue: 0,
      min: 0
    });

    const minPrice = parseNumber(req.query.minPrice, "minPrice", {
      min: 0
    });

    const maxPrice = parseNumber(req.query.maxPrice, "maxPrice", {
      min: 0
    });

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw createBadRequestError("minPrice cannot be greater than maxPrice");
    }

    const beds = parseInteger(req.query.beds, "beds", {
      min: 0
    });

    const baths = parseNumber(req.query.baths, "baths", {
      min: 0
    });

    const conditions = [];
    const values = [];

    if (req.query.city !== undefined) {
      const city = String(req.query.city).trim();

      if (!city) {
        throw createBadRequestError("city cannot be empty");
      }

      conditions.push(
        `LOWER(TRIM(${quoteIdentifier(COL.city)})) = LOWER(TRIM(?))`
      );
      values.push(city);
    }

    if (req.query.zipcode !== undefined) {
      const zipcode = String(req.query.zipcode).trim();

      if (!zipcode) {
        throw createBadRequestError("zipcode cannot be empty");
      }

      conditions.push(`TRIM(${quoteIdentifier(COL.zipcode)}) = ?`);
      values.push(zipcode);
    }

    if (minPrice !== undefined) {
      conditions.push(`${quoteIdentifier(COL.price)} >= ?`);
      values.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions.push(`${quoteIdentifier(COL.price)} <= ?`);
      values.push(maxPrice);
    }

    if (beds !== undefined) {
      conditions.push(`${quoteIdentifier(COL.beds)} >= ?`);
      values.push(beds);
    }

    if (baths !== undefined) {
      conditions.push(`${quoteIdentifier(COL.baths)} >= ?`);
      values.push(baths);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*) AS total
      FROM ${quoteIdentifier(TABLE)}
      ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, values);
    const total = Number(countRows[0].total);

    const dataSql = `
        SELECT
            ${quoteIdentifier(COL.id)} AS id,
            ${quoteIdentifier(COL.city)} AS city,
            ${quoteIdentifier(COL.zipcode)} AS zipcode,
            ${quoteIdentifier(COL.price)} AS price,
            ${quoteIdentifier(COL.beds)} AS beds,
            ${quoteIdentifier(COL.baths)} AS baths,
            
            ${quoteIdentifier("PhotoCount")} AS photoCount
        FROM ${quoteIdentifier(TABLE)}
        ${whereClause}
        ORDER BY ${quoteIdentifier(COL.id)}
        LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.query(dataSql, values);

    return res.status(200).json({
      total,
      limit,
      offset,
      results: rows
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.message
      });
    }

    console.error("GET /api/properties failed:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.get("/:id/openhouses", async (req, res) => {
  try {
    const listingId = parseListingId(req.params.id);
    const property = await findPropertyByListingId(listingId);

    if (!property) {
      return res.status(404).json({
        error: "Property not found"
      });
    }

    const sql = `
      SELECT
        id,
        ${quoteIdentifier(COL.listingId)} AS listingId,
        ${quoteIdentifier(COL.displayId)} AS displayId,
        OpenHouseDate AS openHouseDate,
        OH_StartTime AS startTime,
        OH_EndTime AS endTime,
        OH_StartDate AS startDate,
        OH_EndDate AS endDate,
        all_data AS allData
      FROM ${quoteIdentifier(OPEN_HOUSE_TABLE)}
      WHERE ${quoteIdentifier(COL.listingId)} = ?
      ORDER BY OpenHouseDate ASC, OH_StartTime ASC
    `;

    const [rows] = await pool.query(sql, [property[COL.listingId]]);

    return res.status(200).json(rows);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.message
      });
    }

    console.error("GET /api/properties/:id/openhouses failed:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const listingId = parseListingId(req.params.id);
    const property = await findPropertyByListingId(listingId);

    if (!property) {
      return res.status(404).json({
        error: "Property not found"
      });
    }

    return res.status(200).json(property);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.message
      });
    }

    console.error("GET /api/properties/:id failed:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;
