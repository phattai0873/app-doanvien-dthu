import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Cấu hình cách thông báo hiển thị khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Quyền thông báo bị từ chối!');
      return null;
    }

    try {
        // SDK 53+ Check: Expo Go no longer supports remote notifications on Android
        if (Constants.appOwnership === 'expo') {
            console.log('[PushHelper] Đang chạy trong Expo Go. Push Notifications (Remote) không được hỗ trợ trên Android từ SDK 53.');
            console.log('[PushHelper] Vui lòng sử dụng Development Build để dùng tính năng này.');
            return null;
        }

        // Lấy Token từ Expo.projectId được cấu hình trong app.json/Constants
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) {
            console.log('[PushHelper] Thiếu projectId trong app.json. Không thể lấy Push Token.');
            return null;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[PushHelper] Expo Push Token:', token);
    } catch (e) {
        console.log('[PushHelper] Lỗi lấy token:', e);
    }
  } else {
    console.log('Phải dùng thiết bị thật để chạy Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};
