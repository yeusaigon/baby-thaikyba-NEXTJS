'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
    IoCalendarOutline, IoCheckmarkCircle, IoTimeOutline, IoChevronForwardOutline, 
    IoInformationCircleOutline, IoPulseOutline, IoAddCircleOutline, IoTrashOutline,
    IoCloseOutline
} from 'react-icons/io5';
import Link from 'next/link';

interface Vaccine {
    id: string;
    name: string;
    ageGroup: string;
    disease: string;
    description: string;
}

const DEFAULT_VACCINES: Vaccine[] = [
    { id: 'bcg', name: 'Lao (BCG)', ageGroup: 'Sơ sinh', disease: 'Bệnh lao', description: 'Tiêm càng sớm càng tốt trong vòng 30 ngày sau sinh.' },
    { id: 'hepb_0', name: 'Viêm gan B (Sơ sinh)', ageGroup: 'Sơ sinh', disease: 'Viêm gan B', description: 'Tiêm trong vòng 24 giờ đầu sau sinh.' },
    { id: '6in1_1', name: '6 trong 1 (Mũi 1)', ageGroup: '2 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Phòng ngừa 6 bệnh truyền nhiễm nguy hiểm hàng đầu.' },
    { id: 'pneumo_1', name: 'Phế cầu (Mũi 1)', ageGroup: '2 tháng', disease: 'Viêm phổi, Viêm màng não do phế cầu khuẩn', description: 'Giúp bé tránh các bệnh viêm tai giữa và phổi nặng.' },
    { id: 'rota_1', name: 'Uống Rota (Mũi 1)', ageGroup: '2 tháng', disease: 'Tiêu chảy cấp do Rotavirus', description: 'Nhỏ miệng liều đầu tiên.' },
    { id: '6in1_2', name: '6 trong 1 (Mũi 2)', ageGroup: '3 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Tiêm cách mũi 1 tối thiểu 1 tháng.' },
    { id: 'pneumo_2', name: 'Phế cầu (Mũi 2)', ageGroup: '3 tháng', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', description: 'Mũi tiêm tiếp theo phòng phế cầu khuẩn.' },
    { id: 'rota_2', name: 'Uống Rota (Mũi 2)', ageGroup: '3 tháng', disease: 'Tiêu chảy cấp do Rotavirus', description: 'Hoàn thành đủ liều uống bảo vệ bé.' },
    { id: '6in1_3', name: '6 trong 1 (Mũi 3)', ageGroup: '4 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Hoàn thành phác đồ cơ bản 3 mũi tiêm 6in1.' },
    { id: 'pneumo_3', name: 'Phế cầu (Mũi 3)', ageGroup: '4 tháng', disease: 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', description: 'Mũi nhắc lại lần 3 cho phế cầu.' },
    { id: 'flu_1', name: 'Cúm mùa (Mũi 1)', ageGroup: '6 tháng', disease: 'Cúm mùa', description: 'Dành cho trẻ từ 6 tháng tuổi trở lên.' },
    { id: 'flu_2', name: 'Cúm mùa (Mũi 2)', ageGroup: '7 tháng', disease: 'Cúm mùa', description: 'Tiêm sau mũi đầu 1 tháng để tạo miễn dịch tốt.' },
    { id: 'mening_1', name: 'Não mô cầu BC (Mũi 1)', ageGroup: '6 tháng', disease: 'Viêm màng não do não mô cầu khuẩn', description: 'Bảo vệ trẻ trước chủng khuẩn vô cùng nguy hiểm.' },
    { id: 'measles_1', name: 'Sởi đơn (Mũi 1)', ageGroup: '9 tháng', disease: 'Bệnh sởi', description: 'Mũi sởi đơn đầu tiên theo lịch TCMR.' },
    { id: 'mening_ac', name: 'Não mô cầu AC', ageGroup: '9 tháng', disease: 'Viêm màng não do não mô cầu khuẩn AC', description: 'Tiêm ngừa chủng khuẩn não mô cầu nhóm AC.' },
    { id: 'je_1', name: 'Viêm não Nhật Bản (Mũi 1)', ageGroup: '12 tháng', disease: 'Viêm não Nhật Bản', description: 'Thường sử dụng vắc xin thế hệ mới (Imojev).' },
    { id: 'mmr_1', name: 'Sởi - Quai bị - Rubella (MMR)', ageGroup: '12 tháng', disease: 'Sởi, Quai bị, Rubella', description: 'Tạo miễn dịch tổng hợp vô cùng quan trọng.' },
    { id: 'varicella_1', name: 'Thủy đậu (Mũi 1)', ageGroup: '12 tháng', disease: 'Bệnh thủy đậu', description: 'Phòng ngừa bệnh thủy đậu lây lan nhanh.' },
    { id: 'hepa_1', name: 'Viêm gan A (Mũi 1)', ageGroup: '12 tháng', disease: 'Viêm gan A', description: 'Tiêm bảo vệ gan của em bé.' },
    { id: '6in1_4', name: '6 trong 1 (Mũi 4 nhắc)', ageGroup: '18 tháng', disease: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B', description: 'Mũi tiêm nhắc lại quan trọng kéo dài hiệu lực bảo vệ.' }
];

const MOM_VACCINES: Vaccine[] = [
    { id: 'mom_vat_1', name: 'Uốn ván mũi 1 (VAT 1)', ageGroup: 'Tuần 20 - 24', disease: 'Uốn ván sơ sinh', description: 'Uốn ván liều đầu tiên khi mang thai (hoặc chưa tiêm đủ).' },
    { id: 'mom_vat_2', name: 'Uốn ván mũi 2 (VAT 2)', ageGroup: 'Tuần 24 - 28', disease: 'Uốn ván sơ sinh', description: 'Uốn ván liều nhắc. Tiêm sau mũi 1 ít nhất 1 tháng và trước sinh ít nhất 1 tháng.' },
    { id: 'mom_flu', name: 'Cúm mùa', ageGroup: 'Mọi tuần thai', disease: 'Cúm mùa và biến chứng cúm', description: 'Phòng cúm cho mẹ và truyền kháng thể miễn dịch thụ động giúp bảo vệ bé 6 tháng đầu đời.' },
    { id: 'mom_dtap', name: 'Ho gà - Bạch hầu - Uốn ván (dTaP)', ageGroup: 'Tuần 27 - 36', disease: 'Ho gà, Bạch hầu, Uốn ván', description: 'Tạo kháng thể phòng ho gà truyền cho con trước sinh. Thời điểm vàng là tuần thứ 27 đến 32.' }
];

const BABY_AGE_GROUPS = ['Sơ sinh', '1 tháng', '2 tháng', '3 tháng', '4 tháng', '6 tháng', '7 tháng', '9 tháng', '12 tháng', '18 tháng', '24 tháng'];
const MOM_AGE_GROUPS = ['Tuần 20 - 24', 'Tuần 24 - 28', 'Tuần 27 - 36', 'Mọi tuần thai', 'Mốc khác'];

export default function ImmunizationTracker() {
    const [user, setUser] = useState<any>(null);
    const [userVax, setUserVax] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'baby' | 'mom'>('baby');
    
    // Form State
    const [selectedVax, setSelectedVax] = useState<Vaccine | null>(null);
    const [isDone, setIsDone] = useState(false);
    const [dateDone, setDateDone] = useState('');
    const [reaction, setReaction] = useState('');
    const [notes, setNotes] = useState('');
    const [customVaxName, setCustomVaxName] = useState('');
    const [customVaxAge, setCustomVaxAge] = useState('2 tháng');
    const [showAddCustom, setShowAddCustom] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const unsubDb = onSnapshot(collection(db, "users", currentUser.uid, "immunizations"), (snap) => {
                    const data: Record<string, any> = {};
                    snap.docs.forEach(d => { data[d.id] = d.data(); });
                    setUserVax(data);
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

    const openVaxModal = (vax: Vaccine) => {
        setSelectedVax(vax);
        const record = userVax[vax.id];
        if (record) {
            setIsDone(!!record.dateDone);
            setDateDone(record.dateDone || new Date().toISOString().split('T')[0]);
            setReaction(record.reaction || '');
            setNotes(record.notes || '');
        } else {
            setIsDone(false);
            setDateDone(new Date().toISOString().split('T')[0]);
            setReaction('');
            setNotes('');
        }
    };

    const handleSaveRecord = async () => {
        if (!user || !selectedVax) return;
        const recordRef = doc(db, "users", user.uid, "immunizations", selectedVax.id);
        if (isDone) {
            await setDoc(recordRef, {
                id: selectedVax.id,
                name: selectedVax.name,
                ageGroup: selectedVax.ageGroup,
                disease: selectedVax.disease,
                dateDone,
                reaction,
                notes,
                isMom: activeTab === 'mom' || selectedVax.id.startsWith('mom_')
            }, { merge: true });
        } else {
            await deleteDoc(recordRef);
        }
        setSelectedVax(null);
    };

    const handleAddCustomVax = async () => {
        if (!user || !customVaxName.trim()) return;
        const customId = 'custom_' + (activeTab === 'mom' ? 'mom_' : '') + Date.now();
        const recordRef = doc(db, "users", user.uid, "immunizations", customId);
        await setDoc(recordRef, {
            id: customId,
            name: customVaxName,
            ageGroup: customVaxAge,
            disease: 'Tùy chọn',
            dateDone: new Date().toISOString().split('T')[0],
            reaction: '',
            notes: 'Mũi tiêm bổ sung tự chọn',
            isMom: activeTab === 'mom'
        });
        setCustomVaxName('');
        setShowAddCustom(false);
    };

    const handleDeleteCustomVax = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa mũi tiêm tùy chọn này không?")) return;
        await deleteDoc(doc(db, "users", user.uid, "immunizations", id));
    };

    const activeList = activeTab === 'baby' ? [...DEFAULT_VACCINES] : [...MOM_VACCINES];
    Object.keys(userVax).forEach(id => {
        if (id.startsWith('custom_')) {
            const r = userVax[id];
            const isVaxForMom = r.isMom || id.startsWith('custom_mom_');
            if ((activeTab === 'mom' && isVaxForMom) || (activeTab === 'baby' && !isVaxForMom)) {
                activeList.push({
                    id: r.id,
                    name: r.name,
                    ageGroup: r.ageGroup,
                    disease: r.disease || 'Tùy chọn',
                    description: r.notes || 'Mũi tiêm tự chọn'
                });
            }
        }
    });

    const currentAgeGroups = activeTab === 'baby' ? BABY_AGE_GROUPS : MOM_AGE_GROUPS;
    const groupedVaccines = currentAgeGroups.map(age => ({
        age,
        list: activeList.filter(v => v.ageGroup === age)
    })).filter(g => g.list.length > 0);

    const totalVaccines = activeList.length;
    const completedVaccines = activeList.filter(v => userVax[v.id]?.dateDone).length;
    const progressPercent = totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0;

    return (
        <>
            <div className="utility-page-container fade-in">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
                <button 
                    onClick={() => { setActiveTab('baby'); setCustomVaxAge('2 tháng'); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: activeTab === 'baby' ? 'white' : 'transparent', color: activeTab === 'baby' ? '#10b981' : '#64748b', boxShadow: activeTab === 'baby' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🍼 Tiêm chủng cho Bé
                </button>
                <button 
                    onClick={() => { setActiveTab('mom'); setCustomVaxAge('Mọi tuần thai'); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', background: activeTab === 'mom' ? 'white' : 'transparent', color: activeTab === 'mom' ? '#ec4899' : '#64748b', boxShadow: activeTab === 'mom' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                    🤰 Tiêm chủng cho Mẹ
                </button>
            </div>

            <div className="vax-header-banner" style={{ background: activeTab === 'mom' ? 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)' : undefined, boxShadow: activeTab === 'mom' ? '0 15px 35px -10px rgba(236, 72, 153, 0.4)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoCalendarOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{activeTab === 'baby' ? 'Lịch Tiêm Chủng Cho Bé' : 'Lịch Tiêm Chủng Cho Mẹ'}</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>{activeTab === 'baby' ? 'Bảo vệ bé yêu khỏe mạnh vững bước hành trình đầu đời.' : 'Bảo vệ sức khỏe cho mẹ và truyền kháng thể miễn dịch sớm cho con.'}</p>
                    </div>
                </div>

                <div style={{ marginTop: '20px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', opacity: 0.95 }}>
                        <span>Đã hoàn thành</span>
                        <span>{completedVaccines}/{totalVaccines} Mũi tiêm ({progressPercent}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'white', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Danh sách mũi tiêm chủng</h3>
                <button 
                    onClick={() => setShowAddCustom(true)}
                    style={{ background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: activeTab === 'mom' ? '0 4px 10px rgba(236, 72, 153, 0.2)' : '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                >
                    <IoAddCircleOutline size={18} /> Thêm mũi tùy chọn
                </button>
            </div>

            <div className="vax-timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {groupedVaccines.map((group, groupIdx) => (
                    <div className="vax-group" key={groupIdx} style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
                        <h4 style={{ margin: '0 0 16px 0', color: activeTab === 'mom' ? '#db2777' : '#10b981', fontWeight: 900, fontSize: '1.05rem', borderBottom: '1.5px dashed #f1f5f9', paddingBottom: '10px' }}>
                            {activeTab === 'baby' ? `Trẻ ở mốc ${group.age}` : `Khuyến nghị ở mốc ${group.age}`}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {group.list.map((vax, idx) => {
                                const record = userVax[vax.id];
                                const isDone = record && !!record.dateDone;
                                return (
                                    <div 
                                        onClick={() => openVaxModal(vax)}
                                        className={`vax-item-card ${isDone ? 'done' : ''}`}
                                        key={idx}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '18px', border: '1.5px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.25s', background: isDone ? (activeTab === 'mom' ? '#fdf2f8' : '#f0fdf4') : '#fafafa', borderColor: isDone ? (activeTab === 'mom' ? '#fbcfe8' : '#bbf7d0') : '#f1f5f9' }}
                                    >
                                        <div style={{ flex: 1, paddingRight: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ fontSize: '0.92rem', color: isDone ? (activeTab === 'mom' ? '#9d174d' : '#14532d') : '#1e293b' }}>{vax.name}</strong>
                                                {vax.id.startsWith('custom_') && (
                                                    <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Tùy chọn</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: isDone ? (activeTab === 'mom' ? '#be185d' : '#15803d') : '#64748b', marginTop: '4px', fontWeight: 500 }}>Phòng bệnh: {vax.disease}</div>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{vax.description}</p>
                                            {isDone && record && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '0.75rem', color: activeTab === 'mom' ? '#9d174d' : '#166534', fontWeight: 600 }}>
                                                    <span>📅 Ngày tiêm: {record.dateDone.split('-').reverse().join('/')}</span>
                                                    {record.reaction && <span>🤒 Phản ứng: {record.reaction}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isDone ? <IoCheckmarkCircle size={24} color={activeTab === 'mom' ? '#ec4899' : '#10b981'} /> : <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                                            {vax.id.startsWith('custom_') && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomVax(vax.id); }} style={{ border: 'none', background: 'transparent', color: '#ef4444', padding: '6px', cursor: 'pointer' }}>
                                                    <IoTrashOutline size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            </div>

            {selectedVax && (
                <div className="vax-modal-overlay" onClick={() => setSelectedVax(null)}>
                    <div className="vax-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-handle"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{selectedVax.name}</h3>
                            <button onClick={() => setSelectedVax(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem' }}><IoCloseOutline /></button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Mốc tiêm: {selectedVax.ageGroup} • Phòng bệnh: {selectedVax.disease}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '14px', borderRadius: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                                <input type="checkbox" checked={isDone} onChange={(e) => setIsDone(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: activeTab === 'mom' ? '#ec4899' : '#10b981' }} />
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#334155' }}>Đã tiêm mũi vắc xin này</span>
                            </label>
                            {isDone && (
                                <>
                                    <input type="date" value={dateDone} onChange={(e) => setDateDone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }} />
                                    <input type="text" placeholder="Phản ứng sau tiêm" value={reaction} onChange={(e) => setReaction(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }} />
                                    <textarea placeholder="Ghi chú thêm..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', resize: 'none' }} />
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button onClick={() => setSelectedVax(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'white' }}>Đóng</button>
                            <button onClick={handleSaveRecord} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none' }}>Lưu lại</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddCustom && (
                <div className="vax-modal-overlay" onClick={() => setShowAddCustom(false)}>
                    <div className="vax-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-handle"></div>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 900 }}>Thêm mũi tiêm tùy chọn</h3>
                        <input type="text" value={customVaxName} onChange={(e) => setCustomVaxName(e.target.value)} placeholder="Tên vắc xin..." style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '16px' }} />
                        <select value={customVaxAge} onChange={(e) => setCustomVaxAge(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
                            {currentAgeGroups.map((age, i) => <option key={i} value={age}>{age}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowAddCustom(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>Hủy</button>
                            <button onClick={handleAddCustomVax} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'mom' ? '#ec4899' : '#10b981', color: 'white', border: 'none' }}>Thêm mới</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .vax-header-banner {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 28px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px -10px rgba(16, 185, 129, 0.4);
                }
                .vax-header-banner::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .vax-item-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.03);
                    border-color: #cbd5e1;
                }
                .vax-item-card.done:hover {
                    border-color: #86efac;
                }
                .vax-modal-overlay {
                    display: flex;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 99999;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .vax-modal-sheet {
                    width: 100%;
                    max-width: 440px;
                    background: white;
                    border-radius: 28px;
                    padding: 24px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-drag-handle {
                    display: none;
                    width: 40px;
                    height: 5px;
                    background: #cbd5e1;
                    border-radius: 3px;
                    margin: 0 auto 15px auto;
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes slideUpV2 {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @media (max-width: 900px) {
                    .vax-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .vax-modal-sheet {
                        border-radius: 28px 28px 0 0;
                        max-height: 85vh;
                        animation: slideUpV2 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .modal-drag-handle {
                        display: block;
                    }
                }
            `}</style>
        </>
    );
}
