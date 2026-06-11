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
    IoPersonOutline, IoFlowerOutline, IoCloseOutline
} from 'react-icons/io5';

// Define MENU DEFS
export const MENU_DEFS = [
    { id: 'home', label: 'Trang chủ', icon: 'home-outline', color: '#0d9488', target: '/admin', group: 'system' },
    { id: 'settings', label: 'Cài đặt', icon: 'settings-outline', color: '#64748b', target: '/admin/settings', group: 'system' },
    { id: 'sokham', label: 'Sổ khám bệnh', icon: 'clipboard-outline', color: '#10b981', target: '/admin/sokhambenh', group: 'health' },
    { id: 'lichkham', label: 'Lịch khám thai', icon: 'calendar-outline', color: '#3b82f6', target: '/admin/lich-kham', group: 'health' },
    { id: 'dinhduong', label: 'Dinh dưỡng', icon: 'restaurant-outline', color: '#f97316', target: '/admin/dinh-duong', group: 'health' },
    { id: 'album', label: 'Album ảnh', icon: 'images-outline', color: '#8b5cf6', target: '/admin/album', group: 'tool' },
    { id: 'chuanbi', label: 'Đồ đi sinh', icon: 'briefcase-outline', color: '#f59e0b', target: '/admin/chuan-bi-di-sinh', group: 'tool' },
    { id: 'note', label: 'Cẩm nang', icon: 'book-outline', color: '#14b8a6', target: '/admin/note', group: 'knowledge' },
    { id: 'thaigiao', label: 'Thai giáo', icon: 'musical-notes-outline', color: '#db2777', target: '/admin/thai-giao', group: 'knowledge' },
    { id: 'kiengky', label: 'Kiêng kỵ', icon: 'shield-half-outline', color: '#ef4444', target: '/admin/kieng-ky', group: 'knowledge' }
];

export const DEFAULT_MENU_IDS = ['album', 'sokham', 'note', 'chuanbi', 'settings'];

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
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        setUser(currentUser);

        const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
            if (d.exists()) {
                setProfile(d.data());
            }
        });

        return () => unsubscribe();
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
                {/* Close Button for ease of use */}
                <button 
                    className="side-menu-close-btn"
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'rgba(255,255,255,0.8)', border: 'none', 
                        borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 10,
                        display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    <IoCloseOutline size={20} color="#475569" />
                </button>

                {/* Header (Mẹ Bầu Profile) */}
                <div className="menu-header" style={{
                    padding: '30px 20px', 
                    background: 'linear-gradient(135deg, #fdf4ff 0%, #f0fdfa 100%)', 
                    borderTopRightRadius: '24px', position: 'relative', overflow: 'hidden'
                }}>
                    <IoFlowerOutline style={{
                        position: 'absolute', top: '-20px', right: '-20px', 
                        fontSize: '150px', color: '#fbcfe8', opacity: 0.3, pointerEvents: 'none'
                    }} />
                    
                    <div className="user-avatar-large" style={{
                        background: 'white', border: '3px solid white', 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)', position: 'relative', 
                        zIndex: 2, width: '60px', height: '60px', borderRadius: '50%',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {profile.avatar ? (
                            <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                        ) : (
                            <IoPersonOutline size={30} color="#ec4899" />
                        )}
                    </div>
                    
                    <div className="menu-user-name" style={{
                        color: '#334155', position: 'relative', zIndex: 2,
                        fontWeight: 800, marginTop: '12px', fontSize: '1.1rem'
                    }}>
                        {profile.name || user?.displayName || 'Mẹ bầu xinh đẹp'}
                    </div>
                    
                    <div className="menu-user-sub" style={{
                        color: '#64748b', fontWeight: 500, position: 'relative', 
                        zIndex: 2, fontSize: '0.8rem', marginTop: '2px'
                    }}>
                        {user?.email || ''}
                    </div>
                </div>

                {/* Menu list */}
                <div id="drawer-list" className="menu-list" style={{
                    flex: 1, overflowY: 'auto', padding: '15px 10px'
                }}>
                    {/* Fixed Home link */}
                    <Link 
                        href="/admin" 
                        replace
                        onClick={onClose} 
                        className={`menu-item-link ${pathname === '/admin' ? 'active' : ''}`} 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            borderRadius: '12px', textDecoration: 'none', color: pathname === '/admin' ? 'var(--primary)' : '#64748b',
                            fontWeight: pathname === '/admin' ? 800 : 600, background: pathname === '/admin' ? '#f0fdfa' : 'transparent',
                            marginBottom: '5px'
                        }}
                    >
                        <IoHomeOutline size={22} color={pathname === '/admin' ? 'var(--primary)' : '#64748b'} />
                        Trang chủ
                    </Link>

                    <div style={{ height: '1px', background: '#f1f5f9', margin: '10px 0' }} />

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

                {/* Footer (Sign out) */}
                <div className="menu-footer" style={{ padding: '20px 15px', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                        onClick={handleLogout} 
                        className="menu-item-link" 
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                            padding: '12px', width: '100%', background: '#fff1f2', color: '#e11d48', 
                            border: 'none', fontWeight: 700, borderRadius: '14px', cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(225,29,72,0.1)', transition: 'all 0.2s'
                        }}
                    >
                        <IoLogOutOutline size={20} />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
