const path = require("path");
const router = require("express").Router();
const authRoutes = require("./auth");
const scrapeRoutes = require("./scrape");
const dataRoutes = require("./data");
const apiRoutes = require("./api");

// API Routes
router.use("/auth", authRoutes);
router.use("/scrape", scrapeRoutes);
router.use("/data", dataRoutes);
router.use("/api", apiRoutes);

// Use the react app if no api routes are hit
router.use(function (req, res) {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

module.exports = router;