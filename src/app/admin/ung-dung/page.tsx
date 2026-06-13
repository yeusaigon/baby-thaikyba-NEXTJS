'use client';
import { MENU_DEFS } from '@/components/Sidebar';
import Link from 'next/link';
import { 
    IoClipboardOutline, IoCalendarOutline, IoRestaurantOutline, 
    IoImagesOutline, IoBriefcaseOutline, IoMedicalOutline, 
    IoHeartOutline, IoWalletOutline, IoBookOutline, 
    IoMusicalNotesOutline, IoShieldHalfOutline, IoSettingsOutline,
    IoPulseOutline, IoFootstepsOutline, IoWarningOutline
} from 'react-icons/io5';

export default function AllAppsPage() {
    // We want to show all utilities except home, settings
    // Wait, setting is a tool but usually at the bottom. We can include it or not. The user wants "Tất cả ứng dụng".
    const apps = MENU_DEFS.filter(item => item.id !== 'home' && item.id !== 'settings')
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
                        {item.id === 'sokham' && <IoClipboardOutline />}
                        {item.id === 'lichkham' && <IoCalendarOutline />}
                        {item.id === 'dinhduong' && <IoRestaurantOutline />}
                        {item.id === 'album' && <IoImagesOutline />}
                        {item.id === 'chuanbi' && <IoBriefcaseOutline />}
                        {item.id === 'note' && <IoBookOutline />}
                        {item.id === 'thaigiao' && <IoMusicalNotesOutline />}
                        {item.id === 'kiengky' && <IoShieldHalfOutline />}
                        {item.id === 'tiemchung' && <IoMedicalOutline />}
                        {item.id === 'nhatkybe' && <IoHeartOutline />}
                        {item.id === 'taichinh' && <IoWalletOutline />}
                        {item.id === 'suckhoe' && <IoPulseOutline />}
                        {item.id === 'cudongthai' && <IoFootstepsOutline />}
                        {item.id === 'canhbao' && <IoWarningOutline />}
                    </div>
                    <span className="util-label">{item.label}</span>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="fade-in" style={{ padding: '20px 16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
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
                    <Link href="/admin/settings" className="util-item util-settings">
                        <div className="util-icon-box" style={{ color: '#64748b', background: '#64748b12' }}>
                            <IoSettingsOutline />
                        </div>
                        <span className="util-label">Cài đặt</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
