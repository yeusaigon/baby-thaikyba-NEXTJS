'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc, onSnapshot 
} from 'firebase/firestore';
import { 
    IoOptionsOutline, IoPersonOutline, IoChevronDownOutline, IoImageOutline, 
    IoCardOutline, IoMedkitOutline, IoCalendarOutline, IoCallOutline, 
    IoSaveOutline, IoGridOutline, IoCheckmarkOutline, IoCloudUploadOutline, 
    IoCloudDownloadOutline, IoTrashOutline, IoPerson, IoWarningOutline, 
    IoFlowerOutline, IoClipboardOutline, IoRestaurantOutline, IoImagesOutline,
    IoBriefcaseOutline, IoBookOutline, IoMusicalNotesOutline, IoShieldHalfOutline
} from 'react-icons/io5';
import { MENU_DEFS, DEFAULT_MENU_IDS } from '@/components/Sidebar';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [activeSection, setActiveSection] = useState<'profile' | 'vis' | 'data' | null>('profile');
    
    // Menu configuration local states
    const [menuConfig, setMenuConfig] = useState<string[]>([]);
    const [isSavingMenu, setIsSavingMenu] = useState(false);
    
    // Status states
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Form inputs matching profile state fields
    const [name, setName] = useState('');
    const [yob, setYob] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [para, setPara] = useState('');
    const [bhyt, setBhyt] = useState('');
    const [allergy, setAllergy] = useState('');
    const [lmp, setLmp] = useState('');
    const [phoneWife, setPhoneWife] = useState('');
    const [phoneHusband, setPhoneHusband] = useState('');
    const [address, setAddress] = useState('');
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Fetch settings profile
                unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        setMenuConfig(data.menuConfig || DEFAULT_MENU_IDS);
                        
                        // Set default inputs from Firestore
                        setName(data.name || '');
                        setYob(data.yob || '');
                        setBloodType(data.bloodType || '');
                        setPara(data.para || '');
                        setBhyt(data.bhyt || '');
                        setAllergy(data.allergy || '');
                        setLmp(data.lmp || '');
                        setPhoneWife(data.phoneWife || '');
                        setPhoneHusband(data.phoneHusband || '');
                        setAddress(data.address || '');
                        setAvatar(data.avatar || '');
                    } else {
                        setMenuConfig(DEFAULT_MENU_IDS);
                    }
                });
            } else {
                setUser(null);
                setProfile({});
                setMenuConfig(DEFAULT_MENU_IDS);
                if (unsubscribeProfile) {
                    unsubscribeProfile();
                    unsubscribeProfile = null;
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const toggleSection = (sec: 'profile' | 'vis' | 'data') => {
        setActiveSection(activeSection === sec ? null : sec);
    };

    // Auto-compute EDD & weeks based on LMP input
    const calculateWeeks = () => {
        if (!lmp) return null;
        const lmpDate = new Date(lmp);
        const today = new Date();
        const diffTime = today.getTime() - lmpDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { weeks: 0, days: 0, edd: 'LMP không hợp lệ' };

        const w = Math.floor(diffDays / 7);
        const d = diffDays % 7;

        const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        const edd = `${eddDate.getDate()}/${eddDate.getMonth() + 1}/${eddDate.getFullYear()}`;
        return { weeks: w, days: d, edd };
    };

    const lmpInfo = calculateWeeks();

    // Format PARA input (4 digits)
    const handleParaInput = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 4);
        setPara(cleaned);
    };

    // Format Phone numbers
    const handlePhoneInput = (val: string, type: 'wife' | 'husband') => {
        const cleaned = val.replace(/\D/g, '').slice(0, 11);
        if (type === 'wife') setPhoneWife(cleaned);
        else setPhoneHusband(cleaned);
    };

    // Format Blood Type (Uppercase, e.g., O+)
    const handleBloodTypeInput = (val: string) => {
        setBloodType(val.toUpperCase());
    };

    // Handle profile avatar picker
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setAvatar(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Save profile to Firestore
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                ...profile,
                name,
                yob,
                bloodType,
                para,
                bhyt,
                allergy,
                lmp,
                phoneWife,
                phoneHusband,
                address,
                avatar
            }, { merge: true });
            alert("Đã lưu hồ sơ mẹ bầu thành công!");
        } catch (err: any) {
            alert("Lỗi khi lưu: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle menu config visibility items locally
    const handleMenuSelection = (itemId: string) => {
        setMenuConfig(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleSaveMenuConfig = async () => {
        if (!user) return;
        setIsSavingMenu(true);
        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                menuConfig: menuConfig
            }, { merge: true });
            alert("Đã lưu cấu hình tiện ích thành công!");
        } catch (err: any) {
            alert("Lỗi khi lưu: " + err.message);
        } finally {
            setIsSavingMenu(false);
        }
    };

    // Export user data to JSON file
    const handleExport = async () => {
        if (!user) return;
        setIsExporting(true);

        try {
            const uid = user.uid;
            
            // 1. Profile settings
            const profileSnap = await getDoc(doc(db, "users", uid, "settings", "profile"));
            const profileData = profileSnap.exists() ? profileSnap.data() : {};

            // 2. Visits
            const visitsSnap = await getDocs(collection(db, "users", uid, "visits"));
            const visitsData = visitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Photos
            const photosSnap = await getDocs(collection(db, "users", uid, "photos"));
            const photosData = photosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 4. Nutrition
            const nutritionSnap = await getDocs(collection(db, "users", uid, "nutrition_diary"));
            const nutritionData = nutritionSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 5. Checklist
            const checklistSnap = await getDocs(collection(db, "users", uid, "checklist_hospital"));
            const checklistData = checklistSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const exportObj = {
                profile: profileData,
                visits: visitsData,
                photos: photosData,
                nutrition_diary: nutritionData,
                checklist_hospital: checklistData
            };

            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `thaikypro_backup_${name || 'me_bau'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert("Lỗi xuất dữ liệu: " + e.message);
        } finally {
            setIsExporting(false);
        }
    };

    // Import user data from JSON file
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (!data.profile) {
                    alert("File không đúng cấu trúc backup của ThaiKyPro!");
                    return;
                }
                if (!confirm(`Nhập dữ liệu của "${data.profile.name || 'Mẹ bầu'}"? Hành động này sẽ thay thế dữ liệu hiện tại.`)) {
                    return;
                }

                setIsImporting(true);
                const uid = user.uid;

                // 1. Save Profile
                await setDoc(doc(db, "users", uid, "settings", "profile"), data.profile);

                // 2. Import Visits
                if (data.visits && Array.isArray(data.visits)) {
                    const existing = await getDocs(collection(db, "users", uid, "visits"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.visits.forEach((v: any) => {
                        const { id, ...vData } = v;
                        const ref = doc(collection(db, "users", uid, "visits"), id || undefined);
                        batch.set(ref, vData);
                    });
                    await batch.commit();
                }

                // 3. Import Photos
                if (data.photos && Array.isArray(data.photos)) {
                    const existing = await getDocs(collection(db, "users", uid, "photos"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.photos.forEach((p: any) => {
                        const { id, ...pData } = p;
                        const ref = doc(collection(db, "users", uid, "photos"), id || undefined);
                        batch.set(ref, pData);
                    });
                    await batch.commit();
                }

                // 4. Import Nutrition
                if (data.nutrition_diary && Array.isArray(data.nutrition_diary)) {
                    const existing = await getDocs(collection(db, "users", uid, "nutrition_diary"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.nutrition_diary.forEach((nd: any) => {
                        const { id, ...ndData } = nd;
                        const ref = doc(collection(db, "users", uid, "nutrition_diary"), id || undefined);
                        batch.set(ref, ndData);
                    });
                    await batch.commit();
                }

                // 5. Import Checklist
                if (data.checklist_hospital && Array.isArray(data.checklist_hospital)) {
                    const existing = await getDocs(collection(db, "users", uid, "checklist_hospital"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.checklist_hospital.forEach((cl: any) => {
                        const { id, ...clData } = cl;
                        const ref = doc(collection(db, "users", uid, "checklist_hospital"), id || undefined);
                        batch.set(ref, clData);
                    });
                    await batch.commit();
                }

                alert("Nhập dữ liệu thành công!");
                window.location.reload();
            } catch (err: any) {
                alert("Lỗi đọc file: " + err.message);
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    // Reset app data
    const handleReset = async () => {
        if (!user) return;
        if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này KHÔNG THỂ HOÀN TÁC!")) return;
        if (!confirm("XÁC NHẬN LẦN CUỐI: Bạn thực sự muốn xóa hết lịch sử khám, dinh dưỡng, ảnh và khôi phục cài đặt gốc?")) return;

        setIsResetting(true);
        try {
            const uid = user.uid;
            const subCollections = ["visits", "photos", "nutrition_diary", "checklist_hospital"];
            
            for (const colName of subCollections) {
                const snap = await getDocs(collection(db, "users", uid, colName));
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }

            await deleteDoc(doc(db, "users", uid, "settings", "profile"));
            alert("Ứng dụng đã được reset về cài đặt mặc định gốc!");
            window.location.reload();
        } catch (e: any) {
            alert("Lỗi khi reset: " + e.message);
        } finally {
            setIsResetting(false);
        }
    };

    const selectableItems = MENU_DEFS.filter(i => i.id !== 'home' && i.id !== 'settings');

    return (
        <div className="utility-page-container fade-in">
            <style jsx>{`
                @media (max-width: 600px) {
                    .settings-header-banner {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                }

                .btn-save-circle {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    margin: 0 auto;
                }
                .btn-save-circle:hover {
                    transform: scale(1.08) translateY(-2px);
                    box-shadow: 0 12px 24px rgba(124, 58, 237, 0.45);
                }
                .btn-save-circle:active {
                    transform: scale(0.95) translateY(0);
                }
                .btn-save-circle:disabled {
                    background: #cbd5e1;
                    color: #94a3b8;
                    box-shadow: none;
                    cursor: not-allowed;
                }

                /* Banner Tiêu Đề Cao Cấp */
                .settings-header-banner {
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #4f46e5 100%);
                    position: relative;
                    overflow: hidden;
                    padding: 28px 24px;
                    border-radius: 24px;
                    color: white;
                    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.2);
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .settings-header-banner::after {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(45deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 55%);
                    transform: rotate(45deg);
                    animation: shineRay 6s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes shineRay {
                    0% { transform: translate(-30%, -30%) rotate(45deg); }
                    100% { transform: translate(30%, 30%) rotate(45deg); }
                }
                .settings-header-icon {
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.2);
                    width: 50px;
                    height: 50px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.6rem;
                    backdrop-filter: blur(5px);
                    flex-shrink: 0;
                }
                .settings-banner-content {
                    display: flex;
                    flex-direction: column;
                }
                .settings-banner-title {
                    margin: 0;
                    font-size: 1.35rem;
                    font-weight: 900;
                    letter-spacing: -0.3px;
                }
                .settings-banner-desc {
                    margin: 4px 0 0 0;
                    opacity: 0.9;
                    font-size: 0.88rem;
                    font-weight: 500;
                }

                /* Accordion cards layout */
                .settings-accordion-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
                    margin-bottom: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .settings-accordion-card.active {
                    border-color: rgba(124, 58, 237, 0.15);
                    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.05);
                }
                .accordion-header {
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-left: 0px solid var(--primary);
                }
                .settings-accordion-card.active .accordion-header {
                    background: #fafafc;
                    border-left: 5px solid var(--primary);
                    padding-left: 20px; /* offset width of border */
                }
                .accordion-header:hover {
                    background: #f8fafc;
                    padding-left: 28px;
                }
                .settings-accordion-card.active .accordion-header:hover {
                    padding-left: 24px;
                }
                .accordion-icon-box {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }
                .accordion-header:hover .accordion-icon-box {
                    transform: scale(1.08) rotate(3deg);
                }
                .accordion-icon-box.profile { background: #fff1f2; color: #ec4899; }
                .accordion-icon-box.menu { background: #e0f2fe; color: #0ea5e9; }
                .accordion-icon-box.system { background: #e0e7ff; color: #4f46e5; }
                
                /* Avatar hover styling */
                .avatar-container {
                    position: relative;
                    width: 104px;
                    height: 104px;
                    border-radius: 50%;
                    background: #f8fafc;
                    border: 3px solid white;
                    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
                    overflow: hidden;
                    margin-bottom: 12px;
                    cursor: pointer;
                }
                .avatar-hover-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    font-size: 0.72rem;
                    font-weight: 700;
                    gap: 4px;
                }
                .avatar-container:hover .avatar-hover-overlay {
                    opacity: 1;
                }
                .avatar-upload-label {
                    background: #fdf4ff;
                    color: #a855f7;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                    border: 1px solid #f3e8ff;
                }
                .avatar-upload-label:hover {
                    background: #f3e8ff;
                    transform: translateY(-2px);
                }

                /* Form and inputs styling */
                .form-grid-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 15px;
                }
                @media (max-width: 767px) {
                    .form-grid-layout {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                /* Calculation Ticket */
                .calculation-ticket {
                    display: flex;
                    background: linear-gradient(135deg, #f0fdfa 0%, #f5f3ff 100%);
                    border: 1px dashed rgba(13, 148, 136, 0.3);
                    border-radius: 18px;
                    padding: 16px;
                    margin-top: 16px;
                    align-items: center;
                }
                .ticket-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ticket-label {
                    font-size: 0.72rem;
                    color: #64748b;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .ticket-val {
                    font-size: 1.15rem;
                    font-weight: 900;
                }
                .ticket-val.edd { color: #db2777; }
                .ticket-val.weeks { color: #0d9488; }
                .days-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #0f766e;
                }
                .ticket-divider {
                    width: 1px;
                    height: 36px;
                    background: rgba(13, 148, 136, 0.15);
                    margin: 0 16px;
                }
                @media (max-width: 600px) {
                    .calculation-ticket {
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }
                    .ticket-divider {
                        width: 100%;
                        height: 1px;
                        margin: 8px 0;
                    }
                }

                /* Config Menu Grid */
                .menu-config-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-top: 16px;
                }
                @media (max-width: 767px) {
                    .menu-config-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                    }
                }
                @media (max-width: 480px) {
                    .menu-config-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .menu-config-card {
                    border: 2px solid #e2e8f0;
                    background: white;
                    border-radius: 20px;
                    padding: 16px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .menu-config-card:hover {
                    transform: translateY(-3px);
                }
                .menu-config-card.checked {
                    background: #f8fafc;
                }
                
                /* Config brand borders when checked */
                .menu-config-card.checked.util-sokham { border-color: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08); --color-brand: #10b981; --bg-alpha: rgba(16,185,129,0.12); }
                .menu-config-card.checked.util-lichkham { border-color: #3b82f6; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.08); --color-brand: #3b82f6; --bg-alpha: rgba(59,130,246,0.12); }
                .menu-config-card.checked.util-dinhduong { border-color: #f97316; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.08); --color-brand: #f97316; --bg-alpha: rgba(249,115,22,0.12); }
                .menu-config-card.checked.util-album { border-color: #8b5cf6; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.08); --color-brand: #8b5cf6; --bg-alpha: rgba(139,92,246,0.12); }
                .menu-config-card.checked.util-chuanbi { border-color: #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.08); --color-brand: #f59e0b; --bg-alpha: rgba(245,158,11,0.12); }
                .menu-config-card.checked.util-note { border-color: #14b8a6; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.08); --color-brand: #14b8a6; --bg-alpha: rgba(20,184,166,0.12); }
                .menu-config-card.checked.util-thaigiao { border-color: #db2777; box-shadow: 0 4px 15px rgba(219, 39, 119, 0.08); --color-brand: #db2777; --bg-alpha: rgba(219,39,119,0.12); }
                .menu-config-card.checked.util-kiengky { border-color: #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.08); --color-brand: #ef4444; --bg-alpha: rgba(239,68,68,0.12); }

                .config-card-icon {
                    padding: 10px;
                    border-radius: 12px;
                    font-size: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    color: #94a3b8;
                    transition: all 0.25s ease;
                }
                .menu-config-card.checked .config-card-icon {
                    background: var(--bg-alpha);
                    color: var(--color-brand);
                    transform: scale(1.05);
                }
                .config-card-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: var(--color-brand);
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    animation: scaleUpBadge 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes scaleUpBadge {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                .config-card-label {
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-align: center;
                    color: #475569;
                    line-height: 1.25;
                }

                /* System Operations Layout */
                .system-operations-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .sys-op-card {
                    background: rgba(248, 250, 252, 0.55);
                    border: 1px solid #f1f5f9;
                    border-radius: 20px;
                    padding: 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    transition: all 0.3s ease;
                }
                .sys-op-card:hover {
                    border-color: #e2e8f0;
                    background: white;
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.02);
                }
                .sys-op-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }
                .sys-op-title {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #1e293b;
                }
                .sys-op-desc {
                    font-size: 0.78rem;
                    color: #64748b;
                    line-height: 1.45;
                    margin: 0;
                }
                .btn-sys-action {
                    padding: 10px 18px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .btn-sys-action.export { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
                .btn-sys-action.export:hover { background: #16a34a; color: white; transform: translateY(-1px); }
                
                .btn-sys-action.import { background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; }
                .btn-sys-action.import:hover { background: #0d9488; color: white; transform: translateY(-1px); }
                
                .btn-sys-action.reset { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
                .btn-sys-action.reset:hover { background: #ef4444; color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }
                
                .btn-sys-action:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                    pointer-events: none;
                }
                
                .btn-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    display: inline-block;
                }
            `}</style>

            {/* Banner Tiêu Đề Cao Cấp */}
            <div className="settings-header-banner">
                <div className="settings-header-icon">
                    <IoOptionsOutline />
                </div>
                <div className="settings-banner-content">
                    <h2 className="settings-banner-title">Cấu hình hệ thống</h2>
                    <p className="settings-banner-desc">Tùy chỉnh thông tin và quản lý ThaiKy Pro.</p>
                </div>
            </div>

            {/* 1. Hồ sơ mẹ bầu */}
            <div className={`settings-accordion-card ${activeSection === 'profile' ? 'active' : ''}`}>
                <div className="accordion-header" onClick={() => toggleSection('profile')}>
                    <div className="accordion-title-wrapper">
                        <div className="accordion-icon-box profile">
                            <IoPersonOutline />
                        </div>
                        <span className="text-label text-highlight" style={{ margin: 0, fontSize: '0.92rem', color: 'var(--primary)', fontWeight: 800 }}>1. Hồ sơ mẹ bầu</span>
                    </div>
                    <IoChevronDownOutline style={{ fontSize: '20px', transition: '0.3s', transform: activeSection === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }} />
                </div>

                {activeSection === 'profile' && (
                    <div id="sec-profile" style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                        <form onSubmit={handleSaveProfile}>
                            {/* AVATAR UPLOAD */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                                <div className="avatar-container" onClick={() => document.getElementById('avatar-input')?.click()}>
                                    {avatar ? (
                                        <img id="avatar-preview" src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar Preview" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                            <IoPerson size={32} />
                                        </div>
                                    )}
                                    <div className="avatar-hover-overlay">
                                        <IoImageOutline size={18} />
                                        <span>Chọn ảnh</span>
                                    </div>
                                </div>
                                <label className="avatar-upload-label">
                                    <IoImageOutline size={15} /> Đổi ảnh đại diện
                                    <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                </label>
                            </div>

                            {/* PHÂN NHÓM 1: THÔNG TIN CÁ NHÂN */}
                            <div className="profile-subgroup">
                                <div className="profile-subgroup-title">
                                    <IoCardOutline size={16} /> Thông tin cá nhân
                                </div>
                                <div className="input-group">
                                    <label className="text-label">Họ tên mẹ bầu</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="VD: Phạm Minh Ngọc" />
                                </div>
                                <div className="form-grid-layout">
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Năm sinh</label>
                                        <input type="number" value={yob} onChange={(e) => setYob(e.target.value)} className="form-input" placeholder="VD: 1996" />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Nhóm máu</label>
                                        <input type="text" value={bloodType} onChange={(e) => handleBloodTypeInput(e.target.value)} className="form-input" placeholder="VD: O+" />
                                    </div>
                                </div>
                            </div>

                            {/* PHÂN NHÓM 2: Y TẾ & SỨC KHỎE */}
                            <div className="profile-subgroup">
                                <div className="profile-subgroup-title">
                                    <IoMedkitOutline size={16} /> Y tế & Sức khỏe mẹ bầu
                                </div>
                                <div className="form-grid-layout">
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Chỉ số PARA</label>
                                        <input type="text" value={para} onChange={(e) => handleParaInput(e.target.value)} className="form-input" placeholder="4 số, VD: 0000" />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Mã thẻ BHYT</label>
                                        <input type="text" value={bhyt} onChange={(e) => setBhyt(e.target.value)} className="form-input" placeholder="Nhập số thẻ BHYT..." />
                                    </div>
                                </div>
                                <div className="input-group allergy-input-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                                    <label className="text-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <IoWarningOutline size={14} /> Tiền sử / Dị ứng
                                    </label>
                                    <input type="text" value={allergy} onChange={(e) => setAllergy(e.target.value)} className="form-input" placeholder="VD: Dị ứng penicillin, huyết áp thấp..." />
                                </div>
                            </div>

                            {/* PHÂN NHÓM 3: CHU KỲ & TUẦN THAI */}
                            <div className="profile-subgroup">
                                <div className="profile-subgroup-title">
                                    <IoCalendarOutline size={16} /> Chu kỳ & Tính tuần thai
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="text-label">Ngày kinh cuối (LMP)</label>
                                    <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className="form-input" />
                                </div>
                                
                                {lmpInfo && lmpInfo.edd && (
                                    <div className="calculation-ticket">
                                        <div className="ticket-section">
                                            <span className="ticket-label">Dự sinh dự kiến (EDD)</span>
                                            <strong className="ticket-val edd">{lmpInfo.edd}</strong>
                                        </div>
                                        <div className="ticket-divider"></div>
                                        <div className="ticket-section">
                                            <span className="ticket-label">Tuần thai hiện tại</span>
                                            <strong className="ticket-val weeks">
                                                {lmpInfo.weeks}w <span className="days-label">+{lmpInfo.days} ngày</span>
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PHÂN NHÓM 4: LIÊN HỆ */}
                            <div className="profile-subgroup">
                                <div className="profile-subgroup-title">
                                    <IoCallOutline size={16} /> Thông tin liên lạc
                                </div>
                                <div className="form-grid-layout">
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">SĐT Vợ (Zalo)</label>
                                        <input type="tel" value={phoneWife} onChange={(e) => handlePhoneInput(e.target.value, 'wife')} className="form-input" placeholder="09xx xxx xxx" />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">SĐT Chồng (Zalo)</label>
                                        <input type="tel" value={phoneHusband} onChange={(e) => handlePhoneInput(e.target.value, 'husband')} className="form-input" placeholder="09xx xxx xxx" />
                                    </div>
                                </div>
                                <div className="input-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                                    <label className="text-label">Địa chỉ thường trú</label>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" placeholder="Số nhà, tên đường, khu phố, tỉnh/thành..." />
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="btn-primary" style={{ marginTop: '10px' }}>
                                {isSaving ? <span className="btn-spinner" /> : <IoSaveOutline size={18} />} 
                                {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ mẹ bầu'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* 2. Cấu hình Menu Mobile */}
            <div className={`settings-accordion-card ${activeSection === 'vis' ? 'active' : ''}`}>
                <div className="accordion-header" onClick={() => toggleSection('vis')}>
                    <div className="accordion-title-wrapper">
                        <div className="accordion-icon-box menu">
                            <IoGridOutline />
                        </div>
                        <span className="text-label text-highlight" style={{ margin: 0, fontSize: '0.92rem', color: 'var(--primary)', fontWeight: 800 }}>2. Cấu hình Tiện ích Hiển thị</span>
                    </div>
                    <IoChevronDownOutline style={{ fontSize: '20px', transition: '0.3s', transform: activeSection === 'vis' ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }} />
                </div>

                {activeSection === 'vis' && (
                    <div id="sec-vis" style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
                            Lựa chọn các ứng dụng và tiện ích được hiển thị trên trang chủ Dashboard và danh mục menu trượt bên của mẹ bầu.
                        </p>
                        
                        <div className="menu-config-grid">
                            {selectableItems.map(item => {
                                const isChecked = menuConfig.includes(item.id);
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleMenuSelection(item.id)}
                                        className={`menu-config-card ${isChecked ? 'checked' : ''} util-${item.id}`}
                                    >
                                        {isChecked && (
                                            <div className="config-card-badge">
                                                <IoCheckmarkOutline style={{ fontSize: '11px' }} />
                                            </div>
                                        )}
                                        <div className="config-card-icon">
                                            {item.id === 'sokham' && <IoClipboardOutline />}
                                            {item.id === 'lichkham' && <IoCalendarOutline />}
                                            {item.id === 'dinhduong' && <IoRestaurantOutline />}
                                            {item.id === 'album' && <IoImagesOutline />}
                                            {item.id === 'chuanbi' && <IoBriefcaseOutline />}
                                            {item.id === 'note' && <IoBookOutline />}
                                            {item.id === 'thaigiao' && <IoMusicalNotesOutline />}
                                            {item.id === 'kiengky' && <IoShieldHalfOutline />}
                                        </div>
                                        <span className="config-card-label">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                                onClick={handleSaveMenuConfig}
                                disabled={isSavingMenu}
                                className="btn-save-circle"
                                title="Lưu cấu hình tiện ích"
                            >
                                <IoSaveOutline size={22} className={isSavingMenu ? "spin-icon" : ""} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Dữ liệu & Hệ thống */}
            <div className={`settings-accordion-card ${activeSection === 'data' ? 'active' : ''}`}>
                <div className="accordion-header" onClick={() => toggleSection('data')}>
                    <div className="accordion-title-wrapper">
                        <div className="accordion-icon-box system">
                            <IoOptionsOutline />
                        </div>
                        <span className="text-label text-highlight" style={{ margin: 0, fontSize: '0.92rem', color: 'var(--primary)', fontWeight: 800 }}>3. Dữ liệu & Hệ thống</span>
                    </div>
                    <IoChevronDownOutline style={{ fontSize: '20px', transition: '0.3s', transform: activeSection === 'data' ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }} />
                </div>

                {activeSection === 'data' && (
                    <div id="sec-data" style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                        <div className="system-operations-container">
                            {/* Xuất dữ liệu */}
                            <div className="sys-op-card">
                                <div className="sys-op-info">
                                    <span className="sys-op-title">Sao lưu dữ liệu (Export JSON)</span>
                                    <p className="sys-op-desc">Xuất toàn bộ lịch sử khám thai, dinh dưỡng, nhật ký và ảnh thành file JSON để lưu trữ dự phòng.</p>
                                </div>
                                <button 
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="btn-sys-action export" 
                                >
                                    {isExporting ? <span className="btn-spinner" /> : <IoCloudDownloadOutline size={16} />}
                                    {isExporting ? 'Đang xuất...' : 'Tải File'}
                                </button>
                            </div>
 
                            {/* Nhập dữ liệu */}
                            <div className="sys-op-card">
                                <div className="sys-op-info">
                                    <span className="sys-op-title">Khôi phục dữ liệu (Import JSON)</span>
                                    <p className="sys-op-desc">Nhập lại file sao lưu JSON trước đó để khôi phục toàn bộ các chỉ số và nhật ký ghi chép.</p>
                                </div>
                                <label 
                                    className={`btn-sys-action import ${isImporting ? 'disabled' : ''}`}
                                >
                                    {isImporting ? <span className="btn-spinner" /> : <IoCloudUploadOutline size={16} />}
                                    {isImporting ? 'Đang nhập...' : 'Chọn File'}
                                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={isImporting} />
                                </label>
                            </div>
 
                            {/* Khôi phục cài đặt gốc */}
                            <div className="sys-op-card" style={{ borderColor: '#fecaca' }}>
                                <div className="sys-op-info">
                                    <span className="sys-op-title" style={{ color: '#ef4444' }}>Xóa dữ liệu & Cài đặt lại (Reset)</span>
                                    <p className="sys-op-desc">Xóa vĩnh viễn toàn bộ dữ liệu lưu trữ (lịch khám, ảnh, dinh dưỡng) và khôi phục cài đặt gốc mặc định.</p>
                                </div>
                                <button 
                                    onClick={handleReset}
                                    disabled={isResetting}
                                    className="btn-sys-action reset" 
                                >
                                    {isResetting ? <span className="btn-spinner" /> : <IoTrashOutline size={16} />}
                                    {isResetting ? 'Đang xóa...' : 'Reset App'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
