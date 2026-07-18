'use client';
import { MENU_DEFS } from '@/components/Sidebar';
import Link from 'next/link';
import { 
    IoClipboard, IoRestaurant, 
    IoImages, IoBriefcase, IoMedical, 
    IoHeart, IoWallet, 
    IoMusicalNotes, IoShieldHalf, IoSettings,
    IoPulse, IoFootsteps, IoWarning, IoHomeOutline, IoPeople
} from 'react-icons/io5';

export default function AllAppsPage() {
    // We want to show all utilities except home, settings, and dongbo in the general list
    const apps = MENU_DEFS.filter(item => item.id !== 'home' && item.id !== 'settings' && item.id !== 'dongbo')
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    // We can group them by group if we want ("health", "tool", "knowledge"), but for now a simple grid is fine.
    // Grouping:
    const healthApps = apps.filter(a => a.group === 'health');
    const toolApps = apps.filter(a => a.group === 'tool');
    const knowledgeApps = apps.filter(a => a.group === 'knowledge');

    const renderGrid = (list: typeof apps) => (
        <div className="utilities-grid">
            {list.map(item => (
                <Link 
                    href={item.target} 
                    key={item.id} 
                    className={`util-item util-${item.id}`}
                >
                    <div className="util-icon-box" style={{ color: item.color, background: `${item.color}12` }}>
                        {item.id === 'sokham' && <IoClipboard size={20} />}
                        {item.id === 'toancanh' && <IoHeart size={20} />}
                        {item.id === 'dinhduong' && <IoRestaurant size={20} />}
                        {item.id === 'album' && <IoImages size={20} />}
                        {item.id === 'chuanbi' && <IoBriefcase size={20} />}
                        {item.id === 'thaigiao' && <IoMusicalNotes size={20} />}
                        {item.id === 'kiengky' && <IoShieldHalf size={20} />}
                        {item.id === 'tiemchung' && <IoMedical size={20} />}
                        {item.id === 'nhatkybe' && <IoHeart size={20} />}
                        {item.id === 'taichinh' && <IoWallet size={20} />}
                        {item.id === 'suckhoe' && <IoPulse size={20} />}
                        {item.id === 'cudongthai' && <IoFootsteps size={20} />}
                        {item.id === 'canhbao' && <IoWarning size={20} />}
                    </div>
                    <span className="util-label">{item.label}</span>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="utility-page-container fade-in ung-dung-page" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <section className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: '#10b981', fontWeight: 800 }}>
                    Sức khỏe & Theo dõi
                </h3>
                {renderGrid(healthApps)}
            </section>

            <section className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: '#8b5cf6', fontWeight: 800 }}>
                    Tiện ích & Lưu trữ
                </h3>
                {renderGrid(toolApps)}
            </section>

            <section className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: '#ec4899', fontWeight: 800 }}>
                    Kiến thức & Cẩm nang
                </h3>
                {renderGrid(knowledgeApps)}
            </section>

            <section className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: '#64748b', fontWeight: 800 }}>
                    Hệ thống
                </h3>
                <div className="utilities-grid">
                    <Link href="/admin" className="util-item util-home">
                        <div className="util-icon-box" style={{ color: '#0d9488', background: '#0d948812' }}>
                            <IoHomeOutline size={20} />
                        </div>
                        <span className="util-label">Trang chủ</span>
                    </Link>
                    <Link href="/admin/dong-bo" className="util-item util-dongbo">
                        <div className="util-icon-box" style={{ color: '#10b981', background: '#10b98112' }}>
                            <IoPeople size={20} />
                        </div>
                        <span className="util-label">Đồng bộ gia đình</span>
                    </Link>
                    <Link href="/admin/settings" className="util-item util-settings">
                        <div className="util-icon-box" style={{ color: '#64748b', background: '#64748b12' }}>
                            <IoSettings size={20} />
                        </div>
                        <span className="util-label">Cài đặt</span>
                    </Link>
                </div>
            </section>

            <style jsx global>{`
                .ung-dung-page .util-icon-box {
                    width: 68px;
                    height: 68px;
                    border-radius: 22px;
                    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
                }

                .ung-dung-page .util-label {
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
}
