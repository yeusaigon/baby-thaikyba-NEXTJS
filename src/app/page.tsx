'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { IoCalendarOutline, IoBodyOutline, IoArrowForwardOutline, IoPersonOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function LandingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="app-shell">
            {loading && (
                <div id="check-auth" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'white', zIndex: 99, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="loader"></div>
                </div>
            )}

            <div className="landing-container">
                {/* --- HEADER (NAVBAR) --- */}
                <nav className="landing-nav fade-in">
                    <Link href="/" className="brand">
                        ThaiKy<span>Pro</span>
                    </Link>
                    <Link href="/admin" className="nav-login-btn">
                        <IoPersonOutline size={18} /> Đăng nhập
                    </Link>
                </nav>

                {/* --- HERO SECTION --- */}
                <div className="hero-section fade-in">
                    
                    {/* Cột Trái: Nội dung */}
                    <div className="hero-content">
                        <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem', margin: '0', fontWeight: 900, letterSpacing: '-1px' }}>
                            Hành trình 40 tuần <br />
                            hạnh phúc cùng <br />
                            <span style={{ color: 'var(--accent)' }}>mẹ và bé yêu.</span>
                        </h1>
                        <p style={{ color: 'var(--text-sub)', marginTop: '20px', maxWidth: '400px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            Ứng dụng trợ lý thai sản thông minh giúp mẹ theo dõi sức khỏe, nhắc nhở lịch khám và ghi lại những khoảnh khắc tuyệt vời nhất.
                        </p>

                        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
                            <div className="feature-item" style={{ background: 'white', padding: '20px 15px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f9ff' }}>
                                <div style={{ background: '#e0f2fe', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#0284c7' }}>
                                    <IoCalendarOutline size={22} />
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Nhắc lịch khám</div>
                            </div>
                            <div className="feature-item" style={{ background: 'white', padding: '20px 15px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #fff7ed' }}>
                                <div style={{ background: '#ffedd5', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#ea580c' }}>
                                    <IoBodyOutline size={22} />
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Theo dõi bé</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', width: '100%', maxWidth: '400px' }}>
                            <Link href="/admin" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', borderRadius: '30px', padding: '18px', fontSize: '1.1rem' }}>
                                Bắt đầu miễn phí <IoArrowForwardOutline size={22} />
                            </Link>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '15px', textAlign: 'center' }}>
                                Dữ liệu an toàn & Bảo mật tuyệt đối trên Cloud.
                            </p>
                        </div>
                    </div>

                    {/* Cột Phải: Hình ảnh minh họa */}
                    <div className="hero-image-wrapper">
                        {/* Thay thế logo nhỏ bằng một hình cover lớn cho PC, ở đây dùng tạm logo bự nhưng có hiệu ứng nổi (floating-card) */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                            <img 
                                src="https://blogger.googleusercontent.com/img/a/AVvXsEjYY_ehzxMTeFo4YFBWdvWLraE7CfCR22JwlCd7e3jzDCFpw4fvee5auJY_I9HfaIS5vrqdvL5oix904UelcuMU1IvsOj4jM_HpGuaj7_UZXSKXfxVRrmetba59Xuhh9KFXo_oc4hw6G_J1Qf_DrHEYGnSMYOr0Zx1KiX-HjWKrZV7BjMKICSjzVf-XNyU" 
                                alt="ThaiKyPro App Cover"
                                className="hero-image logo-bounce"
                                style={{ background: 'white', padding: '30px', borderRadius: '50%' }}
                            />
                            
                            {/* Glassmorphism Floating Cards */}
                            <div className="floating-card c1">
                                <div className="floating-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                                    <IoCalendarOutline size={20} />
                                </div>
                                <div className="floating-text">
                                    Lịch siêu âm 4D <br/> <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>Ngày mai, 08:00 AM</span>
                                </div>
                            </div>

                            <div className="floating-card c2">
                                <div className="floating-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                    <IoBodyOutline size={20} />
                                </div>
                                <div className="floating-text">
                                    Cân nặng thai nhi <br/> <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 500 }}>Phát triển rất tốt!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
