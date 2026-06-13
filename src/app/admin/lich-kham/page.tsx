'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
    IoCalendarOutline, IoChevronForwardOutline, IoCheckmarkCircleOutline, 
    IoNotificationsOutline, IoTimeOutline, IoConstructOutline, IoFlowerOutline,
    IoHelpOutline, IoScanOutline, IoPulseOutline, IoPersonOutline, 
    IoScaleOutline, IoDocumentTextOutline, IoCalendarNumberOutline, 
    IoBulbOutline, IoChevronBackOutline
} from 'react-icons/io5';
import Link from 'next/link';

// MASTER DATA
const CHECKUP_MILESTONES = [
    { week: 8, title: "Khám thai lần đầu", desc: "Siêu âm xác định 'tổ ấm' của bé và nghe nhịp tim đầu tiên.", icon: "heart" },
    { week: 12, title: "Đo độ mờ da gáy", desc: "Thời điểm vàng để sàng lọc dị tật (Double Test/NIPT). Đừng bỏ lỡ!", icon: "scan" },
    { week: 16, title: "Siêu âm hình thái sớm", desc: "Kiểm tra tay chân, sứt môi, hở hàm ếch. Có thể biết trai hay gái rồi nhé!", icon: "pulse" },
    { week: 22, title: "Siêu âm 4D hình thái", desc: "Soát kỹ từng cơ quan nội tạng: tim, phổi, thận, não. Quan trọng nhất thai kỳ.", icon: "baby" },
    { week: 26, title: "Tiêm uốn ván & Tiểu đường", desc: "Uống nước đường 'thần thánh' để kiểm tra tiểu đường thai kỳ.", icon: "syringe" },
    { week: 32, title: "Kiểm tra ngôi thai", desc: "Xem bé đã quay đầu chưa? Đánh giá cân nặng để tiên lượng sinh thường/mổ.", icon: "weight" },
    { week: 36, title: "Làm hồ sơ sinh", desc: "Xét nghiệm liên cầu khuẩn (GBS). Chạy máy Monitor nghe tim thai.", icon: "file" },
    { week: 38, title: "Khám hàng tuần", desc: "Gặp bác sĩ thường xuyên hơn để theo dõi dấu hiệu chuyển dạ.", icon: "clock" },
    { week: 39, title: "Sẵn sàng nhập viện", desc: "Tâm lý thoải mái, đồ đạc sẵn sàng. Bé có thể gõ cửa bất cứ lúc nào.", icon: "bag" },
    { week: 40, title: "Về đích", desc: "Chào mừng thiên thần nhỏ! Mẹ đã làm rất tốt.", icon: "party" }
];

const FETAL_DEVELOPMENT = [
    { 
        range: "Tháng 1 (Tuần 1-4)",
        size: "Hạt mè tí hon",
        title: "Cuộc gặp gỡ định mệnh",
        desc: "Ba và Mẹ đã tạo ra một 'vụ nổ Big Bang' tí hon! Trứng thụ tinh đang tìm đường về tử cung để xây tổ ấm.",
        funFact: "Bé lúc này chỉ là một nhóm tế bào, nhưng đã mang đầy đủ mã gen quy định màu mắt và màu tóc rồi đó!"
    },
    { 
        range: "Tháng 2 (Tuần 5-8)",
        size: "Quả việt quất",
        title: "Trái tim dũng cảm",
        desc: "Bùm... Bùm... Tim thai bắt đầu đập nhanh gấp đôi tim mẹ! Tay chân bé xíu đang nhú ra như những chồi non.",
        funFact: "Đuôi của bé đang dần biến mất. Bé trông bớt giống nòng nọc và giống con người hơn rồi."
    },
    { 
        range: "Tháng 3 (Tuần 9-12)",
        size: "Quả chanh ta",
        title: "Bé biết làm trò",
        desc: "Bé đã có thể mút ngón tay, ngáp và nhăn mặt, dù mẹ chưa cảm nhận được đâu. Các ngón tay đã tách rời nhau.",
        funFact: "Dấu vân tay độc nhất vô nhị của bé đã bắt đầu hình thành từ tuần này!"
    },
    { 
        range: "Tháng 4 (Tuần 13-16)",
        size: "Quả bơ sáp",
        title: "Thám tử lắng nghe",
        desc: "Thính giác phát triển mạnh. Bé có thể nghe thấy nhịp tim mẹ và cả tiếng ồn bên ngoài. Hãy nói chuyện với bé nhé!",
        funFact: "Nếu soi đèn pin vào bụng mẹ, bé có thể quay mặt đi để tránh ánh sáng chói đấy."
    },
    { 
        range: "Tháng 5 (Tuần 17-20)",
        size: "Quả chuối tiêu",
        title: "Vũ công Hip-hop",
        desc: "Mẹ sẽ cảm nhận được những cú 'tung chưởng' đầu tiên (thai máy). Bé nhào lộn, uốn éo suốt ngày trong bụng mẹ.",
        funFact: "Một lớp sáp trắng (gây) bao phủ toàn thân giúp da bé không bị nhăn nheo khi ngâm nước ối quá lâu."
    },
    { 
        range: "Tháng 6 (Tuần 21-24)",
        size: "Bắp ngô",
        title: "Luyện tập hít thở",
        desc: "Phổi bé đang tập hít vào thở ra (dù chỉ là nước ối) để chuẩn bị cho tiếng khóc chào đời. Vị giác đã phân biệt được mùi vị thức ăn mẹ ăn.",
        funFact: "Bé có thể bị nấc cụt! Mẹ sẽ thấy bụng giật giật đều đều như tiếng đồng hồ tích tắc."
    },
    { 
        range: "Tháng 7 (Tuần 25-28)",
        size: "Quả cà tím to",
        title: "Đôi mắt long lanh",
        desc: "Bé đã mở mắt! Bé có thể chớp mắt và nhìn thấy ánh sáng mờ mờ xuyên qua thành bụng. Lớp mỡ dưới da dày lên giúp bé mũm mĩm hơn.",
        funFact: "Bé đã biết mơ! Những giấc mơ đầu đời diễn ra ngay trong bụng mẹ."
    },
    { 
        range: "Tháng 8 (Tuần 29-32)",
        size: "Quả bí đỏ",
        title: "Xoay chuyển càn khôn",
        desc: "Không gian chật chội nên bé bớt nhào lộn, thay vào đó là những cú đạp và trườn mạnh mẽ. Đa số các bé sẽ quay đầu xuống dưới.",
        funFact: "Móng tay bé đã mọc dài, đôi khi bé tự cào xước mặt mình ngay trong bụng mẹ."
    },
    { 
        range: "Tháng 9 (Tuần 33-36)",
        size: "Quả đu đủ xanh",
        title: "Luyện công nội lực",
        desc: "Hệ miễn dịch của mẹ đang truyền kháng thể sang cho bé. Xương sọ vẫn còn mềm để dễ dàng chui qua đường sinh.",
        funFact: "Lớp lông tơ rụng dần, bé nuốt chúng vào và tạo thành phân su (chất thải đầu tiên của bé)."
    },
    { 
        range: "Về đích (Tuần 37-40)",
        size: "Quả dưa hấu",
        title: "Sẵn sàng ra mắt!",
        desc: "Bé đã đủ tháng và sẵn sàng chào đời bất cứ lúc nào. Mọi cơ quan đã hoạt động độc lập.",
        funFact: "Tiếng khóc chào đời của bé chính là cách phổi bung nở và bắt đầu hoạt động chính thức!"
    }
];

export default function LichKhamPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'checkup' | 'fetal'>('checkup');
    const currentContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        setUser(currentUser);

        const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
            if (d.exists()) {
                setProfile(d.data());
            }
        });

        return () => unsubscribe();
    }, []);

    // Scroll to current milestone once loaded
    useEffect(() => {
        if (activeTab === 'checkup') {
            setTimeout(() => {
                const current = document.querySelector('.milestone-item.current');
                if (current) {
                    current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 600);
        }
    }, [activeTab, profile.lmp]);

    const getMenuIcon = (iconName: string, size = 20) => {
        switch (iconName) {
            case 'heart': return <IoPulseOutline size={size} />;
            case 'scan': return <IoScanOutline size={size} />;
            case 'pulse': return <IoPulseOutline size={size} />;
            case 'baby': return <IoFlowerOutline size={size} />;
            case 'syringe': return <IoConstructOutline size={size} />;
            case 'weight': return <IoScaleOutline size={size} />;
            case 'file': return <IoDocumentTextOutline size={size} />;
            case 'clock': return <IoTimeOutline size={size} />;
            case 'bag': return <IoFlowerOutline size={size} />;
            case 'party': return <IoFlowerOutline size={size} />;
            default: return <IoHelpOutline size={size} />;
        }
    };

    if (!profile.lmp) {
        return (
            <div className="utility-page-container fade-in">
                <div className="hero-card-s" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #f472b6 100%)', boxShadow: '0 12px 30px rgba(139, 92, 246, 0.25)', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                            <IoCalendarOutline size={30} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Hành trình 40 tuần</h2>
                            <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4, fontWeight: 500 }}>Theo dõi sự lớn khôn kỳ diệu của bé yêu mỗi ngày.</p>
                        </div>
                    </div>
                </div>

                <div className="card-glass-fallback-p" style={{ textAlign: 'center', padding: '40px 24px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '24px', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ background: '#f3e8ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#8b5cf6' }}>
                        <IoCalendarNumberOutline size={32} />
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>Thiếu thông tin ngày kinh cuối</h4>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>Mẹ chưa nhập <b>Ngày kinh cuối (LMP)</b> nên chưa thể tính toán lịch khám thai chính xác.</p>
                    <Link href="/admin/settings" replace className="btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px', borderRadius: '12px', background: '#8b5cf6', border: 'none', color: 'white', fontWeight: 700, boxShadow: '0 8px 20px rgba(139, 92, 246, 0.25)' }}>
                        Cập nhật hồ sơ ngay
                    </Link>
                </div>
            </div>
        );
    }

    const lmp = new Date(profile.lmp);
    const today = new Date();
    const currentWeeks = (today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7);

    const totalDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const weeksPart = Math.floor(totalDays / 7);
    const daysPart = totalDays % 7;
    const progressPercentage = Math.min(Math.max((totalDays / 280) * 100, 0), 100);

    // Calc checkup milestone indices
    let nextMilestoneIndex = CHECKUP_MILESTONES.findIndex(m => m.week > currentWeeks);
    if (nextMilestoneIndex === -1) nextMilestoneIndex = CHECKUP_MILESTONES.length;

    const nextMilestone = CHECKUP_MILESTONES[nextMilestoneIndex] || null;
    let daysToNextCheckup: number | null = null;
    if (nextMilestone) {
        const nextMilestoneDate = new Date(lmp.getTime() + nextMilestone.week * 7 * 24 * 60 * 60 * 1000);
        daysToNextCheckup = Math.ceil((nextMilestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Fetus month index based on gestational weeks
    let currentMonthIdx = Math.floor(currentWeeks / 4);
    if (currentMonthIdx < 0) currentMonthIdx = 0;
    if (currentMonthIdx > 9) currentMonthIdx = 9;

    const addToCalendar = (dateStr: string, title: string) => {
        const d = dateStr.replace(/-/g, '');
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Khám thai: ' + title)}&dates=${d}T080000/${d}T110000`);
    };

    return (
        <div className="utility-page-container fade-in">
            {/* Header Banner */}
            <div className="hero-card-s">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoCalendarOutline size={30} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Hành trình 40 tuần</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4, fontWeight: 500 }}>Theo dõi sự lớn khôn kỳ diệu của bé yêu mỗi ngày.</p>
                    </div>
                </div>

                {/* Progress bar */}
                {profile.lmp && (
                    <div className="progress-container-s" style={{ marginTop: '20px', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', opacity: 0.95 }}>
                            <span>Tuần thứ {weeksPart} ({daysPart} ngày)</span>
                            <span>Mục tiêu: Tuần 40</span>
                        </div>
                        <div className="progress-track-s" style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', position: 'relative' }}>
                            <div className="progress-fill-s" style={{ height: '100%', width: `${progressPercentage}%`, background: 'white', borderRadius: '4px', position: 'relative', transition: 'width 0.5s ease-out' }}>
                                <div className="baby-emoji-s" style={{ position: 'absolute', right: '-12px', top: '-10px', fontSize: '1.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', animation: 'float-baby 2s ease-in-out infinite' }}>👶</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, marginTop: '6px', opacity: 0.85 }}>
                            Đã hoàn thành {progressPercentage.toFixed(1)}% chặng đường
                        </div>
                    </div>
                )}
            </div>

            {/* Segment Controls */}
            <div className="segmented-control">
                <button 
                    onClick={() => setActiveTab('checkup')} 
                    className={`segment-btn ${activeTab === 'checkup' ? 'active' : ''}`}
                >
                    Lịch khám
                </button>
                <button 
                    onClick={() => setActiveTab('fetal')} 
                    className={`segment-btn ${activeTab === 'fetal' ? 'active' : ''}`}
                >
                    Bé phát triển
                </button>
            </div>

            {/* View 1: Lịch khám thai */}
            {activeTab === 'checkup' && (
                <div className="checkup-layout-p">
                    {/* Sidebar: Current Stage Summary */}
                    <div className="pregnancy-sidebar-p">
                        <div className="sidebar-card-p">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoFlowerOutline style={{ color: '#8b5cf6' }} />
                                Chặng đường hôm nay
                            </h3>
                            <div className="circular-progress-box-p">
                                <div className="circle-svg-wrap">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#purpleGradient)" strokeWidth="8" 
                                            strokeDasharray="314"
                                            strokeDashoffset={314 - (314 * progressPercentage) / 100}
                                            strokeLinecap="round"
                                            transform="rotate(-90 60 60)"
                                        />
                                        <defs>
                                            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#f472b6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="circle-text-p">
                                        <span className="percent-val">{progressPercentage.toFixed(0)}%</span>
                                        <span className="percent-lbl">hoàn thành</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 700 }}>Mẹ đang ở tuần:</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>
                                    {weeksPart > 0 ? `${weeksPart} tuần ${daysPart} ngày` : `${daysPart} ngày`}
                                </div>
                            </div>

                            {nextMilestone && (
                                <div className="next-milestone-box-p" style={{ marginTop: '20px', padding: '14px', background: 'rgba(139, 92, 246, 0.06)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Mốc khám tiếp theo
                                    </div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {getMenuIcon(nextMilestone.icon, 16)}
                                        {nextMilestone.title}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', marginTop: '4px', lineHeight: 1.4 }}>
                                        Tuần {nextMilestone.week} ({nextMilestone.desc})
                                    </div>
                                    {daysToNextCheckup !== null && (
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IoTimeOutline />
                                            {daysToNextCheckup > 0 ? `Còn khoảng ${daysToNextCheckup} ngày` : daysToNextCheckup === 0 ? 'Hôm nay đến lịch khám!' : 'Đã qua lịch hẹn'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Column */}
                    <div id="view-checkup" className="timeline-main-p" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {CHECKUP_MILESTONES.map((m, index) => {
                            const dateOfMilestone = new Date(lmp.getTime() + m.week * 7 * 24 * 60 * 60 * 1000);
                            const dateStr = `${dateOfMilestone.getDate()}/${dateOfMilestone.getMonth() + 1}/${dateOfMilestone.getFullYear()}`;
                            
                            let statusClass = 'future';
                            let isPast = false;
                            let isCurrent = false;
                            
                            if (index < nextMilestoneIndex) {
                                statusClass = 'past';
                                isPast = true;
                            } else if (index === nextMilestoneIndex) {
                                statusClass = 'current';
                                isCurrent = true;
                            }

                            return (
                                <div className={`milestone-item ${statusClass}`} key={index} style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                                    <div className="milestone-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                                        {isPast && (
                                            <div className="status-dot check" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', border: '3px solid white', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, color: 'white' }}>
                                                <IoCheckmarkCircleOutline size={14} />
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="status-dot active" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8b5cf6', border: '3px solid white', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#8b5cf6', animation: 'pulse-ring 2s infinite' }} />
                                            </div>
                                        )}
                                        {!isPast && !isCurrent && (
                                            <div className="status-dot" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', border: '3px solid white', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }} />
                                        )}
                                        <div className="line" style={{ flex: 1, width: '2px', background: '#e2e8f0', marginTop: '5px', display: index === CHECKUP_MILESTONES.length - 1 ? 'none' : 'block' }} />
                                    </div>
                                    <div className="milestone-content" style={{ flex: 1, padding: '18px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '20px', opacity: isPast ? 0.82 : 1, border: isCurrent ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.5)', transform: isCurrent ? 'translateX(3px)' : 'none', boxShadow: isCurrent ? '0 10px 30px rgba(139, 92, 246, 0.15)' : 'var(--shadow-soft)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                        <div className="milestone-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                            <span className="week-badge" style={{ background: isCurrent ? '#8b5cf6' : 'rgba(148, 163, 184, 0.1)', color: isCurrent ? 'white' : 'var(--text-main)', fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>
                                                Tuần {m.week}
                                            </span>
                                            <span className="date-badge" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sub)' }}>{dateStr}</span>
                                        </div>
                                        <div className="milestone-title" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <span style={{ color: isCurrent ? '#8b5cf6' : 'var(--text-sub)', display: 'inline-flex' }}>{getMenuIcon(m.icon)}</span>
                                            {m.title}
                                            {isCurrent && (
                                                <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 800, marginLeft: '6px', background: '#fff7ed', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.15)' }}>Sắp tới</span>
                                            )}
                                        </div>
                                        <p className="milestone-desc" style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, margin: 0, textAlign: 'justify' }}>{m.desc}</p>
                                        
                                        {isCurrent && (
                                            <div style={{ marginTop: '12px', borderTop: '1.5px dashed rgba(139, 92, 246, 0.15)', paddingTop: '12px' }}>
                                                <button 
                                                    onClick={() => addToCalendar(dateOfMilestone.toISOString().split('T')[0], m.title)} 
                                                    className="btn-calendar-add-p"
                                                    style={{ margin: 0, fontSize: '0.8rem', padding: '8px 14px', background: '#fff7ed', color: '#c2410c', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                                                >
                                                    <IoNotificationsOutline size={14} /> Nhắc tôi trên Google Lịch
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* View 2: Bé phát triển */}
            {activeTab === 'fetal' && (
                <div id="view-fetal" className="fetal-grid-p fade-in">
                    {FETAL_DEVELOPMENT.map((item, index) => {
                        const isCurrent = index === currentMonthIdx;
                        const colors = ['#f472b6', '#38bdf8', '#a78bfa', '#facc15', '#4ade80', '#fb923c', '#f87171', '#c084fc', '#2dd4bf', '#fb7185'];
                        const accentColor = colors[index % colors.length];

                        return (
                            <div 
                                className={`fetal-card-p ${isCurrent ? 'highlight-card-p' : ''}`} 
                                key={index} 
                                style={{ 
                                    padding: '20px', borderRadius: '24px', 
                                    background: 'rgba(255, 255, 255, 0.7)', 
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: isCurrent ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.5)', 
                                    position: 'relative', overflow: 'hidden',
                                    boxShadow: isCurrent ? `0 12px 30px ${accentColor}25` : 'var(--shadow-soft)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {isCurrent && (
                                    <div className="current-badge-p" style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${accentColor} 0%, #ea580c 100%)`, color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '6px 12px', borderBottomLeftRadius: '16px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        Bé đang ở đây!
                                    </div>
                                )}
                                <div className="fetal-header-p" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div className="fetal-range-p" style={{ background: `${accentColor}12`, color: accentColor, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '5px 12px', borderRadius: '8px' }}>
                                        {item.range}
                                    </div>
                                    <div className="fetal-size-p" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Bằng: <b style={{ color: accentColor }}>{item.size}</b>
                                    </div>
                                </div>
                                <div className="fetal-body-p">
                                    <h3 className="fetal-title-p" style={{ color: accentColor, fontSize: '1.2rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>{item.title}</h3>
                                    <p className="fetal-desc-p" style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: '0 0 14px 0', textAlign: 'justify' }}>{item.desc}</p>
                                    
                                    <div className="fun-fact-box-p" style={{ background: '#fffbeb', border: '1.5px dashed #fde047', padding: '12px 14px', borderRadius: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.88rem', color: '#854d0e', lineHeight: 1.55 }}>
                                        <IoBulbOutline size={18} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px', animation: 'pulse-bulb 1.5s infinite alternate' }} />
                                        <span><b>Bí mật:</b> {item.funFact}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '30px', lineHeight: 1.6, paddingBottom: '20px' }}>
                Tham khảo nguồn y khoa từ: <a href="https://www.vinmec.com/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Vinmec</a> • <a href="https://tamanhhospital.vn/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Tâm Anh</a> • <a href="https://medlatec.vn/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Medlatec</a>
            </div>

            <style jsx global>{`
                .hero-card-s {
                    padding: 24px;
                    margin-bottom: 24px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #f472b6 100%);
                    box-shadow: 0 12px 30px rgba(139, 92, 246, 0.25);
                    border-radius: 24px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .segmented-control {
                    display: flex;
                    background: rgba(148, 163, 184, 0.08);
                    padding: 4px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }

                .segment-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    font-weight: 700;
                    color: var(--text-sub);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.88rem;
                }

                .segment-btn.active {
                    background: white;
                    color: #8b5cf6;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                @media (max-width: 600px) {
                    .hero-card-s {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                    .segmented-control {
                        margin-bottom: 20px;
                    }
                    .segment-btn {
                        padding: 10px 4px;
                        font-size: 0.84rem;
                    }
                }

                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.5); }
                    70% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                }

                @keyframes float-baby {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                    100% { transform: translateY(0); }
                }

                @keyframes pulse-bulb {
                    from { opacity: 0.8; transform: scale(1); }
                    to { opacity: 1; transform: scale(1.15); }
                }

                /* Lịch khám Layout */
                .checkup-layout-p {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                /* Fetal Grid Layout */
                .fetal-grid-p {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                /* Sidebar Card Styles */
                .sidebar-card-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                    position: sticky;
                    top: 20px;
                }

                .circular-progress-box-p {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }

                .circle-svg-wrap {
                    position: relative;
                    width: 120px;
                    height: 120px;
                }

                .circle-text-p {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .percent-val {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #8b5cf6;
                    line-height: 1;
                }

                .percent-lbl {
                    font-size: 0.62rem;
                    font-weight: 700;
                    color: var(--text-sub);
                    text-transform: uppercase;
                    margin-top: 2px;
                    white-space: nowrap;
                }

                /* Interactive Effects */
                .milestone-content:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 12px 24px rgba(139, 92, 246, 0.08) !important;
                }

                .fetal-card-p:hover {
                    transform: translateY(-3px) !important;
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06) !important;
                }

                .fetal-card-p.highlight-card-p:hover {
                    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.15) !important;
                }

                .btn-calendar-add-p:hover {
                    background: #ffedd5 !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
                }

                /* RESPONSIVE MEDIA QUERIES */
                @media (min-width: 992px) {
                    .checkup-layout-p {
                        display: grid;
                        grid-template-columns: 320px 1fr;
                        align-items: start;
                    }

                    .fetal-grid-p {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
}
