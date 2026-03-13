/**
 * Wrapper for async routes to catch errors and pass them to next middleware
 * Eliminates the need for try-catch blocks in controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
