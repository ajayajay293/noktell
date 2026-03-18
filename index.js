const { Telegraf, Markup, session } = require('telegraf');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fetch = require('node-fetch');
const QRCode = require('qrcode');
const randomString = require('string-random');
const mongoose = require('mongoose');

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
const CONFIG = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8480950575:AAHia_I10prqfaqrngpa0RjPpUvw6senKFM',
    ADMIN_ID: parseInt(process.env.ADMIN_ID) || 6816905895,
    API_KEY_ATLANTIC: process.env.API_KEY_ATLANTIC || 'tNsjYGvhNa3pHUd93AuiqcouNvyR8vsAwKJ9NETbk1CF3WdPTMXxAT1EPJjCU9nh14d5OqfHzaMka875teSDuPLPFcSsYkXXe7dn',
    BASE_URL_ATLANTIC: 'https://atlantich2h.com',
    API_ID: parseInt(process.env.API_ID) || 31639742,
    API_HASH: process.env.API_HASH || '7c24cdee5f2b98ad27b0b8f0a07e566a',
    MAIN_IMG: process.env.MAIN_IMG || 'https://foto-to-url.gt.tc/uploads/img_698dec1092ab74.42210595.png',
    CHANNELS: (process.env.CHANNELS || '@xStoreNoktel,@StoreRealll').split(','),
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://cmurah60_db_user:6RHof8abbe5nQeij@ajayajay.i7lyfmk.mongodb.net/?appName=ajayajay'
};

const BOT_START_TIME = Date.now();

const bot = new Telegraf(CONFIG.BOT_TOKEN);
bot.use(session());

// ==========================================
// 🎨 EMOJI CONFIGURATION (Premium Custom Emoji IDs)
// ==========================================
const EMOJI = {
    BACK: '5258236805890710909',
    WARNING: '5447644880824181073',
    DIAMOND: '5427168083074628963',
    STAR: '5438496463044752972',
    LIGHTNING: '5456140674028019486',
    EXCLAMATION_1: '5274099962655816924',
    EXCLAMATION_2: '5440660757194744323',
    ROCKET: '5188481279963715781',
    MONEY_BAG: '5348503265967355284',
    PIN: '5397782960512444700',
    BELL: '5990205245806875298',
    CHECKMARK: '5992265524438896830',
    DOLLAR: '5409048419211682843',
    PLUS: '5397916757333654639',
    X: '5210952531676504517',
    WALLET: '5258204546391351475',
    DANA: '6084363758002505799',
    QRIS: '6084682277072144595',
    OVO: '6084653543740934225',
    SHOPPING: '5972815211575904518',  // 🛍️
    USER: '5972891453262454701',      // 👤
    GEAR: '5972860934871314434',      // ⚙️
    PACKAGE: '5972889345537263616',   // 📦
    SOS: '5972873889429877018',       // 🆘
    CROWN: '5972901234567890123',     // 👑
    CHART: '5972912345678901234',     // 📊
    FIRE: '5972923456789012345',      // 🔥
    TOOLS: '5972934567890123456',     // 🛠️
    PENCIL: '5972945678901234567'     // ✏️
};

// ==========================================
// 🗄️ MONGOOSE SCHEMAS
// ==========================================
const AccountSchema = new mongoose.Schema({
    category: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    tgId: { type: String, required: true },
    price: { type: Number, required: true },
    session: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, default: null },
    balance: { type: Number, default: 0 },
    orders: { type: Array, default: [] },
    deposits: { type: Array, default: [] },
    role: { type: String, default: 'Member' },
    createdAt: { type: Date, default: Date.now }
});

const DepositSchema = new mongoose.Schema({
    depositId: { type: String, required: true, unique: true },
    userId: { type: Number, required: true },
    chatId: { type: Number, required: true },
    msgId: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    nominal: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const Account = mongoose.model('Account', AccountSchema);
const User = mongoose.model('User', UserSchema);
const Deposit = mongoose.model('Deposit', DepositSchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// ==========================================
// 🗄️ DATABASE FUNCTIONS
// ==========================================
async function connectDB() {
    try {
        await mongoose.connect(CONFIG.MONGODB_URI);
        console.log('✅ MongoDB Connected');
        
        for (let i = 1; i <= 8; i++) {
            const existing = await Settings.findOne({ key: `price_${i}` });
            if (!existing) {
                await Settings.create({ key: `price_${i}`, value: 15000 });
            }
        }
        
        const maint = await Settings.findOne({ key: 'maintenance' });
        if (!maint) {
            await Settings.create({ key: 'maintenance', value: false });
        }
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
}

async function getPrice(category) {
    const setting = await Settings.findOne({ key: `price_${category}` });
    return setting ? setting.value : 15000;
}

async function setPrice(category, price) {
    await Settings.findOneAndUpdate(
        { key: `price_${category}` },
        { value: price },
        { upsert: true }
    );
}

async function getPromo(category) {
    const setting = await Settings.findOne({ key: `promo_${category}` });
    return setting ? setting.value : null;
}

async function setPromo(category, price) {
    await Settings.findOneAndUpdate(
        { key: `promo_${category}` },
        { value: price },
        { upsert: true }
    );
}

async function getMaintenance() {
    const setting = await Settings.findOne({ key: 'maintenance' });
    return setting ? setting.value : false;
}

async function setMaintenance(status) {
    await Settings.findOneAndUpdate(
        { key: 'maintenance' },
        { value: status },
        { upsert: true }
    );
}

async function getStocks(category) {
    return await Account.find({ category });
}

async function getAllStocks() {
    const stocks = await Account.find();
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
    stocks.forEach(acc => {
        if (grouped[acc.category]) {
            grouped[acc.category].push(acc);
        }
    });
    return grouped;
}

async function addStock(category, accountData) {
    const account = new Account({
        category,
        name: accountData.name,
        phone: accountData.phone,
        tgId: accountData.tgId,
        price: accountData.price,
        session: accountData.session
    });
    await account.save();
    return account;
}

async function removeStock(category, accountId) {
    await Account.findByIdAndDelete(accountId);
}

async function getUser(userId) {
    return await User.findOne({ userId });
}

async function createUser(userData) {
    const user = new User(userData);
    await user.save();
    return user;
}

async function updateUserBalance(userId, amount) {
    await User.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } }
    );
}

async function addOrder(userId, orderData) {
    await User.findOneAndUpdate(
        { userId },
        { $push: { orders: orderData } }
    );
}

async function addDeposit(userId, depositData) {
    await User.findOneAndUpdate(
        { userId },
        { $push: { deposits: depositData } }
    );
}

async function getDeposit(depositId) {
    return await Deposit.findOne({ depositId });
}

async function createDeposit(depositData) {
    const deposit = new Deposit(depositData);
    await deposit.save();
    return deposit;
}

async function updateDepositStatus(depositId, status) {
    await Deposit.findOneAndUpdate(
        { depositId },
        { status }
    );
}

async function getAllUsers() {
    return await User.find();
}

async function getTotalStock() {
    return await Account.countDocuments();
}

async function getTotalBalance() {
    const result = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    return result[0]?.total || 0;
}

// ==========================================
// 🎨 UI COMPONENTS
// ==========================================
const UI = {
    top: `<b>◈ ━━━━━━ [ 𝗡𝗢𝗞𝗧𝗘𝗟 𝗦𝗧𝗢𝗥𝗘 ] ━━━━━━ ◈</b>`,
    q: (text) => `<blockquote>${UI.top}\n\n${text}</blockquote>`,
    loading: async (ctx, text) => {
        const frames = ["█▒▒▒▒▒▒▒▒▒ 10%", "███▒▒▒▒▒▒▒ 30%", "█████▒▒▒▒▒ 50%", "███████▒▒▒ 80%", "██████████ 100%"];
        let msg = await ctx.reply(UI.q(`⏳ <b>Loading...</b>` + "\n" + frames[0]), { parse_mode: 'HTML' });
        for (let frame of frames) {
            await new Promise(r => setTimeout(r, 300));
            await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, UI.q(text + "\n" + frame), { parse_mode: 'HTML' });
        }
        return msg;
    }
};

// Helper untuk membuat entity custom emoji - SAFE VERSION
function createEmojiEntity(offset, length, emojiId) {
    if (offset === -1 || !emojiId) return null;
    return {
        offset: offset,
        length: length,
        type: 'custom_emoji',
        custom_emoji_id: emojiId
    };
}

// Helper untuk membuat array entities dari text dengan multiple emojis
function buildEntities(text, emojiMap) {
    const entities = [];
    for (const [emoji, id] of Object.entries(emojiMap)) {
        let pos = text.indexOf(emoji);
        while (pos !== -1) {
            const entity = createEmojiEntity(pos, emoji.length, id);
            if (entity) entities.push(entity);
            pos = text.indexOf(emoji, pos + 1);
        }
    }
    return entities.length > 0 ? entities : undefined;
}

// ==========================================
// 🚀 BOT FUNCTIONS
// ==========================================
let userState = {};

function getNama(ctx) {
    return `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`;
}

async function checkUserJoin(ctx) {
    for (const channel of CONFIG.CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(channel, ctx.from.id);
            if (member.status === 'left' || member.status === 'kicked') {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    return true;
}

// ==========================================
// EMOJI MAPS FOR COMMON TEXTS
// ==========================================
const HOME_EMOJIS = {
    '💳': EMOJI.MONEY_BAG,
    '📌': EMOJI.PIN
};

const SUCCESS_NOTIF_EMOJIS = {
    '🚀': EMOJI.ROCKET,
    '📂': EMOJI.PIN,
    '💰': EMOJI.MONEY_BAG,
    '📦': EMOJI.PACKAGE,
    '🕒': EMOJI.BELL,
    '🔥': EMOJI.FIRE,
    '⚡': EMOJI.LIGHTNING
};

const ORDER_EMOJIS = {
    '🛒': EMOJI.ROCKET,
    '💰': EMOJI.MONEY_BAG,
    '📦': EMOJI.PACKAGE
};

const BUY_EMOJIS = {
    '🛒': EMOJI.ROCKET,
    '👤': EMOJI.USER,
    '🤖': EMOJI.ROCKET,
    '📂': EMOJI.PIN,
    '💰': EMOJI.MONEY_BAG,
    '💳': EMOJI.WALLET,
    '⏰': EMOJI.BELL
};

const PURCHASE_EMOJIS = {
    '✅': EMOJI.CHECKMARK,
    '📂': EMOJI.PIN,
    '👤': EMOJI.USER,
    '📱': EMOJI.PIN,
    '💰': EMOJI.MONEY_BAG,
    '💳': EMOJI.WALLET,
    '📩': EMOJI.PIN
};

const DEPOSIT_EMOJIS = {
    '💳': EMOJI.MONEY_BAG,
    '💰': EMOJI.MONEY_BAG,
    '📥': EMOJI.PIN,
    '⏳': EMOJI.BELL,
    '📌': EMOJI.PIN
};

const ADMIN_EMOJIS = {
    '👑': EMOJI.CROWN,
    '📊': EMOJI.CHART,
    '👥': EMOJI.USER,
    '🟢': EMOJI.CHECKMARK,
    '📦': EMOJI.PACKAGE,
    '💰': EMOJI.MONEY_BAG,
    '🔥': EMOJI.FIRE,
    '⏳': EMOJI.BELL
};

async function renderHome(ctx) {
    const uid = ctx.from.id;
    let user = await getUser(uid);

    if (!user) {
        user = await createUser({
            userId: uid,
            name: ctx.from.first_name,
            username: ctx.from.username || null,
            balance: 0
        });
    }

    let buttons = [
        [Markup.button.callback('🛍️ BELANJA', 'menu_order')],
        [
            Markup.button.callback('💳 DEPOSIT', 'menu_depo'),
            Markup.button.callback('👤 PROFILE', 'menu_profile')
        ],
        [
            Markup.button.callback('📦 CEK STOK', 'cek_stok'),
            Markup.button.callback('🆘 BANTUAN', 'butuh_bantuan')
        ]
    ];

    if (uid === CONFIG.ADMIN_ID) {
        buttons.push([
            Markup.button.callback('👑 OWNER MENU', 'owner_menu')
        ]);
    }

    const captionText = `Halo <b>${ctx.from.first_name}</b> 👋\n\nSelamat datang. Di sini kamu bisa membeli <b>Akun NOKTEL Siap Pakai</b> yang sudah siap login dan dikirim otomatis setelah pembayaran berhasil.\n\n💳 <b>Saldo Kamu</b>\n<code>Rp ${user.balance.toLocaleString()}</code>\n\n📌 <b>Ketentuan</b>\n• Pastikan saldo mencukupi sebelum checkout.\n• Periksa pesanan dengan teliti.\n• Tidak menerima pembatalan/refund setelah pembayaran.\n• Simpan data akun yang diterima dengan aman.\n\nSilakan pilih menu di bawah untuk mulai bertransaksi 👇`;

    return ctx.replyWithPhoto(CONFIG.MAIN_IMG, {
        caption: UI.q(captionText),
        parse_mode: 'HTML',
        caption_entities: buildEntities(captionText, HOME_EMOJIS),
        ...Markup.inlineKeyboard(buttons)
    });
}

async function sendSuccessNotif(ctx, cat, price) {
    const stocks = await getStocks(cat);
    const totalStock = stocks.length;

    const messageText = `<blockquote>\n<b>🚀 NEW STOCK BERHASIL DITAMBAHKAN!</b>\n━━━━━━━━━━━━━━━━━━━━\n📂 <b>Kategori:</b> ID-${cat}\n💰 <b>Harga:</b> Rp ${price.toLocaleString()}\n📦 <b>Total Stok Tersedia:</b> ${totalStock} Akun\n🕒 <b>Update:</b> ${new Date().toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━\n🔥 <b>Siap diproses otomatis oleh bot</b>\n⚡ <i>Jangan sampai kehabisan!</i>\n</blockquote>`;

    const inlineKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🛒 BELI SEKARANG',
                        url: 'https://t.me/storenoktel_bot'
                    }
                ]
            ]
        }
    };

    for (let ch of CONFIG.CHANNELS) {
        try {
            await ctx.telegram.sendMessage(
                ch,
                messageText,
                {
                    parse_mode: 'HTML',
                    entities: buildEntities(messageText, SUCCESS_NOTIF_EMOJIS),
                    ...inlineKeyboard
                }
            );
        } catch (e) {
            console.error(e);
        }
    }
}

// ==========================================
// 🚀 BOT COMMANDS & ACTIONS
// ==========================================
bot.start(async (ctx) => {
    const uid = ctx.from.id;

    let joined = true;
    for (const ch of CONFIG.CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(ch, uid);
            if (member.status === 'left' || member.status === 'kicked') {
                joined = false;
                break;
            }
        } catch (e) {
            joined = false;
            break;
        }
    }

    if (!joined) {
        const text = `❌ <b>AKSES DITOLAK</b>\n\nUntuk menggunakan bot, silakan join channel berikut terlebih dahulu:\n\n👉 @xStoreNoktel\n👉 @StoreRealll\n\nSetelah join, ketik /start kembali.`;
        return ctx.reply(
            UI.q(text),
            { 
                parse_mode: 'HTML', 
                entities: buildEntities(text, { '❌': EMOJI.X }) 
            }
        );
    }

    try {
        let user = await User.findOne({ userId: uid });
        if (!user) {
            await User.create({
                userId: uid,
                name: ctx.from.first_name,
                username: ctx.from.username || null,
                balance: 0
            });
            console.log(`✅ User baru terdaftar: ${uid}`);
        }
    } catch (err) {
        console.error("Gagal mendaftarkan user:", err.message);
    }

    return renderHome(ctx);
});

// ==========================================
// 🛒 ORDER SYSTEM
// ==========================================
bot.action('menu_order', async (ctx) => {
    const stocks = await getAllStocks();
    let buttons = [];

    for (let i = 1; i <= 8; i += 2) {
        const stok1 = stocks[i]?.length || 0;
        const stok2 = stocks[i + 1]?.length || 0;

        const icon1 = stok1 > 0 ? '🟢' : '🔴';
        const icon2 = stok2 > 0 ? '🟢' : '🔴';

        buttons.push([
            Markup.button.callback(
                `${icon1} ID ${i} (${stok1})`,
                `view_${i}`
            ),
            Markup.button.callback(
                `${icon2} ID ${i + 1} (${stok2})`,
                `view_${i + 1}`
            )
        ]);
    }

    buttons.push([
        Markup.button.callback('🔙 KEMBALI', 'back_home')
    ]);

    try {
        await ctx.deleteMessage();
    } catch (e) {}

    const text = `<b>🛒 PILIH KATEGORI ID</b>\n🟢 = Stok tersedia\n🔴 = Stok habis\n\nSilahkan pilih kategori yang tersedia.`;

    await ctx.reply(
        UI.q(text),
        {
            parse_mode: 'HTML',
            entities: buildEntities(text, { '🛒': EMOJI.ROCKET }),
            ...Markup.inlineKeyboard(buttons)
        }
    );
});

bot.action(/^view_(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1]);
    const price = await getPrice(id);
    const promoPrice = await getPromo(id);
    const finalPrice = promoPrice || price;
    const stocks = await getStocks(id);
    const count = stocks.length;

    await ctx.deleteMessage();
    
    const text = `🛒 <b>KONFIRMASI PEMBELIAN</b>\n\n🆔 <b>ID Produk:</b> ${id}\n🌍 <b>Negara:</b> Indonesia\n💰 <b>Harga:</b> <code>Rp ${finalPrice.toLocaleString()}</code>${promoPrice ? ' 🔥PROMO' : ''}\n📦 <b>Stok:</b> ${count}\n\nApakah Anda ingin membeli akun ini?`;

    await ctx.reply(UI.q(text), {
        parse_mode: 'HTML',
        entities: buildEntities(text, ORDER_EMOJIS),
        ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ BELI SEKARANG', `buy_now_${id}_0`)],
            [Markup.button.callback('❌ BATAL', 'menu_order')]
        ])
    });
});

bot.action(/^buy_now_(\d+)_(\d+)$/, async (ctx) => {
    const id = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);

    let user = await getUser(ctx.from.id);
    if (!user) {
        user = await createUser({
            userId: ctx.from.id,
            name: ctx.from.first_name,
            username: ctx.from.username || null,
            balance: 0
        });
    }

    const stocks = await getStocks(id);
    const price = await getPrice(id);
    const promoPrice = await getPromo(id);
    const finalPrice = promoPrice || price;

    if (user.balance < finalPrice) {
        return ctx.answerCbQuery("⚠️ Saldo tidak cukup!", { show_alert: true });
    }

    if (stocks.length === 0) {
        return ctx.answerCbQuery("⚠️ Stok habis!", { show_alert: true });
    }

    const item = stocks[0];
    await removeStock(id, item._id);

    await updateUserBalance(ctx.from.id, -finalPrice);
    user = await getUser(ctx.from.id);

    await addOrder(ctx.from.id, {
        id: `ORD${Date.now()}`,
        category: id.toString(),
        accountName: item.name,
        phone: item.phone,
        price: finalPrice,
        status: 'selesai',
        timestamp: new Date()
    });

    userState[ctx.from.id] = { purchasedAccount: item };

    if (CONFIG.CHANNELS && CONFIG.CHANNELS.length > 0) {
        const namaUser = getNama(ctx);

        for (const ch of CONFIG.CHANNELS) {
            const text = `<blockquote>\n🛒 <b>PEMBELIAN AKUN BERHASIL</b>\n\n👤 <b>Pembeli:</b> ${namaUser}\n🤖 <b>Beli ke:</b> @StoreNoktel_bot\n\n📂 <b>Kategori / ID Produk:</b> ${id}\n💰 <b>Harga:</b> Rp ${finalPrice.toLocaleString()}\n💳 <b>Sisa Saldo:</b> Rp ${user.balance.toLocaleString()}\n\n⏰ <b>Waktu:</b> ${new Date().toLocaleString()}\n</blockquote>`;

            await ctx.telegram.sendMessage(
                ch,
                text,
                {
                    parse_mode: 'HTML',
                    entities: buildEntities(text, BUY_EMOJIS),
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '🤖 Kunjungi Bot',
                                    url: 'https://t.me/StoreNoktel_bot'
                                }
                            ]
                        ]
                    }
                }
            );
        }
    }

    const formatPhone = (phone) => {
        let p = phone.replace(/^0/, '+62');
        return p.replace(/(\d{2,3})(\d{3})(\d{3,4})/, '$1 $2 $3');
    };

    const formattedPhone = formatPhone(item.phone || '-');

    await UI.loading(ctx, "⚙️ <b>MENYIAPKAN NOMOR...</b>");

    const text = `✅ <b>PEMBELIAN BERHASIL!</b>\n\n📂 <b>Kategori / ID Produk:</b> ${id}\n👤 <b>Nama Akun:</b> ${item.name || '-'}\n📱 <b>Nomor Telepon:</b> <code>${formattedPhone}</code>\n💰 <b>Harga:</b> <code>Rp ${finalPrice.toLocaleString()}</code>\n💳 <b>Saldo Tersisa:</b> <code>Rp ${user.balance.toLocaleString()}</code>\n\n📩 Klik tombol di bawah untuk cek SMS/OTP terbaru dari Telegram.`;

    await ctx.replyWithPhoto(CONFIG.MAIN_IMG, {
        caption: UI.q(text),
        parse_mode: 'HTML',
        caption_entities: buildEntities(text, PURCHASE_EMOJIS),
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📩 CEK SMS/OTP', 'cek_sms')],
            [Markup.button.callback('🗑️ HAPUS SESI', 'back_home')]
        ])
    });
});

bot.action('cek_sms', async (ctx) => {
    const state = userState[ctx.from.id];

    if (!state || !state.purchasedAccount) {
        return ctx.answerCbQuery("❌ Data akun tidak ditemukan", { show_alert: true });
    }

    const account = state.purchasedAccount;
    const msg = await ctx.reply('⏳ Menghubungi sesi Telegram...');

    try {
        const client = new TelegramClient(
            new StringSession(account.session),
            CONFIG.API_ID,
            CONFIG.API_HASH,
            { connectionRetries: 5 }
        );

        await client.connect();
        const messages = await client.getMessages(777000, { limit: 1 });

        if (messages.length > 0 && messages[0].message) {
            const smsMsg = messages[0].message;
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                msg.message_id,
                null,
                `📩 PESAN TERAKHIR (OTP/SMS):\n\n${smsMsg}`
            );
        } else {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                msg.message_id,
                null,
                '❌ Tidak ada pesan masuk dari Telegram.'
            );
        }

        await client.disconnect();
    } catch (err) {
        console.error(err);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            null,
            `❌ ERROR saat membaca pesan: ${err.message}`
        );
    }
});

// ==========================================
// 💳 DEPOSIT SYSTEM (ATLANTIC H2H)
// ==========================================
bot.action('menu_depo', async (ctx) => {
    await ctx.deleteMessage();
    userState[ctx.from.id] = { step: 'INPUT_DEPO' };
    
    const text = `💳 <b>DEPOSIT SALDO</b>\n\nSilahkan masukkan nominal deposit.\nContoh: <code>15000</code>`;
    
    await ctx.reply(UI.q(text), { 
        parse_mode: 'HTML', 
        entities: buildEntities(text, { '💳': EMOJI.MONEY_BAG }) 
    });
});

bot.on('text', async (ctx) => {
    const uid = ctx.from.id;
    const text = ctx.message.text;
    const state = userState[uid];

    /* ==================================================
       👑 OWNER/ADMIN REPLY HANDLER
    ================================================== */
    if (uid === CONFIG.ADMIN_ID) {
        const ownerKeys = Object.keys(userState)
            .filter(k => userState[k]?.step === 'WAIT_REPLY');

        if (ownerKeys.length > 0) {
            for (let key of ownerKeys) {
                const { to: userId, userName } = userState[key];
                try {
                    const replyText = `💬 Balasan dari Owner:\n\n${text}`;
                    await ctx.telegram.sendMessage(
                        userId,
                        UI.q(replyText),
                        { 
                            parse_mode: 'HTML', 
                            entities: buildEntities(replyText, { '💬': EMOJI.DIAMOND }) 
                        }
                    );
                    delete userState[key];
                    
                    const successText = `✅ Balasan berhasil dikirim ke <b>${userName}</b> (ID: ${userId})`;
                    await ctx.reply(
                        successText,
                        { 
                            parse_mode: 'HTML', 
                            entities: buildEntities(successText, { '✅': EMOJI.CHECKMARK }) 
                        }
                    );
                } catch {
                    const failText = `❌ Gagal mengirim pesan ke <b>${userName}</b> (ID: ${userId})`;
                    await ctx.reply(
                        failText,
                        { 
                            parse_mode: 'HTML', 
                            entities: buildEntities(failText, { '❌': EMOJI.X }) 
                        }
                    );
                }
            }
            return;
        }
    }

    /* ==================================================
       📢 BROADCAST & PROMO
    ================================================== */
    if (state?.step === 'SET_PROMO_PRICE' && uid === CONFIG.ADMIN_ID) {
        const price = parseInt(text);
        if (isNaN(price) || price <= 0) {
            const errText = "❌ Harga tidak valid";
            return ctx.reply(errText, { 
                parse_mode: 'HTML', 
                entities: buildEntities(errText, { '❌': EMOJI.X }) 
            });
        }

        const cat = state.cat;
        await setPromo(cat, price);
        delete userState[uid];

        for (const ch of CONFIG.CHANNELS) {
            const normalPrice = await getPrice(cat);
            const promoText = `🔥 <b>PROMO SPESIAL!</b>\n\n📂 Kategori: ${cat}\n💰 Harga Normal: Rp ${normalPrice.toLocaleString()}\n🎉 Harga Promo: Rp ${price.toLocaleString()}\n\n⚡ Buruan sebelum stok habis!`;
            
            await ctx.telegram.sendMessage(
                ch,
                promoText,
                { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(promoText, {
                        '🔥': EMOJI.FIRE,
                        '📂': EMOJI.PIN,
                        '💰': EMOJI.MONEY_BAG,
                        '🎉': EMOJI.STAR,
                        '⚡': EMOJI.LIGHTNING
                    }) 
                }
            );
        }
        
        const doneText = `✅ Promo berhasil diset ke Rp ${price.toLocaleString()}`;
        return ctx.reply(UI.q(doneText), { 
            parse_mode: 'HTML', 
            entities: buildEntities(doneText, { '✅': EMOJI.CHECKMARK }) 
        });
    }

   if (state?.step === 'BROADCAST' && uid === CONFIG.ADMIN_ID) {
        delete userState[uid];
        const users = await getAllUsers();
        const totalUser = users.length;
        let sukses = 0;
        let gagal = 0;

        const statusText = `📢 <b>MEMULAI BROADCAST...</b>\n\n⏳ Progres: <code>[░░░░░░░░░░] 0%</code>\n✅ Berhasil: 0 | ❌ Gagal: 0`;
        
        let statusMsg = await ctx.reply(
            UI.q(statusText), 
            { 
                parse_mode: 'HTML', 
                entities: buildEntities(statusText, { '📢': EMOJI.BELL, '⏳': EMOJI.BELL }) 
            }
        );

        for (let i = 0; i < totalUser; i++) {
            const targetId = users[i].userId;
            try {
                await ctx.telegram.sendMessage(targetId, text, { parse_mode: 'HTML' });
                sukses++;
            } catch (err) {
                gagal++;
            }

            if (i % 5 === 0 || i === totalUser - 1) {
                const percent = Math.round(((i + 1) / totalUser) * 100);
                const progress = Math.round(percent / 10);
                const bar = "█".repeat(progress) + "░".repeat(10 - progress);

                try {
                    const updateText = `📢 <b>SEDANG BROADCAST...</b>\n\n⏳ Progres: <code>[${bar}] ${percent}%</code>\n✅ Berhasil: <b>${sukses}</b>\n❌ Gagal: <b>${gagal}</b>\n👥 Total: ${totalUser}`;
                    
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMsg.message_id,
                        null,
                        UI.q(updateText),
                        { 
                            parse_mode: 'HTML', 
                            entities: buildEntities(updateText, {
                                '📢': EMOJI.BELL,
                                '⏳': EMOJI.BELL,
                                '✅': EMOJI.CHECKMARK,
                                '❌': EMOJI.X,
                                '👥': EMOJI.USER
                            }) 
                        }
                    );
                } catch (e) {}
            }
        }

        const finalText = `✅ <b>BROADCAST SELESAI!</b>\n━━━━━━━━━━━━━━━━━━━━\n📊 <b>LAPORAN HASIL:</b>\n🟢 Berhasil : <b>${sukses}</b> user\n🔴 Gagal    : <b>${gagal}</b> user\n👥 Total    : <b>${totalUser}</b> user\n\n✨ <i>Pesan telah terkirim ke semua tujuan.</i>`;
        
        return ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            UI.q(finalText),
            { 
                parse_mode: 'HTML', 
                entities: buildEntities(finalText, {
                    '✅': EMOJI.CHECKMARK,
                    '📊': EMOJI.CHART,
                    '🟢': EMOJI.CHECKMARK,
                    '🔴': EMOJI.X,
                    '👥': EMOJI.USER
                }) 
            }
        );
    }

    /* ==================================================
       🆘 BUTUH BANTUAN (USER SIDE)
    ================================================== */
    if (state?.step === 'BUTUH_BANTUAN') {
        const msg = text;
        const userName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '');
        const userId = ctx.from.id;
        const ownerId = CONFIG.ADMIN_ID;

        const bantuanText = `🆘 <b>Pesan Bantuan Baru</b>\n\n👤 Dari: ${userName}\n🆔 UserID: <code>${userId}</code>\n\n📩 Pesan:\n${msg}`;

        await ctx.telegram.sendMessage(ownerId,
            bantuanText,
            {
                parse_mode: 'HTML',
                entities: buildEntities(bantuanText, {
                    '🆘': EMOJI.EXCLAMATION_2,
                    '👤': EMOJI.USER,
                    '📩': EMOJI.PIN
                }),
                ...Markup.inlineKeyboard([[Markup.button.callback('💬 Balas', `balas_${userId}`)]])
            }
        );

        delete userState[uid];
        
        const sentText = '✅ Pesan bantuan telah dikirim ke owner. Mohon tunggu balasan.';
        return ctx.reply(UI.q(sentText), { 
            parse_mode: 'HTML', 
            entities: buildEntities(sentText, { '✅': EMOJI.CHECKMARK }) 
        });
    }

    /* ==================================================
       💳 USER DEPOSIT
    ================================================== */
    if (state?.step === 'INPUT_DEPO') {
        const nominal = parseInt(text);
        if (isNaN(nominal) || nominal < 1000) {
            const minText = "❌ Nominal minimal Rp 1.000";
            return ctx.reply(UI.q(minText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(minText, { '❌': EMOJI.X }) 
            });
        }

        await UI.loading(ctx, "🔄 <b>GENERATING QRIS...</b>");
        const reff_id = randomString(10);
        
        try {
            const body = new URLSearchParams({
                api_key: CONFIG.API_KEY_ATLANTIC,
                reff_id,
                nominal: nominal.toString(),
                type: 'ewallet',
                metode: 'qris'
            });

            const res = await fetch(`${CONFIG.BASE_URL_ATLANTIC}/deposit/create`, { 
                method: 'POST', 
                body 
            }).then(r => r.json());

            if (!res.status) {
                delete userState[uid];
                const failText = "❌ Gagal membuat QRIS: " + (res.message || "Server Error");
                return ctx.reply(UI.q(failText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(failText, { '❌': EMOJI.X }) 
                });
            }

            const qrBuffer = await QRCode.toBuffer(res.data.qr_string);
            
            const captionText = `💳 <b>PEMBAYARAN QRIS</b>\n\n🆔 <b>ID Deposit:</b> <code>${res.data.id}</code>\n💰 <b>Nominal:</b> <code>Rp ${res.data.nominal.toLocaleString()}</code>\n📥 <b>Saldo Diterima:</b> <code>Rp ${(res.data.get_balance || res.data.nominal).toLocaleString()}</code>\n⏳ <b>Status:</b> <i>PENDING</i>\n\n📌 <i>Scan QRIS untuk melanjutkan. Saldo masuk otomatis setelah klik CEK STATUS.</i>`;

            const sentMsg = await ctx.replyWithPhoto(
                { source: qrBuffer },
                {
                    caption: UI.q(captionText),
                    parse_mode: 'HTML',
                    caption_entities: buildEntities(captionText, DEPOSIT_EMOJIS),
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 CEK STATUS', `check_depo_${res.data.id}`)],
                        [Markup.button.callback('❌ BATAL', `cancel_depo_${res.data.id}`)]
                    ])
                }
            );

            await createDeposit({
                depositId: res.data.id.toString(),
                userId: uid,
                chatId: ctx.chat.id,
                msgId: sentMsg.message_id,
                status: 'pending',
                nominal: res.data.nominal
            });

            await User.findOneAndUpdate(
                { userId: uid },
                { 
                    $push: { 
                        deposits: { 
                            id: res.data.id.toString(), 
                            nominal: res.data.nominal, 
                            status: 'pending', 
                            method: 'QRIS',
                            timestamp: new Date() 
                        } 
                    } 
                }
            );

            delete userState[uid];
        } catch (err) {
            console.error(err);
            ctx.reply("❌ Terjadi kesalahan teknis saat menghubungi server Atlantic.");
        }
        return;
    }

    /* ==================================================
       👑 ADMIN ADD STOK (JALUR GABUNGAN)
    ================================================== */
    if (uid === CONFIG.ADMIN_ID) {
        
        if (state?.step === 'ADMIN_NAME') {
            state.name = text.trim();
            state.step = 'ADMIN_PHONE';
            const phoneText = "📱 Kirim <b>Nomor HP</b> (untuk OTP) atau <b>String Session</b>:";
            return ctx.reply(UI.q(phoneText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(phoneText, { '📱': EMOJI.PIN }) 
            });
        }

        if (state?.step === 'ADMIN_PHONE') {
            const input = text.trim();

            if (input.length > 50) {
                await UI.loading(ctx, "🔄 <b>Verifikasi Session...</b>");
                try {
                    const client = new TelegramClient(
                        new StringSession(input), 
                        CONFIG.API_ID, 
                        CONFIG.API_HASH, 
                        { connectionRetries: 5 }
                    );
                    await client.connect();
                    const me = await client.getMe();
                    state.tempAccount = {
                        name: `${me.firstName || ''} ${me.lastName || ''}`.trim() || 'No Name',
                        phone: me.phone,
                        tgId: me.id.toString(),
                        session: input
                    };
                    state.step = 'ADMIN_PRICE_FINAL';
                    await client.disconnect();

                    const detectedText = `✨ <b>ACCOUNT DETECTED (SESSION)</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>Name:</b> <code>${state.tempAccount.name}</code>\n📱 <b>Phone:</b> <code>${state.tempAccount.phone}</code>\n🆔 <b>TG-ID:</b> <code>${state.tempAccount.tgId}</code>\n\n💰 <b>Masukkan Harga Jual:</b>`;
                    
                    return ctx.reply(UI.q(detectedText), { 
                        parse_mode: 'HTML', 
                        entities: buildEntities(detectedText, {
                            '✨': EMOJI.STAR,
                            '👤': EMOJI.USER,
                            '📱': EMOJI.PIN,
                            '💰': EMOJI.MONEY_BAG
                        }) 
                    });
                } catch (err) {
                    delete userState[uid];
                    const invalidText = "❌ String Session tidak valid.";
                    return ctx.reply(UI.q(invalidText), { 
                        parse_mode: 'HTML', 
                        entities: buildEntities(invalidText, { '❌': EMOJI.X }) 
                    });
                }
            }

            const phone = input.replace(/[^0-9]/g, '');
            if (phone.length < 8) {
                const invalidPhoneText = "❌ Kirim Nomor HP / String Session valid.";
                return ctx.reply(UI.q(invalidPhoneText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(invalidPhoneText, { '❌': EMOJI.X }) 
                });
            }
            state.phone = phone;
            state.step = 'ADMIN_PRICE';
            
            const priceText = `💰 Nomor diterima: <code>${phone}</code>\n\nMasukkan <b>Harga Jual</b>:`;
            return ctx.reply(UI.q(priceText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(priceText, { '💰': EMOJI.MONEY_BAG }) 
            });
        }

        if (state?.step === 'ADMIN_PRICE') {
            const price = parseInt(text);
            if (isNaN(price) || price < 1000) {
                const minPriceText = "❌ Harga minimal 1000";
                return ctx.reply(UI.q(minPriceText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(minPriceText, { '❌': EMOJI.X }) 
                });
            }
            state.price = price;
            state.step = 'ADMIN_OTP';
            await UI.loading(ctx, "📩 <b>Mengirim OTP...</b>");
            try {
                const client = new TelegramClient(
                    new StringSession(""), 
                    CONFIG.API_ID, 
                    CONFIG.API_HASH, 
                    { connectionRetries: 5 }
                );
                await client.connect();
                const { phoneCodeHash } = await client.sendCode(
                    { apiId: CONFIG.API_ID, apiHash: CONFIG.API_HASH }, 
                    state.phone
                );
                state.client = client;
                state.phoneCodeHash = phoneCodeHash;
                
                const otpText = "📩 <b>OTP DIKIRIM!</b>\nMasukkan kode OTP:";
                return ctx.reply(UI.q(otpText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(otpText, { '📩': EMOJI.PIN }) 
                });
            } catch {
                delete userState[uid];
                const failOtpText = "❌ Gagal kirim OTP.";
                return ctx.reply(UI.q(failOtpText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(failOtpText, { '❌': EMOJI.X }) 
                });
            }
        }

        if (state?.step === 'ADMIN_OTP') {
            const otp = text.replace(/\s+/g, '');
            try {
                await state.client.invoke(new Api.auth.SignIn({ 
                    phoneNumber: state.phone, 
                    phoneCodeHash: state.phoneCodeHash, 
                    phoneCode: otp 
                }));
                const me = await state.client.getMe();
                const session = state.client.session.save();
                
                await addStock(state.cat, {
                    name: state.name || me.firstName,
                    phone: state.phone,
                    tgId: me.id.toString(),
                    price: state.price,
                    session: session
                });
                
                await setPrice(state.cat, state.price);
                delete userState[uid];
                await sendSuccessNotif(ctx, state.cat, state.price);
                
                const successText = "✅ <b>BERHASIL:</b> Akun ditambahkan via OTP!";
                return ctx.reply(UI.q(successText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(successText, { '✅': EMOJI.CHECKMARK }) 
                });
            } catch {
                delete userState[uid];
                const wrongOtpText = "❌ OTP salah atau limit.";
                return ctx.reply(UI.q(wrongOtpText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(wrongOtpText, { '❌': EMOJI.X }) 
                });
            }
        }

        if (state?.step === 'ADMIN_PRICE_FINAL') {
            const price = parseInt(text);
            if (isNaN(price) || price < 1000) {
                const minFinalText = "❌ Harga minimal 1000";
                return ctx.reply(UI.q(minFinalText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(minFinalText, { '❌': EMOJI.X }) 
                });
            }
            const acc = state.tempAccount;
            
            await addStock(state.cat, {
                name: acc.name,
                phone: acc.phone,
                tgId: acc.tgId,
                price: price,
                session: acc.session
            });
            
            await setPrice(state.cat, price);
            delete userState[uid];
            await sendSuccessNotif(ctx, state.cat, price);
            
            const finalSuccessText = "✅ <b>BERHASIL:</b> Akun ditambahkan via Session!";
            return ctx.reply(UI.q(finalSuccessText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(finalSuccessText, { '✅': EMOJI.CHECKMARK }) 
            });
        }

        /* =========================
           💰 MANAGEMENT SALDO
        ========================= */
        if (state?.step === 'ADD_SALDO_TARGET' || state?.step === 'MINUS_SALDO_TARGET') {
            const input = text.trim();
            let user;
            
            if (/^\d+$/.test(input)) {
                user = await getUser(parseInt(input));
            } else {
                const username = input.replace('@', '').toLowerCase();
                user = await User.findOne({ username: username });
            }
            
            if (!user) {
                const notFoundText = "❌ User tidak ditemukan";
                return ctx.reply(UI.q(notFoundText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(notFoundText, { '❌': EMOJI.X }) 
                });
            }
            state.targetUser = user;
            state.step = state.step === 'ADD_SALDO_TARGET' ? 'ADD_SALDO_AMOUNT' : 'MINUS_SALDO_AMOUNT';
            
            const amountText = `💰 Masukkan <b>jumlah saldo</b>:`;
            return ctx.reply(UI.q(amountText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(amountText, { '💰': EMOJI.MONEY_BAG }) 
            });
        }

        if (state?.step === 'ADD_SALDO_AMOUNT' || state?.step === 'MINUS_SALDO_AMOUNT') {
            const amount = parseInt(text);
            if (isNaN(amount) || amount <= 0) {
                const invalidAmountText = "❌ Jumlah tidak valid";
                return ctx.reply(UI.q(invalidAmountText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(invalidAmountText, { '❌': EMOJI.X }) 
                });
            }
            const user = state.targetUser;
            if (state.step === 'MINUS_SALDO_AMOUNT' && user.balance < amount) {
                const insufficientText = "❌ Saldo tidak mencukupi";
                return ctx.reply(UI.q(insufficientText), { 
                    parse_mode: 'HTML', 
                    entities: buildEntities(insufficientText, { '❌': EMOJI.X }) 
                });
            }
            
            const change = state.step === 'ADD_SALDO_AMOUNT' ? amount : -amount;
            await updateUserBalance(user.userId, change);
            
            delete userState[uid];
            const updatedUser = await getUser(user.userId);
            
            const updateText = `✅ <b>UPDATE BERHASIL</b>\n👤 User: ${updatedUser.name}\n💳 Saldo: <code>Rp ${updatedUser.balance.toLocaleString()}</code>`;
            return ctx.reply(UI.q(updateText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(updateText, {
                    '✅': EMOJI.CHECKMARK,
                    '👤': EMOJI.USER,
                    '💳': EMOJI.WALLET
                }) 
            });
        }
    }
});

bot.action(/^check_depo_(.+)$/, async (ctx) => {
    const depoId = ctx.match[1];
    const uid = ctx.from.id;

    await ctx.answerCbQuery("🔄 Sedang memverifikasi pembayaran...");

    try {
        const depo = await Deposit.findOne({ depositId: depoId });
        if (!depo) return ctx.answerCbQuery("❌ Data deposit tidak ditemukan.", { show_alert: true });
        if (depo.status === 'success') return ctx.answerCbQuery("✅ Deposit ini sudah sukses sebelumnya.", { show_alert: true });

        const getAtlanticStatus = async () => {
            const body = new URLSearchParams({ api_key: CONFIG.API_KEY_ATLANTIC, id: depoId });
            return await fetch(`${CONFIG.BASE_URL_ATLANTIC}/deposit/status`, { 
                method: 'POST', 
                body 
            }).then(r => r.json());
        };

        let res = await getAtlanticStatus();
        if (!res.status) return ctx.answerCbQuery("❌ Gagal terhubung ke provider.", { show_alert: true });

        let status = res.data.status.toLowerCase();

        if (status === 'processing') {
            const instantBody = new URLSearchParams({ 
                api_key: CONFIG.API_KEY_ATLANTIC, 
                id: depoId, 
                action: 'true' 
            });
            const instantRes = await fetch(`${CONFIG.BASE_URL_ATLANTIC}/deposit/instant`, { 
                method: 'POST', 
                body: instantBody 
            }).then(r => r.json());
            
            if (instantRes.status) {
                res = await getAtlanticStatus();
                status = res.data.status.toLowerCase();
            }
        }

        if (status === 'success') {
            const nominalMasuk = parseInt(res.data.get_balance || depo.nominal);

            await updateUserBalance(uid, nominalMasuk);
            await Deposit.findOneAndUpdate({ depositId: depoId }, { status: 'success' });
            await User.updateOne(
                { userId: uid, "deposits.id": depoId },
                { $set: { "deposits.$.status": "sukses" } }
            );

            const user = await getUser(uid);

            try { await ctx.deleteMessage(); } catch (e) {}

            const channelText = `<blockquote>\n<b>💳 DEPOSIT BERHASIL (AUTO)</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>Pembeli:</b> ${user.name}\n💰 <b>Nominal:</b> Rp ${nominalMasuk.toLocaleString()}\n💳 <b>Metode:</b> ${res.data.metode || 'QRIS'}\n⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}\n━━━━━━━━━━━━━━━━━━━━\n⚡ <i>Status: Berhasil Diverifikasi Sistem</i>\n</blockquote>`;

            for (const ch of CONFIG.CHANNELS) {
                try { 
                    await ctx.telegram.sendMessage(ch, channelText, { 
                        parse_mode: 'HTML',
                        entities: buildEntities(channelText, {
                            '💳': EMOJI.MONEY_BAG,
                            '👤': EMOJI.USER,
                            '💰': EMOJI.MONEY_BAG,
                            '💳': EMOJI.WALLET,
                            '⏰': EMOJI.BELL,
                            '⚡': EMOJI.LIGHTNING
                        })
                    }); 
                } catch (e) {}
            }

            const userText = `✅ <b>PEMBAYARAN TERVERIFIKASI!</b>\n\nSaldo sebesar <b>Rp ${nominalMasuk.toLocaleString()}</b> telah ditambahkan ke akun Anda.\n\n💰 <b>Total Saldo:</b> <code>Rp ${user.balance.toLocaleString()}</code>\n\n<i>Terima kasih telah melakukan top up!</i>`;
            
            return ctx.reply(UI.q(userText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(userText, {
                    '✅': EMOJI.CHECKMARK,
                    '💰': EMOJI.MONEY_BAG
                }) 
            });
        }

        if (status === 'pending') {
            return ctx.answerCbQuery("⏳ Pembayaran belum masuk.\n\nJika Anda sudah transfer, tunggu 1-3 menit lalu klik CEK STATUS kembali.", { show_alert: true });
        }

        return ctx.answerCbQuery(`⚠️ Status: ${status.toUpperCase()}\nSilahkan lapor admin jika merasa saldo belum masuk.`, { show_alert: true });

    } catch (err) {
        console.error("DEPO CHECK ERROR:", err);
        return ctx.answerCbQuery("❌ Terjadi gangguan koneksi ke server.", { show_alert: true });
    }
});

bot.action(/^cancel_depo_(.+)$/, async (ctx) => {
    const depoId = ctx.match[1];
    const uid = ctx.from.id;

    try {
        await fetch(`${CONFIG.BASE_URL_ATLANTIC}/deposit/cancel`, {
            method: 'POST',
            body: new URLSearchParams({ api_key: CONFIG.API_KEY_ATLANTIC, id: depoId })
        });

        await Deposit.findOneAndUpdate({ depositId: depoId }, { status: 'canceled' });
        
        await User.updateOne(
            { userId: uid, "deposits.id": depoId },
            { $set: { "deposits.$.status": "canceled" } }
        );

        try { await ctx.deleteMessage(); } catch (e) {}

        const cancelText = `❌ <b>DEPOSIT DIBATALKAN</b>\n\nTransaksi #${depoId} telah dibatalkan.`;
        return ctx.reply(UI.q(cancelText), { 
            parse_mode: 'HTML', 
            entities: buildEntities(cancelText, { '❌': EMOJI.X }) 
        });
    } catch (e) {
        return ctx.answerCbQuery("❌ Gagal membatalkan transaksi.", { show_alert: true });
    }
});

bot.action('cek_stok', async (ctx) => {
    const uid = ctx.from.id;

    try { await ctx.deleteMessage(); } catch(e){}

    const stocks = await getAllStocks();
    let text = '<b>📦 STOK AKUN TERSEDIA</b>\n\n';
    
    for (let cat in stocks) {
        const items = stocks[cat];
        if (items.length === 0) continue;
        text += `<b>📂 Kategori ${cat}</b> | Jumlah: ${items.length}\n`;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            text += `- ID: ${i+1}, Nama: ${item.name}, Harga: Rp ${item.price.toLocaleString()}\n`;
        }
        text += '\n';
    }

    if (text === '<b>📦 STOK AKUN TERSEDIA</b>\n\n') {
        text += '❌ Tidak ada stok tersedia';
    }

    const emojiMap = {
        '📦': EMOJI.PACKAGE,
        '📂': EMOJI.PIN
    };
    if (text.includes('❌')) emojiMap['❌'] = EMOJI.X;

    await ctx.reply(UI.q(text), { 
        parse_mode: 'HTML', 
        entities: buildEntities(text, emojiMap) 
    });
});

bot.action('butuh_bantuan', async (ctx) => {
    const uid = ctx.from.id;
    userState[uid] = { step: 'BUTUH_BANTUAN' };

    try { await ctx.deleteMessage(); } catch(e){}

    const bantuanText = '🆘 Silakan tulis pesan bantuan Anda. Pesan ini akan dikirim ke owner.';
    await ctx.reply(UI.q(bantuanText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(bantuanText, { '🆘': EMOJI.EXCLAMATION_2 }) 
    });
});

bot.action(/^balas_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    userState['owner_reply'] = { to: userId, step: 'WAIT_REPLY' };
    try { await ctx.deleteMessage(); } catch(e){}
    await ctx.reply('✏️ Silakan tulis pesan balasan untuk user ini:');
});

bot.action('menu_profile', async (ctx) => {
    const uid = ctx.from.id;
    const user = await getUser(uid);
    if (!user) {
        const notFoundText = "❌ Data user tidak ditemukan";
        return ctx.reply(notFoundText, { 
            parse_mode: 'HTML', 
            entities: buildEntities(notFoundText, { '❌': EMOJI.X }) 
        });
    }

    try { await ctx.deleteMessage(); } catch (e) {}

    const orders = user.orders || [];
    const totalOrder = orders.length;
    const orderSukses = orders.filter(o => o.status.toLowerCase() === 'selesai').length;
    const orderGagal = orders.filter(o => o.status.toLowerCase() === 'gagal').length;

    const deposits = user.deposits || [];
    const totalDeposit = deposits.length;
    const depositSukses = deposits.filter(d => d.status.toLowerCase() === 'sukses').length;
    const depositPending = deposits.filter(d => d.status.toLowerCase() === 'pending').length;

    const captionText = `👤 <b>Nama:</b> ${user.name}\n🆔 <b>User ID:</b> ${uid}\n📛 <b>Username:</b> ${user.username || '-'}\n💰 <b>Saldo:</b> Rp ${user.balance.toLocaleString()}\n\n📦 <b>Riwayat Order:</b>\nTotal: ${totalOrder} | Selesai: ${orderSukses} | Gagal: ${orderGagal}\n\n💳 <b>Riwayat Deposit:</b>\nTotal: ${totalDeposit} | Sukses: ${depositSukses} | Pending: ${depositPending}`;
    
    await ctx.replyWithPhoto(CONFIG.MAIN_IMG, {
        caption: UI.q(captionText),
        parse_mode: 'HTML',
        caption_entities: buildEntities(captionText, {
            '👤': EMOJI.USER,
            '🆔': EMOJI.PIN,
            '📛': EMOJI.PIN,
            '💰': EMOJI.MONEY_BAG,
            '📦': EMOJI.PACKAGE,
            '💳': EMOJI.WALLET
        }),
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📦 Riwayat Order', `profile_order`)],
            [Markup.button.callback('💳 Riwayat Deposit', `profile_deposit`)],
            [Markup.button.callback('🔙 Kembali', 'back_home')]
        ])
    });
});

bot.action('profile_order', async (ctx) => {
    const uid = ctx.from.id;
    const user = await getUser(uid);
    const orders = user?.orders || [];

    try { await ctx.deleteMessage(); } catch(e){}

    if (orders.length === 0) {
        const emptyText = '❌ Belum ada riwayat order';
        return ctx.reply(UI.q(emptyText), { 
            parse_mode: 'HTML', 
            entities: buildEntities(emptyText, { '❌': EMOJI.X }) 
        });
    }

    const buttons = orders.map(o => 
        [Markup.button.callback(`ID: ${o.id} | Rp ${o.price.toLocaleString()}`, `order_detail_${o.id}`)]
    );
    buttons.push([Markup.button.callback('🔙 Kembali', 'menu_profile')]);

    const riwayatText = '<b>📦 RIWAYAT ORDER ANDA</b>\nKlik untuk melihat detail setiap order';

    await ctx.reply(
        UI.q(riwayatText),
        { 
            parse_mode: 'HTML', 
            entities: buildEntities(riwayatText, { '📦': EMOJI.PACKAGE }), 
            ...Markup.inlineKeyboard(buttons) 
        }
    );
});

bot.action('profile_deposit', async (ctx) => {
    const uid = ctx.from.id;
    const user = await getUser(uid);
    const deposits = user?.deposits || [];

    try { await ctx.deleteMessage(); } catch(e){}

    if (deposits.length === 0) {
        const emptyDepoText = '❌ Belum ada riwayat deposit';
        return ctx.reply(UI.q(emptyDepoText), { 
            parse_mode: 'HTML', 
            entities: buildEntities(emptyDepoText, { '❌': EMOJI.X }) 
        });
    }

    const buttons = deposits.map(d => 
        [Markup.button.callback(`ID: ${d.id} | Rp ${d.nominal.toLocaleString()}`, `deposit_detail_${d.id}`)]
    );
    buttons.push([Markup.button.callback('🔙 Kembali', 'menu_profile')]);

    const depoRiwayatText = '<b>💰 RIWAYAT DEPOSIT ANDA</b>\nKlik untuk melihat detail tiap deposit';

    await ctx.reply(
        UI.q(depoRiwayatText),
        { 
            parse_mode: 'HTML', 
            entities: buildEntities(depoRiwayatText, { '💰': EMOJI.MONEY_BAG }), 
            ...Markup.inlineKeyboard(buttons) 
        }
    );
});

bot.action(/^deposit_detail_(.+)$/, async (ctx) => {
    const depoId = ctx.match[1];
    const uid = ctx.from.id;
    const user = await getUser(uid);
    const depo = (user?.deposits || []).find(d => d.id === depoId);

    if (!depo) {
        return ctx.answerCbQuery("❌ Deposit tidak ditemukan", { show_alert: true });
    }

    try { await ctx.deleteMessage(); } catch(e){}

    const loadingText = "⏳ <b>Mengambil detail pembayaran...</b>\n█▒▒▒▒▒▒ 10%";
    const msg = await ctx.reply(UI.q(loadingText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(loadingText, { '⏳': EMOJI.BELL }) 
    });
    
    const frames = ["█▒▒▒▒▒▒ 10%", "███▒▒▒▒▒ 30%", "█████▒▒▒ 50%", "███████▒▒ 80%", "█████████ 100%"];
    for (let f of frames) {
        await new Promise(r => setTimeout(r, 300));
        const frameText = `<b>Detail Deposit</b>\n⏳ Loading...\n${f}`;
        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
            UI.q(frameText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(frameText, { '⏳': EMOJI.BELL }) 
            }
        );
    }

    const detailText = `💳 <b>DETAIL DEPOSIT</b>\n\n🆔 ID Deposit: <code>${depo.id}</code>\n💰 Nominal: Rp ${depo.nominal?.toLocaleString() || 0}\n💳 Metode: ${depo.method || 'QRIS / E-wallet'}\n📦 Status: <b>${depo.status.toUpperCase()}</b>\n⏰ Tanggal: ${new Date(depo.timestamp || Date.now()).toLocaleString()}`;

    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        UI.q(detailText),
        {
            parse_mode: 'HTML',
            entities: buildEntities(detailText, {
                '💳': EMOJI.MONEY_BAG,
                '🆔': EMOJI.PIN,
                '💰': EMOJI.MONEY_BAG,
                '💳': EMOJI.WALLET,
                '📦': EMOJI.PACKAGE,
                '⏰': EMOJI.BELL
            }),
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Kembali', 'profile_deposit')]
            ])
        }
    );
});

bot.action(/^order_detail_(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const uid = ctx.from.id;
    const user = await getUser(uid);
    const order = (user?.orders || []).find(o => o.id === orderId);

    if (!order) {
        return ctx.answerCbQuery('❌ Order tidak ditemukan', { show_alert: true });
    }

    try { await ctx.deleteMessage(); } catch(e){}

    const orderLoadingText = '⏳ <b>Mengambil detail order...</b>\n█▒▒▒▒▒ 10%';
    const msg = await ctx.reply(UI.q(orderLoadingText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(orderLoadingText, { '⏳': EMOJI.BELL }) 
    });
    
    const frames = ["█▒▒▒▒▒ 10%", "███▒▒▒▒ 30%", "█████▒▒ 50%", "███████ 80%", "█████████ 100%"];
    for (let f of frames) {
        await new Promise(r => setTimeout(r, 300));
        const orderFrameText = `<b>Detail Order</b>\n⏳ Loading...\n${f}`;
        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
            UI.q(orderFrameText), { 
                parse_mode: 'HTML', 
                entities: buildEntities(orderFrameText, { '⏳': EMOJI.BELL }) 
            }
        );
    }

    const orderDetailText = `📦 <b>DETAIL ORDER</b>\n\n🆔 Order ID: ${order.id}\n📂 Kategori: ${order.category || '-'}\n👤 Nama Akun: ${order.accountName || '-'}\n📱 Nomor: <code>${order.phone || '-'}</code>\n💰 Harga: Rp ${order.price.toLocaleString()}\n📦 Status: <b>${order.status.toUpperCase()}</b>\n⏰ Tanggal: ${new Date(order.timestamp).toLocaleString()}`;

    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        UI.q(orderDetailText),
        {
            parse_mode: 'HTML',
            entities: buildEntities(orderDetailText, {
                '📦': EMOJI.PACKAGE,
                '🆔': EMOJI.PIN,
                '📂': EMOJI.PIN,
                '👤': EMOJI.USER,
                '📱': EMOJI.PIN,
                '💰': EMOJI.MONEY_BAG,
                                '⏰': EMOJI.BELL
            }),
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Kembali', 'profile_order')]
            ])
        }
    );
});

// ==========================================
// 👑 ADMIN MENU (STEP BY STEP)
// ==========================================
bot.action('owner_menu', async (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) {
        return ctx.answerCbQuery('❌ Akses ditolak', { show_alert: true });
    }

    const totalUsers = (await getAllUsers()).length;
    const activeUsers = (await getAllUsers()).filter(u => u.balance > 0).length;
    const totalStock = await getTotalStock();
    const totalBalance = await getTotalBalance();
    const totalPromo = Object.keys(await Settings.find({ key: /^promo_/ })).length;
    const maintenance = await getMaintenance();

    const uptimeMs = Date.now() - BOT_START_TIME;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);

    const panelText = `👑 <b>OWNER CONTROL PANEL</b>\n\n📊 <b>STATISTIK BOT</b>\n━━━━━━━━━━━━━━━━\n👥 Total User     : ${totalUsers}\n🟢 User Aktif     : ${activeUsers}\n📦 Total Stok     : ${totalStock}\n💰 Total Saldo    : Rp ${totalBalance.toLocaleString()}\n🔥 Promo Aktif    : ${totalPromo}\n⏳ Uptime         : ${hours} Jam ${minutes} Menit\n\nSilahkan pilih aksi admin:`;

    try {
        await ctx.editMessageCaption(
            UI.q(panelText),
            {
                parse_mode: 'HTML',
                caption_entities: buildEntities(panelText, ADMIN_EMOJIS),
                ...Markup.inlineKeyboard([

                    [Markup.button.callback('➕ ADD STOK', 'adm_add')],

                    [
                        Markup.button.callback('➕ TAMBAH SALDO', 'adm_addsaldo'),
                        Markup.button.callback('➖ KURANGI SALDO', 'adm_minussaldo')
                    ],

                    [Markup.button.callback('🔥 PROMO', 'adm_promo')],

                    [
                        Markup.button.callback('📢 BROADCAST', 'adm_bc'),
                        Markup.button.callback(
                            maintenance ? '🛑 MAINTENANCE: ON' : '🟢 MAINTENANCE: OFF',
                            'adm_mt'
                        )
                    ],

                    [Markup.button.callback('🔙 BACK', 'back_home')]

                ])
            }
        );
    } catch (err) {
        console.log(err);
    }
});

bot.action('adm_addsaldo', (ctx) => {
    userState[ctx.from.id] = { step: 'ADD_SALDO_TARGET' };
    const addText = "🆔 Masukkan <b>ID atau Username</b> user:";
    ctx.reply(UI.q(addText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(addText, { '🆔': EMOJI.PIN }) 
    });
});

bot.action('adm_minussaldo', (ctx) => {
    userState[ctx.from.id] = { step: 'MINUS_SALDO_TARGET' };
    const minusText = "🆔 Masukkan <b>ID atau Username</b> user:";
    ctx.reply(UI.q(minusText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(minusText, { '🆔': EMOJI.PIN }) 
    });
});

bot.action('adm_add', async (ctx) => {
    let btns = [];
    for (let i = 1; i <= 8; i++) {
        btns.push(Markup.button.callback(`Kategori ${i}`, `add_cat_${i}`));
    }

    const addCatText = "📂 <b>PILIH KATEGORI:</b>";
    await ctx.editMessageCaption(
        UI.q(addCatText),
        {
            parse_mode: 'HTML',
            caption_entities: buildEntities(addCatText, { '📂': EMOJI.PIN }),
            ...Markup.inlineKeyboard(btns, { columns: 2 })
        }
    );
});

bot.action(/^add_cat_(\d+)$/, async (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) return;
    const cat = ctx.match[1];

    const methodText = `📂 <b>KATEGORI ${cat}</b>\n\nSilahkan pilih metode penambahan akun:`;
    await ctx.editMessageCaption(
        UI.q(methodText),
        {
            parse_mode: 'HTML',
            caption_entities: buildEntities(methodText, { '📂': EMOJI.PIN }),
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📩 VIA OTP', `method_otp_${cat}`)],
                [Markup.button.callback('🔑 VIA STRING SESSION', `method_string_${cat}`)],
                [Markup.button.callback('🔙 KEMBALI', 'adm_add')]
            ])
        }
    );
});

bot.action(/^method_otp_(\d+)$/, (ctx) => {
    const cat = ctx.match[1];
    userState[ctx.from.id] = { step: 'ADMIN_NAME', cat, method: 'OTP' };
    const nameText = "👤 Masukkan <b>Nama Akun</b>:";
    ctx.reply(UI.q(nameText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(nameText, { '👤': EMOJI.USER }) 
    });
});

bot.action(/^method_string_(\d+)$/, (ctx) => {
    const cat = ctx.match[1];
    userState[ctx.from.id] = { step: 'ADMIN_PHONE', cat, method: 'STRING' };
    const stringText = "🔑 Silahkan kirim <b>String Session</b> akun:";
    ctx.reply(UI.q(stringText), { 
        parse_mode: 'HTML', 
        entities: buildEntities(stringText, { '🔑': EMOJI.DIAMOND }) 
    });
});

bot.action('adm_promo', async (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) {
        return ctx.answerCbQuery('❌ Akses ditolak', { show_alert: true });
    }

    let btns = [];
    for (let i = 1; i <= 8; i++) {
        btns.push(Markup.button.callback(`Kategori ${i}`, `promo_cat_${i}`));
    }

    const promoText = "🔥 <b>PILIH KATEGORI YANG INGIN DIPROMO</b>";
    await ctx.reply(
        UI.q(promoText),
        { 
            parse_mode: 'HTML', 
            entities: buildEntities(promoText, { '🔥': EMOJI.FIRE }), 
            ...Markup.inlineKeyboard(btns, { columns: 2 }) 
        }
    );
});

bot.action(/^promo_cat_(\d+)$/, (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) return;

    const cat = ctx.match[1];
    userState[ctx.from.id] = { step: 'SET_PROMO_PRICE', cat };

    const setPromoText = `💰 Masukkan harga promo untuk Kategori ${cat}\n\nContoh: 3000`;
    ctx.reply(
        UI.q(setPromoText),
        { 
            parse_mode: 'HTML', 
            entities: buildEntities(setPromoText, { '💰': EMOJI.MONEY_BAG }) 
        }
    );
});

bot.action('adm_bc', (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) {
        return ctx.answerCbQuery('❌ Akses ditolak', { show_alert: true });
    }

    userState[ctx.from.id] = { step: 'BROADCAST' };
    const bcText = "📢 Kirim pesan yang ingin dibroadcast ke semua user:";
    ctx.reply(
        UI.q(bcText),
        { 
            parse_mode: 'HTML', 
            entities: buildEntities(bcText, { '📢': EMOJI.BELL }) 
        }
    );
});

bot.action('adm_mt', async (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) {
        return ctx.answerCbQuery('❌ Akses ditolak', { show_alert: true });
    }

    const current = await getMaintenance();
    await setMaintenance(!current);

    const mtText = !current
        ? "🛠️ Maintenance AKTIF\nUser tidak bisa menggunakan bot."
        : "✅ Maintenance NONAKTIF\nBot sudah normal kembali.";

    const mtEmojis = !current ? { '🛠️': EMOJI.GEAR } : { '✅': EMOJI.CHECKMARK };
    
    ctx.reply(
        UI.q(mtText),
        { parse_mode: 'HTML', entities: buildEntities(mtText, mtEmojis) }
    );
});

bot.action('back_home', async (ctx) => {
    try {
        await ctx.deleteMessage();
    } catch {}

    return renderHome(ctx);
});

// ==========================================
// ERROR HANDLING
// ==========================================
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
    try {
        ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi nanti.');
    } catch (e) {
        console.error('Failed to send error message:', e);
    }
});

// ==========================================
// 🚀 START BOT
// ==========================================
async function startBot() {
    try {
        await connectDB();
        await bot.launch();
        console.log("🚀 BOT PREMIUM ONLINE (MONGODB EDITION)");
        console.log(`📅 Started at: ${new Date().toISOString()}`);
    } catch (err) {
        console.error('❌ Failed to start bot:', err);
        process.exit(1);
    }
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => {
    console.log('🛑 SIGINT received, stopping bot...');
    bot.stop('SIGINT');
    mongoose.connection.close();
});

process.once('SIGTERM', () => {
    console.log('🛑 SIGTERM received, stopping bot...');
    bot.stop('SIGTERM');
    mongoose.connection.close();
});

