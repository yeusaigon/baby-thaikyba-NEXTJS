'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    collection, doc, addDoc, deleteDoc, updateDoc,
    onSnapshot, serverTimestamp, query, orderBy, writeBatch, getDocs
} from 'firebase/firestore';
import { 
    IoBriefcaseOutline, IoDocumentTextOutline, IoPersonAddOutline, 
    IoBodyOutline, IoLayersOutline, IoCheckmarkOutline, IoTrashOutline, 
    IoAddOutline, IoTimeOutline, IoBagHandleOutline, IoAlertCircleOutline, 
    IoReloadOutline 
} from 'react-icons/io5';

const DEFAULT_ITEMS = [
    // 1. Giấy tờ
    { label: "CCCD/CMND (Gốc + 2 Bản sao)", category: "giay-to" },
    { label: "Bảo hiểm y tế (Gốc + 2 Bản sao)", category: "giay-to" },
    { label: "Hồ sơ khám thai (Tất cả siêu âm, xét nghiệm)", category: "giay-to" },
    { label: "Sổ hộ khẩu (Bản sao - tùy viện)", category: "giay-to" },
    
    // 2. Cho Mẹ
    { label: "Quần áo mặc xuất viện (1 bộ)", category: "cho-me" },
    { label: "Bỉm người lớn/BVS Mama (1 gói)", category: "cho-me" },
    { label: "Quần lót giấy (5-10 cái)", category: "cho-me" },
    { label: "Tất chân, bông nhét tai", category: "cho-me" },
    { label: "Vật dụng cá nhân (Bàn chải, khăn mặt...)", category: "cho-me" },
    { label: "Máy hút sữa/Cốc hứng sữa", category: "cho-me" },
    
    // 3. Cho Bé
    { label: "Quần áo sơ sinh (5-7 bộ)", category: "cho-be" },
    { label: "Mũ, bao tay, bao chân (5 bộ)", category: "cho-be" },
    { label: "Khăn sữa nhỏ (20 cái)", category: "cho-be" },
    { label: "Khăn tắm xô lớn (2-3 cái)", category: "cho-be" },
    { label: "Bỉm/Tã dán sơ sinh (1 bịch)", category: "cho-be" },
    { label: "Khăn ướt/Khăn khô đa năng", category: "cho-be" },
    { label: "Nước muối sinh lý, kem chống hăm", category: "cho-be" },
    { label: "Bình sữa, sữa thanh (dự phòng)", category: "cho-be" },
 
    // 4. Khác
    { label: "Tiền mặt (Tiền lẻ & mệnh giá lớn)", category: "khac" },
    { label: "Sạc điện thoại, sạc dự phòng", category: "khac" },
    { label: "Phích nước nóng (nếu viện không có)", category: "khac" }
];

export default function ChecklistPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'checklist' | 'guide'>('checklist');
    const [checklistItems, setChecklistItems] = useState<any[]>([]);
    
    // Add custom item state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<string>('giay-to');
    const [newItemLabel, setNewItemLabel] = useState<string>('');
    const [isSavingItem, setIsSavingItem] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                const q = query(
                    collection(db, "users", currentUser.uid, "checklist_hospital"), 
                    orderBy("createdAt", "asc")
                );
                
                const unsub = onSnapshot(q, async (snapshot) => {
                    if (snapshot.empty) {
                        // Initialize default checklist items if empty
                        await createDefaultData(currentUser.uid);
                        return;
                    }
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setChecklistItems(list);
                });

                return () => unsub();
            }
        });
        return () => unsubscribe();
    }, []);

    // Create default items in Firestore
    const createDefaultData = async (uid: string) => {
        const batch = writeBatch(db);
        DEFAULT_ITEMS.forEach((item) => {
            const ref = doc(collection(db, "users", uid, "checklist_hospital"));
            batch.set(ref, { 
                ...item, 
                isChecked: false, 
                isCustom: false,
                createdAt: serverTimestamp() 
            });
        });
        await batch.commit();
    };

    // Toggle checked state of an item
    const toggleItem = async (itemId: string, currentChecked: boolean) => {
        if (!user) return;
        
        // Optimistic state update
        setChecklistItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, isChecked: !currentChecked };
            }
            return item;
        }));

        try {
            await updateDoc(doc(db, "users", user.uid, "checklist_hospital", itemId), {
                isChecked: !currentChecked
            });
        } catch (e: any) {
            console.error("Lỗi update:", e);
            // Revert state if error
            setChecklistItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    return { ...item, isChecked: currentChecked };
                }
                return item;
            }));
        }
    };

    // Add new item
    const addNewItem = async () => {
        if (!user || !newItemLabel.trim()) return;
        setIsSavingItem(true);

        try {
            await addDoc(collection(db, "users", user.uid, "checklist_hospital"), {
                label: newItemLabel.trim(),
                category: targetCategory,
                isChecked: false,
                isCustom: true,
                createdAt: serverTimestamp()
            });
            setAddModalOpen(false);
            setNewItemLabel('');
        } catch (e: any) {
            alert("Lỗi thêm: " + e.message);
        } finally {
            setIsSavingItem(false);
        }
    };

    // Delete custom item
    const deleteItem = async (itemId: string) => {
        if (!user) return;
        if (confirm("Xóa món đồ này?")) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "checklist_hospital", itemId));
            } catch (e: any) {
                alert("Lỗi khi xóa: " + e.message);
            }
        }
    };

    // Reset checklist to default
    const resetChecklist = async () => {
        if (!user) return;
        if (confirm("Bạn có chắc chắn muốn khôi phục danh sách chuẩn bị về mặc định ban đầu? Toàn bộ các món đồ tự thêm sẽ bị xóa, trạng thái tích chọn sẽ được làm sạch.")) {
            setIsResetting(true);
            try {
                // Fetch all items
                const colRef = collection(db, "users", user.uid, "checklist_hospital");
                const querySnap = await getDocs(colRef);
                
                // Delete all documents in batch
                const deleteBatch = writeBatch(db);
                querySnap.docs.forEach(doc => {
                    deleteBatch.delete(doc.ref);
                });
                await deleteBatch.commit();
                
                // createDefaultData will be triggered by onSnapshot snapshot.empty
            } catch (e: any) {
                alert("Lỗi reset: " + e.message);
            } finally {
                setIsResetting(false);
            }
        }
    };

    // Calculate progress statistics
    const totalCount = checklistItems.length;
    const checkedCount = checklistItems.filter(i => i.isChecked).length;
    const percent = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);

    const getEncouragement = (pct: number) => {
        if (pct === 100) return "Tuyệt vời! Bạn đã sẵn sàng đón bé!";
        if (pct >= 80) return "Sắp xong rồi, cố lên mẹ ơi!";
        if (pct >= 50) return "Đã chuẩn bị được một nửa.";
        return "Hãy bắt đầu chuẩn bị dần nhé.";
    };

    const renderChecklistGroup = (categoryKey: string, title: string, color: string, icon: React.ReactNode) => {
        const filtered = checklistItems.filter(item => item.category === categoryKey);
        
        return (
            <div className="card" style={{ marginBottom: '20px', padding: '16px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color }}>
                        {icon} {title}
                    </div>
                    <button 
                        onClick={() => {
                            setTargetCategory(categoryKey);
                            setNewItemLabel('');
                            setAddModalOpen(true);
                        }}
                        className="btn-add-item-mini"
                        style={{ color }}
                    >
                        <IoAddOutline />
                    </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontStyle: 'italic', margin: 0, padding: '10px 0' }}>
                            Trống. Nhấn nút + bên phải để thêm đồ cần chuẩn bị.
                        </p>
                    ) : (
                        filtered.map(item => (
                            <div 
                                key={item.id} 
                                className={`checklist-row ${item.isChecked ? 'row-checked' : ''}`}
                                onClick={() => toggleItem(item.id, item.isChecked)}
                            >
                                <div className="checklist-box-wrapper">
                                    <div className="custom-check-box">
                                        <IoCheckmarkOutline />
                                    </div>
                                </div>
                                <span className="item-label-text">{item.label}</span>
                                {item.isCustom && (
                                    <button 
                                        className="delete-item-row-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteItem(item.id);
                                        }}
                                    >
                                        <IoTrashOutline />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="utility-page-container fade-in">
            {/* Hero Banner Card */}
            <div className="checklist-hero-card">
                <IoBriefcaseOutline className="bg-floating-icon" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '9rem', opacity: 0.15, transform: 'rotate(-10deg)', pointerEvents: 'none' }} />
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Chuẩn Bị Đi Sinh</h2>
                <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.95rem', fontWeight: 500, marginBottom: '14px' }}>
                    Lên danh sách đầy đủ các vật dụng cần thiết cho mẹ và bé yêu trước ngày vượt cạn.
                </p>
                <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                        <span>Tiến độ chuẩn bị: {percent}% ({checkedCount}/{totalCount} món)</span>
                        <span>{getEncouragement(percent)}</span>
                    </div>
                    <div className="custom-progress-bg" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                        <div className="custom-progress-fill" style={{ width: `${percent}%`, background: 'white' }}></div>
                    </div>
                </div>
            </div>

            {/* Tab switch controller */}
            <div className="tab-container-di-sinh">
                <button 
                    onClick={() => setActiveTab('checklist')} 
                    className={`tab-toggle ${activeTab === 'checklist' ? 'active' : ''}`}
                >
                    Chuẩn bị
                </button>
                <button 
                    onClick={() => setActiveTab('guide')} 
                    className={`tab-toggle ${activeTab === 'guide' ? 'active' : ''}`}
                >
                    Kinh nghiệm
                </button>
            </div>

            {/* TAB CONTENT: CHECKLIST */}
            {activeTab === 'checklist' && (
                <div className="checklist-container-inner">
                    <div className="groups-grid">
                        {renderChecklistGroup('giay-to', 'Giấy tờ quan trọng', '#3b82f6', <IoDocumentTextOutline style={{ fontSize: '1.25rem' }} />)}
                        {renderChecklistGroup('cho-me', 'Đồ cho Mẹ', '#ec4899', <IoPersonAddOutline style={{ fontSize: '1.25rem' }} />)}
                        {renderChecklistGroup('cho-be', 'Đồ cho Bé', '#f97316', <IoBodyOutline style={{ fontSize: '1.25rem' }} />)}
                        {renderChecklistGroup('khac', 'Vật dụng khác', '#64748b', <IoLayersOutline style={{ fontSize: '1.25rem' }} />)}
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={resetChecklist} 
                            disabled={isResetting} 
                            className="reset-db-btn"
                            style={{ maxWidth: '320px' }}
                        >
                            <IoReloadOutline className={isResetting ? "spin-icon" : ""} /> {isResetting ? "Đang đặt lại..." : "Khôi phục danh sách mặc định"}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: GUIDE */}
            {activeTab === 'guide' && (
                <div className="guide-grid">
                    <div className="card guide-item-card">
                        <h4 className="guide-card-title teal-color">
                            <IoTimeOutline /> Khi nào nên chuẩn bị đồ đi sinh?
                        </h4>
                        <p className="guide-card-body">
                            Thời điểm vàng để mẹ bầu chuẩn bị giỏ đồ đi sinh là ở <strong>tuần thai thứ 34 - 36</strong>. 
                            Lúc này, bụng chưa quá to cồng kềnh giúp mẹ dễ dàng đi mua sắm, sắp xếp đồ đạc. 
                            Việc chuẩn bị sớm giúp gia đình chủ động hơn trong các tình huống sinh sớm hoặc cấp cứu bất ngờ. 
                            Hãy giặt sạch, phơi khô mọi đồ quần áo sơ sinh và cất gọn gàng vào túi trước nhé.
                        </p>
                    </div>

                    <div className="card guide-item-card">
                        <h4 className="guide-card-title orange-color">
                            <IoBagHandleOutline /> Mẹo phân loại & xếp đồ thông minh
                        </h4>
                        <p className="guide-card-body">
                            Tránh dồn tất cả đồ đạc của gia đình vào chung một chiếc vali khổng lồ. 
                            Kinh nghiệm thực tế là mẹ nên phân loại thành các giỏ nhỏ:
                        </p>
                        <ul className="guide-bullet-list">
                            <li><strong>Túi giấy tờ:</strong> CCCD, thẻ BHYT, sổ khám thai, kết quả xét nghiệm xếp riêng ở vị trí ngoài cùng để nhanh chóng làm thủ tục nhập viện.</li>
                            <li><strong>Túi phòng sinh:</strong> Gồm 1 bộ quần áo bé, mũ, bao tay chân, 1 tã chéo, 1 bỉm người lớn cho mẹ (để gửi trực tiếp cho y tá mang theo vào phòng đỡ sinh).</li>
                            <li><strong>Túi phòng hậu sản:</strong> Chứa đồ dùng chăm sóc vệ sinh của mẹ và bé suốt 3-5 ngày nghỉ dưỡng tại phòng hậu sản bệnh viện.</li>
                        </ul>
                    </div>

                    <div className="card guide-item-card guide-full-width">
                        <h4 className="guide-card-title red-color">
                            <IoAlertCircleOutline /> Những điều mẹ bầu thường hay quên
                        </h4>
                        <div className="guide-card-body">
                            <ul className="guide-bullet-list" style={{ margin: 0 }}>
                                <li><strong>Trang sức cá nhân:</strong> Tháo toàn bộ nhẫn, bông tai, vòng tay cất ở nhà tránh bị thất lạc hoặc gây chấn thương, trầy xước cho bé.</li>
                                <li><strong>Sạc dự phòng dài:</strong> Các ổ cắm điện trong phòng bệnh thường được thiết kế ở xa giường bệnh của mẹ.</li>
                                <li><strong>Tiền mặt mệnh giá nhỏ:</strong> Chuẩn bị sẵn tiền lẻ để mua nước uống, thuê vật dụng lặt vặt nhanh chóng.</li>
                            </ul>
                            <div className="guide-dashed-tip">
                                💡 <strong>Mẹo nhỏ hữu ích:</strong> Dùng túi zip khóa nhựa trong suốt phân quần áo bé thành từng bộ riêng biệt (mỗi túi chứa 1 áo, 1 quần, 1 mũ, tã lót). Khi cần thay đồ, bố chỉ cần lấy nguyên 1 túi zip là đầy đủ, không lo bới tung túi đồ lên tìm kiếm.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD CUSTOM ITEM MODAL */}
            {addModalOpen && (
                <div className="bottom-modal-overlay" onClick={() => setAddModalOpen(false)}>
                    <div className="bottom-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-drag-handle"></div>
                        <h3 className="modal-sheet-title">Thêm món đồ mới</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-field-label">Tên vật dụng</label>
                            <input 
                                type="text" 
                                value={newItemLabel} 
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                placeholder="Nhập vật dụng cần chuẩn bị..."
                                className="styled-modal-input"
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setAddModalOpen(false)} 
                                className="modal-btn cancel-btn"
                                disabled={isSavingItem}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={addNewItem} 
                                className="modal-btn submit-btn"
                                disabled={isSavingItem}
                            >
                                {isSavingItem ? "Đang thêm..." : "Thêm vào"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .tab-toggle {
                    flex: 1;
                    padding: 12px 0;
                    text-align: center;
                    border: none;
                    background: transparent;
                    color: var(--text-sub);
                    font-size: 0.88rem;
                    font-weight: 700;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .tab-toggle.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                /* CHECKLIST LAYOUT */
                .checklist-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .checklist-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .progress-header-card {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 24px;
                    border-radius: 24px;
                    color: white;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
                    position: relative;
                    overflow: hidden;
                }
                .bg-floating-icon {
                    position: absolute;
                    right: -15px;
                    bottom: -20px;
                    opacity: 0.15;
                    font-size: 9rem;
                    transform: rotate(-12deg);
                }
                .custom-progress-bg {
                    background: rgba(255, 255, 255, 0.25);
                    height: 10px;
                    border-radius: 99px;
                    overflow: hidden;
                }
                .custom-progress-fill {
                    background: white;
                    height: 100%;
                    border-radius: 99px;
                    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .btn-add-item-mini {
                    background: rgba(148, 163, 184, 0.08);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-add-item-mini:hover {
                    background: rgba(148, 163, 184, 0.15);
                    transform: scale(1.08);
                }
                .btn-add-item-mini:active {
                    transform: scale(0.92);
                }

                .groups-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .checklist-row {
                    display: flex;
                    align-items: center;
                    padding: 14px 16px;
                    border-radius: 16px;
                    border: 1.5px solid rgba(255,255,255,0.5);
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 4px;
                    box-shadow: var(--shadow-soft);
                }
                .checklist-row:hover {
                    transform: translateY(-2px);
                    border-color: rgba(16, 185, 129, 0.2);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.04);
                }
                .checklist-row:active {
                    transform: translateY(0);
                }
                .checklist-box-wrapper {
                    margin-right: 14px;
                    flex-shrink: 0;
                }
                .custom-check-box {
                    width: 22px;
                    height: 22px;
                    border: 2px solid #cbd5e1;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    color: white;
                    font-size: 0.85rem;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .custom-check-box svg {
                    opacity: 0;
                    transform: scale(0.6);
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .row-checked .custom-check-box {
                    background: var(--primary);
                    border-color: var(--primary);
                }
                .row-checked .custom-check-box svg {
                    opacity: 1;
                    transform: scale(1);
                }
                .item-label-text {
                    font-size: 0.92rem;
                    color: var(--text-main);
                    font-weight: 600;
                    line-height: 1.45;
                    flex: 1;
                    transition: all 0.2s;
                }
                .row-checked .item-label-text {
                    text-decoration: line-through;
                    color: #94a3b8;
                }
                .row-checked {
                    background: rgba(248, 250, 252, 0.6);
                    border-color: #e2e8f0;
                    box-shadow: none;
                }
                .row-checked:hover {
                    transform: none;
                    box-shadow: none;
                    border-color: #cbd5e1;
                }

                .delete-item-row-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    font-size: 1.15rem;
                    padding: 6px;
                    cursor: pointer;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    margin-left: 8px;
                }
                .delete-item-row-btn:hover {
                    background: #fef2f2;
                }

                .reset-db-btn {
                    width: 100%;
                    height: 48px;
                    background: white;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 14px;
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: var(--text-sub);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .reset-db-btn:hover {
                    background: #f8fafc;
                    color: var(--text-main);
                    border-color: #94a3b8;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin-icon {
                    animation: spin 1s linear infinite;
                }
                
                /* GUIDE CARD STYLES */
                .guide-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                .guide-item-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                }
                .guide-card-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    margin: 0 0 12px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .teal-color { color: var(--primary); }
                .orange-color { color: #f97316; }
                .red-color { color: #ef4444; }
                
                .guide-card-body {
                    font-size: 0.88rem;
                    line-height: 1.6;
                    color: #475569;
                    margin: 0;
                }
                .guide-bullet-list {
                    padding-left: 18px;
                    margin: 12px 0;
                }
                .guide-bullet-list li {
                    margin-bottom: 8px;
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.55;
                }
                .guide-dashed-tip {
                    background: #f0fdfa;
                    border: 1.5px dashed #2dd4bf;
                    padding: 14px 18px;
                    border-radius: 16px;
                    margin-top: 16px;
                    font-size: 0.82rem;
                    color: #0f766e;
                    line-height: 1.55;
                }

                /* MODAL STYLING */
                .bottom-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 2500;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }
                .bottom-modal-sheet {
                    background: white;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 28px 28px 0 0;
                    padding: 20px 24px calc(24px + env(safe-area-inset-bottom, 0px)) 24px;
                    box-shadow: 0 -15px 30px rgba(0,0,0,0.08);
                    animation: slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUpModal {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .modal-drag-handle {
                    width: 40px;
                    height: 4px;
                    background: #cbd5e1;
                    border-radius: 2px;
                    margin: 0 auto 20px auto;
                }
                .modal-sheet-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    text-align: center;
                    color: var(--text-main);
                    margin: 0 0 20px 0;
                }
                .input-field-label {
                    font-size: 0.72rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: #94a3b8;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                    display: block;
                }
                .styled-modal-input {
                    width: 100%;
                    height: 48px;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    color: var(--text-main);
                    outline: none;
                    transition: all 0.25s;
                }
                .styled-modal-input:focus {
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 0 0 4px var(--primary-light);
                }
                .modal-btn {
                    flex: 1;
                    height: 48px;
                    border-radius: 14px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .cancel-btn {
                    background: #f1f5f9;
                    color: var(--text-sub);
                }
                .cancel-btn:hover {
                    background: #e2e8f0;
                    color: var(--text-main);
                }
                .submit-btn {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    box-shadow: 0 8px 20px rgba(13, 148, 136, 0.2);
                }
                .submit-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 24px rgba(13, 148, 136, 0.25);
                }
                .submit-btn:active {
                    transform: translateY(0);
                }

                .checklist-hero-card {
                    padding: 24px 20px;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
                    border-radius: 24px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
                }

                .tab-container-di-sinh {
                    display: flex;
                    background: rgba(148, 163, 184, 0.08);
                    padding: 4px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }

                @media (max-width: 600px) {
                    .tab-container-di-sinh {
                        margin-bottom: 20px;
                    }
                    .tab-toggle {
                        flex: 1;
                        padding: 10px 4px !important;
                        font-size: 0.84rem !important;
                    }
                    .checklist-hero-card {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                }

                /* PC MEDIA QUERIES (min-width: 992px) */
                @media (min-width: 992px) {
                    .groups-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .guide-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .guide-full-width {
                        grid-column: span 2;
                    }
                }
            `}</style>
        </div>
    );
}
