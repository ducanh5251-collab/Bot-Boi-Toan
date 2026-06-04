const crypto = require('node:crypto');
const {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  SlashCommandBuilder
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('Thieu TOKEN. Hay tao file .env hoac cau hinh bien moi truong TOKEN tren Railway.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DISCLAIMER = 'Noi dung chi mang tinh giai tri, khong khang dinh dung that va khong thay the loi khuyen thuc te.';

// Danh sach slash commands. Bot tu deploy commands khi ready nen chi can TOKEN.
const commands = [
  new SlashCommandBuilder()
    .setName('boingaysinh')
    .setDescription('Boi vui theo ngay, thang, nam sinh.')
    .addIntegerOption(option =>
      option
        .setName('ngay')
        .setDescription('Ngay sinh cua ban')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31)
    )
    .addIntegerOption(option =>
      option
        .setName('thang')
        .setDescription('Thang sinh cua ban')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    )
    .addIntegerOption(option =>
      option
        .setName('nam')
        .setDescription('Nam sinh cua ban')
        .setRequired(true)
        .setMinValue(1900)
        .setMaxValue(2100)
    ),

  new SlashCommandBuilder()
    .setName('boichitay')
    .setDescription('Boi vui theo anh ban tay, khong dung AI that.')
    .addAttachmentOption(option =>
      option
        .setName('anh')
        .setDescription('Anh ban tay cua ban')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('boinhan_tuong')
    .setDescription('Boi nhan tuong hoc vui theo mo ta cua ban.')
    .addStringOption(option =>
      option
        .setName('mota')
        .setDescription('Mo ta khuon mat, phong thai hoac tinh cach')
        .setRequired(true)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName('thienthuong')
    .setDescription('Du doan ngay de ra Thien Thuong theo ten nhan vat.')
    .addStringOption(option =>
      option
        .setName('ten')
        .setDescription('Ten nhan vat trong game')
        .setRequired(true)
        .setMaxLength(80)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Huong dan su dung Bot Boi Toan.')
].map(command => command.toJSON());

const personalityResults = [
  'Ban co truc giac kha tot, hay nhin ra van de truoc khi nguoi khac kip dat cau hoi.',
  'Ban ben ngoai co ve binh than, nhung ben trong la nguoi rat de rung dong voi dieu tu te.',
  'Ban hop voi viec tu minh quyet dinh, cang bi thuc ep cang muon di nguoc lai.',
  'Ban co nang luong cham ma chac, thanh cong thuong den khi ban kien tri hon mot chut.'
];

const loveResults = [
  'Tinh duyen hom nay hop voi loi noi mem va mot tin nhan dung luc.',
  'Ban de gap nguoi cung tan so neu bot doan y va noi thang dieu minh muon.',
  'Nguoi hop voi ban thuong la nguoi biet lang nghe, khong lam moi chuyen on ao.',
  'Duyen dang len khi ban cuoi nhieu hon va bot tu cham diem minh qua gat.'
];

const fortuneResults = [
  'Tai loc co dau hieu nho ma vui, hop voi viec gom nhat co hoi hon la tat tay.',
  'Tien bac nen di theo ke hoach ro rang, dung de cam xuc bam nut thanh toan.',
  'Van may tai chinh nam o su deu dan, moi ngay mot chut se co ket qua dep.',
  'Hom nay hop voi viec sap xep vi tien, huy bot thu khong can va giu lai thu dang gia.'
];

const palmResults = [
  'Duong sinh dao trong anh cho thay ban co suc bat tinh than tot, gap kho van biet tim cach quay lai.',
  'Duong tri dao noi len ban nghi nhieu, nhung khi da quyet thi rat kho lung lay.',
  'Duong tam dao co ve mem, hop voi nguoi song tinh cam va hay quan tam nguoi khac am tham.',
  'Long ban tay mang nang luong "sap trung lon", nhung van nen ngu som de may man khong bi met.'
];

const faceResults = [
  'Mo ta cua ban goi y mot nguoi co khi chat thang than, de tao niem tin voi nguoi xung quanh.',
  'Net tuong vui cho thay ban co duyen an noi, hop lam cau noi trong nhom.',
  'Ban co tuong cua nguoi can than, hay suy nghi truoc khi hanh dong nen it khi nga qua dau.',
  'Than thai cua ban hop voi may man kieu cham den nhung ben, cang nghiem tuc cang sang.'
];

const adviceResults = [
  'Quay thu van may sau khi uong nuoc, hit tho sau va khong doc cau than chu qua to.',
  'Neu truot, hay coi nhu vu tru dang bao ban de danh nhan pham cho lan sau.',
  'Truoc khi quay, sap xep tui do cho gon. Tam gon thi van cung gon.',
  'Dung quay luc dang cay. May man rat ngai nhung nguoi bam nut bang nong gian.',
  'Hay goi ten nhan vat mot cach tran trong. Biet dau he thong cung thich lich su.'
];

function hashToNumber(input) {
  const hash = crypto.createHash('sha256').update(String(input)).digest('hex');
  return Number.parseInt(hash.slice(0, 12), 16);
}

function pick(list, seed) {
  return list[hashToNumber(seed) % list.length];
}

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

function createEmbed(title, description, color = 0xf7b731) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: DISCLAIMER })
    .setTimestamp();
}

async function handleBirthReading(interaction) {
  const day = interaction.options.getInteger('ngay');
  const month = interaction.options.getInteger('thang');
  const year = interaction.options.getInteger('nam');

  if (!isValidBirthDate(day, month, year)) {
    await interaction.reply({
      content: 'Ngay sinh nay khong hop le. Ban kiem tra lai ngay, thang, nam giup minh nha.',
      ephemeral: true
    });
    return;
  }

  const seed = `${day}-${month}-${year}`;
  const luckyNumber = (hashToNumber(`${seed}:number`) % 99) + 1;
  const luckyPercent = (hashToNumber(`${seed}:percent`) % 41) + 55;

  const embed = createEmbed(
    'Boi ngay sinh',
    [
      `**Ngay sinh:** ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      `**Tinh cach:** ${pick(personalityResults, `${seed}:personality`)}`,
      `**May man:** Hom nay nang luong may man cua ban dat **${luckyPercent}%**. Con so vui: **${luckyNumber}**.`,
      `**Tinh duyen:** ${pick(loveResults, `${seed}:love`)}`,
      `**Tai loc:** ${pick(fortuneResults, `${seed}:fortune`)}`,
      '',
      `_${DISCLAIMER}_`
    ].join('\n')
  );

  await interaction.reply({ embeds: [embed] });
}

async function handlePalmReading(interaction) {
  const image = interaction.options.getAttachment('anh');

  if (!image.contentType || !image.contentType.startsWith('image/')) {
    await interaction.reply({
      content: 'Ban hay gui mot file anh hop le de bot boi chi tay vui nha.',
      ephemeral: true
    });
    return;
  }

  const seed = `${interaction.user.id}:palm`;
  const luckyPercent = (hashToNumber(`${seed}:percent`) % 46) + 50;

  const embed = createEmbed(
    'Boi chi tay',
    [
      '**Ket qua doc van tay vui:**',
      pick(palmResults, seed),
      `**Do may man gan day:** ${luckyPercent}%`,
      '**Goi y:** Hom nay hop voi viec lam dieu nho nhung co ich, dung ky vong qua cang.',
      '',
      '_Bot chi tra ket qua ngau nhien on dinh theo user ID, khong phan tich anh bang AI._',
      `_${DISCLAIMER}_`
    ].join('\n'),
    0x45aaf2
  ).setImage(image.url);

  await interaction.reply({ embeds: [embed] });
}

async function handleFaceReading(interaction) {
  const description = interaction.options.getString('mota', true).trim();
  const seed = `${interaction.user.id}:${description.toLowerCase()}:face`;
  const charm = (hashToNumber(`${seed}:charm`) % 41) + 58;

  const embed = createEmbed(
    'Boi nhan tuong hoc vui',
    [
      `**Mo ta:** ${description}`,
      `**Nhan dinh vui:** ${pick(faceResults, seed)}`,
      `**Do hut van may:** ${charm}%`,
      `**Tinh cach noi bat:** ${pick(personalityResults, `${seed}:personality`)}`,
      `**Loi nhac:** Hay dung diem manh de doi xu tot voi minh truoc, roi may man tu tim duong den.`,
      '',
      `_${DISCLAIMER}_`
    ].join('\n'),
    0xa55eea
  );

  await interaction.reply({ embeds: [embed] });
}

async function handleThienThuong(interaction) {
  const characterName = interaction.options.getString('ten', true).trim();
  const todayKey = getVietnamDateKey();
  const seed = `${characterName.toLowerCase()}:${todayKey}:thienthuong`;

  const luckyPercent = (hashToNumber(`${seed}:percent`) % 81) + 20;
  const bestDayOffset = (hashToNumber(`${seed}:day`) % 7) + 1;
  const bestHour = (hashToNumber(`${seed}:hour`) % 24);
  const bestMinute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][hashToNumber(`${seed}:minute`) % 12];
  const bestDate = addDays(new Date(), bestDayOffset);

  const embed = createEmbed(
    'Du doan Thien Thuong',
    [
      `**Nhan vat:** ${characterName}`,
      `**Ti le may man hom nay:** ${luckyPercent}%`,
      `**Ngay dep trong 7 ngay toi:** ${formatVietnamDate(bestDate)}`,
      `**Gio dep:** ${String(bestHour).padStart(2, '0')}:${String(bestMinute).padStart(2, '0')} (gio Viet Nam)`,
      `**Loi khuyen vui:** ${pick(adviceResults, seed)}`,
      '',
      '_Ket qua duoc random on dinh theo ten nhan vat va ngay hien tai._',
      `_${DISCLAIMER}_`
    ].join('\n'),
    0x20bf6b
  );

  await interaction.reply({ embeds: [embed] });
}

async function handleHelp(interaction) {
  const embed = createEmbed(
    'Bot Boi Toan - Huong dan',
    [
      '**/boingaysinh** - Nhap ngay, thang, nam sinh de xem tinh cach, may man, tinh duyen, tai loc.',
      '**/boichitay** - Gui anh ban tay de nhan ket qua boi vui ngau nhien on dinh theo user ID.',
      '**/boinhan_tuong** - Nhap mo ta khuon mat/tinh cach de xem nhan tuong hoc vui.',
      '**/thienthuong** - Nhap ten nhan vat game de du doan ti le may man, ngay dep, gio dep.',
      '**/help** - Xem huong dan nay.',
      '',
      `_${DISCLAIMER}_`
    ].join('\n'),
    0xffc048
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

client.once('ready', async () => {
  console.log(`Bot Boi Toan da dang nhap voi ten ${client.user.tag}`);

  try {
    await client.application.commands.set(commands);
    console.log('Da deploy slash commands global. Discord co the mat vai phut de cap nhat.');
  } catch (error) {
    console.error('Khong deploy duoc slash commands:', error);
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
    console.error(`Loi khi xu ly /${interaction.commandName}:`, error);

    const message = {
      content: 'Co loi xay ra khi xem que. Ban thu lai sau mot chut nha.',
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
