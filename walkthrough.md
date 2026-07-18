# Nhật ký công việc hoàn thành (Walkthrough - Dinh dưỡng & Sổ khám bệnh)

Tài liệu này ghi lại toàn bộ các cải tiến và công việc đã thực hiện trên ứng dụng Thai Kỳ NextJS, giúp các trợ lý AI hoặc lập trình viên tiếp theo nắm được cấu trúc hiện tại.

---

## 1. Sổ khám thai (`/admin/sokhambenh`)

### Tính năng chênh lệch cân nặng:
- **Mẹ bầu**: Tự động tính chênh lệch cân nặng giữa các lần khám liên tiếp. Hiển thị dạng `+- X kg` màu xanh lá (tăng cân), màu đỏ (giảm cân) hoặc màu xám (giữ nguyên) kế bên cân nặng mới.
- **Em bé**: Tự động tính chênh lệch cân nặng của bé. Nếu chênh lệch `< 1kg`, hệ thống tự động đổi đơn vị hiển thị sang gram (`g`) trực quan (ví dụ: `+150g`), nếu `>= 1kg` thì giữ nguyên đơn vị `kg` (ví dụ: `+1.2kg`).
- **Khắc phục lỗi trùng lặp ảnh (Double images)**: Khi chỉnh sửa một phiếu khám cũ và lưu lại, hệ thống sẽ so sánh danh sách ảnh trong form với danh sách ảnh gốc của phiếu khám, chỉ thêm những ảnh mới chọn vào Album (`photos` collection), ngăn chặn tình trạng trùng lặp/nhân đôi ảnh đơn thuốc trong Album.

---

## 2. Nhật ký dinh dưỡng (`/admin/dinh-duong`)

### Cơ sở dữ liệu và Thuật toán:
- **Mở rộng dữ liệu**: Thêm hơn 100 món ăn Việt Nam phổ biến vào `CALORIE_DB` (thực đơn trưa, tối, các loại súp, cá kho, canh cải thịt băm, canh khoai mỡ, cơm tấm, xôi, hạt...), hỗ trợ các từ khóa viết sai chính tả hoặc đa vùng miền (`đậu hủ/đậu hũ/đậu phụ`, `súp/soup`, `hủ tíu/hủ tiếu`).
- **Bóc tách Calo tự động (`parseMealFoods`)**: Thuật toán sắp xếp từ khóa theo chiều dài giảm dần, quét và nhận diện đồng thời nhiều món ăn trong bữa ăn tự do mà mẹ bầu nhập vào, cộng dồn tổng lượng Calo chính xác và hiển thị các tag món ăn đã phát hiện.
- **Số thứ tự (STT)**: Đánh số thứ tự các bữa ăn nạp vào trong ngày theo mốc thời gian thực tế (`#1`, `#2`, `#3`...).
- **Phân trang**: Giới hạn hiển thị tối đa **2 ngày gần nhất** trên mỗi trang để tăng hiệu năng và tối ưu hóa quota đọc dữ liệu Firestore.

### Biểu đồ & Lời khuyên (Cột bên trái):
- **Biểu đồ cột SVG 7 ngày**: So sánh lượng calo nạp 7 ngày gần nhất với đường mục tiêu `2200 kcal` (Goal Line). Đánh dấu cột ngày hiện tại bằng chấm hồng. Đổi màu cột linh hoạt (Đỏ: quá cao, Vàng: thiếu calo, Xanh: lý tưởng).
- **Lời khuyên Tam cá nguyệt**: Tự động tính tuần thai hiện tại dựa trên ngày LMP của mẹ bầu để active sẵn tab lời khuyên tương ứng (kèm badge "Bạn 👩‍⚕️"). Mẹ vẫn có thể chuyển đổi giữa TCN 1, 2, 3 để tham khảo vi chất và thực phẩm cần tránh.
- **Giao diện Accordion gọn gàng**: Chuyển các chức năng biểu đồ và lời khuyên thành các nút bấm thu gọn/mở rộng riêng biệt để tiết kiệm không gian màn hình thiết bị di động.

---

## 3. Cấu trúc Component được Tách nhỏ (Modularization)

Mã nguồn trang Dinh dưỡng đã được phân tách từ file đơn lẻ dài hơn 2000 dòng thành 6 component độc lập đặt tại [src/components/nutrition/](file:///Applications/XAMPP/xamppfiles/htdocs/thaiky-NextJS/src/components/nutrition/):

1. **`CalorieMiniChart.tsx`**: Render biểu đồ cột SVG calo 7 ngày.
2. **`TrimesterAdviceCard.tsx`**: Quản lý tab lời khuyên tam cá nguyệt 1, 2, 3.
3. **`MealModal.tsx`**: Bottom Sheet thêm/sửa bữa ăn và nhận diện calo món ăn (đã sửa lỗi thiết kế nút đóng "X").
4. **`FoodLookup.tsx`**: Tab Tra cứu thực phẩm an toàn/hạn chế/cấm.
5. **`WeeklyMenuGuide.tsx`**: Tab gợi ý thực đơn vàng 7 ngày và cách giảm triệu chứng thai kỳ.
6. **`WeightGuide.tsx`**: Tab công cụ tính BMI trước bầu và bảng 6 vi chất vàng.

---

## 4. Trạng thái kiểm thử & Biên dịch (Validation)
- Đã kiểm tra biên dịch bằng TypeScript (`npx tsc --noEmit`).
- Toàn bộ component cấu trúc mới đều là **Type-safe** và không có lỗi cú pháp.
