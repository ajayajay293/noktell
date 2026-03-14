// ============================================
// 🤖 ATLANTIC PPOB GATEWAY BOT - PREMIUM EDITION
// ⚡ Full Animation + Button Interface + Auto Verification
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
    DB_FILE: './atlantic_database.json'
};

// 🚀 Inisialisasi Bot dengan polling
const bot = new TelegramBot(CONFIG.BOT_TOKEN, { 
    polling: { 
        interval: 300, 
        autoStart: true,
        params: { timeout: 10 }
    },
    onlyFirstMatch: true
});

// 📊 Database dengan struktur lengkap
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
            console.error('❌ Error loading database:', e);
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
        // Keep only last 100 transactions per user
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

// 🎭 Emoji Premium Collection
const EMOJI = {
    loading: ['⏳', '⌛', '⏱️', '⌚'],
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
    electricity: '💡',
    water: '💧',
    internet: '🌐',
    emoney: '💳',
    voucher: '🎟️',
    pulsa: '📞',
    data: '📊',
    user: '👤',
    lock: '🔒',
    unlock: '🔓',
    bank: '🏦',
    check: '☑️',
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
    zap: '⚡',
    wave: '👋',
    pin: '📌',
    card: '💳',
    mail: '📧',
    phone2: '📲',
    chart: '📈',
    shop: '🛍️',
    wallet: '👛',
    credit: '💎',
    diamond: '💠',
    target: '🎯',
    key: '🔑',
    door: '🚪',
    enter: '➡️',
    exit: '🚪',
    refresh: '🔄',
    bell: '🔔',
    mute: '🔕',
    verify: '✔️',
    pending: '⏸️',
    process: '🔄',
    complete: '✨',
    failed: '💥',
    cancel: '🚫',
    edit: '✏️',
    delete: '🗑️',
    save: '💾',
    folder: '📁',
    file: '📄',
    link: '🔗',
    globe: '🌍',
    flag: '🏁',
    trophy: '🏆',
    medal: '🥇',
    crown2: '👸',
    king: '🤴',
    queen: '👸',
    robot: '🤖',
    alien: '👽',
    ghost: '👻',
    skull: '💀',
    bomb: '💣',
    fire2: '🔥',
    snow: '❄️',
    sun: '☀️',
    moon: '🌙',
    cloud: '☁️',
    rain: '🌧️',
    thunder: '⛈️',
    rainbow: '🌈',
    star2: '🌟',
    sparkles: '✨',
    boom: '💥',
    collision: '💥',
    pow: '💢',
    anger: '💢',
    thought: '💭',
    speech: '💬',
    zzz: '💤',
    sweat: '💦',
    dash: '💨'
};

// 🎨 Helper Functions
class Helpers {
    static generateRefId() {
        return 'ATL' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
    }

    static formatPrice(amount) {
        return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static maskString(str, start = 4, end = 4) {
        if (str.length <= start + end) return str;
        return str.substring(0, start) + '•'.repeat(str.length - start - end) + str.substring(str.length - end);
    }

    static escapeMarkdown(text) {
        if (!text) return '';
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }

    static async animateLoading(bot, chatId, text, duration = 2000) {
        const frames = ['⏳', '⌛', '⏱️', '⌚'];
        const messages = [];
        
        let msg = await bot.sendMessage(chatId, `${frames[0]} ${text}`, { parse_mode: 'Markdown' });
        
        const interval = duration / (frames.length * 2);
        
        for (let i = 1; i < frames.length * 2; i++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            try {
                await bot.editMessageText(
                    `${frames[i % frames.length]} ${text}${'.'.repeat((i % 3) + 1)}`, 
                    {
                        chat_id: chatId,
                        message_id: msg.message_id,
                        parse_mode: 'Markdown'
                    }
                );
            } catch (e) {
                // Ignore edit errors
            }
        }
        
        return msg;
    }

    static createProgressBar(percent, length = 10) {
        const filled = Math.round((percent / 100) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
    }
}

// 🌐 Atlantic API Handler
class AtlanticAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = CONFIG.BASE_URL;
    }

    async request(endpoint, params = {}, method = 'POST') {
        try {
            const formData = new URLSearchParams();
            formData.append('api_key', this.apiKey);
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            const config = {
                method: method,
                url: `${this.baseURL}${endpoint}`,
                data: formData.toString(),
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000,
                validateStatus: () => true
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            throw new Error(`Request failed: ${error.message}`);
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

// 🎨 UI Components
class UI {
    static header(title, subtitle = '') {
        return `${EMOJI.crown} *${Helpers.escapeMarkdown(title)}* ${EMOJI.crown}\n` +
               `${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}${EMOJI.star2}\n` +
               (subtitle ? `${subtitle}\n` : '');
    }

    static box(title, content) {
        const lines = content.split('\n').filter(l => l.trim());
        const maxLength = Math.max(...lines.map(l => l.length), title.length) + 2;
        const border = '─'.repeat(maxLength);
        
        let result = `\`\`\`\n┌${border}┐\n`;
        result += `│ ${title.padEnd(maxLength - 1)}│\n`;
        result += `├${border}┤\n`;
        lines.forEach(line => {
            result += `│ ${line.padEnd(maxLength - 1)}│\n`;
        });
        result += `└${border}┘\n\`\`\``;
        return result;
    }

    static statusBadge(status) {
        const badges = {
            'pending': `${EMOJI.pending} PENDING`,
            'success': `${EMOJI.success} SUKSES`,
            'failed': `${EMOJI.failed} GAGAL`,
            'processing': `${EMOJI.process} DIPROSES`,
            'available': `${EMOJI.success} TERSEDIA`,
            'unavailable': `${EMOJI.error} TIDAK TERSEDIA`,
            'active': `${EMOJI.success} AKTIF`,
            'inactive': `${EMOJI.error} NONAKTIF`
        };
        return badges[status?.toLowerCase()] || `${EMOJI.info} ${status?.toUpperCase()}`;
    }

    static categoryIcon(category) {
        const icons = {
            'PLN': EMOJI.electricity,
            'PULSA': EMOJI.pulsa,
            'DATA': EMOJI.data,
            'E-MONEY': EMOJI.emoney,
            'EMONEY': EMOJI.emoney,
            'GAMES': EMOJI.game,
            'VOUCHER': EMOJI.voucher,
            'PDAM': EMOJI.water,
            'INTERNET': EMOJI.internet,
            'BPJS': EMOJI.card,
            'TELKOM': EMOJI.phone,
            'PBB': EMOJI.bank,
            'ESAMSAT': EMOJI.car,
            'CAR': '🚗'
        };
        return icons[category?.toUpperCase()] || EMOJI.star;
    }

    static Keyboards = {
        // 🏠 Main Menu
        mainMenu: (balance = 0) => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.electricity} Listrik PLN`, callback_data: 'cat_PLN' },
                    { text: `${EMOJI.pulsa} Pulsa`, callback_data: 'cat_PULSA' }
                ],
                [
                    { text: `${EMOJI.data} Paket Data`, callback_data: 'cat_DATA' },
                    { text: `${EMOJI.emoney} E-Money`, callback_data: 'cat_E-MONEY' }
                ],
                [
                    { text: `${EMOJI.game} Games`, callback_data: 'cat_GAMES' },
                    { text: `${EMOJI.voucher} Voucher`, callback_data: 'cat_VOUCHER' }
                ],
                [
                    { text: `${EMOJI.water} PDAM`, callback_data: 'cat_PDAM' },
                    { text: `${EMOJI.internet} Internet`, callback_data: 'cat_INTERNET' }
                ],
                [
                    { text: `${EMOJI.wallet} Cek Saldo`, callback_data: 'menu_balance' },
                    { text: `${EMOJI.history} Riwayat`, callback_data: 'menu_history' }
                ],
                [
                    { text: `${EMOJI.bank} Cek Rekening`, callback_data: 'menu_cekrek' },
                    { text: `${EMOJI.settings} Pengaturan`, callback_data: 'menu_settings' }
                ]
            ]
        }),

        // 🔙 Back Button
        backToMenu: () => ({
            inline_keyboard: [[
                { text: `${EMOJI.back} Kembali ke Menu Utama`, callback_data: 'nav_main' }
            ]]
        }),

        backOnly: () => ({
            inline_keyboard: [[
                { text: `${EMOJI.back} Kembali`, callback_data: 'nav_back' }
            ]]
        }),

        // ✅ Confirmation
        confirmTransaction: (reffId) => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.success} YA, LANJUTKAN`, callback_data: `confirm_${reffId}` },
                    { text: `${EMOJI.cancel} BATALKAN`, callback_data: `cancel_${reffId}` }
                ]
            ]
        }),

        // 🔄 Check Status
        checkStatus: (trxId) => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.refresh} Cek Status Terbaru`, callback_data: `status_${trxId}` },
                    { text: `${EMOJI.home} Menu`, callback_data: 'nav_main' }
                ]
            ]
        }),

        // 📋 Product List Navigation
        productNav: (category, page, totalPages) => {
            const buttons = [];
            const navRow = [];
            
            if (page > 0) navRow.push({ text: `${EMOJI.previous} Prev`, callback_data: `page_${category}_${page-1}` });
            navRow.push({ text: `${page+1}/${totalPages}`, callback_data: 'noop' });
            if (page < totalPages - 1) navRow.push({ text: `Next ${EMOJI.next}`, callback_data: `page_${category}_${page+1}` });
            
            buttons.push(navRow);
            buttons.push([{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]);
            return { inline_keyboard: buttons };
        },

        // ⚙️ Settings
        settings: () => ({
            inline_keyboard: [
                [
                    { text: `${EMOJI.key} Ganti API Key`, callback_data: 'set_apikey' },
                    { text: `${EMOJI.user} Profile`, callback_data: 'set_profile' }
                ],
                [
                    { text: `${EMOJI.refresh} Refresh Data`, callback_data: 'set_refresh' },
                    { text: `${EMOJI.bell} Notifikasi`, callback_data: 'set_notif' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        }),

        // 🏦 Bank List untuk Cek Rekening
        bankList: () => ({
            inline_keyboard: [
                [
                    { text: 'DANA', callback_data: 'bank_dana' },
                    { text: 'OVO', callback_data: 'bank_ovo' },
                    { text: 'GoPay', callback_data: 'bank_gopay' }
                ],
                [
                    { text: 'ShopeePay', callback_data: 'bank_shopeepay' },
                    { text: 'LinkAja', callback_data: 'bank_linkaja' },
                    { text: 'SeaBank', callback_data: 'bank_seabank' }
                ],
                [
                    { text: 'BCA', callback_data: 'bank_bca' },
                    { text: 'BNI', callback_data: 'bank_bni' },
                    { text: 'BRI', callback_data: 'bank_bri' }
                ],
                [
                    { text: 'Mandiri', callback_data: 'bank_mandiri' },
                    { text: 'BSI', callback_data: 'bank_bsi' },
                    { text: 'Lainnya', callback_data: 'bank_other' }
                ],
                [{ text: `${EMOJI.back} Kembali`, callback_data: 'nav_main' }]
            ]
        })
    };
}

// 🎯 Message Cleaner
class MessageCleaner {
    static async deletePreviousMessages(bot, chatId, userId) {
        const session = db.getSession(userId);
        if (session.messageIds && session.messageIds.length > 0) {
            for (const msgId of session.messageIds) {
                try {
                    await bot.deleteMessage(chatId, msgId);
                } catch (e) {
                    // Message might be already deleted
                }
            }
        }
        db.setSession(userId, { messageIds: [] });
    }

    static async trackMessage(bot, chatId, userId, promise) {
        try {
            const msg = await promise;
            const session = db.getSession(userId);
            const ids = session.messageIds || [];
            ids.push(msg.message_id);
            db.setSession(userId, { messageIds: ids });
            return msg;
        } catch (e) {
            console.error('Error tracking message:', e);
            return null;
        }
    }

    static async editOrSend(bot, chatId, userId, text, options = {}) {
        const session = db.getSession(userId);
        const lastMsgId = session.lastMessageId;
        
        try {
            if (lastMsgId) {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: lastMsgId,
                    parse_mode: 'Markdown',
                    ...options
                });
                return { message_id: lastMsgId };
            }
        } catch (e) {
            // If edit fails, send new message
        }
        
        const msg = await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            ...options
        });
        
        db.setSession(userId, { lastMessageId: msg.message_id });
        return msg;
    }
}

// 🤖 Bot Logic
class AtlanticBot {
    constructor() {
        this.setupHandlers();
        console.log('🤖 Atlantic PPOB Bot Premium Initialized');
    }

    setupHandlers() {
        // 🚀 Start Command
        bot.onText(/\/start/, this.handleStart.bind(this));
        
        // 📨 Text Messages
        bot.on('message', this.handleMessage.bind(this));
        
        // 🎮 Callback Queries
        bot.on('callback_query', this.handleCallback.bind(this));
        
        // ❌ Error Handler
        bot.on('polling_error', (err) => console.error('Polling error:', err));
        bot.on('error', (err) => console.error('Bot error:', err));
    }

    // 🏠 Handle Start
    async handleStart(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const name = msg.from.first_name || 'User';
        const username = msg.from.username || 'Unknown';

        await MessageCleaner.deletePreviousMessages(bot, chatId, userId);

        const user = db.getUser(userId);

        if (!user || !user.isRegistered) {
            // 🎭 Welcome untuk user baru
            await this.showWelcomeNew(chatId, userId, name);
        } else {
            // 🎉 Welcome untuk user terdaftar
            await this.showMainMenu(chatId, userId);
        }
    }

    // 👋 Show Welcome New User
    async showWelcomeNew(chatId, userId, name) {
        const welcomeText = 
            `${UI.header('SELAMAT DATANG', `${EMOJI.wave} Hai ${Helpers.escapeMarkdown(name)}!`)}\n\n` +
            `${EMOJI.robot} *Atlantic PPOB Gateway* adalah bot layanan pembayaran terlengkap\n\n` +
            `${UI.box('PENDAFTARAN', 
                `${EMOJI.lock} Status: BELUM TERDAFTAR\n` +
                `${EMOJI.info} Silakan daftar terlebih dahulu`
            )}\n\n` +
            `${EMOJI.key} *Langkah-langkah:*\n` +
            `1️⃣ Klik tombol *DAFTAR SEKARANG* di bawah\n` +
            `2️⃣ Masukkan API Key Atlantic Anda\n` +
            `3️⃣ Tunggu verifikasi otomatis\n` +
            `4️⃣ Mulai bertransaksi!\n\n` +
            `${EMOJI.warning} Belum punya API Key?\n` +
            `${EMOJI.arrow} Daftar di https://atlantich2h.com`;

        const keyboard = {
            inline_keyboard: [[
                { text: `${EMOJI.enter} DAFTAR SEKARANG`, callback_data: 'register_start' },
                { text: `${EMOJI.globe} Website`, url: 'https://atlantich2h.com' }
            ]]
        };

        await MessageCleaner.trackMessage(
            bot, chatId, userId,
            bot.sendMessage(chatId, welcomeText, { 
                parse_mode: 'Markdown',
                reply_markup: keyboard,
                disable_web_page_preview: true
            })
        );
    }

    // 🏠 Show Main Menu
    async showMainMenu(chatId, userId, edit = false) {
        const user = db.getUser(userId);
        const balance = user?.profile?.balance || 0;
        const name = user?.profile?.name || user?.name || 'User';

        const menuText = 
            `${UI.header('MENU UTAMA', `${EMOJI.cool} Selamat datang, ${Helpers.escapeMarkdown(name)}`)}\n\n` +
            `${EMOJI.wallet} *Saldo:* \`${Helpers.formatPrice(balance)}\`\n` +
            `${EMOJI.user} *Username:* ${Helpers.escapeMarkdown(user?.profile?.username || '-')}\n` +
            `${EMOJI.time} *Update:* ${Helpers.formatDate(new Date())}\n\n` +
            `${EMOJI.fire} *PILIH LAYANAN:*`;

        if (edit) {
            await MessageCleaner.editOrSend(bot, chatId, userId, menuText, {
                reply_markup: UI.Keyboards.mainMenu(balance)
            });
        } else {
            await MessageCleaner.deletePreviousMessages(bot, chatId, userId);
            await MessageCleaner.trackMessage(
                bot, chatId, userId,
                bot.sendMessage(chatId, menuText, {
                    reply_markup: UI.Keyboards.mainMenu(balance)
                })
            );
        }
    }

    // 💬 Handle Text Messages
    async handleMessage(msg) {
        if (!msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text.trim();
        const session = db.getSession(userId);

        // 📝 Input API Key untuk pendaftaran
        if (session.awaiting === 'api_key') {
            await this.processRegistration(chatId, userId, text);
            return;
        }

        // 📱 Input target untuk pembelian
        if (session.awaiting === 'target_number') {
            await this.processTargetInput(chatId, userId, text);
            return;
        }

        // 🏦 Input cek rekening
        if (session.awaiting === 'cek_rekening') {
            await this.processCekRekeningInput(chatId, userId, text);
            return;
        }

        // 🔄 Input ganti API key
        if (session.awaiting === 'new_api_key') {
            await this.processGantiApiKey(chatId, userId, text);
            return;
        }

        // Default: unknown command
        await bot.sendMessage(chatId, 
            `${EMOJI.warning} Perintah tidak dikenal. Silakan gunakan tombol menu.`, {
            reply_markup: UI.Keyboards.backToMenu()
        });
    }

    // 🎯 Handle Callback Queries
    async handleCallback(query) {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;
        const messageId = query.message.message_id;

        // Answer callback untuk hapus loading
        await bot.answerCallbackQuery(query.id);

        const user = db.getUser(userId);

        // 📝 Start Registration
        if (data === 'register_start') {
            await this.promptApiKey(chatId, userId, messageId);
            return;
        }

        // 🧭 Navigation
        if (data === 'nav_main') {
            await this.showMainMenu(chatId, userId);
            return;
        }

        if (data === 'nav_back') {
            await this.showMainMenu(chatId, userId);
            return;
        }

        // Cek login untuk fitur lain
        if (!user || !user.isRegistered) {
            await bot.editMessageText(
                `${EMOJI.error} *AKSES DITOLAK*\n\nAnda harus mendaftar terlebih dahulu.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[
                        { text: `${EMOJI.enter} DAFTAR SEKARANG`, callback_data: 'register_start' }
                    ]] }
                }
            );
            return;
        }

        // 📂 Category Selection
        if (data.startsWith('cat_')) {
            const category = data.replace('cat_', '');
            await this.showCategoryProducts(chatId, userId, category, messageId);
            return;
        }

        // 📄 Page Navigation
        if (data.startsWith('page_')) {
            const parts = data.split('_');
            const category = parts[1];
            const page = parseInt(parts[2]);
            await this.showCategoryProducts(chatId, userId, category, messageId, page);
            return;
        }

        // 🛒 Buy Product
        if (data.startsWith('buy_')) {
            const code = data.replace('buy_', '');
            await this.promptTargetNumber(chatId, userId, code, messageId);
            return;
        }

        // ✅ Confirm Transaction
        if (data.startsWith('confirm_')) {
            const reffId = data.replace('confirm_', '');
            await this.processTransaction(chatId, userId, reffId, messageId);
            return;
        }

        // ❌ Cancel Transaction
        if (data.startsWith('cancel_')) {
            await this.cancelTransaction(chatId, userId, messageId);
            return;
        }

        // 🔄 Check Status
        if (data.startsWith('status_')) {
            const trxId = data.replace('status_', '');
            await this.checkTransactionStatus(chatId, userId, trxId, messageId);
            return;
        }

        // 💰 Menu: Balance
        if (data === 'menu_balance') {
            await this.showBalance(chatId, userId, messageId);
            return;
        }

        // 📜 Menu: History
        if (data === 'menu_history') {
            await this.showHistory(chatId, userId, messageId);
            return;
        }

        // 🏦 Menu: Cek Rekening
        if (data === 'menu_cekrek') {
            await this.showCekRekeningMenu(chatId, userId, messageId);
            return;
        }

        // 🏦 Bank Selected
        if (data.startsWith('bank_')) {
            const bank = data.replace('bank_', '');
            await this.promptBankNumber(chatId, userId, bank, messageId);
            return;
        }

        // ⚙️ Menu: Settings
        if (data === 'menu_settings') {
            await this.showSettings(chatId, userId, messageId);
            return;
        }

        // ⚙️ Ganti API Key
        if (data === 'set_apikey') {
            await this.promptGantiApiKey(chatId, userId, messageId);
            return;
        }

        // ⚙️ Show Profile
        if (data === 'set_profile') {
            await this.showProfile(chatId, userId, messageId);
            return;
        }

        // 🔄 Refresh Data
        if (data === 'set_refresh') {
            await this.refreshData(chatId, userId, messageId);
            return;
        }
    }

    // 📝 Prompt API Key
    async promptApiKey(chatId, userId, messageId) {
        db.setSession(userId, { awaiting: 'api_key' });

        const text = 
            `${UI.header('INPUT API KEY')}\n\n` +
            `${EMOJI.key} Silakan masukkan API Key Atlantic Anda:\n\n` +
            `${EMOJI.info} *Contoh format:*\n` +
            `\`UbRba33Sh4A0sbAJ1MNnO2NU8gwMFut1...\`\n\n` +
            `${EMOJI.warning} *Catatan:*\n` +
            `• API Key bersifat rahasia\n` +
            `• Jangan bagikan API Key ke siapapun\n` +
            `• Bot akan memverifikasi otomatis`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // ✅ Process Registration
    async processRegistration(chatId, userId, apiKey) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Memverifikasi API Key', 2500);

        try {
            const api = new AtlanticAPI(apiKey);
            const profile = await api.getProfile();

            // Debug log
            console.log('Profile response:', JSON.stringify(profile, null, 2));

            // Cek berbagai kemungkinan response structure
            const isSuccess = profile.status === true || 
                             profile.status === 'true' || 
                             profile.status === 1 ||
                             profile.data !== undefined;

            if (isSuccess && profile.data) {
                // Simpan user
                const userData = {
                    isRegistered: true,
                    apiKey: apiKey,
                    registeredAt: new Date().toISOString(),
                    profile: profile.data,
                    name: profile.data.name || profile.data.username || 'User',
                    username: profile.data.username || 'Unknown'
                };

                db.setUser(userId, userData);
                db.clearSession(userId);

                // 🎉 Notifikasi Admin
                await this.notifyAdmin(userId, userData, apiKey);

                // Hapus loading
                await bot.deleteMessage(chatId, loadingMsg.message_id);

                // 🎊 Success Message
                const successText = 
                    `${UI.header('PENDAFTARAN BERHASIL', `${EMOJI.party} Selamat!`)}\n\n` +
                    `${UI.box('DATA AKUN',
                        `${EMOJI.user} Nama: ${profile.data.name || '-'}\n` +
                        `${EMOJI.user} Username: ${profile.data.username || '-'}\n` +
                        `${EMOJI.mail} Email: ${profile.data.email || '-'}\n` +
                        `${EMOJI.phone2} Telepon: ${profile.data.phone || '-'}\n` +
                        `${EMOJI.wallet} Saldo: ${Helpers.formatPrice(profile.data.balance || 0)}\n` +
                        `${EMOJI.check} Status: ${profile.data.status?.toUpperCase() || 'AKTIF'}`
                    )}\n\n` +
                    `${EMOJI.rocket} Anda sekarang dapat menggunakan semua layanan!`;

                await MessageCleaner.trackMessage(
                    bot, chatId, userId,
                    bot.sendMessage(chatId, successText, {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: [[
                            { text: `${EMOJI.enter} MULAI BERTRANSAKSI`, callback_data: 'nav_main' }
                        ]] }
                    })
                );

            } else {
                throw new Error(profile.message || 'Invalid API Key structure');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
            console.error('Registration error:', error);
            
            const errorText = 
                `${UI.header('VERIFIKASI GAGAL', `${EMOJI.error} Oops!`)}\n\n` +
                `${EMOJI.error} *API Key tidak valid*\n\n` +
                `${EMOJI.info} *Detail Error:*\n` +
                `\`${Helpers.escapeMarkdown(error.message)}\`\n\n` +
                `${EMOJI.warning} *Mungkin penyebabnya:*\n` +
                `• API Key salah atau expired\n` +
                `• Format API Key tidak benar\n` +
                `• Koneksi ke server bermasalah\n\n` +
                `${EMOJI.bulb} *Silakan coba lagi*`;

            await bot.sendMessage(chatId, errorText, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[
                    { text: `${EMOJI.refresh} COBA LAGI`, callback_data: 'register_start' },
                    { text: `${EMOJI.globe} Dapatkan API Key`, url: 'https://atlantich2h.com' }
                ]] }
            });
        }
    }

    // 🔔 Notify Admin
    async notifyAdmin(userId, userData, apiKey) {
        try {
            const notifText = 
                `${EMOJI.new} *PENGGUNA BARU TERDAFTAR* ${EMOJI.new}\n\n` +
                `${UI.box('INFORMASI USER',
                    `${EMOJI.user} Nama: ${userData.name}\n` +
                    `${EMOJI.user} Username: @${userData.username}\n` +
                    `${EMOJI.lock} User ID: ${userId}\n` +
                    `${EMOJI.time} Waktu: ${Helpers.formatDate(new Date())}`
                )}\n\n` +
                `${UI.box('DATA PROFILE',
                    `${EMOJI.user} Nama Lengkap: ${userData.profile.name || '-'}\n` +
                    `${EMOJI.mail} Email: ${userData.profile.email || '-'}\n` +
                    `${EMOJI.phone2} No HP: ${userData.profile.phone || '-'}\n` +
                    `${EMOJI.wallet} Saldo: ${Helpers.formatPrice(userData.profile.balance || 0)}\n` +
                    `${EMOJI.check} Status: ${userData.profile.status?.toUpperCase() || '-'}`
                )}\n\n` +
                `${EMOJI.key} API Key: \`${Helpers.maskString(apiKey)}\`\n` +
                `${EMOJI.link} Deep Link: tg://user?id=${userId}`;

            await bot.sendMessage(CONFIG.ADMIN_ID, notifText, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error('Failed to notify admin:', e);
        }
    }

    // 📦 Show Category Products
    async showCategoryProducts(chatId, userId, category, messageId, page = 0) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, `Memuat produk ${category}`, 2000);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const priceList = await api.getPriceList();

            await bot.deleteMessage(chatId, loadingMsg.message_id);

            if (!priceList.status || !Array.isArray(priceList.data)) {
                throw new Error('Invalid price list data');
            }

            // Filter produk by category
            const products = priceList.data.filter(p => 
                p.category?.toUpperCase() === category.toUpperCase() &&
                p.status?.toLowerCase() === 'available'
            );

            if (products.length === 0) {
                const emptyText = 
                    `${UI.header('PRODUK TIDAK TERSEDIA')}\n\n` +
                    `${EMOJI.warning} Tidak ada produk ${category} yang tersedia saat ini.\n\n` +
                    `${EMOJI.info} Silakan cek kategori lain.`;

                await bot.editMessageText(emptyText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
                return;
            }

            // Pagination
            const itemsPerPage = 8;
            const totalPages = Math.ceil(products.length / itemsPerPage);
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageProducts = products.slice(start, end);

            // Build product buttons (2 per row)
            const buttons = [];
            for (let i = 0; i < pageProducts.length; i += 2) {
                const row = [];
                const p1 = pageProducts[i];
                
                row.push({
                    text: `${UI.categoryIcon(p1.category)} ${p1.name.substring(0, 15)}${p1.name.length > 15 ? '..' : ''}\n${Helpers.formatPrice(p1.price)}`,
                    callback_data: `buy_${p1.code}`
                });

                if (pageProducts[i + 1]) {
                    const p2 = pageProducts[i + 1];
                    row.push({
                        text: `${UI.categoryIcon(p2.category)} ${p2.name.substring(0, 15)}${p2.name.length > 15 ? '..' : ''}\n${Helpers.formatPrice(p2.price)}`,
                        callback_data: `buy_${p2.code}`
                    });
                }
                buttons.push(row);
            }

            // Add navigation
            const navRow = [];
            if (page > 0) navRow.push({ text: `${EMOJI.previous} Prev`, callback_data: `page_${category}_${page-1}` });
            navRow.push({ text: `${page+1}/${totalPages}`, callback_data: 'noop' });
            if (page < totalPages - 1) navRow.push({ text: `Next ${EMOJI.next}`, callback_data: `page_${category}_${page+1}` });
            buttons.push(navRow);
            buttons.push([{ text: `${EMOJI.back} Kembali ke Menu`, callback_data: 'nav_main' }]);

            const headerText = 
                `${UI.categoryIcon(category)} *${category.toUpperCase()}* ${UI.categoryIcon(category)}\n\n` +
                `${EMOJI.shop} *Total Produk:* ${products.length}\n` +
                `${EMOJI.info} *Halaman:* ${page + 1} dari ${totalPages}\n\n` +
                `${EMOJI.arrow} Pilih produk di bawah ini:`;

            await bot.editMessageText(headerText, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            console.error('Error loading products:', error);
            
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Gagal memuat produk. Silakan coba lagi.`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📱 Prompt Target Number
    async promptTargetNumber(chatId, userId, code, messageId) {
        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const priceList = await api.getPriceList();
            const product = priceList.data.find(p => p.code === code);

            if (!product) {
                throw new Error('Produk tidak ditemukan');
            }

            // Simpan session
            db.setSession(userId, {
                awaiting: 'target_number',
                orderData: {
                    code: product.code,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    note: product.note,
                    reffId: Helpers.generateRefId()
                }
            });

            const text = 
                `${UI.header('INPUT NOMOR TUJUAN')}\n\n` +
                `${UI.box('DETAIL PRODUK',
                    `${UI.categoryIcon(product.category)} ${product.name}\n` +
                    `${EMOJI.money} Harga: ${Helpers.formatPrice(product.price)}\n` +
                    `${EMOJI.info} Catatan: ${product.note || '-'}\n` +
                    `${EMOJI.lock} Kode: ${product.code}`
                )}\n\n` +
                `${EMOJI.phone} *Masukkan nomor tujuan:*\n` +
                `${EMOJI.arrow} Contoh: 08123456789\n` +
                `${EMOJI.arrow} atau ID Pelanggan: 123456789012\n\n` +
                `${EMOJI.warning} *Pastikan nomor sudah benar!*`;

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backOnly()
            });

        } catch (error) {
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Gagal memuat produk: ${error.message}`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 📝 Process Target Input
    async processTargetInput(chatId, userId, target) {
        const session = db.getSession(userId);
        const order = session.orderData;

        if (!order) {
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Sesi habis. Silakan mulai ulang.`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
            return;
        }

        // Validasi nomor
        const cleanTarget = target.replace(/\s+/g, '').replace(/[-]/g, '');
        if (cleanTarget.length < 5) {
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Nomor terlalu pendek! Minimal 5 digit.\n${EMOJI.arrow} Silakan masukkan lagi:`,
                { reply_markup: UI.Keyboards.backOnly() }
            );
            return;
        }

        // Update session
        db.setSession(userId, {
            awaiting: 'confirm_order',
            orderData: { ...order, target: cleanTarget }
        });

        const confirmText = 
            `${UI.header('KONFIRMASI PESANAN')}\n\n` +
            `${UI.box('RINGKASAN PEMBELIAN',
                `${EMOJI.star} Produk: ${order.name}\n` +
                `${EMOJI.money} Harga: ${Helpers.formatPrice(order.price)}\n` +
                `${EMOJI.phone} Tujuan: ${cleanTarget}\n` +
                `${EMOJI.lock} Ref ID: ${order.reffId}\n` +
                `${EMOJI.time} Waktu: ${Helpers.formatDate(new Date())}`
            )}\n\n` +
            `${EMOJI.warning} *Apakah data sudah benar?*\n` +
            `${EMOJI.info} Tekan *YA* untuk melanjutkan pembayaran`;

        await MessageCleaner.trackMessage(
            bot, chatId, userId,
            bot.sendMessage(chatId, confirmText, {
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.confirmTransaction(order.reffId)
            })
        );
    }

    // ⚡ Process Transaction
    async processTransaction(chatId, userId, reffId, messageId) {
        const session = db.getSession(userId);
        const order = session.orderData;

        if (!order || order.reffId !== reffId) {
            await bot.editMessageText(
                `${EMOJI.error} *SESI TIDAK VALID*\n\nPesanan tidak ditemukan atau sudah expired.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                }
            );
            return;
        }

        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Memproses transaksi', 3000);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            
            const result = await api.createTransaction(
                order.code,
                order.reffId,
                order.target,
                order.price
            );

            await bot.deleteMessage(chatId, loadingMsg.message_id);
            db.clearSession(userId);

            if (result.status) {
                // Simpan transaksi
                db.addTransaction({
                    userId: userId.toString(),
                    reffId: order.reffId,
                    trxId: result.data.id,
                    product: order.name,
                    target: order.target,
                    price: order.price,
                    status: result.data.status
                });

                const successText = 
                    `${UI.header('TRANSAKSI BERHASIL', `${EMOJI.party} Yeay!`)}\n\n` +
                    `${UI.box('DETAIL TRANSAKSI',
                        `${EMOJI.lock} ID: ${result.data.id}\n` +
                        `${EMOJI.lock} Ref: ${result.data.reff_id}\n` +
                        `${EMOJI.star} Layanan: ${result.data.layanan}\n` +
                        `${EMOJI.phone} Target: ${result.data.target}\n` +
                        `${EMOJI.money} Harga: ${Helpers.formatPrice(result.data.price)}\n` +
                        `${EMOJI.time} Status: ${UI.statusBadge(result.data.status)}\n` +
                        `${EMOJI.time} Waktu: ${result.data.created_at}`
                    )}\n\n` +
                    `${EMOJI.info} Transaksi sedang diproses oleh provider.\n` +
                    `${EMOJI.time} SN/Token akan muncul setelah status sukses.`;

                await MessageCleaner.trackMessage(
                    bot, chatId, userId,
                    bot.sendMessage(chatId, successText, {
                        parse_mode: 'Markdown',
                        reply_markup: UI.Keyboards.checkStatus(result.data.id)
                    })
                );

                // Update saldo
                const profile = await api.getProfile();
                if (profile.status === true || profile.status === 'true') {
                    db.setUser(userId, { profile: profile.data });
                }

            } else {
                throw new Error(result.message || 'Transaksi gagal');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
            const errorText = 
                `${UI.header('TRANSAKSI GAGAL', `${EMOJI.error} Maaf!`)}\n\n` +
                `${EMOJI.error} *Error:* ${Helpers.escapeMarkdown(error.message)}\n\n` +
                `${EMOJI.info} Saldo Anda tidak terpotong.\n` +
                `${EMOJI.arrow} Silakan coba lagi nanti.`;

            await bot.sendMessage(chatId, errorText, {
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backToMenu()
            });
        }
    }

    // ❌ Cancel Transaction
    async cancelTransaction(chatId, userId, messageId) {
        db.clearSession(userId);
        
        await bot.editMessageText(
            `${UI.header('DIBATALKAN')}\n\n${EMOJI.cancel} Transaksi telah dibatalkan.`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backToMenu()
            }
        );
    }

    // 🔄 Check Transaction Status
    async checkTransactionStatus(chatId, userId, trxId, messageId) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Mengecek status terbaru', 2000);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.checkStatus(trxId);

            await bot.deleteMessage(chatId, loadingMsg.message_id);

            if (result.status && result.data) {
                const data = result.data;
                
                const statusText = 
                    `${UI.header('STATUS TRANSAKSI', `${EMOJI.search} Update Terbaru`)}\n\n` +
                    `${UI.box('INFORMASI',
                        `${EMOJI.lock} ID: ${data.id}\n` +
                        `${EMOJI.lock} Ref: ${data.reff_id}\n` +
                        `${EMOJI.star} Layanan: ${data.layanan}\n` +
                        `${EMOJI.phone} Target: ${data.target}\n` +
                        `${EMOJI.money} Harga: ${Helpers.formatPrice(data.price)}\n` +
                        `${EMOJI.zap} SN/Token: ${data.sn || 'Belum tersedia'}\n` +
                        `${EMOJI.time} Status: ${UI.statusBadge(data.status)}\n` +
                        `${EMOJI.time} Dibuat: ${data.created_at}`
                    )}`;

                await bot.editMessageText(statusText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.checkStatus(trxId)
                });
            } else {
                throw new Error('Data tidak ditemukan');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Gagal cek status: ${error.message}`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 💰 Show Balance
    async showBalance(chatId, userId, messageId) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Memuat informasi saldo', 1500);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const profile = await api.getProfile();

            await bot.deleteMessage(chatId, loadingMsg.message_id);

            if (profile.status === true || profile.status === 'true') {
                db.setUser(userId, { profile: profile.data });

                const balanceText = 
                    `${UI.header('INFORMASI SALDO', `${EMOJI.wallet} Profile Anda`)}\n\n` +
                    `${UI.box('DATA AKUN',
                        `${EMOJI.user} Nama: ${profile.data.name || '-'}\n` +
                        `${EMOJI.user} Username: ${profile.data.username || '-'}\n` +
                        `${EMOJI.mail} Email: ${profile.data.email || '-'}\n` +
                        `${EMOJI.phone2} Telepon: ${profile.data.phone || '-'}\n` +
                        `${EMOJI.money} Saldo: ${Helpers.formatPrice(profile.data.balance || 0)}\n` +
                        `${EMOJI.check} Status: ${profile.data.status?.toUpperCase() || 'AKTIF'}`
                    )}\n\n` +
                    `${EMOJI.info} Data diperbarui: ${Helpers.formatDate(new Date())}`;

                await bot.editMessageText(balanceText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            } else {
                throw new Error('Gagal memuat profile');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await bot.editMessageText(
                `${EMOJI.error} Gagal memuat saldo. Coba lagi nanti.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: UI.Keyboards.backToMenu()
                }
            );
        }
    }

    // 📜 Show History
    async showHistory(chatId, userId, messageId) {
        const transactions = db.getUserTransactions(userId, 10);

        let historyText = `${UI.header('RIWAYAT TRANSAKSI', `${EMOJI.history} 10 Terakhir`)}\n\n`;

        if (transactions.length === 0) {
            historyText += `${EMOJI.info} Belum ada riwayat transaksi.`;
        } else {
            transactions.forEach((trx, index) => {
                const icon = trx.status === 'success' ? EMOJI.success : 
                            trx.status === 'pending' ? EMOJI.pending : EMOJI.failed;
                
                historyText += 
                    `${index + 1}. ${icon} *${Helpers.escapeMarkdown(trx.product)}*\n` +
                    `   ├ ${EMOJI.phone} ${trx.target}\n` +
                    `   ├ ${EMOJI.money} ${Helpers.formatPrice(trx.price)}\n` +
                    `   ├ ${EMOJI.time} ${UI.statusBadge(trx.status)}\n` +
                    `   └ ${EMOJI.lock} \`${trx.trxId}\`\n\n`;
            });
        }

        await bot.editMessageText(historyText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backToMenu()
        });
    }

    // 🏦 Show Cek Rekening Menu
    async showCekRekeningMenu(chatId, userId, messageId) {
        const text = 
            `${UI.header('CEK REKENING', `${EMOJI.bank} Validasi Akun`)}\n\n` +
            `${EMOJI.info} Pilih bank/e-wallet yang ingin dicek:\n\n` +
            `${EMOJI.warning} *Format hasil:*\n` +
            `• Nama pemilik rekening\n` +
            `• Status valid/invalid`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.bankList()
        });
    }

    // 🏦 Prompt Bank Number
    async promptBankNumber(chatId, userId, bank, messageId) {
        db.setSession(userId, { 
            awaiting: 'cek_rekening',
            bankData: { bankCode: bank }
        });

        const bankNames = {
            'dana': 'DANA',
            'ovo': 'OVO',
            'gopay': 'GoPay',
            'shopeepay': 'ShopeePay',
            'linkaja': 'LinkAja',
            'seabank': 'SeaBank',
            'bca': 'BCA',
            'bni': 'BNI',
            'bri': 'BRI',
            'mandiri': 'Mandiri',
            'bsi': 'BSI',
            'other': 'Bank Lain'
        };

        const text = 
            `${UI.header('INPUT NOMOR REKENING')}\n\n` +
            `${EMOJI.bank} Bank: *${bankNames[bank] || bank.toUpperCase()}*\n\n` +
            `${EMOJI.phone} Masukkan nomor rekening/telepon:\n` +
            `${EMOJI.arrow} Contoh: 08123456789 atau 1234567890\n\n` +
            `${EMOJI.info} Untuk bank lain, ketik: [kode_bank] [nomor]\n` +
            `Contoh: bca 1234567890`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // 🏦 Process Cek Rekening Input
    async processCekRekeningInput(chatId, userId, text) {
        const session = db.getSession(userId);
        let bankCode = session.bankData?.bankCode;
        let accountNumber = text.replace(/\s+/g, '').replace(/[-]/g, '');

        // Jika format "kode nomor"
        if (!bankCode && text.includes(' ')) {
            const parts = text.split(' ');
            bankCode = parts[0].toLowerCase();
            accountNumber = parts.slice(1).join('').replace(/\s+/g, '');
        }

        if (!bankCode) {
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Bank tidak dikenali. Silakan pilih ulang.`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
            return;
        }

        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Memvalidasi rekening', 2000);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const result = await api.cekRekening(bankCode, accountNumber);

            await bot.deleteMessage(chatId, loadingMsg.message_id);
            db.clearSession(userId);

            if (result.status && result.data) {
                const validText = 
                    `${UI.header('REKENING VALID', `${EMOJI.success} Terverifikasi!`)}\n\n` +
                    `${UI.box('DETAIL REKENING',
                        `${EMOJI.bank} Bank: ${result.data.kode_bank?.toUpperCase()}\n` +
                        `${EMOJI.lock} No Rekening: ${result.data.nomor_akun}\n` +
                        `${EMOJI.user} Nama: ${result.data.nama_pemilik}\n` +
                        `${EMOJI.check} Status: ${result.data.status?.toUpperCase()}`
                    )}`;

                await bot.sendMessage(chatId, validText, {
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            } else {
                throw new Error(result.message || 'Rekening tidak valid');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
            const errorText = 
                `${UI.header('REKENING TIDAK DITEMUKAN')}\n\n` +
                `${EMOJI.error} *Error:* ${Helpers.escapeMarkdown(error.message)}\n\n` +
                `${EMOJI.warning} Pastikan:\n` +
                `• Kode bank benar\n` +
                `• Nomor rekening valid\n` +
                `• Akun aktif`;

            await bot.sendMessage(chatId, errorText, {
                parse_mode: 'Markdown',
                reply_markup: UI.Keyboards.backToMenu()
            });
        }
    }

    // ⚙️ Show Settings
    async showSettings(chatId, userId, messageId) {
        const text = 
            `${UI.header('PENGATURAN', `${EMOJI.settings} Konfigurasi`)}\n\n` +
            `${EMOJI.info} Pilih opsi pengaturan:`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.settings()
        });
    }

    // 📝 Prompt Ganti API Key
    async promptGantiApiKey(chatId, userId, messageId) {
        db.setSession(userId, { awaiting: 'new_api_key' });

        const text = 
            `${UI.header('GANTI API KEY')}\n\n` +
            `${EMOJI.warning} *PERINGATAN:*\n` +
            `Mengganti API Key akan mengganti akun Atlantic yang terhubung.\n\n` +
            `${EMOJI.key} Masukkan API Key baru:`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backOnly()
        });
    }

    // 🔄 Process Ganti API Key
    async processGantiApiKey(chatId, userId, newApiKey) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Verifikasi API Key baru', 2000);

        try {
            const api = new AtlanticAPI(newApiKey);
            const profile = await api.getProfile();

            await bot.deleteMessage(chatId, loadingMsg.message_id);

            if (profile.status === true || profile.status === 'true') {
                db.setUser(userId, {
                    apiKey: newApiKey,
                    profile: profile.data,
                    name: profile.data.name || profile.data.username
                });
                db.clearSession(userId);

                const successText = 
                    `${UI.header('BERHASIL DIGANTI')}\n\n` +
                    `${EMOJI.success} API Key berhasil diperbarui!\n\n` +
                    `${UI.box('DATA BARU',
                        `${EMOJI.user} Nama: ${profile.data.name}\n` +
                        `${EMOJI.wallet} Saldo: ${Helpers.formatPrice(profile.data.balance || 0)}`
                    )}`;

                await bot.sendMessage(chatId, successText, {
                    parse_mode: 'Markdown',
                    reply_markup: UI.Keyboards.backToMenu()
                });
            } else {
                throw new Error('Invalid API Key');
            }

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await bot.sendMessage(chatId, 
                `${EMOJI.error} API Key tidak valid.`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }

    // 👤 Show Profile
    async showProfile(chatId, userId, messageId) {
        const user = db.getUser(userId);
        
        const text = 
            `${UI.header('PROFILE ANDA')}\n\n` +
            `${UI.box('INFORMASI',
                `${EMOJI.user} Nama: ${user.profile?.name || '-'}\n` +
                `${EMOJI.user} Username: ${user.profile?.username || '-'}\n` +
                `${EMOJI.mail} Email: ${user.profile?.email || '-'}\n` +
                `${EMOJI.phone2} Telepon: ${user.profile?.phone || '-'}\n` +
                `${EMOJI.calendar} Terdaftar: ${Helpers.formatDate(user.registeredAt)}\n` +
                `${EMOJI.money} Saldo: ${Helpers.formatPrice(user.profile?.balance || 0)}`
            )}`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: UI.Keyboards.backToMenu()
        });
    }

    // 🔄 Refresh Data
    async refreshData(chatId, userId, messageId) {
        const loadingMsg = await Helpers.animateLoading(bot, chatId, 'Menyegarkan data', 1500);

        try {
            const user = db.getUser(userId);
            const api = new AtlanticAPI(user.apiKey);
            const profile = await api.getProfile();

            if (profile.status === true || profile.status === 'true') {
                db.setUser(userId, { profile: profile.data });
            }

            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.showMainMenu(chatId, userId);

        } catch (error) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            await bot.sendMessage(chatId, 
                `${EMOJI.error} Gagal refresh data.`,
                { reply_markup: UI.Keyboards.backToMenu() }
            );
        }
    }
}

// 🚀 Initialize Bot
const atlanticBot = new AtlanticBot();

// 📊 Graceful Shutdown
process.on('SIGINT', () => {
    console.log('👋 Bot shutting down...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('👋 Bot shutting down...');
    bot.stopPolling();
    process.exit(0);
});
