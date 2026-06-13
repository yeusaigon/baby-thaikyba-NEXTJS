'use client';
import { useState } from 'react';
import { 
    IoShieldCheckmarkOutline, IoMoonOutline, IoHeartHalfOutline, IoRestaurantOutline, 
    IoFishOutline, IoWineOutline, IoLeafOutline, IoFastFoodOutline, IoBarbellOutline, 
    IoThermometerOutline, IoAccessibilityOutline, IoBodyOutline, IoWarningOutline, 
    IoColorPaletteOutline, IoColorWandOutline, IoSearchOutline, IoCameraOutline, 
    IoBagHandleOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline 
} from 'react-icons/io5';

interface PrecautionItem {
    category: 'folk' | 'food' | 'activity' | 'beauty';
    title: string;
    status: 'ban' | 'limit' | 'safe';
    statusText: string;
    description?: string;
    folkBelief?: string;
    scienceExplain?: string;
    icon: any;
    color: string;
}

const PRECAUTIONS_DATA: PrecautionItem[] = [
    // 1. Dân gian & Tâm linh
    {
        category: 'folk',
        title: 'Đi đám ma / Tang lễ',
        status: 'limit',
        statusText: 'Hạn chế',
        folkBelief: 'Người xưa cho rằng bà bầu đi đám ma dễ bị nhiễm "hơi lạnh", vong theo làm động thai.',
        scienceExplain: 'Môi trường tang lễ u uất ảnh hưởng tâm lý của mẹ. "Hơi lạnh" thực chất là sự tích tụ vi khuẩn, mầm bệnh từ thi thể hoặc khu vực kém thông thoáng, có thể lây bệnh cho mẹ bầu có đề kháng yếu.',
        icon: IoMoonOutline,
        color: '#64748b'
    },
    {
        category: 'folk',
        title: 'Đi đám cưới / Hỷ sự',
        status: 'safe',
        statusText: 'Đi được',
        folkBelief: 'Quan niệm cũ sợ mẹ bầu đi đám cưới sẽ "mất duyên" của cô dâu chú rể hoặc rước xui xẻo.',
        scienceExplain: 'Hoàn toàn không có cơ sở khoa học. Đi đám cưới giúp tinh thần mẹ bầu vui vẻ hơn. Chỉ cần tránh đứng gần loa đài âm lượng quá lớn, đi lại cẩn thận tránh vấp ngã và không uống rượu bia.',
        icon: IoHeartHalfOutline,
        color: '#be123c'
    },
    {
        category: 'folk',
        title: 'Chụp ảnh khi mang thai',
        status: 'safe',
        statusText: 'An toàn',
        folkBelief: 'Sợ chụp ảnh bầu sẽ làm em bé sinh ra mất duyên, cướp đi sinh khí của con.',
        scienceExplain: 'Hoàn toàn sai lầm. Chụp ảnh lưu niệm giúp mẹ bầu lưu lại khoảnh khắc hạnh phúc thai kỳ, có tác động tích cực đến tinh thần. Nên chọn studio thoáng mát, tránh tạo dáng quá mệt mỏi.',
        icon: IoCameraOutline,
        color: '#0284c7'
    },
    {
        category: 'folk',
        title: 'Sắm đồ sơ sinh quá sớm (Trước 7 tháng)',
        status: 'limit',
        statusText: 'Nên sắm từ tuần 30',
        folkBelief: 'Mẹo dân gian kiêng mua đồ sơ sinh sớm vì sợ bé "đòi ra ngoài" sớm (sinh non).',
        scienceExplain: 'Thực chất chỉ vì 3 tháng đầu thai kỳ chưa thực sự ổn định. Sắm đồ từ tuần 30 trở đi là lý tưởng nhất, giúp bố mẹ chủ động chuẩn bị giặt giũ phơi phóng tươm tất trước khi sinh.',
        icon: IoBagHandleOutline,
        color: '#f59e0b'
    },

    // 2. Ăn uống
    {
        category: 'food',
        title: 'Thực phẩm tươi sống, tái chín',
        status: 'ban',
        statusText: 'Tuyệt đối kiêng',
        description: 'Sushi, thịt tái, trứng chần, gỏi cá, nem chua... chứa nhiều loại ký sinh trùng và vi khuẩn nguy hiểm (Listeria, Salmonella, Toxoplasma) có thể gây ngộ độc cấp tính, sảy thai hoặc thai chết lưu.',
        icon: IoRestaurantOutline,
        color: '#ef4444'
    },
    {
        category: 'food',
        title: 'Cá biển lớn chứa hàm lượng thủy ngân cao',
        status: 'limit',
        statusText: 'Hạn chế ăn',
        description: 'Cá thu vua, cá kiếm, cá kình, cá ngừ mắt to... là các động vật ăn mồi tích tụ lượng lớn thủy ngân hữu cơ. Thủy ngân này có thể xuyên qua nhau thai gây tổn thương vĩnh viễn cho não bộ thai nhi.',
        icon: IoFishOutline,
        color: '#d97706'
    },
    {
        category: 'food',
        title: 'Rượu bia & Đồ uống cồn',
        status: 'ban',
        statusText: 'Tuyệt đối kiêng',
        description: 'Chất cồn đi trực tiếp vào máu thai nhi qua nhau thai, gây ra Hội chứng suy thai do cồn (FAS), chậm phát triển trí tuệ, dị tật tim và các cơ quan nội tạng của bé.',
        icon: IoWineOutline,
        color: '#ef4444'
    },
    {
        category: 'food',
        title: 'Rau ngót, ngải cứu, đu đủ xanh',
        status: 'ban',
        statusText: 'Kiêng 3 tháng đầu',
        description: 'Đu đủ xanh chứa nhiều mủ nhựa (latex) gây co thắt tử cung mạnh. Rau ngót chứa Papaverin kích thích cơ trơn tử cung co bóp, tăng nguy cơ dọa sảy thai trong giai đoạn đầu thai kỳ.',
        icon: IoLeafOutline,
        color: '#ef4444'
    },
    {
        category: 'food',
        title: 'Cà phê & Đồ uống chứa Caffeine',
        status: 'limit',
        statusText: 'Dưới 200mg/ngày',
        description: 'Caffeine hàm lượng cao làm co mạch máu tử cung, giảm lượng máu nuôi thai nhi. Mẹ chỉ nên uống tối đa 1 tách cà phê loãng mỗi ngày (tương đương dưới 200mg caffeine).',
        icon: IoFastFoodOutline,
        color: '#d97706'
    },

    // 3. Vận động
    {
        category: 'activity',
        title: 'Mang vác vật nặng & Leo trèo cao',
        status: 'ban',
        statusText: 'Tuyệt đối tránh',
        description: 'Việc mang vác nặng hay cố sức rướn cao gây tăng áp lực đột ngột lên cơ bụng và khớp chậu dưới. Trọng tâm cơ thể thay đổi khi mang thai cũng làm mẹ bầu dễ mất thăng bằng gây trượt ngã nguy hiểm.',
        icon: IoBarbellOutline,
        color: '#ef4444'
    },
    {
        category: 'activity',
        title: 'Tắm nước quá nóng / Xông hơi',
        status: 'ban',
        statusText: 'Tuyệt đối tránh',
        description: 'Nhiệt độ cơ thể mẹ tăng trên 38.5°C trong phòng xông hơi hay bồn tắm nóng có thể phá hủy quá trình phân chia tế bào thần kinh, gây dị tật ống thần kinh của bé (đặc biệt nguy hiểm 3 tháng đầu).',
        icon: IoThermometerOutline,
        color: '#ef4444'
    },
    {
        category: 'activity',
        title: 'Với tay lên cao / Cúi gập bụng',
        status: 'limit',
        statusText: 'Hạn chế rướn',
        description: 'Động tác rướn quá cao hoặc cúi gập lưng đột ngột làm căng giãn dây chằng tử cung gây đau tức bụng dưới. Khi cần lấy đồ thấp, mẹ nên ngồi xổm xuống từ từ thay vì cúi gập lưng.',
        icon: IoAccessibilityOutline,
        color: '#d97706'
    },
    {
        category: 'activity',
        title: 'Đứng hoặc ngồi một chỗ quá lâu',
        status: 'limit',
        statusText: 'Hạn chế',
        description: 'Khiến máu dồn xuống hai chân gây sưng phù nề tĩnh mạch chi dưới, dễ dẫn đến tê chuột rút và trĩ. Mẹ nên đi lại nhẹ nhàng, vươn vai vận động sau mỗi 45 phút ngồi làm việc.',
        icon: IoBodyOutline,
        color: '#d97706'
    },

    // 4. Làm đẹp
    {
        category: 'beauty',
        title: 'Sử dụng mỹ phẩm chứa Retinol (Vitamin A)',
        status: 'ban',
        statusText: 'Tuyệt đối tránh',
        description: 'Retinol và các dẫn xuất Vitamin A liều cao thường có trong kem chống lão hóa, trị mụn. Chúng có khả năng thẩm thấu mạnh qua da đi vào máu gây nguy cơ cao dị tật bẩm sinh hệ thần kinh ở thai nhi.',
        icon: IoWarningOutline,
        color: '#ef4444'
    },
    {
        category: 'beauty',
        title: 'Nhuộm tóc, uốn ép tóc hóa chất',
        status: 'limit',
        statusText: 'Kiêng 3 tháng đầu',
        description: 'Da đầu mẹ bầu hấp thụ hóa chất uốn nhuộm và hít khí amoniac độc hại bay hơi có thể gây hại cho sự phân chia tế bào của thai nhi. Từ tháng thứ 4 trở đi, mẹ có thể sử dụng các dòng thuốc nhuộm hữu cơ (organic).',
        icon: IoColorPaletteOutline,
        color: '#d97706'
    },
    {
        category: 'beauty',
        title: 'Sơn móng tay chứa hóa chất độc hại',
        status: 'limit',
        statusText: 'Nên chọn sơn hữu cơ',
        description: 'Các loại sơn móng thông thường chứa bộ ba độc hại: Dibutyl phthalate, Toluene, Formaldehyde gây hại đường hô hấp. Mẹ bầu nên chọn dòng sơn móng hữu cơ dán nhãn "3-Free" hoặc "5-Free" an toàn.',
        icon: IoColorWandOutline,
        color: '#d97706'
    }
];

export default function PrecautionsPage() {
    const [activeTab, setActiveTab] = useState<'folk' | 'food' | 'activity' | 'beauty'>('folk');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Filter precautions based on tab and search query
    const filteredItems = PRECAUTIONS_DATA.filter(item => {
        const matchesTab = item.category === activeTab;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.folkBelief && item.folkBelief.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.scienceExplain && item.scienceExplain.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return searchQuery ? matchesSearch : matchesTab;
    });

    const getStatusBadgeClass = (status: 'ban' | 'limit' | 'safe') => {
        switch (status) {
            case 'ban': return 'badge-ban';
            case 'limit': return 'badge-limit';
            case 'safe': return 'badge-safe';
            default: return '';
        }
    };

    return (
        <div className="utility-page-container fade-in">
            {/* Top header hero card */}
            <div className="hero-card-p">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Cẩm Nang Kiêng Kỵ</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '6px', fontWeight: 500 }}>Giải mã chi tiết các điều kiêng kỵ dân gian dưới góc nhìn y khoa hiện đại.</p>
                    </div>
                    <div className="hero-icon-box-p">
                        <IoShieldCheckmarkOutline />
                    </div>
                </div>
            </div>

            {/* Quick Search bar */}
            <div className="search-box-p">
                <IoSearchOutline className="search-icon-abs" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tra cứu nhanh hoạt động hoặc món ăn... (VD: sữa chua, tắm nước nóng)"
                    className="search-inp-p"
                />
            </div>

            {/* Tabs Selector (hidden if searching) */}
            {!searchQuery && (
                <div className="tab-scroll-container">
                    <button 
                        onClick={() => setActiveTab('folk')} 
                        className={`tab-toggle ${activeTab === 'folk' ? 'active' : ''}`}
                    >
                        Dân gian
                    </button>
                    <button 
                        onClick={() => setActiveTab('food')} 
                        className={`tab-toggle ${activeTab === 'food' ? 'active' : ''}`}
                    >
                        Ăn uống
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')} 
                        className={`tab-toggle ${activeTab === 'activity' ? 'active' : ''}`}
                    >
                        Vận động
                    </button>
                    <button 
                        onClick={() => setActiveTab('beauty')} 
                        className={`tab-toggle ${activeTab === 'beauty' ? 'active' : ''}`}
                    >
                        Làm đẹp
                    </button>
                </div>
            )}

            {/* CONTENT PRECAUTIONS GRID */}
            <div className="precautions-container">
                {searchQuery && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 800, paddingLeft: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Kết quả tra cứu cho "{searchQuery}": ({filteredItems.length} kết quả)
                    </div>
                )}
                
                {filteredItems.length === 0 ? (
                    <div className="card text-center no-result-card">
                        <IoAlertCircleOutline style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '12px' }} />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>Không tìm thấy kết quả</h4>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', margin: 0 }}>Vui lòng thử gõ từ khóa khác (ví dụ: cá, uốn tóc, đám ma...)</p>
                    </div>
                ) : (
                    <div className="precautions-grid">
                        {filteredItems.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                                <div key={index} className="card item-card-p" style={{ borderLeft: `5px solid ${item.color}` }}>
                                    <div className="item-header-p">
                                        <div className="icon-box-p" style={{ backgroundColor: `${item.color}12`, color: item.color }}>
                                            <IconComponent />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 className="item-title-p">{item.title}</h4>
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: 800 }}>
                                                    {item.category === 'folk' ? 'Dân gian' : item.category === 'food' ? 'Dinh dưỡng' : item.category === 'activity' ? 'Vận động' : 'Làm đẹp'}
                                                </span>
                                                <span style={{ color: '#e2e8f0', fontSize: '0.75rem' }}>•</span>
                                                <span className={`status-badge-p ${getStatusBadgeClass(item.status)}`}>
                                                    {item.statusText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="item-desc-p">
                                            {item.description}
                                        </p>
                                    )}

                                    {item.category === 'folk' && (
                                        <div className="myth-box-p">
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
                                                <span className="folk-belief-badge">Dân gian</span>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.55, textAlign: 'justify' }}>
                                                    {item.folkBelief}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', borderTop: '1.5px dashed #e2e8f0', paddingTop: '12px' }}>
                                                <span className="science-explain-badge">Khoa học</span>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f766e', lineHeight: 1.55, fontWeight: 600, textAlign: 'justify' }}>
                                                    {item.scienceExplain}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .hero-card-p {
                    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                    padding: 24px;
                    border-radius: 24px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);
                    margin-bottom: 24px;
                }

                .hero-icon-box-p {
                    background: rgba(255, 255, 255, 0.2);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }

                .search-box-p {
                    position: relative;
                    margin-bottom: 24px;
                }

                .search-icon-abs {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 1.25rem;
                }

                .search-inp-p {
                    width: 100%;
                    height: 48px;
                    padding: 14px 16px 14px 46px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    font-size: 0.95rem;
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: var(--shadow-soft);
                    color: var(--text-main);
                    outline: none;
                    transition: all 0.25s;
                }

                .search-inp-p:focus {
                    background: rgba(255, 255, 255, 0.85);
                    border-color: #ef4444;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
                }

                .tab-scroll-container {
                    display: flex;
                    background: rgba(255, 255, 255, 0.45);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 16px;
                    padding: 4px;
                    margin-bottom: 24px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }

                .tab-scroll-container::-webkit-scrollbar {
                    display: none;
                }

                .tab-toggle {
                    flex: 1;
                    padding: 12px 18px;
                    text-align: center;
                    border: none;
                    background: transparent;
                    color: var(--text-sub);
                    font-size: 0.88rem;
                    font-weight: 700;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .tab-toggle.active {
                    background: white;
                    color: #ef4444;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                /* PRECAUTIONS GRID */
                .precautions-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .no-result-card {
                    padding: 60px 20px;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
                
                /* Item Card Style */
                .item-card-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-top: 1px solid rgba(255, 255, 255, 0.5);
                    border-right: 1px solid rgba(255, 255, 255, 0.5);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .item-card-p:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
                }

                .item-header-p {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    margin-bottom: 14px;
                }

                .icon-box-p {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    flex-shrink: 0;
                }

                .item-title-p {
                    font-size: 1rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin: 0;
                }

                .status-badge-p {
                    font-size: 0.7rem;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .badge-ban {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.15);
                }

                .badge-limit {
                    background: #fffbeb;
                    color: #d97706;
                    border: 1px solid rgba(245, 158, 11, 0.15);
                }

                .badge-safe {
                    background: #ecfdf5;
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.15);
                }

                .item-desc-p {
                    font-size: 0.88rem;
                    line-height: 1.6;
                    color: #475569;
                    margin: 0;
                    text-align: justify;
                }
                
                /* Folk and Science labels */
                .myth-box-p {
                    background: rgba(248, 250, 252, 0.6);
                    border-radius: 16px;
                    padding: 14px 16px;
                    border: 1.5px dashed #e2e8f0;
                    margin-top: 14px;
                }

                .folk-belief-badge {
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 6px;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .science-explain-badge {
                    background: #e0f2fe;
                    color: #0284c7;
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 6px;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                @media (max-width: 1024px) {
                    .hero-card-p {
                        display: none !important;
                    }
                }

                @media (max-width: 600px) {
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                    .tab-scroll-container {
                        margin-bottom: 20px;
                    }
                    .tab-toggle {
                        padding: 10px 4px;
                        font-size: 0.84rem;
                    }
                }

                /* PC MEDIA QUERIES (min-width: 992px) */
                @media (min-width: 992px) {
                    .precautions-grid {
                        grid-template-columns: 1fr 1fr;
                        align-items: start;
                    }
                }
            `}</style>
        </div>
    );
}
