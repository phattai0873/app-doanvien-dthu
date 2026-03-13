import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landingApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, RefreshCcw, Layout, Smartphone, Info } from 'lucide-react';

const LandingSettingsPage = () => {
    const queryClient = useQueryClient();
    const [heroData, setHeroData] = useState({
        title: '',
        subtitle: '',
        description: ''
    });
    const [appLinks, setAppLinks] = useState({
        ios: '',
        android: ''
    });

    const { data: configRes, isLoading } = useQuery({
        queryKey: ['landingConfigs'],
        queryFn: landingApi.getConfigs
    });

    useEffect(() => {
        if (configRes?.data?.data) {
            const configs = configRes.data.data;
            if (configs.hero_section) setHeroData(configs.hero_section);
            if (configs.app_links) setAppLinks(configs.app_links);
        }
    }, [configRes]);

    const updateMutation = useMutation({
        mutationFn: landingApi.updateConfig,
        onSuccess: () => {
            queryClient.invalidateQueries(['landingConfigs']);
            toast.success('Cập nhật cấu hình thành công');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const handleSaveHero = (e) => {
        e.preventDefault();
        updateMutation.mutate({ key: 'hero_section', value: heroData });
    };

    const handleSaveLinks = (e) => {
        e.preventDefault();
        updateMutation.mutate({ key: 'app_links', value: appLinks });
    };

    if (isLoading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Landing Page</h1>
                    <p className="text-gray-500">Tùy chỉnh nội dung hiển thị cho trang giới thiệu công khai.</p>
                </div>
                <button 
                   onClick={() => queryClient.invalidateQueries(['landingConfigs'])}
                   className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <RefreshCcw size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hero Section Config */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-3 text-primary-600">
                        <Layout size={24} />
                        <h2 className="text-xl font-bold">Phần Giới thiệu (Hero)</h2>
                    </div>
                    
                    <form onSubmit={handleSaveHero} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Tiêu đề chính</label>
                            <input 
                                value={heroData.title}
                                onChange={e => setHeroData({...heroData, title: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Tiêu đề phụ (Subtitle)</label>
                            <input 
                                value={heroData.subtitle}
                                onChange={e => setHeroData({...heroData, subtitle: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                            <textarea 
                                rows={4}
                                value={heroData.description}
                                onChange={e => setHeroData({...heroData, description: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
                        >
                            <Save size={18} /> Lưu thay đổi
                        </button>
                    </form>
                </div>

                {/* App Links Config */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 text-primary-600">
                            <Smartphone size={24} />
                            <h2 className="text-xl font-bold">Đường dẫn Tải App</h2>
                        </div>
                        
                        <form onSubmit={handleSaveLinks} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Link App Store (iOS)</label>
                                <input 
                                    value={appLinks.ios}
                                    onChange={e => setAppLinks({...appLinks, ios: e.target.value})}
                                    placeholder="https://apps.apple.com/..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Link Google Play (Android)</label>
                                <input 
                                    value={appLinks.android}
                                    onChange={e => setAppLinks({...appLinks, android: e.target.value})}
                                    placeholder="https://play.google.com/..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition disabled:opacity-50"
                            >
                                <Save size={18} /> Cập nhật Links
                            </button>
                        </form>
                    </div>

                    <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 flex items-start gap-4">
                        <Info className="text-primary-600 mt-1" size={20} />
                        <div className="text-sm text-primary-800 leading-relaxed">
                            <p className="font-bold mb-1">Mẹo nhỏ:</p>
                            Nội dung bạn thay đổi ở đây sẽ được cập nhật ngay lập tức trên trang Landing Page công khai. Hãy kiểm tra kỹ chính tả trước khi lưu.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingSettingsPage;
