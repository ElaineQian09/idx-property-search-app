const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 5000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const QUERY_TIMEOUT_MS = 5000;
const originalQuery = pool.query.bind(pool);

pool.query = (sql, values) => {
  if (typeof sql === "string") {
    return originalQuery({ sql, timeout: QUERY_TIMEOUT_MS }, values);
  }

  return originalQuery(
    {
      timeout: QUERY_TIMEOUT_MS,
      ...sql
    },
    values
  );
};

module.exports = pool;
