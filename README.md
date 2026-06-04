# Bot Boi Toan

Discord bot boi toan vui bang Node.js, discord.js v14 va slash commands.

> Tat ca noi dung boi toan trong bot chi mang tinh giai tri, khong khang dinh dung that.

## Chuc nang

- `/boingaysinh`: Nhap ngay, thang, nam sinh de xem tinh cach, may man, tinh duyen, tai loc.
- `/boichitay`: Gui anh ban tay, bot tra ket qua boi vui ngau nhien on dinh theo user ID. Bot khong dung AI that.
- `/boinhan_tuong`: Nhap mo ta khuon mat/tinh cach de xem nhan tuong hoc vui.
- `/thienthuong`: Nhap ten nhan vat game de du doan ti le may man hom nay, ngay dep trong 7 ngay toi, gio dep va loi khuyen vui.
- `/help`: Xem huong dan su dung bot.

## Yeu cau

- Node.js 18 tro len
- Discord bot token

## Cai dat local

```bash
npm install
```

Tao file `.env` tu file mau:

```bash
cp .env.example .env
```

Mo `.env` va dien token:

```env
TOKEN=your_discord_bot_token_here
```

Chay bot:

```bash
npm start
```

Khi bot khoi dong, bot se tu deploy slash commands global. Discord co the mat vai phut de hien command moi.

## Moi bot vao server Discord

Trong Discord Developer Portal:

1. Mo ung dung bot cua ban.
2. Vao **OAuth2 > URL Generator**.
3. Chon scope:
   - `bot`
   - `applications.commands`
4. Chon bot permissions phu hop, toi thieu co the dung:
   - `Send Messages`
   - `Embed Links`
   - `Use Slash Commands`
5. Mo URL duoc tao va moi bot vao server.

## Deploy len Railway

1. Day project nay len GitHub.
2. Tao project moi tren Railway va chon repo GitHub.
3. Trong Railway, vao **Variables** va them:

```env
TOKEN=your_discord_bot_token_here
```

4. Railway se chay:

```bash
npm install
npm start
```

Neu Railway khong tu nhan lenh start, hay dat Start Command la:

```bash
npm start
```

## Deploy len Koyeb neu Railway khong dung duoc

Koyeb co the chay project tu GitHub va can mot cong HTTP de health check. Project nay da co health server tu dong dung bien `PORT`, nen co the deploy nhu web service.

1. Vao Koyeb va tao app/service moi tu GitHub.
2. Chon repo `Bot-Boi-Toan`.
3. Chon branch `main`.
4. Build command:

```bash
npm install
```

5. Run command:

```bash
npm start
```

6. Them bien moi truong:

```env
TOKEN=your_discord_bot_token_here
```

7. Deploy va doi log hien:

```text
Bot Boi Toan da dang nhap voi ten ...
```

Neu slash command chua hien ngay trong Discord, hay doi vai phut vi command global can thoi gian dong bo.

## Ghi chu ky thuat

- Bot dung `discord.js` v14.
- Code viet bang JavaScript CommonJS.
- Khong dung prefix commands, chi dung slash commands.
- Slash commands duoc deploy global khi bot ready bang `client.application.commands.set(...)`.
- `/thienthuong` random on dinh theo ten nhan vat va ngay hien tai tai mui gio Viet Nam.
- `/boichitay` khong phan tich anh that, chi dung anh lam dau vao va tra ket qua vui theo user ID.
- Co health server dung `process.env.PORT` de deploy duoc tren cac nen tang can HTTP health check.
