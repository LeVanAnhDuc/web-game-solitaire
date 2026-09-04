# Bất biến chịu lực

> **Trả lời:** Sửa gì thì hệ thống sai **âm thầm** — test vẫn xanh mà kết quả vẫn sai?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** phát hiện một bất biến mới — thường là ngay sau khi ai đó vừa phá nó

<!-- Đã rà theo dự án 2026-09-04. Mặc định của scaffold viết cho app có server, DB và
tài khoản; dự án này không có thứ nào trong đó nên chúng đã được thay bằng bất biến
thật của một engine bài. -->

| # | Bất biến | Vi phạm thì sao |
| --- | --- | --- |
| 1 | `src/game/` **không import React, DOM, Next hay bất cứ thứ gì của trình duyệt** | Luật chơi hết test được nếu không render. Phát hiện rất muộn, và lúc đó gỡ ra rất đắt |
| 2 | **Chỉ `applyMove` được đổi thế bài.** Component không splice, không push vào mảng bài | Bàn bài trên màn hình đúng, nhưng phát lại từ seed ra thế khác. Undo bắt đầu trả về thế bài lạ, không tài nào lần ra từ đâu |
| 3 | **Không `Math.random`, không `Date.now`, không đọc thời gian trong `src/game/`.** Ngẫu nhiên chỉ đến từ seed truyền vào | Cùng seed ra hai thế bài khác nhau. Test vẫn xanh vì mỗi lần chạy tự nhất quán với chính nó |
| 4 | `applyMove` **thuần và không đột biến đối số** — trả state mới, không sửa state cũ | Lịch sử `Move[]` phát lại ra kết quả khác lần đầu, vì các state cũ đã bị sửa ngầm |
| 5 | Trạng thái úp/ngửa **suy ra từ vị trí** (`down` hay `up`), không có cờ `faceUp` trên lá bài | Hai nguồn sự thật lệch nhau: lá nằm trong `up` mà cờ nói úp. UI vẽ đúng, luật tính sai |
| 6 | **Tap và drag phải dựng cùng một `Move` rồi đi qua cùng `applyMove`** | Hai bộ luật song song, lệch dần theo thời gian. Một nước hợp lệ khi kéo lại vô hiệu khi chạm |
| 7 | Một thao tác **không sinh nước đi hợp lệ thì không được ghi vào `history`** | Lịch sử có nước rỗng; Undo bấm một cái mà bàn bài không đổi, người chơi tưởng nút hỏng |
| 8 | Mọi lá bài mang **`id` ổn định suốt ván** và `id` là `key` của React | React tái dùng nhầm DOM node giữa các lá; hiệu ứng chuyển động gán sai lá, thỉnh thoảng lá hiện sai mặt trong một khung hình |
| 9 | Chuỗi tự hoàn tất phải **huỷ được**, và mọi thao tác của người chơi huỷ nó ngay | Nước tự động và nước tay chen nhau vào cùng `history`, cho ra thế bài không ai dựng lại được |
| 10 | Không đọc/ghi `localStorage`, `cookie`, không `fetch` ra ngoài — xem NFR-DATA-01 | Dự án âm thầm có trạng thái tồn tại qua các phiên; bug "chỉ xảy ra trên máy tôi" bắt đầu từ đây |
