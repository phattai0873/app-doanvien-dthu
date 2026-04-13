import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, CornerDownLeft, Command, Loader2, Sparkles, Navigation, Users, Calendar } from 'lucide-react';
import ModalPortal from '../../components/ModalPortal';
import { useAuth } from '../../hooks/useAuth';
import { NAV } from '../constants/navigation';
import { normalizeVietnamese } from '../../utils/stringUtils';
import { commandBus } from '../../utils/commandBus';
import { memberApi, activityApi } from '../../services/api';

export default function CommandPalette({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [entityResults, setEntityResults] = useState([]);
    const [recentPaths, setRecentPaths] = useState([]);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const searchTimeout = useRef(null);

    // Load recent from localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('recent_commands') || '[]');
        setRecentPaths(saved);
    }, []);

    const saveRecent = (item) => {
        if (item.type !== 'navigation') return;
        const newRecent = [item.id, ...recentPaths.filter(id => id !== item.id)].slice(0, 5);
        setRecentPaths(newRecent);
        localStorage.setItem('recent_commands', JSON.stringify(newRecent));
    };

    // 1. Scoring Logic: Rank results based on match quality
    const getScore = (item, q) => {
        const text = normalizeVietnamese(item.label);
        const search = normalizeVietnamese(q);

        if (text === search) return 10;
        if (text.startsWith(search)) return 5;
        if (text.includes(search)) return 3;
        
        const keywordsMatch = (item.keywords || []).some(k => normalizeVietnamese(k).includes(search));
        if (keywordsMatch) return 1;

        return 0;
    };

    // 2. Lọc, gán Group và Ranking
    const getFilteredResults = () => {
        if (!query) {
            const recentItems = NAV.filter(cmd => recentPaths.includes(cmd.id));
            const suggestedItems = NAV.filter(cmd => cmd.type === 'action').slice(0, 3);
            
            const initial = [];
            if (recentItems.length > 0) {
                initial.push({ type: 'header', label: 'Truy cập gần đây' });
                initial.push(...recentItems.map(item => ({ ...item, isRecent: true })));
            }
            initial.push({ type: 'header', label: 'Gợi ý hành động' });
            initial.push(...suggestedItems);
            
            return initial;
        }

        const scored = NAV
            .filter(cmd => !cmd.permission || hasPermission(cmd.permission))
            .map(item => ({ ...item, score: getScore(item, query) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score);

        // Chèn kết quả từ Database (nếu có)
        const final = [...scored];
        if (entityResults.length > 0) {
            final.push(...entityResults);
        }

        return final;
    };

    // 2.5 Async Search for entities
    useEffect(() => {
        if (!query || query.length < 2) {
            setEntityResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const [memRes, actRes] = await Promise.all([
                    memberApi.getAll({ search: query, limit: 3 }),
                    activityApi.getAll({ search: query, limit: 3 })
                ]);

                const members = (memRes.data.data.rows || []).map(m => ({
                    id: `entity-member-${m.id}`,
                    type: 'navigation',
                    label: m.fullName,
                    description: `Mã SV: ${m.memberCode}`,
                    section: 'Đoàn viên',
                    icon: Users,
                    to: `/admin/members?search=${m.memberCode}`,
                    score: 2
                }));

                const activities = (actRes.data.data.rows || []).map(a => ({
                    id: `entity-activity-${a.id}`,
                    type: 'navigation',
                    label: a.name,
                    description: a.unionBranch?.name || 'Hoạt động chung',
                    section: 'Hoạt động',
                    icon: Calendar,
                    to: `/admin/activities?search=${a.name}`,
                    score: 2
                }));

                setEntityResults([...members, ...activities]);
            } catch (err) {
                console.error("Async search failed", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout.current);
    }, [query]);

    const rawResults = getFilteredResults();
    
    // Phẳng hóa results để index keyboard đúng (bỏ qua header)
    const results = rawResults.filter(r => r.type !== 'header');

    // 3. Phân nhóm kết quả để hiển thị
    const groupedResults = [];
    if (!query) {
        // Nếu không có query, rawResults đã có header rồi
        let currentFlatIndex = 0;
        rawResults.forEach(item => {
            if (item.type === 'header') {
                groupedResults.push(item);
            } else {
                groupedResults.push({ ...item, flatIndex: currentFlatIndex++ });
            }
        });
    } else {
        let lastSection = null;
        results.forEach((item, index) => {
            if (item.section !== lastSection) {
                groupedResults.push({ type: 'header', label: item.section });
                lastSection = item.section;
            }
            groupedResults.push({ ...item, flatIndex: index });
        });
    }

    // 4. Tự động focus khi mở
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // 5. Xử lý Keyboard Navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        }
    };

    const handleSelect = async (item) => {
        saveRecent(item);
        if (item.type === 'action') {
            setIsLoading(true);
            if (location.pathname !== item.to) {
                navigate(item.to);
                setTimeout(() => {
                    commandBus.emit(item.action, item.payload);
                    setIsLoading(false);
                    onClose();
                }, 150); // Tăng delay một chút để mount page kịp
            } else {
                commandBus.emit(item.action, item.payload);
                setIsLoading(false);
                onClose();
            }
        } else {
            navigate(item.to);
            onClose();
        }
    };

    // Tự động cuộn theo index
    useEffect(() => {
        const activeItem = document.getElementById(`cmd-item-${selectedIndex}`);
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <ModalPortal onAttemptClose={onClose} overlayClassName="bg-black/60 backdrop-blur-sm items-start pt-32">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Bar */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    {isLoading ? (
                        <Loader2 size={22} className="text-primary-600 animate-spin" />
                    ) : (
                        <Search size={22} className="text-gray-400" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 text-xl font-medium placeholder:text-gray-400"
                        placeholder="Tìm hành động hoặc tính năng... (Ctrl + K)"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-400 text-[10px] font-bold shadow-sm">
                        ESC
                    </div>
                </div>

                {/* Results List */}
                <div 
                    ref={scrollRef}
                    className="max-h-[60vh] overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-gray-200"
                >
                    {groupedResults.length > 0 ? (
                        groupedResults.map((item, index) => {
                            if (item.type === 'header') {
                                return (
                                    <div key={`header-${item.label}`} className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white">
                                        {item.label}
                                    </div>
                                );
                            }

                            const Icon = item.icon;
                            const isSelected = item.flatIndex === selectedIndex;
                            
                            return (
                                <div
                                    id={`cmd-item-${item.flatIndex}`}
                                    key={item.id}
                                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-all mx-2 rounded-xl mb-1 ${
                                        isSelected 
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                                            : 'bg-transparent text-gray-600 hover:bg-gray-50'
                                    }`}
                                    onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm truncate">{item.label}</p>
                                            {item.type === 'action' && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                                    isSelected ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    Hành động
                                                </span>
                                            )}
                                            {item.isRecent && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                                    isSelected ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    Gần đây
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[11px] truncate opacity-70`}>
                                            {item.description || `${item.section} ${item.type === 'navigation' ? `› ${item.label}` : ''}`}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-80 animate-in fade-in slide-in-from-right-2">
                                            Chọn <CornerDownLeft size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="relative">
                                <Search size={48} strokeWidth={1} className="opacity-20" />
                                <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-gray-500">Không tìm thấy kết quả nào</p>
                                <p className="text-xs">Hãy thử nhập từ khóa ngắn gọn hoặc phím tắt liên quan</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-1 rounded bg-white border border-gray-200 shadow-sm text-gray-500 font-mono text-[10px]">↑↓</kbd> Di chuyển
                        </span>
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-1 rounded bg-white border border-gray-200 shadow-sm text-gray-500 font-mono text-[10px]">↵</kbd> Truy cập
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary-600/50">
                        <Navigation size={12} /> DTHU COMMAND CENTER
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
