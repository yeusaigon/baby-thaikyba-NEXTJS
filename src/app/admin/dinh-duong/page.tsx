'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { 
    IoRestaurantOutline, IoSearchOutline, IoAddCircleOutline, IoCloseOutline, 
    IoTrashOutline, IoPencilOutline, IoFlameOutline, IoCheckmarkCircleOutline, 
    IoWarningOutline, IoCloseCircleOutline, IoCalendarOutline, IoCafeOutline, 
    IoPulseOutline, IoSadOutline, IoLeafOutline, IoFlame, IoFastFoodOutline
} from 'react-icons/io5';

// FOOD DB SAFETY LOOKUP DATA
const FOOD_DB = [
    { name: "Rau ngót", status: "limit", desc: "Chứa Papaverin gây co thắt tử cung. Hạn chế 3 tháng đầu.", cat: "rau" },
    { name: "Mướp đắng (Khổ qua)", status: "limit", desc: "Vị đắng gây co bóp dạ dày/tử cung. Ăn ít.", cat: "rau" },
    { name: "Măng tươi", status: "avoid", desc: "Chứa độc tố xyanua. Phải luộc kỹ nhiều lần. Tốt nhất nên kiêng.", cat: "rau" },
    { name: "Súp lơ xanh", status: "safe", desc: "Siêu thực phẩm! Giàu Axit Folic và Canxi.", cat: "rau" },
    { name: "Rau bina (Chân vịt)", status: "safe", desc: "Nhiều sắt và vitamin. Rất tốt.", cat: "rau" },
    { name: "Khoai lang", status: "safe", desc: "Giàu chất xơ, giảm táo bón thai kỳ cực tốt.", cat: "rau" },
    { name: "Cà rốt", status: "safe", desc: "Giàu Vitamin A giúp mắt bé sáng. Nấu chín kỹ.", cat: "rau" },

    { name: "Dứa (Thơm)", status: "limit", desc: "Chứa Bromelain làm mềm tử cung. Kiêng 3 tháng đầu.", cat: "qua" },
    { name: "Đu đủ xanh", status: "avoid", desc: "Nhựa đu đủ gây co thắt mạnh. Đu đủ chín thì RẤT TỐT (nhuận tràng).", cat: "qua" },
    { name: "Nhãn / Vải", status: "limit", desc: "Tính nóng, nhiều đường. Dễ gây táo bón, nổi mụn.", cat: "qua" },
    { name: "Nước dừa", status: "limit", desc: "Tính hàn. Kiêng 3 tháng đầu. Tốt từ tháng thứ 4 (sạch ối).", cat: "qua" },
    { name: "Bơ", status: "safe", desc: "Vàng mười! Giàu Omega-3 phát triển não bộ bé.", cat: "qua" },
    { name: "Chuối", status: "safe", desc: "Giàu Kali, giảm chuột rút ban đêm.", cat: "qua" },
    { name: "Cam / Quýt", status: "safe", desc: "Nhiều Vitamin C, tăng đề kháng, hỗ trợ hấp thu Sắt.", cat: "qua" },
    { name: "Lựu", status: "safe", desc: "Giàu dưỡng chất, tốt cho tim mạch và não bé.", cat: "qua" },

    { name: "Gan động vật", status: "limit", desc: "Quá nhiều Vitamin A liều cao gây dị tật. Ăn tối đa 1 lần/tuần.", cat: "thit" },
    { name: "Cá thu/ngừ/kiếm", status: "limit", desc: "Nguy cơ nhiễm thủy ngân cao. Hạn chế.", cat: "thit" },
    { name: "Cá hồi", status: "safe", desc: "Giàu DHA nhất. Nên ăn 2 bữa/tuần (nấu chín).", cat: "thit" },
    { name: "Trứng gà", status: "safe", desc: "Protein hoàn hảo. Phải ăn chín hoàn toàn (ko lòng đào).", cat: "thit" },
    { name: "Sashimi/Sushi sống", status: "avoid", desc: "Nguy cơ nhiễm khuẩn/ký sinh trùng. Cấm tuyệt đối.", cat: "thit" },
    { name: "Sữa chua", status: "safe", desc: "Bổ sung Canxi và lợi khuẩn tiêu hóa.", cat: "khac" },
    { name: "Cà phê", status: "limit", desc: "Tối đa 200mg caffeine/ngày (1 ly nhỏ).", cat: "khac" },
    { name: "Rượu bia", status: "avoid", desc: "Cấm. Gây hội chứng rượu bào thai (FAS).", cat: "khac" }
];

const CALORIE_DB = [
    // Phở, Bún, Mì, Hủ Tiếu, Cháo
    { keywords: ['phở bò tái', 'phở bò chín', 'phở bò nạm', 'phở bò'], cal: 450 },
    { keywords: ['phở gà'], cal: 400 },
    { keywords: ['phở'], cal: 400 },
    { keywords: ['bún bò huế', 'bún bò'], cal: 480 },
    { keywords: ['bún chả'], cal: 550 },
    { keywords: ['bún riêu cua', 'bún riêu'], cal: 450 },
    { keywords: ['bún mọc', 'bún mọc dọc mùng'], cal: 400 },
    { keywords: ['bún thịt nướng'], cal: 550 },
    { keywords: ['bún măng vịt', 'bún măng gà'], cal: 500 },
    { keywords: ['bún đậu mắm tôm'], cal: 600 },
    { keywords: ['bún đậu thịt', 'bún đậu'], cal: 450 },
    { keywords: ['bún riêu cua đồng'], cal: 450 },
    { keywords: ['hủ tiếu nam vang', 'hủ tiếu'], cal: 450 },
    { keywords: ['mì quảng gà', 'mì quảng tôm thịt', 'mì quảng'], cal: 500 },
    { keywords: ['bánh canh ruộng', 'bánh canh bột lọc', 'bánh canh'], cal: 450 },
    { keywords: ['mì xào bò', 'mì xào hải sản', 'mì xào'], cal: 500 },
    { keywords: ['mì tôm trứng', 'mì tôm', 'mì ăn liền'], cal: 350 },
    { keywords: ['cháo bồ câu', 'cháo chim bồ câu'], cal: 350 },
    { keywords: ['cháo cá chép'], cal: 300 },
    { keywords: ['cháo gà'], cal: 250 },
    { keywords: ['cháo sườn'], cal: 300 },
    { keywords: ['cháo thịt bằm', 'cháo thịt băm'], cal: 250 },
    { keywords: ['cháo dinh dưỡng', 'cháo trắng', 'cháo'], cal: 180 },
    { keywords: ['bún'], cal: 150 },

    // Cơm & Món Mặn Ăn Cơm
    { keywords: ['cơm trắng', 'chén cơm', 'bát cơm', 'bát cơm trắng', 'chén cơm trắng'], cal: 130 },
    { keywords: ['cơm tấm sườn bì chả', 'cơm tấm sườn', 'cơm tấm'], cal: 650 },
    { keywords: ['cơm chiên dương châu', 'cơm chiên hải sản', 'cơm chiên', 'cơm rang'], cal: 550 },
    { keywords: ['cơm gà xối mỡ', 'cơm gà'], cal: 600 },
    { keywords: ['thịt kho tàu', 'thịt kho hột vịt'], cal: 350 },
    { keywords: ['thịt kho tiêu', 'thịt kho'], cal: 300 },
    { keywords: ['thịt ba chỉ luộc', 'thịt heo luộc', 'thịt luộc'], cal: 200 },
    { keywords: ['thịt ba chỉ', 'thịt ba rọi'], cal: 350 },
    { keywords: ['thịt bò xào súp lơ', 'thịt bò xào', 'bò xào'], cal: 320 },
    { keywords: ['thịt bò né', 'bò bít tết', 'bò né'], cal: 450 },
    { keywords: ['bò kho'], cal: 400 },
    { keywords: ['sườn chua ngọt', 'sườn xào chua ngọt'], cal: 380 },
    { keywords: ['sườn rim'], cal: 300 },
    { keywords: ['gà ta kho gừng', 'gà kho gừng'], cal: 280 },
    { keywords: ['gà luộc'], cal: 180 },
    { keywords: ['gà chiên nước mắm', 'gà rán', 'gà chiên'], cal: 400 },
    { keywords: ['thịt heo quay', 'heo quay'], cal: 400 },
    { keywords: ['thịt bò'], cal: 250 },
    { keywords: ['thịt heo', 'thịt lợn'], cal: 240 },
    { keywords: ['cá chép kho tộ', 'cá kho tộ'], cal: 250 },
    { keywords: ['cá lóc kho', 'cá kho'], cal: 220 },
    { keywords: ['cá hồi áp chảo', 'cá hồi nướng'], cal: 300 },
    { keywords: ['cá thu sốt cà chua', 'cá thu sốt cà'], cal: 280 },
    { keywords: ['cá chiên', 'cá rán'], cal: 250 },
    { keywords: ['cá chép hấp', 'cá hấp'], cal: 180 },
    { keywords: ['tôm rim mặn ngọt', 'tôm rim'], cal: 200 },
    { keywords: ['tôm đất luộc', 'tôm hấp', 'tôm luộc'], cal: 100 },
    { keywords: ['mực xào cần tỏi', 'mực xào'], cal: 200 },
    { keywords: ['mực hấp hành', 'mực hấp'], cal: 120 },
    { keywords: ['đậu hũ nhồi thịt', 'đậu phụ nhồi thịt'], cal: 280 },
    { keywords: ['đậu phụ sốt cà chua', 'đậu phụ sốt cà', 'đậu hũ sốt cà'], cal: 200 },
    { keywords: ['đậu phụ rán', 'đậu hũ rán', 'đậu phụ chiên'], cal: 150 },
    { keywords: ['trứng luộc'], cal: 70 },
    { keywords: ['trứng ốp la'], cal: 110 },
    { keywords: ['trứng chiên', 'trứng rán'], cal: 120 },
    { keywords: ['trứng hấp thịt', 'trứng hấp'], cal: 100 },

    // Canh & Rau
    { keywords: ['canh bí đỏ thịt bằm', 'canh bí đỏ'], cal: 120 },
    { keywords: ['canh chua cá lóc', 'canh chua tôm', 'canh chua'], cal: 150 },
    { keywords: ['canh rau ngót nấu thịt bằm', 'canh rau ngót'], cal: 70 },
    { keywords: ['canh sườn khoai tây', 'canh sườn bí đao', 'canh sườn'], cal: 180 },
    { keywords: ['canh bầu nấu tôm', 'canh bầu'], cal: 70 },
    { keywords: ['canh mồng tơi nấu mướp', 'canh mồng tơi'], cal: 60 },
    { keywords: ['canh cua rau đay', 'canh cua'], cal: 100 },
    { keywords: ['canh xà lách xoong', 'canh xà lách song'], cal: 50 },
    { keywords: ['canh rau'], cal: 50 },
    { keywords: ['rau muống xào tỏi', 'rau muống xào'], cal: 120 },
    { keywords: ['rau cải xào', 'rau bí xào', 'rau xào'], cal: 100 },
    { keywords: ['rau muống luộc', 'rau cải luộc', 'rau luộc'], cal: 30 },
    { keywords: ['xà lách', 'rau xà lách'], cal: 20 },
    { keywords: ['salad cá hồi', 'salad ức gà', 'salad'], cal: 150 },

    // Món Ăn Nhẹ & Đồ Dưỡng Thai Cho Mẹ Bầu
    { keywords: ['sữa bà bầu', 'sữa bầu'], cal: 180 },
    { keywords: ['sữa hạt sen', 'sữa đậu nành', 'sữa óc chó', 'sữa hạt'], cal: 120 },
    { keywords: ['sữa tươi tiệt trùng', 'sữa tươi không đường', 'sữa tươi ít đường', 'sữa tươi'], cal: 130 },
    { keywords: ['sữa hộp', 'hộp sữa'], cal: 130 },
    { keywords: ['sữa chua hy lạp'], cal: 120 },
    { keywords: ['sữa chua có đường', 'sữa chua không đường', 'sữa chua'], cal: 100 },
    { keywords: ['yến sào chưng', 'nước yến chưng', 'nước yến', 'yến sào'], cal: 80 },
    { keywords: ['ngũ cốc dinh dưỡng', 'ngũ cốc thai kỳ', 'ngũ cốc'], cal: 150 },
    { keywords: ['hạt óc chó', 'óc chó'], cal: 180 },
    { keywords: ['hạt hạnh nhân', 'hạnh nhân'], cal: 160 },
    { keywords: ['hạt macca', 'macca'], cal: 200 },
    { keywords: ['hạt chia'], cal: 60 },
    { keywords: ['khoai lang luộc', 'khoai lang nướng', 'khoai lang'], cal: 120 },
    { keywords: ['ngô luộc', 'bắp luộc', 'bắp ngô luộc'], cal: 150 },
    { keywords: ['bánh mì đen', 'bánh mì nguyên cám'], cal: 160 },
    { keywords: ['bánh mì kẹp trứng', 'bánh mì thịt', 'bánh mì', 'bánh mỳ'], cal: 350 },
    { keywords: ['súp cua tuyết', 'súp cua nấm đông cô', 'súp cua'], cal: 160 },
    { keywords: ['súp gà nấm', 'súp gà'], cal: 180 },
    { keywords: ['trứng vịt lộn'], cal: 180 },

    // Trái Cây & Nước Ép
    { keywords: ['bơ dầm sữa chua', 'bơ dầm sữa', 'bơ dầm'], cal: 220 },
    { keywords: ['sinh tố bơ'], cal: 260 },
    { keywords: ['quả bơ', 'trái bơ'], cal: 160 },
    { keywords: ['chuối chín', 'quả chuối', 'chuối'], cal: 90 },
    { keywords: ['quả táo', 'táo đỏ', 'táo'], cal: 60 },
    { keywords: ['quả cam', 'nước cam ép', 'nước cam', 'cam'], cal: 70 },
    { keywords: ['quả bưởi', 'nước bưởi ép', 'bưởi'], cal: 45 },
    { keywords: ['nước dừa tươi', 'nước dừa', 'quả dừa'], cal: 60 },
    { keywords: ['đu đủ chín', 'đu đủ'], cal: 80 },
    { keywords: ['thanh long ruột đỏ', 'thanh long ruột trắng', 'thanh long'], cal: 65 },
    { keywords: ['quả xoài chín', 'quả xoài', 'xoài'], cal: 120 },
    { keywords: ['quả nho', 'chùm nho', 'nho'], cal: 70 },
    { keywords: ['quả lựu', 'nước lựu', 'lựu'], cal: 80 },
    { keywords: ['quả ổi', 'ổi chín', 'ổi'], cal: 50 },
    { keywords: ['nước mía'], cal: 150 },

    // Đồ Ăn Vặt / Khác
    { keywords: ['bánh quy nguyên cám', 'bánh quy'], cal: 120 },
    { keywords: ['trà gừng mật ong', 'trà gừng'], cal: 45 },
    { keywords: ['cà phê sữa', 'cà phê'], cal: 120 },
    { keywords: ['chè bắp', 'chè sen', 'chè ít đường', 'chè'], cal: 250 }
];

const WEEKLY_MENU = [
    {
        day: '2',
        title: 'Thứ Hai',
        tag: 'Khởi động tuần mới',
        tagColor: '#f97316',
        tagBg: '#fff7ed',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Phở bò chín + 1 quả táo.', note: 'Thịt bò giàu sắt phòng ngừa thiếu máu, táo cung cấp chất xơ dồi dào giảm táo bón.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm + Sườn rim mắm + Canh rau cải ngọt nấu thịt bằm + Quýt ngọt tráng miệng.', note: 'Đảm bảo protein và vitamin C thúc đẩy hấp thụ sắt tốt hơn.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cà ri gà ít béo dùng nước cốt dừa loãng + Chè bắp ngô ít đường.', note: 'Nạp năng lượng nhẹ nhàng và carbohydrate dễ tiêu hóa trước khi ngủ.' }
        ]
    },
    {
        day: '3',
        title: 'Thứ Ba',
        tag: 'Bữa ăn thanh mát',
        tagColor: '#10b981',
        tagBg: '#ecfdf5',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Bánh mì nguyên cám kẹp trứng ốp la chín + Salad xà lách cà chua.', note: 'Trứng chín hoàn toàn cung cấp choline rất tốt cho tế bào não của bé.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Thịt bò xào rau muống tỏi + Canh khoai mỡ + Lê ngọt.', note: 'Khoai mỡ bổ sung kali, rau muống cung cấp khoáng chất vi lượng cần thiết.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Mì xào hải sản chín kỹ (tôm, mực) + Salad rau mầm dầu giấm.', note: 'Hải sản nấu chín kỹ cung cấp kẽm dồi dào hỗ trợ miễn dịch.' }
        ]
    },
    {
        day: '4',
        title: 'Thứ Tư',
        tag: 'Tăng cường Canxi',
        tagColor: '#3b82f6',
        tagBg: '#eff6ff',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Bún riêu cua đồng chín + Sinh tố bơ ít sữa đặc.', note: 'Riêu cua đồng rất giàu canxi tự nhiên cho xương răng của bé phát triển.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Cá trê kho nghệ + Canh bí đao sườn non + 1 quả Cam chín.', note: 'Nghệ kháng viêm tốt, bí đao thanh nhiệt giải độc cơ thể cực hiệu quả.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cơm trắng + Cá thu sốt cà chua + Canh củ hầm (khoai tây, cà rốt).', note: 'Bổ sung axit béo và vitamin A hỗ trợ tế bào võng mạc của thai nhi.' }
        ]
    },
    {
        day: '5',
        title: 'Thứ Năm',
        tag: 'Phát triển trí não (DHA)',
        tagColor: '#8b5cf6',
        tagBg: '#f5f3ff',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Bánh mì sandwich bơ tỏi nướng + 1 ly sữa hạt điều óc chó ấm.', note: 'Quả óc chó chứa nhiều omega-3 thực vật bổ não cho bé yêu.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Tôm đất xào súp lơ xanh + Canh tần ô thịt bằm + Vú sữa chín.', note: 'Súp lơ xanh là vua axit folic ngăn ngừa dị tật ống thần kinh thai nhi.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cơm trắng + Cá hồi áp chảo sốt bơ chanh + Canh mồng tơi nấu nghêu.', note: 'Cá hồi cung cấp lượng lớn DHA và omega-3 tinh khiết phát triển trí não.' }
        ]
    },
    {
        day: '6',
        title: 'Thứ Sáu',
        tag: 'Thực phẩm dễ tiêu hóa',
        tagColor: '#ec4899',
        tagBg: '#fdf2f8',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Súp cua tuyết nấm đông cô + 1/2 quả thanh long ruột đỏ.', note: 'Súp ấm mềm dễ ăn vào buổi sáng cho mẹ bớt nghén, thanh long giải nhiệt.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Cá chép kho tộ + Canh rau đay mồng tơi nấu cua + Nho ngọt.', note: 'Cá chép dưỡng thai rất tốt theo y học cổ truyền, rau đay chống táo bón.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cơm trắng + Tôm rim mặn ngọt + Canh bí đỏ hầm xương heo + Đu đủ chín.', note: 'Bí đỏ giàu vitamin A và chất sắt, đu đủ chín giúp nhuận tràng dễ ngủ.' }
        ]
    },
    {
        day: '7',
        title: 'Thứ Bảy',
        tag: 'Bồi bổ cuối tuần',
        tagColor: '#f59e0b',
        tagBg: '#fffbeb',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Cháo cá chép hành ngò nóng hổi + 1 ly nước mía nhỏ.', note: 'Cháo cá chép bổ khí huyết, an thai. Nước mía hỗ trợ thải độc tốt (uống vừa phải).' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Gà ta kho gừng tươi + Canh mướp hương nấu tôm + Sapoche tráng miệng.', note: 'Gà kho gừng làm ấm bụng, mướp hương nhiều vitamin hỗ trợ tuần hoàn tốt.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cơm trắng + Trứng hấp thịt bằm mộc nhĩ + Canh nấm rơm nấu đậu hũ.', note: 'Bữa tối nhẹ bụng giàu đạm thực vật từ đậu hũ giúp ngủ ngon.' }
        ]
    },
    {
        day: '8',
        title: 'Chủ Nhật',
        tag: 'Đổi vị ấm cúng',
        tagColor: '#ef4444',
        tagBg: '#fef2f2',
        meals: [
            { time: 'Sáng', emoji: '🌅', color: '#f59e0b', dish: 'Nui xào thịt bò bằm + 1 ly sữa tươi tiệt trùng không đường.', note: 'Nui dễ ăn, sữa tươi cung cấp canxi và vitamin D thiết yếu hàng ngày.' },
            { time: 'Trưa', emoji: '☀️', color: '#10b981', dish: 'Cơm trắng + Sườn sụn chua ngọt + Canh rau cải bẹ xanh nấu gừng + Nước bưởi ép.', note: 'Cải bẹ xanh giàu chất xơ, bưởi ép chứa vitamin C dồi dào làm sáng da mẹ.' },
            { time: 'Tối', emoji: '🌙', color: '#3b82f6', dish: 'Cơm trắng + Thịt heo kho trứng cút + Canh mướp nhồi thịt + 1 quả ổi chín.', note: 'Trứng cút bổ sung lecithin, ổi chín bỏ ruột giàu chất xơ và vitamin.' }
        ]
    }
];

const getLocalDatetimeString = (d = new Date()) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
};

export default function NutritionPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'lookup' | 'guide' | 'diary'>('lookup');
    
    // Lookup state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterCategory, setFilterCategory] = useState('rau');

    // Guide state
    const [selectedDay, setSelectedDay] = useState('2');

    // Diary state
    const [meals, setMeals] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [mealId, setMealId] = useState('');
    const [mealType, setMealType] = useState('sang');
    const [mealContent, setMealContent] = useState('');
    const [mealDatetime, setMealDatetime] = useState(getLocalDatetimeString());
    const [mealCalories, setMealCalories] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'lookup' || tabParam === 'guide' || tabParam === 'diary') {
                setActiveTab(tabParam);
            }
        }

        const currentUser = auth.currentUser;
        if (!currentUser) return;
        setUser(currentUser);

        const q = query(
            collection(db, "users", currentUser.uid, "nutrition_diary"),
            orderBy("datetime", "desc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setMeals(list);
        });

        return () => unsubscribe();
    }, []);

    const handleContentChange = (val: string) => {
        setMealContent(val);
        let text = val.toLowerCase();
        let totalCal = 0;

        // Xây dựng danh sách phẳng chứa tất cả từ khóa đã sắp xếp theo độ dài giảm dần
        // để ưu tiên so khớp các từ khóa dài/cụ thể trước (vd: "phở bò chín" trước "phở", "sữa chua hy lạp" trước "sữa chua")
        const flatKeywords: { keyword: string; cal: number }[] = [];
        CALORIE_DB.forEach(item => {
            item.keywords.forEach(keyword => {
                flatKeywords.push({ keyword: keyword.toLowerCase(), cal: item.cal });
            });
        });
        flatKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

        flatKeywords.forEach(fk => {
            let index;
            // Tìm và xử lý tất cả các lần xuất hiện của từ khóa
            while ((index = text.indexOf(fk.keyword)) !== -1) {
                // Lấy chuỗi ký tự phía trước từ khóa (tối đa 15 ký tự) để tìm số lượng/số nhân
                const beforeText = text.substring(Math.max(0, index - 15), index);
                const matches = [...beforeText.matchAll(/(\d+(?:[.,]\d+)?)/g)];
                let multiplier = 1;
                
                if (matches.length > 0) {
                    const numStr = matches[matches.length - 1][0].replace(',', '.');
                    const valNum = parseFloat(numStr);
                    if (!isNaN(valNum) && valNum > 0 && valNum < 20) {
                        multiplier = valNum;
                    }
                }
                
                totalCal += Math.round(fk.cal * multiplier);
                
                // Thay thế từ khóa đã so khớp bằng các khoảng trắng để tránh so khớp lặp lại
                const spaces = ' '.repeat(fk.keyword.length);
                text = text.substring(0, index) + spaces + text.substring(index + fk.keyword.length);
                
                // Đồng thời xóa số lượng đã khớp để tránh các từ khóa khác sử dụng nhầm
                if (matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    const matchIndex = lastMatch.index!;
                    const absMatchIndex = Math.max(0, index - 15) + matchIndex;
                    const matchLen = lastMatch[0].length;
                    text = text.substring(0, absMatchIndex) + ' '.repeat(matchLen) + text.substring(absMatchIndex + matchLen);
                }
            }
        });

        if (totalCal > 0) setMealCalories(totalCal.toString());
        else setMealCalories('');
    };

    const saveMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!mealContent.trim()) { alert("Vui lòng điền món mẹ ăn!"); return; }
        setIsSaving(true);
        const payload = {
            datetime: mealDatetime,
            type: mealType,
            content: mealContent.trim(),
            calories: Number(mealCalories) || 0,
            timestamp: serverTimestamp()
        };
        try {
            if (mealId) await updateDoc(doc(db, "users", user.uid, "nutrition_diary", mealId), payload);
            else await addDoc(collection(db, "users", user.uid, "nutrition_diary"), payload);
            closeMealModal();
        } catch (err: any) { alert("Lỗi khi lưu: " + err.message); } finally { setIsSaving(false); }
    };

    const deleteMeal = async (id: string) => {
        if (!user) return;
        if (confirm("Mẹ có muốn xóa ghi chép bữa ăn này không?")) {
            try { await deleteDoc(doc(db, "users", user.uid, "nutrition_diary", id)); }
            catch (err: any) { alert("Lỗi khi xóa: " + err.message); }
        }
    };

    const openAddModal = () => {
        setMealId(''); setMealType('sang'); setMealContent(''); setMealDatetime(getLocalDatetimeString()); setMealCalories(''); setShowModal(true);
    };

    const openEditModal = (m: any) => {
        setMealId(m.id); setMealType(m.type); setMealContent(m.content); setMealDatetime(m.datetime || getLocalDatetimeString()); setMealCalories(m.calories ? m.calories.toString() : ''); setShowModal(true);
    };

    const closeMealModal = () => setShowModal(false);

    const filteredFood = FOOD_DB.filter(f => {
        const matchesKeyword = f.name.toLowerCase().includes(searchKeyword.toLowerCase()) || f.desc.toLowerCase().includes(searchKeyword.toLowerCase());
        // Nếu có từ khóa tìm kiếm, tìm kiếm trên toàn bộ cơ sở dữ liệu để mẹ bầu không phải chuyển tab
        const matchesCategory = searchKeyword.trim() !== '' || f.cat === filterCategory;
        return matchesKeyword && matchesCategory;
    });

    const groups: { [key: string]: { meals: any[], totalCal: number } } = {};
    meals.forEach(m => {
        const dateKey = m.datetime ? m.datetime.split('T')[0] : 'Chưa xác định';
        if (!groups[dateKey]) groups[dateKey] = { meals: [], totalCal: 0 };
        groups[dateKey].meals.push(m);
        groups[dateKey].totalCal += (Number(m.calories) || 0);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    const todayStr = getLocalDatetimeString().split('T')[0];
    const yesterdayStr = (() => { let d = new Date(); d.setDate(d.getDate() - 1); return getLocalDatetimeString(d).split('T')[0]; })();

    const mealNames: any = { 'sang': 'Bữa Sáng', 'trua': 'Bữa Trưa', 'toi': 'Bữa Tối', 'phu': 'Bữa Phụ' };
    const mealColors: any = { 'sang': '#f59e0b', 'trua': '#10b981', 'toi': '#3b82f6', 'phu': '#db2777' };

    const getStatusConfig = (status: string) => {
        if (status === 'safe') return { color: '#10b981', bg: '#ecfdf5', border: 'rgba(16, 185, 129, 0.15)', icon: <IoCheckmarkCircleOutline />, text: 'Nên dùng' };
        if (status === 'limit') return { color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245, 158, 11, 0.15)', icon: <IoWarningOutline />, text: 'Hạn chế' };
        return { color: '#ef4444', bg: '#fef2f2', border: 'rgba(239, 68, 68, 0.15)', icon: <IoCloseCircleOutline />, text: 'Nên tránh' };
    };

    const todayCalories = groups[todayStr]?.totalCal || 0;
    const calorieGoal = 2200;
    const calProgressPercent = Math.min((todayCalories / calorieGoal) * 100, 100);
    
    let calorieAdvice = "Mẹ chưa ghi chép bữa ăn nào hôm nay. Hãy ghi lại bữa ăn của mẹ nhé!";
    let adviceColor = "var(--text-sub)";
    if (todayCalories > 0 && todayCalories < 1500) {
        calorieAdvice = "Lượng calo hôm nay hơi thấp. Mẹ hãy ăn thêm bữa phụ để đảm bảo dưỡng chất cho bé nhé!";
        adviceColor = "#f59e0b";
    } else if (todayCalories >= 1500 && todayCalories <= 2500) {
        calorieAdvice = "Tuyệt vời! Lượng calo nạp vào hôm nay rất cân đối và lý tưởng cho thai kỳ.";
        adviceColor = "#10b981";
    } else if (todayCalories > 2500) {
        calorieAdvice = "Lượng calo hôm nay hơi cao so với khuyến nghị. Mẹ hãy hạn chế đồ ngọt và dầu mỡ.";
        adviceColor = "#ef4444";
    }

    const currentMenu = WEEKLY_MENU.find(m => m.day === selectedDay) || WEEKLY_MENU[0];

    return (
        <>
            <div className="utility-page-container fade-in">
                <div className="dinhduong-hero-card">
                    <div style={{ position: 'relative', zIndex: 2, marginRight: '40px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Dinh Dưỡng An Toàn</h2>
                        <p style={{ opacity: 0.95, fontSize: '0.88rem', marginTop: '6px', fontWeight: 500, lineHeight: 1.45 }}>Tra cứu nhanh thực phẩm: Nên dùng, hạn chế hay cần tránh tuyệt đối trong thai kỳ.</p>
                    </div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '-10px', 
                        bottom: '-10px', 
                        opacity: 0.18, 
                        color: 'white', 
                        transform: 'rotate(-15deg)',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}>
                        <IoLeafOutline size={100} />
                    </div>
                </div>

                <div className="segmented-control">
                    <button onClick={() => setActiveTab('lookup')} className={`segment-btn ${activeTab === 'lookup' ? 'active' : ''}`}>
                        Tra cứu
                    </button>
                    <button onClick={() => setActiveTab('guide')} className={`segment-btn ${activeTab === 'guide' ? 'active' : ''}`}>
                        Thực đơn
                    </button>
                    <button onClick={() => setActiveTab('diary')} className={`segment-btn ${activeTab === 'diary' ? 'active' : ''}`}>
                        Nhật ký
                    </button>
                </div>

                {activeTab === 'lookup' && (
                    <div id="view-lookup" className="fade-in">
                        <div className="search-box">
                            <div className="filter-row" style={{ marginTop: 0 }}>
                                {[
                                    { id: 'rau', label: 'Rau củ' },
                                    { id: 'qua', label: 'Trái cây' },
                                    { id: 'thit', label: 'Thịt cá' },
                                    { id: 'khac', label: 'Đồ uống / Khác' }
                                ].map(chip => (
                                    <button key={chip.id} onClick={() => setFilterCategory(chip.id)} className={`filter-chip ${filterCategory === chip.id ? 'active' : ''}`}>
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="food-grid">
                            {filteredFood.length === 0 ? (
                                <div className="card text-center" style={{ gridColumn: '1 / -1', padding: '60px 20px', background: 'rgba(255,255,255,0.7)' }}>
                                    <IoRestaurantOutline style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '15px' }} />
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0 0 5px 0' }}>Không tìm thấy thực phẩm này</h3>
                                    <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', margin: 0 }}>Mẹ hãy thử tìm kiếm bằng từ khóa khác nhé.</p>
                                </div>
                            ) : (
                                filteredFood.map((item, idx) => {
                                    const cfg = getStatusConfig(item.status);
                                    return (
                                        <div className="food-card" key={idx} style={{ borderLeft: `5px solid ${cfg.color}`, borderTopColor: cfg.border, borderRightColor: cfg.border, borderBottomColor: cfg.border }}>
                                            <div className="food-card-header">
                                                <span className="food-card-name">{item.name}</span>
                                                <span className="food-card-badge" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                                    {cfg.icon} <span>{cfg.text}</span>
                                                </span>
                                            </div>
                                            <p className="food-card-desc">{item.desc}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'guide' && (
                    <div id="view-guide" className="fade-in">
                        <div className="guide-layout">
                            <div className="guide-header-panel">
                                <h3 className="section-title"><IoCalendarOutline /> Thực đơn vàng 7 ngày</h3>
                                <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', margin: '0 0 15px 0', fontWeight: 500 }}>Lên kế hoạch ăn uống đầy đủ dưỡng chất mỗi ngày giúp thai nhi phát triển vượt trội.</p>
                                <div className="day-selector-ribbon">
                                    {WEEKLY_MENU.map(m => (
                                        <button key={m.day} onClick={() => setSelectedDay(m.day)} className={`day-selector-btn ${selectedDay === m.day ? 'active' : ''}`}>{m.title}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="menu-detail-panel">
                                <div className="menu-header-bar" style={{ borderColor: currentMenu.tagColor }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Thực đơn {currentMenu.title}</span>
                                    <span className="menu-tag" style={{ color: currentMenu.tagColor, backgroundColor: currentMenu.tagBg }}>{currentMenu.tag}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {currentMenu.meals.map((meal, index) => (
                                        <div key={index} className="menu-dish-card">
                                            <div className="menu-dish-time-badge" style={{ backgroundColor: meal.color }}>{meal.emoji} {meal.time}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1e293b', marginBottom: '4px', wordBreak: 'break-word' }}>{meal.dish}</div>
                                                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: '4px', minWidth: 0 }}>
                                                    <IoLeafOutline style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
                                                    <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{meal.note}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <h3 className="section-title" style={{ marginTop: '30px' }}><IoCafeOutline /> Gợi ý các bữa phụ dưỡng chất (9h & 15h)</h3>
                        <div className="snack-card card">
                            <div className="snack-grid">
                                <div className="snack-item">
                                    <span className="snack-bullet">🌅 Bữa phụ sáng (9h):</span>
                                    <span>Sữa tươi tiệt trùng không đường, sữa chua Hy Lạp mix hạt (óc chó, macca, hạt chia), khoai lang chín.</span>
                                </div>
                                <div className="snack-item">
                                    <span className="snack-bullet">🌆 Bữa phụ chiều (15h):</span>
                                    <span>Trái cây tươi mát ít ngọt (ổi chín bỏ ruột, bưởi hồng, lê, bơ dầm nhạt), bánh quy nguyên cám, nước yến chưng đường phèn.</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="section-title" style={{ marginTop: '30px' }}><IoPulseOutline /> Dinh dưỡng đẩy lùi khó chịu thai kỳ</h3>
                        <div className="symptom-grid">
                            <div className="symptom-card">
                                <div className="sym-title" style={{ color: '#be123c' }}><IoSadOutline /> Giảm Ốm Nghén</div>
                                <p className="sym-solution">Ngậm lát gừng ấm, trà hoa cúc nhẹ, ăn bánh quy khô hoặc lát bánh mì nướng vào sáng sớm. Chia nhỏ bữa ăn làm 5-6 lần, tránh đồ quá béo ngậy.</p>
                            </div>
                            <div className="symptom-card">
                                <div className="sym-title" style={{ color: '#047857' }}><IoLeafOutline /> Tránh Táo Bón</div>
                                <p className="sym-solution">Tăng cường khoai lang luộc, thanh long đỏ, rau đay, rau mồng tơi, hạt chia ngâm nở. Uống tối thiểu 2 đến 2.5 lít nước ấm trải dài cả ngày.</p>
                            </div>
                            <div className="symptom-card">
                                <div className="sym-title" style={{ color: '#1e3a8a' }}><IoPulseOutline /> Chặn Chuột Rút</div>
                                <p className="sym-solution">Bổ sung canxi tự nhiên từ sữa tươi không đường, phô mai pasteur, và kali từ quả chuối chín, quả bơ, trứng gà luộc chín hoàn toàn.</p>
                            </div>
                            <div className="symptom-card">
                                <div className="sym-title" style={{ color: '#b45309' }}><IoFlame /> Giảm Ợ Nóng</div>
                                <p className="sym-solution">Ăn chậm nhai kỹ, không ăn quá no một lúc. Tuyệt đối không nằm ngay sau khi ăn xong ít nhất 1 tiếng. Tránh các thực phẩm chua cay, nhiều dầu mỡ.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'diary' && (
                    <div id="view-diary" className="fade-in">
                        <div className="diary-layout">
                            <div className="diary-left-col">
                                <div className="calorie-progress-card card">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Hôm nay nạp</span>
                                    <div className="calorie-progress-bar">
                                        <div className="calorie-progress-fill" style={{ width: `${calProgressPercent}%`, backgroundColor: todayCalories > 2500 ? '#ef4444' : '#10b981' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{todayCalories}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)' }}>Mục tiêu: {calorieGoal} kcal</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', lineHeight: 1.45, fontWeight: 600, color: adviceColor, margin: 0, transition: 'color 0.2s' }}>{calorieAdvice}</p>
                                </div>
                                <button className="add-meal-btn" onClick={openAddModal}><IoAddCircleOutline size={22} /> Ghi chép bữa ăn</button>
                            </div>
                            <div className="diary-right-col">
                                <div id="diary-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {sortedDates.length === 0 ? (
                                        <div className="card text-center" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.7)', border: '2px dashed #e2e8f0', boxShadow: 'none' }}>
                                            <IoFastFoodOutline style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '15px' }} />
                                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0 0 5px 0' }}>Chưa ghi chép bữa ăn</h3>
                                            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', margin: '0 0 15px 0' }}>Mẹ hãy bắt đầu nhật ký ăn uống hôm nay bằng cách chạm vào nút phía trên nhé.</p>
                                        </div>
                                    ) : (
                                        sortedDates.map(date => {
                                            let dateLabel = date === todayStr ? "Hôm nay" : date === yesterdayStr ? "Hôm qua" : date.split('-').reverse().join('/');
                                            const group = groups[date];
                                            const sortedMeals = [...group.meals].sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''));
                                            return (
                                                <div className="day-card" key={date}>
                                                    <div className="day-header">
                                                        <span className="day-title">{dateLabel}</span>
                                                        <span className="day-cals"><IoFlameOutline /> <span>{group.totalCal} kcal</span></span>
                                                    </div>
                                                    <div className="day-meals">
                                                        {sortedMeals.map(m => {
                                                            const timeStr = m.datetime ? m.datetime.split('T')[1]?.substring(0, 5) : '';
                                                            return (
                                                                <div className="day-meal-item" key={m.id} style={{ borderLeftColor: mealColors[m.type] || '#ccc' }}>
                                                                    <div className="dmi-top">
                                                                        <div className="dmi-type" style={{ color: mealColors[m.type] }}>
                                                                            <span style={{ fontSize: '1.1rem' }}>{m.type === 'sang' ? '🌅' : m.type === 'trua' ? '☀️' : m.type === 'toi' ? '🌙' : '☕'}</span>
                                                                            <span>{mealNames[m.type] || 'Bữa ăn'}</span>
                                                                            <span className="dmi-time">{timeStr}</span>
                                                                        </div>
                                                                        <div className="dmi-actions">
                                                                            <button onClick={() => openEditModal(m)} className="dmi-action-btn"><IoPencilOutline /></button>
                                                                            <button onClick={() => deleteMeal(m.id)} className="dmi-action-btn del"><IoTrashOutline /></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="dmi-content">{m.content}</div>
                                                                    {m.calories > 0 && <div className="dmi-cal"><IoFlameOutline /> {m.calories} kcal</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Sheet modal for meal write */}
            {showModal && (
                <div id="meal-modal" className="modal open" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2100, alignItems: 'flex-end', justifyContent: 'center' }} onClick={closeMealModal}>
                    <div className="modal-bottom-sheet" style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '28px 28px 0 0', padding: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 id="meal-modal-title" style={{ margin: 0, fontSize: '1.3rem', color: '#1f1f1f', fontWeight: 800 }}>{mealId ? 'Sửa bữa ăn' : 'Ghi chép bữa ăn'}</h3>
                            <button onClick={closeMealModal} className="icon-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#444' }}>
                                <IoCloseOutline size={26} />
                            </button>
                        </div>
                        <div className="sheet-content" style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
                            <form onSubmit={saveMeal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="input-group">
                                    <label className="text-label">Thời gian ăn</label>
                                    <input 
                                        type="datetime-local" 
                                        value={mealDatetime} 
                                        onChange={(e) => setMealDatetime(e.target.value)} 
                                        className="form-input" 
                                        required 
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="text-label">Bữa ăn</label>
                                    <select 
                                        value={mealType} 
                                        onChange={(e) => setMealType(e.target.value)} 
                                        className="form-input"
                                        style={{ height: '48px', appearance: 'none', WebkitAppearance: 'none' }}
                                    >
                                        <option value="sang">Bữa Sáng</option>
                                        <option value="trua">Bữa Trưa</option>
                                        <option value="toi">Bữa Tối</option>
                                        <option value="phu">Bữa Phụ / Ăn vặt</option>
                                    </select>
                                </div>
                                
                                <div className="input-group">
                                    <label className="text-label">Hôm nay mẹ ăn gì?</label>
                                    <textarea 
                                        rows={3} 
                                        value={mealContent} 
                                        onChange={(e) => handleContentChange(e.target.value)} 
                                        className="form-input" 
                                        placeholder="VD: Phở bò chín, 1 cốc nước cam, sữa chua..." 
                                        style={{ resize: 'none' }}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="text-label">Kalo tiêu thụ (Ước tính tự động)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="number" 
                                            value={mealCalories} 
                                            onChange={(e) => setMealCalories(e.target.value)} 
                                            className="form-input" 
                                            style={{ color: '#db2777', fontWeight: 700, paddingRight: '50px' }}
                                            placeholder="Kalo ước tính..." 
                                        />
                                        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>kcal</span>
                                    </div>
                                </div>
                                
                                <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '16px', borderRadius: '16px' }}>
                                    {isSaving ? 'Đang lưu...' : 'Lưu nhật ký'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .dinhduong-hero-card {
                    padding: 24px 20px;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-radius: 24px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
                }

                .segmented-control {
                    display: flex;
                    background: rgba(148, 163, 184, 0.08);
                    padding: 4px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }

                .segment-btn {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 12px;
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: var(--text-sub);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .segment-btn.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                @media (max-width: 600px) {
                    .segmented-control {
                        display: flex;
                        background: rgba(148, 163, 184, 0.08);
                        padding: 4px;
                        border-radius: 16px;
                        margin-bottom: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.5);
                    }
                    .segment-btn {
                        flex: 1;
                        padding: 10px 4px;
                        font-size: 0.84rem;
                        background: transparent;
                        border: none;
                        border-radius: 12px;
                        color: var(--text-sub);
                    }
                    .segment-btn.active {
                        background: white;
                        color: var(--primary);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        border-color: transparent;
                    }
                    .dinhduong-hero-card {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                }

                /* SEARCH & LOOKUP TAB */
                .search-box {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 24px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: var(--shadow-soft);
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

                .search-inp {
                    width: 100%;
                    height: 48px;
                    border-radius: 14px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    padding-left: 46px;
                    padding-right: 16px;
                    font-size: 0.95rem;
                    color: var(--text-main);
                    transition: all 0.25s;
                    outline: none;
                }

                .search-inp:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-light);
                }

                .filter-row {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 8px 0 2px 0;
                    margin-top: 12px;
                    scrollbar-width: none;
                }
                .filter-row::-webkit-scrollbar {
                    display: none;
                }

                .filter-chip {
                    padding: 8px 16px;
                    border-radius: 99px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: var(--text-sub);
                    transition: all 0.2s;
                    white-space: nowrap;
                    cursor: pointer;
                }

                .filter-chip:hover {
                    background: #f8fafc;
                }

                .filter-chip.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
                }

                .food-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                    margin-top: 8px;
                }

                .food-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 20px;
                    padding: 18px;
                    box-shadow: var(--shadow-soft);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .food-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
                }

                .food-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                }

                .food-card-name {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: var(--text-main);
                }

                .food-card-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-size: 0.72rem;
                    font-weight: 800;
                }

                .food-card-desc {
                    font-size: 0.85rem;
                    color: var(--text-sub);
                    line-height: 1.5;
                    margin: 0;
                    text-align: justify;
                }

                /* GUIDE / THỰC ĐƠN TAB */
                .guide-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 24px;
                }

                .guide-header-panel {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin: 0 0 8px 0;
                }

                .day-selector-ribbon {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    scrollbar-width: none;
                }
                .day-selector-ribbon::-webkit-scrollbar {
                    display: none;
                }

                .day-selector-btn {
                    padding: 10px 18px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: var(--text-sub);
                    transition: all 0.2s;
                    white-space: nowrap;
                    cursor: pointer;
                }

                .day-selector-btn:hover {
                    background: #f8fafc;
                }

                .day-selector-btn.active {
                    background: var(--primary-light);
                    border-color: var(--primary);
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);
                }

                .menu-detail-panel {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-soft);
                }

                .menu-header-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 4px solid var(--primary);
                    padding-left: 12px;
                    margin-bottom: 20px;
                }

                .menu-tag {
                    font-size: 0.75rem;
                    font-weight: 800;
                    padding: 4px 12px;
                    border-radius: 99px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .menu-dish-card {
                    display: flex;
                    gap: 16px;
                    background: white;
                    border: 1px solid #f1f5f9;
                    border-radius: 18px;
                    padding: 16px;
                    transition: all 0.25s ease;
                }

                .menu-dish-card:hover {
                    transform: translateX(4px);
                    border-color: #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }

                .menu-dish-time-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    height: 32px;
                    padding: 0 12px;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 800;
                    flex-shrink: 0;
                }

                .snack-card {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                }

                .snack-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .snack-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    background: white;
                    border: 1px solid #f1f5f9;
                    padding: 16px;
                    border-radius: 16px;
                }

                .snack-bullet {
                    font-weight: 800;
                    font-size: 0.92rem;
                    color: var(--text-main);
                }

                .symptom-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 16px;
                }

                .symptom-card {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 20px;
                    padding: 18px;
                    box-shadow: var(--shadow-soft);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .sym-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 800;
                    font-size: 0.98rem;
                }

                .sym-solution {
                    font-size: 0.82rem;
                    color: var(--text-sub);
                    line-height: 1.5;
                    margin: 0;
                    text-align: justify;
                }

                /* DIARY TAB */
                .diary-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .diary-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .calorie-progress-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                    display: flex;
                    flex-direction: column;
                }

                .calorie-progress-bar {
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 99px;
                    overflow: hidden;
                    margin: 12px 0 10px 0;
                }

                .calorie-progress-fill {
                    height: 100%;
                    border-radius: 99px;
                    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .add-meal-btn {
                    width: 100%;
                    height: 52px;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    font-weight: 800;
                    border: none;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .add-meal-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px -5px rgba(13, 148, 136, 0.4);
                }

                .day-card {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: var(--shadow-soft);
                    margin-bottom: 8px;
                }

                .day-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1.5px dashed #e2e8f0;
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                }

                .day-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: var(--text-main);
                }

                .day-cals {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.82rem;
                    font-weight: 800;
                    color: #f97316;
                    background: #fff7ed;
                    padding: 4px 10px;
                    border-radius: 8px;
                }

                .day-meals {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .day-meal-item {
                    border-left: 4px solid;
                    padding-left: 14px;
                    position: relative;
                    transition: all 0.2s;
                }

                .dmi-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }

                .dmi-type {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.88rem;
                    font-weight: 800;
                }

                .dmi-time {
                    font-size: 0.75rem;
                    color: var(--text-sub);
                    font-weight: 600;
                    margin-left: 4px;
                }

                .dmi-actions {
                    display: flex;
                    gap: 4px;
                }

                .dmi-action-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-sub);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dmi-action-btn:hover {
                    background: #f1f5f9;
                    color: var(--text-main);
                }

                .dmi-action-btn.del:hover {
                    background: #fef2f2;
                    color: #ef4444;
                }

                .dmi-content {
                    font-size: 0.92rem;
                    color: #334155;
                    font-weight: 600;
                    line-height: 1.5;
                }

                .dmi-cal {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 0.75rem;
                    color: #db2777;
                    background: #fdf2f8;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-weight: 700;
                    margin-top: 6px;
                }

                /* BOTTOM SHEET MODAL ANIMATION */
                .modal.open .modal-bottom-sheet {
                    animation: slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUpModal {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                /* MOBILE RESPONSIVE STYLES */
                @media (max-width: 576px) {
                    .menu-header-bar {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    .menu-dish-card {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }
                    .menu-dish-time-badge {
                        align-self: flex-start;
                    }
                }

                /* PC MEDIA QUERIES (min-width: 992px) */
                @media (min-width: 992px) {
                    .guide-layout {
                        grid-template-columns: 260px minmax(0, 1fr);
                    }
                    
                    .day-selector-ribbon {
                        flex-direction: column;
                        overflow-x: visible;
                        gap: 6px;
                        padding-bottom: 0;
                    }
                    
                    .day-selector-btn {
                        width: 100%;
                        text-align: left;
                    }
                    
                    .diary-layout {
                        grid-template-columns: 320px 1fr;
                    }
                    
                    .diary-left-col {
                        position: sticky;
                        top: 24px;
                    }
                    
                    .snack-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
        </>
    );
}
