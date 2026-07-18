'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
    IoWalletOutline, IoTrendingDownOutline, IoAddCircleOutline, 
    IoTrashOutline, IoCalendarOutline, IoCartOutline, IoReaderOutline,
    IoCloseOutline, IoShieldCheckmarkOutline, IoPieChartOutline, 
    IoAlertCircleOutline, IoMedicalOutline, IoBulbOutline,
    IoChevronDownOutline, IoChevronUpOutline
} from 'react-icons/io5';

interface ExpenseItem {
    id: string;
    category: 'hospital' | 'shopping' | 'nutrition' | 'care' | 'other';
    amount: number;
    date: string;
    notes: string;
}

const PRESETS = [
    { name: 'Khám thai & siêu âm định kỳ', amount: 500000, category: 'hospital' },
    { name: 'Gói đi sinh bệnh viện (Viện phí)', amount: 10000000, category: 'hospital' },
    { name: 'Giường, nôi, cũi cho bé', amount: 2000000, category: 'shopping' },
    { name: 'Xe đẩy & Ghế ô tô sơ sinh', amount: 2500000, category: 'shopping' },
    { name: 'Máy hút sữa & Máy tiệt trùng', amount: 1500000, category: 'shopping' },
    { name: 'Quần áo sơ sinh, bao tay chân, mũ', amount: 1000000, category: 'shopping' },
    { name: 'Tã bỉm & Khăn ướt tháng đầu', amount: 500000, category: 'shopping' },
    { name: 'Chậu tắm & Đồ dùng vệ sinh bé', amount: 600000, category: 'shopping' },
    { name: 'Sữa công thức & Bình sữa', amount: 1200000, category: 'nutrition' },
    { name: 'Vitamin, Canxi & Sắt cho mẹ', amount: 800000, category: 'nutrition' },
    { name: 'Dịch vụ tắm bé tại nhà (tháng đầu)', amount: 1500000, category: 'care' },
    { name: 'Massage chăm sóc hồi phục sau sinh', amount: 2500000, category: 'care' },
    { name: 'Gói vắc xin tiêm chủng cho bé', amount: 12000000, category: 'care' },
    { name: 'Khác (Tự nhập tên món bên dưới)', amount: 0, category: 'other' }
];

const CATEGORY_LABELS = {
    hospital: 'Viện phí / Khám thai',
    shopping: 'Mua sắm đồ sơ sinh',
    nutrition: 'Dinh dưỡng / Sữa',
    care: 'Dịch vụ chăm sóc',
    other: 'Chi tiêu khác'
};

const CATEGORY_COLORS = {
    hospital: '#db2777',
    shopping: '#0d9488',
    nutrition: '#f97316',
    care: '#8b5cf6',
    other: '#64748b'
};

const ADVICE_ITEMS = [
    {
        title: "Tối ưu hóa Bảo hiểm (BHYT & Bảo hiểm tư nhân)",
        icon: "insurance",
        summary: "Tận dụng tối đa quyền lợi BHYT nhà nước và bảo hiểm sức khỏe tư nhân để giảm 80-100% viện phí sinh nở.",
        details: [
            "Đối với BHYT Nhà nước: Tìm hiểu bệnh viện đăng ký ban đầu. Khi đi sinh đúng tuyến hoặc có giấy chuyển tuyến hợp lệ, mẹ được hỗ trợ thanh toán 80% - 100% chi phí trong danh mục BHYT (kể cả sinh mổ hoặc sinh thường).",
            "Đối với Bảo hiểm sức khỏe tư nhân: Liên hệ bộ phận Chăm sóc khách hàng của đơn vị bảo hiểm để xác nhận quyền lợi thai sản, giới hạn bồi thường tối đa và thời gian chờ (thường là 270 đến 365 ngày).",
            "Bảo lãnh viện phí trực tiếp: Nên chọn sinh tại các bệnh viện có liên kết bảo lãnh trực tiếp với hãng bảo hiểm của bạn để giảm bớt thủ tục làm hồ sơ thanh toán sau sinh."
        ]
    },
    {
        title: "Phân bổ Ngân sách theo 3 Giai đoạn",
        icon: "budget",
        summary: "Dàn trải các khoản chi tiêu theo từng tam cá nguyệt để tránh dồn áp lực tài chính vào tháng cuối.",
        details: [
            "Giai đoạn 1 (Quý I - Tuần 1 đến 12): Chủ yếu chi cho việc khám thai ban đầu và các xét nghiệm sàng lọc dị tật sớm quan trọng (NIPT hoặc Double Test). NIPT có chi phí cao hơn (từ 3 - 10 triệu) nhưng độ chính xác cực cao >99%.",
            "Giai đoạn 2 (Quý II - Tuần 13 đến 27): Bắt đầu lên danh sách tối giản đồ dùng sơ sinh và mua sắm dần. Tránh mua dồn vào tháng cuối vì mẹ sẽ rất mệt và dễ mua dư thừa do tâm lý.",
            "Giai đoạn 3 (Quý III - Tuần 28 đến sinh): Chuẩn bị tiền đặt cọc gói sinh tại bệnh viện và trích lập riêng một quỹ tiêm chủng cho năm đầu đời của bé (khoảng 10 - 15 triệu)."
        ]
    },
    {
        title: "Mẹo mua sắm đồ sơ sinh Tiết kiệm",
        icon: "shopping",
        summary: "Phân loại rõ danh sách những đồ bắt buộc mua mới hoàn toàn và những đồ có thể dùng lại đồ cũ.",
        details: [
            "Đồ bắt buộc mua mới: Bình sữa, núm ti, tã bỉm, chậu tắm, tăm bông, kem hăm để đảm bảo vệ sinh vô trùng tối đa, tránh nhiễm khuẩn hệ tiêu hóa và da của bé.",
            "Đồ có thể đi xin hoặc mua thanh lý: Cũi gỗ, nôi điện, xe đẩy, máy tiệt trùng bình sữa, máy hâm sữa, máy hút sữa (chỉ cần mua phễu hút và dây dẫn sữa mới). Việc này tiết kiệm đến 50% tổng ngân sách sắm đồ.",
            "Lưu ý về quần áo: Chỉ mua 3-5 bộ size sơ sinh (Newborn) vì em bé phát triển rất nhanh và sẽ chật chỉ sau 2-3 tuần. Nên ưu tiên mua sẵn size 0-3 tháng hoặc 3-6 tháng rộng rãi."
        ]
    },
    {
        title: "Quỹ dự phòng khẩn cấp khi đi sinh",
        icon: "emergency",
        summary: "Chuẩn bị sẵn khoản tiền mặt hoặc tài khoản thanh toán từ 10 - 15 triệu để dự phòng các chỉ định y khoa đột xuất.",
        details: [
            "Dự phòng chuyển sinh mổ: Mẹ định sinh thường nhưng chỉ định y khoa bắt buộc mổ cấp cứu (do cạn ối, suy thai, ngôi thai bất thường...). Chi phí sinh mổ thường cao gấp 2-3 lần sinh thường.",
            "Chi phí chăm sóc bé đặc biệt ngoài dự kiến: Trường hợp em bé sinh non cần nằm lồng kính, chiếu đèn điều trị vàng da sơ sinh, hoặc điều trị y khoa phát sinh.",
            "Giao cho người nhà cầm giữ khoản quỹ này cùng các giấy tờ tùy thân (CCCD, thẻ bảo hiểm) để chủ động nộp tạm ứng viện phí nhanh chóng lúc nhập viện."
        ]
    },
    {
        title: "Lên kế hoạch Tiêm chủng thông minh",
        icon: "vaccine",
        summary: "Kết hợp tối ưu giữa chương trình Tiêm chủng mở rộng của Nhà nước và các mũi dịch vụ tự nguyện.",
        details: [
            "Tiêm chủng mở rộng (Miễn phí): Các vắc xin cơ bản tại Trạm Y tế xã/phường (như Lao, 5-trong-1, sởi, bại liệt...) đã được kiểm định chất lượng nghiêm ngặt và hoàn toàn miễn phí.",
            "Tiêm chủng dịch vụ (Trả phí): Bổ sung các mũi dịch vụ ngoài chương trình quốc gia quan trọng như Phế cầu (phòng viêm phổi, viêm tai giữa), Rota virus (phòng tiêu chảy cấp), Viêm màng não mô cầu BC/ACYW.",
            "Dàn trải chi phí: Tham khảo mua trả góp gói tiêm chủng tại các trung tâm lớn (nếu có ưu đãi) hoặc trả tiền lẻ theo từng lần tiêm để phù hợp với thu nhập hàng tháng."
        ]
    }
];

export default function SimplifiedMaternityFinance() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
    const [customName, setCustomName] = useState('');
    const [amount, setAmount] = useState<string>('500000');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Advice states
    const [expandedAdvice, setExpandedAdvice] = useState<number | null>(0);
    const [activeTab, setActiveTab] = useState<'ledger' | 'advice'>('ledger');

    const getAdviceIcon = (iconName: string, size = 18) => {
        switch (iconName) {
            case 'insurance': return <IoShieldCheckmarkOutline size={size} />;
            case 'budget': return <IoPieChartOutline size={size} />;
            case 'shopping': return <IoCartOutline size={size} />;
            case 'emergency': return <IoAlertCircleOutline size={size} />;
            case 'vaccine': return <IoMedicalOutline size={size} />;
            default: return <IoBulbOutline size={size} />;
        }
    };

    useEffect(() => {
        let unsubDb: (() => void) | null = null;
        let unsubProfile: (() => void) | null = null;

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Fetch profile to resolve target UID
                unsubProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    let targetUid = currentUser.uid;
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        if (data.syncRole === 'partner' && data.partnerUid) {
                            targetUid = data.partnerUid;
                        }
                    }
                    setResolvedUid(targetUid);

                    if (unsubDb) unsubDb();
                    // Subscribe to expenses in "maternity_finance" (strictly expenses)
                    const q = query(
                        collection(db, "users", targetUid, "maternity_finance"),
                        orderBy("date", "desc")
                    );
                    unsubDb = onSnapshot(q, (snap) => {
                        const list = snap.docs
                            .map(d => ({ id: d.id, ...d.data() } as any))
                            // Keep only items that are expenses or default to expense
                            .filter(item => item.type !== 'income')
                            .map(item => ({
                                id: item.id,
                                category: item.category || 'other',
                                amount: Number(item.amount) || 0,
                                date: item.date || new Date().toISOString().split('T')[0],
                                notes: item.notes || ''
                            }));
                        setExpenses(list);
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

    // Pre-fill amount when changing preset menu
    const handlePresetChange = (index: number) => {
        setSelectedPresetIndex(index);
        const preset = PRESETS[index];
        if (preset.name.startsWith('Khác')) {
            setCustomName('');
            setAmount('100000');
        } else {
            setCustomName(preset.name);
            setAmount(preset.amount.toString());
        }
    };

    const handleAddExpense = async (e: React.FormEvent | null, shouldClose: boolean = true) => {
        if (e) e.preventDefault();
        if (!user || submitting) return;

        const itemName = customName.trim();
        if (!itemName) {
            alert('Vui lòng nhập tên món đồ hoặc gói dịch vụ.');
            return;
        }
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Số tiền chi tiêu phải lớn hơn 0.');
            return;
        }

        setSubmitting(true);
        try {
            const preset = PRESETS[selectedPresetIndex];
            const dbUid = resolvedUid || user.uid;
            await addDoc(collection(db, "users", dbUid, "maternity_finance"), {
                type: 'expense',
                category: preset.category || 'other',
                amount: numericAmount,
                date: date,
                notes: itemName
            });

            // Reset custom name
            setCustomName('');
            
            if (shouldClose) {
                setShowAddModal(false); // Hide overlay modal
            }
        } catch (err: any) {
            alert("Lỗi thêm chi tiêu: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!user || !confirm("Bạn có chắc chắn muốn xóa chi phí này không?")) return;
        try {
            const dbUid = resolvedUid || user.uid;
            await deleteDoc(doc(db, "users", dbUid, "maternity_finance", id));
        } catch (err: any) {
            alert("Lỗi xóa chi tiêu: " + err.message);
        }
    };

    // Filtered expenses
    const filteredExpenses = expenses.filter(item => {
        if (selectedMonth === 'all') return true;
        return item.date.startsWith(selectedMonth);
    });

    // Calculations
    const totalSpent = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    // List of months in records for filtering
    const availableMonths = Array.from(
        new Set(expenses.map(item => item.date.substring(0, 7)))
    ).sort((a, b) => b.localeCompare(a)); // Descending

    const formatVND = (n: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    };

    const openAddModal = () => {
        // Pre-select first preset
        setSelectedPresetIndex(0);
        setCustomName(PRESETS[0].name);
        setAmount(PRESETS[0].amount.toString());
        setDate(new Date().toISOString().split('T')[0]);
        setShowAddModal(true);
    };

    return (
        <>
            <div className="utility-page-container fade-in">
            {/* Header Banner */}
            <div className="finance-header-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <IoWalletOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
                            Sổ Ghi Chép Chi Tiêu Sắm Đồ
                            {profile?.syncRole === 'partner' && (
                                <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '12px', marginLeft: '10px', verticalAlign: 'middle' }}>
                                    Đang đồng bộ 👨‍👩‍👦
                                </span>
                            )}
                        </h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>Liệt kê nhanh các gói khám, đồ sơ sinh, dịch vụ đã mua để theo dõi ngân sách.</p>
                    </div>
                </div>
            </div>

            {/* Segment Controls */}
            <div className="segmented-control">
                <button 
                    onClick={() => setActiveTab('ledger')} 
                    className={`segment-btn ${activeTab === 'ledger' ? 'active' : ''}`}
                >
                    Sổ chi tiêu
                </button>
                <button 
                    onClick={() => setActiveTab('advice')} 
                    className={`segment-btn ${activeTab === 'advice' ? 'active' : ''}`}
                >
                    Lời khuyên tài chính
                </button>
            </div>

            {activeTab === 'ledger' && (
                <div className="fade-in">
                    {/* Core Stats Card */}
                    <div className="stats-card-container" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tổng chi tiêu đã ghi nhận</span>
                            <h2 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: 950, color: '#ef4444' }}>
                                {formatVND(totalSpent)}
                            </h2>
                        </div>

                        <div className="stats-actions-container">
                            {/* Add button visible on all screen sizes */}
                            <button 
                                onClick={openAddModal}
                                className="btn-primary stats-add-btn"
                                style={{ margin: 0, padding: '10px 18px', display: 'flex', gap: '8px', alignItems: 'center', background: 'linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 800, fontSize: '0.85rem' }}
                            >
                                <IoAddCircleOutline size={20} /> Ghi chép chi tiêu
                            </button>
                        </div>
                    </div>

                    {/* Ledger List */}
                    <div className="finance-ledger-column" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow-soft)' }}>
                        <div className="list-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoReaderOutline style={{ color: '#db2777' }} /> Danh sách chi tiêu đã mua
                            </h3>
                            
                            {/* Month filter select */}
                            <div className="stats-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="stats-filter-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Lọc:</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="stats-filter-select"
                                    style={{ border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '10px 16px', background: 'white', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    {availableMonths.map(m => {
                                        const [year, month] = m.split('-');
                                        return (
                                            <option key={m} value={m}>{`Tháng ${month}/${year}`}</option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {filteredExpenses.length === 0 ? (
                            <div style={{ background: '#fafafa', border: '1px dashed #e2e8f0', padding: '60px 20px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                Chưa ghi nhận chi phí nào trong khoảng thời gian này.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredExpenses.map((item, idx) => {
                                    const color = CATEGORY_COLORS[item.category] || '#64748b';

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
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    width: '42px', height: '42px', borderRadius: '12px',
                                                    background: `${color}12`, display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: color, flexShrink: 0
                                                }}>
                                                    <IoTrendingDownOutline size={20} />
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.notes}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                                                        <span>📅 {item.date.split('-').reverse().join('/')}</span>
                                                        <span>•</span>
                                                        <span style={{ color: color }}>{CATEGORY_LABELS[item.category]}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
                                                <strong style={{ fontSize: '0.92rem', color: '#ef4444', whiteSpace: 'nowrap' }}>
                                                    -{formatVND(item.amount)}
                                                </strong>
                                                <button 
                                                    onClick={() => handleDeleteExpense(item.id)}
                                                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', padding: '6px', cursor: 'pointer', transition: 'color 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    <IoTrashOutline size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'advice' && (
                <div className="finance-advice-column fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="advice-header-card" style={{ background: 'linear-gradient(135deg, #ffedd5 0%, #fffbeb 100%)', border: '1.5px solid #fde047', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <IoBulbOutline size={26} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#92400e' }}>Cẩm nang Tài chính Thai sản</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#b45309', lineHeight: 1.45 }}>Lời khuyên chuẩn y khoa và kinh nghiệm thực tế giúp bố mẹ chuẩn bị quỹ sinh nở và nuôi con tiết kiệm, thông minh.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {ADVICE_ITEMS.map((item, idx) => {
                            const isExpanded = expandedAdvice === idx;
                            return (
                                <div 
                                    key={idx}
                                    className={`advice-item-card ${isExpanded ? 'expanded' : ''}`}
                                    style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        border: isExpanded ? '2px solid #ea580c' : '1px solid #f1f5f9',
                                        padding: '16px',
                                        boxShadow: isExpanded ? '0 10px 25px rgba(234, 88, 12, 0.08)' : 'var(--shadow-soft)',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onClick={() => setExpandedAdvice(isExpanded ? null : idx)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: isExpanded ? '#fff7ed' : '#f8fafc',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isExpanded ? '#ea580c' : '#64748b',
                                                transition: 'all 0.2s',
                                                flexShrink: 0
                                            }}>
                                                {getAdviceIcon(item.icon, 18)}
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: isExpanded ? '#ea580c' : '#1e293b', transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>
                                                {item.title}
                                            </h4>
                                        </div>
                                        <div style={{ color: '#94a3b8', display: 'flex', flexShrink: 0 }}>
                                            {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                                        </div>
                                    </div>

                                    <p style={{
                                        margin: '8px 0 0 0',
                                        fontSize: '0.84rem',
                                        color: '#475569',
                                        lineHeight: 1.45,
                                        paddingLeft: '48px',
                                        display: isExpanded ? 'none' : 'block'
                                    }}>
                                        {item.summary}
                                    </p>

                                    {isExpanded && (
                                        <div className="advice-details-wrap" style={{ marginTop: '14px', borderTop: '1px dashed #f1f5f9', paddingTop: '14px', paddingLeft: '12px' }}>
                                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {item.details.map((detail, dIdx) => (
                                                    <li key={dIdx} style={{ listStyleType: 'disc' }}>{detail}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            </div>

            {/* Bottom Sheet modal for expense write (exactly matching dinh-duong modal style) */}
            {showAddModal && (
                <div className="finance-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="finance-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 900 }}>Ghi chép chi tiêu</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                <IoCloseOutline size={26} />
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '10px' }}>
                            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Preset menu selector */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Chọn món / Gói dịch vụ có sẵn</span>
                                    <select 
                                        className="form-input"
                                        value={selectedPresetIndex}
                                        onChange={(e) => handlePresetChange(Number(e.target.value))}
                                        style={{ appearance: 'none', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px' }}
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                                            const items = PRESETS.map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => item.category === catKey);
                                            if (items.length === 0) return null;
                                            return (
                                                <optgroup label={catLabel} key={catKey}>
                                                    {items.map(item => (
                                                        <option key={item.originalIndex} value={item.originalIndex}>
                                                            {item.name} {item.amount > 0 ? `(~${formatVND(item.amount)})` : ''}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Name Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Tên món đồ / dịch vụ thực tế</span>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="Ví dụ: Đóng tiền trọn gói đẻ BV Phụ Sản..."
                                        required
                                    />
                                </div>

                                {/* Cost */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Số tiền thực tế (VNĐ)</span>
                                    <input 
                                        type="number"
                                        className="form-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min={0}
                                        required
                                    />
                                </div>

                                {/* Date */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span className="text-label">Ngày mua / sử dụng</span>
                                    <input 
                                        type="date"
                                        className="form-input"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => handleAddExpense(null, true)}
                                        className="btn-primary"
                                        style={{ flex: 1, margin: 0, padding: '14px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', cursor: 'pointer' }}
                                        disabled={submitting}
                                    >
                                        Lưu & Đóng
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleAddExpense(null, false)}
                                        className="btn-primary"
                                        style={{ flex: 1, margin: 0, padding: '14px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', border: 'none', color: 'white', cursor: 'pointer' }}
                                        disabled={submitting}
                                    >
                                        Lưu & Nhập tiếp
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Styling */}
            <style jsx global>{`
                .finance-header-banner {
                    background: linear-gradient(135deg, #ea580c 0%, #ca8a04 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 28px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px -10px rgba(234, 88, 12, 0.4);
                }
                .finance-header-banner::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
                    pointer-events: none;
                }
                .finance-modal-overlay {
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
                .finance-modal-sheet {
                    width: 100%;
                    max-width: 500px;
                    background: white;
                    border-radius: 28px;
                    padding: 24px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                
                /* Segment Controls and Advice Card rules */
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
                    color: #ea580c;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                .advice-item-card {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .advice-item-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px rgba(234, 88, 12, 0.06) !important;
                }
                .advice-item-card.expanded:hover {
                    transform: none;
                }
                @media (max-width: 900px) {
                    .finance-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .finance-modal-sheet {
                        border-radius: 28px 28px 0 0;
                        max-height: 85vh;
                        animation: slideUpV2 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }
                @media (max-width: 600px) {
                    .stats-card-container {
                        flex-direction: row !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        padding: 16px !important;
                        gap: 12px !important;
                    }
                    .stats-card-container h2 {
                        font-size: 1.5rem !important;
                    }
                    .stats-add-btn {
                        padding: 8px 12px !important;
                        font-size: 0.78rem !important;
                        border-radius: 12px !important;
                    }
                    .list-header-container {
                        flex-direction: row !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                    }
                    .stats-filter-container {
                        width: auto !important;
                        gap: 0 !important;
                    }
                    .stats-filter-label {
                        display: none !important;
                    }
                    .stats-filter-select {
                        padding: 8px 10px !important;
                        font-size: 0.78rem !important;
                        border-radius: 12px !important;
                    }
                }
                @keyframes slideUpV2 {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
