# Ứng Dụng Đảng Bộ Trực Thuộc ĐTHU

Ứng dụng React Native được xây dựng bằng Expo.

## 📋 Yêu cầu hệ thống

- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn
- Expo Go app trên điện thoại (tải từ App Store hoặc Google Play)

## 🚀 Cách chạy ứng dụng

### 1. Cài đặt dependencies (nếu chưa cài)

```bash
npm install
```

### 2. Khởi động development server

```bash
npm start
```

Hoặc:

```bash
npx expo start
```

### 3. Chạy trên thiết bị

Sau khi chạy lệnh `npm start`, bạn sẽ thấy một QR code trên terminal.

#### Trên Android:
1. Mở ứng dụng **Expo Go** trên điện thoại
2. Nhấn **Scan QR code**
3. Quét QR code từ terminal

#### Trên iOS:
1. Mở ứng dụng **Camera** mặc định
2. Quét QR code từ terminal
3. Nhấn vào notification để mở trong Expo Go

### 4. Các lệnh khác

```bash
# Chạy trên Android emulator
npm run android

# Chạy trên iOS simulator (chỉ trên Mac)
npm run ios

# Chạy trên web browser
npm run web
```

## 📁 Cấu trúc dự án

```
frontend/
├── App.js                      # Component chính
├── app.json                    # Cấu hình Expo
├── package.json                # Dependencies
├── assets/                     # Hình ảnh, fonts, icons
└── src/
    ├── components/             # Các component tái sử dụng
    │   ├── Button.js
    │   ├── Loading.js
    │   └── index.js
    ├── screens/                # Các màn hình
    │   ├── HomeScreen.js
    │   └── index.js
    ├── navigation/             # Cấu hình navigation
    ├── services/               # API services
    │   ├── api.js
    │   ├── authService.js
    │   └── index.js
    ├── hooks/                  # Custom hooks
    │   ├── useFetch.js
    │   └── index.js
    ├── contexts/               # React contexts
    ├── utils/                  # Utility functions
    │   ├── helpers.js
    │   └── index.js
    ├── constants/              # Constants (colors, sizes, etc.)
    │   ├── colors.js
    │   ├── sizes.js
    │   └── index.js
    └── assets/                 # Assets trong src
```

## 🛠️ Công nghệ sử dụng

- **React Native**: 0.81.5
- **React**: 19.1.0
- **Expo**: ~54.0.31
- **Axios**: Để gọi API

## 📱 Tính năng

- ✅ Cấu trúc dự án chuẩn
- ✅ Component tái sử dụng (Button, Loading)
- ✅ API client với Axios
- ✅ Custom hooks
- ✅ Utility functions
- ✅ Constants quản lý màu sắc và kích thước

## 🔧 Cấu hình

### API Base URL

Cấu hình API base URL trong file `src/services/api.js`:

```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production
```

## 📝 Ghi chú

- Đảm bảo điện thoại và máy tính cùng mạng WiFi
- Nếu gặp lỗi, thử xóa cache: `npx expo start -c`
- Để reload app trên điện thoại, lắc điện thoại và chọn "Reload"

## 🐛 Troubleshooting

### Lỗi "Unable to resolve module"
```bash
npm install
npx expo start -c
```

### Lỗi kết nối
- Kiểm tra firewall
- Đảm bảo cùng mạng WiFi
- Thử kết nối qua tunnel: `npx expo start --tunnel`

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ team phát triển.
