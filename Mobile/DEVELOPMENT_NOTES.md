# Nhật ký Phát triển & Các vấn đề tồn tại

## 🛠 Thay đổi Giao diện (UI Updates)
- **Trang Công tác Đoàn**:
    - Đã loại bỏ nút **Đoàn phí** (Chưa phát triển).
    - Đã loại bỏ nút **Sinh hoạt Chi đoàn** (Họp hội) theo yêu cầu người dùng.
    - Hiện đang tập trung vào: **Hoạt động tình nguyện**, **Thi đua & Trắc nghiệm**, **Kho Tài liệu**.

## ⚠️ Các vấn đề cần xử lý (Pending Issues)
1. **Trang Sinh hoạt Chi đoàn**: Còn gặp lỗi hiển thị hoặc logic (Cần rà soát lại Meeting List). Hiện tại nút đã được ẩn khỏi menu "Công tác Đoàn".
2. **Cập nhật Hồ sơ (Profile Update)**: 
    - Đã có API backend (`PUT /api/members/:id`) nhưng chưa được kết nối hoàn thiện với giao diện Mobile.
    - Trang `EditProfileScreen` hiện tại là giao diện tĩnh.
3. **Đồng bộ Thông tin Profile**:
    - **Đã xử lý**: Map thành công dữ liệu từ `/api/users/me` sang các trường `ho_ten`, `chuc_vu_doan`, ... trong `partyService.js`.

## ✅ Các lỗi đã sửa (Recent Fixes)
- Sửa lỗi "Phiên đăng nhập đã hết hạn" (JWT lifetime 24h).
- Sửa lỗi văng ứng dụng (Data unwrapping) ở trang Hoạt động và Sinh hoạt.
- Sửa lỗi điều hướng nút "Hoạt động tình nguyện".
- Cập nhật Seed data để Hoạt động hiển thị đúng (Status: APPROVED).
