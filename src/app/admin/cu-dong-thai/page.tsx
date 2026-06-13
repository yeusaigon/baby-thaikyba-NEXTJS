'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
    IoFootstepsOutline, IoPlayOutline, IoPauseOutline, IoStopOutline, 
    IoTrashOutline, IoInformationCircleOutline, IoCheckmarkCircle, IoAlertCircleOutline,
    IoChevronDownOutline, IoChevronUpOutline, IoHeart
} from 'react-icons/io5';
import Link from 'next/link';

interface KickSession {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    kicksCount: number;
    status: 'normal' | 'low';
    notes?: string;
}

export default function BabyKickCounter() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<KickSession[]>([]);

    // Active Session States
    const [isActive, setIsActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(3600); // 1 Hour
    const [kickCount, setKickCount] = useState(0);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    // Accordions guide states
    const [openGuideId, setOpenGuideId] = useState<number | null>(0);

    const timerRef = useRef<any>(null);
    const pulseHeartRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const q = query(
                    collection(db, "users", currentUser.uid, "baby_kicks"),
                    orderBy("startTime", "desc")
                );
                const unsubDb = onSnapshot(q, (snap) => {
                    const list: KickSession[] = [];
                    snap.docs.forEach(d => {
                        list.push({ id: d.id, ...d.data() } as KickSession);
                    });
                    setHistory(list);
                    setLoading(false);
                });

                // Load active session from local storage if exists
                const savedSession = localStorage.getItem(`kick_session_${currentUser.uid}`);
                if (savedSession) {
                    try {
                        const parsed = JSON.parse(savedSession);
                        // Check if the saved session is still valid (not expired e.g. from yesterday)
                        const savedTime = new Date(parsed.savedAt).getTime();
                        const timePassedSeconds = Math.floor((Date.now() - savedTime) / 1000);
                        
                        if (parsed.isActive && timePassedSeconds < parsed.secondsLeft) {
                            setIsActive(true);
                            setSecondsLeft(parsed.secondsLeft - timePassedSeconds);
                            setKickCount(parsed.kickCount);
                            setStartTime(parsed.startTime);
                            setNotes(parsed.notes || '');
                        } else if (parsed.isActive && timePassedSeconds >= parsed.secondsLeft) {
                            // Completed in background
                            saveCompletedSession(
                                currentUser.uid, 
                                parsed.startTime, 
                                new Date(new Date(parsed.startTime).getTime() + parsed.totalDuration * 1000).toISOString(),
                                Math.round(parsed.totalDuration / 60), 
                                parsed.kickCount,
                                parsed.notes
                            );
                            localStorage.removeItem(`kick_session_${currentUser.uid}`);
                        }
                    } catch (e) {
                        console.error("Lỗi parse session:", e);
                    }
                }

                return () => unsubDb();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Timer effect
    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsActive(false);
                        handleFinishSession(true); // Auto save
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive]);

    // Save active session progress to local storage to protect against refreshes
    useEffect(() => {
        if (user && isActive) {
            const progress = {
                isActive,
                secondsLeft,
                kickCount,
                startTime,
                notes,
                totalDuration: 3600,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(`kick_session_${user.uid}`, JSON.stringify(progress));
        } else if (user && !isActive) {
            localStorage.removeItem(`kick_session_${user.uid}`);
        }
    }, [secondsLeft, kickCount, isActive, user]);

    const handleStartSession = () => {
        setIsActive(true);
        setSecondsLeft(3600);
        setKickCount(0);
        setStartTime(new Date().toISOString());
        setNotes('');
    };

    const handlePauseToggle = () => {
        setIsActive(!isActive);
    };

    const registerKick = () => {
        if (!isActive) return;
        setKickCount(prev => prev + 1);
        
        // Trigger pulse animation
        if (pulseHeartRef.current) {
            pulseHeartRef.current.style.transform = 'scale(0.85)';
            setTimeout(() => {
                if (pulseHeartRef.current) {
                    pulseHeartRef.current.style.transform = 'scale(1)';
                }
            }, 150);
        }
    };

    const handleFinishSession = async (autoSave = false) => {
        if (!user || !startTime) return;
        
        if (!autoSave && kickCount === 0) {
            if (!confirm("Bạn chưa đếm được cử động thai nào. Có muốn hoàn thành và lưu không?")) {
                return;
            }
        }

        const end = new Date().toISOString();
        const durationSec = 3600 - secondsLeft;
        const durationMin = Math.max(1, Math.round(durationSec / 60));

        await saveCompletedSession(user.uid, startTime, end, durationMin, kickCount, notes);

        // Reset States
        setIsActive(false);
        setStartTime(null);
        setSecondsLeft(3600);
        setKickCount(0);
        setNotes('');
        localStorage.removeItem(`kick_session_${user.uid}`);
    };

    const saveCompletedSession = async (uid: string, start: string, end: string, durationMin: number, count: number, sessionNotes: string) => {
        const id = 'session_' + Date.now();
        // Standard: >= 4 kicks in 1 hour is normal, or scale down based on elapsed duration
        const ratio = count / durationMin;
        const status = ratio >= (4 / 60) ? 'normal' : 'low';

        await setDoc(doc(db, "users", uid, "baby_kicks", id), {
            id,
            date: start.split('T')[0],
            startTime: start,
            endTime: end,
            durationMinutes: durationMin,
            kicksCount: count,
            status,
            notes: sessionNotes.trim()
        });
    };

    const handleDiscardSession = () => {
        if (confirm("Bạn có chắc chắn muốn hủy phiên đếm này không? Dữ liệu hiện tại sẽ bị xóa.")) {
            setIsActive(false);
            setStartTime(null);
            setSecondsLeft(3600);
            setKickCount(0);
            setNotes('');
            if (user) localStorage.removeItem(`kick_session_${user.uid}`);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa lịch sử đếm này không?")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "baby_kicks", id));
        } catch (err: any) {
            alert("Lỗi khi xóa: " + err.message);
        }
    };

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    const guides = [
        {
            title: "Tại sao phải đếm cử động thai hàng ngày?",
            content: "Cử động thai (thai máy) là thước đo sức khỏe thai nhi đơn giản, hiệu quả và trực quan nhất. Đếm cử động thai giúp theo dõi tình trạng thiếu oxy, suy thai hoặc dây rốn quấn cổ. Sự thay đổi đột ngột hoặc giảm cử động là dấu hiệu báo động cần liên hệ bác sĩ sản khoa ngay."
        },
        {
            title: "Thời điểm và tư thế đếm chuẩn y khoa?",
            content: "Nên đếm cử động thai từ tuần thứ 28 của thai kỳ. Chọn thời điểm bé hoạt động nhiều (thường là sau khi ăn no, buổi tối trước khi đi ngủ). Mẹ bầu hãy đi tiểu sạch, nằm nghiêng sang bên trái (để máu tuần hoàn đến tử cung tốt nhất) và tập trung đếm."
        },
        {
            title: "Thế nào là cử động thai bình thường?",
            content: "Trong vòng 1 giờ, nếu em bé có từ 4 cử động trở lên (như đạp, xoay người, máy, cuộn) được coi là an toàn và bình thường. Nếu bé cử động ít hơn 4 lần trong 1 giờ, mẹ nên uống nước ngọt hoặc sữa ấm, nghỉ ngơi 15 phút rồi tiếp tục đếm trong 1 giờ tiếp theo. Nếu vẫn ít hơn 4 lần, mẹ cần đi khám ngay."
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px', paddingBottom: '100px' }}>
            
            {/* Nav Back */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
                    ← Trở lại Dashboard
                </Link>
            </div>

            {/* Header Banner */}
            <div className="kick-header-banner" style={{ background: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)', padding: '24px', borderRadius: '28px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px -10px rgba(219, 39, 119, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoFootstepsOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Đếm Cử Động Thai</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>Theo dõi nhịp sống của bé yêu, phát hiện sớm dấu hiệu nguy cơ.</p>
                    </div>
                </div>
            </div>

            {/* Cockpit layout split */}
            <div className="kick-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ACTIVE SESSION LOGGER CARD */}
                <div className="card" style={{ padding: '28px 24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {!startTime ? (
                        /* Session idle state */
                        <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div className="pulse-circle" style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#db2777', animation: 'heart-pulse 2s infinite' }}>
                                <IoFootstepsOutline size={50} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Bắt đầu phiên đếm mới</h4>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '280px', lineHeight: 1.5 }}>Nên nằm nghiêng trái sau khi ăn no và đếm các cử động đạp/xoay của bé trong 1 giờ.</p>
                            </div>
                            <button 
                                onClick={handleStartSession}
                                style={{
                                    background: 'linear-gradient(135deg, #be185d, #db2777)', color: 'white',
                                    border: 'none', padding: '12px 32px', borderRadius: '999px',
                                    fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(219, 39, 119, 0.25)',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <IoPlayOutline size={18} /> Bắt đầu đếm
                            </button>
                        </div>
                    ) : (
                        /* Active count state */
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            
                            {/* Circular timer & count */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phiên đếm đang hoạt động</span>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatTime(secondsLeft)}
                                </div>
                            </div>

                            {/* Large Pulse heart button */}
                            <button 
                                ref={pulseHeartRef}
                                onClick={registerKick}
                                disabled={!isActive}
                                style={{
                                    width: '150px', height: '150px', borderRadius: '50%',
                                    background: isActive ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' : '#e2e8f0',
                                    border: '6px solid white', 
                                    boxShadow: isActive ? '0 12px 30px rgba(219,39,119,0.35)' : 'none',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? 'white' : '#94a3b8', cursor: isActive ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    position: 'relative'
                                }}
                            >
                                {isActive && (
                                    <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2.5px solid #ec4899', animation: 'ping 1.5s infinite', opacity: 0.3 }} />
                                )}
                                <IoHeart size={48} style={{ animation: isActive ? 'heart-pulse-icon 1.2s infinite' : 'none' }} />
                                <span style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                                    {kickCount}
                                </span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.9 }}>Bé cử động</span>
                            </button>

                            {/* Dynamic status pill */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: kickCount >= 4 ? '#f0fdf4' : '#fff7ed', border: '1px solid', borderColor: kickCount >= 4 ? '#bbf7d0' : '#ffedd5', padding: '8px 16px', borderRadius: '999px', fontSize: '0.78rem', color: kickCount >= 4 ? '#166534' : '#c2410c', fontWeight: 800 }}>
                                {kickCount >= 4 ? (
                                    <>
                                        <IoCheckmarkCircle size={16} />
                                        <span>Bé máy {kickCount} lần (Đạt chuẩn y khoa ✅)</span>
                                    </>
                                ) : (
                                    <>
                                        <IoAlertCircleOutline size={16} />
                                        <span>Bé máy {kickCount} lần (Cần tối thiểu 4 lần/giờ)</span>
                                    </>
                                )}
                            </div>

                            {/* Session control buttons */}
                            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
                                <button 
                                    onClick={handlePauseToggle}
                                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                    {isActive ? <><IoPauseOutline /> Tạm dừng</> : <><IoPlayOutline /> Tiếp tục</>}
                                </button>
                                <button 
                                    onClick={() => handleFinishSession(false)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: '#db2777', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                    <IoStopOutline /> Lưu lại
                                </button>
                                <button 
                                    onClick={handleDiscardSession}
                                    style={{ padding: '10px', borderRadius: '12px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Hủy bỏ phiên"
                                >
                                    Hủy
                                </button>
                            </div>

                            {/* Notes input */}
                            <input 
                                type="text"
                                placeholder="Ghi chú về phiên đếm (ví dụ: bé đạp mạnh, nấc nhẹ...)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ width: '100%', maxWidth: '300px', padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }}
                            />
                        </div>
                    )}
                </div>

                {/* ACCORDION MEDICAL GUIDELINES */}
                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoInformationCircleOutline size={22} color="#db2777" />
                        Cẩm nang đếm cử động thai chuẩn y khoa
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {guides.map((g, idx) => {
                            const isOpen = openGuideId === idx;
                            return (
                                <div key={idx} style={{ border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden' }}>
                                    <button 
                                        onClick={() => setOpenGuideId(isOpen ? null : idx)}
                                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fafafa', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}
                                    >
                                        <span>{g.title}</span>
                                        {isOpen ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                                    </button>
                                    {isOpen && (
                                        <div style={{ padding: '14px 16px', background: 'white', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                            {g.content}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HISTORICAL LOGS CARD */}
                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoFootstepsOutline size={22} color="#0d9488" />
                        Lịch sử đếm cử động thai gần đây ({history.length} phiên)
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                                Chưa có lịch sử đếm nào được lưu lại. Hãy đếm phiên đầu tiên!
                            </div>
                        ) : (
                            history.map(session => (
                                <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                                    <div style={{ flex: 1, paddingRight: '8px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                                                👶 Máy {session.kicksCount} lần
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                                ({session.durationMinutes} phút)
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: session.status === 'normal' ? '#e0f2fe18' : '#fff7ed18',
                                                color: session.status === 'normal' ? '#0284c7' : '#ea580c',
                                                padding: '3px 8px', borderRadius: '6px', fontWeight: 800,
                                                border: '1.5px solid',
                                                borderColor: session.status === 'normal' ? '#bae6fd' : '#ffedd5'
                                            }}>
                                                {session.status === 'normal' ? 'Bình thường' : 'Theo dõi thêm'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                                            📅 Ngày {session.date.split('-').reverse().join('/')} • Lúc {session.startTime.split('T')[1].substring(0, 5)} - {session.endTime.split('T')[1].substring(0, 5)}
                                        </div>

                                        {session.notes && (
                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
                                                Ghi chú: {session.notes}
                                            </p>
                                        )}
                                        
                                        {session.status === 'low' && (
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', background: '#fff7ed', border: '1px solid #ffedd5', padding: '8px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#c2410c', fontWeight: 500, lineHeight: 1.35 }}>
                                                <IoInformationCircleOutline size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                                                <span>Cử động dưới 4 lần/giờ. Mẹ nên nằm nghỉ ngơi thêm rồi đếm lại. Nếu vẫn thấp, hãy liên hệ ngay với bác sĩ sản khoa.</span>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={() => handleDeleteRecord(session.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer', opacity: 0.7 }} title="Xóa bản ghi">
                                        <IoTrashOutline size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <style jsx>{`
                @keyframes heart-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.08); box-shadow: 0 0 15px rgba(219,39,119,0.1); }
                    100% { transform: scale(1); }
                }
                @keyframes heart-pulse-icon {
                    0% { transform: scale(1); }
                    30% { transform: scale(1.2); }
                    60% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
                @keyframes ping {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
