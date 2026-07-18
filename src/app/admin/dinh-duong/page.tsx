'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { 
    IoRestaurantOutline, IoSearchOutline, IoAddCircleOutline, IoCloseOutline, 
    IoTrashOutline, IoPencilOutline, IoFlameOutline, IoCheckmarkCircleOutline, 
    IoWarningOutline, IoCloseCircleOutline, IoCalendarOutline, IoCafeOutline, 
    IoPulseOutline, IoSadOutline, IoLeafOutline, IoFlame, IoFastFoodOutline,
    IoMedicalOutline, IoShieldCheckmarkOutline
} from 'react-icons/io5';

import { FOOD_DB } from '@/lib/data';
import { CalorieMiniChart } from '@/components/nutrition/CalorieMiniChart';
import { TrimesterAdviceCard } from '@/components/nutrition/TrimesterAdviceCard';
import { MealModal } from '@/components/nutrition/MealModal';
import { FoodLookup } from '@/components/nutrition/FoodLookup';
import { WeeklyMenuGuide } from '@/components/nutrition/WeeklyMenuGuide';
import { WeightGuide } from '@/components/nutrition/WeightGuide';


const CALORIE_DB = [
    // ─── 1. MÓN NƯỚC: PHỞ, BÚN, MÌ, HỦ TIẾU, BÁNH CANH, CHÁO, MIẾN, SÚP/SOUP ──────
    { keywords: ['phở bò tái', 'phở bò chín', 'phở bò nạm', 'phở bò viên', 'phở bò'], cal: 450 },
    { keywords: ['phở gà trộn', 'phở gà xé', 'phở gà'], cal: 400 },
    { keywords: ['phở xào thịt bò', 'phở xào bò', 'phở xào'], cal: 550 },
    { keywords: ['phở cuốn'], cal: 350 },
    { keywords: ['phở'], cal: 400 },
    { keywords: ['bún bò huế', 'bún bò giò heo', 'bún bò'], cal: 480 },
    { keywords: ['bún chả hà nội', 'bún chả'], cal: 550 },
    { keywords: ['bún chả giò', 'bún chả nem', 'bún nem'], cal: 500 },
    { keywords: ['bún riêu cua đồng', 'bún riêu cua bắp bò', 'bún riêu cua', 'bún riêu'], cal: 450 },
    { keywords: ['bún riêu ốc', 'bún ốc chuối đậu', 'bún ốc'], cal: 400 },
    { keywords: ['bún mọc dọc mùng', 'bún mọc'], cal: 400 },
    { keywords: ['bún thịt nướng chả giò', 'bún thịt nướng'], cal: 550 },
    { keywords: ['bún măng vịt', 'bún măng gà', 'bún măng'], cal: 500 },
    { keywords: ['bún cá rô đồng', 'bún cá nha trang', 'bún cá hải phòng', 'bún cá'], cal: 400 },
    { keywords: ['bún sứa'], cal: 350 },
    { keywords: ['bún quậy'], cal: 400 },
    { keywords: ['bún kèn'], cal: 450 },
    { keywords: ['bún đậu mắm tôm đầy đủ', 'bún đậu mắm tôm'], cal: 600 },
    { keywords: ['bún đậu thịt luộc', 'bún đậu thịt', 'bún đậu chả cốm', 'bún đậu'], cal: 450 },
    { keywords: ['bún đậu chay'], cal: 350 },
    { keywords: ['hủ tiếu nam vang khô', 'hủ tiếu nam vang nước', 'hủ tiếu nam vang', 'hủ tíu nam vang'], cal: 450 },
    { keywords: ['hủ tiếu sườn', 'hủ tíu sườn'], cal: 400 },
    { keywords: ['hủ tiếu bò kho', 'hủ tíu bò kho'], cal: 500 },
    { keywords: ['hủ tiếu mực', 'hủ tíu mực'], cal: 400 },
    { keywords: ['hủ tiếu gõ', 'hủ tíu gõ', 'hủ tiếu', 'hủ tíu'], cal: 380 },
    { keywords: ['mì quảng gà', 'mì quảng tôm thịt', 'mì quảng ếch', 'mì quảng sườn', 'mì quảng'], cal: 500 },
    { keywords: ['bánh canh cua', 'bánh canh ghẹ'], cal: 450 },
    { keywords: ['bánh canh giò heo', 'bánh canh sườn'], cal: 550 },
    { keywords: ['bánh canh chả cá', 'bánh canh bột lọc', 'bánh canh'], cal: 400 },
    { keywords: ['mì xào giòn hải sản', 'mì xào giòn'], cal: 550 },
    { keywords: ['mì xào bò', 'mì xào hải sản', 'mì xào trứng', 'mì xào'], cal: 500 },
    { keywords: ['mì tôm trứng', 'mì tôm thịt bò', 'mì tôm', 'mì ăn liền', 'mì gói'], cal: 350 },
    { keywords: ['mì ý sốt bò băm', 'mì ý sốt bò bằm', 'mì ý', 'mì spaghetti'], cal: 450 },
    { keywords: ['miến gà nước', 'miến gà trộn', 'miến gà'], cal: 400 },
    { keywords: ['miến lươn xào', 'miến lươn nước', 'miến lươn'], cal: 400 },
    { keywords: ['miến xào lòng mề', 'miến xào thập cẩm', 'miến xào'], cal: 450 },
    { keywords: ['miến'], cal: 150 },
    { keywords: ['súp cua trứng bắc thảo', 'súp cua tuyết', 'súp cua nấm đông cô', 'súp cua', 'soup cua'], cal: 160 },
    { keywords: ['súp gà ngô ngọt', 'súp gà nấm', 'súp gà', 'soup gà nấm', 'soup gà', 'súp thịt gà', 'soup thịt gà', 'súp gà thịt băm', 'súp gà thịt bằm'], cal: 180 },
    { keywords: ['súp bí đỏ', 'soup bí đỏ'], cal: 120 },
    { keywords: ['cháo chim bồ câu', 'cháo bồ câu'], cal: 350 },
    { keywords: ['cháo cá chép an thai', 'cháo cá chép'], cal: 300 },
    { keywords: ['cháo gà xé phay', 'cháo gà'], cal: 250 },
    { keywords: ['cháo sườn sụn', 'cháo sườn yến', 'cháo sườn'], cal: 300 },
    { keywords: ['cháo thịt bằm bắc thảo', 'cháo thịt bằm', 'cháo thịt băm'], cal: 250 },
    { keywords: ['cháo dinh dưỡng', 'cháo trắng', 'cháo hàu', 'cháo cá'], cal: 200 },
    { keywords: ['bún'], cal: 150 },

    // ─── 2. CƠM & CÁC MÓN MẶN ĂN CƠM (THỊT, CÁ, TÔM, MỰC, ĐẬU HŨ, TRỨNG) ─────────
    { keywords: ['cơm trắng', 'chén cơm', 'bát cơm', 'bát cơm trắng', 'chén cơm trắng', 'chén cơm nóng', 'bát cơm nóng'], cal: 130 },
    { keywords: ['cơm tấm sườn bì chả', 'cơm tấm sườn nướng', 'cơm tấm sườn', 'cơm tấm'], cal: 650 },
    { keywords: ['cơm chiên dương châu', 'cơm chiên hải sản', 'cơm chiên tỏi', 'cơm chiên', 'cơm rang dưa bò', 'cơm rang thập cẩm', 'cơm rang'], cal: 550 },
    { keywords: ['cơm gà xối mỡ', 'cơm gà xối mả', 'cơm đùi gà chiên'], cal: 600 },
    { keywords: ['cơm gà hải nam', 'cơm gà ta', 'cơm gà luộc', 'cơm gà'], cal: 500 },
    { keywords: ['cơm sườn kho', 'cơm sườn'], cal: 550 },
    { keywords: ['cơm niêu'], cal: 400 },
    { keywords: ['thịt kho tàu trứng', 'thịt heo kho tàu', 'thịt lợn kho tàu', 'thịt kho tàu', 'thịt kho hột vịt'], cal: 350 },
    { keywords: ['thịt kho tiêu', 'thịt kho quẹt', 'thịt heo kho tiêu', 'thịt heo rim', 'thịt lợn kho', 'thịt kho', 'thịt rim', 'thịt nạc dăm kho'], cal: 300 },
    { keywords: ['thịt rim cháy cạnh', 'thịt heo cháy cạnh'], cal: 320 },
    { keywords: ['thịt kho ruốc sả', 'thịt xào mắm ruốc'], cal: 250 },
    { keywords: ['thịt ba chỉ luộc', 'thịt heo luộc', 'thịt lợn luộc', 'thịt luộc'], cal: 200 },
    { keywords: ['thịt ba chỉ quay', 'thịt ba chỉ', 'thịt ba rọi'], cal: 350 },
    { keywords: ['thịt bò xào súp lơ', 'thịt bò xào bông cải', 'thịt bò xào', 'bò xào cần tỏi', 'bò xào'], cal: 320 },
    { keywords: ['thịt bò né bông thiên lý', 'thịt bò né', 'bò bít tết', 'bò né'], cal: 450 },
    { keywords: ['thịt bò lúc lắc'], cal: 350 },
    { keywords: ['bò kho bánh mì', 'bò kho chuối', 'bò kho'], cal: 400 },
    { keywords: ['sườn xào chua ngọt', 'sườn chua ngọt'], cal: 380 },
    { keywords: ['sườn non rim mặn ngọt', 'sườn rim mặn', 'sườn rim', 'sườn kho'], cal: 300 },
    { keywords: ['sườn heo nướng', 'sườn nướng'], cal: 350 },
    { keywords: ['gà ta kho gừng', 'gà kho gừng', 'gà kho sả ớt', 'gà kho sả', 'gà kho'], cal: 250 },
    { keywords: ['gà hấp hành', 'gà luộc thảo mộc', 'gà luộc'], cal: 180 },
    { keywords: ['gà chiên nước mắm', 'gà rán kfc', 'gà rán jollibee', 'gà rán', 'gà chiên bột', 'gà chiên'], cal: 400 },
    { keywords: ['gà nướng mật ong', 'gà nướng muối ớt', 'gà nướng'], cal: 220 },
    { keywords: ['gà ác hầm thuốc bắc', 'gà ác tiềm thuốc bắc', 'gà hầm thuốc bắc'], cal: 350 },
    { keywords: ['thịt heo quay bánh hỏi', 'thịt heo quay', 'heo quay giòn bì', 'heo quay'], cal: 400 },
    { keywords: ['thịt bò'], cal: 250 },
    { keywords: ['thịt heo', 'thịt lợn'], cal: 240 },
    { keywords: ['chả lụa rim', 'chả lụa chưng', 'chả lụa', 'giò lụa'], cal: 150 },
    { keywords: ['lạp xưởng chiên', 'lạp xưởng nướng', 'lạp xưởng'], cal: 250 },
    { keywords: ['xúc xích rán', 'xúc xích nướng', 'xúc xích'], cal: 150 },
    { keywords: ['nem rán hà nội', 'chả giò tôm thịt', 'nem rán', 'chả giò'], cal: 150 },
    { keywords: ['thịt bằm xào sả ớt', 'thịt bằm xào hành', 'thịt bằm xào', 'thịt băm xào', 'thịt bằm', 'thịt băm'], cal: 150 },
    { keywords: ['cá chép kho tộ', 'cá lóc kho tộ', 'cá kho tộ', 'cá trê kho nghệ', 'cá trê kho'], cal: 250 },
    { keywords: ['cá lóc kho nghệ', 'cá nục kho cà', 'cá hú kho', 'cá basa kho', 'cá thu kho', 'cá lóc kho', 'cá nục kho', 'cá kho', 'cá rim', 'cá bống kho tiêu', 'cá bống kho'], cal: 220 },
    { keywords: ['cá hồi áp chảo sốt bơ chanh', 'cá hồi áp chảo', 'cá hồi nướng sốt', 'cá hồi nướng', 'cá hồi'], cal: 300 },
    { keywords: ['cá thu sốt cà chua', 'cá thu sốt cà', 'cá hồi sốt cà chua', 'cá sốt cà chua', 'cá sốt cà'], cal: 280 },
    { keywords: ['cá tai tượng chiên xù', 'cá điêu hồng chiên', 'cá rô phi chiên', 'cá chiên giòn', 'cá chiên', 'cá rán'], cal: 250 },
    { keywords: ['cá điêu hồng chưng tương', 'cá lóc hấp', 'cá hấp hành', 'cá hấp xì dầu', 'cá chép hấp', 'cá hấp'], cal: 180 },
    { keywords: ['tôm rim mặn ngọt', 'tôm rim thịt ba rọi', 'tôm rim tỏi', 'tôm rim', 'tôm kho tàu', 'tôm rang muối', 'tôm rang'], cal: 200 },
    { keywords: ['tôm sú hấp bia', 'tôm hấp nước dừa', 'tôm hấp', 'tôm luộc', 'tôm đất luộc'], cal: 100 },
    { keywords: ['mực xào cần tỏi', 'mực xào chua ngọt', 'mực xào khóm', 'mực xào thập cẩm', 'mực xào'], cal: 200 },
    { keywords: ['mực nhồi thịt sốt cà', 'mực nhồi thịt'], cal: 280 },
    { keywords: ['mực hấp gừng', 'mực hấp hành', 'mực hấp', 'mực luộc'], cal: 120 },
    { keywords: ['nghêu hấp sả', 'nghêu hấp thái', 'nghêu hấp'], cal: 120 },
    { keywords: ['hàu nướng mỡ hành', 'hàu nướng phô mai', 'hàu nướng'], cal: 200 },
    { keywords: ['sò huyết cháy tỏi', 'sò huyết hấp'], cal: 150 },
    { keywords: ['đậu hũ nhồi thịt sốt cà', 'đậu hủ nhồi thịt sốt cà', 'đậu hũ nhồi thịt', 'đậu phụ nhồi thịt', 'đậu hủ nhồi thịt'], cal: 280 },
    { keywords: ['đậu phụ sốt cà chua', 'đậu phụ sốt cà', 'đậu hũ sốt cà chua thịt bằm', 'đậu hủ sốt cà chua thịt bằm', 'đậu hũ sốt cà chua', 'đậu hủ sốt cà chua', 'đậu hũ sốt cà', 'đậu hủ sốt cà'], cal: 250 },
    { keywords: ['đậu phụ chiên sả ớt', 'đậu hũ chiên sả', 'đậu hủ chiên sả', 'đậu phụ rán', 'đậu hũ rán', 'đậu hủ rán', 'đậu phụ chiên', 'đậu hũ chiên', 'đậu hủ chiên', 'đậu hũ lướt ván'], cal: 150 },
    { keywords: ['đậu phụ kho nấm', 'đậu hũ kho nấm', 'đậu hủ kho nấm', 'đậu hũ kho chay'], cal: 150 },
    { keywords: ['đậu phụ', 'đậu hũ', 'đậu hủ'], cal: 80 },
    { keywords: ['trứng vịt luộc', 'trứng gà luộc', 'trứng luộc'], cal: 70 },
    { keywords: ['trứng ốp la chín', 'trứng ốp la', 'trứng ốp lết'], cal: 110 },
    { keywords: ['trứng chiên hành', 'trứng rán hành', 'trứng chiên thịt', 'trứng rán thịt', 'trứng chiên', 'trứng rán', 'trứng cuộn'], cal: 120 },
    { keywords: ['trứng cút luộc', 'trứng cút chiên', 'trứng cút'], cal: 80 },
    { keywords: ['trứng bắc thảo'], cal: 90 },
    { keywords: ['trứng muối'], cal: 80 },
    { keywords: ['trứng chưng thịt', 'trứng hấp thịt', 'trứng hấp vân', 'trứng hấp'], cal: 100 },

    // ─── 3. CANH, RAU XÀO, RAU LUỘC, SALAD ──────────────────────────────────────
    { keywords: ['canh bí đỏ thịt bằm', 'canh bí đỏ sườn non', 'canh bí đỏ xương heo', 'canh bí đỏ nấu tôm', 'canh bí đỏ'], cal: 120 },
    { keywords: ['canh chua cá lóc', 'canh chua tôm', 'canh chua điêu hồng', 'canh chua cá hú', 'canh chua chay', 'canh chua'], cal: 150 },
    { keywords: ['canh rau ngót nấu thịt bằm', 'canh rau ngót nấu tôm', 'canh rau ngót'], cal: 70 },
    { keywords: ['canh sườn khoai tây cà rốt', 'canh sườn khoai tây', 'canh xương khoai tây', 'canh sườn bí đao', 'canh sườn củ cải', 'canh sườn'], cal: 180 },
    { keywords: ['canh bầu nấu tôm', 'canh bầu nấu thịt', 'canh bầu'], cal: 70 },
    { keywords: ['canh mồng tơi nấu mướp', 'canh mồng tơi nấu tôm', 'canh mồng tơi thịt bằm', 'canh mồng tơi'], cal: 60 },
    { keywords: ['canh cua rau đay mồng tơi', 'canh cua rau đay', 'canh cua'], cal: 100 },
    { keywords: ['canh xà lách xoong nấu thịt', 'canh xà lách xoong', 'canh xà lách song'], cal: 50 },
    { keywords: ['canh khổ qua nhồi thịt', 'canh khổ qua dồn thịt', 'canh khổ qua chay', 'canh khổ qua'], cal: 200 },
    { keywords: ['canh rong biển sườn non', 'canh rong biển thịt bằm', 'canh rong biển đậu hũ', 'canh rong biển'], cal: 80 },
    { keywords: ['canh khoai mỡ nấu tôm', 'canh khoai mỡ nấu thịt', 'canh khoai mỡ'], cal: 150 },
    { keywords: ['canh cà chua trứng', 'canh mây'], cal: 80 },
    { keywords: ['canh hẹ đậu hũ', 'canh hẹ'], cal: 60 },
    { keywords: ['canh măng sườn', 'canh măng giò heo', 'canh măng'], cal: 120 },
    { keywords: ['canh rau cải thịt bằm', 'canh rau cải thịt băm', 'canh cải cúc thịt bằm', 'canh tần ô thịt bằm', 'canh cải ngọt', 'canh rau cải'], cal: 120 },
    { keywords: ['canh rau muống luộc', 'nước canh rau muống', 'canh rau'], cal: 50 },
    { keywords: ['khoai mỡ luộc', 'khoai mỡ hấp', 'khoai mỡ'], cal: 120 },
    { keywords: ['đậu que luộc', 'đậu đũa luộc', 'đậu que', 'đậu đũa'], cal: 40 },
    { keywords: ['rau muống xào thịt bò', 'rau muống xào bò'], cal: 200 },
    { keywords: ['rau muống xào tỏi', 'rau muống xào'], cal: 120 },
    { keywords: ['rau lang xào tỏi', 'rau lang xào'], cal: 110 },
    { keywords: ['rau bí xào tỏi', 'rau bí xào'], cal: 110 },
    { keywords: ['su su xào tỏi', 'su su xào thịt bò', 'su su xào bò', 'su su xào'], cal: 120 },
    { keywords: ['rau cải xào thịt bò', 'rau cải xào bò', 'rau cải xào', 'rau xào thập cẩm', 'rau xào'], cal: 100 },
    { keywords: ['rau cải ngọt luộc', 'rau cải thìa luộc', 'rau muống luộc', 'rau cải luộc', 'bắp cải luộc', 'rau luộc thập cẩm', 'rau luộc'], cal: 30 },
    { keywords: ['bông cải xanh xào bò', 'súp lơ xào bò', 'bông cải xào tôm', 'bông cải xào', 'súp lơ xào'], cal: 200 },
    { keywords: ['bông cải xanh luộc', 'súp lơ luộc'], cal: 40 },
    { keywords: ['khổ qua xào trứng', 'mướp đắng xào trứng'], cal: 150 },
    { keywords: ['khổ qua xào thịt bò', 'khổ qua xào thịt', 'mướp đắng xào thịt'], cal: 200 },
    { keywords: ['mướp xào lòng mề gà', 'mướp xào lòng gà', 'mướp xào tôm', 'mướp xào thịt', 'mướp xào'], cal: 180 },
    { keywords: ['măng tây xào thịt bò', 'măng tây xào bò', 'măng tây xào'], cal: 220 },
    { keywords: ['xà lách trộn dầu giấm', 'xà lách', 'rau xà lách'], cal: 20 },
    { keywords: ['salad ức gà áp chảo', 'salad ức gà', 'salad cá hồi', 'salad trứng', 'salad hoa quả', 'salad rau củ', 'salad trộn', 'salad'], cal: 150 },

    // ─── 4. ĂN NHẸ, ĐỒ UỐNG, TRÁI CÂY & ĐỒ ĂN VẶT ─────────────────────────────────
    { keywords: ['bánh mì thịt chả', 'bánh mì xá xíu', 'bánh mì patê lạp xưởng', 'bánh mì pate chả', 'bánh mì pate', 'bánh mì kẹp thịt', 'bánh mì kẹp chả'], cal: 400 },
    { keywords: ['bánh mì trứng ốp la', 'bánh mì kẹp trứng', 'bánh mì trứng', 'bánh mì chả cá'], cal: 350 },
    { keywords: ['bánh mì không', 'bánh mì đen', 'bánh mì nguyên cám', 'ổ bánh mì', 'bánh mì', 'bánh mỳ'], cal: 160 },
    { keywords: ['bánh bao nhân thịt trứng cút', 'bánh bao đặc biệt', 'bánh bao thịt trứng', 'bánh bao xá xíu', 'bánh bao thịt'], cal: 350 },
    { keywords: ['bánh bao chay', 'bánh bao chỉ'], cal: 150 },
    { keywords: ['bánh bao'], cal: 300 },
    { keywords: ['bánh giò nóng', 'bánh giò nhân thịt', 'bánh giò'], cal: 400 },
    { keywords: ['bánh xèo miền trung', 'bánh xèo miền tây', 'bánh xèo tôm thịt', 'bánh xèo'], cal: 350 },
    { keywords: ['bánh khọt tôm mực', 'bánh khọt'], cal: 350 },
    { keywords: ['bánh cuốn nóng', 'bánh cuốn nhân thịt', 'bánh cuốn chả lụa', 'bánh cuốn chả', 'bánh cuốn'], cal: 350 },
    { keywords: ['bánh ướt chả lụa', 'bánh ướt lòng gà', 'bánh ướt'], cal: 350 },
    { keywords: ['bánh chưng nhân thịt', 'bánh tét nhân thịt', 'bánh chưng', 'bánh tét'], cal: 600 },
    { keywords: ['xôi mặn thập cẩm', 'xôi gà xé', 'xôi thịt kho', 'xôi xéo ruốc', 'xôi xéo', 'xôi mặn', 'xôi giò', 'xôi chiên'], cal: 500 },
    { keywords: ['xôi gấc', 'xôi lạc', 'xôi đậu xanh', 'xôi đậu đen', 'xôi nếp', 'xôi ngọt', 'xôi gỏi', 'xôi'], cal: 400 },
    { keywords: ['sữa bà bầu', 'sữa bầu'], cal: 180 },
    { keywords: ['sữa hạt sen', 'sữa đậu nành', 'sữa óc chó', 'sữa hạnh nhân', 'sữa hạt'], cal: 120 },
    { keywords: ['sữa tươi tiệt trùng', 'sữa tươi không đường', 'sữa tươi ít đường', 'sữa tươi có đường', 'sữa tươi', 'hộp sữa tươi'], cal: 130 },
    { keywords: ['sữa hộp', 'hộp sữa', 'sữa đặc'], cal: 130 },
    { keywords: ['sữa chua hy lạp trái cây', 'sữa chua hy lạp'], cal: 120 },
    { keywords: ['sữa chua nếp cẩm', 'sữa chua nha đam', 'sữa chua có đường', 'sữa chua không đường', 'sữa chua'], cal: 100 },
    { keywords: ['yến sào chưng đường phèn', 'yến sào chưng hạt sen', 'nước yến chưng', 'nước yến', 'yến sào'], cal: 80 },
    { keywords: ['ngũ cốc dinh dưỡng', 'ngũ cốc thai kỳ', 'ngũ cốc oat', 'ngũ cốc yến mạch', 'ngũ cốc'], cal: 150 },
    { keywords: ['hạt óc chó', 'óc chó'], cal: 180 },
    { keywords: ['hạt hạnh nhân', 'hạnh nhân'], cal: 160 },
    { keywords: ['hạt macca', 'macca'], cal: 200 },
    { keywords: ['hạt điều xấy', 'hạt điều rang muối', 'hạt điều'], cal: 150 },
    { keywords: ['hạt dẻ cười', 'hạt dẻ rang', 'hạt dẻ'], cal: 120 },
    { keywords: ['hạt hướng dương'], cal: 100 },
    { keywords: ['quả ổi', 'ổi chín', 'ổi'], cal: 50 },
    { keywords: ['măng cụt'], cal: 70 },
    { keywords: ['quả na', 'na'], cal: 90 },
    { keywords: ['việt quất'], cal: 60 },
    { keywords: ['dâu tây'], cal: 35 },
    { keywords: ['dưa hấu'], cal: 30 },
    { keywords: ['sầu riêng'], cal: 150 },
    { keywords: ['nước mía'], cal: 150 },

    // Đồ Ăn Vặt / Khác
    { keywords: ['bánh quy nguyên cám', 'bánh quy'], cal: 120 },
    { keywords: ['trà gừng mật ong', 'trà gừng'], cal: 45 },
    { keywords: ['cà phê sữa', 'cà phê'], cal: 120 },
    { keywords: ['trà sữa'], cal: 350 },
    { keywords: ['nước râu ngô'], cal: 30 },
    { keywords: ['nước đậu đen'], cal: 50 },
    { keywords: ['chè bắp', 'chè sen', 'chè ít đường', 'chè'], cal: 250 },

    // ─── 5. MÓN ĂN THƯỢNG HẠNG / SANG XỊN CHO MẸ BẦU ──────────────────────────────
    { keywords: ['súp bào ngư vi cá', 'súp bào ngư nấm đông cô', 'súp bào ngư', 'soup bào ngư'], cal: 250 },
    { keywords: ['cháo bào ngư gà ác', 'cháo bào ngư'], cal: 320 },
    { keywords: ['bào ngư sốt dầu hào', 'bào ngư áp chảo', 'bào ngư hầm sốt'], cal: 280 },
    { keywords: ['tổ yến chưng nhân sâm', 'yến chưng sâm', 'trà sâm yến'], cal: 120 },
    { keywords: ['tổ yến chưng đông trùng', 'yến chưng đông trùng hạ thảo', 'yến chưng đông trùng'], cal: 110 },
    { keywords: ['tổ yến chưng hạt chia', 'yến chưng hạt chia'], cal: 95 },
    { keywords: ['tổ yến chưng đường phèn táo đỏ', 'yến chưng táo đỏ hạt sen', 'tổ yến chưng đường phèn', 'yến chưng đường phèn'], cal: 90 },
    { keywords: ['súp yến sào', 'soup yến sào', 'súp tổ yến'], cal: 180 },
    { keywords: ['bò wagyu nướng', 'bò wagyu áp chảo', 'bò kobe nướng', 'bò kobe áp chảo', 'bò wagyu', 'bò kobe'], cal: 480 },
    { keywords: ['steak bò wagyu', 'steak bò kobe', 'steak bò mỹ', 'bít tết bò mỹ', 'steak bò', 'bít tết bò'], cal: 450 },
    { keywords: ['tôm hùm nướng phô mai', 'tôm hùm nướng bơ tỏi', 'tôm hùm đút lò'], cal: 400 },
    { keywords: ['tôm hùm hấp nước dừa', 'tôm hùm hấp bia', 'tôm hùm hấp', 'tôm hùm luộc'], cal: 250 },
    { keywords: ['cháo tôm hùm'], cal: 300 },
    { keywords: ['cua hoàng đế hấp', 'chân cua hoàng đế', 'cua hoàng đế'], cal: 220 },
    { keywords: ['soup cua hoàng đế', 'súp cua hoàng đế'], cal: 160 },
    { keywords: ['gan ngỗng áp chảo', 'gan ngỗng pháp', 'gan ngỗng foie gras', 'gan ngỗng'], cal: 320 },
    { keywords: ['cá hồi áp chảo sốt kem bơ', 'cá hồi sốt kem bơ', 'cá hồi sốt kem'], cal: 350 },
    { keywords: ['cháo cá hồi na uy', 'cháo cá hồi cao cấp'], cal: 280 },
    { keywords: ['nho mẫu đơn nhật', 'nho mẫu đơn hàn quốc', 'nho mẫu đơn', 'nho shine muscat'], cal: 80 },
    { keywords: ['nho ngón tay mỹ', 'nho ngón tay', 'nho đen không hạt', 'nho mỹ không hạt'], cal: 75 },
    { keywords: ['cherry mỹ quả to', 'cherry úc', 'quả anh đào cherry', 'quả anh đào', 'cherry đỏ', 'cherry vàng', 'cherry'], cal: 70 },
    { keywords: ['kiwi vàng new zealand', 'kiwi xanh new zealand', 'kiwi vàng', 'kiwi xanh', 'quả kiwi', 'trái kiwi'], cal: 60 },
    { keywords: ['quả mâm xôi', 'trái mâm xôi', 'raspberry', 'blackberry'], cal: 50 },
    { keywords: ['hạt chia organic', 'hạt chia úc', 'thạch hạt chia'], cal: 80 },
    { keywords: ['hạt thông hữu cơ', 'hạt thông'], cal: 180 },
    { keywords: ['nhụy hoa nghệ tây saffron', 'trà saffron mật ong', 'trà saffron', 'saffron'], cal: 15 },
    { keywords: ['sữa saffron', 'sữa nhụy hoa nghệ tây'], cal: 150 },
    { keywords: ['yến mạch organic', 'diêm mạch hữu cơ', 'hạt diêm mạch', 'quinoa'] , cal: 160 },

    // ─── 6. MÓN TRÁNG MIỆNG & BỮA PHỤ CHO MẸ BẦU (CHÈ, SINH TỐ, NƯỚC ÉP, BÁNH NGỌT, TÀO PHỚ...) ───
    { keywords: ['chè dưỡng nhan', 'chè tuyết yến', 'chè tuyết yến nhựa đào'], cal: 150 },
    { keywords: ['chè hạt sen long nhãn', 'chè hạt sen táo đỏ', 'chè hạt sen'], cal: 180 },
    { keywords: ['chè đậu đỏ cốt dừa', 'chè đậu đỏ hạt sen', 'chè đậu đỏ'], cal: 200 },
    { keywords: ['chè mè đen đường phèn', 'chè mè đen', 'chè chí mà phù'], cal: 150 },
    { keywords: ['chè đậu xanh nước cốt dừa', 'chè đậu xanh đánh', 'chè đậu xanh'], cal: 180 },
    { keywords: ['chè trôi nước cốt dừa', 'chè trôi nước'], cal: 300 },
    { keywords: ['tào phớ nước đường', 'tào phớ trân châu đường đen', 'tào phớ gừng', 'tào phớ', 'tàu hũ nước đường', 'tàu hũ gừng', 'tàu hủ nước đường'], cal: 120 },
    { keywords: ['bánh flan nước cốt dừa', 'bánh flan caramen', 'bánh flan', 'caramen', 'kem caramen'], cal: 150 },
    { keywords: ['sinh tố bơ sầu riêng', 'sinh tố bơ cốt dừa', 'sinh tố bơ ít đường', 'sinh tố bơ'], cal: 280 },
    { keywords: ['sinh tố xoài chuối', 'sinh tố xoài', 'sinh tố chuối', 'sinh tố sapoche', 'sinh tố mãng cầu', 'sinh tố dâu tây', 'sinh tố dâu', 'sinh tố thập cẩm', 'sinh tố'], cal: 220 },
    { keywords: ['nước dừa tươi', 'nước dừa xiêm', 'nước dừa', 'trái dừa tươi'], cal: 60 },
    { keywords: ['nước cam ép ít đường', 'nước cam vắt mật ong', 'nước cam vắt', 'nước cam vắt nguyên chất', 'nước cam ép', 'nước cam'], cal: 100 },
    { keywords: ['nước ép bưởi', 'nước ép cà rốt', 'nước ép táo', 'nước ép dưa hấu', 'nước ép thơm', 'nước ép dứa', 'nước ép cà chua', 'nước ép ổi', 'nước ép trái cây', 'nước ép'], cal: 90 },
    { keywords: ['sữa chua uống probi', 'sữa chua uống yakult', 'sữa chua uống yomost', 'sữa chua uống'], cal: 80 },
    { keywords: ['bánh tart trứng kfc', 'bánh tart trứng'], cal: 170 },
    { keywords: ['bánh su kem kem sữa', 'bánh su kem bơ', 'bánh su kem', 'su kem'], cal: 120 },
    { keywords: ['bánh bông lan trứng muối chà bông', 'bánh bông lan trứng muối'], cal: 320 },
    { keywords: ['bánh mousse socola', 'bánh mousse dâu', 'bánh mousse chanh leo', 'bánh mousse', 'bánh phô mai', 'cheesecake', 'bánh ngọt', 'tiramisu'], cal: 250 },
    { keywords: ['rau câu dừa sợi', 'rau câu trái cây', 'rau câu lá dứa', 'rau câu', 'thạch dừa'], cal: 80 },
    { keywords: ['dĩa trái cây thập cẩm', 'đĩa trái cây', 'trái cây đĩa', 'trái cây tô', 'trái cây dầm', 'hoa quả dầm'], cal: 120 },
    { keywords: ['khoai lang nướng mật', 'khoai lang nướng', 'khoai lang luộc', 'khoai mật'], cal: 150 },
    { keywords: ['bắp ngô ngọt luộc', 'ngô luộc', 'bắp luộc'], cal: 120 },

    // ─── 7. SIÊU THỰC PHẨM & DINH DƯỠNG ĐẶC BIỆT CHO THAI NHI (GIÀU FOLATE, SẮT, CANXI, DHA...) ───
    { keywords: ['cải bó xôi luộc', 'rau chân vịt luộc', 'cải bó xôi xào', 'rau chân vịt xào', 'cải bó xôi', 'rau chân vịt'], cal: 45 },
    { keywords: ['quả bơ chín', 'trái bơ sáp', 'quả bơ', 'trái bơ'], cal: 160 },
    { keywords: ['chuối chín', 'chuối tiêu', 'chuối sứ', 'chuối già', 'trái chuối', 'quả chuối'], cal: 90 },
    { keywords: ['thanh long ruột đỏ', 'thanh long ruột trắng', 'thanh long'], cal: 60 },
    { keywords: ['đu đủ chín', 'quả đu đủ'], cal: 60 },
    { keywords: ['cá cơm rim đường', 'cá cơm kho tiêu', 'cá cơm kho', 'cá cơm rim', 'cá cơm khô', 'cá cơm'], cal: 150 },
    { keywords: ['phô mai con bò cười', 'phô mai lát', 'phô mai mozzarella', 'phô mai miếng', 'phô mai'], cal: 80 },
    { keywords: ['nước gạo lứt rang', 'trà gạo lứt đậu đen', 'trà gạo lứt', 'nước gạo lứt'], cal: 50 },
    { keywords: ['sữa nghệ ấm', 'sữa nghệ mật ong', 'sữa nghệ'], cal: 120 },
    { keywords: ['hạt chia pha nước', 'nước hạt chia'], cal: 40 },
    { keywords: ['măng tây luộc', 'măng tây hấp', 'măng tây'], cal: 35 },
    { keywords: ['quả sung hầm đường phèn', 'quả sung chín', 'trái sung', 'quả sung'], cal: 50 },
    { keywords: ['táo đỏ sấy khô', 'táo tàu', 'táo đỏ khô', 'táo đỏ'], cal: 80 }
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
    const [profile, setProfile] = useState<any>({});
    const [resolvedUid, setResolvedUid] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'lookup' | 'guide' | 'medical' | 'diary'>('lookup');
    
    // Lookup state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterCategory, setFilterCategory] = useState('rau');

    // Guide state
    const [selectedDay, setSelectedDay] = useState('2');

    // Medical Guide state
    const [preHeight, setPreHeight] = useState('');
    const [preWeight, setPreWeight] = useState('');
    const [bmiResult, setBmiResult] = useState<number | null>(null);
    const [bmiCategory, setBmiCategory] = useState('');
    const [bmiRecommendation, setBmiRecommendation] = useState<any>(null);

    // Diary state
    const [meals, setMeals] = useState<any[]>([]);
    const [diaryPage, setDiaryPage] = useState(1);
    const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
    const [showModal, setShowModal] = useState(false);
    const [showMiniChart, setShowMiniChart] = useState(false);
    const [showTrimesterAdvice, setShowTrimesterAdvice] = useState(false);

    // Form states
    const [mealId, setMealId] = useState('');
    const [mealType, setMealType] = useState('sang');
    const [mealContent, setMealContent] = useState('');
    const [mealDatetime, setMealDatetime] = useState(getLocalDatetimeString());
    const [mealCalories, setMealCalories] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [detectedFoods, setDetectedFoods] = useState<{ name: string; calories: number }[]>([]);

    const calculateBmi = () => {
        const h = parseFloat(preHeight) / 100;
        const w = parseFloat(preWeight);
        if (!h || !w || h <= 0 || w <= 0) return;
        const bmi = parseFloat((w / (h * h)).toFixed(1));
        setBmiResult(bmi);
        if (bmi < 18.5) {
            setBmiCategory('Thiếu cân (Gầy)');
            setBmiRecommendation({
                gainRange: '12.5 - 18 kg',
                weeklyRate: '~0.5 kg/tuần',
                advice: 'Mẹ bầu cần bổ sung thực phẩm giàu năng lượng, chất béo tốt (bơ, sữa, hạt) và chia nhiều bữa nhỏ để hỗ trợ bé tăng cân đều.'
            });
        } else if (bmi >= 18.5 && bmi < 23) {
            setBmiCategory('Cân đối (Bình thường)');
            setBmiRecommendation({
                gainRange: '11.5 - 16 kg',
                weeklyRate: '~0.4 kg/tuần',
                advice: 'Mẹ bầu duy trì chế độ dinh dưỡng phong phú, bổ sung đầy đủ vitamin và khoáng chất tự nhiên.'
            });
        } else if (bmi >= 23 && bmi < 25) {
            setBmiCategory('Thừa cân nhẹ (Tiền béo phì)');
            setBmiRecommendation({
                gainRange: '7 - 11.5 kg',
                weeklyRate: '~0.3 kg/tuần',
                advice: 'Mẹ nên hạn chế tinh bột trắng, bánh ngọt, đồ chiên rán. Ăn nhiều rau xanh và uống đủ nước lọc.'
            });
        } else {
            setBmiCategory('Béo phì');
            setBmiRecommendation({
                gainRange: '5 - 9 kg',
                weeklyRate: '~0.2 kg/tuần',
                advice: 'Mẹ nên kiểm soát lượng tinh bột, theo dõi đường huyết và tham khảo ý kiến bác sĩ để tránh đái tháo đường thai kỳ.'
            });
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'lookup' || tabParam === 'guide' || tabParam === 'medical' || tabParam === 'diary') {
                setActiveTab(tabParam);
            }
        }

        let unsubDb: (() => void) | null = null;
        let unsubProfile: (() => void) | null = null;

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Realtime listen user profile to check partner connection status
                unsubProfile = onSnapshot(doc(db, "users", currentUser.uid, "settings", "profile"), (d) => {
                    let targetUid = currentUser.uid;
                    if (d.exists()) {
                        const data = d.data();
                        setProfile(data);
                        
                        // Load height / weight settings into preHeight/preWeight if available
                        if (data.height) setPreHeight(data.height);
                        if (data.weightBefore) setPreWeight(data.weightBefore);
                        
                        // Partner sync active: If role is partner and partnerUid is assigned, redirect reads/writes
                        if (data.syncRole === 'partner' && data.partnerUid) {
                            targetUid = data.partnerUid;
                        }
                    }
                    setResolvedUid(targetUid);

                    // Fetch profile variables from target UID (maternal account) to load height/weight
                    if (targetUid !== currentUser.uid) {
                        getDoc(doc(db, "users", targetUid, "settings", "profile")).then((maternalDoc) => {
                            if (maternalDoc.exists()) {
                                const maternalData = maternalDoc.data();
                                setProfile(maternalData);
                                if (maternalData.height) setPreHeight(maternalData.height);
                                if (maternalData.weightBefore) setPreWeight(maternalData.weightBefore);
                            }
                        });
                    }

                    if (unsubDb) unsubDb();
                    const q = query(
                        collection(db, "users", targetUid, "nutrition_diary"),
                        orderBy("datetime", "desc"),
                        limit(100)
                    );
                    unsubDb = onSnapshot(q, (snapshot) => {
                        const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                        setMeals(list);
                    });
                });
            } else {
                setUser(null);
            }
        });

        return () => {
            unsubscribe();
            if (unsubDb) unsubDb();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    const calculatedTrimester = useMemo(() => {
        if (!profile?.lmp) return null;
        const lmpDate = new Date(profile.lmp);
        if (Number.isNaN(lmpDate.getTime())) return null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffWeeks = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (diffWeeks <= 13) return 1;
        if (diffWeeks <= 27) return 2;
        return 3;
    }, [profile?.lmp]);

    useEffect(() => {
        if (calculatedTrimester) {
            setSelectedTrimester(calculatedTrimester as any);
        }
    }, [calculatedTrimester]);

    const parseMealFoods = (content: string) => {
        if (!content) return [];
        let text = content.toLowerCase();
        const matched: { name: string; calories: number }[] = [];

        // Xây dựng danh sách phẳng chứa tất cả từ khóa đã sắp xếp theo độ dài giảm dần
        const flatKeywords: { keyword: string; cal: number; originalName: string }[] = [];
        CALORIE_DB.forEach(item => {
            item.keywords.forEach(keyword => {
                flatKeywords.push({ 
                    keyword: keyword.toLowerCase(), 
                    cal: item.cal, 
                    originalName: keyword 
                });
            });
        });
        flatKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

        const isWordChar = (char: string) => {
            if (!char) return false;
            return /[a-zA-Z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(char);
        };

        flatKeywords.forEach(fk => {
            let index = 0;
            // Tìm và xử lý tất cả các lần xuất hiện của từ khóa
            while (true) {
                index = text.indexOf(fk.keyword, index);
                if (index === -1) break;

                // Kiểm tra ranh giới từ (word boundary)
                const charBefore = index > 0 ? text[index - 1] : '';
                const charAfter = index + fk.keyword.length < text.length ? text[index + fk.keyword.length] : '';

                if (isWordChar(charBefore) || isWordChar(charAfter)) {
                    // Không phải ranh giới từ, tìm kiếm tiếp từ vị trí sau index
                    index += 1;
                    continue;
                }

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
                
                matched.push({
                    name: fk.originalName,
                    calories: Math.round(fk.cal * multiplier)
                });
                
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

                index += fk.keyword.length;
            }
        });

        return matched;
    };

    const handleContentChange = (val: string) => {
        setMealContent(val);
        const matched = parseMealFoods(val);
        setDetectedFoods(matched);
        const total = matched.reduce((sum, item) => sum + item.calories, 0);
        if (total > 0) setMealCalories(total.toString());
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
            const dbUid = resolvedUid || user.uid;
            if (mealId) await updateDoc(doc(db, "users", dbUid, "nutrition_diary", mealId), payload);
            else {
                await addDoc(collection(db, "users", dbUid, "nutrition_diary"), payload);
                setDiaryPage(1);
            }
            closeMealModal();
        } catch (err: any) { alert("Lỗi khi lưu: " + err.message); } finally { setIsSaving(false); }
    };

    const deleteMeal = async (id: string) => {
        if (!user) return;
        if (confirm("Mẹ có muốn xóa ghi chép bữa ăn này không?")) {
            try {
                const dbUid = resolvedUid || user.uid;
                await deleteDoc(doc(db, "users", dbUid, "nutrition_diary", id));
            }
            catch (err: any) { alert("Lỗi khi xóa: " + err.message); }
        }
    };

    const openAddModal = () => {
        setMealId(''); setMealType('sang'); setMealContent(''); setMealDatetime(getLocalDatetimeString()); setMealCalories(''); setDetectedFoods([]); setShowModal(true);
    };

    const openEditModal = (m: any) => {
        setMealId(m.id); 
        setMealType(m.type); 
        setMealDatetime(m.datetime || getLocalDatetimeString()); 
        setMealContent(m.content);
        const matched = parseMealFoods(m.content);
        setDetectedFoods(matched);
        const totalParsed = matched.reduce((sum, item) => sum + item.calories, 0);
        const calVal = totalParsed > 0 ? totalParsed : (m.calories || 0);
        setMealCalories(calVal ? calVal.toString() : ''); 
        setShowModal(true);
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
        const breakdown = parseMealFoods(m.content);
        const mealCal = breakdown.length > 0
            ? breakdown.reduce((sum, item) => sum + item.calories, 0)
            : (Number(m.calories) || 0);
        groups[dateKey].totalCal += mealCal;
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    const ITEMS_PER_PAGE = 2;
    const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE) || 1;
    const effectivePage = Math.max(1, Math.min(diaryPage, totalPages));
    const paginatedDates = sortedDates.slice((effectivePage - 1) * ITEMS_PER_PAGE, effectivePage * ITEMS_PER_PAGE);
    const last7DaysData = useMemo(() => {
        const days = [];
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDatetimeString(d).split('T')[0];
            const label = dayNames[d.getDay()];
            const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
            days.push({
                dateStr,
                label,
                displayDate,
                calories: groups[dateStr]?.totalCal || 0
            });
        }
        return days;
    }, [meals]);

    const maxCalIn7Days = useMemo(() => {
        const maxVal = Math.max(...last7DaysData.map(d => d.calories), 2500);
        return maxVal;
    }, [last7DaysData]);

    const trimesterAdviceData = {
        1: {
            title: "Tam Cá Nguyệt 1",
            weekRange: "Tuần 1 - 13",
            subtitle: "Giai đoạn hình thành cơ quan",
            calDiff: "+50 kcal/ngày",
            nutrients: [
                { name: "Axit Folic", source: "Rau xanh, bơ, ngũ cốc", desc: "Phòng dị tật ống thần kinh." },
                { name: "Sắt & B12", source: "Thịt bò nạc, lòng đỏ trứng", desc: "Tăng tạo máu nuôi thai." },
                { name: "Vitamin B6", source: "Chuối, hạt điều, hạt óc chó", desc: "Hỗ trợ giảm nghén hiệu quả." }
            ],
            avoid: "Đồ sống (sashimi, trứng lòng đào), sữa chưa tiệt trùng.",
            tips: "Nên chia nhỏ bữa ăn thành 5-6 lần/ngày để tránh đầy bụng."
        },
        2: {
            title: "Tam Cá Nguyệt 2",
            weekRange: "Tuần 14 - 27",
            subtitle: "Phát triển xương & não bộ bé",
            calDiff: "+300-350 kcal/ngày",
            nutrients: [
                { name: "Canxi & Vit D", source: "Sữa tiệt trùng, sữa chua, tôm", desc: "Phát triển hệ xương răng của bé." },
                { name: "DHA & Omega-3", source: "Cá hồi, hạt óc chó, hạt chia", desc: "Cấu tạo võng mạc và não bộ." },
                { name: "Kẽm & Magie", source: "Thịt bò, hạt bí, các loại đậu", desc: "Hoàn thiện miễn dịch thai nhi." }
            ],
            avoid: "Cá săn mồi lớn có thủy ngân cao (cá ngừ đại dương, cá kiếm).",
            tips: "Bổ sung sữa tươi hoặc sữa bầu mỗi ngày. Vận động nhẹ nhàng."
        },
        3: {
            title: "Tam Cá Nguyệt 3",
            weekRange: "Tuần 28 - 42",
            subtitle: "Bé tăng tốc tích lũy cân nặng",
            calDiff: "+450 kcal/ngày",
            nutrients: [
                { name: "Chất xơ & Nước", source: "Khoai lang luộc, đu đủ, dừa xiêm", desc: "Tránh táo bón & duy trì nước ối." },
                { name: "Vitamin C", source: "Cam, bưởi, ổi tươi, dâu tây", desc: "Tăng đề kháng & hấp thụ sắt." },
                { name: "Đạm (Protein)", source: "Thịt nạc heo/bò, ức gà, trứng", desc: "Phát triển khối cơ bắp của bé." }
            ],
            avoid: "Ăn quá mặn (gây phù nề) và đồ quá ngọt (tiểu đường thai kỳ).",
            tips: "Dạ dày bị chèn ép, nên nhai kỹ. Tránh uống nước nhiều sát giờ ngủ."
        }
    };

    const currentTrimesterAdvice = trimesterAdviceData[selectedTrimester];

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
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                            Dinh Dưỡng An Toàn
                            {profile?.syncRole === 'partner' && (
                                <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '12px', marginLeft: '10px', verticalAlign: 'middle' }}>
                                    Đang đồng bộ 👨‍👩‍👦
                                </span>
                            )}
                        </h2>
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
                    <button onClick={() => setActiveTab('medical')} className={`segment-btn ${activeTab === 'medical' ? 'active' : ''}`}>
                        Y khoa chuẩn
                    </button>
                    <button onClick={() => setActiveTab('diary')} className={`segment-btn ${activeTab === 'diary' ? 'active' : ''}`}>
                        Nhật ký
                    </button>
                </div>

                {activeTab === 'lookup' && (
                    <FoodLookup
                        searchKeyword={searchKeyword}
                        setSearchKeyword={setSearchKeyword}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filteredFood={filteredFood}
                    />
                )}

                {activeTab === 'guide' && (
                    <WeeklyMenuGuide
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        weeklyMenu={WEEKLY_MENU}
                    />
                )}

                {activeTab === 'medical' && (
                    <WeightGuide
                        preHeight={preHeight}
                        setPreHeight={setPreHeight}
                        preWeight={preWeight}
                        setPreWeight={setPreWeight}
                        bmiResult={bmiResult}
                        bmiCategory={bmiCategory}
                        bmiRecommendation={bmiRecommendation}
                        onCalculateBmi={calculateBmi}
                    />
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', marginBottom: '12px' }}>
                                    <button 
                                        className="add-meal-btn" 
                                        onClick={openAddModal}
                                        style={{ margin: 0 }}
                                    >
                                        <IoAddCircleOutline size={18} /> Ghi chép bữa ăn
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => setShowMiniChart(!showMiniChart)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '16px',
                                            border: '1.5px solid #e2e8f0',
                                            background: 'white',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            color: 'var(--text-main)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoPulseOutline style={{ color: '#db2777' }} /> So sánh 7 ngày qua
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                                            {showMiniChart ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                                        </span>
                                    </button>

                                    {showMiniChart && (
                                        <div className="fade-in">
                                            <CalorieMiniChart
                                                last7DaysData={last7DaysData}
                                                maxCalIn7Days={maxCalIn7Days}
                                                calorieGoal={calorieGoal}
                                                todayCalories={todayCalories}
                                                todayStr={todayStr}
                                            />
                                        </div>
                                    )}

                                    <button 
                                        type="button"
                                        onClick={() => setShowTrimesterAdvice(!showTrimesterAdvice)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '16px',
                                            border: '1.5px solid #e2e8f0',
                                            background: 'white',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            color: 'var(--text-main)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoShieldCheckmarkOutline style={{ color: '#db2777' }} /> Lời khuyên theo giai đoạn
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                                            {showTrimesterAdvice ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                                        </span>
                                    </button>

                                    {showTrimesterAdvice && (
                                        <div className="fade-in">
                                            <TrimesterAdviceCard
                                                profile={profile}
                                                calculatedTrimester={calculatedTrimester}
                                                selectedTrimester={selectedTrimester}
                                                setSelectedTrimester={setSelectedTrimester}
                                            />
                                        </div>
                                    )}
                                </div>
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
                                        paginatedDates.map(date => {
                                            let dateLabel = date === todayStr ? "Hôm nay" : date === yesterdayStr ? "Hôm qua" : date.split('-').reverse().join('/');
                                            const group = groups[date];
                                            const sortedMeals = [...group.meals].sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
                                            return (
                                                <div className="day-card" key={date}>
                                                    <div className="day-header">
                                                        <span className="day-title">{dateLabel}</span>
                                                        <span className="day-cals"><IoFlameOutline /> <span>{group.totalCal} kcal</span></span>
                                                    </div>
                                                    <div className="day-meals">
                                                        {sortedMeals.map((m, idx) => {
                                                            const timeStr = m.datetime ? m.datetime.split('T')[1]?.substring(0, 5) : '';
                                                            const matchedBreakdown = parseMealFoods(m.content);
                                                            const mealCal = matchedBreakdown.length > 0
                                                                ? matchedBreakdown.reduce((sum, item) => sum + item.calories, 0)
                                                                : (Number(m.calories) || 0);
                                                            const chronologicalIdx = sortedMeals.length - idx;
                                                            return (
                                                                <div className="day-meal-item" key={m.id} style={{ borderLeftColor: mealColors[m.type] || '#ccc' }}>
                                                                    <div className="dmi-top">
                                                                        <div className="dmi-type" style={{ color: mealColors[m.type], display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>#{chronologicalIdx}</span>
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
                                                                    {matchedBreakdown.length > 0 && (
                                                                        <div style={{ 
                                                                            display: 'flex', 
                                                                            flexWrap: 'wrap', 
                                                                            gap: '6px', 
                                                                            marginTop: '6px', 
                                                                            padding: '6px 10px', 
                                                                            background: 'rgba(0,0,0,0.02)', 
                                                                            borderRadius: '8px',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            {matchedBreakdown.map((item, itemIdx) => (
                                                                                <span key={itemIdx} style={{ fontSize: '0.75rem', color: '#64748b', background: 'white', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                                                    {item.name}: <strong style={{ color: '#db2777' }}>{item.calories} cal</strong>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {mealCal > 0 && <div className="dmi-cal"><IoFlameOutline /> {mealCal} kcal</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '10px 0' }}>
                                            <button 
                                                disabled={effectivePage === 1}
                                                onClick={() => setDiaryPage(effectivePage - 1)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    background: effectivePage === 1 ? '#f1f5f9' : 'white',
                                                    color: effectivePage === 1 ? '#94a3b8' : '#475569',
                                                    cursor: effectivePage === 1 ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    transition: 'all 0.2s',
                                                    boxShadow: effectivePage === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                Trước
                                            </button>
                                            <span style={{ fontSize: '0.88rem', color: 'var(--text-sub)', fontWeight: 700 }}>
                                                Trang {effectivePage} / {totalPages}
                                            </span>
                                            <button 
                                                disabled={effectivePage === totalPages}
                                                onClick={() => setDiaryPage(effectivePage + 1)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    background: effectivePage === totalPages ? '#f1f5f9' : 'white',
                                                    color: effectivePage === totalPages ? '#94a3b8' : '#475569',
                                                    cursor: effectivePage === totalPages ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    transition: 'all 0.2s',
                                                    boxShadow: effectivePage === totalPages ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Sheet modal for meal write */}
            <MealModal
                showModal={showModal}
                mealId={mealId}
                mealType={mealType}
                mealContent={mealContent}
                mealDatetime={mealDatetime}
                mealCalories={mealCalories}
                detectedFoods={detectedFoods}
                isSaving={isSaving}
                onClose={closeMealModal}
                setMealType={setMealType}
                setMealContent={setMealContent}
                setMealDatetime={setMealDatetime}
                setMealCalories={setMealCalories}
                handleContentChange={(e) => handleContentChange(e.target.value)}
                onSubmit={saveMeal}
            />

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

                .nutrition-modal-overlay {
                    display: flex;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 2100;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .nutrition-modal-sheet {
                    width: 100%;
                    max-width: 600px;
                    background: white;
                    border-radius: 28px;
                    padding: 24px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                @media (max-width: 900px) {
                    .nutrition-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .nutrition-modal-sheet {
                        border-radius: 28px 28px 0 0;
                        max-height: 85vh;
                        animation: slideUpV2 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }
                @keyframes slideUpV2 {
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

                /* MEDICAL TAB STYLES */
                .bmi-calc-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    align-items: flex-end;
                }
                .medical-table-wrapper {
                    overflow-x: auto;
                    margin-top: 10px;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    background: white;
                }
                .medical-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 0.85rem;
                    color: var(--text-main);
                }
                .medical-table th {
                    background: #f8fafc;
                    padding: 14px 16px;
                    font-weight: 800;
                    border-bottom: 1.5px solid #e2e8f0;
                    color: #475569;
                    white-space: nowrap;
                }
                .medical-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    line-height: 1.6;
                    vertical-align: top;
                }
                .medical-table tr:last-child td {
                    border-bottom: none;
                }
                .medical-table .bold-cell {
                    font-weight: 800;
                    color: #1e293b;
                }
                .medical-table .text-primary { color: var(--primary) !important; }
                .medical-table .text-danger { color: #ef4444 !important; }
                .medical-table .text-warning { color: #d97706 !important; }
                .medical-table .text-info { color: #0284c7 !important; }
                
                .medical-grid-safety {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                    margin-top: 10px;
                }
                .safety-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 18px;
                }
            `}</style>
        </>
    );
}
