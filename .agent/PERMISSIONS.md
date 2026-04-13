# Hệ thống Phân quyền dự án (Auth & Permission System)

Dự án sử dụng kết hợp RBAC (Role-Based Access Control) và ABAC (Attribute-Based Access Control) để kiểm soát quyền hạn và phạm vi dữ liệu.

## 1. Kiểm soát quyền hạn (RBAC)
- **Cấu trúc**: `User` -> `Roles` -> `Permissions`.
- **Định dạng Permission**: `module:action` (ví dụ: `member:create`, `activity:approve`, `news:delete`).
- **Quy tắc kiểm tra**:
    - **Backend**: Sử dụng middleware hoặc gọi trực tiếp `hasPermission(user, 'code')` từ `permissionHelper.js`.
    - **Frontend/Mobile**: Sử dụng hook `useAuth` để gọi `hasPermission('code')` nhằm ẩn/hiện các thành phần giao diện.

## 2. Phân vùng dữ liệu (ABAC / Scoping)
Đây là phần quan trọng nhất để ngăn chặn rò rỉ dữ liệu giữa các đơn vị (Lớp/Khoa).

- **Các cấp độ (Levels)**:
    - `SCHOOL`: Toàn trường (Công khai).
    - `BRANCH`: Cấp Liên chi đoàn (Khoa).
    - `CELL`: Cấp Chi đoàn (Lớp).
- **Cơ chế lọc (getScopeFilter)**:
    - Mọi truy vấn danh sách (getAll) phải đi qua `getScopeFilter`.
    - **Admin**: Chỉ thấy dữ liệu trong đơn vị mình quản lý.
    - **Đoàn viên**: Thấy dữ liệu của Lớp mình **VÀ** Khoa mình **VÀ** Trường (sử dụng phép `Op.or`).
- **Bảo mật ghi (injectScope & enforceScope)**:
    - Khi tạo mới dữ liệu, `injectScope` tự động gán ID đơn vị của người dùng vào bản ghi để ngăn chặn ID Injection.
    - Khi cập nhật/xóa, `enforceScope` kiểm tra xem người dùng có thực sự thuộc đơn vị sở hữu bản ghi đó không.

## 3. Kiến trúc Mobile (Single Experience)
- Không tách biệt ứng dụng Admin và Member. 
- Mọi người dùng khởi đầu với giao diện Đoàn viên (User-first).
- Các tính năng quản trị ("Nghiệp vụ quản lý") chỉ xuất hiện nếu người dùng có các quyền quản trị như `approve`, `attendance`, `create`.
- Quyền `member:read` được coi là quyền cơ bản của mọi Đoàn viên (để xem thông tin nhau) và không kích hoạt các menu quản trị.

## 4. Tệp tin quan trọng
- `Backend/src/utils/permissionHelper.js`: Trái tim điều hướng logic phân quyền.
- `Mobile/src/contexts/AuthContext.js`: Cung cấp hàm kiểm tra quyền cho ứng dụng Mobile.
