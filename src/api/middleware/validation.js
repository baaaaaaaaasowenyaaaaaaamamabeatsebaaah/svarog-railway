// src/api/middleware/validation.js

/**
 * Validates request parameters against a schema
 * @param {Object} schema - Validation schema
 * @param {string} location - Request location to validate (body, params, query)
 * @returns {Function} - Express middleware function
 */
export function validate(schema, location = 'body') {
  return (req, res, next) => {
    const data = req[location];

    if (!schema || typeof schema.validate !== 'function') {
      console.error('Invalid schema provided to validation middleware');
      return next();
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errorDetails,
      });
    }

    // Replace request data with validated data
    req[location] = value;
    next();
  };
}
