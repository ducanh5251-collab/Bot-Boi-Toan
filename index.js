const crypto = require('node:crypto');
const http = require('node:http');
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  SlashCommandBuilder
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error('Thiếu TOKEN. Hãy tạo file .env hoặc cấu hình biến môi trường TOKEN.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Web server nhỏ để các nền tảng host biết bot vẫn đang chạy.
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bot Bói Toán đang chạy.');
});

server.listen(PORT, () => {
  console.log(`Health server đang lắng nghe trên port ${PORT}`);
});

// Danh sách slash commands. Bot tự deploy commands khi ready nên chỉ cần TOKEN.
const commands = [
  new SlashCommandBuilder()
    .setName('boingaysinh')
    .setDescription('Bói vui theo ngày, tháng, năm sinh.')
    .addIntegerOption(option =>
      option
        .setName('ngay')
        .setDescription('Ngày sinh của bạn')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31)
    )
    .addIntegerOption(option =>
      option
        .setName('thang')
        .setDescription('Tháng sinh của bạn')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    )
    .addIntegerOption(option =>
      option
        .setName('nam')
        .setDescription('Năm sinh của bạn')
        .setRequired(true)
        .setMinValue(1900)
        .setMaxValue(2100)
    ),

  new SlashCommandBuilder()
    .setName('boichitay')
    .setDescription('Bói vui theo ảnh bàn tay.')
    .addAttachmentOption(option =>
      option
        .setName('anh')
        .setDescription('Ảnh bàn tay của bạn')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('boinhan_tuong')
    .setDescription('Bói nhân tướng học vui theo mô tả của bạn.')
    .addStringOption(option =>
      option
        .setName('mota')
        .setDescription('Mô tả khuôn mặt, phong thái hoặc tính cách')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addAttachmentOption(option =>
      option
        .setName('anh')
        .setDescription('Ảnh khuôn mặt hoặc chân dung, không bắt buộc')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('thienthuong')
    .setDescription('Dự đoán ngày dễ ra Thiên Thưởng theo tên nhân vật.')
    .addStringOption(option =>
      option
        .setName('ten')
        .setDescription('Tên nhân vật trong game')
        .setRequired(true)
        .setMaxLength(80)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hướng dẫn sử dụng Bot Bói Toán.')
].map(command => command.toJSON());

const personalityResults = [
  'Bạn có trực giác khá tốt, hay nhìn ra vấn đề trước khi người khác kịp đặt câu hỏi.',
  'Bạn bên ngoài có vẻ bình thản, nhưng bên trong là người rất dễ rung động với điều tử tế.',
  'Bạn hợp với việc tự mình quyết định, càng bị thúc ép càng muốn đi theo cách riêng.',
  'Bạn có năng lượng chậm mà chắc, thành công thường đến khi bạn kiên trì thêm một chút.'
];

const loveResults = [
  'Tình duyên hôm nay hợp với lời nói mềm và một tin nhắn đúng lúc.',
  'Bạn dễ gặp người cùng tần số nếu bớt đoán ý và nói thẳng điều mình muốn.',
  'Người hợp với bạn thường là người biết lắng nghe, không làm mọi chuyện ồn ào.',
  'Duyên dáng lên khi bạn cười nhiều hơn và bớt tự chấm điểm mình quá gắt.'
];

const fortuneResults = [
  'Tài lộc có dấu hiệu nhỏ mà vui, hợp với việc gom nhặt cơ hội hơn là tất tay.',
  'Tiền bạc nên đi theo kế hoạch rõ ràng, đừng để cảm xúc bấm nút thanh toán.',
  'Vận may tài chính nằm ở sự đều đặn, mỗi ngày một chút sẽ có kết quả đẹp.',
  'Hôm nay hợp với việc sắp xếp ví tiền, hủy bớt thứ không cần và giữ lại thứ đáng giá.'
];

const palmResults = [
  'Đường sinh đạo cho thấy bạn có sức bật tinh thần tốt, gặp khó vẫn biết cách quay lại.',
  'Đường trí đạo nói lên bạn nghĩ nhiều, nhưng khi đã quyết thì rất khó lung lay.',
  'Đường tâm đạo có vẻ mềm, hợp với người sống tình cảm và hay quan tâm người khác âm thầm.',
  'Lòng bàn tay mang năng lượng “sắp trúng lớn”, nhưng vẫn nên ngủ sớm để may mắn không bị mệt.'
];

const faceResults = [
  'Mô tả của bạn gợi ý một người có khí chất thẳng thắn, dễ tạo niềm tin với xung quanh.',
  'Nét tướng vui cho thấy bạn có duyên ăn nói, hợp làm cầu nối trong nhóm.',
  'Bạn có tướng của người cẩn thận, hay suy nghĩ trước khi hành động nên ít khi ngã quá đau.',
  'Thần thái của bạn hợp với may mắn kiểu chậm đến nhưng bền, càng nghiêm túc càng sáng.'
];

const adviceResults = [
  'Quay thử vận may sau khi uống nước, hít thở sâu và đừng đọc câu thần chú quá to.',
  'Nếu trượt, hãy coi như vũ trụ đang bảo bạn để dành nhân phẩm cho lần sau.',
  'Trước khi quay, sắp xếp túi đồ cho gọn. Tâm gọn thì vận cũng gọn.',
  'Đừng quay lúc đang cay. May mắn rất ngại những người bấm nút bằng nóng giận.',
  'Hãy gọi tên nhân vật một cách trân trọng. Biết đâu hệ thống cũng thích lịch sự.'
];

function hashToNumber(input) {
  const hash = crypto.createHash('sha256').update(String(input)).digest('hex');
  return Number.parseInt(hash.slice(0, 12), 16);
}

function pick(list, seed) {
  return list[hashToNumber(seed) % list.length];
}

function makeBar(percent) {
  const total = 10;
  const filled = Math.round((percent / 100) * total);
  return '█'.repeat(filled) + '░'.repeat(total - filled);
}

function fortuneTier(percent) {
  if (percent >= 90) return 'Đại Cát';
  if (percent >= 75) return 'Cát';
  if (percent >= 60) return 'Tiểu Cát';
  if (percent >= 45) return 'Bình Ổn';
  return 'Dưỡng Vận';
}

function readingCode(seed) {
  return crypto
    .createHash('sha1')
    .update(String(seed))
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
}

function displayCode(prefix, seed, detail = '') {
  return [prefix, detail, readingCode(seed)].filter(Boolean).join('-');
}

function getHexagram(seed) {
  return hexagrams[hashToNumber(`${seed}:hexagram`) % hexagrams.length];
}

function formatHexagram(hexagram) {
  return [
    `**${String(hexagram.number).padStart(2, '0')}. ${hexagram.name}**`,
    hexagram.meaning,
    `Chủ ý: **${hexagram.theme}**`
  ].join('\n');
}

function statLine(label, percent) {
  return `${label.padEnd(12, ' ')} ${String(percent).padStart(3, ' ')}% ${makeBar(percent)}`;
}

function compactDateTime() {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

const luckyColors = [
  'Vàng kim',
  'Xanh ngọc',
  'Đỏ trầm',
  'Trắng bạc',
  'Tím khói',
  'Xanh trời',
  'Đen ánh sao'
];

const luckyItems = [
  'một ly nước mát',
  'một câu nói nhẹ nhàng',
  'một bài nhạc quen',
  'một lần hít thở sâu',
  'một chiếc áo hợp vía',
  'một khoảng nghỉ ngắn',
  'một lời chúc từ bạn bè'
];

// Dữ liệu 64 quẻ tham khảo từ bảng quẻ Kinh Dịch Kabala, viết lại ngắn gọn cho bot bói vui.
const hexagrams = [
  { number: 1, name: 'Càn Vi Thiên', meaning: 'Khí trời mạnh, hợp mở đường và chủ động.', theme: 'khởi thế' },
  { number: 2, name: 'Khôn Vi Địa', meaning: 'Đất dày nâng đỡ, hợp kiên nhẫn và tích lũy.', theme: 'bền bỉ' },
  { number: 3, name: 'Thủy Lôi Truân', meaning: 'Mầm mới còn vướng, khởi đầu khó nhưng có lực bật.', theme: 'vượt mở đầu' },
  { number: 4, name: 'Sơn Thủy Mông', meaning: 'Còn mờ đường, nên học thêm và hỏi đúng người.', theme: 'khai sáng' },
  { number: 5, name: 'Thủy Thiên Nhu', meaning: 'Thời vận cần chờ, vội quá dễ hụt nhịp.', theme: 'đợi thời' },
  { number: 6, name: 'Thiên Thủy Tụng', meaning: 'Dễ sinh tranh cãi, nên mềm lời và tránh hơn thua.', theme: 'hóa giải' },
  { number: 7, name: 'Địa Thủy Sư', meaning: 'Cần kỷ luật, đi theo đội hình thì dễ thắng hơn.', theme: 'tổ chức' },
  { number: 8, name: 'Thủy Địa Tỷ', meaning: 'May đến qua kết nối, hợp đi cùng người đáng tin.', theme: 'liên kết' },
  { number: 9, name: 'Phong Thiên Tiểu Súc', meaning: 'Tích nhỏ thành lớn, chưa nên bung hết lực.', theme: 'gom vận' },
  { number: 10, name: 'Thiên Trạch Lý', meaning: 'Bước đi cần chuẩn, lễ độ sẽ mở đường.', theme: 'cẩn trọng' },
  { number: 11, name: 'Địa Thiên Thái', meaning: 'Khí hanh thông, việc khó có dấu hiệu nhẹ dần.', theme: 'thuận lợi' },
  { number: 12, name: 'Thiên Địa Bĩ', meaning: 'Dòng vận đang nghẽn, nên giữ sức và tránh cố chấp.', theme: 'qua tắc' },
  { number: 13, name: 'Thiên Hỏa Đồng Nhân', meaning: 'Đồng lòng thì sáng, hợp rủ người cùng chí hướng.', theme: 'hợp lực' },
  { number: 14, name: 'Hỏa Thiên Đại Hữu', meaning: 'Vận sở hữu lớn, dễ có món lợi hoặc cơ hội sáng.', theme: 'được mùa' },
  { number: 15, name: 'Địa Sơn Khiêm', meaning: 'Khiêm tốn thì thắng, càng nhẹ nhàng càng được nâng.', theme: 'hạ mình' },
  { number: 16, name: 'Lôi Địa Dự', meaning: 'Khí vui bật lên, hợp khởi động việc đã ấp ủ.', theme: 'hứng khởi' },
  { number: 17, name: 'Trạch Lôi Tùy', meaning: 'Theo đúng dòng sẽ thuận, cưỡng lại dễ mệt.', theme: 'linh hoạt' },
  { number: 18, name: 'Sơn Phong Cổ', meaning: 'Việc cũ cần sửa, dọn nền trước rồi hãy tiến.', theme: 'chỉnh sửa' },
  { number: 19, name: 'Địa Trạch Lâm', meaning: 'Vận đang tiến gần, nên chuẩn bị để đón cơ hội.', theme: 'áp sát' },
  { number: 20, name: 'Phong Địa Quán', meaning: 'Quan sát trước khi quyết, nhìn rộng sẽ thấy lối.', theme: 'nhìn xa' },
  { number: 21, name: 'Hỏa Lôi Phệ Hạp', meaning: 'Cần cắn gọn nút thắt, xử lý thẳng vấn đề.', theme: 'dứt điểm' },
  { number: 22, name: 'Sơn Hỏa Bí', meaning: 'Vẻ ngoài sáng lên, hợp chăm chút hình ảnh và lời nói.', theme: 'tô điểm' },
  { number: 23, name: 'Sơn Địa Bác', meaning: 'Có dấu hiệu hao mòn, nên giảm rủi ro và giữ nền.', theme: 'giữ lại' },
  { number: 24, name: 'Địa Lôi Phục', meaning: 'Vận quay trở lại, cơ hội cũ có thể mở lần nữa.', theme: 'trở về' },
  { number: 25, name: 'Thiên Lôi Vô Vọng', meaning: 'Đừng ép điều không thuộc về mình, tự nhiên sẽ nhẹ hơn.', theme: 'thuận tự nhiên' },
  { number: 26, name: 'Sơn Thiên Đại Súc', meaning: 'Tích lực lớn, hợp để dành tài nguyên cho cú quan trọng.', theme: 'nén lực' },
  { number: 27, name: 'Sơn Lôi Di', meaning: 'Nuôi dưỡng bản thân, ăn ngủ và tinh thần cần được chăm.', theme: 'bồi bổ' },
  { number: 28, name: 'Trạch Phong Đại Quá', meaning: 'Gánh hơi nặng, nên bớt ôm đồm để không quá tải.', theme: 'giảm áp' },
  { number: 29, name: 'Khảm Vi Thủy', meaning: 'Nước sâu thử lòng, bình tĩnh thì qua được hiểm.', theme: 'vượt hiểm' },
  { number: 30, name: 'Ly Vi Hỏa', meaning: 'Ánh sáng rõ, hợp minh bạch và chọn điều mình tin.', theme: 'soi sáng' },
  { number: 31, name: 'Trạch Sơn Hàm', meaning: 'Dễ có rung động, cảm xúc chạm đúng điểm sẽ mở vận.', theme: 'giao cảm' },
  { number: 32, name: 'Lôi Phong Hằng', meaning: 'Bền bỉ là chìa khóa, làm đều hơn làm quá mạnh.', theme: 'lâu dài' },
  { number: 33, name: 'Thiên Sơn Độn', meaning: 'Lùi một bước để giữ thế, né đúng lúc là khôn.', theme: 'ẩn mình' },
  { number: 34, name: 'Lôi Thiên Đại Tráng', meaning: 'Lực mạnh đang lên, nhưng cần dùng lực cho đúng chỗ.', theme: 'bứt phá' },
  { number: 35, name: 'Hỏa Địa Tấn', meaning: 'Đường tiến sáng, hợp chủ động bước thêm một nhịp.', theme: 'tiến lên' },
  { number: 36, name: 'Địa Hỏa Minh Di', meaning: 'Ánh sáng bị che, nên kín tiếng và giữ điều quan trọng.', theme: 'giấu sáng' },
  { number: 37, name: 'Phong Hỏa Gia Nhân', meaning: 'Nhà và người thân là điểm tựa, hợp sửa nếp sinh hoạt.', theme: 'an gia' },
  { number: 38, name: 'Hỏa Trạch Khuê', meaning: 'Khác ý dễ xảy ra, nên tìm điểm chung trước.', theme: 'hòa khác biệt' },
  { number: 39, name: 'Thủy Sơn Kiển', meaning: 'Đường có trở ngại, đi vòng có khi lại nhanh.', theme: 'vượt khó' },
  { number: 40, name: 'Lôi Thủy Giải', meaning: 'Nút thắt được cởi, hợp buông bớt áp lực cũ.', theme: 'giải tỏa' },
  { number: 41, name: 'Sơn Trạch Tổn', meaning: 'Bớt đi để được lại, hy sinh nhỏ mở lợi lớn.', theme: 'tinh giản' },
  { number: 42, name: 'Phong Lôi Ích', meaning: 'Có dấu hiệu thêm lên, hợp nhận giúp đỡ và trao đi.', theme: 'tăng ích' },
  { number: 43, name: 'Trạch Thiên Quải', meaning: 'Điều bị nén dễ bung, cần quyết nhưng đừng nóng.', theme: 'quyết đoán' },
  { number: 44, name: 'Thiên Phong Cấu', meaning: 'Gặp duyên bất ngờ, vui nhưng cần tỉnh táo.', theme: 'gặp gỡ' },
  { number: 45, name: 'Trạch Địa Tụy', meaning: 'Năng lượng tụ lại, hợp team-up và gom nguồn lực.', theme: 'hội tụ' },
  { number: 46, name: 'Địa Phong Thăng', meaning: 'Từng bước đi lên, nhỏ mà chắc sẽ lên tầng.', theme: 'thăng tiến' },
  { number: 47, name: 'Trạch Thủy Khốn', meaning: 'Khó chịu tạm thời, giữ nhịp là qua đoạn hẹp.', theme: 'chịu lực' },
  { number: 48, name: 'Thủy Phong Tỉnh', meaning: 'Nguồn cũ vẫn có giá trị, quay về gốc để lấy lực.', theme: 'khơi nguồn' },
  { number: 49, name: 'Trạch Hỏa Cách', meaning: 'Đến lúc đổi cách, cải tổ nhỏ tạo vận mới.', theme: 'thay đổi' },
  { number: 50, name: 'Hỏa Phong Đỉnh', meaning: 'Vận nâng cấp, hợp làm thứ gì có dáng dấp lớn hơn.', theme: 'nâng tầm' },
  { number: 51, name: 'Chấn Vi Lôi', meaning: 'Tiếng sấm đánh thức, bất ngờ nhưng giúp tỉnh ra.', theme: 'thức tỉnh' },
  { number: 52, name: 'Cấn Vi Sơn', meaning: 'Nên dừng đúng lúc, đứng vững trước khi đi tiếp.', theme: 'tĩnh lại' },
  { number: 53, name: 'Phong Sơn Tiệm', meaning: 'Chậm mà chắc, vận đẹp đến theo nhịp từ từ.', theme: 'tiệm tiến' },
  { number: 54, name: 'Lôi Trạch Quy Muội', meaning: 'Duyên phụ thuộc hoàn cảnh, đừng để cảm xúc kéo quá xa.', theme: 'giữ chừng' },
  { number: 55, name: 'Lôi Hỏa Phong', meaning: 'Vận đang đầy, tranh thủ lúc sáng nhưng đừng phung phí.', theme: 'phong thịnh' },
  { number: 56, name: 'Hỏa Sơn Lữ', meaning: 'Thân như lữ khách, linh hoạt sẽ có đường.', theme: 'dịch chuyển' },
  { number: 57, name: 'Tốn Vi Phong', meaning: 'Gió len nhẹ mà sâu, lời mềm có sức mạnh.', theme: 'thẩm thấu' },
  { number: 58, name: 'Đoài Vi Trạch', meaning: 'Niềm vui mở vận, nói chuyện dễ đem lại cơ hội.', theme: 'vui vẻ' },
  { number: 59, name: 'Phong Thủy Hoán', meaning: 'Điều cũ tan ra, hợp giải tán căng thẳng và làm mới.', theme: 'tan mở' },
  { number: 60, name: 'Thủy Trạch Tiết', meaning: 'Có giới hạn là tốt, tiết chế giúp giữ vận.', theme: 'chừng mực' },
  { number: 61, name: 'Phong Trạch Trung Phù', meaning: 'Lòng tin là cốt lõi, chân thành dễ thắng.', theme: 'tín tâm' },
  { number: 62, name: 'Lôi Sơn Tiểu Quá', meaning: 'Lỗi nhỏ dễ sửa, đừng phóng đại chuyện chưa lớn.', theme: 'sửa nhẹ' },
  { number: 63, name: 'Thủy Hỏa Ký Tế', meaning: 'Việc đã thành, giữ thành quả quan trọng hơn mở thêm.', theme: 'hoàn tất' },
  { number: 64, name: 'Hỏa Thủy Vị Tế', meaning: 'Chưa xong nhưng gần tới, cần thêm một bước chuẩn.', theme: 'chờ hoàn thiện' }
];

function getVietnamDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatVietnamDate(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function isValidBirthDate(day, month, year) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function createEmbed(title, color = 0xf7b731) {
  const avatar = client.user?.displayAvatarURL();

  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setAuthor({
      name: 'Thầy Bà Studio',
      iconURL: avatar
    })
    .setThumbnail(avatar)
    .setTimestamp();
}

function finishEmbed(embed, interaction, code) {
  return embed.setFooter({
    text: `Gieo cho ${interaction.user.username} • ${compactDateTime()}`
  });
}

async function handleBirthReading(interaction) {
  const day = interaction.options.getInteger('ngay');
  const month = interaction.options.getInteger('thang');
  const year = interaction.options.getInteger('nam');

  if (!isValidBirthDate(day, month, year)) {
    await interaction.reply({
      content: 'Ngày sinh này không hợp lệ. Bạn kiểm tra lại ngày, tháng, năm giúp mình nha.',
      ephemeral: true
    });
    return;
  }

  const seed = `${day}-${month}-${year}`;
  const luckyNumber = (hashToNumber(`${seed}:number`) % 99) + 1;
  const luckyPercent = (hashToNumber(`${seed}:percent`) % 41) + 55;
  const lovePercent = (hashToNumber(`${seed}:love-percent`) % 36) + 60;
  const fortunePercent = (hashToNumber(`${seed}:fortune-percent`) % 36) + 60;
  const birthDetail = `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
  const code = displayCode('NS', seed, birthDetail);
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);
  const hexagram = getHexagram(seed);

  const embed = finishEmbed(createEmbed('Bói Ngày Sinh', 0xf7b731), interaction, code)
    .setDescription([
      `Hồ sơ vận mệnh vui cho ngày sinh **${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}**`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
      { name: 'Quẻ Kinh Dịch', value: formatHexagram(hexagram) },
      { name: 'Tổng quan', value: pick(personalityResults, `${seed}:personality`) },
      { name: 'Bảng vận trình', value: `\`\`\`\n${statLine('May mắn', luckyPercent)}\n${statLine('Tình duyên', lovePercent)}\n${statLine('Tài lộc', fortunePercent)}\n\`\`\`` },
      { name: 'Ấn tín hôm nay', value: `Cấp vận: **${fortuneTier(luckyPercent)}**\nCon số hợp vía: **${luckyNumber}**\nMàu hợp vía: **${color}**\nVật phẩm mở vận: **${item}**` },
      { name: 'Tình duyên', value: pick(loveResults, `${seed}:love`) },
      { name: 'Tài lộc', value: pick(fortuneResults, `${seed}:fortune`) }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handlePalmReading(interaction) {
  const image = interaction.options.getAttachment('anh');

  if (!image.contentType || !image.contentType.startsWith('image/')) {
    await interaction.reply({
      content: 'Bạn hãy gửi một file ảnh hợp lệ để bot bói chỉ tay vui nha.',
      ephemeral: true
    });
    return;
  }

  const seed = `${interaction.user.id}:palm`;
  const luckyPercent = (hashToNumber(`${seed}:percent`) % 46) + 50;
  const focusPercent = (hashToNumber(`${seed}:focus`) % 41) + 55;
  const code = displayCode('CT', seed);
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);
  const hexagram = getHexagram(seed);

  const embed = finishEmbed(createEmbed('Bói Chỉ Tay', 0x45aaf2), interaction, code)
    .setDescription([
      'Một quẻ chỉ tay vui vừa được mở.',
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
      { name: 'Quẻ Kinh Dịch', value: formatHexagram(hexagram) },
      { name: 'Vân tay hôm nay', value: pick(palmResults, seed) },
      { name: 'Bảng khí tay', value: `\`\`\`\n${statLine('Vận khí', luckyPercent)}\n${statLine('Tập trung', focusPercent)}\n\`\`\`` },
      { name: 'Ấn tín hôm nay', value: `Cấp vận: **${fortuneTier(luckyPercent)}**\nMàu hợp vía: **${color}**\nVật phẩm mở vận: **${item}**` },
      { name: 'Gợi ý nhỏ', value: 'Hôm nay hợp với việc làm điều nho nhỏ nhưng có ích, đừng kỳ vọng quá căng.' }
    )
    .setImage(image.url);

  await interaction.reply({ embeds: [embed] });
}

async function handleFaceReading(interaction) {
  const description = interaction.options.getString('mota', true).trim();
  const image = interaction.options.getAttachment('anh');

  if (image && (!image.contentType || !image.contentType.startsWith('image/'))) {
    await interaction.reply({
      content: 'Bạn hãy gửi một file ảnh hợp lệ nếu muốn xem nhân tướng kèm ảnh nha.',
      ephemeral: true
    });
    return;
  }

  const imageSeed = image ? `:${image.id}` : '';
  const seed = `${interaction.user.id}:${description.toLowerCase()}${imageSeed}:face`;
  const charm = (hashToNumber(`${seed}:charm`) % 41) + 58;
  const aura = (hashToNumber(`${seed}:aura`) % 41) + 58;
  const code = displayCode('NT', seed);
  const color = pick(luckyColors, `${seed}:color`);
  const hexagram = getHexagram(seed);

  const embed = finishEmbed(createEmbed('Bói Nhân Tướng', 0xa55eea), interaction, code)
    .setDescription([
      `Mô tả: ${description}`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
      { name: 'Quẻ Kinh Dịch', value: formatHexagram(hexagram) },
      { name: 'Nhận định vui', value: pick(faceResults, seed) },
      { name: 'Bảng khí sắc', value: `\`\`\`\n${statLine('Vận may', charm)}\n${statLine('Khí chất', aura)}\n\`\`\`` },
      { name: 'Ấn tín hôm nay', value: `Cấp vận: **${fortuneTier(charm)}**\nMàu hợp vía: **${color}**` },
      { name: 'Tính cách nổi bật', value: pick(personalityResults, `${seed}:personality`) },
      { name: 'Lời nhắc', value: 'Hãy dùng điểm mạnh để đối xử tốt với mình trước, rồi may mắn tự tìm đường đến.' }
    );

  if (image) {
    embed.setImage(image.url);
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleThienThuong(interaction) {
  const characterName = interaction.options.getString('ten', true).trim();
  const todayKey = getVietnamDateKey();
  const seed = `${characterName.toLowerCase()}:${todayKey}:thienthuong`;

  const luckyPercent = (hashToNumber(`${seed}:percent`) % 81) + 20;
  const pityPercent = (hashToNumber(`${seed}:pity`) % 51) + 35;
  const boldPercent = (hashToNumber(`${seed}:bold`) % 46) + 45;
  const bestDayOffset = (hashToNumber(`${seed}:day`) % 7) + 1;
  const bestHour = (hashToNumber(`${seed}:hour`) % 24);
  const bestMinute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][hashToNumber(`${seed}:minute`) % 12];
  const avoidHour = (bestHour + 11) % 24;
  const bestDate = addDays(new Date(), bestDayOffset);
  const code = displayCode('TT', seed, todayKey.replaceAll('-', ''));
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);
  const suggestedRolls = (hashToNumber(`${seed}:rolls`) % 5) + 1;
  const hexagram = getHexagram(seed);

  const embed = finishEmbed(createEmbed('Dự Đoán Thiên Thưởng', 0x20bf6b), interaction, code)
    .setDescription([
      `Nhân vật **${characterName}** vừa được gieo vận hôm nay.`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
      { name: 'Quẻ Kinh Dịch', value: formatHexagram(hexagram) },
      { name: 'Bảng Thiên Vận', value: `\`\`\`\n${statLine('May mắn', luckyPercent)}\n${statLine('Nhân phẩm', pityPercent)}\n${statLine('Dũng khí', boldPercent)}\n\`\`\`` },
      { name: 'Giờ đẹp', value: `**${String(bestHour).padStart(2, '0')}:${String(bestMinute).padStart(2, '0')}** giờ Việt Nam`, inline: true },
      { name: 'Giờ nên né', value: `**${String(avoidHour).padStart(2, '0')}:00** giờ Việt Nam`, inline: true },
      { name: 'Ngày đẹp trong 7 ngày tới', value: formatVietnamDate(bestDate) },
      { name: 'Chiến thuật đề xuất', value: `Cấp vận: **${fortuneTier(luckyPercent)}**\nThử khoảng **${suggestedRolls}** lượt, dừng khi tâm bắt đầu nóng.\nMàu hợp vía: **${color}**\nVật phẩm mở vận: **${item}**` },
      { name: 'Lời khuyên vui', value: pick(adviceResults, seed) }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleHelp(interaction) {
  const code = displayCode('HELP', `${interaction.user.id}:help`);
  const embed = finishEmbed(createEmbed('Bot Bói Toán - Hướng Dẫn', 0xffc048), interaction, code)
    .setDescription('Bảng lệnh nhanh của Thầy Bà Studio.')
    .addFields(
      { name: '/boingaysinh', value: 'Nhập ngày, tháng, năm sinh để xem tính cách, may mắn, tình duyên, tài lộc.' },
      { name: '/boichitay', value: 'Gửi ảnh bàn tay để nhận kết quả bói vui theo user ID.' },
      { name: '/boinhan_tuong', value: 'Nhập mô tả khuôn mặt hoặc tính cách, có thể gửi thêm ảnh chân dung.' },
      { name: '/thienthuong', value: 'Nhập tên nhân vật game để dự đoán tỉ lệ may mắn, ngày đẹp và giờ đẹp.' },
      { name: 'Phong cách trả lời', value: 'Mỗi quẻ có mã riêng, một quẻ trong 64 quẻ Kinh Dịch, thang vận khí và cấp vận may.' }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

client.once('clientReady', async () => {
  console.log(`Bot Bói Toán đã đăng nhập với tên ${client.user.tag}`);

  try {
    await client.application.commands.set(commands);
    console.log('Đã deploy slash commands global. Discord có thể mất vài phút để cập nhật.');
  } catch (error) {
    console.error('Không deploy được slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'boingaysinh') {
      await handleBirthReading(interaction);
      return;
    }

    if (interaction.commandName === 'boichitay') {
      await handlePalmReading(interaction);
      return;
    }

    if (interaction.commandName === 'boinhan_tuong') {
      await handleFaceReading(interaction);
      return;
    }

    if (interaction.commandName === 'thienthuong') {
      await handleThienThuong(interaction);
      return;
    }

    if (interaction.commandName === 'help') {
      await handleHelp(interaction);
    }
  } catch (error) {
    console.error(`Lỗi khi xử lý /${interaction.commandName}:`, error);

    const message = {
      content: 'Có lỗi xảy ra khi xem quẻ. Bạn thử lại sau một chút nha.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  }
});

client.login(TOKEN);
