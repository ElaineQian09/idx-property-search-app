require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const propertiesRouter = require("./routes/properties");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    return res.status(500).json({
      status: "error",
      database: "unreachable"
    });
  }
});

app.use("/api/properties", propertiesRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

module.exports = app;
