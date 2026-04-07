/**
 * Middleware để validate request bằng Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: (error.errors && Array.isArray(error.errors)) ? error.errors.map(err => ({
                field: err.path.slice(1).join('.'),
                message: err.message
            })) : []
        });
    }
};

module.exports = validate;