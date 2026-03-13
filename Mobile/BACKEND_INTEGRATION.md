# HƯỚNG DẪN KẾT NỐI BACKEND (API INTEGRATION GUIDE)

> **Trạng thái hiện tại:** Frontend đang chạy chế độ **Mock Data** (Dữ liệu giả lập).
> **Mục tiêu:** Tài liệu này hướng dẫn Developer/AI tiếp theo cách chuyển đổi sang **Real API**.

## 1. Cấu hình Chuyển đổi (Switch)

File cấu hình chính nằm tại: `src/services/api.js`

Để kích hoạt gọi API thật, hãy sửa dòng code sau:

```javascript
// src/services/api.js

// Hiện tại:
export const USE_MOCK_API = true;

// Chuyển sang Real API:
export const USE_MOCK_API = false;
```

Kiểm tra `API_BASE_URL` để đảm bảo trỏ đúng IP của Backend (mặc định đang để localhost cho Android Emulator: `http://10.0.2.2:5000/api`).

## 2. Các điểm chờ API (Ready-to-use Services)

Tất cả logic gọi API đã được tách biệt trong thư mục `src/services/`. Các màn hình (Screens) **KHÔNG** gọi API trực tiếp mà gọi qua các Service này.

### Authentication (`src/services/authService.js`)
| Method Frontend | API Endpoint (.NET) | Ghi chú |
| :--- | :--- | :--- |
| `login(u, p)` | `POST /api/Auth/login` | |
| `register(data)` | `POST /api/Auth/register` | |
| `getCurrentUser()` | `GET /api/Auth/me` | Lấy info user từ Token |

### Đảng Viên & Tổ chức (`src/services/partyService.js`)
| Method Frontend | API Endpoint (.NET) | Ghi chú |
| :--- | :--- | :--- |
| `getMemberProfile()` | `GET /api/DangVien/profile` | Trả về Entity `DangVien` |
| `getOrgInfo()` | `GET /api/ChiBo/current` <br> `GET /api/DangBo/current` | Gọi song song 2 API |

### Tin tức & Thông báo (`src/services/newsService.js`, `notificationService.js`)
| Method Frontend | API Endpoint (.NET) | Ghi chú |
| :--- | :--- | :--- |
| `getCategories()` | `GET /api/News/categories` | (Giả định endpoint) |
| `getNews(catId)` | `GET /api/News?categoryId=...` | (Giả định endpoint) |
| `getNotifications()`| `GET /api/Notifications` | |

## 3. Kiến trúc Backend tương thích

Frontend được thiết kế để khớp với Backend **.NET Core (Clean Architecture/CQRS)**:
-   **Model:** JSON response được kỳ vọng khớp với các Entity trong `MOCK_DB` (`src/constants/mockData.js`).
-   **Auth:** Sử dụng Bearer Token (cần uncomment phần header trong `api.js` khi có token thật).

## 4. Việc cần làm cho người tiếp theo (Next Steps)

1.  **Chạy Backend:** Đảm bảo Backend .NET đang chạy và lắng nghe ở port 5000 (hoặc cập nhật lại `API_BASE_URL`).
2.  **Tắt Mock:** Set `USE_MOCK_API = false`.
3.  **Kiểm tra Auth:** Uncomment phần lấy Token từ `AsyncStorage` trong `api.js` (Interceptor).
4.  **Verify:** Chạy app và soi Log để xem request có đi thành công không.

---
*Created by AI Agent - 25/01/2026*
