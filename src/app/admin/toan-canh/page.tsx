'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
    IoPersonOutline, IoHeartOutline, IoCalendarOutline, IoCardOutline, 
    IoMedkitOutline, IoPulseOutline, IoWalletOutline, IoSparklesOutline,
    IoWaterOutline
} from 'react-icons/io5';

export default function ToanCanhPage() {
    const [profile, setProfile] = useState<any>({});
    const [nextAppt, setNextAppt] = useState<any>(null);
    const [latestBP, setLatestBP] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Profile
                onSnapshot(doc(db, "users", user.uid, "settings", "profile"), (d) => {
                    if (d.exists()) {
                        setProfile(d.data());
                    }
                });

                // Next Appt
                const visitsSnap = await getDocs(collection(db, "users", user.uid, "visits"));
                const visitsData = visitsSnap.docs.map(d => d.data());
                const upcoming = visitsData
                    .filter(v => v.nextDate && new Date(v.nextDate) >= new Date())
                    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
                if (upcoming.length > 0) {
                    setNextAppt(upcoming[0]);
                }

                // Total Cost
                const financeSnap = await getDocs(collection(db, "users", user.uid, "maternity_finance"));
                let cost = 0;
                financeSnap.docs.forEach(d => {
                    const dt = d.data();
                    if (dt.type === 'expense' || dt.type === 'medical') {
                        cost += Number(dt.amount || 0);
                    }
                });
                setTotalCost(cost);

                // Latest Vitals (BP)
                const vitalsQ = query(collection(db, "users", user.uid, "health_vitals"), orderBy("datetime", "desc"), limit(10));
                const vSnap = await getDocs(vitalsQ);
                const bpDocs = vSnap.docs.map(d => d.data()).filter(d => d.systolic && d.diastolic);
                if (bpDocs.length > 0) setLatestBP(bpDocs[0]);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // Calculate Weeks
    const getWeeks = () => {
        if (!profile.lmp) return '--';
        const diff = new Date().getTime() - new Date(profile.lmp).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    };

    const getEdd = () => {
        if (!profile.lmp) return '--';
        const eddDate = new Date(new Date(profile.lmp).getTime() + 280 * 24 * 60 * 60 * 1000);
        return `${eddDate.getDate().toString().padStart(2, '0')}/${(eddDate.getMonth() + 1).toString().padStart(2, '0')}/${eddDate.getFullYear()}`;
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="utility-page-container fade-in">
            <style jsx>{`
                .premium-banner {
                    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 12px 24px rgba(219, 39, 119, 0.25);
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                }
                .premium-banner::before {
                    content: '';
                    position: absolute;
                    top: 0; right: 0; bottom: 0; left: 0;
                    background: url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="white" fill-opacity="0.1"/></svg>');
                    background-size: 20px 20px;
                    z-index: 1;
                }
                .banner-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    z-index: 2;
                    backdrop-filter: blur(8px);
                }
                .banner-content {
                    z-index: 2;
                }
                .banner-title {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .banner-subtitle {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    margin-top: 4px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }
                .info-card {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid rgba(0, 0, 0, 0.04);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
                    transition: transform 0.3s ease;
                }
                .info-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }
                .card-header-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .card-header-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #0f172a;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                }
                .detail-label {
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .detail-value {
                    color: #0f172a;
                    font-weight: 700;
                    font-size: 0.9rem;
                    text-align: right;
                }
            `}</style>

            <div className="premium-banner">
                <div className="banner-icon">
                    <IoHeartOutline />
                </div>
                <div className="banner-content">
                    <h1 className="banner-title">Toàn Cảnh Mẹ Bầu</h1>
                    <div className="banner-subtitle">Hồ sơ tổng hợp và chỉ số quan trọng</div>
                </div>
            </div>

            <div className="info-grid">
                {/* Hành chính */}
                <div className="info-card">
                    <div className="card-header">
                        <div className="card-header-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                            <IoPersonOutline />
                        </div>
                        <div className="card-header-title">Thông tin hành chính</div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Họ tên</span>
                        <span className="detail-value">{profile.name || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Năm sinh</span>
                        <span className="detail-value">{profile.yob || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">SĐT Mẹ</span>
                        <span className="detail-value">{profile.phoneWife || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">CCCD</span>
                        <span className="detail-value">{profile.cccd || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">BHYT</span>
                        <span className="detail-value">{profile.bhyt || '--'}</span>
                    </div>
                </div>

                {/* Y tế */}
                <div className="info-card">
                    <div className="card-header">
                        <div className="card-header-icon" style={{ background: '#fef2f2', color: '#e11d48' }}>
                            <IoMedkitOutline />
                        </div>
                        <div className="card-header-title">Hồ sơ y tế</div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Tuần thai</span>
                        <span className="detail-value" style={{ color: '#db2777' }}>Tuần {getWeeks()}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Dự sinh</span>
                        <span className="detail-value">{getEdd()}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Nhóm máu</span>
                        <span className="detail-value" style={{ color: '#e11d48' }}>{profile.bloodType || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">PARA</span>
                        <span className="detail-value">{profile.para || '--'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Dị ứng</span>
                        <span className="detail-value">{profile.allergy || 'Không'}</span>
                    </div>
                </div>

                {/* Chỉ số & Nhắc nhở */}
                <div className="info-card">
                    <div className="card-header">
                        <div className="card-header-icon" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                            <IoSparklesOutline />
                        </div>
                        <div className="card-header-title">Theo dõi & Nhắc nhở</div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Lịch khám tiếp</span>
                        <span className="detail-value" style={{ color: '#0284c7' }}>
                            {nextAppt ? nextAppt.nextDate.split('-').reverse().join('/') : 'Chưa có'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Huyết áp gần nhất</span>
                        <span className="detail-value" style={{ color: latestBP?.systolic >= 140 ? '#e11d48' : '#16a34a' }}>
                            {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : '--'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Tổng chi phí</span>
                        <span className="detail-value" style={{ color: '#ca8a04' }}>
                            {formatVND(totalCost)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
