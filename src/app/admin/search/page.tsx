'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { MENU_DEFS } from '@/components/Sidebar';
import { FOOD_DB, PRECAUTIONS_DATA, PREGNANCY_DATA } from '@/lib/data';
import Link from 'next/link';
import { 
    IoSearchOutline, IoCloseOutline, IoBookOutline, IoShieldHalfOutline, 
    IoRestaurantOutline, IoClipboardOutline, IoCalendarOutline, 
    IoImagesOutline, IoBriefcaseOutline, IoMedicalOutline, IoHeartOutline, 
    IoWalletOutline, IoPulseOutline, IoFootstepsOutline, IoWarningOutline,
    IoSparklesOutline, IoChevronForwardOutline, IoInformationCircleOutline,
    IoSettingsOutline, IoOptionsOutline
} from 'react-icons/io5';

// Result Item shape
interface SearchResult {
    id: string;
    title: string;
    description: string;
    category: string; // e.g., 'Cẩm nang', 'Kiêng kỵ', 'Dinh dưỡng', 'Sổ khám', 'Cá nhân', 'Ứng dụng'
    target: string; // URL
    date?: string;
    icon: any;
    color: string;
}

const getMenuIcon = (iconName: string, size = 18) => {
    switch (iconName) {
        case 'home-outline': return <IoSparklesOutline size={size} />;
        case 'settings-outline': return <IoSearchOutline size={size} />;
        case 'clipboard-outline': return <IoClipboardOutline size={size} />;
        case 'calendar-outline': return <IoCalendarOutline size={size} />;
        case 'restaurant-outline': return <IoRestaurantOutline size={size} />;
        case 'images-outline': return <IoImagesOutline size={size} />;
        case 'briefcase-outline': return <IoBriefcaseOutline size={size} />;
        case 'book-outline': return <IoBookOutline size={size} />;
        case 'shield-half-outline': return <IoShieldHalfOutline size={size} />;
        case 'medical-outline': return <IoMedicalOutline size={size} />;
        case 'heart-outline': return <IoHeartOutline size={size} />;
        case 'wallet-outline': return <IoWalletOutline size={size} />;
        case 'pulse-outline': return <IoPulseOutline size={size} />;
        case 'footsteps-outline': return <IoFootstepsOutline size={size} />;
        case 'warning-outline': return <IoWarningOutline size={size} />;
        default: return <IoSparklesOutline size={size} />;
    }
};

// ── Chuẩn hoá tiếng Việt không dấu ──────────────────────────────────────────
const removeVietnameseTones = (str: string): string =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// Khớp cả có dấu lẫn không dấu
const fuzzyMatch = (text: string, keyword: string): boolean => {
    if (!text || !keyword) return false;
    if (text.toLowerCase().includes(keyword.toLowerCase())) return true;
    return removeVietnameseTones(text).includes(removeVietnameseTones(keyword));
};

// ── Tính điểm liên quan ───────────────────────────────────────────────────────
const scoreResult = (result: { title: string; description: string; category: string }, keyword: string): number => {
    const kw = keyword.toLowerCase();
    const kwN = removeVietnameseTones(keyword);
    const tL = result.title.toLowerCase();
    const tN = removeVietnameseTones(result.title);
    const dL = result.description.toLowerCase();
    let score = 0;
    if (tL === kw || tN === kwN) score += 100;
    else if (tL.startsWith(kw) || tN.startsWith(kwN)) score += 80;
    else if (tL.includes(kw)) score += 60;
    else if (tN.includes(kwN)) score += 50;
    if (dL.includes(kw)) score += 20;
    else if (removeVietnameseTones(result.description).includes(kwN)) score += 10;
    if (result.category === 'Thao tác') score += 15;
    if (result.category === 'Ứng dụng') score += 5;
    return score;
};

// ── Command Palette — Phân tích câu lệnh tự nhiên ────────────────────────────
interface ParsedCommand {
    label: string;
    description: string;
    target: string;
    icon: any;
    color: string;
    badge: string; // e.g. "⚡ Lệnh nhanh"
}

const parseCommand = (query: string): ParsedCommand | null => {
    const q = query.trim();
    const qN = removeVietnameseTones(q);

    // ── "tuần 20" / "tuan 20" ──────────────────────────────────────────────
    const weekM = qN.match(/^tuan\s*(\d{1,2})$/) || qN.match(/tuan\s*(\d{1,2})\b/);
    if (weekM) {
        const week = parseInt(weekM[1]);
        if (week >= 4 && week <= 42) {
            return {
                label: `Xem Cẩm nang tuần ${week}`,
                description: `Mở thông tin thai nhi & lời khuyên tuần thai ${week}`,
                target: `/admin/sokhambenh?tab=schedule&section=handbook&week=${week}`,
                icon: <IoBookOutline size={20} />, color: '#0f766e', badge: '⚡ Cẩm nang'
            };
        }
    }

    // ── Huyết áp dạng "120/80" hoặc "huyết áp 120/80" ────────────────────
    const bpNum = q.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (bpNum && (fuzzyMatch(q, 'huyết áp') || fuzzyMatch(q, 'huyet ap') || /^\d/.test(q))) {
        const [, sys, dia] = bpNum;
        return {
            label: `Ghi huyết áp ${sys}/${dia} mmHg`,
            description: `Tâm thu: ${sys} mmHg — Tâm trương: ${dia} mmHg → Sức khoẻ › Tab Huyết áp`,
            target: `/admin/suc-khoe?tab=bp`,
            icon: <IoPulseOutline size={20} />, color: '#0891b2', badge: '⚡ Nhập ngay'
        };
    }

    // ── Đường huyết "5.6 mmol" / "đường huyết 7.2" ───────────────────────
    const bsKw = fuzzyMatch(q, 'đường huyết') || fuzzyMatch(q, 'glucose') || fuzzyMatch(q, 'duong huyet');
    const bsNum = q.match(/(\d+[.,]\d+|\d{2,3})\s*(mmol|mg)?/i);
    if (bsKw && bsNum) {
        const val = bsNum[1].replace(',', '.');
        return {
            label: `Ghi đường huyết ${val} mmol/L`,
            description: `Chỉ số đường huyết ${val} mmol/L → Sức khoẻ › Tab Đường huyết`,
            target: `/admin/suc-khoe?tab=bs`,
            icon: <IoPulseOutline size={20} />, color: '#059669', badge: '⚡ Nhập ngay'
        };
    }

    // ── "thêm khám" / "kham moi" / "them lich kham" ───────────────────────
    const addVisit = qN.match(/them\s*(kham|lich|cuoc)/) || qN.match(/kham\s*(moi|them|tiep)/);
    if (addVisit) {
        const dateM = q.match(/(\d{1,2}[\/\-]\d{1,2})/);
        return {
            label: `Thêm lần khám mới${dateM ? ` — ${dateM[1]}` : ''}`,
            description: 'Ghi kết quả khám: ngày khám, bác sĩ, cân nặng, lịch tái khám',
            target: `/admin/sokhambenh`,
            icon: <IoClipboardOutline size={20} />, color: '#0f766e', badge: '⚡ Sổ khám'
        };
    }

    // ── "thêm mũi tiêm" / "them tiem" ────────────────────────────────────
    if (qN.match(/them\s*(mui\s*tiem|tiem|vaccine)/) || qN.match(/tiem\s*chung\s*moi/)) {
        return {
            label: 'Ghi mũi tiêm chủng mới',
            description: 'Nhập tên vaccine, ngày tiêm, phản ứng sau tiêm',
            target: `/admin/tiem-chung`,
            icon: <IoMedicalOutline size={20} />, color: '#047857', badge: '⚡ Tiêm chủng'
        };
    }

    // ── "đếm thai máy" / "dem cu dong" / "kick" ───────────────────────────
    if (qN.match(/dem\s*(cu\s*dong|thai\s*may|thai)/) || qN.includes('kick')) {
        return {
            label: 'Bắt đầu đếm cử động thai',
            description: 'Mở phiên đếm thai máy theo chuẩn ACOG',
            target: `/admin/cu-dong-thai`,
            icon: <IoFootstepsOutline size={20} />, color: '#db2777', badge: '⚡ Cử động thai'
        };
    }

    return null;
};

const SEARCHABLE_SOURCES = [
    { id: 'app', label: 'Ứng dụng & Tính năng', color: '#0d9488' },
    { id: 'note', label: 'Cẩm nang tuần thai', color: '#14b8a6' },
    { id: 'kiengky', label: 'Kiêng kỵ thai kỳ', color: '#ef4444' },
    { id: 'dinhduong', label: 'Dinh dưỡng & Bữa ăn', color: '#f97316' },
    { id: 'sokham', label: 'Sổ khám bệnh', color: '#10b981' },
    { id: 'suckhoe', label: 'Theo dõi sức khỏe', color: '#06b6d4' },
    { id: 'album', label: 'Album ảnh & Video', color: '#8b5cf6' },
    { id: 'chuanbi', label: 'Giỏ đồ đi sinh', color: '#f59e0b' },
    { id: 'tiemchung', label: 'Lịch sử tiêm chủng', color: '#10b981' },
    { id: 'nhatkybe', label: 'Nhật ký của bé', color: '#ec4899' },
    { id: 'taichinh', label: 'Sổ chi tiêu mua sắm', color: '#f59e0b' },
    { id: 'cudongthai', label: 'Cử động thai', color: '#db2777' }
];

// ─────────────────────────────────────────────────────────────────────────────
// APP ACTION INDEX — Toàn bộ tính năng/thao tác/vị trí trong app
// Dùng để tìm kiếm theo tên chức năng, tab, thao tác cụ thể
// ─────────────────────────────────────────────────────────────────────────────
interface AppAction {
    id: string;
    label: string;           // Tên thao tác hiển thị
    description: string;     // Mô tả ngắn
    location: string;        // Tên màn hình chứa
    tab?: string;            // Tên tab (nếu có)
    target: string;          // URL deep link
    keywords: string[];      // Từ khoá tìm kiếm
    icon: any;
    color: string;
    actionType: 'navigate' | 'create' | 'view' | 'settings';
}

const APP_ACTIONS_INDEX: AppAction[] = [
    // ── THEO DÕI SỨC KHOẺ ──────────────────────────────────────────────────
    {
        id: 'suckoe-bp-input',
        label: 'Nhập chỉ số huyết áp',
        description: 'Ghi nhận huyết áp tâm thu / tâm trương (mmHg) và nhịp tim',
        location: 'Theo dõi sức khoẻ',
        tab: 'Tab Huyết áp',
        target: '/admin/suc-khoe?tab=bp',
        keywords: ['huyết áp', 'blood pressure', 'bp', 'tâm thu', 'tâm trương', 'mmhg', 'nhịp tim', 'pulse', 'ghi huyết áp', 'nhập huyết áp', 'đo huyết áp', 'tiền sản giật'],
        icon: <IoPulseOutline size={18} />, color: '#0891b2', actionType: 'create'
    },
    {
        id: 'suckhoe-bs-input',
        label: 'Nhập đường huyết',
        description: 'Ghi nhận chỉ số đường huyết (mmol/L hoặc mg/dL)',
        location: 'Theo dõi sức khoẻ',
        tab: 'Tab Đường huyết',
        target: '/admin/suc-khoe?tab=bs',
        keywords: ['đường huyết', 'blood sugar', 'glucose', 'bs', 'tiểu đường', 'đái tháo đường', 'mmol', 'đường trong máu', 'ghi đường huyết', 'nhập đường huyết', 'đo đường huyết'],
        icon: <IoPulseOutline size={18} />, color: '#059669', actionType: 'create'
    },
    {
        id: 'suckhoe-info',
        label: 'Thông tin sức khoẻ & chỉ số bình thường',
        description: 'Xem bảng chỉ số huyết áp, đường huyết chuẩn theo từng tam cá nguyệt',
        location: 'Theo dõi sức khoẻ',
        tab: 'Tab Thông tin',
        target: '/admin/suc-khoe?tab=info',
        keywords: ['thông tin sức khoẻ', 'chỉ số bình thường', 'chuẩn huyết áp', 'chuẩn đường huyết', 'tam cá nguyệt', 'info sức khoẻ'],
        icon: <IoPulseOutline size={18} />, color: '#6366f1', actionType: 'view'
    },

    // ── SỔ KHÁM BỆNH ────────────────────────────────────────────────────────
    {
        id: 'sokham-add',
        label: 'Thêm lần khám thai mới',
        description: 'Ghi chép kết quả khám: ngày khám, bác sĩ, cân nặng, lịch tái khám',
        location: 'Sổ khám bệnh',
        target: '/admin/sokhambenh?action=add',
        keywords: ['thêm khám', 'ghi khám', 'lần khám', 'thêm lịch khám', 'kết quả khám', 'bác sĩ', 'cân nặng', 'lịch tái khám', 'siêu âm', 'khám thai'],
        icon: <IoClipboardOutline size={18} />, color: '#0f766e', actionType: 'create'
    },
    {
        id: 'sokham-view',
        label: 'Xem sổ khám thai',
        description: 'Danh sách tất cả các lần khám đã ghi, kết quả và lịch hẹn tiếp theo',
        location: 'Sổ khám bệnh',
        target: '/admin/sokhambenh',
        keywords: ['xem sổ khám', 'lịch sử khám', 'khám trước', 'kết quả siêu âm', 'siêu âm thai', 'lịch hẹn bác sĩ'],
        icon: <IoClipboardOutline size={18} />, color: '#0f766e', actionType: 'view'
    },

    // ── DINH DƯỠNG ──────────────────────────────────────────────────────────
    {
        id: 'dinduong-diary',
        label: 'Ghi nhật ký bữa ăn',
        description: 'Nhập bữa ăn trong ngày, ước tính calo, ghi chú dưỡng chất',
        location: 'Dinh dưỡng thai kỳ',
        tab: 'Tab Nhật ký',
        target: '/admin/dinh-duong?tab=diary',
        keywords: ['ghi bữa ăn', 'nhật ký ăn', 'calo', 'calories', 'bữa sáng', 'bữa trưa', 'bữa tối', 'bữa phụ', 'ăn gì', 'thực đơn hôm nay', 'nhập bữa ăn', 'dinh dưỡng hôm nay'],
        icon: <IoRestaurantOutline size={18} />, color: '#047857', actionType: 'create'
    },
    {
        id: 'dinhduong-lookup',
        label: 'Tra cứu thực phẩm an toàn',
        description: 'Kiểm tra thực phẩm nào nên dùng, hạn chế, hay cần tránh khi mang thai',
        location: 'Dinh dưỡng thai kỳ',
        tab: 'Tab Tra cứu',
        target: '/admin/dinh-duong?tab=lookup',
        keywords: ['tra cứu thực phẩm', 'thực phẩm an toàn', 'ăn được không', 'nên ăn', 'không ăn', 'tránh ăn', 'hạn chế', 'cá hồi', 'sữa', 'rau', 'thịt', 'hải sản', 'an toàn thực phẩm'],
        icon: <IoRestaurantOutline size={18} />, color: '#f97316', actionType: 'view'
    },
    {
        id: 'dinhduong-guide',
        label: 'Gợi ý thực đơn thai kỳ',
        description: 'Thực đơn dinh dưỡng được gợi ý theo từng tam cá nguyệt',
        location: 'Dinh dưỡng thai kỳ',
        tab: 'Tab Thực đơn',
        target: '/admin/dinh-duong?tab=guide',
        keywords: ['thực đơn', 'gợi ý ăn', 'thực đơn thai kỳ', 'ăn gì cho bổ', 'dinh dưỡng thai', 'thực đơn tuần', 'menu thai kỳ'],
        icon: <IoRestaurantOutline size={18} />, color: '#16a34a', actionType: 'view'
    },
    {
        id: 'dinhduong-medical',
        label: 'Thông tin vitamin & khoáng chất',
        description: 'Bảng nhu cầu Axit Folic, Sắt, Canxi, Omega-3 theo từng giai đoạn',
        location: 'Dinh dưỡng thai kỳ',
        tab: 'Tab Y khoa',
        target: '/admin/dinh-duong?tab=medical',
        keywords: ['vitamin', 'khoáng chất', 'axit folic', 'sắt', 'canxi', 'omega 3', 'dha', 'epa', 'bổ sung', 'vi chất', 'thuốc bổ'],
        icon: <IoMedicalOutline size={18} />, color: '#7c3aed', actionType: 'view'
    },

    // ── CỬ ĐỘNG THAI ────────────────────────────────────────────────────────
    {
        id: 'cudongthai-start',
        label: 'Bắt đầu phiên đếm cử động thai',
        description: 'Đếm số lần thai máy trong khung thời gian, theo chuẩn ACOG',
        location: 'Cử động thai',
        target: '/admin/cu-dong-thai',
        keywords: ['cử động thai', 'thai máy', 'đếm cử động', 'kick count', 'thai nhi đạp', 'đạp bụng', 'bé máy', 'bé đạp', 'thai đạp', 'đếm thai máy', 'phiên đếm'],
        icon: <IoFootstepsOutline size={18} />, color: '#db2777', actionType: 'create'
    },

    // ── TIÊM CHỦNG ──────────────────────────────────────────────────────────
    {
        id: 'tiemchung-add',
        label: 'Thêm lịch sử tiêm chủng',
        description: 'Ghi lại mũi tiêm: tên vaccine, ngày tiêm, phản ứng sau tiêm',
        location: 'Sổ tiêm chủng',
        target: '/admin/tiem-chung',
        keywords: ['tiêm chủng', 'vaccine', 'mũi tiêm', 'vắc xin', 'uốn ván', 'vat', 'cúm', 'viêm gan', 'tiêm phòng', 'ghi mũi tiêm', 'lịch tiêm'],
        icon: <IoMedicalOutline size={18} />, color: '#047857', actionType: 'create'
    },

    // ── TÀI CHÍNH ───────────────────────────────────────────────────────────
    {
        id: 'taichinh-ledger',
        label: 'Ghi chi tiêu mua sắm thai kỳ',
        description: 'Nhập khoản thu/chi, theo dõi ngân sách chuẩn bị cho bé',
        location: 'Sổ chi tiêu',
        tab: 'Tab Sổ chi tiêu',
        target: '/admin/tai-chinh',
        keywords: ['chi tiêu', 'mua sắm', 'tài chính', 'tiền', 'ngân sách', 'chi phí', 'thu nhập', 'ghi chi tiêu', 'sổ thu chi', 'bảo hiểm', 'viện phí', 'tiết kiệm'],
        icon: <IoWalletOutline size={18} />, color: '#c2410c', actionType: 'create'
    },

    // ── ALBUM ẢNH ───────────────────────────────────────────────────────────
    {
        id: 'album-add-photo',
        label: 'Thêm ảnh thai kỳ',
        description: 'Upload ảnh bụng bầu, ảnh siêu âm, kỷ niệm thai kỳ',
        location: 'Album ảnh',
        tab: 'Tab Ảnh',
        target: '/admin/album',
        keywords: ['thêm ảnh', 'upload ảnh', 'ảnh bụng bầu', 'ảnh siêu âm', 'ảnh thai', 'album ảnh', 'hình ảnh', 'photo', 'chụp ảnh', 'lưu ảnh'],
        icon: <IoImagesOutline size={18} />, color: '#7c3aed', actionType: 'create'
    },

    // ── NHẬT KÝ BÉ ──────────────────────────────────────────────────────────
    {
        id: 'nhatkybe-add',
        label: 'Ghi nhật ký cảm xúc & kỷ niệm',
        description: 'Viết ghi chú, cảm xúc, kỷ niệm đáng nhớ trong thai kỳ',
        location: 'Nhật ký của bé',
        target: '/admin/nhat-ky-be',
        keywords: ['nhật ký', 'ghi chú', 'cảm xúc', 'kỷ niệm', 'diary', 'journal', 'viết nhật ký', 'tâm sự', 'ghi lại kỷ niệm', 'nhớ mãi'],
        icon: <IoHeartOutline size={18} />, color: '#be185d', actionType: 'create'
    },

    // ── CHUẨN BỊ ĐI SINH ───────────────────────────────────────────────────
    {
        id: 'chuanbi-add',
        label: 'Quản lý giỏ đồ đi sinh',
        description: 'Danh sách đồ dùng cần mang: đồ cho mẹ, đồ cho bé, giấy tờ',
        location: 'Giỏ đồ đi sinh',
        target: '/admin/chuan-bi-di-sinh',
        keywords: ['đồ đi sinh', 'giỏ đi sinh', 'chuẩn bị sinh', 'đồ cho bé', 'đồ cho mẹ', 'giấy tờ sinh', 'cccd', 'bhyt', 'túi đi sinh', 'chuẩn bị nhập viện', 'check list'],
        icon: <IoBriefcaseOutline size={18} />, color: '#b45309', actionType: 'view'
    },

    // ── HÀNH TRÌNH 40 TUẦN ─────────────────────────────────────────────────
    {
        id: 'journey-view',
        label: 'Xem Hành trình 40 tuần',
        description: 'Lộ trình theo dõi thai kỳ chuẩn theo từng tuần, các mốc quan trọng',
        location: 'Hành trình 40 tuần',
        target: '/admin/sokhambenh?tab=schedule',
        keywords: ['hành trình 40 tuần', 'lịch khám', 'lịch thai', 'mốc khám', 'khám định kỳ', 'tuần khám', 'lịch siêu âm', 'khám sàng lọc', 'double test', 'triple test', 'khám 3 tháng'],
        icon: <IoCalendarOutline size={18} />, color: '#7c3aed', actionType: 'view'
    },

    // ── CẨM NANG TUẦN THAI ──────────────────────────────────────────────────
    {
        id: 'note-view',
        label: 'Cẩm nang thai kỳ theo tuần',
        description: 'Thông tin về sự phát triển của bé và thay đổi của mẹ theo từng tuần',
        location: 'Hành trình 40 tuần',
        target: '/admin/sokhambenh?tab=schedule&section=handbook',
        keywords: ['cẩm nang', 'tuần thai', 'bé phát triển', 'thai nhi', 'sự phát triển', 'tuần mấy', 'bé bao nhiêu cm', 'bé nặng bao nhiêu', 'triệu chứng thai kỳ', 'thay đổi cơ thể'],
        icon: <IoBookOutline size={18} />, color: '#0f766e', actionType: 'view'
    },

    // ── KIÊNG KỴ ────────────────────────────────────────────────────────────
    {
        id: 'kiengky-view',
        label: 'Tra cứu kiêng kỵ thai kỳ',
        description: 'Danh sách điều nên & không nên làm trong thai kỳ theo y khoa và dân gian',
        location: 'Kiêng kỵ thai kỳ',
        target: '/admin/kieng-ky',
        keywords: ['kiêng kỵ', 'kiêng cữ', 'không nên', 'tránh', 'cấm', 'mê tín', 'dân gian', 'y khoa', 'an toàn không', 'có được không', 'uốn tóc', 'nhuộm tóc', 'đám ma', 'xăm'],
        icon: <IoShieldHalfOutline size={18} />, color: '#b91c1c', actionType: 'view'
    },

    // ── THAI GIÁO ───────────────────────────────────────────────────────────
    {
        id: 'thagiao-music',
        label: 'Nghe nhạc thai giáo',
        description: 'Bật nhạc cổ điển, nhạc nhẹ cho bé nghe để kích thích não bộ',
        location: 'Thai giáo cho bé',
        target: '/admin/thai-giao',
        keywords: ['thai giáo', 'nghe nhạc', 'nhạc cho bé', 'nhạc cổ điển', 'kích thích não', 'trò chuyện với bé', 'đọc sách', 'giáo dục sớm', 'bật nhạc'],
        icon: <IoSparklesOutline size={18} />, color: '#be185d', actionType: 'view'
    },

    // ── CẢNH BÁO ────────────────────────────────────────────────────────────
    {
        id: 'canhbao-view',
        label: 'Xem cảnh báo nguy hiểm thai kỳ',
        description: 'Danh sách dấu hiệu nguy hiểm cần đến bệnh viện ngay',
        location: 'Cảnh báo đỏ',
        target: '/admin/canh-bao',
        keywords: ['cảnh báo', 'nguy hiểm', 'dấu hiệu nguy hiểm', 'vào viện ngay', 'khẩn cấp', 'chảy máu', 'đau bụng', 'thai lưu', 'sảy thai', 'co giật', 'phù nề'],
        icon: <IoWarningOutline size={18} />, color: '#be123c', actionType: 'view'
    },

    // ── CÀI ĐẶT ─────────────────────────────────────────────────────────────
    {
        id: 'settings-profile',
        label: 'Cập nhật hồ sơ thai kỳ',
        description: 'Nhập ngày kinh cuối (LMP), tuổi, cân nặng trước bầu, tên bé',
        location: 'Cài đặt hệ thống',
        tab: 'Tab Hồ sơ',
        target: '/admin/settings',
        keywords: ['hồ sơ', 'ngày kinh cuối', 'lmp', 'tuổi', 'cân nặng trước bầu', 'tên bé', 'cập nhật hồ sơ', 'thông tin cá nhân', 'sinh nhật', 'dự sinh', 'ngày sinh dự kiến', 'edd'],
        icon: <IoSettingsOutline size={18} />, color: '#475569', actionType: 'settings'
    },
    {
        id: 'settings-sync',
        label: 'Đồng bộ tài khoản với partner',
        description: 'Liên kết tài khoản với bạn đời để cùng theo dõi thai kỳ',
        location: 'Đồng bộ tài khoản',
        target: '/admin/dong-bo',
        keywords: ['đồng bộ', 'liên kết', 'partner', 'bạn đời', 'chồng', 'vợ', 'chia sẻ tài khoản', 'sync', 'cặp đôi', 'kết nối tài khoản'],
        icon: <IoSettingsOutline size={18} />, color: '#0d9488', actionType: 'settings'
    },
    {
        id: 'toancanh-view',
        label: 'Xem toàn cảnh tình hình thai kỳ',
        description: 'Tổng hợp tất cả dữ liệu: sức khoẻ, dinh dưỡng, khám thai, tài chính',
        location: 'Tổng quan',
        target: '/admin/toan-canh',
        keywords: ['tổng quan', 'toàn cảnh', 'tổng hợp', 'overview', 'báo cáo', 'thống kê', 'xem tất cả', 'dashboard chi tiết'],
        icon: <IoSparklesOutline size={18} />, color: '#0d9488', actionType: 'view'
    },
];

export default function GlobalSearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'knowledge' | 'nutrition' | 'health' | 'personal' | 'app'>('all');
    
    // User states
    const [user, setUser] = useState<any>(null);
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [loadingDb, setLoadingDb] = useState(false);
    
    // Search performance states
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchTime, setSearchTime] = useState('0.000');
    const [hasSearched, setHasSearched] = useState(false);

    // Search settings states
    const [showSettings, setShowSettings] = useState(false);
    const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>({});
    const [pendingSources, setPendingSources] = useState<Record<string, boolean>>({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Autocomplete states
    const [suggestions, setSuggestions] = useState<{ label: string; category: string; color: string; icon: any }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestBoxRef = useRef<HTMLDivElement>(null);

    // Search history
    const HISTORY_KEY = 'thaikypro_search_history_v1';
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Command palette state
    const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);

    // Load settings + history on mount only
    useEffect(() => {
        let loadedSources: Record<string, boolean> = {};
        try {
            const saved = localStorage.getItem('thaikypro_search_enabled_sources');
            if (saved) {
                loadedSources = JSON.parse(saved);
                setEnabledSources(loadedSources);
                setPendingSources(loadedSources);
            }
        } catch (e) {
            console.error("Failed to load search sources settings", e);
        }
        try {
            const hist = localStorage.getItem('thaikypro_search_history_v1');
            if (hist) setSearchHistory(JSON.parse(hist));
        } catch (e) { /* ignore */ }
    }, []);

    // Trigger search from URL param - only after resolvedUid is ready
    const hasSearchedFromUrl = useRef(false);
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && !hasSearchedFromUrl.current) {
            hasSearchedFromUrl.current = true;
            setSearchQuery(q);
            performSearch(q, enabledSources);
        }
    }, [resolvedUid]);

    // Close suggestions/history on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                inputRef.current && !inputRef.current.contains(e.target as Node) &&
                suggestBoxRef.current && !suggestBoxRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
                setShowHistory(false);
                setActiveSuggestion(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // History helpers
    const saveToHistory = (kw: string) => {
        const trimmed = kw.trim();
        if (!trimmed) return;
        setSearchHistory(prev => {
            const deduped = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 8);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
            return deduped;
        });
    };
    const removeFromHistory = (kw: string) => {
        setSearchHistory(prev => {
            const next = prev.filter(h => h !== kw);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            return next;
        });
    };
    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    };

    // Debounced suggestion generator
    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setShowHistory(false);
        // Parse command palette
        const cmd = parseCommand(trimmed);
        setParsedCommand(cmd);
        const timer = setTimeout(() => {
            const norm = trimmed.toLowerCase();
            const list: { label: string; category: string; color: string; icon: any }[] = [];

            // Command as first suggestion if detected
            if (cmd) {
                list.unshift({ label: cmd.label, category: cmd.badge, color: cmd.color, icon: cmd.icon });
            }

            // From APP_ACTIONS_INDEX — fuzzy match
            APP_ACTIONS_INDEX.forEach(action => {
                const matchesLabel = fuzzyMatch(action.label, trimmed);
                const matchesKeyword = action.keywords.some(k => fuzzyMatch(k, trimmed));
                const matchesDesc = fuzzyMatch(action.description, trimmed);
                if ((matchesLabel || matchesKeyword || matchesDesc) && list.filter(l => l.category === 'Thao tác').length < 4) {
                    list.unshift({
                        label: action.label,
                        category: 'Thao tác',
                        color: action.color,
                        icon: action.icon
                    });
                }
            });

            // From MENU_DEFS — fuzzy match
            MENU_DEFS.forEach(item => {
                if (fuzzyMatch(item.label, trimmed) && list.filter(l => l.category !== 'Thao tác').length < 2) {
                    list.push({ label: item.label, category: 'Ứng dụng', color: item.color || '#0d9488', icon: getMenuIcon(item.icon, 15) });
                }
            });

            // From PRECAUTIONS_DATA — fuzzy match
            PRECAUTIONS_DATA.forEach(item => {
                if ((fuzzyMatch(item.title, trimmed) || fuzzyMatch(item.description || '', trimmed)) && list.filter(l => l.category === 'Kiêng kỵ').length < 2) {
                    list.push({ label: item.title, category: 'Kiêng kỵ', color: '#ef4444', icon: <IoShieldHalfOutline size={15} /> });
                }
            });

            // From FOOD_DB — fuzzy match
            FOOD_DB.forEach(item => {
                if ((fuzzyMatch(item.name, trimmed) || fuzzyMatch(item.desc, trimmed)) && list.filter(l => l.category === 'Dinh dưỡng').length < 2) {
                    list.push({ label: item.name, category: 'Dinh dưỡng', color: '#f97316', icon: <IoRestaurantOutline size={15} /> });
                }
            });

            // From PREGNANCY_DATA
            Object.entries(PREGNANCY_DATA).forEach(([week, wData]) => {
                if ((fuzzyMatch(wData.advice, trimmed) || fuzzyMatch(wData.baby, trimmed)) && list.filter(l => l.category === 'Cẩm nang').length < 1) {
                    list.push({ label: `Tuần ${week}: ${wData.size}`, category: 'Cẩm nang', color: '#14b8a6', icon: <IoBookOutline size={15} /> });
                }
            });

            setSuggestions(list.slice(0, 8));
            setShowSuggestions(list.length > 0);
            setActiveSuggestion(-1);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Toggle pending sources (not saved yet)
    const togglePendingSource = (id: string) => {
        setPendingSources(prev => ({
            ...prev,
            [id]: prev[id] === false ? true : false
        }));
    };

    // Save settings explicitly
    const handleSaveSettings = () => {
        setEnabledSources(pendingSources);
        localStorage.setItem('thaikypro_search_enabled_sources', JSON.stringify(pendingSources));
        setSaveSuccess(true);
        setTimeout(() => {
            setSaveSuccess(false);
            setShowSettings(false);
        }, 1200);
        if (searchQuery.trim()) {
            performSearch(searchQuery, pendingSources);
        }
    };

    // Handle authentication & partner link check
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docSnap = await getDoc(doc(db, "users", currentUser.uid, "settings", "profile"));
                    let targetUid = currentUser.uid;
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.syncRole === 'partner' && data.partnerUid) {
                            targetUid = data.partnerUid;
                        }
                    }
                    setResolvedUid(targetUid);
                } catch (e) {
                    console.error("Error resolving partner sync UID:", e);
                    setResolvedUid(currentUser.uid);
                }
            } else {
                setUser(null);
                setResolvedUid('');
            }
        });
        return () => unsubscribe();
    }, []);

    // Perform Search Logic
    const performSearch = async (keyword: string, currentEnabledSources = enabledSources) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setLoadingDb(true);
        const startTime = performance.now();
        const results: SearchResult[] = [];
        const normKey = keyword.toLowerCase().trim();

        // 0. MATCH APP ACTIONS INDEX (highest priority — feature/tab/action search)
        if (currentEnabledSources['app'] !== false) {
            APP_ACTIONS_INDEX.forEach(action => {
                const matchesLabel = fuzzyMatch(action.label, keyword);
                const matchesDesc = fuzzyMatch(action.description, keyword);
                const matchesLocation = fuzzyMatch(action.location, keyword);
                const matchesTab = action.tab ? fuzzyMatch(action.tab, keyword) : false;
                const matchesKeyword = action.keywords.some(k => fuzzyMatch(k, keyword));

                if (matchesLabel || matchesDesc || matchesLocation || matchesTab || matchesKeyword) {
                    results.push({
                        id: `action-${action.id}`,
                        title: action.label,
                        description: `${action.location}${action.tab ? ` › ${action.tab}` : ''} — ${action.description}`,
                        category: 'Thao tác',
                        target: action.target,
                        icon: action.icon,
                        color: action.color
                    });
                }
            });
        }

        // 1. MATCH APP NAVIGATION (MENU DEFS)
        if (currentEnabledSources['app'] !== false) {
            MENU_DEFS.forEach(item => {
                if (fuzzyMatch(item.label, keyword) || (item.group && fuzzyMatch(item.group, keyword))) {
                    results.push({
                        id: `nav-${item.id}`,
                        title: `Mở tính năng: ${item.label}`,
                        description: `Đi tới ứng dụng chăm sóc thai kỳ: ${item.label} (${item.group === 'health' ? 'Theo dõi Sức khỏe' : item.group === 'tool' ? 'Tiện ích lưu trữ' : 'Cẩm nang kiến thức'}).`,
                        category: 'Ứng dụng',
                        target: item.target,
                        icon: getMenuIcon(item.icon, 20),
                        color: item.color || '#0d9488'
                    });
                }
            });
        }

        // 2. MATCH STATIC DATABASES
        // 2a. Kiêng Kỵ — fuzzy match
        if (currentEnabledSources['kiengky'] !== false) {
            PRECAUTIONS_DATA.forEach((item, index) => {
                const matchesTitle = fuzzyMatch(item.title, keyword);
                const matchesDesc = fuzzyMatch(item.description || '', keyword);
                const matchesFolk = fuzzyMatch(item.folkBelief || '', keyword);
                const matchesScience = fuzzyMatch(item.scienceExplain || '', keyword);
                if (matchesTitle || matchesDesc || matchesFolk || matchesScience) {
                    const iconMap: Record<string, any> = {
                        'folk': IoShieldHalfOutline,
                        'food': IoRestaurantOutline,
                        'activity': IoFootstepsOutline,
                        'beauty': IoSparklesOutline
                    };
                    results.push({
                        id: `static-kiengky-${index}`,
                        title: `${item.title} (Kiêng kỵ)`,
                        description: item.description || `Ý kiến dân gian: ${item.folkBelief}. Giải thích khoa học: ${item.scienceExplain}`,
                        category: 'Kiêng kỵ',
                        target: `/admin/kieng-ky`,
                        icon: iconMap[item.category] ? <span style={{ color: item.color }}>{React.createElement(iconMap[item.category], { size: 18 })}</span> : <IoShieldHalfOutline size={18} style={{ color: item.color }} />,
                        color: item.color || '#ef4444'
                    });
                }
            });
        }

        // 2b. Dinh Dưỡng — fuzzy match
        if (currentEnabledSources['dinhduong'] !== false) {
            FOOD_DB.forEach((item, index) => {
                if (fuzzyMatch(item.name, keyword) || fuzzyMatch(item.desc, keyword)) {
                    results.push({
                        id: `static-dinhduong-${index}`,
                        title: `${item.name} (An toàn thực phẩm)`,
                        description: `Trạng thái: ${item.status === 'safe' ? 'Nên dùng' : item.status === 'limit' ? 'Hạn chế' : 'Cần tránh'}. Chi tiết: ${item.desc}`,
                        category: 'Dinh dưỡng',
                        target: `/admin/dinh-duong?tab=lookup`,
                        icon: <IoRestaurantOutline size={18} style={{ color: '#f97316' }} />,
                        color: '#f97316'
                    });
                }
            });
        }

        // 2c. Cẩm Nang Tuần Thai — fuzzy match
        if (currentEnabledSources['note'] !== false) {
            Object.entries(PREGNANCY_DATA).forEach(([weekNum, wData]) => {
                const matchesBaby = fuzzyMatch(wData.baby, keyword);
                const matchesMom = fuzzyMatch(wData.mom, keyword);
                const matchesAdvice = fuzzyMatch(wData.advice, keyword);
                const matchesSymptoms = wData.symptoms.some(s => fuzzyMatch(s, keyword));
                const matchesTodo = wData.toDoList.some(t => fuzzyMatch(t, keyword));
                const matchesDetail = wData.detail.some(d => fuzzyMatch(d, keyword));

                if (matchesBaby || matchesMom || matchesAdvice || matchesSymptoms || matchesTodo || matchesDetail) {
                    results.push({
                        id: `static-week-${weekNum}`,
                        title: `Tuần thai ${weekNum}: Bé ${wData.size} (${wData.weight})`,
                        description: `Lời khuyên: ${wData.advice} | Bé: ${wData.baby} | Mẹ: ${wData.mom}`,
                        category: 'Cẩm nang',
                        target: `/admin/sokhambenh?tab=schedule&section=handbook&week=${weekNum}`,
                        icon: <IoBookOutline size={18} style={{ color: '#14b8a6' }} />,
                        color: '#14b8a6'
                    });
                }
            });
        }

        // 3. MATCH FIRESTORE USER DATA (IF LOGGED IN)
        if (resolvedUid) {
            try {
                // We define the collections to query in parallel
                const collectionPromises = MENU_DEFS
                    .filter(item => item.searchConfigs)
                    .flatMap(item => {
                        if (currentEnabledSources[item.id] === false) return [];
                        return item.searchConfigs!.filter(c => c.type === 'firestore');
                    })
                    .map(async (cfg: any) => {
                        try {
                            const snap = await getDocs(collection(db, "users", resolvedUid, cfg.collectionName!));
                            const matchedDocs: SearchResult[] = [];
                            snap.docs.forEach(docSnap => {
                                const docData = docSnap.data();
                                
                                // Check if deleted
                                if (docData.deletedAt) return;

                                // Match key
                                const matches = cfg.fields.some((field: string) => {
                                    const val = docData[field];
                                    return val && String(val).toLowerCase().includes(normKey);
                                });

                                if (matches) {
                                    // Extract title and description
                                    const rawTitle = docData[cfg.titleField] || docData.notes || docData.caption || docData.title || docData.vaccineName || 'Ghi chép';
                                    const rawDesc = docData[cfg.descField || ''] || docData.notes || docData.content || docData.desc || docData.doctor || '';
                                    const dateVal = docData[cfg.dateField || ''] || docData.date || docData.datetime || docData.startTime || '';
                                    
                                    // Map Firestore category to display category
                                    let displayCategory = 'Cá nhân';
                                    let linkTarget = '/admin';
                                    let icon = <IoClipboardOutline size={18} />;
                                    let color = '#64748b';

                                    const matchingMenuItem = MENU_DEFS.find(item => 
                                        item.searchConfigs && item.searchConfigs.some((sc: any) => sc.collectionName === cfg.collectionName)
                                    );

                                    if (matchingMenuItem) {
                                        displayCategory = matchingMenuItem.label;
                                        linkTarget = matchingMenuItem.target;
                                        icon = getMenuIcon(matchingMenuItem.icon, 18);
                                        color = matchingMenuItem.color;
                                    }

                                    // Special description adjustments
                                    let finalDesc = String(rawDesc);
                                    if (cfg.collectionName === 'maternity_finance' && docData.amount) {
                                        finalDesc = `Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(docData.amount)}. ${rawDesc}`;
                                    } else if (cfg.collectionName === 'nutrition_diary' && docData.calories) {
                                        finalDesc = `Calo: ${docData.calories} kcal. ${rawDesc}`;
                                    }

                                    matchedDocs.push({
                                        id: `firestore-${cfg.collectionName}-${docSnap.id}`,
                                        title: String(rawTitle),
                                        description: finalDesc,
                                        category: displayCategory,
                                        target: linkTarget,
                                        date: dateVal ? String(dateVal).split('T')[0].split('-').reverse().join('/') : undefined,
                                        icon: icon,
                                        color: color
                                    });
                                }
                            });
                            return matchedDocs;
                        } catch (e) {
                            console.error(`Error querying Firestore collection ${cfg.collectionName}:`, e);
                            return [];
                        }
                    });

                const firestoreResultsArrays = await Promise.all(collectionPromises);
                firestoreResultsArrays.forEach(arr => {
                    results.push(...arr);
                });
            } catch (e) {
                console.error("Global Firestore search failed:", e);
            }
        }

        // Sort by relevance score
        results.sort((a, b) => scoreResult(b, keyword) - scoreResult(a, keyword));

        // Calculate search performance
        const endTime = performance.now();
        const diffTime = ((endTime - startTime) / 1000).toFixed(3);

        setSearchResults(results);
        setSearchTime(diffTime);
        setHasSearched(true);
        setLoadingDb(false);
        saveToHistory(keyword);
    };

    // Filter results based on Active Tab
    const filteredResults = useMemo(() => {
        if (activeTab === 'all') return searchResults;
        return searchResults.filter(item => {
            if (activeTab === 'knowledge') return item.category === 'Cẩm nang' || item.category === 'Kiêng kỵ';
            if (activeTab === 'nutrition') return item.category === 'Dinh dưỡng';
            if (activeTab === 'health') return item.category === 'Sổ khám bệnh' || item.category === 'Theo dõi sức khỏe' || item.category === 'Tiêm chủng' || item.category === 'Cử động thai';
            if (activeTab === 'personal') return item.category === 'Tài chính' || item.category === 'Nhật ký bé' || item.category === 'Album ảnh' || item.category === 'Đồ đi sinh';
            if (activeTab === 'app') return item.category === 'Ứng dụng';
            return true;
        });
    }, [searchResults, activeTab]);

    // Group counters for tabs
    const tabCounts = useMemo(() => {
        const counts = { all: searchResults.length, knowledge: 0, nutrition: 0, health: 0, personal: 0, app: 0 };
        searchResults.forEach(item => {
            if (item.category === 'Cẩm nang' || item.category === 'Kiêng kỵ') counts.knowledge++;
            else if (item.category === 'Dinh dưỡng') counts.nutrition++;
            else if (item.category === 'Sổ khám bệnh' || item.category === 'Theo dõi sức khỏe' || item.category === 'Tiêm chủng' || item.category === 'Cử động thai') counts.health++;
            else if (item.category === 'Tài chính' || item.category === 'Nhật ký bé' || item.category === 'Album ảnh' || item.category === 'Đồ đi sinh') counts.personal++;
            else if (item.category === 'Ứng dụng') counts.app++;
        });
        return counts;
    }, [searchResults]);

    // Handle Form Submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        setShowHistory(false);
        if (searchQuery.trim()) {
            router.replace(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
            performSearch(searchQuery);
        }
    };

    // Select a suggestion
    const handleSelectSuggestion = (label: string) => {
        setSearchQuery(label);
        setShowSuggestions(false);
        setShowHistory(false);
        setActiveSuggestion(-1);
        router.replace(`/admin/search?q=${encodeURIComponent(label)}`);
        performSearch(label);
    };

    // Keyboard navigation inside suggestions
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions && !showHistory) return;
        const totalItems = showHistory ? searchHistory.length : suggestions.length;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestion(prev => Math.min(prev + 1, totalItems - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestion(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && activeSuggestion >= 0) {
            e.preventDefault();
            const label = showHistory ? searchHistory[activeSuggestion] : suggestions[activeSuggestion].label;
            handleSelectSuggestion(label);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setShowHistory(false);
            setActiveSuggestion(-1);
        }
    };

    // Trigger clear
    const handleClear = () => {
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        setShowHistory(searchHistory.length > 0);
        router.replace('/admin/search');
        setSearchResults([]);
        setHasSearched(false);
    };

    // Helper to escape regex special characters
    const escapeRegExp = (str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper to highlight matching keyword in text
    const highlightText = (text: string, highlight: string) => {
        if (!text) return '';
        if (!highlight.trim()) return text;
        
        try {
            const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
            return (
                <span>
                    {parts.map((part, i) => 
                        part.toLowerCase() === highlight.toLowerCase() 
                            ? <mark key={i} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '4px', fontWeight: 800 }}>{part}</mark> 
                            : part
                    )}
                </span>
            );
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="utility-page-container fade-in search-results-page" style={{ maxWidth: '900px', paddingBottom: '80px' }}>
            
            {/* Search Input Panel */}
            <form onSubmit={handleSearchSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="search-box-wrapper" style={{ position: 'relative', flex: 1 }}>
                        <IoSearchOutline className="search-icon-input" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            onFocus={() => {
                                if (suggestions.length > 0) { setShowSuggestions(true); setShowHistory(false); }
                                else if (!searchQuery.trim() && searchHistory.length > 0) { setShowHistory(true); }
                            }}
                            placeholder="Tìm bất kỳ thứ gì (ví dụ: siêu âm, cá hồi, uốn tóc, sữa...)"
                            autoComplete="off"
                            style={{
                                width: '100%',
                                height: '52px',
                                padding: '14px 48px 14px 48px',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: showSuggestions ? '18px 18px 0 0' : '18px',
                                fontSize: '1rem',
                                color: 'var(--text-main)',
                                background: 'white',
                                outline: 'none',
                                boxShadow: showSuggestions ? '0 2px 0 0 rgba(13,148,136,0.08)' : 'var(--shadow-soft)',
                                transition: 'border-radius 0.15s, box-shadow 0.15s',
                                borderBottom: showSuggestions ? '1.5px solid #e2e8f0' : undefined
                            }}
                            className="search-input-box"
                        />

                        {/* History Dropdown (shown when focused + empty query) */}
                        {showHistory && !showSuggestions && searchHistory.length > 0 && (
                            <div
                                ref={suggestBoxRef}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1.5px solid #e2e8f0',
                                    borderTop: 'none',
                                    borderRadius: '0 0 18px 18px',
                                    boxShadow: '0 12px 32px rgba(15,23,42,0.10)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                    animation: 'suggestFadeIn 0.15s ease'
                                }}
                            >
                                <div style={{ padding: '8px 18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tìm kiếm gần đây</span>
                                    <button onMouseDown={clearHistory} style={{ border: 'none', background: 'none', fontSize: '0.72rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>Xoá tất cả</button>
                                </div>
                                {searchHistory.map((h, i) => (
                                    <div
                                        key={i}
                                        onMouseEnter={() => setActiveSuggestion(i)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '9px 18px',
                                            cursor: 'pointer',
                                            background: activeSuggestion === i ? '#f0fdfa' : 'white',
                                            borderBottom: i < searchHistory.length - 1 ? '1px solid #f8fafc' : 'none',
                                            transition: 'background 0.1s'
                                        }}
                                    >
                                        <span style={{ color: '#cbd5e1', flexShrink: 0 }}>🕐</span>
                                        <span
                                            onMouseDown={() => handleSelectSuggestion(h)}
                                            style={{ flex: 1, fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}
                                        >{h}</span>
                                        <button
                                            onMouseDown={(e) => { e.stopPropagation(); removeFromHistory(h); }}
                                            style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                        >
                                            <IoCloseOutline size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div
                                ref={suggestBoxRef}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1.5px solid #e2e8f0',
                                    borderTop: 'none',
                                    borderRadius: '0 0 18px 18px',
                                    boxShadow: '0 12px 32px rgba(15,23,42,0.10)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                    animation: 'suggestFadeIn 0.15s ease'
                                }}
                            >
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onMouseDown={() => handleSelectSuggestion(s.label)}
                                        onMouseEnter={() => setActiveSuggestion(i)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 18px',
                                            cursor: 'pointer',
                                            background: activeSuggestion === i ? '#f0fdfa' : 'white',
                                            borderBottom: i < suggestions.length - 1 ? '1px solid #f8fafc' : 'none',
                                            transition: 'background 0.12s'
                                        }}
                                    >
                                        {/* Search icon left */}
                                        <IoSearchOutline size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />

                                        {/* Main label */}
                                        <span style={{ flex: 1, fontSize: '0.88rem', color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.label}
                                        </span>

                                        {/* Category badge */}
                                        <span style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 800,
                                            color: s.color,
                                            background: `${s.color}12`,
                                            padding: '2px 8px',
                                            borderRadius: '99px',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {s.category}
                                        </span>
                                    </div>
                                ))}

                                {/* Footer hint */}
                                <div style={{ padding: '7px 18px', background: '#f8fafc', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>↑↓ điều hướng</span>
                                    <span style={{ opacity: 0.5 }}>·</span>
                                    <span>Enter để chọn</span>
                                    <span style={{ opacity: 0.5 }}>·</span>
                                    <span>Esc đóng</span>
                                </div>
                            </div>
                        )}
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px'
                                }}
                            >
                                <IoCloseOutline size={20} />
                            </button>
                        )}
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '18px',
                            border: '1.5px solid #e2e8f0',
                            background: showSettings ? '#f1f5f9' : 'white',
                            color: showSettings ? 'var(--primary)' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-soft)',
                            transition: 'all 0.2s'
                        }}
                        title="Thiết lập phạm vi tìm kiếm"
                        aria-label="Cài đặt phạm vi tìm kiếm"
                    >
                        <IoOptionsOutline size={22} />
                    </button>
                </div>
            </form>

            {/* Search Settings Panel */}
            {showSettings && (
                <div className="card fade-in" style={{
                    padding: '20px',
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    marginBottom: '20px',
                    boxShadow: 'var(--shadow-soft)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoOptionsOutline size={18} color="var(--primary)" />
                            Phạm vi tìm kiếm
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const next: Record<string, boolean> = {};
                                    SEARCHABLE_SOURCES.forEach(s => next[s.id] = true);
                                    setPendingSources(next);
                                }}
                                style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Chọn tất cả
                            </button>
                            <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>|</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const next: Record<string, boolean> = {};
                                    SEARCHABLE_SOURCES.forEach(s => next[s.id] = false);
                                    setPendingSources(next);
                                }}
                                style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Bỏ chọn hết
                            </button>
                        </div>
                    </div>
                    
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>
                        Bật/tắt các mục bên dưới để lọc bớt nguồn tìm kiếm từ các ứng dụng nhỏ. Giúp tìm kiếm lẹ hơn, tiết kiệm dung lượng tải của mẹ bầu.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                        {SEARCHABLE_SOURCES.map(src => {
                            const isEnabled = pendingSources[src.id] !== false;
                            return (
                                <label 
                                    key={src.id} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        cursor: 'pointer', 
                                        fontSize: '0.82rem', 
                                        fontWeight: 700, 
                                        color: '#334155',
                                        background: isEnabled ? '#f8fafc' : '#ffffff',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        border: isEnabled ? `1px solid ${src.color}40` : '1px solid #e2e8f0',
                                        transition: 'all 0.2s'
                                    }}
                                    className="search-setting-item"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => togglePendingSource(src.id)}
                                        style={{ width: '16px', height: '16px', accentColor: src.color, cursor: 'pointer' }}
                                    />
                                    <span style={{ color: isEnabled ? 'var(--text-main)' : '#94a3b8' }}>{src.label}</span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Save Button Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                        {saveSuccess && (
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                animation: 'fadeInUp 0.3s ease'
                            }}>
                                ✓ Đã lưu cài đặt!
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSaveSettings}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '14px',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                transition: 'all 0.2s'
                            }}
                            className="save-settings-btn"
                        >
                            <IoSettingsOutline size={16} />
                            Lưu cài đặt
                        </button>
                    </div>
                </div>
            )}

            {/* Google Search Style Statistics */}
            {hasSearched && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, paddingLeft: '8px', marginBottom: '16px' }}>
                    {loadingDb ? (
                        <span>Đang tìm kiếm trong dữ liệu y khoa...</span>
                    ) : (
                        <span>Tìm thấy {searchResults.length} kết quả ({searchTime} giây)</span>
                    )}
                </div>
            )}

            {/* Google-like Tab Selector */}
            {hasSearched && !loadingDb && (
                <div className="search-tabs-scroll" style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '24px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    gap: '4px'
                }}>
                    {[
                        { id: 'all', label: 'Tất cả', count: tabCounts.all },
                        { id: 'knowledge', label: 'Cẩm nang & Kiêng kỵ', count: tabCounts.knowledge },
                        { id: 'nutrition', label: 'Dinh dưỡng', count: tabCounts.nutrition },
                        { id: 'health', label: 'Sức khỏe & Sổ khám', count: tabCounts.health },
                        { id: 'personal', label: 'Cá nhân & Ghi chép', count: tabCounts.personal },
                        { id: 'app', label: 'Ứng dụng', count: tabCounts.app }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '12px 16px',
                                fontSize: '0.88rem',
                                color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                                fontWeight: activeTab === tab.id ? 800 : 600,
                                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                marginBottom: '-1px'
                            }}
                            className={`search-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label} <span style={{ fontSize: '0.78rem', opacity: 0.7, marginLeft: '2px' }}>({tab.count})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Search Results Display Area */}
            {loadingDb ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <div className="search-spinner" />
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Đang lục tìm dữ liệu, mẹ đợi chút nhé...</span>
                </div>
            ) : hasSearched ? (
                filteredResults.length === 0 ? (
                    <div className="card fade-in" style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>🔍</div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                                Không tìm thấy kết quả cho “{searchQuery}”
                            </h4>
                            <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', margin: 0 }}>Có thể bạn đang tìm một trong những thứ sau:</p>
                        </div>

                        {/* Smart recovery: top 3 closest actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {APP_ACTIONS_INDEX
                                .map(a => ({ action: a, score: scoreResult({ title: a.label, description: a.description + ' ' + a.keywords.join(' '), category: 'Thao tác' }, searchQuery) + (a.keywords.some(k => fuzzyMatch(k, searchQuery)) ? 20 : 0) }))
                                .filter(x => x.score > 0)
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 4)
                                .map(({ action }) => (
                                    <Link key={action.id} href={action.target}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '14px 18px', borderRadius: '16px',
                                            background: `${action.color}08`,
                                            border: `1.5px solid ${action.color}20`,
                                            textDecoration: 'none', transition: 'all 0.18s'
                                        }}
                                        className="recovery-item"
                                    >
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, flexShrink: 0 }}>
                                            {action.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>{action.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {action.location}{action.tab ? ` › ${action.tab}` : ''}
                                            </div>
                                        </div>
                                        <IoChevronForwardOutline size={16} style={{ color: action.color, flexShrink: 0 }} />
                                    </Link>
                                ))
                            }
                        </div>

                        {/* Static keyword chips */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gợi ý tìm kiếm:</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {['huyết áp', 'cá hồi', 'uốn tóc', 'siêu âm', 'tiêm chủng', 'tuần 20'].map(k => (
                                    <button key={k}
                                        onClick={() => { setSearchQuery(k); router.replace(`/admin/search?q=${encodeURIComponent(k)}`); performSearch(k); }}
                                        style={{ border: '1px solid #e2e8f0', background: 'white', color: 'var(--primary)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >{k}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* ⚡ Command Palette Card — shown above all results */}
                        {parsedCommand && (
                            <Link href={parsedCommand.target} style={{ textDecoration: 'none' }}>
                                <div className="fade-in" style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '18px 22px',
                                    borderRadius: '20px',
                                    background: `linear-gradient(135deg, ${parsedCommand.color}15 0%, ${parsedCommand.color}08 100%)`,
                                    border: `2px solid ${parsedCommand.color}30`,
                                    boxShadow: `0 4px 20px ${parsedCommand.color}15`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '14px',
                                        background: `${parsedCommand.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: parsedCommand.color, flexShrink: 0
                                    }}>{parsedCommand.icon}</div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 900,
                                                color: parsedCommand.color,
                                                background: `${parsedCommand.color}18`,
                                                padding: '2px 8px', borderRadius: '99px',
                                                letterSpacing: '0.03em'
                                            }}>{parsedCommand.badge}</span>
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                                            {parsedCommand.label}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {parsedCommand.description}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 16px', borderRadius: '12px',
                                        background: parsedCommand.color, color: 'white',
                                        fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Thực hiện <IoChevronForwardOutline size={14} />
                                    </div>
                                </div>
                            </Link>
                        )}

                        {filteredResults.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '24px',
                                    padding: '22px',
                                    border: '1px solid #f1f5f9',
                                    boxShadow: 'var(--shadow-soft)',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                className="search-result-card"
                            >
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                    {/* Icon category */}
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        background: `${item.color}12`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: item.color,
                                        flexShrink: 0
                                    }}>
                                        {item.icon}
                                    </div>
                                    
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Breadcrumb Google style */}
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                                            <span style={{ color: '#0d9488', fontWeight: 800, letterSpacing: '0.03em' }}>Tìm kiếm</span>
                                            <IoChevronForwardOutline size={10} />
                                            <span style={{ color: item.color }}>{item.category}</span>
                                            {item.date && (
                                                <>
                                                    <IoChevronForwardOutline size={10} />
                                                    <span>{item.date}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Title link */}
                                        <Link href={item.target} replace style={{ textDecoration: 'none' }}>
                                            <h4 
                                                style={{ 
                                                    margin: '0 0 6px 0', 
                                                    fontSize: '1.08rem', 
                                                    fontWeight: 800, 
                                                    color: 'var(--primary-dark)',
                                                    lineHeight: 1.3
                                                }}
                                                className="search-result-title"
                                            >
                                                {highlightText(item.title, searchQuery)}
                                            </h4>
                                        </Link>

                                        {/* Description snippet */}
                                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, textAlign: 'justify', wordBreak: 'break-word' }}>
                                            {highlightText(item.description, searchQuery)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Initial Placeholder State (no query submitted yet)
                <div className="card text-center" style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '28px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(20, 184, 166, 0.15) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        margin: '0 auto 20px auto',
                        fontSize: '2rem'
                    }}>
                        <IoSearchOutline />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>Tìm kiếm thông minh toàn diện</h3>
                    <p style={{ margin: '0 0 24px 0', fontSize: '0.88rem', color: 'var(--text-sub)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>Tìm kiếm tức thì tất cả các bài cẩm nang, thực đơn ăn uống, chỉ số sức khỏe, kiêng kỵ và lịch sử sổ khám bệnh của riêng mẹ.</p>
                    
                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9', width: '100%', maxWidth: '480px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Gợi ý từ khóa mẹ có thể quan tâm:</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {['cà phê', 'sốt', 'siêu âm', 'sữa', 'đám ma', 'uống nước dừa'].map(k => (
                                <button
                                    key={k}
                                    onClick={() => { setSearchQuery(k); router.replace(`/admin/search?q=${encodeURIComponent(k)}`); performSearch(k); }}
                                    style={{ border: 'none', background: 'white', color: 'var(--primary)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-soft)' }}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .search-input-box:focus {
                    background: white !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 4px var(--primary-light) !important;
                }
                
                .search-result-card {
                    will-change: transform, box-shadow;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease !important;
                }
                .search-result-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05) !important;
                }

                .search-result-title {
                    transition: color 0.18s ease;
                }
                .search-result-title:hover {
                    color: var(--primary) !important;
                }

                .search-tabs-scroll::-webkit-scrollbar {
                    display: none;
                }

                .search-spinner {
                    width: 36px;
                    height: 36px;
                    border: 3.5px solid rgba(13, 148, 136, 0.15);
                    border-top: 3.5px solid var(--primary);
                    border-radius: 50%;
                    animation: search-spin-ani 0.8s linear infinite;
                }

                @keyframes search-spin-ani {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .save-settings-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35) !important;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes suggestFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
