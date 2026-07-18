# Kế hoạch phát triển & Mở rộng chế độ "Sau sinh & Nuôi con" (Baby Tracker)

Bản kế hoạch này phác thảo kiến trúc, cơ sở dữ liệu và giao diện để mở rộng ứng dụng Thai Kỳ sang giai đoạn sau sinh (Postpartum) và chăm sóc trẻ sơ sinh, học hỏi từ các tiêu chuẩn của các ứng dụng quốc tế hàng đầu như **Huckleberry**, **BabyCenter**, và **Sprout Baby**.

---

## 1. Chuyển đổi trạng thái tài khoản (Mode Switching)

### Cấu trúc cơ sở dữ liệu (Firestore - `users/{uid}`):
- Thêm trường `appMode: 'pregnancy' | 'postpartum'` vào Profile.
- Thêm thông tin của bé:
  ```json
  {
    "babyInfo": {
      "name": "Tên hoặc Biệt danh của bé",
      "dob": "2026-07-18",
      "gender": "boy | girl | twins",
      "birthWeight": 3200, // gram
      "birthHeight": 50 // cm
    }
  }
  ```

### Giao diện điều hướng:
- Tại trang Settings/Hồ sơ, thêm một nút chuyển đổi nổi bật: **"Bé đã chào đời? Chuyển sang chế độ Nuôi Con 👩‍🍼"**.
- Khi chuyển đổi, toàn bộ Dashboard chính sẽ thay đổi nội dung từ đếm tuần thai sang đếm **Số tháng & ngày tuổi của bé** (ví dụ: *"Bé Cá Heo • 2 tháng 15 ngày tuổi"*).

---

## 2. Theo dõi tăng trưởng chuẩn WHO (Baby Growth Percentiles)

Học hỏi từ công cụ chuẩn của **WHO Growth Standards**:

### Chức năng chính:
- **Ghi chép định kỳ**: Lưu cân nặng (g/kg), chiều cao (cm), và vòng đầu (cm) hàng tháng của bé.
- **Biểu đồ phân vị (Percentile Chart)**: Vẽ biểu đồ tăng trưởng của bé đè lên các đường phân vị chuẩn của WHO (đường 3rd, 15th, 50th - Trung bình, 85th, 97th percentile). 
- **Cảnh báo sớm**: Đưa ra cảnh báo nếu bé có xu hướng rơi vào nhóm suy dinh dưỡng (< 3rd percentile) hoặc nguy cơ béo phì (> 97th percentile).

---

## 3. Lịch tiêm chủng y khoa tự động (Vaccination Scheduler)

Thiết kế dựa trên chương trình Tiêm chủng mở rộng của **Bộ Y tế Việt Nam & khuyến nghị CDC**:

### Tính năng:
- **Tự động lên lịch**: Dựa vào ngày sinh (`dob`) của bé để tự động tạo danh sách các mũi tiêm cần thiết theo từng mốc tuổi:
  - **Sơ sinh**: Lao (BCG), Viêm gan B mũi 0.
  - **2, 3, 4 tháng**: Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm màng não mủ (Hib) - Mũi 5in1/6in1, Phế cầu, Rota virus.
  - **9 tháng**: Sởi mũi 1, Viêm não Nhật Bản.
  - **12 tháng**: Sởi - Quai bị - Rubella (MMR), Thủy đậu.
  - **18 - 24 tháng**: Nhắc lại các mũi 6in1, Viêm não Nhật Bản mũi 2.
- **Trạng thái tiêm chủng**: Đánh dấu `Đã tiêm` (kèm ngày tiêm thực tế, tên vắc-xin tự chọn/dịch vụ) hoặc `Chưa tiêm` (hiển thị trạng thái "Đã đến lịch" hoặc "Sắp đến lịch").

---

## 4. Cẩm nang phát triển của bé theo từng tháng tuổi (Baby Milestones)

Thay thế cẩm nang tuần thai bằng cẩm nang phát triển của trẻ từ 0 - 24 tháng tuổi:

### Nội dung bao gồm:
- **Vận động thô**: Lẫy, lật, ngồi vững, bò, đứng chững, đi chập chững.
- **Ngôn ngữ & Giao tiếp**: Biết cười xã hội, hóng chuyện, ê a, gọi "ba ba", "ma ma", hiểu các khẩu lệnh đơn giản.
- **Nhận thức & Giác quan**: Nhìn theo đồ vật di động, phân biệt âm thanh quen thuộc, nhận ra người thân.
- **Hướng dẫn tương tác**: Các bài tập vận động tinh, trò chơi kích thích thị giác/thính giác và lịch sinh hoạt mẫu (Easy 2, Easy 3, Easy 4).

---

## 5. Dinh dưỡng & Phục hồi sức khỏe cho mẹ sau sinh (Postpartum Recovery)

Giao diện Dinh dưỡng sẽ tự động chuyển sang chế độ hỗ trợ mẹ nuôi con:

### Chức năng dinh dưỡng:
- **Lợi sữa (Lactation Support)**: Thực đơn các món ăn giàu dinh dưỡng tăng lượng sữa và chất lượng sữa (các loại hạt, đu đủ xanh, thì là, yến mạch, thịt nạc, nước ấm).
- **Giảm cân an toàn (Safe Weight Loss)**: Hướng dẫn thâm hụt calo nhẹ nhàng không gây ảnh hưởng đến lượng sữa mẹ (mục tiêu khoảng 1800 - 2000 kcal/ngày cho mẹ cho con bú).
- **Tránh tắc tia sữa**: Cẩm nang xử lý tắc tia sữa sớm, tư thế bú đúng khớp, cách massage bầu ngực và lịch hút sữa/vắt sữa khoa học.
- **Theo dõi lượng nước uống**: Nhắc nhở mẹ uống đủ 2.5 - 3 lít nước mỗi ngày (rất quan trọng để tạo sữa).
