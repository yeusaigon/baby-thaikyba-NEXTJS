'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
    IoMenuOutline, IoHomeOutline, IoCloudOfflineOutline, 
    IoCloseOutline, IoNotificationsOutline, IoWalletOutline,
    IoRestaurantOutline, IoMedicalOutline, IoHeartOutline,
    IoSettingsOutline, IoClipboardOutline, IoCalendarOutline,
    IoImagesOutline, IoBriefcaseOutline,
    IoShieldHalfOutline, IoMusicalNotesOutline, IoAppsOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline, IoChevronForwardOutline,
    IoSparklesOutline, IoSearchOutline
} from 'react-icons/io5';
import { getDataForWeek } from '@/lib/data';
import './splash.css';

const getCurrentPregnancyWeek = (lmp?: string) => {
    if (!lmp) return 0;
    const lmpDate = new Date(lmp);
    if (Number.isNaN(lmpDate.getTime())) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks = Math.floor((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, Math.min(40, weeks));
};

const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
};

const subscribeOnlineStatus = (callback: () => void) => {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);

    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
};

const getOnlineSnapshot = () => navigator.onLine;
const getServerOnlineSnapshot = () => true;

type AssistantNoticeItem = {
    id: string;
    title: string;
    message: string;
    href: string;
    action: string;
    tone: 'danger' | 'warning' | 'health' | 'care' | 'info' | 'ok';
};

type AssistantNoticeHistoryItem = AssistantNoticeItem & {
    firstSeenAt: string;
    lastSeenAt: string;
    archived?: boolean;
};

type AssistantCandidate = AssistantNoticeItem & {
    priority: number;
    moduleKey: 'nutrition' | 'kick' | 'health' | 'visit' | 'general';
};

const ASSISTANT_HISTORY_KEY = 'thaiky_assistant_notice_history_v1';
const MOBILE_NOTIFICATION_QUERY = '(max-width: 1024px)';

const subscribeMobileStatus = (callback: () => void) => {
    const query = window.matchMedia(MOBILE_NOTIFICATION_QUERY);
    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
};

const getMobileSnapshot = () => window.matchMedia(MOBILE_NOTIFICATION_QUERY).matches;
const getServerMobileSnapshot = () => false;

const readAssistantHistory = (): AssistantNoticeHistoryItem[] => {
    try {
        const raw = localStorage.getItem(ASSISTANT_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeAssistantHistory = (items: AssistantNoticeHistoryItem[]) => {
    localStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(items.slice(0, 60)));
};

const getPriorityByTone = (tone: AssistantNoticeItem['tone']) => {
    switch (tone) {
        case 'danger':
            return 100;
        case 'warning':
            return 80;
        case 'care':
            return 70;
        case 'health':
            return 60;
        case 'info':
            return 50;
        case 'ok':
        default:
            return 20;
    }
};

const getAssistantNoticePriority = (item: AssistantNoticeItem, pathname: string) => {
    const toneScore = getPriorityByTone(item.tone);
    const modulePrefix =
        pathname === '/admin/dinh-duong' && item.id.startsWith('nutrition-') ? 120 :
        pathname === '/admin/cu-dong-thai' && item.id.startsWith('kick-') ? 120 :
        pathname === '/admin/suc-khoe' && item.id.startsWith('health-') ? 120 :
        pathname === '/admin/sokhambenh' && item.id.startsWith('visit-') ? 120 :
        pathname === '/admin/tiem-chung' && item.id.startsWith('vaccine-') ? 120 :
        pathname === '/admin/tai-chinh' && item.id.startsWith('finance-') ? 120 :
        pathname === '/admin/chuan-bi-di-sinh' && item.id.startsWith('birth-') ? 120 :
        pathname === '/admin/thai-giao' && item.id.startsWith('education-') ? 120 :
        0;

    const generalBoost =
        item.id.startsWith('high-bp') ? 40 :
        item.id.startsWith('missing-lmp') ? 8 :
        item.id.startsWith('missing-next-visit') ? 12 :
        item.id.startsWith('upcoming-visit') ? 18 :
        item.id.startsWith('missing-weight') ? 14 :
        item.id.startsWith('week-') ? 4 :
        0;

    return modulePrefix + toneScore + generalBoost;
};

const ROUTE_CONFIGS: Record<string, { title: string; background: string; textColor: string; btnColor: string; icon: React.ReactNode }> = {
    '/admin': {
        title: 'ThaiKyPro',
        background: 'linear-gradient(135deg, #fff5f7 0%, #f0f9ff 50%, #f5f3ff 100%)',
        textColor: '#0d9488',
        btnColor: '#0d9488',
        icon: null
    },
    '/admin/dong-bo': {
        title: 'ThaiKyPro',
        background: 'linear-gradient(135deg, #fff5f7 0%, #f0f9ff 50%, #f5f3ff 100%)',
        textColor: '#0d9488',
        btnColor: '#0d9488',
        icon: null
    },
    '/admin/settings': {
        title: 'Cài đặt hệ thống',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 48%, #fdf2f8 100%)',
        textColor: '#475569',
        btnColor: '#475569',
        icon: <IoSettingsOutline size={18} />
    },
    '/admin/ung-dung': {
        title: 'Tất cả ứng dụng',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 48%, #fff7fb 100%)',
        textColor: '#6d28d9',
        btnColor: '#6d28d9',
        icon: <IoAppsOutline size={18} />
    },
    '/admin/sokhambenh': {
        title: 'Sổ khám bệnh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 48%, #ecfdf5 100%)',
        textColor: '#0f766e',
        btnColor: '#0f766e',
        icon: <IoClipboardOutline size={18} />
    },
    '/admin/dinh-duong': {
        title: 'Dinh dưỡng thai kỳ',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 48%, #fff7ed 100%)',
        textColor: '#047857',
        btnColor: '#047857',
        icon: <IoRestaurantOutline size={18} />
    },
    '/admin/suc-khoe': {
        title: 'Theo dõi sức khỏe',
        background: 'linear-gradient(135deg, #ecfeff 0%, #ffffff 48%, #f0fdfa 100%)',
        textColor: '#0891b2',
        btnColor: '#0891b2',
        icon: <IoPulseOutline size={18} />
    },
    '/admin/album': {
        title: 'Album ảnh của bé',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 48%, #fdf2f8 100%)',
        textColor: '#7c3aed',
        btnColor: '#7c3aed',
        icon: <IoImagesOutline size={18} />
    },
    '/admin/chuan-bi-di-sinh': {
        title: 'Giỏ đồ đi sinh',
        background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 48%, #fff7ed 100%)',
        textColor: '#b45309',
        btnColor: '#b45309',
        icon: <IoBriefcaseOutline size={18} />
    },
    '/admin/tiem-chung': {
        title: 'Sổ tiêm chủng',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 48%, #f0fdfa 100%)',
        textColor: '#047857',
        btnColor: '#047857',
        icon: <IoMedicalOutline size={18} />
    },
    '/admin/nhat-ky-be': {
        title: 'Nhật ký của bé',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #fff1f2 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoHeartOutline size={18} />
    },
    '/admin/tai-chinh': {
        title: 'Sổ chi tiêu sắm đồ',
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 48%, #fffbeb 100%)',
        textColor: '#c2410c',
        btnColor: '#c2410c',
        icon: <IoWalletOutline size={18} />
    },
    '/admin/cu-dong-thai': {
        title: 'Cử động thai',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #fff7fb 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoFootstepsOutline size={18} />
    },
    '/admin/thai-giao': {
        title: 'Thai giáo cho bé',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 48%, #f5f3ff 100%)',
        textColor: '#be185d',
        btnColor: '#be185d',
        icon: <IoMusicalNotesOutline size={18} />
    },
    '/admin/kieng-ky': {
        title: 'Kiêng kỵ thai kỳ',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 48%, #fef2f2 100%)',
        textColor: '#b91c1c',
        btnColor: '#b91c1c',
        icon: <IoShieldHalfOutline size={18} />
    },
    '/admin/canh-bao': {
        title: 'Cảnh báo đỏ',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 48%, #fdf2f8 100%)',
        textColor: '#be123c',
        btnColor: '#be123c',
        icon: <IoWarningOutline size={18} />
    },
    '/admin/search': {
        title: '__SEARCH__',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 48%, #eff6ff 100%)',
        textColor: '#0d9488',
        btnColor: '#0d9488',
        icon: <IoSearchOutline size={18} />
    }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [showAssistantPanel, setShowAssistantPanel] = useState(false);
    const [assistantPanelTab, setAssistantPanelTab] = useState<'active' | 'past' | 'archived'>('active');
    const [assistantNotice, setAssistantNotice] = useState('Trợ lý: đang kiểm tra dữ liệu thai kỳ hôm nay.');
    const [displayedAssistantNotice, setDisplayedAssistantNotice] = useState('Trợ lý: đang kiểm tra dữ liệu thai kỳ hôm nay.');
    const [assistantNoticeList, setAssistantNoticeList] = useState<AssistantNoticeItem[]>([]);
    const [assistantHistory, setAssistantHistory] = useState<AssistantNoticeHistoryItem[]>([]);
    const isOnline = useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getServerOnlineSnapshot);
    const isOffline = !isOnline;
    const isMobile = useSyncExternalStore(subscribeMobileStatus, getMobileSnapshot, getServerMobileSnapshot);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                router.push('/admin/search');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    const currentConfig = ROUTE_CONFIGS[pathname] || {
        title: 'ThaiKyPro',
        background: 'rgba(255, 255, 255, 0.85)',
        textColor: '#1e293b',
        btnColor: '#64748b',
        icon: null
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace('/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => {
                setShowSkeleton(true);
            }, 300);
        } else {
            timer = setTimeout(() => {
                setShowSkeleton(false);
            }, 0);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        if (!user || !pathname.startsWith('/admin')) {
            return;
        }

        let profileData: any = null;
        let visitsData: any[] = [];
        let vitalsData: any[] = [];
        let mealsData: any[] = [];
        let kicksData: any[] = [];

        const refreshAssistantNotice = () => {
            const activeVisits = visitsData.filter(v => !v.deletedAt);
            const recentMeals = mealsData.filter(m => m.datetime).sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
            const recentKicks = kicksData.filter(k => k.startTime).sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));
            const todayStr = new Date().toISOString().split('T')[0];
            const weeks = getCurrentPregnancyWeek(profileData?.lmp);
            const weekData = getDataForWeek(weeks);
            const currentPath = pathname;
            const isNutritionModule = currentPath === '/admin/dinh-duong';
            const isKickModule = currentPath === '/admin/cu-dong-thai';
            const isHealthModule = currentPath === '/admin/suc-khoe';
            const isVisitModule = currentPath === '/admin/sokhambenh';
            const isVaccineModule = currentPath === '/admin/tiem-chung';
            const isFinanceModule = currentPath === '/admin/tai-chinh';
            const isBirthPrepModule = currentPath === '/admin/chuan-bi-di-sinh';
            const isEducationModule = currentPath === '/admin/thai-giao';

            const nextAppt = activeVisits
                .filter(v => v.nextDate && v.nextDate >= todayStr)
                .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];

            const latestVisitWithWeight = [...activeVisits]
                .filter(v => Number(v.weight) > 0)
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

            const latestBP = vitalsData.find(v => v.type === 'bp') || null;
            const latestBS = vitalsData.find(v => v.type === 'bs') || null;
            const todayMeals = recentMeals.filter(m => (m.datetime || '').startsWith(todayStr));
            const todayKicks = recentKicks.filter(k => (k.date || k.startTime || '').startsWith(todayStr));

            const pending: AssistantNoticeItem[] = [];

            if (isNutritionModule) {
                const tri = weeks <= 13 ? 1 : weeks <= 27 ? 2 : 3;
                const nutritionAdvice = tri === 1 
                    ? "Tam cá nguyệt 1: Ưu tiên Axit Folic 400mcg/ngày. Tránh các thực phẩm sống, chưa tiệt trùng để phòng listeria."
                    : tri === 2
                    ? "Tam cá nguyệt 2: Tăng thêm 340 kcal/ngày. Bổ sung Sắt (27mg) và Canxi (1000mg-1200mg) mỗi ngày để phát triển xương thai nhi."
                    : "Tam cá nguyệt 3: Tăng thêm 450 kcal/ngày. Ưu tiên Omega-3 (DHA/EPA), uống nhiều nước, chia nhỏ bữa để giảm trào ngược dạ dày.";
                
                pending.push({
                    id: 'nutrition-context-advice',
                    title: '💡 Kiến thức dinh dưỡng y khoa',
                    message: nutritionAdvice,
                    href: '/admin/dinh-duong',
                    action: 'Đã hiểu',
                    tone: 'info'
                });

                if (todayMeals.length === 0) {
                    pending.push({
                        id: 'nutrition-today-empty',
                        title: 'Chưa có bữa ăn hôm nay',
                        message: 'Mẹ ghi lại món đã ăn để mình ước tính calo, nhắc vitamin và theo dõi cân nặng chuẩn hơn.',
                        href: '/admin/dinh-duong?tab=diary',
                        action: 'Ghi bữa ăn',
                        tone: 'care'
                    });
                } else {
                    const todayCalories = todayMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
                    const latestMeal = todayMeals[0];
                    if (todayCalories < 1500) {
                        pending.push({
                            id: 'nutrition-low-calories',
                            title: 'Năng lượng hôm nay còn thấp',
                            message: `Tổng khoảng ${todayCalories} kcal. Mẹ nên thêm bữa phụ để đủ dưỡng chất cho thai kỳ.`,
                            href: '/admin/dinh-duong?tab=diary',
                            action: 'Xem nhật ký',
                            tone: 'warning'
                        });
                    } else if (todayCalories > 2500) {
                        pending.push({
                            id: 'nutrition-high-calories',
                            title: 'Năng lượng hôm nay hơi cao',
                            message: `Tổng khoảng ${todayCalories} kcal. Mẹ nên giảm đồ ngọt và món nhiều dầu mỡ.`,
                            href: '/admin/dinh-duong?tab=diary',
                            action: 'Xem nhật ký',
                            tone: 'warning'
                        });
                    }

                    if (latestMeal?.content) {
                        pending.push({
                            id: 'nutrition-latest-meal',
                            title: 'Bữa gần nhất đã lưu',
                            message: `${latestMeal.content}. Nếu muốn, mẹ có thể mở nhật ký để thêm bữa tiếp theo ngay.`,
                            href: '/admin/dinh-duong?tab=diary',
                            action: 'Mở nhật ký',
                            tone: 'ok'
                        });
                    }
                }
            }

            if (isKickModule) {
                pending.push({
                    id: 'kick-context-advice',
                    title: '💡 Chuẩn y khoa: Đếm cử động thai',
                    message: 'Theo ACOG (Mỹ), thai máy khỏe mạnh là đạt >= 10 cử động trong tối đa 2 giờ. Mẹ nên đếm vào cùng một thời điểm mỗi ngày, tốt nhất là sau bữa ăn tối khi bé thường thức.',
                    href: '/admin/cu-dong-thai',
                    action: 'Đã hiểu',
                    tone: 'info'
                });

                if (recentKicks.length === 0) {
                    pending.push({
                        id: 'kick-empty',
                        title: 'Chưa có phiên đếm cử động thai',
                        message: 'Mẹ nên bắt đầu phiên đếm để theo dõi bé máy đều và an tâm hơn.',
                        href: '/admin/cu-dong-thai',
                        action: 'Bắt đầu đếm',
                        tone: 'care'
                    });
                } else {
                    const latestSession = recentKicks[0];
                    if (Number(latestSession.kicksCount) < 4) {
                        pending.push({
                            id: 'kick-low',
                            title: 'Phiên gần nhất còn thấp',
                            message: `Phiên gần nhất ghi ${latestSession.kicksCount} lần trong ${latestSession.durationMinutes} phút. Hãy theo dõi lại trong khung giờ tiếp theo.`,
                            href: '/admin/cu-dong-thai',
                            action: 'Xem lịch sử',
                            tone: 'warning'
                        });
                    } else {
                        pending.push({
                            id: 'kick-normal',
                            title: 'Cử động thai ổn',
                            message: `Phiên gần nhất đạt ${latestSession.kicksCount} lần. Mình đã ghi nhận trạng thái tốt cho mẹ.`,
                            href: '/admin/cu-dong-thai',
                            action: 'Xem chi tiết',
                            tone: 'ok'
                        });
                    }
                }
            }

            if (isHealthModule) {
                pending.push({
                    id: 'health-context-advice',
                    title: '💡 Kiến thức theo dõi sinh hiệu',
                    message: weeks >= 20 
                        ? 'Từ tuần 20, HA >= 140/90 mmHg là dấu hiệu tiền sản giật. Đường huyết đói chuẩn nên < 5.1 mmol/L (92 mg/dL) để tầm soát tiểu đường thai kỳ.'
                        : 'Mạch và HA có xu hướng giảm nhẹ nửa đầu thai kỳ do giãn mạch sinh lý. Nhịp tim thường tăng 10-20 nhịp/phút để đáp ứng tăng thể tích máu.',
                    href: '/admin/suc-khoe',
                    action: 'Đã hiểu',
                    tone: 'info'
                });

                if (!latestBP) {
                    pending.push({
                        id: 'health-missing-bp-focus',
                        title: 'Trang này đang thiếu huyết áp',
                        message: 'Mẹ nên ghi huyết áp trước để theo dõi huyết áp thai kỳ và nhịp tim cho đúng ngày.',
                        href: '/admin/suc-khoe',
                        action: 'Ghi huyết áp',
                        tone: 'health'
                    });
                } else {
                    pending.push({
                        id: 'health-bp-latest',
                        title: 'Chỉ số gần nhất',
                        message: `Huyết áp ${latestBP.systolic}/${latestBP.diastolic} mmHg${latestBP.pulse ? `, nhịp tim ${latestBP.pulse}/phút` : ''}. Mẹ xem biểu đồ nếu muốn theo dõi xu hướng.`,
                        href: '/admin/suc-khoe',
                        action: 'Xem biểu đồ',
                        tone: Number(latestBP.systolic) >= 140 || Number(latestBP.diastolic) >= 90 ? 'danger' : 'health'
                    });
                }

                if (!latestBS && weeks >= 24) {
                    pending.push({
                        id: 'health-missing-bs-focus',
                        title: 'Chưa có đường huyết',
                        message: 'Từ tam cá nguyệt thứ 2, mẹ nên bổ sung đường huyết định kỳ để kiểm soát tiểu đường thai kỳ.',
                        href: '/admin/suc-khoe',
                        action: 'Ghi đường huyết',
                        tone: 'health'
                    });
                }
            }

            if (isVisitModule) {
                pending.push({
                    id: 'visit-context-advice',
                    title: `💡 Lời khuyên sản khoa tuần ${weeks}`,
                    message: weekData?.detail?.[0] || 'Khám thai định kỳ đúng lịch hẹn là chìa khóa để tầm soát sớm dị tật, đo tim thai và dự phòng các tai biến sản khoa kịp thời.',
                    href: '/admin/sokhambenh',
                    action: 'Đã hiểu',
                    tone: 'info'
                });

                if (!nextAppt) {
                    pending.push({
                        id: 'visit-no-next',
                        title: 'Chưa có mốc thai kỳ kế tiếp',
                        message: 'Trang này nên có ít nhất một mốc thai kỳ sắp tới để nhắc mẹ chuẩn bị hồ sơ và câu hỏi.',
                        href: '/admin/sokhambenh?action=add',
                        action: 'Thêm mốc',
                        tone: 'care'
                    });
                } else {
                    const daysUntil = Math.ceil((new Date(nextAppt.nextDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                    pending.push({
                        id: 'visit-next',
                        title: daysUntil <= 7 ? 'Sắp tới mốc thai kỳ' : 'Mốc thai kỳ đã có',
                        message: daysUntil <= 7
                            ? `Mốc kế tiếp vào ${formatDateShort(nextAppt.nextDate)}. Mẹ nhớ chuẩn bị sổ và câu hỏi cần trao đổi.`
                            : `Mốc kế tiếp vào ${formatDateShort(nextAppt.nextDate)}. Mẹ cứ theo dõi và cập nhật khi cần.`,
                        href: '/admin/sokhambenh',
                        action: 'Xem sổ theo dõi',
                        tone: daysUntil <= 7 ? 'info' : 'ok'
                    });
                }

                if (!profileData?.weightBefore || !latestVisitWithWeight) {
                    pending.push({
                        id: 'visit-weight-gap',
                        title: 'Thiếu dữ liệu cân nặng',
                        message: 'Trang này cần cân nặng trước bầu hoặc cân nặng lần khám gần nhất để so sánh tăng cân thai nhi.',
                        href: !profileData?.weightBefore ? '/admin/settings' : '/admin/sokhambenh?action=add',
                        action: !profileData?.weightBefore ? 'Cập nhật hồ sơ' : 'Ghi cân nặng',
                        tone: 'warning'
                    });
                }
            }

            if (isVaccineModule) {
                pending.push({
                    id: 'vaccine-context-advice',
                    title: '💡 Kiến thức tiêm chủng y khoa',
                    message: 'Theo Bộ Y tế, mẹ bầu cần tiêm VAT (Uốn ván) ít nhất 2 mũi. Mũi 1 từ tuần 20 trở đi, mũi 2 cách mũi 1 tối thiểu 1 tháng và trước sinh 1 tháng.',
                    href: '/admin/tiem-chung',
                    action: 'Đã hiểu',
                    tone: 'info'
                });
            }

            if (isFinanceModule) {
                pending.push({
                    id: 'finance-context-advice',
                    title: '💡 Kế hoạch tài chính sinh nở',
                    message: 'Chi phí đi sinh trung bình từ 10-30 triệu VNĐ tùy bệnh viện (công/tư). Mẹ nên chuẩn bị sớm BHYT hoặc BH thai sản để giảm gánh nặng tài chính.',
                    href: '/admin/tai-chinh',
                    action: 'Đã hiểu',
                    tone: 'info'
                });
            }

            if (isBirthPrepModule) {
                pending.push({
                    id: 'birth-context-advice',
                    title: '💡 Chuẩn bị đi sinh (Từ tuần 34)',
                    message: 'Giỏ đồ đi sinh nên chia làm 3 phần: Cho mẹ, cho bé và giấy tờ tùy thân (CCCD, BHYT, sổ theo dõi thai kỳ). Không nên mang quá nhiều đồ cồng kềnh.',
                    href: '/admin/chuan-bi-di-sinh',
                    action: 'Đã hiểu',
                    tone: 'info'
                });
            }

            if (isEducationModule) {
                pending.push({
                    id: 'education-context-advice',
                    title: '💡 Kiến thức thai giáo y khoa',
                    message: 'Từ tuần 16, thai nhi đã bắt đầu cảm nhận được âm thanh. Việc ba mẹ thường xuyên trò chuyện và cho bé nghe nhạc nhẹ nhàng giúp kích thích não bộ rất tốt.',
                    href: '/admin/thai-giao',
                    action: 'Đã hiểu',
                    tone: 'info'
                });
            }

            if (!profileData?.lmp) {
                pending.push({
                    id: 'missing-lmp',
                    title: 'Thiếu ngày kinh cuối',
                    message: 'Mẹ thêm ngày kinh cuối để mình tính tuần thai và nhắc việc chính xác hơn.',
                    href: '/admin/settings',
                    action: 'Cập nhật hồ sơ',
                    tone: 'warning'
                });
            }

            if (!isHealthModule && latestBP && (Number(latestBP.systolic) >= 140 || Number(latestBP.diastolic) >= 90)) {
                pending.push({
                    id: 'high-bp',
                    title: 'Huyết áp cần chú ý',
                    message: `Chỉ số gần nhất ${latestBP.systolic}/${latestBP.diastolic} mmHg hơi cao. Mẹ nghỉ ngơi và xem mục cảnh báo nhé.`,
                    href: '/admin/canh-bao',
                    action: 'Xem cảnh báo',
                    tone: 'danger'
                });
            }

            if (!isVisitModule) {
                if (!nextAppt) {
                    pending.push({
                        id: 'missing-next-visit',
                        title: 'Chưa có mốc thai kỳ kế tiếp',
                        message: 'Mẹ nên thêm mốc thai kỳ kế tiếp để mình nhắc đúng ngày.',
                        href: '/admin/sokhambenh?action=add',
                        action: 'Thêm mốc',
                        tone: 'care'
                    });
                } else {
                const daysUntil = Math.ceil((new Date(nextAppt.nextDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntil <= 7) {
                    pending.push({
                        id: 'upcoming-visit',
                        title: 'Sắp tới mốc thai kỳ',
                        message: `Mốc kế tiếp vào ${formatDateShort(nextAppt.nextDate)}. Mẹ chuẩn bị sổ theo dõi và câu hỏi cho bác sĩ nhé.`,
                        href: '/admin/sokhambenh',
                        action: 'Xem sổ theo dõi',
                        tone: 'info'
                    });
                }
                }
            }

            if (!isHealthModule && !latestBP) {
                pending.push({
                    id: 'missing-bp',
                    title: 'Chưa có huyết áp',
                    message: 'Hôm nay mẹ nên ghi huyết áp để theo dõi nguy cơ tiền sản giật.',
                    href: '/admin/suc-khoe',
                    action: 'Ghi chỉ số',
                    tone: 'health'
                });
            }

            if (!isHealthModule && !latestBS && weeks >= 24) {
                pending.push({
                    id: 'missing-bs',
                    title: 'Theo dõi đường huyết',
                    message: 'Giai đoạn này nên theo dõi đường huyết, nhất là sau bữa ăn nhiều tinh bột.',
                    href: '/admin/suc-khoe',
                    action: 'Ghi đường huyết',
                    tone: 'health'
                });
            }

            if (!isVisitModule && (!profileData?.weightBefore || !latestVisitWithWeight)) {
                pending.push({
                    id: 'missing-weight',
                    title: 'Thiếu dữ liệu cân nặng',
                    message: 'Còn thiếu cân nặng trước bầu hoặc cân nặng lần khám gần nhất để so sánh tăng cân.',
                    href: !profileData?.weightBefore ? '/admin/settings' : '/admin/sokhambenh?action=add',
                    action: !profileData?.weightBefore ? 'Cập nhật hồ sơ' : 'Ghi sổ khám',
                    tone: 'warning'
                });
            }

            if (weekData?.advice) {
                pending.push({
                    id: `week-${weeks}-advice`,
                    title: `Thông báo hữu ích tuần ${weeks}`,
                    message: weekData.advice,
                    href: '/admin',
                    action: 'Đã hiểu',
                    tone: 'ok'
                });
            } else if (weekData?.toDoList?.[0]) {
                pending.push({
                    id: `week-${weeks}-todo`,
                    title: `Thông báo hữu ích tuần ${weeks}`,
                    message: weekData.toDoList[0],
                    href: '/admin',
                    action: 'Đã hiểu',
                    tone: 'ok'
                });
            }

            const unique = pending.filter((item, index, arr) => arr.findIndex(other => other.id === item.id) === index);
            const prioritized = unique
                .sort((a, b) => getAssistantNoticePriority(b, pathname) - getAssistantNoticePriority(a, pathname));
            const selected = prioritized.slice(0, 2);
            setAssistantNoticeList(selected);
            setAssistantNotice(selected[0]
                ? `${selected[0].title}: ${selected[0].message}`
                : 'Trợ lý: dữ liệu hôm nay ổn, chưa có việc cần nhắc ngay.'
            );
        };

        const unsubProfile = onSnapshot(doc(db, "users", user.uid, "settings", "profile"), (snap) => {
            profileData = snap.exists() ? snap.data() : null;
            refreshAssistantNotice();
        });

        const unsubVisits = onSnapshot(
            query(collection(db, "users", user.uid, "visits"), orderBy("date", "desc")),
            (snap) => {
                visitsData = snap.docs.map(d => d.data());
                refreshAssistantNotice();
            }
        );

        const unsubMeals = onSnapshot(
            query(collection(db, "users", user.uid, "nutrition_diary"), orderBy("datetime", "desc")),
            (snap) => {
                mealsData = snap.docs.map(d => d.data());
                refreshAssistantNotice();
            }
        );

        const unsubVitals = onSnapshot(
            query(collection(db, "users", user.uid, "health_vitals"), orderBy("datetime", "desc")),
            (snap) => {
                vitalsData = snap.docs.map(d => d.data());
                refreshAssistantNotice();
            }
        );

        const unsubKicks = onSnapshot(
            query(collection(db, "users", user.uid, "baby_kicks"), orderBy("startTime", "desc")),
            (snap) => {
                kicksData = snap.docs.map(d => d.data());
                refreshAssistantNotice();
            }
        );

        return () => {
            unsubProfile();
            unsubVisits();
            unsubMeals();
            unsubVitals();
            unsubKicks();
        };
    }, [pathname, user]);

    useEffect(() => {
        if (!pathname.startsWith('/admin')) return;

        const now = new Date().toISOString();
        const stored = readAssistantHistory();
        const merged = [...stored];

        assistantNoticeList.forEach((notice) => {
            const existingIndex = merged.findIndex(item => item.id === notice.id);
            if (existingIndex >= 0) {
                merged[existingIndex] = {
                    ...merged[existingIndex],
                    ...notice,
                    lastSeenAt: now
                };
            } else {
                merged.unshift({
                    ...notice,
                    firstSeenAt: now,
                    lastSeenAt: now,
                    archived: false
                });
            }
        });

        writeAssistantHistory(merged);
        const historyTimer = window.setTimeout(() => setAssistantHistory(merged), 0);
        return () => window.clearTimeout(historyTimer);
    }, [assistantNoticeList, pathname]);

    useEffect(() => {
        if (!isMobile || !pathname.startsWith('/admin')) {
            const syncTimer = window.setTimeout(() => setDisplayedAssistantNotice(assistantNotice), 0);
            return () => window.clearTimeout(syncTimer);
        }

        const compact = assistantNoticeList.length > 0
            ? `Trợ lý có ${assistantNoticeList.length} nhắc nhở`
            : 'Trợ lý: hôm nay ổn';

        const resetTimer = window.setTimeout(() => setDisplayedAssistantNotice(''), 0);
        let index = 0;
        const typing = setInterval(() => {
            index += 1;
            setDisplayedAssistantNotice(assistantNotice.slice(0, index));
            if (index >= assistantNotice.length) {
                clearInterval(typing);
            }
        }, 22);

        const retract = setTimeout(() => {
            setDisplayedAssistantNotice(compact);
        }, Math.min(3200, assistantNotice.length * 22 + 1600));

        return () => {
            clearTimeout(resetTimer);
            clearInterval(typing);
            clearTimeout(retract);
        };
    }, [assistantNotice, assistantNoticeList.length, isMobile, pathname]);

    const updateAssistantHistoryItem = (id: string, archived: boolean) => {
        const next = assistantHistory.map(item => item.id === id ? { ...item, archived } : item);
        setAssistantHistory(next);
        writeAssistantHistory(next);
    };

    const currentAssistantIds = new Set(assistantNoticeList.map(item => item.id));
    const activeAssistantHistory = assistantHistory.filter(item => !item.archived && currentAssistantIds.has(item.id));
    const pastAssistantHistory = assistantHistory.filter(item => !item.archived && !currentAssistantIds.has(item.id));
    const archivedAssistantHistory = assistantHistory.filter(item => item.archived);
    const visibleAssistantItems = assistantPanelTab === 'active'
        ? activeAssistantHistory
        : assistantPanelTab === 'past'
            ? pastAssistantHistory
            : archivedAssistantHistory;

    if (!user && !loading) return null;

    return (
        <div className="app-shell" style={{ 
            background: 'var(--bg-app)', 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            
            {/* Floating Offline Warning */}
            {isOffline && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 95,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: 'rgba(254, 226, 226, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    color: '#ef4444', 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <IoCloudOfflineOutline size={16} /> Kết nối ngoại tuyến
                </div>
            )}

            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            {/* Mobile Sticky Header Bar */}
            <div className="mobile-header-bar" style={{
                display: 'none', // Overridden to 'flex' in responsive.css
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: '56px',
                background: currentConfig.background,
                backdropFilter: (pathname === '/admin' || pathname === '/admin/dong-bo') ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: (pathname === '/admin' || pathname === '/admin/dong-bo') ? 'blur(12px)' : 'none',
                borderBottom: (pathname === '/admin' || pathname === '/admin/dong-bo') ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
                zIndex: 85,
                alignItems: 'center',
                padding: '0 16px',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentConfig.btnColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            marginLeft: '-8px'
                        }}
                    >
                        <IoMenuOutline size={26} />
                    </button>
                    {(pathname === '/admin' || pathname === '/admin/dong-bo') ? (
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: currentConfig.textColor, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#ea580c' }}>ThaiKy</span>Pro
                        </span>
                    ) : pathname === '/admin/search' ? (
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0px' }}>
                            <span style={{ color: '#4285F4' }}>T</span>
                            <span style={{ color: '#EA4335' }}>ì</span>
                            <span style={{ color: '#FBBC05' }}>m</span>
                            <span style={{ color: '#4285F4' }}>&nbsp;</span>
                            <span style={{ color: '#34A853' }}>k</span>
                            <span style={{ color: '#EA4335' }}>i</span>
                            <span style={{ color: '#FBBC05' }}>ế</span>
                            <span style={{ color: '#4285F4' }}>m</span>
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px', color: currentConfig.textColor }}>
                            {currentConfig.icon}
                            {currentConfig.title}
                        </span>
                    )}
                </div>

                {/* Right Area: Action Items (Notification Bell / Future APIs) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {pathname.startsWith('/admin') && isMobile && displayedAssistantNotice && (
                        <button
                            className="assistant-notice-pill"
                            onClick={() => setShowAssistantPanel(true)}
                            title={assistantNotice}
                            style={{
                                border: '1px solid rgba(13, 148, 136, 0.16)',
                                background: 'rgba(255, 255, 255, 0.76)',
                                color: currentConfig.textColor,
                                borderRadius: '999px',
                                padding: '6px 10px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 8px 22px rgba(13, 148, 136, 0.08)'
                            }}
                        >
                            {displayedAssistantNotice}
                        </button>
                    )}

                    {/* Search Button */}
                    <button 
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentConfig.btnColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            position: 'relative'
                        }}
                        onClick={() => {
                            router.push('/admin/search');
                        }}
                        aria-label="Tìm kiếm toàn ứng dụng"
                        title="Tìm kiếm (Cmd+K)"
                    >
                        <IoSearchOutline size={22} />
                    </button>

                    <button 
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentConfig.btnColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            position: 'relative',
                            marginRight: '-4px'
                        }}
                        onClick={() => {
                            if (pathname.startsWith('/admin')) {
                                setShowAssistantPanel(true);
                                return;
                            }
                            alert("Chức năng thông báo & đồng bộ tiện ích đang được phát triển.");
                        }}
                        aria-label="Mở thông báo"
                    >
                        <IoNotificationsOutline size={22} />
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '6px',
                            height: '6px',
                            background: currentConfig.textColor === '#ffffff' ? '#ffffff' : '#ef4444',
                            borderRadius: '50%',
                            border: currentConfig.textColor === '#ffffff' ? '1px solid ' + currentConfig.background : 'none'
                        }} />
                    </button>
                </div>
            </div>

            {showAssistantPanel && pathname.startsWith('/admin') && (
                <div className="assistant-panel-overlay" onClick={() => setShowAssistantPanel(false)}>
                    <div className="assistant-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="assistant-panel-handle" />
                        <div className="assistant-panel-header">
                            <div>
                                <div className="assistant-panel-eyebrow">
                                    <IoSparklesOutline size={14} />
                                    Trợ lý hôm nay
                                </div>
                                <h3>Thông báo hữu ích</h3>
                            </div>
                            <button
                                type="button"
                                className="assistant-panel-close"
                                onClick={() => setShowAssistantPanel(false)}
                                aria-label="Đóng thông báo"
                            >
                                <IoCloseOutline size={22} />
                            </button>
                        </div>

                        <div className="assistant-panel-tabs">
                            <button
                                type="button"
                                className={assistantPanelTab === 'active' ? 'active' : ''}
                                onClick={() => setAssistantPanelTab('active')}
                            >
                                Đang nhắc
                            </button>
                            <button
                                type="button"
                                className={assistantPanelTab === 'past' ? 'active' : ''}
                                onClick={() => setAssistantPanelTab('past')}
                            >
                                Đã qua
                            </button>
                            <button
                                type="button"
                                className={assistantPanelTab === 'archived' ? 'active' : ''}
                                onClick={() => setAssistantPanelTab('archived')}
                            >
                                Đã ẩn
                            </button>
                        </div>

                        <div className="assistant-panel-list">
                            {(visibleAssistantItems.length > 0 ? visibleAssistantItems : [{
                                id: assistantPanelTab === 'active' ? 'all-good' : assistantPanelTab === 'past' ? 'empty-past' : 'empty-archived',
                                title: assistantPanelTab === 'active'
                                    ? 'Dữ liệu hôm nay ổn'
                                    : assistantPanelTab === 'past'
                                        ? 'Chưa có thông báo cũ'
                                        : 'Chưa có thông báo đã ẩn',
                                message: assistantPanelTab === 'active'
                                    ? 'Chưa có việc cần nhắc ngay. Mẹ cứ tiếp tục theo dõi đều nhé.'
                                    : assistantPanelTab === 'past'
                                        ? 'Thông báo đã hết điều kiện sẽ tự chuyển vào đây để mẹ xem lại.'
                                        : 'Những thông báo mẹ ẩn sẽ nằm ở đây để phục hồi khi cần.',
                                href: '/admin',
                                action: assistantPanelTab === 'active' ? 'Đóng' : 'Quay lại',
                                tone: 'ok' as const,
                                firstSeenAt: new Date().toISOString(),
                                lastSeenAt: new Date().toISOString()
                            }]).map((item) => (
                                <div
                                    key={item.id}
                                    className={`assistant-notice-card tone-${item.tone}`}
                                >
                                    <div className="assistant-notice-icon">
                                        {item.tone === 'danger' ? <IoWarningOutline size={18} /> : <IoSparklesOutline size={18} />}
                                    </div>
                                    <div className="assistant-notice-body">
                                        <div className="assistant-notice-title">{item.title}</div>
                                        <p>{item.message}</p>
                                        <div className="assistant-notice-actions">
                                            <Link
                                                href={item.href}
                                                replace={item.href.includes('?')}
                                                onClick={() => setShowAssistantPanel(false)}
                                            >
                                                {item.action}
                                                <IoChevronForwardOutline size={14} />
                                            </Link>
                                            {!item.id.startsWith('empty-') && item.id !== 'all-good' && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateAssistantHistoryItem(item.id, assistantPanelTab !== 'archived')}
                                                >
                                                    {assistantPanelTab === 'archived' ? 'Phục hồi' : 'Ẩn'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .assistant-notice-pill {
                    max-width: min(44vw, 460px);
                }

                .assistant-panel-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 2400;
                    background: rgba(15, 23, 42, 0.34);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-end;
                    padding: 68px 16px 16px;
                    animation: assistantOverlayIn 0.24s ease-out;
                }

                .assistant-panel {
                    width: min(420px, calc(100vw - 32px));
                    max-height: min(720px, calc(100vh - 92px));
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    border-radius: 28px;
                    background: rgba(255, 255, 255, 0.92);
                    border: 1px solid rgba(255, 255, 255, 0.68);
                    box-shadow: 0 28px 70px rgba(15, 23, 42, 0.2);
                    animation: assistantPanelIn 0.36s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .assistant-panel-handle {
                    display: none;
                }

                .assistant-panel-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 22px 22px 16px;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
                }

                .assistant-panel-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #0f766e;
                    font-size: 0.72rem;
                    font-weight: 900;
                }

                .assistant-panel-header h3 {
                    margin: 4px 0 0;
                    font-size: 1.16rem;
                    color: #0f172a;
                    font-weight: 900;
                }

                .assistant-panel-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: #f1f5f9;
                    color: #334155;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .assistant-panel-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    overflow-y: auto;
                    padding: 14px;
                }

                .assistant-panel-tabs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    padding: 12px 14px 0;
                }

                .assistant-panel-tabs button {
                    border: none;
                    border-radius: 16px;
                    background: #f1f5f9;
                    color: #64748b;
                    cursor: pointer;
                    font-size: 0.76rem;
                    font-weight: 900;
                    padding: 10px 12px;
                    transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
                }

                .assistant-panel-tabs button.active {
                    background: #0f172a;
                    color: #ffffff;
                    transform: translateY(-1px);
                }

                .assistant-notice-card {
                    display: grid;
                    grid-template-columns: 38px minmax(0, 1fr);
                    gap: 12px;
                    align-items: flex-start;
                    text-decoration: none;
                    border-radius: 20px;
                    padding: 14px;
                    border: 1px solid rgba(226, 232, 240, 0.86);
                    background: #ffffff;
                    color: #0f172a;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                }

                .assistant-notice-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
                }

                .assistant-notice-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    background: #0d9488;
                }

                .assistant-notice-body {
                    min-width: 0;
                }

                .assistant-notice-title {
                    font-size: 0.84rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin-bottom: 3px;
                }

                .assistant-notice-body p {
                    margin: 0;
                    font-size: 0.78rem;
                    line-height: 1.42;
                    color: #475569;
                    font-weight: 600;
                }

                .assistant-notice-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 10px;
                }

                .assistant-notice-actions a,
                .assistant-notice-actions button {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border: none;
                    background: transparent;
                    text-decoration: none;
                    font-size: 0.72rem;
                    font-weight: 900;
                    cursor: pointer;
                    padding: 0;
                }

                .assistant-notice-actions a {
                    color: #0d9488;
                }

                .assistant-notice-actions button {
                    color: #64748b;
                }

                .assistant-notice-card.tone-danger {
                    background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%);
                    border-color: #fecdd3;
                }
                .assistant-notice-card.tone-danger .assistant-notice-icon {
                    background: #e11d48;
                }
                .assistant-notice-card.tone-danger .assistant-notice-actions a {
                    color: #be123c;
                }

                .assistant-notice-card.tone-warning {
                    background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
                    border-color: #fde68a;
                }
                .assistant-notice-card.tone-warning .assistant-notice-icon {
                    background: #d97706;
                }
                .assistant-notice-card.tone-warning .assistant-notice-actions a {
                    color: #b45309;
                }

                .assistant-notice-card.tone-health {
                    background: linear-gradient(135deg, #ecfeff 0%, #ffffff 100%);
                    border-color: #a5f3fc;
                }
                .assistant-notice-card.tone-health .assistant-notice-icon {
                    background: #0891b2;
                }
                .assistant-notice-card.tone-health .assistant-notice-actions a {
                    color: #0e7490;
                }

                .assistant-notice-card.tone-care {
                    background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
                    border-color: #bbf7d0;
                }
                .assistant-notice-card.tone-care .assistant-notice-icon {
                    background: #059669;
                }

                .assistant-notice-card.tone-info {
                    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
                    border-color: #bfdbfe;
                }
                .assistant-notice-card.tone-info .assistant-notice-icon {
                    background: #2563eb;
                }
                .assistant-notice-card.tone-info .assistant-notice-actions a {
                    color: #1d4ed8;
                }

                .assistant-notice-card.tone-ok {
                    background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
                    border-color: #99f6e4;
                }

                @keyframes assistantOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes assistantPanelIn {
                    from { opacity: 0; transform: translate3d(0, -8px, 0) scale(0.96); }
                    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                }

                @media (max-width: 600px) {
                    .assistant-notice-pill {
                        max-width: 112px;
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                        font-size: 0.68rem !important;
                    }

                    .assistant-panel-overlay {
                        align-items: flex-start;
                        justify-content: flex-end;
                        padding: 60px 24px 24px 24px;
                    }

                    .assistant-panel {
                        width: 400px;
                        max-height: 80vh;
                        border-radius: 20px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                        animation: assistantSheetIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .assistant-panel-handle {
                        display: none;
                    }

                    .assistant-panel-header {
                        padding-top: 14px;
                    }
                }

                @keyframes assistantSheetIn {
                    from { opacity: 0.86; transform: translate3d(0, 100%, 0); }
                    to { opacity: 1; transform: translate3d(0, 0, 0); }
                }
            `}</style>

            <main id="main-content" style={{ 
                flex: 1, 
                position: 'relative'
            }}>
                {loading ? (showSkeleton ? <AdminPageSkeleton /> : null) : children}
            </main>
        </div>
    );
}

function AdminPageSkeleton() {
    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
            {/* Top Large Banner Skeleton */}
            <div className="skeleton-item" style={{ height: '170px', borderRadius: '24px', width: '100%' }} />

            {/* Vitals Grid Skeletons */}
            <div className="vitals-grid-skeleton" style={{ display: 'grid', gap: '16px' }}>
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
            </div>

            {/* Split Skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="split-grid-skeleton">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="health-grid-skeleton">
                        <div className="skeleton-item" style={{ height: '160px', borderRadius: '24px' }} />
                        <div className="skeleton-item" style={{ height: '160px', borderRadius: '24px' }} />
                    </div>
                    <div className="skeleton-item" style={{ height: '76px', borderRadius: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton-item" style={{ height: '180px', borderRadius: '24px' }} />
                    <div className="skeleton-item" style={{ height: '180px', borderRadius: '24px' }} />
                </div>
            </div>
        </div>
    );
}
