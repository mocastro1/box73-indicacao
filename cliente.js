// =========================================================
//  Box 73 – Indicação · Página do Cliente (cliente.js)
//  Consulta por CPF → mostra TODOS os cupons + validações
// =========================================================

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function formatCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
}
function cleanCPF(v) { return v.replace(/\D/g, ''); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '-'; }
function showToast(msg, type = 'success') {
    const t = $('#toast'); t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast', 3000);
}
function showLoading() { $('#loading-overlay').style.display = 'flex'; }
function hideLoading() { $('#loading-overlay').style.display = 'none'; }

function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $(`#${id}`).classList.add('active');
}

// ---------- Mock Data ----------
function getMockDataForCPF(cpf) {
    if (cpf === '12345678901') {
        return {
            embaixador: { id: 1, nome: 'João da Silva', cpf: '12345678901', telefone: '11999887766' },
            cupons: [
                {
                    id: 1, codigo: 'JOAO101', data_criacao: '2025-06-02',
                    mecanicas: { nome: 'Promoção Revisão 2025', beneficio_embaixador: '15% desc revisão', beneficio_cliente: '10% desc 1ª revisão', meta_validacoes: 3 },
                    indicacoes: [
                        { nome_indicado: 'Carlos Souza', telefone_indicado: '11977665544', data_uso: '2025-06-10', servico: 'Troca de óleo' }
                    ]
                },
                {
                    id: 2, codigo: 'JOAO202', data_criacao: '2025-07-01',
                    mecanicas: { nome: 'Campanha Inverno', beneficio_embaixador: '20% desc peças', beneficio_cliente: '15% desc serviço', meta_validacoes: 5 },
                    indicacoes: []
                }
            ]
        };
    }
    return null;
}

// ---------- Supabase Queries ----------
async function consultarCPF(cpf) {
    const clean = cleanCPF(cpf);
    if (clean.length !== 11) { showToast('CPF inválido.', 'error'); return; }

    showLoading();
    try {
        let embaixador, cupons;

        if (USE_MOCK_DATA) {
            const mock = getMockDataForCPF(clean);
            if (!mock) { showToast('CPF não encontrado.', 'error'); hideLoading(); return; }
            embaixador = mock.embaixador;
            cupons = mock.cupons;
        } else {
            // Fetch embaixador
            const { data: emb, error: errEmb } = await supabaseClient
                .from('embaixadores').select('*').eq('cpf', clean).single();
            if (errEmb || !emb) { showToast('CPF não encontrado. Consulte a oficina.', 'error'); hideLoading(); return; }
            embaixador = emb;

            // Fetch cupons with mecânica info
            const { data: cups, error: errCup } = await supabaseClient
                .from('cupons')
                .select('*, mecanicas(nome, beneficio_embaixador, beneficio_cliente, meta_validacoes)')
                .eq('embaixador_id', emb.id)
                .order('data_criacao', { ascending: false });
            if (errCup) { console.error(errCup); showToast('Erro ao buscar cupons.', 'error'); hideLoading(); return; }

            // Fetch indicações for all cupons
            const cupomIds = (cups || []).map(c => c.id);
            let indicacoes = [];
            if (cupomIds.length) {
                const { data: indData } = await supabaseClient
                    .from('indicacoes')
                    .select('*')
                    .in('cupom_id', cupomIds)
                    .order('data_uso', { ascending: false });
                indicacoes = indData || [];
            }

            // Merge indicações into cupons
            cupons = (cups || []).map(c => ({
                ...c,
                indicacoes: indicacoes.filter(i => i.cupom_id === c.id)
            }));
        }

        renderDashboard(embaixador, cupons);
    } catch (err) {
        console.error('consultarCPF:', err);
        showToast('Erro inesperado.', 'error');
    }
    hideLoading();
}

// ---------- Render Dashboard ----------
function renderDashboard(emb, cupons) {
    showScreen('screen-dashboard');

    $('#cli-nome').textContent = emb.nome;
    $('#cli-cpf').textContent = formatCPF(emb.cpf);

    // Stats
    const totalVal = cupons.reduce((sum, c) => sum + (c.indicacoes?.length || 0), 0);
    $('#cli-st-cup').textContent = cupons.length;
    $('#cli-st-val').textContent = totalVal;

    // Cupons list
    const listEl = $('#cli-cupons-list');
    if (!cupons.length) {
        listEl.innerHTML = '<p class="empty-state">Você ainda não tem cupons. Consulte a oficina Box 73!</p>';
    } else {
        listEl.innerHTML = cupons.map(c => {
            const valCount = c.indicacoes?.length || 0;
            const meta = c.mecanicas?.meta_validacoes || '?';
            const progresso = meta !== '?' ? Math.min(100, Math.round((valCount / meta) * 100)) : 0;
            const metaAtingida = meta !== '?' && valCount >= meta;

            let indicacoesHTML = '';
            if (c.indicacoes && c.indicacoes.length) {
                indicacoesHTML = `
                    <div class="validacoes-list">
                        <h4>Validações deste cupom:</h4>
                        ${c.indicacoes.map(ind => `
                            <div class="validacao-item">
                                <span>👤 ${ind.nome_indicado}</span>
                                <span>📅 ${formatDate(ind.data_uso)}</span>
                                <span>📞 ${ind.telefone_indicado || '-'}</span>
                                ${ind.servico ? `<span>🔧 ${ind.servico}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>`;
            } else {
                indicacoesHTML = '<p class="empty-sub">Nenhuma validação ainda. Compartilhe seu cupom!</p>';
            }

            return `
                <div class="cupom-card">
                    <div class="cupom-header">
                        <div class="cupom-code">🎫 ${c.codigo}</div>
                        ${metaAtingida ? '<span class="badge badge-gold">🏆 Meta Atingida!</span>' : ''}
                    </div>
                    <div class="cupom-info">
                        <span>⚙️ ${c.mecanicas?.nome || '-'}</span>
                        <span>🎁 Seu benefício: ${c.mecanicas?.beneficio_embaixador || '-'}</span>
                        <span>🎁 Benefício p/ indicado: ${c.mecanicas?.beneficio_cliente || '-'}</span>
                    </div>
                    <div class="progress-section">
                        <div class="progress-label">${valCount}/${meta} validações para seu benefício</div>
                        <div class="progress-bar"><div class="progress-fill ${metaAtingida ? 'progress-complete' : ''}" style="width:${progresso}%"></div></div>
                    </div>
                    ${indicacoesHTML}
                    <div class="cupom-actions">
                        <button class="btn btn-primary btn-sm btn-share" data-code="${c.codigo}" data-benefit="${c.mecanicas?.beneficio_cliente || ''}">
                            📱 Compartilhar WhatsApp
                        </button>
                        <button class="btn btn-secondary btn-sm btn-copy-code" data-code="${c.codigo}">
                            📋 Copiar Código
                        </button>
                    </div>
                </div>`;
        }).join('');

        // Share handlers
        listEl.querySelectorAll('.btn-share').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                const benefit = btn.getAttribute('data-benefit');
                shareWhatsApp(code, benefit);
            });
        });
        listEl.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                navigator.clipboard.writeText(code).then(() => showToast('Código copiado!')).catch(() => showToast('Erro ao copiar', 'error'));
            });
        });
    }
}

// ---------- WhatsApp Share ----------
function shareWhatsApp(code, benefit) {
    let msg = DEFAULT_WHATSAPP_MESSAGE || 'Olá! Use meu cupom {{CODE}} na Box 73 e ganhe {{DISCOUNT}}!';
    msg = msg.replace('{{CODE}}', code).replace('{{DISCOUNT}}', benefit || DEFAULT_DISCOUNT + '% de desconto');
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    // CPF mask
    const cpfInput = $('#input-cpf');
    cpfInput.addEventListener('input', (e) => { e.target.value = formatCPF(e.target.value); });

    // Consultar button
    $('#btn-consultar').addEventListener('click', () => consultarCPF(cpfInput.value));

    // Enter key
    cpfInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') consultarCPF(cpfInput.value); });

    // Trocar CPF
    $('#btn-trocar-cpf').addEventListener('click', () => {
        showScreen('screen-login');
        cpfInput.value = '';
        cpfInput.focus();
    });
});
