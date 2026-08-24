# IDX Property Search App

A full-stack property-search application. The React frontend lets users browse, filter, sort, and paginate listings; each listing links to a detail page with photos, listing facts, open-house information, and an optional Google Maps embed. The Express API reads property data from MySQL.

## Stack

- Frontend: React 18, React Router, Create React App
- Backend: Node.js, Express 4, MySQL2
- Testing: Jest, React DOM test utilities, Supertest
- Data: MySQL tables `rets_property` and `rets_openhouse`

## Prerequisites

- Node.js 18 or later and npm
- A running MySQL instance containing the expected IDX/RETS tables
- Optional: a Google Maps Embed API key for maps on property detail pages

The application does not create or seed its database. `rets_property` and `rets_openhouse` must already exist and contain data compatible with the columns used by the API.

## Quick Start

Install dependencies for each application:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env` with your local database connection values:

```dotenv
PORT=5050
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
```

Optionally create `frontend/.env` to enable the map embed:

```dotenv
REACT_APP_GOOGLE_MAPS_EMBED_API_KEY=your_google_maps_embed_api_key
```

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm start
```

Open `http://localhost:3000`. The frontend development server proxies `/api` requests to `http://localhost:5050`.

## Commands

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start Express with Nodemon on port `5050` by default. |
| `backend` | `npm start` | Start Express with Node. |
| `backend` | `npm test` | Run Jest and Supertest route tests. |
| `frontend` | `npm start` | Start the React development server on port `3000`. |
| `frontend` | `npm run build` | Produce a production frontend build. |
| `frontend` | `npm test` | Run the frontend Jest test suite. |

To collect coverage locally:

```bash
cd backend
npm test -- --coverage

cd ../frontend
CI=true npm test -- --watchAll=false --coverage
```

## Architecture

```text
Browser
  |
  +-- React Router
  |     +-- /                 ListingsPage
  |     |     +-- filters, sort controls, pagination, PropertyCard
  |     +-- /property/:id     PropertyDetailPage
  |           +-- gallery, facts, open houses, optional map
  |
  +-- frontend/src/api/client.js
          |
          v
Express API (port 5050)
  +-- app.js: CORS, JSON middleware, request logging, health check, 404 handler
  +-- routes/properties.js: validation, filtering, pagination, route handlers
          |
          v
MySQL connection pool
  +-- rets_property
  +-- rets_openhouse
```

The backend exports the Express app separately from the listening server. This keeps the process entry point in `backend/src/server.js` and lets Supertest exercise the API through `backend/src/app.js` without requiring a real database.

### Frontend

- `ListingsPage` fetches the first page on load, owns filter/sort/pagination state, and ignores superseded requests.
- `PropertyFilters` supports city, ZIP code, price range, beds, and baths. Empty fields are omitted before search.
- `Pagination` displays up to seven nearby page controls with ellipses for larger result sets.
- `PropertyCard` links to the selected listing when rendered under a router.
- `PropertyDetailPage` requests the property and its open houses concurrently, then renders available RETS fields with fallbacks for missing data.
- `PropertyImageCarousel` and `PropertyImageGallery` normalize photo arrays or JSON photo values and use a fallback photo when none is usable.

### Backend

- `backend/src/db.js` configures a MySQL promise pool with a five-second connection and query timeout.
- `backend/src/routes/properties.js` validates all accepted query parameters before issuing parameterized MySQL queries.
- List queries run a count query and a data query, then return pagination metadata with result rows.
- The optional index statement in `backend/sql/add_property_filter_indexes.sql` adds composite city/price/id and ZIP/price/id indexes. Review it against your existing schema before running it.

## API Reference

Base URL: `http://localhost:5050`

### `GET /api/health`

Checks that the backend can query MySQL.

Successful response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

If the database query fails, the endpoint responds with `500` and:

```json
{
  "status": "error",
  "database": "unreachable"
}
```

### `GET /api/properties`

Returns a filtered, sorted page of listings.

| Query parameter | Type | Rules |
| --- | --- | --- |
| `city` | string | Exact city match after trimming; cannot be empty. |
| `zipcode` | string | Exact ZIP match after trimming; cannot be empty. |
| `minPrice` | number | Must be zero or greater. |
| `maxPrice` | number | Must be zero or greater and not less than `minPrice`. |
| `beds` | integer | Minimum bedrooms; must be zero or greater. |
| `baths` | number | Minimum bathrooms; must be zero or greater. |
| `sortBy` | string | One of `L_SystemPrice`, `OnMarketDate`, `LM_Int2_3`, or `L_Keyword2`. |
| `sortOrder` | string | `asc` or `desc`; requires `sortBy`. |
| `limit` | integer | Page size from `1` to `100`; defaults to `20`. |
| `offset` | integer | Zero-based result offset; defaults to `0`. |

Example:

```text
GET /api/properties?city=Austin&minPrice=400000&beds=3&sortBy=L_SystemPrice&sortOrder=desc&limit=20&offset=0
```

Successful response:

```json
{
  "total": 42,
  "limit": 20,
  "offset": 0,
  "results": [
    {
      "id": 1,
      "listingId": "1001",
      "displayId": "ABC-1001",
      "address": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "zipcode": "78701",
      "price": 725000,
      "beds": 4,
      "baths": 3,
      "photos": "[...]",
      "photoCount": 12
    }
  ]
}
```

### `GET /api/properties/:id`

Returns the complete row from `rets_property` for a positive integer listing ID. The route matches `L_ListingID`, not the database row `id`.

```text
GET /api/properties/1001
```

The response is the property row as stored in MySQL, including any RETS-specific column names.

### `GET /api/properties/:id/openhouses`

Verifies that the property exists, then returns its open houses ordered by date and start time.

```text
GET /api/properties/1001/openhouses
```

Successful response:

```json
[
  {
    "id": 20,
    "listingId": "1001",
    "displayId": "ABC-1001",
    "openHouseDate": "2026-08-23",
    "startTime": "13:00:00",
    "endTime": "15:00:00",
    "startDate": "2026-08-23",
    "endDate": "2026-08-23",
    "allData": "{\"OH_Remarks\":\"Hosted by the listing agent\"}"
  }
]
```

### Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid path ID or query parameter. The response includes an `error` message. |
| `404` | Unknown API route or a requested property does not exist. |
| `500` | Unexpected query or server failure. |
| `503` | MySQL timeout, refused connection, or lost connection on a property route. |

All JSON errors use this shape:

```json
{
  "error": "Description of the problem"
}
```

## Testing

Backend route tests use Jest and Supertest with the MySQL pool mocked. They cover successful list/detail/open-house responses, validation failures, not-found responses, and database-unavailable failures.

Frontend tests cover the API client and UI state for listings, details, filters, pagination, cards, photos, maps, and error handling. Component tests use React DOM test utilities and router contexts where needed.

At the time this README was written, coverage reports show more than 70% line coverage for both targets:

| Target | Line coverage |
| --- | --- |
| Backend routes (`properties.js`) | 91.54% |
| Frontend components | 88.98% |

## Known Issues and Limitations

- Database schema creation, data ingestion, and seed data are outside this repository. A fresh MySQL instance will not work until the RETS tables and data are provided.
- The app is read-only. There are no authentication, authorization, saved-search, create, update, or delete workflows.
- CORS uses Express defaults, which allow cross-origin access. Restrict allowed origins before deploying publicly.
- The frontend proxy is development-only. A production deployment needs a reverse proxy or explicit API base URL and matching CORS policy.
- Property detail responses expose the full database row. A production API should use an explicit response schema to avoid unintentionally publishing internal RETS fields.
- Google Maps embedding requires a valid browser-visible `REACT_APP_GOOGLE_MAPS_EMBED_API_KEY`, appropriate API enablement, and API-key restrictions. Without it, the detail page shows a configuration message; listings without coordinates show an unavailable message.
- List filters use exact matches for city and ZIP code. There is no partial-text search, geospatial search, caching, or rate limiting.
- The property API applies fixed five-second database/query timeouts. Slow or unavailable databases produce a `503` for property endpoints, while the health endpoint returns `500`.
- `backend/.env` and `frontend/.env` are local configuration files. Do not commit credentials or unrestricted Google API keys.

## Repository Layout

```text
.
├── backend/
│   ├── sql/add_property_filter_indexes.sql
│   ├── src/app.js                 Express app and middleware
│   ├── src/server.js              Process entry point
│   ├── src/db.js                  MySQL pool and timeouts
│   └── src/routes/properties.js   Property and open-house API routes
├── frontend/
│   └── src/
│       ├── api/client.js          Fetch wrapper and API methods
│       ├── components/            Listing, detail, filter, card, and map UI
│       ├── utils/propertyPhotos.js
│       └── App.js                 Route definitions
└── README.md
```
