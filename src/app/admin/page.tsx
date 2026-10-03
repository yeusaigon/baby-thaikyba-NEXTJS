'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { getDataForWeek, PregnancyWeekData } from '@/lib/data';
import { computeBabyAgeDetails, getMilestoneForAge, BABY_MILESTONES, BabyMilestone } from '@/lib/babyMilestones';
import { DEFAULT_VACCINES } from '@/app/admin/tiem-chung/page';

import { QUOTES } from '@/lib/quotes';
import Link from 'next/link';
import { 
    IoPerson, IoCalendarOutline, 
    IoRestaurantOutline, IoAddOutline, IoLogoGoogle, IoCall,
    IoHeartOutline, IoSparklesOutline,
    IoWalletOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline, IoCloseOutline, IoSettingsOutline,
    IoTimeOutline, IoWaterOutline, IoCafeOutline, IoMoonOutline, IoScaleOutline, IoTrendingUpOutline,
    IoChevronBackOutline, IoChevronForwardOutline, IoFlowerOutline, IoMedicalOutline, IoShieldCheckmarkOutline
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
    const [latestBP, setLatestBP] = useState<any>(null);
    const [latestBS, setLatestBS] = useState<any>(null);
    const [latestKick, setLatestKick] = useState<any>(null);

    // Postpartum / Nuôi con States
    const [babyJournalToday, setBabyJournalToday] = useState<{
        breastMins: number;
        bottleMl: number;
        wetDiapers: number;
        dirtyDiapers: number;
        sleepHours: string;
    }>({ breastMins: 0, bottleMl: 0, wetDiapers: 0, dirtyDiapers: 0, sleepHours: '0.0' });
    const [latestGrowth, setLatestGrowth] = useState<any>(null);
    const [immunizations, setImmunizations] = useState<any[]>([]);
    const [activeMilestoneMonth, setActiveMilestoneMonth] = useState<number>(0);

    // PWA Install States
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Detect Standalone (already installed/running as PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone 
            || document.referrer.includes('android-app://');
        setIsAppInstalled(isStandalone);

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            const dismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';
            if (!isStandalone && !dismissed) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        const dismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';
        if (isIOSDevice && !isStandalone && !dismissed) {
            setShowInstallPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleDismissInstall = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    const handleTriggerInstall = async () => {
        if (!deferredPrompt) return;
        setShowInstallPrompt(false);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsAppInstalled(true);
            localStorage.setItem('pwa_prompt_dismissed', 'true');
        }
        setDeferredPrompt(null);
    };

    useEffect(() => {
        const today = new Date().toDateString();
        const lastShown = localStorage.getItem('last_quote_shown_date');
        
        if (lastShown !== today) {
            const showTimer = setTimeout(() => {
                const index = Math.floor(Math.random() * QUOTES.length);
                setRandomQuote(QUOTES[index]);
                setShowQuoteToast(true);
                localStorage.setItem('last_quote_shown_date', today);
            }, 0);

            const hideTimer = setTimeout(() => {
                setShowQuoteToast(false);
            }, 5000);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
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

        // 7. Lắng nghe Nhật ký bé (baby_journal)
        const qBabyJournal = query(collection(db, "users", user.uid, "baby_journal"), orderBy("timestamp", "desc"), limit(50));
        const unsubBabyJournal = onSnapshot(qBabyJournal, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const todayStr = new Date().toDateString();
            const todayList = list.filter((e: any) => e.timestamp && new Date(e.timestamp).toDateString() === todayStr);

            const breastMins = todayList.filter((e: any) => e.type === 'milk_breast').reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
            const bottleMl = todayList.filter((e: any) => e.type === 'milk_bottle').reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const wetDiapers = todayList.filter((e: any) => e.type === 'diaper_wet').length;
            const dirtyDiapers = todayList.filter((e: any) => e.type === 'diaper_dirty').length;
            const sleepMins = todayList.filter((e: any) => e.type === 'sleep').reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
            const sleepHours = (sleepMins / 60).toFixed(1);

            setBabyJournalToday({ breastMins, bottleMl, wetDiapers, dirtyDiapers, sleepHours });
        });

        // 8. Lắng nghe Chỉ số tăng trưởng bé (baby_growth)
        const qBabyGrowth = query(collection(db, "users", user.uid, "baby_growth"), orderBy("timestamp", "desc"), limit(1));
        const unsubBabyGrowth = onSnapshot(qBabyGrowth, (snapshot) => {
            if (!snapshot.empty) {
                setLatestGrowth(snapshot.docs[0].data());
            } else {
                setLatestGrowth(null);
            }
        });

        // 9. Lắng nghe Sổ tiêm chủng (immunizations)
        const qImms = query(collection(db, "users", user.uid, "immunizations"));
        const unsubImms = onSnapshot(qImms, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setImmunizations(list);
        });

        return () => {
            unsubProfile();
            unsubVisits();
            unsubFood();
            unsubFinance();
            unsubVitals();
            unsubKicks();
            unsubBabyJournal();
            unsubBabyGrowth();
            unsubImms();
        };
    }, []);

    // Tính tổng chi phí khám thai từ các lịch không bị đánh dấu xóa (deletedAt)
    const activeVisits = visits.filter(v => !v.deletedAt);
    const totalCost = activeVisits.reduce((sum, v) => {
        const val = Number(v.totalCost) || Number(v.cost) || 0;
        return sum + val;
    }, 0);

    const totalShopping = financeTxs.reduce((sum, tx) => {
        return sum + (Number(tx.amount) || 0);
    }, 0);

    const formatVND = (n: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    };

    const formatKgValue = (kg: number | null | undefined) => {
        if (kg === null || kg === undefined || Number.isNaN(kg)) return null;
        const decimals = Math.abs(kg) < 1 ? 3 : 2;
        return kg.toFixed(decimals);
    };

    const formatBabyWeight = (kg: number | null | undefined) => {
        const value = formatKgValue(kg);
        if (value === null) return '--';

        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '--';
        if (Math.abs(numeric) < 1) {
            return `${Math.round(Math.abs(numeric) * 1000)} g`;
        }

        return `${Number(numeric.toFixed(2)).toString()} kg`;
    };

    const formatBabySignedWeight = (kg: number | null | undefined) => {
        const value = formatKgValue(kg);
        if (value === null) return '--';

        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '--';
        if (numeric === 0) return '0 g';

        if (Math.abs(numeric) < 1) {
            return `${numeric > 0 ? '+' : '-'}${Math.round(Math.abs(numeric) * 1000)} g`;
        }

        return `${numeric > 0 ? '+' : '-'}${Number(Math.abs(numeric).toFixed(2)).toString()} kg`;
    };

    const formatSignedKg = (kg: number | null | undefined) => {
        const value = formatKgValue(kg);
        return value === null ? '--' : `${kg! > 0 ? '+' : ''}${value} kg`;
    };

    const parseWeightToKg = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') {
            if (!Number.isFinite(value) || value <= 0) return null;
            return value > 20 ? value / 1000 : value;
        }

        const normalized = String(value).trim().toLowerCase().replace(',', '.');
        if (!normalized || normalized === '--') return null;

        const match = normalized.match(/([\d.]+)/);
        if (!match) return null;

        const numeric = Number(match[1]);
        if (!Number.isFinite(numeric) || numeric <= 0) return null;

        if (normalized.includes('kg')) return numeric;
        if (normalized.includes('g')) return numeric / 1000;
        return numeric > 20 ? numeric / 1000 : numeric;
    };

    // Tìm lịch tái khám tiếp theo (lớn hơn hoặc bằng ngày hôm nay)
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const nextAppt = activeVisits
        .filter(v => v.nextDate && v.nextDate >= todayStr)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
    const hasAllergy = profile.allergy && profile.allergy.toLowerCase() !== 'không';

    // Postpartum mode variables & helpers
    const isPostpartum = profile.appMode === 'postpartum';
    const babyAge = profile.babyInfo?.dob ? computeBabyAgeDetails(profile.babyInfo.dob) : null;

    useEffect(() => {
        if (babyAge && babyAge.months !== undefined) {
            setActiveMilestoneMonth(babyAge.months);
        }
    }, [profile.babyInfo?.dob]);

    const currentMilestone = BABY_MILESTONES[activeMilestoneMonth] || getMilestoneForAge(activeMilestoneMonth);
    const milestoneKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];

    const handlePrevMilestone = () => {
        const idx = milestoneKeys.indexOf(activeMilestoneMonth);
        if (idx > 0) setActiveMilestoneMonth(milestoneKeys[idx - 1]);
    };

    const handleNextMilestone = () => {
        const idx = milestoneKeys.indexOf(activeMilestoneMonth);
        if (idx >= 0 && idx < milestoneKeys.length - 1) {
            setActiveMilestoneMonth(milestoneKeys[idx + 1]);
        }
    };

    const getNextUpcomingVaccine = () => {
        if (!profile.babyInfo?.dob) return null;
        const dob = new Date(profile.babyInfo.dob);
        if (isNaN(dob.getTime())) return null;

        const ageGroupToMonths: Record<string, number> = {
            'Sơ sinh': 0,
            '2 tháng': 2,
            '3 tháng': 3,
            '4 tháng': 4,
            '6 tháng': 6,
            '7 tháng': 7,
            '9 tháng': 9,
            '12 tháng': 12,
            '18 tháng': 18,
            '24 tháng': 24
        };

        const takenIds = new Set(
            immunizations
                .filter(im => im.status === 'completed' || im.status === 'done' || im.taken)
                .map(im => im.id || im.vaccineId)
        );

        const now = new Date();
        const candidateList = DEFAULT_VACCINES
            .filter(v => ageGroupToMonths[v.ageGroup] !== undefined)
            .filter(v => !takenIds.has(v.id))
            .map(v => {
                const m = ageGroupToMonths[v.ageGroup];
                const targetDate = new Date(dob);
                targetDate.setMonth(targetDate.getMonth() + m);
                const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...v,
                    targetDate,
                    targetDateStr: `${targetDate.getDate()}/${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`,
                    diffDays
                };
            })
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

        return candidateList[0] || null;
    };
    const nextVaccine = getNextUpcomingVaccine();

    const handleToggleMode = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const nextMode = profile.appMode === 'postpartum' ? 'pregnancy' : 'postpartum';
        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                ...profile,
                appMode: nextMode
            }, { merge: true });
        } catch (e) {
            console.error("Lỗi chuyển chế độ:", e);
        }
    };



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

    const getMaternalWeightTarget = () => {
        const hCm = Number(profile.height) || 0;
        const wBefore = Number(profile.weightBefore) || 0;
        if (hCm <= 0 || wBefore <= 0) return null;

        const bmi = wBefore / Math.pow(hCm / 100, 2);
        if (!Number.isFinite(bmi)) return null;

        if (bmi < 18.5) return { min: 12.5, max: 18 };
        if (bmi < 25) return { min: 11.5, max: 16 };
        if (bmi < 30) return { min: 7, max: 11.5 };
        return { min: 5, max: 9 };
    };

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
        const target = getMaternalWeightTarget();
        let comparison = '--';
        let comparisonColor = '#64748b';

        if (target) {
            if (gain < target.min) {
                comparison = `Thiếu ${formatBabyWeight(target.min - gain)}`;
                comparisonColor = '#0f766e';
            } else if (gain > target.max) {
                comparison = `Vượt ${formatBabyWeight(gain - target.max)}`;
                comparisonColor = '#dc2626';
            } else {
                comparison = `Trong chuẩn ${formatBabyWeight(target.min)} - ${formatBabyWeight(target.max)}`;
                comparisonColor = '#16a34a';
            }
        }

        return {
            latestWeight,
            gain,
            target,
            comparison,
            comparisonColor
        };
    };
    const weightGainInfo = getMaternalWeightGain();

    const babyWeightVisits = [...activeVisits]
        .filter(v => Number(v.babyWeight) > 0)
        .sort((a, b) => a.date.localeCompare(b.date));
    const latestBabyWeightVisit = babyWeightVisits[babyWeightVisits.length - 1] || null;

    const actualBabyWeightKg = latestBabyWeightVisit ? parseWeightToKg(latestBabyWeightVisit.babyWeight) : null;
    const standardBabyWeightKg = pregnancyInfo ? parseWeightToKg(pregnancyInfo.weight) : null;
    const babyWeightDiffKg = actualBabyWeightKg !== null && standardBabyWeightKg !== null
        ? actualBabyWeightKg - standardBabyWeightKg
        : null;
    const babyWeightSourceDate = latestBabyWeightVisit?.date || null;

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

                                                /* 1. PREMIUM HERO BANNER */
                @keyframes gradient-mesh {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes float-up-down {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                    100% { transform: translateY(0); }
                }
                @keyframes avatar-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(236, 72, 153, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
                }
                .hero-profile-premium {
                    position: relative;
                    border-radius: 24px;
                    overflow: hidden;
                    padding: 36px;
                    background: #f5f5f7;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    z-index: 1;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
                }
                
                .hero-top-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                }

                .hero-greeting-area {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-width: 70%;
                }

                .hero-subtitle-apple {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #86868b;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .hero-name-premium {
                    font-size: 2.2rem;
                    font-weight: 700;
                    line-height: 1.15;
                    letter-spacing: -0.025em;
                    color: #1d1d1f;
                    margin: 0;
                    word-break: break-word;
                }

                .hero-avatar-container {
                    position: relative;
                    width: 76px;
                    height: 76px;
                    border-radius: 50%;
                    background: #ffffff;
                    padding: 2px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .hero-avatar-container:hover {
                    transform: scale(1.05);
                }
                .avatar-hint {
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #e11d48;
                    color: white;
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 12px;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: 0 4px 8px rgba(225, 29, 72, 0.3);
                    pointer-events: none;
                }

                .hero-avatar-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f5f5f7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #86868b;
                }

                .hero-avatar-inner img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .hero-floating-dock {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    padding: 20px 28px;
                    border-radius: 20px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
                    z-index: 2;
                }

                .dock-metrics {
                    display: flex;
                    gap: 48px;
                    width: 100%;
                }

                .dock-metric-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }

                .dock-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #86868b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dock-value {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #1d1d1f;
                    letter-spacing: -0.015em;
                }
                .dock-value.highlight-pink { color: #ff2d55; }
                .dock-value.highlight-blue { color: #007aff; }
                .dock-value.highlight-purple { color: #5856d6; }

                @media (max-width: 768px) {
                    .hero-profile-premium {
                        padding: 24px;
                        border-radius: 20px;
                        gap: 24px;
                    }
                    .hero-name-premium {
                        font-size: 1.8rem;
                    }
                    .hero-avatar-container {
                        width: 64px;
                        height: 64px;
                    }
                    .hero-floating-dock {
                        padding: 16px 20px;
                        border-radius: 16px;
                    }
                    .dock-metrics {
                        gap: 32px;
                    }
                    .dock-value {
                        font-size: 1.15rem;
                    }
                }

                /* 2. VITALS & STATS GRID */
                .health-card.vitals-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    z-index: 2;
                    padding: 20px;
                }
                .vitals-grid-inner {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                }
                .vital-box { 
                    background: rgba(248, 250, 252, 0.72); 
                    border-radius: 18px; 
                    padding: 14px; 
                    text-align: left; 
                    border: 1px solid rgba(226, 232, 240, 0.9); 
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
                    transition: all 0.3s ease;
                    min-width: 0;
                    min-height: 112px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    text-decoration: none;
                    color: inherit;
                }
                .vital-box:hover {
                    transform: translateY(-2px);
                    background: #ffffff;
                    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
                    border-color: #dbeafe;
                }
                .vital-label { 
                    font-size: 0.72rem; 
                    color: #64748b; 
                    font-weight: 700; 
                    letter-spacing: 0;
                    margin-bottom: 8px;
                }
                .vital-value { 
                    font-size: 1.08rem; 
                    font-weight: 800; 
                    line-height: 1.25; 
                    letter-spacing: 0;
                }
                .vital-box.pink { background: linear-gradient(180deg, #fff7fb 0%, #ffffff 100%); border-color: rgba(190, 24, 93, 0.15); }
                .vital-box.yellow { background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%); border-color: rgba(180, 83, 9, 0.15); }
                .vital-box.blue { background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border-color: rgba(3, 105, 161, 0.15); }
                .vital-box.red { background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%); border-color: rgba(185, 28, 28, 0.15); }
                .vital-box.pink .vital-value { color: #be185d; }
                .vital-box.yellow .vital-value { color: #b45309; }
                .vital-box.blue .vital-value { color: #0369a1; }
                .vital-box.red .vital-value { color: #b91c1c; }
                .vital-box.pink:hover { border-color: rgba(190, 24, 93, 0.35); box-shadow: 0 12px 28px rgba(190, 24, 93, 0.08); transform: translateY(-4px); }
                .vital-box.yellow:hover { border-color: rgba(180, 83, 9, 0.35); box-shadow: 0 12px 28px rgba(180, 83, 9, 0.08); transform: translateY(-4px); }
                .vital-box.blue:hover { border-color: rgba(3, 105, 161, 0.35); box-shadow: 0 12px 28px rgba(3, 105, 161, 0.08); transform: translateY(-4px); }
                .vital-box.red:hover { border-color: rgba(185, 28, 28, 0.35); box-shadow: 0 12px 28px rgba(185, 28, 28, 0.08); transform: translateY(-4px); }

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

                /* OVERVIEW GRID FOR THÔNG TIN TOÀN CẢNH */
                .overview-grid-inner {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 10px;
                }
                @media (max-width: 900px) {
                    .overview-grid-inner { 
                        grid-template-columns: repeat(2, minmax(0, 1fr)); 
                        gap: 12px; 
                    }
                }
                /* Additional vital-box colors for Overview */
                .vital-box.green { background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%); border-color: rgba(22, 101, 52, 0.15); }
                .vital-box.purple { background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%); border-color: rgba(107, 33, 168, 0.15); }
                .vital-box.green .vital-value { color: #166534; }
                .vital-box.purple .vital-value { color: #6b21a8; }
                .vital-box.green:hover { border-color: rgba(22, 101, 52, 0.35); box-shadow: 0 12px 28px rgba(22, 101, 52, 0.08); transform: translateY(-4px); }
                .vital-box.purple:hover { border-color: rgba(107, 33, 168, 0.35); box-shadow: 0 12px 28px rgba(107, 33, 168, 0.08); transform: translateY(-4px); }

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
                    white-space: normal;
                    word-break: break-word;
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
                {/* 1. HỒ SƠ MẸ BẦU HOẶC EM BÉ (HERO CARD PREMIUM) */}
                <div className={`hero-profile-premium fade-in ${isPostpartum ? 'hero-postpartum' : ''}`}>
                    <div className="hero-top-section">
                        <div className="hero-greeting-area">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="hero-subtitle-apple">
                                    {isPostpartum ? 'Hồ sơ em bé • Nuôi con' : 'Hồ sơ mẹ bầu • Thai kỳ'}
                                </span>
                                <button 
                                    onClick={handleToggleMode}
                                    style={{
                                        background: isPostpartum ? 'rgba(236, 72, 153, 0.12)' : 'rgba(124, 58, 237, 0.1)',
                                        color: isPostpartum ? '#db2777' : '#7c3aed',
                                        border: '1px solid ' + (isPostpartum ? 'rgba(236, 72, 153, 0.25)' : 'rgba(124, 58, 237, 0.2)'),
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Nhấn để chuyển đổi chế độ"
                                >
                                    {isPostpartum ? 'Chuyển sang Thai kỳ 🤰' : 'Bé đã sinh? Chuyển sang Nuôi con 👩‍🍼'}
                                </button>
                            </div>
                            <h1 className="hero-name-premium">
                                {isPostpartum
                                    ? (profile.babyInfo?.name || 'Em bé đáng yêu')
                                    : (profile.name || auth.currentUser?.displayName || 'Mẹ bầu xinh đẹp')}
                            </h1>
                            {isPostpartum && (
                                <div style={{ fontSize: '0.88rem', color: '#db2777', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                    <span style={{ background: '#fdf2f8', padding: '2px 8px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                                        {profile.babyInfo?.gender === 'boy' ? '👦 Bé trai' : profile.babyInfo?.gender === 'twins' ? '👶👶 Sinh đôi' : '👧 Bé gái'}
                                    </span>
                                    <span>🎉 {babyAge ? babyAge.ageDisplay : 'Chưa cập nhật ngày sinh bé'}</span>
                                </div>
                            )}
                        </div>

                        <div className="hero-avatar-container" onClick={() => setShowProfileModal(true)}>
                            <div className="hero-avatar-inner">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" />
                                ) : (
                                    <IoPerson size={36} />
                                )}
                            </div>
                            <div className="avatar-hint">
                                <IoSparklesOutline size={10} /> Xem hồ sơ
                            </div>
                        </div>
                    </div>

                    <div className="hero-floating-dock">
                        <div className="dock-metrics">
                            {isPostpartum ? (
                                <>
                                    <div className="dock-metric-item">
                                        <div className="dock-label">
                                            <IoScaleOutline size={14} /> Cân nặng bé
                                        </div>
                                        <div className="dock-value highlight-purple">
                                            {latestGrowth ? `${latestGrowth.weight} kg` : (profile.babyInfo?.birthWeight ? `${profile.babyInfo.birthWeight}g (sinh)` : '--')}
                                        </div>
                                    </div>
                                    <div className="dock-metric-item">
                                        <div className="dock-label">
                                            <IoTrendingUpOutline size={14} /> Chiều dài bé
                                        </div>
                                        <div className="dock-value highlight-blue" style={{ color: '#0284c7' }}>
                                            {latestGrowth ? `${latestGrowth.height} cm` : (profile.babyInfo?.birthHeight ? `${profile.babyInfo.birthHeight} cm (sinh)` : '--')}
                                        </div>
                                    </div>
                                    <div className="dock-metric-item">
                                        <div className="dock-label">
                                            <IoMedicalOutline size={14} /> Mũi tiêm tới
                                        </div>
                                        <div className="dock-value highlight-pink" style={{ fontSize: '0.85rem' }}>
                                            {nextVaccine ? nextVaccine.name : 'Đã tiêm đủ'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="dock-metric-item">
                                        <div className="dock-label">
                                            <IoPulseOutline size={14} /> Tuần thai
                                        </div>
                                        <div className="dock-value highlight-purple">Tuần {weeks}/40</div>
                                    </div>
                                    <div className="dock-metric-item">
                                        <div className="dock-label">
                                            <IoCalendarOutline size={14} /> Dự sinh
                                        </div>
                                        <div className="dock-value highlight-pink">{eddStr}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isPostpartum ? (
                    <div className="db-body-columns">
                        <div className="db-left-col">
                            {/* 1. SINH HOẠT HÔM NAY CỦA BÉ */}
                            <div className="health-card vitals-grid" style={{
                                border: '1px solid rgba(244, 114, 182, 0.4)',
                                boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.08)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(241, 245, 249, 0.8)', paddingBottom: '12px', marginBottom: '12px' }}>
                                    <h3 className="health-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            width: '32px', height: '32px', borderRadius: '10px', 
                                            background: '#fdf2f8', color: '#db2777' 
                                        }}>
                                            <IoHeartOutline size={20} />
                                        </span>
                                        Sinh hoạt hôm nay của bé
                                    </h3>
                                    <Link href="/admin/nhat-ky-be" style={{
                                        fontSize: '0.78rem',
                                        color: '#db2777',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        background: '#fce7f3',
                                        padding: '6px 12px',
                                        borderRadius: '12px'
                                    }}>
                                        + Ghi nhật ký
                                    </Link>
                                </div>

                                <div className="vitals-grid-inner">
                                    <div className="vital-box pink">
                                        <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IoHeartOutline size={14} color="#db2777" /> Bú mẹ trực tiếp
                                        </div>
                                        <div className="vital-value" style={{ color: '#db2777' }}>
                                            {babyJournalToday.breastMins > 0 ? `${babyJournalToday.breastMins} phút` : 'Chưa ghi'}
                                        </div>
                                    </div>
                                    <div className="vital-box blue">
                                        <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IoCafeOutline size={14} color="#0284c7" /> Sữa bình
                                        </div>
                                        <div className="vital-value" style={{ color: '#0284c7' }}>
                                            {babyJournalToday.bottleMl > 0 ? `${babyJournalToday.bottleMl} ml` : 'Chưa ghi'}
                                        </div>
                                    </div>
                                    <div className="vital-box yellow">
                                        <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IoWaterOutline size={14} color="#d97706" /> Thay tã
                                        </div>
                                        <div className="vital-value" style={{ color: '#d97706' }}>
                                            {babyJournalToday.wetDiapers + babyJournalToday.dirtyDiapers > 0 
                                                ? `${babyJournalToday.wetDiapers + babyJournalToday.dirtyDiapers} lần` 
                                                : 'Chưa ghi'}
                                            <span style={{ fontSize: '0.72rem', display: 'block', color: '#64748b', fontWeight: 600 }}>
                                                {babyJournalToday.wetDiapers} ướt • {babyJournalToday.dirtyDiapers} bẩn
                                            </span>
                                        </div>
                                    </div>
                                    <div className="vital-box purple">
                                        <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IoMoonOutline size={14} color="#7c3aed" /> Giấc ngủ ngày
                                        </div>
                                        <div className="vital-value" style={{ color: '#7c3aed' }}>
                                            {Number(babyJournalToday.sleepHours) > 0 ? `${babyJournalToday.sleepHours} giờ` : 'Chưa ghi'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CẨM NANG PHÁT TRIỂN THEO THÁNG TUỔI (BABY MILESTONES) */}
                            <div className="health-card" style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '24px',
                                padding: '24px',
                                background: '#ffffff',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '32px', height: '32px', borderRadius: '10px',
                                            background: '#fef3c7', color: '#d97706'
                                        }}>
                                            <IoSparklesOutline size={18} />
                                        </span>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                                                {currentMilestone.title}
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {activeMilestoneMonth === babyAge?.months ? '🌟 Mốc tuổi hiện tại của bé' : 'Đang xem tham khảo'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Month Navigation */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '14px' }}>
                                        <button 
                                            onClick={handlePrevMilestone}
                                            disabled={activeMilestoneMonth <= 0}
                                            style={{
                                                background: 'none', border: 'none', cursor: activeMilestoneMonth <= 0 ? 'not-allowed' : 'pointer',
                                                color: activeMilestoneMonth <= 0 ? '#cbd5e1' : '#1e293b', padding: '4px', display: 'flex'
                                            }}
                                        >
                                            <IoChevronBackOutline size={18} />
                                        </button>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '70px', textAlign: 'center' }}>
                                            Tháng {activeMilestoneMonth}
                                        </span>
                                        <button 
                                            onClick={handleNextMilestone}
                                            disabled={activeMilestoneMonth >= 24}
                                            style={{
                                                background: 'none', border: 'none', cursor: activeMilestoneMonth >= 24 ? 'not-allowed' : 'pointer',
                                                color: activeMilestoneMonth >= 24 ? '#cbd5e1' : '#1e293b', padding: '4px', display: 'flex'
                                            }}
                                        >
                                            <IoChevronForwardOutline size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)',
                                    border: '1px solid #fecdd3',
                                    padding: '14px 18px',
                                    borderRadius: '16px',
                                    marginBottom: '16px',
                                    fontSize: '0.88rem',
                                    fontWeight: 600,
                                    color: '#9f1239',
                                    lineHeight: 1.5
                                }}>
                                    ✨ {currentMilestone.headline}
                                </div>

                                {/* EASY Routine Highlight */}
                                {currentMilestone.easyRoutine && (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                📅 Lịch sinh hoạt mẫu: {currentMilestone.easyRoutine.name}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Thức chơi: {currentMilestone.easyRoutine.wakeWindow}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                                            {currentMilestone.easyRoutine.description}
                                        </p>
                                    </div>
                                )}

                                {/* Motor & Language Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🤸 Vận động (Thô & Tinh)
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.6 }}>
                                            {currentMilestone.motorGross.slice(0, 2).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                            {currentMilestone.motorFine.slice(0, 1).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🗣️ Ngôn ngữ & Giao tiếp
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.6 }}>
                                            {currentMilestone.socialLanguage.slice(0, 2).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                            {currentMilestone.sensoryCognitive.slice(0, 1).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Tips & Red Flags */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '14px', padding: '12px 16px', fontSize: '0.82rem', color: '#86198f', lineHeight: 1.5 }}>
                                        <strong>💡 Mẹo tương tác: </strong>
                                        {currentMilestone.playTips[0]}
                                    </div>
                                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '14px', padding: '12px 16px', fontSize: '0.8rem', color: '#9f1239', lineHeight: 1.5 }}>
                                        <strong>⚠️ Dấu hiệu cần theo dõi: </strong>
                                        {currentMilestone.redFlags[0]}
                                    </div>
                                </div>
                            </div>

                            {/* 3. TĂNG TRƯỞNG & TIÊM CHỦNG CARD */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                {/* Tăng trưởng WHO */}
                                <div className="health-card" style={{
                                    border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px', background: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <IoScaleOutline color="#7c3aed" size={18} /> Tăng trưởng chuẩn WHO
                                        </h4>
                                        <Link href="/admin/nhat-ky-be" style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
                                            Xem biểu đồ →
                                        </Link>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Số đo mới nhất:</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                                            {latestGrowth 
                                                ? `${latestGrowth.weight} kg • ${latestGrowth.height} cm` 
                                                : (profile.babyInfo?.birthWeight 
                                                    ? `${profile.babyInfo.birthWeight}g • ${profile.babyInfo.birthHeight || '--'} cm (lúc sinh)` 
                                                    : 'Chưa có bản ghi')}
                                        </div>
                                        {latestGrowth?.ageMonths !== undefined && (
                                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>
                                                Ghi nhận lúc: {latestGrowth.ageMonths} tháng tuổi
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                        Mẹ hãy ghi nhận cân nặng và chiều cao của bé định kỳ hàng tháng để so sánh biểu đồ phân vị bách phân vị chuẩn WHO.
                                    </p>
                                </div>

                                {/* Tiêm chủng */}
                                <div className="health-card" style={{
                                    border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px', background: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <IoMedicalOutline color="#10b981" size={18} /> Lịch tiêm phòng mở rộng
                                        </h4>
                                        <Link href="/admin/tiem-chung" style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
                                            Mở sổ tiêm →
                                        </Link>
                                    </div>
                                    {nextVaccine ? (
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '16px', marginBottom: '10px' }}>
                                            <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                                                Mũi tiêm tiếp theo ({nextVaccine.ageGroup}):
                                            </div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14532d', marginTop: '2px' }}>
                                                {nextVaccine.name}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: nextVaccine.diffDays <= 0 ? '#b91c1c' : '#15803d', fontWeight: 700, marginTop: '4px' }}>
                                                Dự kiến: {nextVaccine.targetDateStr} ({nextVaccine.diffDays > 0 ? `Còn ${nextVaccine.diffDays} ngày` : nextVaccine.diffDays === 0 ? 'Đến ngày hôm nay!' : `Đã đến lịch (${Math.abs(nextVaccine.diffDays)} ngày trước)`})
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', marginBottom: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                                            {profile.babyInfo?.dob ? '🎉 Bé đã hoàn thành các mũi tiêm trong mốc hiện tại!' : 'Vui lòng cập nhật ngày sinh của bé trong Cài đặt để tự động lên lịch tiêm.'}
                                        </div>
                                    )}
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                        Hệ thống tự động đồng bộ lịch tiêm chủng y khoa theo khuyến nghị Bộ Y tế và CDC Việt Nam.
                                    </p>
                                </div>
                            </div>

                            {/* 4. DINH DƯỠNG MẸ SAU SINH & LỢI SỮA */}
                            <div className="health-card" style={{
                                border: '1px solid #fed7aa',
                                borderRadius: '24px',
                                padding: '20px',
                                background: 'linear-gradient(135deg, #fffaf5 0%, #fff7ed 100%)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <IoRestaurantOutline size={18} /> Dinh dưỡng hồi phục sau sinh & Lợi sữa
                                    </h4>
                                    <Link href="/admin/dinh-duong" style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, textDecoration: 'none' }}>
                                        Khám phá thực đơn →
                                    </Link>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem', color: '#7c2d12', lineHeight: 1.5 }}>
                                    <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #ffedd5' }}>
                                        <strong>🥛 Lượng nước mỗi ngày:</strong> Duy trì uống từ 2.5 - 3 lít nước ấm hoặc trà gạo lứt/đỗ đen để kích thích tuyến sữa dồi dào.
                                    </div>
                                    <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #ffedd5' }}>
                                        <strong>🥗 Năng lượng phục hồi:</strong> Mẹ nuôi con bú cần khoảng 1800 - 2200 kcal/ngày, bổ sung protein, sắt và canxi đầy đủ.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                <div className="db-body-columns">
                <div className="db-left-col">
                    {/* 2. CHỈ SỐ THAI KỲ - VITALS CARD */}
                    <div className="health-card vitals-grid" style={{
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                    }}>
                        <h3 className="health-card-title" style={{ 
                            borderBottom: '1px solid rgba(241, 245, 249, 0.8)', 
                            paddingBottom: '12px', 
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '10px', 
                                background: 'rgba(254, 243, 199, 0.5)',
                                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                             }}>
                                <IoSparklesOutline style={{ color: '#f59e0b' }} size={20} className="pulse-sparkles" />
                            </span>
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
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.04rem', lineHeight: 1.2 }}>
                                        {actualBabyWeightKg !== null
                                            ? formatBabyWeight(actualBabyWeightKg)
                                            : (standardBabyWeightKg !== null ? formatBabyWeight(standardBabyWeightKg) : (pregnancyInfo ? pregnancyInfo.weight : '--'))}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', lineHeight: 1.4, fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                                        {actualBabyWeightKg !== null && pregnancyInfo ? (
                                            <>
                                                <span style={{ display: 'block' }}>
                                                    Chuẩn: {formatBabyWeight(standardBabyWeightKg)}
                                                </span>
                                                {babyWeightDiffKg !== null && (
                                                    <span
                                                        style={{
                                                            display: 'block',
                                                            color: babyWeightDiffKg > 0
                                                                ? '#dc2626'
                                                                : babyWeightDiffKg < 0
                                                                    ? '#0f766e'
                                                                    : '#16a34a'
                                                        }}
                                                    >
                                                        So với chuẩn: {formatBabySignedWeight(babyWeightDiffKg)}
                                                    </span>
                                                )}
                                                {babyWeightSourceDate && (
                                                    <span style={{ display: 'block', color: '#64748b' }}>
                                                        Ghi chép: {new Date(babyWeightSourceDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                )}
                                            </>
                                        ) : pregnancyInfo ? (
                                            <span style={{ display: 'block', color: '#64748b' }}>
                                                Thực tế: chưa có số đo trong ghi chép
                                            </span>
                                        ) : (
                                            <span style={{ display: 'block', color: '#64748b' }}>
                                                Chưa có dữ liệu thai kỳ
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="vital-box red">
                                <div className="vital-label">Mẹ tăng cân</div>
                                <div className="vital-value" style={{ color: '#ef4444' }}>
                                    {weightGainInfo ? formatSignedKg(weightGainInfo.gain) : '--'}
                                    {weightGainInfo?.target && (
                                        <div style={{ fontSize: '0.72rem', lineHeight: 1.4, fontWeight: 700, color: weightGainInfo.comparisonColor, marginTop: '4px' }}>
                                            <span style={{ display: 'block' }}>
                                                Chuẩn: {formatBabyWeight(weightGainInfo.target.min)} - {formatBabyWeight(weightGainInfo.target.max)}
                                            </span>
                                            <span style={{ display: 'block' }}>
                                                So với chuẩn: {weightGainInfo.comparison}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. THÔNG TIN TOÀN CẢNH (Vital Box Design) */}
                    <div className="health-card" style={{ 
                        marginTop: '16px',
                        background: 'radial-gradient(circle at 10% 20%, rgba(253, 242, 248, 0.9) 0%, transparent 60%), radial-gradient(circle at 90% 10%, rgba(255, 247, 237, 0.8) 0%, transparent 60%), linear-gradient(135deg, rgba(253, 242, 248, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)',
                        border: '1px solid rgba(251, 207, 232, 0.4)',
                        boxShadow: '0 20px 40px -15px rgba(251, 207, 232, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                    }}>
                        <h3 className="health-card-title" style={{ 
                            borderBottom: '1px solid rgba(241, 245, 249, 0.8)', 
                            paddingBottom: '12px', 
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '10px', 
                                background: 'rgba(251, 207, 232, 0.4)',
                                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                            }}>
                                <IoHeartOutline style={{ color: '#db2777' }} size={20} className="pulse-heart" />
                            </span>
                            Thông tin toàn cảnh
                        </h3>

                        <div className="overview-grid-inner">
                            {/* 1. Chi phí khám */}
                            <Link href="/admin/sokhambenh" className="vital-box green">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoWalletOutline style={{ color: '#166534', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>CHI PHÍ KHÁM</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 500, color: '#000000' }}>
                                        {formatVND(totalCost)}
                                    </div>
                                </div>
                            </Link>

                            {/* 2. Chi tiêu sắm đồ */}
                            <Link href="/admin/tai-chinh" className="vital-box purple">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoSparklesOutline style={{ color: '#6b21a8', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>SẮM ĐỒ</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 500, color: '#000000' }}>
                                        {formatVND(totalShopping)}
                                    </div>
                                </div>
                            </Link>

                            {/* 3. Lịch khám */}
                            <Link href="/admin/sokhambenh" className="vital-box blue">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoCalendarOutline style={{ color: '#0369a1', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>LỊCH HẸN</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 500, color: '#000000' }}>
                                        {nextAppt ? nextAppt.nextDate.split('-').reverse().join('/') : '--/--/----'}
                                    </div>
                                    {!nextAppt && (
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 500, color: '#475569', marginTop: '4px' }}>
                                            Chưa có
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* 4. Dinh dưỡng */}
                            <Link href="/admin/dinh-duong?tab=diary" replace className="vital-box yellow">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoRestaurantOutline style={{ color: '#b45309', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>BỮA ĂN</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '0.86rem', lineHeight: 1.35, fontWeight: 600, whiteSpace: 'normal', wordWrap: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#334155' }}>
                                        {latestFood ? latestFood.content : 'Chưa ghi bữa ăn'}
                                    </div>
                                </div>
                            </Link>

                            {/* 5. Huyết áp */}
                            <Link href="/admin/suc-khoe?tab=bp" className="vital-box pink">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoPulseOutline style={{ color: '#be185d', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>HUYẾT ÁP</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 500, color: '#000000' }}>
                                        {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : '--/--'}
                                    </div>
                                    {!latestBP && (
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 500, color: '#475569', marginTop: '4px' }}>
                                            Chưa ghi nhận
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* 6. Đường huyết */}
                            <Link href="/admin/suc-khoe?tab=bs" className="vital-box red">
                                <div className="vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <IoPulseOutline style={{ color: '#b91c1c', opacity: 0.8 }} size={16} />
                                    <span style={{ fontSize: '0.9rem', color: '#be185d', fontWeight: 800, letterSpacing: '0.05em' }}>ĐƯỜNG HUYẾT</span>
                                </div>
                                <div className="vital-value">
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 500, color: '#000000' }}>
                                        {latestBS ? `${latestBS.bloodSugar} ${latestBS.unit || (latestBS.bloodSugar > 20 ? 'mg/dL' : 'mmol/L')}` : '--'}
                                    </div>
                                    {!latestBS && (
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 500, color: '#475569', marginTop: '4px' }}>
                                            Chưa ghi nhận
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>
                </div>
                )}
            </div>

        </div>

        {/* Custom Toast Notification for Daily Quote */}
        {randomQuote && (
            <div className={`quote-toast ${showQuoteToast ? 'show' : ''}`}>
                <span style={{ fontSize: '1.4rem', animation: 'pulse-icon 3s infinite', display: 'inline-block', flexShrink: 0 }}>✨</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#ec4899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Cảm hứng mỗi ngày • {getGreeting()}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.45 }}>
                        &ldquo;{randomQuote}&rdquo;
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

        {/* PWA Install Banner */}
        {showInstallPrompt && !isAppInstalled && (
            <div className="pwa-install-banner">
                <div className="pwa-install-content">
                    <img src="/logo.png" className="pwa-logo" alt="Logo" />
                    <div className="pwa-text-details">
                        <h4>Cài đặt ứng dụng ThaiKyPro</h4>
                        <p style={{ margin: 0 }}>
                            {isIOS 
                                ? "Bấm nút Chia sẻ 📤 ở dưới thanh công cụ trình duyệt Safari rồi chọn 'Thêm vào MH chính' ➕ để cài đặt ứng dụng."
                                : "Thêm ứng dụng vào màn hình chính để theo dõi thai kỳ mượt mà, nhận thông báo nhắc nhở nhanh hơn."
                            }
                        </p>
                    </div>
                </div>
                <div className="pwa-install-actions">
                    <button className="pwa-btn-dismiss" onClick={handleDismissInstall}>Để sau</button>
                    {!isIOS && (
                        <button className="pwa-btn-install" onClick={handleTriggerInstall}>Cài đặt</button>
                    )}
                </div>
            </div>
        )}

        {/* Profile Info Modal */}
        {showProfileModal && (
            <div className="profile-modal-overlay fade-in" onClick={() => setShowProfileModal(false)}>
                <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>
                        <IoCloseOutline size={24} />
                    </button>
                    
                    <div className="profile-modal-header">
                        <div className="profile-modal-avatar">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Avatar" />
                            ) : (
                                <IoPerson size={58} color="#e2e8f0" />
                            )}
                        </div>
                        <h2 className="profile-modal-name">{profile.name || 'Mẹ bầu'}</h2>
                        <div className="profile-modal-subtitle">Hồ sơ thai kỳ</div>
                    </div>

                    <div className="profile-modal-body">
                        {isPostpartum ? (
                            <>
                                <div className="pm-row">
                                    <span className="pm-label">Em bé:</span>
                                    <span className="pm-value highlight">{profile.babyInfo?.name || 'Chưa đặt tên'}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Tuổi hiện tại:</span>
                                    <span className="pm-value highlight" style={{ color: '#db2777' }}>
                                        {babyAge ? babyAge.ageDisplay : '--'}
                                    </span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Giới tính:</span>
                                    <span className="pm-value">
                                        {profile.babyInfo?.gender === 'boy' ? '👦 Bé trai' : profile.babyInfo?.gender === 'twins' ? '👶👶 Sinh đôi' : '👧 Bé gái'}
                                    </span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Cân nặng sinh:</span>
                                    <span className="pm-value">{profile.babyInfo?.birthWeight ? `${profile.babyInfo.birthWeight} g` : '--'}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Mẹ bé:</span>
                                    <span className="pm-value">{profile.name || '--'}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="pm-row">
                                    <span className="pm-label">Ngày dự sinh:</span>
                                    <span className="pm-value highlight">{eddStr}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Tuần thai:</span>
                                    <span className="pm-value highlight">Tuần {weeks}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Nhóm máu:</span>
                                    <span className="pm-value" style={{color: '#e11d48'}}>{profile.bloodType || '--'}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">CCCD:</span>
                                    <span className="pm-value">{profile.cccd || '--'}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">BHYT:</span>
                                    <span className="pm-value">{profile.bhyt || '--'}</span>
                                </div>
                                <div className="pm-row">
                                    <span className="pm-label">Điện thoại:</span>
                                    <span className="pm-value">{profile.phoneWife || '--'}</span>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <button
                                onClick={handleToggleMode}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: isPostpartum ? '#fdf2f8' : '#ede9fe',
                                    color: isPostpartum ? '#be185d' : '#6d28d9',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {isPostpartum ? '🔄 Chuyển sang chế độ Thai Kỳ 🤰' : '🔄 Bé đã chào đời? Sang chế độ Nuôi Con 👩‍🍼'}
                            </button>
                        </div>

                        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '24px'}}>
                            <Link href="/admin/toan-canh" className="pm-icon-btn" onClick={() => setShowProfileModal(false)} title="Mở Trang Toàn Cảnh">
                                <IoHeartOutline size={28} color="#0284c7" />
                            </Link>
                            <Link href="/admin/settings" className="pm-icon-btn" onClick={() => setShowProfileModal(false)} title="Cập nhật thông tin">
                                <IoSettingsOutline size={28} color="#0284c7" />
                            </Link>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .profile-modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(15, 23, 42, 0.4);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .profile-modal-content {
                        background: white;
                        width: 100%;
                        max-width: 380px;
                        border-radius: 32px;
                        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
                        overflow: hidden;
                        position: relative;
                        animation: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes slide-up-fade {
                        from { opacity: 0; transform: translateY(20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .profile-modal-close {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: rgba(241, 245, 249, 0.8);
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                        z-index: 10;
                    }
                    .profile-modal-close:hover {
                        background: #f1f5f9;
                        color: #0f172a;
                        transform: scale(1.05);
                    }
                    .profile-modal-header {
                        background: linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%);
                        padding: 32px 24px 24px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        border-bottom: 1px solid rgba(251, 207, 232, 0.5);
                    }
                    .profile-modal-avatar {
                        width: 106px;
                        height: 106px;
                        border-radius: 50%;
                        background: white;
                        padding: 4px;
                        box-shadow: 0 8px 16px rgba(225, 29, 72, 0.1);
                        margin-bottom: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    }
                    .profile-modal-avatar img {
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    .profile-modal-name {
                        margin: 0;
                        font-size: 1.35rem;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .profile-modal-subtitle {
                        font-size: 0.85rem;
                        color: #e11d48;
                        font-weight: 600;
                        margin-top: 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .profile-modal-body {
                        padding: 24px;
                    }
                    .pm-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px dashed #e2e8f0;
                    }
                    .pm-row:last-of-type {
                        border-bottom: none;
                    }
                    .pm-label {
                        color: #64748b;
                        font-size: 0.85rem;
                        font-weight: 600;
                    }
                    .pm-value {
                        color: #0f172a;
                        font-weight: 700;
                        font-size: 0.95rem;
                    }
                    .pm-value.highlight {
                        color: #0ea5e9;
                    }
                    .pm-btn {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 12px;
                        border-radius: 16px;
                        font-weight: 700;
                        font-size: 0.9rem;
                        text-decoration: none;
                        transition: all 0.2s;
                        text-align: center;
                    }
                    .pm-btn-primary {
                        background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2);
                    }
                    .pm-btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(225, 29, 72, 0.3);
                    }
                    .pm-btn-secondary {
                        background: #f1f5f9;
                        color: #475569;
                    }
                    .pm-btn-secondary:hover {
                        background: #e2e8f0;
                        color: #0f172a;
                    }
                    .pm-icon-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        background: #f0f9ff;
                        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .pm-icon-btn:hover {
                        transform: translateY(-4px) scale(1.05);
                        box-shadow: 0 8px 16px rgba(2, 132, 199, 0.25);
                        background: #e0f2fe;
                    }
                `}</style>
            </div>
        )}
    </>
);
}
