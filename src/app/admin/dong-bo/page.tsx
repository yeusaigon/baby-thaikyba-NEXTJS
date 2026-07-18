'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
    IoPeopleOutline, IoCopyOutline, IoSaveOutline, IoLinkOutline, 
    IoBookOutline, IoInformationCircleOutline, IoPulseOutline, 
    IoCalendarOutline, IoWalletOutline, IoShieldCheckmarkOutline
} from 'react-icons/io5';

export default function FamilySyncPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

    // Sync input states
    const [syncRole, setSyncRole] = useState<'primary' | 'partner'>('primary');
    const [partnerUid, setPartnerUid] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        setSyncRole(data.syncRole || 'primary');
                        setPartnerUid(data.partnerUid || '');
                        setPartnerName(data.partnerName || '');
                    }
                });
            } else {
                setUser(null);
                setProfile({});
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const handleSaveSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSaving) return;
        setIsSaving(true);

        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                syncRole: syncRole,
                partnerUid: syncRole === 'primary' ? '' : partnerUid.trim(),
                partnerName: partnerName.trim()
            }, { merge: true });
            alert("Đã cập nhật cấu hình đồng bộ gia đình thành công!");
        } catch (err: any) {
            alert("Lỗi khi lưu cấu hình đồng bộ: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyCode = () => {
        if (navigator.clipboard && user?.uid) {
            navigator.clipboard.writeText(user.uid);
            alert("Đã sao chép mã liên kết của bạn!");
        }
    };

    // Calculate connection status text and color
    const isConnected = partnerUid.trim().length > 10;
    const partnerDisplay = partnerName || 'Bạn đời';

    return (
        <div className="utility-page-container fade-in">
            {/* Header Banner */}
            <div className="sync-header-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                    <div className="sync-banner-icon-wrapper">
                        <IoPeopleOutline size={30} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Đồng Bộ Tài Khoản Gia Đình</h2>
                        <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.4 }}>
                            Kết nối tài khoản giữa vợ và chồng để cùng chăm sóc thai kỳ và em bé sơ sinh.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Selector */}
            <div className="sync-tabs">
                <button 
                    onClick={() => setActiveTab('config')} 
                    className={`sync-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                >
                    <IoLinkOutline size={18} /> Kết nối & Cấu hình
                </button>
                <button 
                    onClick={() => setActiveTab('guide')} 
                    className={`sync-tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
                >
                    <IoBookOutline size={18} /> Hướng dẫn khai thác
                </button>
            </div>

            {/* TAB 1: CONNECTION CONFIG */}
            {activeTab === 'config' && (
                <div className="sync-content-grid animate-fade-in">
                    
                    {/* Form Controls */}
                    <form onSubmit={handleSaveSync} className="sync-form-card">
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                            Thiết lập liên kết đồng bộ
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Copy UID Section */}
                            <div className="uid-display-box">
                                <label className="text-label" style={{ color: '#475569', fontWeight: 700 }}>
                                    Mã liên kết của bạn (My Link Code)
                                </label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={user?.uid || ''} 
                                        className="form-input text-monospace"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleCopyCode}
                                        className="btn-copy-action"
                                    >
                                        <IoCopyOutline size={16} /> Sao chép
                                    </button>
                                </div>
                                <span className="helper-text">
                                    Cung cấp mã này cho bạn đời để họ dán vào ô kết nối phía bên kia thiết bị.
                                </span>
                            </div>

                            {/* Role Selection */}
                            <div className="input-group">
                                <label className="text-label">Vai trò tài khoản này</label>
                                <select 
                                    value={syncRole} 
                                    onChange={(e) => setSyncRole(e.target.value as 'primary' | 'partner')}
                                    className="form-input font-select"
                                >
                                    <option value="primary">Tài khoản chính (Mẹ bầu - Nơi lưu trữ dữ liệu gốc)</option>
                                    <option value="partner">Tài khoản phụ/Đồng bộ (Bạn đời - Nhận dữ liệu từ Tài khoản chính)</option>
                                </select>
                            </div>

                            {/* Partner Code Input */}
                            <div className="input-group">
                                <label className="text-label" style={{ opacity: syncRole === 'primary' ? 0.6 : 1 }}>
                                    Mã liên kết của bạn đời (Partner&apos;s Link Code)
                                </label>
                                <input 
                                    type="text" 
                                    value={syncRole === 'primary' ? '' : partnerUid} 
                                    onChange={(e) => setPartnerUid(e.target.value)} 
                                    disabled={syncRole === 'primary'}
                                    className="form-input text-monospace" 
                                    placeholder={syncRole === 'primary' ? "Tài khoản chính không cần nhập mã này..." : "Dán mã UID liên kết của bạn đời tại đây..."}
                                    style={{
                                        backgroundColor: syncRole === 'primary' ? '#f1f5f9' : undefined,
                                        cursor: syncRole === 'primary' ? 'not-allowed' : undefined,
                                        opacity: syncRole === 'primary' ? 0.7 : 1
                                    }}
                                />
                                <span className="helper-text">
                                    {syncRole === 'primary' 
                                        ? "Vì đây là Tài khoản chính, bạn đời sẽ dán mã của bạn trên thiết bị của họ. Bạn không cần điền mã ở đây." 
                                        : "* Bắt buộc nhập mã liên kết của Mẹ bầu để chỉ đường đồng bộ đến dữ liệu gốc."
                                    }
                                </span>
                            </div>

                            {/* Partner Display Name */}
                            <div className="input-group">
                                <label className="text-label">Tên bạn đời hiển thị trong nhật ký</label>
                                <input 
                                    type="text" 
                                    value={partnerName} 
                                    onChange={(e) => setPartnerName(e.target.value)} 
                                    className="form-input" 
                                    placeholder="Ví dụ: Bố Trí, Chồng yêu..."
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSaving} 
                                className="btn-primary"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', marginTop: '8px' }}
                            >
                                {isSaving ? <span className="btn-spinner" /> : <IoSaveOutline size={18} />} 
                                {isSaving ? 'Đang lưu cấu hình...' : 'Cập nhật liên kết đồng bộ'}
                            </button>
                        </div>
                    </form>

                    {/* Status & Preview Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className={`connection-status-card ${isConnected ? 'connected' : 'idle'}`}>
                            <div className="pulse-dot-container">
                                <div className={`pulse-dot ${isConnected ? 'active' : ''}`} />
                                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                    {isConnected ? 'TRẠNG THÁI: ĐÃ KẾT NỐI' : 'TRẠNG THÁI: CHỜ LIÊN KẾT'}
                                </span>
                            </div>

                            {isConnected ? (
                                <div style={{ marginTop: '16px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                                        👨‍👩‍👦 Không gian đã đồng bộ
                                    </h4>
                                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                                        Tài khoản này đang liên kết với đối tác **{partnerDisplay}**. Mọi thao tác ghi cữ sữa, giấc ngủ, tã lót sẽ được lưu trữ và cập nhật tự động trong thời gian thực.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ marginTop: '16px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#475569' }}>
                                        Chưa có kết nối nào hoạt động
                                    </h4>
                                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                                        Vui lòng dán mã liên kết (UID) của bạn đời vào ô bên cạnh và thiết lập vai trò để bắt đầu chia sẻ dữ liệu chăm sóc thai kỳ & bé sơ sinh.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="security-notice-card">
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IoShieldCheckmarkOutline size={16} /> An toàn & Bảo mật
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.76rem', color: '#334155', lineHeight: 1.45, fontWeight: 500 }}>
                                Mã liên kết là mã định danh bảo mật duy nhất của tài khoản. Ứng dụng mã hóa và bảo mật dữ liệu y tế của mẹ bầu và bé sơ sinh theo chuẩn Firebase Security Rules. Vui lòng chỉ chia sẻ mã này cho bạn đời của bạn.
                            </p>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 2: EXPLOITATION GUIDE */}
            {activeTab === 'guide' && (
                <div className="guide-tab-content animate-fade-in">
                    
                    <div className="guide-intro">
                        <IoInformationCircleOutline size={22} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f766e', fontWeight: 700, lineHeight: 1.5 }}>
                            Tìm hiểu hướng dẫn cấu hình đặc quyền cho Tài khoản chính và các kịch bản phối hợp thực tế.
                        </p>
                    </div>

                    <div className="guide-cards-container">
                        {/* Section: Hướng dẫn cho Tài khoản chính */}
                        <div className="primary-guide-card">
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 900, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoShieldCheckmarkOutline size={18} /> Hướng dẫn cho Tài khoản chính (Mẹ bầu)
                            </h4>
                            <ul className="primary-guide-list">
                                <li>
                                    <strong>Thiết lập & Kết nối:</strong> Mẹ bầu chỉ cần lấy <em>Mã liên kết của bạn</em> ở Tab 1 gửi cho bố. Bố dán mã này và chọn &quot;Tài khoản phụ/Đồng bộ&quot;. Mẹ bầu tuyệt đối không cần nhập mã của bố để tránh việc cấu hình đảo chiều ngược nhau.
                                </li>
                                <li>
                                    <strong>Quyền sở hữu dữ liệu gốc:</strong> Dữ liệu được lưu trữ vật lý tại thư mục UID của mẹ (<code>users/{"{primaryUid}"}</code>). Mẹ có quyền quản trị tối cao, cho phép <em>Khôi phục cài đặt gốc</em> hoặc <em>Nhập/Xuất dữ liệu sao lưu (JSON)</em> mà bố không thể can thiệp hay xóa nhầm.
                                </li>
                                <li>
                                    <strong>Quản lý hiển thị độc lập:</strong> Mặc dù dữ liệu nhật ký và tài chính được đồng bộ dùng chung, Mẹ bầu hoàn toàn có quyền chủ động bật/tắt các phím tắt và ứng dụng hiển thị trên Sidebar/Dashboard của riêng mình (tại mục Cài đặt) mà không làm ảnh hưởng đến bố.
                                </li>
                                <li>
                                    <strong>Cơ chế ngoại tuyến thông minh:</strong> Khi đi khám thai hoặc ở khu vực không có sóng mạng, Mẹ bầu vẫn ghi chép dữ liệu bình thường. Ứng dụng tự động lưu trữ tạm trên bộ nhớ cache thiết bị và đồng bộ lập tức lên đám mây ngay khi thiết bị có internet trở lại.
                                </li>
                                <li>
                                    <strong>Đồng bộ lịch khám & nhắc nhở:</strong> Các mốc khám thai quan trọng nên do Mẹ bầu chủ động tạo lập. Hệ thống sẽ tự động cập nhật lịch hẹn và gửi thông tin chi tiết đến thiết bị của Bố để bố nắm lịch đưa mẹ đi khám.
                                </li>
                                <li>
                                    <strong>Thống nhất quy trình ghi cữ:</strong> Để tránh ghi đè hoặc ghi trùng lặp dữ liệu (cùng lưu một cữ sữa/bỉm), mẹ bầu nên lướt nhanh tab <em>Lịch sử hoạt động</em> trên Nhật ký để xem bố đã cập nhật cữ gần nhất chưa trước khi ghi mới.
                                </li>
                            </ul>
                        </div>

                        {/* Section: Lợi ích & Hạn chế của Tài khoản phụ */}
                        <div className="secondary-guide-card">
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 900, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoPeopleOutline size={18} /> Tài khoản phụ (Bạn đời / Bố)
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: 800, color: '#0369a1' }}>
                                        🌟 Lợi ích khi sử dụng:
                                    </h5>
                                    <ul className="secondary-guide-list">
                                        <li>
                                            <strong>Đồng hành thực tế:</strong> Tự động cập nhật tức thời (Real-time) các cữ bú sữa, tã lót, giấc ngủ của con do mẹ ghi hoặc ngược lại mà không cần hỏi đi hỏi lại.
                                        </li>
                                        <li>
                                            <strong>Theo dõi sự phát triển của bé:</strong> Đồng bộ biểu đồ phần vị WHO (Percentiles) để cùng mẹ theo dõi xem cân nặng, chiều cao của con có đạt chuẩn hay không.
                                        </li>
                                        <li>
                                            <strong>San sẻ gánh nặng:</strong> Bố có thể chủ động ghi cữ bú bình ban đêm hoặc lúc mẹ nghỉ ngơi trực tiếp từ máy của bố, giảm tải áp lực cho mẹ bầu.
                                        </li>
                                        <li>
                                            <strong>Nắm bắt tài chính & Hành trình 40 tuần:</strong> Xem nhanh ngân sách tích lũy mua đồ sơ sinh và mốc thai kỳ tiếp theo để chủ động cùng mẹ chuẩn bị.
                                        </li>
                                    </ul>
                                </div>
                                <div style={{ borderTop: '1px dashed #bae6fd', paddingTop: '10px' }}>
                                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: 800, color: '#b91c1c' }}>
                                        ⚠️ Hạn chế & Ràng buộc:
                                    </h5>
                                    <ul className="secondary-guide-list" style={{ color: '#475569' }}>
                                        <li>
                                            <strong>Lệ thuộc dữ liệu gốc:</strong> Toàn bộ dữ liệu nằm trên tài khoản mẹ. Nếu mẹ ngắt kết nối hoặc xóa tài khoản, bố sẽ mất quyền truy cập và dữ liệu đồng bộ sẽ trống.
                                        </li>
                                        <li>
                                            <strong>Khóa quyền quản trị:</strong> Không được phép bấm &quot;Xóa toàn bộ dữ liệu&quot; hay &quot;Import JSON&quot; đè lên cơ sở dữ liệu để bảo vệ dữ liệu thai sản nhạy cảm của mẹ.
                                        </li>
                                        <li>
                                            <strong>Rủi ro ghi trùng (Race Condition):</strong> Nếu cả bố và mẹ cùng lưu cữ sữa $100ml$ một lúc, hệ thống sẽ tạo 2 cữ. Hãy kiểm tra Lịch sử trước khi bấm lưu.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>
                        Các kịch bản phối hợp chăm sóc bé thực tế
                    </h3>

                    <div className="scenarios-grid">
                        
                        {/* Scenario 1 */}
                        <div className="scenario-card">
                            <div className="scenario-header">
                                <div className="scenario-icon-box pink">
                                    <IoPulseOutline />
                                </div>
                                <h4 className="scenario-title">1. Chia sẻ cữ ăn ngủ của bé sơ sinh</h4>
                            </div>
                            <p className="scenario-desc">
                                Khi mẹ vừa sinh xong cần nghỉ ngơi hồi phục, bố ở phòng ngoài cho con bú bình sữa mẹ vắt ra hoặc thay tã cho bé. Bố dùng điện thoại nhập thông tin tã bỉm/sữa vào ứng dụng. Dữ liệu lập tức đồng bộ lên điện thoại của mẹ ở trong giường mà không cần mẹ phải thức dậy kiểm tra hay hỏi han chồng.
                            </p>
                        </div>

                        {/* Scenario 2 */}
                        <div className="scenario-card">
                            <div className="scenario-header">
                                <div className="scenario-icon-box blue">
                                    <IoCalendarOutline />
                                </div>
                                <h4 className="scenario-title">2. Phối hợp theo Hành trình 40 tuần</h4>
                            </div>
                            <p className="scenario-desc">
                                Khi mẹ cập nhật mốc thai kỳ kế tiếp cùng các dặn dò xét nghiệm y khoa (như test đường huyết tuần 24, siêu âm hình thái tuần 22), mốc này sẽ hiển thị ngay trên điện thoại của bố. Bố sẽ nắm được ngày giờ và các việc cần chuẩn bị cùng vợ để sắp xếp xin nghỉ làm đưa vợ đi khám.
                            </p>
                        </div>

                        {/* Scenario 3 */}
                        <div className="scenario-card">
                            <div className="scenario-header">
                                <div className="scenario-icon-box orange">
                                    <IoWalletOutline />
                                </div>
                                <h4 className="scenario-title">3. Quản lý chung quỹ tài chính đi sinh</h4>
                            </div>
                            <p className="scenario-desc">
                                Quỹ chuẩn bị tài chính cho thai kỳ và mua đồ đi sinh là kế hoạch lớn của cả hai vợ chồng. Thay vì phải ghi chép sổ giấy thủ công hay nhắn tin qua lại, mọi khoản thu chi phát sinh (khám thai, mua quần áo sơ sinh, đóng tiền viện phí) đều được lưu trữ chung vào mục Tài chính giúp vợ chồng kiểm soát ngân sách minh bạch.
                            </p>
                        </div>

                        {/* Scenario 4 */}
                        <div className="scenario-card">
                            <div className="scenario-header">
                                <div className="scenario-icon-box teal">
                                    <IoShieldCheckmarkOutline />
                                </div>
                                <h4 className="scenario-title">4. Đọc chung các kiến thức y khoa & kiêng kỵ</h4>
                            </div>
                            <p className="scenario-desc">
                                Nhiều cặp vợ chồng gặp bất đồng quan điểm khi chăm sóc thai sản hoặc nuôi con do nguồn thông tin không đồng nhất. Tính năng đồng bộ giúp hai vợ chồng cùng tiếp cận kho cẩm nang y học chuẩn và danh sách kiêng kỵ của ứng dụng, thống nhất phương pháp chăm sóc khoa học nhất cho con.
                            </p>
                        </div>

                    </div>
                </div>
            )}

            <style jsx global>{`
                .sync-header-banner {
                    background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 28px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px -10px rgba(13, 148, 136, 0.4);
                }
                .sync-banner-icon-wrapper {
                    background: rgba(255,255,255,0.2);
                    padding: 12px;
                    border-radius: 50%;
                    color: white;
                    display: flex;
                }
                .sync-header-banner::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
                    pointer-events: none;
                }

                /* Tab navigation styles */
                .sync-tabs {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 8px;
                }
                .sync-tab-btn {
                    padding: 10px 20px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-radius: 12px;
                    transition: all 0.25s ease;
                }
                .sync-tab-btn:hover {
                    color: #0d9488;
                    background: #f0fdfa;
                }
                .sync-tab-btn.active {
                    color: #0d9488;
                    background: #e6fbf7;
                }

                /* Tab 1 Layout grid */
                .sync-content-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 24px;
                    align-items: start;
                }
                .sync-form-card {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: var(--shadow-soft);
                }
                
                .uid-display-box {
                    background: #fafafc;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1.5px dashed #e2e8f0;
                }
                .btn-copy-action {
                    padding: 0 16px;
                    border: none;
                    border-radius: 12px;
                    background: #e6fbf7;
                    color: #0d9488;
                    font-weight: 800;
                    font-size: 0.82rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .btn-copy-action:hover {
                    background: #0d9488;
                    color: white;
                }
                
                .font-select {
                    appearance: none;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 12px;
                }
                .text-monospace {
                    font-family: monospace !important;
                    font-size: 0.8rem !important;
                    background: #f8fafc;
                }
                .helper-text {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    display: block;
                    margin-top: 6px;
                    fontWeight: 600;
                }

                /* Connection status cards */
                .connection-status-card {
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid transparent;
                    transition: all 0.3s ease;
                }
                .connection-status-card.idle {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                    color: #475569;
                }
                .connection-status-card.connected {
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                    border-color: #bbf7d0;
                    color: #166534;
                    box-shadow: 0 10px 25px -5px rgba(22, 101, 52, 0.05);
                }

                .pulse-dot-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                }
                .connection-status-card.connected .pulse-dot-container {
                    color: #166534;
                }

                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #94a3b8;
                }
                .pulse-dot.active {
                    background: #22c55e;
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    animation: pulse 1.6s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    }
                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
                    }
                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
                    }
                }

                .security-notice-card {
                    background: #f0fdfa;
                    border: 1px solid #ccfbf1;
                    border-radius: 20px;
                    padding: 18px;
                }

                /* TAB 2: Guide Styles */
                .guide-tab-content {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .guide-intro {
                    background: #e6fbf7;
                    border-radius: 20px;
                    padding: 16px 20px;
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    border: 1px solid rgba(13, 148, 136, 0.15);
                }
                
                .guide-cards-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 20px;
                }
                @media (max-width: 900px) {
                    .guide-cards-container {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .primary-guide-card {
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                    border: 1px solid #bbf7d0;
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }
                
                .primary-guide-list {
                    margin: 0;
                    padding-left: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .primary-guide-list li {
                    font-size: 0.8rem;
                    color: #1e293b;
                    line-height: 1.55;
                    font-weight: 500;
                }
                
                .primary-guide-list li strong {
                    color: #0f766e;
                }

                .secondary-guide-card {
                    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
                    border: 1px solid #bae6fd;
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }
                
                .secondary-guide-list {
                    margin: 0;
                    padding-left: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .secondary-guide-list li {
                    font-size: 0.8rem;
                    color: #1e293b;
                    line-height: 1.55;
                    font-weight: 500;
                }
                
                .secondary-guide-list li strong {
                    color: #0369a1;
                }

                .scenarios-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .scenario-card {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: var(--shadow-soft);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .scenario-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(0,0,0,0.03);
                }
                .scenario-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .scenario-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                .scenario-icon-box.pink { background: #fff1f2; color: #db2777; }
                .scenario-icon-box.blue { background: #f0f9ff; color: #0284c7; }
                .scenario-icon-box.orange { background: #fff7ed; color: #ea580c; }
                .scenario-icon-box.teal { background: #f0fdfa; color: #0d9488; }

                .scenario-title {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #1e293b;
                }
                .scenario-desc {
                    margin: 0;
                    font-size: 0.78rem;
                    color: #475569;
                    line-height: 1.5;
                    font-weight: 500;
                }

                @media (max-width: 900px) {
                    .sync-content-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .scenarios-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
