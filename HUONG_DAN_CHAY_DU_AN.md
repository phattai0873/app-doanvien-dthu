# Hướng Dẫn Cài Đặt và Chạy Dự Án App Đoàn Viên DTHU

Dự án này bao gồm 4 phần chính:
1. **Backend** (Node.js, Express, PostgreSQL, Redis)
2. **Frontend** (React, Vite, Web quản trị)
3. **LangdingPage** (React, Vite, Trang giới thiệu)
4. **Mobile** (React Native, Expo, App di động)

Dưới đây là hướng dẫn cài đặt và chạy từng phần. Hãy đảm bảo bạn đã cài đặt **Node.js**, **Git**, **PostgreSQL** và **Redis** trên máy.

---

## 1. Backend (API Server)
Thư mục: `/Backend`

**Cài đặt:**
1. Mở terminal, di chuyển vào thư mục `/Backend`:
   ```bash
   cd Backend
   npm install
   ```
2. Cấu hình biến môi trường (`.env`):
   - Tạo file `.env` từ `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` và cập nhật thông tin database `DB_NAME`, `DB_USER`, `DB_PASSWORD` tương ứng với PostgreSQL của bạn.
   - (*Yêu cầu PostgreSQL và Redis đang chạy trên máy*)

**Chạy Backend:**
```bash
npm run dev
# Server sẽ chạy tại http://localhost:5000
```
*(Lưu ý: Nếu cần dữ liệu mẫu, có thể chạy `npm run seed` sau khi DB đã được config).*

---

## 2. Frontend (Web Quản Trị)
Thư mục: `/Frontend`

**Cài đặt:**
1. Mở terminal, di chuyển vào thư mục `/Frontend`:
   ```bash
   cd Frontend
   npm install
   ```
2. Cấu hình biến môi trường (`.env`):
   - Mặc định `.env.example` có `VITE_API_BASE_URL=http://localhost:5000/api`. Hãy đảm bảo file `.env` của bạn có đường dẫn API chuẩn xác chỉ tới Backend đang chạy.

**Chạy Frontend:**
```bash
npm run dev
# Ứng dụng sẽ chạy tại http://localhost:5173 (hoặc port do Vite cấp)
```

---

## 3. Langding Page
Thư mục: `/LangdingPage`

**Cài đặt:**
1. Mở terminal, di chuyển vào thư mục `/LangdingPage`:
   ```bash
   cd LangdingPage
   npm install
   ```

**Chạy Langding Page:**
```bash
npm run dev
# Ứng dụng sẽ chạy tại một port localhost do Vite cấp.
```

---

## 4. Mobile (App React Native / Expo)
Thư mục: `/Mobile`

**Cài đặt:**
1. Mở terminal, di chuyển vào thư mục `/Mobile`:
   ```bash
   cd Mobile
   npm install
   ```

**Chạy Mobile App:**
```bash
npx expo start
# Hoặc: npm start
```
- Khi terminal hiện mã QR, hãy dùng ứng dụng **Expo Go** (trên điện thoại Android/iOS) để quét.
- Đảm bảo điện thoại và máy tính kết nối cùng chung một mạng Wi-Fi.

*(Lưu ý: Bạn có thể tham khảo file `GUIDE_RUN_APP.md` bên trong thư mục `/Mobile` để xem thêm chi tiết về cách chạy giả lập hoặc gỡ lỗi ở phần ứng dụng di động).*
