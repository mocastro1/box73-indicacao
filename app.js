// ==========================================
// Box 73 - Sistema de Indicação
// Main Application Logic (Corrigido)
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

function initSupabase() {
    if (CONFIG.USE_MOCK_DATA) {
        console.log('Rodando em modo MOCK DATA');
        return;
    }

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.warn('Supabase CDN não carregou. Usando mock data.');
        CONFIG.USE_MOCK_DATA = true;
        return;
    }

    try {
        supabase = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        console.log('Supabase inicializado');
    } catch (error) {
        console.error('Falha ao inicializar Supabase:', error);
        CONFIG.USE_MOCK_DATA = true;
        showToast('Erro ao conectar ao banco. Usando dados de exemplo.', 'error');
    }
}

// ==========================================
// Mock Data (para testes sem Supabase)
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
// Data Loading
// ==========================================
async function loadData() {
    showLoading(true);
    try {
        if (CONFIG.USE_MOCK_DATA) {
            ambassadors = [...MOCK_DATA.ambassadors];
            referrals = [...MOCK_DATA.referrals];
        } else {
            // Supabase: carregar embaixadores
            const { data: ambData, error: ambError } = await supabase
                .from('embaixadores')
                .select('*');
            if (ambError) throw ambError;
            ambassadors = ambData || [];

            // Supabase: carregar indicações
            const { data: refData, error: refError } = await supabase
                .from('indicacoes')
                .select('*');
            if (refError) throw refError;
            referrals = refData || [];
        }
        console.log('Dados carregados:', { ambassadors: ambassadors.length, referrals: referrals.length });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados. Usando dados de exemplo.', 'error');
        // Fallback para mock
        ambassadors = [...MOCK_DATA.ambassadors];
        referrals = [...MOCK_DATA.referrals];
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
        showToast('Usuário não encontrado. Verifique email ou telefone.', 'error');
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

    if (CONFIG.USE_MOCK_DATA) {
        const newId = MOCK_DATA.ambassadors.length + 1;
        const newUser = { id: newId, nome: name, email, telefone: phone, codigo: code, data_cadastro: now };
        MOCK_DATA.ambassadors.push(newUser);
        ambassadors.push(newUser);
        currentUser = newUser;
    } else {
        const { data, error } = await supabase
            .from('embaixadores')
            .insert([{ nome: name, email, telefone: phone, codigo: code, data_cadastro: now }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao cadastrar:', error);
            showToast('Erro ao cadastrar. Tente novamente.', 'error');
            return false;
        }
        ambassadors.push(data);
        currentUser = data;
    }

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
        try {
            currentUser = JSON.parse(savedUser);
            goToScreen('embaixador-dashboard');
            loadDashboard();
        } catch (e) {
            localStorage.removeItem('box73_user');
        }
    }
}

// ==========================================
// Dashboard
// ==========================================
async function loadDashboard() {
    if (!currentUser) return;

    await loadData();

    // Atualizar info do usuário
    document.getElementById('user-name').textContent = currentUser.nome.split(' ')[0];
    document.getElementById('user-code').textContent = currentUser.codigo;
    document.getElementById('display-code').textContent = currentUser.codigo;

    // Estatísticas
    const userReferrals = referrals.filter(r => r.codigo_usado === currentUser.codigo);
    const totalReferrals = userReferrals.length;
    const pendingReferrals = userReferrals.filter(r => r.status === 'Pendente').length;
    const convertedReferrals = userReferrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;

    document.getElementById('stat-total').textContent = totalReferrals;
    document.getElementById('stat-pending').textContent = pendingReferrals;
    document.getElementById('stat-converted').textContent = convertedReferrals;

    // Preview WhatsApp
    const message = settings.whatsappMessage
        .replace('{{CODE}}', currentUser.codigo)
        .replace('{{DISCOUNT}}', settings.discount);
    document.getElementById('whatsapp-preview').textContent = message;

    // Lista de indicações
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
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    showToast('Abrindo WhatsApp...', 'success');
}

function copyCode() {
    if (!currentUser) return;

    navigator.clipboard.writeText(currentUser.codigo).then(() => {
        showToast('Código copiado!', 'success');
    }).catch(() => {
        // Fallback para navegadores que não suportam clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = currentUser.codigo;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Código copiado!', 'success');
    });
}

// ==========================================
// Oficina - Validação de Cupons
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
                    <p>Embaixador encontrado</p>
                </div>
            </div>
            
            <div class="ambassador-highlight">
                <div class="highlight-item">
                    <span class="highlight-label">Embaixador</span>
                    <span class="highlight-value big">${ambassador.nome}</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label">WhatsApp</span>
                    <a href="https://wa.me/55${ambassador.telefone.replace(/\D/g, '')}" target="_blank" class="highlight-value link">
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
    const newReferral = {
        codigo_usado: code,
        nome_indicado: indicadoName,
        telefone_indicado: indicadoPhone,
        data_indicacao: now,
        status: 'Usado',
        valor_desconto: parseInt(discountValue) || settings.discount,
        data_uso: now,
        observacoes: observations
    };

    if (CONFIG.USE_MOCK_DATA) {
        newReferral.id = MOCK_DATA.referrals.length + 1;
        MOCK_DATA.referrals.push(newReferral);
        referrals.push(newReferral);
    } else {
        const { data, error } = await supabase
            .from('indicacoes')
            .insert([newReferral])
            .select()
            .single();

        if (error) {
            console.error('Erro ao registrar uso:', error);
            showToast('Erro ao registrar. Tente novamente.', 'error');
            return;
        }
        referrals.push(data);
    }

    showToast('Cupom registrado com sucesso!', 'success');

    // Limpar form
    document.getElementById('indicado-name').value = '';
    document.getElementById('indicado-phone').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('search-coupon').value = '';
    document.getElementById('validation-result').style.display = 'none';
    document.getElementById('use-coupon-form').style.display = 'none';

    // Recarregar painel
    loadOficinaDashboard();
}

// ==========================================
// Oficina Dashboard
// ==========================================
async function loadOficinaDashboard() {
    await loadData();

    const totalAmbassadors = ambassadors.length;
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.status === 'Usado' || r.status === 'Validado').length;
    const conversionRate = totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0;

    // Atualizar stats da oficina
    const elTotalAmb = document.getElementById('office-total-ambassadors');
    const elTotalRef = document.getElementById('office-total-referrals');
    const elConvRate = document.getElementById('office-conversion-rate');

    if (elTotalAmb) elTotalAmb.textContent = totalAmbassadors;
    if (elTotalRef) elTotalRef.textContent = totalReferrals;
    if (elConvRate) elConvRate.textContent = conversionRate + '%';

    // Lista de embaixadores
    const container = document.getElementById('ambassadors-list');
    if (!container) return;

    if (ambassadors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>Nenhum embaixador cadastrado ainda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ambassadors.map(amb => {
        const ambReferrals = referrals.filter(r => r.codigo_usado === amb.codigo);
        const date = new Date(amb.data_cadastro).toLocaleDateString('pt-BR');

        return `
            <div class="ambassador-item">
                <div class="ambassador-info">
                    <h3>${amb.nome}</h3>
                    <p>${amb.telefone} · ${ambReferrals.length} indicação(ões) · Desde ${date}</p>
                </div>
                <span class="ambassador-code">${amb.codigo}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// Screen Navigation
// ==========================================
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        currentScreen = screenId;
    }

    if (screenId === 'oficina-panel') {
        loadOficinaDashboard();
    }
}

// ==========================================
// UI Helpers
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// ==========================================
// Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Supabase
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

    // Carregar sessão salva
    loadUserSession();

    console.log('Box 73 - Sistema de Indicação inicializado');
});
