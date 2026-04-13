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

            memberCode: z.string({
                required_error: "Mã đoàn viên là bắt buộc",
            }).min(2, "Mã đoàn viên không hợp lệ"),

            dateOfBirth: z.string({
                required_error: "Ngày sinh là bắt buộc",
            }),

            email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
            phoneNumber: z.string().optional().or(z.literal('')),
        })
    }),

    lookupMemberCode: z.object({
        body: z.object({
            fullName: z.string({
                required_error: "Họ tên là bắt buộc",
            }),
            dateOfBirth: z.string({
                required_error: "Ngày sinh là bắt buộc",
            }),
            unionCellId: z.string().optional(),
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
