const { body, validationResult } = require("express-validator");

// Sanitize user inputs using express-validator's sanitize methods
const sanitizeMiddleware = [
  // Sanitize body inputs
  body("*").trim().escape(),

  // Check for validation errors and respond with an error message if any
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = sanitizeMiddleware;
