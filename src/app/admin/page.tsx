'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDataForWeek, PregnancyWeekData } from '@/lib/data';

import { QUOTES } from '@/lib/quotes';
import Link from 'next/link';
import { 
    IoFlowerOutline, IoPerson, IoCalendarOutline, 
    IoRestaurantOutline, IoAddOutline, IoLogoGoogle, IoCall,
    IoHeartOutline, IoSparklesOutline,
    IoWalletOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline
} from 'react-icons/io5';

const getTimeMillis = (value: any) => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = new Date(value).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value.seconds === 'number') {
        return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
    }
    return 0;
};

const pickLatestMeal = (meals: any[]) => {
    return [...meals].sort((a, b) => {
        const byMealTime = (b.datetime || '').localeCompare(a.datetime || '');
        if (byMealTime !== 0) return byMealTime;
        return getTimeMillis(b.timestamp) - getTimeMillis(a.timestamp);
    })[0] || null;
};

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>({});
    const [visits, setVisits] = useState<any[]>([]);
    const [latestFood, setLatestFood] = useState<any>(null);
    const [financeTxs, setFinanceTxs] = useState<any[]>([]);
    const [weeks, setWeeks] = useState(0);
    const [eddStr, setEddStr] = useState('--/--/----');
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyWeekData | null>(null);

    const [randomQuote, setRandomQuote] = useState('');
    const [showQuoteToast, setShowQuoteToast] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [latestBP, setLatestBP] = useState<any>(null);
    const [latestBS, setLatestBS] = useState<any>(null);
    const [latestKick, setLatestKick] = useState<any>(null);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastShown = localStorage.getItem('last_quote_shown_date');
        
        if (lastShown !== today) {
            const index = Math.floor(Math.random() * QUOTES.length);
            setRandomQuote(QUOTES[index]);
            setShowQuoteToast(true);
            localStorage.setItem('last_quote_shown_date', today);

            const timer = setTimeout(() => {
                setShowQuoteToast(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, []);



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

        // 3. Lắng nghe bữa ăn gần nhất theo giờ ăn giống tab Nhật ký dinh dưỡng.
        const qFood = query(collection(db, "users", user.uid, "nutrition_diary"), orderBy("datetime", "desc"), limit(20));
        const unsubFood = onSnapshot(qFood, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setLatestFood(pickLatestMeal(list));
        });

        // 4. Lắng nghe Giao dịch tài chính thai sản
        const qFinance = query(collection(db, "users", user.uid, "maternity_finance"));
        const unsubFinance = onSnapshot(qFinance, (snapshot) => {
            const list = snapshot.docs.map(doc => doc.data());
            setFinanceTxs(list);
        });

        // 5. Lắng nghe Vitals gần nhất (Huyết áp & Đường huyết)
        const qVitals = query(collection(db, "users", user.uid, "health_vitals"), orderBy("datetime", "desc"));
        const unsubVitals = onSnapshot(qVitals, (snapshot) => {
            const list = snapshot.docs.map(doc => doc.data());
            const bp = list.find(v => v.type === 'bp');
            const bs = list.find(v => v.type === 'bs');
            setLatestBP(bp || null);
            setLatestBS(bs || null);
        });

        // 6. Lắng nghe Lịch sử đếm cử động thai gần nhất
        const qKicks = query(collection(db, "users", user.uid, "baby_kicks"), orderBy("startTime", "desc"), limit(1));
        const unsubKicks = onSnapshot(qKicks, (snapshot) => {
            if (!snapshot.empty) {
                setLatestKick(snapshot.docs[0].data());
            } else {
                setLatestKick(null);
            }
        });

        return () => {
            unsubProfile();
            unsubVisits();
            unsubFood();
            unsubFinance();
            unsubVitals();
            unsubKicks();
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
        
        // 1. Kiểm tra cầu nối Javascript (JS Bridge) phổ biến của Android WebView
        const android = (window as any).Android || (window as any).AndroidInterface || (window as any).JSInterface;
        if (android && typeof android.exitApp === 'function') {
            android.exitApp();
            return;
        }
        
        // 2. Kiểm tra Cordova / PhoneGap app exit
        const nav = navigator as any;
        if (nav.app && typeof nav.app.exitApp === 'function') {
            nav.app.exitApp();
            return;
        }

        // 3. Thử đóng tab bằng window.close
        window.close();

        // 4. Nếu không phải môi trường app WebView/PWA mà chạy trên trình duyệt thường,
        // quay về trang Landing chủ thay vì bị kẹt lại trang trắng about:blank
        setTimeout(() => {
            window.location.href = '/';
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
                .db-body-columns {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .db-left-col, .db-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                @media (max-width: 1023px) {
                    .dashboard-flex-layout {
                        padding-bottom: 0px;
                    }
                    .db-left-col, .db-right-col {
                        display: contents;
                    }

                    /* Tránh đè nút 3 gạch trôi nổi trên mobile */
                    .hero-welcome-text {
                        padding-left: 32px;
                    }
                }

                /* 1. HERO PROFILE CARD */
                .hero-profile { 
                    background:
                        linear-gradient(135deg, #fff7fb 0%, #ffffff 46%, #fdf2f8 100%); 
                    border: 1px solid rgba(251, 207, 232, 0.68); 
                    box-shadow: 0 18px 42px rgba(236, 72, 153, 0.08); 
                    border-radius: 32px; 
                    position: relative; 
                    overflow: hidden; 
                    padding: 32px 24px; 
                }
                .hero-profile::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background-image:
                        repeating-linear-gradient(45deg, transparent 0 18px, rgba(244, 114, 182, 0.08) 19px, transparent 21px),
                        repeating-linear-gradient(-45deg, transparent 0 26px, rgba(251, 207, 232, 0.42) 27px, transparent 29px);
                    opacity: 0.5;
                    pointer-events: none;
                }
                .hero-profile::after {
                    content: "✿";
                    position: absolute;
                    right: 22px;
                    top: 18px;
                    color: rgba(236, 72, 153, 0.13);
                    font-size: 86px;
                    line-height: 1;
                    transform: rotate(-14deg);
                    pointer-events: none;
                }
                .hero-bg-icon { 
                    position: absolute; 
                    top: -20px; 
                    right: -20px; 
                    opacity: 0.05; 
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
                    width: 96px; 
                    height: 96px; 
                    border-radius: 32px; 
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06); 
                    border: 4px solid #ffffff; 
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
                    font-size: 0.95rem;
                    color: #64748b;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                }
                .mother-name { 
                    font-size: 1.65rem; 
                    font-weight: 900; 
                    color: #0f172a; 
                    line-height: 1.2; 
                    letter-spacing: -0.5px;
                }
                .edd-text { 
                    font-size: 0.95rem; 
                    color: #64748b; 
                    font-weight: 600; 
                }
                .edd-date { 
                    color: #0f172a; 
                    font-weight: 800; 
                    background: #f1f5f9;
                    padding: 4px 10px;
                    border-radius: 12px;
                }
                .allergy-badge { 
                    background: #fef2f2; 
                    color: #b91c1c; 
                    padding: 10px 16px; 
                    border-radius: 20px; 
                    font-size: 0.85rem; 
                    font-weight: 700; 
                    margin-top: 18px; 
                    display: flex; 
                    align-items: center; 
                    gap: 8px; 
                    position: relative; 
                    z-index: 2; 
                    border: 1px solid #fee2e2;
                    align-self: flex-start;
                }

                /* Timeline progress design */
                .pregnancy-timeline-container {
                    margin-top: 28px;
                    position: relative;
                    z-index: 2;
                    background: rgba(255, 255, 255, 0.66);
                    padding: 20px;
                    border-radius: 24px;
                    border: 1px solid rgba(251, 207, 232, 0.5);
                    box-shadow: 0 10px 24px rgba(236, 72, 153, 0.06);
                }
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    color: #475569;
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                .timeline-header strong {
                    color: #0f172a;
                    font-size: 1.05rem;
                }
                .percent-text {
                    color: #0ea5e9;
                    font-weight: 800;
                }
                .timeline-track {
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                }
                .timeline-fill {
                    height: 100%;
                    background: #0ea5e9;
                    border-radius: 999px;
                    transition: width 1s ease-out;
                }
                .timeline-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin-top: 8px;
                    font-weight: 800;
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
                    background: #f8fafc; 
                    border-radius: 24px; 
                    padding: 20px 12px; 
                    text-align: center; 
                    border: 1px solid transparent; 
                    box-shadow: none;
                    transition: all 0.3s ease;
                    min-width: 0;
                }
                .vital-box:hover {
                    transform: translateY(-2px);
                    background: #ffffff;
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
                    border-color: #f1f5f9;
                }
                .vital-label { 
                    font-size: 0.75rem; 
                    color: #64748b; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                .vital-value { 
                    font-size: 1.35rem; 
                    font-weight: 800; 
                    line-height: 1.25; 
                    letter-spacing: -0.5px;
                }
                .vital-box.pink { background: #fff1f2; }
                .vital-box.yellow { background: #fffbeb; }
                .vital-box.blue { background: #f0f9ff; }
                .vital-box.red { background: #fef2f2; }
                .vital-box.pink .vital-value { color: #be185d; }
                .vital-box.yellow .vital-value { color: #b45309; }
                .vital-box.blue .vital-value { color: #0369a1; }
                .vital-box.red .vital-value { color: #b91c1c; }

                /* 3. BABY & MOM ADVICE BOX */
                .baby-growth-card {
                    background: white;
                    border-radius: 32px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04);
                    padding: 28px;
                    position: relative;
                    overflow: hidden;
                }
                .growth-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .spinning-flower {
                    color: #0ea5e9;
                    font-size: 1.6rem;
                }
                .growth-header h4 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.3px;
                }
                .growth-body {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .info-sec {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .sec-title {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .sec-content {
                    font-size: 0.95rem;
                    color: #334155;
                    line-height: 1.6;
                    margin: 0;
                }
                .info-sec.advice {
                    background: #f0fdfa;
                    padding: 16px 20px;
                    border-radius: 20px;
                }
                .info-sec.advice .sec-title {
                    color: #0d9488;
                }
                .info-sec.advice .sec-content {
                    color: #0f766e;
                    font-weight: 500;
                }

                .health-card {
                    background: white;
                    border-radius: 32px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.04);
                    padding: 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    min-width: 0;
                }
                /* 4. HEALTH TRACKER GRID - must come after .health-card base */
                .health-card.health-tracker-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 24px;
                }
                .health-card.health-tracker-grid h3 {
                    grid-column: span 1;
                }
                .health-card-title {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 800;
                    letter-spacing: -0.3px;
                }
                .cost-wallet-card {
                    background: #f0fdf4;
                    padding: 20px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .wallet-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 18px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #16a34a;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .wallet-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .wallet-info span {
                    font-size: 0.75rem;
                    color: #15803d;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .wallet-info strong {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #14532d;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Calendar Block UI */
                .calendar-block-appt {
                    background: #fff1f2;
                    border-radius: 24px;
                    padding: 20px;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    position: relative;
                }
                .mini-calendar-sheet {
                    width: 56px;
                    height: 64px;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    text-align: center;
                }
                .calendar-sheet-header {
                    background: #e11d48;
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 800;
                    padding: 4px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .calendar-sheet-day {
                    font-size: 1.4rem;
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
                    gap: 4px;
                    padding-right: 28px;
                }
                .appt-title {
                    font-size: 0.75rem;
                    color: #9f1239;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .appt-time {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #0f172a;
                }
                .appt-clinic {
                    font-size: 0.85rem;
                    color: #475569;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .btn-add-gcal {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    border: none; 
                    background: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    width: 32px;
                    height: 32px;
                    border-radius: 50%; 
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-add-gcal:hover {
                    transform: scale(1.1);
                }

                /* Nutrition Tracker Card */
                .nutrition-latest-box {
                    background: #fffbeb;
                    padding: 20px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: relative;
                }
                .nutrition-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 18px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .nutrition-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    padding-right: 48px;
                }
                .nutrition-title {
                    font-size: 0.75rem;
                    color: #b45309;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .nutrition-content {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #7c2d12;
                    margin-top: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .nutrition-meta {
                    font-size: 0.85rem;
                    color: #d97706;
                    font-weight: 600;
                    margin-top: 4px;
                }
                .btn-quick-add {
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #f97316;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-quick-add:hover {
                    transform: translateY(-50%) scale(1.08);
                    background: #f97316;
                    color: white;
                }



                /* 6. SOS EMERGENCY */
                .btn-sos { 
                    background: #ef4444; 
                    color: white; 
                    padding: 20px 24px; 
                    border-radius: 24px; 
                    text-decoration: none; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    animation: pulse-sos 2.5s infinite;
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
                    .vitals-grid-inner { 
                        grid-template-columns: repeat(2, minmax(0, 1fr)); 
                        gap: 12px; 
                    }
                }

            `}</style>

            {/* Warning Banner for Preeclampsia BP */}
            {latestBP && (latestBP.systolic >= 140 || latestBP.diastolic >= 90) && (
                <div style={{
                    background: 'linear-gradient(135deg, #be185d 0%, #ef4444 100%)',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: '24px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
                    animation: 'pulse-sos 2.5s infinite'
                }}>
                    <IoWarningOutline size={28} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '2px' }}>🚨 Cảnh báo Huyết áp cao!</strong>
                        <span style={{ fontSize: '0.8rem', opacity: 0.95, lineHeight: 1.45, display: 'block' }}>
                            Chỉ số huyết áp gần nhất đo lúc {latestBP.datetime.replace('T', ' ')} là <strong>{latestBP.systolic}/{latestBP.diastolic} mmHg</strong>. Đây là mức nguy cơ Tiền Sản Giật. Vui lòng nghỉ ngơi và liên hệ ngay với người thân hoặc bác sĩ khám thai!
                        </span>
                    </div>
                    <Link href="/admin/canh-bao" style={{ background: 'white', color: '#b91c1c', padding: '8px 16px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        Xem liên hệ
                    </Link>
                </div>
            )}

            <div className="dashboard-flex-layout">
                {/* 1. HỒ SƠ MẸ BẦU (HERO CARD) */}
                <div className="hero-profile fade-in db-hero">
                    
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
                            {/* Nút gọi khẩn cấp & cảnh báo đỏ gọn gàng */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {profile.phoneHusband && (
                                    <a href={`tel:${profile.phoneHusband}`} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', 
                                        color: '#e11d48', padding: '6px 14px 6px 8px',
                                        borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800,
                                        border: '1px solid #fecdd3', width: 'fit-content',
                                        textDecoration: 'none',
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
                                <Link href="/admin/canh-bao" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                                    color: '#dc2626', padding: '6px 14px 6px 8px',
                                    borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800,
                                    border: '1px solid #fecdd3', width: 'fit-content',
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.1)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{
                                        background: '#dc2626', color: 'white', 
                                        width: '26px', height: '26px', borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <IoWarningOutline size={14} />
                                    </div>
                                    Cảnh báo đỏ
                                </Link>
                            </div>
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
                                    position: 'relative',
                                    zIndex: 2
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

                <div className="db-body-columns">
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
                            <Link href="/admin/sokhambenh" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="cost-wallet-card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div className="wallet-icon">
                                        <IoWalletOutline />
                                    </div>
                                    <div className="wallet-info">
                                        <span>Tổng chi phí đã chi</span>
                                        <strong>{formatVND(totalCost)}</strong>
                                    </div>
                                </div>
                            </Link>
                            
                            <Link href="/admin/tai-chinh" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="cost-wallet-card" style={{ marginTop: '-4px', background: 'linear-gradient(135deg, #fffbeb 0%, #ffedd5 100%)', border: '1px solid #fed7aa', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div className="wallet-icon" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)', color: 'white', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)' }}>
                                        <IoWalletOutline />
                                    </div>
                                    <div className="wallet-info">
                                        <span style={{ color: '#b45309' }}>Tổng chi tiêu sắm đồ</span>
                                        <strong style={{ color: '#9a3412', fontSize: '1.15rem' }}>
                                            {formatVND(financeTxs.filter(t => t.type !== 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
                                        </strong>
                                    </div>
                                </div>
                            </Link>

                            {nextAppt ? (
                                <Link href="/admin/sokhambenh" style={{ textDecoration: 'none', display: 'block' }}>
                                    <div className="calendar-block-appt" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
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
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCalendar(nextAppt.nextDate, `Khám thai tại ${nextAppt.clinicName}`, nextAppt.clinicName); }}
                                            className="btn-add-gcal"
                                            title="Thêm vào Google Lịch"
                                        >
                                            <IoLogoGoogle size={14} color="#ec4899" />
                                        </button>
                                    </div>
                                </Link>
                            ) : (
                                <Link 
                                    href="/admin/sokhambenh?action=add" 
                                    replace 
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* THẺ DINH DƯỠNG */}
                        <div className="db-nutrition" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                    <Link href="/admin/dinh-duong?tab=diary" replace className="btn-quick-add" title="Xem nhật ký ăn uống">
                                        <IoAddOutline size={20} />
                                    </Link>
                                </div>
                            ) : (
                                <Link 
                                    href="/admin/dinh-duong?tab=diary"
                                    replace
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
                        </div>

                        {/* THẺ HUYẾT ÁP & ĐƯỜNG HUYẾT */}
                        <div className="db-vitals-log" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            

                            <Link href="/admin/suc-khoe" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="cost-wallet-card" style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '1px solid #a5f3fc', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div className="wallet-icon" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', color: 'white', boxShadow: '0 4px 10px rgba(6, 182, 212, 0.2)' }}>
                                        <IoPulseOutline />
                                    </div>
                                    <div className="wallet-info">
                                        <span style={{ color: '#0891b2' }}>Huyết áp gần nhất</span>
                                        <strong style={{ color: '#0f766e', fontSize: '1.05rem' }}>
                                            {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : 'Chưa ghi nhận'}
                                        </strong>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/suc-khoe" style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="cost-wallet-card" style={{ marginTop: '-4px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div className="wallet-icon" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                                        <IoSparklesOutline />
                                    </div>
                                    <div className="wallet-info">
                                        <span style={{ color: '#059669' }}>Đường huyết gần nhất</span>
                                        <strong style={{ color: '#14532d', fontSize: '1.05rem' }}>
                                            {latestBS ? `${latestBS.bloodSugar} mmol/L` : 'Chưa ghi nhận'}
                                        </strong>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        </div>
                    </div>

                </div>{/* end db-left-col */}

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






                </div>{/* end db-right-col */}
                </div>{/* end db-body-columns */}
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
