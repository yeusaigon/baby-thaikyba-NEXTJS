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
    IoBriefcaseOutline, IoBookOutline, IoMusicalNotesOutline, IoShieldHalfOutline,
    IoHomeOutline, IoPulseOutline, IoMedicalOutline, IoHeartOutline, 
    IoWalletOutline, IoFootstepsOutline, IoCopyOutline, IoPeopleOutline, 
    IoShareSocialOutline, IoCloseOutline, IoAddOutline, IoRemoveOutline
} from 'react-icons/io5';
import { MENU_DEFS, DEFAULT_MENU_IDS } from '@/components/Sidebar';
import { computeBabyAgeDetails } from '@/lib/babyMilestones';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [activeSection, setActiveSection] = useState<'profile' | 'vis' | 'sync' | 'data' | null>('profile');
    
    // Sync connection local states
    const [syncRole, setSyncRole] = useState<'primary' | 'partner'>('primary');
    const [partnerUid, setPartnerUid] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [isSavingSync, setIsSavingSync] = useState(false);
    
    // Menu configuration local states
    const [menuConfig, setMenuConfig] = useState<string[]>([]);
    const [isSavingMenu, setIsSavingMenu] = useState(false);
    
    // Status states
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // App Mode & Baby Info States (Postpartum / Nuôi con)
    const [appMode, setAppMode] = useState<'pregnancy' | 'postpartum'>('pregnancy');
    const [babyName, setBabyName] = useState('');
    const [babyDob, setBabyDob] = useState('');
    const [babyGender, setBabyGender] = useState<'boy' | 'girl' | 'twins'>('girl');
    const [babyBirthWeight, setBabyBirthWeight] = useState<string | number>('');
    const [babyBirthHeight, setBabyBirthHeight] = useState<string | number>('');
    const [babyBirthHeadCircumference, setBabyBirthHeadCircumference] = useState<string | number>('');

    // Form inputs matching profile state fields
    const [name, setName] = useState('');
    const [yob, setYob] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [para, setPara] = useState('');
    const [bhyt, setBhyt] = useState('');
    const [cccd, setCccd] = useState('');
    const [allergy, setAllergy] = useState('');
    const [lmp, setLmp] = useState('');
    const [phoneWife, setPhoneWife] = useState('');
    const [phoneHusband, setPhoneHusband] = useState('');
    const [address, setAddress] = useState('');
    const [avatar, setAvatar] = useState('');

    // Avatar Cropping States
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropSrc, setCropSrc] = useState<string>('');
    const [cropScale, setCropScale] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
                        setAppMode(data.appMode || 'pregnancy');
                        if (data.babyInfo) {
                            setBabyName(data.babyInfo.name || '');
                            setBabyDob(data.babyInfo.dob || '');
                            setBabyGender(data.babyInfo.gender || 'girl');
                            setBabyBirthWeight(data.babyInfo.birthWeight ?? '');
                            setBabyBirthHeight(data.babyInfo.birthHeight ?? '');
                            setBabyBirthHeadCircumference(data.babyInfo.birthHeadCircumference ?? '');
                        }
                        
                        // Set default inputs from Firestore
                        setName(data.name || '');
                        setYob(data.yob || '');
                        setBloodType(data.bloodType || '');
                        setPara(data.para || '');
                        setBhyt(data.bhyt || '');
                        setCccd(data.cccd || '');
                        setAllergy(data.allergy || '');
                        setLmp(data.lmp || '');
                        setPhoneWife(data.phoneWife || '');
                        setPhoneHusband(data.phoneHusband || '');
                        setAddress(data.address || '');
                        setAvatar(data.avatar || '');
                        setSyncRole(data.syncRole || 'primary');
                        setPartnerUid(data.partnerUid || '');
                        setPartnerName(data.partnerName || '');
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

    const toggleSection = (sec: 'profile' | 'vis' | 'sync' | 'data') => {
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
    const babyAgeInfo = babyDob ? computeBabyAgeDetails(babyDob) : null;

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
            if (event.target?.result) {
                setCropSrc(event.target.result as string);
                setShowCropModal(true);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset so onChange triggers for same file
    };

    // Avatar Cropping Mouse & Touch Events
    const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let fitW = 280;
        let fitH = 280;
        if (w > h) {
            fitH = 280;
            fitW = 280 * (w / h);
        } else {
            fitW = 280;
            fitH = 280 * (h / w);
        }
        setImgSize({ width: fitW, height: fitH });
        setCropScale(1);
        setCropOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setCropOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - cropOffset.x,
                y: e.touches[0].clientY - cropOffset.y
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        setCropOffset({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleWheelZoom = (e: React.WheelEvent) => {
        e.preventDefault();
        let newScale = cropScale - e.deltaY * 0.0015;
        newScale = Math.min(Math.max(newScale, 1), 4);
        setCropScale(newScale);
    };

    const handleExecuteCrop = () => {
        if (!cropSrc) return;

        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale_factor = 300 / 200; // Output / circle UI crop diameter
        const w_drawn = imgSize.width * cropScale * scale_factor;
        const h_drawn = imgSize.height * cropScale * scale_factor;
        const cx = 150 + cropOffset.x * scale_factor;
        const cy = 150 + cropOffset.y * scale_factor;
        const dx = cx - w_drawn / 2;
        const dy = cy - h_drawn / 2;

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 300);
            ctx.drawImage(img, dx, dy, w_drawn, h_drawn);
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatar(croppedDataUrl);
            setShowCropModal(false);
        };
        img.src = cropSrc;
    };

    // Quick switch app mode (pregnancy vs postpartum)
    const handleQuickSwitchMode = async (newMode: 'pregnancy' | 'postpartum') => {
        setAppMode(newMode);
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                ...profile,
                appMode: newMode
            }, { merge: true });
        } catch (err: any) {
            console.error("Lỗi chuyển chế độ:", err);
        }
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
                cccd,
                allergy,
                lmp,
                phoneWife,
                phoneHusband,
                address,
                avatar,
                appMode,
                babyInfo: {
                    name: babyName.trim(),
                    dob: babyDob,
                    gender: babyGender,
                    birthWeight: babyBirthWeight !== '' ? Number(babyBirthWeight) : null,
                    birthHeight: babyBirthHeight !== '' ? Number(babyBirthHeight) : null,
                    birthHeadCircumference: babyBirthHeadCircumference !== '' ? Number(babyBirthHeadCircumference) : null
                }
            }, { merge: true });
            alert("Đã lưu hồ sơ thành công!");
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

    const handleSaveSyncConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingSync(true);
        try {
            await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
                syncRole: syncRole,
                partnerUid: partnerUid.trim(),
                partnerName: partnerName.trim()
            }, { merge: true });
            alert("Đã cập nhật cấu hình đồng bộ gia đình thành công!");
        } catch (err: any) {
            alert("Lỗi khi lưu cấu hình đồng bộ: " + err.message);
        } finally {
            setIsSavingSync(false);
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

            // 6. Immunizations
            const immunizationsSnap = await getDocs(collection(db, "users", uid, "immunizations"));
            const immunizationsData = immunizationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 7. Baby Journal
            const babyJournalSnap = await getDocs(collection(db, "users", uid, "baby_journal"));
            const babyJournalData = babyJournalSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 8. Finance
            const financeSnap = await getDocs(collection(db, "users", uid, "maternity_finance"));
            const financeData = financeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 9. Health Vitals
            const healthVitalsSnap = await getDocs(collection(db, "users", uid, "health_vitals"));
            const healthVitalsData = healthVitalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 10. Baby Kicks
            const babyKicksSnap = await getDocs(collection(db, "users", uid, "baby_kicks"));
            const babyKicksData = babyKicksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const exportObj = {
                profile: profileData,
                visits: visitsData,
                photos: photosData,
                nutrition_diary: nutritionData,
                checklist_hospital: checklistData,
                immunizations: immunizationsData,
                baby_journal: babyJournalData,
                maternity_finance: financeData,
                health_vitals: healthVitalsData,
                baby_kicks: babyKicksData
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
        if (syncRole === 'partner') {
            alert("Tài khoản phụ không có quyền thực hiện khôi phục dữ liệu gốc!");
            return;
        }
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

                // 6. Import Immunizations
                if (data.immunizations && Array.isArray(data.immunizations)) {
                    const existing = await getDocs(collection(db, "users", uid, "immunizations"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.immunizations.forEach((im: any) => {
                        const { id, ...imData } = im;
                        const ref = doc(collection(db, "users", uid, "immunizations"), id || undefined);
                        batch.set(ref, imData);
                    });
                    await batch.commit();
                }

                // 7. Import Baby Journal
                if (data.baby_journal && Array.isArray(data.baby_journal)) {
                    const existing = await getDocs(collection(db, "users", uid, "baby_journal"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.baby_journal.forEach((bj: any) => {
                        const { id, ...bjData } = bj;
                        const ref = doc(collection(db, "users", uid, "baby_journal"), id || undefined);
                        batch.set(ref, bjData);
                    });
                    await batch.commit();
                }

                // 8. Import Finance
                if (data.maternity_finance && Array.isArray(data.maternity_finance)) {
                    const existing = await getDocs(collection(db, "users", uid, "maternity_finance"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.maternity_finance.forEach((fi: any) => {
                        const { id, ...fiData } = fi;
                        const ref = doc(collection(db, "users", uid, "maternity_finance"), id || undefined);
                        batch.set(ref, fiData);
                    });
                    await batch.commit();
                }

                // 9. Import Health Vitals
                if (data.health_vitals && Array.isArray(data.health_vitals)) {
                    const existing = await getDocs(collection(db, "users", uid, "health_vitals"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.health_vitals.forEach((hv: any) => {
                        const { id, ...hvData } = hv;
                        const ref = doc(collection(db, "users", uid, "health_vitals"), id || undefined);
                        batch.set(ref, hvData);
                    });
                    await batch.commit();
                }

                // 10. Import Baby Kicks
                if (data.baby_kicks && Array.isArray(data.baby_kicks)) {
                    const existing = await getDocs(collection(db, "users", uid, "baby_kicks"));
                    const clearBatch = writeBatch(db);
                    existing.docs.forEach(docSnap => clearBatch.delete(docSnap.ref));
                    await clearBatch.commit();

                    const batch = writeBatch(db);
                    data.baby_kicks.forEach((bk: any) => {
                        const { id, ...bkData } = bk;
                        const ref = doc(collection(db, "users", uid, "baby_kicks"), id || undefined);
                        batch.set(ref, bkData);
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
        if (syncRole === 'partner') {
            alert("Tài khoản phụ không có quyền thực hiện khôi phục cài đặt gốc!");
            return;
        }
        if (!user) return;
        if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này KHÔNG THỂ HOÀN TÁC!")) return;
        if (!confirm("XÁC NHẬN LẦN CUỐI: Bạn thực sự muốn xóa hết lịch sử khám, dinh dưỡng, ảnh và khôi phục cài đặt gốc?")) return;

        setIsResetting(true);
        try {
            const uid = user.uid;
            const subCollections = ["visits", "photos", "nutrition_diary", "checklist_hospital", "immunizations", "baby_journal", "maternity_finance", "health_vitals", "baby_kicks"];
            
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

    const selectableItems = MENU_DEFS.filter(i => i.id !== 'settings');

    return (
        <>
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

                /* Mode Switcher Banner */
                .mode-switcher-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 18px 20px;
                    margin-bottom: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
                }
                .mode-switcher-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    flex-shrink: 0;
                }
                .mode-btn-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    background: rgba(226, 232, 240, 0.5);
                    padding: 5px;
                    border-radius: 14px;
                }
                .mode-toggle-btn {
                    padding: 12px 14px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .mode-toggle-btn:hover {
                    color: #1e293b;
                }
                .mode-toggle-btn.active-pregnancy {
                    background: white;
                    color: #7c3aed;
                    box-shadow: 0 3px 10px rgba(124, 58, 237, 0.15);
                }
                .mode-toggle-btn.active-postpartum {
                    background: white;
                    color: #db2777;
                    box-shadow: 0 3px 10px rgba(219, 39, 119, 0.15);
                }
                @media (max-width: 500px) {
                    .mode-btn-container {
                        grid-template-columns: 1fr;
                    }
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
                .accordion-icon-box.sync { background: #d1fae5; color: #10b981; }
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
                .menu-config-card.checked.util-home { border-color: #0d9488; box-shadow: 0 4px 15px rgba(13, 148, 136, 0.08); --color-brand: #0d9488; --bg-alpha: rgba(13,148,136,0.12); }
                .menu-config-card.checked.util-dongbo { border-color: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08); --color-brand: #10b981; --bg-alpha: rgba(16,185,129,0.12); }
                .menu-config-card.checked.util-sokham { border-color: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08); --color-brand: #10b981; --bg-alpha: rgba(16,185,129,0.12); }
                .menu-config-card.checked.util-dinhduong { border-color: #f97316; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.08); --color-brand: #f97316; --bg-alpha: rgba(249,115,22,0.12); }
                .menu-config-card.checked.util-suckhoe { border-color: #06b6d4; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.08); --color-brand: #06b6d4; --bg-alpha: rgba(6,182,212,0.12); }
                .menu-config-card.checked.util-album { border-color: #8b5cf6; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.08); --color-brand: #8b5cf6; --bg-alpha: rgba(139,92,246,0.12); }
                .menu-config-card.checked.util-chuanbi { border-color: #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.08); --color-brand: #f59e0b; --bg-alpha: rgba(245,158,11,0.12); }
                .menu-config-card.checked.util-tiemchung { border-color: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08); --color-brand: #10b981; --bg-alpha: rgba(16,185,129,0.12); }
                .menu-config-card.checked.util-nhatkybe { border-color: #ec4899; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.08); --color-brand: #ec4899; --bg-alpha: rgba(236,72,153,0.12); }
                .menu-config-card.checked.util-taichinh { border-color: #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.08); --color-brand: #f59e0b; --bg-alpha: rgba(245,158,11,0.12); }
                .menu-config-card.checked.util-cudongthai { border-color: #db2777; box-shadow: 0 4px 15px rgba(219, 39, 119, 0.08); --color-brand: #db2777; --bg-alpha: rgba(219,39,119,0.12); }
                .menu-config-card.checked.util-note { border-color: #14b8a6; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.08); --color-brand: #14b8a6; --bg-alpha: rgba(20,184,166,0.12); }
                .menu-config-card.checked.util-thaigiao { border-color: #db2777; box-shadow: 0 4px 15px rgba(219, 39, 119, 0.08); --color-brand: #db2777; --bg-alpha: rgba(219,39,119,0.12); }
                .menu-config-card.checked.util-kiengky { border-color: #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.08); --color-brand: #ef4444; --bg-alpha: rgba(239,68,68,0.12); }
                .menu-config-card.checked.util-canhbao { border-color: #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.08); --color-brand: #ef4444; --bg-alpha: rgba(239,68,68,0.12); }

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
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .crop-modal-overlay {
                    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .crop-modal-content {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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
                            {/* BỘ CHUYỂN ĐỔI CHẾ ĐỘ THAI KỲ / NUÔI CON */}
                            <div className="mode-switcher-card">
                                <div className="mode-switcher-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="mode-switcher-icon">
                                            {appMode === 'postpartum' ? '👩‍🍼' : '🤰'}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#1e293b' }}>
                                                Chế độ hoạt động: {appMode === 'postpartum' ? 'Sau Sinh & Nuôi Con 👶' : 'Thai Kỳ & Mẹ Bầu 🤰'}
                                            </h4>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                                                {appMode === 'postpartum' 
                                                    ? 'Hiển thị tuổi bé theo tháng/ngày, biểu đồ tăng trưởng WHO, nhật ký bú/ngủ & tiêm chủng.'
                                                    : 'Hiển thị tuần thai, đếm ngày dự sinh, lịch khám thai & cẩm nang dinh dưỡng mẹ bầu.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mode-btn-container">
                                    <button
                                        type="button"
                                        className={`mode-toggle-btn ${appMode === 'pregnancy' ? 'active-pregnancy' : ''}`}
                                        onClick={() => handleQuickSwitchMode('pregnancy')}
                                    >
                                        🤰 Đang mang thai (Thai kỳ)
                                    </button>
                                    <button
                                        type="button"
                                        className={`mode-toggle-btn ${appMode === 'postpartum' ? 'active-postpartum' : ''}`}
                                        onClick={() => handleQuickSwitchMode('postpartum')}
                                    >
                                        👩‍🍼 Bé đã chào đời (Nuôi con)
                                    </button>
                                </div>
                            </div>

                            {/* AVATAR UPLOAD */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                                <div className="avatar-container" onClick={() => { if (syncRole !== 'partner') document.getElementById('avatar-input')?.click(); }}>
                                    {avatar ? (
                                        <img id="avatar-preview" src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar Preview" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                            <IoPerson size={32} />
                                        </div>
                                    )}
                                    {syncRole !== 'partner' && (
                                        <div className="avatar-hover-overlay">
                                            <IoImageOutline size={18} />
                                            <span>Chọn ảnh</span>
                                        </div>
                                    )}
                                </div>
                                {syncRole !== 'partner' ? (
                                    <label className="avatar-upload-label">
                                        <IoImageOutline size={15} /> Đổi ảnh đại diện
                                        <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                    </label>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Ảnh đại diện (Mẹ bầu quản lý)</span>
                                )}
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
                                <div className="input-group">
                                    <label className="text-label">Căn cước công dân (CCCD)</label>
                                    <input type="text" value={cccd} onChange={(e) => setCccd(e.target.value)} className="form-input" placeholder="Nhập số thẻ CCCD..." />
                                </div>
                                <div className="form-grid-layout">
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Năm sinh</label>
                                        <input type="number" value={yob} onChange={(e) => setYob(e.target.value)} className="form-input" placeholder="VD: 1996" />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">
                                            Nhóm máu {syncRole === 'partner' && <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800 }}>- Khóa (Chỉ tài khoản chính)</span>}
                                        </label>
                                        <input type="text" value={bloodType} onChange={(e) => handleBloodTypeInput(e.target.value)} className="form-input" placeholder="VD: O+" disabled={syncRole === 'partner'} style={{ backgroundColor: syncRole === 'partner' ? '#f1f5f9' : undefined, cursor: syncRole === 'partner' ? 'not-allowed' : undefined }} />
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
                                        <label className="text-label">
                                            Chỉ số PARA {syncRole === 'partner' && <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800 }}>- Khóa (Chỉ tài khoản chính)</span>}
                                        </label>
                                        <input type="text" value={para} onChange={(e) => handleParaInput(e.target.value)} className="form-input" placeholder="4 số, VD: 0000" disabled={syncRole === 'partner'} style={{ backgroundColor: syncRole === 'partner' ? '#f1f5f9' : undefined, cursor: syncRole === 'partner' ? 'not-allowed' : undefined }} />
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
                                    <label className="text-label">
                                        Ngày kinh cuối (LMP) {syncRole === 'partner' && <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800 }}>- Khóa (Chỉ tài khoản chính)</span>}
                                    </label>
                                    <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className="form-input" disabled={syncRole === 'partner'} style={{ backgroundColor: syncRole === 'partner' ? '#f1f5f9' : undefined, cursor: syncRole === 'partner' ? 'not-allowed' : undefined }} />
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

                            {/* PHÂN NHÓM: THÔNG TIN EM BÉ (SAU SINH & NUÔI CON) */}
                            <div className="profile-subgroup" style={{ 
                                border: appMode === 'postpartum' ? '1.5px solid #ec4899' : '1px solid #e2e8f0',
                                background: appMode === 'postpartum' ? 'rgba(253, 242, 248, 0.4)' : undefined
                            }}>
                                <div className="profile-subgroup-title" style={{ color: appMode === 'postpartum' ? '#db2777' : undefined }}>
                                    <IoHeartOutline size={16} /> Thông tin em bé {appMode === 'postpartum' && <span style={{ fontSize: '0.75rem', color: '#db2777', fontWeight: 800 }}>(Đang kích hoạt 🍼)</span>}
                                </div>
                                <div className="input-group">
                                    <label className="text-label">Tên hoặc Biệt danh của bé</label>
                                    <input 
                                        type="text" 
                                        value={babyName} 
                                        onChange={(e) => setBabyName(e.target.value)} 
                                        className="form-input" 
                                        placeholder="VD: Bé Cá Heo, Bé Dâu Tây, Nguyễn Gia Hưng..." 
                                    />
                                </div>
                                <div className="form-grid-layout">
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Ngày bé chào đời (DOB)</label>
                                        <input 
                                            type="date" 
                                            value={babyDob} 
                                            onChange={(e) => setBabyDob(e.target.value)} 
                                            className="form-input" 
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Giới tính của bé</label>
                                        <select 
                                            value={babyGender} 
                                            onChange={(e) => setBabyGender(e.target.value as any)} 
                                            className="form-input"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="girl">👧 Bé gái (Princess)</option>
                                            <option value="boy">👦 Bé trai (Prince)</option>
                                            <option value="twins">👶👶 Sinh đôi (Twins)</option>
                                        </select>
                                    </div>
                                </div>

                                {babyAgeInfo && (
                                    <div className="calculation-ticket" style={{ marginTop: '14px', background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', borderColor: '#fbcfe8' }}>
                                        <div className="ticket-section">
                                            <span className="ticket-label" style={{ color: '#be185d' }}>Tuổi của bé hiện tại</span>
                                            <strong className="ticket-val" style={{ color: '#db2777' }}>{babyAgeInfo.ageDisplay}</strong>
                                        </div>
                                        <div className="ticket-divider" style={{ backgroundColor: '#f472b6' }}></div>
                                        <div className="ticket-section">
                                            <span className="ticket-label" style={{ color: '#be185d' }}>Tổng số ngày từ lúc sinh</span>
                                            <strong className="ticket-val" style={{ color: '#db2777' }}>
                                                {babyAgeInfo.totalDays} <span className="days-label">ngày</span>
                                            </strong>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid-layout" style={{ marginTop: '14px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Cân nặng lúc sinh (gram)</label>
                                        <input 
                                            type="number" 
                                            value={babyBirthWeight} 
                                            onChange={(e) => setBabyBirthWeight(e.target.value)} 
                                            className="form-input" 
                                            placeholder="VD: 3200 (g)" 
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="text-label">Chiều dài lúc sinh (cm)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={babyBirthHeight} 
                                            onChange={(e) => setBabyBirthHeight(e.target.value)} 
                                            className="form-input" 
                                            placeholder="VD: 50 (cm)" 
                                        />
                                    </div>
                                </div>
                                <div className="input-group" style={{ marginTop: '14px', marginBottom: 0 }}>
                                    <label className="text-label">Vòng đầu lúc sinh (cm - tùy chọn)</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={babyBirthHeadCircumference} 
                                        onChange={(e) => setBabyBirthHeadCircumference(e.target.value)} 
                                        className="form-input" 
                                        placeholder="VD: 34.5 (cm)" 
                                    />
                                </div>
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
                                            {item.id === 'home' && <IoHomeOutline />}
                                            {item.id === 'dongbo' && <IoPeopleOutline />}
                                            {item.id === 'sokham' && <IoClipboardOutline />}
                                            {item.id === 'dinhduong' && <IoRestaurantOutline />}
                                            {item.id === 'suckhoe' && <IoPulseOutline />}
                                            {item.id === 'album' && <IoImagesOutline />}
                                            {item.id === 'chuanbi' && <IoBriefcaseOutline />}
                                            {item.id === 'tiemchung' && <IoMedicalOutline />}
                                            {item.id === 'nhatkybe' && <IoHeartOutline />}
                                            {item.id === 'taichinh' && <IoWalletOutline />}
                                            {item.id === 'cudongthai' && <IoFootstepsOutline />}
                                            {item.id === 'note' && <IoBookOutline />}
                                            {item.id === 'thaigiao' && <IoMusicalNotesOutline />}
                                            {item.id === 'kiengky' && <IoShieldHalfOutline />}
                                            {item.id === 'canhbao' && <IoWarningOutline />}
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
                                    className={`btn-sys-action import ${isImporting || syncRole === 'partner' ? 'disabled' : ''}`}
                                    style={{
                                        opacity: syncRole === 'partner' ? 0.5 : undefined,
                                        cursor: syncRole === 'partner' ? 'not-allowed' : undefined
                                    }}
                                >
                                    {isImporting ? <span className="btn-spinner" /> : <IoCloudUploadOutline size={16} />}
                                    {isImporting ? 'Đang nhập...' : syncRole === 'partner' ? 'Đã Khóa' : 'Chọn File'}
                                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={isImporting || syncRole === 'partner'} />
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
                                    disabled={isResetting || syncRole === 'partner'}
                                    className="btn-sys-action reset" 
                                    style={{
                                        opacity: syncRole === 'partner' ? 0.5 : undefined,
                                        cursor: syncRole === 'partner' ? 'not-allowed' : undefined
                                    }}
                                >
                                    {isResetting ? <span className="btn-spinner" /> : <IoTrashOutline size={16} />}
                                    {isResetting ? 'Đang xóa...' : syncRole === 'partner' ? 'Đã Khóa' : 'Reset App'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Crop Avatar Modal */}
        {showCropModal && (
            <div 
                className="crop-modal-overlay" 
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}
                onClick={() => setShowCropModal(false)}
            >
                <div 
                    className="crop-modal-content"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                        width: '100%',
                        maxWidth: '360px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '16px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setShowCropModal(false)}
                    >
                        <IoCloseOutline size={22} />
                    </button>

                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Cắt ảnh đại diện</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                        Kéo để di chuyển, cuộn chuột hoặc dùng thanh trượt để phóng to.
                    </p>

                    {/* Crop Container */}
                    <div 
                        style={{
                            width: '280px',
                            height: '280px',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            background: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                            touchAction: 'none'
                        }}
                        onWheel={handleWheelZoom}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {cropSrc && (
                            <img
                                id="crop-target-img"
                                src={cropSrc}
                                onLoad={handleImageLoaded}
                                alt="Crop target"
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                                    transformOrigin: 'center',
                                    marginLeft: imgSize.width ? -imgSize.width / 2 : 0,
                                    marginTop: imgSize.height ? -imgSize.height / 2 : 0,
                                    width: imgSize.width || 'auto',
                                    height: imgSize.height || 'auto',
                                    maxWidth: 'none',
                                    maxHeight: 'none',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Circular Mask Overlay */}
                        <div 
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                                borderRadius: '50%',
                                width: '200px',
                                height: '200px',
                                left: '40px',
                                top: '40px',
                                border: '2px solid rgba(255, 255, 255, 0.85)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Slider controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginTop: '20px' }}>
                        <IoRemoveOutline size={20} style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => setCropScale(prev => Math.max(prev - 0.1, 1))} />
                        <input
                            type="range"
                            min="1"
                            max="4"
                            step="0.05"
                            value={cropScale}
                            onChange={(e) => setCropScale(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                height: '4px',
                                borderRadius: '2px',
                                background: '#e2e8f0',
                                accentColor: '#e11d48',
                                cursor: 'pointer'
                            }}
                        />
                        <IoAddOutline size={20} style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => setCropScale(prev => Math.min(prev + 0.1, 4))} />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '24px' }}>
                        <button
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            onClick={() => setShowCropModal(false)}
                        >
                            Hủy
                        </button>
                        <button
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)',
                                color: 'white',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(225, 29, 72, 0.35)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 29, 72, 0.2)'}
                            onClick={handleExecuteCrop}
                        >
                            Cắt & Lưu
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
