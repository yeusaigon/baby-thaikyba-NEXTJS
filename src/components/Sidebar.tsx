'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { 
    IoHomeOutline, IoSettingsOutline, IoClipboardOutline, 
    IoCalendarOutline, IoRestaurantOutline, IoImagesOutline, 
    IoBriefcaseOutline, IoBookOutline, IoMusicalNotesOutline, 
    IoShieldHalfOutline, IoHelpOutline, IoLogOutOutline, 
    IoPersonOutline, IoFlowerOutline, IoCloseOutline,
    IoMedicalOutline, IoHeartOutline, IoWalletOutline, IoAppsOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline
} from 'react-icons/io5';

// Define MENU DEFS
export const MENU_DEFS = [
    { id: 'home', label: 'Trang chủ', icon: 'home-outline', color: '#0d9488', target: '/admin', group: 'system' },
    { id: 'settings', label: 'Cài đặt', icon: 'settings-outline', color: '#64748b', target: '/admin/settings', group: 'system' },
    { id: 'sokham', label: 'Sổ khám bệnh', icon: 'clipboard-outline', color: '#10b981', target: '/admin/sokhambenh', group: 'health' },
    { id: 'lichkham', label: 'Lịch khám thai', icon: 'calendar-outline', color: '#3b82f6', target: '/admin/lich-kham', group: 'health' },
    { id: 'dinhduong', label: 'Dinh dưỡng', icon: 'restaurant-outline', color: '#f97316', target: '/admin/dinh-duong', group: 'health' },
    { id: 'suckhoe', label: 'Theo dõi sức khỏe', icon: 'pulse-outline', color: '#06b6d4', target: '/admin/suc-khoe', group: 'health' },
    { id: 'album', label: 'Album ảnh', icon: 'images-outline', color: '#8b5cf6', target: '/admin/album', group: 'tool' },
    { id: 'chuanbi', label: 'Đồ đi sinh', icon: 'briefcase-outline', color: '#f59e0b', target: '/admin/chuan-bi-di-sinh', group: 'tool' },
    { id: 'tiemchung', label: 'Tiêm chủng', icon: 'medical-outline', color: '#10b981', target: '/admin/tiem-chung', group: 'tool' },
    { id: 'nhatkybe', label: 'Nhật ký bé', icon: 'heart-outline', color: '#ec4899', target: '/admin/nhat-ky-be', group: 'tool' },
    { id: 'taichinh', label: 'Tài chính', icon: 'wallet-outline', color: '#f59e0b', target: '/admin/tai-chinh', group: 'tool' },
    { id: 'cudongthai', label: 'Cử động thai', icon: 'footsteps-outline', color: '#db2777', target: '/admin/cu-dong-thai', group: 'tool' },
    { id: 'note', label: 'Cẩm nang', icon: 'book-outline', color: '#14b8a6', target: '/admin/note', group: 'knowledge' },
    { id: 'thaigiao', label: 'Thai giáo', icon: 'musical-notes-outline', color: '#db2777', target: '/admin/thai-giao', group: 'knowledge' },
    { id: 'kiengky', label: 'Kiêng kỵ', icon: 'shield-half-outline', color: '#ef4444', target: '/admin/kieng-ky', group: 'knowledge' },
    { id: 'canhbao', label: 'Cảnh báo đỏ', icon: 'warning-outline', color: '#ef4444', target: '/admin/canh-bao', group: 'knowledge' }
];

export const DEFAULT_MENU_IDS = ['album', 'sokham', 'note', 'chuanbi', 'settings', 'tiemchung', 'nhatkybe', 'taichinh', 'suckhoe', 'cudongthai', 'canhbao'];

const getMenuIcon = (iconName: string, color: string, size = 22) => {
    switch (iconName) {
        case 'home-outline': return <IoHomeOutline size={size} color={color} />;
        case 'settings-outline': return <IoSettingsOutline size={size} color={color} />;
        case 'clipboard-outline': return <IoClipboardOutline size={size} color={color} />;
        case 'calendar-outline': return <IoCalendarOutline size={size} color={color} />;
        case 'restaurant-outline': return <IoRestaurantOutline size={size} color={color} />;
        case 'images-outline': return <IoImagesOutline size={size} color={color} />;
        case 'briefcase-outline': return <IoBriefcaseOutline size={size} color={color} />;
        case 'book-outline': return <IoBookOutline size={size} color={color} />;
        case 'musical-notes-outline': return <IoMusicalNotesOutline size={size} color={color} />;
        case 'shield-half-outline': return <IoShieldHalfOutline size={size} color={color} />;
        case 'medical-outline': return <IoMedicalOutline size={size} color={color} />;
        case 'heart-outline': return <IoHeartOutline size={size} color={color} />;
        case 'wallet-outline': return <IoWalletOutline size={size} color={color} />;
        case 'pulse-outline': return <IoPulseOutline size={size} color={color} />;
        case 'footsteps-outline': return <IoFootstepsOutline size={size} color={color} />;
        case 'warning-outline': return <IoWarningOutline size={size} color={color} />;
        default: return <IoHelpOutline size={size} color={color} />;
    }
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>({});
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    if (d.exists()) {
                        setProfile(d.data());
                    }
                });
            } else {
                setUser(null);
                setProfile({});
                if (unsubscribeProfile) {
                    unsubscribeProfile();
                    unsubscribeProfile = null;
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const menuConfig = profile.menuConfig || DEFAULT_MENU_IDS;

    // Filter menu items (exclude home and settings as they are static at start/end)
    const dynamicItems = MENU_DEFS.filter(item => 
        menuConfig.includes(item.id) && item.id !== 'home' && item.id !== 'settings'
    ).sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    const handleLogout = () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
            signOut(auth).then(() => {
                router.replace('/');
                onClose();
            });
        }
    };

    return (
        <div id="drawer-container">
            {/* Overlay */}
            <div 
                id="menu-overlay" 
                className={`menu-overlay ${isOpen ? 'open' : ''}`} 
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    zIndex: 99, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'all' : 'none',
                    transition: 'opacity 0.3s ease'
                }}
            />

            {/* Side Menu */}
            <div 
                id="side-menu" 
                className={`side-menu ${isOpen ? 'open' : ''}`}
                style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
                    background: 'white', zIndex: 100, boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', flexDirection: 'column'
                }}
            >


                {/* Header (Logo & Brand only) */}
                <div className="menu-header" style={{
                    padding: '30px 20px 20px 20px', 
                    background: 'linear-gradient(135deg, #fdf4ff 0%, #f0fdfa 100%)', 
                    borderTopRightRadius: '24px', position: 'relative', overflow: 'hidden'
                }}>
                    {/* Close button inside sidebar */}
                    <button
                        onClick={onClose}
                        className="side-menu-close-btn"
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(13, 148, 136, 0.2)',
                            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d9488',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.25s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#0d9488';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.borderColor = '#0d9488';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
                            e.currentTarget.style.color = '#0d9488';
                            e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.2)';
                        }}
                    >
                        <IoCloseOutline size={20} />
                    </button>

                    <IoFlowerOutline style={{
                        position: 'absolute', top: '-20px', right: '-20px', 
                        fontSize: '150px', color: '#fbcfe8', opacity: 0.3, pointerEvents: 'none'
                    }} />
                    
                    {/* Logo & Brand */}
                    <Link 
                        href="/admin" 
                        replace
                        onClick={onClose}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2, textDecoration: 'none' }}
                    >
                        <img 
                            src="/logo.png" 
                            width="44" 
                            height="44"
                            style={{ borderRadius: '12px', boxShadow: 'var(--shadow-soft)', objectFit: 'cover' }}
                            alt="Logo"
                        />
                        <div style={{ fontWeight: 900, fontSize: '1.35rem', color: '#0d9488' }}>
                            ThaiKy<span style={{ color: '#f97316' }}>Pro</span>
                        </div>
                    </Link>
                </div>

                {/* Menu list */}
                <div id="drawer-list" className="menu-list" style={{
                    flex: 1, overflowY: 'auto', padding: '15px 10px'
                }}>

                    {/* Dynamic configured pages */}
                    {dynamicItems.map(item => {
                        const isActive = pathname === item.target;
                        return (
                            <Link 
                                href={item.target} 
                                replace
                                key={item.id} 
                                onClick={onClose} 
                                className={`menu-item-link ${isActive ? 'active' : ''}`} 
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                    borderRadius: '12px', textDecoration: 'none', color: isActive ? 'var(--primary)' : '#64748b',
                                    fontWeight: isActive ? 800 : 600, background: isActive ? '#f0fdfa' : 'transparent',
                                    marginBottom: '5px'
                                }}
                            >
                                {getMenuIcon(item.icon, isActive ? 'var(--primary)' : '#64748b')}
                                {item.label}
                            </Link>
                        );
                    })}

                    <div style={{ height: '1px', background: '#f1f5f9', margin: '10px 0' }} />

                    {/* All Apps Link */}
                    <Link 
                        href="/admin/ung-dung" 
                        replace
                        onClick={onClose} 
                        className={`menu-item-link ${pathname === '/admin/ung-dung' ? 'active' : ''}`} 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            borderRadius: '12px', textDecoration: 'none', color: pathname === '/admin/ung-dung' ? 'var(--primary)' : '#64748b',
                            fontWeight: pathname === '/admin/ung-dung' ? 800 : 600, background: pathname === '/admin/ung-dung' ? '#f0fdfa' : 'transparent',
                            marginBottom: '5px'
                        }}
                    >
                        <IoAppsOutline size={22} color={pathname === '/admin/ung-dung' ? 'var(--primary)' : '#64748b'} />
                        Tất cả ứng dụng
                    </Link>

                    {/* Fixed Settings link */}
                    <Link 
                        href="/admin/settings" 
                        replace
                        onClick={onClose} 
                        className={`menu-item-link ${pathname === '/admin/settings' ? 'active' : ''}`} 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            borderRadius: '12px', textDecoration: 'none', color: pathname === '/admin/settings' ? 'var(--primary)' : '#64748b',
                            fontWeight: pathname === '/admin/settings' ? 800 : 600, background: pathname === '/admin/settings' ? '#f0fdfa' : 'transparent',
                            marginBottom: '5px'
                        }}
                    >
                        <IoSettingsOutline size={22} color={pathname === '/admin/settings' ? 'var(--primary)' : '#64748b'} />
                        Cài đặt
                    </Link>
                </div>

                {/* Footer (User session & Logout) */}
                <div className="menu-footer" style={{ 
                    padding: '20px', 
                    borderTop: '1px solid #f1f5f9', 
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout} 
                        style={{
                            width: '100%',
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px', 
                            background: '#fff1f2', 
                            color: '#e11d48',
                            border: 'none', 
                            fontWeight: 700, 
                            borderRadius: '12px', 
                            cursor: 'pointer',
                            fontSize: '0.85rem', 
                            boxShadow: '0 2px 6px rgba(225,29,72,0.06)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#ffe4e6'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#fff1f2'}
                    >
                        <IoLogOutOutline size={16} /> Đăng xuất
                    </button>
                    
                    {/* Email & Copyright info */}
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, wordBreak: 'break-all' }}>
                            {user?.email || ''}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                            © {new Date().getFullYear()} Phan Minh Trí • All Rights Reserved
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
