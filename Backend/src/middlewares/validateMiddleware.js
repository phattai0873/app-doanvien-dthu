/**
 * Middleware để validate request bằng Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
    try {
        console.log(`[Validation-Debug] Route: ${req.originalUrl}, Body:`, JSON.stringify(req.body));
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        let errorMessage = 'Dữ liệu không hợp lệ';
        let validationErrors = [];
        
        if (error instanceof require('zod').ZodError) {
            validationErrors = (error.errors && Array.isArray(error.errors)) ? error.errors.map(err => ({
                field: err.path[err.path.length - 1],
                message: err.message
            })) : [];
            
            if (validationErrors.length > 0) {
                errorMessage = validationErrors[0].message; // Lấy lỗi đầu tiên làm message chính
            }
        }

        return res.status(400).json({
            success: false,
            message: errorMessage,
            errors: validationErrors
        });
    }
};

module.exports = validate;