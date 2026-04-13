import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// --- ICON MAPPING (Lucide -> Ionicons) ---
export const ICONS = {
    // Navigation & Layout
    Home: 'home',
    Layout: 'grid',
    Grid: 'grid-outline',
    Menu: 'menu',
    List: 'list-outline',

    // People & Users
    User: 'person',
    Users: 'people-outline',
    UserCircle: 'person-circle-outline',
    Shield: 'shield-checkmark-outline',
    BadgeCheck: 'checkmark-circle',

    // Communication
    Bell: 'notifications',
    BellOff: 'notifications-off-outline',
    Mail: 'mail-outline',
    Phone: 'call-outline',
    Send: 'send',
    MessageSquare: 'chatbubble-outline',

    // Files & Documents
    FileText: 'document-text-outline',
    File: 'document-outline',
    Folder: 'folder-outline',
    FolderPlus: 'folder-open-outline',
    Library: 'library-outline',
    Book: 'book-outline',
    BookOpen: 'book-outline',
    Newspaper: 'newspaper-outline',

    // Work & Business
    Briefcase: 'briefcase',
    Building: 'business-outline',
    Landmark: 'podium-outline',
    Database: 'server-outline',

    // Time & Calendar
    Calendar: 'calendar-outline',
    Clock: 'time-outline',
    History: 'time-outline',

    // Finance
    Wallet: 'wallet-outline',
    CreditCard: 'card-outline',

    // Education & Awards
    Award: 'ribbon-outline',
    GraduationCap: 'school-outline',
    School: 'school-outline',
    Trophy: 'trophy-outline',
    Star: 'star-outline',
    Layers: 'layers-outline',

    // Location & Map
    MapPin: 'location-outline',
    Compass: 'compass-outline',
    Earth: 'earth-outline',

    // Actions & Controls
    Settings: 'settings-outline',
    LogOut: 'log-out-outline',
    Camera: 'camera-outline',
    QrCode: 'qr-code-outline',
    Scan: 'scan-outline',
    Copy: 'copy-outline',
    RotateCw: 'refresh',
    Share: 'share-outline',
    Share2: 'share-social-outline',
    ChevronLeft: 'chevron-back',
    ChevronRight: 'chevron-forward',
    ChevronDown: 'chevron-down',
    ChevronUp: 'chevron-up',
    ArrowLeft: 'chevron-back',
    X: 'close',
    Lock: 'lock-closed-outline',
    ExternalLink: 'open-outline',

    // Status & Feedback
    CheckCircle: 'checkmark-circle-outline',
    AlertTriangle: 'alert-circle-outline',
    AlertCircle: 'alert-circle-outline',
    Info: 'information-circle-outline',
    Eye: 'eye-outline',
    WifiOff: 'wifi-outline',

    // Social
    Heart: 'heart-outline',
    HeartFilled: 'heart',

    // Media & Image
    Image: 'image-outline',

    // Demographics
    Male: 'male-outline',
    Female: 'female-outline',

    // Misc
    BarChart: 'bar-chart-outline',
};

export const Icon = ({ name, size = 24, color = '#000', style }) => (
    <Ionicons name={ICONS[name] || 'help-circle'} size={size} color={color} style={style} />
);

