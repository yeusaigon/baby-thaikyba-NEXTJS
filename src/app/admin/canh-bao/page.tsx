'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
    IoWarningOutline, IoCallOutline, IoShieldHalfOutline, IoHeartOutline, 
    IoInformationCircleOutline, IoSaveOutline, IoAlertCircleOutline,
    IoCheckmarkCircleOutline, IoLocationOutline, IoPersonOutline
} from 'react-icons/io5';
import Link from 'next/link';

interface EmergencyContacts {
    hospitalName?: string;
    hospitalPhone?: string;
    doctorName?: string;
    doctorPhone?: string;
    husbandPhone?: string;
}

export default function RedFlagsWarningPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Form states
    const [hospitalName, setHospitalName] = useState('');
    const [hospitalPhone, setHospitalPhone] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');
    const [husbandPhone, setHusbandPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Accordion group selections
    const [activeSection, setActiveSection] = useState<'danger' | 'caution' | 'normal'>('danger');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const unsubDb = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        const contacts: EmergencyContacts = data.emergencyContacts || {};
                        setHospitalName(contacts.hospitalName || '');
                        setHospitalPhone(contacts.hospitalPhone || '');
                        setDoctorName(contacts.doctorName || '');
                        setDoctorPhone(contacts.doctorPhone || '');
                        setHusbandPhone(contacts.husbandPhone || data.phoneHusband || '');
                    }
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

    const handleSaveContacts = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                emergencyContacts: {
                    hospitalName,
                    hospitalPhone,
                    doctorName,
                    doctorPhone,
                    husbandPhone
                }
            }, { merge: true });
            alert("Đã lưu danh bạ khẩn cấp thành công!");
        } catch (err: any) {
            alert("Lỗi khi lưu danh bạ: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px', paddingBottom: '100px' }}>
            
            {/* Back to dashboard */}
            <div>
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
                    ← Trở lại Dashboard
                </Link>
            </div>

            {/* Red Alert Header */}
            <div className="warning-header-banner" style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', padding: '24px', borderRadius: '28px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px -10px rgba(220, 38, 38, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex', animation: 'heart-pulse 2s infinite' }}>
                        <IoWarningOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Dấu Hiệu Cảnh Báo Nguy Hiểm</h2>
                        <p style={{ opacity: 0.95, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.45, fontWeight: 500 }}>Những dấu hiệu bất thường cần đặc biệt ghi nhớ để bảo vệ mẹ và bé kịp thời.</p>
                    </div>
                </div>
            </div>

            {/* Main view container split */}
            <div className="warning-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. WARNING CARD GROUPS */}
                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                    
                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '6px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                        <button 
                            onClick={() => setActiveSection('danger')}
                            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', background: activeSection === 'danger' ? '#fee2e2' : 'transparent', color: activeSection === 'danger' ? '#b91c1c' : '#64748b', transition: 'all 0.2s' }}
                        >
                            🚨 Cấp cứu ngay
                        </button>
                        <button 
                            onClick={() => setActiveSection('caution')}
                            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', background: activeSection === 'caution' ? '#ffedd5' : 'transparent', color: activeSection === 'caution' ? '#c2410c' : '#64748b', transition: 'all 0.2s' }}
                        >
                            ⚠️ Khám sớm
                        </button>
                        <button 
                            onClick={() => setActiveSection('normal')}
                            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', background: activeSection === 'normal' ? '#ccfbf1' : 'transparent', color: activeSection === 'normal' ? '#0f766e' : '#64748b', transition: 'all 0.2s' }}
                        >
                            ℹ️ Triệu chứng thường
                        </button>
                    </div>

                    {/* Content switcher rendering */}
                    {activeSection === 'danger' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s' }}>
                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecdd3', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoAlertCircleOutline size={18} />
                                <span>KHI GẶP CÁC DẤU HIỆU DƯỚI ĐÂY MẸ BẦU CẦN ĐẾN BỆNH VIỆN GẦN NHẤT NGAY LẬP TỨC!</span>
                            </div>

                            <div className="warning-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #ef4444' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>🩸 Ra máu âm đạo (Bất kỳ lượng nào)</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Là dấu hiệu động thai, sẩy thai, rau tiền đạo, rau bong non, hoặc chuyển dạ sớm. Tuyệt đối không nằm theo dõi tại nhà.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #ef4444' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>💧 Ra nước âm đạo (Rỉ hoặc ồ ạt)</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Biểu hiện của rỉ ối hoặc vỡ ối sớm. Có thể gây nhiễm trùng ối cực kỳ nguy hiểm cho thai nhi nếu không được xử lý y khoa vô trùng kịp thời.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #ef4444' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>⚡ Cơn đau bụng dưới dữ dội, liên tục</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Cơn co tử cung dồn dập, đau không giảm ngay cả khi nằm nghỉ. Cảnh báo động thai lớn hoặc dấu hiệu vỡ tử cung, bong rau cấp tính.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #ef4444' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>🤒 Sốt cao kèm rét run (&gt; 38.5°C)</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Cảnh báo nhiễm trùng cấp tính ở tử cung, nước ối hoặc đường hô hấp. Sốt cao kéo dài có thể kích thích co bóp tử cung gây sẩy/sinh non.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'caution' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s' }}>
                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#fff7ed', border: '1px solid #ffedd5', fontSize: '0.8rem', color: '#c2410c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoInformationCircleOutline size={18} />
                                <span>CẦN SẮP XẾP ĐI KHÁM BÁC SĨ SẢN KHOA NGAY TRONG NGÀY ĐỂ ĐƯỢC KIỂM TRA</span>
                            </div>

                            <div className="warning-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #f97316' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#c2410c' }}>👶 Thai cử động ít (Dưới 4 lần máy/giờ)</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Sau tuần thai 28, nếu đã đếm theo hướng dẫn mà em bé cử động quá thưa thớt, mẹ nên đến khám ngay để chạy đo tim thai (NST) kiểm tra oxy máu.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #f97316' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#c2410c' }}>🤯 Đau đầu dai dẳng, nhìn mờ, hoa mắt</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Dấu hiệu đặc trưng kèm cao huyết áp của chứng Tiền Sản Giật. Cần đo huyết áp và xét nghiệm protein niệu gấp để phòng ngừa co giật sản giật.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #f97316' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#c2410c' }}>🦶 Phù tay, chân, mặt đột ngột xuất hiện</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Phù chân sinh lý do chèn ép mạch máu thường giảm khi gác chân cao. Nếu phù cả mặt, ngón tay sưng to đột ngột, gác chân không giảm là tín hiệu bệnh lý.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'normal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s' }}>
                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#e6fffa', border: '1px solid #b2f5ea', fontSize: '0.8rem', color: '#0f766e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoCheckmarkCircleOutline size={18} />
                                <span>CÁC TRIỆU CHỨNG THƯỜNG GẶP KHÔNG QUÁ NGUY HIỂM, MẸ BẦU KHÔNG CẦN QUÁ LO LẮNG</span>
                            </div>

                            <div className="warning-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #0d9488' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#0f766e' }}>🤰 Cơn gò giả Braxton Hicks thưa thớt</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Bụng cứng lên cứng xuống nhẹ nhàng không đau đớn, xuất hiện vài lần trong ngày và tự hết khi thay đổi tư thế nghỉ ngơi.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #0d9488' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#0f766e' }}>⚡ Nhói bụng dưới nhẹ khi đứng lên ngồi xuống</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Cơn nhói ở nếp bẹn do giãn hệ thống dây chằng nâng đỡ tử cung. Mẹ nên chuyển tư thế chậm rãi, tránh vặn mình đột ngột.</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#fafafa', borderLeft: '4px solid #0d9488' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#0f766e' }}>🔥 Ợ nóng, khó tiêu, tê bì tay chân nhẹ</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>Xảy ra do nội tiết tố thai kỳ làm giãn cơ trơn dạ dày và thai lớn chèn ép. Mẹ nên chia nhỏ bữa ăn và gác chân cao khi nằm ngủ.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. EMERGENCY DIAL DIRECTORY CARD */}
                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoCallOutline size={22} color="#b91c1c" />
                        Danh bạ liên hệ khẩn cấp
                    </h3>

                    {/* Interactive Call Buttons Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
                        {/* Husband Call button */}
                        {husbandPhone ? (
                            <a href={`tel:${husbandPhone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3', textDecoration: 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 800 }}>NGƯỜI THÂN / CHỒNG</div>
                                    <strong style={{ fontSize: '1.05rem', color: '#9f1239', display: 'block', marginTop: '2px' }}>{profile.nameHusband || 'Gọi người thân'}</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600 }}>📞 {husbandPhone}</span>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e11d48', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(225,29,72,0.2)' }}>
                                    <IoCallOutline size={18} />
                                </div>
                            </a>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '18px', background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, justifyContent: 'center' }}>
                                Chưa cấu hình số điện thoại của chồng. Hãy nhập ở mẫu bên dưới.
                            </div>
                        )}

                        {/* Hospital Call button */}
                        {hospitalPhone ? (
                            <a href={`tel:${hospitalPhone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', textDecoration: 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 800 }}>BỆNH VIỆN / CẤP CỨU</div>
                                    <strong style={{ fontSize: '1.05rem', color: '#14532d', display: 'block', marginTop: '2px' }}>{hospitalName || 'Bệnh viện sản khoa'}</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>📞 {hospitalPhone}</span>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(22,163,74,0.2)' }}>
                                    <IoCallOutline size={18} />
                                </div>
                            </a>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '18px', background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, justifyContent: 'center' }}>
                                Chưa cấu hình số điện thoại bệnh viện cứu hộ. Nhập bên dưới.
                            </div>
                        )}

                        {/* Doctor Call button */}
                        {doctorPhone ? (
                            <a href={`tel:${doctorPhone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', border: '1px solid #99f6e4', textDecoration: 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 800 }}>BÁC SĨ CÁ NHÂN</div>
                                    <strong style={{ fontSize: '1.05rem', color: '#115e59', display: 'block', marginTop: '2px' }}>{doctorName || 'Bác sĩ sản khoa'}</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#134e4a', fontWeight: 600 }}>📞 {doctorPhone}</span>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d9488', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(13,148,136,0.2)' }}>
                                    <IoCallOutline size={18} />
                                </div>
                            </a>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '18px', background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, justifyContent: 'center' }}>
                                Chưa cấu hình số điện thoại của bác sĩ riêng. Nhập bên dưới.
                            </div>
                        )}

                        {/* National Ambulance Call button */}
                        <a href="tel:115" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fecdd3', textDecoration: 'none' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 800 }}>CẤP CỨU QUỐC GIA</div>
                                <strong style={{ fontSize: '1.05rem', color: '#b91c1c', display: 'block', marginTop: '2px' }}>Đường dây nóng 115</strong>
                                <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>📞 115 (Mọi lúc mọi nơi)</span>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(239,68,68,0.2)' }}>
                                <IoCallOutline size={18} />
                            </div>
                        </a>
                    </div>

                    {/* Configure Form inputs */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', color: '#475569', fontWeight: 800 }}>
                            Cấu hình danh bạ khẩn cấp
                        </h4>
                        
                        <form onSubmit={handleSaveContacts} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Số điện thoại của Chồng</span>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="tel" 
                                        placeholder="Ví dụ: 0909123456" 
                                        value={husbandPhone}
                                        onChange={(e) => setHusbandPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                                    />
                                    <IoPersonOutline size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Tên bệnh viện dự sinh</span>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Ví dụ: BV Từ Dũ" 
                                            value={hospitalName}
                                            onChange={(e) => setHospitalName(e.target.value)}
                                            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                                        />
                                        <IoLocationOutline size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Hotline bệnh viện cấp cứu</span>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="tel" 
                                            placeholder="Ví dụ: 0285432100" 
                                            value={hospitalPhone}
                                            onChange={(e) => setHospitalPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                                        />
                                        <IoCallOutline size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Tên bác sĩ khám sản</span>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Ví dụ: BS. Nguyễn Văn A" 
                                            value={doctorName}
                                            onChange={(e) => setDoctorName(e.target.value)}
                                            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                                        />
                                        <IoPersonOutline size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Số điện thoại Bác sĩ</span>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="tel" 
                                            placeholder="Ví dụ: 0903123456" 
                                            value={doctorPhone}
                                            onChange={(e) => setDoctorPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                                        />
                                        <IoCallOutline size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSaving}
                                style={{
                                    background: '#334155', color: 'white', border: 'none',
                                    padding: '12px', borderRadius: '12px', fontWeight: 700,
                                    fontSize: '0.82rem', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '6px', cursor: 'pointer',
                                    marginTop: '8px', transition: 'all 0.2s'
                                }}
                            >
                                <IoSaveOutline size={16} />
                                {isSaving ? "Đang lưu..." : "Lưu danh bạ khẩn cấp"}
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            <style jsx>{`
                @keyframes heart-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.06); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
