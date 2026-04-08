# Quy tắc của Hệ thống (System Rules)

Các quy tắc dưới đây phải được tuân thủ nghiêm ngặt trong quá trình phát triển dự án để đảm bảo tính nhất quán và bảo mật.

## 1. Định dạng dữ liệu (Data Formatting)
- **Ngày tháng (Dates)**: Luôn sử dụng định dạng `dd/MM/yyyy` khi hiển thị trên giao diện người dùng.
- **Số lượng (Numbers)**: Đối với các số lớn như lượt xem bài viết, hãy định dạng rút gọn (ví dụ: `1.000` -> `1k`, `1.000.000` -> `1tr`).

## 2. Bảo mật và Phân quyền (Security & RBAC)
- **Entity Identification**: Mọi hành động quản trị phải được gán với tổ chức (Organizational Unit) của người dùng đó.
- **Strict Scoping**: Tuyệt đối không để xảy ra tình trạng rò rỉ dữ liệu giữa các đơn vị. Kiểm tra scope của thực thể trước khi thực hiện các thao tác thêm, xóa, sửa.
- **Permission Helper**: Sử dụng `permissionHelper.js` để kiểm tra quyền truy cập một cách tập trung. Xem chi tiết tại [PERMISSIONS.md](./PERMISSIONS.md).

## 3. Quản lý dữ liệu (Data Management)
- **Xóa mềm (Soft Delete)**: Tất cả các module chính (Đoàn viên, Hoạt động, Tin tức...) phải hỗ trợ xóa mềm thay vì xóa vĩnh viễn ngay lập tức. Cung cấp chức năng Khôi phục (Restore) và Xóa vĩnh viễn (Force Delete) trong phần quản lý Thùng rác (Trash Management).

## 4. Kiểm soát lỗi (Error Handling)
- Sử dụng **Zod** để xác thực (validate) dữ liệu đầu vào tại Backend.
- Luôn trả về phản hồi mã lỗi HTTP phù hợp và thông báo dễ hiểu cho người dùng.
- Tránh các lỗi ID injection bằng cách kiểm tra quyền sở hữu đối với entity tương ứng.
