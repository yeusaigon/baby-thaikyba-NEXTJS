'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    collection, doc, addDoc, deleteDoc, updateDoc, 
    onSnapshot, serverTimestamp, query, orderBy, getDoc
} from 'firebase/firestore';
import { 
    IoClipboardOutline, IoCalendarOutline, IoScaleOutline, 
    IoPulseOutline, IoDocumentTextOutline, IoCameraOutline, 
    IoWalletOutline, IoCheckmarkCircleOutline, IoTrashOutline, 
    IoPencilOutline, IoEyeOutline, IoChevronBackOutline, 
    IoChevronForwardOutline, IoCloseOutline, IoTrendingUpOutline, 
    IoWarningOutline, IoPerson
} from 'react-icons/io5';

const todayStr = new Date().toISOString().split('T')[0];

export default function SoKhamBenh() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [visits, setVisits] = useState<any[]>([]);
    
    // UI tabs state: 'list' | 'add' | 'weight' | 'trash'
    const [activeTab, setActiveTab] = useState<'list' | 'add' | 'weight' | 'trash'>('list');
    
    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 5;

    // Form inputs state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDate, setFormDate] = useState('');
    const [formClinic, setFormClinic] = useState('');
    const [formWeight, setFormWeight] = useState('');
    const [formBp, setFormBp] = useState('');
    const [formNote, setFormNote] = useState('');
    const [formCost, setFormCost] = useState('');
    const [formNextDate, setFormNextDate] = useState('');
    const [formImages, setFormImages] = useState<string[]>([]);
    const [albumCategory, setAlbumCategory] = useState('don-thuoc');

    // Weight Tracker settings
    const [wtHeight, setWtHeight] = useState('');
    const [wtWeightBefore, setWtWeightBefore] = useState('');
    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiClass, setBmiClass] = useState('');
    const [bmiRec, setBmiRec] = useState('');

    // Modal state for Image Lightbox
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    // Upload progress modal
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadText, setUploadText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. AUTH & DATA LISTENERS
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                loadProfile(currentUser.uid);
                
                // Lắng nghe realtime các lần khám (visits)
                const q = query(
                    collection(db, "users", currentUser.uid, "visits"), 
                    orderBy("date", "desc")
                );
                const unsubVisits = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setVisits(list);
                });

                // Check URL params (?action=add)
                const urlParams = new URLSearchParams(window.location.search);
                const action = urlParams.get('action');
                if (action === 'add') {
                    setActiveTab('add');
                    setFormDate(new Date().toISOString().split('T')[0]);
                }

                return () => unsubVisits();
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. PROFILE LOAD
    const loadProfile = async (uid: string) => {
        try {
            const docSnap = await getDoc(doc(db, "users", uid, "settings", "profile"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data);
                if (data.height) setWtHeight(data.height);
                if (data.weightBefore) setWtWeightBefore(data.weightBefore);
                calculateBmiLocal(Number(data.height) || 0, Number(data.weightBefore) || 0);
            }
        } catch (e) {
            console.error("Lỗi tải profile:", e);
        }
    };

    // Calculate BMI
    const calculateBmiLocal = (hCm: number, wBefore: number) => {
        if (hCm <= 0 || wBefore <= 0) {
            setBmi(null);
            return;
        }
        const hM = hCm / 100;
        const score = wBefore / (hM * hM);
        setBmi(score);

        let classification = "";
        let recommendation = "";
        
        if (score < 18.5) {
            classification = "Thiếu cân (BMI < 18.5)";
            recommendation = "Mức tăng cân khuyến nghị cho bạn: 12.5 - 18 kg. Giai đoạn 3 tháng đầu: tăng 1.5 - 2.5 kg. Giai đoạn sau: tăng khoảng 0.5 kg/tuần.";
        } else if (score >= 18.5 && score < 25) {
            classification = "Bình thường (BMI 18.5 - 24.9)";
            recommendation = "Mức tăng cân khuyến nghị cho bạn: 11.5 - 16 kg. Giai đoạn 3 tháng đầu: tăng 1 - 2 kg. Giai đoạn sau: tăng khoảng 0.4 kg/tuần.";
        } else if (score >= 25 && score < 30) {
            classification = "Thừa cân (BMI 25 - 29.9)";
            recommendation = "Mức tăng cân khuyến nghị cho bạn: 7 - 11.5 kg. Giai đoạn 3 tháng đầu: tăng 0.5 - 1.5 kg. Giai đoạn sau: tăng khoảng 0.3 kg/tuần.";
        } else {
            classification = "Béo phì (BMI >= 30)";
            recommendation = "Mức tăng cân khuyến nghị cho bạn: 5 - 9 kg. Giai đoạn 3 tháng đầu: tăng 0.5 - 1 kg. Giai đoạn sau: tăng khoảng 0.2 kg/tuần.";
        }

        setBmiClass(classification);
        setBmiRec(recommendation);
    };

    // Handle Form Reset
    const resetForm = () => {
        setEditingId(null);
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormClinic('');
        setFormWeight('');
        setFormBp('');
        setFormNote('');
        setFormCost('');
        setFormNextDate('');
        setFormImages([]);
    };

    // Prepare Edit Form
    const handleEdit = (id: string) => {
        const v = visits.find(item => item.id === id);
        if (!v) return;
        setEditingId(id);
        setFormDate(v.date || '');
        setFormClinic(v.clinicName || '');
        setFormWeight(v.weight || '');
        setFormBp(v.bp || '');
        setFormNote(v.doctorNotes || '');
        setFormCost(v.totalCost ? formatCurrency(String(v.totalCost)) : '');
        setFormNextDate(v.nextDate || '');
        setFormImages(v.visitImages || (v.visitImage ? [v.visitImage] : []));
        setActiveTab('add');
    };

    // 3. IMAGE PROCESSING (Nén & chuyển Base64)
    const triggerFileSelect = () => {
        if (formImages.length >= 2) {
            alert("Đã đạt giới hạn tối đa 2 ảnh/phiếu khám.");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        if (formImages.length + files.length > 2) {
            alert(`Bạn chỉ được thêm tối đa 2 ảnh. (Hiện có: ${formImages.length}, Thêm: ${files.length})`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        
        let processedCount = 0;
        const total = files.length;
        const newImages = [...formImages];

        for (let i = 0; i < total; i++) {
            const file = files[i];
            setUploadText(`Đang xử lý ảnh ${i + 1}/${total}...`);
            
            try {
                const base64 = await processImageFile(file);
                newImages.push(base64);
            } catch (e) {
                console.error("Lỗi xử lý ảnh:", file.name, e);
            }

            processedCount++;
            const percent = Math.round((processedCount / total) * 100);
            setUploadProgress(percent);
            await new Promise(r => setTimeout(r, 100));
        }

        setFormImages(newImages);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processImageFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIM = 1024;
                    if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        } else {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    let quality = 0.8;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // Nén tiếp nếu file base64 quá 200KB
                    while (dataUrl.length > 200000 && quality > 0.3) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    resolve(dataUrl);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const removeImageAtIndex = (idx: number) => {
        if (confirm("Xóa ảnh này khỏi phiếu khám?")) {
            setFormImages(prev => prev.filter((_, i) => i !== idx));
        }
    };

    // 4. FORM SAVE & RESTORE
    const formatCurrency = (val: string) => {
        const raw = val.replace(/\D/g, '');
        if (raw === '') return '';
        return new Intl.NumberFormat('vi-VN').format(Number(raw));
    };

    const parseCurrency = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const btn = document.getElementById('btn-submit') as HTMLButtonElement;
        if (btn) btn.disabled = true;

        const data = {
            date: formDate,
            clinicName: formClinic,
            weight: formWeight,
            bp: formBp,
            doctorNotes: formNote,
            totalCost: parseCurrency(formCost),
            costExam: 0,
            costMeds: 0,
            costTests: 0,
            costOther: 0,
            visitImages: formImages,
            visitImage: null,
            nextDate: formNextDate
        };

        try {
            let visitId = editingId;
            if (visitId) {
                await updateDoc(doc(db, "users", user.uid, "visits", visitId), { 
                    ...data, 
                    updatedAt: serverTimestamp() 
                });
            } else {
                const docRef = await addDoc(collection(db, "users", user.uid, "visits"), { 
                    ...data, 
                    createdAt: serverTimestamp(), 
                    deletedAt: null 
                });
                visitId = docRef.id;
            }

            // Sync Base64 Images to User's Photos Collection (Album)
            if (formImages.length > 0 && visitId) {
                const note = `Phiếu khám ngày ${new Date(data.date).getDate()}/${new Date(data.date).getMonth() + 1} tại ${data.clinicName}`;
                const takenAt = new Date(data.date);

                const photoPromises = formImages.map(imgBase64 => {
                    return addDoc(collection(db, "users", user.uid, "photos"), {
                        image: imgBase64,
                        category: albumCategory,
                        note: note,
                        takenAt: takenAt,
                        createdAt: serverTimestamp(),
                        source: 'sokhambenh',
                        sourceId: visitId
                    });
                });
                await Promise.all(photoPromises);
                console.log("Đã đồng bộ ảnh sang Album");
            }

            resetForm();
            setActiveTab('list');
        } catch (err: any) {
            alert("Lỗi: " + err.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    // Soft delete to trash
    const softDelete = async (id: string) => {
        if (confirm("Chuyển phiếu khám này vào thùng rác?")) {
            await updateDoc(doc(db, "users", user.uid, "visits", id), { deletedAt: serverTimestamp() });
        }
    };

    const restoreVisit = async (id: string) => {
        await updateDoc(doc(db, "users", user.uid, "visits", id), { deletedAt: null });
    };

    const permanentDelete = async (id: string) => {
        if (confirm("Xóa vĩnh viễn phiếu khám này? Hành động này không thể khôi phục.")) {
            await deleteDoc(doc(db, "users", user.uid, "visits", id));
        }
    };

    // 5. WEIGHT TRACKER SAVE Settings
    const saveWeightSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const h = Number(wtHeight) || 0;
        const w = Number(wtWeightBefore) || 0;

        if (h <= 0 || w <= 0) {
            alert("Vui lòng nhập chiều cao và cân nặng hợp lệ.");
            return;
        }

        try {
            await updateDoc(doc(db, "users", user.uid, "settings", "profile"), {
                height: h,
                weightBefore: w
            });
            setProfile(prev => ({ ...prev, height: h, weightBefore: w }));
            calculateBmiLocal(h, w);
            alert("Đã lưu cấu hình cân nặng!");
        } catch (err: any) {
            alert("Lỗi lưu cấu hình: " + err.message);
        }
    };

    // 6. RENDER DATA CALCULATIONS
    const activeVisits = visits.filter(v => !v.deletedAt);
    const deletedVisits = visits.filter(v => v.deletedAt);

    // Stats calculations
    const totalCost = activeVisits.reduce((sum, v) => sum + (Number(v.totalCost) || 0), 0);
    const totalCostStr = totalCost >= 1000000 
        ? (totalCost / 1000000).toFixed(1) + 'tr' 
        : totalCost >= 1000 
            ? (totalCost / 1000).toFixed(0) + 'k' 
            : totalCost.toString();

    const upcomingVisits = activeVisits
        .filter(v => v.nextDate && v.nextDate >= todayStr)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    
    const nextVisitStr = upcomingVisits.length > 0 
        ? `${new Date(upcomingVisits[0].nextDate).getDate()}/${new Date(upcomingVisits[0].nextDate).getMonth() + 1}`
        : '--';

    // Filter list
    let filteredVisits = activeVisits;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredVisits = filteredVisits.filter(v => 
            (v.clinicName && v.clinicName.toLowerCase().includes(term)) ||
            (v.doctorNotes && v.doctorNotes.toLowerCase().includes(term))
        );
    }

    // Pagination
    const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
    const paginatedVisits = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Lightbox image viewer
    const openVisitViewer = (images: string[], index = 0) => {
        if (images.length === 0) return;
        setViewerImages(images);
        setViewerIndex(index);
        setViewerOpen(true);
    };

    const navigateImage = (dir: number) => {
        const nextIdx = viewerIndex + dir;
        if (nextIdx >= 0 && nextIdx < viewerImages.length) {
            setViewerIndex(nextIdx);
        }
    };

    // Weight gain data for chart
    const weightVisits = activeVisits
        .filter(v => Number(v.weight) > 0)
        .map(v => {
            const dateObj = new Date(v.date);
            let gestWeek = -1;
            if (profile.lmp) {
                const lmpDate = new Date(profile.lmp);
                const diffDays = Math.floor((dateObj.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
                gestWeek = Math.floor(diffDays / 7);
            }
            return {
                id: v.id,
                weight: Number(v.weight),
                date: v.date,
                gestWeek
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const hNum = Number(profile.height) || 0;
    const wNum = Number(profile.weightBefore) || 0;
    const showWeightChart = hNum > 0 && wNum > 0 && weightVisits.length > 0;

    const recentWeights = weightVisits.slice(-7);
    const maxChartWeight = Math.max(...recentWeights.map(v => v.weight), wNum);
    const minChartWeight = Math.min(...recentWeights.map(v => v.weight), wNum);
    const diffRange = maxChartWeight - minChartWeight > 0 ? maxChartWeight - minChartWeight : 5;

    // Helper formatter
    const formatFullVnd = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const formatDateShort = (str: string) => {
        if (!str) return '';
        const d = new Date(str);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return (
        <div className="fade-in sokhambenh-container utility-page-container">
            {/* Stats Dashboard (Hero Banner) */}
            <div className="stats-dashboard-p">
                <div className="medical-header-p">
                    <div>
                        <div className="medical-brand-p">Sổ Tay Khám Điện Tử</div>
                        <div className="patient-name-p">
                            {profile.name || user?.displayName || 'Đang tải...'}
                        </div>
                        <div className="patient-sub-p">
                            {profile.yob ? `NS: ${profile.yob}` : 'NS: --'} - PARA: {profile.para || '0000'}
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {profile.avatar ? (
                            <img src={profile.avatar} className="header-avatar-p" alt="Avatar" />
                        ) : (
                            <div className="header-avatar-p default">
                                <IoPerson size={24} />
                            </div>
                        )}
                        <div className="bhyt-badge-p">
                            ID: {profile.bhyt ? profile.bhyt.substring(0, 10).toUpperCase() : user?.uid ? user.uid.substring(0, 8).toUpperCase() : '--'}
                        </div>
                    </div>
                </div>
                
                <div className="medical-stats-p">
                    <div className="stat-box-p">
                        <div className="stat-val-p">{activeVisits.length}</div>
                        <div className="stat-lbl-p">Lần khám</div>
                    </div>
                    <div className="stat-box-p">
                        <div className="stat-val-p checkup-blue">{nextVisitStr}</div>
                        <div className="stat-lbl-p">Tái khám</div>
                    </div>
                    <div className="stat-box-p">
                        <div className="stat-val-p cost-red">{totalCostStr}</div>
                        <div className="stat-lbl-p">Tổng chi</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-switch">
                <button 
                    onClick={() => { setActiveTab('list'); setCurrentPage(1); }} 
                    className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                >
                    Lịch sử
                </button>
                <button 
                    onClick={() => { resetForm(); setActiveTab('add'); }} 
                    className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
                >
                    {editingId ? 'Cập nhật' : 'Ghi chép'}
                </button>
                <button 
                    onClick={() => setActiveTab('weight')} 
                    className={`tab-btn ${activeTab === 'weight' ? 'active' : ''}`}
                >
                    Tăng cân
                </button>
            </div>

            {/* View 1: List view */}
            {activeTab === 'list' && (
                <div id="view-list" className="fade-in medical-split-layout-p">
                    {/* Left Column: Dashboard Summary on PC */}
                    <div className="medical-sidebar-p">
                        <div className="sidebar-sticky-p">
                            {/* Quick Overview Card */}
                            {bmi !== null && (
                                <div className="sidebar-overview-card-p">
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <IoScaleOutline style={{ color: 'var(--primary)' }} />
                                        Tình trạng sức khỏe
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-sub)' }}>BMI trước bầu:</span>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{bmi.toFixed(1)} ({bmiClass.split(' ')[0]})</span>
                                    </div>
                                    {weightVisits.length > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-sub)' }}>Tổng tăng cân:</span>
                                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                                +{(weightVisits[weightVisits.length - 1].weight - wNum).toFixed(1)} kg
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Search & Visit Timeline */}
                    <div className="medical-main-p">
                        <div className="search-wrapper-p">
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm phòng khám, ghi chú bác sĩ..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="search-inp-medical-p"
                            />
                            <button 
                                className="btn-trash-medical-p" 
                                onClick={() => setActiveTab('trash')}
                                title="Thùng rác"
                            >
                                <IoTrashOutline size={22} />
                            </button>
                        </div>
                        
                        <div className="timeline-container-p">
                            {paginatedVisits.length === 0 ? (
                                <div className="no-visits-card-p">
                                    <IoClipboardOutline size={48} style={{ opacity: 0.3, marginBottom: '12px', color: 'var(--primary)' }} />
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>Chưa có phiếu khám nào</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sub)' }}>Bấm "Thêm mới" ở trên để ghi lại lịch sử khám thai của mẹ.</p>
                                </div>
                            ) : (
                                paginatedVisits.map((v) => {
                                    const dateObj = new Date(v.date);
                                    const images = v.visitImages || (v.visitImage ? [v.visitImage] : []);
                                    
                                    return (
                                        <div className="timeline-item-p fade-in" key={v.id}>
                                            <div className="card-header-row-p">
                                                <div className="date-badge-p">
                                                    <span className="d-p">{dateObj.getDate()}</span>
                                                    <span className="m-p">Th{dateObj.getMonth() + 1}</span>
                                                </div>
                                                <div className="clinic-info-p">
                                                    <div className="clinic-name-p">{v.clinicName}</div>
                                                    <div className="visit-year-p">{dateObj.getFullYear()}</div>
                                                </div>
                                                <div className="card-actions-p">
                                                    <button 
                                                        onClick={() => handleEdit(v.id)}
                                                        className="btn-action-edit-p"
                                                        title="Sửa"
                                                    >
                                                        <IoPencilOutline size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => softDelete(v.id)}
                                                        className="btn-action-delete-p"
                                                        title="Xóa"
                                                    >
                                                        <IoTrashOutline size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="card-body-row-p">
                                                {/* Image display */}
                                                {images.length > 0 && (
                                                    <div className="visit-image-container-p">
                                                        {images.map((imgSrc, imgIdx) => (
                                                            <div 
                                                                className="visit-image-thumb-p" 
                                                                key={imgIdx}
                                                                onClick={() => openVisitViewer(images, imgIdx)}
                                                            >
                                                                <img src={imgSrc} alt="Đính kèm" />
                                                                <div className="img-overlay-p">
                                                                    <IoEyeOutline size={20} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {(v.weight || v.bp) && (
                                                    <div className="stats-mini-grid-p">
                                                        {v.weight && (
                                                            <div className="stat-mini-p bg-weight-p">
                                                                <IoScaleOutline size={14} /> {v.weight}kg
                                                            </div>
                                                        )}
                                                        {v.bp && (
                                                            <div className="stat-mini-p bg-bp-p">
                                                                <IoPulseOutline size={14} /> Huyết áp: {v.bp}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {v.doctorNotes && (
                                                    <div className="doctor-note-p">
                                                        <IoDocumentTextOutline size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                        <div>{v.doctorNotes}</div>
                                                    </div>
                                                )}

                                                {v.nextDate && (
                                                    <div className="next-appoint-p">
                                                        <IoCalendarOutline size={14} /> Lịch hẹn tái khám: <b>{formatDateShort(v.nextDate)}</b>
                                                    </div>
                                                )}
                                            </div>

                                            {v.totalCost > 0 && (
                                                <div className="card-footer-row-p">
                                                    <div className="cost-tag-p">
                                                        <IoWalletOutline size={16} /> Chi phí: {formatFullVnd(v.totalCost)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination control */}
                        {totalPages > 1 && (
                            <div className="pagination-box-p">
                                {currentPage > 1 && (
                                    <button 
                                        onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0, 0); }} 
                                        className="pagination-btn-p"
                                    >
                                        <IoChevronBackOutline />
                                    </button>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => {
                                    const isCurrent = i === currentPage;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setCurrentPage(i); window.scrollTo(0, 0); }}
                                            className={`pagination-btn-p ${isCurrent ? 'active' : ''}`}
                                        >
                                            {i}
                                        </button>
                                    );
                                })}

                                {currentPage < totalPages && (
                                    <button 
                                        onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0, 0); }} 
                                        className="pagination-btn-p"
                                    >
                                        <IoChevronForwardOutline />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View 2: Add/Edit Form */}
            {activeTab === 'add' && (
                <div id="view-add" className="fade-in add-form-container-p">
                    <h2 className="form-heading-p">
                        {editingId ? 'Cập nhật phiếu khám' : 'Thêm lần khám thai'}
                    </h2>
                    <form onSubmit={handleSaveVisit} className="medical-form-p">
                        <div className="form-row-p">
                            <div className="simple-input-box-p">
                                <label>Ngày khám *</label>
                                <input 
                                    type="date" 
                                    value={formDate} 
                                    onChange={(e) => setFormDate(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="simple-input-box-p">
                                <label>Nơi khám / Bác sĩ khám *</label>
                                <input 
                                    type="text" 
                                    value={formClinic} 
                                    onChange={(e) => setFormClinic(e.target.value)} 
                                    placeholder="VD: BV Phụ sản - BS. Hùng..." 
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row-p">
                            <div className="simple-input-box-p">
                                <label>Cân nặng mẹ bầu (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={formWeight} 
                                    onChange={(e) => setFormWeight(e.target.value)} 
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="simple-input-box-p">
                                <label>Huyết áp của mẹ</label>
                                <input 
                                    type="text" 
                                    value={formBp} 
                                    onChange={(e) => setFormBp(e.target.value)} 
                                    placeholder="120/80"
                                />
                            </div>
                        </div>

                        <div className="simple-input-box-p">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IoDocumentTextOutline /> Chẩn đoán & Ghi chú của bác sĩ
                            </label>
                            <textarea 
                                value={formNote} 
                                onChange={(e) => setFormNote(e.target.value)} 
                                rows={3} 
                                placeholder="Ghi nhận tình hình thai nhi, lời dặn dò của bác sĩ..."
                            />
                        </div>

                        <div className="form-upload-box-p">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                    <IoCameraOutline size={18} /> Đính kèm hình ảnh (Đơn thuốc/Siêu âm - Tối đa 2)
                                </label>
                                <select 
                                    value={albumCategory} 
                                    onChange={(e) => setAlbumCategory(e.target.value)} 
                                    className="upload-select-p"
                                >
                                    <option value="don-thuoc">Đơn thuốc</option>
                                    <option value="sieu-am">Siêu âm</option>
                                    <option value="khac">Khác</option>
                                </select>
                            </div>
                            <div 
                                className="upload-area-p" 
                                onClick={triggerFileSelect} 
                            >
                                + Nhấn hoặc kéo thả ảnh vào đây để tải lên
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                multiple 
                                style={{ display: 'none' }} 
                                onChange={handleFileSelect}
                            />
                            {formImages.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div className="form-img-grid-p">
                                        {formImages.map((src, idx) => (
                                            <div className="form-thumb-item-p" key={idx}>
                                                <img src={src} alt="Thumb" onClick={() => openVisitViewer(formImages, idx)} />
                                                <button 
                                                    type="button" 
                                                    className="btn-remove-thumb-p" 
                                                    onClick={() => removeImageAtIndex(idx)}
                                                >
                                                    <IoCloseOutline size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-row-p">
                            <div className="simple-input-box-p cost-input-box-p">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IoWalletOutline /> Tổng chi phí đợt khám (VNĐ)
                                </label>
                                <input 
                                    type="text" 
                                    inputMode="numeric" 
                                    value={formCost} 
                                    onChange={(e) => setFormCost(formatCurrency(e.target.value))} 
                                    placeholder="0" 
                                />
                            </div>

                            <div className="simple-input-box-p next-date-input-box-p">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IoCalendarOutline /> Lịch hẹn tái khám lần sau
                                </label>
                                <input 
                                    type="date" 
                                    value={formNextDate} 
                                    onChange={(e) => setFormNextDate(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="form-actions-p">
                            <button 
                                type="button" 
                                onClick={() => { resetForm(); setActiveTab('list'); }} 
                                className="btn-cancel-p"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit" 
                                id="btn-submit" 
                                className="btn-save-p"
                            >
                                <IoCheckmarkCircleOutline size={18} />
                                {editingId ? 'Lưu thay đổi' : 'Lưu hồ sơ khám'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* View 3: Trash */}
            {activeTab === 'trash' && (
                <div id="view-trash" className="fade-in trash-container-p">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontWeight: 900, fontSize: '1.4rem', margin: 0, color: 'var(--text-main)' }}>Thùng rác phiếu khám</h2>
                        <button 
                            onClick={() => setActiveTab('list')} 
                            className="btn-cancel-p"
                            style={{ margin: 0, width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            Quay lại
                        </button>
                    </div>
                    
                    <div className="trash-list-p">
                        {deletedVisits.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>Thùng rác trống</div>
                        ) : (
                            deletedVisits.map((v) => (
                                <div className="trash-item-card-p" key={v.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.98rem' }}>{v.clinicName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{formatDateShort(v.date)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => restoreVisit(v.id)} 
                                            className="btn-restore-p"
                                        >
                                            Khôi phục
                                        </button>
                                        <button 
                                            onClick={() => permanentDelete(v.id)} 
                                            className="btn-perm-delete-p"
                                        >
                                            Xóa vĩnh viễn
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* View 4: Weight Tracker */}
            {activeTab === 'weight' && (
                <div id="view-weight" className="fade-in medical-split-layout-p">
                    {/* Left Column: BMI config */}
                    <div className="medical-sidebar-p">
                        <div className="sidebar-card-p bmi-config-card-p">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoScaleOutline size={20} style={{ color: 'var(--primary)' }} />
                                Chỉ số cơ thể trước bầu
                            </h3>
                            <form onSubmit={saveWeightSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="simple-input-box-p">
                                    <span className="input-label-mini-p">Chiều cao (cm)</span>
                                    <input 
                                        type="number" 
                                        value={wtHeight} 
                                        onChange={(e) => { setWtHeight(e.target.value); calculateBmiLocal(Number(e.target.value), Number(wtWeightBefore)); }} 
                                        placeholder="VD: 158" 
                                        required 
                                    />
                                </div>
                                <div className="simple-input-box-p">
                                    <span className="input-label-mini-p">Cân nặng trước bầu (kg)</span>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        value={wtWeightBefore} 
                                        onChange={(e) => { setWtWeightBefore(e.target.value); calculateBmiLocal(Number(wtHeight), Number(e.target.value)); }} 
                                        placeholder="VD: 50" 
                                        required 
                                    />
                                </div>
                                
                                {/* BMI Result Panel */}
                                {bmi !== null && (
                                    <div className="bmi-result-panel-p">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>
                                                    BMI Trước Bầu: <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary)' }}>{bmi.toFixed(1)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
                                                    {bmiClass}
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                className="btn-save-p"
                                                style={{ width: 'auto', padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px', margin: 0 }}
                                            >
                                                Lưu cấu hình
                                            </button>
                                        </div>
                                        <div className="bmi-recommendation-p" dangerouslySetInnerHTML={{ __html: bmiRec }} />
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Chart & Weight List */}
                    <div className="medical-main-p">
                        <div className="chart-card-p">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoTrendingUpOutline size={20} style={{ color: 'var(--accent)' }} />
                                Biểu đồ tăng cân qua các lần khám
                            </h3>
                            
                            {!showWeightChart ? (
                                <div className="no-chart-data-p">
                                    <IoWarningOutline size={36} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                                    <p>Vui lòng nhập chiều cao, cân nặng trước bầu ở cột bên và có ít nhất 1 lần khám bệnh có ghi nhận cân nặng của mẹ bầu để hiển thị biểu đồ.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* HTML Bars Chart */}
                                    <div className="chart-bars-wrap-p">
                                        {recentWeights.map((wVal) => {
                                            const gain = wVal.weight - wNum;
                                            const pct = Math.max(((wVal.weight - minChartWeight) / diffRange) * 70 + 15, 15);
                                            
                                            // Determine target ranges
                                            let statusColor = '#3b82f6';
                                            let statusClass = 'normal';
                                            if (wVal.gestWeek >= 0) {
                                                let minTarget = 0, maxTarget = 0;
                                                const w = wVal.gestWeek;
                                                if (bmi! < 18.5) {
                                                    minTarget = w <= 13 ? (w / 13) * 1.5 : 1.5 + (w - 13) * 0.5;
                                                    maxTarget = w <= 13 ? (w / 13) * 2.5 : 2.5 + (w - 13) * 0.5;
                                                } else if (bmi! >= 18.5 && bmi! < 25) {
                                                    minTarget = w <= 13 ? (w / 13) * 1.0 : 1.0 + (w - 13) * 0.4;
                                                    maxTarget = w <= 13 ? (w / 13) * 2.0 : 2.0 + (w - 13) * 0.4;
                                                } else if (bmi! >= 25 && bmi! < 30) {
                                                    minTarget = w <= 13 ? (w / 13) * 0.5 : 0.5 + (w - 13) * 0.3;
                                                    maxTarget = w <= 13 ? (w / 13) * 1.5 : 1.5 + (w - 13) * 0.3;
                                                } else {
                                                    minTarget = w <= 13 ? (w / 13) * 0.5 : 0.5 + (w - 13) * 0.2;
                                                    maxTarget = w <= 13 ? (w / 13) * 1.0 : 1.0 + (w - 13) * 0.2;
                                                }
                                                
                                                if (gain < minTarget) {
                                                    statusColor = '#f59e0b';
                                                    statusClass = 'low';
                                                } else if (gain > maxTarget) {
                                                    statusColor = '#ef4444';
                                                    statusClass = 'high';
                                                } else {
                                                    statusColor = '#10b981';
                                                    statusClass = 'normal';
                                                }
                                            }

                                            return (
                                                <div key={wVal.id} className="chart-bar-col-p">
                                                    <div className="chart-bar-container-p">
                                                        <div className={`chart-bar-fill-p ${statusClass}`} style={{ height: `${pct}%`, backgroundColor: statusColor }}>
                                                            <div className="chart-bar-tooltip-p">
                                                                <span className="tooltip-w-p">{wVal.weight} kg</span>
                                                                <span className="tooltip-g-p">+{gain.toFixed(1)}kg</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="chart-bar-lbl-p">
                                                        {wVal.gestWeek >= 0 ? `Tuần ${wVal.gestWeek}` : formatDateShort(wVal.date)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* History list */}
                                    <div className="weight-history-section-p">
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>Nhật ký số cân qua từng đợt khám:</h4>
                                        <div className="weight-history-list-p">
                                            {weightVisits.slice().reverse().map((wVal) => {
                                                const gain = wVal.weight - wNum;
                                                return (
                                                    <div key={wVal.id} className="weight-history-item-p">
                                                        <div>
                                                            <span className="weight-week-title-p">
                                                                {wVal.gestWeek >= 0 ? `Tuần thứ ${wVal.gestWeek}` : formatDateShort(wVal.date)}
                                                            </span>
                                                            <span className="weight-date-lbl-p">
                                                                ({new Date(wVal.date).toLocaleDateString('vi-VN')})
                                                            </span>
                                                        </div>
                                                        <div className="weight-gain-val-p">
                                                            {wVal.weight} kg <span className="gain-sub-p">(+{gain.toFixed(1)}kg)</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Lightbox Modal */}
            {viewerOpen && (
                <div id="image-viewer-modal" className="modal open" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, alignItems: 'center', justifyContent: 'center' }}>
                    <button className="modal-close" onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <IoCloseOutline size={24} />
                    </button>
                    <div className="modal-viewer-content" style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {viewerIndex > 0 && (
                            <button className="nav-btn-modal nav-prev" onClick={() => navigateImage(-1)} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <IoChevronBackOutline size={24} />
                            </button>
                        )}
                        <img src={viewerImages[viewerIndex]} style={{ maxWidth: '90%', maxHeight: '85%', objectFit: 'contain' }} alt="Phóng to" />
                        {viewerIndex < viewerImages.length - 1 && (
                            <button className="nav-btn-modal nav-next" onClick={() => navigateImage(1)} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <IoChevronForwardOutline size={24} />
                            </button>
                        )}
                        <div className="viewer-counter" style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {viewerIndex + 1} / {viewerImages.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading Progress Modal */}
            {uploading && (
                <div id="upload-progress-modal" className="modal open" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3100, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="progress-modal-box" style={{ background: 'white', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 800 }}>{uploadText}</h3>
                        <div className="progress-bar-bg" style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '15px 0 10px 0' }}>
                            <div className="progress-bar-val" style={{ height: '100%', background: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{uploadProgress}%</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.5); }
                    70% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
                }

                @keyframes pulse-bulb {
                    from { opacity: 0.8; transform: scale(1); }
                    to { opacity: 1; transform: scale(1.15); }
                }

                /* Sổ Khám Bệnh - Glassmorphic Styles */
                
                .stats-dashboard-p {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
                    margin-bottom: 24px;
                    color: white;
                    position: relative;
                }

                .medical-header-p {
                    background: transparent;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
                }

                .medical-brand-p {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.9);
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .patient-name-p {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: white;
                    letter-spacing: -0.3px;
                }

                .patient-sub-p {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.8);
                    margin-top: 4px;
                    font-weight: 500;
                }

                .header-avatar-p {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    object-fit: cover;
                    border: 2px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                }

                .header-avatar-p.default {
                    background: rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .bhyt-badge-p {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 0.68rem;
                    font-weight: 800;
                    margin-top: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: inline-block;
                }

                .medical-stats-p {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    padding: 16px 0;
                    background: rgba(255, 255, 255, 0.05);
                }

                .stat-box-p {
                    text-align: center;
                    position: relative;
                }

                .stat-box-p:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 15%;
                    height: 70%;
                    width: 1px;
                    background: rgba(255, 255, 255, 0.15);
                }

                .stat-val-p {
                    font-size: 1.15rem;
                    font-weight: 900;
                    color: white;
                }

                .stat-val-p.checkup-blue {
                    color: #bae6fd;
                }

                .stat-val-p.cost-red {
                    color: #fca5a5;
                }

                .stat-lbl-p {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.8);
                    text-transform: uppercase;
                    font-weight: 800;
                    margin-top: 2px;
                    letter-spacing: 0.3px;
                }

                .tab-switch {
                    display: flex;
                    background: rgba(148, 163, 184, 0.08);
                    border-radius: 16px;
                    padding: 4px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255,255,255,0.5);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }

                .tab-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    font-weight: 700;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.88rem;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .tab-btn.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                @media (max-width: 600px) {
                    .tab-switch {
                        margin-bottom: 20px;
                    }
                    .tab-btn {
                        padding: 10px 4px;
                        font-size: 0.84rem;
                    }
                    .stats-dashboard-p {
                        padding-top: 56px !important;
                    }
                    :global(.sokhambenh-container) {
                        padding-top: 16px !important;
                    }
                }

                /* Layout Split */
                .medical-split-layout-p {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                /* Sidebar overview */
                .sidebar-overview-card-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 20px;
                    padding: 16px;
                    box-shadow: var(--shadow-soft);
                    margin-bottom: 24px;
                }

                /* Input search and trash */
                .search-wrapper-p {
                    position: relative;
                    margin-bottom: 20px;
                    display: flex;
                    gap: 12px;
                }

                .search-inp-medical-p {
                    flex: 1;
                    padding: 14px 18px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    font-size: 0.95rem;
                    color: var(--text-main);
                    outline: none;
                    box-shadow: var(--shadow-soft);
                    transition: all 0.25s;
                }

                .search-inp-medical-p:focus {
                    background: rgba(255, 255, 255, 0.85);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
                }

                .btn-trash-medical-p {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 16px;
                    width: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    box-shadow: var(--shadow-soft);
                    transition: all 0.2s;
                }

                .btn-trash-medical-p:hover {
                    color: #ef4444;
                    background: rgba(254, 242, 242, 0.8);
                    border-color: rgba(239, 68, 68, 0.2);
                }

                /* Visits Timeline Cards */
                .timeline-container-p {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .no-visits-card-p {
                    text-align: center;
                    padding: 60px 20px;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    box-shadow: var(--shadow-soft);
                }

                .timeline-item-p {
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: var(--shadow-soft);
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .timeline-item-p:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
                }

                .card-header-row-p {
                    display: flex;
                    gap: 16px;
                    padding: 16px 20px;
                    align-items: center;
                    border-bottom: 1px dashed rgba(226, 232, 240, 0.8);
                }

                .date-badge-p {
                    background: var(--primary-light);
                    color: var(--primary-dark);
                    padding: 8px 12px;
                    border-radius: 14px;
                    text-align: center;
                    min-width: 56px;
                }

                .d-p {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .m-p {
                    display: block;
                    font-size: 0.68rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    opacity: 0.95;
                    margin-top: 2px;
                }

                .clinic-info-p {
                    flex: 1;
                }

                .clinic-name-p {
                    font-weight: 800;
                    font-size: 1.05rem;
                    color: var(--text-main);
                    line-height: 1.35;
                }

                .visit-year-p {
                    font-size: 0.78rem;
                    color: var(--text-sub);
                    font-weight: 600;
                    margin-top: 2px;
                }

                .card-actions-p {
                    display: flex;
                    gap: 8px;
                }

                .btn-action-edit-p, .btn-action-delete-p {
                    border: none;
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-action-edit-p {
                    background: rgba(148, 163, 184, 0.1);
                    color: #64748b;
                }

                .btn-action-edit-p:hover {
                    background: rgba(13, 148, 136, 0.1);
                    color: var(--primary);
                }

                .btn-action-delete-p {
                    background: rgba(239, 68, 68, 0.08);
                    color: #ef4444;
                }

                .btn-action-delete-p:hover {
                    background: #ef4444;
                    color: white;
                }

                .card-body-row-p {
                    padding: 16px 20px;
                }

                /* Image Display thumbnails grid */
                .visit-image-container-p {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .visit-image-thumb-p {
                    height: 130px;
                    border-radius: 14px;
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }

                .visit-image-thumb-p img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.35s ease;
                }

                .visit-image-thumb-p:hover img {
                    transform: scale(1.06);
                }

                .img-overlay-p {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.25s;
                }

                .visit-image-thumb-p:hover .img-overlay-p {
                    opacity: 1;
                }

                .stats-mini-grid-p {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }

                .stat-mini-p {
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.01);
                }

                .stat-mini-p.bg-weight-p {
                    background: rgba(13, 148, 136, 0.06);
                    color: var(--primary-dark);
                }

                .stat-mini-p.bg-bp-p {
                    background: rgba(239, 68, 68, 0.05);
                    color: #dc2626;
                }

                .doctor-note-p {
                    color: #334155;
                    font-size: 0.9rem;
                    line-height: 1.55;
                    background: rgba(254, 252, 232, 0.6);
                    padding: 12px 16px;
                    border-radius: 14px;
                    border-left: 4.5px solid #fcd34d;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .next-appoint-p {
                    font-size: 0.85rem;
                    color: #0284c7;
                    background: #e0f2fe;
                    padding: 8px 12px;
                    border-radius: 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 700;
                }

                .card-footer-row-p {
                    background: linear-gradient(to bottom, transparent, rgba(248, 250, 252, 0.4));
                    padding: 12px 20px 16px 20px;
                    border-top: 1px solid rgba(226, 232, 240, 0.6);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cost-tag-p {
                    color: #ef4444;
                    font-weight: 800;
                    font-size: 0.92rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .pagination-box-p {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 24px;
                    margin-bottom: 12px;
                }

                .pagination-btn-p {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    background: white;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    transition: all 0.2s;
                }

                .pagination-btn-p:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                }

                .pagination-btn-p.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                /* Form Stylings */
                .add-form-container-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }

                .form-heading-p {
                    font-weight: 900;
                    font-size: 1.35rem;
                    margin-top: 0;
                    margin-bottom: 20px;
                    color: var(--text-main);
                    letter-spacing: -0.3px;
                }

                .medical-form-p {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .form-row-p {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .simple-input-box-p {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .simple-input-box-p label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #475569;
                }

                .simple-input-box-p input, .simple-input-box-p textarea {
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1.5px solid rgba(226, 232, 240, 0.8);
                    background: white;
                    font-size: 0.95rem;
                    color: var(--text-main);
                    outline: none;
                    transition: border-color 0.2s;
                }

                .simple-input-box-p input:focus, .simple-input-box-p textarea:focus {
                    border-color: var(--primary);
                }

                .simple-input-box-p input[type="date"] {
                    color: var(--primary);
                    font-weight: 700;
                }

                .form-upload-box-p {
                    background: rgba(248, 250, 252, 0.5);
                    border: 1.5px dashed rgba(203, 213, 225, 0.8);
                    padding: 16px;
                    border-radius: 16px;
                }

                .upload-select-p {
                    font-size: 0.8rem;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 8px;
                    padding: 4px 8px;
                    outline: none;
                    background: white;
                    color: #475569;
                    font-weight: 700;
                }

                .upload-area-p {
                    border: 1.5px dashed rgba(13, 148, 136, 0.25);
                    background: rgba(13, 148, 136, 0.03);
                    padding: 18px 0;
                    font-weight: 700;
                    color: var(--primary);
                    text-align: center;
                    cursor: pointer;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .upload-area-p:hover {
                    background: rgba(13, 148, 136, 0.06);
                    border-color: var(--primary);
                }

                .form-img-grid-p {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }

                .form-thumb-item-p {
                    position: relative;
                    aspect-ratio: 1/1;
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }

                .form-thumb-item-p img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    cursor: pointer;
                }

                .btn-remove-thumb-p {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    border: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
                }

                .cost-input-box-p {
                    background: rgba(254, 242, 242, 0.4);
                    border: 1px solid rgba(252, 165, 165, 0.4);
                    padding: 12px 14px;
                    border-radius: 14px;
                }

                .cost-input-box-p label {
                    color: var(--danger);
                }

                .cost-input-box-p input {
                    font-size: 1.3rem;
                    font-weight: 900;
                    color: var(--danger) !important;
                    text-align: right;
                    border-color: rgba(252, 165, 165, 0.6) !important;
                }

                .next-date-input-box-p {
                    background: rgba(255, 247, 237, 0.5);
                    border: 1px solid rgba(254, 215, 170, 0.4);
                    padding: 12px 14px;
                    border-radius: 14px;
                }

                .next-date-input-box-p label {
                    color: #ea580c;
                }

                .next-date-input-box-p input {
                    color: #ea580c !important;
                    font-weight: 700;
                    border-color: rgba(254, 215, 170, 0.6) !important;
                }

                .form-actions-p {
                    display: flex;
                    gap: 12px;
                    margin-top: 10px;
                }

                .btn-cancel-p, .btn-save-p {
                    padding: 14px 20px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-cancel-p {
                    flex: 1;
                    background: rgba(148, 163, 184, 0.1);
                    color: #475569;
                }

                .btn-cancel-p:hover {
                    background: rgba(148, 163, 184, 0.2);
                }

                .btn-save-p {
                    flex: 2;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    box-shadow: 0 6px 16px rgba(13, 148, 136, 0.15);
                }

                .btn-save-p:hover {
                    background: var(--primary-dark);
                }

                /* Trash Styles */
                .trash-container-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }

                .trash-list-p {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .trash-item-card-p {
                    background: rgba(248, 250, 252, 0.6);
                    border: 1.5px dashed rgba(203, 213, 225, 0.8);
                    padding: 16px;
                    border-radius: 18px;
                }

                .btn-restore-p, .btn-perm-delete-p {
                    flex: 1;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-restore-p {
                    background: rgba(148, 163, 184, 0.1);
                    color: #475569;
                }

                .btn-restore-p:hover {
                    background: rgba(148, 163, 184, 0.2);
                }

                .btn-perm-delete-p {
                    background: rgba(239, 68, 68, 0.08);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.15);
                }

                .btn-perm-delete-p:hover {
                    background: #ef4444;
                    color: white;
                }

                /* Weight Tracker BMI Card & Recommendations */
                .bmi-config-card-p {
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                }

                .input-label-mini-p {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #64748b;
                    margin-bottom: 2px;
                }

                .bmi-result-panel-p {
                    background: rgba(248, 250, 252, 0.6);
                    border-radius: 14px;
                    padding: 16px;
                    border-left: 4px solid var(--primary);
                }

                .bmi-recommendation-p {
                    font-size: 0.82rem;
                    color: #475569;
                    margin-top: 10px;
                    border-top: 1px dashed rgba(203, 213, 225, 0.8);
                    padding-top: 10px;
                    line-height: 1.45;
                }

                .chart-card-p {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }

                .no-chart-data-p {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.88rem;
                    padding: 40px 20px;
                    background: rgba(248, 250, 252, 0.5);
                    border-radius: 16px;
                    border: 1px dashed rgba(226, 232, 240, 0.8);
                }

                /* HTML Charts elements */
                .chart-bars-wrap-p {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    height: 160px;
                    padding: 25px 5px 0 5px;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
                    gap: 8px;
                }

                .chart-bar-col-p {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    justify-content: flex-end;
                    position: relative;
                }

                .chart-bar-container-p {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }

                .chart-bar-fill-p {
                    width: 16px;
                    border-radius: 4px 4px 0 0;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    transition: height 0.4s ease-out;
                }

                .chart-bar-fill-p.normal {
                    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
                }

                .chart-bar-fill-p.low {
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
                }

                .chart-bar-fill-p.high {
                    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
                }

                .chart-bar-tooltip-p {
                    position: absolute;
                    top: -38px;
                    background: rgba(30, 41, 59, 0.9);
                    backdrop-filter: blur(4px);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-align: center;
                    white-space: nowrap;
                    opacity: 0.9;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                }

                .tooltip-w-p {
                    display: block;
                }

                .tooltip-g-p {
                    font-size: 0.6rem;
                    opacity: 0.85;
                }

                .chart-bar-lbl-p {
                    font-size: 0.7rem;
                    color: var(--text-sub);
                    margin-top: 6px;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .weight-history-section-p {
                    border-top: 1px dashed rgba(226, 232, 240, 0.8);
                    padding-top: 20px;
                }

                .weight-history-list-p {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .weight-history-item-p {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 18px;
                    background: rgba(248, 250, 252, 0.5);
                    border-radius: 14px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                }

                .weight-week-title-p {
                    font-weight: 800;
                    color: var(--text-main);
                    font-size: 0.92rem;
                }

                .weight-date-lbl-p {
                    font-size: 0.78rem;
                    color: var(--text-sub);
                    margin-left: 8px;
                }

                .weight-gain-val-p {
                    font-weight: 800;
                    color: var(--primary);
                    font-size: 1rem;
                }

                .gain-sub-p {
                    font-size: 0.8rem;
                    color: var(--text-sub);
                    font-weight: 500;
                }

                /* Fallback and helper cards */
                .card-glass-fallback-p {
                    text-align: center;
                    padding: 40px 24px;
                    background: rgba(255,255,255,0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 24px;
                    box-shadow: var(--shadow-soft);
                }

                /* RESPONSIVE MEDIA QUERIES (min-width: 992px) */
                @media (min-width: 992px) {
                    .medical-split-layout-p {
                        display: grid;
                        grid-template-columns: 340px 1fr;
                        align-items: start;
                    }

                    .medical-sidebar-p {
                        position: sticky;
                        top: 24px;
                    }

                    .form-row-p {
                        flex-direction: row;
                    }

                    .form-row-p > div {
                        flex: 1;
                    }

                    .visit-image-container-p {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
            `}</style>
        </div>
    );
}
