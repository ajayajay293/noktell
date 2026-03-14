// ============================================
// 🤖 ATLANTIC PPOB GATEWAY BOT - CLEAN EDITION
// ⚡ Prabayar & Pascabayar Support + Clean UI
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

// 🎨 Konfigurasi
const CONFIG = {
    BOT_TOKEN: '8602360591:AAGLcMSN5IQ5mBJjkj_MHmL0l6URlXhkTWw',
    ADMIN_ID: '8793356645',
    BASE_URL: 'https://atlantich2h.com',
    DB_FILE: './atlantic_data.json'
};

// 🚀 Inisialisasi Bot
const bot = new TelegramBot(CONFIG.BOT_TOKEN, { 
    polling: { 
        interval: 300, 
        autoStart: true,
        params: { timeout: 10 }
    }
});

// 📊 Database
class Database {
    constructor() {
        this.filePath = CONFIG.DB_FILE;
        this.data = this.load();
        this.initDefaults();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading database:', e);
        }
        return {};
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    initDefaults() {
        if (!this.data.users) this.data.users = {};
        if (!this.data.transactions) this.data.transactions = [];
        if (!this.data.sessions) this.data.sessions = {};
        this.save();
    }

    getUser(userId) {
        return this.data.users[userId.toString()] || null;
    }

    setUser(userId, data) {
        this.data.users[userId.toString()] = { 
            ...this.data.users[userId.toString()], 
            ...data,
            updatedAt: new Date().toISOString()
        };
        this.save();
    }

    getSession(userId) {
        return this.data.sessions[userId.toString()] || {};
    }

    setSession(userId, data) {
        this.data.sessions[userId.toString()] = {
            ...this.data.sessions[userId.toString()],
            ...data,
            timestamp: Date.now()
        };
        this.save();
    }

    clearSession(userId) {
        delete this.data.sessions[userId.toString()];
        this.save();
    }

    addTransaction(trx) {
        this.data.transactions.unshift({
            ...trx,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        });
        this.data.transactions = this.data.transactions.slice(0, 1000);
        this.save();
    }

    getUserTransactions(userId, limit = 10) {
        return this.data.transactions
            .filter(t => t.userId === userId.toString())
            .slice(0, limit);
    }
}

const db = new Database();

// 🎨 Emoji Set (Clean & Simple)
const EMOJI = {
    bot: '🤖',
    user: '👤',
    key: '🔑',
    money: '💰',
    phone: '📱',
    lightning: '⚡',
    game: '🎮',
    card: '💳',
    water: '💧',
    net: '🌐',
    list: '📋',
    check: '✓',
    cross: '✗',
    arrow: '→',
    back: '←',
    home: '🏠',
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
    pending: '⏳',
    time: '🕐',
    search: '🔍',
    bank: '🏦',
    shop: '🛒',
    tag: '🏷️',
    bill: '🧾',
    power: '🔌',
    mobile: '📲',
    wifi: '📶',
    fire: '🔥',
    star: '⭐',
    new: '🆕',
    settings: '⚙️',
    history: '📜',
    wallet: '👛'
};

// 🛠️ Helper Functions
class Helpers {
    static generateRef() {
        return 'ATL' + Date.now().toString(36).toUpperCase();
    }

    static formatPrice(amount) {
        return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    }

    static formatDate(date) {
        return new Date(date).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static escapeMarkdown(text) {
        if (!text) return '';
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }

    static async loading(bot, chatId, text) {
        const msg = await bot.sendMessage(chatId, `${EMOJI.pending} ${text}...`, { parse_mode: 'Markdown' });
        return msg;
    }
}

// 🌐 Atlantic API
class AtlanticAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = CONFIG.BASE_URL;
    }

    async request(endpoint, params = {}) {
        try {
            const formData = new URLSearchParams();
            formData.append('api_key', this.apiKey);
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            const response = await axios({
                method: 'POST',
                url: `${this.baseURL}${endpoint}`,
                data: formData.toString(),
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            console.error(`API Error ${endpoint}:`, error.message);
            throw error;
        }
    }

    async getProfile() {
        return await this.request('/get_profile');
    }

    async getPriceListPrabayar() {
        return await this.request('/layanan/price_list');
    }

    async getPriceListPascabayar() {
        // Endpoint pascabayar (sesuaikan jika berbeda)
        return await this.request('/layanan/pascabayar');
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

// 🎨 Clean UI Components
class UI {
    static header(title) {
        return `*${Helpers.escapeMarkdown(title)}*\n${'─'.repeat(30)}\n\n`;
    }

    static section(title, content) {
        return `*${Helpers.escapeMarkdown(title)}*\n${content}\n\n`;
    }

    static item(label, value) {
        return `${EMOJI.arrow} *${label}:* ${Helpers.escapeMarkdown(value)}\n`;
    }

    static priceItem(name, price) {
        return `${EMOJI.tag} ${Helpers.escapeMarkdown(name)}\n   ${EMOJI.money} ${Helpers.formatPrice(price)}\n`;
    }

    static Keyboards = {
        // Menu Utama - Pilihan Tipe Layanan
        mainMenu: () => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.lightning} Prabayar (Isi Ulang)`, callback_data: 'type_prabayar' },
                    { text: `${EMOJI.bill} Pascabayar (Tagihan)`, callback_data: 'type_pascabayar' }
                ],
                [
                    { text: `${EMOJI.bank} Cek Rekening`, callback_data: 'menu_cekrek' },
                    { text: `${EMOJI.wallet} Cek Saldo`, callback_data: 'menu_saldo' }
                ],
                [
                    { text: `${EMOJI.history} Riwayat`, callback_data: 'menu_history' },
                    { text: `${EMOJI.settings} Pengaturan`, callback_data: 'menu_settings' }
                ]
            ]
        }),

        // Menu Kategori Prabayar
        categoriesPrabayar: () => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.power} Listrik PLN`, callback_data: 'prabayar_PLN' },
                    { text: `${EMOJI.mobile} Pulsa`, callback_data: 'prabayar_Pulsa' }
                ],
                [
                    { text: `${EMOJI.wifi} Paket Data`, callback_data: 'prabayar_Data' },
                    { text: `${EMOJI.card} E-Money`, callback_data: 'prabayar_E-Money' }
                ],
                [
                    { text: `${EMOJI.game} Games`, callback_data: 'prabayar_Games' },
                    { text: `${EMOJI.shop} Voucher`, callback_data: 'prabayar_Voucher' }
                ],
                [
                    { text: `${EMOJI.water} PDAM`, callback_data: 'prabayar_PDAM' },
                    { text: `${EMOJI.net} Internet`, callback_data: 'prabayar_Internet' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        }),

        // Menu Kategori Pascabayar
        categoriesPascabayar: () => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.power} PLN Pascabayar`, callback_data: 'pascabayar_PLN' },
                    { text: `${EMOJI.mobile} HP Pascabayar`, callback_data: 'pascabayar_HP' }
                ],
                [
                    { text: `${EMOJI.water} PDAM`, callback_data: 'pascabayar_PDAM' },
                    { text: `${EMOJI.net} Internet`, callback_data: 'pascabayar_Internet' }
                ],
                [
                    { text: `${EMOJI.bill} BPJS`, callback_data: 'pascabayar_BPJS' },
                    { text: `${EMOJI.money} PBB`, callback_data: 'pascabayar_PBB' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        }),

        backToMenu: () => ({
            inline_keyboard: [[
                { text: `${EMOJI.back} Kembali ke Menu`, callback_data: 'nav_main' }
            ]]
        }),

        backOnly: () => ({
            inline_keyboard: [[
                { text: `${EMOJI.back} Kembali`, callback_data: 'nav_back' }
            ]]
        }),

        confirm: (ref) => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.check} Konfirmasi`, callback_data: `confirm_${ref}` },
                    { text: `${EMOJI.cross} Batal`, callback_data: `cancel_${ref}` }
                ]
            ]
        }),

        checkStatus: (id) => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.search} Cek Status`, callback_data: `status_${id}` },
                    { text: `${EMOJI.home} Menu`, callback_data: 'nav_main' }
                ]
            ]
        }),

        bankList: () => ({
            inline_keyboard: [
                [
                    { text: 'DANA', callback_data: 'bank_dana' },
                    { text: 'OVO', callback_data: 'bank_ovo' },
                    { text: 'GoPay', callback_data: 'bank_gopay' }
                ],
                [
                    { text: 'ShopeePay', callback_data: 'bank_shopeepay' },
                    { text: 'SeaBank', callback_data: 'bank_seabank' },
                    { text: 'Lainnya', callback_data: 'bank_other' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        }),

        settings: () => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.key} Ganti API Key`, callback_data: 'set_apikey' },
                    { text: `${EMOJI.user} Profile`, callback_data: 'set_profile' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        })
    };
}

// 🤖 Bot Logic
class AtlanticBot {
    constructor() {
        this.setupHandlers();
        console.log('Atlantic PPOB Bot Started - Clean Edition');
    }

    setupHandlers() {
        bot.onText(/\/start/, this.handleStart.bind(this));
        bot.on('message', this.handleMessage.bind(this));
        bot.on('callback_query', this.handleCallback.bind(this));
        bot.on('polling_error', console.error);
    }

    // 🏠 Start
    async handleStart(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const name = msg.from.first_name;
        const user = db.getUser(userId);

        if (!user || !user.isRegistered) {
            await this.showRegister(chatId, userId, name);
        } else {
            await this.showMainMenu(chatId, userId);
        }
    }

    // 📝 Register Screen
    async showRegister(chatId, userId, name) {
        const text = 
            UI.header('Selamat Datang di Atlantic PPOB') +
            `Halo ${Helpers.escapeMarkdown(name)},\n\n` +
            `Silakan daftar untuk menggunakan layanan pembayaran.\n\n` +
            UI.item('Status', 'Belum Terdaftar') +
            `\nKlik tombol di bawah untuk mulai mendaftar:`;

        const keyboard = {
            inline_keyboard: [[
                { text: `${EMOJI.key} Daftar Sekarang`, callback_data: 'register_start' }
            ]]
        };

        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // 🏠 Main Menu
    async showMainMenu(chatId, userId, editMsgId = null) {
        const user = db.getUser(userId);
        const balance = user?.profile?.balance || 0;

        const text = 
            UI.header('Menu Utama') +
            UI.item('Saldo', Helpers.formatPrice(balance)) +
            UI.item('User', user?.profile?.username || '-') +
            `\nPilih tipe layanan:`;

        if (editMsgId) {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: editMsgId,
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.mainMenu()
            });
        } else {
            await bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.mainMenu()
            });
        }
    }

    // 💬 Handle Messages
    async handleMessage(msg) {
        if (!msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text.trim();
        const session = db.getSession(userId);

        if (session.awaiting === 'api_key') {
            await this.processRegister(chatId, userId, text);
        }
        else if (session.awaiting === 'target') {
            await this.processTarget(chatId, userId, text);
        }
        else if (session.awaiting === 'cek_rekening') {
            await this.processCekRek(chatId, userId, text);
        }
        else if (session.awaiting === 'new_api_key') {
            await this.processGantiApi(chatId, userId, text);
        }
    }

    // 🎮 Handle Callbacks
    async handleCallback(query) {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;
        const msgId = query.message.message_id;

        await bot.answerCallbackQuery(query.id);

        const user = db.getUser(userId);

        // Register flow
        if (data === 'register_start') {
            await this.promptApiKey(chatId, userId, msgId);
            return;
        }

        // Navigasi
        if (data === 'nav_main') {
            await this.showMainMenu(chatId, userId, msgId);
            return;
        }

        if (data === 'nav_back') {
            await this.showMainMenu(chatId, userId, msgId);
            return;
        }

        // Cek login
        if (!user?.isRegistered) {
            await bot.editMessageText(
                UI.header('Akses Ditolak') +
                'Anda harus mendaftar terlebih dahulu.',
                {
                    chat_id: chatId,
                    message_id: msgId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[
                        { text: `${EMOJI.key} Daftar`, callback_data: 'register_start' }
                    ]] }
                }
            );
            return;
        }

        // Pilihan Tipe Layanan
        if (data === 'type_prabayar') {
            await this.showPrabayarCategories(chatId, userId, msgId);
            return;
        }

        if (data === 'type_pascabayar') {
            await this.showPascabayarCategories(chatId, userId, msgId);
            return;
        }

        // Kategori Prabayar
        if (data.startsWith('prabayar_')) {
            const cat = data.replace('prabayar_', '');
            await this.showPrabayarProducts(chatId, userId, cat, msgId);
            return;
        }

        // Kategori Pascabayar
        if (data.startsWith('pascabayar_')) {
            const cat = data.replace('pascabayar_', '');
            await this.showPascabayarProducts(chatId, userId, cat, msgId);
            return;
        }

        // Beli Produk
        if (data.startsWith('buy_')) {
            const code = data.replace('buy_', '');
            await this.promptTarget(chatId, userId, code, msgId);
            return;
        }

        // Konfirmasi
        if (data.startsWith('confirm_')) {
            const ref = data.replace('confirm_', '');
            await this.processTransaction(chatId, userId, ref, msgId);
            return;
        }

        if (data.startsWith('cancel_')) {
            await this.cancelOrder(chatId, userId, msgId);
            return;
        }

        // Cek Status
        if (data.startsWith('status_')) {
            const id = data.replace('status_', '');
            await this.checkStatus(chatId, userId, id, msgId);
            return;
        }

        // Menu lainnya
        if (data === 'menu_saldo') {
            await this.showSaldo(chatId, userId, msgId);
            return;
        }

        if (data === 'menu_history') {
            await this.showHistory(chatId, userId, msgId);
            return;
        }

        if (data === 'menu_cekrek') {
            await this.showCekRekMenu(chatId, userId, msgId);
            return;
        }

        if (data.startsWith('bank_')) {
            const bank = data.replace('bank_', '');
            await this.promptRekNumber(chatId, userId, bank, msgId);
            return;
        }

        if (data === 'menu_settings') {
            await this.showSettings(chatId, userId, msgId);
            return;
        }

        if (data === 'set_apikey') {
            await this.promptGantiApi(chatId, userId, msgId);
            return;
        }

        if (data === 'set_profile') {
            await this.showProfile(chatId, userId, msgId);
            return;
        }
    }

    // 📝 Prompt API Key
    async promptApiKey(chatId, userId, msgId) {
        db.setSession(userId, { awaiting: 'api_key' });

        const text = 
            UI.header('Pendaftaran') +
            `Silakan masukkan API Key Atlantic Anda:\n\n` +
            UI.item('Format', 'Masukkan langsung API Key') +
            UI.item('Contoh', 'UbRba33Sh4A0sbAJ1MNn...') +
            `\n${EMOJI.warning} API Key bersifat rahasia`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // ✅ Process Register
    async processRegister(chatId, userId, apiKey) {
        const loading = await Helpers.loading(bot, chatId, 'Memverifikasi');

        try {
            const api = new AtlanticAPI(apiKey);
            const profile = await api.getProfile();

            if (profile.status === true || profile.status === 'true') {
                // Simpan user
                const userData = {
                    isRegistered: true,
                    apiKey: apiKey,
                    registeredAt: new Date().toISOString(),
                    profile: profile.data,
                    name: profile.data.name || profile.data.username
                };

                db.setUser(userId, userData);
                db.clearSession(userId);

                // Notifikasi ke Owner (FULL API KEY)
                await this.notifyOwner(userId, userData, apiKey);

                await bot.deleteMessage(chatId, loading.message_id);

                const text = 
                    UI.header('Pendaftaran Berhasil') +
                    UI.item('Nama', profile.data.name) +
                    UI.item('Username', profile.data.username) +
                    UI.item('Email', profile.data.email) +
                    UI.item('Telepon', profile.data.phone) +
                    UI.item('Saldo', Helpers.formatPrice(profile.data.balance)) +
                    `\nSelamat datang! Anda sekarang dapat bertransaksi.`;

                await bot.sendMessage(chatId, text, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[
                        { text: `${EMOJI.arrow} Mulai Bertransaksi`, callback_data: 'nav_main' }
                    ]] }
                });

            } else {
                throw new Error('Invalid response');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            
            const text = 
                UI.header('Verifikasi Gagal') +
                `API Key tidak valid atau terjadi kesalahan.\n\n` +
                `Silakan coba lagi:`;

            await bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[
                    { text: `${EMOJI.back} Coba Lagi`, callback_data: 'register_start' }
                ]] }
            });
        }
    }

    // 🔔 Notify Owner (FULL API KEY - tidak di-mask)
    async notifyOwner(userId, userData, fullApiKey) {
        try {
            const text = 
                UI.header('Pengguna Baru Terdaftar') +
                UI.item('User ID', userId) +
                UI.item('Nama', userData.name) +
                UI.item('Username', `@${userData.profile.username || 'none'}`) +
                `\n*Data Profile:*\n` +
                UI.item('Nama Lengkap', userData.profile.name) +
                UI.item('Email', userData.profile.email) +
                UI.item('No HP', userData.profile.phone) +
                UI.item('Saldo', Helpers.formatPrice(userData.profile.balance)) +
                UI.item('Status', userData.profile.status) +
                `\n*API KEY (FULL):*\n` +
                `\`${fullApiKey}\`\n\n` +
                `Waktu: ${Helpers.formatDate(new Date())}`;

            await bot.sendMessage(CONFIG.ADMIN_ID, text, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error('Gagal kirim notif owner:', e);
        }
    }

    // 📂 Show Prabayar Categories
    async showPrabayarCategories(chatId, userId, msgId) {
        const text = 
            UI.header('Layanan Prabayar') +
            `Pilih kategori produk:\n\n` +
            `${EMOJI.info} Prabayar = Pembayaran dimuka (Isi ulang, voucher, dll)`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.categoriesPrabayar()
        });
    }

    // 📂 Show Pascabayar Categories
    async showPascabayarCategories(chatId, userId, msgId) {
        const text = 
            UI.header('Layanan Pascabayar') +
            `Pilih kategori tagihan:\n\n` +
            `${EMOJI.info} Pascabayar = Pembayaran setelah pemakaian (Tagihan bulanan)`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.categoriesPascabayar()
        });
    }

    // 📦 Show Prabayar Products
    async showPrabayarProducts(chatId, userId, category, msgId) {
        const loading = await Helpers.loading(bot, chatId, 'Memuat produk');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.getPriceListPrabayar();

            await bot.deleteMessage(chatId, loading.message_id);

            if (!result.status || !Array.isArray(result.data)) {
                throw new Error('Invalid data');
            }

            // Filter by category
            const products = result.data.filter(p => 
                p.category?.toUpperCase() === category.toUpperCase() &&
                p.status?.toLowerCase() === 'available'
            );

            if (products.length === 0) {
                await bot.editMessageText(
                    UI.header('Produk Tidak Tersedia') +
                    `Tidak ada produk ${category} yang tersedia.`,
                    {
                        chat_id: chatId,
                        message_id: msgId,
                        parse_mode: 'Markdown',
                        reply_markup: UI.Keyboards.backToMenu()
                    }
                );
                return;
            }

            // Build product list (2 per row)
            const buttons = [];
            for (let i = 0; i < products.length; i += 2) {
                const row = [];
                const p1 = products[i];
                
                row.push({
                    text: `${p1.name.substring(0, 20)}\n${Helpers.formatPrice(p1.price)}`,
                    callback_data: `buy_${p1.code}`
                });

                if (products[i + 1]) {
                    const p2 = products[i + 1];
                    row.push({
                        text: `${p2.name.substring(0, 20)}\n${Helpers.formatPrice(p2.price)}`,
                        callback_data: `buy_${p2.code}`
                    });
                }
                buttons.push(row);
            }
            buttons.push([{ text: `${EMOJI.back} Kembali`, callback_data: 'type_prabayar' }]);

            const text = 
                UI.header(`Produk ${category}`) +
                `Total: ${products.length} produk\n\n` +
                `Pilih produk:`;

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'Gagal memuat produk. Coba lagi nanti.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📦 Show Pascabayar Products
    async showPascabayarProducts(chatId, userId, category, msgId) {
        const loading = await Helpers.loading(bot, chatId, 'Memuat layanan');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.getPriceListPascabayar();

            await bot.deleteMessage(chatId, loading.message_id);

            if (!result.status || !Array.isArray(result.data)) {
                throw new Error('Invalid data');
            }

            // Filter by category
            const products = result.data.filter(p => 
                p.category?.toUpperCase().includes(category.toUpperCase()) &&
                p.status?.toLowerCase() === 'available'
            );

            if (products.length === 0) {
                await bot.editMessageText(
                    UI.header('Layanan Tidak Tersedia') +
                    `Tidak ada layanan ${category} yang tersedia.`,
                    {
                        chat_id: chatId,
                        message_id: msgId,
                        parse_mode: 'Markdown',
                        reply_markup: UI.Keyboards.backToMenu()
                    }
                );
                return;
            }

            // Build buttons
            const buttons = products.map(p => ([{
                text: `${p.layanan} (Admin: ${Helpers.formatPrice(p.admin)})`,
                callback_data: `buy_${p.code}`
            }]));
            buttons.push([{ text: `${EMOJI.back} Kembali`, callback_data: 'type_pascabayar' }]);

            const text = 
                UI.header(`Layanan ${category}`) +
                `Total: ${products.length} layanan\n\n` +
                `Pilih layanan cek tagihan:`;

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'Gagal memuat layanan. Coba lagi nanti.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📝 Prompt Target
    async promptTarget(chatId, userId, code, msgId) {
        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            
            // Cek di prabayar dulu
            let result = await api.getPriceListPrabayar();
            let product = result.data?.find(p => p.code === code);

            // Kalau tidak ketemu, cek pascabayar
            if (!product) {
                result = await api.getPriceListPascabayar();
                product = result.data?.find(p => p.code === code);
            }

            if (!product) {
                throw new Error('Produk tidak ditemukan');
            }

            const isPrabayar = product.price !== undefined;
            const ref = Helpers.generateRef();

            db.setSession(userId, {
                awaiting: 'target',
                order: {
                    code: product.code,
                    name: isPrabayar ? product.name : product.layanan,
                    price: isPrabayar ? product.price : product.admin,
                    category: product.category,
                    note: product.note || '-',
                    type: isPrabayar ? 'prabayar' : 'pascabayar',
                    ref: ref
                }
            });

            const text = 
                UI.header('Konfirmasi Pesanan') +
                UI.item('Produk', product.name || product.layanan) +
                UI.item('Kategori', product.category) +
                UI.item(isPrabayar ? 'Harga' : 'Biaya Admin', Helpers.formatPrice(isPrabayar ? product.price : product.admin)) +
                UI.item('Catatan', product.note || '-') +
                `\nMasukkan nomor tujuan/ID pelanggan:`;

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backOnly()
            });

        } catch (error) {
            await bot.sendMessage(chatId, 
                'Gagal memuat detail produk.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📝 Process Target
    async processTarget(chatId, userId, target) {
        const session = db.getSession(userId);
        const order = session.order;

        if (!order) {
            await bot.sendMessage(chatId, 
                'Sesi habis. Silakan mulai ulang.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
            return;
        }

        const cleanTarget = target.replace(/\s/g, '');
        
        if (cleanTarget.length < 5) {
            await bot.sendMessage(chatId, 
                'Nomor terlalu pendek. Masukkan lagi:',
                { reply_markup: UI.Keyboards.backOnly() }
            );
            return;
        }

        db.setSession(userId, {
            awaiting: 'confirm',
            order: { ...order, target: cleanTarget }
        });

        const text = 
            UI.header('Konfirmasi Pembelian') +
            UI.item('Produk', order.name) +
            UI.item('Harga/Biaya', Helpers.formatPrice(order.price)) +
            UI.item('Tujuan', cleanTarget) +
            UI.item('Ref ID', order.ref) +
            `\nLanjutkan pembayaran?`;

        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.confirm(order.ref)
        });
    }

    // 💳 Process Transaction
    async processTransaction(chatId, userId, ref, msgId) {
        const session = db.getSession(userId);
        const order = session.order;

        if (!order || order.ref !== ref) {
            await bot.editMessageText(
                'Sesi tidak valid.',
                {
                    chat_id: chatId,
                    message_id: msgId,
                    reply_markup: UI.Keyboards.backToMenu()
                }
            );
            return;
        }

        const loading = await Helpers.loading(bot, chatId, 'Memproses transaksi');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            
            const result = await api.createTransaction(
                order.code,
                order.ref,
                order.target,
                order.price
            );

            await bot.deleteMessage(chatId, loading.message_id);
            db.clearSession(userId);

            if (result.status) {
                db.addTransaction({
                    userId: userId.toString(),
                    ref: order.ref,
                    trxId: result.data.id,
                    product: order.name,
                    target: order.target,
                    price: order.price,
                    status: result.data.status
                });

                const text = 
                    UI.header('Transaksi Berhasil Dibuat') +
                    UI.item('ID Transaksi', result.data.id) +
                    UI.item('Ref ID', result.data.reff_id) +
                    UI.item('Layanan', result.data.layanan) +
                    UI.item('Target', result.data.target) +
                    UI.item('Harga', Helpers.formatPrice(result.data.price)) +
                    UI.item('Status', result.data.status) +
                    `\nTransaksi sedang diproses.`;

                await bot.sendMessage(chatId, text, {
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.checkStatus(result.data.id)
                });

                // Update saldo
                const profile = await api.getProfile();
                if (profile.status === true || profile.status === 'true') {
                    db.setUser(userId, { profile: profile.data });
                }

            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                `Transaksi gagal: ${error.message}`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // ❌ Cancel
    async cancelOrder(chatId, userId, msgId) {
        db.clearSession(userId);
        await bot.editMessageText(
            UI.header('Dibatalkan') +
            'Transaksi telah dibatalkan.',
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backToMenu()
            }
        );
    }

    // 🔍 Check Status
    async checkStatus(chatId, userId, id, msgId) {
        const loading = await Helpers.loading(bot, chatId, 'Mengecek status');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.checkStatus(id);

            await bot.deleteMessage(chatId, loading.message_id);

            if (result.status && result.data) {
                const data = result.data;
                const text = 
                    UI.header('Status Transaksi') +
                    UI.item('ID', data.id) +
                    UI.item('Layanan', data.layanan) +
                    UI.item('Target', data.target) +
                    UI.item('Harga', Helpers.formatPrice(data.price)) +
                    UI.item('SN/Token', data.sn || 'Belum tersedia') +
                    UI.item('Status', data.status) +
                    UI.item('Waktu', data.created_at);

                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: msgId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.checkStatus(id)
                });
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'Gagal cek status.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 💰 Show Saldo
    async showSaldo(chatId, userId, msgId) {
        const loading = await Helpers.loading(bot, chatId, 'Memuat saldo');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const profile = await api.getProfile();

            await bot.deleteMessage(chatId, loading.message_id);

            if (profile.status === true || profile.status === 'true') {
                db.setUser(userId, { profile: profile.data });

                const text = 
                    UI.header('Informasi Saldo') +
                    UI.item('Nama', profile.data.name) +
                    UI.item('Username', profile.data.username) +
                    UI.item('Email', profile.data.email) +
                    UI.item('Telepon', profile.data.phone) +
                    UI.item('Saldo', Helpers.formatPrice(profile.data.balance)) +
                    UI.item('Status', profile.data.status);

                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: msgId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'Gagal memuat saldo.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📜 Show History
    async showHistory(chatId, userId, msgId) {
        const transactions = db.getUserTransactions(userId, 10);

        let text = UI.header('Riwayat Transaksi (10 Terakhir)');

        if (transactions.length === 0) {
            text += 'Belum ada transaksi.';
        } else {
            transactions.forEach((trx, i) => {
                const icon = trx.status === 'success' ? EMOJI.success : 
                            trx.status === 'pending' ? EMOJI.pending : EMOJI.error;
                text += `${i + 1}. ${icon} ${trx.product}\n`;
                text += `   ${EMOJI.arrow} ${trx.target} | ${Helpers.formatPrice(trx.price)}\n`;
                text += `   ${EMOJI.time} ${Helpers.formatDate(trx.timestamp)}\n\n`;
            });
        }

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backToMenu()
        });
    }

    // 🏦 Cek Rekening Menu
    async showCekRekMenu(chatId, userId, msgId) {
        const text = 
            UI.header('Cek Rekening/E-Wallet') +
            `Pilih bank/e-wallet:`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.bankList()
        });
    }

    // 📝 Prompt Rek Number
    async promptRekNumber(chatId, userId, bank, msgId) {
        db.setSession(userId, { 
            awaiting: 'cek_rekening',
            bank: bank 
        });

        const text = 
            UI.header('Input Nomor Rekening') +
            UI.item('Bank', bank.toUpperCase()) +
            `\nMasukkan nomor rekening/telepon:`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // 🔍 Process Cek Rek
    async processCekRek(chatId, userId, number) {
        const session = db.getSession(userId);
        const bank = session.bank;

        if (!bank) {
            await bot.sendMessage(chatId, 
                'Bank tidak valid.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
            return;
        }

        const loading = await Helpers.loading(bot, chatId, 'Memvalidasi');

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.cekRekening(bank, number.replace(/\s/g, ''));

            await bot.deleteMessage(chatId, loading.message_id);
            db.clearSession(userId);

            if (result.status && result.data) {
                const text = 
                    UI.header('Rekening Valid') +
                    UI.item('Bank', result.data.kode_bank.toUpperCase()) +
                    UI.item('Nomor', result.data.nomor_akun) +
                    UI.item('Nama', result.data.nama_pemilik) +
                    UI.item('Status', result.data.status);

                await bot.sendMessage(chatId, text, {
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            } else {
                throw new Error('Invalid');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'Rekening tidak ditemukan atau tidak valid.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // ⚙️ Settings
    async showSettings(chatId, userId, msgId) {
        const text = UI.header('Pengaturan');

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.settings()
        });
    }

    // 📝 Prompt Ganti API
    async promptGantiApi(chatId, userId, msgId) {
        db.setSession(userId, { awaiting: 'new_api_key' });

        const text = 
            UI.header('Ganti API Key') +
            `Masukkan API Key baru:`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // 🔄 Process Ganti API
    async processGantiApi(chatId, userId, newKey) {
        const loading = await Helpers.loading(bot, chatId, 'Verifikasi');

        try {
            const api = new AtlanticAPI(newKey);
            const profile = await api.getProfile();

            await bot.deleteMessage(chatId, loading.message_id);

            if (profile.status === true || profile.status === 'true') {
                db.setUser(userId, {
                    apiKey: newKey,
                    profile: profile.data
                });
                db.clearSession(userId);

                const text = 
                    UI.header('API Key Diperbarui') +
                    UI.item('Nama', profile.data.name) +
                    UI.item('Saldo', Helpers.formatPrice(profile.data.balance));

                await bot.sendMessage(chatId, text, {
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loading.message_id);
            await bot.sendMessage(chatId, 
                'API Key tidak valid.',
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 👤 Show Profile
    async showProfile(chatId, userId, msgId) {
        const user = db.getUser(userId);
        
        const text = 
            UI.header('Profile Anda') +
            UI.item('Nama', user.profile?.name) +
            UI.item('Username', user.profile?.username) +
            UI.item('Email', user.profile?.email) +
            UI.item('Telepon', user.profile?.phone) +
            UI.item('Terdaftar', Helpers.formatDate(user.registeredAt));

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backToMenu()
        });
    }
}

// 🚀 Start
const botInstance = new AtlanticBot();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Bot stopping...');
    bot.stopPolling();
    process.exit(0);
});
