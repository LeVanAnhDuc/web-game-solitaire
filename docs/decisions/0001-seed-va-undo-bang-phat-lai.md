# ADR-0001 · Sinh thế bài từ seed và hoàn lại nước đi bằng cách phát lại lịch sử

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** FR-01 · FR-07 · FR-09 · NFR-PERF-06

## 1. Bối cảnh

Game cần ba thứ liên quan chặt với nhau: chia bài ngẫu nhiên, "Chơi lại" đúng ván đang chơi, và Hoàn lại không giới hạn số lần. Ràng buộc đi kèm: bộ test luật phải tái tạo được một thế bài cụ thể, nếu không thì mọi test luật đều phải tự dựng bàn bài bằng tay.

## 2. Quyết định

Thế bài là hàm thuần của một số nguyên seed: `deal(seed, drawMode)`. Trạng thái ván sống trong `useGame` dưới đúng hai biến — `seed` và `history: Move[]` — và state hiện tại luôn được tính lại bằng `history.reduce(applyMove, deal(seed, drawMode))`.

Từ đó cả ba chức năng là cùng một cơ chế: Hoàn lại là bỏ phần tử cuối của `history`, Chơi lại là `history = []`, Ván mới là seed mới. PRNG là mulberry32 tự viết (khoảng 10 dòng), xáo bài bằng Fisher–Yates lấy số từ nó.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| Lưu ảnh chụp `GameState` sau mỗi nước | Tốn bộ nhớ tuyến tính và, nặng hơn, che mất lỗi đột biến state: một `applyMove` sửa nhầm đối số vẫn cho undo đúng, nên bug chỉ lộ ra ở chỗ khác rất xa |
| Viết hàm nghịch đảo cho từng loại nước (`undoMove`) | Bộ luật thứ hai phải khớp bộ thứ nhất. Nghịch đảo của một nước rút ở chế độ rút 3 khi chồng bài sắp cạn là ca kinh điển sai âm thầm |
| `Math.random` và không seed | "Chơi lại" phải sao chép trạng thái đầu ván, và mọi test luật mất khả năng tái tạo thế bài |

## 4. Hệ quả

**Được:**
- Ba chức năng chỉ tốn một cơ chế; không có bộ luật thứ hai để giữ đồng bộ.
- Test luật cố định seed là dựng lại được đúng ván, kể cả ván đã gây lỗi.
- Trạng thái cần giữ trong bộ nhớ nhỏ và tự mô tả — một số và một mảng nước đi.

**Mất / phải chấp nhận:**
- `applyMove` **buộc** phải thuần tuyệt đối. Một lần lỡ đột biến đối số hay đọc `Date.now()` là undo sai — cái giá của phương án này nằm trọn ở đây, nên nó thành bất biến 3 và 4 trong `invariants.md` và có test riêng canh.
- Mỗi lần undo phải tính lại cả ván. Với 52 lá và cỡ trăm nước thì không đáng kể, và NFR-PERF-06 là chỗ canh giả định đó.

**Điều kiện xem lại quyết định này:** nếu sau này có tính năng lưu ván dài hoặc phát lại có tua, và benchmark cho thấy phát lại vượt 16ms.
