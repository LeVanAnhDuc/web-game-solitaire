# Yêu cầu phi chức năng

> **Trả lời:** Ngưỡng nào áp cho **mọi** feature, để không phải nhắc lại từng lần?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** thêm loại tài nguyên mới · thêm nhóm người dùng · sau sự cố sinh ra ngưỡng mới

<!-- Đã rà theo dự án ngày 2026-09-04. Đây là một trang tĩnh chạy hoàn toàn trên máy
người dùng: không server, không datastore, không tài khoản, không PII. Phần lớn ngưỡng
mặc định của scaffold viết cho app có backend nên không áp dụng — chúng được giữ lại ở
dạng ~~(bỏ)~~ kèm lý do, vì ID không được tái dùng. -->

## Performance

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| ~~NFR-PERF-01~~ | ~~(bỏ)~~ không có endpoint nào — không có server | — |
| NFR-PERF-02 | Một nước đi từ lúc chạm đến lúc bàn bài vẽ xong < 100ms trên điện thoại tầm trung | đo bằng Performance panel trên throttle CPU 4× |
| ~~NFR-PERF-03~~ | ~~(bỏ)~~ không có truy vấn nào | — |
| ~~NFR-PERF-04~~ | ~~(bỏ)~~ không có migration, không có index | — |
| NFR-PERF-05 | Bundle JS tải lần đầu ≤ 150KB sau gzip | đọc báo cáo của `next build` |
| NFR-PERF-06 | Undo bằng phát lại toàn bộ lịch sử vẫn < 16ms ở ván 300 nước | benchmark trong Vitest |

## Security

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| ~~NFR-SEC-01~~ | ~~(bỏ)~~ không có mutation phía server | — |
| ~~NFR-SEC-02~~ | ~~(bỏ)~~ không có log, không có PII | — |
| ~~NFR-SEC-03~~ | ~~(bỏ)~~ không có đăng nhập | — |
| NFR-SEC-04 | Không có secret nào trong repo. Dự án này lẽ ra không cần biến môi trường nào — một biến mới xuất hiện là dấu hiệu phải xem lại kiến trúc | grep + review `.env.example` |
| NFR-SEC-05 | Dependency không có lỗ hổng mức high trở lên | `yarn audit`, chạy trong CI |
| ~~NFR-SEC-06~~ | ~~(bỏ)~~ không có lỗi phía server để trả về | — |

## Accessibility

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| NFR-A11Y-01 | Tương phản chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1. Áp cho cả mặt bài trên nền bàn | devtools |
| NFR-A11Y-02 | Mọi nước đi thực hiện được bằng bàn phím, và focus luôn thấy được | thử tay + E2E chơi hết ván chỉ bằng phím |
| NFR-A11Y-03 | Vùng bấm của một lá bài ≥ 44×44px ở mọi bề rộng màn hình được hỗ trợ | đo trong E2E ở 320px |
| NFR-A11Y-04 | Mỗi lá bài có nhãn đọc được ("Bích 7, ngửa"); mỗi chồng bài là một vùng có tên | review + axe |
| NFR-A11Y-05 | Tôn trọng `prefers-reduced-motion`: bài đổi chỗ tức thì, màn mừng không có hiệu ứng động | review CSS + thử tay |

## i18n

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| NFR-I18N-01 | Không hardcode chuỗi hiển thị trong component. Mọi chuỗi nằm ở `src/lib/strings.ts` | grep |
| ~~NFR-I18N-02~~ | ~~(bỏ)~~ không lưu và không hiển thị thời gian | — |
| ~~NFR-I18N-03~~ | ~~(bỏ)~~ UI chỉ tiếng Việt, không có số/tiền/ngày cần định dạng theo locale | — |

## Reliability

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| ~~NFR-REL-01~~ | ~~(bỏ)~~ không có lệnh gọi ra ngoài | — |
| ~~NFR-REL-02~~ | ~~(bỏ)~~ không có tác vụ ghi | — |
| NFR-REL-03 | Không có trạng thái kẹt: mọi thao tác hoặc đổi bàn bài, hoặc bỏ lựa chọn. Không bao giờ để người chơi ở giữa một cử chỉ dở dang | E2E: huỷ kéo, nhả chuột ngoài cửa sổ, chạm vùng trống |
| NFR-REL-04 | Console không có lỗi hay cảnh báo nào trong suốt một ván chơi đầy đủ | E2E bắt console |

## Data & Privacy

| ID | Ngưỡng | Cách kiểm |
| --- | --- | --- |
| NFR-DATA-01 | Dự án **không thu thập, không lưu, không gửi đi** bất kỳ dữ liệu người dùng nào. Không localStorage, không cookie, không analytics, không font tải từ CDN ngoài | grep `localStorage`/`document.cookie`/`fetch` + kiểm tab Network trống sau khi tải xong |
| ~~NFR-DATA-02~~ | ~~(bỏ)~~ không có tài khoản để xoá | — |
| ~~NFR-DATA-03~~ | ~~(bỏ)~~ không có dữ liệu để khôi phục | — |

**Trường PII trong dự án này:** không có. NFR-DATA-01 là thứ giữ cho ô này trống.
