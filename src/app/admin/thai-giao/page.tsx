'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    IoSparklesOutline, IoHeadsetOutline, IoHeartOutline, IoSunnyOutline, 
    IoGlobeOutline, IoBookOutline, IoCloseOutline
} from 'react-icons/io5';



const STORIES = [
    {
        id: 1,
        title: "Sự tích dưa hấu (Lòng tự lập)",
        summary: "Câu chuyện về Mai An Tiêm tự lực cánh sinh ở đảo hoang.",
        content: `Ngày xưa, đời Hùng Vương thứ mười yến, có một người con nuôi tên là Mai An Tiêm. An Tiêm là người thông minh, tháo vát lại rất chăm chỉ nên được nhà vua vô cùng yêu mến, thường ban cho nhiều của ngon vật lạ. 

Tuy nhiên, An Tiêm là người tự trọng, thường nói rằng: "Của biếu là của lo, của cho là của nợ, chỉ có bàn tay mình làm ra mới bền vững". Lũ gian thần ghen ghét đem lời này tâu lên vua, nhà vua nổi giận đày An Tiêm cùng gia đình ra một hòn đảo hoang ngoài biển khơi.

Ở đảo hoang, không nản chí, An Tiêm cùng vợ con dựng lều, đào giếng nước, tìm cách trồng trọt. Một ngày nọ, An Tiêm thấy một đàn chim từ phương Tây bay đến ăn quả gì hạt đen lá xanh trên bãi cát. An Tiêm nghĩ thầm: "Chim ăn được thì người cũng ăn được". Ông thu thập hạt và trồng thử.

Nhờ chăm bón kỹ lưỡng, cây phát triển xanh tốt, ra những quả to màu xanh thẫm. Khi bổ ra, ruột quả đỏ tươi, hạt đen nháy, ăn vào thấy vị ngọt thanh mát, thơm lành. An Tiêm đặt tên cho loại quả này là dưa hấu. Ông khắc tên mình lên quả rồi thả trôi sông, trôi biển. Những chiếc thuyền buôn vớt được dưa hấu ngon liền tìm ra đảo hoang để trao đổi thực phẩm, gạo muối với gia đình ông.

Tin đồn về loại quả quý truyền đến tai Hùng Vương, vua nhận ra mình đã sai, liền cho thuyền ra đón gia đình Mai An Tiêm trở về đất liền, khôi phục lại danh dự và chức tước. Từ đó, dưa hấu trở thành loại quả truyền thống của người Việt, tượng trưng cho ý chí tự lập và lòng kiên cường.`
    },
    {
        id: 2,
        title: "Rùa và Thỏ (Sự kiên trì)",
        summary: "Bài học quý giá về sự kiên trì đánh bại thói kiêu ngạo.",
        content: `Một buổi sáng đẹp trời, Thỏ đang đi dạo trong rừng thì gặp Rùa đang lững thững bò. Thỏ vốn tự phụ chạy nhanh, liền lớn tiếng chế giễu: "Chào anh Rùa chậm chạp! Anh bò như thế kia thì đến bao giờ mới ra khỏi khu rừng này?"

Rùa không giận dữ, bình tĩnh trả lời: "Anh đừng kiêu ngạo. Nếu anh muốn, chúng ta có thể chạy thi xem ai đến gốc cây cổ thụ ở bên kia sườn đồi trước?"

Thỏ cười phá lên đầy đắc ý và đồng ý ngay lập tức. Cả hai cùng xuất phát. Thỏ phóng như bay một mạch, bỏ xa Rùa. Khi thấy mình đã bỏ cách Rùa quá xa, Thỏ tự nhủ: "Rùa có bò cả ngày cũng không đuổi kịp ta. Thời tiết đẹp thế này, ta cứ thong thả nằm dưới gốc cây ngủ một giấc cho sướng". Thế rồi Thỏ nằm ngủ say sưa dưới bóng râm mát rượi.

Trong khi đó, Rùa biết mình chạy chậm nên không ngừng bước. Rùa miệt mài, nhẫn nại bước từng bước một, không một phút nghỉ ngơi. Rùa đi qua chỗ Thỏ đang nằm ngủ ngon lành và tiếp tục tiến về đích.

Khi Thỏ chợt tỉnh giấc thì mặt trời đã xế bóng. Thỏ vội vàng co chân chạy thục mạng hướng về đích. Nhưng đã quá muộn, Rùa đã đặt chân tới đích từ trước đó trong tiếng reo hò cổ vũ của các loài thú trong rừng. Thỏ vô cùng xấu hổ, từ đó không bao giờ dám kiêu ngạo, coi thường người khác nữa.`
    },
    {
        id: 3,
        title: "Cây tre trăm đốt (Ở hiền gặp lành)",
        summary: "Câu chuyện dân gian quen thuộc về anh Khoai hiền lành.",
        content: `Ngày xửa ngày xưa, ở một ngôi làng nọ có anh Khoai hiền lành, khỏe mạnh, đi cày thuê cho lão nhà giàu. Lão nhà giàu muốn anh làm việc không công cho mình nên đã hứa hẹn: "Con chịu khó cày bừa cho ta trong ba năm. Sau ba năm, ta sẽ gả con gái ta cho".

Anh Khoai tin lời, làm việc cật lực không quản ngại mưa nắng. Sau ba năm, gia sản của lão nhà giàu càng thêm to lớn. Tuy nhiên, lão không muốn giữ lời hứa mà định gả con gái cho một công tử nhà giàu khác trong làng.

Để đánh lừa anh Khoai đi nơi khác, lão nói: "Bây giờ con hãy vào rừng, tìm cho được một cây tre có đủ trăm đốt mang về đây để làm đũa cưới, ta sẽ cho con cưới con gái ta ngay".

Anh Khoai thật thà vác dao vào rừng sâu tìm kiếm. Anh đi hết đồi này sang thung lũng khác, tìm mãi nhưng cao nhất cũng chỉ có cây tre bốn, năm chục đốt. Anh ngồi bên bụi tre ôm mặt khóc nức nở.

Bỗng nhiên, một ông lão râu tóc bạc phơ như tuyết hiện ra hỏi: "Vì sao con khóc?" Anh Khoai đem đầu đuôi câu chuyện kể lại. Ông cụ mỉm cười nói: "Tre trăm đốt thì không có, nhưng con hãy chặt đủ một trăm đốt tre mang về đây, ta sẽ giúp con".

Anh Khoai làm theo. Khi đã có đủ một trăm đốt tre, ông cụ bảo anh đọc câu thần chú: "Khắc nhập, khắc nhập". Lạ kỳ thay, một trăm đốt tre liền dính lại thành một cây tre dài trăm đốt thẳng tắp. Nhưng tre dài quá vác không tiện, ông cụ lại dạy anh câu thần chú: "Khắc xuất, khắc xuất". Cây tre lập tức rời ra thành một trăm đốt tre như cũ.

Anh Khoai cảm ơn cụ rồi bó tre gánh về nhà. Về đến nơi, thấy nhà phú ông đang tưng bừng tổ chức đám cưới cho con gái với người khác, anh Khoai hiểu ra mình bị lừa. Anh xếp một trăm đốt tre ra sân rồi đọc: "Khắc nhập, khắc nhập". Một cây tre khổng lồ xuất hiện. Phú ông chạy ra giật lấy liền bị hút dính chặt vào cây tre. Gã rể hờ và đám gia nhân xông vào cũng bị dính luôn.

Phú ông khóc lóc van xin, hứa gả con gái ngay lập tức. Anh Khoai liền đọc: "Khắc xuất, khắc xuất". Mọi người rời ra, phú ông sợ hãi lập tức giữ lời hứa tổ chức đám cưới cho anh Khoai và con gái mình. Hai vợ chồng sống hạnh phúc trọn đời.`
    },
    {
        id: 4,
        title: "Sự tích cây vú sữa (Tình mẫu tử thiêng liêng)",
        summary: "Bài học cảm động sâu sắc về tình yêu bao la mẹ dành cho con.",
        content: `Ngày xưa, có một cậu bé ham chơi, ngỗ nghịch. Một lần, bị mẹ mắng, cậu kiêu kỳ bỏ nhà ra đi. Cậu đi la cà khắp nơi, ăn xin qua ngày, chẳng nghĩ gì đến người mẹ đang ngày đêm tựa cửa mỏi mắt chờ mong ở nhà.

Thời gian trôi qua, cậu bé đói rét, lại bị những đứa trẻ lớn hơn bắt nạt, cậu chợt nhớ đến người mẹ hiền luôn chăm sóc, che chở, chiều chuộng mình mỗi khi vấp ngã. Cậu liền tìm đường trở về nhà.

Về đến nhà, cảnh vật vẫn như xưa, nhưng mẹ cậu đâu rồi? Cậu gọi mẹ khản cả tiếng: "Mẹ ơi, mẹ ở đâu?" Cậu ôm một cây xanh có quả to tròn ở góc vườn gào khóc nức nở.

Lạ kỳ thay, khi những giọt nước mắt của cậu thấm vào gốc cây, cây bỗng rung rinh, trổ hoa, kết quả rất nhanh. Một quả chín vàng, to tròn căng mọng rơi trúng vào lòng tay cậu. Cậu bé bổ quả ra làm đôi, thấy ruột quả trắng ngần như dòng sữa mẹ ngọt thơm lành phun trào. Cậu bé uống sữa quả ngon ngọt mát lành như sữa mẹ.

Cậu nghe như có tiếng nói ấm áp vỗ về xung quanh: "Ăn quả ngọt hãy nhớ đến bàn tay người cày cấy, người mẹ đã hy sinh". Cậu bé chợt nhận ra người mẹ tần tảo chờ đợi cậu đã qua đời vì mỏi mòn kiệt sức, hóa thân thành cây xanh này để tiếp tục che chở nuôi nấng cậu. Cậu ôm lấy thân cây ân hận khóc ròng. Từ đó, loại quả thơm ngon ấy được mọi người gọi là quả Vú sữa, tượng trưng cho tình mẫu tử bao la vô bờ bến.`
    },
    {
        id: 5,
        title: "Trí khôn của ta đây (Sự nhanh trí thông minh)",
        summary: "Câu chuyện dân gian hài hước dạy bé hiểu về sức mạnh của trí khôn con người.",
        content: `Một ngày nọ, một con Cọp từ trong rừng đi ra bờ ruộng thì thấy một anh nông dân đang cày ruộng cùng một con Trâu to lớn. Con Trâu chăm chỉ kéo cày nặng nhọc, thỉnh thoảng anh nông dân lại quất roi vào mông trâu xua đuổi.

Cọp thấy kỳ lạ, liền đợi lúc trâu được mở cày nghỉ ngơi liền đi lại gần hỏi: "Này Trâu, anh to khỏe thế kia, sao lại chịu để cho một sinh vật bé nhỏ quất roi xua đuổi như vậy?"

Trâu thì thầm tai Cọp: "Người tuy bé nhỏ nhưng họ có trí khôn, tôi phải chịu khuất phục trước trí khôn của họ".

Cọp nghe vậy, liền tìm đến anh nông dân hỏi thẳng: "Trí khôn của anh đâu, cho ta xem một chút được không?"

Anh nông dân nhanh trí trả lời: "Trí khôn ta để ở nhà mất rồi. Để ta chạy về nhà lấy cho ngươi xem. Nhưng ta đi vắng, sợ ngươi ăn mất Trâu của ta, nên ngươi hãy để ta trói vào gốc cây này cho yên tâm đã".

Cọp muốn tận mắt xem trí khôn quá nên đồng ý ngay. Anh nông dân dùng dây thừng trói chặt Cọp vào một gốc cây cổ thụ lớn. Xong xuôi, anh lấy một bó rơm to châm lửa đốt xung quanh Cọp, vừa quất roi vừa hét lớn: "Trí khôn của ta đây! Trí khôn của ta đây!"

Trâu thấy cảnh tượng nực cười ấy liền thích thú cười lớn, không may vấp vào đá gãy mất hàng răng trên. Còn Cọp bị lửa đốt cháy sém da thành những vằn đen dọc thân, may mắn dây thừng cháy đứt, Cọp sợ hãi chạy thẳng vào rừng sâu. Từ đó, trâu không có răng trên và cọp thì luôn có các vằn đen dọc thân.`
    },
    {
        id: 6,
        title: "Truyện cổ tích Tích Chu (Lòng hiếu thảo)",
        summary: "Bài học quý giá nhắc nhở bé luôn yêu thương, hiếu kính ông bà cha mẹ.",
        content: `Ngày xưa, có một cậu bé tên là Tích Chu. Bố mẹ mất sớm, Tích Chu sống cùng bà ngoại. Bà thương Tích Chu lắm, suốt ngày làm lụng vất vả để nuôi Tích Chu khôn lớn, ban đêm khi Tích Chu ngủ bà lại thức quạt mát cho cậu. 

Thế nhưng Tích Chu lớn lên lại chỉ biết ham chơi cùng bạn bè đầu đường cuối phố, bỏ mặc bà một mình thui thủi trong căn nhà lá đơn sơ.

Một ngày nọ, vì làm việc quá sức dưới trời nắng nóng, bà bị sốt cao. Nằm trên giường bệnh nóng ran, bà khát nước quá liền gọi: "Tích Chu ơi, cho bà ngụm nước suối, bà khát khô cả cổ rồi". Bà gọi một lần, hai lần, rồi ba lần nhưng Tích Chu vẫn mải chơi đùa với bạn không nghe thấy.

Đến khi Tích Chu đói bụng chạy về nhà tìm cơm ăn thì thấy bà đã hóa thành một chú chim lớn và đang vỗ cánh bay lên trời. Tích Chu hốt hoảng khóc lóc gọi: "Bà ơi! Bà đừng bỏ cháu đi mà!". 

Chim liền cất tiếng: "Bà khát nước quá không chịu nổi phải hóa thành chim bay đi tìm nước uống đây. Bà không về với Tích Chu được nữa đâu". Chim vỗ cánh bay xa, Tích Chu òa khóc chạy theo hướng chim bay.

Đi mãi, Tích Chu gặp một cô tiên hiền từ. Cô tiên bảo: "Nếu cháu muốn bà hóa lại thành người, cháu phải đi lấy nước suối Tiên cho bà uống. Nhưng đường đi đến suối Tiên rất xa xôi, hiểm trở đầy cọp dữ". 

Tích Chu không ngần ngại, lập tức trèo đèo lội suối vượt qua muôn vàn nguy hiểm để mang bình nước suối Tiên trở về cho chim uống. Nhấp từng ngụm nước suối mát lành từ tay cháu, chim rùng mình lập tức hóa lại thành người bà nhân hậu. Tích Chu ôm chầm lấy bà khóc nức nở hứa từ nay sẽ ngoan ngoãn chăm sóc bà.`
    },
    {
        id: 7,
        title: "Câu chuyện hai anh em (Tình cảm gia đình hòa thuận)",
        summary: "Câu chuyện ý nghĩa sâu sắc dạy bé bài học sẻ chia và yêu thương anh chị em ruột thịt.",
        content: `Thuở xưa, có hai anh em sống chung một mái nhà tranh, cùng nhau cày cấy chăm chỉ và yêu thương nhau hết lòng. Khi cha mẹ qua đời, người anh cưới vợ và hai anh em quyết định chia đôi mảnh ruộng cha mẹ để lại để tự canh tác riêng.

Đến mùa thu hoạch lúa chín vàng, thóc được gặt và chất thành hai đống bằng nhau ở hai góc ruộng. Đêm hôm đó, người em nằm suy nghĩ: "Anh mình đã có vợ con, chi tiêu gia đình nhiều hơn mình rất nhiều. Chia lúa bằng nhau thế này thật không công bằng với anh". Nghĩ vậy, người em lén ra ruộng bê mấy bó lúa từ đống của mình sang đống của anh.

Cùng lúc đó ở trong nhà, người anh cũng trăn trở không ngủ được: "Em mình còn trẻ tuổi, chưa lập gia đình, cần tích lũy nhiều tiền của để lo cho tương lai. Mình là anh, phải giúp đỡ em". Người anh liền âm thầm đi ra ruộng, bê vài bó lúa từ đống của mình đặt sang đống của em.

Sáng hôm sau ra ruộng, hai anh em vô cùng ngạc nhiên khi thấy hai đống lúa vẫn nguyên vẹn bằng nhau như cũ không hề vơi đi. Đêm thứ hai, họ lại tiếp tục hành động như cũ. 

Và đến đêm thứ ba, khi mỗi người ôm những bó lúa đi trong bóng tối, họ đã va phải nhau giữa ruộng lúa. Nhìn những bó lúa trên tay đối phương, hai anh em hiểu ra tấm lòng của nhau. Họ đặt lúa xuống đất và ôm lấy nhau khóc vì xúc động. Tình anh em chân thành và lòng nhân hậu của họ đã trở thành tấm gương sáng cho cả vùng học tập.`
    },
    {
        id: 8,
        title: "Sự tích Bánh chưng, bánh giầy (Lòng hiếu thảo)",
        summary: "Lang Liêu dâng vua cha lễ vật làm từ hạt gạo quê hương thấm đượm lòng hiếu kính.",
        content: `Vào đời Hùng Vương thứ sáu, sau khi đánh đuổi giặc Ân xong, nhà vua muốn truyền ngôi cho con. Nhân dịp đầu xuân, vua họp các quan lang lại và truyền lệnh: "Ai tìm được lễ vật dâng cúng tổ tiên ý nghĩa và vừa ý ta nhất, ta sẽ truyền ngôi cho".
        
Các hoàng tử lập tức sai người đi khắp nơi tìm của ngon vật lạ, sơn hào hải vị. Duy chỉ có hoàng tử thứ mười tám là Lang Liêu là buồn bã. Lang Liêu mất mẹ sớm, gia cảnh nghèo nén nhất trong các anh em, trong nhà chỉ có lúa ngô là nhiều.

Một đêm nọ, Lang Liêu nằm mơ thấy một vị thần hiện ra bảo: "Trong trời đất, không có gì quý bằng hạt gạo, vì hạt gạo nuôi sống con người. Con hãy lấy gạo nếp làm bánh. Một thứ bánh tròn tượng trưng cho Trời, một thứ bánh vuông tượng trưng cho Đất. Ruột bánh cho nhân thịt, đỗ để tượng trưng cho muông thú và cây cỏ, lấy lá xanh bọc ngoài để thể hiện tình yêu thương đùm bọc của cha mẹ dành cho con".

Tỉnh dậy, Lang Liêu vui mừng làm theo lời thần dạy. Ông chọn những hạt nếp hạt tròn mẩy nhất mang vo sạch, lấy đậu xanh thơm ngon và thịt lợn làm nhân, bọc lá dong xanh mướt bên ngoài rồi luộc chín, gọi là bánh chưng. Ông lại đem xôi nếp giã mịn, nặn thành những chiếc bánh tròn trắng phau, gọi là bánh giầy.

Đến ngày hẹn dâng lễ vật, giữa vô số mâm sơn hào hải vị lộng lẫy, hai loại bánh giản dị của Lang Liêu nổi bật. Vua Hùng nếm thử, tấm tắc khen ngợi vị ngon thơm lành và vô cùng cảm động trước ý nghĩa sâu xa của bánh. Nhà vua lập tức truyền ngôi lại cho Lang Liêu. Từ đó, bánh chưng và bánh giầy trở thành món ăn truyền thống không thể thiếu trong ngày Tết cổ truyền của dân tộc Việt Nam.`
    },
    {
        id: 9,
        title: "Sự tích hồ Ba Bể (Lòng nhân ái)",
        summary: "Bài học cảm động sâu sắc về tình người cứu giúp lẫn nhau lúc hoạn nạn.",
        content: `Ngày xưa, ở vùng Nam Mẫu, tỉnh Bắc Kạn có lễ hội cúng Phật lớn được tổ chức hàng năm. Người dân khắp nơi tấp nập kéo về dự hội cầu phúc. Bỗng nhiên, có một bà lão ăn xin rách rưới, người ngợm lở loét, bốc mùi hôi thối xuất hiện. Bà đi đến đâu cũng thều thào xin ăn nhưng mọi người đều xua đuổi, lánh xa.

Khi bà đi đến ngã ba đường thì gặp hai mẹ con nhà góa nọ đi chợ về. Thấy bà cụ đói rách tội nghiệp, người mẹ động lòng thương hại, đưa bà cụ về nhà mình, nấu cơm nóng cho ăn và nhường giường cho bà cụ nghỉ ngơi.

Đến nửa đêm, hai mẹ con giật mình thức giấc bởi những tiếng động lạ phát ra từ giường bà cụ nằm. Họ nhìn sang thì thấy một con giao long khổng lồ đang nằm cuộn tròn, đầu hướng lên xà nhà phát ra ánh hào quang sáng lòa. Hai mẹ con kinh hãi ôm nhau nín thở, phó mặc cho số phận.

Sáng hôm sau tỉnh dậy, con giao long biến mất, bà cụ ăn xin vẫn nằm đó. Trước khi ra đi, bà cụ bảo hai mẹ con: "Vùng này sắp có thiên tai bão lụt lớn. Ta cho hai mẹ con gói tro này, hãy rắc xung quanh nhà để tránh nạn". Bà cụ lại đưa thêm hai mảnh vỏ trấu và dặn: "Hai mảnh vỏ trấu này sẽ giúp hai con cứu người giúp đời". Dứt lời, bà cụ biến mất.

Quả nhiên, ngay tối hôm đó, khi lễ hội đang diễn ra tưng bừng, một cột nước khổng lồ từ dưới lòng đất phun lên, cuốn trôi toàn bộ nhà cửa, xóm làng. Duy chỉ có ngôi nhà nhỏ của hai mẹ con nhà góa gieo tro xung quanh là nổi lên như một hòn đảo nhỏ giữa dòng nước lũ. Nhớ lời dặn, hai mẹ con thả hai mảnh vỏ trấu xuống nước, vỏ trấu lập tức biến thành hai chiếc thuyền độc mộc lớn giúp họ chèo đi cứu vớt những người dân đang chới với giữa dòng nước. Vùng đất bị sụt lún ngập nước đó ngày nay chính là Hồ Ba Bể nổi tiếng.`
    },
    {
        id: 10,
        title: "Thầy bói xem voi (Góc nhìn toàn diện)",
        summary: "Câu chuyện ngụ ngôn hài hước khuyên dạy bé tránh nhìn nhận sự việc một cách phiến diện.",
        content: `Nhân buổi ế hàng, năm ông thầy bói mù ngồi nói chuyện phiếm với nhau. Nghe người ta bảo có đoàn voi đi qua, cả năm ông đều chưa một lần biết con voi là thế nào, liền chung tiền đưa cho người quản tượng để xin được sờ con voi một chút.

Thầy thứ nhất sờ vòi voi, liền phán: "Tưởng con voi thế nào, hóa ra nó sun sun như con đỉa".
Thầy thứ hai sờ ngà voi, liền bác lại: "Không phải! Nó chần chẫn như cái đòn càn".
Thầy thứ ba sờ tai voi, cãi lại: "Các ông nói sai cả! Nó bè bè như cái quạt thóc".
Thầy thứ tư sờ chân voi, phán lớn: "Không đâu! Nó sừng sững như cái cột đình".
Thầy thứ năm sờ đuôi voi, nói: "Các ông đều nhầm cả rồi, nó tun tủn như cái chổi sể cùn".

Năm ông thầy bói, mỗi người sờ được một bộ phận của con voi rồi ai cũng khăng khăng cho rằng nhận định của mình mới là chính xác nhất. Không ai chịu nhường ai, năm ông cãi lộn om sòm, rồi xông vào thượng cẳng chân hạ cẳng tay, đánh nhau toác đầu chảy máu mà vẫn chưa ai chịu ai.

Bài học rút ra từ câu chuyện ngụ ngôn: Sự vật, hiện tượng trong cuộc sống luôn có rất nhiều khía cạnh khác nhau. Muốn hiểu rõ bản chất của một sự việc, chúng ta phải có cái nhìn toàn diện từ nhiều góc độ thay vì chỉ đánh giá một cách phiến diện dựa trên một khía cạnh duy nhất.`
    },
    {
        id: 11,
        title: "Sự tích Trầu Cau (Tình nghĩa thủy chung)",
        summary: "Câu chuyện cảm động sâu sắc về tình nghĩa vợ chồng son sắt và tình anh em gắn bó thiết tha.",
        content: `Ngày xưa, có hai anh em nhà họ Cao giống nhau như đúc, tên là Tân và Lang. Hai anh em vô cùng yêu thương, đùm bọc lẫn nhau. Khi lớn lên, người anh là Tân kết duyên cùng một người con gái hiền dịu, xinh đẹp.

Từ ngày Tân có vợ, hai anh em không còn gần gũi, chia sẻ vui buồn nhiều như trước. Lang cảm thấy tủi thân, nghĩ rằng anh trai từ khi có hạnh phúc riêng đã phai nhạt tình cốt nhục. Một chiều nọ, sau chuyến đi cày mệt nhọc trở về, người vợ nhầm lẫn Lang là chồng mình nên chạy ra ôm trầm lấy. Đúng lúc đó, Tân bước vào. Sự hiểu lầm vô tình khiến Tân nghi ngờ và trở nên lạnh nhạt, xa lánh em trai.

Lòng đầy buồn tủi và đau khổ vì bị anh nghi oan, Lang lẳng lặng bỏ nhà ra đi. Anh đi mãi, đi mãi cho đến khi kiệt sức bên bờ một con sông rộng nước chảy xiết. Lang gục xuống khóc thương cho số phận rồi hóa thành một tảng đá vôi xám bên bờ sông.

Ở nhà, không thấy em về, Tân vô cùng hối hận vì sự ích kỷ và nghi kỵ của mình. Anh quyết định lên đường tìm em. Tân đi theo hướng Lang đã đi, vượt qua nhiều rừng rậm hiểm trở cho đến khi tới bờ sông rộng. Thấy tảng đá vôi kỳ lạ, Tân ôm lấy tảng đá khóc thương thảm thiết rồi kiệt sức, hóa thành một cây thân thẳng tắp, không cành, trên đỉnh xòe ra những lá xanh mướt - đó là cây cau.

Người vợ ở nhà chờ đợi mỏi mòn, thương nhớ chồng khôn nguôi, cũng quyết định lên đường tìm kiếm. Khi đến bờ sông, nhìn thấy tảng đá vôi bên cạnh cây cau thẳng tắp, nàng hiểu ra bi kịch đau lòng. Nàng ôm lấy gốc cây cau khóc ròng rã cho đến hơi thở cuối cùng và hóa thân thành một dây leo quấn quýt, ôm chặt lấy thân cây cau - đó là cây trầu không.

Về sau, khi người dân hái lá trầu quệt một ít vôi bên tảng đá rồi nhai cùng quả cau, thấy có vị cay cay, ngọt bùi và nhổ ra dòng nước đỏ thắm như máu đỏ. Câu chuyện trầu cau từ đó trở thành biểu tượng thiêng liêng cho sự gắn kết, nghĩa tình gia đình thủy chung, son sắt của người Việt.`
    },
    {
        id: 12,
        title: "Cậu bé thông minh (Sự thông minh, trí tuệ)",
        summary: "Bài học bổ ích kích thích tư duy nhạy bén, sự tự tin và lòng dũng cảm vượt qua thử thách.",
        content: `Ngày xưa, có một vị vua anh minh muốn tìm kiếm người tài đức ra giúp nước. Vua sai một viên quan đi khắp các làng quê để tìm người thông minh bằng cách ra những câu hỏi hóc búa.

Một ngày nọ, viên quan đi qua một cánh đồng và gặp hai cha con đang cày ruộng. Viên quan liền dừng ngựa hỏi: "Này lão kia! Trâu của lão cày một ngày được mấy đường?"
Người cha còn đang lúng túng chưa biết trả lời sao, thì cậu con trai chừng bảy tuổi đã nhanh nhảu hỏi ngược lại viên quan: "Nếu quan lớn trả lời được ngựa của ngài đi một ngày được mấy bước, tôi sẽ trả lời cho ngài trâu của cha tôi cày một ngày được mấy đường".
Viên quan vô cùng ngạc nhiên và thán phục trước sự lanh lợi của cậu bé, lập tức ghi chép tên tuổi và trở về tâu lên nhà vua.

Để thử tài cậu bé một lần nữa, nhà vua ban cho làng của cậu ba thúng gạo nếp và ba con trâu đực, lệnh trong một năm phải nuôi sao cho trâu đẻ thành chín con, nếu không cả làng sẽ bị phạt nặng.
Cả làng vô cùng lo lắng vì trâu đực làm sao đẻ con được. Nhưng cậu bé nói với cha: "Cha cứ thưa với làng thịt hai con trâu và đồ xôi ăn mừng, còn một con trâu và một thúng gạo nếp để hai cha con làm lộ phí lên kinh đô xin vua giải quyết".
Đến kinh đô, cậu bé lẻn vào cung điện rồi khóc om sòm trước mặt nhà vua. Vua hỏi nguyên cớ, cậu bé mếu máo: "Tâu đức vua, mẹ con mất sớm mà cha con mãi không chịu đẻ em bé cho con chơi cùng".
Nhà vua phì cười bảo: "Ngươi thật ngốc, cha ngươi là đàn ông thì làm sao đẻ con được!"
Cậu bé lập tức đáp lại: "Dạ thưa đức vua, vậy tại sao ngài lại ra lệnh cho làng con phải nuôi trâu đực đẻ ra trâu con ạ?"
Vua bật cười khen ngợi cậu bé thông minh và thưởng cho cậu rất nhiều quà cáp.

Ít lâu sau, nước láng giềng muốn sang xâm chiếm bờ cõi, liền cho sứ giả mang sang một vỏ con ốc xoắn rất dài và đố làm sao xỏ được sợi chỉ mềm xuyên qua vỏ ốc. Các đại thần trong triều đều bó tay. Vua lại cho người đi tìm cậu bé.
Khi nghe câu đố, cậu bé không cần vào cung mà vừa chơi đùa vừa đọc bài đồng dao:
"Tang tình tang, tính tình tang
Bắt con kiến càng buộc chỉ ngang lưng
Bên thời thả kiến, bên thời bôi mỡ
Kiến gặp mùi mỡ, kiến bò sang ngay..."

Nhà vua làm theo lời cậu bé: buộc chỉ vào bụng một con kiến càng lớn, bôi một ít mỡ thơm ở đầu kia của vỏ ốc rồi thả kiến vào đầu này. Con kiến ngửi thấy mùi mỡ liền len lỏi bò qua các đường xoắn của vỏ ốc và sang đến đầu kia, kéo theo sợi chỉ thông suốt. Sứ giả nước láng giềng kính phục tài trí của đất nước ta và không dám nghĩ đến chuyện xâm lược nữa. Cậu bé được nhà vua phong làm Trạng nguyên và cho xây dựng dinh thự ngay cạnh hoàng cung để tiện bàn việc đại sự.`
    },
    {
        id: 13,
        title: "Sự tích hoa cúc trắng (Lòng hiếu thảo vô bờ)",
        summary: "Câu chuyện cảm động giáo dục trẻ biết thương yêu và tận tâm hiếu kính với cha mẹ.",
        content: `Ngày xưa, ở một ngôi làng nhỏ ven rừng có hai mẹ con nghèo sống nương tựa vào nhau rất đầm ấm. Người mẹ ngày ngày vào rừng kiếm củi đem bán, còn cô con gái nhỏ hiền thảo chăm lo việc nhà cửa.

Một mùa đông giá lạnh tràn về, người mẹ do làm việc quá sức dưới trời tuyết buốt đã lâm bệnh nặng. Bà sốt cao liên miên, cơ thể yếu dần. Cô bé vô cùng lo lắng, dù chạy vạy khắp nơi tìm thầy thuốc nhưng bệnh tình của mẹ vẫn không hề thuyên giảm.

Một buổi chiều, cô bé ngồi khóc bên vệ đường thì có một cụ già râu tóc bạc phơ đi qua. Thấy cô bé khóc lóc tội nghiệp, cụ dừng lại hỏi han. Nghe xong hoàn cảnh, cụ bảo: "Cháu hãy đi sâu vào rừng, tìm đến gốc cây cổ thụ lớn nhất. Ở đó có một bông hoa màu trắng rất đẹp. Cháu hãy hái bông hoa đó về. Mỗi cánh của bông hoa sẽ tương ứng với một ngày sống của mẹ cháu".

Cô bé mừng rỡ, cảm ơn cụ già rồi lập tức chạy phăng vào rừng sâu. Mặc cho gai cào rách áo, đá nhọn làm đau bàn chân, cô bé vẫn không ngừng bước. Sau nhiều giờ tìm kiếm, cuối cùng cô cũng tìm thấy bông hoa trắng muốt lấp lánh dưới gốc cây cổ thụ. Cô nhẹ nhàng hái bông hoa lên và cẩn thận đếm số cánh hoa: "Một, hai, ba, bốn... hai mươi. Ôi! Mẹ chỉ còn sống được hai mươi ngày nữa thôi sao?"

Nghĩ đến việc mẹ sắp phải rời xa mình, cô bé đau đớn vô cùng. Trong lúc tuyệt vọng, cô chợt nảy ra một ý định. Cô nhẹ nhàng dùng tay xé nhỏ mỗi cánh hoa lớn thành nhiều sợi nhỏ dài li ti. Kỳ lạ thay, mỗi sợi nhỏ sau khi xé ra liền biến thành một cánh hoa mới dài và mịn màng. Bông hoa trắng từ hai mươi cánh ban đầu bỗng biến thành một bông hoa có vô vàn cánh nhỏ đan xen, tỏa hương thơm ngát.

Cô bé nâng niu bông hoa chạy nhanh về nhà. Vừa bước chân vào cửa, cô thấy mẹ đã khỏe mạnh hẳn lên, da dẻ hồng hào, đang mỉm cười đón cô. Cụ già râu tóc bạc phơ khi nãy chính là một vị tiên đã cảm động trước lòng hiếu thảo vô bờ bến của cô bé và cứu sống người mẹ. 

Bông hoa có vô vàn cánh nhỏ màu trắng tinh khiết ấy từ đó được gọi là Hoa Cúc Trắng, đại diện cho lòng hiếu thảo thiêng liêng và ước nguyện cha mẹ sống lâu trăm tuổi cùng con cháu.`
    }
];

export default function FetalEducationPage() {
    const [activeTab, setActiveTab] = useState<'methods' | 'library' | 'roadmap'>('methods');
    
    // Story State
    const [selectedStory, setSelectedStory] = useState<any>(null);

    return (
        <div className="utility-page-container fade-in">
            {/* Intro header card */}
            <div className="intro-card-tg">
                <IoSparklesOutline className="intro-bg-icon" style={{ position: 'absolute', right: '-15px', bottom: '-20px', fontSize: '9rem', opacity: 0.15, transform: 'rotate(-10deg)', pointerEvents: 'none' }} />
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Thai Giáo Diệu Kỳ</h2>
                <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.95rem', fontWeight: 500 }}>Kích hoạt tiềm năng não bộ & gắn kết tình mẫu tử thiêng liêng.</p>
            </div>

            {/* Tab segment button control */}
            <div className="tab-container-tg">
                <button 
                    onClick={() => setActiveTab('methods')} 
                    className={`tab-toggle ${activeTab === 'methods' ? 'active' : ''}`}
                >
                    Phương pháp
                </button>
                <button 
                    onClick={() => setActiveTab('library')} 
                    className={`tab-toggle ${activeTab === 'library' ? 'active' : ''}`}
                >
                    Truyện kể
                </button>
                <button 
                    onClick={() => setActiveTab('roadmap')} 
                    className={`tab-toggle ${activeTab === 'roadmap' ? 'active' : ''}`}
                >
                    Lộ trình
                </button>
            </div>

            {/* VIEW 1: METHODS */}
            {activeTab === 'methods' && (
                <div className="tg-split-layout-p">
                    {/* Left column / Sidebar */}
                    <div className="tg-sidebar-p">
                        <div className="card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>Thai giáo là gì?</h4>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-sub)', lineHeight: 1.65, margin: 0 }}>
                                Thực chất là quá trình giáo dục sớm thông qua việc kích thích 5 giác quan của bé yêu khi còn trong bụng mẹ, giúp nuôi dưỡng tâm hồn và hỗ trợ trí não phát triển vượt trội.
                            </p>
                        </div>

                        <div className="card" style={{ borderLeft: '5px solid #10b981', padding: '20px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.5)', borderLeftColor: '#10b981', borderRadius: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f766e' }}>Thai giáo gián tiếp</h4>
                            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#0f766e', margin: 0 }}>
                                <strong>Nuôi dưỡng Tinh thần & Hóa học cơ thể:</strong> Khi mẹ bầu có tâm lý thoải mái, hạnh phúc, não bộ sẽ tiết ra hoóc-môn Endorphin truyền đến em bé, kích thích đại não phát triển. Ăn ngon, ngủ sâu và giữ nụ cười rạng rỡ chính là phương thuốc thai giáo diệu kỳ nhất!
                            </p>
                        </div>

                        <div className="global-methods-box">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 800, color: '#a21caf', margin: '0 0 12px 0' }}>
                                <IoGlobeOutline style={{ fontSize: '1.15rem' }} /> Các nước làm thai giáo ra sao?
                            </h4>
                            <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.85rem', color: '#701a75', lineHeight: 1.65 }}>
                                <li><strong>Pháp (Haptonomy):</strong> Đề cao sự kết nối gia đình, chồng đặt tay lên bụng vợ để truyền hơi ấm và tình thương cho con.</li>
                                <li><strong>Hàn Quốc (Taegyo):</strong> Mẹ xem tranh nghệ thuật, may vá thêu thùa, viết nhật ký cho con để nuôi dưỡng tính thiện.</li>
                                <li><strong>Mỹ:</strong> Chú trọng tập yoga tiền sản, vận động thể chất và trò chuyện trực tiếp để bé quen giọng của ba mẹ.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right column / Main */}
                    <div className="tg-main-p">
                        <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                            Thai giáo trực tiếp (Kích thích 5 giác quan)
                        </div>

                        <div className="method-item-card">
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="icon-box-tg blue-bg"><IoHeadsetOutline /></div>
                                <div>
                                    <h4 className="method-card-title">Thính giác thai giáo</h4>
                                    <span className="method-card-badge">Tuần 16 - 24</span>
                                </div>
                            </div>
                            <p className="method-card-desc">
                                Mẹ nghe nhạc cổ điển không lời, các bài hát ru nhẹ nhàng, đọc truyện cổ tích hoặc đơn giản là trò chuyện ngọt ngào với bé mỗi ngày.
                                <br />
                                <span style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '10px', display: 'block', fontWeight: 500 }}>
                                    ⚠️ <em>Lưu ý: Không áp sát tai nghe trực tiếp lên bụng bầu, mở loa ngoài vừa đủ nghe (&lt; 70dB).</em>
                                </span>
                            </p>
                        </div>

                        <div className="method-item-card">
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="icon-box-tg pink-bg"><IoHeartOutline /></div>
                                <div>
                                    <h4 className="method-card-title">Xúc giác thai giáo (Haptonomy)</h4>
                                    <span className="method-card-badge">Tuần 8 trở đi</span>
                                </div>
                            </div>
                            <p className="method-card-desc">
                                Mẹ vuốt ve, massage nhẹ nhàng thành bụng từ trên xuống dưới, ấn đáp lại nhẹ nhàng khi thấy bé đạp (phương pháp Haptonomy quốc tế).
                                <br />
                                <span style={{ fontSize: '0.8rem', color: '#db2777', marginTop: '10px', display: 'block', fontWeight: 500 }}>
                                    ⚠️ <em>Lưu ý: Mỗi lần chỉ xoa vuốt nhẹ khoảng 5-10 phút. Tránh massage mạnh khi có dấu hiệu co bóp cổ tử cung.</em>
                                </span>
                            </p>
                        </div>

                        <div className="method-item-card">
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="icon-box-tg yellow-bg"><IoSunnyOutline /></div>
                                <div>
                                    <h4 className="method-card-title">Thị giác thai giáo</h4>
                                    <span className="method-card-badge">Tuần 26 trở đi</span>
                                </div>
                            </div>
                            <p className="method-card-desc">
                                Mẹ dùng đèn pin có ánh sáng dịu nhẹ ấm áp, rọi cách xa bụng bầu 10-15cm rồi bật tắt nhẹ nhàng nhịp nhàng để giúp bé cảm nhận được sự sáng tối, phát triển tế bào võng mạc.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: STORIES (TRUYỆN KỂ THAI GIÁO) */}
            {activeTab === 'library' && (
                <div className="card" style={{ padding: '24px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '20px' }}>
                    <div style={{ padding: '0 8px 16px 8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(241, 245, 249, 0.8)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <IoBookOutline style={{ color: '#f59e0b', fontSize: '1.25rem' }} /> Truyện kể thai giáo (Gắn kết tình mẫu tử)
                    </div>
                    <div className="tg-stories-grid-p">
                        {STORIES.map((story) => (
                            <div 
                                key={story.id} 
                                onClick={() => setSelectedStory(story)}
                                className="story-item-card-tg"
                            >
                                <div className="story-icon-box-tg">
                                    <IoBookOutline />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }} className="story-title-tg">{story.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', margin: 0, lineHeight: 1.45 }}>{story.summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 3: ROADMAP */}
            {activeTab === 'roadmap' && (
                <div className="tg-roadmap-grid-p">
                    <div className="timeline-box trimester-1">
                        <h4 className="timeline-title" style={{ color: '#059669' }}>3 Tháng đầu (Tam cá nguyệt 1)</h4>
                        <p className="timeline-desc">
                            Giai đoạn các cơ quan hình thành. Bé chưa nghe rõ thế giới bên ngoài, chủ yếu tiếp nhận thông tin hóa học qua cảm xúc của mẹ.
                        </p>
                        <ul className="timeline-bullets">
                            <li><strong>Mẹ giữ vui vẻ:</strong> Hạn chế tối đa căng thẳng, lo âu vì có thể gây ảnh hưởng đến sự hình thành phôi thai.</li>
                            <li><strong>Dinh dưỡng trọn vẹn:</strong> Cung cấp vi chất (Axit Folic, Sắt) để não bộ bé hình thành ống thần kinh an toàn.</li>
                        </ul>
                    </div>

                    <div className="timeline-box trimester-2">
                        <h4 className="timeline-title" style={{ color: '#d97706' }}>3 Tháng giữa (Tam cá nguyệt 2)</h4>
                        <p className="timeline-desc">
                            Giai đoạn VÀNG thai giáo. Thính giác, xúc giác của bé phát triển vượt bậc và liên tục kết nối các tế bào thần kinh.
                        </p>
                        <ul className="timeline-bullets">
                            <li><strong>Trò chuyện với con (Tuần 20+):</strong> Mẹ và bố kể chuyện, đọc thơ, trò chuyện giúp bé ghi nhớ giọng nói từ trong trứng nước.</li>
                            <li><strong>Gõ chạm tương tác:</strong> Vỗ nhẹ lên thành bụng khi bé cử động để rèn luyện phản xạ vận động xúc giác sớm cho bé.</li>
                        </ul>
                    </div>

                    <div className="timeline-box trimester-3">
                        <h4 className="timeline-title" style={{ color: '#b91c1c' }}>3 Tháng cuối (Tam cá nguyệt 3)</h4>
                        <p className="timeline-desc">
                            Giai đoạn hoàn thiện đại não và võng mạc mắt. Bé tích cực luyện tập hô hấp chuẩn bị cho ngày ra đời.
                        </p>
                        <ul className="timeline-bullets">
                            <li><strong>Thai giáo thị giác:</strong> Trò chơi ánh sáng kích thích tế bào hình que ở võng mạc mắt.</li>
                            <li><strong>Đọc thơ kể chuyện:</strong> Đọc lại các câu chuyện yêu thích, sau khi sinh bé sẽ nhận ra ngay và nhanh chóng nín khóc khi nghe mẹ đọc lại.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* STORY DETAIL MODAL */}
            {selectedStory && typeof window !== 'undefined' && createPortal(
                <div className="tg-modal-overlay" onClick={() => setSelectedStory(null)}>
                    <div className="tg-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="tg-modal-header">
                            <h3 className="tg-modal-title">
                                {selectedStory.title}
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setSelectedStory(null)} 
                                style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                aria-label="Đóng"
                            >
                                <IoCloseOutline />
                            </button>
                        </div>
                        
                        <div className="tg-modal-grid-body">
                            <div className="tg-modal-left-col">
                                <div className="tg-story-cover-wrapper">
                                    <img src="/story_cover.png" alt={selectedStory.title} className="tg-story-cover" />
                                    <div className="tg-story-moral-badge">
                                        💡 {selectedStory.summary}
                                    </div>
                                </div>
                            </div>

                            <div className="tg-modal-right-col">
                                {selectedStory.content}
                            </div>
                        </div>

                        <div className="tg-modal-footer">
                            <button 
                                type="button"
                                onClick={() => setSelectedStory(null)} 
                                className="modal-btn submit-btn"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                            >
                                Đóng truyện
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx global>{`
                /* Tab bar style */
                .tab-container-tg {
                    display: flex;
                    background: rgba(241, 245, 249, 0.8);
                    backdrop-filter: blur(8px);
                    border-radius: 16px;
                    padding: 5px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
                .tab-toggle {
                    flex: 1;
                    padding: 12px 0;
                    text-align: center;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.95rem;
                    font-weight: 700;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab-toggle:hover {
                    color: var(--primary);
                }
                .tab-toggle.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.12);
                }
                
                @media (max-width: 600px) {
                    .intro-card-tg {
                        padding-top: 56px !important;
                    }
                    :global(.utility-page-container) {
                        padding-top: 16px !important;
                    }
                    .tab-container-tg {
                        margin-bottom: 20px !important;
                    }
                    .tab-toggle {
                        padding: 10px 4px !important;
                        font-size: 0.84rem !important;
                    }
                }
                
                /* Layout Split */
                .tg-split-layout-p {
                    display: flex;
                    gap: 24px;
                    align-items: flex-start;
                }
                .tg-sidebar-p {
                    width: 380px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .tg-main-p {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                @media (max-width: 991px) {
                    .tg-split-layout-p {
                        flex-direction: column;
                        gap: 20px;
                    }
                    .tg-sidebar-p {
                        width: 100%;
                    }
                }

                /* Intro Card Upgraded */
                .intro-card-tg {
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #4f46e5 100%);
                    position: relative;
                    overflow: hidden;
                    padding: 28px 24px;
                    border-radius: 24px;
                    color: white;
                    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.22);
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                .intro-card-tg::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 55%);
                    transform: rotate(45deg);
                    animation: shineRay 6s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes shineRay {
                    0% { transform: translate(-30%, -30%) rotate(45deg); }
                    100% { transform: translate(30%, 30%) rotate(45deg); }
                }
                
                /* Methods Style */
                .method-item-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(241, 245, 249, 0.8);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .method-item-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(124, 58, 237, 0.08);
                    border-color: rgba(168, 85, 247, 0.25);
                    background: white;
                }
                .icon-box-tg {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.35rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .method-item-card:hover .icon-box-tg {
                    transform: scale(1.1) rotate(5deg);
                }
                .blue-bg { background: #e0f2fe; color: #0284c7; }
                .pink-bg { background: #fce7f3; color: #db2777; }
                .yellow-bg { background: #fef9c3; color: #ca8a04; }

                .method-item-card:hover .blue-bg { box-shadow: 0 0 15px rgba(2, 132, 199, 0.35); }
                .method-item-card:hover .pink-bg { box-shadow: 0 0 15px rgba(219, 39, 119, 0.35); }
                .method-item-card:hover .yellow-bg { box-shadow: 0 0 15px rgba(202, 138, 4, 0.35); }
                
                .method-card-title {
                    font-size: 1rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin: 0 0 3px 0;
                }
                .method-card-badge {
                    font-size: 0.72rem;
                    color: var(--text-sub);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .method-card-desc {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.6;
                    margin: 8px 0 0 0;
                }
                .global-methods-box {
                    background: rgba(253, 244, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px dashed #f0abfc;
                    padding: 20px;
                    border-radius: 20px;
                    box-shadow: inset 0 0 12px rgba(240, 171, 252, 0.05);
                }
                
                /* Story list grid & item styling */
                .tg-stories-grid-p {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }
                @media (max-width: 767px) {
                    .tg-stories-grid-p {
                        grid-template-columns: 1fr;
                    }
                }
                .story-item-card-tg {
                    display: flex;
                    gap: 16px;
                    padding: 20px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(241, 245, 249, 0.8);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .story-item-card-tg:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
                    border-color: rgba(245, 158, 11, 0.25) !important;
                    background: white !important;
                }
                .story-item-card-tg:hover .story-icon-box-tg {
                    background: #f59e0b !important;
                    color: white !important;
                    transform: scale(1.08) rotate(-5deg);
                }
                .story-icon-box-tg {
                    color: #f59e0b;
                    font-size: 1.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #fffbeb;
                    flex-shrink: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Roadmap Grid layout */
                .tg-roadmap-grid-p {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                @media (max-width: 991px) {
                    .tg-roadmap-grid-p {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
                .timeline-box {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border-radius: 20px;
                    padding: 24px;
                    border-left: 6px solid #cbd5e1;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    height: 100%;
                }
                .timeline-box:hover {
                    transform: translateY(-5px);
                }
                
                .timeline-box.trimester-1 { border-left-color: #10b981; }
                .timeline-box.trimester-1:hover { box-shadow: 0 12px 30px rgba(16, 185, 129, 0.15); border-left-color: #059669; }
                
                .timeline-box.trimester-2 { border-left-color: #f59e0b; }
                .timeline-box.trimester-2:hover { box-shadow: 0 12px 30px rgba(245, 158, 11, 0.15); border-left-color: #d97706; }
                
                .timeline-box.trimester-3 { border-left-color: #ef4444; }
                .timeline-box.trimester-3:hover { box-shadow: 0 12px 30px rgba(239, 68, 68, 0.15); border-left-color: #b91c1c; }

                .timeline-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                }
                .timeline-desc {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: #475569;
                    margin: 0 0 16px 0;
                }
                .timeline-bullets {
                    padding-left: 18px;
                    margin: 0;
                }
                .timeline-bullets li {
                    font-size: 0.88rem;
                    color: #475569;
                    line-height: 1.55;
                    margin-bottom: 8px;
                }

                /* Centered premium modal */
                .tg-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(12px);
                    z-index: 2500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    transition: opacity 0.3s ease;
                }
                .tg-modal-content {
                    background: rgba(255, 255, 255, 0.98);
                    width: 100%;
                    max-width: 800px;
                    border-radius: 28px;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.22);
                    padding: 28px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    animation: scaleUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes scaleUpModal {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .tg-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(241, 245, 249, 0.8);
                    padding-bottom: 14px;
                    flex-shrink: 0;
                }
                .tg-modal-title {
                    font-size: 1.35rem;
                    font-weight: 900;
                    color: #1e293b;
                    margin: 0;
                    line-height: 1.35;
                }
                
                .tg-modal-grid-body {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    gap: 24px;
                    overflow: hidden;
                    flex: 1;
                }
                
                .tg-modal-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    overflow-y: auto;
                }
                
                .tg-modal-right-col {
                    overflow-y: auto;
                    padding-right: 12px;
                    font-size: 1.02rem;
                    color: #334155;
                    line-height: 1.85;
                    text-align: justify;
                    white-space: pre-line;
                    font-family: Georgia, serif;
                }
                .tg-modal-right-col::-webkit-scrollbar {
                    width: 6px;
                }
                .tg-modal-right-col::-webkit-scrollbar-track {
                    background: transparent;
                }
                .tg-modal-right-col::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .tg-modal-right-col::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .tg-story-cover-wrapper {
                    border-radius: 18px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    display: flex;
                    flex-direction: column;
                }

                .tg-story-cover {
                    width: 100%;
                    height: 160px;
                    object-fit: cover;
                }

                .tg-story-moral-badge {
                    padding: 12px;
                    background: #fffbeb;
                    color: #b45309;
                    font-size: 0.76rem;
                    font-weight: 700;
                    line-height: 1.45;
                    border-top: 1px solid #fef3c7;
                }

                .tg-audio-player-card {
                    background: linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%);
                    border: 1px solid #ddd6fe;
                    padding: 16px;
                    border-radius: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .tg-player-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.78rem;
                    font-weight: 800;
                    color: #6d28d9;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .tg-player-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tg-play-btn {
                    background: #7c3aed;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 10px;
                    font-weight: 700;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
                }

                .tg-play-btn:hover {
                    background: #6d28d9;
                    transform: translateY(-1px);
                }

                .tg-track-select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 10px;
                    border: 1px solid #ddd6fe;
                    font-size: 0.78rem;
                    font-weight: 600;
                    outline: none;
                    background: white;
                    color: #4c1d95;
                    cursor: pointer;
                }

                /* Visualizer animation */
                .tg-music-visualizer {
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    gap: 4px;
                    height: 24px;
                    margin-top: 4px;
                }

                .tg-music-visualizer .bar {
                    width: 4px;
                    height: 5px;
                    background: #7c3aed;
                    border-radius: 2px;
                    animation: bounceVisualizer 0.8s ease-in-out infinite alternate;
                }

                .tg-music-visualizer .bar:nth-child(2) { animation-delay: 0.15s; }
                .tg-music-visualizer .bar:nth-child(3) { animation-delay: 0.3s; }
                .tg-music-visualizer .bar:nth-child(4) { animation-delay: 0.45s; }

                @keyframes bounceVisualizer {
                    0% { height: 4px; }
                    100% { height: 20px; }
                }

                .tg-modal-footer {
                    margin-top: 20px;
                    padding-top: 14px;
                    border-top: 1px solid rgba(241, 245, 249, 0.8);
                    flex-shrink: 0;
                }
                @media (max-width: 767px) {
                    .tg-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .tg-modal-content {
                        border-radius: 28px 28px 0 0;
                        padding: 20px 24px calc(20px + env(safe-area-inset-bottom, 0px)) 24px;
                        max-height: 90vh;
                    }
                    .tg-modal-grid-body {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                    .tg-modal-left-col {
                        overflow-y: visible;
                    }
                    .tg-modal-right-col {
                        overflow-y: visible;
                        padding-right: 0;
                    }
                }

                .modal-btn {
                    padding: 14px;
                    border-radius: 14px;
                    font-size: 1rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                }
                .submit-btn {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: white;
                    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.2);
                    transition: all 0.2s ease;
                }
                .submit-btn:hover {
                    opacity: 0.95;
                    box-shadow: 0 10px 24px rgba(124, 58, 237, 0.25);
                }
                
                /* Extra layout for library scrollbar & youtube card hover */
                .custom-scrollbar-tg::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar-tg::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-tg::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar-tg::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
