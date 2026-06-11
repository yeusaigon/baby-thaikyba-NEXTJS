'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDataForWeek, PregnancyWeekData } from '@/lib/data';
import { MENU_DEFS } from '@/components/Sidebar';
import Link from 'next/link';
import { 
    IoFlowerOutline, IoPerson, IoMedkitOutline, IoCalendarOutline, 
    IoRestaurantOutline, IoAddOutline, IoLogoGoogle, IoCall, IoAppsOutline,
    IoClipboardOutline, IoImagesOutline, IoBriefcaseOutline, IoBookOutline,
    IoMusicalNotesOutline, IoShieldHalfOutline, IoHeartOutline, IoSparklesOutline,
    IoTimeOutline, IoLocationOutline, IoWalletOutline
} from 'react-icons/io5';

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>({});
    const [visits, setVisits] = useState<any[]>([]);
    const [latestFood, setLatestFood] = useState<any>(null);
    const [weeks, setWeeks] = useState(0);
    const [eddStr, setEddStr] = useState('--/--/----');
    const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyWeekData | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Lắng nghe Profile
        const unsubProfile = onSnapshot(doc(db, "users", user.uid, "settings", "profile"), (d) => {
            if (d.exists()) {
                const data = d.data();
                setProfile(data);

                // Tính toán tuần thai & dự sinh
                if (data.lmp) {
                    const lmpDate = new Date(data.lmp);
                    const today = new Date();
                    
                    let computedWeeks = Math.floor((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    if (computedWeeks < 0) computedWeeks = 0;
                    if (computedWeeks > 40) computedWeeks = 40;
                    setWeeks(computedWeeks);

                    const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
                    setEddStr(`${eddDate.getDate()}/${eddDate.getMonth() + 1}/${eddDate.getFullYear()}`);
                    
                    // Lấy thông tin y khoa của tuần thai
                    setPregnancyInfo(getDataForWeek(computedWeeks));
                } else {
                    setWeeks(0);
                    setEddStr('--/--/----');
                    setPregnancyInfo(getDataForWeek(0));
                }
            } else {
                setWeeks(0);
                setEddStr('--/--/----');
                setPregnancyInfo(getDataForWeek(0));
            }
        });

        // 2. Lắng nghe Lịch khám (visits)
        const qVisits = query(collection(db, "users", user.uid, "visits"), orderBy("date", "desc"));
        const unsubVisits = onSnapshot(qVisits, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVisits(list);
        });

        // 3. Lắng nghe Nhật ký dinh dưỡng gần nhất
        const qFood = query(collection(db, "users", user.uid, "nutrition_diary"), orderBy("timestamp", "desc"), limit(1));
        const unsubFood = onSnapshot(qFood, (snapshot) => {
            if (!snapshot.empty) {
                setLatestFood(snapshot.docs[0].data());
            } else {
                setLatestFood(null);
            }
        });

        return () => {
            unsubProfile();
            unsubVisits();
            unsubFood();
        };
    }, []);

    useEffect(() => {
        // Đẩy trạng thái giả lập vào stack lịch sử
        window.history.pushState(null, '', window.location.href);

        const handlePopState = (e: PopStateEvent) => {
            // Khi người dùng bấm back ở trang chủ, hỏi xem họ có muốn thoát ứng dụng không
            if (window.confirm("Bạn có muốn thoát ứng dụng ThaiKyPro không?")) {
                // Đi lùi tiếp để thoát stack hoặc đóng tab
                window.history.go(-2);
            } else {
                // Nếu không thoát, tiếp tục giữ chân ở trang chủ bằng cách đẩy lại state giả lập
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // Tính tổng chi phí khám thai từ các lịch không bị đánh dấu xóa (deletedAt)
    const activeVisits = visits.filter(v => !v.deletedAt);
    const totalCost = activeVisits.reduce((sum, v) => {
        const val = Number(v.totalCost) || Number(v.cost) || 0;
        return sum + val;
    }, 0);

    const formatVND = (n: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    };

    // Tìm lịch tái khám tiếp theo (lớn hơn hoặc bằng ngày hôm nay)
    const todayStr = new Date().toISOString().split('T')[0];
    const nextAppt = activeVisits
        .filter(v => v.nextDate && v.nextDate >= todayStr)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];

    const hasAllergy = profile.allergy && profile.allergy.toLowerCase() !== 'không';

    // Logic hiển thị icon trên trang chủ: Lấy TẤT CẢ tiện ích trừ Home & Settings
    const visibleUtils = MENU_DEFS.filter(i => i.id !== 'home' && i.id !== 'settings')
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    // Hàm thêm vào lịch Google
    const addToCalendar = (dateStr: string, title: string, location: string) => {
        const d = dateStr.replace(/-/g, '');
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}T080000/${d}T110000&location=${encodeURIComponent(location)}`);
    };

    // Lời chào động theo thời gian
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng rạng rỡ ☀️";
        if (hour < 18) return "Chúc mẹ buổi chiều an lành 🌤️";
        return "Chúc mẹ buổi tối ấm áp, thư thái 🌙";
    };

    const progressPercent = Math.min(Math.round((weeks / 40) * 100), 100);

    return (
        <div className="fade-in dashboard-container">
            <style jsx>{`
                @keyframes float-heart { 
                    0% { transform: translateY(0px) rotate(10deg); } 
                    50% { transform: translateY(-12px) rotate(-5deg); } 
                    100% { transform: translateY(0px) rotate(10deg); } 
                }
                @keyframes pulse-icon { 
                    0% { transform: scale(1); } 
                    50% { transform: scale(1.08); } 
                    100% { transform: scale(1); } 
                }
                @keyframes pulse-sos {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                .dashboard-container {
                    width: 100%;
                    padding: 16px;
                    box-sizing: border-box;
                }
                .dashboard-flex-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding-bottom: 40px;
                }
                .db-left-col, .db-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                @media (max-width: 1023px) {
                    .db-left-col, .db-right-col {
                        display: contents;
                    }
                    .db-hero { order: 1; }
                    .vitals-grid { order: 2; }
                    .baby-growth-card { order: 3; }
                    .health-tracker-grid { order: 4; }
                    .db-utils { order: 5; }
                    .db-sos { order: 6; }
                }

                /* 1. HERO PROFILE CARD */
                .hero-profile { 
                    background: linear-gradient(135deg, #fff5f7 0%, #f0f9ff 50%, #f5f3ff 100%); 
                    border: 1px solid rgba(255, 255, 255, 0.7); 
                    box-shadow: 0 12px 35px rgba(236, 72, 153, 0.06); 
                    border-radius: 28px; 
                    position: relative; 
                    overflow: hidden; 
                    padding: 30px 24px; 
                }
                .hero-bg-icon { 
                    position: absolute; 
                    top: -20px; 
                    right: -20px; 
                    opacity: 0.12; 
                    color: #ec4899; 
                    animation: float-heart 6s ease-in-out infinite; 
                    pointer-events: none;
                }
                .hero-top-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    position: relative;
                    z-index: 2;
                }
                .avatar-box { 
                    width: 84px; 
                    height: 84px; 
                    border-radius: 24px; 
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05); 
                    border: 3px solid white; 
                    background: #f8fafc; 
                    flex-shrink: 0; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    overflow: hidden; 
                    transition: transform 0.3s ease;
                }
                .avatar-box:hover {
                    transform: scale(1.05);
                }
                .avatar-box img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                }
                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                }
                .hero-welcome-text {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .greeting-text {
                    font-size: 0.88rem;
                    color: #64748b;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                }
                .mother-name { 
                    font-size: 1.5rem; 
                    font-weight: 900; 
                    color: #1e293b; 
                    line-height: 1.2; 
                }
                .edd-text { 
                    font-size: 0.88rem; 
                    color: #64748b; 
                    font-weight: 600; 
                }
                .edd-date { 
                    color: #ec4899; 
                    font-weight: 800; 
                    background: #fff1f2;
                    padding: 2px 8px;
                    border-radius: 8px;
                    border: 1px solid #ffe4e6;
                }
                .allergy-badge { 
                    background: #fee2e2; 
                    color: #991b1b; 
                    padding: 8px 14px; 
                    border-radius: 14px; 
                    font-size: 0.8rem; 
                    font-weight: 700; 
                    margin-top: 18px; 
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    position: relative; 
                    z-index: 2; 
                    border: 1px solid #fecaca;
                    align-self: flex-start;
                }

                /* Timeline progress design */
                .pregnancy-timeline-container {
                    margin-top: 24px;
                    position: relative;
                    z-index: 2;
                    background: rgba(255, 255, 255, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    padding: 16px;
                    border-radius: 18px;
                }
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.82rem;
                    color: #475569;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .timeline-header strong {
                    color: #ec4899;
                    font-weight: 800;
                }
                .percent-text {
                    color: #8b5cf6;
                    font-weight: 800;
                }
                .timeline-track {
                    height: 10px;
                    background: #e2e8f0;
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                }
                .timeline-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%);
                    border-radius: 999px;
                    transition: width 1s ease-out;
                }
                .timeline-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-top: 6px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                /* 2. VITALS & STATS GRID */
                .vitals-grid { 
                    display: grid; 
                    grid-template-columns: repeat(4, minmax(0, 1fr)); 
                    gap: 16px; 
                    position: relative; 
                    z-index: 2; 
                }
                .vital-box { 
                    background: rgba(255, 255, 255, 0.8); 
                    backdrop-filter: blur(10px); 
                    border-radius: 20px; 
                    padding: 16px 12px; 
                    text-align: center; 
                    border: 1px solid rgba(255, 255, 255, 0.7); 
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
                    transition: all 0.3s ease;
                    min-width: 0;
                }
                .vital-box:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
                }
                .vital-label { 
                    font-size: 0.7rem; 
                    color: #64748b; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                }
                .vital-value { 
                    font-size: 1.15rem; 
                    font-weight: 900; 
                    line-height: 1.25; 
                }
                .vital-box.pink .vital-value { color: #ec4899; }
                .vital-box.yellow .vital-value { color: #d97706; }
                .vital-box.blue .vital-value { color: #0ea5e9; }
                .vital-box.red .vital-value { color: #ef4444; }

                /* 3. BABY & MOM ADVICE BOX */
                .baby-growth-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                }
                .baby-growth-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 4px;
                    background: linear-gradient(90deg, #ec4899, #8b5cf6);
                }
                .growth-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 18px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 12px;
                }
                .spinning-flower {
                    color: #ec4899;
                    font-size: 1.4rem;
                    animation: pulse-icon 3s ease-in-out infinite;
                }
                .growth-header h4 {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #1e293b;
                }
                .growth-body {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .info-sec {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sec-title {
                    font-size: 0.82rem;
                    font-weight: 800;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .sec-content {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.55;
                    margin: 0;
                }
                .info-sec.advice {
                    background: #fdf4ff;
                    border: 1px dashed #fbcfe8;
                    padding: 12px 16px;
                    border-radius: 16px;
                }
                .info-sec.advice .sec-title {
                    color: #c084fc;
                }
                .info-sec.advice .sec-content {
                    color: #6b21a8;
                    font-weight: 500;
                }

                /* 4. HEALTH TRACKER GRID */
                .health-tracker-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    gap: 20px;
                }
                .health-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    min-width: 0;
                }
                .health-card-title {
                    margin: 0;
                    font-size: 1.05rem;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 800;
                }
                .cost-wallet-card {
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border: 1px solid #bbf7d0;
                    padding: 16px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .wallet-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #16a34a;
                    box-shadow: 0 4px 10px rgba(22, 163, 74, 0.1);
                    font-size: 1.3rem;
                    flex-shrink: 0;
                }
                .wallet-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .wallet-info span {
                    font-size: 0.72rem;
                    color: #15803d;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .wallet-info strong {
                    font-size: 1.05rem;
                    font-weight: 900;
                    color: #14532d;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Calendar Block UI */
                .calendar-block-appt {
                    background: linear-gradient(135deg, #fff5f7 0%, #ffe4e6 100%);
                    border: 1px solid #fecaca;
                    border-radius: 18px;
                    padding: 16px;
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    position: relative;
                }
                .mini-calendar-sheet {
                    width: 52px;
                    height: 58px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(225, 29, 72, 0.08);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #fecaca;
                    flex-shrink: 0;
                    text-align: center;
                }
                .calendar-sheet-header {
                    background: #e11d48;
                    color: white;
                    font-size: 0.55rem;
                    font-weight: 800;
                    padding: 3px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .calendar-sheet-day {
                    font-size: 1.3rem;
                    font-weight: 900;
                    color: #9f1239;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .appt-details {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .appt-title {
                    font-size: 0.72rem;
                    color: #9f1239;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .appt-time {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #475569;
                }
                .appt-clinic {
                    font-size: 0.75rem;
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .btn-add-gcal {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    border: none; 
                    background: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    width: 24px;
                    height: 24px;
                    border-radius: 50%; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.06); 
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-add-gcal:hover {
                    transform: scale(1.1) rotate(15deg);
                }

                /* Nutrition Tracker Card */
                .nutrition-latest-box {
                    background: linear-gradient(135deg, #fffbeb 0%, #ffedd5 100%);
                    border: 1px solid #fed7aa;
                    padding: 16px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                }
                .nutrition-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);
                    font-size: 1.3rem;
                    flex-shrink: 0;
                }
                .nutrition-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .nutrition-title {
                    font-size: 0.72rem;
                    color: #c2410c;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .nutrition-content {
                    font-size: 0.9rem;
                    font-weight: 800;
                    color: #7c2d12;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .nutrition-meta {
                    font-size: 0.75rem;
                    color: #d97706;
                    font-weight: 600;
                    margin-top: 2px;
                }
                .btn-quick-add {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #f97316;
                    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.15);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-quick-add:hover {
                    transform: translateY(-50%) scale(1.08);
                    background: #f97316;
                    color: white;
                }

                /* 5. APP UTILITIES GRID WITH GLOW EFFECT */
                .utilities-grid { 
                    display: grid; 
                    grid-template-columns: repeat(4, minmax(0, 1fr)); 
                    gap: 16px; 
                    margin-top: 8px; 
                }
                .util-item { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    text-decoration: none; 
                    cursor: pointer; 
                    background: rgba(248, 250, 252, 0.45);
                    border: 1px solid rgba(241, 245, 249, 0.75);
                    padding: 16px 8px;
                    border-radius: 22px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 0;
                }
                .util-item:hover { 
                    transform: translateY(-4px); 
                    background: white;
                }
                .util-icon-box { 
                    width: 52px; 
                    height: 52px; 
                    border-radius: 16px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 10px; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02); 
                    background: white; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 24px;
                }
                .util-item:hover .util-icon-box {
                    transform: scale(1.1) rotate(3deg);
                }
                .util-label { 
                    font-size: 0.8rem; 
                    font-weight: 800; 
                    color: #475569; 
                    text-align: center; 
                    line-height: 1.25; 
                }

                /* Specific Hover Colors & Shadows */
                .util-item.util-sokham:hover { border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.08); }
                .util-item.util-lichkham:hover { border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.08); }
                .util-item.util-dinhduong:hover { border-color: rgba(249, 115, 22, 0.3); box-shadow: 0 10px 20px rgba(249, 115, 22, 0.08); }
                .util-item.util-album:hover { border-color: rgba(139, 92, 246, 0.3); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.08); }
                .util-item.util-chuanbi:hover { border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.08); }
                .util-item.util-note:hover { border-color: rgba(20, 184, 166, 0.3); box-shadow: 0 10px 20px rgba(20, 184, 166, 0.08); }
                .util-item.util-thaigiao:hover { border-color: rgba(219, 39, 119, 0.3); box-shadow: 0 10px 20px rgba(219, 39, 119, 0.08); }
                .util-item.util-kiengky:hover { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.08); }

                /* 6. SOS EMERGENCY */
                .btn-sos { 
                    background: linear-gradient(135deg, #ef4444, #dc2626); 
                    color: white; 
                    padding: 16px 20px; 
                    border-radius: 20px; 
                    text-decoration: none; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    animation: pulse-sos 2.5s infinite;
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: transform 0.2s;
                }
                .btn-sos:hover {
                    transform: translateY(-2px);
                }
                .sos-icon-box {
                    background: rgba(255,255,255,0.2); 
                    width: 44px; 
                    height: 44px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 1.35rem;
                }

                /* Responsive design */
                @media (max-width: 900px) {
                    .health-tracker-grid {
                        grid-template-columns: minmax(0, 1fr);
                        gap: 16px;
                    }
                    .vitals-grid { 
                        grid-template-columns: repeat(2, minmax(0, 1fr)); 
                        gap: 12px; 
                    }
                }
                @media (max-width: 600px) {
                    .utilities-grid { 
                        grid-template-columns: repeat(3, minmax(0, 1fr)); 
                        gap: 12px;
                    }
                }
            `}</style>

            <div className="dashboard-flex-layout">
                {/* 1. HỒ SƠ MẸ BẦU (HERO CARD) */}
                <div className="hero-profile fade-in db-hero">
                    <IoFlowerOutline className="hero-bg-icon" size={150} />
                    
                    <div className="hero-top-info">
                        <div className="avatar-box">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Avatar" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <IoPerson size={36} />
                                </div>
                            )}
                        </div>
                        <div className="hero-welcome-text">
                            <span className="greeting-text">{getGreeting()}</span>
                            <div className="mother-name">
                                {profile.name || auth.currentUser?.displayName || 'Mẹ bầu xinh đẹp'}
                            </div>
                            <div className="edd-text">
                                Ngày dự sinh: <span className="edd-date">{eddStr}</span>
                            </div>
                        </div>
                    </div>

                    {hasAllergy && (
                        <div className="allergy-badge">
                            ⚠️ Dị ứng: {profile.allergy}
                        </div>
                    )}
                    
                    {/* Tiến trình thai kỳ */}
                    <div className="pregnancy-timeline-container">
                        <div className="timeline-header">
                            <span>Tiến trình thai kỳ: <strong>Tuần {weeks}/40</strong></span>
                            <span className="percent-text">{progressPercent}% chặng đường</span>
                        </div>
                        <div className="timeline-track">
                            <div className="timeline-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="timeline-labels">
                            <span>Bắt đầu (W1)</span>
                            <span>Đón con yêu (W40)</span>
                        </div>
                    </div>
                </div>

                <div className="db-left-col">
                    {/* 2. CHỈ SỐ THAI KỲ - VITALS GRID */}
                    <div className="vitals-grid">
                        <div className="vital-box pink">
                            <div className="vital-label">Tuần thai</div>
                            <div className="vital-value">{weeks}w</div>
                        </div>
                        <div className="vital-box yellow">
                            <div className="vital-label">Kích thước bé</div>
                            <div className="vital-value">
                                {pregnancyInfo?.emoji} {pregnancyInfo?.size || '--'}
                            </div>
                        </div>
                        <div className="vital-box blue">
                            <div className="vital-label">Bé nặng</div>
                            <div className="vital-value">{pregnancyInfo ? pregnancyInfo.weight : '--'}</div>
                        </div>
                        <div className="vital-box red">
                            <div className="vital-label">Nhóm máu</div>
                            <div className="vital-value">{profile.bloodType || '--'}</div>
                        </div>
                    </div>

                    {/* 4. THEO DÕI SỨC KHỎE (LỊCH KHÁM & DINH DƯỠNG) */}
                    <div className="health-tracker-grid">
                        {/* THẺ LỊCH KHÁM THAI */}
                        <div className="health-card db-visits">
                            <h3 className="health-card-title">
                                <IoMedkitOutline style={{ color: '#ec4899' }} size={20} />
                                Khám thai & Chi phí
                            </h3>
                            
                            <div className="cost-wallet-card">
                                <div className="wallet-icon">
                                    <IoWalletOutline />
                                </div>
                                <div className="wallet-info">
                                    <span>Tổng chi phí đã chi</span>
                                    <strong>{formatVND(totalCost)}</strong>
                                </div>
                            </div>
                            
                            {nextAppt ? (
                                <div className="calendar-block-appt">
                                    <div className="mini-calendar-sheet">
                                        <div className="calendar-sheet-header">Lịch Hẹn</div>
                                        <div className="calendar-sheet-day">
                                            {new Date(nextAppt.nextDate).getDate()}
                                        </div>
                                    </div>
                                    <div className="appt-details">
                                        <span className="appt-title">Khám thai tiếp theo</span>
                                        <span className="appt-time">Tháng {new Date(nextAppt.nextDate).getMonth() + 1}</span>
                                        <span className="appt-clinic">{nextAppt.clinicName}</span>
                                    </div>
                                    <button 
                                        onClick={() => addToCalendar(nextAppt.nextDate, `Khám thai tại ${nextAppt.clinicName}`, nextAppt.clinicName)}
                                        className="btn-add-gcal"
                                        title="Thêm vào Google Lịch"
                                    >
                                        <IoLogoGoogle size={14} color="#ec4899" />
                                    </button>
                                </div>
                            ) : (
                                <Link 
                                    href="/admin/sokhambenh?action=add" 
                                    style={{ 
                                        background: 'rgba(16, 185, 129, 0.04)', 
                                        padding: '16px', 
                                        borderRadius: '18px', 
                                        border: '1px dashed #10b981', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        minHeight: '88px', 
                                        textDecoration: 'none' 
                                    }}
                                >
                                    <IoCalendarOutline size={22} color="#10b981" style={{ marginBottom: '6px' }} />
                                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>Thêm lịch hẹn mới</span>
                                </Link>
                            )}
                        </div>

                        {/* THẺ DINH DƯỠNG */}
                        <div className="health-card db-nutrition">
                            <h3 className="health-card-title">
                                <IoRestaurantOutline style={{ color: '#f97316' }} size={20} />
                                Dinh dưỡng mỗi ngày
                            </h3>
                            
                            {latestFood ? (
                                <div className="nutrition-latest-box">
                                    <div className="nutrition-icon">
                                        {latestFood.type === 'sang' ? '🌅' : latestFood.type === 'trua' ? '☀️' : latestFood.type === 'toi' ? '🌙' : '☕'}
                                    </div>
                                    <div className="nutrition-details">
                                        <span className="nutrition-title">Bữa ăn gần nhất</span>
                                        <strong className="nutrition-content">{latestFood.content}</strong>
                                        <span className="nutrition-meta">
                                            {latestFood.calories || 0} kcal • {latestFood.datetime ? latestFood.datetime.split('T')[1]?.substring(0, 5) : ''}
                                        </span>
                                    </div>
                                    <Link href="/admin/dinh-duong" className="btn-quick-add" title="Xem nhật ký ăn uống">
                                        <IoAddOutline size={20} />
                                    </Link>
                                </div>
                            ) : (
                                <Link 
                                    href="/admin/dinh-duong"
                                    style={{ 
                                        background: 'rgba(249, 115, 22, 0.04)', 
                                        padding: '16px', 
                                        borderRadius: '18px', 
                                        border: '1px dashed #f97316', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        minHeight: '88px', 
                                        textDecoration: 'none' 
                                    }}
                                >
                                    <IoRestaurantOutline size={22} color="#f97316" style={{ marginBottom: '6px' }} />
                                    <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 800 }}>Ghi nhận bữa ăn mới</span>
                                </Link>
                            )}
                            <p style={{ margin: '0', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.4 }}>
                                * Mẹ bầu nên bổ sung khoảng 2200 - 2500 kcal mỗi ngày để đảm bảo năng lượng cho bé.
                            </p>
                        </div>
                    </div>

                    {/* 6. NÚT GỌI KHẨN CẤP (SOS) */}
                    {profile.phoneHusband && (
                        <div className="db-sos">
                            <a href={`tel:${profile.phoneHusband}`} className="btn-sos fade-in">
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gọi Khẩn Cấp Cho Chồng</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '2px' }}>{profile.phoneHusband}</div>
                                </div>
                                <div className="sos-icon-box">
                                    <IoCall />
                                </div>
                            </a>
                        </div>
                    )}
                </div>

                <div className="db-right-col">
                    {/* 3. THÔNG TIN PHÁT TRIỂN CỦA BÉ HẰNG TUẦN */}
                    {pregnancyInfo && (
                        <div className="baby-growth-card fade-in">
                            <div className="growth-header">
                                <IoFlowerOutline className="spinning-flower" />
                                <h4>Mẹ & Bé Tuần {weeks}</h4>
                            </div>
                            <div className="growth-body">
                                {pregnancyInfo.baby && (
                                    <div className="info-sec">
                                        <span className="sec-title">👶 Em bé tuần này:</span>
                                        <p className="sec-content">{pregnancyInfo.baby}</p>
                                    </div>
                                )}
                                {pregnancyInfo.mom && (
                                    <div className="info-sec">
                                        <span className="sec-title">🤰 Cơ thể mẹ:</span>
                                        <p className="sec-content">{pregnancyInfo.mom}</p>
                                    </div>
                                )}
                                {pregnancyInfo.advice && (
                                    <div className="info-sec advice">
                                        <span className="sec-title">💝 Lời khuyên vàng:</span>
                                        <p className="sec-content">{pregnancyInfo.advice}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. TIỆN ÍCH & ỨNG DỤNG GRID */}
                    <div className="card db-utils">
                        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                            <IoAppsOutline style={{ color: '#6366f1' }} /> Các ứng dụng thai kỳ
                        </h3>
                        <div className="utilities-grid">
                            {visibleUtils.map(item => (
                                <Link 
                                    href={item.target} 
                                    key={item.id} 
                                    className={`util-item util-${item.id}`}
                                >
                                    <div className="util-icon-box" style={{ color: item.color, background: `${item.color}12` }}>
                                        {item.id === 'sokham' && <IoClipboardOutline />}
                                        {item.id === 'lichkham' && <IoCalendarOutline />}
                                        {item.id === 'dinhduong' && <IoRestaurantOutline />}
                                        {item.id === 'album' && <IoImagesOutline />}
                                        {item.id === 'chuanbi' && <IoBriefcaseOutline />}
                                        {item.id === 'note' && <IoBookOutline />}
                                        {item.id === 'thaigiao' && <IoMusicalNotesOutline />}
                                        {item.id === 'kiengky' && <IoShieldHalfOutline />}
                                    </div>
                                    <span className="util-label">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
