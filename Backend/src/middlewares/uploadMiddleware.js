const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Đảm bảo thư mục uploads tồn tại
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Storage cho ảnh banner tin tức
const newsBannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/news/banners');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `banner_${uuidv4()}${ext}`);
    }
});

// Storage dùng chung cho upload ảnh
const generalImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/images');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `img_${uuidv4()}${ext}`);
    }
});

// Storage cho ảnh Banner Trang chủ
const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/banners');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `banner_main_${uuidv4()}${ext}`);
    }
});

// Storage cho ảnh Avatar User
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/avatars');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${uuidv4()}${ext}`);
    }
});

// Storage cho ảnh thumbnail của bài thi
const quizThumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/quiz/thumbnails');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `quiz_thumb_${uuidv4()}${ext}`);
    }
});

// Storage cho Văn bản (PDF, Word, Excel, ...)
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/documents');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `doc_${uuidv4()}${ext}`);
    }
});

// Storage cho ảnh minh chứng đóng phí (Bill)
const feeEvidenceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/fees');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `fee_${uuidv4()}${ext}`);
    }
});

// Bộ lọc file - chỉ nhận ảnh
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
};

// Bộ lọc file - cho phép văn bản
const documentFileFilter = (req, file, cb) => {
    const allowedExtensions = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|jpg|jpeg|png|webp/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file văn bản và hình ảnh (pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, txt, jpg, jpeg, png, webp)'));
    }
};

// Middleware upload
const uploadNewsBanner = multer({
    storage: newsBannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('banner');

const uploadEditorImage = multer({
    storage: generalImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('image');

const uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('image');

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('avatar');

const uploadQuizThumbnail = multer({
    storage: quizThumbnailStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter
}).single('thumbnail');

const uploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Tăng lên 20MB cho văn bản
    fileFilter: documentFileFilter
}).single('file');

const uploadFeeEvidence = multer({
    storage: feeEvidenceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: documentFileFilter
}).single('evidence');


// Middleware wrapper để bắt lỗi multer
const handleUpload = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File quá lớn. Tối đa 5MB.' });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

module.exports = {
    uploadNewsBanner: handleUpload(uploadNewsBanner),
    uploadEditorImage: handleUpload(uploadEditorImage),
    uploadBanner: handleUpload(uploadBanner),
    uploadAvatar: handleUpload(uploadAvatar),
    uploadQuizThumbnail: handleUpload(uploadQuizThumbnail),
    uploadDocument: handleUpload(uploadDocument),
    uploadFeeEvidence: handleUpload(uploadFeeEvidence)
};
