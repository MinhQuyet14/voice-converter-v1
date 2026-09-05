const VOICES = [
  { name: 'Zephyr', desc: 'Bright / Tươi sáng' },
  { name: 'Puck', desc: 'Upbeat / Sôi nổi' },
  { name: 'Charon', desc: 'Informative / Truyền đạt' },
  { name: 'Kore', desc: 'Firm / Chắc chắn' },
  { name: 'Fenrir', desc: 'Excitable / Hào hứng' },
  { name: 'Leda', desc: 'Youthful / Trẻ trung' },
  { name: 'Orus', desc: 'Firm / Chắc chắn' },
  { name: 'Aoede', desc: 'Breezy / Nhẹ nhàng' },
  { name: 'Callirrhoe', desc: 'Easy-going / Thoải mái' },
  { name: 'Autonoe', desc: 'Bright / Tươi sáng' },
  { name: 'Enceladus', desc: 'Breathy / Thì thầm' },
  { name: 'Iapetus', desc: 'Clear / Rõ ràng' },
  { name: 'Umbriel', desc: 'Easy-going / Thoải mái' },
  { name: 'Algieba', desc: 'Smooth / Mượt mà' },
  { name: 'Despina', desc: 'Smooth / Mượt mà' },
  { name: 'Erinome', desc: 'Clear / Rõ ràng' },
  { name: 'Algenib', desc: 'Gravelly / Trầm khàn' },
  { name: 'Rasalgethi', desc: 'Informative / Truyền đạt' },
  { name: 'Laomedeia', desc: 'Upbeat / Sôi nổi' },
  { name: 'Achernar', desc: 'Soft / Dịu' },
  { name: 'Alnilam', desc: 'Firm / Chắc chắn' },
  { name: 'Schedar', desc: 'Even / Đều đặn' },
  { name: 'Gacrux', desc: 'Mature / Trưởng thành' },
  { name: 'Pulcherrima', desc: 'Forward / Mạnh mẽ' },
  { name: 'Achird', desc: 'Friendly / Thân thiện' },
  { name: 'Zubenelgenubi', desc: 'Casual / Đời thường' },
  { name: 'Vindemiatrix', desc: 'Gentle / Nhẹ nhàng' },
  { name: 'Sadachbia', desc: 'Lively / Sống động' },
  { name: 'Sadaltager', desc: 'Knowledgeable / Hiểu biết' },
  { name: 'Sulafat', desc: 'Warm / Ấm áp' },
];

const MODELS = [
  { id: 'gemini-3.1-flash-tts-preview', label: 'Gemini 3.1 Flash TTS (mới nhất, có free tier)' },
  { id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash TTS (nhanh, rẻ)' },
  { id: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro TTS (chất lượng cao)' },
];

const AUDIO_PROFILES = [
  { id: '', label: '(Không dùng)' },
  { id: 'Giọng người dẫn chuyện chuyên nghiệp, thu âm trong phòng studio yên tĩnh.', label: 'Người dẫn chuyện studio' },
  { id: 'Giọng MC radio ấm áp, thân thiện, gần gũi với người nghe.', label: 'MC radio ấm áp' },
  { id: 'Giọng đọc tin tức trang trọng, rõ ràng, khách quan.', label: 'Đọc tin tức trang trọng' },
  { id: 'Giọng kể chuyện cổ tích nhẹ nhàng, truyền cảm cho trẻ em.', label: 'Kể chuyện cho trẻ em' },
  { id: 'Giọng quảng cáo năng động, thu hút, đầy năng lượng.', label: 'Quảng cáo năng động' },
];

const FORMATS = [
  { id: 'wav', label: 'WAV (native, luôn khả dụng)' },
  { id: 'mp3', label: 'MP3' },
  { id: 'ogg', label: 'OGG' },
];

const DIRECTOR_STYLES = [
  { id: '', label: '(Mặc định)' },
  { id: 'Empathetic', label: 'Empathetic — Đồng cảm' },
  { id: 'Warm', label: 'Warm — Ấm áp' },
  { id: 'Calm', label: 'Calm — Điềm tĩnh' },
  { id: 'Upbeat', label: 'Upbeat — Sôi nổi' },
  { id: 'Excited', label: 'Excited — Hào hứng' },
  { id: 'Energetic', label: 'Energetic — Tràn năng lượng' },
  { id: 'Firm', label: 'Firm — Dứt khoát' },
  { id: 'Serious', label: 'Serious — Nghiêm túc' },
  { id: 'Cheerful', label: 'Cheerful — Vui tươi' },
  { id: 'Friendly', label: 'Friendly — Thân thiện' },
  { id: 'Soothing', label: 'Soothing — Vỗ về, dịu dàng' },
  { id: 'Whispering', label: 'Whispering — Thì thầm' },
  { id: 'Sad', label: 'Sad — Buồn' },
  { id: 'Angry', label: 'Angry — Giận dữ' },
  { id: 'Scared', label: 'Scared — Sợ hãi' },
  { id: 'Bored', label: 'Bored — Chán chường' },
  { id: 'Sarcastic', label: 'Sarcastic — Mỉa mai' },
  { id: 'Newscaster', label: 'Newscaster — Phát thanh viên' },
  { id: 'Storyteller', label: 'Storyteller — Người kể chuyện' },
  { id: 'Documentary narrator', label: 'Documentary — Thuyết minh phim tài liệu' },
  { id: 'Radio DJ', label: 'Radio DJ — MC radio' },
  { id: 'Movie trailer announcer', label: 'Movie trailer — Giọng trailer phim' },
];

const DIRECTOR_PACES = [
  { id: '', label: '(Mặc định)' },
  { id: 'Very slow', label: 'Very slow — Rất chậm' },
  { id: 'Slow', label: 'Slow — Chậm' },
  { id: 'Natural', label: 'Natural — Tự nhiên' },
  { id: 'Fast', label: 'Fast — Nhanh' },
  { id: 'Very fast', label: 'Very fast — Rất nhanh' },
];

const DIRECTOR_ACCENTS = [
  { id: '', label: '(Mặc định)' },
  { id: 'Neutral', label: 'Neutral — Trung tính' },
  { id: 'Northern Vietnamese (Hanoi)', label: 'Giọng Bắc (Hà Nội)' },
  { id: 'Southern Vietnamese (Saigon)', label: 'Giọng Nam (Sài Gòn)' },
  { id: 'Central Vietnamese (Hue)', label: 'Giọng Trung (Huế)' },
  { id: 'American English', label: 'Anh - Mỹ' },
  { id: 'British English', label: 'Anh - Anh' },
  { id: 'Australian English', label: 'Anh - Úc' },
];
