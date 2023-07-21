const rateLimit = require("express-rate-limit");

// Define the rate-limiting options
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes - the time interval for rate-limiting
  max: 100, // Max number of requests from a single IP within the windowMs
  message: "Too many requests from this IP, please try again later.",
});

module.exports = limiter;
