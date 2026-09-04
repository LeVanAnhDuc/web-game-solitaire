# ADR-0002 · Trạng thái úp/ngửa suy ra từ vị trí, không có cờ trên lá bài

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** FR-02 · FR-07

## 1. Bối cảnh

Trong Klondike, mỗi cột tableau có một phần úp bên dưới và một phần ngửa bên trên; lá trên cùng của phần úp tự lật khi phần ngửa cạn. Cách biểu diễn phổ biến là gắn cờ `faceUp: boolean` lên từng lá bài.

Vấn đề: cờ đó là nguồn sự thật thứ hai, song song với thứ tự lá trong cột. Khi hai nguồn lệch nhau — lá nằm trong phần ngửa mà cờ nói úp — UI vẫn vẽ đúng theo cờ còn luật lại tính theo vị trí. Đây đúng là loại lỗi mà `invariants.md` tồn tại để chặn.

## 2. Quyết định

Mỗi cột tableau là `{ down: Card[]; up: Card[] }`. `Card` chỉ có `id`, `suit`, `rank` — không có cờ trạng thái nào. Lá ở `stock` là úp, ở `waste` và `foundations` là ngửa, đều suy ra từ chồng chứa nó. Việc lật lá nằm trong `applyMove`, không phải việc của UI.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| `faceUp` trên `Card` | Trạng thái sai biểu diễn được, nên sớm muộn sẽ xuất hiện. Mọi hàm luật phải nhớ kiểm cả hai nguồn |
| `faceDownCount: number` cho mỗi cột | Chỉ một nguồn sự thật, nhưng mọi chỗ đọc bài phải cắt mảng theo chỉ số — dễ lệch một đơn vị, và đọc code khó hơn hẳn |

## 4. Hệ quả

**Được:**
- Trạng thái lệch úp/ngửa trở thành **không biểu diễn được**, thay vì phải viết test để bắt.
- `isLegal` chỉ nhìn `up` là đủ; không có nhánh "lá này ngửa chưa".
- Lật lá là một dòng trong `applyMove` và tự động đúng khi undo phát lại.

**Mất / phải chấp nhận:**
- Tầng UI muốn vẽ cả cột phải nối `down` và `up` lại, và biết lá nào thuộc phần nào — thêm một bước rất nhỏ ở chỗ vẽ.
- Một số thuật toán solver viết sẵn ngoài kia giả định mảng phẳng có cờ; nếu sau này thêm hint sẽ phải chuyển đổi.

**Điều kiện xem lại quyết định này:** khi thêm biến thể có luật úp/ngửa khác hẳn (Spider chẳng hạn) khiến hai mảng không còn diễn tả đủ.
