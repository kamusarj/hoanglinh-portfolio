# Pixel Portfolio — Bùi Hoàng Linh

Prototype portfolio phong cách pixel-art retro, bố cục theo mẫu [vietlinh.vercel.app](https://vietlinh.vercel.app/)
(HOME · PROJECTS · ABOUT · STATS · CONTACT + đổi theme). Code được viết lại từ đầu vì repo của trang mẫu
không có license; ảnh thumbnail pixel-art do `scripts/make_pixel_art.py` vẽ.

Web tĩnh thuần HTML/CSS/JS: không cần build, không có dependency.

## Chạy thử

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

## Cấu trúc

```text
index.html                 khung trang (các section rỗng, JS sẽ đổ nội dung vào)
css/style.css              toàn bộ giao diện + 6 theme (sky, grape, mint, sunset, cyber, forest)
js/data.js                 NỘI DUNG: profile, project, kỹ năng, timeline, số liệu  ← sửa ở đây
js/main.js                 render nội dung, theme, phím tắt 1–5, dữ liệu GitHub live
assets/images/projects/    thumbnail pixel-art 160×90 (CSS phóng to với image-rendering: pixelated)
assets/images/avatar.png   avatar robot pixel tạm thời
scripts/make_pixel_art.py  script vẽ lại thumbnail / avatar / favicon (cần Pillow)
```

## Sửa nội dung

- **Đổi repo nổi bật**: sửa mảng `projects` trong `js/data.js`. Mỗi project có `image`; nếu thêm project mới,
  hoặc vẽ thêm scene trong `scripts/make_pixel_art.py`, hoặc dùng ảnh 16:9 bất kỳ.
- **Avatar**: đặt ảnh thật vào `assets/images/`, sửa `profile.avatar` và đặt `avatarPixelated: false`.
- **CV**: chép file PDF vào thư mục gốc và điền tên file vào `profile.cv` — nút `[ GITHUB ]` sẽ thành `[ DOWNLOAD CV ]`.
- Các dòng có `TODO` trong `js/data.js` là thông tin suy ra từ GitHub, cần kiểm tra lại.

## Khối "Live from GitHub"

Trình duyệt gọi trực tiếp (không cần token), cache 15 phút trong `localStorage`:

| Số liệu | Nguồn |
| --- | --- |
| Public repos | `api.github.com/users/kamusarj` |
| Public commits + bảng commit gần đây | `api.github.com/search/commits?q=author:kamusarj` |
| Contributions trong năm | `github-contributions-api.jogruber.de` |
| HF models | `huggingface.co/api/models?author=kamusarj` |

Trang mẫu lấy commit từ Events API — API này đã bỏ danh sách commit trong `PushEvent`, nên bảng commit
của trang mẫu luôn trống. Bản này dùng Search API thay thế. Nếu API lỗi hoặc bị giới hạn, trang hiển thị
dữ liệu dự phòng `github.snapshot` trong `js/data.js`.

## Vì sao chọn các repo này

| # | Repo | Lý do |
| --- | --- | --- |
| 1 | `Deka` | Sản phẩm AI full-stack mới nhất, public (bản kế thừa của `Smart-Exam-AI` đang private) |
| 2 | `Vespionage_deploy` | Đúng hướng AI Security / UEBA; bạn là người commit nhiều nhất (104) |
| 3 | `octo-pytorch`, `vla.cpp`, `TurboVLA`, `VLA-JEPA`, `lerobot` | Fork có commit nghiên cứu thật của bạn + 4 model trên Hugging Face → gộp thành 1 thẻ "VLA Robot Learning" |
| 4 | `GAN-segmentation` | CV có số liệu đo được (mIoU 0.53) và có app hoàn chỉnh |
| 5 | `research-system` | Monorepo FastAPI + Next.js, knowledge graph |
| 6 | `ssh-sentinal` | Dev tool hoàn chỉnh, README song ngữ |

Mục "More on GitHub": `stylewarp`, `DACN`, chuỗi lab AI20K. Không đưa lên: bài tập môn học (`udtt`, `dtbs`,
`webpython`, `Final_asp`…), repo profile, và các fork không có commit của bạn (`yt-dlp`, `Deep-Live-Cam`,
`Isaac-GR00T`, các awesome-list…).

## Deploy

- **Vercel**: push thư mục này lên một repo GitHub → Vercel → *Add New Project* → chọn repo,
  Framework Preset = *Other*, không cần build command.
- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root.
