// =========================================================
//  Box 73 – Indicação · Painel da Oficina (app.js)
//  Reescrito para suportar: Mecânicas, Cupons vinculados,
//  múltiplos cupons por CPF, detalhe de embaixador.
// =========================================================

// ---------- Supabase Client ----------
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Cache / State ----------
let currentEmbaixadorDetalhe = null;   // embaixador aberto no detalhe
let cachedMecanicas = [];               // mecânicas carregadas

// =========================================================
//  HELPERS
// =========================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function formatCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
}
function formatPhone(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) return v.replace(/(\d{2})(\d{4,5})(\d{1,4})/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return v;
}
function cleanCPF(v) { return v.replace(/\D/g, ''); }
function showToast(msg, type = 'success') {
    const t = $('#toast'); t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast', 3000);
}
function showLoading() { $('#loading-overlay').style.display = 'flex'; }
function hideLoading() { $('#loading-overlay').style.display = 'none'; }
function generateCode(name) {
    const prefix = name ? name.split(' ')[0].toUpperCase().slice(0, 5) : 'BOX';
    return prefix + Math.floor(Math.random() * 900 + 100);
}
function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
}

// =========================================================
//  MOCK DATA
// =========================================================
function getMockEmbaixadores() {
    return [
        { id: 1, nome: 'João da Silva', cpf: '12345678901', telefone: '11999887766', data_cadastro: '2025-06-01T10:00:00Z' },
        { id: 2, nome: 'Maria Oliveira', cpf: '98765432100', telefone: '11988776655', data_cadastro: '2025-06-05T14:00:00Z' },
    ];
}
function getMockMecanicas() {
    return [
        { id: 1, nome: 'Promoção Revisão 2025', descricao: 'Campanha de revisão completa', beneficio_embaixador: '15% desconto na próxima revisão', beneficio_cliente: '10% desconto na primeira revisão', meta_validacoes: 3, limite_cupons: 100, cupons_emitidos: 2, data_inicio: '2025-06-01', data_fim: '2025-12-31', ativo: true },
    ];
}
function getMockCupons() {
    return [
        { id: 1, embaixador_id: 1, mecanica_id: 1, codigo: 'JOAO101', data_criacao: '2025-06-02T10:00:00Z', embaixadores: { nome: 'João da Silva', cpf: '12345678901' }, mecanicas: { nome: 'Promoção Revisão 2025', beneficio_cliente: '10% desconto' } },
        { id: 2, embaixador_id: 2, mecanica_id: 1, codigo: 'MARIA202', data_criacao: '2025-06-06T14:00:00Z', embaixadores: { nome: 'Maria Oliveira', cpf: '98765432100' }, mecanicas: { nome: 'Promoção Revisão 2025', beneficio_cliente: '10% desconto' } },
    ];
}
function getMockIndicacoes() {
    return [
        { id: 1, cupom_id: 1, codigo_usado: 'JOAO101', nome_indicado: 'Carlos Souza', telefone_indicado: '11977665544', data_uso: '2025-06-10T09:00:00Z', servico: 'Troca de óleo', cupons: { codigo: 'JOAO101', embaixadores: { nome: 'João da Silva' } } },
    ];
}

// =========================================================
//  SUPABASE QUERIES  (com fallback mock)
// =========================================================
async function fetchEmbaixadores() {
    if (USE_MOCK_DATA) return getMockEmbaixadores();
    const { data, error } = await supabaseClient.from('embaixadores').select('*').order('data_cadastro', { ascending: false });
    if (error) { console.error('fetchEmbaixadores:', error); return []; }
    return data || [];
}

async function fetchMecanicas() {
    if (USE_MOCK_DATA) return getMockMecanicas();
    const { data, error } = await supabaseClient.from('mecanicas').select('*').order('data_criacao', { ascending: false });
    if (error) { console.error('fetchMecanicas:', error); return []; }
    return data || [];
}

async function fetchMecanicasValidas() {
    const all = await fetchMecanicas();
    const hoje = new Date().toISOString().slice(0, 10);
    return all.filter(m => m.ativo && m.data_inicio <= hoje && m.data_fim >= hoje && (m.cupons_emitidos || 0) < m.limite_cupons);
}

async function fetchCupons() {
    if (USE_MOCK_DATA) return getMockCupons();
    const { data, error } = await supabaseClient
        .from('cupons')
        .select('*, embaixadores(nome, cpf, telefone), mecanicas(nome, beneficio_cliente, beneficio_embaixador, meta_validacoes)')
        .order('data_criacao', { ascending: false });
    if (error) { console.error('fetchCupons:', error); return []; }
    return data || [];
}

async function fetchCuponsByEmbaixador(embId) {
    if (USE_MOCK_DATA) return getMockCupons().filter(c => c.embaixador_id === embId);
    const { data, error } = await supabaseClient
        .from('cupons')
        .select('*, mecanicas(nome, beneficio_cliente, beneficio_embaixador, meta_validacoes)')
        .eq('embaixador_id', embId)
        .order('data_criacao', { ascending: false });
    if (error) { console.error('fetchCuponsByEmb:', error); return []; }
    return data || [];
}

async function fetchIndicacoes() {
    if (USE_MOCK_DATA) return getMockIndicacoes();
    const { data, error } = await supabaseClient
        .from('indicacoes')
        .select('*, cupons(codigo, embaixadores(nome, cpf))')
        .order('data_uso', { ascending: false })
        .limit(20);
    if (error) { console.error('fetchIndicacoes:', error); return []; }
    return data || [];
}

async function fetchIndicacoesByCupomIds(cupomIds) {
    if (!cupomIds.length) return [];
    if (USE_MOCK_DATA) return getMockIndicacoes().filter(i => cupomIds.includes(i.cupom_id));
    const { data, error } = await supabaseClient
        .from('indicacoes')
        .select('*')
        .in('cupom_id', cupomIds)
        .order('data_uso', { ascending: false });
    if (error) { console.error('fetchIndicacoesByCupomIds:', error); return []; }
    return data || [];
}

async function fetchCupomByCode(code) {
    if (USE_MOCK_DATA) { const c = getMockCupons().find(cu => cu.codigo === code.toUpperCase()); return c || null; }
    const { data, error } = await supabaseClient
        .from('cupons')
        .select('*, embaixadores(nome, cpf, telefone), mecanicas(nome, beneficio_cliente, beneficio_embaixador, meta_validacoes, data_fim)')
        .eq('codigo', code.toUpperCase())
        .single();
    if (error) { console.error('fetchCupomByCode:', error); return null; }
    return data;
}

async function fetchEmbaixadorByCPF(cpf) {
    const clean = cleanCPF(cpf);
    if (USE_MOCK_DATA) return getMockEmbaixadores().find(e => e.cpf === clean) || null;
    const { data, error } = await supabaseClient.from('embaixadores').select('*').eq('cpf', clean).single();
    if (error) return null;
    return data;
}

async function countValidacoesByCupom(cupomId) {
    if (USE_MOCK_DATA) return getMockIndicacoes().filter(i => i.cupom_id === cupomId).length;
    const { count, error } = await supabaseClient
        .from('indicacoes')
        .select('id', { count: 'exact', head: true })
        .eq('cupom_id', cupomId);
    if (error) return 0;
    return count || 0;
}

// =========================================================
//  TAB NAVIGATION
// =========================================================
function initTabs() {
    $$('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            $$('.tab-content').forEach(tc => tc.classList.remove('active'));
            const target = btn.getAttribute('data-tab');
            $(`#${target}`).classList.add('active');
            if (target === 'tab-dashboard') loadDashboard();
            if (target === 'tab-mecanicas') loadMecanicasList();
            if (target === 'tab-criar-cupom') loadCupomForm();
        });
    });
}

function showDetalheEmbaixador() {
    $$('.tab-content').forEach(tc => tc.classList.remove('active'));
    $('#tab-detalhe-embaixador').classList.add('active');
}

// =========================================================
//  DASHBOARD
// =========================================================
async function loadDashboard() {
    showLoading();
    try {
        const [embs, cupons, indicacoes, mecanicas] = await Promise.all([
            fetchEmbaixadores(), fetchCupons(), fetchIndicacoes(), fetchMecanicas()
        ]);

        // Stats
        $('#st-emb').textContent = embs.length;
        $('#st-cup').textContent = cupons.length;
        $('#st-val').textContent = indicacoes.length;
        $('#st-mec').textContent = mecanicas.length;

        // Ambassadors list
        const listEl = $('#ambassadors-list');
        if (!embs.length) {
            listEl.innerHTML = '<p class="empty-state">Nenhum embaixador cadastrado.</p>';
        } else {
            // Count cupons per embaixador
            const cuponsPerEmb = {};
            cupons.forEach(c => { cuponsPerEmb[c.embaixador_id] = (cuponsPerEmb[c.embaixador_id] || 0) + 1; });
            // Count validações per embaixador (via cupons)
            const cupomToEmb = {};
            cupons.forEach(c => { cupomToEmb[c.id] = c.embaixador_id; });
            const validPerEmb = {};
            indicacoes.forEach(ind => {
                const embId = cupomToEmb[ind.cupom_id];
                if (embId) validPerEmb[embId] = (validPerEmb[embId] || 0) + 1;
            });

            listEl.innerHTML = embs.map(e => `
                <div class="card-item clickable" data-emb-id="${e.id}">
                    <div class="card-item-header">
                        <strong>${e.nome}</strong>
                        <span class="badge">${cuponsPerEmb[e.id] || 0} cupons</span>
                    </div>
                    <div class="card-item-body">
                        <span>CPF: ${formatCPF(e.cpf)}</span>
                        <span>Validações: ${validPerEmb[e.id] || 0}</span>
                        <span>Desde: ${formatDate(e.data_cadastro)}</span>
                    </div>
                </div>
            `).join('');

            // Click handler
            listEl.querySelectorAll('.card-item.clickable').forEach(card => {
                card.addEventListener('click', () => {
                    const embId = parseInt(card.getAttribute('data-emb-id'));
                    const emb = embs.find(e => e.id === embId);
                    if (emb) openDetalheEmbaixador(emb);
                });
            });
        }

        // Recent validations
        const valEl = $('#recent-validations');
        if (!indicacoes.length) {
            valEl.innerHTML = '<p class="empty-state">Nenhuma validação registrada.</p>';
        } else {
            valEl.innerHTML = indicacoes.slice(0, 10).map(ind => {
                const embNome = ind.cupons?.embaixadores?.nome || '-';
                return `
                    <div class="card-item">
                        <div class="card-item-header">
                            <strong>${ind.nome_indicado}</strong>
                            <span class="badge badge-green">✅</span>
                        </div>
                        <div class="card-item-body">
                            <span>Cupom: ${ind.codigo_usado}</span>
                            <span>Embaixador: ${embNome}</span>
                            <span>Data: ${formatDate(ind.data_uso)}</span>
                        </div>
                    </div>`;
            }).join('');
        }
    } catch (err) {
        console.error('loadDashboard:', err);
        showToast('Erro ao carregar dashboard', 'error');
    }
    hideLoading();
}

// =========================================================
//  DETALHE DO EMBAIXADOR
// =========================================================
async function openDetalheEmbaixador(emb) {
    currentEmbaixadorDetalhe = emb;
    $('#det-nome').textContent = emb.nome;
    $('#det-info').textContent = `CPF: ${formatCPF(emb.cpf)} · Tel: ${formatPhone(emb.telefone || '')}`;
    showDetalheEmbaixador();
    showLoading();

    const cupons = await fetchCuponsByEmbaixador(emb.id);
    const cupomIds = cupons.map(c => c.id);
    const indicacoes = await fetchIndicacoesByCupomIds(cupomIds);

    // Cupons list
    const cupEl = $('#det-cupons');
    if (!cupons.length) {
        cupEl.innerHTML = '<p class="empty-state">Nenhum cupom vinculado.</p>';
    } else {
        cupEl.innerHTML = cupons.map(c => {
            const valCount = indicacoes.filter(i => i.cupom_id === c.id).length;
            const mecNome = c.mecanicas?.nome || '-';
            const meta = c.mecanicas?.meta_validacoes || '?';
            return `
                <div class="card-item">
                    <div class="card-item-header">
                        <strong>🎫 ${c.codigo}</strong>
                        <span class="badge">${valCount}/${meta} validações</span>
                    </div>
                    <div class="card-item-body">
                        <span>Mecânica: ${mecNome}</span>
                        <span>Criado: ${formatDate(c.data_criacao)}</span>
                    </div>
                </div>`;
        }).join('');
    }

    // Validations list
    const valEl = $('#det-validacoes');
    if (!indicacoes.length) {
        valEl.innerHTML = '<p class="empty-state">Nenhuma validação encontrada.</p>';
    } else {
        valEl.innerHTML = indicacoes.map(ind => `
            <div class="card-item">
                <div class="card-item-header">
                    <strong>${ind.nome_indicado}</strong>
                    <span class="badge badge-green">${formatDate(ind.data_uso)}</span>
                </div>
                <div class="card-item-body">
                    <span>Cupom: ${ind.codigo_usado}</span>
                    <span>Tel: ${ind.telefone_indicado || '-'}</span>
                    <span>${ind.servico || ''}</span>
                </div>
            </div>
        `).join('');
    }
    hideLoading();
}

// =========================================================
//  CADASTRAR EMBAIXADOR
// =========================================================
async function cadastrarEmbaixador() {
    const nome = $('#reg-nome').value.trim();
    const cpf = cleanCPF($('#reg-cpf').value);
    const telefone = $('#reg-tel').value.replace(/\D/g, '');

    if (!nome || cpf.length !== 11 || telefone.length < 10) {
        showToast('Preencha todos os campos corretamente.', 'error');
        return;
    }

    showLoading();
    try {
        if (USE_MOCK_DATA) {
            showToast(`Embaixador "${nome}" cadastrado! (mock)`, 'success');
        } else {
            const { error } = await supabaseClient.from('embaixadores').insert({
                nome, cpf, telefone
            });
            if (error) {
                if (error.code === '23505') showToast('CPF já cadastrado!', 'error');
                else { console.error(error); showToast('Erro ao cadastrar: ' + error.message, 'error'); }
                hideLoading();
                return;
            }
            showToast(`Embaixador "${nome}" cadastrado com sucesso!`, 'success');
        }
        $('#reg-nome').value = '';
        $('#reg-cpf').value = '';
        $('#reg-tel').value = '';
    } catch (err) {
        console.error(err);
        showToast('Erro inesperado', 'error');
    }
    hideLoading();
}

// =========================================================
//  MECÂNICAS CRUD
// =========================================================
async function criarMecanica() {
    const nome = $('#mec-nome').value.trim();
    const descricao = $('#mec-descricao').value.trim();
    const beneficio_embaixador = $('#mec-benef-emb').value.trim();
    const meta_validacoes = parseInt($('#mec-meta').value) || 0;
    const beneficio_cliente = $('#mec-benef-cli').value.trim();
    const limite_cupons = parseInt($('#mec-limite').value) || 0;
    const data_inicio = $('#mec-inicio').value;
    const data_fim = $('#mec-fim').value;

    if (!nome || !beneficio_embaixador || !beneficio_cliente || !meta_validacoes || !limite_cupons || !data_inicio || !data_fim) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }
    if (data_fim < data_inicio) {
        showToast('Data fim deve ser após data início.', 'error');
        return;
    }

    showLoading();
    try {
        if (USE_MOCK_DATA) {
            showToast(`Mecânica "${nome}" criada! (mock)`, 'success');
        } else {
            const { error } = await supabaseClient.from('mecanicas').insert({
                nome, descricao, beneficio_embaixador, beneficio_cliente,
                meta_validacoes, limite_cupons, cupons_emitidos: 0,
                data_inicio, data_fim, ativo: true
            });
            if (error) { console.error(error); showToast('Erro: ' + error.message, 'error'); hideLoading(); return; }
            showToast(`Mecânica "${nome}" criada com sucesso!`, 'success');
        }
        // Clear form
        $('#mec-nome').value = '';
        $('#mec-descricao').value = '';
        $('#mec-benef-emb').value = '';
        $('#mec-meta').value = '3';
        $('#mec-benef-cli').value = '';
        $('#mec-limite').value = '100';
        $('#mec-inicio').value = '';
        $('#mec-fim').value = '';
        loadMecanicasList();
    } catch (err) {
        console.error(err);
        showToast('Erro inesperado', 'error');
    }
    hideLoading();
}

async function loadMecanicasList() {
    const mecanicas = await fetchMecanicas();
    cachedMecanicas = mecanicas;
    const listEl = $('#mecanicas-list');
    if (!mecanicas.length) {
        listEl.innerHTML = '<p class="empty-state">Nenhuma mecânica cadastrada.</p>';
        return;
    }
    const hoje = new Date().toISOString().slice(0, 10);
    listEl.innerHTML = mecanicas.map(m => {
        const vigente = m.ativo && m.data_inicio <= hoje && m.data_fim >= hoje;
        const saldo = m.limite_cupons - (m.cupons_emitidos || 0);
        return `
            <div class="card-item ${vigente ? '' : 'card-inactive'}">
                <div class="card-item-header">
                    <strong>${m.nome}</strong>
                    <span class="badge ${vigente ? 'badge-green' : 'badge-red'}">${vigente ? 'Vigente' : 'Inativa'}</span>
                </div>
                <div class="card-item-body">
                    <span>🎁 Embaixador: ${m.beneficio_embaixador}</span>
                    <span>🎁 Cliente: ${m.beneficio_cliente}</span>
                </div>
                <div class="card-item-body">
                    <span>Meta: ${m.meta_validacoes} validações</span>
                    <span>Saldo: ${saldo}/${m.limite_cupons} cupons</span>
                    <span>Validade: ${formatDate(m.data_inicio)} - ${formatDate(m.data_fim)}</span>
                </div>
                <div class="card-item-actions">
                    <button class="btn btn-sm ${m.ativo ? 'btn-danger' : 'btn-success'}" onclick="toggleMecanica(${m.id}, ${m.ativo})">${m.ativo ? 'Desativar' : 'Ativar'}</button>
                </div>
            </div>`;
    }).join('');
}

async function toggleMecanica(id, currentAtivo) {
    if (USE_MOCK_DATA) { showToast('Mock: toggle mecânica'); return; }
    showLoading();
    const { error } = await supabaseClient.from('mecanicas').update({ ativo: !currentAtivo }).eq('id', id);
    if (error) { showToast('Erro: ' + error.message, 'error'); }
    else { showToast(currentAtivo ? 'Mecânica desativada' : 'Mecânica ativada'); }
    hideLoading();
    loadMecanicasList();
}

// =========================================================
//  CRIAR CUPOM
// =========================================================
async function loadCupomForm() {
    // Load valid mecânicas into select
    const validas = await fetchMecanicasValidas();
    const sel = $('#cup-mecanica');
    sel.innerHTML = '<option value="">Selecione uma mecânica...</option>';
    validas.forEach(m => {
        const saldo = m.limite_cupons - (m.cupons_emitidos || 0);
        sel.innerHTML += `<option value="${m.id}">${m.nome} (saldo: ${saldo})</option>`;
    });
}

async function onCupomCPFBlur() {
    const cpf = $('#cup-cpf').value;
    const infoEl = $('#cup-emb-info');
    if (cleanCPF(cpf).length !== 11) { infoEl.style.display = 'none'; return; }
    const emb = await fetchEmbaixadorByCPF(cpf);
    if (emb) {
        infoEl.style.display = 'block';
        infoEl.innerHTML = `<strong>✅ ${emb.nome}</strong> · Tel: ${formatPhone(emb.telefone || '')}`;
        infoEl.className = 'info-box info-success';
    } else {
        infoEl.style.display = 'block';
        infoEl.innerHTML = '❌ CPF não encontrado. Cadastre o embaixador primeiro.';
        infoEl.className = 'info-box info-error';
    }
}

function onMecanicaSelect() {
    const id = parseInt($('#cup-mecanica').value);
    const infoEl = $('#cup-mec-info');
    if (!id) { infoEl.style.display = 'none'; return; }
    const mec = cachedMecanicas.find(m => m.id === id);
    if (mec) {
        infoEl.style.display = 'block';
        infoEl.innerHTML = `
            <strong>${mec.nome}</strong><br>
            🎁 Embaixador: ${mec.beneficio_embaixador}<br>
            🎁 Cliente: ${mec.beneficio_cliente}<br>
            🎯 Meta: ${mec.meta_validacoes} validações · Validade: até ${formatDate(mec.data_fim)}
        `;
        infoEl.className = 'info-box info-success';
    }
}

async function criarCupom() {
    const cpf = cleanCPF($('#cup-cpf').value);
    const mecanicaId = parseInt($('#cup-mecanica').value);
    const codigo = $('#cup-codigo').value.trim().toUpperCase();

    if (cpf.length !== 11) { showToast('CPF inválido.', 'error'); return; }
    if (!mecanicaId) { showToast('Selecione uma mecânica.', 'error'); return; }
    if (!codigo) { showToast('Informe o código do cupom.', 'error'); return; }

    showLoading();
    try {
        const emb = await fetchEmbaixadorByCPF(cpf);
        if (!emb) { showToast('Embaixador não encontrado. Cadastre primeiro.', 'error'); hideLoading(); return; }

        if (USE_MOCK_DATA) {
            showToast(`Cupom ${codigo} criado! (mock)`, 'success');
        } else {
            // Insert cupom
            const { error: errCup } = await supabaseClient.from('cupons').insert({
                embaixador_id: emb.id,
                mecanica_id: mecanicaId,
                codigo
            });
            if (errCup) {
                if (errCup.code === '23505') showToast('Código já existe! Escolha outro.', 'error');
                else showToast('Erro: ' + errCup.message, 'error');
                hideLoading(); return;
            }
            // Increment cupons_emitidos in mecânica
            await supabaseClient.rpc('increment_cupons_emitidos', { mec_id: mecanicaId }).catch(() => {
                // Fallback: manual update
                supabaseClient.from('mecanicas')
                    .update({ cupons_emitidos: (cachedMecanicas.find(m => m.id === mecanicaId)?.cupons_emitidos || 0) + 1 })
                    .eq('id', mecanicaId);
            });
            showToast(`Cupom ${codigo} criado com sucesso!`, 'success');
        }
        $('#cup-cpf').value = '';
        $('#cup-codigo').value = '';
        $('#cup-emb-info').style.display = 'none';
        $('#cup-mec-info').style.display = 'none';
    } catch (err) {
        console.error(err);
        showToast('Erro inesperado', 'error');
    }
    hideLoading();
}

// =========================================================
//  VALIDAR CUPOM
// =========================================================
async function validarCupom() {
    const code = $('#search-coupon').value.trim().toUpperCase();
    if (!code) { showToast('Digite o código do cupom.', 'error'); return; }

    showLoading();
    const cupom = await fetchCupomByCode(code);
    const resultEl = $('#validation-result');
    const formEl = $('#use-coupon-form');

    if (!cupom) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = '<div class="info-box info-error">❌ Cupom não encontrado.</div>';
        formEl.style.display = 'none';
        hideLoading();
        return;
    }

    // Check mecânica validity
    const mecValidade = cupom.mecanicas?.data_fim;
    const hoje = new Date().toISOString().slice(0, 10);
    const expirado = mecValidade && mecValidade < hoje;

    const valCount = await countValidacoesByCupom(cupom.id);

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
        <div class="info-box info-success">
            <strong>✅ Cupom Encontrado: ${cupom.codigo}</strong><br>
            👤 Embaixador: ${cupom.embaixadores?.nome || '-'} (CPF: ${formatCPF(cupom.embaixadores?.cpf || '')})<br>
            ⚙️ Mecânica: ${cupom.mecanicas?.nome || '-'}<br>
            🎁 Benefício cliente: ${cupom.mecanicas?.beneficio_cliente || '-'}<br>
            📊 Validações: ${valCount}/${cupom.mecanicas?.meta_validacoes || '?'}<br>
            ${expirado ? '<span style="color:var(--color-error)">⚠️ MECÂNICA EXPIRADA</span>' : ''}
        </div>`;

    if (!expirado) {
        formEl.style.display = 'block';
        formEl.setAttribute('data-cupom-id', cupom.id);
        formEl.setAttribute('data-cupom-code', cupom.codigo);
    } else {
        formEl.style.display = 'none';
    }
    hideLoading();
}

async function confirmarUso() {
    const formEl = $('#use-coupon-form');
    const cupomId = parseInt(formEl.getAttribute('data-cupom-id'));
    const cupomCode = formEl.getAttribute('data-cupom-code');
    const nomeIndicado = $('#indicado-name').value.trim();
    const telefoneIndicado = $('#indicado-phone').value.replace(/\D/g, '');
    const servico = $('#observations').value.trim();

    if (!nomeIndicado) { showToast('Informe o nome do cliente.', 'error'); return; }

    showLoading();
    try {
        if (USE_MOCK_DATA) {
            showToast('Validação registrada! (mock)', 'success');
        } else {
            const { error } = await supabaseClient.from('indicacoes').insert({
                cupom_id: cupomId,
                codigo_usado: cupomCode,
                nome_indicado: nomeIndicado,
                telefone_indicado: telefoneIndicado,
                servico,
                data_uso: new Date().toISOString(),
                status: 'validado'
            });
            if (error) { showToast('Erro: ' + error.message, 'error'); hideLoading(); return; }
            showToast('✅ Validação registrada com sucesso!', 'success');
        }
        // Reset
        $('#search-coupon').value = '';
        $('#indicado-name').value = '';
        $('#indicado-phone').value = '';
        $('#observations').value = '';
        $('#validation-result').style.display = 'none';
        formEl.style.display = 'none';
    } catch (err) {
        console.error(err);
        showToast('Erro inesperado', 'error');
    }
    hideLoading();
}

// =========================================================
//  CLIENT LINK
// =========================================================
function setupClientLink() {
    const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
    const link = baseUrl + 'cliente.html';
    $('#client-link-url').textContent = link;
    $('#btn-copy-link').addEventListener('click', () => {
        navigator.clipboard.writeText(link).then(() => showToast('Link copiado!')).catch(() => {
            const ta = document.createElement('textarea'); ta.value = link;
            document.body.appendChild(ta); ta.select(); document.execCommand('copy');
            document.body.removeChild(ta); showToast('Link copiado!');
        });
    });
}

// =========================================================
//  MASKS
// =========================================================
function setupMasks() {
    ['#reg-cpf', '#cup-cpf'].forEach(sel => {
        const el = $(sel);
        if (el) el.addEventListener('input', (e) => { e.target.value = formatCPF(e.target.value); });
    });
    ['#reg-tel', '#indicado-phone'].forEach(sel => {
        const el = $(sel);
        if (el) el.addEventListener('input', (e) => { e.target.value = formatPhone(e.target.value); });
    });
}

// =========================================================
//  INIT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    setupMasks();
    setupClientLink();

    // Buttons
    $('#btn-cadastrar-emb').addEventListener('click', cadastrarEmbaixador);
    $('#btn-criar-mecanica').addEventListener('click', criarMecanica);
    $('#btn-criar-cupom').addEventListener('click', criarCupom);
    $('#btn-validate').addEventListener('click', validarCupom);
    $('#btn-mark-used').addEventListener('click', confirmarUso);
    $('#btn-gerar-codigo').addEventListener('click', () => {
        const cpfVal = $('#cup-cpf').value;
        const nome = cpfVal ? '' : 'BOX';
        // Try to get name from emb info
        const infoEl = $('#cup-emb-info');
        const embName = infoEl.textContent.replace('✅', '').trim().split('·')[0].trim();
        $('#cup-codigo').value = generateCode(embName || nome);
    });

    // CPF blur on cupom form
    $('#cup-cpf').addEventListener('blur', onCupomCPFBlur);
    $('#cup-mecanica').addEventListener('change', onMecanicaSelect);

    // Back from detalhe
    $('#back-from-detalhe').addEventListener('click', () => {
        $$('.tab-content').forEach(tc => tc.classList.remove('active'));
        $('#tab-dashboard').classList.add('active');
        loadDashboard();
    });

    // Load dashboard
    loadDashboard();
});
