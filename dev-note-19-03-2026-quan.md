# Nhật ký phát triển (Dev Notes) - 19/03/2026
**Người thực hiện: Quân**

Hôm nay đã hoàn thành một khối lượng lớn công việc để đưa tính năng "Đoàn phí" vào hoạt động thực tế và tinh chỉnh hệ thống thông báo, kết nối.

## 1. Tính năng Đoàn phí (Union Fee) - Hoàn thiện 100%
Đây là tính năng trọng tâm, cho phép quy trình đóng phí khép kín từ lúc nộp bằng chứng đến lúc duyệt.

### Backend:
- **Model**: Cập nhật `UnionFeePayment` thêm trường `status` (pending, paid, rejected) và `evidenceImage`.
- **Upload**: Cấu hình `multer` và middleware `uploadFeeEvidence` để lưu ảnh bằng chứng vào `/uploads/fees`.
- **API**: 
    - `POST /api/fees`: Hỗ trợ upload ảnh bằng chứng.
    - `PATCH /api/fees/:id/status`: Cho phép Admin duyệt hoặc từ chối kèm ghi chú.
- **Dữ liệu**: Fix lỗi `UUID invalid syntax` bằng cách tự động lấy ID đoàn viên từ Token nếu App không gửi lên.

### Admin Frontend:
- **Trang Quản lý Đoàn phí**: Giao diện bảng danh sách, xem trước ảnh bằng chứng (lightbox), nút Duyệt/Từ chối nhanh.
- **Sidebar**: Thêm mục "Đoàn phí" vào menu chính.

### Mobile App:
- **Giao diện đóng phí**: 
    - Thêm Modal quét mã QR giả lập và thông tin chuyển khoản.
    - Tích hợp `expo-image-picker` để chọn ảnh bằng chứng thực tế từ thư viện.
    - **Fix thiết kế**: Thêm nút "Nộp bằng chứng mới" ngay cả khi không có nợ phí (0 tháng) để người dùng chủ động gửi ảnh.
- **Lịch sử**: Hiển thị danh sách các lần nộp kèm trạng thái (Chờ duyệt/Đã duyệt) và ảnh bằng chứng.

## 2. Hệ thống Thông báo (Notification System) - Sửa lỗi & Nâng cấp
- **Admin UI Fix**: Sửa lỗi logic khiến thông báo vừa tạo (Bản nháp) bị ẩn đi. Giờ đây Admin có thể thấy rõ quy trình: *Tạo nháp -> Gửi tin (biểu tượng máy bay)*.
- **Push Notification (Tạm dừng)**: 
    - Đã cài đặt xong `expo-notifications` và `expo-server-sdk`.
    - Đã có code tự động đẩy tin khi Admin nhấn "Gửi".
    - **Lưu ý**: Tạm thời khóa tính năng này trên App để tránh crash khi chạy Android trên `Expo Go` (do giới hạn của SDK 53+). Sẽ mở lại khi dự án dùng `Development Build`.

## 3. Cấu hình & Kết nối Mobile
- **IP Host**: Cập nhật `API_BASE_URL` trong `api.js` về IP nội bộ (`192.168.1.3`) để điện thoại thật có thể kết nối trực tiếp tới Backend trên máy tính.
- **Dependencies**: Cài đặt thêm các gói cần thiết: `expo-image-picker`, `expo-notifications`, `expo-device`, `expo-server-sdk`.

---
*Ghi chú: Các tính năng đã được kiểm tra tính nhất quán giữa Mobile và Web Admin.*
