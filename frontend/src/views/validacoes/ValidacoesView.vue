<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Validar Cupom</h1>

    <!-- Cards de Resumo -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3" v-for="card in statsCards" :key="card.title">
        <v-card :color="card.color" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ card.value }}</div>
              <div class="text-subtitle-1 mt-1">{{ card.title }}</div>
            </div>
            <v-icon size="48" :icon="card.icon" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Buscar Cupom</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="codigoBusca"
              label="Código do Cupom"
              prepend-inner-icon="mdi-ticket-percent"
              variant="outlined"
              @keyup.enter="buscarCupom"
              :loading="buscando"
              placeholder="Ex: BOX73-12345"
            />
            <v-btn color="primary" block @click="buscarCupom" :loading="buscando" size="large">
              Buscar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" v-if="cupomEncontrado">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            Cupom: <code class="text-primary">{{ cupomEncontrado.codigo }}</code>
          </v-card-title>
          <v-card-text>
            <div><strong>Embaixador:</strong> {{ cupomEncontrado.embaixador?.nome }}</div>
            <div><strong>Regra de Cupom:</strong> {{ cupomEncontrado.mecanica?.nome }}</div>
            <div><strong>Benefício Cliente:</strong> {{ cupomEncontrado.mecanica?.beneficioCliente }}</div>
            <v-divider class="my-3" />
            <v-form @submit.prevent="validarCupom">
              <v-text-field
                v-model="nomeIndicado"
                label="Nome do Cliente *"
                :rules="[r.required]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="cpfIndicado"
                label="CPF do Cliente *"
                variant="outlined"
                density="comfortable"
                placeholder="000.000.000-00"
                class="mb-2"
                :rules="[r.required]"
                @update:model-value="cpfIndicado = formatCpfMask(cpfIndicado)"
                :error-messages="cpfError"
                @blur="validateCpfField"
              />
              <v-text-field
                v-model="telefoneIndicado"
                label="Telefone do Cliente"
                variant="outlined"
                density="comfortable"
                placeholder="(00) 00000-0000"
                class="mb-2"
                @update:model-value="telefoneIndicado = formatTelefoneMask(telefoneIndicado)"
              />
              <v-textarea
                v-model="observacoes"
                label="Observações"
                rows="2"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />
              <div class="d-flex gap-2">
                <v-btn
                  color="grey"
                  variant="outlined"
                  @click="cancelarValidacao"
                  :disabled="validando"
                  size="large"
                  class="flex-grow-1"
                >
                  Cancelar
                </v-btn>
                <v-btn
                  color="success"
                  type="submit"
                  :loading="validando"
                  size="large"
                  class="flex-grow-1"
                >
                  <v-icon start>mdi-check-circle</v-icon>
                  Validar Cupom
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Últimas Validações</v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="indicacoes"
        :items-length="totalInd"
        :loading="loadingInd"
        :items-per-page="10"
        @update:options="loadIndicacoes"
      >
        <template v-slot:item.cupom.codigo="{ item }">
          <code class="text-primary font-weight-bold">{{ item.cupom?.codigo }}</code>
        </template>
        <template v-slot:item.cupom.embaixador.nome="{ item }">
          <div class="text-body-2">
            <v-icon size="small" class="mr-1" color="primary">mdi-account-circle</v-icon>
            {{ item.cupom?.embaixador?.nome || '-' }}
          </div>
        </template>
        <template v-slot:item.cpfIndicado="{ item }">
          {{ formatCpfDisplay(item.cpfIndicado) }}
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'
import { formatCpfMask, formatTelefoneMask, formatCpfDisplay, formatTelefoneDisplay, cleanDigits, isValidCpf } from '@/utils/masks'

const snackbar = useSnackbarStore()

const codigoBusca = ref('')
const buscando = ref(false)
const cupomEncontrado = ref<any>(null)
const nomeIndicado = ref('')
const cpfIndicado = ref('')
const cpfError = ref('')
const telefoneIndicado = ref('')
const observacoes = ref('')
const validando = ref(false)

const indicacoes = ref<any[]>([])
const totalInd = ref(0)
const loadingInd = ref(false)

// Estatísticas
const statsCards = ref([
  { title: 'Total Cupons', value: '0', icon: 'mdi-ticket-percent', color: 'primary' },
  { title: 'Cupons Ativos', value: '0', icon: 'mdi-check-circle', color: 'secondary' },
  { title: 'Cupons Expirados', value: '0', icon: 'mdi-alert-circle', color: 'success' },
  { title: 'Validações', value: '0', icon: 'mdi-check-decagram', color: 'info' },
])

const r = { required: (v: string) => !!v || 'Obrigatório' }

const headers = [
  { title: 'Cupom', key: 'cupom.codigo', width: '150' },
  { title: 'Embaixador', key: 'cupom.embaixador.nome', width: '200' },
  { title: 'Cliente', key: 'nomeIndicado', width: '200' },
  { title: 'CPF', key: 'cpfIndicado', width: '150' },
  { title: 'Status', key: 'status', width: '120' },
  { title: 'Data', key: 'createdAt', width: '120' },
]

function statusColor(s: string) {
  return { PENDENTE: 'warning', VALIDADO: 'success', USADO: 'info', CANCELADO: 'error' }[s] || 'grey'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

async function buscarCupom() {
  if (!codigoBusca.value) return
  buscando.value = true
  cupomEncontrado.value = null
  try {
    const { data } = await api.get(`/cupons/code/${codigoBusca.value.trim()}`)
    cupomEncontrado.value = data
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Cupom não encontrado')
  } finally {
    buscando.value = false
  }
}

function validateCpfField() {
  const cpfDigits = cleanDigits(cpfIndicado.value)
  if (!cpfDigits || cpfDigits.length === 0) {
    cpfError.value = 'CPF é obrigatório'
    return false
  }
  if (cpfDigits.length < 11) {
    cpfError.value = 'CPF incompleto'
    return false
  } else if (!isValidCpf(cpfDigits)) {
    cpfError.value = 'CPF inválido'
    return false
  } else {
    cpfError.value = ''
    return true
  }
}

function cancelarValidacao() {
  cupomEncontrado.value = null
  nomeIndicado.value = ''
  cpfIndicado.value = ''
  cpfError.value = ''
  telefoneIndicado.value = ''
  observacoes.value = ''
}

async function validarCupom() {
  if (!nomeIndicado.value || !cupomEncontrado.value) return
  
  // Validar CPF obrigatório
  const cpfValido = validateCpfField()
  if (!cpfValido) {
    snackbar.error('CPF é obrigatório e deve ser válido')
    return
  }
  
  validando.value = true
  try {
    const cpfDigits = cleanDigits(cpfIndicado.value)
    const telefoneDigits = cleanDigits(telefoneIndicado.value)
    await api.post('/indicacoes', {
      cupomId: cupomEncontrado.value.id,
      nomeIndicado: nomeIndicado.value,
      cpfIndicado: cpfDigits || undefined,
      telefoneIndicado: telefoneDigits || undefined,
      observacoes: observacoes.value || undefined,
    })
    snackbar.success('Cupom validado com sucesso!')
    cupomEncontrado.value = null
    codigoBusca.value = ''
    nomeIndicado.value = ''
    cpfIndicado.value = ''
    telefoneIndicado.value = ''
    observacoes.value = ''
    carregarEstatisticas()
    loadIndicacoes({ page: 1, itemsPerPage: 10 })
  } catch (e: any) {
    const msg = e.response?.data?.message
    snackbar.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao validar cupom')
  } finally {
    validando.value = false
  }
}



async function loadIndicacoes({ page, itemsPerPage }: any) {
  loadingInd.value = true
  try {
    const { data } = await api.get('/indicacoes', { params: { page, limit: itemsPerPage } })
    indicacoes.value = data.data
    totalInd.value = data.total
  } catch (e) {
    snackbar.error('Erro ao carregar indicações')
  } finally {
    loadingInd.value = false
  }
}

async function carregarEstatisticas() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Total de cupons
    const cuponsRes = await api.get('/cupons?limit=1000')
    const todosCupons = cuponsRes.data.data || []
    const totalCupons = cuponsRes.data.total || 0

    // Contar cupons ativos e expirados
    let cuponsAtivos = 0
    let cuponsExpirados = 0
    
    todosCupons.forEach((cupom: any) => {
      const dataFim = cupom.mecanica?.dataFim
      if (dataFim) {
        const dataFimFormatada = dataFim.split('T')[0]
        if (dataFimFormatada >= today) {
          cuponsAtivos++
        } else {
          cuponsExpirados++
        }
      } else {
        cuponsAtivos++ // Se não tem data fim, considera ativo
      }
    })

    // Cupons validados (indicações)
    const indicacoesRes = await api.get('/indicacoes?limit=1')
    const cuponsValidados = indicacoesRes.data.total || 0

    // Atualizar cards
    if (statsCards.value && statsCards.value.length >= 4) {
      statsCards.value[0].value = String(totalCupons)
      statsCards.value[1].value = String(cuponsAtivos)
      statsCards.value[2].value = String(cuponsExpirados)
      statsCards.value[3].value = String(cuponsValidados)
    }
  } catch (e) {
    console.error('Erro ao carregar estatísticas:', e)
  }
}

onMounted(() => {
  carregarEstatisticas()
  loadIndicacoes({ page: 1, itemsPerPage: 10 })
})
</script>
