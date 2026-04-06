import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image as RNImage,
    StatusBar,
    SafeAreaView,
    Dimensions,
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { API_BASE_URL } from '../services/api';
import Banner from '../components/Banner';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { financeService } from '../services/financeService';
import { partyService } from '../services/partyService';

const ICON_SET = {
    tintuc: require('../../assets/iconset/tintuc.png'),
    hoctap: require('../../assets/iconset/hoctap.png'),
    sinhhoat: require('../../assets/iconset/sinhhoat.png'),
    doanphi: require('../../assets/iconset/doanphi.png'),
    thidua: require('../../assets/iconset/thidua.png'),
    vanban: require('../../assets/iconset/vanban.png'),
    tinhnguyen: require('../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../assets/iconset/canhan.png'),
};

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
// Đã xóa Mock Data (DB object) để sử dụng API thật

// --- ICON MAPPING (Lucide -> Ionicons) ---
const ICONS = {
    Home: 'home',
    Briefcase: 'briefcase',
    Bell: 'notifications',
    User: 'person',
    ChevronLeft: 'chevron-back',
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
    Landmark: 'podium-outline'
};

const Icon = ({ name, size = 24, color = '#000', style }) => (
    <Ionicons name={ICONS[name] || 'help-circle'} size={size} color={color} style={style} />
);

/**
 * MAIN SCREEN
 */
const HomeScreen = () => {
    const [activeTab, setActiveTab] = useState('news');
    const [activeScope, setActiveScope] = useState('Trường');
    const [currentScreen, setCurrentScreen] = useState('main'); // main, member_info, org_info
    const [banners, setBanners] = useState([]);
    const [news, setNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [workSummary, setWorkSummary] = useState({ next_meeting: 'Chưa có lịch', unpaid_fee: '...' });
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [orgInfo, setOrgInfo] = useState({ cell: null, committee: null });

    useEffect(() => {
        fetchInitialData();
    }, [activeScope]);

    const fetchInitialData = async () => {
        if (!refreshing) setLoadingNews(true);
        try {
            console.log('[Mobile] Khởi tạo quá trình lấy dữ liệu...');
            const results = await Promise.allSettled([
                newsService.getCategories(),
                newsService.getNews('all', activeScope),
                bannerService.getActiveBanners(),
                meetingService.getMeetings()
            ]);

            // 1. Xử lý Categories
            if (results[0].status === 'fulfilled') {
                const catsRes = results[0].value;
                const cats = catsRes.data || (Array.isArray(catsRes) ? catsRes : []);
                setCategories([{ id: 'all', name: 'Tất cả' }, ...cats]);
            } else {
                console.error('[Mobile] Lỗi tải Categories:', results[0].reason);
            }

            // 2. Xử lý News
            if (results[1].status === 'fulfilled') {
                const newsRes = results[1].value;
                const rawNews = Array.isArray(newsRes) ? newsRes : (newsRes.data || []);
                const processedNews = rawNews.map(item => ({
                    ...item,
                    thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                        ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                        : null,
                    publishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : '—'
                }));
                setNews(processedNews);
                console.log('[Mobile] Đã tải', processedNews.length, 'tin tức');
            } else {
                console.error('[Mobile] Lỗi tải News:', results[1].reason);
            }

            // 3. Xử lý Banners
            if (results[2].status === 'fulfilled') {
                const bannersRes = results[2].value;
                if (bannersRes && bannersRes.success && Array.isArray(bannersRes.data)) {
                    // Chỉ lấy tối đa 3 banner như yêu cầu giao diện
                    const imageUrls = bannersRes.data.slice(0, 3).map(b => `${API_BASE_URL}${b.imageUrl}?t=${Date.now()}`);
                    console.log('[Mobile] Banner URLs (Max 3):', imageUrls);
                    setBanners(imageUrls);
                } else {
                    console.warn('[Mobile] Dữ liệu banner không hợp lệ:', bannersRes);
                }
            } else {
                console.error('[Mobile] Lỗi tải Banners:', results[2].reason);
            }

            // 4. Xử lý Meeting Summary
            if (results[3].status === 'fulfilled') {
                const meetingsRes = results[3].value;
                const rawMeetings = meetingsRes.data || (Array.isArray(meetingsRes) ? meetingsRes : []);
                if (rawMeetings.length > 0) {
                    const latest = rawMeetings[0];
                    const date = new Date(latest.meetingTime);
                    const formattedTime = `${date.toLocaleDateString('vi-VN')} - ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                    setWorkSummary(prev => ({
                        ...prev,
                        next_meeting: formattedTime
                    }));
                }
            }

            // 5. Lấy thông tin User & Profile liên quan
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                const userData = currentUser.data || currentUser;
                console.log('[Mobile] User Data Loaded:', userData?.username);
                setUser(userData);

                // Lấy thông báo thật
                const notifRes = await notificationService.getNotifications({ limit: 5 });
                const rawNotifs = notifRes.data || notifRes || [];
                setNotifications(rawNotifs.map(n => ({
                    ...n,
                    time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '—',
                    is_read: !!n.ReadStatuses?.length,
                    sender: n.Sender?.fullName || 'Hệ thống'
                })));

                // Lấy thông tin đơn vị (Cell/Branch)
                if (userData.UnionMember) {
                    // Lấy trạng thái đoàn phí
                    const feesRes = await financeService.getFees({ memberId: userData.UnionMember.id, limit: 1 });
                    const fees = feesRes.data || feesRes || [];
                    const unpaid = fees.some(f => f.status !== 'paid');
                    setWorkSummary(prev => ({
                        ...prev,
                        unpaid_fee: unpaid ? 'Chưa đóng' : 'Đã đóng'
                    }));

                    // Lấy tên Chi đoàn/Liên chi đoàn
                    try {
                        const response = await partyService.getOrgInfo();
                        setOrgInfo(response.data || response);
                    } catch (e) {
                        console.log('Error fetching org info:', e);
                    }
                }
            }

        } catch (error) {
            console.error('[Mobile] Lỗi hệ thống khi fetchInitialData:', error);
        } finally {
            setLoadingNews(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInitialData();
    };

    // Removed fetchBanners as it's now integrated in fetchInitialData


    const navigateTo = (screen) => setCurrentScreen(screen);
    const goBack = () => setCurrentScreen('main');

    const showBottomNav = currentScreen === 'main';

    // Title Logic
    const getTitle = () => {
        if (activeTab === 'news') return 'Bản tin Nội bộ';
        return activeTab === 'profile' ? 'Cá nhân' : (activeTab === 'work' ? 'Công tác' : 'Thông báo');
    };

    // Render Logic
    const renderContent = () => {
        switch (activeTab) {
            case 'news': return <NewsFeed categories={categories} news={news} banners={banners} loading={loadingNews} refreshing={refreshing} onRefresh={onRefresh} activeScope={activeScope} onScopeChange={setActiveScope} />;
            case 'work': return <WorkDashboard user={user} summary={workSummary} refreshing={refreshing} onRefresh={onRefresh} onNavigate={navigateTo} />;
            case 'notif': return <NotificationScreen notifications={notifications} refreshing={refreshing} onRefresh={onRefresh} />;
            case 'profile':
                if (!user && !loadingNews) return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280' }}>Vui lòng đăng nhập để xem thông tin</Text>
                    </View>
                );
                if (!user) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#da251d" /></View>;
                return <ProfileScreen user={user} onNavigate={navigateTo} refreshing={refreshing} onRefresh={onRefresh} />;
            default: return <NewsFeed categories={categories} news={news} banners={banners} loading={loadingNews} refreshing={refreshing} onRefresh={onRefresh} activeScope={activeScope} onScopeChange={setActiveScope} />;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#da251d" />

            {/* HEADER */}
            <View style={[styles.header, !showBottomNav && styles.headerRoundedNone]}>
                <View style={styles.headerTopRow}>
                    {/* LEFT BUTTON / SPACER */}
                    <View style={styles.headerLeft}>
                        {currentScreen !== 'main' ? (
                            <TouchableOpacity onPress={goBack} style={styles.iconButton}>
                                <Icon name="ChevronLeft" size={28} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 28 }} />
                        )}
                    </View>

                    {/* TITLE */}
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {getTitle()}
                    </Text>

                    {/* RIGHT BUTTON */}
                    <View style={styles.headerRight}>
                        {activeTab === 'news' && (
                            <TouchableOpacity style={styles.iconButton}>
                                <Icon name="Database" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        {activeTab === 'profile' && (
                            <TouchableOpacity style={styles.iconButton}>
                                <Icon name="Settings" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
                {renderContent()}
            </View>

            {/* BOTTOM NAV */}
            {showBottomNav && (
                <View style={styles.bottomNav}>
                    <NavItem id="news" label="Tin tức" icon="Home" isActive={activeTab === 'news'} onPress={setActiveTab} />
                    <NavItem id="work" label="Công tác" icon="Briefcase" isActive={activeTab === 'work'} onPress={setActiveTab} />
                    <NavItem id="notif" label="Thông báo" icon="Bell" isActive={activeTab === 'notif'} onPress={setActiveTab} />
                    <NavItem id="profile" label="Cá nhân" icon="User" isActive={activeTab === 'profile'} onPress={setActiveTab} />
                </View>
            )}
        </View>
    );
};

// --- SUB-COMPONENTS ---

const NavItem = ({ id, label, icon, isActive, onPress }) => (
    <TouchableOpacity
        style={styles.navItem}
        onPress={() => onPress(id)}
        activeOpacity={0.7}
    >
        <View style={[styles.navIconContainer, isActive && styles.navIconActive]}>
            <Icon name={icon} size={24} color={isActive ? '#FFF' : '#9CA3AF'} />
        </View>
        {!isActive && <Text style={styles.navLabel}>{label}</Text>}
        {isActive && <Text style={styles.navLabelActive}>{label}</Text>}
    </TouchableOpacity>
);

const NewsFeed = ({ categories, news, banners, loading, refreshing, onRefresh, activeScope, onScopeChange }) => {
    const [activeCat, setActiveCat] = useState('all');

    const filteredNews = activeCat === 'all'
        ? news
        : news.filter(item => item.categoryId === activeCat);

    const heroNews = filteredNews.length > 0 ? filteredNews[0] : null;
    const listNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#da251d']} />}
        >
            {/* Banner Carousel */}
            {banners.length > 0 && <Banner images={banners} />}

            {/* Scope Switcher */}
            <View style={styles.scopeSwitcher}>
                {['Trường', 'Tỉnh'].map(s => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.scopeBtn, activeScope === s && styles.scopeBtnActive]}
                        onPress={() => onScopeChange(s)}
                    >
                        <Text style={[styles.scopeBtnText, activeScope === s && styles.scopeBtnTextActive]}>
                            CẤP {s.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.catPill, activeCat === cat.id && styles.catPillActive]}
                        onPress={() => setActiveCat(cat.id)}
                    >
                        <Text style={[styles.catText, activeCat === cat.id && styles.catTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Hero News */}
            {heroNews && (
                <View style={styles.heroCard}>
                    <View style={styles.heroImageContainer}>
                        <Image source={{ uri: heroNews.thumbnailUrl }} style={styles.heroImage} />
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>NỔI BẬT</Text>
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>{heroNews.title}</Text>
                    <Text style={styles.heroSummary} numberOfLines={2}>{heroNews.summary}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="Clock" size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{heroNews.publishedAt}</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.divider} />

            {/* List News */}
            <View style={styles.listContainer}>
                {listNews.map(item => (
                    <TouchableOpacity key={item.id} style={styles.newsItem}>
                        <View style={styles.newsThumb}>
                            <Image source={{ uri: item.thumbnailUrl }} style={styles.imgCover} />
                        </View>
                        <View style={styles.newsContent}>
                            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                            <View style={styles.newsFooter}>
                                <Text style={styles.newsCat}>{item.NewsCategory?.name || 'Tin tức'}</Text>
                                <View style={styles.metaItem}>
                                    <Icon name="Clock" size={10} color="#9CA3AF" />
                                    <Text style={styles.metaTextSm}>{item.publishedAt}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.emptyState}>
                    <Icon name="Clock" size={40} color="#E5E7EB" />
                    <Text style={styles.emptyText}>Đang tải tin tức...</Text>
                </View>
            ) : (listNews.length === 0 && !heroNews) ? (
                <View style={styles.emptyState}>
                    <Icon name="Database" size={40} color="#E5E7EB" />
                    <Text style={styles.emptyText}>Chưa có bài viết.</Text>
                </View>
            ) : null}
        </ScrollView>
    );
};

const WorkDashboard = ({ user, summary, refreshing, onRefresh, onNavigate }) => {
    const isApproved = user?.UnionMember?.status === 'approved';

    const handleProtectedNavigation = (screen, actionName) => {
        if (!isApproved) {
            Alert.alert(
                'Tính năng bị khóa',
                `Đồng chí cần được Ban chấp hành phê duyệt hồ sơ để sử dụng tính năng ${actionName}.`
            );
            return;
        }
        // Hiện tại HomeScreen dùng navigateTo(screen) để chuyển component nội bộ
        // Hoặc nếu là navigation thật thì dùng navigation.navigate
        // Giả sử chuyển màn hình nội bộ cho Sinh hoạt/Tài liệu
        if (onNavigate) onNavigate(screen);
    };

    const stats = user?.statistics || {};
    const totalPoints = stats.totalPoints || 0;
    const meetingsAttended = stats.meetingsAttended || 0;
    const rank = stats.rank || 'C';

    const rankConfig = {
        'A+': { color: '#F59E0B', bg: '#FEF3C7', label: 'Xuất sắc' },
        'A': { color: '#10B981', bg: '#D1FAE5', label: 'Giỏi' },
        'B+': { color: '#3B82F6', bg: '#DBEAFE', label: 'Khá' },
        'B': { color: '#8B5CF6', bg: '#EDE9FE', label: 'Trung bình khá' },
        'C': { color: '#6B7280', bg: '#F3F4F6', label: 'Trung bình' },
    };
    const rc = rankConfig[rank] || rankConfig['C'];

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#da251d']} />}
        >
            {/* Thẻ thống kê cá nhân */}
            <View style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                    <Icon name="Award" size={20} color="#da251d" />
                    <Text style={styles.statsCardTitle}>THỐNG KÊ HOẠT ĐỘNG CÁ NHÂN</Text>
                </View>

                <View style={styles.statsRow}>
                    {/* Điểm rèn luyện */}
                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <Icon name="Landmark" size={22} color="#da251d" />
                        </View>
                        <Text style={styles.statValue}>{totalPoints}</Text>
                        <Text style={styles.statLabel}>Điểm tích lũy</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.statDivider} />

                    {/* Số hoạt động */}
                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
                            <Icon name="Users" size={22} color="#2563EB" />
                        </View>
                        <Text style={styles.statValue}>{meetingsAttended}</Text>
                        <Text style={styles.statLabel}>Buổi tham dự</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.statDivider} />

                    {/* Xếp hạng */}
                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: rc.bg }]}>
                            <Text style={[styles.rankBadgeText, { color: rc.color }]}>{rank}</Text>
                        </View>
                        <Text style={[styles.statValue, { color: rc.color }]}>{rank}</Text>
                        <Text style={styles.statLabel}>{rc.label}</Text>
                    </View>
                </View>

                {/* Thanh tiến độ điểm */}
                <View style={styles.progressSection}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min((totalPoints / 500) * 100, 100)}%` }]} />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressLeft}>{totalPoints} điểm</Text>
                        <Text style={styles.progressRight}>Mục tiêu A+: 500 điểm</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionHeader}>NHIỆM VỤ TRỌNG TÂM</Text>

            <View style={styles.gridContainer}>
                <View style={styles.gridRow}>
                    <WorkCard
                        isPng
                        pngIcon={ICON_SET.sinhhoat}
                        bg="#EBF8FF"
                        color="#3182CE"
                        title="Sinh hoạt Chi đoàn"
                        desc="Điểm danh & Tài liệu"
                        onPress={() => handleProtectedNavigation('meetings', 'Sinh hoạt Chi đoàn')}
                    />
                    <WorkCard
                        isPng
                        pngIcon={ICON_SET.vanban}
                        bg="#E6FFFA"
                        color="#319795"
                        title="Kho Tài liệu"
                        desc="Văn kiện, Nghị quyết"
                        onPress={() => handleProtectedNavigation('documents', 'Kho Tài liệu')}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const WorkCard = ({ icon, bg, color, title, desc, table, isPng, pngIcon, onPress }) => (
    <TouchableOpacity style={styles.workCard} onPress={onPress}>
        <View style={[styles.workIconBox, { backgroundColor: isPng ? 'transparent' : bg }]}>
            {isPng ? (
                <Image source={pngIcon} style={styles.pngIconWork} resizeMode="contain" />
            ) : (
                <Icon name={icon} size={32} color={color} />
            )}
        </View>
        <Text style={styles.workTitle}>{title}</Text>
        <Text style={styles.workDesc}>{desc}</Text>
    </TouchableOpacity>
);

const NotificationScreen = ({ notifications, refreshing, onRefresh }) => (
    <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#da251d']} />}
    >
        <View style={styles.infoBox}>
            <Icon name="Info" size={20} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoTitle}>Lưu ý</Text>
                <Text style={styles.infoText}>Đây là các thông báo nhắc việc. Tin tức xem tại Bản tin.</Text>
            </View>
        </View>

        {notifications.map(item => (
            <View key={item.id} style={[styles.notifCard, !item.is_read && styles.notifUnread]}>
                {!item.is_read && <View style={styles.dotUnread} />}
                <View style={styles.notifRow}>
                    <View style={[styles.notifIcon, item.type === 'meeting' ? styles.bgRedLight : styles.bgBlueLight]}>
                        <Icon
                            name={item.type === 'meeting' ? 'Users' : 'Wallet'}
                            size={20}
                            color={item.type === 'meeting' ? '#da251d' : '#2563EB'}
                        />
                    </View>
                    <View style={styles.notifContent}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <View style={styles.notifMeta}>
                            <Text style={styles.notifSender}>{item.sender}</Text>
                            <Text style={styles.notifTime}>• {item.time}</Text>
                        </View>
                    </View>
                </View>
            </View>
        ))}
    </ScrollView>
);

const ProfileScreen = ({ user, onNavigate, refreshing, onRefresh }) => (
    <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.profileContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#da251d']} />}
    >
        <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
                <RNImage
                    source={user?.avatar ? { uri: `${API_BASE_URL}${user.avatar}` } : { uri: `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=da251d&color=fff` }}
                    style={styles.avatar}
                />
            </View>
            <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.profileName}>{user?.UnionMember?.fullName || user?.username}</Text>
                    {user?.UnionMember?.status === 'approved' && (
                        <Icon name="BadgeCheck" size={18} color="#10B981" style={{ marginLeft: 6 }} />
                    )}
                </View>
                <Text style={styles.profileRole}>{user?.Roles?.[0]?.name || 'Đoàn viên'}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {user?.UnionMember?.status === 'approved' ? 'Đoàn viên chính thức' :
                            user?.UnionMember?.status === 'pending' ? 'Đang chờ phê duyệt' : 'Tài khoản hệ thống'}
                    </Text>
                </View>
            </View>
        </View>

        {/* Thông tin chi tiết hiển thị trực tiếp */}
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
                <Icon name="User" size={18} color="#da251d" />
                <Text style={styles.sectionTitle}>HỒ SƠ ĐOÀN VIÊN</Text>
            </View>
            <InputReadOnly label="MSSV / Mã định danh" value={user?.UnionMember?.studentId || '—'} />
            <InputReadOnly label="Số điện thoại" value={user?.UnionMember?.phoneNumber || '—'} />
            <InputReadOnly label="Email" value={user?.UnionMember?.email || '—'} />
            <InputReadOnly label="Ngày sinh" value={user?.UnionMember?.dateOfBirth ? new Date(user.UnionMember.dateOfBirth).toLocaleDateString('vi-VN') : '—'} />
        </View>

        <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
                <Icon name="Users" size={18} color="#da251d" />
                <Text style={styles.sectionTitle}>TỔ CHỨC ĐOÀN</Text>
            </View>
            <InputReadOnly label="Chi đoàn" value={user?.UnionMember?.UnionCell?.name || '—'} />
            <InputReadOnly label="Đoàn khoa / Đoàn cơ sở" value={user?.UnionMember?.UnionCell?.UnionBranch?.name || '—'} />
        </View>

        <View style={styles.menuGroup}>
            <MenuRow icon="Settings" color="#6B7280" label="Cài đặt" />
            <View style={styles.menuDivider} />
            <MenuRow icon="FileText" color="#6B7280" label="Điều khoản sử dụng" />
        </View>

        <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
                await authService.logout();
                onNavigate('login');
            }}
        >
            <Icon name="LogOut" size={20} color="#da251d" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
    </ScrollView>
);

const MenuRow = ({ icon, color, label, onPress, isPng, pngIcon }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
        <View style={[styles.menuIconBox, { backgroundColor: isPng ? 'transparent' : '#F9FAFB' }]}>
            {isPng ? (
                <RNImage source={pngIcon} style={styles.pngIconMenu} resizeMode="contain" />
            ) : (
                <Icon name={icon} size={20} color={color} />
            )}
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Icon name="ChevronRight" size={20} color="#D1D5DB" />
    </TouchableOpacity>
);

const InputReadOnly = ({ label, value }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputValueBox}>
            <Text style={styles.inputValue}>{value}</Text>
        </View>
    </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    // HEADER STYLES
    header: {
        backgroundColor: '#da251d',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 55,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 50,
        elevation: 8,
        shadowColor: "#da251d",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    headerRoundedNone: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: 20
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        flex: 1,
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: 0.5,
        // fontFamily: 'System' // Or your custom font
    },
    headerLeft: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    iconButton: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
    },

    content: { flex: 1 },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    profileContent: { padding: 16, paddingTop: 60, paddingBottom: 100 },

    // Bottom Nav
    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        paddingVertical: 8, paddingHorizontal: 16,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navIconContainer: {
        width: 48, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 2
    },
    navIconActive: { backgroundColor: '#da251d', marginTop: -20, height: 48, width: 48, borderRadius: 24, shadowColor: "#da251d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
    navLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
    navLabelActive: { fontSize: 10, color: '#da251d', fontWeight: 'bold' },

    scopeSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
        marginVertical: 15,
    },
    scopeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    scopeBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scopeBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    scopeBtnTextActive: {
        color: '#da251d',
    },

    // News Feed
    catScroll: { marginBottom: 8 },
    catPill: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
        backgroundColor: '#FFF', marginRight: 8
    },
    catPillActive: { backgroundColor: '#da251d', borderColor: '#da251d' },
    catText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    catTextActive: { color: '#FFF' },
    sourceNote: { fontSize: 9, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'right', marginBottom: 10 },

    heroCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 0, marginBottom: 16, overflow: 'hidden' },
    heroImageContainer: { height: 200, width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    badgeContainer: { absolute: 'absolute', top: 12, left: 12, backgroundColor: '#da251d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, position: 'absolute' },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    heroTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', margin: 12, marginBottom: 4 },
    heroSummary: { fontSize: 14, color: '#6B7280', marginHorizontal: 12, marginBottom: 12 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 12, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
    metaSource: { fontSize: 9, color: '#D1D5DB', fontStyle: 'italic' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
    listContainer: { gap: 12 },
    newsItem: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    newsThumb: { width: 90, height: 90, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E5E7EB' },
    imgCover: { width: '100%', height: '100%' },
    newsContent: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    newsTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    newsSummary: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    newsCat: { fontSize: 10, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    metaTextSm: { fontSize: 10, color: '#9CA3AF', marginLeft: 4 },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { color: '#9CA3AF', marginTop: 10 },

    // Work Dashboard
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryCard: { flex: 1, padding: 12, borderRadius: 12, overflow: 'hidden', minHeight: 100, justifyContent: 'center' },
    bgGradientRed: { backgroundColor: '#DC2626' },
    bgWhite: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FEE2E2' },
    cardIconAbs: { position: 'absolute', right: -10, bottom: -10 },
    summaryLabelLight: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    summaryValueLight: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    summaryTable: { color: 'rgba(0,0,0,0.2)', fontSize: 8, marginTop: 4 },
    summaryLabelDark: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    summaryValueRed: { color: '#DC2626', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    summaryTableDark: { color: '#E5E7EB', fontSize: 8, marginTop: 4 },

    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#da251d', paddingLeft: 8 },

    // Stats Card (thay thế summaryRow cũ)
    statsCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    statsCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statsCardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        marginLeft: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#F3F4F6',
    },
    rankBadgeText: {
        fontSize: 20,
        fontWeight: '900',
    },
    progressSection: {
        marginTop: 4,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#da251d',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    progressLeft: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#da251d',
    },
    progressRight: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    gridContainer: { gap: 12 },
    gridRow: { flexDirection: 'row', gap: 12 },
    workCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
    workIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    pngIconWork: { width: 48, height: 48 },
    pngIconMenu: { width: 24, height: 24 },
    workTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    workDesc: { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 8 },

    // Notifications
    infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DBEAFE' },
    infoTitle: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 14 },
    infoText: { color: '#2563EB', fontSize: 12, marginTop: 2 },
    notifCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    notifUnread: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
    dotUnread: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#da251d' },
    notifRow: { flexDirection: 'row' },
    notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bgRedLight: { backgroundColor: '#FEE2E2' },
    bgBlueLight: { backgroundColor: '#DBEAFE' },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    notifMeta: { flexDirection: 'row', alignItems: 'center' },
    notifSender: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    notifTime: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },

    // Profile
    profileCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, paddingTop: 40, marginTop: 10, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 16 },
    avatarWrapper: { position: 'absolute', top: -40, padding: 4, backgroundColor: '#FFF', borderRadius: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6' },
    profileInfo: { alignItems: 'center', marginTop: 24 },
    profileName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    profileRole: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    statusBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 12 },
    statusText: { color: '#da251d', fontSize: 12, fontWeight: 'bold' },

    menuGroup: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
    menuIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16 },
    logoutText: { color: '#da251d', fontWeight: 'bold', marginLeft: 8 },

    inputValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
});

export default HomeScreen;
