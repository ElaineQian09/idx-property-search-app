const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const routerPath = path.resolve(__dirname, "properties.js");
const dbPath = path.resolve(__dirname, "../db.js");

function loadRouteWithPoolMock(poolMock) {
  delete require.cache[routerPath];
  delete require.cache[dbPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: poolMock
  };

  const router = require(routerPath);
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === "/" && entry.route.methods.get
  );

  assert.ok(layer, "Expected GET / route to exist");
  return layer.route.stack[0].handle;
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function invokeListRoute(query, poolQueryImpl) {
  const poolMock = {
    query: poolQueryImpl
  };
  const handler = loadRouteWithPoolMock(poolMock);
  const req = {
    query
  };
  const res = createResponse();

  await handler(req, res);

  return res;
}

test("sorts by price ascending with stable secondary id sort", async () => {
  const queries = [];

  const res = await invokeListRoute(
    {
      sortBy: "L_SystemPrice",
      sortOrder: "asc",
      limit: "20",
      offset: "0"
    },
    async (sql) => {
      queries.push(sql);

      if (sql.includes("COUNT(*) AS total")) {
        return [[{ total: 2 }]];
      }

      return [[
        { id: 2, listingId: "2", price: 100000 },
        { id: 7, listingId: "7", price: 200000 }
      ]];
    }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 2);
  assert.match(
    queries[1],
    /ORDER BY `L_SystemPrice` asc, `id` ASC/
  );
});

test("sorts by price descending with stable secondary id sort", async () => {
  const queries = [];

  const res = await invokeListRoute(
    {
      sortBy: "L_SystemPrice",
      sortOrder: "desc"
    },
    async (sql) => {
      queries.push(sql);

      if (sql.includes("COUNT(*) AS total")) {
        return [[{ total: 2 }]];
      }

      return [[
        { id: 7, listingId: "7", price: 200000 },
        { id: 2, listingId: "2", price: 100000 }
      ]];
    }
  );

  assert.equal(res.statusCode, 200);
  assert.match(
    queries[1],
    /ORDER BY `L_SystemPrice` desc, `id` ASC/
  );
});

test("sorts by date listed using OnMarketDate", async () => {
  const queries = [];

  const res = await invokeListRoute(
    {
      sortBy: "OnMarketDate",
      sortOrder: "desc"
    },
    async (sql) => {
      queries.push(sql);

      if (sql.includes("COUNT(*) AS total")) {
        return [[{ total: 2 }]];
      }

      return [[
        { id: 5, listingId: "5" },
        { id: 4, listingId: "4" }
      ]];
    }
  );

  assert.equal(res.statusCode, 200);
  assert.match(
    queries[1],
    /ORDER BY `OnMarketDate` desc, `id` ASC/
  );
});

test("rejects invalid sortBy values with 400", async () => {
  let queryCallCount = 0;

  const res = await invokeListRoute(
    {
      sortBy: "ListPrice",
      sortOrder: "asc"
    },
    async () => {
      queryCallCount += 1;
      return [[{ total: 0 }]];
    }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(queryCallCount, 0);
  assert.match(res.body.error, /sortBy must be one of:/);
});

test("rejects invalid sortOrder values with 400", async () => {
  let queryCallCount = 0;

  const res = await invokeListRoute(
    {
      sortBy: "L_SystemPrice",
      sortOrder: "up"
    },
    async () => {
      queryCallCount += 1;
      return [[{ total: 0 }]];
    }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(queryCallCount, 0);
  assert.equal(res.body.error, "sortOrder must be either asc or desc");
});

test("rejects sortOrder when sortBy is missing", async () => {
  let queryCallCount = 0;

  const res = await invokeListRoute(
    {
      sortOrder: "asc"
    },
    async () => {
      queryCallCount += 1;
      return [[{ total: 0 }]];
    }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(queryCallCount, 0);
  assert.equal(res.body.error, "sortOrder requires sortBy");
});
