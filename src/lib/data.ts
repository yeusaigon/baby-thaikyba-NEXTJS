// DỮ LIỆU CẨM NANG THAI KỲ (1 - 42 TUẦN)
export interface PregnancyWeekData {
    size: string;
    weight: string;
    emoji: string;
    baby: string;
    mom: string;
    advice: string;
    symptoms: string[];
    toDoList: string[];
    detail: string[];
}

export const PREGNANCY_DATA: Record<number, PregnancyWeekData> = {
    // --- THÁNG 1: KHỞI ĐẦU ---
    1: {
        size: "Hạt bụi nhỏ", weight: "< 1g", emoji: "🕸️",
        baby: "Cơ thể mẹ đang chuẩn bị lớp niêm mạc tử cung êm ái nhất để đón bé.",
        mom: "Thực chất tuần này mẹ... chưa có bầu. Đây là tuần tính từ ngày đầu kỳ kinh cuối.",
        advice: "Bắt đầu uống Vitamin tổng hợp (đặc biệt là Axit Folic 400mcg) ngay nhé!",
        symptoms: ["Trễ kinh, ngực căng tức", "Mệt mỏi, buồn ngủ", "Có thể ra máu báo thai lấm tấm"],
        toDoList: ["Mua que thử thai", "Bắt đầu uống Axit Folic 400mcg", "Ngừng sử dụng rượu bia, thuốc lá"],
        detail: ["Đây là tuần 'lấy đà'. Cơ thể mẹ đang reset lại hormone để chuẩn bị cho sự kiện rụng trứng."]
    },
    2: {
        size: "Trứng cá hồi", weight: "< 1g", emoji: "🍣",
        baby: "Sự thụ tinh diễn ra! Tinh trùng xuất sắc nhất đã gặp trứng.",
        mom: "Mẹ có thể cảm thấy hơi đau nhói ở bụng dưới khi rụng trứng.",
        advice: "Giữ tinh thần thoải mái, 'yêu' đều đặn để tăng cơ hội thụ thai.",
        symptoms: ["Trễ kinh, ngực căng tức", "Mệt mỏi, buồn ngủ", "Có thể ra máu báo thai lấm tấm"],
        toDoList: ["Mua que thử thai", "Bắt đầu uống Axit Folic 400mcg", "Ngừng sử dụng rượu bia, thuốc lá"],
        detail: ["Hợp tử (bé yêu) bắt đầu phân chia tế bào điên cuồng trên đường di chuyển về tử cung."]
    },
    3: {
        size: "Hạt vừng", weight: "< 1g", emoji: "🌱",
        baby: "Bé là một quả bóng tí hon (phôi nang) đang đào hang làm tổ trong tử cung.",
        mom: "Có thể ra chút máu báo thai (máu màu nâu/hồng nhạt).",
        advice: "Tuyệt đối không uống rượu bia, thuốc lá từ lúc này.",
        symptoms: ["Trễ kinh, ngực căng tức", "Mệt mỏi, buồn ngủ", "Có thể ra máu báo thai lấm tấm"],
        toDoList: ["Mua que thử thai", "Bắt đầu uống Axit Folic 400mcg", "Ngừng sử dụng rượu bia, thuốc lá"],
        detail: ["Nếu xét nghiệm máu Beta-HCG lúc này, mẹ đã có thể biết tin vui rồi đấy!"]
    },
    4: {
        size: "Hạt mè", weight: "< 1g", emoji: "🌱",
        baby: "Phôi thai phân chia thành 3 lớp: Ngoại bì (thần kinh), Trung bì (tim, xương), Nội bì (phổi, ruột).",
        mom: "Trễ kinh! Dấu hiệu rõ ràng nhất. Ngực bắt đầu căng tức.",
        advice: "Thử que ngay thôi! Chúc mừng mẹ đã chính thức gia nhập hội mẹ bầu.",
        symptoms: ["Trễ kinh, ngực căng tức", "Mệt mỏi, buồn ngủ", "Có thể ra máu báo thai lấm tấm"],
        toDoList: ["Mua que thử thai", "Bắt đầu uống Axit Folic 400mcg", "Ngừng sử dụng rượu bia, thuốc lá"],
        detail: ["Túi ối và nhau thai đang hình thành để làm 'nhà' và 'bếp ăn' cho bé."]
    },
    // --- THÁNG 2: HÌNH THÀNH ---
    5: {
        size: "Hạt tiêu", weight: "1g", emoji: "🌶️",
        baby: "Tim thai bắt đầu đập! (Dù siêu âm có thể chưa thấy). Hệ thần kinh phát triển thần tốc.",
        mom: "Cảm giác ốm nghén ghé thăm: buồn nôn, mệt mỏi, buồn ngủ díu mắt.",
        advice: "Chia nhỏ bữa ăn. Tránh mùi lạ. Ngủ nhiều nhất có thể.",
        symptoms: ["Ốm nghén, buồn nôn, sợ mùi", "Đi tiểu nhiều lần", "Tâm trạng thất thường"],
        toDoList: ["Đi siêu âm lần đầu xem thai vào tổ chưa", "Chia nhỏ bữa ăn làm 5-6 bữa/ngày", "Nghỉ ngơi nhiều nhất có thể"],
        detail: ["Hai bán cầu não của bé đang hình thành. Ống thần kinh bắt đầu khép lại."]
    },
    6: {
        size: "Hạt đậu lăng", weight: "1g", emoji: "🫘",
        baby: "Tim đập 100-160 nhịp/phút (nhanh gấp đôi mẹ). Mũi, miệng, tai bắt đầu định hình.",
        mom: "Đi tiểu nhiều hơn do tử cung chèn ép bàng quang. Tâm trạng thất thường.",
        advice: "Uống đủ nước. Ăn gừng hoặc uống trà gừng ấm để giảm buồn nôn.",
        symptoms: ["Ốm nghén, buồn nôn, sợ mùi", "Đi tiểu nhiều lần", "Tâm trạng thất thường"],
        toDoList: ["Đi siêu âm lần đầu xem thai vào tổ chưa", "Chia nhỏ bữa ăn làm 5-6 bữa/ngày", "Nghỉ ngơi nhiều nhất có thể"],
        detail: ["Ruột của bé đang phát triển, và thậm chí còn chồi ra ngoài dây rốn một chút."]
    },
    7: {
        size: "Quả việt quất", weight: "1g", emoji: "🫐",
        baby: "Bàn tay, bàn chân bé xíu nhú ra như mái chèo. Bé có đuôi (nhưng sẽ sớm rụng).",
        mom: "Mặt có thể nổi mụn nội tiết. Cố lên mẹ ơi!",
        advice: "Đi khám thai lần đầu để xác định thai đã vào tử cung an toàn chưa.",
        symptoms: ["Ốm nghén, buồn nôn, sợ mùi", "Đi tiểu nhiều lần", "Tâm trạng thất thường"],
        toDoList: ["Đi siêu âm lần đầu xem thai vào tổ chưa", "Chia nhỏ bữa ăn làm 5-6 bữa/ngày", "Nghỉ ngơi nhiều nhất có thể"],
        detail: ["Bé đã có mí mắt (dù chưa mở). Thận bắt đầu hoạt động."]
    },
    8: {
        size: "Quả mâm xôi", weight: "1g", emoji: "🍓",
        baby: "Ngón tay ngón chân đã tách rời. Bé liên tục nhào lộn dù mẹ chưa cảm nhận được.",
        mom: "Tử cung to bằng quả cam. Dây chằng bụng có thể hơi đau.",
        advice: "Đổi sang áo ngực rộng rãi, thoải mái hơn. Ăn nhiều rau xanh.",
        symptoms: ["Ốm nghén, buồn nôn, sợ mùi", "Đi tiểu nhiều lần", "Tâm trạng thất thường"],
        toDoList: ["Đi siêu âm lần đầu xem thai vào tổ chưa", "Chia nhỏ bữa ăn làm 5-6 bữa/ngày", "Nghỉ ngơi nhiều nhất có thể"],
        detail: ["Các cơ quan nội tạng chính đã định hình. Giai đoạn này rất nhạy cảm với các chất độc hại."]
    },
    // --- THÁNG 3: HOÀN THIỆN ---
    9: {
        size: "Quả nho", weight: "2g", emoji: "🍇",
        baby: "Cơ bắp hình thành. Bé biết co tay, gập chân. Tim đã chia 4 ngăn.",
        mom: "Vòng eo bắt đầu dày lên một chút. Cảm giác đầy hơi, khó tiêu.",
        advice: "Bổ sung Canxi và Vitamin D. Đi bộ nhẹ nhàng.",
        symptoms: ["Đầy hơi, ợ nóng, khó tiêu", "Căng tức ngực", "Nghén có thể vẫn còn nặng"],
        toDoList: ["Đo độ mờ da gáy (tuần 11-13)", "Làm xét nghiệm NIPT/Double Test", "Bổ sung sắt và canxi theo chỉ định"],
        detail: ["Núm vú của bé hình thành. Các nang lông cũng bắt đầu xuất hiện."]
    },
    10: {
        size: "Quả quất (Tắc)", weight: "4g", emoji: "🍊",
        baby: "Xương và sụn đang cứng lại. Móng tay bé xíu đã mọc.",
        mom: "Lưu lượng máu tăng 50% khiến mẹ có thể thấy gân xanh nổi lên.",
        advice: "Nên làm xét nghiệm NIPT hoặc Double Test từ tuần này đến tuần 13.",
        symptoms: ["Đầy hơi, ợ nóng, khó tiêu", "Căng tức ngực", "Nghén có thể vẫn còn nặng"],
        toDoList: ["Đo độ mờ da gáy (tuần 11-13)", "Làm xét nghiệm NIPT/Double Test", "Bổ sung sắt và canxi theo chỉ định"],
        detail: ["Bé đã nuốt nước ối và thải ra nước tiểu. Thận hoạt động tích cực."]
    },
    11: {
        size: "Quả sung", weight: "7g", emoji: "🥭",
        baby: "Bé biết vươn vai, nấc cụt. Da vẫn còn trong suốt.",
        mom: "Tóc và móng tay mẹ mọc nhanh hơn nhờ hormone.",
        advice: "Đo độ mờ da gáy (Thời điểm vàng!). Đừng bỏ lỡ mốc này.",
        symptoms: ["Đầy hơi, ợ nóng, khó tiêu", "Căng tức ngực", "Nghén có thể vẫn còn nặng"],
        toDoList: ["Đo độ mờ da gáy (tuần 11-13)", "Làm xét nghiệm NIPT/Double Test", "Bổ sung sắt và canxi theo chỉ định"],
        detail: ["Đầu bé vẫn chiếm 1/2 chiều dài cơ thể. Bé bắt đầu có phản xạ đá chân."]
    },
    12: {
        size: "Quả chanh ta", weight: "14g", emoji: "🍋",
        baby: "Khuôn mặt đã rõ nét người. Ruột đã rút hoàn toàn vào trong bụng.",
        mom: "Ốm nghén bắt đầu giảm (với đa số). Tử cung nhô lên khỏi xương chậu.",
        advice: "Bắt đầu bôi kem chống rạn da. Uống nhiều nước.",
        symptoms: ["Đầy hơi, ợ nóng, khó tiêu", "Căng tức ngực", "Nghén có thể vẫn còn nặng"],
        toDoList: ["Đo độ mờ da gáy (tuần 11-13)", "Làm xét nghiệm NIPT/Double Test", "Bổ sung sắt và canxi theo chỉ định"],
        detail: ["Bé biết nhăn mặt, mút ngón tay. Tuyến yên bắt đầu sản xuất hormone."]
    },
    // --- THÁNG 4: TĂNG TỐC ---
    13: {
        size: "Quả chanh vàng", weight: "23g", emoji: "🍋",
        baby: "Vân tay hình thành - dấu ấn riêng biệt của bé. Giọng nói (thanh quản) phát triển.",
        mom: "Chào mừng đến Tam cá nguyệt 2 - Giai đoạn 'Trăng mật' của thai kỳ!",
        advice: "Tăng cường đạm và sắt. Mẹ sẽ thấy khỏe khoắn và ăn ngon miệng hơn.",
        symptoms: ["Hết nghén, ăn ngon miệng hơn", "Tăng cân nhẹ", "Đau dây chằng tròn ở bụng dưới"],
        toDoList: ["Sắm quần áo bầu rộng rãi", "Bắt đầu bôi kem chống rạn da", "Bổ sung DHA phát triển não bé"],
        detail: ["If là bé gái, buồng trứng đã chứa 2 triệu trứng. If là bé trai, tinh hoàn đang phát triển."]
    },
    14: {
        size: "Quả đào", weight: "43g", emoji: "🍑",
        baby: "Cổ dài ra, đầu ngẩng cao. Một lớp lông tơ bao phủ toàn thân để giữ ấm.",
        mom: "Bụng dưới nhô lên rõ rệt. Mẹ nên mua quần bầu chuyên dụng.",
        advice: "Tránh đứng quá lâu. Tập Kegel để cơ sàn chậu khỏe mạnh.",
        symptoms: ["Hết nghén, ăn ngon miệng hơn", "Tăng cân nhẹ", "Đau dây chằng tròn ở bụng dưới"],
        toDoList: ["Sắm quần áo bầu rộng rãi", "Bắt đầu bôi kem chống rạn da", "Bổ sung DHA phát triển não bé"],
        detail: ["Bé biết nhăn mày, nheo mắt, thậm chí là cau có."]
    },
    15: {
        size: "Quả táo", weight: "70g", emoji: "🍎",
        baby: "Bé cảm nhận được ánh sáng dù mắt vẫn nhắm. Chân dài hơn tay.",
        mom: "Có thể hay quên (Chứng não cá vàng thai kỳ). Đừng lo, bình thường thôi.",
        advice: "Nằm nghiêng trái khi ngủ là tư thế tốt nhất cho máu lưu thông.",
        symptoms: ["Hết nghén, ăn ngon miệng hơn", "Tăng cân nhẹ", "Đau dây chằng tròn ở bụng dưới"],
        toDoList: ["Sắm quần áo bầu rộng rãi", "Bắt đầu bôi kem chống rạn da", "Bổ sung DHA phát triển não bé"],
        detail: ["Bé tập thở bằng cách hít đẩy nước ối vào phổi."]
    },
    16: {
        size: "Quả bơ", weight: "100g", emoji: "🥑",
        baby: "Giới tính đã có thể nhìn thấy qua siêu âm (tùy tư thế bé). Xương cứng cáp hơn.",
        mom: "Thai máy! Cảm giác như cánh bướm đập hoặc tôm búng nhẹ trong bụng.",
        advice: "Siêu âm hình thái sớm. Bổ sung DHA để phát triển não bộ bé.",
        symptoms: ["Hết nghén, ăn ngon miệng hơn", "Tăng cân nhẹ", "Đau dây chằng tròn ở bụng dưới"],
        toDoList: ["Sắm quần áo bầu rộng rãi", "Bắt đầu bôi kem chống rạn da", "Bổ sung DHA phát triển não bé"],
        detail: ["Tim bé bơm khoảng 25 lít máu mỗi ngày. Hệ tuần hoàn làm việc hết công suất."]
    },
    // --- THÁNG 5: CẢM NHẬN ---
    17: {
        size: "Củ hành tây", weight: "140g", emoji: "🧅",
        baby: "Các khớp tay chân linh hoạt. Tuyến mồ hôi bắt đầu phát triển.",
        mom: "Dễ mất thăng bằng do bụng lớn. Cẩn thận khi đi lại.",
        advice: "Tránh giày cao gót. Đi giày bệt chống trượt.",
        symptoms: ["Bắt đầu cảm nhận thai máy (bé đạp)", "Rốn có thể lồi ra", "Sọc nâu giữa bụng (Linea nigra) rõ dần"],
        toDoList: ["Siêu âm hình thái học 4D (mốc 20-22 tuần)", "Nằm nghiêng bên trái khi ngủ", "Tham gia lớp học tiền sản"],
        detail: ["Dây rốn ngày càng dày và chắc khỏe hơn để vận chuyển dưỡng chất."]
    },
    18: {
        size: "Quả ớt chuông", weight: "190g", emoji: "🫑",
        baby: "Tai đã về đúng vị trí. Bé nghe được tiếng tim mẹ và âm thanh lớn bên ngoài.",
        mom: "Thèm ăn vô độ. Cẩn thận tăng cân quá đà nhé mẹ.",
        advice: "Hạn chế đồ ngọt, tinh bột xấu. Ăn nhiều hạt, ngũ cốc.",
        symptoms: ["Bắt đầu cảm nhận thai máy (bé đạp)", "Rốn có thể lồi ra", "Sọc nâu giữa bụng (Linea nigra) rõ dần"],
        toDoList: ["Siêu âm hình thái học 4D (mốc 20-22 tuần)", "Nằm nghiêng bên trái khi ngủ", "Tham gia lớp học tiền sản"],
        detail: ["Bé có thể giật mình nếu nghe tiếng động lớn đột ngột."]
    },
    19: {
        size: "Quả xoài", weight: "240g", emoji: "🥭",
        baby: "Lớp gây (sáp trắng) bao phủ bảo vệ da bé trong môi trường nước.",
        mom: "Có thể bị chuột rút bắp chân, đau lưng dưới.",
        advice: "Massage chân, ngâm chân nước ấm. Bổ sung Canxi, Magie.",
        symptoms: ["Bắt đầu cảm nhận thai máy (bé đạp)", "Rốn có thể lồi ra", "Sọc nâu giữa bụng (Linea nigra) rõ dần"],
        toDoList: ["Siêu âm hình thái học 4D (mốc 20-22 tuần)", "Nằm nghiêng bên trái khi ngủ", "Tham gia lớp học tiền sản"],
        detail: ["Thận bé đã tạo ra nước tiểu thực sự. Tóc đang mọc."]
    },
    20: {
        size: "Quả chuối", weight: "300g", emoji: "🍌",
        baby: "Một nửa chặng đường! Bé nuốt nước ối nhiều hơn để tập tiêu hóa.",
        mom: "Rốn có thể lồi ra. Xuất hiện đường sọc nâu giữa bụng.",
        advice: "Siêu âm 4D hình thái học - Mốc quan trọng nhất để soát dị tật.",
        symptoms: ["Bắt đầu cảm nhận thai máy (bé đạp)", "Rốn có thể lồi ra", "Sọc nâu giữa bụng (Linea nigra) rõ dần"],
        toDoList: ["Siêu âm hình thái học 4D (mốc 20-22 tuần)", "Nằm nghiêng bên trái khi ngủ", "Tham gia lớp học tiền sản"],
        detail: ["Bé ngủ và thức có chu kỳ. Mẹ sẽ thấy bé đạp nhiều vào giờ nhất định."]
    },
    // --- THÁNG 6: PHẢN XẠ ---
    21: {
        size: "Củ cà rốt", weight: "360g", emoji: "🥕",
        baby: "Lông mày, mí mắt đã hoàn thiện. Bé chuyển động rất mạnh (đạp, trườn).",
        mom: "Dễ bị giãn tĩnh mạch chân. Da bụng có thể bắt đầu ngứa do rạn.",
        advice: "Không gãi bụng. Bôi kem dưỡng ẩm/dầu dừa thường xuyên.",
        symptoms: ["Chuột rút bắp chân (đặc biệt về đêm)", "Đau lưng dưới", "Ngứa da bụng do căng rạn"],
        toDoList: ["Làm xét nghiệm tiểu đường thai kỳ (tuần 24-28)", "Massage chân, ngâm chân nước ấm", "Không gãi bụng, bôi kem dưỡng ẩm"],
        detail: ["Tủy xương của bé đã bắt đầu sản xuất tế bào máu."]
    },
    22: {
        size: "Quả đu đủ nhỏ", weight: "430g", emoji: "🥭",
        baby: "Các giác quan phát triển bùng nổ: Xúc giác, vị giác, thính giác, thị giác.",
        mom: "Tử cung cao hơn rốn khoảng 2cm.",
        advice: "Ăn thực phẩm giàu Sắt (thịt bò, rau dền) để tránh thiếu máu.",
        symptoms: ["Chuột rút bắp chân (đặc biệt về đêm)", "Đau lưng dưới", "Ngứa da bụng do căng rạn"],
        toDoList: ["Làm xét nghiệm tiểu đường thai kỳ (tuần 24-28)", "Massage chân, ngâm chân nước ấm", "Không gãi bụng, bôi kem dưỡng ẩm"],
        detail: ["Bé thích sờ soạng mặt mình, nắm dây rốn."]
    },
    23: {
        size: "Quả bưởi", weight: "500g", emoji: "🍈",
        baby: "Phổi hình thành các phế nang. Bé nghe rõ giọng nói của ba mẹ.",
        mom: "Có thể thấy các cơn gò giả Braxton Hicks (bụng cứng nhẹ rồi hết).",
        advice: "Thai giáo bằng âm nhạc và trò chuyện với bé hàng ngày.",
        symptoms: ["Chuột rút bắp chân (đặc biệt về đêm)", "Đau lưng dưới", "Ngứa da bụng do căng rạn"],
        toDoList: ["Làm xét nghiệm tiểu đường thai kỳ (tuần 24-28)", "Massage chân, ngâm chân nước ấm", "Không gãi bụng, bôi kem dưỡng ẩm"],
        detail: ["Mắt bé đã có chuyển động nhanh (REM) khi ngủ, chứng tỏ bé đang mơ!"]
    },
    24: {
        size: "Bắp ngô", weight: "600g", emoji: "🌽",
        baby: "Khuôn mặt đã hoàn thiện gần như lúc chào đời. Da bớt trong suốt.",
        mom: "Xét nghiệm tiểu đường thai kỳ (từ tuần 24-28).",
        advice: "Hạn chế tinh bột, đồ ngọt. Ăn nhiều rau xanh.",
        symptoms: ["Chuột rút bắp chân (đặc biệt về đêm)", "Đau lưng dưới", "Ngứa da bụng do căng rạn"],
        toDoList: ["Làm xét nghiệm tiểu đường thai kỳ (tuần 24-28)", "Massage chân, ngâm chân nước ấm", "Không gãi bụng, bôi kem dưỡng ẩm"],
        detail: ["Nếu sinh non ở tuần này, bé đã có cơ hội sống sót nhờ y học hiện đại."]
    },
    // --- THÁNG 7: HOÀN THIỆN ---
    25: {
        size: "Củ cải trắng", weight: "660g", emoji: "🥬",
        baby: "Mỡ dưới da tích tụ giúp bé bớt nhăn nheo và trông bụ bẫm hơn.",
        mom: "Tóc mẹ dày và bóng mượt (ít rụng). Bụng to gây khó ngủ.",
        advice: "Dùng gối ôm bà bầu để kê bụng và lưng khi ngủ.",
        symptoms: ["Chân tay có dấu hiệu phù nhẹ", "Khó thở do tử cung chèn ép cơ hoành", "Ợ nóng và táo bón"],
        toDoList: ["Tiêm phòng uốn ván (mũi 1)", "Dùng gối ôm chữ U cho bà bầu", "Ăn nhiều thực phẩm giàu xơ (khoai lang, đu đủ)"],
        detail: ["Mũi bé bắt đầu hoạt động, dù vẫn ngập trong nước ối."]
    },
    26: {
        size: "Cây xà lách", weight: "760g", emoji: "🥬",
        baby: "Bé có thể mở mắt! Màu mắt chưa cố định (thường là xanh/xám).",
        mom: "Đau sườn do tử cung chèn ép lồng ngực. Khó thở nhẹ.",
        advice: "Tiêm phòng uốn ván mũi 1.",
        symptoms: ["Chân tay có dấu hiệu phù nhẹ", "Khó thở do tử cung chèn ép cơ hoành", "Ợ nóng và táo bón"],
        toDoList: ["Tiêm phòng uốn ván (mũi 1)", "Dùng gối ôm chữ U cho bà bầu", "Ăn nhiều thực phẩm giàu xơ (khoai lang, đu đủ)"],
        detail: ["Bé hít vào thở ra nước ối nhịp nhàng để luyện phổi."]
    },
    27: {
        size: "Bông cải trắng", weight: "875g", emoji: "🥦",
        baby: "Não bộ phát triển nếp nhăn. Bé phân biệt được ánh sáng/bóng tối.",
        mom: "Chào mừng đến Tam cá nguyệt 3 - Chặng nước rút!",
        advice: "Đăng ký hồ sơ sinh tại bệnh viện dự kiến.",
        symptoms: ["Chân tay có dấu hiệu phù nhẹ", "Khó thở do tử cung chèn ép cơ hoành", "Ợ nóng và táo bón"],
        toDoList: ["Tiêm phòng uốn ván (mũi 1)", "Dùng gối ôm chữ U cho bà bầu", "Ăn nhiều thực phẩm giàu xơ (khoai lang, đu đủ)"],
        detail: ["Bé có thể mút ngón tay cái để tự trấn an."]
    },
    28: {
        size: "Quả cà tím", weight: "1kg", emoji: "🍆",
        baby: "Bé biết chớp mắt. Lông mi đã mọc dài. Bé mơ nhiều hơn.",
        mom: "Bắt đầu đếm cử động thai hàng ngày (Sáng-Trưa-Tối).",
        advice: "Chuẩn bị đồ đi sinh dần là vừa. Giặt ủi quần áo cho bé.",
        symptoms: ["Chân tay có dấu hiệu phù nhẹ", "Khó thở do tử cung chèn ép cơ hoành", "Ợ nóng và táo bón"],
        toDoList: ["Tiêm phòng uốn ván (mũi 1)", "Dùng gối ôm chữ U cho bà bầu", "Ăn nhiều thực phẩm giàu xơ (khoai lang, đu đủ)"],
        detail: ["Bé đang xoay đầu để chuẩn bị ngôi thuận (một số bé xoay sớm)."]
    },
    // --- THÁNG 8: LỚN NHANH ---
    29: {
        size: "Quả bí hồ lô", weight: "1.2kg", emoji: "🎃",
        baby: "Đầu bé to ra để chứa bộ não đang phát triển siêu tốc.",
        mom: "Áp lực lên bàng quang lớn, đi tiểu liên tục. Táo bón nặng hơn.",
        advice: "Ăn khoai lang, đu đủ chín, sữa chua để nhuận tràng.",
        symptoms: ["Tiết sữa non (màu vàng nhạt)", "Cơn gò giả Braxton Hicks", "Mất ngủ, khó tìm tư thế thoải mái"],
        toDoList: ["Đếm cử động thai (thai máy) mỗi ngày", "Tiêm phòng uốn ván (mũi 2)", "Bắt đầu giặt giũ đồ sơ sinh"],
        detail: ["Xương bé cứng cáp hơn, nhưng xương sọ vẫn mềm để dễ sinh."]
    },
    30: {
        size: "Quả bắp cabbage", weight: "1.3kg", emoji: "🥬",
        baby: "Lông tơ rụng dần. Tủy xương đảm nhận việc sản xuất hồng cầu.",
        mom: "Tâm trạng lo lắng về việc sinh nở. Mất ngủ.",
        advice: "Tham gia lớp học tiền sản. Tập thở, tập rặn.",
        symptoms: ["Tiết sữa non (màu vàng nhạt)", "Cơn gò giả Braxton Hicks", "Mất ngủ, khó tìm tư thế thoải mái"],
        toDoList: ["Đếm cử động thai (thai máy) mỗi ngày", "Tiêm phòng uốn ván (mũi 2)", "Bắt đầu giặt giũ đồ sơ sinh"],
        detail: ["Thị lực bé phát triển, có thể nhìn thấy vật cách mắt 20-30cm."]
    },
    31: {
        size: "Quả dừa", weight: "1.5kg", emoji: "🥥",
        baby: "Bé quay đầu sang hai bên. Tay chân mũm mĩm.",
        mom: "Ngực tiết sữa non (chất lỏng vàng nhạt).",
        advice: "Mua miếng lót thấm sữa. Vệ sinh đầu ti nhẹ nhàng.",
        symptoms: ["Tiết sữa non (màu vàng nhạt)", "Cơn gò giả Braxton Hicks", "Mất ngủ, khó tìm tư thế thoải mái"],
        toDoList: ["Đếm cử động thai (thai máy) mỗi ngày", "Tiêm phòng uốn ván (mũi 2)", "Bắt đầu giặt giũ đồ sơ sinh"],
        detail: ["Bé ngủ rất nhiều để tích trữ năng lượng lớn."]
    },
    32: {
        size: "Quả bí đỏ", weight: "1.7kg", emoji: "🎃",
        baby: "Móng tay mọc dài hết đầu ngón. Da hồng hào, căng mịn.",
        mom: "Đau lưng dữ dội. Cơn gò Braxton Hicks xuất hiện nhiều hơn.",
        advice: "Tiêm phòng uốn ván mũi 2 (cách mũi 1 ít nhất 1 tháng).",
        symptoms: ["Tiết sữa non (màu vàng nhạt)", "Cơn gò giả Braxton Hicks", "Mất ngủ, khó tìm tư thế thoải mái"],
        toDoList: ["Đếm cử động thai (thai máy) mỗi ngày", "Tiêm phòng uốn ván (mũi 2)", "Bắt đầu giặt giũ đồ sơ sinh"],
        detail: ["Bé đã chiếm gần hết không gian tử cung, mẹ sẽ thấy bé ít nhào lộn hơn mà chỉ đạp trườn."]
    },
    // --- THÁNG 9: VỀ ĐÍCH ---
    33: {
        size: "Quả dứa", weight: "1.9kg", emoji: "🍍",
        baby: "Xương sọ chưa khép kín (thóp) để các mảnh xương chồng lên nhau khi sinh.",
        mom: "Cẩn thận dấu hiệu tiền sản giật (phù nề, đau đầu, mờ mắt).",
        advice: "Theo dõi huyết áp thường xuyên.",
        symptoms: ["Đi tiểu liên tục do bé chèn ép bàng quang", "Sa bụng (bé tụt xuống khung chậu)", "Đau khớp xương chậu"],
        toDoList: ["Chuẩn bị giỏ đồ đi sinh", "Chốt bệnh viện sinh và làm hồ sơ sinh", "Khám thai mỗi 1-2 tuần/lần"],
        detail: ["Hệ miễn dịch của bé đang nhận kháng thể từ mẹ."]
    },
    34: {
        size: "Quả dưa lưới", weight: "2.1kg", emoji: "🍈",
        baby: "Tinh hoàn bé trai đã xuống bìu. Hệ thần kinh hoàn thiện.",
        mom: "Mắt có thể bị mờ tạm thời do khô hoặc thay đổi nội tiết.",
        advice: "Nghỉ ngơi tối đa. Không làm việc nặng.",
        symptoms: ["Đi tiểu liên tục do bé chèn ép bàng quang", "Sa bụng (bé tụt xuống khung chậu)", "Đau khớp xương chậu"],
        toDoList: ["Chuẩn bị giỏ đồ đi sinh", "Chốt bệnh viện sinh và làm hồ sơ sinh", "Khám thai mỗi 1-2 tuần/lần"],
        detail: ["Lớp sáp bảo vệ da (gây) dày lên."]
    },
    35: {
        size: "Quả dưa lê", weight: "2.4kg", emoji: "🍈",
        baby: "Thận đã phát triển hoàn toàn. Gan bắt đầu xử lý chất thải.",
        mom: "Khó thở giảm bớt do bé tụt xuống (sa bụng), nhưng đi tiểu nhiều hơn.",
        advice: "Kiểm tra lại giỏ đồ đi sinh. Sạc đầy pin điện thoại.",
        symptoms: ["Đi tiểu liên tục do bé chèn ép bàng quang", "Sa bụng (bé tụt xuống khung chậu)", "Đau khớp xương chậu"],
        toDoList: ["Chuẩn bị giỏ đồ đi sinh", "Chốt bệnh viện sinh và làm hồ sơ sinh", "Khám thai mỗi 1-2 tuần/lần"],
        detail: ["99% bé sinh ra ở tuần này có thể sống khỏe mạnh không cần chăm sóc đặc biệt."]
    },
    36: {
        size: "Quả đu đủ", weight: "2.6kg", emoji: "🥭",
        baby: "Bé rụng lông tơ, nuốt vào bụng tạo thành phân su.",
        mom: "Khám thai mỗi tuần 1 lần từ bây giờ. Chạy máy Monitor.",
        advice: "Lưu số taxi/xe cấp cứu. Dặn dò người thân túc trực.",
        symptoms: ["Đi tiểu liên tục do bé chèn ép bàng quang", "Sa bụng (bé tụt xuống khung chậu)", "Đau khớp xương chậu"],
        toDoList: ["Chuẩn bị giỏ đồ đi sinh", "Chốt bệnh viện sinh và làm hồ sơ sinh", "Khám thai mỗi 1-2 tuần/lần"],
        detail: ["Má bé phúng phính nhờ lớp mỡ tích tụ."]
    },
    // --- VỀ ĐÍCH ---
    37: {
        size: "Bó rau cải", weight: "2.9kg", emoji: "🥬",
        baby: "THAI ĐỦ THÁNG! Bé có thể chào đời an toàn bất cứ lúc nào.",
        mom: "Dịch âm đạo ra nhiều hơn (nút nhầy cổ tử cung có thể bong).",
        advice: "Theo dõi cơn gò, ra nhớt hồng, vỡ ối.",
        symptoms: ["Ra dịch nhầy âm đạo (có thể lẫn máu)", "Cơn gò chuyển dạ thật sự", "Vỡ ối rỉ ối"],
        toDoList: ["Lưu số điện thoại cấp cứu/taxi", "Luôn có người nhà túc trực", "Thư giãn, tập hít thở chờ chuyển dạ"],
        detail: ["Bé đang tập dượt các phản xạ: mút, nắm, xoay người."]
    },
    38: {
        size: "Quả dưa hấu nhỏ", weight: "3.1kg", emoji: "🍉",
        baby: "Các cơ quan đã sẵn sàng hoạt động độc lập ngoài bụng mẹ.",
        mom: "Cảm giác nôn nao, hồi hộp chờ đợi.",
        advice: "Thư giãn, nghe nhạc, đi bộ nhẹ nhàng để dễ sinh.",
        symptoms: ["Ra dịch nhầy âm đạo (có thể lẫn máu)", "Cơn gò chuyển dạ thật sự", "Vỡ ối rỉ ối"],
        toDoList: ["Lưu số điện thoại cấp cứu/taxi", "Luôn có người nhà túc trực", "Thư giãn, tập hít thở chờ chuyển dạ"],
        detail: ["Màu mắt của bé lúc này thường là màu xám hoặc xanh thẫm, sẽ đổi sau khi sinh."]
    },
    39: {
        size: "Quả bí ngô", weight: "3.3kg", emoji: "🎃",
        baby: "Da bé bong tróc lớp da cũ để thay da mới hồng hào.",
        mom: "Cổ tử cung bắt đầu xóa và mở.",
        advice: "Đừng đi đâu xa. Luôn có người bên cạnh.",
        symptoms: ["Ra dịch nhầy âm đạo (có thể lẫn máu)", "Cơn gò chuyển dạ thật sự", "Vỡ ối rỉ ối"],
        toDoList: ["Lưu số điện thoại cấp cứu/taxi", "Luôn có người nhà túc trực", "Thư giãn, tập hít thở chờ chuyển dạ"],
        detail: ["Dây rốn dài khoảng 50-60cm."]
    },
    40: {
        size: "Quả dưa hấu lớn", weight: "3.5kg", emoji: "🍉",
        baby: "Happy Birthday! Bé đã sẵn sàng chào thế giới.",
        mom: "Đau bụng chuyển dạ thật sự: Đau dồn dập, đều đặn.",
        advice: "Hít thở sâu. Tin vào bản thân. Mẹ làm được!",
        symptoms: ["Ra dịch nhầy âm đạo (có thể lẫn máu)", "Cơn gò chuyển dạ thật sự", "Vỡ ối rỉ ối"],
        toDoList: ["Lưu số điện thoại cấp cứu/taxi", "Luôn có người nhà túc trực", "Thư giãn, tập hít thở chờ chuyển dạ"],
        detail: ["Chỉ 5% bé sinh đúng ngày dự sinh. Đừng lo nếu bé chưa chịu ra nhé."]
    },
    41: {
        size: "Quả mít", weight: "3.7kg", emoji: "🍈",
        baby: "Bé hơi 'lì' một chút thôi. Da có thể hơi khô.",
        mom: "Bác sĩ sẽ kiểm tra nước ối và nhịp tim thường xuyên.",
        advice: "Có thể cần kích thích chuyển dạ.",
        symptoms: ["Lo lắng, hồi hộp chờ sinh", "Khó di chuyển", "Bụng căng cứng"],
        toDoList: ["Thường xuyên đo biểu đồ tim thai (Monitor)", "Tuân thủ chỉ định giục sinh hoặc mổ nếu cần", "Chuẩn bị tinh thần gặp bé"],
        detail: ["Quá ngày dự sinh không hiếm gặp."]
    },
    42: {
        size: "Quả bí đao khổng lồ", weight: "4kg", emoji: "🍈",
        baby: "Bé cần ra ngoài ngay!",
        mom: "Bác sĩ sẽ chỉ định mổ hoặc giục sinh để đảm bảo an toàn.",
        advice: "Chuẩn bị đón con yêu thôi!",
        symptoms: ["Lo lắng, hồi hộp chờ sinh", "Khó di chuyển", "Bụng căng cứng"],
        toDoList: ["Thường xuyên đo biểu đồ tim thai (Monitor)", "Tuân thủ chỉ định giục sinh hoặc mổ nếu cần", "Chuẩn bị tinh thần gặp bé"],
        detail: ["Giai đoạn thai già tháng, cần can thiệp y tế."]
    }
};

// Hàm lấy dữ liệu (tìm tuần gần nhất)
export function getDataForWeek(week: number): PregnancyWeekData {
    const roundedWeek = Math.max(1, Math.min(42, Math.round(week)));
    return PREGNANCY_DATA[roundedWeek] || {
        size: "Đang cập nhật", 
        weight: "--", 
        emoji: "👶", 
        baby: "Bé đang phát triển.", 
        mom: "Bé đang lớn dần lên mỗi ngày.",
        advice: "Hãy tiếp tục theo dõi sức khỏe và bổ sung vitamin.",
        symptoms: [],
        toDoList: [],
        detail: []
    };
}
