# Voice Converter - Convert text/file text to audio

Simple WebApp developed with HTML/CSS/JS, using Google Gemini TTS API (`generativelanguage.googleapis.com`).

## Deploy by GitHub Pages

## Cách dùng

1. **API key**: Có 2 cách nạp:
   - Dán trực tiếp vào ô "API key" (mỗi dòng 1 key).
   - Bấm **"Nạp key từ file .env"** và chọn file `.env` **đang nằm trên máy bạn** (xem
     `.env.example` để biết định dạng). 

   App tự xoay vòng key khi 1 key bị giới hạn tốc độ (429), và tự vô hiệu hoá key nếu key
   sai/hết quyền (401/403).

2. **Nội dung**: dán text vào ô "Nội dung" hoặc bấm "Chọn file .txt". Mỗi dòng (không tính dòng
   trống) sẽ thành 1 hàng trong hàng đợi = 1 file giọng nói riêng.
3. **Giọng đọc / Ghi chú đạo diễn**: chọn model, 1 trong 30 giọng, audio profile (bối cảnh),
   và tông giọng/tốc độ/ngữ giọng — giống bộ chọn "Director's note" trong Google AI Studio.
   Các lựa chọn này được ghép thành một câu chỉ dẫn tiếng Anh, gắn trước mỗi dòng text khi gửi lên API.
4. Bấm **Chạy tất cả** để xử lý các dòng đang "chờ"/"lỗi" (bỏ qua dòng đã xong), hoặc
   **Chạy lại toàn bộ** để làm lại từ đầu. Bấm **Dừng** để huỷ giữa chừng.
5. Mỗi dòng trong hàng đợi có thể: ▶ nghe riêng dòng đó, ↻ chạy lại, ⏵⏵ chạy từ dòng đó trở đi,
   ⭳ tải file về máy.
6. Thanh phát nhạc cố định phía dưới: phát các dòng đã xong theo thứ tự, tua, lùi/tiến,
   tự động phát tiếp (bật/tắt ở góc phải).

Mọi cấu hình khác (model, giọng, định dạng, độ trễ...) được lưu vào `localStorage` của trình
duyệt để khỏi nhập lại — chỉ riêng API key là ngoại lệ, không bao giờ được lưu.

## Định dạng xuất file

- **WAV**: luôn khả dụng, không cần cài gì thêm.
- **MP3 / OGG**: cần bật `ffmpeg.wasm`:
  1. Tải bản UMD của `@ffmpeg/ffmpeg` (v0.11.x) và `@ffmpeg/core` — ví dụ tải trực tiếp từ
     unpkg/jsDelivr các file:
     - `ffmpeg.min.js`
     - `ffmpeg-core.js`
     - `ffmpeg-core.wasm`
     - `ffmpeg-core.worker.js`
  2. Bỏ cả 4 file vào thư mục `lib/ffmpeg/` (đã có sẵn thư mục rỗng này cạnh `index.html`).
  3. Mở `index.html`, tìm dòng:
     ```html
     <!-- <script src="lib/ffmpeg/ffmpeg.min.js"></script> -->
     ```
     bỏ comment (xoá `<!--` và `-->`), rồi upload lại lên GitHub.
  4. Chọn định dạng MP3/OGG trong Settings — app sẽ tự convert.
  - Nếu chưa bật ffmpeg mà bạn vẫn chọn MP3/OGG, app sẽ hiện cảnh báo và **tự động giữ WAV**
    thay vì báo lỗi, để không mất công đã sinh audio.

## Cấu trúc code

```
index.html            khung giao diện
style.css             giao diện
js/voices.js          danh sách model / giọng / audio profile / director note
js/storage.js         lưu-đọc settings (trừ API key) vào localStorage
js/wav.js             bọc PCM thô thành file WAV
js/keyManager.js       xoay vòng / cooldown / vô hiệu hoá API key
js/envLoader.js        đọc key từ file .env chọn thủ công (không lưu localStorage)
js/ttsClient.js        gọi Gemini TTS API, retry, chọn key
js/ffmpegConvert.js    convert WAV -> MP3/OGG (tuỳ chọn, qua ffmpeg.wasm)
js/queue.js            hàng đợi các dòng text, chạy tuần tự, chạy lại / chạy từ dòng N
js/player.js           trình phát audio
js/app.js              nối toàn bộ UI với các module trên
.env.example           mẫu file .env — đổi tên thành .env, điền key thật, GIỮ TRÊN MÁY BẠN,
                       không upload lên GitHub
.gitignore             chặn lỡ commit .env thật lên git
```

## Ghi chú kỹ thuật

- Xử lý hàng đợi theo kiểu **tuần tự** (từng dòng một) để dễ theo dõi trạng thái đúng thứ tự
  và tránh nhiều request cùng lúc làm tăng nguy cơ bị rate-limit. Nếu bạn có nhiều key và muốn
  chạy song song để nhanh hơn, có thể sửa `_runFromIndex` trong `js/queue.js` để chạy nhiều
  dòng cùng lúc bằng `Promise.all` theo lô.
- "Độ trễ giữa các dòng" áp dụng giữa 2 lần gửi liên tiếp khi chạy hàng loạt.
- "Độ trễ khi bị giới hạn" là thời gian 1 API key bị tạm cho "nghỉ" sau khi nhận lỗi 429,
  trước khi được xoay vòng lại vào hàng đợi key khả dụng.
