const { Expo } = require('expo-server-sdk');

// Khởi tạo Expo SDK
let expo = new Expo();

const pushService = {
    /**
     * Gửi thông báo Push tới một hoặc nhiều Token
     * @param {string|string[]} tokens - Expo Push Token (hoặc mảng các Token)
     * @param {object} message - Nội dung thông báo { title, body, data }
     */
    sendPushNotification: async (tokens, { title, body, data = {} }) => {
        const recipients = Array.isArray(tokens) ? tokens : [tokens];
        const pushMessages = [];

        for (let pushToken of recipients) {
            // Kiểm tra Token hợp lệ của Expo
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`[PushService] Token không hợp lệ: ${pushToken}`);
                continue;
            }

            pushMessages.push({
                to: pushToken,
                sound: 'default',
                title: title,
                body: body,
                data: data,
            });
        }

        // Chia nhỏ tin nhắn nếu quá nhiều (Expo giới hạn mỗi lần gửi)
        let chunks = expo.chunkPushNotifications(pushMessages);
        let tickets = [];
        
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('[PushService] Gửi thành công một nhóm thông báo');
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('[PushService] Lỗi khi gửi thông báo tới Expo:', error);
            }
        }
        
        return tickets;
    }
};

module.exports = pushService;
