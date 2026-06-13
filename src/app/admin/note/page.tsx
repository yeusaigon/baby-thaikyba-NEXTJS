'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDataForWeek } from '@/lib/data';
import { 
    IoChevronBackOutline, IoChevronForwardOutline, IoBookOutline, 
    IoBodyOutline, IoPersonAddOutline, IoMedkitOutline, 
    IoWarningOutline, IoCheckboxOutline, IoBulbOutline,
    IoCloseOutline, IoSparklesOutline
} from 'react-icons/io5';

// FETAL IMAGES DB
const FETAL_IMAGES_DB: Record<number, { img: string; desc: string }> = {
    1: { img: "https://www.vinmec.com/static/uploads/20200505_153225_641606_1_max_1800x1800_jpeg_87120651dc.jpg", desc: "Giai đoạn thụ thai: Tinh trùng gặp trứng và bắt đầu hành trình di chuyển về tử cung để làm tổ." },
    4: { img: "https://www.vinmec.com/static/uploads/20200505_153146_888354_2_max_1800x1800_jpeg_7e602c458c.jpg", desc: "Thai nhi 4 tuần tuổi: Phôi thai bắt đầu hình thành các lớp tế bào, tiền thân của các cơ quan nội tạng." },
    8: { img: "https://www.vinmec.com/static/uploads/20200505_153131_022438_3_max_1800x1800_jpeg_9c04902612.jpg", desc: "Thai nhi 8 tuần tuổi: Bé đã có hình hài con người, các ngón tay ngón chân bắt đầu tách rời." },
    12: { img: "https://www.vinmec.com/static/uploads/20200505_153052_856774_4_max_1800x1800_jpeg_4ff1e57aa6.jpg", desc: "Thai nhi 12 tuần tuổi: Khuôn mặt đã hoàn thiện, bé biết nhăn mặt và có phản xạ nuốt." },
    16: { img: "https://www.vinmec.com/static/uploads/20200505_153022_567147_5_max_1800x1800_jpeg_a7ca5c1d0e.jpg", desc: "Thai nhi 16 tuần tuổi: Hệ xương cứng cáp hơn, mẹ bắt đầu cảm nhận được những cử động nhẹ (thai máy)." },
    20: { img: "https://www.vinmec.com/static/uploads/20200505_152922_687125_6a_max_1800x1800_jpeg_0799b063bd.jpg", desc: "Thai nhi 20 tuần tuổi: Bé phát triển thính giác, có thể nghe được nhịp tim và giọng nói của mẹ." },
    24: { img: "https://www.vinmec.com/static/uploads/20200505_152854_931723_7_max_1800x1800_jpeg_eeb1cf4fe0.jpg", desc: "Thai nhi 24 tuần tuổi: Phổi bắt đầu hình thành các nhánh hô hấp, bé tập thở trong nước ối." },
    28: { img: "https://www.vinmec.com/static/uploads/20200505_152819_100706_8_max_1800x1800_jpeg_84f02313d8.jpg", desc: "Thai nhi 28 tuần tuổi: Bé đã có thể mở mắt và chớp mắt. Lớp mỡ dưới da giúp bé trông bụ bẫm hơn." },
    32: { img: "https://www.vinmec.com/static/uploads/20200505_152747_953087_9_max_1800x1800_jpeg_8c76a1e52f.jpg", desc: "Thai nhi 32 tuần tuổi: Bé quay đầu (ngôi thuận) để chuẩn bị chào đời. Không gian tử cung trở nên chật chội." },
    36: { img: "https://www.vinmec.com/static/uploads/20200505_152719_851957_10_max_1800x1800_jpeg_d7d2bb2b81.jpg", desc: "Thai nhi 36 tuần tuổi: Các cơ quan đã hoàn thiện. Bé tụt xuống khung chậu mẹ." },
    38: { img: "https://www.vinmec.com/static/uploads/20200505_152635_789035_11_max_1800x1800_jpeg_67fafa38c9.jpg", desc: "Sẵn sàng chào đời: Bé đã đủ tháng, da dẻ hồng hào và sẵn sàng gặp ba mẹ!" }
};

function getFetalImageInfo(week: number) {
    const milestones = Object.keys(FETAL_IMAGES_DB).map(Number).sort((a, b) => b - a);
    for (let m of milestones) {
        if (week >= m) return FETAL_IMAGES_DB[m];
    }
    return FETAL_IMAGES_DB[1];
}

export default function HandbookPage() {
    const [user, setUser] = useState<any>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(4);
    const [loading, setLoading] = useState<boolean>(true);
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docSnap = await getDoc(doc(db, "users", currentUser.uid, "settings", "profile"));
                    if (docSnap.exists() && docSnap.data().lmp) {
                        const lmp = docSnap.data().lmp;
                        const diff = new Date().getTime() - new Date(lmp).getTime();
                        let week = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
                        if (week < 1) week = 1;
                        if (week > 42) week = 42;
                        setCurrentWeek(week);
                    }
                } catch (e) {
                    console.error("Lỗi lấy tuần thai:", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Center the active week timeline item
    useEffect(() => {
        if (timelineRef.current) {
            const container = timelineRef.current;
            const activeItem = container.querySelector('.timeline-item.active') as HTMLElement;
            if (activeItem) {
                container.scrollTo({
                    left: activeItem.offsetLeft - container.clientWidth / 2 + activeItem.clientWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentWeek, loading]);

    // Handle ESC key to close lightbox
    useEffect(() => {
        if (!isLightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLightboxOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen]);

    const changeWeek = (delta: number) => {
        let newWeek = currentWeek + delta;
        if (newWeek < 1) newWeek = 1;
        if (newWeek > 42) newWeek = 42;
        setCurrentWeek(newWeek);
    };

    const weekData = getDataForWeek(currentWeek);
    const imgData = getFetalImageInfo(currentWeek);

    // Compute dynamic colors and trimester information
    let themeColor = '#0d9488';
    let themeColorLight = '#e6f4f2';
    let themeColorDark = '#0f766e';
    let trimesterName = 'Tam Cá Nguyệt 1';
    
    if (currentWeek > 13 && currentWeek <= 27) {
        themeColor = '#f59e0b';
        themeColorLight = '#fffbeb';
        themeColorDark = '#b45309';
        trimesterName = 'Tam Cá Nguyệt 2';
    } else if (currentWeek > 27) {
        themeColor = '#ec4899';
        themeColorLight = '#fff1f2';
        themeColorDark = '#be185d';
        trimesterName = 'Tam Cá Nguyệt 3';
    }

    const totalWeeks = 42;
    const progressPercent = Math.min(Math.max((currentWeek / totalWeeks) * 100, 0), 100);
    const remainingWeeks = totalWeeks - currentWeek;

    return (
        <>
            <div className="utility-page-container fade-in">
                {/* Header Title (Hero Banner) - hidden on mobile */}
                <div className="handbook-header-banner" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', padding: '24px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 10px 25px rgba(20, 184, 166, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoBookOutline /> Cẩm Nang Mẹ Bầu
                            </h2>
                            <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '6px', fontWeight: 500, margin: '6px 0 0 0' }}>Kiến thức thai kỳ theo từng tuần phát triển của bé yêu.</p>
                        </div>
                    </div>
                </div>

                {/* Week navigation and Timeline ribbon - always visible */}
                <div className="handbook-nav-container card" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', padding: '20px', marginBottom: '20px', borderRadius: '24px' }}>
                    {/* Week navigation buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <button className="nav-btn" onClick={() => changeWeek(-1)} title="Tuần trước">
                            <IoChevronBackOutline />
                        </button>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: themeColorDark, transition: 'color 0.3s' }}>
                            Tuần thứ {currentWeek}
                        </div>
                        <button className="nav-btn" onClick={() => changeWeek(1)} title="Tuần sau">
                            <IoChevronForwardOutline />
                        </button>
                    </div>

                    {/* Timeline ribbon week list */}
                    <div className="week-timeline-container" ref={timelineRef}>
                        {Array.from({ length: 42 }, (_, i) => i + 1).map((w) => {
                            let wColor = '#0d9488';
                            if (w > 13 && w <= 27) wColor = '#f59e0b';
                            if (w > 27) wColor = '#ec4899';
                            
                            return (
                                <button
                                    key={w}
                                    className={`timeline-item ${w === currentWeek ? 'active' : ''}`}
                                    onClick={() => setCurrentWeek(w)}
                                    style={{
                                        '--item-theme-color': wColor,
                                    } as React.CSSProperties}
                                >
                                    {w}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="card text-center" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '24px' }}>
                        <p style={{ color: 'var(--text-sub)' }}>Đang tải thông tin cẩm nang...</p>
                    </div>
                ) : (
                    <div className="handbook-layout">
                        {/* LEFT COLUMN: HERO SUMMARY & IMAGE */}
                        <div className="handbook-left-col">
                            {/* Hero baby card */}
                            <div className="hero-card" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorDark} 100%)`, transition: 'all 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '15px' }}>
                                    <div className="fruit-icon">
                                        {weekData.emoji || '👶'}
                                    </div>
                                    <div>
                                        <div className="badge-growth-title">Kích thước bằng</div>
                                        <div className="growth-fruit-name">{weekData.size}</div>
                                        <div className="growth-weight">Ước lượng: {weekData.weight}</div>
                                    </div>
                                </div>
                                <div className="fetal-img-card" onClick={() => setIsLightboxOpen(true)}>
                                    <img 
                                        src={imgData.img} 
                                        alt="Minh họa thai nhi" 
                                    />
                                    <div className="fetal-img-caption">
                                        {imgData.desc} 
                                        <span className="source-tag">(Vinmec)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fetal Journey progress indicator */}
                            <div className="progress-tracker-card card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)', letterSpacing: '0.5px' }}>TIẾN TRÌNH THAI KỲ</span>
                                    <span className="trimester-badge" style={{ backgroundColor: themeColorLight, color: themeColorDark }}>
                                        {trimesterName}
                                    </span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, backgroundColor: themeColor }}></div>
                                    <div className="progress-bar-marker" style={{ left: '30.9%' }}></div> {/* w13 marker */}
                                    <div className="progress-bar-marker" style={{ left: '64.2%' }}></div> {/* w27 marker */}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                    <span>Tuần {currentWeek} / 42</span>
                                    <span style={{ color: themeColorDark }}>Còn {remainingWeeks} tuần đến ngày dự sinh</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DETAILED ADVICE & INFO BOXES */}
                        <div className="handbook-right-col">
                            {/* Bé yêu */}
                            <div className="card info-box" style={{ borderLeft: `5px solid ${themeColor}` }}>
                                <h4 className="box-title" style={{ color: themeColor }}>
                                    <IoBodyOutline style={{ fontSize: '1.3rem' }} /> Bé yêu tuần này
                                </h4>
                                <p className="box-text">
                                    {weekData.baby}
                                </p>
                            </div>

                            {/* Cơ thể mẹ */}
                            <div className="card info-box" style={{ borderLeft: `5px solid ${themeColor}` }}>
                                <h4 className="box-title" style={{ color: themeColor }}>
                                    <IoPersonAddOutline style={{ fontSize: '1.3rem' }} /> Cơ thể mẹ bầu
                                </h4>
                                <p className="box-text">
                                    {weekData.mom}
                                </p>
                            </div>

                            {/* Lời khuyên */}
                            <div className="card info-box" style={{ borderLeft: '5px solid #10b981' }}>
                                <h4 className="box-title" style={{ color: '#10b981' }}>
                                    <IoMedkitOutline style={{ fontSize: '1.3rem' }} /> Lời khuyên của bác sĩ
                                </h4>
                                <p className="box-text" style={{ color: '#0f766e', fontWeight: 700, marginBottom: '12px' }}>
                                    {weekData.advice}
                                </p>
                                {weekData.detail && weekData.detail.length > 0 && (
                                    <div className="advice-details">
                                        {weekData.detail.map((d, index) => (
                                            <div key={index} className="advice-bullet">
                                                <IoSparklesOutline style={{ fontSize: '0.78rem', color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                                                <span>{d}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Triệu chứng */}
                            {weekData.symptoms && weekData.symptoms.length > 0 && (
                                <div className="card info-box" style={{ borderLeft: '5px solid #f59e0b' }}>
                                    <h4 className="box-title" style={{ color: '#f59e0b' }}>
                                        <IoWarningOutline style={{ fontSize: '1.3rem' }} /> Triệu chứng thường gặp
                                    </h4>
                                    <div className="custom-bullets">
                                        {weekData.symptoms.map((s, index) => (
                                            <div key={index} className="bullet-item">
                                                <span className="bullet-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                                                <span>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Việc mẹ nên làm */}
                            {weekData.toDoList && weekData.toDoList.length > 0 && (
                                <div className="card info-box" style={{ borderLeft: '5px solid #8b5cf6' }}>
                                    <h4 className="box-title" style={{ color: '#8b5cf6' }}>
                                        <IoCheckboxOutline style={{ fontSize: '1.3rem' }} /> Việc mẹ nên làm
                                    </h4>
                                    <div className="custom-bullets">
                                        {weekData.toDoList.map((t, index) => (
                                            <div key={index} className="bullet-item">
                                                <span className="bullet-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* LIGHTBOX POPUP FOR BABY IMAGE */}
            {isLightboxOpen && (
                <div className="fetal-lightbox" onClick={() => setIsLightboxOpen(false)}>
                    <button className="close-lightbox-btn" onClick={() => setIsLightboxOpen(false)}>
                        <IoCloseOutline />
                    </button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={imgData.img} alt="Fetal zoom" />
                        <div className="lightbox-desc">
                            <h3 style={{ color: themeColorDark }}>Tuần thứ {currentWeek} - {trimesterName}</h3>
                            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                Kích thước bằng: {weekData.size} ({weekData.weight})
                            </p>
                            <p>{imgData.desc}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS styling */}
            <style jsx global>{`
                .nav-btn {
                    background: #f1f5f9;
                    border: none;
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nav-btn:active {
                    transform: scale(0.9);
                    background: #e2e8f0;
                }
                .week-timeline-container {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 10px 0;
                    margin-top: 15px;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }
                .week-timeline-container::-webkit-scrollbar {
                    height: 4px;
                }
                .week-timeline-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .week-timeline-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }
                .timeline-item {
                    flex: 0 0 42px;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    color: var(--text-main);
                    font-size: 0.92rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .timeline-item:hover {
                    background: #e2e8f0;
                    transform: scale(1.05);
                }
                .timeline-item.active {
                    background: var(--item-theme-color);
                    color: white;
                    border-color: var(--item-theme-color);
                    box-shadow: 0 4px 12px var(--item-theme-color);
                    transform: scale(1.1);
                }
                .handbook-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                @media (max-width: 1024px) {
                    .handbook-header-banner {
                        display: none !important;
                    }
                }
                @media (max-width: 600px) {
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                }

                @media (min-width: 992px) {
                    .handbook-layout {
                        display: grid;
                        grid-template-columns: 360px 1fr;
                        gap: 24px;
                        align-items: start;
                    }
                }
                .fetal-img-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    padding: 12px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .fetal-img-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                .fetal-img-card img {
                    max-width: 100%;
                    height: auto;
                    max-height: 250px;
                    border-radius: 12px;
                    object-fit: cover;
                    display: block;
                    margin: 0 auto 8px auto;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .fetal-img-caption {
                    font-size: 0.82rem;
                    color: #334155;
                    line-height: 1.4;
                    font-weight: 500;
                }
                .source-tag {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-left: 4px;
                }
                .fruit-icon {
                    width: 56px;
                    height: 56px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.6rem;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    flex-shrink: 0;
                }
                .badge-growth-title {
                    font-size: 0.78rem;
                    opacity: 0.9;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .growth-fruit-name {
                    font-size: 1.5rem;
                    font-weight: 900;
                    line-height: 1.2;
                }
                .growth-weight {
                    margin-top: 2px;
                    font-weight: 600;
                    opacity: 0.9;
                    font-size: 0.95rem;
                }
                .progress-tracker-card {
                    background: white;
                    padding: 20px;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: var(--shadow-soft);
                }
                .trimester-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.78rem;
                    font-weight: 700;
                }
                .progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    position: relative;
                    margin: 15px 0 10px 0;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.4s ease;
                }
                .progress-bar-marker {
                    position: absolute;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.7);
                }
                .info-box {
                    background: white;
                    padding: 20px;
                    border-radius: 20px;
                    box-shadow: var(--shadow-soft);
                    border: 1px solid #f1f5f9;
                    transition: all 0.2s ease;
                }
                .info-box:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .box-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.05rem;
                    font-weight: 800;
                    margin: 0 0 10px 0;
                }
                .box-text {
                    font-size: 0.92rem;
                    line-height: 1.6;
                    color: #334155;
                    margin: 0;
                    text-align: justify;
                }
                .advice-details {
                    border-top: 1px dashed #e2e8f0;
                    padding-top: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .advice-bullet {
                    font-size: 0.88rem;
                    color: #64748b;
                    line-height: 1.45;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                .custom-bullets {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .bullet-item {
                    font-size: 0.9rem;
                    color: #334155;
                    line-height: 1.45;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                .bullet-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    margin-top: 8px;
                    flex-shrink: 0;
                }
                .fetal-lightbox {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(10, 15, 30, 0.92);
                    backdrop-filter: blur(12px);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .close-lightbox-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: white;
                    font-size: 2rem;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 3100;
                    transition: all 0.2s;
                }
                .close-lightbox-btn:hover {
                    transform: rotate(90deg);
                    background: rgba(255,255,255,0.25);
                }
                .lightbox-content {
                    max-width: 600px;
                    width: 100%;
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .lightbox-content img {
                    width: 100%;
                    height: auto;
                    max-height: 450px;
                    object-fit: cover;
                }
                .lightbox-desc {
                    padding: 20px 24px;
                }
                .lightbox-desc h3 {
                    margin: 0 0 8px 0;
                    color: var(--text-main);
                    font-size: 1.2rem;
                    font-weight: 800;
                }
                .lightbox-desc p {
                    margin: 0;
                    color: var(--text-sub);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
            `}</style>
        </>
    );
}

