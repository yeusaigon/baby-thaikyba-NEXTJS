'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
    IoHeartOutline, IoAddCircleOutline, IoTrashOutline, IoTrendingUpOutline, 
    IoPulseOutline, IoInformationCircleOutline, IoCloseOutline,
    IoChevronForwardOutline, IoShieldHalfOutline, IoWineOutline, IoCheckmarkCircle
} from 'react-icons/io5';

interface HealthVital {
    id: string;
    type: 'bp' | 'bs';
    datetime: string;
    // Blood pressure specific
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    // Blood sugar specific
    bloodSugar?: number;
    unit?: 'mmol/L' | 'mg/dL';
    mealType?: 'before_meal' | 'after_meal_1h' | 'after_meal_2h' | 'before_sleep';
    notes?: string;
}

const GDM_LIMITS = {
    before_meal: {
        'mmol/L': 5.3,
        'mg/dL': 95,
        label: 'Đường huyết đói'
    },
    after_meal_1h: {
        'mmol/L': 7.8,
        'mg/dL': 140,
        label: 'Đường huyết sau ăn 1h'
    },
    after_meal_2h: {
        'mmol/L': 6.7,
        'mg/dL': 120,
        label: 'Đường huyết sau ăn 2h'
    },
    before_sleep: {
        'mmol/L': 6.7,
        'mg/dL': 120,
        label: 'Đường huyết trước ngủ'
    }
};

const getLogUnit = (log: HealthVital): 'mmol/L' | 'mg/dL' => {
    if (log.unit) return log.unit;
    return (log.bloodSugar || 0) > 20 ? 'mg/dL' : 'mmol/L';
};

const getBSValue = (log: HealthVital, targetUnit: 'mmol/L' | 'mg/dL'): number => {
    const origUnit = getLogUnit(log);
    const val = log.bloodSugar || 0;
    if (origUnit === targetUnit) return val;
    if (targetUnit === 'mmol/L') {
        return Math.round((val / 18) * 10) / 10;
    } else {
        return Math.round(val * 18);
    }
};

const getLocalDateTimeInput = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function HealthVitalsTracker() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [vitals, setVitals] = useState<HealthVital[]>([]);
    const [activeTab, setActiveTab] = useState<'bp' | 'bs' | 'info'>('bp');
    const [showModal, setShowModal] = useState(false);

    // Input States
    const [datetime, setDatetime] = useState(() => getLocalDateTimeInput());
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [mealType, setMealType] = useState<'before_meal' | 'after_meal_1h' | 'after_meal_2h' | 'before_sleep'>('before_meal');
    const [notes, setNotes] = useState('');

    const [displayUnit, setDisplayUnit] = useState<'mmol/L' | 'mg/dL'>('mmol/L');
    const [inputUnit, setInputUnit] = useState<'mmol/L' | 'mg/dL'>('mmol/L');

    useEffect(() => {
        const saved = localStorage.getItem('bs_display_unit');
        if (saved === 'mmol/L' || saved === 'mg/dL') {
            setDisplayUnit(saved);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'bs' || tab === 'bp' || tab === 'info') {
            setActiveTab(tab);
        }
    }, []);

    const handleUnitChange = (unit: 'mmol/L' | 'mg/dL') => {
        setDisplayUnit(unit);
        localStorage.setItem('bs_display_unit', unit);
    };

    useEffect(() => {
        let unsubDb: (() => void) | null = null;
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

                    if (unsubDb) unsubDb();
                    const q = query(
                        collection(db, "users", targetUid, "health_vitals"),
                        orderBy("datetime", "desc")
                    );
                    unsubDb = onSnapshot(q, (snap) => {
                        const list: HealthVital[] = [];
                        snap.docs.forEach(d => {
                            list.push({ id: d.id, ...d.data() } as HealthVital);
                        });
                        setVitals(list);
                        setLoading(false);
                    });
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => {
            unsubscribe();
            if (unsubDb) unsubDb();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !datetime) return;

        const id = 'vital_' + Date.now();
        const dbUid = resolvedUid || user.uid;
        const recordRef = doc(db, "users", dbUid, "health_vitals", id);

        const data: Partial<HealthVital> = {
            id,
            type: activeTab === 'bp' ? 'bp' : 'bs',
            datetime,
            notes: notes.trim()
        };

        if (activeTab === 'bp') {
            const sysVal = Number(systolic);
            const diaVal = Number(diastolic);
            const pulseVal = Number(pulse);

            if (!sysVal || !diaVal) {
                alert("Vui lòng nhập đầy đủ chỉ số huyết áp!");
                return;
            }
            data.systolic = sysVal;
            data.diastolic = diaVal;
            if (pulseVal) data.pulse = pulseVal;
        } else {
            const bsVal = Number(bloodSugar);
            if (!bsVal) {
                alert("Vui lòng nhập chỉ số đường huyết!");
                return;
            }
            data.bloodSugar = bsVal;
            data.unit = inputUnit;
            data.mealType = mealType;
        }

        try {
            await setDoc(recordRef, data);
            // Reset input fields except date
            setDatetime(getLocalDateTimeInput());
            setSystolic('');
            setDiastolic('');
            setPulse('');
            setBloodSugar('');
            setNotes('');
            setShowModal(false);
        } catch (err: any) {
            alert("Lỗi lưu chỉ số: " + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa chỉ số này không?")) return;
        try {
            const dbUid = resolvedUid || user.uid;
            await deleteDoc(doc(db, "users", dbUid, "health_vitals", id));
        } catch (err: any) {
            alert("Lỗi khi xóa: " + err.message);
        }
    };

    const getBPStatus = (sys: number, dia: number) => {
        if (sys >= 140 || dia >= 90) return { label: 'Huyết áp cao ⚠️', color: '#ef4444', class: 'danger', desc: 'Có nguy cơ tiền sản giật, hãy liên hệ bác sĩ sản phụ khoa để được tư vấn.' };
        if (sys < 90 || dia < 60) return { label: 'Huyết áp thấp 📉', color: '#3b82f6', class: 'warning', desc: 'Mẹ bầu cần bổ sung nước, nghỉ ngơi, tránh đứng lên đột ngột.' };
        if (sys >= 120 || dia >= 80) return { label: 'Tiền cao huyết áp ⚖️', color: '#f59e0b', class: 'caution', desc: 'Hơi cao hơn bình thường, nên theo dõi thường xuyên và giảm muối.' };
        return { label: 'Bình thường ✅', color: '#10b981', class: 'normal', desc: 'Chỉ số huyết áp nằm trong khoảng an toàn.' };
    };

    const getBSStatus = (log: HealthVital, targetUnit: 'mmol/L' | 'mg/dL') => {
        const valueInTarget = getBSValue(log, targetUnit);
        const mType = log.mealType || 'before_meal';
        const limits = GDM_LIMITS[mType as keyof typeof GDM_LIMITS] || GDM_LIMITS.before_meal;
        const limitVal = limits[targetUnit];
        const label = limits.label;
        const isHigh = valueInTarget > limitVal;

        if (isHigh) {
            return {
                label: 'Đường huyết cao ⚠️',
                color: '#ef4444',
                class: 'warning',
                desc: `Vượt ngưỡng khuyến nghị lúc ${label.toLowerCase()} (> ${limitVal} ${targetUnit}). Mẹ nên giảm lượng tinh bột/đường và tái khám đúng hẹn.`
            };
        }
        return {
            label: 'Bình thường ✅',
            color: '#10b981',
            class: 'normal',
            desc: `Chỉ số an toàn lúc ${label.toLowerCase()} (<= ${limitVal} ${targetUnit}).`
        };
    };

    const getMealTypeLabel = (type?: string) => {
        switch (type) {
            case 'before_meal': return 'Trước ăn (Đói)';
            case 'after_meal_1h': return 'Sau ăn 1 giờ';
            case 'after_meal_2h': return 'Sau ăn 2 giờ';
            case 'before_sleep': return 'Trước khi ngủ';
            default: return 'Khác';
        }
    };

    const bpLogs = vitals.filter(v => v.type === 'bp');
    const bsLogs = vitals.filter(v => v.type === 'bs');

    const resetFormInputs = () => {
        setDatetime(getLocalDateTimeInput());
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setBloodSugar('');
        setMealType('before_meal');
        setNotes('');
    };

    const openRecordModal = () => {
        resetFormInputs();
        setInputUnit(displayUnit);
        setShowModal(true);
    };

    const closeRecordModal = () => {
        setShowModal(false);
    };

    // Render SVG Charts dynamically
    const renderBPChart = () => {
        const data = [...bpLogs].reverse().slice(-7); // Get last 7 logs chronologically
        if (data.length < 2) {
            return (
                <div className="chart-empty-state">
                    <IoTrendingUpOutline size={32} color="#94a3b8" />
                    <span>Cần ít nhất 2 kết quả đo huyết áp để vẽ biểu đồ xu hướng.</span>
                </div>
            );
        }

        const width = 450;
        const height = 150;
        const padding = 25;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxSys = Math.max(...data.map(d => d.systolic || 120), 140);
        const minDia = Math.min(...data.map(d => d.diastolic || 80), 60);
        const range = maxSys - minDia + 10;

        const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1);
        const getY = (val: number) => padding + chartHeight - ((val - minDia) * chartHeight) / range;

        let sysPoints = "";
        let diaPoints = "";
        data.forEach((d, idx) => {
            sysPoints += `${getX(idx)},${getY(d.systolic || 120)} `;
            diaPoints += `${getX(idx)},${getY(d.diastolic || 80)} `;
        });

        return (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                    <span>Biến thiên huyết áp (7 lần đo gần nhất)</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#ef4444' }}>● Tối đa (Tâm thu)</span>
                        <span style={{ color: '#3b82f6' }}>● Tối thiểu (Tâm trương)</span>
                    </div>
                </div>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" strokeDasharray="3 3" />
                    
                    {/* Trend lines */}
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={sysPoints} />
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={diaPoints} />

                    {/* Data dots */}
                    {data.map((d, idx) => (
                        <g key={idx}>
                            <circle cx={getX(idx)} cy={getY(d.systolic || 120)} r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
                            <circle cx={getX(idx)} cy={getY(d.diastolic || 80)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                            
                            {/* Date Label on bottom */}
                            <text x={getX(idx)} y={height - 2} fontSize="7" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                                {d.datetime.split('T')[0].split('-')[2]}/{d.datetime.split('T')[0].split('-')[1]}
                            </text>
                            {/* Value tooltips */}
                            <text x={getX(idx)} y={getY(d.systolic || 120) - 6} fontSize="8" fontWeight="800" fill="#b91c1c" textAnchor="middle">{d.systolic}</text>
                            <text x={getX(idx)} y={getY(d.diastolic || 80) + 12} fontSize="8" fontWeight="800" fill="#1d4ed8" textAnchor="middle">{d.diastolic}</text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    const renderBSChart = () => {
        const data = [...bsLogs].reverse().slice(-7);
        if (data.length < 2) {
            return (
                <div className="chart-empty-state">
                    <IoTrendingUpOutline size={32} color="#94a3b8" />
                    <span>Cần ít nhất 2 kết quả đo đường huyết để vẽ biểu đồ xu hướng.</span>
                </div>
            );
        }

        const width = 450;
        const height = 150;
        const padding = 25;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxSugar = Math.max(...data.map(d => getBSValue(d, displayUnit) || (displayUnit === 'mmol/L' ? 6 : 108)), displayUnit === 'mmol/L' ? 9 : 160);
        const minSugar = Math.min(...data.map(d => getBSValue(d, displayUnit) || (displayUnit === 'mmol/L' ? 4 : 72)), displayUnit === 'mmol/L' ? 3 : 54);
        const range = maxSugar - minSugar + (displayUnit === 'mmol/L' ? 2 : 36);

        const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1);
        const getY = (val: number) => padding + chartHeight - ((val - minSugar) * chartHeight) / range;

        let points = "";
        data.forEach((d, idx) => {
            const val = getBSValue(d, displayUnit);
            points += `${getX(idx)},${getY(val)} `;
        });

        return (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>Đường huyết ({displayUnit}) (7 lần đo gần nhất)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Đơn vị hiển thị:</span>
                        <div style={{ display: 'flex', gap: '2px', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
                            <button 
                                type="button"
                                onClick={() => handleUnitChange('mmol/L')}
                                style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: displayUnit === 'mmol/L' ? 'white' : 'transparent', color: displayUnit === 'mmol/L' ? '#059669' : '#64748b', transition: 'all 0.15s' }}
                            >
                                mmol/L
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleUnitChange('mg/dL')}
                                style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: displayUnit === 'mg/dL' ? 'white' : 'transparent', color: displayUnit === 'mg/dL' ? '#059669' : '#64748b', transition: 'all 0.15s' }}
                            >
                                mg/dL
                            </button>
                        </div>
                    </div>
                </div>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" strokeDasharray="3 3" />

                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} />

                    {data.map((d, idx) => {
                        const val = getBSValue(d, displayUnit);
                        return (
                            <g key={idx}>
                                <circle cx={getX(idx)} cy={getY(val)} r="4" fill="white" stroke="#10b981" strokeWidth="2.5" />
                                {/* Date Label */}
                                <text x={getX(idx)} y={height - 2} fontSize="7" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                                    {d.datetime.split('T')[0].split('-')[2]}/{d.datetime.split('T')[0].split('-')[1]}
                                </text>
                                {/* Value Label */}
                                <text x={getX(idx)} y={getY(val) - 6} fontSize="8" fontWeight="800" fill="#047857" textAnchor="middle">{val}</text>
                                {/* Meal type mini icon indicator under point */}
                                <text x={getX(idx)} y={getY(val) + 12} fontSize="6" fontWeight="bold" fill="#64748b" textAnchor="middle">
                                    {d.mealType === 'before_meal' ? 'Đói' : d.mealType?.includes('1h') ? '1h' : d.mealType?.includes('2h') ? '2h' : 'Ngủ'}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    const recordModal = showModal && typeof window !== 'undefined' ? createPortal(
        <div className="vital-modal-overlay no-print" onClick={closeRecordModal}>
            <div className="vital-modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="vital-modal-header">
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#0f172a', fontWeight: 900 }}>
                            {activeTab === 'bp' ? 'Ghi nhận huyết áp' : 'Ghi nhận đường huyết'}
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.4 }}>
                            {activeTab === 'bp'
                                ? 'Nhập chỉ số huyết áp và nhịp tim để lưu nhanh vào hồ sơ.'
                                : 'Nhập chỉ số đường huyết và trạng thái ăn uống tương ứng.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={closeRecordModal}
                        className="vital-modal-close"
                        aria-label="Đóng"
                        title="Đóng"
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                <div className="vital-modal-content">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Thời gian đo</span>
                            <input 
                                type="datetime-local" 
                                value={datetime}
                                onChange={(e) => setDatetime(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                            />
                        </div>

                        {activeTab === 'bp' ? (
                            <div className="vital-modal-grid vital-modal-grid-bp">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Tâm thu (Tối đa)</span>
                                    <input 
                                        type="number" 
                                        placeholder="ví dụ: 120"
                                        value={systolic}
                                        onChange={(e) => setSystolic(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>mmHg</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Tâm trương (Tối thiểu)</span>
                                    <input 
                                        type="number" 
                                        placeholder="ví dụ: 80"
                                        value={diastolic}
                                        onChange={(e) => setDiastolic(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>mmHg</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Nhịp tim (Lần/phút)</span>
                                    <input 
                                        type="number" 
                                        placeholder="ví dụ: 78"
                                        value={pulse}
                                        onChange={(e) => setPulse(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>Lần/phút (Tùy chọn)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="vital-modal-grid vital-modal-grid-bs">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Chỉ số đo</span>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        placeholder={inputUnit === 'mmol/L' ? 'ví dụ: 5.2' : 'ví dụ: 95'}
                                        value={bloodSugar}
                                        onChange={(e) => setBloodSugar(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>Nhập chỉ số</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Đơn vị đo</span>
                                    <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '4px', borderRadius: '14px', height: '48px', alignItems: 'center' }}>
                                        <button 
                                            type="button"
                                            onClick={() => setInputUnit('mmol/L')}
                                            style={{ flex: 1, height: '100%', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: inputUnit === 'mmol/L' ? 'white' : 'transparent', color: inputUnit === 'mmol/L' ? '#059669' : '#64748b', transition: 'all 0.15s', boxShadow: inputUnit === 'mmol/L' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}
                                        >
                                            mmol/L
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setInputUnit('mg/dL')}
                                            style={{ flex: 1, height: '100%', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: inputUnit === 'mg/dL' ? 'white' : 'transparent', color: inputUnit === 'mg/dL' ? '#059669' : '#64748b', transition: 'all 0.15s', boxShadow: inputUnit === 'mg/dL' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}
                                        >
                                            mg/dL
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>Bắt buộc</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Trạng thái ăn uống</span>
                                    <select 
                                        value={mealType}
                                        onChange={(e: any) => setMealType(e.target.value)}
                                        style={{ appearance: 'none', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px', width: '100%', fontSize: '0.92rem', outline: 'none', height: '48px' }}
                                    >
                                        <option value="before_meal">Trước ăn (Đói)</option>
                                        <option value="after_meal_1h">Sau ăn 1 giờ</option>
                                        <option value="after_meal_2h">Sau ăn 2 giờ</option>
                                        <option value="before_sleep">Trước khi đi ngủ</option>
                                    </select>
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>Bắt buộc</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Ghi chú thêm</span>
                            <input 
                                type="text" 
                                placeholder="Ví dụ: Cảm thấy hơi chóng mặt, sau khi đi bộ nhẹ..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                            />
                        </div>

                        <button 
                            type="submit"
                            style={{
                                background: activeTab === 'bp' ? '#0891b2' : '#059669', color: 'white',
                                border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', marginTop: '6px',
                                boxShadow: activeTab === 'bp' ? '0 4px 12px rgba(8, 145, 178, 0.2)' : '0 4px 12px rgba(5, 150, 105, 0.2)'
                            }}
                        >
                            Lưu chỉ số mới
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    const renderInfoGuide = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
                {/* General intro card */}
                <div style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
                            📖
                        </span>
                        Cẩm Nang & Hướng Dẫn Y Khoa Chuẩn Thai Kỳ
                    </h3>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>
                        Chào mẹ bầu! Việc tự theo dõi huyết áp và đường huyết tại nhà đóng vai trò cực kỳ quan trọng giúp phát hiện sớm các nguy cơ như tiền sản giật và đái tháo đường thai kỳ. Dưới đây là hướng dẫn chi tiết về kỹ thuật đo chuẩn, giải thích chỉ số và lời khuyên hữu ích để mẹ có một thai kỳ khỏe mạnh nhất.
                    </p>
                </div>

                <div className="guide-grid">
                    
                    {/* HUYẾT ÁP */}
                    <div style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(8, 145, 178, 0.12)', color: '#0891b2', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Chỉ số Huyết áp & Nhịp tim
                            </span>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.18rem', color: '#0f172a', fontWeight: 900 }}>
                                🩸 Đo Huyết áp & Tầm soát Tiền sản giật
                            </h4>
                        </div>

                        {/* Image */}
                        <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <img src="/bp_guide.png" alt="Hướng dẫn đo huyết áp" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>

                        {/* Explanation Table */}
                        <div>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 800 }}>Chỉ số huyết áp chuẩn trong thai kỳ:</h5>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Phân loại</th>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Tâm thu (mmHg)</th>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Tâm trương (mmHg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#10b981' }}>Bình thường</td>
                                            <td style={{ padding: '8px 4px' }}>&lt; 120</td>
                                            <td style={{ padding: '8px 4px' }}>&lt; 80</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#f59e0b' }}>Tiền cao HA</td>
                                            <td style={{ padding: '8px 4px' }}>120 - 139</td>
                                            <td style={{ padding: '8px 4px' }}>80 - 89</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#ef4444' }}>Huyết áp cao ⚠️</td>
                                            <td style={{ padding: '8px 4px' }}>&ge; 140</td>
                                            <td style={{ padding: '8px 4px' }}>&ge; 90</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#3b82f6' }}>Huyết áp thấp</td>
                                            <td style={{ padding: '8px 4px' }}>&lt; 90</td>
                                            <td style={{ padding: '8px 4px' }}>&lt; 60</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Measuring tips */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.8rem', lineHeight: 1.5, color: '#475569' }}>
                            <strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '0.85rem' }}>💡 Hướng dẫn đo chuẩn tại nhà:</strong>
                            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <li><strong>Nghỉ ngơi:</strong> Ngồi yên tĩnh thư giãn từ 5-10 phút trước khi đo.</li>
                                <li><strong>Tư thế:</strong> Ngồi thẳng lưng tựa vào ghế, hai chân chạm sàn (không bắt chéo chân), cánh tay đặt trên bàn ngang tầm với tim.</li>
                                <li><strong>Tránh tác nhân:</strong> Không đo ngay sau khi ăn no, vừa vận động mạnh, hoặc sử dụng chất kích thích trong vòng 30 phút.</li>
                                <li><strong>Lịch đo định kỳ:</strong> Nên đo vào 2 thời điểm cố định mỗi ngày (sáng sau khi ngủ dậy và tối trước khi đi ngủ) để theo dõi biến thiên chính xác nhất.</li>
                            </ul>
                        </div>

                        {/* Critical warning */}
                        <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', padding: '16px', borderRadius: '16px', fontSize: '0.8rem', color: '#b91c1c', lineHeight: 1.5 }}>
                            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>🚨 Dấu hiệu nguy hiểm (Tiền sản giật):</strong>
                            Nếu chỉ số đo vượt ngưỡng <strong>140/90 mmHg</strong> kèm theo các biểu hiện như nhức đầu dữ dội, hoa mắt, nhìn mờ, sưng phù chân tay mặt đột ngột hoặc đau vùng thượng vị, mẹ cần liên hệ ngay bác sĩ sản phụ khoa hoặc đến bệnh viện để được can thiệp kịp thời.
                        </div>
                    </div>

                    {/* ĐƯỜNG HUYẾT */}
                    <div style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Chỉ số Đường huyết (Glucose)
                            </span>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.18rem', color: '#0f172a', fontWeight: 900 }}>
                                🍬 Kiểm soát Đái tháo đường Thai kỳ
                            </h4>
                        </div>

                        {/* Image */}
                        <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <img src="/bs_guide.png" alt="Hướng dẫn đo đường huyết" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>

                        {/* Explanation Table */}
                        <div>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 800 }}>Ngưỡng đường huyết an toàn cho mẹ bầu (ADA/Bộ Y tế):</h5>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Trạng thái đo</th>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Chuẩn (mmol/L)</th>
                                            <th style={{ padding: '8px 4px', color: '#64748b' }}>Chuẩn (mg/dL)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>Lúc đói (Nhịn ăn tối thiểu 8h)</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 5.3</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 95</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>Sau ăn 1 giờ</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 7.8</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 140</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>Sau ăn 2 giờ</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 6.7</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 120</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>Trước khi đi ngủ</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 6.7</td>
                                            <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>&le; 120</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Measuring tips */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.8rem', lineHeight: 1.5, color: '#475569' }}>
                            <strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '0.85rem' }}>💡 Hướng dẫn đo chuẩn tại nhà:</strong>
                            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <li><strong>Tính giờ sau ăn:</strong> Mốc thời gian (1 giờ hoặc 2 giờ) sau ăn bắt đầu tính từ <strong>miếng ăn đầu tiên</strong> của bữa, không phải sau khi ăn xong.</li>
                                <li><strong>Vệ sinh tay sạch sẽ:</strong> Luôn rửa sạch tay bằng xà phòng ấm và lau thật khô trước khi đo. Tránh dùng cồn ướt hoặc để tay bám đường từ thức ăn (ví dụ như hoa quả, bánh kẹo), vì điều này có thể làm sai lệch nghiêm trọng kết quả đo.</li>
                                <li><strong>Chọn vị trí lấy máu:</strong> Nên chích máu ở hai bên rìa ngón tay (tránh chích chính giữa đệm ngón tay để giảm bớt cảm giác đau nhức).</li>
                            </ul>
                        </div>

                        {/* Dietary Recommendations */}
                        <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: '16px', borderRadius: '16px', fontSize: '0.8rem', color: '#15803d', lineHeight: 1.5 }}>
                            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>🥗 Lời khuyên kiểm soát đường huyết:</strong>
                            - <strong>Ăn uống lành mạnh:</strong> Chia nhỏ bữa ăn (3 bữa chính, 2-3 bữa phụ) để tránh lượng đường huyết tăng đột ngột. Giảm bớt lượng tinh bột tinh chế (như gạo trắng, bánh mì trắng) và tăng cường tinh bột phức hợp (gạo lứt, yến mạch, các loại đậu) kết hợp nhiều rau xanh.<br/>
                            - <strong>Vận động nhẹ nhàng:</strong> Đi bộ chậm rãi khoảng 15-20 phút sau khi ăn bữa chính để giúp cơ thể tiêu thụ bớt lượng đường huyết tự nhiên.<br/>
                            - <strong>Tuân thủ:</strong> Thực hiện theo đúng chỉ định của bác sĩ chuyên khoa và điều chỉnh chế độ ăn phù hợp thay vì tự ý nhịn ăn quá mức gây hạ đường huyết có hại cho thai nhi.
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="utility-page-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header Banner */}
            <div className="suc-khoe-banner no-print" style={{ 
                background: activeTab === 'bp' 
                    ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' 
                    : activeTab === 'bs'
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                padding: '22px 22px 20px', 
                borderRadius: '28px', 
                color: 'white', 
                position: 'relative', 
                overflow: 'hidden', 
                boxShadow: activeTab === 'bp' 
                    ? '0 18px 40px -12px rgba(6, 182, 212, 0.38)' 
                    : activeTab === 'bs'
                    ? '0 18px 40px -12px rgba(16, 185, 129, 0.38)'
                    : '0 18px 40px -12px rgba(99, 102, 241, 0.38)', 
                marginTop: '-2px' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: '1 1 280px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex', flexShrink: 0 }}>
                            {activeTab === 'info' ? <IoInformationCircleOutline size={30} /> : <IoPulseOutline size={30} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                                {activeTab === 'bp' 
                                    ? 'Theo Dõi Huyết Áp & Nhịp Tim' 
                                    : activeTab === 'bs'
                                    ? 'Theo Dõi Đường Huyết'
                                    : 'Cẩm Nang & Hướng Dẫn Y Khoa'}
                                {profile?.syncRole === 'partner' && (
                                    <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '12px', marginLeft: '10px', verticalAlign: 'middle', fontWeight: 700 }}>
                                        Đang đồng bộ 👨‍👩‍👦
                                    </span>
                                )}
                            </h2>
                            <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4, maxWidth: '700px' }}>
                                {activeTab === 'bp' 
                                    ? 'Tầm soát sớm biến chứng tăng huyết áp thai kỳ và tiền sản giật.' 
                                    : activeTab === 'bs'
                                    ? 'Giúp kiểm soát đường huyết ngừa đái tháo đường thai kỳ để bé phát triển khỏe mạnh.'
                                    : 'Thông tin y khoa chuẩn giúp mẹ hiểu rõ các chỉ số huyết áp và đường huyết.'}
                            </p>
                        </div>
                    </div>
                    {activeTab !== 'info' && (
                        <div className="suc-khoe-banner-actions">
                            <button
                                type="button"
                                onClick={openRecordModal}
                                className="suc-khoe-banner-primary"
                                style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    color: 'white',
                                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
                                }}
                                title="Thêm chỉ số"
                                aria-label="Thêm chỉ số"
                            >
                                <IoAddCircleOutline size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Swapping */}
            <div className="no-print" style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
                <button 
                    onClick={() => setActiveTab('bp')}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', background: activeTab === 'bp' ? 'white' : 'transparent', color: activeTab === 'bp' ? '#0891b2' : '#64748b', boxShadow: activeTab === 'bp' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🩸 Huyết áp & Nhịp tim
                </button>
                <button 
                    onClick={() => setActiveTab('bs')}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', background: activeTab === 'bs' ? 'white' : 'transparent', color: activeTab === 'bs' ? '#059669' : '#64748b', boxShadow: activeTab === 'bs' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🍬 Đường huyết
                </button>
                <button 
                    onClick={() => setActiveTab('info')}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', background: activeTab === 'info' ? 'white' : 'transparent', color: activeTab === 'info' ? '#6366f1' : '#64748b', boxShadow: activeTab === 'info' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    📖 Hướng dẫn Y khoa
                </button>
            </div>

            {/* Dashboard Content split layout */}
            <div className="sk-flex-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeTab === 'info' ? (
                    renderInfoGuide()
                ) : (
                    /* 2. CHART VIEW & HISTORY LOGS */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        
                        {/* SVG Trendline Chart */}
                        <div className="card no-print" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                            {activeTab === 'bp' ? renderBPChart() : renderBSChart()}
                        </div>

                        {/* Historical logs table list */}
                        <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoPulseOutline size={22} color="#6366f1" />
                                Lịch sử đo gần đây ({activeTab === 'bp' ? bpLogs.length : bsLogs.length} lần đo)
                            </h3>

                            {/* List items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeTab === 'bp' ? (
                                    bpLogs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                                            Chưa có bản ghi huyết áp nào. Hãy nhập chỉ số ở khung bên.
                                        </div>
                                    ) : (
                                        bpLogs.map((log) => {
                                            const status = getBPStatus(log.systolic || 0, log.diastolic || 0);
                                            return (
                                                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                                                    <div style={{ flex: 1, paddingRight: '8px' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>
                                                                {log.systolic}/{log.diastolic} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>mmHg</span>
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', background: status.color + '18', color: status.color, padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                                                            <span>📅 {log.datetime.replace('T', ' ')}</span>
                                                            {log.pulse && <span>💓 Nhịp tim: {log.pulse} lần/phút</span>}
                                                        </div>

                                                        {log.notes && (
                                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
                                                                Ghi chú: {log.notes}
                                                            </p>
                                                        )}
                                                        
                                                        {status.class !== 'normal' && (
                                                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#d97706', fontWeight: 500, lineHeight: 1.35 }}>
                                                                <IoInformationCircleOutline size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                                                                <span>{status.desc}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button onClick={() => handleDelete(log.id)} className="no-print" style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer', opacity: 0.7 }} title="Xóa bản ghi">
                                                        <IoTrashOutline size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    bsLogs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                                            Chưa có bản ghi đường huyết nào. Hãy nhập chỉ số ở khung bên.
                                        </div>
                                    ) : (
                                        bsLogs.map((log) => {
                                            const displayVal = getBSValue(log, displayUnit);
                                            const status = getBSStatus(log, displayUnit);
                                            return (
                                                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                                                    <div style={{ flex: 1, paddingRight: '8px' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>
                                                                {displayVal} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{displayUnit}</span>
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                                                {getMealTypeLabel(log.mealType)}
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', background: status.color + '18', color: status.color, padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                                                {status.label}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                                                            <span>📅 {log.datetime.replace('T', ' ')}</span>
                                                        </div>

                                                        {log.notes && (
                                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
                                                                Ghi chú: {log.notes}
                                                            </p>
                                                        )}

                                                        {status.class !== 'normal' && (
                                                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#ef4444', fontWeight: 500, lineHeight: 1.35 }}>
                                                                <IoInformationCircleOutline size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                                                                <span>{status.desc}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button onClick={() => handleDelete(log.id)} className="no-print" style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer', opacity: 0.7 }} title="Xóa bản ghi">
                                                        <IoTrashOutline size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {recordModal}

            <style jsx global>{`
                .guide-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                }

                @media (max-width: 900px) {
                    .guide-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .chart-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    font-weight: 600;
                    width: 100%;
                    min-height: 120px;
                }

                .suc-khoe-banner-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: nowrap;
                    justify-content: flex-end;
                }

                .suc-khoe-banner-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.24);
                    font-weight: 800;
                    cursor: pointer;
                    flex-shrink: 0;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .vital-modal-overlay {
                    display: flex;
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.58);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 2200;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .vital-modal-sheet {
                    width: 100%;
                    max-width: 680px;
                    max-height: 90vh;
                    background: white;
                    border-radius: 28px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
                    animation: vitalZoomIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }

                .vital-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 24px 24px 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .vital-modal-close {
                    background: transparent;
                    border: none;
                    color: #475569;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px;
                    border-radius: 10px;
                    flex-shrink: 0;
                }

                .vital-modal-content {
                    overflow-y: auto;
                    flex: 1;
                    padding: 20px 24px 24px 24px;
                }

                .vital-modal-grid {
                    display: grid;
                    gap: 12px;
                }

                .vital-modal-grid-bp {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                .vital-modal-grid-bs {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                @keyframes vitalZoomIn {
                    from { transform: scale(0.94) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                @keyframes vitalSheetUp {
                    from { transform: translateY(100%); opacity: 0.5; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 900px) {
                    .vital-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }

                    .vital-modal-sheet {
                        max-width: none;
                        max-height: 85vh;
                        border-radius: 28px 28px 0 0;
                        box-shadow: 0 -20px 50px rgba(15, 23, 42, 0.18);
                        animation: vitalSheetUp 0.34s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }

                @media (max-width: 720px) {
                    .vital-modal-grid-bp,
                    .vital-modal-grid-bs {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 576px) {
                    .suc-khoe-banner-actions {
                        width: auto;
                        justify-content: flex-end;
                    }

                    .vital-modal-header {
                        padding: 20px 20px 14px 20px;
                    }

                    .vital-modal-content {
                        padding: 18px 20px 20px 20px;
                    }
                }

            `}</style>
        </div>
    );
}
