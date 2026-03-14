// ============================================
// 🤖 ATLANTIC PPOB GATEWAY BOT
// ⚡ Powered by Node.js & Telegram Bot API
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 🎨 Konfigurasi
const CONFIG = {
    BOT_TOKEN: '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw',
    ADMIN_ID: '8793356645', // ID untuk notifikasi pendaftaran baru
    BASE_URL: 'https://atlantich2h.com',
    DB_FILE: './users_database.json'
};

// 🚀 Inisialisasi Bot
const bot = new TelegramBot(CONFIG.BOT_TOKEN, { polling: true });

// 📊 Database Sederhana
class Database {
    constructor() {
        this.filePath = CONFIG.DB_FILE;
        this.data = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            }
        } catch (e) {
            console.error('❌ Error loading database:', e);
        }
        return { users: {}, transactions: [] };
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    getUser(userId) {
        return this.data.users[userId] || null;
    }

    setUser(userId, data) {
        this.data.users[userId] = { ...this.data.users[userId], ...data };
        this.save();
    }

    addTransaction(trx) {
        this.data.transactions.push({ ...trx, timestamp: new Date().toISOString() });
        this.save();
    }
}

const db = new Database();

// 🎭 Animasi & Emoji Premium
const EMOJI = {
    loading: '⏳',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    money: '💰',
    lightning: '⚡',
    fire: '🔥',
    star: '⭐',
    crown: '👑',
    rocket: '🚀',
    phone: '📱',
    game: '🎮',
    electricity: '⚡',
    water: '💧',
    internet: '🌐',
    emoney: '💳',
    voucher: '🎫',
    pulsa: '📞',
    data: '📊',
    user: '👤',
    lock: '🔒',
    unlock: '🔓',
    bank: '🏦',
    check: '✓',
    arrow: '➤',
    love: '❤️',
    gift: '🎁',
    time: '⏰',
    history: '📜',
    settings: '⚙️',
    home: '🏠',
    back: '🔙',
    next: '▶️',
    previous: '◀️',
    search: '🔍',
    cart: '🛒',
    done: '🎯',
    new: '🆕',
    hot: '🌶️',
    cool: '😎',
    party: '🎉',
    alert: '🚨',
    bulb: '💡',
    zap: '⚡'
};

// 🎨 Helper untuk animasi loading
async function showLoading(chatId, text, duration = 1500) {
    const messages = [
        `${EMOJI.loading} ${text}`,
        `${EMOJI.loading} ${text} .`,
        `${EMOJI.loading} ${text} ..`,
        `${EMOJI.loading} ${text} ...`
    ];
    
    let msg = await bot.sendMessage(chatId, messages[0]);
    
    for (let i = 1; i < messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, duration / 4));
        await bot.editMessageText(messages[i], {
            chat_id: chatId,
            message_id: msg.message_id
        });
    }
    
    return msg;
}

// 🌐 API Atlantic Gateway
class AtlanticAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = CONFIG.BASE_URL;
    }

    async request(endpoint, params = {}) {
        try {
            const formData = new URLSearchParams();
            formData.append('api_key', this.apiKey);
            
            Object.keys(params).forEach(key => {
                formData.append(key, params[key]);
            });

            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            throw error;
        }
    }

    async getProfile() {
        return await this.request('/get_profile');
    }

    async getPriceList() {
        return await this.request('/layanan/price_list');
    }

    async createTransaction(code, reffId, target, limitPrice = null) {
        const params = { code, reff_id: reffId, target };
        if (limitPrice) params.limit_price = limitPrice;
        return await this.request('/transaksi/create', params);
    }

    async checkStatus(id, type = 'prabayar') {
        return await this.request('/transaksi/status', { id, type });
    }

    async cekRekening(bankCode, accountNumber) {
        return await this.request('/transfer/cek_rekening', {
            bank_code: bankCode,
            account_number: accountNumber
        });
    }
}

// 🎭 Keyboard Layouts
const Keyboards = {
    mainMenu: (isLoggedIn) => ({
        inline_keyboard: [
            [
                { text: `${EMOJI.electricity} Listrik PLN`, callback_data: 'category_PLN' },
                { text: `${EMOJI.pulsa} Pulsa`, callback_data: 'category_Pulsa' }
            ],
            [
                { text: `${EMOJI.data} Paket Data`, callback_data: 'category_Data' },
                { text: `${EMOJI.emoney} E-Money`, callback_data: 'category_E-Money' }
            ],
            [
                { text: `${EMOJI.game} Games`, callback_data: 'category_Games' },
                { text: `${EMOJI.voucher} Voucher`, callback_data: 'category_Voucher' }
            ],
            [
                { text: `${EMOJI.water} PDAM`, callback_data: 'category_PDAM' },
                { text: `${EMOJI.internet} Internet`, callback_data: 'category_Internet' }
            ],
            [
                { text: `${EMOJI.money} Cek Saldo`, callback_data: 'cek_saldo' },
                { text: `${EMOJI.history} Riwayat`, callback_data: 'riwayat' }
            ],
            [
                { text: `${EMOJI.bank} Cek Rekening`, callback_data: 'cek_rekening' },
                { text: `${EMOJI.settings} Ganti API Key`, callback_data: 'ganti_api' }
            ]
        ]
    }),

    backToMenu: () => ({
        inline_keyboard: [[
            { text: `${EMOJI.back} Kembali ke Menu`, callback_data: 'main_menu' }
        ]]
    }),

    confirmTransaction: (reffId) => ({
        inline_keyboard: [
            [
                { text: `${EMOJI.check} Konfirmasi`, callback_data: `confirm_${reffId}` },
                { text: `${EMOJI.error} Batal`, callback_data: 'cancel_order' }
            ]
        ]
    }),

    checkStatus: (trxId) => ({
        inline_keyboard: [
            [
                { text: `${EMOJI.search} Cek Status`, callback_data: `status_${trxId}` },
                { text: `${EMOJI.back} Menu`, callback_data: 'main_menu' }
            ]
        ]
    })
};

// 🎨 Format pesan dengan style premium
const Format = {
    header: (text) => `${EMOJI.crown} *${text}* ${EMOJI.crown}\n${'═'.repeat(30)}\n\n`,
    
    box: (title, content) => {
        return `\`${'┌' + '─'.repeat(28) + '┐'}\`\n` +
               `\`│\` ${EMOJI.bulb} *${title}*\n` +
               `\`${'├' + '─'.repeat(28) + '┤'}\`\n` +
               content.split('\n').map(line => `\`│\` ${line}`).join('\n') + '\n' +
               `\`${'└' + '─'.repeat(28) + '┘'}\`\n`;
    },
    
    success: (text) => `${EMOJI.success} *${text}* ${EMOJI.success}`,
    error: (text) => `${EMOJI.error} *${text}* ${EMOJI.error}`,
    warning: (text) => `${EMOJI.warning} *${text}* ${EMOJI.warning}`,
    info: (text) => `${EMOJI.info} ${text}`,
    
    price: (amount) => `💰 Rp ${parseInt(amount).toLocaleString('id-ID')}`,
    
    statusBadge: (status) => {
        const badges = {
            'pending': '⏳ PENDING',
            'success': '✅ SUKSES',
            'failed': '❌ GAGAL',
            'processing': '🔄 DIPROSES',
            'available': '🟢 TERSEDIA',
            'unavailable': '🔴 TIDAK TERSEDIA'
        };
        return badges[status.toLowerCase()] || status;
    }
};

// 🚀 Command Handlers
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'Unknown';
    const name = msg.from.first_name || 'User';

    const user = db.getUser(userId);
    
    if (!user || !user.apiKey) {
        // 🎭 Animasi welcome untuk user baru
        await showLoading(chatId, 'Memuat sistem...', 1000);
        
        const welcomeText = 
            `${EMOJI.rocket} *SELAMAT DATANG DI ATLANTIC PPOB GATEWAY* ${EMOJI.rocket}\n\n` +
            `${EMOJI.star} Hai ${name}! ${EMOJI.star}\n\n` +
            `${Format.box('PENDAFTARAN', 
                `${EMOJI.lock} Status: Belum Terdaftar\n${EMOJI.info} Silakan masukkan API Key Anda`
            )}` +
            `\n${EMOJI.warning} *Format:* \`/daftar apikey_anda\`\n` +
            `${EMOJI.info} Dapatkan API Key di atlantich2h.com\n\n` +
            `${EMOJI.party} *Fitur Unggulan:*\n` +
            `${EMOJI.lightning} Transaksi Cepat\n` +
            `${EMOJI.money} Harga Kompetitif\n` +
            `${EMOJI.check} Cek Status Real-time\n` +
            `${EMOJI.bank} Validasi Rekening`;

        await bot.sendMessage(chatId, welcomeText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: `${EMOJI.info} Cara Mendapatkan API Key`, url: 'https://atlantich2h.com' }
                ]]
            }
        });
    } else {
        await showMainMenu(chatId, userId);
    }
});

// 📝 Daftar API Key
bot.onText(/\/daftar (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const apiKey = match[1].trim();
    const username = msg.from.username || 'Unknown';
    const name = msg.from.first_name || 'User';

    const loadingMsg = await showLoading(chatId, 'Verifikasi API Key...', 2000);

    try {
        const api = new AtlanticAPI(apiKey);
        const profile = await api.getProfile();

        if (profile.status === 'true' || profile.status === true) {
            // Simpan user
            db.setUser(userId, {
                apiKey: apiKey,
                username: username,
                name: name,
                registeredAt: new Date().toISOString(),
                profile: profile.data
            });

            // 🎉 Notifikasi ke Admin
            const adminNotif = 
                `${EMOJI.new} *PENGGUNA BARU TERDAFTAR!* ${EMOJI.new}\n\n` +
                `${EMOJI.user} Nama: ${name}\n` +
                `${EMOJI.user} Username: @${username}\n` +
                `${EMOJI.user} ID: \`${userId}\`\n` +
                `${EMOJI.lock} API Key: \`${apiKey.substring(0, 10)}...\`\n` +
                `${EMOJI.time} Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                `${EMOJI.info} *Data Profile:*\n` +
                `• Nama: ${profile.data.name}\n` +
                `• Email: ${profile.data.email}\n` +
                `• No HP: ${profile.data.phone}\n` +
                `• Saldo: Rp ${parseInt(profile.data.balance).toLocaleString('id-ID')}`;

            await bot.sendMessage(CONFIG.ADMIN_ID, adminNotif, { parse_mode: 'Markdown' });

            // Sukses message
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
            const successText = 
                `${EMOJI.party} *PENDAFTARAN BERHASIL!* ${EMOJI.party}\n\n` +
                `${EMOJI.cool} Selamat datang, ${profile.data.name}!\n\n` +
                `${Format.box('INFO AKUN',
                    `${EMOJI.user} Nama: ${profile.data.name}\n` +
                    `${EMOJI.user} Username: ${profile.data.username}\n` +
                    `${EMOJI.money} Saldo: Rp ${parseInt(profile.data.balance).toLocaleString('id-ID')}\n` +
                    `${EMOJI.check} Status: ${profile.data.status.toUpperCase()}`
                )}`;

            await bot.sendMessage(chatId, successText, {
                parse_mode: 'Markdown',
                reply_markup: Keyboards.mainMenu(true)
            });

        } else {
            throw new Error('Invalid API Key');
        }
    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${Format.error('PENDAFTARAN GAGAL')}\n\n` +
            `${EMOJI.error} API Key tidak valid atau terjadi kesalahan.\n` +
            `${EMOJI.info} Silakan coba lagi atau hubungi admin.`,
            { parse_mode: 'Markdown' }
        );
    }
});

// 🏠 Main Menu
async function showMainMenu(chatId, userId) {
    const user = db.getUser(userId);
    
    const menuText = 
        `${EMOJI.crown} *ATLANTIC PPOB GATEWAY* ${EMOJI.crown}\n\n` +
        `${EMOJI.wave} Selamat datang kembali, ${user.profile?.name || 'User'}!\n\n` +
        `${EMOJI.money} Saldo: *Rp ${parseInt(user.profile?.balance || 0).toLocaleString('id-ID')}*\n` +
        `${EMOJI.user} Username: ${user.profile?.username || '-'}\n\n` +
        `${EMOJI.fire} *PILIH LAYANAN:*\n` +
        `${EMOJI.arrow} Kategori produk tersedia di bawah`;

    await bot.sendMessage(chatId, menuText, {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.mainMenu(true)
    });
}

// 🎮 Callback Query Handler
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    await bot.answerCallbackQuery(callbackQuery.id);

    const user = db.getUser(userId);
    if (!user || !user.apiKey) {
        return bot.sendMessage(chatId, 
            `${EMOJI.error} Anda belum terdaftar. Silakan /start terlebih dahulu.`,
            { parse_mode: 'Markdown' }
        );
    }

    try {
        if (data === 'main_menu') {
            await bot.deleteMessage(chatId, messageId);
            await showMainMenu(chatId, userId);
        }
        else if (data.startsWith('category_')) {
            const category = data.replace('category_', '');
            await showCategoryProducts(chatId, userId, category, messageId);
        }
        else if (data === 'cek_saldo') {
            await checkBalance(chatId, userId, messageId);
        }
        else if (data === 'cek_rekening') {
            await promptCekRekening(chatId, userId);
        }
        else if (data === 'riwayat') {
            await showHistory(chatId, userId);
        }
        else if (data === 'ganti_api') {
            await promptGantiApi(chatId, userId);
        }
        else if (data.startsWith('buy_')) {
            const code = data.replace('buy_', '');
            await promptBuyProduct(chatId, userId, code);
        }
        else if (data.startsWith('confirm_')) {
            const reffId = data.replace('confirm_', '');
            await processTransaction(chatId, userId, reffId);
        }
        else if (data.startsWith('status_')) {
            const trxId = data.replace('status_', '');
            await checkTransactionStatus(chatId, userId, trxId);
        }
        else if (data === 'cancel_order') {
            await bot.editMessageText(
                `${EMOJI.error} *TRANSAKSI DIBATALKAN* ${EMOJI.error}\n\n` +
                `Pesanan Anda telah dibatalkan.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: Keyboards.backToMenu()
                }
            );
        }
    } catch (error) {
        console.error('Callback error:', error);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} Terjadi kesalahan. Silakan coba lagi.`,
            { parse_mode: 'Markdown' }
        );
    }
});

// 📦 Show Category Products
async function showCategoryProducts(chatId, userId, category, messageId) {
    const loadingMsg = await showLoading(chatId, `Memuat produk ${category}...`, 1500);
    
    try {
        const user = db.getUser(userId);
        const api = new AtlanticAPI(user.apiKey);
        const priceList = await api.getPriceList();

        if (!priceList.status || !priceList.data) {
            throw new Error('Gagal memuat produk');
        }

        // Filter by category
        const products = priceList.data.filter(p => 
            p.category.toLowerCase() === category.toLowerCase() &&
            p.status === 'available'
        );

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (products.length === 0) {
            return bot.sendMessage(chatId, 
                `${EMOJI.warning} *TIDAK ADA PRODUK*\n\n` +
                `Produk kategori ${category} sedang tidak tersedia.`,
                { parse_mode: 'Markdown', reply_markup: Keyboards.backToMenu() }
            );
        }

        // 🎨 Buat grid produk (2 kolom)
        const buttons = [];
        for (let i = 0; i < products.length; i += 2) {
            const row = [];
            row.push({
                text: `${products[i].name} - Rp ${parseInt(products[i].price).toLocaleString('id-ID')}`,
                callback_data: `buy_${products[i].code}`
            });
            if (products[i + 1]) {
                row.push({
                    text: `${products[i + 1].name} - Rp ${parseInt(products[i + 1].price).toLocaleString('id-ID')}`,
                    callback_data: `buy_${products[i + 1].code}`
                });
            }
            buttons.push(row);
        }
        
        buttons.push([{ text: `${EMOJI.back} Kembali`, callback_data: 'main_menu' }]);

        const categoryIcons = {
            'PLN': EMOJI.electricity,
            'Pulsa': EMOJI.pulsa,
            'Data': EMOJI.data,
            'E-Money': EMOJI.emoney,
            'Games': EMOJI.game,
            'Voucher': EMOJI.voucher
        };

        const headerText = 
            `${categoryIcons[category] || EMOJI.star} *${category.toUpperCase()}* ${categoryIcons[category] || EMOJI.star}\n\n` +
            `${EMOJI.info} Pilih produk yang ingin dibeli:\n` +
            `${EMOJI.money} Harga tertera (termasuk markup)`;

        await bot.sendMessage(chatId, headerText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });

    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} Gagal memuat produk. Coba lagi nanti.`,
            { parse_mode: 'Markdown' }
        );
    }
}

// 🛒 Prompt Buy Product
async function promptBuyProduct(chatId, userId, code) {
    const user = db.getUser(userId);
    const api = new AtlanticAPI(user.apiKey);
    
    try {
        const priceList = await api.getPriceList();
        const product = priceList.data.find(p => p.code === code);

        if (!product) {
            return bot.sendMessage(chatId, `${EMOJI.error} Produk tidak ditemukan.`);
        }

        // Simpan state pembelian sementara
        db.setUser(userId, { 
            pendingOrder: { 
                code: code, 
                name: product.name,
                price: product.price,
                note: product.note,
                reffId: `ATL${Date.now()}${userId}`
            } 
        });

        const orderText = 
            `${EMOJI.cart} *KONFIRMASI PEMBELIAN* ${EMOJI.cart}\n\n` +
            `${Format.box('DETAIL PRODUK',
                `${EMOJI.star} Produk: ${product.name}\n` +
                `${EMOJI.money} Harga: Rp ${parseInt(product.price).toLocaleString('id-ID')}\n` +
                `${EMOJI.info} Catatan: ${product.note}\n` +
                `${EMOJI.lock} Kode: ${product.code}`
            )}` +
            `\n${EMOJI.warning} *Masukkan nomor tujuan:*\n` +
            `${EMOJI.arrow} Contoh: 08123456789 atau 123456789 (ID Pelanggan)`;

        await bot.sendMessage(chatId, orderText, {
            parse_mode: 'Markdown',
            reply_markup: Keyboards.backToMenu()
        });

        // Set state untuk menunggu input nomor
        db.setUser(userId, { state: 'waiting_target', pendingOrder: { 
            code, 
            name: product.name, 
            price: product.price,
            reffId: `ATL${Date.now()}${userId}`,
            note: product.note
        }});

    } catch (error) {
        await bot.sendMessage(chatId, `${EMOJI.error} Gagal memuat detail produk.`);
    }
}

// 💬 Message Handler untuk input nomor target
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (text.startsWith('/')) return; // Abaikan command

    const user = db.getUser(userId);
    if (!user || !user.state) return;

    // Handle input target number
    if (user.state === 'waiting_target') {
        const order = user.pendingOrder;
        const target = text.trim();

        // Validasi dasar
        if (target.length < 5) {
            return bot.sendMessage(chatId, 
                `${EMOJI.error} Nomor/ID terlalu pendek. Silakan coba lagi.`,
                { parse_mode: 'Markdown' }
            );
        }

        const confirmText = 
            `${EMOJI.cart} *KONFIRMASI PESANAN* ${EMOJI.cart}\n\n` +
            `${Format.box('RINGKASAN',
                `${EMOJI.star} Produk: ${order.name}\n` +
                `${EMOJI.money} Harga: Rp ${parseInt(order.price).toLocaleString('id-ID')}\n` +
                `${EMOJI.phone} Tujuan: ${target}\n` +
                `${EMOJI.lock} Ref ID: ${order.reffId}`
            )}` +
            `\n${EMOJI.warning} Pastikan data sudah benar!`;

        // Update pending order dengan target
        db.setUser(userId, { 
            state: 'waiting_confirm',
            pendingOrder: { ...order, target }
        });

        await bot.sendMessage(chatId, confirmText, {
            parse_mode: 'Markdown',
            reply_markup: Keyboards.confirmTransaction(order.reffId)
        });
    }

    // Handle cek rekening input
    else if (user.state === 'waiting_rekening') {
        const parts = text.trim().split(' ');
        if (parts.length < 2) {
            return bot.sendMessage(chatId, 
                `${EMOJI.error} Format salah!\n${EMOJI.info} Gunakan: [kode_bank] [nomor_rekening]\nContoh: dana 08123456789`,
                { parse_mode: 'Markdown' }
            );
        }

        const [bankCode, ...accParts] = parts;
        const accountNumber = accParts.join('');

        await processCekRekening(chatId, userId, bankCode, accountNumber);
        db.setUser(userId, { state: null });
    }

    // Handle ganti API key
    else if (user.state === 'waiting_new_api') {
        await processGantiApi(chatId, userId, text.trim());
        db.setUser(userId, { state: null });
    }
});

// ⚡ Process Transaction
async function processTransaction(chatId, userId, reffId) {
    const loadingMsg = await showLoading(chatId, 'Memproses transaksi...', 2000);
    
    try {
        const user = db.getUser(userId);
        const order = user.pendingOrder;

        if (!order || order.reffId !== reffId) {
            throw new Error('Order tidak valid');
        }

        const api = new AtlanticAPI(user.apiKey);
        const result = await api.createTransaction(
            order.code,
            order.reffId,
            order.target,
            order.price
        );

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (result.status) {
            // Simpan transaksi
            db.addTransaction({
                userId,
                reffId: order.reffId,
                trxId: result.data.id,
                product: order.name,
                target: order.target,
                price: order.price,
                status: result.data.status
            });

            const successText = 
                `${EMOJI.party} *TRANSAKSI BERHASIL DIBUAT!* ${EMOJI.party}\n\n` +
                `${Format.box('DETAIL TRANSAKSI',
                    `${EMOJI.lock} ID: ${result.data.id}\n` +
                    `${EMOJI.lock} Ref: ${result.data.reff_id}\n` +
                    `${EMOJI.star} Layanan: ${result.data.layanan}\n` +
                    `${EMOJI.phone} Target: ${result.data.target}\n` +
                    `${EMOJI.money} Harga: Rp ${parseInt(result.data.price).toLocaleString('id-ID')}\n` +
                    `${EMOJI.time} Status: ${Format.statusBadge(result.data.status)}\n` +
                    `${EMOJI.time} Waktu: ${result.data.created_at}`
                )}` +
                `\n${EMOJI.info} Transaksi sedang diproses oleh provider.`;

            await bot.sendMessage(chatId, successText, {
                parse_mode: 'Markdown',
                reply_markup: Keyboards.checkStatus(result.data.id)
            });

            // Update saldo di database
            const profile = await api.getProfile();
            if (profile.status === 'true' || profile.status === true) {
                db.setUser(userId, { profile: profile.data });
            }

        } else {
            throw new Error(result.message || 'Transaksi gagal');
        }

        // Clear pending order
        db.setUser(userId, { state: null, pendingOrder: null });

    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} *TRANSAKSI GAGAL*\n\n` +
            `${EMOJI.info} ${error.message}\n\n` +
            `${EMOJI.warning} Silakan coba lagi atau hubungi admin.`,
            { parse_mode: 'Markdown', reply_markup: Keyboards.backToMenu() }
        );
    }
}

// 🔍 Check Transaction Status
async function checkTransactionStatus(chatId, userId, trxId) {
    const loadingMsg = await showLoading(chatId, 'Mengecek status...', 1500);
    
    try {
        const user = db.getUser(userId);
        const api = new AtlanticAPI(user.apiKey);
        const result = await api.checkStatus(trxId);

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (result.status) {
            const data = result.data;
            const statusText = 
                `${EMOJI.search} *STATUS TRANSAKSI* ${EMOJI.search}\n\n` +
                `${Format.box('INFORMASI',
                    `${EMOJI.lock} ID: ${data.id}\n` +
                    `${EMOJI.lock} Ref: ${data.reff_id}\n` +
                    `${EMOJI.star} Layanan: ${data.layanan}\n` +
                    `${EMOJI.phone} Target: ${data.target}\n` +
                    `${EMOJI.money} Harga: Rp ${parseInt(data.price).toLocaleString('id-ID')}\n` +
                    `${EMOJI.zap} SN: ${data.sn || 'Belum tersedia'}\n` +
                    `${EMOJI.time} Status: ${Format.statusBadge(data.status)}\n` +
                    `${EMOJI.time} Dibuat: ${data.created_at}`
                )}`;

            await bot.sendMessage(chatId, statusText, {
                parse_mode: 'Markdown',
                reply_markup: Keyboards.backToMenu()
            });
        } else {
            throw new Error('Gagal mendapatkan status');
        }
    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.messageId);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} Gagal cek status: ${error.message}`,
            { parse_mode: 'Markdown' }
        );
    }
}

// 💰 Check Balance
async function checkBalance(chatId, userId, messageId) {
    const loadingMsg = await showLoading(chatId, 'Memuat informasi saldo...', 1500);
    
    try {
        const user = db.getUser(userId);
        const api = new AtlanticAPI(user.apiKey);
        const profile = await api.getProfile();

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (profile.status === 'true' || profile.status === true) {
            // Update database
            db.setUser(userId, { profile: profile.data });

            const balanceText = 
                `${EMOJI.money} *INFORMASI SALDO* ${EMOJI.money}\n\n` +
                `${Format.box('PROFILE AKUN',
                    `${EMOJI.user} Nama: ${profile.data.name}\n` +
                    `${EMOJI.user} Username: ${profile.data.username}\n` +
                    `${EMOJI.email} Email: ${profile.data.email}\n` +
                    `${EMOJI.phone} Telepon: ${profile.data.phone}\n` +
                    `${EMOJI.money} Saldo: Rp ${parseInt(profile.data.balance).toLocaleString('id-ID')}\n` +
                    `${EMOJI.check} Status: ${profile.data.status.toUpperCase()}`
                )}`;

            await bot.sendMessage(chatId, balanceText, {
                parse_mode: 'Markdown',
                reply_markup: Keyboards.backToMenu()
            });
        }
    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} Gagal memuat saldo.`,
            { parse_mode: 'Markdown' }
        );
    }
}

// 🏦 Cek Rekening
async function promptCekRekening(chatId, userId) {
    const text = 
        `${EMOJI.bank} *CEK REKENING/E-WALLET* ${EMOJI.bank}\n\n` +
        `${EMOJI.info} Masukkan kode bank dan nomor rekening:\n\n` +
        `${EMOJI.arrow} *Format:* [kode_bank] [nomor_rekening]\n` +
        `${EMOJI.arrow} *Contoh:* dana 08123456789\n\n` +
        `${EMOJI.info} *Kode Bank yang didukung:*\n` +
        `• dana (Dana)\n` +
        `• ovo (OVO)\n` +
        `• gopay (GoPay)\n` +
        `• shopeepay (ShopeePay)\n` +
        `• seabank (SeaBank)\n` +
        `• dll.`;

    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu()
    });

    db.setUser(userId, { state: 'waiting_rekening' });
}

async function processCekRekening(chatId, userId, bankCode, accountNumber) {
    const loadingMsg = await showLoading(chatId, 'Memvalidasi rekening...', 2000);
    
    try {
        const user = db.getUser(userId);
        const api = new AtlanticAPI(user.apiKey);
        const result = await api.cekRekening(bankCode, accountNumber);

        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (result.status) {
            const validText = 
                `${EMOJI.success} *REKENING VALID* ${EMOJI.success}\n\n` +
                `${Format.box('DETAIL REKENING',
                    `${EMOJI.bank} Kode Bank: ${result.data.kode_bank.toUpperCase()}\n` +
                    `${EMOJI.lock} No Rekening: ${result.data.nomor_akun}\n` +
                    `${EMOJI.user} Nama: ${result.data.nama_pemilik}\n` +
                    `${EMOJI.check} Status: ${result.data.status.toUpperCase()}`
                )}`;

            await bot.sendMessage(chatId, validText, {
                parse_mode: 'Markdown',
                reply_markup: Keyboards.backToMenu()
            });
        } else {
            throw new Error('Rekening tidak valid');
        }
    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} *REKENING TIDAK DITEMUKAN*\n\n` +
            `${EMOJI.info} Pastikan kode bank dan nomor benar.\n` +
            `${EMOJI.warning} Error: ${error.message}`,
            { parse_mode: 'Markdown', reply_markup: Keyboards.backToMenu() }
        );
    }
}

// 📜 Show History
async function showHistory(chatId, userId) {
    const transactions = db.data.transactions
        .filter(t => t.userId === userId)
        .slice(-10)
        .reverse();

    if (transactions.length === 0) {
        return bot.sendMessage(chatId, 
            `${EMOJI.info} Belum ada riwayat transaksi.`,
            { parse_mode: 'Markdown', reply_markup: Keyboards.backToMenu() }
        );
    }

    let historyText = `${EMOJI.history} *10 TRANSAKSI TERAKHIR* ${EMOJI.history}\n\n`;
    
    transactions.forEach((trx, index) => {
        historyText += 
            `${index + 1}. ${EMOJI.star} ${trx.product}\n` +
            `   ${EMOJI.phone} ${trx.target}\n` +
            `   ${EMOJI.money} Rp ${parseInt(trx.price).toLocaleString('id-ID')}\n` +
            `   ${EMOJI.time} ${Format.statusBadge(trx.status)}\n` +
            `   ${EMOJI.lock} \`${trx.trxId}\`\n\n`;
    });

    await bot.sendMessage(chatId, historyText, {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu()
    });
}

// ⚙️ Ganti API Key
async function promptGantiApi(chatId, userId) {
    const text = 
        `${EMOJI.settings} *GANTI API KEY* ${EMOJI.settings}\n\n` +
        `${EMOJI.warning} Masukkan API Key baru Anda:\n` +
        `${EMOJI.info} Bot akan memverifikasi validitas API Key.`;

    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: Keyboards.backToMenu()
    });

    db.setUser(userId, { state: 'waiting_new_api' });
}

async function processGantiApi(chatId, userId, newApiKey) {
    const loadingMsg = await showLoading(chatId, 'Verifikasi API Key baru...', 2000);

    try {
        const api = new AtlanticAPI(newApiKey);
        const profile = await api.getProfile();

        if (profile.status === 'true' || profile.status === true) {
            db.setUser(userId, { 
                apiKey: newApiKey,
                profile: profile.data 
            });

            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await bot.sendMessage(chatId, 
                `${EMOJI.success} *API KEY BERHASIL DIGANTI!* ${EMOJI.success}\n\n` +
                `${EMOJI.user} Akun: ${profile.data.name}\n` +
                `${EMOJI.money} Saldo: Rp ${parseInt(profile.data.balance).toLocaleString('id-ID')}`,
                { parse_mode: 'Markdown', reply_markup: Keyboards.backToMenu() }
            );
        }
    } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, 
            `${EMOJI.error} API Key tidak valid.`,
            { parse_mode: 'Markdown' }
        );
    }
}

// ❌ Error Handler
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// 🚀 Start Bot
console.log('🤖 Atlantic PPOB Bot is running...');
console.log('⚡ Powered by Node.js');
console.log('📅', new Date().toLocaleString('id-ID'));
