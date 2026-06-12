'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { IoMenuOutline, IoHomeOutline, IoCloudOfflineOutline, IoCloseOutline } from 'react-icons/io5';
import './splash.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace('/login');
            } else {
                setUser(currentUser);
                setLoading(false); // Tải dữ liệu ngay lập tức không giữ trễ
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => {
                setShowSkeleton(true);
            }, 300); // Chỉ hiện khung xương nếu thời gian chờ quá 300ms (tránh chớp nháy khi mạng nhanh)
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
            
            {/* Nút Menu 3 gạch phong cách Glassmorphism đồng bộ màu giao diện, trôi nổi cố định */}
            <button 
                className="mobile-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ 
                    position: 'fixed', 
                    top: '16px', 
                    left: '16px', 
                    zIndex: 90,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(13, 148, 136, 0.2)',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d9488',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isMenuOpen ? 'translateX(280px)' : 'translateX(0)',
                    opacity: isMenuOpen ? 0 : 1,
                    pointerEvents: isMenuOpen ? 'none' : 'auto'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = '#0d9488';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#0d9488';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.25)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.75)';
                    e.currentTarget.style.color = '#0d9488';
                    e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.2)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.08)';
                }}
            >
                <IoMenuOutline size={20} />
            </button>

            <main id="main-content" style={{ 
                flex: 1, 
                position: 'relative',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isMenuOpen ? 'translateX(280px)' : 'none'
            }}>
                {loading ? (showSkeleton ? <AdminPageSkeleton /> : null) : children}
            </main>

            <style jsx global>{`
                /* Hide mobile elements on PC screen (min-width: 1024px) */
                @media (min-width: 1024px) {
                    .mobile-menu-btn {
                        display: none !important;
                    }
                    #main-content {
                        transform: none !important;
                    }
                }
                 /* Hiệu ứng nhấp nháy xương (Skeleton Shimmer) */
                 .skeleton-item {
                     background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                     background-size: 200% 100%;
                     animation: shimmer-ani 1.5s infinite linear;
                 }
                 @keyframes shimmer-ani {
                     0% { background-position: -200% 0; }
                     100% { background-position: 200% 0; }
                 }
             `}</style>
        </div>
    );
}

function AdminPageSkeleton() {
    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
            {/* Top Large Banner Skeleton */}
            <div className="skeleton-item" style={{ height: '170px', borderRadius: '24px', width: '100%' }} />

            {/* Vitals Grid Skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
            
            <style jsx>{`
                @media (max-width: 900px) {
                    .split-grid-skeleton {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                }
                @media (max-width: 600px) {
                    .health-grid-skeleton {
                        grid-template-columns: 1fr !important;
                    }
                    div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
}
