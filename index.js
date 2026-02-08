const { Telegraf, Markup, session } = require('telegraf');
const { TelegramClient, Api } = require('gramjs');
const { StringSession } = require('gramjs/sessions');
const fetch = require('node-fetch');
const QRCode = require('qrcode');
const randomString = require('string-random');
const config = require('./config');

const bot = new Telegraf(config.BOT_TOKEN);
bot.use(session());

// Database Palsu (Gunakan MongoDB untuk permanen)
let db = {
    users: {}, 
    stok: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] },
    products: {
        1: { name: 'Telegram ID 1', price: 15000 },
        2: { name: 'Telegram ID 2', price: 15000 },
        // ... dst
    },
    isMaintenance: false
};

// --- MIDDLEWARE CHECK ---
bot.use((ctx, next) => {
    if (db.isMaintenance && ctx.from.id !== config.ADMIN_ID) {
        return ctx.reply("⚠️ Bot sedang maintenance.");
    }
    if (ctx.from && !db.users[ctx.from.id]) {
        db.users[ctx.from.id] = { balance: 0, history: [] };
    }
    return next();
});

// --- MENU UTAMA ---
bot.start((ctx) => {
    const text = `✨ *SELAMAT DATANG DI OTP STORE* ✨\n\n` +
                 `👤 *User:* ${ctx.from.first_name}\n` +
                 `💰 *Saldo:* Rp ${db.users[ctx.from.id].balance.toLocaleString()}\n\n` +
                 `Silahkan pilih menu di bawah:`;
    
    ctx.replyWithMarkdown(text, Markup.inlineKeyboard([
        [Markup.button.callback('🛍️ Belanja', 'menu_belanja')],
        [Markup.button.callback('💳 Profile / Deposit', 'menu_profile')]
    ]));
});

// --- KATEGORI BELANJA ---
bot.action('menu_belanja', (ctx) => {
    let rows = [];
    for (let i = 1; i <= 8; i++) {
        const count = db.stok[i].length;
        rows.push([Markup.button.callback(`ID ${i} (${count} STOK)`, `view_cat_${i}`)]);
    }
    rows.push([Markup.button.callback('⬅️ Kembali', 'start_node')]);
    ctx.editMessageText("📂 *Pilih Kategori ID:*", {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(rows)
    });
});

// --- DETAIL PRODUK ---
bot.action(/^view_cat_(\d+)$/, (ctx) => {
    const catId = ctx.match[1];
    const prod = db.products[catId] || { name: 'Produk Baru', price: 15000 };
    
    const text = `🛒 *Konfirmasi Pembelian*\n\n` +
                 `🆔 ID: ${Math.floor(Math.random() * 900000000)}\n` +
                 `📦 Nama: ${prod.name}\n` +
                 `🌍 Negara: Indonesia\n` +
                 `💰 Harga: Rp ${prod.price.toLocaleString()}\n\n` +
                 `Apakah Anda ingin membeli akun ini?`;

    ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Beli Sekarang', `confirm_buy_${catId}`)],
            [Markup.button.callback('❌ Cancel', 'menu_belanja')]
        ])
    });
});

// --- PROSES BELI ---
bot.action(/^confirm_buy_(\d+)$/, async (ctx) => {
    const catId = ctx.match[1];
    const price = db.products[catId]?.price || 15000;
    const user = db.users[ctx.from.id];

    if (user.balance < price) {
        return ctx.answerCbQuery("⚠️ Saldo tidak cukup! Silahkan deposit.", { show_alert: true });
    }
    if (db.stok[catId].length === 0) {
        return ctx.answerCbQuery("⚠️ Stok habis!", { show_alert: true });
    }

    const account = db.stok[catId].shift(); // Ambil stok terlama
    user.balance -= price;

    ctx.editMessageText(`✅ *Berhasil Membeli!*\n\nNomor: \`${account.phone}\`\n\nSilahkan klik tombol di bawah untuk mendapatkan kode SMS dari Telegram.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📩 Cek SMS Terbaru', `cek_sms_${account.session}`)],
            [Markup.button.callback('🗑️ Hapus Session / Selesai', 'start_node')]
        ])
    });
});

// --- FITUR CEK SMS (USERBOT LOGIC) ---
bot.action(/^cek_sms_(.+)$/, async (ctx) => {
    const sessionStr = ctx.match[1];
    const client = new TelegramClient(new StringSession(sessionStr), config.API_ID, config.API_HASH, {});
    
    try {
        await client.connect();
        const messages = await client.getMessages(777000, { limit: 1 });
        if (messages.length > 0) {
            const msgText = messages[0].message;
            const code = msgText.match(/\d{5}/); // Ambil angka 5 digit
            ctx.answerCbQuery(`📩 Kode: ${code ? code[0] : 'Belum ada code'}`, { show_alert: true });
        } else {
            ctx.answerCbQuery("❌ Belum ada SMS masuk.");
        }
    } catch (e) {
        ctx.answerCbQuery("❌ Gagal akses session.");
    } finally {
        await client.disconnect();
    }
});

// --- DEPOSIT ATLANTIC ---
bot.action('menu_profile', (ctx) => {
    ctx.editMessageText(`👤 *PROFIL USER*\n\nID: \`${ctx.from.id}\`\nSaldo: Rp ${db.users[ctx.from.id].balance.toLocaleString()}\n\nKlik tombol di bawah untuk isi saldo:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('💳 Deposit QRIS', 'depo_qris')]])
    });
});

bot.action('depo_qris', async (ctx) => {
    const nominal = 15000; // Contoh statis, bisa buat input dinamis
    const reff_id = randomString(12);

    const body = new URLSearchParams({
        api_key: config.API_KEY_ATLANTIC,
        reff_id: reff_id,
        nominal: nominal,
        type: 'ewallet',
        metode: 'qris'
    });

    const res = await fetch(`${config.BASE_URL}/deposit/create`, { method: 'POST', body }).then(r => r.json());

    if (res.status) {
        const qrBuffer = await QRCode.toBuffer(res.data.qr_string);
        ctx.replyWithPhoto({ source: qrBuffer }, {
            caption: `🛒 *PEMBAYARAN QRIS*\n\nID: \`${res.data.id}\`\nNominal: Rp ${res.data.nominal}\n\nScan QR di atas. Saldo otomatis masuk.`,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Cek Status', `check_status_${res.data.id}`)],
                [Markup.button.callback('❌ Cancel', `cancel_depo_${res.data.id}`)]
            ])
        });
    }
});

bot.action(/^check_status_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const body = new URLSearchParams({ api_key: config.API_KEY_ATLANTIC, id });
    const res = await fetch(`${config.BASE_URL}/deposit/status`, { method: 'POST', body }).then(r => r.json());

    if (res.data.status === 'success') {
        db.users[ctx.from.id].balance += parseInt(res.data.get_balance);
        ctx.reply("✅ Saldo berhasil ditambahkan!");
    } else if (res.data.status === 'processing') {
        // Tembak Instant
        await fetch(`${config.BASE_URL}/deposit/instant`, { 
            method: 'POST', 
            body: new URLSearchParams({ api_key: config.API_KEY_ATLANTIC, id, action: 'true' }) 
        });
        ctx.answerCbQuery("⏳ Sedang diproses sistem instant...");
    } else {
        ctx.answerCbQuery(`Status: ${res.data.status}`);
    }
});

// --- OWNER MENU (ADD STOK & MAINTENANCE) ---
bot.command('admin', (ctx) => {
    if (ctx.from.id !== config.ADMIN_ID) return;
    ctx.reply("👨‍💻 *Owner Menu*", Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Stok', 'admin_add_stok')],
        [Markup.button.callback('📢 Broadcast', 'admin_bc')],
        [Markup.button.callback('🛠 Maintenance', 'admin_mt')]
    ]));
});

bot.action('admin_add_stok', (ctx) => {
    ctx.reply("Kirim detail stok dengan format:\n`ID|Nomor|SessionString`\nContoh: `1|+628123|TGSESSION...`", { parse_mode: 'Markdown' });
    bot.on('text', async (ctx) => {
        if (ctx.from.id !== config.ADMIN_ID) return;
        const input = ctx.message.text.split('|');
        if (input.length === 3) {
            db.stok[input[0]].push({ phone: input[1], session: input[2] });
            ctx.reply(`✅ Stok kategori ${input[0]} berhasil ditambah!`);
        }
    });
});

bot.launch();
console.log("🚀 Bot is running...");
