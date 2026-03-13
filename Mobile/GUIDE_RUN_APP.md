# Hướng Dẫn Chạy Ứng Dụng (Đảng Bộ Trực Thuộc ĐTHU)

Tài liệu này hướng dẫn cách cài đặt và chạy ứng dụng React Native (Expo) trên môi trường development.

## 1. Yêu cầu Cài đặt (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

1.  **Node.js**: (Khuyên dùng bản LTS) - [Tải tại đây](https://nodejs.org/).
2.  **Git**: Để quản lý mã nguồn.
3.  **Expo Go (Trên điện thoại)**:
    *   **Android**: Tải từ CH Play.
    *   **iOS**: Tải từ App Store.

## 2. Cài đặt Thư viện (Installation)

Mở Terminal (Command Prompt hoặc PowerShell) tại thư mục gốc của dự án (`d:\frontend\frontend`) và chạy lệnh:

```bash
npm install
```

Lệnh này sẽ tải tất cả các thư viện cần thiết được liệt kê trong `package.json` vào thư mục `node_modules`.

## 3. Chạy Ứng dụng (Running)

Để khởi động máy chủ phát triển (Development Server), chạy lệnh:

```bash
npx expo start
```
*Hoặc:* `npm start`

Sau khi chạy, Terminal sẽ hiển thị một mã **QR Code**.

## 4. Xem trên Thiết bị (Testing)

### Cách 1: Chạy trên Điện thoại thật (Khuyên dùng)
1.  Đảm bảo Điện thoại và Máy tính đang kết nối **cùng một mạng Wi-Fi**.
2.  Mở ứng dụng **Expo Go** trên điện thoại.
3.  **Android**: Quét mã QR hiển thị trên Terminal.
4.  **iOS**: Mở ứng dụng Camera mặc định, quét mã QR và chọn mở trong Expo Go.

### Cách 2: Chạy trên Giả lập (Simulator/Emulator)
-   Nhấn phím `a` trong Terminal để mở Android Emulator (cần cài Android Studio).
-   Nhấn phím `i` trong Terminal để mở iOS Simulator (chỉ trên macOS + Xcode).
-   Nhấn phím `w` để mở phiên bản Web (giao diện có thể khác so với Mobile).

## 5. Các Lưu ý Quan trọng

### Chế độ Development hiện tại
-   **Login Bypass**: Ứng dụng đang được cấu hình để **bỏ qua màn hình đăng nhập** và vào thẳng `HomeScreen`.
    -   Để tắt chế độ này: Mở file `App.js` và sửa `const [isLoggedIn, setIsLoggedIn] = useState(true);` thành `false`.
-   **Mock Data**: Dữ liệu hiển thị trên `HomeScreen` hiện tại là dữ liệu giả (Hardcoded) trong file `src/screens/HomeScreen.js`.

### Lỗi thường gặp
-   **Network Error / Không kết nối được**:
    -   Kiểm tra lại Wi-Fi (Máy tính và ĐT phải cùng mạng).
    -   Tắt Tường lửa (Firewall) trên Window nếu bị chặn.
    -   Chạy `npx expo start --tunnel` nếu mạng không ổn định (chậm hơn).
-   **Metro Bundler lỗi**:
    -   Nhấn `r` trong Terminal để reload.
    -   Nếu vẫn lỗi, tắt Terminal và chạy `npx expo start -c` (xóa cache).
