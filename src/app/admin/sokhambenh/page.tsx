'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
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
    IoWarningOutline, IoPerson, IoSparklesOutline,
    IoFlowerOutline, IoTimeOutline, IoConstructOutline, IoScanOutline,
    IoHelpOutline, IoPersonOutline, IoDocumentTextOutline as IoDocText2,
    IoCalendarNumberOutline, IoBulbOutline, IoMedicalOutline,
    IoNotificationsOutline
} from 'react-icons/io5';
import HandbookSection from '@/components/HandbookSection';

// ─── MASTER DATA FOR SCHEDULE TAB ────────────────────────────────────────────
const CHECKUP_MILESTONES = [
    { 
        week: 8, title: "Khám thai lần đầu", 
        desc: "Siêu âm xác định 'tổ ấm' của bé và nghe nhịp tim đầu tiên.", icon: "heart",
        medDetails: {
            timeWindow: "Tuần thứ 6 - 8 (ngay sau khi chậm kinh 1-2 tuần).",
            tests: ["Siêu âm 2D xác định vị trí làm tổ và tình trạng thai.","Xét nghiệm máu cơ bản (nhóm máu, yếu tố Rh, HBV, HIV, Giang mai, kháng thể Rubella).","Xét nghiệm nước tiểu tổng phân tích để đánh giá dấu hiệu viêm nhiễm hệ tiết niệu."],
            screenings: ["Phát hiện sớm thai ngoài tử cung hoặc thai lưu.","Xác định tim thai đầu tiên và số lượng phôi thai.","Tính ngày dự sinh chính xác dựa vào kích thước chiều dài đầu mông thai nhi (CRL)."],
            preparation: "Uống nhiều nước trước khi siêu âm khoảng 30-45 phút và nhịn tiểu để làm căng bàng quang (giúp siêu âm qua ngả bụng hiển thị hình ảnh thai nhi rõ ràng hơn)."
        }
    },
    { 
        week: 12, title: "Đo độ mờ da gáy", 
        desc: "Thời điểm vàng để sàng lọc dị tật (Double Test/NIPT). Đừng bỏ lỡ!", icon: "scan",
        medDetails: {
            timeWindow: "Tuần thứ 11 đến 13 tuần 6 ngày (bắt buộc khi chiều dài đầu mông CRL đạt 45mm đến 84mm). Ngoài mốc này, da gáy sẽ xẹp và chỉ số đo không còn ý nghĩa y khoa.",
            tests: ["Siêu âm đo khoảng sáng sau gáy (độ mờ da gáy - NT).","Xét nghiệm máu Double Test sàng lọc sinh hóa (PAPP-A và Free Beta-hCG).","Xét nghiệm NIPT (Sàng lọc trước sinh không xâm lấn qua máu mẹ từ tuần thứ 9 - độ chính xác cực cao >99%)."],
            screenings: ["Tầm soát nguy cơ bất thường số lượng nhiễm sắc thể gây hội chứng Down (Trisomy 21), Edwards (Trisomy 18), Patau (Trisomy 13).","Tầm soát dị tật cấu trúc lớn sớm (thoát vị cơ hoành, dị tật tim lớn, vô sọ)."],
            preparation: "Mẹ có thể ăn uống hoàn toàn bình thường trước khi khám. Xét nghiệm Double Test và NIPT đều không yêu cầu nhịn ăn sáng."
        }
    },
    { 
        week: 16, title: "Siêu âm hình thái sớm", 
        desc: "Kiểm tra tay chân, sứt môi, hở hàm ếch. Có thể biết trai hay gái rồi nhé!", icon: "pulse",
        medDetails: {
            timeWindow: "Tuần thứ 16 đến 18.",
            tests: ["Siêu âm khảo sát hình thái học sớm của thai nhi.","Xét nghiệm Triple Test (chỉ làm nếu mẹ bầu bỏ lỡ mốc làm Double Test/NIPT ở quý 1).","Đo huyết áp và kiểm tra cân nặng của mẹ bầu."],
            screenings: ["Khảo sát các cơ quan sơ khởi: vòm sọ, cột sống, tay chân (đủ ngón), tim phổi cơ bản.","Tầm soát nguy cơ dị tật ống thần kinh (nứt đốt sống, vô sọ)."],
            preparation: "Mang đầy đủ kết quả siêu âm và xét nghiệm ở quý 1 để bác sĩ đối chiếu và đánh giá tốc độ phát triển."
        }
    },
    { 
        week: 22, title: "Siêu âm 4D hình thái", 
        desc: "Soát kỹ từng cơ quan nội tạng: tim, phổi, thận, não. Quan trọng nhất thai kỳ.", icon: "baby",
        medDetails: {
            timeWindow: "Tuần thứ 20 đến 24 (tốt nhất là ở tuần 22).",
            tests: ["Siêu âm 4D chi tiết cấu trúc (Anomalies Scan) rà soát từng bộ phận từ đỉnh đầu tới gót chân.","Đo chiều dài cổ tử cung qua siêu âm đầu dò để đánh giá nguy cơ sinh non.","Xét nghiệm nước tiểu kiểm tra protein niệu."],
            screenings: ["Phát hiện sứt môi, hở hàm ếch, sứt má, dị dạng cấu trúc tai/mắt.","Phát hiện dị tật tim bẩm sinh phức tạp (thông liên thất, thông liên nhĩ, thiểu sản tim, hẹp động mạch).","Tầm soát bất thường hệ thần kinh trung ương (giãn não thất, não úng thủy, bất sản chai) và bất thường cấu trúc thận, ruột."],
            preparation: "Nên ăn nhẹ trước khi siêu âm. Nếu bé ngủ/không chịu đổi tư thế, mẹ hãy uống một chút nước lạnh hoặc đi bộ nhẹ để đánh thức bé, hỗ trợ bác sĩ chụp được các góc hình rõ nét nhất."
        }
    },
    { 
        week: 26, title: "Tiêm uốn ván & Tiểu đường", 
        desc: "Uống nước đường 'thần thánh' để kiểm tra tiểu đường thai kỳ.", icon: "syringe",
        medDetails: {
            timeWindow: "Tuần thứ 24 đến 28.",
            tests: ["Nghiệm pháp dung nạp glucose đường uống (OGTT): lấy máu lúc đói, uống 75g glucose, lấy máu sau 1 giờ và sau 2 giờ.","Tiêm vắc-xin phòng uốn ván (VAT) mũi 1 (đối với thai sản đầu) hoặc mũi nhắc lại.","Xét nghiệm công thức máu kiểm tra huyết sắc tố."],
            screenings: ["Tầm soát đái tháo đường thai kỳ (Gestational Diabetes) - nguyên nhân hàng đầu gây tiền sản giật, đa ối, sinh khó do thai to, hạ đường huyết sơ sinh."],
            preparation: "Mẹ bắt buộc phải nhịn ăn hoàn toàn (kể cả uống sữa hay nhai kẹo, chỉ được nhấp một ít nước lọc khi quá khát) từ 8 đến 12 tiếng trước buổi sáng xét nghiệm. Hãy mang theo đồ ăn nhẹ để ăn ngay sau khi hoàn thành 3 lần lấy máu."
        }
    },
    { 
        week: 32, title: "Kiểm tra ngôi thai", 
        desc: "Xem bé đã quay đầu chưa? Đánh giá cân nặng để tiên lượng sinh thường/mổ.", icon: "weight",
        medDetails: {
            timeWindow: "Tuần thứ 30 đến 32.",
            tests: ["Siêu âm Doppler màu đánh giá dòng máu qua động mạch rốn, động mạch não giữa của bé và động mạch tử cung mẹ.","Đo huyết áp, kiểm tra nhịp tim mẹ bầu.","Xét nghiệm nước tiểu định kỳ."],
            screenings: ["Xác định ngôi thai (ngôi đầu, ngôi ngược, ngôi ngang) để định hướng phương pháp sinh.","Tầm soát suy tuần hoàn rau thai hoặc thai chậm phát triển trong tử cung (IUGR).","Đánh giá lượng nước ối (tầm soát thiểu ối/đa ối) và độ trưởng thành bánh nhau."],
            preparation: "Ghi nhớ và tập đếm cử động thai (thai máy) ít nhất 2-3 lần mỗi ngày để tự theo dõi sức khỏe của bé."
        }
    },
    { 
        week: 36, title: "Làm hồ sơ sinh", 
        desc: "Xét nghiệm liên cầu khuẩn (GBS). Chạy máy Monitor nghe tim thai.", icon: "file",
        medDetails: {
            timeWindow: "Tuần thứ 35 đến 37.",
            tests: ["Xét nghiệm quệt âm đạo và trực tràng tìm vi khuẩn Liên cầu nhóm B (GBS).","Đo tim thai và cơn co tử cung bằng máy Monitor sản khoa (Non-Stress Test - NST) khoảng 20-30 phút.","Xét nghiệm máu tổng quát làm hồ sơ sinh chuẩn bị nhập viện (đông máu, công thức máu, viêm gan B, HIV)."],
            screenings: ["Tầm soát vi khuẩn GBS - nguyên nhân hàng đầu gây viêm phổi, nhiễm trùng huyết và viêm màng não đe dọa tính mạng trẻ sơ sinh khi sinh thường qua ngả âm đạo.","Đánh giá trữ lượng oxy và sức khỏe tim thai cuối thai kỳ."],
            preparation: "Vệ sinh vùng kín sạch sẽ trước khi đi khám. Mang theo sổ theo dõi thai kỳ từ những tuần đầu tiên để làm thủ tục hồ sơ sinh tại bệnh viện."
        }
    },
    { 
        week: 38, title: "Khám hàng tuần", 
        desc: "Gặp bác sĩ thường xuyên hơn để theo dõi dấu hiệu chuyển dạ.", icon: "clock",
        medDetails: {
            timeWindow: "Tuần thứ 38 đến 39 (khám định kỳ 1 tuần/lần).",
            tests: ["Khám trong đánh giá ngôi thai bọt cổ tử cung, độ mở và độ xóa cổ tử cung.","Đo Monitor sản khoa kiểm tra tim thai và xuất hiện cơn co tử cung sinh lý.","Siêu âm kiểm tra chỉ số nước ối (AFI)."],
            screenings: ["Phát hiện suy thai cấp hoặc cạn ối âm thầm cuối thai kỳ.","Đánh giá tương xứng giữa khung chậu mẹ và kích thước thai nhi để chẩn đoán khả năng sinh thường."],
            preparation: "Giữ tinh thần thoải mái, chuẩn bị sẵn giỏ đồ đi sinh (tã, bỉm, giấy tờ cá nhân, bảo hiểm). Chú ý đếm cử động thai thường xuyên."
        }
    },
    { 
        week: 39, title: "Sẵn sàng nhập viện", 
        desc: "Tâm lý thoải mái, đồ đạc sẵn sàng. Bé có thể gõ cửa bất cứ lúc nào.", icon: "bag",
        medDetails: {
            timeWindow: "Tuần thứ 39 đến 40.",
            tests: ["Đo tim thai bằng máy Monitor.","Khám cổ tử cung đánh giá chỉ số Bishop."],
            screenings: ["Phát hiện sớm tình trạng suy bánh nhau (bánh nhau già hóa độ 3) ảnh hưởng cung cấp oxy cho bé."],
            preparation: "Theo dõi sát các cơn đau bụng co tử cung đều đặn (dưới 10 phút/cơn), ra nhớt hồng hoặc rỉ ối. Khi có các dấu hiệu này cần nhập viện ngay."
        }
    },
    { 
        week: 40, title: "Về đích", 
        desc: "Chào mừng thiên thần nhỏ! Mẹ đã làm rất tốt.", icon: "party",
        medDetails: {
            timeWindow: "Tuần thứ 40 trở đi (quá ngày dự sinh).",
            tests: ["Đo Monitor sản khoa (thường làm hàng ngày hoặc cách ngày).","Siêu âm kiểm tra chỉ số nước ối (AFI) và Doppler dây rốn."],
            screenings: ["Tầm soát suy bánh nhau cấp tính, cạn ối và hội chứng hít phân su do thai nhi thải phân su vào buồng ối khi bị ngạt."],
            preparation: "Nếu quá ngày dự sinh 5-7 ngày mà chưa chuyển dạ tự nhiên, bác sĩ sẽ khuyên mẹ nhập viện chủ động khởi phát chuyển dạ hoặc mổ lấy thai để bảo đảm an toàn tuyệt đối cho em bé."
        }
    }
];

const FETAL_DEVELOPMENT = [
    { range: "Tháng 1 (Tuần 1-4)", size: "Hạt mè tí hon", title: "Cuộc gặp gỡ định mệnh", desc: "Ba và Mẹ đã tạo ra một 'vụ nổ Big Bang' tí hon! Trứng thụ tinh đang tìm đường về tử cung để xây tổ ấm.", funFact: "Bé lúc này chỉ là một nhóm tế bào, nhưng đã mang đầy đủ mã gen quy định màu mắt và màu tóc rồi đó!" },
    { range: "Tháng 2 (Tuần 5-8)", size: "Quả việt quất", title: "Trái tim dũng cảm", desc: "Bùm... Bùm... Tim thai bắt đầu đập nhanh gấp đôi tim mẹ! Tay chân bé xíu đang nhú ra như những chồi non.", funFact: "Đuôi của bé đang dần biến mất. Bé trông bớt giống nòng nọc và giống con người hơn rồi." },
    { range: "Tháng 3 (Tuần 9-12)", size: "Quả chanh ta", title: "Bé biết làm trò", desc: "Bé đã có thể mút ngón tay, ngáp và nhăn mặt, dù mẹ chưa cảm nhận được đâu. Các ngón tay đã tách rời nhau.", funFact: "Dấu vân tay độc nhất vô nhị của bé đã bắt đầu hình thành từ tuần này!" },
    { range: "Tháng 4 (Tuần 13-16)", size: "Quả bơ sáp", title: "Thám tử lắng nghe", desc: "Thính giác phát triển mạnh. Bé có thể nghe thấy nhịp tim mẹ và cả tiếng ồn bên ngoài. Hãy nói chuyện với bé nhé!", funFact: "Nếu soi đèn pin vào bụng mẹ, bé có thể quay mặt đi để tránh ánh sáng chói đấy." },
    { range: "Tháng 5 (Tuần 17-20)", size: "Quả chuối tiêu", title: "Vũ công Hip-hop", desc: "Mẹ sẽ cảm nhận được những cú 'tung chưởng' đầu tiên (thai máy). Bé nhào lộn, uốn éo suốt ngày trong bụng mẹ.", funFact: "Một lớp sáp trắng (gây) bao phủ toàn thân giúp da bé không bị nhăn nheo khi ngâm nước ối quá lâu." },
    { range: "Tháng 6 (Tuần 21-24)", size: "Bắp ngô", title: "Luyện tập hít thở", desc: "Phổi bé đang tập hít vào thở ra (dù chỉ là nước ối) để chuẩn bị cho tiếng khóc chào đời. Vị giác đã phân biệt được mùi vị thức ăn mẹ ăn.", funFact: "Bé có thể bị nấc cụt! Mẹ sẽ thấy bụng giật giật đều đều như tiếng đồng hồ tích tắc." },
    { range: "Tháng 7 (Tuần 25-28)", size: "Quả cà tím to", title: "Đôi mắt long lanh", desc: "Bé đã mở mắt! Bé có thể chớp mắt và nhìn thấy ánh sáng mờ mờ xuyên qua thành bụng. Lớp mỡ dưới da dày lên giúp bé mũm mĩm hơn.", funFact: "Bé đã biết mơ! Những giấc mơ đầu đời diễn ra ngay trong bụng mẹ." },
    { range: "Tháng 8 (Tuần 29-32)", size: "Quả bí đỏ", title: "Xoay chuyển càn khôn", desc: "Không gian chật chội nên bé bớt nhào lộn, thay vào đó là những cú đạp và trườn mạnh mẽ. Đa số các bé sẽ quay đầu xuống dưới.", funFact: "Móng tay bé đã mọc dài, đôi khi bé tự cào xước mặt mình ngay trong bụng mẹ." },
    { range: "Tháng 9 (Tuần 33-36)", size: "Quả đu đủ xanh", title: "Luyện công nội lực", desc: "Hệ miễn dịch của mẹ đang truyền kháng thể sang cho bé. Xương sọ vẫn còn mềm để dễ dàng chui qua đường sinh.", funFact: "Lớp lông tơ rụng dần, bé nuốt chúng vào và tạo thành phân su (chất thải đầu tiên của bé)." },
    { range: "Về đích (Tuần 37-40)", size: "Quả dưa hấu", title: "Sẵn sàng ra mắt!", desc: "Bé đã đủ tháng và sẵn sàng chào đời bất cứ lúc nào. Mọi cơ quan đã hoạt động độc lập.", funFact: "Tiếng khóc chào đời của bé chính là cách phổi bung nở và bắt đầu hoạt động chính thức!" }
];

const todayStr = new Date().toISOString().split('T')[0];

export default function SoKhamBenh() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [visits, setVisits] = useState<any[]>([]);
    const searchParams = useSearchParams();
    
    // UI tabs state: 'list' | 'add' | 'weight' | 'trash' | 'schedule'
    const [activeTab, setActiveTab] = useState<'list' | 'add' | 'weight' | 'trash' | 'schedule'>(() => {
        const tab = searchParams.get('tab');
        const section = searchParams.get('section');
        return tab === 'schedule' || tab === 'journey' || tab === 'handbook' || section === 'handbook' ? 'schedule' : 'list';
    });
    
    // Schedule sub-tab
    const [scheduleSubTab, setScheduleSubTab] = useState<'checkup' | 'fetal' | 'handbook'>(() => {
        const section = searchParams.get('section');
        return section === 'handbook' ? 'handbook' : 'checkup';
    });
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 5;

    // Form inputs state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDate, setFormDate] = useState('');
    const [formClinic, setFormClinic] = useState('');
    const [formWeight, setFormWeight] = useState('');
    const [formBabyWeight, setFormBabyWeight] = useState('');
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

    const formatBabyWeightDisplay = (value: string | number | null | undefined) => {
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0) return '--';
        if (Math.abs(num) < 1) return `${Math.round(Math.abs(num) * 1000)} g`;
        return `${Number(num.toFixed(2)).toString()} kg`;
    };

    // ── SCHEDULE HELPERS ──────────────────────────────────────────────────────
    const getScheduleIcon = (iconName: string, size = 20) => {
        switch (iconName) {
            case 'heart':   return <IoPulseOutline size={size} />;
            case 'scan':    return <IoScanOutline size={size} />;
            case 'pulse':   return <IoPulseOutline size={size} />;
            case 'baby':    return <IoFlowerOutline size={size} />;
            case 'syringe': return <IoConstructOutline size={size} />;
            case 'weight':  return <IoScaleOutline size={size} />;
            case 'file':    return <IoDocumentTextOutline size={size} />;
            case 'clock':   return <IoTimeOutline size={size} />;
            case 'bag':     return <IoFlowerOutline size={size} />;
            case 'party':   return <IoFlowerOutline size={size} />;
            default:        return <IoHelpOutline size={size} />;
        }
    };

    const addToCalendar = (dateStr: string, title: string) => {
        const d = dateStr.replace(/-/g, '');
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Khám thai: ' + title)}&dates=${d}T080000/${d}T110000`);
    };

    // 1. AUTH & DATA LISTENERS
    useEffect(() => {
        let unsubVisits: (() => void) | null = null;
        let unsubProfile: (() => void) | null = null;

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                unsubProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    let targetUid = currentUser.uid;
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        if (data.height) setWtHeight(data.height);
                        if (data.weightBefore) setWtWeightBefore(data.weightBefore);
                        calculateBmiLocal(Number(data.height) || 0, Number(data.weightBefore) || 0);
                        if (data.syncRole === 'partner' && data.partnerUid) {
                            targetUid = data.partnerUid;
                        }
                    }
                    setResolvedUid(targetUid);

                    if (targetUid !== currentUser.uid) {
                        getDoc(doc(db, "users", targetUid, "settings", "profile")).then((maternalDoc) => {
                            if (maternalDoc.exists()) {
                                const maternalData = maternalDoc.data();
                                setProfile(maternalData);
                                if (maternalData.height) setWtHeight(maternalData.height);
                                if (maternalData.weightBefore) setWtWeightBefore(maternalData.weightBefore);
                                calculateBmiLocal(Number(maternalData.height) || 0, Number(maternalData.weightBefore) || 0);
                            }
                        });
                    }

                    if (unsubVisits) unsubVisits();
                    const q = query(
                        collection(db, "users", targetUid, "visits"), 
                        orderBy("date", "desc")
                    );
                    unsubVisits = onSnapshot(q, (snapshot) => {
                        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setVisits(list);
                    });
                });

                const urlParams = new URLSearchParams(window.location.search);
                const action = urlParams.get('action');
                const tab = urlParams.get('tab');
                const section = urlParams.get('section');
                if (action === 'add') {
                    setActiveTab('add');
                    setFormDate(new Date().toISOString().split('T')[0]);
                } else if (tab === 'schedule' || tab === 'journey') {
                    setActiveTab('schedule');
                    if (section === 'handbook') {
                        setScheduleSubTab('handbook');
                    }
                } else if (tab === 'handbook' || section === 'handbook') {
                    setActiveTab('schedule');
                    if (section === 'handbook' || tab === 'handbook') {
                        setScheduleSubTab('handbook');
                    }
                }
            }
        });
        return () => {
            unsubscribe();
            if (unsubVisits) unsubVisits();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    // Scroll to current milestone when schedule tab is shown
    useEffect(() => {
        if (activeTab === 'schedule' && scheduleSubTab === 'checkup') {
            setTimeout(() => {
                const current = document.querySelector('.milestone-item.current');
                if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
        }
    }, [activeTab, scheduleSubTab, profile.lmp]);

    // 2. Calculate BMI
    function calculateBmiLocal(hCm: number, wBefore: number) {
        if (hCm <= 0 || wBefore <= 0) { setBmi(null); return; }
        const hM = hCm / 100;
        const score = wBefore / (hM * hM);
        setBmi(score);
        let classification = "", recommendation = "";
        if (score < 18.5) { classification = "Thiếu cân (BMI < 18.5)"; recommendation = "Mức tăng cân khuyến nghị cho bạn: 12.5 - 18 kg. Giai đoạn 3 tháng đầu: tăng 1.5 - 2.5 kg. Giai đoạn sau: tăng khoảng 0.5 kg/tuần."; }
        else if (score < 25) { classification = "Bình thường (BMI 18.5 - 24.9)"; recommendation = "Mức tăng cân khuyến nghị cho bạn: 11.5 - 16 kg. Giai đoạn 3 tháng đầu: tăng 1 - 2 kg. Giai đoạn sau: tăng khoảng 0.4 kg/tuần."; }
        else if (score < 30) { classification = "Thừa cân (BMI 25 - 29.9)"; recommendation = "Mức tăng cân khuyến nghị cho bạn: 7 - 11.5 kg. Giai đoạn 3 tháng đầu: tăng 0.5 - 1.5 kg. Giai đoạn sau: tăng khoảng 0.3 kg/tuần."; }
        else { classification = "Béo phì (BMI >= 30)"; recommendation = "Mức tăng cân khuyến nghị cho bạn: 5 - 9 kg. Giai đoạn 3 tháng đầu: tăng 0.5 - 1 kg. Giai đoạn sau: tăng khoảng 0.2 kg/tuần."; }
        setBmiClass(classification);
        setBmiRec(recommendation);
    }

    const resetForm = () => {
        setEditingId(null);
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormClinic('');
        setFormWeight('');
        setFormBabyWeight('');
        setFormBp('');
        setFormNote('');
        setFormCost('');
        setFormNextDate('');
        setFormImages([]);
    };

    const handleEdit = (id: string) => {
        const v = visits.find(item => item.id === id);
        if (!v) return;
        setEditingId(id);
        setFormDate(v.date || '');
        setFormClinic(v.clinicName || '');
        setFormWeight(v.weight || '');
        setFormBabyWeight(v.babyWeight ? String(v.babyWeight) : '');
        setFormBp(v.bp || '');
        setFormNote(v.doctorNotes || '');
        setFormCost(v.totalCost ? formatCurrency(String(v.totalCost)) : '');
        setFormNextDate(v.nextDate || '');
        setFormImages(v.visitImages || (v.visitImage ? [v.visitImage] : []));
        setActiveTab('add');
    };

    // 3. IMAGE PROCESSING
    const triggerFileSelect = () => {
        if (formImages.length >= 2) { alert("Đã đạt giới hạn tối đa 2 ảnh/phiếu khám."); return; }
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        if (formImages.length + files.length > 2) {
            alert(`Bạn chỉ được thêm tối đa 2 ảnh. (Hiện có: ${formImages.length}, Thêm: ${files.length})`);
            return;
        }
        setUploading(true); setUploadProgress(0);
        let processedCount = 0;
        const total = files.length;
        const newImages = [...formImages];
        for (let i = 0; i < total; i++) {
            const file = files[i];
            setUploadText(`Đang xử lý ảnh ${i + 1}/${total}...`);
            try { const base64 = await processImageFile(file); newImages.push(base64); } catch (e) { console.error("Lỗi xử lý ảnh:", file.name, e); }
            processedCount++;
            setUploadProgress(Math.round((processedCount / total) * 100));
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
                    let width = img.width, height = img.height;
                    const MAX_DIM = 1024;
                    if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) { height *= MAX_DIM / width; width = MAX_DIM; }
                        else { width *= MAX_DIM / height; height = MAX_DIM; }
                    }
                    canvas.width = width; canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    let quality = 0.8;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    while (dataUrl.length > 200000 && quality > 0.3) { quality -= 0.1; dataUrl = canvas.toDataURL('image/jpeg', quality); }
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
    const parseCurrency = (val: string) => Number(val.replace(/\D/g, '')) || 0;

    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const btn = document.getElementById('btn-submit') as HTMLButtonElement;
        if (btn) btn.disabled = true;
        const data = {
            date: formDate, clinicName: formClinic, weight: formWeight,
            babyWeight: formBabyWeight ? Number(formBabyWeight) : null,
            bp: formBp, doctorNotes: formNote,
            totalCost: parseCurrency(formCost), costExam: 0, costMeds: 0, costTests: 0, costOther: 0,
            visitImages: formImages, visitImage: null, nextDate: formNextDate
        };
        try {
            const dbUid = resolvedUid || user.uid;
            let visitId = editingId;
            if (visitId) {
                await updateDoc(doc(db, "users", dbUid, "visits", visitId), { ...data, updatedAt: serverTimestamp() });
            } else {
                const docRef = await addDoc(collection(db, "users", dbUid, "visits"), { ...data, createdAt: serverTimestamp(), deletedAt: null });
                visitId = docRef.id;
            }
            if (formImages.length > 0 && visitId) {
                const note = `Phiếu khám ngày ${new Date(data.date).getDate()}/${new Date(data.date).getMonth() + 1} tại ${data.clinicName}`;
                const takenAt = new Date(data.date);
                
                let existingPhotoUrls: string[] = [];
                if (editingId) {
                    const originalVisit = visits.find(item => item.id === editingId);
                    if (originalVisit) {
                        existingPhotoUrls = originalVisit.visitImages || (originalVisit.visitImage ? [originalVisit.visitImage] : []);
                    }
                }
                const newImages = formImages.filter(img => !existingPhotoUrls.includes(img));

                if (newImages.length > 0) {
                    const photoPromises = newImages.map(imgBase64 => addDoc(collection(db, "users", dbUid, "photos"), {
                        image: imgBase64, category: albumCategory, note, takenAt,
                        createdAt: serverTimestamp(), source: 'sokhambenh', sourceId: visitId
                    }));
                    await Promise.all(photoPromises);
                }
            }
            resetForm();
            setActiveTab('list');
        } catch (err: any) {
            alert("Lỗi: " + err.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    const softDelete = async (id: string) => {
        if (confirm("Chuyển phiếu khám này vào thùng rác?")) {
            const dbUid = resolvedUid || user.uid;
            await updateDoc(doc(db, "users", dbUid, "visits", id), { deletedAt: serverTimestamp() });
        }
    };
    const restoreVisit = async (id: string) => {
        const dbUid = resolvedUid || user.uid;
        await updateDoc(doc(db, "users", dbUid, "visits", id), { deletedAt: null });
    };
    const permanentDelete = async (id: string) => {
        if (confirm("Xóa vĩnh viễn phiếu khám này? Hành động này không thể khôi phục.")) {
            const dbUid = resolvedUid || user.uid;
            await deleteDoc(doc(db, "users", dbUid, "visits", id));
        }
    };

    // 5. WEIGHT TRACKER
    const saveWeightSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (profile?.syncRole === 'partner') { alert("Tài khoản phụ không có quyền thay đổi chiều cao/cân nặng trước bầu của mẹ."); return; }
        const h = Number(wtHeight) || 0, w = Number(wtWeightBefore) || 0;
        if (h <= 0 || w <= 0) { alert("Vui lòng nhập chiều cao và cân nặng hợp lệ."); return; }
        try {
            await updateDoc(doc(db, "users", user.uid, "settings", "profile"), { height: h, weightBefore: w });
            setProfile((prev: any) => ({ ...prev, height: h, weightBefore: w }));
            calculateBmiLocal(h, w);
            alert("Đã lưu cấu hình cân nặng!");
        } catch (err: any) { alert("Lỗi lưu cấu hình: " + err.message); }
    };

    // 6. RENDER DATA CALCULATIONS
    const activeVisits = visits.filter(v => !v.deletedAt);
    const deletedVisits = visits.filter(v => v.deletedAt);
    const totalCost = activeVisits.reduce((sum, v) => sum + (Number(v.totalCost) || 0), 0);
    const totalCostStr = totalCost >= 1000000 ? (totalCost / 1000000).toFixed(1) + 'tr' : totalCost >= 1000 ? (totalCost / 1000).toFixed(0) + 'k' : totalCost.toString();
    const upcomingVisits = activeVisits.filter(v => v.nextDate && v.nextDate >= todayStr).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const nextVisitStr = upcomingVisits.length > 0 ? `${new Date(upcomingVisits[0].nextDate).getDate()}/${new Date(upcomingVisits[0].nextDate).getMonth() + 1}` : '--';

    let filteredVisits = activeVisits;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredVisits = filteredVisits.filter(v => (v.clinicName && v.clinicName.toLowerCase().includes(term)) || (v.doctorNotes && v.doctorNotes.toLowerCase().includes(term)));
    }
    const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
    const paginatedVisits = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getWeightDiff = (currentVisit: any, currentIndex: number) => {
        const curWeight = Number(currentVisit.weight);
        if (!curWeight) return null;

        let prevWeight = null;
        for (let i = currentIndex + 1; i < activeVisits.length; i++) {
            const w = Number(activeVisits[i].weight);
            if (w > 0) {
                prevWeight = w;
                break;
            }
        }

        if (prevWeight === null) {
            const wBefore = Number(profile.weightBefore);
            if (wBefore > 0) {
                prevWeight = wBefore;
            }
        }

        if (prevWeight !== null) {
            return curWeight - prevWeight;
        }
        return null;
    };

    const getBabyWeightDiff = (currentVisit: any, currentIndex: number) => {
        const curWeight = Number(currentVisit.babyWeight);
        if (!curWeight) return null;

        let prevWeight = null;
        for (let i = currentIndex + 1; i < activeVisits.length; i++) {
            const w = Number(activeVisits[i].babyWeight);
            if (w > 0) {
                prevWeight = w;
                break;
            }
        }

        if (prevWeight !== null) {
            return curWeight - prevWeight;
        }
        return null;
    };

    const formatBabyWeightDiff = (diff: number) => {
        if (diff === 0) return '±0';
        const isPositive = diff > 0;
        const absDiff = Math.abs(diff);
        
        let diffStr = '';
        if (absDiff < 1) {
            diffStr = `${Math.round(absDiff * 1000)}g`;
        } else {
            diffStr = `${absDiff.toFixed(2)}kg`;
        }
        
        return `${isPositive ? '+' : '-'}${diffStr}`;
    };

    const openVisitViewer = (images: string[], index = 0) => {
        if (images.length === 0) return;
        setViewerImages(images); setViewerIndex(index); setViewerOpen(true);
    };
    const navigateImage = (dir: number) => {
        const nextIdx = viewerIndex + dir;
        if (nextIdx >= 0 && nextIdx < viewerImages.length) setViewerIndex(nextIdx);
    };

    const weightVisits = activeVisits.filter(v => Number(v.weight) > 0).map(v => {
        const dateObj = new Date(v.date);
        let gestWeek = -1;
        if (profile.lmp) {
            const lmpDate = new Date(profile.lmp);
            gestWeek = Math.floor((dateObj.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        }
        return { id: v.id, weight: Number(v.weight), date: v.date, gestWeek };
    }).sort((a, b) => a.date.localeCompare(b.date));

    const hNum = Number(profile.height) || 0;
    const wNum = Number(profile.weightBefore) || 0;
    const showWeightChart = hNum > 0 && wNum > 0 && weightVisits.length > 0;
    const recentWeights = weightVisits.slice(-7);
    const maxChartWeight = Math.max(...recentWeights.map(v => v.weight), wNum);
    const minChartWeight = Math.min(...recentWeights.map(v => v.weight), wNum);
    const diffRange = maxChartWeight - minChartWeight > 0 ? maxChartWeight - minChartWeight : 5;

    const formatFullVnd = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDateShort = (str: string) => { if (!str) return ''; const d = new Date(str); return `${d.getDate()}/${d.getMonth() + 1}`; };

    // ── SCHEDULE CALCULATIONS ─────────────────────────────────────────────────
    const lmp = profile.lmp ? new Date(profile.lmp) : null;
    const today = new Date();
    const currentWeeks = lmp ? (today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7) : 0;
    const totalDays = lmp ? Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const weeksPart = Math.floor(totalDays / 7);
    const daysPart = totalDays % 7;
    const progressPercentage = lmp ? Math.min(Math.max((totalDays / 280) * 100, 0), 100) : 0;

    let nextMilestoneIndex = CHECKUP_MILESTONES.findIndex(m => m.week > currentWeeks);
    if (nextMilestoneIndex === -1) nextMilestoneIndex = CHECKUP_MILESTONES.length;
    const nextMilestone = CHECKUP_MILESTONES[nextMilestoneIndex] || null;
    let daysToNextCheckup: number | null = null;
    if (nextMilestone && lmp) {
        const nextMilestoneDate = new Date(lmp.getTime() + nextMilestone.week * 7 * 24 * 60 * 60 * 1000);
        daysToNextCheckup = Math.ceil((nextMilestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    let currentMonthIdx = Math.floor(currentWeeks / 4);
    if (currentMonthIdx < 0) currentMonthIdx = 0;
    if (currentMonthIdx > 9) currentMonthIdx = 9;

    return (
        <div className="fade-in sokhambenh-container utility-page-container">
            {/* Stats Dashboard (Hero Banner) */}
            <div className="stats-dashboard-p">
                <div className="medical-header-p">
                    <div>
                        <div className="medical-brand-p">
                            Sổ Tay Khám Điện Tử
                            {profile?.syncRole === 'partner' && (
                                <span style={{ fontSize: '0.72rem', background: '#22c55e', color: 'white', padding: '3px 6px', borderRadius: '10px', marginLeft: '8px', verticalAlign: 'middle' }}>
                                    Đang đồng bộ 👨‍👩‍👦
                                </span>
                            )}
                        </div>
                        <div className="patient-name-p">{profile.name || user?.displayName || 'Đang tải...'}</div>
                        <div className="patient-sub-p">
                            {profile.yob ? `NS: ${profile.yob}` : 'NS: --'} - PARA: {profile.para || '0000'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {profile.avatar ? (
                            <img src={profile.avatar} className="header-avatar-p" alt="Avatar" />
                        ) : (
                            <div className="header-avatar-p default"><IoPerson size={24} /></div>
                        )}
                        <div className="bhyt-badge-p">
                            ID: {profile.bhyt ? profile.bhyt.substring(0, 10).toUpperCase() : user?.uid ? user.uid.substring(0, 8).toUpperCase() : '--'}
                        </div>
                    </div>
                </div>
                
                {/* Progress bar - shown only when in schedule tab and has LMP */}
                {activeTab === 'schedule' && profile.lmp && (
                    <div style={{ padding: '0 20px 16px', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', opacity: 0.95 }}>
                            <span>Tuần thứ {weeksPart} ({daysPart} ngày)</span>
                            <span>Mục tiêu: Tuần 40</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', position: 'relative' }}>
                            <div style={{ height: '100%', width: `${progressPercentage}%`, background: 'white', borderRadius: '4px', position: 'relative', transition: 'width 0.5s ease-out' }}>
                                <div style={{ position: 'absolute', right: '-12px', top: '-10px', fontSize: '1.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', animation: 'float-baby 2s ease-in-out infinite' }}>👶</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, marginTop: '5px', opacity: 0.85 }}>
                            Đã hoàn thành {progressPercentage.toFixed(1)}% chặng đường
                        </div>
                    </div>
                )}

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
                <button onClick={() => { setActiveTab('list'); setCurrentPage(1); }} className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}>
                    Lịch sử
                </button>
                <button onClick={() => { resetForm(); setActiveTab('add'); }} className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}>
                    {editingId ? 'Cập nhật' : 'Ghi chép'}
                </button>
                <button onClick={() => setActiveTab('weight')} className={`tab-btn ${activeTab === 'weight' ? 'active' : ''}`}>
                    Tăng cân
                </button>
                <button onClick={() => setActiveTab('schedule')} className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}>
                    🗓 Hành trình 40 tuần
                </button>
            </div>

            {/* View 1: List view */}
            {activeTab === 'list' && (
                <div id="view-list" className="fade-in medical-split-layout-p">
                    <div className="medical-sidebar-p">
                        <div className="sidebar-sticky-p">
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
                                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>+{(weightVisits[weightVisits.length - 1].weight - wNum).toFixed(1)} kg</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="medical-main-p">
                        <div className="search-wrapper-p">
                            <input type="text" placeholder="Tìm kiếm phòng khám, ghi chú bác sĩ..." value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="search-inp-medical-p" />
                            <button className="btn-trash-medical-p" onClick={() => setActiveTab('trash')} title="Thùng rác">
                                <IoTrashOutline size={22} />
                            </button>
                        </div>
                        <div className="timeline-container-p">
                            {paginatedVisits.length === 0 ? (
                                <div className="no-visits-card-p">
                                    <IoClipboardOutline size={48} style={{ opacity: 0.3, marginBottom: '12px', color: 'var(--primary)' }} />
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>Chưa có phiếu khám nào</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sub)' }}>Bấm Ghi chép ở trên để ghi lại lịch sử theo dõi thai kỳ của mẹ.</p>
                                </div>
                            ) : (
                                paginatedVisits.map((v) => {
                                    const dateObj = new Date(v.date);
                                    const images = v.visitImages || (v.visitImage ? [v.visitImage] : []);
                                    const activeIdx = activeVisits.findIndex(item => item.id === v.id);
                                    const weightDiff = getWeightDiff(v, activeIdx);
                                    const babyWeightDiff = getBabyWeightDiff(v, activeIdx);
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
                                                    <button onClick={() => handleEdit(v.id)} className="btn-action-edit-p" title="Sửa"><IoPencilOutline size={16} /></button>
                                                    <button onClick={() => softDelete(v.id)} className="btn-action-delete-p" title="Xóa"><IoTrashOutline size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="card-body-row-p">
                                                {images.length > 0 && (
                                                    <div className="visit-image-container-p">
                                                        {images.map((imgSrc: string, imgIdx: number) => (
                                                            <div className="visit-image-thumb-p" key={imgIdx} onClick={() => openVisitViewer(images, imgIdx)}>
                                                                <img src={imgSrc} alt="Đính kèm" />
                                                                <div className="img-overlay-p"><IoEyeOutline size={20} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {(v.weight || v.bp) && (
                                                    <div className="stats-mini-grid-p">
                                                        {v.weight && (
                                                            <div className="stat-mini-p bg-weight-p" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <IoScaleOutline size={14} /> 
                                                                <span>{v.weight}kg</span>
                                                                {weightDiff !== null && (
                                                                    <span style={{ 
                                                                        fontSize: '0.72rem', 
                                                                        fontWeight: 'bold', 
                                                                        marginLeft: '4px',
                                                                        color: weightDiff > 0 ? '#10b981' : weightDiff < 0 ? '#ef4444' : '#64748b'
                                                                    }}>
                                                                        {weightDiff > 0 ? `(+${weightDiff.toFixed(1)})` : weightDiff < 0 ? `(-${Math.abs(weightDiff).toFixed(1)})` : `(±0)`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {v.bp && <div className="stat-mini-p bg-bp-p"><IoPulseOutline size={14} /> Huyết áp: {v.bp}</div>}
                                                    </div>
                                                )}
                                                {v.doctorNotes && (
                                                    <div className="doctor-note-p">
                                                        <IoDocumentTextOutline size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                        <div>{v.doctorNotes}</div>
                                                    </div>
                                                )}
                                                {v.babyWeight && (
                                                    <div className="stats-mini-grid-p" style={{ marginBottom: '12px' }}>
                                                        <div className="stat-mini-p bg-baby-weight-p" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <IoSparklesOutline size={14} /> 
                                                            <span>Bé: {formatBabyWeightDisplay(v.babyWeight)}</span>
                                                            {babyWeightDiff !== null && (
                                                                <span style={{ 
                                                                    fontSize: '0.72rem', 
                                                                    fontWeight: 'bold', 
                                                                    marginLeft: '4px',
                                                                    color: babyWeightDiff > 0 ? '#10b981' : babyWeightDiff < 0 ? '#ef4444' : '#64748b'
                                                                }}>
                                                                    ({formatBabyWeightDiff(babyWeightDiff)})
                                                                </span>
                                                            )}
                                                        </div>
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
                                                    <div className="cost-tag-p"><IoWalletOutline size={16} /> Chi phí: {formatFullVnd(v.totalCost)}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="pagination-box-p">
                                {currentPage > 1 && <button onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0, 0); }} className="pagination-btn-p"><IoChevronBackOutline /></button>}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => (
                                    <button key={i} onClick={() => { setCurrentPage(i); window.scrollTo(0, 0); }} className={`pagination-btn-p ${i === currentPage ? 'active' : ''}`}>{i}</button>
                                ))}
                                {currentPage < totalPages && <button onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0, 0); }} className="pagination-btn-p"><IoChevronForwardOutline /></button>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View 2: Add/Edit Form */}
            {activeTab === 'add' && (
                <div id="view-add" className="fade-in add-form-container-p">
                    <h2 className="form-heading-p">{editingId ? 'Cập nhật phiếu khám' : 'Thêm lần khám thai'}</h2>
                    <form onSubmit={handleSaveVisit} className="medical-form-p">
                        <div className="form-row-p">
                            <div className="simple-input-box-p">
                                <label>Ngày khám *</label>
                                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                            </div>
                            <div className="simple-input-box-p">
                                <label>Nơi khám / Bác sĩ khám *</label>
                                <input type="text" value={formClinic} onChange={(e) => setFormClinic(e.target.value)} placeholder="VD: BV Phụ sản - BS. Hùng..." required />
                            </div>
                        </div>
                        <div className="form-row-p">
                            <div className="simple-input-box-p">
                                <label>Cân nặng mẹ bầu (kg)</label>
                                <input type="number" step="0.01" inputMode="decimal" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="0.0" />
                            </div>
                            <div className="simple-input-box-p">
                                <label>Cân nặng thai nhi (kg)</label>
                                <input type="number" step="0.01" value={formBabyWeight} onChange={(e) => setFormBabyWeight(e.target.value)} placeholder="VD: 1.04" />
                            </div>
                        </div>
                        <div className="form-row-p">
                            <div className="simple-input-box-p">
                                <label>Huyết áp của mẹ</label>
                                <input type="text" value={formBp} onChange={(e) => setFormBp(e.target.value)} placeholder="120/80" />
                            </div>
                        </div>
                        <div className="simple-input-box-p">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IoDocumentTextOutline /> Chẩn đoán & Ghi chú của bác sĩ
                            </label>
                            <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} rows={3} placeholder="Ghi nhận tình hình thai nhi, lời dặn dò của bác sĩ..." />
                        </div>
                        <div className="form-upload-box-p">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                    <IoCameraOutline size={18} /> Đính kèm hình ảnh (Đơn thuốc/Siêu âm - Tối đa 2)
                                </label>
                                <select value={albumCategory} onChange={(e) => setAlbumCategory(e.target.value)} className="upload-select-p">
                                    <option value="don-thuoc">Đơn thuốc</option>
                                    <option value="sieu-am">Siêu âm</option>
                                    <option value="khac">Khác</option>
                                </select>
                            </div>
                            <div className="upload-area-p" onClick={triggerFileSelect}>
                                + Nhấn hoặc kéo thả ảnh vào đây để tải lên
                            </div>
                            <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
                            {formImages.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div className="form-img-grid-p">
                                        {formImages.map((src, idx) => (
                                            <div className="form-thumb-item-p" key={idx}>
                                                <img src={src} alt="Thumb" onClick={() => openVisitViewer(formImages, idx)} />
                                                <button type="button" className="btn-remove-thumb-p" onClick={() => removeImageAtIndex(idx)}><IoCloseOutline size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-row-p">
                            <div className="simple-input-box-p cost-input-box-p">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoWalletOutline /> Tổng chi phí đợt khám (VNĐ)</label>
                                <input type="text" inputMode="numeric" value={formCost} onChange={(e) => setFormCost(formatCurrency(e.target.value))} placeholder="0" />
                            </div>
                            <div className="simple-input-box-p next-date-input-box-p">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoCalendarOutline /> Lịch hẹn tái khám lần sau</label>
                                <input type="date" value={formNextDate} onChange={(e) => setFormNextDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-actions-p">
                            <button type="button" onClick={() => { resetForm(); setActiveTab('list'); }} className="btn-cancel-p">Hủy bỏ</button>
                            <button type="submit" id="btn-submit" className="btn-save-p">
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
                        <button onClick={() => setActiveTab('list')} className="btn-cancel-p" style={{ margin: 0, width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>Quay lại</button>
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
                                        <button onClick={() => restoreVisit(v.id)} className="btn-restore-p">Khôi phục</button>
                                        <button onClick={() => permanentDelete(v.id)} className="btn-perm-delete-p">Xóa vĩnh viễn</button>
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
                    <div className="medical-sidebar-p">
                        <div className="sidebar-card-p bmi-config-card-p">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoScaleOutline size={20} style={{ color: 'var(--primary)' }} /> Chỉ số cơ thể trước bầu
                            </h3>
                            <form onSubmit={saveWeightSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="simple-input-box-p">
                                    <span className="input-label-mini-p">Chiều cao (cm)</span>
                                    <input type="number" value={wtHeight}
                                        onChange={(e) => { setWtHeight(e.target.value); calculateBmiLocal(Number(e.target.value), Number(wtWeightBefore)); }}
                                        placeholder="VD: 158" required disabled={profile?.syncRole === 'partner'}
                                        style={{ backgroundColor: profile?.syncRole === 'partner' ? '#f1f5f9' : undefined }} />
                                </div>
                                <div className="simple-input-box-p">
                                    <span className="input-label-mini-p">Cân nặng trước bầu (kg)</span>
                                    <input type="number" step="0.1" value={wtWeightBefore}
                                        onChange={(e) => { setWtWeightBefore(e.target.value); calculateBmiLocal(Number(wtHeight), Number(e.target.value)); }}
                                        placeholder="VD: 50" required disabled={profile?.syncRole === 'partner'}
                                        style={{ backgroundColor: profile?.syncRole === 'partner' ? '#f1f5f9' : undefined }} />
                                </div>
                                {bmi !== null && (
                                    <div className="bmi-result-panel-p">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>
                                                    BMI Trước Bầu: <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary)' }}>{bmi.toFixed(1)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>{bmiClass}</div>
                                            </div>
                                            <button type="submit" className="btn-save-p"
                                                style={{ width: 'auto', padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px', margin: 0, opacity: profile?.syncRole === 'partner' ? 0.6 : 1 }}
                                                disabled={profile?.syncRole === 'partner'}>
                                                {profile?.syncRole === 'partner' ? 'Đã Khóa' : 'Lưu cấu hình'}
                                            </button>
                                        </div>
                                        <div className="bmi-recommendation-p" dangerouslySetInnerHTML={{ __html: bmiRec }} />
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                    <div className="medical-main-p">
                        <div className="chart-card-p">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoTrendingUpOutline size={20} style={{ color: 'var(--accent)' }} /> Biểu đồ tăng cân qua các lần khám
                            </h3>
                            {!showWeightChart ? (
                                <div className="no-chart-data-p">
                                    <IoWarningOutline size={36} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                                    <p>Vui lòng nhập chiều cao, cân nặng trước bầu ở cột bên và có ít nhất 1 lần khám bệnh có ghi nhận cân nặng của mẹ bầu để hiển thị biểu đồ.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="chart-bars-wrap-p">
                                        {recentWeights.map((wVal) => {
                                            const gain = wVal.weight - wNum;
                                            const pct = Math.max(((wVal.weight - minChartWeight) / diffRange) * 70 + 15, 15);
                                            let statusColor = '#3b82f6', statusClass = 'normal';
                                            if (wVal.gestWeek >= 0) {
                                                let minTarget = 0, maxTarget = 0;
                                                const w = wVal.gestWeek;
                                                if (bmi! < 18.5) { minTarget = w <= 13 ? (w / 13) * 1.5 : 1.5 + (w - 13) * 0.5; maxTarget = w <= 13 ? (w / 13) * 2.5 : 2.5 + (w - 13) * 0.5; }
                                                else if (bmi! < 25) { minTarget = w <= 13 ? (w / 13) * 1.0 : 1.0 + (w - 13) * 0.4; maxTarget = w <= 13 ? (w / 13) * 2.0 : 2.0 + (w - 13) * 0.4; }
                                                else if (bmi! < 30) { minTarget = w <= 13 ? (w / 13) * 0.5 : 0.5 + (w - 13) * 0.3; maxTarget = w <= 13 ? (w / 13) * 1.5 : 1.5 + (w - 13) * 0.3; }
                                                else { minTarget = w <= 13 ? (w / 13) * 0.5 : 0.5 + (w - 13) * 0.2; maxTarget = w <= 13 ? (w / 13) * 1.0 : 1.0 + (w - 13) * 0.2; }
                                                if (gain < minTarget) { statusColor = '#f59e0b'; statusClass = 'low'; }
                                                else if (gain > maxTarget) { statusColor = '#ef4444'; statusClass = 'high'; }
                                                else { statusColor = '#10b981'; statusClass = 'normal'; }
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
                                                    <span className="chart-bar-lbl-p">{wVal.gestWeek >= 0 ? `Tuần ${wVal.gestWeek}` : formatDateShort(wVal.date)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="weight-history-section-p">
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>Nhật ký số cân qua từng đợt khám:</h4>
                                        <div className="weight-history-list-p">
                                            {weightVisits.slice().reverse().map((wVal) => {
                                                const gain = wVal.weight - wNum;
                                                return (
                                                    <div key={wVal.id} className="weight-history-item-p">
                                                        <div>
                                                            <span className="weight-week-title-p">{wVal.gestWeek >= 0 ? `Tuần thứ ${wVal.gestWeek}` : formatDateShort(wVal.date)}</span>
                                                            <span className="weight-date-lbl-p">({new Date(wVal.date).toLocaleDateString('vi-VN')})</span>
                                                        </div>
                                                        <div className="weight-gain-val-p">{wVal.weight} kg <span className="gain-sub-p">(+{gain.toFixed(1)}kg)</span></div>
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

            {/* View 5: Hành trình 40 tuần */}
            {activeTab === 'schedule' && (
                <div id="view-schedule" className="fade-in">
                    {!profile.lmp ? (
                        /* No LMP state */
                        <div className="card-glass-fallback-p" style={{ textAlign: 'center', padding: '40px 24px' }}>
                            <div style={{ background: '#f3e8ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#8b5cf6' }}>
                                <IoCalendarNumberOutline size={32} />
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>Thiếu thông tin ngày kinh cuối</h4>
                            <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                                Mẹ chưa nhập <b>Ngày kinh cuối (LMP)</b> nên chưa thể tính toán mốc thai kỳ chính xác.
                            </p>
                            <a href="/admin/settings" className="btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px', borderRadius: '12px', background: '#8b5cf6', color: 'white', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.25)' }}>
                                Cập nhật hồ sơ ngay
                            </a>
                        </div>
                    ) : (
                        <>
                            {/* Sub-tab switcher */}
                            <div className="segmented-control-lk">
                                <button onClick={() => setScheduleSubTab('checkup')} className={`segment-btn-lk ${scheduleSubTab === 'checkup' ? 'active' : ''}`}>
                                    📋 Mốc khám thai
                                </button>
                                <button onClick={() => setScheduleSubTab('fetal')} className={`segment-btn-lk ${scheduleSubTab === 'fetal' ? 'active' : ''}`}>
                                    🌱 Bé phát triển
                                </button>
                                <button onClick={() => setScheduleSubTab('handbook')} className={`segment-btn-lk ${scheduleSubTab === 'handbook' ? 'active' : ''}`}>
                                    📘 Cẩm nang
                                </button>
                            </div>

                            {/* Sub-view: Checkup Timeline */}
                            {scheduleSubTab === 'checkup' && (
                                <div className="checkup-layout-p">
                                    {/* Sidebar */}
                                    <div className="pregnancy-sidebar-p">
                                        <div className="sidebar-card-lk">
                                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <IoFlowerOutline style={{ color: '#8b5cf6' }} /> Chặng đường hôm nay
                                            </h3>
                                            <div className="circular-progress-box-p">
                                                <div className="circle-svg-wrap">
                                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                                        <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                                        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#purpleGrad)" strokeWidth="8"
                                                            strokeDasharray="314"
                                                            strokeDashoffset={314 - (314 * progressPercentage) / 100}
                                                            strokeLinecap="round"
                                                            transform="rotate(-90 60 60)" />
                                                        <defs>
                                                            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                                <stop offset="100%" stopColor="#f472b6" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                    <div className="circle-text-p">
                                                        <span className="percent-val">{progressPercentage.toFixed(0)}%</span>
                                                        <span className="percent-lbl">hoàn thành</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 700 }}>Mẹ đang ở tuần:</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>
                                                    {weeksPart > 0 ? `${weeksPart} tuần ${daysPart} ngày` : `${daysPart} ngày`}
                                                </div>
                                            </div>
                                            {nextMilestone && (
                                                <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(139, 92, 246, 0.06)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mốc khám tiếp theo</div>
                                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        {getScheduleIcon(nextMilestone.icon, 16)} {nextMilestone.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', marginTop: '4px', lineHeight: 1.4 }}>
                                                        Tuần {nextMilestone.week} ({nextMilestone.desc})
                                                    </div>
                                                    {daysToNextCheckup !== null && (
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <IoTimeOutline />
                                                            {daysToNextCheckup > 0 ? `Còn khoảng ${daysToNextCheckup} ngày` : daysToNextCheckup === 0 ? 'Hôm nay đến lịch hẹn!' : 'Đã qua lịch hẹn'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="timeline-main-p" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {CHECKUP_MILESTONES.map((m, index) => {
                                            const dateOfMilestone = new Date(lmp!.getTime() + m.week * 7 * 24 * 60 * 60 * 1000);
                                            const dateStr = `${dateOfMilestone.getDate()}/${dateOfMilestone.getMonth() + 1}/${dateOfMilestone.getFullYear()}`;
                                            const isPast = index < nextMilestoneIndex;
                                            const isCurrent = index === nextMilestoneIndex;
                                            const statusClass = isPast ? 'past' : isCurrent ? 'current' : 'future';
                                            return (
                                                <div className={`milestone-item ${statusClass}`} key={index} style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                                                        {isPast && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', border: '3px solid white', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, color: 'white' }}><IoCheckmarkCircleOutline size={14} /></div>}
                                                        {isCurrent && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8b5cf6', border: '3px solid white', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#8b5cf6', animation: 'pulse-ring-lk 2s infinite' }} /></div>}
                                                        {!isPast && !isCurrent && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', border: '3px solid white', boxShadow: 'var(--shadow-soft)', zIndex: 2 }} />}
                                                        <div style={{ flex: 1, width: '2px', background: '#e2e8f0', marginTop: '5px', display: index === CHECKUP_MILESTONES.length - 1 ? 'none' : 'block' }} />
                                                    </div>
                                                    <div style={{ flex: 1, padding: '18px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '20px', opacity: isPast ? 0.82 : 1, border: isCurrent ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.5)', transform: isCurrent ? 'translateX(3px)' : 'none', boxShadow: isCurrent ? '0 10px 30px rgba(139, 92, 246, 0.15)' : 'var(--shadow-soft)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                                            <span style={{ background: isCurrent ? '#8b5cf6' : 'rgba(148, 163, 184, 0.1)', color: isCurrent ? 'white' : 'var(--text-main)', fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>Tuần {m.week}</span>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sub)' }}>{dateStr}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                            <span style={{ color: isCurrent ? '#8b5cf6' : 'var(--text-sub)', display: 'inline-flex' }}>{getScheduleIcon(m.icon)}</span>
                                                            {m.title}
                                                            {isCurrent && <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 800, marginLeft: '6px', background: '#fff7ed', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.15)' }}>Sắp tới</span>}
                                                        </div>
                                                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, margin: '0 0 12px 0', textAlign: 'justify' }}>{m.desc}</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px dashed rgba(148, 163, 184, 0.15)', paddingTop: '12px' }}>
                                                            <button type="button" onClick={() => setSelectedMilestone(m)}
                                                                style={{ margin: 0, fontSize: '0.78rem', padding: '8px 14px', background: '#e0f2fe', color: '#0369a1', border: '1px solid rgba(2, 132, 199, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                                                <IoMedicalOutline size={14} /> Chi tiết y khoa
                                                            </button>
                                                            {isCurrent && (
                                                                <button type="button" onClick={() => addToCalendar(dateOfMilestone.toISOString().split('T')[0], m.title)}
                                                                    style={{ margin: 0, fontSize: '0.78rem', padding: '8px 14px', background: '#fff7ed', color: '#c2410c', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                                                    <IoNotificationsOutline size={14} /> Nhắc trên Lịch
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sub-view: Fetal Development */}
                            {scheduleSubTab === 'fetal' && (
                                <div id="view-fetal" className="fetal-grid-lk fade-in">
                                    {FETAL_DEVELOPMENT.map((item, index) => {
                                        const isCurrent = index === currentMonthIdx;
                                        const colors = ['#f472b6','#38bdf8','#a78bfa','#facc15','#4ade80','#fb923c','#f87171','#c084fc','#2dd4bf','#fb7185'];
                                        const accentColor = colors[index % colors.length];
                                        return (
                                            <div key={index} style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: isCurrent ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.5)', position: 'relative', overflow: 'hidden', boxShadow: isCurrent ? `0 12px 30px ${accentColor}25` : 'var(--shadow-soft)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                {isCurrent && <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${accentColor} 0%, #ea580c 100%)`, color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '6px 12px', borderBottomLeftRadius: '16px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bé đang ở đây!</div>}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div style={{ background: `${accentColor}12`, color: accentColor, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '5px 12px', borderRadius: '8px' }}>{item.range}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Bằng: <b style={{ color: accentColor }}>{item.size}</b></div>
                                                </div>
                                                <h3 style={{ color: accentColor, fontSize: '1.2rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>{item.title}</h3>
                                                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: '0 0 14px 0', textAlign: 'justify' }}>{item.desc}</p>
                                                <div style={{ background: '#fffbeb', border: '1.5px dashed #fde047', padding: '12px 14px', borderRadius: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.88rem', color: '#854d0e', lineHeight: 1.55 }}>
                                                    <IoBulbOutline size={18} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px', animation: 'pulse-bulb 1.5s infinite alternate' }} />
                                                    <span><b>Bí mật:</b> {item.funFact}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {scheduleSubTab === 'handbook' && (
                                <HandbookSection profile={profile} />
                            )}

                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '30px', lineHeight: 1.6, paddingBottom: '20px' }}>
                                Tham khảo nguồn y khoa từ: <a href="https://www.vinmec.com/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Vinmec</a> • <a href="https://tamanhhospital.vn/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Tâm Anh</a> • <a href="https://medlatec.vn/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 600 }}>Medlatec</a>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Image Viewer Lightbox Modal */}
            {viewerOpen && (
                <div id="image-viewer-modal" className="modal open" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, alignItems: 'center', justifyContent: 'center' }}>
                    <button className="modal-close" onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <IoCloseOutline size={24} />
                    </button>
                    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {viewerIndex > 0 && <button onClick={() => navigateImage(-1)} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IoChevronBackOutline size={24} /></button>}
                        <img src={viewerImages[viewerIndex]} style={{ maxWidth: '90%', maxHeight: '85%', objectFit: 'contain' }} alt="Phóng to" />
                        {viewerIndex < viewerImages.length - 1 && <button onClick={() => navigateImage(1)} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IoChevronForwardOutline size={24} /></button>}
                        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {viewerIndex + 1} / {viewerImages.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading Progress Modal */}
            {uploading && (
                <div id="upload-progress-modal" className="modal open" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3100, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 800 }}>{uploadText}</h3>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '15px 0 10px 0' }}>
                            <div style={{ height: '100%', background: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{uploadProgress}%</span>
                    </div>
                </div>
            )}

            {/* Medical Detail Modal (Portal) - for schedule milestones */}
            {selectedMilestone && typeof window !== 'undefined' && createPortal(
                <div className="lk-modal-overlay" onClick={() => setSelectedMilestone(null)}>
                    <div className="lk-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="lk-modal-header">
                            <div>
                                <span className="lk-modal-subtitle">Thông tin Y khoa chuẩn • Tuần {selectedMilestone.week}</span>
                                <h3 className="lk-modal-title">{selectedMilestone.title}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedMilestone(null)} className="lk-close-btn" aria-label="Đóng">
                                <IoCloseOutline size={22} />
                            </button>
                        </div>
                        <div className="lk-modal-body custom-scrollbar-lk">
                            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                                    <IoBulbOutline size={18} /> <span>Tóm tắt chỉ định</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#4c1d95', lineHeight: 1.55 }}>{selectedMilestone.desc}</p>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>📅 Thời điểm lý tưởng thực hiện</h4>
                                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>{selectedMilestone.medDetails.timeWindow}</p>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>🧪 Các chỉ định & Xét nghiệm y khoa</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                                    {selectedMilestone.medDetails.tests.map((t: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>{t}</li>)}
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>🎯 Mục tiêu tầm soát dị tật & Bệnh lý</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                                    {selectedMilestone.medDetails.screenings.map((s: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                                </ul>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>⚠️ Khuyến nghị chuẩn bị từ Bác sĩ</h4>
                                <p style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '12px 14px', borderRadius: '12px', fontSize: '0.82rem', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>
                                    {selectedMilestone.medDetails.preparation}
                                </p>
                            </div>
                        </div>
                        <div className="lk-modal-footer">
                            <button type="button" onClick={() => setSelectedMilestone(null)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 700, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                                Đóng hướng dẫn
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx global>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.5); }
                    70% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
                }
                @keyframes pulse-ring-lk {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.5); }
                    70% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                }
                @keyframes pulse-bulb {
                    from { opacity: 0.8; transform: scale(1); }
                    to { opacity: 1; transform: scale(1.15); }
                }
                @keyframes float-baby {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                    100% { transform: translateY(0); }
                }
                @keyframes zoomIn {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes slideUpModal {
                    0% { transform: translateY(100%); }
                    100% { transform: translateY(0); }
                }

                /* ── SOKHAMBENH BASE STYLES ─────────────────────────── */
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
                .medical-brand-p { font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: 0.5px; margin-bottom: 4px; }
                .patient-name-p { font-size: 1.25rem; font-weight: 900; color: white; letter-spacing: -0.3px; }
                .patient-sub-p { font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 4px; font-weight: 500; }
                .header-avatar-p { width: 56px; height: 56px; border-radius: 16px; object-fit: cover; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                .header-avatar-p.default { background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; }
                .bhyt-badge-p { background: rgba(255,255,255,0.15); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 800; margin-top: 6px; border: 1px solid rgba(255,255,255,0.2); display: inline-block; }
                .medical-stats-p { display: grid; grid-template-columns: repeat(3, 1fr); padding: 16px 0; background: rgba(255,255,255,0.05); }
                .stat-box-p { text-align: center; position: relative; }
                .stat-box-p:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 15%; height: 70%; width: 1px; background: rgba(255,255,255,0.15); }
                .stat-val-p { font-size: 1.15rem; font-weight: 900; color: white; }
                .stat-val-p.checkup-blue { color: #bae6fd; }
                .stat-val-p.cost-red { color: #fca5a5; }
                .stat-lbl-p { font-size: 0.65rem; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: 800; margin-top: 2px; letter-spacing: 0.3px; }

                /* Tabs */
                .tab-switch { display: flex; background: rgba(148,163,184,0.08); border-radius: 16px; padding: 4px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
                .tab-btn { flex: 1; padding: 12px; border: none; background: transparent; border-radius: 12px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; font-size: 0.82rem; display: inline-flex; align-items: center; justify-content: center; }
                .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

                /* Layout */
                .medical-split-layout-p { display: flex; flex-direction: column; gap: 24px; }
                .sidebar-overview-card-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 20px; padding: 16px; box-shadow: var(--shadow-soft); margin-bottom: 24px; }

                /* Search & Lists */
                .search-wrapper-p { position: relative; margin-bottom: 20px; display: flex; gap: 12px; }
                .search-inp-medical-p { flex: 1; padding: 14px 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.5); background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-size: 0.95rem; color: var(--text-main); outline: none; box-shadow: var(--shadow-soft); transition: all 0.25s; }
                .search-inp-medical-p:focus { background: rgba(255,255,255,0.85); border-color: var(--primary); box-shadow: 0 0 0 4px rgba(13,148,136,0.1); }
                .btn-trash-medical-p { background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 16px; width: 52px; display: flex; align-items: center; justify-content: center; color: #94a3b8; cursor: pointer; box-shadow: var(--shadow-soft); transition: all 0.2s; }
                .btn-trash-medical-p:hover { color: #ef4444; background: rgba(254,242,242,0.8); border-color: rgba(239,68,68,0.2); }
                .timeline-container-p { display: flex; flex-direction: column; gap: 18px; }
                .no-visits-card-p { text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; box-shadow: var(--shadow-soft); }
                .timeline-item-p { border-radius: 24px; border: 1px solid rgba(255,255,255,0.5); background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: var(--shadow-soft); overflow: hidden; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
                .timeline-item-p:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); }
                .card-header-row-p { display: flex; gap: 16px; padding: 16px 20px; align-items: center; border-bottom: 1px dashed rgba(226,232,240,0.8); }
                .date-badge-p { background: var(--primary-light); color: var(--primary-dark); padding: 8px 12px; border-radius: 14px; text-align: center; min-width: 56px; }
                .d-p { display: block; font-size: 1.25rem; font-weight: 900; line-height: 1; }
                .m-p { display: block; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; opacity: 0.95; margin-top: 2px; }
                .clinic-info-p { flex: 1; }
                .clinic-name-p { font-weight: 800; font-size: 1.05rem; color: var(--text-main); line-height: 1.35; }
                .visit-year-p { font-size: 0.78rem; color: var(--text-sub); font-weight: 600; margin-top: 2px; }
                .card-actions-p { display: flex; gap: 8px; }
                .btn-action-edit-p, .btn-action-delete-p { border: none; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .btn-action-edit-p { background: rgba(148,163,184,0.1); color: #64748b; }
                .btn-action-edit-p:hover { background: rgba(13,148,136,0.1); color: var(--primary); }
                .btn-action-delete-p { background: rgba(239,68,68,0.08); color: #ef4444; }
                .btn-action-delete-p:hover { background: #ef4444; color: white; }
                .card-body-row-p { padding: 16px 20px; }
                .visit-image-container-p { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px; }
                .visit-image-thumb-p { height: 130px; border-radius: 14px; overflow: hidden; position: relative; cursor: pointer; border: 1px solid rgba(226,232,240,0.8); }
                .visit-image-thumb-p img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
                .visit-image-thumb-p:hover img { transform: scale(1.06); }
                .img-overlay-p { position: absolute; inset: 0; background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.25s; }
                .visit-image-thumb-p:hover .img-overlay-p { opacity: 1; }
                .stats-mini-grid-p { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
                .stat-mini-p { padding: 6px 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(226,232,240,0.8); }
                .stat-mini-p.bg-weight-p { background: rgba(13,148,136,0.06); color: var(--primary-dark); }
                .stat-mini-p.bg-bp-p { background: rgba(239,68,68,0.05); color: #dc2626; }
                .stat-mini-p.bg-baby-weight-p { background: rgba(168,85,247,0.08); color: #7c3aed; }
                .doctor-note-p { color: #334155; font-size: 0.9rem; line-height: 1.55; background: rgba(254,252,232,0.6); padding: 12px 16px; border-radius: 14px; border-left: 4.5px solid #fcd34d; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
                .next-appoint-p { font-size: 0.85rem; color: #0284c7; background: #e0f2fe; padding: 8px 12px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; }
                .card-footer-row-p { background: linear-gradient(to bottom, transparent, rgba(248,250,252,0.4)); padding: 12px 20px 16px 20px; border-top: 1px solid rgba(226,232,240,0.6); display: flex; justify-content: space-between; align-items: center; }
                .cost-tag-p { color: #ef4444; font-weight: 800; font-size: 0.92rem; display: flex; align-items: center; gap: 6px; }
                .pagination-box-p { display: flex; justify-content: center; gap: 8px; margin-top: 24px; margin-bottom: 12px; }
                .pagination-btn-p { width: 38px; height: 38px; border-radius: 12px; border: 1px solid rgba(226,232,240,0.8); background: white; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; transition: all 0.2s; }
                .pagination-btn-p:hover { border-color: var(--primary); color: var(--primary); }
                .pagination-btn-p.active { background: var(--primary); color: white; border-color: var(--primary); }

                /* Forms */
                .add-form-container-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 24px; box-shadow: var(--shadow-soft); }
                .form-heading-p { font-weight: 900; font-size: 1.35rem; margin-top: 0; margin-bottom: 20px; color: var(--text-main); letter-spacing: -0.3px; }
                .medical-form-p { display: flex; flex-direction: column; gap: 16px; }
                .form-row-p { display: flex; flex-direction: column; gap: 16px; }
                .simple-input-box-p { display: flex; flex-direction: column; gap: 6px; }
                .simple-input-box-p label { font-size: 0.85rem; font-weight: 700; color: #475569; }
                .simple-input-box-p input, .simple-input-box-p textarea { padding: 12px 16px; border-radius: 12px; border: 1.5px solid rgba(226,232,240,0.8); background: white; font-size: 0.95rem; color: var(--text-main); outline: none; transition: border-color 0.2s; }
                .simple-input-box-p input:focus, .simple-input-box-p textarea:focus { border-color: var(--primary); }
                .simple-input-box-p input[type="date"] { color: var(--primary); font-weight: 700; }
                .form-upload-box-p { background: rgba(248,250,252,0.5); border: 1.5px dashed rgba(203,213,225,0.8); padding: 16px; border-radius: 16px; }
                .upload-select-p { font-size: 0.8rem; border: 1px solid rgba(226,232,240,0.8); border-radius: 8px; padding: 4px 8px; outline: none; background: white; color: #475569; font-weight: 700; }
                .upload-area-p { border: 1.5px dashed rgba(13,148,136,0.25); background: rgba(13,148,136,0.03); padding: 18px 0; font-weight: 700; color: var(--primary); text-align: center; cursor: pointer; border-radius: 12px; transition: all 0.2s; }
                .upload-area-p:hover { background: rgba(13,148,136,0.06); border-color: var(--primary); }
                .form-img-grid-p { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .form-thumb-item-p { position: relative; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; border: 1px solid rgba(226,232,240,0.8); }
                .form-thumb-item-p img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
                .btn-remove-thumb-p { position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.9); color: white; border: none; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .cost-input-box-p { background: rgba(254,242,242,0.4); border: 1px solid rgba(252,165,165,0.4); padding: 12px 14px; border-radius: 14px; }
                .cost-input-box-p label { color: var(--danger); }
                .cost-input-box-p input { font-size: 1.3rem; font-weight: 900; color: var(--danger) !important; text-align: right; border-color: rgba(252,165,165,0.6) !important; }
                .next-date-input-box-p { background: rgba(255,247,237,0.5); border: 1px solid rgba(254,215,170,0.4); padding: 12px 14px; border-radius: 14px; }
                .next-date-input-box-p label { color: #ea580c; }
                .next-date-input-box-p input { color: #ea580c !important; font-weight: 700; border-color: rgba(254,215,170,0.6) !important; }
                .form-actions-p { display: flex; gap: 12px; margin-top: 10px; }
                .btn-cancel-p, .btn-save-p { padding: 14px 20px; border-radius: 14px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; }
                .btn-cancel-p { flex: 1; background: rgba(148,163,184,0.1); color: #475569; }
                .btn-cancel-p:hover { background: rgba(148,163,184,0.2); }
                .btn-save-p { flex: 2; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 6px 16px rgba(13,148,136,0.15); }
                .btn-save-p:hover { background: var(--primary-dark); }

                /* Trash */
                .trash-container-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 24px; box-shadow: var(--shadow-soft); }
                .trash-list-p { display: flex; flex-direction: column; gap: 12px; }
                .trash-item-card-p { background: rgba(248,250,252,0.6); border: 1.5px dashed rgba(203,213,225,0.8); padding: 16px; border-radius: 18px; }
                .btn-restore-p, .btn-perm-delete-p { flex: 1; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; }
                .btn-restore-p { background: rgba(148,163,184,0.1); color: #475569; }
                .btn-restore-p:hover { background: rgba(148,163,184,0.2); }
                .btn-perm-delete-p { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }
                .btn-perm-delete-p:hover { background: #ef4444; color: white; }

                /* Weight Tracker */
                .sidebar-card-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 20px; box-shadow: var(--shadow-soft); position: sticky; top: 20px; }
                .bmi-config-card-p { border: 1px solid rgba(255,255,255,0.5) !important; }
                .input-label-mini-p { font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 2px; }
                .bmi-result-panel-p { background: rgba(248,250,252,0.6); border-radius: 14px; padding: 16px; border-left: 4px solid var(--primary); }
                .bmi-recommendation-p { font-size: 0.82rem; color: #475569; margin-top: 10px; border-top: 1px dashed rgba(203,213,225,0.8); padding-top: 10px; line-height: 1.45; }
                .chart-card-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 24px; box-shadow: var(--shadow-soft); }
                .no-chart-data-p { text-align: center; color: #94a3b8; font-size: 0.88rem; padding: 40px 20px; background: rgba(248,250,252,0.5); border-radius: 16px; border: 1px dashed rgba(226,232,240,0.8); }
                .chart-bars-wrap-p { display: flex; align-items: flex-end; justify-content: space-around; height: 160px; padding: 25px 5px 0 5px; border-bottom: 1px solid rgba(226,232,240,0.8); gap: 8px; }
                .chart-bar-col-p { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; position: relative; }
                .chart-bar-container-p { width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; }
                .chart-bar-fill-p { width: 16px; border-radius: 4px 4px 0 0; position: relative; display: flex; justify-content: center; align-items: flex-end; transition: height 0.4s ease-out; }
                .chart-bar-fill-p.normal { box-shadow: 0 4px 10px rgba(16,185,129,0.25); }
                .chart-bar-fill-p.low { box-shadow: 0 4px 10px rgba(245,158,11,0.25); }
                .chart-bar-fill-p.high { box-shadow: 0 4px 10px rgba(239,68,68,0.25); }
                .chart-bar-tooltip-p { position: absolute; top: -38px; background: rgba(30,41,59,0.9); backdrop-filter: blur(4px); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-align: center; white-space: nowrap; opacity: 0.9; display: flex; flex-direction: column; line-height: 1.1; }
                .tooltip-w-p { display: block; }
                .tooltip-g-p { font-size: 0.6rem; opacity: 0.85; }
                .chart-bar-lbl-p { font-size: 0.7rem; color: var(--text-sub); margin-top: 6px; font-weight: 700; white-space: nowrap; }
                .weight-history-section-p { border-top: 1px dashed rgba(226,232,240,0.8); padding-top: 20px; }
                .weight-history-list-p { display: flex; flex-direction: column; gap: 10px; }
                .weight-history-item-p { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(248,250,252,0.5); border-radius: 14px; border: 1px solid rgba(226,232,240,0.6); }
                .weight-week-title-p { font-weight: 800; color: var(--text-main); font-size: 0.92rem; }
                .weight-date-lbl-p { font-size: 0.78rem; color: var(--text-sub); margin-left: 8px; }
                .weight-gain-val-p { font-weight: 800; color: var(--primary); font-size: 1rem; }
                .gain-sub-p { font-size: 0.8rem; color: var(--text-sub); font-weight: 500; }

                /* ── SCHEDULE (LỊCH THAI) STYLES ────────────────────── */
                .segmented-control-lk {
                    display: flex;
                    background: rgba(139, 92, 246, 0.06);
                    padding: 4px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .segment-btn-lk {
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
                }
                .segment-btn-lk.active {
                    background: white;
                    color: #8b5cf6;
                    box-shadow: 0 4px 12px rgba(139,92,246,0.12);
                }
                .checkup-layout-p { display: flex; flex-direction: column; gap: 24px; }
                .pregnancy-sidebar-p { width: 100%; }
                .sidebar-card-lk { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 20px; box-shadow: var(--shadow-soft); }
                .circular-progress-box-p { display: flex; justify-content: center; align-items: center; position: relative; }
                .circle-svg-wrap { position: relative; width: 120px; height: 120px; }
                .circle-text-p { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; }
                .percent-val { font-size: 1.25rem; font-weight: 900; color: #8b5cf6; line-height: 1; }
                .percent-lbl { font-size: 0.62rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; margin-top: 2px; white-space: nowrap; }
                .timeline-main-p { width: 100%; }
                .fetal-grid-lk { display: grid; grid-template-columns: 1fr; gap: 20px; }
                .card-glass-fallback-p { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 24px; box-shadow: var(--shadow-soft); }

                /* Medical Detail Modal */
                .lk-modal-overlay { display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 2200; align-items: center; justify-content: center; padding: 20px; }
                .lk-modal-content { width: 100%; max-width: 580px; background: white; border-radius: 24px; padding: 24px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                .lk-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
                .lk-modal-subtitle { display: block; font-size: 0.75rem; font-weight: 800; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; }
                .lk-modal-title { font-size: 1.25rem; font-weight: 900; color: #1e293b; margin: 4px 0 0 0; }
                .lk-close-btn { background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 50%; display: flex; transition: all 0.2s; }
                .lk-close-btn:hover { background: #f1f5f9; color: #1e293b; }
                .lk-modal-body { overflow-y: auto; flex: 1; padding-right: 8px; }
                .custom-scrollbar-lk::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar-lk::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-lk::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .custom-scrollbar-lk::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .lk-modal-footer { margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 14px; }

                /* Responsive */
                @media (max-width: 600px) {
                    .tab-switch { margin-bottom: 20px; }
                    .tab-btn { padding: 10px 4px; font-size: 0.76rem; }
                    .stats-dashboard-p { padding-top: 56px !important; }
                    :global(.sokhambenh-container) { padding-top: 16px !important; }
                    .lk-modal-overlay { align-items: flex-end; padding: 0; }
                    .lk-modal-content { border-radius: 24px 24px 0 0; max-height: 80vh; animation: slideUpModal 0.35s cubic-bezier(0.16,1,0.3,1); }
                    .segmented-control-lk { margin-bottom: 20px; }
                    .segment-btn-lk { padding: 10px 4px; font-size: 0.82rem; }
                }

                @media (min-width: 992px) {
                    .medical-split-layout-p { display: grid; grid-template-columns: 340px 1fr; align-items: start; }
                    .medical-sidebar-p { position: sticky; top: 24px; }
                    .form-row-p { flex-direction: row; }
                    .form-row-p > div { flex: 1; }
                    .visit-image-container-p { grid-template-columns: repeat(4, 1fr); }
                    .checkup-layout-p { display: grid; grid-template-columns: 300px 1fr; align-items: start; }
                    .pregnancy-sidebar-p { position: sticky; top: 24px; width: auto; }
                    .fetal-grid-lk { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
}
