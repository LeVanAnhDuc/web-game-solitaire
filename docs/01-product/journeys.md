# Luồng người dùng

> **Trả lời:** Người dùng đi qua những luồng nào từ đầu đến cuối?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** có luồng người dùng mới · một luồng cũ đổi bản chất

## US-01 · Mở lên và chơi ván đầu

**Bối cảnh:** Người chơi mở địa chỉ trang trên điện thoại, chưa từng vào bao giờ, không đăng nhập gì.

**Các bước:**
1. Trang mở ra với một ván đã chia sẵn — không có màn hình chờ, không có nút "Bắt đầu".
2. Người chơi chạm một lá bài ngửa. Lá đó và các lá nằm dưới nó trong cùng dãy được đánh dấu là đang chọn.
3. Người chơi chạm vào chồng đích. Nếu nước đi hợp lệ, bài chuyển sang; nếu không, lựa chọn bị bỏ và chồng đích nháy đỏ một nhịp.
4. Khi hết nước, người chơi chạm chồng bài úp để rút lá mới.

**Kết quả mong đợi:** Bàn bài đổi đúng theo luật Klondike sau mỗi nước; không có trạng thái nào cần chờ tải.

**Điều gì có thể sai:**
- Chạm vào vùng trống giữa hai chồng → phải bỏ lựa chọn, không được coi là nước đi.
- Chạm lá thứ hai trong khi đã chọn lá thuộc cùng chồng → coi là đổi lựa chọn, không phải nước đi vào chính mình.
- Màn hình hẹp hơn bảy cột bài xếp vừa → bàn bài phải co lại chứ không được tràn ngang.
- Chạm chồng bài úp khi nó đã rỗng → phải là nước lật lại (recycle), không phải nước vô hiệu.

**Chức năng liên quan:** FR-01 · FR-02 · FR-03 · FR-08

---

## US-02 · Kéo thả bằng chuột trên máy tính

**Bối cảnh:** Người chơi quen Solitaire trên máy tính, phản xạ là bấm giữ rồi kéo.

**Các bước:**
1. Bấm giữ một lá ngửa và kéo. Lá đó cùng dãy dưới nó đi theo con trỏ.
2. Thả lên một chồng đích.
3. Nếu hợp lệ, bài đáp xuống chồng đó; nếu không, bài bay ngược về chỗ cũ.

**Kết quả mong đợi:** Cùng một nước đi cho ra cùng một kết quả, dù thực hiện bằng chạm hay bằng kéo.

**Điều gì có thể sai:**
- Kéo rồi thả ngay tại chỗ cũ → phải hiểu là một cú chạm chọn bài, không phải nước đi hỏng.
- Nhả chuột ngoài cửa sổ trình duyệt → phải huỷ kéo, trả bài về chỗ cũ, không kẹt lại trạng thái đang kéo.
- Thả lên vùng chồng lấn giữa hai chồng → chọn chồng có phần chồng lấn lớn hơn, không chọn theo thứ tự DOM.

**Chức năng liên quan:** FR-04

---

## US-03 · Đẩy nhanh phần cuối ván

**Bối cảnh:** Người chơi đã lật hết bài, phần còn lại chỉ là bê từng lá lên bốn chồng đích — đoạn nhàm chán nhất của Klondike.

**Các bước:**
1. Người chơi chạm đúp một lá bất kỳ; lá tự bay lên chỗ hợp lệ nếu có.
2. Khi cả bàn không còn lá úp và chồng rút đã cạn, nút **Hoàn tất** hiện lên.
3. Chạm **Hoàn tất**; các lá lần lượt bay lên foundation cho đến khi hết bài.

**Kết quả mong đợi:** Ván kết thúc thắng, màn mừng hiện ra.

**Điều gì có thể sai:**
- Chạm đúp một lá không có chỗ đi hợp lệ → không xảy ra gì, và cũng không được ghi một nước rỗng vào lịch sử (nếu ghi thì undo sẽ có nước "không làm gì").
- Bấm **Hoàn tất** rồi bấm Undo giữa chừng → phải dừng chuỗi tự động lại, không đánh nhau với thao tác của người chơi.
- Nút **Hoàn tất** hiện khi vẫn còn lá úp → sai điều kiện, chuỗi tự động sẽ kẹt giữa chừng.

**Chức năng liên quan:** FR-05 · FR-06

---

## US-04 · Đi lại nước vừa rồi

**Bối cảnh:** Người chơi vừa đẩy một lá lên foundation và nhận ra mình cần nó ở dưới tableau.

**Các bước:**
1. Chạm **Hoàn lại**.
2. Bàn bài trở về đúng trạng thái trước nước đó, kể cả lá vừa được lật lên thì lật úp lại.
3. Lặp lại đến tận đầu ván nếu muốn.

**Kết quả mong đợi:** Không có giới hạn số lần; ở đầu ván thì nút tắt.

**Điều gì có thể sai:**
- Undo một nước rút bài ở chế độ rút 3 → cả ba lá phải về đúng vị trí cũ trong chồng rút, đúng thứ tự.
- Undo qua một nước đã làm lật một lá → lá đó phải úp trở lại. Đây là chỗ dễ sai âm thầm nhất của cả ván.

**Chức năng liên quan:** FR-07

---

## US-05 · Chơi ván khác

**Bối cảnh:** Ván hiện tại bí, hoặc người chơi vừa thắng và muốn chơi tiếp.

**Các bước:**
1. Chạm **Ván mới** để lấy một thế bài khác, hoặc **Chơi lại** để chia lại đúng thế bài đang chơi từ đầu.
2. Có thể đổi giữa **rút 1 lá** và **rút 3 lá** trước hoặc trong ván.

**Kết quả mong đợi:** Bàn bài về trạng thái đầu ván tương ứng; số hiệu ván (seed) hiện trên màn hình.

**Điều gì có thể sai:**
- Đổi chế độ rút giữa ván → phải nói rõ là ván sẽ bắt đầu lại, và phải hỏi trước khi bỏ ván đang chơi dở.
- Bấm **Ván mới** giữa chuỗi bài tự bay lên → chuỗi phải dừng trước khi ván mới được chia.

**Chức năng liên quan:** FR-09 · FR-10
