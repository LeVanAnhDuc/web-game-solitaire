# ADR-0003 · Vẽ bài bằng DOM, dành canvas riêng cho màn mừng thắng

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** FR-08 · FR-11 · FR-12 · NFR-A11Y-02 · NFR-A11Y-03 · NFR-A11Y-04

## 1. Bối cảnh

Bàn Klondike có tối đa 52 phần tử động. Hai cách vẽ thông dụng: mỗi lá là một phần tử DOM, hoặc toàn bộ bàn vẽ trên canvas 2D. Dự án có yêu cầu tiếp cận khá nặng — chơi được hoàn toàn bằng bàn phím, mỗi lá có nhãn đọc được, vùng chạm ≥ 44px — và một yêu cầu hiệu ứng duy nhất: màn bài đổ xuống khi thắng.

## 2. Quyết định

Bàn bài vẽ bằng DOM: mỗi lá là một phần tử React có `id` làm `key`, di chuyển bằng CSS transition. Riêng màn mừng thắng vẽ trên một `<canvas>` phủ toàn màn hình, gắn vào chỉ khi ván thắng và gỡ ra khi bắt đầu ván mới.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| Canvas 2D cho toàn bộ bàn bài | Phải tự viết hit-testing, tự dựng lại toàn bộ lớp tiếp cận cho bàn phím và screen reader, và Playwright không chọn được phần tử nào bên trong. Trả giá đó cho một bàn 52 phần tử là không đáng — hiệu năng chưa bao giờ là ràng buộc ở đây |
| DOM cho tất cả, kể cả màn thắng | Hiệu ứng bài đổ có hàng trăm vệt bài nảy đồng thời; làm bằng DOM là ép trình duyệt bố cục lại liên tục, đúng ca mà canvas sinh ra để giải |

## 4. Hệ quả

**Được:**
- Tiếp cận, focus, tab order, `prefers-reduced-motion` là hành vi có sẵn của trình duyệt chứ không phải thứ phải viết lại.
- E2E chọn được từng lá bài theo nhãn, nên test đọc như mô tả nước đi thật.
- Không cần thư viện animation nào.

**Mất / phải chấp nhận:**
- Có hai hệ vẽ trong một dự án, dùng cho một hiệu ứng duy nhất. Chấp nhận vì canvas kia hoàn toàn tách rời: nó chỉ đọc danh sách lá đã thắng và không tham gia vào luật.
- Hiệu ứng bài bay phụ thuộc cách React tái dùng node; bất biến 8 (`id` ổn định làm `key`) là điều kiện để nó không nhảy lung tung.

**Điều kiện xem lại quyết định này:** nếu bàn bài có lúc vượt vài trăm phần tử động, hoặc đo được rớt khung hình khi bài chuyển động trên máy tầm trung.
