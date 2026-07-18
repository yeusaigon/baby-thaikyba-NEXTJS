import React from 'react';
import { 
    IoSearchOutline, IoCheckmarkCircleOutline, IoWarningOutline, IoCloseCircleOutline, IoRestaurantOutline 
} from 'react-icons/io5';

interface FoodItem {
    name: string;
    cat: string;
    status: string;
    desc: string;
    calories?: number;
}

interface FoodLookupProps {
    searchKeyword: string;
    setSearchKeyword: (val: string) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
    filteredFood: FoodItem[];
}

export const FoodLookup: React.FC<FoodLookupProps> = ({
    searchKeyword,
    setSearchKeyword,
    filterCategory,
    setFilterCategory,
    filteredFood
}) => {
    const getStatusConfig = (status: string) => {
        if (status === 'safe') return { color: '#10b981', bg: '#ecfdf5', border: 'rgba(16, 185, 129, 0.15)', icon: <IoCheckmarkCircleOutline />, text: 'Nên dùng' };
        if (status === 'limit') return { color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245, 158, 11, 0.15)', icon: <IoWarningOutline />, text: 'Hạn chế' };
        return { color: '#ef4444', bg: '#fef2f2', border: 'rgba(239, 68, 68, 0.15)', icon: <IoCloseCircleOutline />, text: 'Nên tránh' };
    };

    const categories = [
        { id: 'rau', label: '🥬 Rau củ' },
        { id: 'qua', label: '🍎 Trái cây' },
        { id: 'thit', label: '🥩 Đạm & Sữa' },
        { id: 'tinhbot', label: '🍚 Tinh bột' },
        { id: 'thuyhai', label: '🦀 Thủy hải sản' },
        { id: 'khac', label: '☕ Loại khác' }
    ];

    return (
        <div id="view-lookup" className="fade-in">
            <div className="search-box">
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <IoSearchOutline className="search-icon-abs" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm thực phẩm (Ví dụ: bơ, đu đủ, cá hồi, trà sữa, pate...)" 
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="search-inp" 
                    />
                </div>
                
                <div className="filter-row" style={{ marginTop: 0 }}>
                    {categories.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => { setFilterCategory(c.id); setSearchKeyword(''); }}
                            className={`filter-chip ${filterCategory === c.id && searchKeyword.trim() === '' ? 'active' : ''}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="food-grid">
                {filteredFood.length === 0 ? (
                    <div className="card text-center" style={{ gridColumn: '1 / -1', padding: '60px 20px', background: 'rgba(255,255,255,0.7)' }}>
                        <IoRestaurantOutline style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '15px' }} />
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0 0 5px 0' }}>Không tìm thấy thực phẩm này</h3>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', margin: 0 }}>Mẹ hãy thử tìm kiếm bằng từ khóa khác nhé.</p>
                    </div>
                ) : (
                    filteredFood.map((item, idx) => {
                        const cfg = getStatusConfig(item.status);
                        return (
                            <div className="food-card" key={idx} style={{ borderLeft: `5px solid ${cfg.color}`, borderTopColor: cfg.border, borderRightColor: cfg.border, borderBottomColor: cfg.border }}>
                                <div className="food-card-header">
                                    <span className="food-card-name">
                                        {item.name}
                                        {item.calories && (
                                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px', fontWeight: 600 }}>
                                                ({item.calories} kcal)
                                            </span>
                                        )}
                                    </span>
                                    <span className="food-card-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                        {cfg.icon} <span>{cfg.text}</span>
                                    </span>
                                </div>
                                <p className="food-card-desc">{item.desc}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
