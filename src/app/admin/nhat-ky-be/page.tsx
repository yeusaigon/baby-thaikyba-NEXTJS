'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, addDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { 
    IoFlowerOutline, IoTimeOutline, IoTrashOutline, IoAddCircleOutline,
    IoWaterOutline, IoMoonOutline, IoCafeOutline, IoHeartOutline,
    IoScaleOutline, IoTrendingUpOutline, IoMaleOutline, IoFemaleOutline
} from 'react-icons/io5';

interface JournalEntry {
    id: string;
    type: 'milk_breast' | 'milk_bottle' | 'diaper_wet' | 'diaper_dirty' | 'sleep';
    timestamp: string;
    duration?: number; // minutes for sleep or breast feeding
    amount?: number; // ml for bottle feeding
    notes?: string;
}

interface GrowthEntry {
    id: string;
    gender: 'boy' | 'girl';
    ageMonths: number;
    weight: number; // kg
    height: number; // cm
    timestamp: string;
    notes?: string;
}

interface WHORecord {
    m3: number;   // 3rd percentile
    m15: number;  // 15th percentile
    m50: number;  // 50th percentile (Median)
    m85: number;  // 85th percentile
    m97: number;  // 97th percentile
}

// WHO Weight-for-age standards (0-12 months)
const WHO_WEIGHT_BOYS: Record<number, WHORecord> = {
    0: { m3: 2.5, m15: 2.9, m50: 3.3, m85: 3.9, m97: 4.4 },
    1: { m3: 3.4, m15: 3.9, m50: 4.5, m85: 5.1, m97: 5.8 },
    2: { m3: 4.3, m15: 4.9, m50: 5.6, m85: 6.3, m97: 7.1 },
    3: { m3: 5.0, m15: 5.7, m50: 6.4, m85: 7.2, m97: 8.0 },
    4: { m3: 5.6, m15: 6.3, m50: 7.0, m85: 7.8, m97: 8.7 },
    5: { m3: 6.0, m15: 6.8, m50: 7.5, m85: 8.4, m97: 9.3 },
    6: { m3: 6.4, m15: 7.1, m50: 7.9, m85: 8.8, m97: 9.8 },
    7: { m3: 6.7, m15: 7.4, m50: 8.3, m85: 9.2, m97: 10.3 },
    8: { m3: 6.9, m15: 7.7, m50: 8.6, m85: 9.6, m97: 10.7 },
    9: { m3: 7.1, m15: 8.0, m50: 8.9, m85: 9.9, m97: 11.0 },
    10: { m3: 7.4, m15: 8.2, m50: 9.2, m85: 10.2, m97: 11.4 },
    11: { m3: 7.6, m15: 8.4, m50: 9.4, m85: 10.5, m97: 11.7 },
    12: { m3: 7.8, m15: 8.6, m50: 9.6, m85: 10.8, m97: 12.0 }
};

const WHO_WEIGHT_GIRLS: Record<number, WHORecord> = {
    0: { m3: 2.4, m15: 2.8, m50: 3.2, m85: 3.7, m97: 4.2 },
    1: { m3: 3.2, m15: 3.6, m50: 4.2, m85: 4.8, m97: 5.5 },
    2: { m3: 3.9, m15: 4.4, m50: 5.1, m85: 5.8, m97: 6.6 },
    3: { m3: 4.5, m15: 5.0, m50: 5.8, m85: 6.6, m97: 7.5 },
    4: { m3: 5.0, m15: 5.6, m50: 6.4, m85: 7.3, m97: 8.2 },
    5: { m3: 5.4, m15: 6.1, m50: 6.9, m85: 7.8, m97: 8.8 },
    6: { m3: 5.7, m15: 6.5, m50: 7.3, m85: 8.2, m97: 9.3 },
    7: { m3: 6.0, m15: 6.8, m50: 7.6, m85: 8.6, m97: 9.8 },
    8: { m3: 6.3, m15: 7.0, m50: 7.9, m85: 9.0, m97: 10.2 },
    9: { m3: 6.5, m15: 7.3, m50: 8.2, m85: 9.3, m97: 10.5 },
    10: { m3: 6.7, m15: 7.5, m50: 8.5, m85: 9.6, m97: 10.9 },
    11: { m3: 6.9, m15: 7.7, m50: 8.7, m85: 9.9, m97: 11.2 },
    12: { m3: 7.0, m15: 7.9, m50: 8.9, m85: 10.1, m97: 11.5 }
};

// WHO Height-for-age standards (0-12 months)
const WHO_HEIGHT_BOYS: Record<number, WHORecord> = {
    0: { m3: 46.1, m15: 48.0, m50: 49.9, m85: 51.8, m97: 53.7 },
    1: { m3: 50.8, m15: 52.8, m50: 54.7, m85: 56.7, m97: 58.6 },
    2: { m3: 54.4, m15: 56.4, m50: 58.4, m85: 60.4, m97: 62.4 },
    3: { m3: 57.3, m15: 59.4, m50: 61.4, m85: 63.5, m97: 65.5 },
    4: { m3: 59.7, m15: 61.8, m50: 63.9, m85: 66.0, m97: 68.0 },
    5: { m3: 61.7, m15: 63.8, m50: 65.9, m85: 68.0, m97: 70.1 },
    6: { m3: 63.3, m15: 65.5, m50: 67.6, m85: 69.8, m97: 71.9 },
    7: { m3: 64.8, m15: 67.0, m50: 69.2, m85: 71.3, m97: 73.5 },
    8: { m3: 66.2, m15: 68.4, m50: 70.6, m85: 72.8, m97: 75.0 },
    9: { m3: 67.5, m15: 69.7, m50: 72.0, m85: 74.2, m97: 76.5 },
    10: { m3: 68.7, m15: 71.0, m50: 73.3, m85: 75.6, m97: 77.9 },
    11: { m3: 69.9, m15: 72.2, m50: 74.5, m85: 76.9, m97: 79.2 },
    12: { m3: 71.0, m15: 73.4, m50: 75.7, m85: 78.1, m97: 80.5 }
};

const WHO_HEIGHT_GIRLS: Record<number, WHORecord> = {
    0: { m3: 45.4, m15: 47.3, m50: 49.1, m85: 51.0, m97: 52.9 },
    1: { m3: 49.8, m15: 51.7, m50: 53.7, m85: 55.6, m97: 57.6 },
    2: { m3: 53.0, m15: 55.0, m50: 57.1, m85: 59.1, m97: 61.1 },
    3: { m3: 55.6, m15: 57.7, m50: 59.8, m85: 61.9, m97: 64.0 },
    4: { m3: 57.8, m15: 59.9, m50: 62.1, m85: 64.3, m97: 66.4 },
    5: { m3: 59.6, m15: 61.8, m50: 64.0, m85: 66.2, m97: 68.5 },
    6: { m3: 61.2, m15: 63.5, m50: 65.7, m85: 68.0, m97: 70.3 },
    7: { m3: 62.7, m15: 65.0, m50: 67.3, m85: 69.6, m97: 71.9 },
    8: { m3: 64.0, m15: 66.4, m50: 68.7, m85: 71.1, m97: 73.5 },
    9: { m3: 65.3, m15: 67.7, m50: 70.1, m85: 72.6, m97: 75.0 },
    10: { m3: 66.5, m15: 69.0, m50: 71.5, m85: 74.0, m97: 76.4 },
    11: { m3: 67.7, m15: 70.2, m50: 72.8, m85: 75.3, m97: 77.8 },
    12: { m3: 68.9, m15: 71.4, m50: 74.0, m85: 76.6, m97: 79.2 }
};

interface PercentileAnalysis {
    percentileLabel: string;
    classColor: string;
    desc: string;
    positionPct: number; // 0 to 100
}

const analyzePercentile = (value: number, ref: WHORecord, type: 'weight' | 'height'): PercentileAnalysis => {
    if (value <= ref.m3) {
        return {
            percentileLabel: 'Dưới 3rd (Cảnh báo đỏ ⚠️)',
            classColor: '#ef4444',
            desc: type === 'weight' ? 'Bé đang có nguy cơ suy dinh dưỡng nặng. Mẹ cần tham khảo ý kiến bác sĩ nhi khoa.' : 'Chiều cao bé đang thấp hơn nhiều so với chuẩn. Cần kiểm tra chế độ hấp thu dinh dưỡng.',
            positionPct: Math.max(5, (value / ref.m3) * 15)
        };
    }
    if (value <= ref.m15) {
        return {
            percentileLabel: '3rd - 15th (Nguy cơ nhẹ 📉)',
            classColor: '#f59e0b',
            desc: type === 'weight' ? 'Bé hơi nhẹ cân. Mẹ chú ý bổ sung cữ bú hoặc cải thiện thực đơn dinh dưỡng.' : 'Chiều cao bé ở giới hạn dưới. Chú ý bổ sung vitamin D3 K2 và tương tác vận động.',
            positionPct: 15 + ((value - ref.m3) / (ref.m15 - ref.m3)) * 20
        };
    }
    if (value <= ref.m85) {
        return {
            percentileLabel: '15th - 85th (Đạt chuẩn WHO ✅)',
            classColor: '#10b981',
            desc: 'Chỉ số của bé rất đẹp và nằm trong mức phát triển hoàn toàn khỏe mạnh. Mẹ tiếp tục duy trì nhé!',
            positionPct: 35 + ((value - ref.m15) / (ref.m85 - ref.m15)) * 30
        };
    }
    if (value <= ref.m97) {
        return {
            percentileLabel: '85th - 97th (Cận trên 📈)',
            classColor: '#3b82f6',
            desc: type === 'weight' ? 'Bé trộm vía khá bụ bẫm, ở giới hạn trên của chuẩn. Hãy chú ý các bài tập vận động thể chất.' : 'Bé phát triển chiều cao vượt trội so với trung bình.',
            positionPct: 65 + ((value - ref.m85) / (ref.m97 - ref.m85)) * 20
        };
    }
    return {
        percentileLabel: 'Trên 97th (Cảnh báo vượt chuẩn ⚠️)',
        classColor: '#a855f7',
        desc: type === 'weight' ? 'Bé có cân nặng vượt tiêu chuẩn đáng kể. Theo dõi nguy cơ béo phì nhi khoa.' : 'Chiều cao của bé cực kỳ xuất sắc.',
        positionPct: Math.min(95, 85 + ((value - ref.m97) / ref.m97) * 15)
    };
};

export default function BabyCareJournal() {
    const [user, setUser] = useState<any>(null);
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'journal' | 'growth'>('journal');
    
    // Tab 1 States (Journal Logs)
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [logType, setLogType] = useState<'milk_breast' | 'milk_bottle' | 'diaper_wet' | 'diaper_dirty' | 'sleep'>('milk_breast');
    const [amount, setAmount] = useState<number>(100);
    const [duration, setDuration] = useState<number>(15);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Tab 2 States (WHO Growth Logs)
    const [growthEntries, setGrowthEntries] = useState<GrowthEntry[]>([]);
    const [growthGender, setGrowthGender] = useState<'boy' | 'girl'>('girl');
    const [growthAge, setGrowthAge] = useState<number>(3); // 3 months default
    const [growthWeight, setGrowthWeight] = useState<number>(6.0); // kg
    const [growthHeight, setGrowthHeight] = useState<number>(60.0); // cm
    const [growthNotes, setGrowthNotes] = useState('');
    const [submittingGrowth, setSubmittingGrowth] = useState(false);

    useEffect(() => {
        let unsubDb: (() => void) | null = null;
        let unsubGrowth: (() => void) | null = null;
        let unsubProfile: (() => void) | null = null;

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Realtime listen user profile to check partner connection status
                unsubProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    let targetUid = currentUser.uid;
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        // Partner sync active: If role is partner and partnerUid is assigned, redirect reads/writes
                        if (data.syncRole === 'partner' && data.partnerUid) {
                            targetUid = data.partnerUid;
                        }
                    }
                    setResolvedUid(targetUid);

                    // 1. Setup Newborn journal listener
                    if (unsubDb) unsubDb();
                    const q = query(
                        collection(db, "users", targetUid, "baby_journal"),
                        orderBy("timestamp", "desc"),
                        limit(50)
                    );
                    unsubDb = onSnapshot(q, (snap) => {
                        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as JournalEntry));
                        setEntries(list);
                        setLoading(false);
                    });

                    // 2. Setup Baby growth listener
                    if (unsubGrowth) unsubGrowth();
                    const qg = query(
                        collection(db, "users", targetUid, "baby_growth"),
                        orderBy("timestamp", "desc")
                    );
                    unsubGrowth = onSnapshot(qg, (snap) => {
                        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as GrowthEntry));
                        setGrowthEntries(list);
                    });
                });
            } else {
                setUser(null);
                setResolvedUid('');
                setProfile(null);
                setEntries([]);
                setGrowthEntries([]);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (unsubDb) unsubDb();
            if (unsubGrowth) unsubGrowth();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    // Add Newborn Log
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dbUid = resolvedUid || user?.uid;
        if (!dbUid || submitting) return;
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
            await addDoc(collection(db, "users", dbUid, "baby_journal"), payload);
            setNotes('');
            setAmount(100);
            setDuration(15);
        } catch (err: any) {
            alert("Lỗi ghi nhật ký: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Add Growth Log
    const handleGrowthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dbUid = resolvedUid || user?.uid;
        if (!dbUid || submittingGrowth) return;
        setSubmittingGrowth(true);

        const payload: Partial<GrowthEntry> = {
            gender: growthGender,
            ageMonths: growthAge,
            weight: Number(growthWeight),
            height: Number(growthHeight),
            timestamp: new Date().toISOString(),
            notes: growthNotes.trim()
        };

        try {
            await addDoc(collection(db, "users", dbUid, "baby_growth"), payload);
            setGrowthNotes('');
        } catch (err: any) {
            alert("Lỗi lưu chỉ số tăng trưởng: " + err.message);
        } finally {
            setSubmittingGrowth(false);
        }
    };

    const handleDelete = async (id: string) => {
        const dbUid = resolvedUid || user?.uid;
        if (!dbUid || !confirm("Bạn có chắc chắn muốn xóa bản ghi này không?")) return;
        await deleteDoc(doc(db, "users", dbUid, "baby_journal", id));
    };

    const handleDeleteGrowth = async (id: string) => {
        const dbUid = resolvedUid || user?.uid;
        if (!dbUid || !confirm("Bạn có chắc chắn muốn xóa số đo tăng trưởng này không?")) return;
        await deleteDoc(doc(db, "users", dbUid, "baby_growth", id));
    };

    // Calculate Today's stats for Journal
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

    // Calculate current growth analysis live states
    const activeWeightRef = growthGender === 'boy' ? WHO_WEIGHT_BOYS[growthAge] : WHO_WEIGHT_GIRLS[growthAge];
    const activeHeightRef = growthGender === 'boy' ? WHO_HEIGHT_BOYS[growthAge] : WHO_HEIGHT_GIRLS[growthAge];
    const weightAnalysis = analyzePercentile(growthWeight, activeWeightRef, 'weight');
    const heightAnalysis = analyzePercentile(growthHeight, activeHeightRef, 'height');

    return (
        <div className="utility-page-container fade-in">
            {/* Header Banner */}
            <div className="journal-header-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoHeartOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                            Nhật Ký Chăm Sóc Bé
                            {profile?.syncRole === 'partner' && (
                                <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '12px', marginLeft: '10px', verticalAlign: 'middle' }}>
                                    Đang đồng bộ 👨‍👩‍👦
                                </span>
                            )}
                        </h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>
                            Theo dõi cữ ăn ngủ của trẻ sơ sinh và đánh giá tăng trưởng theo chuẩn khoa học WHO.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Switched Header */}
            <div className="journal-tabs">
                <button 
                    onClick={() => setActiveTab('journal')} 
                    className={`journal-tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
                >
                    <IoFlowerOutline size={18} /> Nhật ký sinh hoạt
                </button>
                <button 
                    onClick={() => setActiveTab('growth')} 
                    className={`journal-tab-btn ${activeTab === 'growth' ? 'active' : ''}`}
                >
                    <IoTrendingUpOutline size={18} /> Tăng trưởng WHO
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu nhật ký...</div>
            ) : activeTab === 'journal' ? (
                <>
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
                                                key={item.id || idx}
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
                </>
            ) : (
                /* WHO Growth Tracker Tab UI */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }} className="journal-layout-grid animate-fade-in">
                    
                    {/* Left Column: Form & Analysis Gauges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <form onSubmit={handleGrowthSubmit} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                                Thêm chỉ số đo tăng trưởng
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Gender Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Giới tính của bé</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => setGrowthGender('boy')}
                                            className={`gender-btn boy ${growthGender === 'boy' ? 'active' : ''}`}
                                            style={{
                                                padding: '12px', borderRadius: '14px', border: '1.5px solid #cbd5e1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', background: 'white', transition: 'all 0.2s'
                                            }}
                                        >
                                            <IoMaleOutline size={16} color="#0284c7" /> Bé Trai
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setGrowthGender('girl')}
                                            className={`gender-btn girl ${growthGender === 'girl' ? 'active' : ''}`}
                                            style={{
                                                padding: '12px', borderRadius: '14px', border: '1.5px solid #cbd5e1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', background: 'white', transition: 'all 0.2s'
                                            }}
                                        >
                                            <IoFemaleOutline size={16} color="#db2777" /> Bé Gái
                                        </button>
                                    </div>
                                </div>

                                {/* Age & Numbers Input Row */}
                                <div className="growth-form-row">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span className="text-label">Tuổi (Tháng)</span>
                                        <select 
                                            value={growthAge} 
                                            onChange={(e) => setGrowthAge(Number(e.target.value))}
                                            className="form-input"
                                            style={{ appearance: 'none', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px' }}
                                        >
                                            {[...Array(13)].map((_, i) => (
                                                <option key={i} value={i}>{i} tháng (Sơ sinh)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span className="text-label">Cân nặng (kg)</span>
                                        <input 
                                            type="number" 
                                            step="0.05"
                                            min="1"
                                            max="30"
                                            value={growthWeight}
                                            onChange={(e) => setGrowthWeight(Number(e.target.value))}
                                            className="form-input"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span className="text-label">Chiều cao (cm)</span>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            min="30"
                                            max="120"
                                            value={growthHeight}
                                            onChange={(e) => setGrowthHeight(Number(e.target.value))}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Ghi chú</span>
                                    <input 
                                        type="text" 
                                        placeholder="Ví dụ: Đo lúc bé ngủ, lúc đói..."
                                        value={growthNotes}
                                        onChange={(e) => setGrowthNotes(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)', marginTop: '8px' }}
                                    disabled={submittingGrowth}
                                >
                                    <IoScaleOutline size={20} /> Lưu chỉ số tăng trưởng
                                </button>
                            </div>
                        </form>

                        {/* Interactive WHO Percentile Gauge Banners */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoScaleOutline size={18} color="#0d9488" /> Đánh giá phần trăm phân vị (Percentile)
                            </h4>

                            {/* Weight Gauge */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                                    <span style={{ color: '#1e293b' }}>Cân nặng ({growthWeight} kg):</span>
                                    <span style={{ color: weightAnalysis.classColor }}>{weightAnalysis.percentileLabel}</span>
                                </div>
                                <div className="gauge-container">
                                    <div className="gauge-track">
                                        <div className="gauge-segment red-low"></div>
                                        <div className="gauge-segment amber-low"></div>
                                        <div className="gauge-segment green-mid"></div>
                                        <div className="gauge-segment blue-high"></div>
                                        <div className="gauge-segment purple-high"></div>
                                    </div>
                                    <div className="gauge-marker" style={{ left: `${weightAnalysis.positionPct}%`, background: weightAnalysis.classColor }}></div>
                                </div>
                                <div className="gauge-labels">
                                    <span>3rd (Thấp)</span>
                                    <span>50th (Trung bình)</span>
                                    <span>97th (Cao)</span>
                                </div>
                                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', lineHeight: 1.45, fontWeight: 500 }}>
                                    {weightAnalysis.desc}
                                </p>
                            </div>

                            {/* Height Gauge */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                                    <span style={{ color: '#1e293b' }}>Chiều cao ({growthHeight} cm):</span>
                                    <span style={{ color: heightAnalysis.classColor }}>{heightAnalysis.percentileLabel}</span>
                                </div>
                                <div className="gauge-container">
                                    <div className="gauge-track">
                                        <div className="gauge-segment red-low"></div>
                                        <div className="gauge-segment amber-low"></div>
                                        <div className="gauge-segment green-mid"></div>
                                        <div className="gauge-segment blue-high"></div>
                                        <div className="gauge-segment purple-high"></div>
                                    </div>
                                    <div className="gauge-marker" style={{ left: `${heightAnalysis.positionPct}%`, background: heightAnalysis.classColor }}></div>
                                </div>
                                <div className="gauge-labels">
                                    <span>3rd (Thấp)</span>
                                    <span>50th (Trung bình)</span>
                                    <span>97th (Cao)</span>
                                </div>
                                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', lineHeight: 1.45, fontWeight: 500 }}>
                                    {heightAnalysis.desc}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Historical Logs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                            Nhật ký tăng trưởng sơ sinh
                        </h3>

                        {growthEntries.length === 0 ? (
                            <div style={{ background: '#fafafa', border: '1px dashed #e2e8f0', padding: '40px 20px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                Chưa có số đo tăng trưởng nào được ghi nhận. Hãy lưu cân nặng và chiều cao của bé.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {growthEntries.map((item, idx) => {
                                    const date = new Date(item.timestamp);
                                    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    const wRef = item.gender === 'boy' ? WHO_WEIGHT_BOYS[item.ageMonths] : WHO_WEIGHT_GIRLS[item.ageMonths];
                                    const hRef = item.gender === 'boy' ? WHO_HEIGHT_BOYS[item.ageMonths] : WHO_HEIGHT_GIRLS[item.ageMonths];
                                    const wAnalysis = wRef ? analyzePercentile(item.weight, wRef, 'weight') : null;

                                    return (
                                        <div 
                                            key={item.id || idx}
                                            style={{
                                                padding: '16px', background: 'white', borderRadius: '20px',
                                                border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '42px', height: '42px', borderRadius: '12px',
                                                    background: item.gender === 'boy' ? '#e0f2fe' : '#fce7f3',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: item.gender === 'boy' ? '#0284c7' : '#db2777'
                                                }}>
                                                    {item.gender === 'boy' ? <IoMaleOutline size={20} /> : <IoFemaleOutline size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                                                        {item.ageMonths} tháng tuổi • Cân: {item.weight}kg • Cao: {item.height}cm
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>📅 {dateStr}</span>
                                                        {wAnalysis && (
                                                            <span style={{ 
                                                                fontSize: '0.68rem', 
                                                                fontWeight: 700, 
                                                                color: wAnalysis.classColor, 
                                                                background: `${wAnalysis.classColor}14`, 
                                                                padding: '2px 8px', 
                                                                borderRadius: '8px' 
                                                            }}>
                                                                Cân nặng: {wAnalysis.percentileLabel.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.notes && (
                                                        <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                                                            "{item.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleDeleteGrowth(item.id)}
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
            )}

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

                /* Tab Switching styles */
                .journal-tabs {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 8px;
                }
                .journal-tab-btn {
                    padding: 10px 20px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-radius: 12px;
                    transition: all 0.25s ease;
                }
                .journal-tab-btn:hover {
                    color: #db2777;
                    background: #fff1f2;
                }
                .journal-tab-btn.active {
                    color: #db2777;
                    background: #ffe4e6;
                }

                /* Gender selectors style */
                .gender-btn.boy.active {
                    border-color: #0284c7 !important;
                    background: #f0f9ff !important;
                    color: #0284c7 !important;
                    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
                }
                .gender-btn.girl.active {
                    border-color: #db2777 !important;
                    background: #fff1f2 !important;
                    color: #db2777 !important;
                    box-shadow: 0 4px 12px rgba(219, 39, 119, 0.08);
                }

                /* Multi-column grid for growth numbers */
                .growth-form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                }

                /* Visual Gauge ProgressBar */
                .gauge-container {
                    position: relative;
                    height: 12px;
                    width: 100%;
                    margin: 8px 0;
                }
                .gauge-track {
                    display: flex;
                    height: 100%;
                    width: 100%;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .gauge-segment {
                    height: 100%;
                }
                .gauge-segment.red-low { width: 15%; background: #fee2e2; }
                .gauge-segment.amber-low { width: 20%; background: #fef3c7; }
                .gauge-segment.green-mid { width: 30%; background: #d1fae5; }
                .gauge-segment.blue-high { width: 20%; background: #dbeafe; }
                .gauge-segment.purple-high { width: 15%; background: #f3e8ff; }

                .gauge-marker {
                    position: absolute;
                    top: -4px;
                    width: 8px;
                    height: 20px;
                    border-radius: 4px;
                    border: 2px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.25);
                    transform: translateX(-50%);
                    transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gauge-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.65rem;
                    color: #94a3b8;
                    font-weight: 700;
                    margin-top: 4px;
                }

                @media (max-width: 900px) {
                    .journal-layout-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .growth-form-row {
                        grid-template-columns: 1fr !important;
                        gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
