# 🤰 ThaiKyPro - Ứng Dụng Chăm Sóc Thai Kỳ & Theo Dõi Tăng Trưởng Trẻ Sơ Sinh

Chào mừng bạn đến với **ThaiKyPro** — ứng dụng mã nguồn mở hiện đại được xây dựng để giúp các cặp vợ chồng cùng nhau theo dõi sức khỏe thai kỳ và chăm sóc bé sơ sinh trong thời gian thực.

Dự án được tối ưu hóa giao diện di động (Mobile-first UX/UI) với phong cách thiết kế glassmorphic cao cấp, hiệu ứng chuyển động mượt mà và chế độ đồng bộ gia đình thông minh.

---

## ✨ Các Tính Năng Nổi Bật

1. **🏡 Trang Chủ Toàn Cảnh (Dashboard)**
   - Cung cấp cái nhìn toàn diện về tuần thai hiện tại, cân nặng, lịch khám thai sắp tới và chỉ số sức khỏe gần nhất.
   - Trợ lý thai kỳ thông minh tự động phân tích dữ liệu hàng ngày để đưa ra lời khuyên hữu ích kịp thời.
2. **👨‍👩‍👦 Đồng Bộ Gia Đình (Partner Sync)**
   - Kết nối hai tài khoản (vợ - chồng) thông qua mã liên kết bảo mật (Link Code / UID).
   - Đồng bộ hóa dữ liệu thời gian thực (Real-time sync) của nhật ký bé, lịch khám, tài chính, dinh dưỡng và sức khỏe.
   - Tài khoản phụ (bạn đời) được phân quyền bảo vệ an toàn (chỉ xem và cập nhật nhật ký, không được phép xóa dữ liệu gốc hoặc thay đổi cấu hình y khoa nhạy cảm).
3. **📈 Biểu Đồ Tăng Trưởng Trẻ Sơ Sinh (WHO Percentiles)**
   - Nhập cân nặng và chiều cao của bé để chấm điểm phần trăm tăng trưởng theo tiêu chuẩn khoa học của Tổ chức Y tế Thế giới (WHO).
   - Tự động hiển thị thanh thước đo trực quan cảnh báo trạng thái bé phát triển bình thường, cận dưới hay suy dinh dưỡng/thừa cân.
4. **📅 Sổ Khám Thai & Lịch Hẹn Định Kỳ**
   - Lập danh sách các mốc khám thai quan trọng với chi tiết xét nghiệm y khoa cần thực hiện (như Double/Triple Test, nghiệm pháp đường huyết, tiêm uốn ván...).
   - Nhắc nhở chuẩn bị hồ sơ và các câu hỏi cần thảo luận cùng bác sĩ.
5. **💰 Sổ Chi Tiêu & Lời Khuyên Tài Chính Thai Sản**
   - Quản lý ngân sách mua sắm đồ đi sinh và khám chữa bệnh.
   - Cẩm nang tài chính khuyên dùng về Bảo hiểm y tế, bảo hiểm tư nhân và phân bổ quỹ khẩn cấp.
6. **🍎 Dinh Dưỡng & Theo Dõi Sức Khỏe**
   - Ghi nhật ký bữa ăn hàng ngày để tự động tính calo và nhắc nhở uống vitamin bổ sung.
   - Lưu trữ chỉ số huyết áp, nhịp tim và đường huyết thai kỳ với biểu đồ xu hướng cảnh báo tiền sản giật và tiểu đường thai kỳ.
7. **🎵 Thai Giáo Cho Bé (Story & Music Player)**
   - Nghe nhạc thai giáo thư giãn với các bản nhạc cổ điển hoặc tiếng mưa tự nhiên.
   - Đọc truyện kể thai giáo giàu tính nhân văn với giao diện đọc sách chuyên nghiệp.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js (App Router), React, TypeScript.
- **Styling**: Vanilla CSS, React Icons.
- **Backend / Database**: Google Firebase (Firestore, Authentication, Analytics).
- **Cơ chế Offline**: Firestore Local Cache (hỗ trợ ghi chép dữ liệu ngay cả khi mất mạng internet và tự động đồng bộ khi có kết nối trở lại).

---

## 🚀 Hướng Dẫn Cài Đặt Chi Tiết

### 1. Chuẩn bị tài nguyên Firebase
Bạn cần tạo một dự án Firebase tại [Firebase Console](https://console.firebase.google.com/):
- **Authentication**: Kích hoạt đăng nhập bằng **Email/Password** và **Google Sign-In**.
- **Cloud Firestore**: Tạo cơ sở dữ liệu ở chế độ Production hoặc Test.

### 2. Cấu hình môi trường (`.env.local`)
1. Nhân bản file mẫu `.env.example` thành `.env.local` ở thư mục gốc:
   ```bash
   cp .env.example .env.local
   ```
2. Điền đầy đủ thông tin API Key từ cài đặt dự án Firebase của bạn vào file `.env.local`.

### 3. Cấu hình Bảo mật Firestore (`firestore.rules`)
Để bảo vệ thông tin y tế nhạy cảm của người dùng và cho phép cơ chế đồng bộ giữa vợ chồng hoạt động an toàn, hãy sao chép nội dung file `firestore.rules` vào phần **Rules** của Cloud Firestore trên Firebase Console, hoặc deploy trực tiếp bằng Firebase CLI:
```rules
# Xem chi tiết rules bảo mật trong file firestore.rules tại thư mục gốc
```

### 4. Khởi chạy ứng dụng
Cài đặt các thư viện cần thiết và khởi chạy server phát triển:
```bash
npm install
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để kiểm nghiệm ứng dụng.

---

## ⚠️ Lưu Ý Quan Trọng Khi Đưa Lên GitHub (Open-source)

Nếu bạn muốn dự án này được cộng đồng đón nhận tốt và hoạt động an toàn, hãy lưu ý:

1. **Không Cam Kết Khóa Bí Mật (Secrets Warning)**
   - Đảm bảo file `.env.local` luôn nằm trong `.gitignore` để tránh đẩy trực tiếp API Key thật của bạn lên GitHub. Cộng đồng sẽ tự điền Key của họ qua `.env.example`.
2. **Quy Tắc Bảo Mật Firestore (Database Security Rules)**
   - Luôn đính kèm file `firestore.rules` trong repo. Nếu không có rules này, dữ liệu của người dùng có thể bị đọc/ghi tự do bởi bất kỳ ai có API key.
3. **Quản lý Hạn mức Firebase (Free Tier limits)**
   - Khi cộng đồng sử dụng chung hoặc deploy thử nghiệm lớn, hạn mức đọc/ghi của Firebase (Spark Plan miễn phí: 50,000 lượt đọc/ngày, 20,000 lượt ghi/ngày) có thể hết nhanh. Cơ chế offline caching của ứng dụng này đã giúp giảm số lượt đọc/ghi thừa thãi, nhưng bạn vẫn nên hướng dẫn mọi người deploy dự án Firebase cá nhân thay vì sử dụng chung một database.
4. **Dữ Liệu Mẫu (Seed Data)**
   - Nên cung cấp một bộ dữ liệu mẫu (như danh sách kiêng kỵ, dinh dưỡng chuẩn, danh mục đi sinh gợi ý) dưới dạng file JSON hoặc hướng dẫn import, giúp người dùng mới thiết lập ứng dụng có ngay trải nghiệm đầy đủ mà không cần tự gõ dữ liệu từ đầu.
5. **Chọn Giấy Phép Sử Dụng (License)**
   - Đính kèm một tệp `LICENSE` (ví dụ: MIT License) để người dùng có thể tự do chỉnh sửa, học tập, đóng góp ý kiến hoặc phát triển nhánh riêng một cách hợp pháp.

---

## 🤝 Đóng Góp Ý Kiến & Hỗ Trợ

Mọi đóng góp nhằm tối ưu hiệu năng, cải tiến UI/UX hoặc bổ sung các tính năng thai giáo mới đều được chào đón. Bạn có thể gửi phản hồi và đóng góp qua các kênh sau:
- **GitHub**: Tạo một Pull Request hoặc mở Issue trực tiếp trên repository này.
- **Email trực tiếp**: Mọi thắc mắc, đề xuất hợp tác hoặc feedback ngoài GitHub, vui lòng gửi về hòm thư [vietnam.tri@gmail.com](mailto:vietnam.tri@gmail.com).

*Chúc các mẹ bầu có một thai kỳ khỏe mạnh và hạnh phúc!* 🌸
