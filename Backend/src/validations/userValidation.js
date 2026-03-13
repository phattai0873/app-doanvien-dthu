const { z } = require('zod');

const userValidation = {
    register: z.object({
        body: z.object({
            username: z.string({
                required_error: "Tên đăng nhập là bắt buộc",
            }).min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),

            password: z.string({
                required_error: "Mật khẩu là bắt buộc",
            }).min(6, "Mật khẩu phải có ít nhất 6 ký tự"),

            // Các trường bổ sung nếu có từ Database.md
            fullName: z.string().optional(),
            email: z.string().email("Email không hợp lệ").optional(),
        })
    }),

    login: z.object({
        body: z.object({
            username: z.string({
                required_error: "Tên đăng nhập là bắt buộc",
            }),
            password: z.string({
                required_error: "Mật khẩu là bắt buộc",
            }),
        })
    })
};

module.exports = userValidation;
