'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, addDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { 
    IoFlowerOutline, IoTimeOutline, IoTrashOutline, IoAddCircleOutline,
    IoWaterOutline, IoMoonOutline, IoCafeOutline, IoHeartOutline
} from 'react-icons/io5';

interface JournalEntry {
    id: string;
    type: 'milk_breast' | 'milk_bottle' | 'diaper_wet' | 'diaper_dirty' | 'sleep';
    timestamp: string;
    duration?: number; // minutes for sleep or breast feeding
    amount?: number; // ml for bottle feeding
    notes?: string;
}

export default function BabyCareJournal() {
    const [user, setUser] = useState<any>(null);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [logType, setLogType] = useState<'milk_breast' | 'milk_bottle' | 'diaper_wet' | 'diaper_dirty' | 'sleep'>('milk_breast');
    const [amount, setAmount] = useState<number>(100);
    const [duration, setDuration] = useState<number>(15);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const q = query(
                    collection(db, "users", currentUser.uid, "baby_journal"),
                    orderBy("timestamp", "desc"),
                    limit(50)
                );
                const unsubDb = onSnapshot(q, (snap) => {
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
                    setEntries(list);
                    setLoading(false);
                });
                return () => unsubDb();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;
        setSubmitting(true);

        const payload: Partial<JournalEntry> = {
            type: logType,
            timestamp: new Date().toISOString(),
            notes: notes.trim()
        };

        if (logType === 'milk_bottle') {
            payload.amount = amount;
        } else if (logType === 'milk_breast' || logType === 'sleep') {
            payload.duration = duration;
        }

        try {
            await addDoc(collection(db, "users", user.uid, "baby_journal"), payload);
            setNotes('');
            // Reset to defaults
            setAmount(100);
            setDuration(15);
        } catch (err: any) {
            alert("Lỗi ghi nhật ký: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa bản ghi nhật ký này không?")) return;
        await deleteDoc(doc(db, "users", user.uid, "baby_journal", id));
    };

    // Calculate Today's stats
    const todayStr = new Date().toDateString();
    const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === todayStr);

    const todayBreastMins = todayEntries
        .filter(e => e.type === 'milk_breast')
        .reduce((sum, e) => sum + (e.duration || 0), 0);

    const todayBottleMl = todayEntries
        .filter(e => e.type === 'milk_bottle')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const todayWetDiapers = todayEntries.filter(e => e.type === 'diaper_wet').length;
    const todayDirtyDiapers = todayEntries.filter(e => e.type === 'diaper_dirty').length;

    const todaySleepMins = todayEntries
        .filter(e => e.type === 'sleep')
        .reduce((sum, e) => sum + (e.duration || 0), 0);
    const todaySleepHours = (todaySleepMins / 60).toFixed(1);

    const getIcon = (type: string, size = 20) => {
        switch (type) {
            case 'milk_breast': return <IoHeartOutline size={size} color="#db2777" />;
            case 'milk_bottle': return <IoCafeOutline size={size} color="#0284c7" />;
            case 'diaper_wet': return <IoWaterOutline size={size} color="#0d9488" />;
            case 'diaper_dirty': return <IoFlowerOutline size={size} color="#b45309" />;
            case 'sleep': return <IoMoonOutline size={size} color="#6366f1" />;
            default: return <IoFlowerOutline size={size} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'milk_breast': return 'Bú mẹ trực tiếp';
            case 'milk_bottle': return 'Bú bình';
            case 'diaper_wet': return 'Thay tã (Ướt)';
            case 'diaper_dirty': return 'Thay tã (Bẩn)';
            case 'sleep': return 'Bé ngủ';
            default: return 'Khác';
        }
    };

    return (
        <div className="utility-page-container fade-in">
            {/* Header Banner */}
            <div className="journal-header-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoHeartOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Nhật Ký Chăm Bé Sơ Sinh</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>Theo dõi ăn, ngủ, vệ sinh hàng ngày giúp mẹ chăm sóc bé dễ dàng.</p>
                    </div>
                </div>
            </div>

            {/* Daily Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'white', borderRadius: '18px', padding: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ background: '#fdf2f8', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#db2777' }}>
                        <IoCafeOutline size={20} style={{ margin: 'auto' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Dinh dưỡng</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                        {todayBottleMl > 0 ? `${todayBottleMl} ml` : ''}
                        {todayBreastMins > 0 ? ` + ${todayBreastMins}p bú` : ''}
                        {todayBottleMl === 0 && todayBreastMins === 0 ? 'Chưa ghi' : ''}
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '18px', padding: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ background: '#f0fdfa', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#0d9488' }}>
                        <IoWaterOutline size={20} style={{ margin: 'auto' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tã bỉm</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                        💦 {todayWetDiapers} | 💩 {todayDirtyDiapers}
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '18px', padding: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ background: '#e0e7ff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#6366f1' }}>
                        <IoMoonOutline size={20} style={{ margin: 'auto' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Giấc ngủ</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                        {todaySleepHours} giờ
                    </div>
                </div>
            </div>

            {/* Layout Split: Form & History List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }} className="journal-layout-grid">
                
                {/* Logger Form */}
                <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Ghi nhận hoạt động mới</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Selector of Type */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className="text-label">Loại hoạt động</span>
                            <select 
                                className="form-input" 
                                value={logType}
                                onChange={(e) => setLogType(e.target.value as any)}
                                style={{ appearance: 'none', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px' }}
                            >
                                <option value="milk_breast">🍼 Bú mẹ trực tiếp (phút)</option>
                                <option value="milk_bottle">🥛 Bú bình (ml)</option>
                                <option value="diaper_wet">💦 Thay tã (Ướt)</option>
                                <option value="diaper_dirty">💩 Thay tã (Bẩn)</option>
                                <option value="sleep">💤 Giấc ngủ (phút)</option>
                            </select>
                        </div>

                        {/* Amount - if bottle */}
                        {logType === 'milk_bottle' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span className="text-label">Lượng sữa uống (ml)</span>
                                <input 
                                    type="number"
                                    className="form-input"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    min={10}
                                    max={400}
                                />
                            </div>
                        )}

                        {/* Duration - if breast milk or sleep */}
                        {(logType === 'milk_breast' || logType === 'sleep') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span className="text-label">Thời lượng (phút)</span>
                                <input 
                                    type="number"
                                    className="form-input"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    min={1}
                                    max={600}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className="text-label">Ghi chú thêm</span>
                            <textarea 
                                className="form-input"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi nhận biểu hiện của bé, ví dụ: bé ngủ say, phân vàng sệt, bú ngoan..."
                                style={{ minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)', boxShadow: '0 10px 25px -5px rgba(219, 39, 119, 0.4)', marginTop: '8px' }}
                            disabled={submitting}
                        >
                            <IoAddCircleOutline size={22} /> Ghi nhận hoạt động
                        </button>
                    </div>
                </form>

                {/* History list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Lịch sử hoạt động gần đây</h3>

                    {entries.length === 0 ? (
                        <div style={{ background: '#fafafa', border: '1px dashed #e2e8f0', padding: '40px 20px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8' }}>
                            Chưa có hoạt động nào được ghi chép trong hôm nay.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {entries.map((item, idx) => {
                                const date = new Date(item.timestamp);
                                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                return (
                                    <div 
                                        key={idx}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '16px', background: 'white', borderRadius: '20px',
                                            border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                background: '#f8fafc', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                                            }}>
                                                {getIcon(item.type, 20)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                                                    {getTypeLabel(item.type)}
                                                    {item.amount && ` (${item.amount} ml)`}
                                                    {item.duration && ` (${item.duration} phút)`}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                                                    <span>⏰ {timeStr}</span>
                                                    <span>•</span>
                                                    <span>📅 {dateStr}</span>
                                                </div>
                                                {item.notes && (
                                                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            style={{ border: 'none', background: 'transparent', color: '#94a3b8', padding: '6px', cursor: 'pointer', transition: 'color 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                        >
                                            <IoTrashOutline size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <style jsx global>{`
                .journal-header-banner {
                    background: linear-gradient(135deg, #db2777 0%, #ec4899 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 28px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px -10px rgba(219, 39, 119, 0.4);
                }
                .journal-header-banner::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                @media (max-width: 900px) {
                    .journal-layout-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
