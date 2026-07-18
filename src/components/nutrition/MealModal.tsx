import React from 'react';
import { IoCloseOutline } from 'react-icons/io5';

interface MealModalProps {
    showModal: boolean;
    mealId: string;
    mealType: string;
    mealContent: string;
    mealDatetime: string;
    mealCalories: string;
    detectedFoods: { name: string; calories: number }[];
    isSaving: boolean;
    onClose: () => void;
    setMealType: (type: string) => void;
    setMealContent: (content: string) => void;
    setMealDatetime: (datetime: string) => void;
    setMealCalories: (calories: string) => void;
    handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const MealModal: React.FC<MealModalProps> = ({
    showModal,
    mealId,
    mealType,
    mealContent,
    mealDatetime,
    mealCalories,
    detectedFoods,
    isSaving,
    onClose,
    setMealType,
    setMealContent,
    setMealDatetime,
    setMealCalories,
    handleContentChange,
    onSubmit
}) => {
    if (!showModal) return null;

    const mealNames: any = { 'sang': 'Bữa Sáng', 'trua': 'Bữa Trưa', 'toi': 'Bữa Tối', 'phu': 'Bữa Phụ' };

    return (
        <div id="meal-modal" className="nutrition-modal-overlay" onClick={onClose}>
            <div className="nutrition-modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {mealId ? 'Chỉnh sửa bữa ăn' : 'Ghi chép bữa ăn mới'}
                    </span>
                    <button 
                        type="button"
                        onClick={onClose}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#64748b',
                            padding: '6px',
                            borderRadius: '50%',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>
                
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                    <div className="input-group">
                        <label className="text-label">Thời gian dùng bữa</label>
                        <input 
                            type="datetime-local" 
                            value={mealDatetime} 
                            onChange={(e) => setMealDatetime(e.target.value)} 
                            className="form-input" 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label className="text-label">Phân loại bữa ăn</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['sang', 'trua', 'toi', 'phu'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setMealType(t)}
                                    className={`meal-type-badge ${mealType === t ? 'active' : ''}`}
                                    style={{
                                        flex: 1,
                                        padding: '10px 0',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        background: mealType === t ? 'var(--primary)' : 'white',
                                        color: mealType === t ? 'white' : 'var(--text-sub)',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {mealNames[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="text-label">Hôm nay mẹ đã ăn gì?</label>
                        <textarea
                            value={mealContent}
                            onChange={handleContentChange}
                            placeholder="Ví dụ: Một bát cơm trắng, một bát canh cua rau đay và thịt bò xào súp lơ..."
                            className="form-input"
                            style={{ minHeight: '90px', resize: 'vertical', lineHeight: 1.5 }}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="text-label">Kalo tiêu thụ (Ước tính tự động)</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="number" 
                                value={mealCalories} 
                                onChange={(e) => setMealCalories(e.target.value)} 
                                className="form-input" 
                                style={{ color: '#db2777', fontWeight: 700, paddingRight: '50px' }}
                                placeholder="Kalo ước tính..." 
                            />
                            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>kcal</span>
                        </div>
                    </div>

                    {detectedFoods.length > 0 && (
                        <div style={{ 
                            padding: '12px', 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '14px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px' 
                        }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Món ăn nhận diện được trong bữa:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {detectedFoods.map((food, idx) => (
                                    <span key={idx} style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#db2777', 
                                        background: 'white', 
                                        border: '1px solid #fbcfe8', 
                                        padding: '4px 10px', 
                                        borderRadius: '8px', 
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                    }}>
                                        {food.name}: <strong>+{food.calories} cal</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="save-meal-submit-btn" 
                        disabled={isSaving}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '16px',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(219, 39, 119, 0.2)'
                        }}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu nhật ký'}
                    </button>
                </form>
            </div>
        </div>
    );
};
