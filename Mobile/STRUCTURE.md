# Cấu trúc Dự án - App Đảng Bộ Trực Thuộc ĐTHU

## 📁 Tổng quan cấu trúc

```
frontend/
├── App.js                      # Entry point chính
├── app.json                    # Cấu hình Expo
├── package.json                # Dependencies
├── README.md                   # Hướng dẫn sử dụng
├── assets/                     # Assets gốc (icon, splash)
└── src/                        # Source code chính
    ├── components/             # Các component tái sử dụng
    ├── screens/                # Các màn hình
    ├── navigation/             # Cấu hình navigation
    ├── services/               # API services
    ├── hooks/                  # Custom hooks
    ├── contexts/               # React contexts
    ├── utils/                  # Utility functions
    ├── constants/              # Constants
    └── assets/                 # Assets trong src
```

## 📦 Components

### Đã tạo:
- **Button** - Button tùy chỉnh với nhiều variants (primary, secondary, outline)
- **Loading** - Component loading với fullscreen option
- **Card** - Card hiển thị tin tức
- **TabBar** - Tab navigation với indicator
- **Banner** - Carousel slider cho hình ảnh

### Cách sử dụng:

```javascript
import { Button, Loading, Card, TabBar, Banner } from '../components';

// Button
<Button 
  title="Đăng nhập" 
  onPress={handleLogin}
  variant="primary"
  loading={isLoading}
/>

// Card
<Card
  image="https://..."
  title="Tiêu đề"
  description="Mô tả"
  likes={291}
  date="19:27 - 12/12/2025"
  onPress={() => {}}
/>

// TabBar
<TabBar 
  tabs={['Tab 1', 'Tab 2']} 
  activeTab={0} 
  onTabPress={(index) => {}} 
/>

// Banner
<Banner images={['url1', 'url2']} />
```

## 🎨 Constants

### Colors (`src/constants/colors.js`)
```javascript
import { COLORS } from '../constants';

// Sử dụng
backgroundColor: COLORS.primary
color: COLORS.white
```

### Sizes (`src/constants/sizes.js`)
```javascript
import { SIZES } from '../constants';

// Sử dụng
padding: SIZES.md
fontSize: SIZES.fontLg
borderRadius: SIZES.radiusMd
```

### Icons (`src/constants/icons.js`)
```javascript
import { ICONS } from '../constants';
import { Ionicons } from '@expo/vector-icons';

// Sử dụng
<Ionicons name={ICONS.search} size={24} color={COLORS.white} />
```

## 🔧 Services

### API Client (`src/services/api.js`)
Axios instance với interceptors cho request/response.

```javascript
import { apiClient } from '../services';

// Sử dụng
const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { data });
```

### Auth Service (`src/services/authService.js`)
```javascript
import { authService } from '../services';

// Đăng nhập
const user = await authService.login(username, password);

// Đăng ký
await authService.register(userData);

// Lấy thông tin user
const currentUser = await authService.getCurrentUser();
```

## 🪝 Custom Hooks

### useFetch (`src/hooks/useFetch.js`)
```javascript
import { useFetch } from '../hooks';

const { data, loading, error, refetch } = useFetch(
  () => apiClient.get('/news'),
  []
);

// Sử dụng
if (loading) return <Loading />;
if (error) return <Text>Error: {error.message}</Text>;
return <Text>{data.title}</Text>;
```

## 🛠️ Utils

### Helpers (`src/utils/helpers.js`)
```javascript
import { formatDate, validateEmail, validatePhone, truncateText, formatCurrency } from '../utils';

// Format ngày
const formatted = formatDate(new Date(), 'DD/MM/YYYY');

// Validate email
const isValid = validateEmail('test@example.com');

// Validate số điện thoại VN
const isValidPhone = validatePhone('0912345678');

// Truncate text
const short = truncateText('Long text...', 50);

// Format tiền tệ
const price = formatCurrency(1000000, 'VND');
```

## 📱 Screens

### HomeScreen (`src/screens/HomeScreen.js`)
Màn hình chính với:
- Header (search, notifications)
- Tab navigation
- Banner carousel
- News list
- Bottom navigation

## 🎯 Best Practices

### 1. Import Order
```javascript
// React imports
import React, { useState } from 'react';

// React Native imports
import { View, Text, StyleSheet } from 'react-native';

// Third-party imports
import { Ionicons } from '@expo/vector-icons';

// Local imports
import { COLORS, SIZES, ICONS } from '../constants';
import { Button, Card } from '../components';
```

### 2. Component Structure
```javascript
/**
 * Component description
 * @param {type} propName - Description
 */
const ComponentName = ({ propName }) => {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Handler logic
  };

  // Render
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    // Styles
  },
});

export default ComponentName;
```

### 3. Styling
- Sử dụng constants cho colors, sizes
- Tạo reusable styles
- Sử dụng StyleSheet.create()
- Đặt tên styles rõ ràng

### 4. Icons
- Sử dụng Ionicons từ @expo/vector-icons
- Tham khảo: https://icons.expo.fyi/
- Sử dụng outline variants cho inactive state
- Sử dụng filled variants cho active state

## 📚 Tài liệu tham khảo

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Ionicons](https://icons.expo.fyi/)
- [React Navigation](https://reactnavigation.org/)
