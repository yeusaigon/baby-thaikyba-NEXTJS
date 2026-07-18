import React from 'react';
import { 
    IoCalendarOutline, IoCafeOutline, IoSadOutline, IoLeafOutline, IoPulseOutline, IoFlame 
} from 'react-icons/io5';

interface MenuItem {
    day: string;
    title: string;
    tag: string;
    tagColor: string;
    tagBg: string;
    meals: {
        time: string;
        emoji: string;
        color: string;
        dish: string;
        note: string;
    }[];
}

interface WeeklyMenuGuideProps {
    selectedDay: string;
    setSelectedDay: (day: string) => void;
    weeklyMenu: MenuItem[];
}

export const WeeklyMenuGuide: React.FC<WeeklyMenuGuideProps> = ({
    selectedDay,
    setSelectedDay,
    weeklyMenu
}) => {
    const currentMenu = weeklyMenu.find(m => m.day === selectedDay) || weeklyMenu[0];

    return (
        <div id="view-guide" className="fade-in">
            <div className="guide-layout">
                <div className="guide-header-panel">
                    <h3 className="section-title" style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoCalendarOutline /> Thực đơn theo ngày
                    </h3>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', margin: '0 0 15px 0', fontWeight: 500, lineHeight: 1.4 }}>
                        Lên kế hoạch ăn uống đầy đủ dưỡng chất mỗi ngày giúp thai nhi phát triển vượt trội.
                    </p>
                    
                    <div className="day-selector-ribbon">
                        {weeklyMenu.map(m => (
                            <button 
                                key={m.day} 
                                onClick={() => setSelectedDay(m.day)}
                                className={`day-selector-btn ${selectedDay === m.day ? 'active' : ''}`}
                            >
                                {m.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="menu-detail-panel">
                    <div className="menu-detail-header card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 900 }}>{currentMenu.title}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 500 }}>Thực đơn dinh dưỡng gợi ý cho mẹ bầu</p>
                        </div>
                        <span className="menu-header-tag" style={{ 
                            color: currentMenu.tagColor, 
                            backgroundColor: currentMenu.tagBg,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 800
                        }}>
                            {currentMenu.tag}
                        </span>
                    </div>

                    <div className="menu-meals-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentMenu.meals.map((meal, index) => (
                            <div className="menu-meal-card card" key={index} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{meal.emoji}</span>
                                    <span style={{ fontWeight: 800, color: meal.color, fontSize: '0.9rem' }}>{meal.time}</span>
                                </div>
                                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 800, lineHeight: 1.45 }}>
                                    {meal.dish}
                                </div>
                                {meal.note && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', borderLeft: `3px solid ${meal.color}`, fontStyle: 'italic', lineHeight: 1.45 }}>
                                        {meal.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '30px', fontSize: '1.05rem', fontWeight: 800 }}><IoCafeOutline /> Gợi ý các bữa phụ dưỡng chất (9h & 15h)</h3>
            <div className="snack-card card" style={{ padding: '20px', borderRadius: '20px', background: 'white' }}>
                <div className="snack-grid">
                    <div className="snack-item">
                        <span className="snack-bullet" style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.85rem' }}>🌅 Bữa phụ sáng (9h):</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                            Sữa tươi tiệt trùng không đường, sữa chua Hy Lạp mix hạt (óc chó, macca, hạt chia), khoai lang chín.
                        </p>
                    </div>
                    <div style={{ width: '1px', background: '#f1f5f9' }} className="snack-divider-desktop"></div>
                    <div className="snack-item">
                        <span className="snack-bullet" style={{ fontWeight: 800, color: '#db2777', fontSize: '0.85rem' }}>🌆 Bữa phụ chiều (15h):</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                            Trái cây tươi mát ít ngọt (ổi chín bỏ ruột, bưởi hồng, lê, bơ dầm nhạt), bánh quy nguyên cám, nước yến chưng đường phèn.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '30px', fontSize: '1.05rem', fontWeight: 800 }}><IoPulseOutline /> Dinh dưỡng đẩy lùi khó chịu thai kỳ</h3>
            <div className="symptom-grid" style={{ gap: '16px' }}>
                <div className="symptom-card card" style={{ padding: '16px', borderRadius: '18px', background: 'white' }}>
                    <div className="sym-title" style={{ color: '#be123c', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoSadOutline /> Giảm Ốm Nghén
                    </div>
                    <p className="sym-solution" style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                        Ngậm lát gừng ấm, trà hoa cúc nhẹ, ăn bánh quy khô hoặc lát bánh mì nướng vào sáng sớm. Chia nhỏ bữa ăn làm 5-6 lần, tránh đồ quá béo ngậy.
                    </p>
                </div>
                <div className="symptom-card card" style={{ padding: '16px', borderRadius: '18px', background: 'white' }}>
                    <div className="sym-title" style={{ color: '#047857', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoLeafOutline /> Tránh Táo Bón
                    </div>
                    <p className="sym-solution" style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                        Tăng cường khoai lang luộc, thanh long đỏ, rau đay, rau mồng tơi, hạt chia ngâm nở. Uống tối thiểu 2 đến 2.5 lít nước ấm trải dài cả ngày.
                    </p>
                </div>
                <div className="symptom-card card" style={{ padding: '16px', borderRadius: '18px', background: 'white' }}>
                    <div className="sym-title" style={{ color: '#1e3a8a', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoPulseOutline /> Chặn Chuột Rút
                    </div>
                    <p className="sym-solution" style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                        Bổ sung canxi tự nhiên từ sữa tươi không đường, phô mai pasteur, và kali từ quả chuối chín, quả bơ, trứng gà luộc chín hoàn toàn.
                    </p>
                </div>
                <div className="symptom-card card" style={{ padding: '16px', borderRadius: '18px', background: 'white' }}>
                    <div className="sym-title" style={{ color: '#b45309', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoFlame /> Giảm Ợ Nóng
                    </div>
                    <p className="sym-solution" style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                        Ăn chậm nhai kỹ, không ăn quá no một lúc. Tuyệt đối không nằm ngay sau khi ăn xong ít nhất 1 tiếng. Tránh các thực phẩm chua cay, nhiều dầu mỡ.
                    </p>
                </div>
            </div>
        </div>
    );
};
