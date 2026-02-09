// ==========================================
// Box 73 - Sistema de Indicação
// Main Application Logic
// ==========================================

// ==========================================
// State Management
// ==========================================
let currentUser = null;
let currentScreen = 'landing-page';
let ambassadors = [];
let referrals = [];
let settings = {
    discount: CONFIG.DEFAULT_DISCOUNT,
    whatsappMessage: CONFIG.DEFAULT_WHATSAPP_MESSAGE
};

// ==========================================
// Mock Data (for testing without Google Sheets)
// ==========================================
const MOCK_DATA = {
    ambassadors: [
        {
            id: 1,
            nome: 'João Silva',
            email: 'joao@example.com',
            telefone: '(11) 98765-4321',
            codigo: 'JOAO73',
            data_cadastro: new Date().toISOString()
        },
        {
            id: 2,
            nome: 'Maria Santos',
            email: 'maria@example.com',
            telefone: '(11) 99876-5432',
            codigo: 'MARIA73',
            data_cadastro: new Date().toISOString()
        }
    ],
    referrals: [
        {
            id: 1,
            codigo_usado: 'JOAO73',
            nome_indicado: 'Pedro Costa',
            telefone_indicado: '(11) 91234-5678',
            data_indicacao: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'Usado',
            valor_desconto: 10,
            data_uso: new Date(Date.now() - 86400000 * 2).toISOString(),
            observacoes: 'Revisão completa'
        },
        {
            id: 2,
            codigo_usado: 'JOAO73',
            nome_indicado: 'Ana Paula',
            telefone_indicado: '(11) 98888-7777',
            data_indicacao: new Date(Date.now() - 86400000).toISOString(),
            status: 'Validado',
            valor_desconto: 10,
            data_uso: new Date(Date.now() - 86400000).toISOString(),
            observacoes: ''
        },
        {
            id: 3,
            codigo_usado: 'MARIA73',
            nome_indicado: 'Carlos Mendes',
            telefone_indicado: '(11) 97777-6666',
            data_indicacao: new Date().toISOString(),
            status: 'Usado',
            valor_desconto: 10,
            data_uso: new Date().toISOString(),
            observacoes: 'Troca de óleo'
        }
    ]
};

// ==========================================
// Google Sheets Integration
// ==========================================
class SheetsAPI {
    constructor() {
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        this.apiKey = CONFIG.GOOGLE_API_KEY;
        this.spreadsheetId = CONFIG.SPREADSHEET_ID;
    }

    async getRange(sheetName, range) {
        if (CONFIG.USE_MOCK_DATA) {
            return this.getMockData(sheetName);
        }

        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!${range}?key=${this.apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Error fetching from Sheets:', error);
            showToast('Erro ao carregar dados. Usando dados de exemplo.', 'error');
            return this.getMockData(sheetName);
        }
    }

    async appendRow(sheetName, values) {
        if (CONFIG.USE_MOCK_DATA) {
            return this.appendMockData(sheetName, values);
        }

        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW&key=${this.apiKey}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: [values] })
            });
            if (!response.ok) throw new Error('Failed to append data');
            return await response.json();
        } catch (error) {
            console.error('Error appending to Sheets:', error);
            return this.appendMockData(sheetName, values);
        }
    }

    async updateRow(sheetName, row, values) {
        if (CONFIG.USE_MOCK_DATA) {
            return this.updateMockData(sheetName, row, values);
        }

        const range = `${sheetName}!A${row}:Z${row}`;
        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW&key=${this.apiKey}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: [values] })
            });
            if (!response.ok) throw new Error('Failed to update data');
            return await response.json();
        } catch (error) {
            console.error('Error updating Sheets:', error);
            return this.updateMockData(sheetName, row, values);
        }
    }

    getMockData(sheetName) {
        if (sheetName === CONFIG.SHEET_EMBAIXADORES) {
            return [
                ['ID', 'Nome', 'Email', 'Telefone', 'Codigo', 'Data_Cadastro'],
                ...MOCK_DATA.ambassadors.map(a => [
                    a.id, a.nome, a.email, a.telefone, a.codigo, a.data_cadastro
                ])
            ];
        } else if (sheetName === CONFIG.SHEET_INDICACOES) {
            return [
                ['ID', 'Codigo_Usado', 'Nome_Indicado', 'Telefone_Indicado', 'Data_Indicacao', 'Status', 'Valor_Desconto', 'Data_Uso', 'Observacoes'],
                ...MOCK_DATA.referrals.map(r => [
                    r.id, r.codigo_usado, r.nome_indicado, r.telefone_indicado,
                    r.data_indicacao, r.status, r.valor_desconto, r.data_uso, r.observacoes
                ])
            ];
        } else if (sheetName === CONFIG.SHEET_CONFIGURACOES) {
            return [
                ['Chave', 'Valor'],
                ['desconto_percentual', CONFIG.DEFAULT_DISCOUNT],
                ['mensagem_whatsapp', CONFIG.DEFAULT_WHATSAPP_MESSAGE]
            ];
        }
        return [];
    }

    appendMockData(sheetName, values) {
        console.log('Mock append to', sheetName, ':', values);
        if (sheetName === CONFIG.SHEET_EMBAIXADORES) {
            const newId = MOCK_DATA.ambassadors.length + 1;
            MOCK_DATA.ambassadors.push({
                id: newId,
                nome: values[1],
                email: values[2],
                telefone: values[3],
                codigo: values[4],
                data_cadastro: values[5]
            });
        } else if (sheetName === CONFIG.SHEET_INDICACOES) {
            const newId = MOCK_DATA.referrals.length + 1;
            MOCK_DATA.referrals.push({
                id: newId,
                codigo_usado: values[1],
                nome_indicado: values[2],
                telefone_indicado: values[3],
                data_indicacao: values[4],
                status: values[5],
                valor_desconto: values[6],
                data_uso: values[7],
                observacoes: values[8]
            });
        }
        return { success: true };
    }

    updateMockData(sheetName, row, values) {
        console.log('Mock update', sheetName, 'row', row, ':', values);
        // For mock data, we'll just log the update
        return { success: true };
    }
}

const sheets = new SheetsAPI();

// ==========================================
// Data Loading & Processing
// ==========================================
async function loadData() {
    showLoading(true);
    try {
        // Load ambassadors
        const ambassadorData = await sheets.getRange(CONFIG.SHEET_EMBAIXADORES, 'A:F');
        ambassadors = ambassadorData.slice(1).map(row => ({
            id: row[0],
            nome: row[1],
            email: row[2],
            telefone: row[3],
            codigo: row[4],
            data_cadastro: row[5]
        }));

        // Load referrals
        const referralData = await sheets.getRange(CONFIG.SHEET_INDICACOES, 'A:I');
        referrals = referralData.slice(1).map(row => ({
            id: row[0],
            codigo_usado: row[1],
            nome_indicado: row[2],
            telefone_indicado: row[3],
            data_indicacao: row[4],
            status: row[5],
            valor_desconto: row[6],
            data_uso: row[7],
            observacoes: row[8]
        }));

        // Load settings
        const settingsData = await sheets.getRange(CONFIG.SHEET_CONFIGURACOES, 'A:B');
        settingsData.slice(1).forEach(row => {
            if (row[0] === 'desconto_percentual') {
                settings.discount = parseInt(row[1]) || CONFIG.DEFAULT_DISCOUNT;
            } else if (row[0] === 'mensagem_whatsapp') {
                settings.whatsappMessage = row[1] || CONFIG.DEFAULT_WHATSAPP_MESSAGE;
            }
        });

        console.log('Data loaded:', { ambassadors, referrals, settings });
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Erro ao carregar dados', 'error');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// Code Generation
// ==========================================
function generateCode(name) {
    // Generate unique code based on name + 73 + random number
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 10);

    let code = cleanName + '73';

    // Check if code exists, add number if needed
    let counter = 1;
    while (ambassadors.some(a => a.codigo === code)) {
        code = cleanName + '73' + counter;
        counter++;
    }

    return code;
}

// ==========================================
// Authentication & User Management
// ==========================================
async function login(emailOrPhone) {
    await loadData();

    const user = ambassadors.find(a =>
        a.email === emailOrPhone || a.telefone === emailOrPhone
    );

    if (user) {
        currentUser = user;
        saveUserSession();
        goToScreen('embaixador-dashboard');
        loadDashboard();
        showToast('Login realizado com sucesso!', 'success');
        return true;
    } else {
        showToast('Usuário não encontrado', 'error');
        return false;
    }
}

async function register(name, email, phone) {
    await loadData();

    // Check if user already exists
    if (ambassadors.some(a => a.email === email || a.telefone === phone)) {
        showToast('Email ou telefone já cadastrado', 'error');
        return false;
    }

    const newId = ambassadors.length + 1;
    const code = generateCode(name);
    const now = new Date().toISOString();

    // Add to sheet
    await sheets.appendRow(CONFIG.SHEET_EMBAIXADORES, [
        newId, name, email, phone, code, now
    ]);

    // Update local data
    const newUser = { id: newId, nome: name, email, telefone: phone, codigo: code, data_cadastro: now };
    ambassadors.push(newUser);
    currentUser = newUser;

    saveUserSession();
    goToScreen('embaixador-dashboard');
    loadDashboard();
    showToast('Cadastro realizado com sucesso!', 'success');
    return true;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('box73_user');
    goToScreen('landing-page');
    showToast('Logout realizado', 'success');
}

function saveUserSession() {
    if (currentUser) {
        localStorage.setItem('box73_user', JSON.stringify(currentUser));
    }
}

function loadUserSession() {
    const savedUser = localStorage.getItem('box73_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        goToScreen('embaixador-dashboard');
        loadDashboard();
    }
}

// ==========================================
// Dashboard
// ==========================================
async function loadDashboard() {
    if (!currentUser) return;

    await loadData();

    // Update user info
    document.getElementById('user-name').textContent = currentUser.nome.split(' ')[0];
    document.getElementById('user-code').textContent = currentUser.codigo;
    document.getElementById('display-code').textContent = currentUser.codigo;

    // Calculate stats
    const userReferrals = referrals.filter(r => r.codigo_usado === currentUser.codigo);
    const totalReferrals = userReferrals.length;
    const pendingReferrals = userReferrals.filter(r => r.status === 'Pendente').length;
    const convertedReferrals = userReferrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;

    document.getElementById('stat-total').textContent = totalReferrals;
    document.getElementById('stat-pending').textContent = pendingReferrals;
    document.getElementById('stat-converted').textContent = convertedReferrals;

    // Update WhatsApp message preview
    const message = settings.whatsappMessage
        .replace('{{CODE}}', currentUser.codigo)
        .replace('{{DISCOUNT}}', settings.discount);
    document.getElementById('whatsapp-preview').textContent = message;

    // Load referrals list
    loadReferralsList(userReferrals);
}

function loadReferralsList(userReferrals) {
    const container = document.getElementById('referrals-list');

    if (userReferrals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>Nenhuma indicação ainda.<br>Compartilhe seu cupom para começar!</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    userReferrals.sort((a, b) => new Date(b.data_indicacao) - new Date(a.data_indicacao));

    container.innerHTML = userReferrals.map(ref => {
        const date = new Date(ref.data_indicacao).toLocaleDateString('pt-BR');
        const statusClass = ref.status === 'Usado' ? 'status-used' :
            ref.status === 'Validado' ? 'status-validated' : 'status-pending';

        return `
            <div class="referral-item">
                <div class="referral-info">
                    <h3>${ref.nome_indicado || 'Aguardando validação'}</h3>
                    <p>${date}</p>
                </div>
                <span class="referral-status ${statusClass}">${ref.status}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// WhatsApp Sharing
// ==========================================
function shareWhatsApp() {
    if (!currentUser) return;

    const message = settings.whatsappMessage
        .replace('{{CODE}}', currentUser.codigo)
        .replace('{{DISCOUNT}}', settings.discount);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    showToast('Abrindo WhatsApp...', 'success');
}

function copyCode() {
    if (!currentUser) return;

    navigator.clipboard.writeText(currentUser.codigo).then(() => {
        showToast('Código copiado!', 'success');
    }).catch(() => {
        showToast('Erro ao copiar código', 'error');
    });
}

// ==========================================
// Oficina - Coupon Validation
// ==========================================
async function validateCoupon(code) {
    await loadData();

    const upperCode = code.toUpperCase().trim();
    const ambassador = ambassadors.find(a => a.codigo === upperCode);

    const resultDiv = document.getElementById('validation-result');

    if (ambassador) {
        const ambassadorReferrals = referrals.filter(r => r.codigo_usado === upperCode);
        const totalUses = ambassadorReferrals.length;

        resultDiv.className = 'validation-result valid';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="result-header">
                <div class="result-icon">✅</div>
                <div class="result-message">
                    <h3>Cupom Válido</h3>
                    <p>Este cupom pode ser utilizado</p>
                </div>
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Código</span>
                    <span class="detail-value">${ambassador.codigo}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Embaixador</span>
                    <span class="detail-value">${ambassador.nome}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contato</span>
                    <span class="detail-value">${ambassador.telefone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vezes Usado</span>
                    <span class="detail-value">${totalUses}x</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Desconto</span>
                    <span class="detail-value">${settings.discount}%</span>
                </div>
            </div>
        `;

        document.getElementById('use-coupon-form').style.display = 'block';
        document.getElementById('use-coupon-form').dataset.code = upperCode;
    } else {
        resultDiv.className = 'validation-result invalid';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="result-header">
                <div class="result-icon">❌</div>
                <div class="result-message">
                    <h3>Cupom Inválido</h3>
                    <p>Este código não foi encontrado no sistema</p>
                </div>
            </div>
        `;

        document.getElementById('use-coupon-form').style.display = 'none';
    }
}

async function markCouponAsUsed() {
    const form = document.getElementById('use-coupon-form');
    const code = form.dataset.code;
    const indicadoName = document.getElementById('indicado-name').value.trim();
    const indicadoPhone = document.getElementById('indicado-phone').value.trim();
    const discountValue = document.getElementById('discount-value').value;
    const observations = document.getElementById('observations').value.trim();

    if (!indicadoName || !indicadoPhone) {
        showToast('Preencha nome e telefone do indicado', 'error');
        return;
    }

    const newId = referrals.length + 1;
    const now = new Date().toISOString();

    await sheets.appendRow(CONFIG.SHEET_INDICACOES, [
        newId, code, indicadoName, indicadoPhone, now, 'Usado', discountValue, now, observations
    ]);

    // Update local data
    referrals.push({
        id: newId,
        codigo_usado: code,
        nome_indicado: indicadoName,
        telefone_indicado: indicadoPhone,
        data_indicacao: now,
        status: 'Usado',
        valor_desconto: discountValue,
        data_uso: now,
        observacoes: observations
    });

    showToast('Cupom registrado com sucesso!', 'success');

    // Clear form
    document.getElementById('indicado-name').value = '';
    document.getElementById('indicado-phone').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('search-coupon').value = '';
    document.getElementById('validation-result').style.display = 'none';
    document.getElementById('use-coupon-form').style.display = 'none';

    // Reload admin stats
    loadAdminDashboard();
}

// ==========================================
// Admin Dashboard
// ==========================================
async function loadAdminDashboard() {
    await loadData();

    const totalCodes = ambassadors.length;
    const totalAmbassadors = ambassadors.length;
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;
    const conversionRate = totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0;

    document.getElementById('admin-total-codes').textContent = totalCodes;
    document.getElementById('admin-total-ambassadors').textContent = totalAmbassadors;
    document.getElementById('admin-conversion-rate').textContent = conversionRate + '%';

    // Recent referrals
    const recentReferrals = [...referrals]
        .sort((a, b) => new Date(b.data_indicacao) - new Date(a.data_indicacao))
        .slice(0, 10);

    const container = document.getElementById('admin-recent-referrals');

    if (recentReferrals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>Nenhuma indicação registrada ainda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentReferrals.map(ref => {
        const date = new Date(ref.data_indicacao).toLocaleDateString('pt-BR');
        const statusClass = ref.status === 'Usado' ? 'status-used' :
            ref.status === 'Validado' ? 'status-validated' : 'status-pending';

        return `
            <div class="referral-item">
                <div class="referral-info">
                    <h3>${ref.nome_indicado || 'Aguardando'} (${ref.codigo_usado})</h3>
                    <p>${date} - ${ref.telefone_indicado || 'Sem telefone'}</p>
                </div>
                <span class="referral-status ${statusClass}">${ref.status}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// Screen Navigation
// ==========================================
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    // Load data for specific screens
    if (screenId === 'oficina-panel') {
        loadAdminDashboard();
    }
}

// ==========================================
// UI Helpers
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

// ==========================================
// Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Landing page
    document.getElementById('btn-embaixador').addEventListener('click', () => {
        goToScreen('embaixador-login');
    });

    document.getElementById('btn-oficina').addEventListener('click', () => {
        goToScreen('oficina-panel');
    });

    // Login
    document.getElementById('btn-login').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        if (email) {
            await login(email);
        } else {
            showToast('Digite seu email ou telefone', 'error');
        }
    });

    document.getElementById('btn-show-register').addEventListener('click', () => {
        document.getElementById('register-form').style.display = 'block';
    });

    document.getElementById('btn-cancel-register').addEventListener('click', () => {
        document.getElementById('register-form').style.display = 'none';
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', async () => {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();

        if (name && email && phone) {
            await register(name, email, phone);
        } else {
            showToast('Preencha todos os campos', 'error');
        }
    });

    // Dashboard
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-copy-code').addEventListener('click', copyCode);
    document.getElementById('btn-share-whatsapp').addEventListener('click', shareWhatsApp);

    // Oficina
    document.getElementById('btn-validate').addEventListener('click', () => {
        const code = document.getElementById('search-coupon').value.trim();
        if (code) {
            validateCoupon(code);
        } else {
            showToast('Digite um código de cupom', 'error');
        }
    });

    document.getElementById('btn-mark-used').addEventListener('click', markCouponAsUsed);

    // Back buttons
    document.getElementById('back-from-login').addEventListener('click', () => {
        goToScreen('landing-page');
    });

    document.getElementById('back-from-oficina').addEventListener('click', () => {
        goToScreen('landing-page');
    });

    // Enter key handlers
    document.getElementById('login-email').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btn-login').click();
    });

    document.getElementById('search-coupon').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btn-validate').click();
    });

    // Load saved session
    loadUserSession();

    console.log('Box 73 Sistema de Indicação initialized');
});
