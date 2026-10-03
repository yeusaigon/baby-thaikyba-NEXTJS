export interface EasyRoutine {
    name: string;
    wakeWindow: string;
    napCount: string;
    nightSleep: string;
    description: string;
}

export interface BabyMilestone {
    month: number;
    title: string;
    headline: string;
    motorGross: string[];
    motorFine: string[];
    sensoryCognitive: string[];
    socialLanguage: string[];
    easyRoutine: EasyRoutine;
    feedingSleep: string;
    playTips: string[];
    redFlags: string[];
}

export const BABY_MILESTONES: Record<number, BabyMilestone> = {
    0: {
        month: 0,
        title: "Giai đoạn Sơ sinh (0 - 1 tháng)",
        headline: "Bé làm quen với thế giới ngoài bụng mẹ & thiết lập nhịp sinh học",
        motorGross: [
            "Các phản xạ tự nhiên: phản xạ giật mình (Moro), phản xạ tìm vú và mút ngón tay.",
            "Cổ còn yếu, đầu gập nhẹ khi bế đứng, cần nâng đỡ cổ tuyệt đối.",
            "Tay chân co giật nhẹ tự nhiên theo tư thế thai nhi."
        ],
        motorFine: [
            "Bàn tay thường nắm chặt thành nắm đấm.",
            "Phản xạ nắm bắt (Palmar grasp): Tự động nắm chặt ngón tay người lớn khi chạm vào lòng bàn tay bé."
        ],
        sensoryCognitive: [
            "Thị giác: Nhìn rõ nhất ở khoảng cách 20 - 30cm (bằng khoảng cách từ bầu ngực mẹ đến mắt mẹ khi bú).",
            "Nhận ra giọng nói và mùi hương sữa của mẹ rất nhạy bén.",
            "Thích nhìn các hình ảnh tương phản cao màu đen - trắng."
        ],
        socialLanguage: [
            "Khóc là công cụ giao tiếp duy nhất để báo hiệu đói, ướt tã, buồn ngủ hoặc cần âu yếm.",
            "Có thể ngừng khóc khi nghe giọng nói quen thuộc hoặc được ôm da kề da."
        ],
        easyRoutine: {
            name: "EASY 3 (Bắt đầu làm quen)",
            wakeWindow: "45 - 60 phút",
            napCount: "4 - 5 giấc ngủ ngày",
            nightSleep: "Thức dậy bú mỗi 2.5 - 3 tiếng",
            description: "Ăn ngay sau khi ngủ dậy, thức chơi nhẹ nhàng và quấn kén ngủ lại. Chưa phân biệt ngày đêm rõ ràng."
        },
        feedingSleep: "Bú mẹ theo nhu cầu (8 - 12 cữ/ngày), tổng thời gian ngủ 16 - 18 tiếng/ngày.",
        playTips: [
            "Thực hiện 'Da kề da' (Kangaroo care) ít nhất 30 - 60 phút mỗi ngày.",
            "Cho bé xem flashcard đen trắng ở cự ly 25cm.",
            "Tập Tummy Time (nằm sấp) trên ngực bố mẹ 1-2 phút mỗi lần sau khi ợ hơi."
        ],
        redFlags: [
            "Không có phản xạ bú hoặc mút yếu, ngủ li bì không thức dậy đòi bú.",
            "Toàn thân mềm nhũn hoặc cơ cứng đờ liên tục.",
            "Vàng da đậm lan xuống ngực, bụng hoặc mắt lờ đờ."
        ]
    },
    1: {
        month: 1,
        title: "Tháng thứ 1: Tương tác đầu đời",
        headline: "Bé bắt đầu nhận thức xung quanh và ngẩng đầu khi nằm sấp",
        motorGross: [
            "Khi nằm sấp có thể ngẩng đầu lên góc 45 độ trong vài giây.",
            "Chuyển động của tay chân bớt giật cục, bắt đầu vung tay nhẹ nhàng hơn."
        ],
        motorFine: [
            "Bàn tay bắt đầu mở hé lỏng lẻo hơn thay vì luôn siết chặt.",
            "Đưa tay về phía miệng hoặc mút ngón tay để tự xoa dịu."
        ],
        sensoryCognitive: [
            "Dõi mắt theo đồ vật di chuyển chậm trong phạm vi tầm nhìn ngắn.",
            "Nhận biết được ánh sáng và bóng tối rõ rệt hơn."
        ],
        socialLanguage: [
            "Xuất hiện những 'nụ cười phản xạ' khi ngủ hoặc khi no bụng.",
            "Bắt đầu phát ra âm thanh 'gừ gừ', 'ê' nhẹ trong cổ họng khi khoan khoái."
        ],
        easyRoutine: {
            name: "EASY 3",
            wakeWindow: "60 - 75 phút",
            napCount: "4 giấc ngày",
            nightSleep: "Ngủ giấc dài đầu tiên 3 - 4 tiếng",
            description: "Phân biệt ngày đêm: Ban ngày giữ phòng sáng và có âm thanh sinh hoạt; Ban đêm giữ phòng tối, yên tĩnh, cho bú nhanh và đặt ngủ lại."
        },
        feedingSleep: "Bú khoảng 60 - 90ml mỗi cữ (nếu bú bình) hoặc mỗi 2.5 - 3h (bú mẹ). Ngủ 15 - 17 tiếng/ngày.",
        playTips: [
            "Tập Tummy time trên thảm 3 - 5 phút/ngày.",
            "Trò chuyện mặt đối mặt với bé, bắt chước các biểu cảm của bé.",
            "Mở nhạc thai giáo hoặc hát ru êm dịu."
        ],
        redFlags: [
            "Không phản ứng với tiếng động mạnh bất ngờ (không giật mình).",
            "Mắt không dõi theo khuôn mặt mẹ ở cự ly gần.",
            "Không thể ngẩng đầu dù chỉ một chút khi nằm sấp."
        ]
    },
    2: {
        month: 2,
        title: "Tháng thứ 2: Nụ cười xã hội",
        headline: "Bé biết cười đáp lại và bắt đầu hóng chuyện ríu rít",
        motorGross: [
            "Giữ đầu vững hơn khi được bế dựng đứng.",
            "Nằm sấp có thể nâng đầu và ngực lên bằng cánh tay trong thời gian lâu hơn."
        ],
        motorFine: [
            "Bàn tay mở phần lớn thời gian, biết chụm hai tay lại gần nhau.",
            "Cố gắng với tay chạm vào xúc xắc hoặc đồ chơi treo nôi."
        ],
        sensoryCognitive: [
            "Phân biệt được màu sắc cơ bản (đỏ, vàng, cam).",
            "Mắt theo dõi đồ vật di chuyển 180 độ từ trái sang phải."
        ],
        socialLanguage: [
            "Nụ cười xã hội (Social Smile): Mỉm cười có ý thức khi nhìn thấy bố mẹ hoặc nghe giọng nói thân thuộc.",
            "Phát ra các nguyên âm 'o', 'a', 'ê' và biết ngừng lại đợi mẹ trả lời."
        ],
        easyRoutine: {
            name: "EASY 3 hoặc EASY 3.5",
            wakeWindow: "75 - 90 phút",
            napCount: "3 giấc dài + 1 giấc ngắn chiều",
            nightSleep: "Bắt đầu có giấc ngủ đêm liền 4 - 5 tiếng",
            description: "Chu kỳ 3 - 3.5 tiếng: Ăn (E) - Hoạt động (A) - Ngủ (S) - Thời gian cho mẹ (Y)."
        },
        feedingSleep: "Bú 90 - 120ml/cữ, bú 6 - 8 cữ/ngày. Tổng thời gian ngủ 14 - 16 tiếng/ngày.",
        playTips: [
            "Nói chuyện đối thoại với bé: 'Bé của mẹ hôm nay vui thế?', đợi bé 'ê a' rồi đáp lời.",
            "Treo đồ chơi chuyển động màu sắc cách mặt bé 30cm.",
            "Massage toàn thân cho bé sau khi tắm giúp thư giãn cơ thể."
        ],
        redFlags: [
            "Chưa biết mỉm cười đáp lại khuôn mặt mẹ.",
            "Không dõi theo vật chuyển động trước mặt.",
            "Bàn tay luôn nắm chặt ngón cái bên trong không xòe ra."
        ]
    },
    3: {
        month: 3,
        title: "Tháng thứ 3: Khám phá đôi bàn tay",
        headline: "Cổ bé cứng cáp, bắt đầu lẫy và ngắm nhìn đôi tay say mê",
        motorGross: [
            "Nằm sấp chống cùi chỏ nâng cao đầu 90 độ vững vàng.",
            "Bắt đầu lật nghiêng người, một số bé bắt đầu lật sấp thành công.",
            "Chân đạp mạnh mẽ, thích thú khi được đỡ đứng trên đùi mẹ."
        ],
        motorFine: [
            "Đưa cả hai bàn tay vào miệng gặm khám phá.",
            "Cầm nắm lục lạc trong vài giây và lắc nhẹ."
        ],
        sensoryCognitive: [
            "Nhìn nhận thế giới đa chiều, nhận ra người quen từ xa 1-2 mét.",
            "Xoay đầu dứt khoát về hướng có phát ra âm thanh."
        ],
        socialLanguage: [
            "Cười thành tiếng khanh khách (chuckle/giggle).",
            "Tập 'thổi bong bóng nước bọt' và phát âm ríu rít liên tục."
        ],
        easyRoutine: {
            name: "EASY 3.5 hoặc EASY 4",
            wakeWindow: "90 - 105 phút",
            napCount: "3 giấc ngày (2 giấc 1.5 - 2h + 1 giấc ngắn 45p)",
            nightSleep: "Giấc đêm dài 6 - 8 tiếng không cần bú",
            description: "Bé thức lâu hơn, tập trung chơi tương tác vận động nhiều hơn trước khi vào giấc ngủ."
        },
        feedingSleep: "Bú 120 - 150ml/cữ, 5 - 6 cữ/ngày. Ngủ 14 - 15 tiếng/ngày.",
        playTips: [
            "Cho bé cầm các loại lục lạc có âm thanh xúc xắc vui tai.",
            "Đặt gương an toàn trước mặt bé khi nằm sấp để bé ngắm mình.",
            "Tập lật nhẹ nhàng bằng cách kéo nhẹ chân hoặc đồ chơi thu hút."
        ],
        redFlags: [
            "Đầu vẫn ngửa ra sau hoặc rũ xuống khi bế đứng.",
            "Không với tay nắm đồ vật hoặc không biết đưa tay vào miệng.",
            "Mắt lé hoặc không tập trung nhìn vào vật thể chuyển động."
        ]
    },
    4: {
        month: 4,
        title: "Tháng thứ 4: Bước ngoặt 4 tháng",
        headline: "Wonder Week 19 - Khủng hoảng giấc ngủ 4 tháng & bắt đầu với đồ chơi",
        motorGross: [
            "Lật ngửa thành lật sấp thành thạo và thích thú nằm sấp quan sát.",
            "Khi nằm ngửa, biết nhấc cao hai chân và cầm lấy bàn chân mình."
        ],
        motorFine: [
            "Dùng cả hai bàn tay chụp lấy đồ chơi chính xác.",
            "Chuyển đồ chơi từ tay này sang tay kia trong giây lát."
        ],
        sensoryCognitive: [
            "Nhận ra bình sữa hoặc bầu ngực mẹ và tỏ vẻ háo hức đòi ăn.",
            "Hiểu nguyên nhân - kết quả đơn giản: Lắc lục lạc thì phát ra tiếng kêu."
        ],
        socialLanguage: [
            "Cười to sảng khoái khi được cù léc hoặc chơi trò 'ú òa' đơn giản.",
            "Bắt đầu thể hiện sự cáu kỉnh hoặc phản đối khi bị lấy mất đồ chơi."
        ],
        easyRoutine: {
            name: "EASY 4",
            wakeWindow: "105 - 120 phút (1.5 - 2 giờ)",
            napCount: "3 giấc ngày",
            nightSleep: "Dễ thức giấc ban đêm do cấu trúc giấc ngủ chuyển sang chu kỳ người lớn (Sleep Regression)",
            description: "Duy trì trình tự ngủ nhất quán (tắm, massage, đọc truyện, ti giả/tiếng ồn trắng) để giúp bé vượt qua khủng hoảng ngủ."
        },
        feedingSleep: "Bú 120 - 180ml/cữ, 5 cữ/ngày. Tổng ngủ 14 - 15 tiếng/ngày.",
        playTips: [
            "Chơi trò 'Ú òa' với khăn voan mỏng.",
            "Cho bé cắn gặm nướu an toàn làm mát vì bé chuẩn bị sưng nướu mọc răng.",
            "Đọc sách vải sột soạt có nhiều chất liệu khác nhau."
        ],
        redFlags: [
            "Không quay đầu tìm nguồn âm thanh quen thuộc.",
            "Chưa biết lật hoặc không thể chống tay nâng ngực khi nằm sấp.",
            "Không cười hoặc không giao tiếp bằng ánh mắt."
        ]
    },
    5: {
        month: 5,
        title: "Tháng thứ 5: Khám phá vị giác & cơ thể",
        headline: "Bé thích nhấc chân ngậm ngón chân và sẵn sàng cho giai đoạn ăn dặm",
        motorGross: [
            "Lật qua lại sấp - ngửa rất nhanh nhẹn.",
            "Bắt đầu có phản xạ trườn hoặc xoay tròn 360 độ trên bụng.",
            "Có thể ngồi với sự hỗ trợ của gối hoặc ngồi dựa lưng vào lòng mẹ."
        ],
        motorFine: [
            "Nắm chặt đồ vật trong lòng bàn tay chắc chắn hơn.",
            "Bắt đầu biết dùng ngón tay cào bốc đồ vật nhỏ."
        ],
        sensoryCognitive: [
            "Nhìn thấy các vật nhỏ cách xa vài mét.",
            "Thích nhìn hình ảnh phản chiếu trong gương và mỉm cười với 'bạn nhỏ' trong gương."
        ],
        socialLanguage: [
            "Phát ra các phụ âm kép: 'ba-ba', 'ma-ma', 'da-da' nhưng chưa gán nghĩa cụ thể.",
            "Nhận biết được giọng điệu vui vẻ hay giận dữ của bố mẹ."
        ],
        easyRoutine: {
            name: "EASY 4",
            wakeWindow: "2 - 2.25 giờ",
            napCount: "3 giấc ngày (giấc 1: 1.5h, giấc 2: 1.5h, giấc 3: 30-45p)",
            nightSleep: "Ngủ đêm 10 - 11 tiếng",
            description: "Lịch sinh hoạt ổn định, bé thức chơi tỉnh táo hơn và khám phá môi trường xung quanh."
        },
        feedingSleep: "Bú 150 - 200ml/cữ, 4 - 5 cữ/ngày. Mẹ bắt đầu tìm hiểu phương pháp ăn dặm (BLW, truyền thống, kiểu Nhật).",
        playTips: [
            "Cho bé ngồi tựa lưng có nâng đỡ để kích thích cơ thắt lưng.",
            "Cho bé cầm nắm đồ chơi nhiều hình dạng và bề mặt gồ ghề khác nhau.",
            "Hát bài hát kèm vỗ tay và làm động tác theo nhạc."
        ],
        redFlags: [
            "Không với đồ chơi khi đưa ra trước mặt.",
            "Không thể giữ đầu ổn định khi ngồi dựa.",
            "Không tạo ra bất kỳ âm thanh ê a nào."
        ]
    },
    6: {
        month: 6,
        title: "Tháng thứ 6: Mốc ăn dặm & Ngồi chững",
        headline: "Cột mốc tròn nửa năm! Bắt đầu thế giới ẩm thực mới và ngồi vững",
        motorGross: [
            "Ngồi vững khi có điểm tựa hoặc tự ngồi chống hai tay về phía trước (Tripod sit).",
            "Biết chống hai bàn tay và đầu gối nhấp nhổm chuẩn bị bò.",
            "Khi được bế đứng, nhún nhảy hai chân liên tục."
        ],
        motorFine: [
            "Chuyển đồ vật giữa hai tay rất mượt mà.",
            "Bắt đầu dùng các ngón tay để nhặt mẩu thức ăn mềm (Pincer grasp sơ khai)."
        ],
        sensoryCognitive: [
            "Nhận biết tên của chính mình: quay đầu lại ngay khi mẹ gọi tên.",
            "Hiểu khái niệm 'sự tồn tại của đồ vật' (Object Permanence): Biết đồ chơi giấu dưới khăn vẫn còn đó."
        ],
        socialLanguage: [
            "Phân biệt rõ ràng người lạ và người quen, có thể sợ người lạ (Stranger Anxiety).",
            "Giao tiếp bằng cử chỉ: dang hai tay đòi bế."
        ],
        easyRoutine: {
            name: "EASY 2-3-4 (Bắt đầu cắt giấc ngủ ngày thứ 3)",
            wakeWindow: "2 - 2.5 giờ sáng, 3 giờ chiều",
            napCount: "2 giấc ngày dài",
            nightSleep: "Ngủ đêm 11 tiếng",
            description: "Chuyển dần sang lịch 2 giấc ngày khi bé bỏ giấc ngắn buổi chiều muộn."
        },
        feedingSleep: "ĂN DẶM CHÍNH THỨC: Bắt đầu 1 bữa ăn dặm/ngày (cháo rây, củ quả hấp mềm, bột ăn dặm). Sữa vẫn là nguồn dinh dưỡng chính (tối thiểu 700 - 800ml/ngày).",
        playTips: [
            "Cho bé ngồi vào ghế ăn dặm (High Chair) để tập thói quen ăn uống khoa học.",
            "Chơi trò giấu đồ chơi dưới cốc hoặc khăn để bé tự lật tìm.",
            "Bắt đầu đọc truyện tranh khổ lớn có tranh vẽ sinh động."
        ],
        redFlags: [
            "Không thể ngồi dù có hỗ trợ.",
            "Không phản ứng khi được gọi tên.",
            "Không thể đưa đồ ăn hoặc đồ vật vào miệng."
        ]
    },
    7: {
        month: 7,
        title: "Tháng thứ 7: Bò & Mọc răng",
        headline: "Bé trườn khắp nhà, chiếc răng đầu tiên nhú lên",
        motorGross: [
            "Trườn bụng nhanh như tên bắn hoặc bắt đầu bò 4 chi (bò bằng đầu gối và hai tay).",
            "Tự chuyển tư thế từ nằm sấp sang ngồi một cách độc lập."
        ],
        motorFine: [
            "Gõ hai món đồ chơi vào nhau tạo âm thanh.",
            "Cầm nắm thức ăn dạng thanh dài (Finger food) và tự cắn gặm."
        ],
        sensoryCognitive: [
            "Thích khám phá không gian: chui gầm bàn, tìm ngóc ngách.",
            "Tìm kiếm món đồ chơi bị rơi xuống đất."
        ],
        socialLanguage: [
            "Bắt chước âm thanh người lớn tạo ra: tặc lưỡi, thổi phù phù.",
            "Bày tỏ cảm xúc vui, giận, phấn khích rõ ràng bằng nét mặt và âm thanh."
        ],
        easyRoutine: {
            name: "EASY 2-3-4",
            wakeWindow: "2.5 - 3 giờ",
            napCount: "2 giấc (sáng 1.5h, chiều 1.5h)",
            nightSleep: "Ngủ đêm 11 tiếng",
            description: "Lịch sinh hoạt cực kỳ chuẩn mực, bé cần được dặm thêm năng lượng từ bữa ăn dặm bổ sung."
        },
        feedingSleep: "Ăn dặm 1 - 2 bữa/ngày. Sữa 700ml/ngày. Chú ý bổ sung sắt từ thịt bò, lòng đỏ trứng, rau lá xanh.",
        playTips: [
            "Tạo chướng ngại vật bằng gối mỏng trên sàn để bé bò vượt qua.",
            "Dùng bóng lăn trên sàn để bé bò đuổi theo.",
            "Bảo đảm an toàn nhà cửa: bọc góc bàn nhọn, bịt ổ cắm điện vì bé bắt đầu di chuyển khắp nơi."
        ],
        redFlags: [
            "Cơ bắp quá cứng hoặc quá mềm yếu, chân không chịu lực khi đặt đứng.",
            "Không chịu tự với hoặc với đồ vật bằng cả hai tay.",
            "Không biểu lộ tình cảm gắn bó với người chăm sóc chính."
        ]
    },
    8: {
        month: 8,
        title: "Tháng thứ 8: Đứng vịn & Bốc nhón",
        headline: "Bé vịn thành giường đứng lên và dùng ngón tay nhặt đồ cực khéo",
        motorGross: [
            "Tự bám vào thành cũi, bàn ghế để đứng lên (Pull-to-stand).",
            "Ngồi vững như kiềng ba chân mà không cần bất kỳ sự hỗ trợ nào."
        ],
        motorFine: [
            "Kỹ năng bốc nhón tinh xảo (Pincer Grasp): Nhặt các hạt đậu hoặc mẩu thức ăn nhỏ bằng ngón cái và ngón trỏ.",
            "Biết vẫy tay chào (bye bye) hoặc vỗ tay hoan hô."
        ],
        sensoryCognitive: [
            "Hiểu từ 'Không' khi người lớn nói với giọng nghiêm nghị.",
            "Nhận biết được mục đích của các đồ vật: Lược để chải đầu, cốc để uống nước."
        ],
        socialLanguage: [
            "Hội chứng lo âu xa cách (Separation Anxiety): Khóc thét khi mẹ rời khỏi phòng.",
            "Nói các chuỗi âm thanh dài như đang kể chuyện: 'ba-ba-da-da-ma'."
        ],
        easyRoutine: {
            name: "EASY 2-3-4",
            wakeWindow: "3 - 3.5 giờ",
            napCount: "2 giấc ngày",
            nightSleep: "Ngủ đêm 10.5 - 11.5 tiếng",
            description: "Bé có thể đứng dậy trong cũi khi đến giờ ngủ, mẹ cần kiên nhẫn hướng dẫn bé ngồi xuống ngủ."
        },
        feedingSleep: "Ăn dặm 2 bữa chính/ngày. Thức ăn có độ thô tăng dần (cháo hạt vỡ, thức ăn băm nhỏ mềm). Sữa 600 - 700ml/ngày.",
        playTips: [
            "Chơi trò vỗ tay theo bài hát 'Hoan hô bé giỏi'.",
            "Cho bé nhặt các mẩu bánh xốp ăn dặm tự tan để luyện ngón tay.",
            "Chơi trò 'Tạm biệt - Vẫy tay' mỗi khi có người đi làm."
        ],
        redFlags: [
            "Không thể ngồi vững khi đặt ngồi.",
            "Không biết chống chân chịu lực khi được đỡ đứng.",
            "Không bập bẹ các phụ âm như ba, ma, da."
        ]
    },
    9: {
        month: 9,
        title: "Tháng thứ 9: Đi men & Giao tiếp có chủ đích",
        headline: "Bé bước những bước đi men đầu tiên men theo mép tường, sofa",
        motorGross: [
            "Đi men theo bàn ghế hoặc thành tường (Cruising).",
            "Tự hạ người từ tư thế đứng xuống ngồi một cách an toàn mà không bị ngã dập mông."
        ],
        motorFine: [
            "Dùng ngón trỏ chỉ vào đồ vật bé muốn lấy.",
            "Biết thả đồ vật vào hộp và lấy ra ngoài."
        ],
        sensoryCognitive: [
            "Tìm kiếm đồ vật bị giấu kín hoàn toàn một cách dễ dàng.",
            "Thích ném đồ chơi xuống đất để quan sát quỹ đạo rơi."
        ],
        socialLanguage: [
            "Hiểu các khẩu lệnh đơn giản kèm cử chỉ: 'Đưa cho mẹ nào', 'Lại đây với ba'.",
            "Bắt chước các âm thanh đơn giản như 'ti-ti', 'măm-măm'."
        ],
        easyRoutine: {
            name: "EASY 2-3-4 (Ổn định)",
            wakeWindow: "3 - 3.5 giờ",
            napCount: "2 giấc (sáng 1.5h, chiều 1h)",
            nightSleep: "Ngủ đêm 11 tiếng trọn vẹn",
            description: "Ban ngày bé tiêu hao cực nhiều năng lượng do bò và đi men liên tục."
        },
        feedingSleep: "Ăn dặm 2 - 3 bữa/ngày. Sữa khoảng 600ml. Khuyến khích bé tự bốc ăn và tập cầm thìa.",
        playTips: [
            "Cho bé chơi thả khối hình tròn/vuông vào hộp.",
            "Đọc sách tranh tương tác lật mở (Lift-the-flap books).",
            "Tạo đường ray an toàn từ ghế sofa đến bàn trà để bé tập đi men."
        ],
        redFlags: [
            "Không bò hoặc không có bất kỳ hình thức di chuyển nào (lết mông, trườn).",
            "Không biết dùng ngón tay chỉ trỏ.",
            "Không nhận biết tên mình khi được gọi."
        ]
    },
    10: {
        month: 10,
        title: "Tháng thứ 10: Đứng chững & Hiểu ngôn ngữ",
        headline: "Bé có thể buông hai tay đứng chững vài giây và hiểu rất nhiều từ",
        motorGross: [
            "Đứng buông tay trong 3 - 5 giây mà không cần bám vịn.",
            "Leo trèo lên bậc cầu thang thấp hoặc ghế thấp dưới sự giám sát."
        ],
        motorFine: [
            "Cầm cốc có quai bằng hai tay để uống nước.",
            "Xếp chồng 2 khối gỗ lên nhau."
        ],
        sensoryCognitive: [
            "Nhận biết các bộ phận cơ thể đơn giản: 'Mũi bé đâu?', 'Mắt mẹ đâu?'.",
            "Hiểu ý nghĩa của hình ảnh trong sách và chỉ đúng hình con chó, con mèo."
        ],
        socialLanguage: [
            "Nói được từ đơn đầu tiên có nghĩa rõ ràng: 'Ba', 'Mẹ' hoặc 'Măm'.",
            "Biết gật đầu đồng ý hoặc lắc đầu từ chối."
        ],
        easyRoutine: {
            name: "EASY 2-3-4",
            wakeWindow: "3.5 - 4 giờ",
            napCount: "2 giấc ngày",
            nightSleep: "Ngủ đêm 11 tiếng",
            description: "Giấc ngủ trưa có thể rút ngắn còn 1 tiếng nếu bé tràn đầy năng lượng."
        },
        feedingSleep: "Ăn 3 bữa chính + 1-2 bữa phụ (trái cây, sữa chua). Sữa 500 - 600ml/ngày. Thức ăn hạt cơm nát, rau củ thái hạt lựu mềm.",
        playTips: [
            "Dạy bé chỉ các bộ phận cơ thể: mắt, mũi, miệng, tai.",
            "Cho bé xe tập đi gỗ có bánh răng khóa tốc độ (không dùng xe tròn tập đi).",
            "Khuyến khích bé tập tự xúc thìa dù có rơi vãi."
        ],
        redFlags: [
            "Không đứng được dù có người đỡ.",
            "Không biết vẫy tay chào hoặc không bắt chước các cử chỉ đơn giản.",
            "Không có hứng thú tương tác với người thân."
        ]
    },
    11: {
        month: 11,
        title: "Tháng thứ 11: Những bước đi chập chững",
        headline: "Bé tự tin đứng vững và chập chững những bước đi đầu tiên",
        motorGross: [
            "Bước được 1 - 2 bước độc lập về phía vòng tay bố mẹ.",
            "Ngồi xổm nhặt đồ chơi rồi đứng thẳng dậy mà không cần bám víu."
        ],
        motorFine: [
            "Lật từng trang sách bìa cứng (Board books).",
            "Tháo nắp hộp hoặc cắm que vào lỗ."
        ],
        sensoryCognitive: [
            "Bắt chước hành động người lớn: cầm điện thoại áp vào tai, lấy khăn lau bàn.",
            "Biết thử nghiệm: Thử xoay chìa khóa hoặc bấm công tắc đồ chơi."
        ],
        socialLanguage: [
            "Nói được 2 - 3 từ đơn rõ ràng.",
            "Biết thể hiện tình cảm: ôm cổ mẹ, thơm má bố khi được yêu cầu."
        ],
        easyRoutine: {
            name: "EASY 3-4 (Chuẩn bị bỏ bớt giấc sáng)",
            wakeWindow: "3.5 - 4 giờ",
            napCount: "2 giấc (giấc sáng có xu hướng ngắn lại còn 45p)",
            nightSleep: "Ngủ đêm 11 tiếng",
            description: "Nếu bé khó ngủ giấc sáng, mẹ có thể lùi giờ ngủ trưa xuống và gom thành 1 giấc dài."
        },
        feedingSleep: "3 bữa ăn chính cùng giờ với gia đình. Sữa khoảng 500ml. Ăn được hầu hết các loại thực phẩm mềm.",
        playTips: [
            "Chơi trò gọi điện thoại giả vờ 'A lô!'.",
            "Xếp tháp vòng tròn theo thứ tự từ lớn đến bé.",
            "Dắt tay bé đi dạo trong công viên hoặc sân cỏ an toàn."
        ],
        redFlags: [
            "Không thể bò hoặc không thể đứng vịn.",
            "Không học được cách dùng cử chỉ như lắc đầu, gật đầu, vẫy tay.",
            "Mất đi các kỹ năng đã từng làm được trước đây."
        ]
    },
    12: {
        month: 12,
        title: "Tròn 1 tuổi: Bước vào thế giới Toddler",
        headline: "Mừng sinh nhật 1 tuổi! Bé tự đi vững vàng và trở thành một em bé độc lập",
        motorGross: [
            "Đi bộ độc lập vững vàng, có thể vừa đi vừa ôm gấu bông.",
            "Biết cúi xuống nhặt đồ mà không bị té ngã."
        ],
        motorFine: [
            "Cầm bút sáp màu nguệch ngoạc trên giấy.",
            "Cầm thìa đưa thức ăn vào miệng thành thục hơn."
        ],
        sensoryCognitive: [
            "Biết phân loại đồ vật theo màu sắc hoặc kích cỡ cơ bản.",
            "Thực hiện được chỉ dẫn gồm 2 bước: 'Nhặt quả bóng và đưa cho mẹ'."
        ],
        socialLanguage: [
            "Nói được 3 - 5 từ có nghĩa: 'Bố', 'Mẹ', 'Nước', 'Bế', 'Mèo'.",
            "Tỏ thái độ quả quyết: biết nói 'Không' kèm lắc đầu dứt khoát."
        ],
        easyRoutine: {
            name: "Lịch 1 giấc ngủ trưa (Nap Transition)",
            wakeWindow: "4 - 5 giờ",
            napCount: "1 giấc trưa dài (1.5 - 2.5 tiếng)",
            nightSleep: "Ngủ đêm 11 - 12 tiếng liên tục",
            description: "Phần lớn trẻ tròn 1 tuổi chuyển dần sang chế độ 1 giấc ngủ trưa duy nhất sau bữa trưa."
        },
        feedingSleep: "CHUYỂN GIAO: Bé có thể bắt đầu dùng sữa tươi tiệt trùng nguyên kem (sau 1 tuổi). Ăn 3 bữa cơm nát/cháo đặc cùng gia đình + 2 bữa phụ. Sữa 400 - 500ml/ngày.",
        playTips: [
            "Tặng bé xe đẩy tập đi hoặc đồ chơi kéo đẩy phát ra tiếng kêu.",
            "Tập cho bé tự cởi tất (vớ), cởi mũ để rèn tính tự lập.",
            "Cho bé vẽ màu nước an toàn bằng ngón tay (Finger painting)."
        ],
        redFlags: [
            "Chưa biết đứng vịn hoặc không thể đứng chịu lực trên hai chân.",
            "Không nói được bất kỳ từ đơn có nghĩa nào.",
            "Không biết chỉ tay vào đồ vật hoặc không giao tiếp bằng ánh mắt."
        ]
    },
    18: {
        month: 18,
        title: "18 tháng tuổi: Khám phá & Bùng nổ ngôn ngữ",
        headline: "Bé chạy lon ton, nói câu ghép 2 từ và thể hiện cá tính mạnh mẽ",
        motorGross: [
            "Chạy vững vàng, leo cầu thang từng bước có vịn tay vịn.",
            "Biết đá bóng về phía trước mà không bị ngã."
        ],
        motorFine: [
            "Xếp chồng được 4 - 6 khối hình hộp.",
            "Tự cởi áo khoác hoặc giày dép đơn giản."
        ],
        sensoryCognitive: [
            "Biết giả vờ chơi: Cho búp bê ăn, ru thú bông ngủ.",
            "Nhận biết được bản thân trong gương là chính mình chứ không phải bạn nhỏ khác."
        ],
        socialLanguage: [
            "Vốn từ đạt 20 - 50 từ, bắt đầu ghép 2 từ: 'Mẹ bế', 'Đi chơi', 'Uống sữa'.",
            "Thời kỳ 'Khủng hoảng tuổi lên 2 sơ khai' (Terrible Twos): Thường xuyên ăn vạ hoặc nói 'Không'."
        ],
        easyRoutine: {
            name: "Lịch 1 giấc trưa",
            wakeWindow: "5 - 6 giờ",
            napCount: "1 giấc trưa (12h30 - 14h30)",
            nightSleep: "Ngủ đêm 11 tiếng (20h00 - 07h00)",
            description: "Lịch sinh hoạt giống hệt trẻ mầm non, tạo tiền đề tốt để bé chuẩn bị đi nhà trẻ."
        },
        feedingSleep: "Ăn cơm mềm cùng cả nhà. Tự xúc ăn thành thạo. Sữa tươi hoặc sữa công thức 400ml/ngày.",
        playTips: [
            "Chơi trò đóng vai giả vờ (bác sĩ, nấu ăn, bán hàng).",
            "Đọc sách tương tác, chỉ vào tranh và hỏi 'Con gì đây con?'.",
            "Cho bé ra ngoài công viên chạy nhảy, leo trèo xả năng lượng hàng ngày."
        ],
        redFlags: [
            "Chưa biết đi độc lập.",
            "Nói dưới 6 từ đơn, không biết bắt chước từ mới.",
            "Không chỉ tay để chia sẻ sự chú ý với bố mẹ (ví dụ: thấy máy bay trên trời không chỉ cho mẹ xem)."
        ]
    },
    24: {
        month: 24,
        title: "24 tháng tuổi (Tròn 2 tuổi): Em bé tí hon trở thành bạn nhỏ",
        headline: "Bé nói câu hoàn chỉnh, nhảy hai chân và tự lập trong sinh hoạt",
        motorGross: [
            "Biết nhảy bật hai chân rời khỏi mặt đất.",
            "Đi kiễng gót chân, đi lùi và bước lên xuống cầu thang vững chắc."
        ],
        motorFine: [
            "Vẽ đường thẳng dọc, vòng tròn trên giấy.",
            "Tự rửa tay và lau khô tay, biết tự cầm cốc uống nước không đổ."
        ],
        sensoryCognitive: [
            "Phân loại hình khối và màu sắc chính xác (đỏ, xanh, vàng).",
            "Hoàn thành các bức tranh ghép hình 3 - 4 mảnh đơn giản."
        ],
        socialLanguage: [
            "Vốn từ 100 - 200 từ, nói câu 3 - 4 từ hoàn chỉnh: 'Con muốn ăn chuối', 'Ba đi làm rồi'.",
            "Bắt đầu chơi cùng bạn bè (chơi song song - Parallel Play)."
        ],
        easyRoutine: {
            name: "Lịch sinh hoạt trẻ mầm non",
            wakeWindow: "5 - 6 giờ",
            napCount: "1 giấc trưa 1.5 - 2 giờ",
            nightSleep: "Ngủ đêm 10.5 - 11.5 tiếng",
            description: "Bắt đầu tập bỏ bỉm ban ngày (Potty Training) nếu bé đã có dấu hiệu sẵn sàng."
        },
        feedingSleep: "Ăn cơm hạt như người lớn, ăn đa dạng thực phẩm. Uống sữa 300 - 400ml/ngày.",
        playTips: [
            "Chơi xếp hình Lego hạt lớn (Duplo), nặn đất nặn an toàn.",
            "Dạy bé tự dọn dẹp đồ chơi vào giỏ sau khi chơi xong.",
            "Kể chuyện cổ tích trước khi đi ngủ và cùng thảo luận nội dung."
        ],
        redFlags: [
            "Không nói được câu 2 từ có nghĩa.",
            "Không biết bắt chước hành động hoặc từ ngữ của người lớn.",
            "Không thể chạy nhảy hoặc đi không vững, hay té ngã bất thường."
        ]
    }
};

export const getMilestoneForAge = (ageMonths: number): BabyMilestone => {
    if (ageMonths <= 0) return BABY_MILESTONES[0];
    if (ageMonths >= 24) return BABY_MILESTONES[24];
    if (ageMonths >= 18) return BABY_MILESTONES[18];
    if (ageMonths >= 12) return BABY_MILESTONES[12];
    
    // Exact month matching 0..12
    const m = Math.floor(ageMonths);
    if (BABY_MILESTONES[m]) return BABY_MILESTONES[m];
    
    // Fallback to nearest lower month
    const keys = Object.keys(BABY_MILESTONES).map(Number).sort((a, b) => a - b);
    let matched = keys[0];
    for (const k of keys) {
        if (k <= ageMonths) matched = k;
        else break;
    }
    return BABY_MILESTONES[matched] || BABY_MILESTONES[0];
};

export const computeBabyAgeDetails = (dobStr: string) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const now = new Date();
    
    if (isNaN(dob.getTime())) return null;

    let totalDays = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays < 0) totalDays = 0;

    const totalWeeks = Math.floor(totalDays / 7);

    // Calculate months and remaining days
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    let pastDobDayThisMonth = new Date(now.getFullYear(), now.getMonth(), dob.getDate());
    
    let days = 0;
    if (now >= pastDobDayThisMonth) {
        days = Math.floor((now.getTime() - pastDobDayThisMonth.getTime()) / (1000 * 60 * 60 * 24));
    } else {
        months -= 1;
        let prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, dob.getDate());
        days = Math.floor((now.getTime() - prevMonthDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (months < 0) months = 0;
    if (days < 0) days = 0;

    let ageDisplay = '';
    if (months === 0) {
        ageDisplay = `${totalDays} ngày tuổi (${totalWeeks} tuần)`;
    } else {
        ageDisplay = `${months} tháng ${days} ngày tuổi (${totalWeeks} tuần)`;
    }

    return {
        totalDays,
        totalWeeks,
        months,
        days,
        ageDisplay
    };
};
