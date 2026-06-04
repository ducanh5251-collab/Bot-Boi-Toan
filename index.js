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
    text: `Gieo cho ${interaction.user.username} • Mã ${code} • ${compactDateTime()}`
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
  const code = readingCode(seed);
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);

  const embed = finishEmbed(createEmbed('Bói Ngày Sinh', 0xf7b731), interaction, code)
    .setDescription([
      `Hồ sơ vận mệnh vui cho ngày sinh **${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}**`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
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
  const code = readingCode(seed);
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);

  const embed = finishEmbed(createEmbed('Bói Chỉ Tay', 0x45aaf2), interaction, code)
    .setDescription([
      'Một quẻ chỉ tay vui vừa được mở.',
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
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
  const seed = `${interaction.user.id}:${description.toLowerCase()}:face`;
  const charm = (hashToNumber(`${seed}:charm`) % 41) + 58;
  const aura = (hashToNumber(`${seed}:aura`) % 41) + 58;
  const code = readingCode(seed);
  const color = pick(luckyColors, `${seed}:color`);

  const embed = finishEmbed(createEmbed('Bói Nhân Tướng', 0xa55eea), interaction, code)
    .setDescription([
      `Mô tả: ${description}`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
      { name: 'Nhận định vui', value: pick(faceResults, seed) },
      { name: 'Bảng khí sắc', value: `\`\`\`\n${statLine('Vận may', charm)}\n${statLine('Khí chất', aura)}\n\`\`\`` },
      { name: 'Ấn tín hôm nay', value: `Cấp vận: **${fortuneTier(charm)}**\nMàu hợp vía: **${color}**` },
      { name: 'Tính cách nổi bật', value: pick(personalityResults, `${seed}:personality`) },
      { name: 'Lời nhắc', value: 'Hãy dùng điểm mạnh để đối xử tốt với mình trước, rồi may mắn tự tìm đường đến.' }
    );

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
  const code = readingCode(seed);
  const color = pick(luckyColors, `${seed}:color`);
  const item = pick(luckyItems, `${seed}:item`);
  const suggestedRolls = (hashToNumber(`${seed}:rolls`) % 5) + 1;

  const embed = finishEmbed(createEmbed('Dự Đoán Thiên Thưởng', 0x20bf6b), interaction, code)
    .setDescription([
      `Nhân vật **${characterName}** vừa được gieo vận hôm nay.`,
      `Mã quẻ: \`${code}\``
    ].join('\n'))
    .addFields(
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
  const code = readingCode(`${interaction.user.id}:help`);
  const embed = finishEmbed(createEmbed('Bot Bói Toán - Hướng Dẫn', 0xffc048), interaction, code)
    .setDescription('Bảng lệnh nhanh của Thầy Bà Studio.')
    .addFields(
      { name: '/boingaysinh', value: 'Nhập ngày, tháng, năm sinh để xem tính cách, may mắn, tình duyên, tài lộc.' },
      { name: '/boichitay', value: 'Gửi ảnh bàn tay để nhận kết quả bói vui theo user ID.' },
      { name: '/boinhan_tuong', value: 'Nhập mô tả khuôn mặt hoặc tính cách để xem nhân tướng học vui.' },
      { name: '/thienthuong', value: 'Nhập tên nhân vật game để dự đoán tỉ lệ may mắn, ngày đẹp và giờ đẹp.' },
      { name: 'Phong cách trả lời', value: 'Mỗi quẻ có mã riêng, thang vận khí và cấp vận may để nhìn rõ hơn trong Discord.' }
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
