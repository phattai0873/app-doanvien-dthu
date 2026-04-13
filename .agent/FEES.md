# Quản lý Đoàn phí và Tài chính (Fee Management & Finance)

Tài liệu này tóm tắt logic và quy trình quản lý đoàn phí trong hệ thống.

## 1. Cấu trúc dữ liệu
- **UnionFeeType**: Định nghĩa các loại phí (ví dụ: Đoàn phí, Quỹ hoạt động).
- **UnionFeePayment**: Lưu trữ lịch sử nộp phí của từng đoàn viên. Bao gồm số tiền, kỳ đóng (năm), ghi chú, minh chứng (ảnh bill) và **thời hạn (deadline)**.
- **PaymentTransaction**: Quản lý các giao dịch nộp phí qua Mobile (Chuyển khoản VietQR) hoặc nộp tiền mặt thủ công.
- **BankSetting**: Cấu hình thông tin tài khoản ngân hàng của Đoàn trường (MB, Vietinbank, v.v.) để tạo mã QR.

## 2. Quy trình nộp phí
- **Chuyển khoản (Mobile)**:
  1. Đoàn viên xem danh sách các khoản cần nộp (Unpaid).
  2. Hệ thống tạo mã VietQR tự động kèm nội dung chuyển khoản định dạng: `DP [MaDV] [Nam]`.
  3. Đoàn viên tải ảnh minh chứng (Bill) lên hệ thống.
  4. Giao dịch ở trạng thái `PENDING` (Chờ duyệt).
- **Nộp tiền mặt (Offline)**: Ban chấp hành có thể ghi nhận nộp tiền mặt trực tiếp cho cá nhân hoặc hàng loạt theo lớp (Chi đoàn) / khoa (Liên chi đoàn).

## 3. Logic "Chưa nộp phí" (Unpaid Members)
- Hệ thống xác định danh sách chưa nộp bằng cách lấy toàn bộ đoàn viên đang hoạt động (`status: 'approved'` & `activityStatus: 'active'`) trừ đi những người đã có bản ghi nộp phí (`UnionFeePayment`) cho loại phí và kỳ đóng tương ứng.

## 4. Thời hạn nộp (Deadline)
- Mỗi bản ghi nộp phí có trường `deadline`.
- Mặc định thời hạn là ngày 31/12 của kỳ đóng đó.
- Có thể tùy chỉnh thời hạn khi tạo bản ghi mới hoặc ghi nhận hàng loạt.
- Hệ thống Mobile sẽ cảnh báo `OVERDUE` nếu ngày hiện tại vượt quá thời hạn quy định.

## 5. Phân quyền và Bảo mật (Scoping)
- **SuperAdmin**: Xem và quản lý toàn bộ hệ thống.
- **Admin Khoa (Liên chi đoàn)**: Chỉ thấy và duyệt các giao dịch của đoàn viên thuộc khoa mình.
- **Admin Lớp (Chi đoàn)**: Chỉ thấy danh sách đoàn viên của lớp mình.
- **Đoàn viên**: Chỉ xem được thông tin tài chính cá nhân.

## 6. Thùng rác (Soft Delete)
- Các bản ghi đoàn phí hỗ trợ xóa mềm. Admin có thể khôi phục bản ghi bị xóa nhầm từ phần quản lý Thùng rác.
