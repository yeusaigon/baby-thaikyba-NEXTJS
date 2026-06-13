'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
    IoHeartOutline, IoAddCircleOutline, IoTrashOutline, IoTrendingUpOutline, 
    IoPrintOutline, IoDownloadOutline, IoPulseOutline, IoInformationCircleOutline,
    IoChevronForwardOutline, IoShieldHalfOutline, IoWineOutline, IoCheckmarkCircle
} from 'react-icons/io5';
import Link from 'next/link';

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
    mealType?: 'before_meal' | 'after_meal_1h' | 'after_meal_2h' | 'before_sleep';
    notes?: string;
}

export default function HealthVitalsTracker() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [vitals, setVitals] = useState<HealthVital[]>([]);
    const [activeTab, setActiveTab] = useState<'bp' | 'bs'>('bp');

    // Input States
    const [datetime, setDatetime] = useState('');
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [mealType, setMealType] = useState<'before_meal' | 'after_meal_1h' | 'after_meal_2h' | 'before_sleep'>('before_meal');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Set default datetime to current local time
        const now = new Date();
        const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDatetime(localISO);

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const q = query(
                    collection(db, "users", currentUser.uid, "health_vitals"),
                    orderBy("datetime", "desc")
                );
                const unsubDb = onSnapshot(q, (snap) => {
                    const list: HealthVital[] = [];
                    snap.docs.forEach(d => {
                        list.push({ id: d.id, ...d.data() } as HealthVital);
                    });
                    setVitals(list);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !datetime) return;

        const id = 'vital_' + Date.now();
        const recordRef = doc(db, "users", user.uid, "health_vitals", id);

        const data: Partial<HealthVital> = {
            id,
            type: activeTab,
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
            data.mealType = mealType;
        }

        try {
            await setDoc(recordRef, data);
            // Reset input fields except date
            setSystolic('');
            setDiastolic('');
            setPulse('');
            setBloodSugar('');
            setNotes('');
        } catch (err: any) {
            alert("Lỗi lưu chỉ số: " + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa chỉ số này không?")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "health_vitals", id));
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

    const getBSStatus = (sugar: number, mType: string) => {
        let isHigh = false;
        let limit = 0;
        let label = '';

        if (mType === 'before_meal') {
            limit = 5.5; // mmol/L
            isHigh = sugar > limit;
            label = 'Đường huyết đói';
        } else if (mType === 'after_meal_1h') {
            limit = 7.8;
            isHigh = sugar > limit;
            label = 'Đường huyết sau ăn 1h';
        } else if (mType === 'after_meal_2h') {
            limit = 6.7;
            isHigh = sugar > limit;
            label = 'Đường huyết sau ăn 2h';
        } else {
            limit = 6.7;
            isHigh = sugar > limit;
            label = 'Đường huyết trước ngủ';
        }

        if (isHigh) {
            return {
                label: 'Đường huyết cao ⚠️',
                color: '#f59e0b',
                class: 'warning',
                desc: `Vượt ngưỡng khuyến nghị lúc ${label.toLowerCase()} (> ${limit} mmol/L). Mẹ nên giảm lượng tinh bột/đường và tái khám đúng hẹn.`
            };
        }
        return {
            label: 'Bình thường ✅',
            color: '#10b981',
            class: 'normal',
            desc: `Chỉ số an toàn lúc ${label.toLowerCase()} (<= ${limit} mmol/L).`
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

    // Export CSV Data
    const handleExportCSV = () => {
        if (vitals.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        let csvContent = "\ufeff"; // BOM for UTF-8 in Excel
        csvContent += "Thời gian,Loại chỉ số,Huyết áp Tối đa (Systolic),Huyết áp Tối thiểu (Diastolic),Nhịp tim (Pulse),Đường huyết (mmol/L),Trạng thái ăn uống (Đường huyết),Ghi chú\n";

        vitals.forEach(v => {
            const dateStr = v.datetime.replace('T', ' ');
            if (v.type === 'bp') {
                csvContent += `"${dateStr}","Huyết áp",${v.systolic},${v.diastolic},${v.pulse || ''},,"N/A","${v.notes || ''}"\n`;
            } else {
                csvContent += `"${dateStr}","Đường huyết",,,${v.bloodSugar},"${getMealTypeLabel(v.mealType)}","${v.notes || ''}"\n`;
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `thaikypro_suc_khoe_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
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

        const maxSugar = Math.max(...data.map(d => d.bloodSugar || 6), 9);
        const minSugar = Math.min(...data.map(d => d.bloodSugar || 4), 3);
        const range = maxSugar - minSugar + 2;

        const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1);
        const getY = (val: number) => padding + chartHeight - ((val - minSugar) * chartHeight) / range;

        let points = "";
        data.forEach((d, idx) => {
            points += `${getX(idx)},${getY(d.bloodSugar || 5)} `;
        });

        return (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                    <span>Đường huyết mmol/L (7 lần đo gần nhất)</span>
                    <span style={{ color: '#10b981' }}>● Chỉ số đo</span>
                </div>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" strokeDasharray="3 3" />

                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} />

                    {data.map((d, idx) => (
                        <g key={idx}>
                            <circle cx={getX(idx)} cy={getY(d.bloodSugar || 5)} r="4" fill="white" stroke="#10b981" strokeWidth="2.5" />
                            {/* Date Label */}
                            <text x={getX(idx)} y={height - 2} fontSize="7" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                                {d.datetime.split('T')[0].split('-')[2]}/{d.datetime.split('T')[0].split('-')[1]}
                            </text>
                            {/* Value Label */}
                            <text x={getX(idx)} y={getY(d.bloodSugar || 5) - 6} fontSize="8" fontWeight="800" fill="#047857" textAnchor="middle">{d.bloodSugar}</text>
                            {/* Meal type mini icon indicator under point */}
                            <text x={getX(idx)} y={getY(d.bloodSugar || 5) + 12} fontSize="6" fontWeight="bold" fill="#64748b" textAnchor="middle">
                                {d.mealType === 'before_meal' ? 'Đói' : d.mealType?.includes('1h') ? '1h' : d.mealType?.includes('2h') ? '2h' : 'Ngủ'}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px', paddingBottom: '100px' }}>
            
            {/* Action Bar (Print & Export) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
                    ← Trở lại Dashboard
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrint} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
                        <IoPrintOutline size={16} /> In / PDF
                    </button>
                    <button onClick={handleExportCSV} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
                        <IoDownloadOutline size={16} /> Xuất Excel (CSV)
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="print-only" style={{ display: 'none', borderBottom: '2px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: 900 }}>BÁO CÁO CHỈ SỐ SỨC KHỎE THAI KỲ</h1>
                <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>Cung cấp bởi ứng dụng ThaiKyPro • Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            {/* Header Banner */}
            <div className="suc-khoe-banner no-print" style={{ background: activeTab === 'bp' ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '24px', borderRadius: '28px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: activeTab === 'bp' ? '0 15px 35px -10px rgba(6, 182, 212, 0.35)' : '0 15px 35px -10px rgba(16, 185, 129, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoPulseOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                            {activeTab === 'bp' ? 'Theo Dõi Huyết Áp & Nhịp Tim' : 'Theo Dõi Đường Huyết'}
                        </h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>
                            {activeTab === 'bp' 
                                ? 'Tầm soát sớm biến chứng tăng huyết áp thai kỳ và tiền sản giật.' 
                                : 'Giúp kiểm soát đường huyết ngừa đái tháo đường thai kỳ để bé phát triển khỏe mạnh.'}
                        </p>
                    </div>
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
            </div>

            {/* Dashboard Content split layout */}
            <div className="sk-flex-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. INPUT FORM CARD */}
                <div className="card no-print" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoAddCircleOutline size={22} color={activeTab === 'bp' ? '#0891b2' : '#059669'} />
                        Ghi nhận chỉ số mới
                    </h3>

                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Date Time selection */}
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

                        {/* BP Specific inputs */}
                        {activeTab === 'bp' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                            /* Sugar specific inputs */
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Chỉ số đo</span>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        placeholder="ví dụ: 5.2"
                                        value={bloodSugar}
                                        onChange={(e) => setBloodSugar(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 600 }}>mmol/L</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Trạng thái ăn uống</span>
                                    <select 
                                        value={mealType}
                                        onChange={(e: any) => setMealType(e.target.value)}
                                        style={{ appearance: 'none', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px', width: '100%', fontSize: '0.92rem', outline: 'none' }}
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

                {/* 2. CHART VIEW & HISTORY LOGS */}
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
                                        const status = getBSStatus(log.bloodSugar || 0, log.mealType || 'before_meal');
                                        return (
                                            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                                                <div style={{ flex: 1, paddingRight: '8px' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>
                                                            {log.bloodSugar} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>mmol/L</span>
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
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
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
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .card {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin-bottom: 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}
