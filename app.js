// ==========================================
// Box 73 - Sistema de Indicação (Supabase Version)
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
// Supabase Client
// ==========================================
let supabase = null;

// Initialize Supabase
function initSupabase() {
    if (CONFIG.USE_MOCK_DATA) {
        console.log('Running in MOCK DATA mode');
        return;
    }

    // Check if Supabase CDN loaded
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.warn('Supabase CDN not loaded. Falling back to mock data.');
        CONFIG.USE_MOCK_DATA = true;
        return;
    }

    try {
        supabase = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        console.log('Supabase initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        CONFIG.USE_MOCK_DATA = true;
        showToast('Erro ao conectar ao banco de dados. Usando dados de exemplo.', 'error');
    }
}

// ==========================================
// Mock Data (for testing without Supabase)
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
// Data Loading & Processing
// ==========================================
async function loadData() {
    showLoading(true);
    try {
        if (CONFIG.USE_MOCK_DATA || !supabase) {
            ambassadors = MOCK_DATA.ambassadors;
            referrals = MOCK_DATA.referrals;
            console.log('Using mock data:', { ambassadors, referrals });
        } else {
            // Load from Supabase
            const { data: ambassadorData, error: ambassadorError } = await supabase
                .from('embaixadores')
                .select('*');

            if (ambassadorError) throw ambassadorError;
            ambassadors = ambassadorData || [];

            const { data: referralData, error: referralError } = await supabase
                .from('indicacoes')
                .select('*');

            if (referralError) throw referralError;
            referrals = referralData || [];

            // Load settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('configuracoes')
                .select('*');

            if (settingsError) throw settingsError;

            settingsData?.forEach(row => {
                if (row.chave === 'desconto_percentual') {
                    settings.discount = parseInt(row.valor) || CONFIG.DEFAULT_DISCOUNT;
                } else if (row.chave === 'mensagem_whatsapp') {
                    settings.whatsappMessage = row.valor || CONFIG.DEFAULT_WHATSAPP_MESSAGE;
                }
            });

            console.log('Data loaded from Supabase:', { ambassadors, referrals, settings });
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Erro ao carregar dados. Usando dados de exemplo.', 'error');
        ambassadors = MOCK_DATA.ambassadors;
        referrals = MOCK_DATA.referrals;
    } finally {
        showLoading(false);
    }
}

// ==========================================
// Code Generation
// ==========================================
function generateCode(name) {
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 10);

    let code = cleanName + '73';

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

    if (ambassadors.some(a => a.email === email || a.telefone === phone)) {
        showToast('Email ou telefone já cadastrado', 'error');
        return false;
    }

    const code = generateCode(name);
    const now = new Date().toISOString();

    try {
        if (CONFIG.USE_MOCK_DATA || !supabase) {
            // Mock data
            const newId = ambassadors.length + 1;
            const newUser = {
                id: newId,
                nome: name,
                email,
                telefone: phone,
                codigo: code,
                data_cadastro: now
            };
            MOCK_DATA.ambassadors.push(newUser);
            ambassadors.push(newUser);
            currentUser = newUser;
        } else {
            // Supabase
            const { data, error } = await supabase
                .from('embaixadores')
                .insert([{ nome: name, email, telefone: phone, codigo: code }])
                .select();

            if (error) throw error;

            currentUser = data[0];
            ambassadors.push(currentUser);
        }

        saveUserSession();
        goToScreen('embaixador-dashboard');
        loadDashboard();
        showToast('Cadastro realizado com sucesso!', 'success');
        return true;
    } catch (error) {
        console.error('Error registering:', error);
        showToast('Erro ao criar conta: ' + error.message, 'error');
        return false;
    }
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

    document.getElementById('user-name').textContent = currentUser.nome.split(' ')[0];
    document.getElementById('user-code').textContent = currentUser.codigo;
    document.getElementById('display-code').textContent = currentUser.codigo;

    const userReferrals = referrals.filter(r => r.codigo_usado === currentUser.codigo);
    const totalReferrals = userReferrals.length;
    const pendingReferrals = userReferrals.filter(r => r.status === 'Pendente').length;
    const convertedReferrals = userReferrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;

    document.getElementById('stat-total').textContent = totalReferrals;
    document.getElementById('stat-pending').textContent = pendingReferrals;
    document.getElementById('stat-converted').textContent = convertedReferrals;

    const message = settings.whatsappMessage
        .replace('{{CODE}}', currentUser.codigo)
        .replace('{{DISCOUNT}}', settings.discount);
    document.getElementById('whatsapp-preview').textContent = message;

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
// Office Panel - Ambassadors List
// ==========================================
async function loadAmbassadorsList() {
    await loadData();

    const totalAmbassadors = ambassadors.length;
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;
    const conversionRate = totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0;

    document.getElementById('office-total-ambassadors').textContent = totalAmbassadors;
    document.getElementById('office-total-referrals').textContent = totalReferrals;
    document.getElementById('office-conversion-rate').textContent = conversionRate + '%';

    const container = document.getElementById('ambassadors-list');

    if (ambassadors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>Nenhum embaixador cadastrado ainda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ambassadors.map(ambassador => {
        const ambassadorReferrals = referrals.filter(r => r.codigo_usado === ambassador.codigo);
        const totalUses = ambassadorReferrals.length;
        const converted = ambassadorReferrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;
        const pending = ambassadorReferrals.filter(r => r.status === 'Pendente').length;

        return `
            <div class="ambassador-card">
                <div class="ambassador-header">
                    <div class="ambassador-info">
                        <h3 class="ambassador-name">${ambassador.nome}</h3>
                        <div class="ambassador-meta">
                            <span class="ambassador-code">Cupom: ${ambassador.codigo}</span>
                            <a href="https://wa.me/${ambassador.telefone.replace(/\D/g, '')}" 
                               target="_blank" 
                               class="ambassador-phone">
                                📱 ${ambassador.telefone}
                            </a>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-validate-quick" data-code="${ambassador.codigo}">
                        Validar Cupom
                    </button>
                </div>
                
                <div class="ambassador-stats">
                    <div class="mini-stat">
                        <span class="mini-stat-value">${totalUses}</span>
                        <span class="mini-stat-label">Total</span>
                    </div>
                    <div class="mini-stat success">
                        <span class="mini-stat-value">${converted}</span>
                        <span class="mini-stat-label">Convertidas</span>
                    </div>
                    <div class="mini-stat warning">
                        <span class="mini-stat-value">${pending}</span>
                        <span class="mini-stat-label">Pendentes</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-validate-quick').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.dataset.code;
            document.getElementById('search-coupon').value = code;
            validateCoupon(code);
            document.querySelector('.validator-section').scrollIntoView({ behavior: 'smooth' });
        });
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
                    <p>Embaixador Encontrado</p>
                </div>
            </div>
            
            <div class="ambassador-highlight">
                <div class="highlight-item">
                    <span class="highlight-label">Embaixador</span>
                    <span class="highlight-value big">${ambassador.nome}</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label">WhatsApp</span>
                    <a href="https://wa.me/${ambassador.telefone.replace(/\D/g, '')}" target="_blank" class="highlight-value link">
                        ${ambassador.telefone} 📱
                    </a>
                </div>
            </div>

            <div class="stats-highlight">
                <div class="stat-box">
                    <span class="stat-number">${totalUses}</span>
                    <span class="stat-desc">Indicações Totais</span>
                </div>
                <div class="stat-box accent">
                    <span class="stat-number">${settings.discount}%</span>
                    <span class="stat-desc">Desconto do Cupom</span>
                </div>
            </div>

            <div class="result-details collapsed">
                <div class="detail-row">
                    <span class="detail-label">Código</span>
                    <span class="detail-value">${ambassador.codigo}</span>
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

    const now = new Date().toISOString();

    try {
        if (CONFIG.USE_MOCK_DATA || !supabase) {
            // Mock data
            const newId = referrals.length + 1;
            MOCK_DATA.referrals.push({
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
            referrals.push(MOCK_DATA.referrals[MOCK_DATA.referrals.length - 1]);
        } else {
            // Supabase
            const { error } = await supabase
                .from('indicacoes')
                .insert([{
                    codigo_usado: code,
                    nome_indicado: indicadoName,
                    telefone_indicado: indicadoPhone,
                    status: 'Usado',
                    valor_desconto: parseFloat(discountValue),
                    data_uso: now,
                    observacoes: observations
                }]);

            if (error) throw error;
        }

        showToast('Cupom registrado com sucesso!', 'success');

        // Clear form
        document.getElementById('indicado-name').value = '';
        document.getElementById('indicado-phone').value = '';
        document.getElementById('observations').value = '';
        document.getElementById('search-coupon').value = '';
        document.getElementById('validation-result').style.display = 'none';
        document.getElementById('use-coupon-form').style.display = 'none';

        // Reload ambassador list
        loadAmbassadorsList();
    } catch (error) {
        console.error('Error marking coupon as used:', error);
        showToast('Erro ao registrar cupom: ' + error.message, 'error');
    }
}

// ==========================================
// Screen Navigation
// ==========================================
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    if (screenId === 'oficina-panel') {
        loadAmbassadorsList();
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
    // Initialize Supabase
    initSupabase();

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

    console.log('Box 73 Sistema de Indicação initialized with Supabase');
});
