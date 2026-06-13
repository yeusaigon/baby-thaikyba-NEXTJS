'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
    IoMenuOutline, IoHomeOutline, IoCloudOfflineOutline, 
    IoCloseOutline, IoNotificationsOutline, IoWalletOutline,
    IoRestaurantOutline, IoMedicalOutline, IoHeartOutline,
    IoSettingsOutline, IoClipboardOutline, IoCalendarOutline,
    IoImagesOutline, IoBriefcaseOutline, IoBookOutline,
    IoShieldHalfOutline, IoMusicalNotesOutline, IoAppsOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline
} from 'react-icons/io5';
import './splash.css';

const ROUTE_CONFIGS: Record<string, { title: string; background: string; textColor: string; btnColor: string; icon: React.ReactNode }> = {
    '/admin': {
        title: 'ThaiKyPro',
        background: 'linear-gradient(135deg, #fff5f7 0%, #f0f9ff 50%, #f5f3ff 100%)',
        textColor: '#0d9488',
        btnColor: '#0d9488',
        icon: null
    },
    '/admin/settings': {
        title: 'Cài đặt hệ thống',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 48%, #fdf2f8 100%)',
        textColor: '#475569',
        btnColor: '#475569',
        icon: <IoSettingsOutline size={18} />
    },
    '/admin/ung-dung': {
        title: 'Tất cả ứng dụng',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 48%, #fff7fb 100%)',
        textColor: '#6d28d9',
        btnColor: '#6d28d9',
        icon: <IoAppsOutline size={18} />
    },
    '/admin/sokhambenh': {
        title: 'Sổ khám bệnh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 48%, #ecfdf5 100%)',
        textColor: '#0f766e',
        btnColor: '#0f766e',
        icon: <IoClipboardOutline size={18} />
    },
    '/admin/lich-kham': {
        title: 'Lịch khám thai',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 48%, #fdf2f8 100%)',
        textColor: '#7c3aed',
        btnColor: '#7c3aed',
        icon: <IoCalendarOutline size={18} />
    },
    '/admin/dinh-duong': {
        title: 'Dinh dưỡng thai kỳ',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 48%, #fff7ed 100%)',
        textColor: '#047857',
        btnColor: '#047857',
        icon: <IoRestaurantOutline size={18} />
    },
    '/admin/suc-khoe': {
        title: 'Theo dõi sức khỏe',
        background: 'linear-gradient(135deg, #ecfeff 0%, #ffffff 48%, #f0fdfa 100%)',
        textColor: '#0891b2',
        btnColor: '#0891b2',
        icon: <IoPulseOutline size={18} />
    },
    '/admin/album': {
        title: 'Album ảnh của bé',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 48%, #fdf2f8 100%)',
        textColor: '#7c3aed',
        btnColor: '#7c3aed',
        icon: <IoImagesOutline size={18} />
    },
    '/admin/chuan-bi-di-sinh': {
        title: 'Giỏ đồ đi sinh',
        background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 48%, #fff7ed 100%)',
        textColor: '#b45309',
        btnColor: '#b45309',
        icon: <IoBriefcaseOutline size={18} />
    },
    '/admin/tiem-chung': {
        title: 'Sổ tiêm chủng',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 48%, #f0fdfa 100%)',
        textColor: '#047857',
        btnColor: '#047857',
        icon: <IoMedicalOutline size={18} />
    },
    '/admin/nhat-ky-be': {
        title: 'Nhật ký của bé',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #fff1f2 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoHeartOutline size={18} />
    },
    '/admin/tai-chinh': {
        title: 'Sổ chi tiêu sắm đồ',
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 48%, #fffbeb 100%)',
        textColor: '#c2410c',
        btnColor: '#c2410c',
        icon: <IoWalletOutline size={18} />
    },
    '/admin/cu-dong-thai': {
        title: 'Cử động thai',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #fff7fb 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoFootstepsOutline size={18} />
    },
    '/admin/note': {
        title: 'Cẩm nang thai kỳ',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 48%, #ecfeff 100%)',
        textColor: '#0f766e',
        btnColor: '#0f766e',
        icon: <IoBookOutline size={18} />
    },
    '/admin/thai-giao': {
        title: 'Thai giáo cho bé',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #f5f3ff 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoMusicalNotesOutline size={18} />
    },
    '/admin/kieng-ky': {
        title: 'Kiêng kỵ thai kỳ',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 48%, #fef2f2 100%)',
        textColor: '#b91c1c',
        btnColor: '#b91c1c',
        icon: <IoShieldHalfOutline size={18} />
    },
    '/admin/canh-bao': {
        title: 'Cảnh báo đỏ',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 48%, #fdf2f8 100%)',
        textColor: '#be123c',
        btnColor: '#be123c',
        icon: <IoWarningOutline size={18} />
    }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);

    const currentConfig = ROUTE_CONFIGS[pathname] || {
        title: 'ThaiKyPro',
        background: 'rgba(255, 255, 255, 0.85)',
        textColor: '#1e293b',
        btnColor: '#64748b',
        icon: null
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace('/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => {
                setShowSkeleton(true);
            }, 300);
        } else {
            setShowSkeleton(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!user && !loading) return null;

    return (
        <div className="app-shell" style={{ 
            background: 'var(--bg-app)', 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            
            {/* Floating Offline Warning */}
            {isOffline && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 95,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: 'rgba(254, 226, 226, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    color: '#ef4444', 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <IoCloudOfflineOutline size={16} /> Kết nối ngoại tuyến
                </div>
            )}

            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            {/* Mobile Sticky Header Bar */}
            <div className="mobile-header-bar" style={{
                display: 'none', // Overridden to 'flex' in responsive.css
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: '56px',
                background: currentConfig.background,
                backdropFilter: pathname === '/admin' ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: pathname === '/admin' ? 'blur(12px)' : 'none',
                borderBottom: pathname === '/admin' ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
                zIndex: 85,
                alignItems: 'center',
                padding: '0 16px',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
            }}>
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: currentConfig.btnColor,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        marginLeft: '-8px'
                    }}
                >
                    <IoMenuOutline size={26} />
                </button>

                {/* Absolutely Centered Title / Brand */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    color: currentConfig.textColor
                }}>
                    {pathname === '/admin' ? (
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: currentConfig.textColor, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#ea580c' }}>ThaiKy</span>Pro
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {currentConfig.icon}
                            {currentConfig.title}
                        </span>
                    )}
                </div>

                {/* Right Area: Action Items (Notification Bell / Future APIs) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentConfig.btnColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            position: 'relative',
                            marginRight: '-4px'
                        }}
                        onClick={() => alert("Chức năng thông báo & đồng bộ tiện ích đang được phát triển.")}
                    >
                        <IoNotificationsOutline size={22} />
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '6px',
                            height: '6px',
                            background: currentConfig.textColor === '#ffffff' ? '#ffffff' : '#ef4444',
                            borderRadius: '50%',
                            border: currentConfig.textColor === '#ffffff' ? '1px solid ' + currentConfig.background : 'none'
                        }} />
                    </button>
                </div>
            </div>

            <main id="main-content" style={{ 
                flex: 1, 
                position: 'relative'
            }}>
                {loading ? (showSkeleton ? <AdminPageSkeleton /> : null) : children}
            </main>
        </div>
    );
}

function AdminPageSkeleton() {
    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
            {/* Top Large Banner Skeleton */}
            <div className="skeleton-item" style={{ height: '170px', borderRadius: '24px', width: '100%' }} />

            {/* Vitals Grid Skeletons */}
            <div className="vitals-grid-skeleton" style={{ display: 'grid', gap: '16px' }}>
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
            </div>

            {/* Split Skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="split-grid-skeleton">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="health-grid-skeleton">
                        <div className="skeleton-item" style={{ height: '160px', borderRadius: '24px' }} />
                        <div className="skeleton-item" style={{ height: '160px', borderRadius: '24px' }} />
                    </div>
                    <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton-item" style={{ height: '180px', borderRadius: '24px' }} />
                    <div className="skeleton-item" style={{ height: '180px', borderRadius: '24px' }} />
                </div>
            </div>
        </div>
    );
}
