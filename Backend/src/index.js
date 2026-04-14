const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, runMigrations } = require('./configs/db');
const userRoutes = require('./routes/userRoutes');
const models = require('./models'); // Load models and associations
const unionMemberRoutes = require('./routes/unionMemberRoutes');
const unionBranchRoutes = require('./routes/unionBranchRoutes');
const unionCellRoutes = require('./routes/unionCellRoutes');
const activityRoutes = require('./routes/activityRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const newsRoutes = require('./routes/newsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const feeRoutes = require('./routes/feeRoutes');
const feeTypeRoutes = require('./routes/feeTypeRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const landingRoutes = require('./routes/landingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const positionRoutes = require('./routes/positionRoutes');
const roleRoutes = require('./routes/roleRoutes');
const statisticRoutes = require('./routes/statisticRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Start Server Wrapper
const startServer = async () => {
  try {
    // 1. Kết nối và chạy Migrations (BẮT BUỘC)
    await connectDB();
    await runMigrations();
    console.log('✅ Database preparation complete.');

    // 2. Khởi tạo Background Workers
    require('./workers');

    // 3. Khởi động lắng nghe
    app.listen(PORT, () => {
      console.log(`🚀 Server starting on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(compression()); // Nén toàn bộ API response trước khi gửi đi để tiết kiệm 70% băng thông
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { RedisStore } = require('rate-limit-redis');
const redisClient = require('./configs/redis');

// Global Rate Limiting - Tối đa 500 requests / 15 phút trên mỗi IP (Dùng Redis store)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Quá nhiều request từ IP này, vui lòng thử lại sau!' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:global:',
  }),
});
app.use('/api', globalLimiter);

// Specific Rate Limiting for Login - Tối đa 10 requests / 15 phút (Dùng Redis store)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Thử đăng nhập sai quá nhiều lần, vui lòng chờ 15 phút!' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:login:',
  }),
  keyGenerator: (req) => req.user?.id || req.ip, // Ưu tiên ID nếu đã login, tránh bypass qua IP động
});
app.use('/api/users/login', loginLimiter);

// Health check (phục vụ load balancer / monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

// Serve static files (ảnh upload)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Welcome message
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AppDoanVien API - Layered Architecture Active' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/members', unionMemberRoutes);
app.use('/api/branches', unionBranchRoutes);
app.use('/api/cells', unionCellRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fee-types', feeTypeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/stats', statisticRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource Not Found' });
});

const errorHandler = require('./middlewares/errorMiddleware');

// Centralized Error handling
app.use(errorHandler);

// KÍCH HOẠT SERVER
startServer();
