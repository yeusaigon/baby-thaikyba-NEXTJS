'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import './splash.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace('/login');
            } else {
                setUser(currentUser);
                setTimeout(() => setLoading(false), 1000);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div id="splash-screen">
                <div className="splash-logo-container">
                    <img 
                        src="/logo.png" 
                        className="splash-logo" 
                        alt="Splash Logo" 
                    />
                </div>
                <div className="splash-brand">ThaiKy<span>Pro</span></div>
                <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
                <p style={{ marginTop: '20px', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                    Đang chuẩn bị dữ liệu...
                </p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="app-shell" style={{ background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header onOpenMenu={() => setIsMenuOpen(true)} />
            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <main id="main-content" style={{ flex: 1 }}>
                {children}
            </main>
        </div>
    );
}

