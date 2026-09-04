# MASTER · Hệ thống thiết kế `web-game-solitaire`

> **Trả lời:** Màu nào, chữ nào, khoảng cách nào — và giá trị đó lấy ở đâu ra?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** thêm một vai trò màu mới · đổi thang chữ hoặc thang khoảng cách

File này là **nguồn duy nhất** của mọi giá trị thị giác. Nó được chép sang đúng một
chỗ trong code: các biến CSS trong `src/app/globals.css`. `tailwind.config.ts` chỉ
trỏ vào các biến đó, không chứa giá trị màu nào. Component không được viết màu chữ
thẳng vào class.

Mọi tỉ số tương phản dưới đây được tính bằng công thức WCAG 2.1 trong phiên
2026-09-04, không phải ước lượng.

## 1. Màu

### Nền và chữ

| Vai trò | Biến CSS | Giá trị | Tương phản |
| --- | --- | --- | --- |
| Nền bàn (felt) | `--bg-page` | `#0B3D2E` | — |
| Nền thanh công cụ | `--bg-toolbar` | `#072B20` | — |
| Chữ chính trên nền bàn | `--fg-default` | `#F2F7F4` | **11.26:1** trên `--bg-page` ✓ |
| Chữ phụ, số hiệu ván | `--fg-muted` | `#A9C6B6` | **6.65:1** trên `--bg-page` ✓ |
| Chữ trên thanh công cụ | `--fg-default` | `#F2F7F4` | **14.09:1** trên `--bg-toolbar` ✓ |

### Lá bài

| Vai trò | Biến CSS | Giá trị | Tương phản |
| --- | --- | --- | --- |
| Mặt bài | `--bg-card` | `#FDFDF8` | **11.96:1** so với nền bàn ✓ (ranh giới lá bài) |
| Chất đỏ (cơ, rô) | `--fg-card-red` | `#C0262C` | **5.79:1** trên mặt bài ✓ |
| Chất đen (bích, tép) | `--fg-card-black` | `#17202A` | **16.12:1** trên mặt bài ✓ |
| Lưng bài | `--bg-card-back` | `#4A90D9` | **3.65:1** so với nền bàn ✓ (≥ 3:1 cho thành phần phi văn bản) |
| Hoa văn lưng bài | `--fg-card-back` | `#FFFFFF` | **3.34:1** trên lưng bài ✓ |
| Viền lá bài | `--edge-card` | `#FDFDF8` | viền 2px, cùng màu mặt bài |

Lưng bài `#4A90D9` được chọn thay vì một sắc xanh đậm đẹp hơn (`#1E4E8C` chỉ đạt
1.47:1) chính vì ngưỡng 3:1: một lá úp nằm trên nền bàn là một thành phần giao diện,
và người dùng phải phân biệt được nó với mặt bàn mà không cần dựa vào cái viền.

### Trạng thái

| Vai trò | Biến CSS | Giá trị | Tương phản |
| --- | --- | --- | --- |
| Vành tiêu điểm — lớp trong | `--ring-focus` | `#FFD166` | **8.46:1** trên nền bàn ✓ |
| Vành tiêu điểm — lớp ngoài | `--ring-focus-edge` | `#0B3D2E` | **11.96:1** trên mặt bài ✓ |
| Lá đang chọn | `--ring-selected` | `#FFD166` | như trên |
| Nháy khi từ chối nước đi | `--bg-reject` | `#E4572E` | **3.31:1** trên nền bàn ✓ |
| Viền chồng bài rỗng | `--edge-empty` | `#7FA893` | **4.60:1** trên nền bàn ✓ |

**Vành tiêu điểm luôn có hai lớp** — 2px `#FFD166` bên trong, 2px `#0B3D2E` bên
ngoài. Một vành một màu không thể đạt 3:1 trên cả nền bàn xanh đậm lẫn mặt bài trắng
(`#FFD166` trên mặt bài chỉ 1.41:1). Hai lớp thì luôn có ít nhất một lớp tương phản
đủ với thứ nằm dưới, bất kể lá bài đang ở đâu. Đây là điều kiện để NFR-A11Y-02 đứng
được — nếu không, tiêu điểm sẽ tàng hình đúng ở chỗ nó cần thấy nhất.

## 2. Chữ

Không tải font từ ngoài (NFR-DATA-01). Dùng font hệ thống.

| Vai trò | Biến | Giá trị |
| --- | --- | --- |
| Giao diện | `--font-ui` | `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif` |
| Hạng bài và số hiệu ván | `--font-num` | `ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace` |

| Vai trò | Cỡ | Đậm |
| --- | --- | --- |
| Hạng bài (mobile / tablet / desktop) | 14px / 20px / 26px | 700 |
| Ký tự chất ở góc lá | 12px / 16px / 20px | 400 |
| Ký tự chất lớn giữa lá | 18px / 28px / 38px | 400 |
| Nhãn nút | 14px | 500 |
| Số hiệu ván | 13px | 400 |
| Tiêu đề màn thắng | 24px / 32px / 40px | 700 |

## 3. Khoảng cách

Thang bậc 4px: `4 · 8 · 12 · 16 · 24 · 32`. Không dùng giá trị ngoài thang.

| Vai trò | Biến | 320–767 | 768–1279 | ≥ 1280 |
| --- | --- | --- | --- | --- |
| Bề rộng lá | `--card-w` | `calc((100vw - 32px) / 7)` | `72px` | `96px` |
| Chiều cao lá | `--card-h` | `calc(var(--card-w) * 1.4)` | `101px` | `134px` |
| Khe ngang giữa hai cột | `--gap-x` | `4px` | `8px` | `12px` |
| Lấn dọc, lá úp | `--overlap-down` | `8px` | `12px` | `14px` |
| Lấn dọc, lá ngửa | `--overlap-up` | `18px` | `26px` | `32px` |
| Đệm quanh bàn | `--pad-board` | `8px` | `16px` | `24px` |
| Bo góc lá | `--radius-card` | `4px` | `6px` | `8px` |

Ở 320px, `--card-w` ra khoảng 41px — **nhỏ hơn ngưỡng 44px của NFR-A11Y-03**. Đó là
lý do vùng chạm được tách khỏi phần vẽ: `CardView` bọc mặt bài trong một vùng bắt sự
kiện tối thiểu 44×44px bằng padding trong suốt, chồng lấn sang lá bên cạnh. Phần
nhìn thấy vẫn 41px, phần chạm được là 44px.

## 4. Chuyển động

| Cái gì | Thời lượng | Đường cong |
| --- | --- | --- |
| Lá đổi chỗ | 180ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Lá lật | 220ms | `ease-in-out` |
| Nháy từ chối | 200ms, 2 nhịp | `ease-out` |
| Bài đổ khi thắng | tới khi hết bài | vật lý nảy trên canvas |

Dưới `prefers-reduced-motion: reduce`, **mọi thời lượng về 0** và màn thắng chỉ hiện
bài đã xếp cùng dòng chúc mừng, không có canvas chuyển động (NFR-A11Y-05).
