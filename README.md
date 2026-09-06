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
