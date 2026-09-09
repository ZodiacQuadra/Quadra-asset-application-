// Vercel Serverless Function entrypoint
// Runs Express with zero-database in-memory catalog
const app = require("../backend/server.js");

module.exports = app;
