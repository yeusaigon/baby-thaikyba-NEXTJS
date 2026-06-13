'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoMenuOutline, IoNotificationsOutline, IoCloudOfflineOutline } from 'react-icons/io5';

interface HeaderProps {
    onOpenMenu: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
    const [isOffline, setIsOffline] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show header when scrolling up, hide when scrolling down (and past 60px)
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowHeader(false);
            } else {
                setShowHeader(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 20px',
            background: 'white',
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                    className="hamburger-btn" 
                    onClick={onOpenMenu}
                    style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', color: '#475569',
                        padding: '8px', borderRadius: '50%', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                    <IoMenuOutline size={26} />
                </button>
                <Link href="/admin" replace style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <img 
                        src="/logo.png" 
                        width="36" 
                        height="36"
                        style={{ borderRadius: '10px', boxShadow: 'var(--shadow-soft)', objectFit: 'cover' }}
                        alt="Logo"
                    />
                    <div className="brand" style={{ marginLeft: '4px', fontWeight: 900, fontSize: '1.25rem', color: '#0d9488' }}>
                        ThaiKy<span style={{ color: '#f97316' }}>Pro</span>
                    </div>
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isOffline && (
                    <div id="offline-badge" className="offline-badge" style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: '#fee2e2', color: '#ef4444', 
                        padding: '4px 10px', borderRadius: '20px', 
                        fontSize: '0.8rem', fontWeight: 700
                    }}>
                        <IoCloudOfflineOutline size={14} /> Ngoại tuyến
                    </div>
                )}
                
                <div style={{
                    background: 'white', border: '1px solid #f1f5f9', borderRadius: '50%', 
                    padding: '8px', boxShadow: 'var(--shadow-soft)', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <IoNotificationsOutline className="bell-ring" style={{ color: '#ef4444' }} size={20} />
                </div>
            </div>
        </div>
    );
}
