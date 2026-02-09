// ==========================================
// Box 73 - Consulta do Embaixador (cliente.js)
// ==========================================

let supabaseClient = null;
let currentUser = null;

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
        console.log('Supabase inicializado');
    } catch (error) {
        console.error('Falha ao inicializar Supabase:', error);
        CONFIG.USE_MOCK_DATA = true;
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
        { id: 1, codigo_usado: 'JOAO73', nome_indicado: 'Pedro Costa', data_uso: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Revisão completa' },
        { id: 2, codigo_usado: 'JOAO73', nome_indicado: 'Ana Paula', data_uso: new Date(Date.now() - 86400000).toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Troca de óleo' },
        { id: 3, codigo_usado: 'MARIA73', nome_indicado: 'Carlos Mendes', data_uso: new Date().toISOString(), status: 'Usado', valor_desconto: 10, observacoes: 'Revisão completa' }
    ]
};

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

function cleanCPF(cpf) {
    return cpf.replace(/\D/g, '');
}

// ==========================================
// Consulta por CPF
// ==========================================
async function consultarCPF(cpf) {
    const cleanedCPF = cleanCPF(cpf);

    if (cleanedCPF.length !== 11) {
        showToast('CPF inválido. Deve ter 11 dígitos.', 'error');
        return;
    }

    showLoading(true);

    try {
        let ambassador = null;
        let referrals = [];

        if (CONFIG.USE_MOCK_DATA) {
            ambassador = MOCK_DATA.ambassadors.find(a => cleanCPF(a.cpf) === cleanedCPF);
            if (ambassador) {
                referrals = MOCK_DATA.referrals.filter(r => r.codigo_usado === ambassador.codigo);
            }
        } else {
            // Buscar embaixador por CPF
            const { data: ambData, error: ambError } = await supabaseClient
                .from('embaixadores')
                .select('*')
                .eq('cpf', cpf)
                .single();

            if (ambError && ambError.code !== 'PGRST116') throw ambError;

            // Tentar também sem formatação
            if (!ambData) {
                const { data: ambData2, error: ambError2 } = await supabaseClient
                    .from('embaixadores')
                    .select('*')
                    .eq('cpf', cleanedCPF)
                    .single();

                if (ambError2 && ambError2.code !== 'PGRST116') throw ambError2;
                ambassador = ambData2;
            } else {
                ambassador = ambData;
            }

            if (ambassador) {
                const { data: refData, error: refError } = await supabaseClient
                    .from('indicacoes')
                    .select('*')
                    .eq('codigo_usado', ambassador.codigo);

                if (refError) throw refError;
                referrals = refData || [];
            }
        }

        if (!ambassador) {
            showToast('CPF não encontrado. Verifique com a oficina.', 'error');
            showLoading(false);
            return;
        }

        // Salvar e mostrar dashboard
        currentUser = ambassador;
        showDashboard(ambassador, referrals);

    } catch (error) {
        console.error('Erro na consulta:', error);
        showToast('Erro ao consultar. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// Dashboard do Cliente
// ==========================================
function showDashboard(ambassador, referrals) {
    // Mudar de tela
    document.getElementById('cliente-login').classList.remove('active');
    document.getElementById('cliente-dashboard').classList.add('active');

    // Preencher dados
    document.getElementById('user-name').textContent = ambassador.nome.split(' ')[0];
    document.getElementById('user-code').textContent = ambassador.codigo;
    document.getElementById('display-code').textContent = ambassador.codigo;

    // Stats
    const totalReferrals = referrals.length;
    const usedReferrals = referrals.filter(r => r.status === 'Usado').length;

    document.getElementById('stat-total').textContent = totalReferrals;
    document.getElementById('stat-converted').textContent = usedReferrals;

    // WhatsApp preview
    const message = CONFIG.DEFAULT_WHATSAPP_MESSAGE
        .replace('{{CODE}}', ambassador.codigo)
        .replace('{{DISCOUNT}}', CONFIG.DEFAULT_DISCOUNT);
    document.getElementById('whatsapp-preview').textContent = message;

    // Lista de indicações
    const container = document.getElementById('referrals-list');

    if (referrals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>Nenhuma indicação ainda.<br>Compartilhe seu cupom para começar!</p>
            </div>
        `;
    } else {
        const sorted = [...referrals].sort((a, b) => new Date(b.data_uso) - new Date(a.data_uso));
        container.innerHTML = sorted.map(ref => {
            const date = new Date(ref.data_uso).toLocaleDateString('pt-BR');
            return `
                <div class="referral-item">
                    <div class="referral-info">
                        <h3>${ref.nome_indicado}</h3>
                        <p>${date} · ${ref.observacoes || 'Sem detalhes'}</p>
                    </div>
                    <span class="referral-status status-used">✅ Usado</span>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// WhatsApp & Copy
// ==========================================
function shareWhatsApp() {
    if (!currentUser) return;
    const message = CONFIG.DEFAULT_WHATSAPP_MESSAGE
        .replace('{{CODE}}', currentUser.codigo)
        .replace('{{DISCOUNT}}', CONFIG.DEFAULT_DISCOUNT);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    showToast('Abrindo WhatsApp...', 'success');
}

function copyCode() {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.codigo).then(() => {
        showToast('Código copiado! 📋', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = currentUser.codigo;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Código copiado! 📋', 'success');
    });
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
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🏍️ Box 73 - Consulta do Embaixador carregada');
    initSupabase();

    // CPF mask
    const cpfInput = document.getElementById('consulta-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            e.target.value = formatCPF(e.target.value);
        });

        cpfInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-consultar').click();
        });
    }

    // Consultar button
    document.getElementById('btn-consultar').addEventListener('click', () => {
        const cpf = document.getElementById('consulta-cpf').value.trim();
        if (cpf) {
            consultarCPF(cpf);
        } else {
            showToast('Digite seu CPF', 'error');
        }
    });

    // Back button
    document.getElementById('back-from-dashboard').addEventListener('click', () => {
        document.getElementById('cliente-dashboard').classList.remove('active');
        document.getElementById('cliente-login').classList.add('active');
        currentUser = null;
    });

    // WhatsApp & Copy
    document.getElementById('btn-share-whatsapp').addEventListener('click', shareWhatsApp);
    document.getElementById('btn-copy-code').addEventListener('click', copyCode);
});
