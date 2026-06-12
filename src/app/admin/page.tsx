'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDataForWeek, PregnancyWeekData } from '@/lib/data';
import { MENU_DEFS } from '@/components/Sidebar';
import { QUOTES } from '@/lib/quotes';
import Link from 'next/link';
import { 
    IoFlowerOutline, IoPerson, IoMedkitOutline, IoCalendarOutline, 
    IoRestaurantOutline, IoAddOutline, IoLogoGoogle, IoCall, IoAppsOutline,
    IoClipboardOutline, IoImagesOutline, IoBriefcaseOutline, IoBookOutline,
    IoMusicalNotesOutline, IoShieldHalfOutline, IoHeartOutline, IoSparklesOutline,
    IoTimeOutline, IoLocationOutline, IoWalletOutline, IoWaterOutline
} from 'react-icons/io5';

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>({});
    const [visits, setVisits] = useState<any[]>([]);
    const [latestFood, setLatestFood] = useState<any>(null);
    const [weeks, setWeeks] = useState(0);
    const [eddStr, setEddStr] = useState('--/--/----');
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyWeekData | null>(null);
    const [waterIntake, setWaterIntake] = useState(1000);
    const [randomQuote, setRandomQuote] = useState('');
    const [showQuoteToast, setShowQuoteToast] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    useEffect(() => {
        const index = Math.floor(Math.random() * QUOTES.length);
        setRandomQuote(QUOTES[index]);
        setShowQuoteToast(true);

        const timer = setTimeout(() => {
            setShowQuoteToast(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('water_intake_today');
        const savedDate = localStorage.getItem('water_intake_date');
        const today = new Date().toDateString();
        if (savedDate === today && saved) {
            setWaterIntake(parseInt(saved, 10));
        } else {
            setWaterIntake(0);
            localStorage.setItem('water_intake_today', '0');
            localStorage.setItem('water_intake_date', today);
        }
    }, []);

    const addWater = () => {
        setWaterIntake(prev => {
            const val = Math.min(prev + 250, 3000);
            localStorage.setItem('water_intake_today', val.toString());
            return val;
        });
    };

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
                    today.setHours(0, 0, 0, 0);
                    
                    let computedWeeks = Math.floor((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    if (computedWeeks < 0) computedWeeks = 0;
                    if (computedWeeks > 40) computedWeeks = 40;
                    setWeeks(computedWeeks);

                    const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
                    setEddStr(`${eddDate.getDate()}/${eddDate.getMonth() + 1}/${eddDate.getFullYear()}`);
                    
                    // Tính số ngày còn lại đến dự sinh
                    const eddMidnight = new Date(eddDate.getFullYear(), eddDate.getMonth(), eddDate.getDate());
                    const timeDiff = eddMidnight.getTime() - today.getTime();
                    let computedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    if (computedDays < 0) computedDays = 0;
                    setDaysLeft(computedDays);
                    
                    // Lấy thông tin y khoa của tuần thai
                    setPregnancyInfo(getDataForWeek(computedWeeks));
                } else {
                    setWeeks(0);
                    setEddStr('--/--/----');
                    setDaysLeft(null);
                    setPregnancyInfo(getDataForWeek(0));
                }
            } else {
                setWeeks(0);
                setEddStr('--/--/----');
                setDaysLeft(null);
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
        // Đẩy trạng thái giả lập vào stack lịch sử để "chặn" nút back
        window.history.pushState({ page: 'home-guard' }, '', window.location.href);

        const handlePopState = (e: PopStateEvent) => {
            // Khi người dùng bấm back ở trang chủ → hiện custom exit dialog
            setShowExitDialog(true);
            // Đẩy lại state giả lập để giữ nguyên URL (không bị back thật)
            window.history.pushState({ page: 'home-guard' }, '', window.location.href);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleExitApp = () => {
        setShowExitDialog(false);
        // Thử đóng tab (hoạt động khi mở từ PWA hoặc tab mới)
        window.close();
        // Fallback: về trang trắng nếu không đóng được
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 200);
    };

    const handleStayInApp = () => {
        setShowExitDialog(false);
    };

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

    // Tính cân nặng mẹ bầu tăng từ lúc trước bầu
    const getMaternalWeightGain = () => {
        const wBefore = Number(profile.weightBefore) || 0;
        if (wBefore <= 0) return null;
        
        const activeVisits = visits.filter(v => !v.deletedAt && Number(v.weight) > 0);
        if (activeVisits.length === 0) return null;
        
        const sorted = [...activeVisits].sort((a, b) => a.date.localeCompare(b.date));
        const latestWeight = Number(sorted[sorted.length - 1].weight) || 0;
        if (latestWeight <= 0) return null;
        
        const gain = latestWeight - wBefore;
        return {
            latestWeight,
            gain: gain > 0 ? `+${gain.toFixed(1)}` : `${gain.toFixed(1)}`
        };
    };
    const weightGainInfo = getMaternalWeightGain();

    const getTrimester = (w: number) => {
        if (w <= 13) return "TCN 1";
        if (w <= 27) return "TCN 2";
        return "TCN 3";
    };

    return (
        <>
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
                @keyframes pulse-heart {
                    0% { transform: scale(1); }
                    14% { transform: scale(1.12); }
                    28% { transform: scale(1); }
                    42% { transform: scale(1.12); }
                    70% { transform: scale(1); }
                }
                @keyframes pulse-sparkles {
                    0% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.08) rotate(15deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .pulse-heart {
                    display: inline-block;
                    animation: pulse-heart 2.5s infinite;
                }
                .pulse-sparkles {
                    display: inline-block;
                    animation: pulse-sparkles 3s ease-in-out infinite;
                }
                :global(.quote-toast) {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    max-width: 360px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(236, 72, 153, 0.25);
                    border-radius: 20px;
                    padding: 16px 20px 16px 16px;
                    box-shadow: 0 12px 40px rgba(236, 72, 153, 0.15);
                    z-index: 9999;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    
                    opacity: 0;
                    transform: translateY(40px) scale(0.95);
                    pointer-events: none;
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                :global(.quote-toast.show) {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: all;
                }
                @media (max-width: 600px) {
                    :global(.quote-toast) {
                        bottom: 16px;
                        left: 16px;
                        right: 16px;
                        max-width: none;
                        transform: translateY(40px) scale(0.95);
                    }
                    :global(.quote-toast.show) {
                        transform: translateY(0) scale(1);
                    }
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
                /* override globals.css .card margin to align perfectly at the bottom */
                .card.db-utils {
                    margin-bottom: 0 !important;
                }
                /* Giữ icons căn từ đầu, không bị giãn đều khi card flex-grow */
                .card.db-utils .utilities-grid {
                    align-content: flex-start;
                }
                
                @media (max-width: 1023px) {
                    .dashboard-flex-layout {
                        padding-bottom: 0px;
                    }
                    .db-left-col, .db-right-col {
                        display: contents;
                    }
                    .db-hero { order: 1; }
                    .vitals-grid { order: 2; }
                    .baby-growth-card { order: 3; }
                    .health-tracker-grid { order: 4; }
                    .db-utils { order: 5; display: none !important; }
                    .db-sos { order: 6; }

                    /* Tránh đè nút 3 gạch trôi nổi trên mobile */
                    .hero-welcome-text {
                        padding-left: 32px;
                    }
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
                    width: 88px; 
                    height: 88px; 
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
                    font-weight: 700;
                }
                .percent-text {
                    color: #8b5cf6;
                    font-weight: 700;
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
                .health-card.vitals-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    z-index: 2;
                }
                .vitals-grid-inner {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 16px;
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
                    font-weight: 600; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                }
                .vital-value { 
                    font-size: 1.15rem; 
                    font-weight: 500; 
                    line-height: 1.25; 
                }
                .vital-box.pink { background: #fff5f7; border-color: #ffe4e6; }
                .vital-box.yellow { background: #fffbeb; border-color: #fef3c7; }
                .vital-box.blue { background: #f0f9ff; border-color: #e0f2fe; }
                .vital-box.red { background: #fef2f2; border-color: #fee2e2; }
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
                    font-weight: 700;
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
                    font-weight: 700;
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
                .health-card.health-tracker-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    gap: 20px 28px;
                }
                .health-card.health-tracker-grid h3 {
                    grid-column: span 2;
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
                    font-weight: 700;
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
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .wallet-info strong {
                    font-size: 1.05rem;
                    font-weight: 800;
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
                    padding-right: 24px;
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
                    font-weight: 500;
                    text-transform: uppercase;
                }
                .nutrition-content {
                    font-size: 0.9rem;
                    font-weight: 400;
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
                    gap: 20px 16px; 
                    margin-top: 12px; 
                    flex-grow: 1;
                }
                .util-item { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center;
                    text-decoration: none; 
                    cursor: pointer; 
                    background: rgba(248, 250, 252, 0.45);
                    border: 1px solid rgba(241, 245, 249, 0.75);
                    padding: 22px 8px;
                    border-radius: 24px;
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
                    font-weight: 400; 
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
                    .health-card.health-tracker-grid {
                        grid-template-columns: minmax(0, 1fr);
                        gap: 24px;
                    }
                    .health-card.health-tracker-grid h3 {
                        grid-column: span 1;
                    }
                    .vitals-grid-inner { 
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
                <div className="hero-profile fade-in db-hero" style={{ padding: '20px', borderRadius: '24px' }}>
                    
                    <div className="hero-top-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
                        <div className="hero-welcome-text" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="mother-name" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.15 }}>
                                {profile.name || auth.currentUser?.displayName || 'Mẹ bầu xinh đẹp'}
                            </div>
                            
                            {/* Dòng thông tin phụ gọn gàng */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '0.8rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                                <span>Dự sinh: <strong style={{ color: '#ec4899' }}>{eddStr}</strong></span>
                                {profile.bloodType && (
                                    <>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <span>Máu: <strong style={{ color: '#ef4444' }}>{profile.bloodType}</strong></span>
                                    </>
                                )}
                                {hasAllergy && (
                                    <>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <span style={{ color: '#b91c1c' }}>⚠️ Dị ứng: {profile.allergy}</span>
                                    </>
                                )}
                            </div>
                            
                            {/* Nút gọi khẩn cấp gọn gàng gần avatar */}
                            {profile.phoneHusband && (
                                <a href={`tel:${profile.phoneHusband}`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', 
                                    color: '#e11d48', padding: '6px 14px 6px 8px',
                                    borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800,
                                    border: '1px solid #fecdd3', width: 'fit-content',
                                    marginTop: '8px', textDecoration: 'none',
                                    boxShadow: '0 4px 10px rgba(225, 29, 72, 0.1)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{
                                        background: '#e11d48', color: 'white', 
                                        width: '26px', height: '26px', borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <IoCall size={14} style={{ animation: 'pulse-icon 2s infinite' }} />
                                    </div>
                                    Gọi chồng
                                </a>
                            )}
                        </div>
                        
                        {/* Khung chứa ảnh đại diện kèm họa tiết bông hoa ôm quanh */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '130px', height: '130px' }}>
                            {/* Bông hoa hồng ôm trọn phía sau */}
                            <IoFlowerOutline 
                                style={{ 
                                    position: 'absolute', 
                                    color: '#fbcfe8', 
                                    fontSize: '130px', 
                                    opacity: 0.9,
                                    pointerEvents: 'none',
                                    animation: 'pulse-icon 4s ease-in-out infinite'
                                }} 
                            />
                            
                            <div 
                                className="avatar-box" 
                                style={{ 
                                    width: '96px', 
                                    height: '96px', 
                                    borderRadius: '50%', 
                                    border: '3px solid white', 
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)', 
                                    overflow: 'hidden', 
                                    position: 'relative',
                                    zIndex: 2,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseOver={(e) => {
                                    if (profile.avatar) e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                    if (profile.avatar) e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff5f7 0%, #f5f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                                        <IoPerson size={36} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Tiến trình thai kỳ rút gọn sạch sẽ */}
                    <div className="pregnancy-timeline-container" style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
                        <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem' }}>
                            <div>
                                <strong>Tuần {weeks}/40</strong> 
                                <span style={{ fontSize: '0.7rem', background: '#f5f3ff', color: '#8b5cf6', padding: '2px 8px', borderRadius: '8px', marginLeft: '6px', border: '1px solid #ddd6fe', fontWeight: 700 }}>{getTrimester(weeks)}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#ec4899' }}>{progressPercent}% chặng đường</span>
                        </div>
                        <div className="timeline-track" style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div className="timeline-fill" style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)', borderRadius: '999px', transition: 'width 1s ease-out' }}></div>
                        </div>
                    </div>
                </div>

                <div className="db-left-col">
                    {/* 2. CHỈ SỐ THAI KỲ - VITALS CARD */}
                    <div className="health-card vitals-grid">
                        <h3 className="health-card-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '8px' }}>
                            <IoSparklesOutline style={{ color: '#f59e0b' }} size={22} className="pulse-sparkles" />
                            Chỉ số thai kỳ
                        </h3>
                        
                        <div className="vitals-grid-inner">
                            <div className="vital-box pink">
                                <div className="vital-label">Đếm ngược</div>
                                <div className="vital-value" style={{ color: '#ec4899' }}>{daysLeft !== null ? `Còn ${daysLeft} ngày` : '--'}</div>
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
                                <div className="vital-label">Mẹ tăng cân</div>
                                <div className="vital-value" style={{ color: '#ef4444' }}>
                                    {weightGainInfo ? `${weightGainInfo.gain} kg` : '--'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. THEO DÕI SỨC KHỎE (LỊCH KHÁM & DINH DƯỠNG) */}
                    <div className="health-card health-tracker-grid">
                        <h3 className="health-card-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '8px' }}>
                            <IoHeartOutline style={{ color: '#ec4899' }} size={22} className="pulse-heart" />
                            Theo dõi sức khỏe
                        </h3>

                        {/* THẺ LỊCH KHÁM THAI */}
                        <div className="db-visits" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoMedkitOutline style={{ color: '#ec4899' }} size={18} />
                                Khám thai & Chi phí
                            </h4>
                            
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
                                        <span className="appt-time">
                                            Ngày {nextAppt.nextDate.split('-')[2]}/{nextAppt.nextDate.split('-')[1]}/{nextAppt.nextDate.split('-')[0]}
                                        </span>
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
                        <div className="db-nutrition" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoRestaurantOutline style={{ color: '#f97316' }} size={18} />
                                Dinh dưỡng mỗi ngày
                            </h4>
                            
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
                                    <Link href="/admin/dinh-duong?tab=diary" className="btn-quick-add" title="Xem nhật ký ăn uống">
                                        <IoAddOutline size={20} />
                                    </Link>
                                </div>
                            ) : (
                                <Link 
                                    href="/admin/dinh-duong?tab=diary"
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

                            {/* NƯỚC UỐNG HÀNG NGÀY */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #bae6fd',
                                padding: '14px 16px',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#0284c7',
                                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.1)',
                                    fontSize: '1.3rem',
                                    flexShrink: 0
                                }}>
                                    <IoWaterOutline />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '4px' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 500, textTransform: 'uppercase' }}>Theo dõi nước uống</span>
                                    <strong style={{ fontSize: '0.9rem', color: '#0c4a6e', fontWeight: 400 }}>Đã uống: {waterIntake}/2000 ml</strong>
                                    <div style={{ width: '100%', height: '6px', background: 'white', borderRadius: '99px', overflow: 'hidden', border: '1px solid #bae6fd' }}>
                                        <div style={{ width: `${Math.min((waterIntake / 2000) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                                <button 
                                    onClick={addWater}
                                    style={{
                                        border: 'none',
                                        background: 'white',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#0284c7',
                                        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        flexShrink: 0
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#0284c7';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = '#0284c7';
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Nút SOS đã được dời lên phần Hero Profile */}
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
                    <div className="card db-utils" style={{ display: 'flex', flexDirection: 'column' }}>
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

        {/* ===== EXIT APP CONFIRMATION DIALOG ===== */}
        {showExitDialog && (
            <div
                onClick={handleStayInApp}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    animation: 'fadeInOverlay 0.2s ease-out',
                }}
            >
                <style jsx>{`
                    @keyframes fadeInOverlay {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUpDialog {
                        from { opacity: 0; transform: translateY(24px) scale(0.96); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '28px',
                        padding: '32px 28px 24px',
                        maxWidth: '340px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                        animation: 'slideUpDialog 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Gradient top accent */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                    }} />

                    {/* Icon */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fff1f2, #fce7f3)',
                        border: '2px solid #ffe4e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        fontSize: '2rem',
                    }}>
                        🌸
                    </div>

                    {/* Title */}
                    <h3 style={{
                        margin: '0 0 10px',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#1e293b',
                    }}>
                        Thoát ứng dụng?
                    </h3>

                    {/* Message */}
                    <p style={{
                        margin: '0 0 28px',
                        fontSize: '0.88rem',
                        color: '#64748b',
                        lineHeight: 1.6,
                        fontWeight: 500,
                    }}>
                        Bạn có muốn thoát khỏi <strong style={{ color: '#ec4899' }}>ThaiKyPro</strong> không? Mọi dữ liệu đã được lưu tự động. 💕
                    </p>

                    {/* Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                    }}>
                        <button
                            onClick={handleStayInApp}
                            style={{
                                flex: 1,
                                padding: '13px',
                                borderRadius: '14px',
                                border: '1.5px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#475569',
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            Ở lại 💪
                        </button>
                        <button
                            onClick={handleExitApp}
                            style={{
                                flex: 1,
                                padding: '13px',
                                borderRadius: '14px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                color: 'white',
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Thoát
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Custom Toast Notification for Daily Quote */}
        {randomQuote && (
            <div className={`quote-toast ${showQuoteToast ? 'show' : ''}`}>
                <span style={{ fontSize: '1.4rem', animation: 'pulse-icon 3s infinite', display: 'inline-block', flexShrink: 0 }}>✨</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#ec4899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Cảm hứng mỗi ngày • {getGreeting()}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.45 }}>
                        "{randomQuote}"
                    </p>
                </div>
                <button 
                    onClick={() => setShowQuoteToast(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '1.3rem',
                        lineHeight: 1,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '8px',
                        marginTop: '-2px',
                        flexShrink: 0,
                        transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#e11d48'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                    ×
                </button>
            </div>
        )}
    </>
);
}
