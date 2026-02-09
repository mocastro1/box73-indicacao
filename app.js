// ==========================================
// Box 73 - Painel da Oficina (app.js)
// ==========================================

// ==========================================
// State
// ==========================================
let ambassadors = [];
let referrals = [];
let supabaseClient = null;

// ==========================================
// Supabase Init
// ==========================================
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
        supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('Supabase inicializado com sucesso');
    } catch (error) {
        console.error('Falha ao inicializar Supabase:', error);
        CONFIG.USE_MOCK_DATA = true;
        showToast('Erro ao conectar ao banco. Usando dados de exemplo.', 'error');
    }
}

// ==========================================
// Mock Data
// ==========================================
const MOCK_DATA = {
    ambassadors: [
        { id: 1, nome: 'João Silva', cpf: '111.222.333-44', telefone: '(65) 98765-4321', codigo: 'JOAO73', data_cadastro: new Date().toISOString() },
        { id: 2, nome: 'Maria Santos', cpf: '555.666.777-88', telefone: '(65) 99876-5432', codigo: 'MARIA73', data_cadastro: new Date().toISOString() }
    ],
    referrals: [
        { id: 1, codigo_usado: 'JOAO73', nome_indicado: 'Pedro Costa', telefone_indicado: '(65) 91234-5678', data_uso: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Revisão completa' },
        { id: 2, codigo_usado: 'JOAO73', nome_indicado: 'Ana Paula', telefone_indicado: '(65) 98888-7777', data_uso: new Date(Date.now() - 86400000).toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Troca de óleo' },
        { id: 3, codigo_usado: 'MARIA73', nome_indicado: 'Carlos Mendes', telefone_indicado: '(65) 97777-6666', data_uso: new Date().toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Revisão completa' }
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
            const { data: ambData, error: ambError } = await supabaseClient.from('embaixadores').select('*');
            if (ambError) throw ambError;
            ambassadors = ambData || [];

            const { data: refData, error: refError } = await supabaseClient.from('indicacoes').select('*');
            if (refError) throw refError;
            referrals = refData || [];
        }
        console.log('Dados carregados:', { ambassadors: ambassadors.length, referrals: referrals.length });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados.', 'error');
        ambassadors = [...MOCK_DATA.ambassadors];
        referrals = [...MOCK_DATA.referrals];
    } finally {
        showLoading(false);
    }
}

// ==========================================
// CPF Formatting
// ==========================================
function formatCPF(value) {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
    if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

function formatPhone(value) {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return digits.replace(/(\d{2})(\d+)/, '($1) $2');
    return digits.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

function cleanCPF(cpf) {
    return cpf.replace(/\D/g, '');
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
// Register Ambassador (Oficina cadastra)
// ==========================================
async function registerAmbassador(name, cpf, phone, couponCode) {
    await loadData();

    const cleanedCPF = cleanCPF(cpf);

    // Verificar CPF duplicado
    if (ambassadors.some(a => cleanCPF(a.cpf) === cleanedCPF)) {
        showToast('CPF já cadastrado!', 'error');
        return false;
    }

    // Verificar código duplicado
    const upperCode = couponCode.toUpperCase().trim();
    if (ambassadors.some(a => a.codigo === upperCode)) {
        showToast('Este código de cupom já existe! Escolha outro.', 'error');
        return false;
    }

    const now = new Date().toISOString();

    if (CONFIG.USE_MOCK_DATA) {
        const newUser = { id: MOCK_DATA.ambassadors.length + 1, nome: name, cpf: cpf, telefone: phone, codigo: upperCode, data_cadastro: now };
        MOCK_DATA.ambassadors.push(newUser);
        ambassadors.push(newUser);
    } else {
        const { data, error } = await supabaseClient
            .from('embaixadores')
            .insert([{ nome: name, cpf: cpf, telefone: phone, codigo: upperCode, data_cadastro: now }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao cadastrar:', error);
            if (error.code === '23505') {
                showToast('CPF ou cupom já cadastrado!', 'error');
            } else {
                showToast('Erro ao cadastrar. Tente novamente.', 'error');
            }
            return false;
        }
        ambassadors.push(data);
    }

    showToast('Embaixador cadastrado com sucesso! 🎉', 'success');
    return true;
}

// ==========================================
// Validate Coupon
// ==========================================
async function validateCoupon(code) {
    await loadData();

    const upperCode = code.toUpperCase().trim();
    const ambassador = ambassadors.find(a => a.codigo === upperCode);
    const resultDiv = document.getElementById('validation-result');

    if (ambassador) {
        const ambassadorReferrals = referrals.filter(r => r.codigo_usado === upperCode);

        resultDiv.className = 'validation-result valid';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="result-header">
                <div class="result-icon">✅</div>
                <div class="result-message">
                    <h3>Cupom Válido!</h3>
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
                    <span class="stat-number">${ambassadorReferrals.length}</span>
                    <span class="stat-desc">Indicações deste embaixador</span>
                </div>
                <div class="stat-box accent">
                    <span class="stat-number">${CONFIG.DEFAULT_DISCOUNT}%</span>
                    <span class="stat-desc">Desconto</span>
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

// ==========================================
// Mark Coupon as Used
// ==========================================
async function markCouponAsUsed() {
    const form = document.getElementById('use-coupon-form');
    const code = form.dataset.code;
    const indicadoName = document.getElementById('indicado-name').value.trim();
    const indicadoPhone = document.getElementById('indicado-phone').value.trim();
    const discountValue = document.getElementById('discount-value').value;
    const observations = document.getElementById('observations').value.trim();

    if (!indicadoName) {
        showToast('Preencha o nome do cliente indicado', 'error');
        return;
    }

    const now = new Date().toISOString();
    const newReferral = {
        codigo_usado: code,
        nome_indicado: indicadoName,
        telefone_indicado: indicadoPhone,
        data_uso: now,
        status: 'Usado',
        valor_desconto: parseInt(discountValue) || CONFIG.DEFAULT_DISCOUNT,
        observacoes: observations
    };

    showLoading(true);

    if (CONFIG.USE_MOCK_DATA) {
        newReferral.id = MOCK_DATA.referrals.length + 1;
        MOCK_DATA.referrals.push(newReferral);
        referrals.push(newReferral);
    } else {
        const { data, error } = await supabaseClient
            .from('indicacoes')
            .insert([newReferral])
            .select()
            .single();

        if (error) {
            console.error('Erro ao registrar uso:', error);
            showToast('Erro ao registrar. Tente novamente.', 'error');
            showLoading(false);
            return;
        }
        referrals.push(data);
    }

    showLoading(false);
    showToast('Cupom registrado com sucesso! 🎉', 'success');

    // Limpar form
    document.getElementById('indicado-name').value = '';
    document.getElementById('indicado-phone').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('search-coupon').value = '';
    document.getElementById('validation-result').style.display = 'none';
    document.getElementById('use-coupon-form').style.display = 'none';

    // Recarregar dashboard
    loadDashboard();
}

// ==========================================
// Dashboard da Oficina
// ==========================================
async function loadDashboard() {
    await loadData();

    const totalAmbassadors = ambassadors.length;
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.status === 'Usado').length;
    const conversionRate = totalAmbassadors > 0 ? Math.round((totalReferrals / totalAmbassadors) * 10) / 10 : 0;

    document.getElementById('office-total-ambassadors').textContent = totalAmbassadors;
    document.getElementById('office-total-referrals').textContent = totalReferrals;
    document.getElementById('office-conversion-rate').textContent = conversionRate + '/emb';

    // Lista de embaixadores
    const ambContainer = document.getElementById('ambassadors-list');
    if (ambassadors.length === 0) {
        ambContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>Nenhum embaixador cadastrado ainda.<br>Vá em "Cadastrar" para adicionar.</p></div>';
    } else {
        ambContainer.innerHTML = ambassadors.map(amb => {
            const ambRefs = referrals.filter(r => r.codigo_usado === amb.codigo);
            const date = new Date(amb.data_cadastro).toLocaleDateString('pt-BR');
            return `
                <div class="ambassador-item">
                    <div class="ambassador-info">
                        <h3>${amb.nome}</h3>
                        <p>${amb.telefone} · CPF: ${amb.cpf || '---'} · ${ambRefs.length} uso(s) · Desde ${date}</p>
                    </div>
                    <span class="ambassador-code">${amb.codigo}</span>
                </div>
            `;
        }).join('');
    }

    // Últimos cupons usados
    const refContainer = document.getElementById('recent-referrals-list');
    const sortedRefs = [...referrals].sort((a, b) => new Date(b.data_uso) - new Date(a.data_uso)).slice(0, 10);

    if (sortedRefs.length === 0) {
        refContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎫</div><p>Nenhum cupom validado ainda.</p></div>';
    } else {
        refContainer.innerHTML = sortedRefs.map(ref => {
            const date = new Date(ref.data_uso).toLocaleDateString('pt-BR');
            return `
                <div class="referral-item">
                    <div class="referral-info">
                        <h3>${ref.nome_indicado}</h3>
                        <p>Cupom: <strong>${ref.codigo_usado}</strong> · ${date} · ${ref.observacoes || 'Sem obs.'}</p>
                    </div>
                    <span class="referral-status status-used">${ref.status}</span>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// UI Helpers
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

// ==========================================
// Tab Navigation
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    const clickedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (clickedTab) clickedTab.classList.add('active');
    if (targetContent) targetContent.classList.add('active');

    if (tabId === 'tab-dashboard') loadDashboard();
}

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Box 73 - Painel da Oficina carregado');
    initSupabase();

    // Set client link
    const baseUrl = window.location.href.replace('index.html', '').replace(/\/$/, '');
    document.getElementById('client-link-url').textContent = baseUrl + '/cliente.html';

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // CPF mask
    const cpfInput = document.getElementById('register-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            e.target.value = formatCPF(e.target.value);
        });
    }

    // Phone mask
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    }

    // Generate code button
    document.getElementById('btn-generate-code').addEventListener('click', async () => {
        const name = document.getElementById('register-name').value.trim();
        if (!name) {
            showToast('Digite o nome primeiro para gerar o código', 'error');
            return;
        }
        await loadData();
        const code = generateCode(name);
        document.getElementById('register-coupon').value = code;
        showToast('Código gerado: ' + code, 'success');
    });

    // Register ambassador
    document.getElementById('btn-register').addEventListener('click', async () => {
        const name = document.getElementById('register-name').value.trim();
        const cpf = document.getElementById('register-cpf').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const coupon = document.getElementById('register-coupon').value.trim();

        if (!name || !cpf || !phone || !coupon) {
            showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (cleanCPF(cpf).length !== 11) {
            showToast('CPF inválido. Deve ter 11 dígitos.', 'error');
            return;
        }

        const success = await registerAmbassador(name, cpf, phone, coupon);
        if (success) {
            document.getElementById('register-name').value = '';
            document.getElementById('register-cpf').value = '';
            document.getElementById('register-phone').value = '';
            document.getElementById('register-coupon').value = '';
            switchTab('tab-dashboard');
        }
    });

    // Validate coupon
    document.getElementById('btn-validate').addEventListener('click', () => {
        const code = document.getElementById('search-coupon').value.trim();
        if (code) {
            validateCoupon(code);
        } else {
            showToast('Digite um código de cupom', 'error');
        }
    });

    // Mark as used
    document.getElementById('btn-mark-used').addEventListener('click', markCouponAsUsed);

    // Copy client link
    document.getElementById('btn-copy-client-link').addEventListener('click', () => {
        const link = document.getElementById('client-link-url').textContent;
        navigator.clipboard.writeText(link).then(() => {
            showToast('Link copiado! 📋', 'success');
        }).catch(() => {
            showToast('Erro ao copiar', 'error');
        });
    });

    // Enter key on coupon search
    document.getElementById('search-coupon').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btn-validate').click();
    });

    // Load dashboard
    loadDashboard();
});
