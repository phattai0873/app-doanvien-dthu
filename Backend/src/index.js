const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./configs/db');
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
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const landingRoutes = require('./routes/landingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const positionRoutes = require('./routes/positionRoutes');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/positions', positionRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource Not Found' });
});

const errorHandler = require('./middlewares/errorMiddleware');

// Centralized Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server starting on port ${PORT}`);
});
