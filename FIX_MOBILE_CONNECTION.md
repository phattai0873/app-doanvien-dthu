# Hướng Dẫn Sửa Lỗi Kết Nối Mobile App (React Native / Expo)

Tài liệu này tổng hợp các bước quan trọng đã thực hiện để khắc phục lỗi `Network Error` và giúp App Mobile kết nối thành công với Backend.

---

## 1. Cấu hình IP cho Mobile (Quan trọng nhất)
Điện thoại (Expo Go) không thể hiểu `localhost`. Bạn phải dùng địa chỉ IP LAN của máy tính.

- **File cần sửa**: `Mobile/src/services/api.js`
- **Cách làm**: Thay đổi biến `DEV_HOST` thành IP hiện tại của máy tính (kiểm tra bằng lệnh `ipconfig`).
  ```javascript
  const DEV_HOST = '192.168.1.3'; // Ví dụ IP máy tính của bạn
  export const API_BASE_URL = `http://${DEV_HOST}:5000`;
  ```

---

## 2. Cho phép Backend truy cập qua LAN
Mặc định Node.js chỉ lắng nghe kết nối từ chính nó. Cần mở ra cho cả mạng nội bộ.

- **File cần sửa**: `Backend/src/index.js`
- **Cách làm**: Thêm tham số `'0.0.0.0'` vào hàm `listen`.
  ```javascript
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server starting on port ${PORT} (LAN accessible)`);
  });
  ```

---

## 3. Lỗi nén dữ liệu (Gzip Compression)
React Native Android gặp lỗi khi giải nén dữ liệu Gzip dạng chunked từ Express, dẫn đến lỗi `Network Error` dù Backend vẫn xử lý xong.

- **File cần sửa**: `Backend/src/index.js`
- **Cách làm**: Tạm thời tắt (comment) dòng sử dụng `compression`.
  ```javascript
  // app.use(compression()); // Tắt để tránh lỗi Network Error trên Mobile
  ```

---

## 4. Tường lửa Windows (Firewall)
Windows Defender thường chặn các kết nối lạ từ thiết bị ngoại vi vào cổng `:5000`.

- **Cách sửa**: 
  1. Mở `Windows Defender Firewall`.
  2. Chọn `Turn Windows Defender Firewall on or off`.
  3. Chọn **Turn off** cho cả Private và Public network (hoặc tạo Rule cho phép cổng 5000).

---

## 5. Sửa lỗi Code & Thư viện
- **Import đúng cách**: Đảm bảo sử dụng `import apiClient from './api'` thay vì `{ apiClient }`.
- **Bọc dữ liệu an toàn**: Trong các file `/services/`, luôn sử dụng fallback để tránh crash app khi dữ liệu rỗng:
  ```javascript
  return response.data || response || {}; // Đảm bảo luôn trả về Object hoặc Mảng
  ```
- **Thời gian Token**: Tăng `JWT_EXPIRE=24h` trong file `.env` để tránh bị văng ra màn hình đăng nhập sau mỗi 15 phút.

---

## 6. Cách chạy tối ưu cho Mobile
Khi khởi động Expo, hãy sử dụng cờ `--tunnel` nếu mạng Wi-Fi không ổn định hoặc Firewall quá khó cấu hình:
```bash
npx expo start --tunnel
```
Sau đó dùng điện thoại quét mã QR và nhấn **Reload** (phím `r`) để nhận cấu hình mới nhất.
