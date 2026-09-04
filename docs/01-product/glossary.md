# Thuật ngữ

> **Trả lời:** Khái niệm này gọi là gì trong code, và hiện ra sao trên UI?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** xuất hiện một khái niệm nghiệp vụ mới trong code hoặc UI

<!-- Tên chồng bài dùng nguyên thuật ngữ Klondike tiếng Anh trong code — đó là tên
mà mọi tài liệu về trò chơi này dùng, và dịch chúng ra tiếng Việt trong code sẽ khiến
không tra cứu được luật ở đâu nữa. UI thì ngược lại: tiếng Việt hoàn toàn. -->

| Thuật ngữ | Định nghĩa một câu | Tên trong code | Tên trên UI (VI) |
| --- | --- | --- | --- |
| Tableau | Bảy cột bài chính giữa bàn, nơi diễn ra hầu hết nước đi | `tableau` | Cột bài |
| Foundation | Bốn chồng đích, mỗi chồng một chất, xếp từ A lên K | `foundations` | Chồng đích |
| Stock | Chồng bài úp ở góc, chạm vào để rút | `stock` | Chồng rút |
| Waste | Chồng bài đã rút, ngửa, chỉ lá trên cùng chơi được | `waste` | Bài đã rút |
| Pile | Một chồng bài bất kỳ trong bốn loại trên | `Pile`, `PileId` | — (không hiện) |
| Move | Một nước đi hợp lệ, đơn vị nhỏ nhất làm đổi thế bài | `Move` | Nước đi |
| Move intent | Ý định của người chơi trước khi được phán quyết là hợp lệ hay không | `MoveIntent` | — (không hiện) |
| Seed | Số nguyên sinh ra thế bài; cùng seed cho cùng ván | `seed` | Ván số |
| Draw mode | Rút một lá hay ba lá mỗi lần chạm chồng rút | `drawMode` | Rút 1 lá / Rút 3 lá |
| Deal | Thế bài lúc bắt đầu ván, và cũng là hành động chia | `deal()` | Chia bài |
| Auto-complete | Chuỗi nước tự dọn nốt ván khi mọi lá đã ngửa | `autoCompleteMoves()` | Hoàn tất |
| Undo | Quay lại thế bài trước nước vừa đi | `undo()` | Hoàn lại |
| Restart | Chia lại đúng ván đang chơi từ đầu | `restart()` | Chơi lại |
| New game | Chia một ván khác, seed mới | `newGame()` | Ván mới |

**Tên bị cấm:**

- Dùng `foundations`, **không** dùng `home`, `aces`, `goal`.
- Dùng `stock` và `waste`, **không** dùng `deck`/`draw pile`/`discard` — `deck` chỉ có nghĩa "bộ 52 lá đầy đủ trước khi chia".
- Dùng `tableau`, **không** dùng `columns`, `board`, `piles` khi ý là bảy cột chính.
- Dùng `Move` cho nước đi đã hợp lệ và `MoveIntent` cho ý định chưa phán quyết. **Không** dùng `Action` — dễ lẫn với action của reducer.
- Dùng `rank` và `suit`, **không** dùng `value`, `number`, `type`, `color` (màu là thứ suy ra từ `suit`, không phải trường riêng).
