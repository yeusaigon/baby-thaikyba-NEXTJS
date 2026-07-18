import React from 'react';
import { IoShieldCheckmarkOutline } from 'react-icons/io5';

interface TrimesterAdviceCardProps {
    profile: any;
    calculatedTrimester: number | null;
    selectedTrimester: 1 | 2 | 3;
    setSelectedTrimester: (t: 1 | 2 | 3) => void;
}

export const TrimesterAdviceCard: React.FC<TrimesterAdviceCardProps> = ({
    profile,
    calculatedTrimester,
    selectedTrimester,
    setSelectedTrimester
}) => {
    // Trimester advice dataset
    const trimesterAdviceData = {
        1: {
            title: "Tam Cá Nguyệt 1",
            weekRange: "Tuần 1 - 13",
            subtitle: "Giai đoạn hình thành cơ quan",
            calDiff: "+50 kcal/ngày",
            nutrients: [
                { name: "Axit Folic", source: "Rau xanh, bơ, ngũ cốc", desc: "Phòng dị tật ống thần kinh." },
                { name: "Sắt & B12", source: "Thịt bò nạc, lòng đỏ trứng", desc: "Tăng tạo máu nuôi thai." },
                { name: "Vitamin B6", source: "Chuối, hạt điều, hạt óc chó", desc: "Hỗ trợ giảm nghén hiệu quả." }
            ],
            avoid: "Đồ sống (sashimi, trứng lòng đào), sữa chưa tiệt trùng.",
            tips: "Nên chia nhỏ bữa ăn thành 5-6 lần/ngày để tránh đầy bụng."
        },
        2: {
            title: "Tam Cá Nguyệt 2",
            weekRange: "Tuần 14 - 27",
            subtitle: "Phát triển xương & não bộ bé",
            calDiff: "+300-350 kcal/ngày",
            nutrients: [
                { name: "Canxi & Vit D", source: "Sữa tiệt trùng, sữa chua, tôm", desc: "Phát triển hệ xương răng của bé." },
                { name: "DHA & Omega-3", source: "Cá hồi, hạt óc chó, hạt chia", desc: "Cấu tạo võng mạc và não bộ." },
                { name: "Kẽm & Magie", source: "Thịt bò, hạt bí, các loại đậu", desc: "Hoàn thiện miễn dịch thai nhi." }
            ],
            avoid: "Cá săn mồi lớn có thủy ngân cao (cá ngừ đại dương, cá kiếm).",
            tips: "Bổ sung sữa tươi hoặc sữa bầu mỗi ngày. Vận động nhẹ nhàng."
        },
        3: {
            title: "Tam Cá Nguyệt 3",
            weekRange: "Tuần 28 - 42",
            subtitle: "Bé tăng tốc tích lũy cân nặng",
            calDiff: "+450 kcal/ngày",
            nutrients: [
                { name: "Chất xơ & Nước", source: "Khoai lang luộc, đu đủ, dừa xiêm", desc: "Tránh táo bón & duy trì nước ối." },
                { name: "Vitamin C", source: "Cam, bưởi, ổi tươi, dâu tây", desc: "Tăng đề kháng & hấp thụ sắt." },
                { name: "Đạm (Protein)", source: "Thịt nạc heo/bò, ức gà, trứng", desc: "Phát triển khối cơ bắp của bé." }
            ],
            avoid: "Ăn quá mặn (gây phù nề) và đồ quá ngọt (tiểu đường thai kỳ).",
            tips: "Dạ dày bị chèn ép, nên nhai kỹ. Tránh uống nước nhiều sát giờ ngủ."
        }
    };

    const currentTrimesterAdvice = trimesterAdviceData[selectedTrimester];

    return (
        <div className="card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IoShieldCheckmarkOutline style={{ color: '#db2777' }} /> Lời khuyên theo giai đoạn
                </span>
            </div>

            {/* Tab Headers */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '3px', gap: '2px' }}>
                {([1, 2, 3] as const).map(t => {
                    const isActive = selectedTrimester === t;
                    const isUserStage = calculatedTrimester === t;
                    return (
                        <button
                            key={t}
                            onClick={() => setSelectedTrimester(t)}
                            style={{
                                flex: 1,
                                padding: '6px 4px',
                                borderRadius: '10px',
                                border: 'none',
                                background: isActive ? 'white' : 'transparent',
                                color: isActive ? '#db2777' : '#64748b',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.04)' : 'none'
                            }}
                        >
                            <span>TCN {t}</span>
                            {isUserStage && (
                                <span style={{ fontSize: '0.55rem', color: '#10b981', fontWeight: 800, marginTop: '1px' }}>Bạn 👩‍⚕️</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 800 }}>
                        {currentTrimesterAdvice.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                        {currentTrimesterAdvice.weekRange} • {currentTrimesterAdvice.subtitle}
                    </p>
                    <div style={{ display: 'inline-block', background: '#fdf2f8', color: '#db2777', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, marginTop: '6px' }}>
                        Nạp thêm: {currentTrimesterAdvice.calDiff}
                    </div>
                </div>

                {/* Nutrients List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>Dưỡng chất thiết yếu:</span>
                    {currentTrimesterAdvice.nutrients.map((n, idx) => (
                        <div key={idx} style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '6px 8px', gap: '2px' }}>
                            <span style={{ color: '#db2777', fontWeight: 700 }}>{n.name} <span style={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 500 }}>({n.source})</span></span>
                            <span style={{ color: 'var(--text-sub)', fontSize: '0.68rem', lineHeight: 1.3 }}>{n.desc}</span>
                        </div>
                    ))}
                </div>

                {/* Tips & Avoids */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.7rem', lineHeight: 1.45 }}>
                    <div>
                        <strong style={{ color: '#b45309' }}>💡 Mẹo nhỏ: </strong>
                        <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>{currentTrimesterAdvice.tips}</span>
                    </div>
                    <div style={{ marginTop: '2px' }}>
                        <strong style={{ color: '#b91c1c' }}>🚫 Tránh dùng: </strong>
                        <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>{currentTrimesterAdvice.avoid}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
