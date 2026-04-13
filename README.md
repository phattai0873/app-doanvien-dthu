# 🇻🇳 App Đoàn Viên - Hệ Thống Quản Lý Đoàn Viên Toàn Diện

![Chuyên nghiệp](https://img.shields.io/badge/Status-Enterprise--Level-brightgreen)
![Công nghệ](https://img.shields.io/badge/Stack-NodeJS--React--Expo-blue)
![Cấu trúc](https://img.shields.io/badge/Arch-Layered--Architecture-orange)
![Deploy](https://img.shields.io/badge/Deploy-Docker--Ready-blueviolet)

Hệ thống quản lý công tác Đoàn và phong trào thanh niên tích hợp đa nền tảng, được thiết kế cho mục tiêu chuyển đổi số quy trình quản lý hồ sơ, thi đua, và lệ phí Đoàn viên.

---

## 🚀 Tính năng nổi bật

### 🏢 Quản lý Tổ chức

* **Hệ thống phân cấp:** Quản lý Đoàn trường -> Đoàn khoa -> Chi đoàn lớp.
* **Hồ sơ Đoàn viên:** Số hóa 100% thông tin cá nhân, chức vụ, địa chỉ, số định danh (mã hóa bảo mật).
* **Vai trò & Quyền:** Phân quyền chi tiết (Permission-based) cho Super Admin, Admin Khoa, Admin Lớp.

### 📊 Thống kê & Báo cáo (BI Dashboard)

* **Dashboard Thông minh:** Thống kê số lượng đoàn viên, phân loại giới tính, dân tộc, chức vụ thời gian thực.
* **Bảng xếp hạng (Rankings):** Điểm thi đua của các đơn vị.

### 💰 Quản lý Đoàn phí

* Thu và theo dõi lệ phí Đoàn theo kỳ hoặc khóa học.
* Báo cáo thu nộp minh bạch cho từng cấp.

### 📰 Tin tức & Thi đua (Gamification)

* Đăng tin tức, banner, thông báo quan trọng.
* Hệ thống Quizz và thi cử trực tuyến cho đoàn viên (đang phát triển).

### 🛠️ Kỹ thuật Nâng cao (Enterprise Features)

* **Redis Caching:** Tăng tốc API stats/news gấp 5-10 lần, Key theo user-scope bảo mật.
* **BullMQ Processing:** Xử lý nhập liệu Excel hàng nghìn dòng trong nền (background).
* **Distributed Rate Limiting:** Bảo vệ hệ thống khỏi các cuộc tấn công spam.

---

## 🏗️ Kiến trúc Công nghệ

| Thành phần            | Công nghệ chính                                 |
| :---------------------- | :------------------------------------------------- |
| **Backend**       | Node.js (Express), Sequelize ORM, PostgreSQL       |
| **Caching/Queue** | **Redis**, ioredis, BullMQ, rate-limit-redis |
| **Frontend Web**  | React 19, Vite, TailwindCSS, TanStack Query        |
| **App Mobile**    | React Native (**Expo**), Lucide Icons        |
| **Deployment**    | **Docker**, Docker Compose, Nginx            |

---

## 📁 Cấu trúc Thư mục

```bash
Appdoanvien/
├── Backend/          # Source code NodeJS (API, Workers, Configs)
├── Frontend/         # Quản trị Web (React JS + Vite)
├── Mobile/           # Ứng dụng di động (Expo/React Native)
├── LangdingPage/     # Trang giới thiệu công chúng
└── docker-compose.yml # File điều phối triển khai toàn bộ hệ thống
```

---

## 🛠️ Hướng dẫn Cài đặt & Chạy (Development)

### 1. Yêu cầu hệ thống

* Node.js v20+
* PostgreSQL 15+
* Redis 6+ (Hoặc Docker)

### 2. Khởi động Backend

```bash
cd Backend
npm install
cp .env.example .env # Cấu hình DB và Redis URL
npm run dev
```

### 3. Khởi động Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 4. Khởi động Mobile

```bash
cd Mobile
npm install
npx expo start
```

---

## 🐳 Triển khai nhanh với Docker (Production Ready)

Đây là cách nhanh nhất để deploy toàn bộ hệ thống (gồm cả Database và Redis):

```bash
# Tại thư mục gốc của dự án
docker-compose up -d --build
```

Sau khi chạy thành công:

* **Frontend Quản trị:** http://localhost:80
* **Backend API:** http://localhost:5000
* **Postgres Port:** 5432
* **Redis Port:** 6379

---

## 🛡️ Bảo mật

* Dữ liệu nhạy cảm (Số định danh) được mã hóa AES-256-GCM.
* Mật khẩu băm (Hashing) bằng `bcryptjs`.
* Truy cập được bảo vệ bởi **JWT** (JSON Web Token) với cơ chế phân quyền theo scope địa phương (Branch/Cell).

---

*Phát triển bởi Nguyễn Huỳnh Phát Tài - 2026*
