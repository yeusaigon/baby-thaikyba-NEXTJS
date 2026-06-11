'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import Link from 'next/link';
import { IoLockClosedOutline, IoArrowBackOutline } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.replace('/admin');
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleGoogleLogin = async () => {
        setStatus('Đang kết nối Google...');
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged sẽ tự bắt sự kiện và redirect
        } catch (error: any) {
            setStatus('Lỗi: ' + error.message);
        }
    };

    return (
        <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Loading Overlay */}
            {loading && (
                <div id="check-auth" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'white', zIndex: 99, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="loader"></div>
                </div>
            )}

            <div className="fade-in" style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                padding: '40px 30px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                margin: '20px',
                border: '1px solid rgba(255,255,255,0.5)'
            }}>
                <div style={{
                    width: '80px', height: '80px', background: 'var(--primary-light)', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', margin: '0 auto 20px',
                    boxShadow: 'inset 0 4px 10px rgba(13, 148, 136, 0.1)'
                }}>
                    <IoLockClosedOutline size={40} color="#0d9488" />
                </div>
                
                <h2 style={{ color: 'var(--primary)', margin: '0', fontWeight: 900, fontSize: '1.8rem' }}>Khu vực cá nhân</h2>
                <p style={{ color: '#64748b', marginTop: '10px', marginBottom: '30px', lineHeight: 1.5 }}>
                    Đăng nhập an toàn để đồng bộ dữ liệu thai kỳ của bạn trên mọi thiết bị.
                </p>

                <button 
                    onClick={handleGoogleLogin} 
                    className="btn-primary" 
                    style={{ 
                        background: 'white', color: '#333', border: '1px solid #e2e8f0', 
                        boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', gap: '10px', padding: '16px', fontSize: '1.05rem',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <FcGoogle size={24} />
                    Tiếp tục với Google
                </button>
                
                {status && (
                    <p style={{ textAlign: 'center', marginTop: '15px', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>
                        {status}
                    </p>
                )}

                <Link href="/" className="btn-secondary" style={{ 
                    textDecoration: 'none', textAlign: 'center', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginTop: status ? '15px' : '30px', border: 'none', background: 'transparent'
                }}>
                    <IoArrowBackOutline /> Quay lại trang chủ
                </Link>
            </div>
        </div>
    );
}
