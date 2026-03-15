import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// --- ICON MAPPING (Lucide -> Ionicons) ---
export const ICONS = {
    Home: 'home',
    Briefcase: 'briefcase',
    Bell: 'notifications',
    User: 'person',
    ChevronLeft: 'chevron-back',
    ArrowLeft: 'chevron-back',
    Settings: 'settings-outline',
    Database: 'server-outline',
    Calendar: 'calendar-outline',
    Clock: 'time-outline',
    Wallet: 'wallet-outline',
    Users: 'people-outline',
    Award: 'ribbon-outline',
    BookOpen: 'book-outline',
    GraduationCap: 'school-outline',
    Library: 'library-outline',
    LogOut: 'log-out-outline',
    QrCode: 'qr-code-outline',
    History: 'time-outline',
    Info: 'information-circle-outline',
    AlertTriangle: 'alert-circle-outline',
    CheckCircle: 'checkmark-circle-outline',
    ChevronRight: 'chevron-forward',
    Camera: 'camera-outline',
    Shield: 'shield-checkmark-outline',
    FileText: 'document-text-outline',
    Mail: 'mail-outline',
    Phone: 'call-outline',
    MapPin: 'location-outline',
    BadgeCheck: 'checkmark-circle',
    Building: 'business-outline',
    Landmark: 'podium-outline',
    Menu: 'menu',
    Book: 'book-outline',
    CreditCard: 'card-outline',
    Heart: 'heart-outline',
    Grid: 'grid-outline',
    List: 'list-outline',
    RotateCw: 'refresh',
    X: 'close',
    Scan: 'scan-outline',
    Copy: 'copy-outline',
    Newspaper: 'newspaper-outline'
};

export const Icon = ({ name, size = 24, color = '#000', style }) => (
    <Ionicons name={ICONS[name] || 'help-circle'} size={size} color={color} style={style} />
);
