const app = require("./app");

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT);

server.on("error", (error) => {
  console.error("Server failed to start:", error);
});

// Some local Node setups in this project exit immediately after listen().
// Keeping stdin resumed prevents the dev server from shutting down right away.
process.stdin.resume();
