<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Cupons</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Gerar Cupom
      </v-btn>
    </div>

    <!-- Cards de Resumo -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card color="#F97316" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.total }}</div>
              <div class="text-subtitle-1 mt-1">Total Cupons</div>
            </div>
            <v-icon size="48" icon="mdi-ticket-percent" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#10B981" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.ativos }}</div>
              <div class="text-subtitle-1 mt-1">Cupons Ativos</div>
            </div>
            <v-icon size="48" icon="mdi-check-circle" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#EF4444" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.expirados }}</div>
              <div class="text-subtitle-1 mt-1">Cupons Expirados</div>
            </div>
            <v-icon size="48" icon="mdi-clock-alert" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#8B5CF6" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.metaAtingida }}</div>
              <div class="text-subtitle-1 mt-1">Meta Atingida</div>
            </div>
            <v-icon size="48" icon="mdi-trophy" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtro -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="searchTerm"
              label="Buscar por código, nome, CPF ou telefone"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              @keyup.enter="searchCupons"
              @click:clear="clearSearch"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" block size="large" @click="searchCupons" :loading="loading">
              <v-icon start>mdi-magnify</v-icon>
              Buscar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        :items-per-page="10"
        @update:options="loadData"
      >
        <template v-slot:item.codigo="{ item }">
          <code 
            class="text-primary font-weight-bold cursor-pointer" 
            style="cursor: pointer;"
            @click="showCupomDetails(item)"
          >{{ item.codigo }}</code>
        </template>
        <template v-slot:item.embaixador="{ item }">
          {{ item.embaixador?.nome || '-' }}
        </template>
        <template v-slot:item.mecanica="{ item }">
          {{ item.mecanica?.nome || '-' }}
        </template>
        <template v-slot:item.meta="{ item }">
          <div class="d-flex align-center">
            <v-chip
              :color="getMetaStatus(item).color"
              size="small"
              label
            >
              {{ item._count?.indicacoes || 0 }}/{{ item.mecanica?.metaValidacoes || '-' }}
            </v-chip>
            <v-icon 
              v-if="getMetaStatus(item).atingida" 
              size="16" 
              color="success" 
              class="ml-1"
            >mdi-check-circle</v-icon>
          </div>
        </template>
        <template v-slot:item.criadoEm="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template v-slot:item.expiraEm="{ item }">
          <span :class="isExpired(item.mecanica?.dataFim) ? 'text-error' : ''">
            {{ formatDate(item.mecanica?.dataFim) }}
            <v-chip v-if="isExpired(item.mecanica?.dataFim)" size="x-small" color="error" class="ml-1">EXPIRADO</v-chip>
          </span>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="700" persistent>
      <v-card>
        <v-card-title class="d-flex align-center pa-4" style="background-color: #000; color: #fff;">
          <v-icon color="primary" class="mr-2">mdi-ticket-percent</v-icon>
          Gerar Novo Cupom
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="form" @submit.prevent="save">
            <!-- Embaixador -->
            <v-autocomplete
              v-model="formData.embaixadorId"
              label="Embaixador *"
              :items="embaixadores"
              item-title="nome"
              item-value="id"
              :rules="[r.required]"
              :loading="loadingEmb"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="`CPF: ${item.raw.cpf}`" />
              </template>
            </v-autocomplete>

            <!-- Regra de Cupom -->
            <v-select
              v-model="formData.mecanicaId"
              label="Regra de Cupom *"
              :items="mecanicas"
              item-title="nome"
              item-value="id"
              :rules="[r.required]"
              :loading="loadingMec"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="item.raw.beneficioCliente" />
              </template>
            </v-select>

            <!-- Código Section -->
            <div class="text-subtitle-2 text-grey-darken-2 mb-2 d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-barcode</v-icon>
              Código do Cupom *
              <v-spacer />
              <v-tooltip location="top" max-width="300">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                </template>
                Código único que o cliente compartilha para utilizar o cupom. Pode ser auto-gerado ou digitado manualmente.
              </v-tooltip>
            </div>

            <div class="d-flex gap-2 mb-4">
              <v-text-field
                v-model="formData.codigo"
                label="Ex: BOX73-DGNI"
                :rules="[r.required, r.minLength]"
                variant="outlined"
                density="comfortable"
                placeholder="Digite ou gere automaticamente"
                class="flex-grow-1"
                :disabled="saving"
                counter="15"
                maxlength="15"
              />
              <v-btn
                variant="tonal"
                color="secondary"
                @click="generateCode"
                :disabled="saving"
                icon
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </div>

            <!-- Success message -->
            <v-alert
              v-if="generatedCode"
              type="success"
              variant="elevated"
              class="mb-4"
              elevation="2"
            >
              <v-row align="center" class="ga-4">
                <v-col cols="auto">
                  <v-icon size="32" color="success">mdi-check-circle</v-icon>
                </v-col>
                <v-col>
                  <div class="text-h5 font-weight-bold text-success">{{ generatedCode }}</div>
                  <div class="text-body-2 text-grey-darken-1">Cupom gerado com sucesso!</div>
                </v-col>
              </v-row>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
            :disabled="saving"
          >
            {{ generatedCode ? 'Fechar' : 'Cancelar' }}
          </v-btn>
          <v-btn
            v-show="!generatedCode"
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="save"
          >
            <v-icon start>mdi-plus</v-icon>
            Gerar Cupom
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Drawer de Detalhes do Cupom -->
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      temporary
      width="400"
    >
      <template v-if="selectedCupom">
        <v-card flat>
          <v-card-title class="d-flex align-center pa-4" style="background-color: #000; color: #fff;">
            <v-icon color="primary" class="mr-2">mdi-ticket-percent</v-icon>
            Detalhes do Cupom
            <v-spacer />
            <v-btn icon variant="text" color="white" @click="drawerOpen = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="text-h5 font-weight-bold text-primary mb-4">{{ selectedCupom.codigo }}</div>
            
            <v-divider class="mb-4" />
            
            <div class="d-flex flex-column ga-3">
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="primary">mdi-account-star</v-icon>
                <div>
                  <div class="text-caption text-grey">Embaixador</div>
                  <div class="font-weight-medium">{{ selectedCupom.embaixador?.nome || '-' }}</div>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="secondary">mdi-ticket-percent</v-icon>
                <div>
                  <div class="text-caption text-grey">Regra de Cupom</div>
                  <div class="font-weight-medium">{{ selectedCupom.mecanica?.nome || '-' }}</div>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="success">mdi-gift</v-icon>
                <div>
                  <div class="text-caption text-grey">Benefício Cliente</div>
                  <div class="font-weight-medium">{{ selectedCupom.mecanica?.beneficioCliente || '-' }}</div>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="warning">mdi-star</v-icon>
                <div>
                  <div class="text-caption text-grey">Benefício Embaixador</div>
                  <div class="font-weight-medium">{{ selectedCupom.mecanica?.beneficioEmbaixador || '-' }}</div>
                </div>
              </div>
              
              <v-divider />
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="info">mdi-calendar</v-icon>
                <div>
                  <div class="text-caption text-grey">Criado em</div>
                  <div class="font-weight-medium">{{ formatDate(selectedCupom.createdAt) }}</div>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" :color="isExpired(selectedCupom.mecanica?.dataFim) ? 'error' : 'grey'">mdi-calendar-clock</v-icon>
                <div>
                  <div class="text-caption text-grey">Expira em</div>
                  <div class="font-weight-medium" :class="isExpired(selectedCupom.mecanica?.dataFim) ? 'text-error' : ''">
                    {{ formatDate(selectedCupom.mecanica?.dataFim) }}
                    <v-chip v-if="isExpired(selectedCupom.mecanica?.dataFim)" size="x-small" color="error" class="ml-2">EXPIRADO</v-chip>
                  </div>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" :color="selectedCupom.ativo ? 'success' : 'error'">mdi-check-circle</v-icon>
                <div>
                  <div class="text-caption text-grey">Status</div>
                  <v-chip size="small" :color="selectedCupom.ativo ? 'success' : 'error'">
                    {{ selectedCupom.ativo ? 'Ativo' : 'Inativo' }}
                  </v-chip>
                </div>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-3" color="primary">mdi-counter</v-icon>
                <div>
                  <div class="text-caption text-grey">Validações</div>
                  <div class="font-weight-medium">{{ selectedCupom._count?.indicacoes || 0 }}</div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const loadingEmb = ref(false)
const loadingMec = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const dialog = ref(false)
const generatedCode = ref('')
const embaixadores = ref<any[]>([])
const mecanicas = ref<any[]>([])
const drawerOpen = ref(false)
const selectedCupom = ref<any>(null)
const searchTerm = ref('')
const currentSearch = ref('')

const stats = ref({
  total: 0,
  ativos: 0,
  expirados: 0,
  metaAtingida: 0,
})

const r = {
  required: (v: any) => !!v || 'Obrigatório',
  minLength: (v: string) => (v && v.length >= 5) || 'Mínimo 5 caracteres',
}

const formData = ref({ embaixadorId: null as any, mecanicaId: null as any, codigo: '' })

function generateCode() {
  // Gera código no formato: BOX73-XXXX (4 letras maiúsculas)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = 'BOX73-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  formData.value.codigo = code
}

const headers = [
  { title: 'Código', key: 'codigo' },
  { title: 'Embaixador', key: 'embaixador' },
  { title: 'Regra de Cupom', key: 'mecanica' },
  { title: 'Meta', key: 'meta' },
  { title: 'Criado em', key: 'criadoEm' },
  { title: 'Expira em', key: 'expiraEm' },
]

async function loadData({ page, itemsPerPage }: any = { page: 1, itemsPerPage: 10 }) {
  loading.value = true
  try {
    const params: any = { page, limit: itemsPerPage }
    if (currentSearch.value) {
      params.search = currentSearch.value
    }
    const { data } = await api.get('/cupons', { params })
    items.value = data.data
    total.value = data.total
    calculateStats(data.data)
  } catch (e) {
    snackbar.error('Erro ao carregar cupons')
  } finally {
    loading.value = false
  }
}

function calculateStats(cupons: any[]) {
  const today = new Date()
  let ativos = 0
  let expirados = 0
  let metaAtingida = 0

  cupons.forEach((cupom: any) => {
    const dataFim = cupom.mecanica?.dataFim
    const isExp = dataFim ? new Date(dataFim) < today : false
    
    if (isExp) {
      expirados++
    } else {
      ativos++
    }

    // Verificar se atingiu a meta
    const validacoes = cupom._count?.indicacoes || 0
    const meta = cupom.mecanica?.metaValidacoes || 1
    if (validacoes >= meta) {
      metaAtingida++
    }
  })

  stats.value = {
    total: cupons.length,
    ativos,
    expirados,
    metaAtingida,
  }
}

function getMetaStatus(item: any) {
  const validacoes = item._count?.indicacoes || 0
  const meta = item.mecanica?.metaValidacoes || 1
  const atingida = validacoes >= meta
  return {
    atingida,
    color: atingida ? 'success' : 'warning',
  }
}

function searchCupons() {
  currentSearch.value = searchTerm.value
  loadData({ page: 1, itemsPerPage: 10 })
}

function clearSearch() {
  searchTerm.value = ''
  currentSearch.value = ''
  loadData({ page: 1, itemsPerPage: 10 })
}

async function openDialog() {
  formData.value = { embaixadorId: null, mecanicaId: null, codigo: '' }
  generatedCode.value = ''
  dialog.value = true
  loadingEmb.value = true
  loadingMec.value = true
  try {
    const [emb, mec] = await Promise.all([
      api.get('/embaixadores?limit=200'),
      api.get('/mecanicas/validas'),
    ])
    embaixadores.value = emb.data.data || emb.data
    mecanicas.value = mec.data
  } catch (e) {
    snackbar.error('Erro ao carregar dados')
  } finally {
    loadingEmb.value = false
    loadingMec.value = false
  }
}

function closeDialog() {
  dialog.value = false
  generatedCode.value = ''
}

async function save() {
  const form = formData.value
  if (!form.embaixadorId || !form.mecanicaId || !form.codigo?.trim()) {
    snackbar.error('Preencha todos os campos obrigatórios')
    return
  }
  if (form.codigo.trim().length < 5) {
    snackbar.error('Código deve ter no mínimo 5 caracteres')
    return
  }
  saving.value = true
  try {
    const payload = {
      embaixadorId: Number(formData.value.embaixadorId),
      mecanicaId: Number(formData.value.mecanicaId),
      codigo: formData.value.codigo.trim().toUpperCase(),
    }
    console.log('Enviando cupom:', payload)
    const { data } = await api.post('/cupons', payload)
    generatedCode.value = data.codigo
    snackbar.success('Cupom gerado com sucesso!')
    await new Promise(resolve => setTimeout(resolve, 1500))
    loadData()
    closeDialog()
  } catch (e: any) {
    const msg = e.response?.data?.message
    // Validação de código duplicado
    if (msg && (msg.includes('já existe') || msg.includes('duplicate') || msg.includes('Código'))) {
      snackbar.error(`Este código já foi utilizado. Por favor, gere um novo.`)
      generateCode() // Auto-gera novo código para o usuário
    } else {
      snackbar.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao gerar cupom')
    }
  } finally {
    saving.value = false
  }
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

function isExpired(d: string) {
  if (!d) return false
  return new Date(d) < new Date()
}

function showCupomDetails(cupom: any) {
  selectedCupom.value = cupom
  drawerOpen.value = true
}

async function loadStats() {
  try {
    // Carregar todos os cupons para estatísticas totais
    const { data } = await api.get('/cupons', { params: { limit: 1000 } })
    const cupons = data.data || []
    const today = new Date()
    
    let ativos = 0
    let expirados = 0
    let metaAtingida = 0

    cupons.forEach((cupom: any) => {
      const dataFim = cupom.mecanica?.dataFim
      const isExp = dataFim ? new Date(dataFim) < today : false
      
      if (isExp) {
        expirados++
      } else {
        ativos++
      }

      const validacoes = cupom._count?.indicacoes || 0
      const meta = cupom.mecanica?.metaValidacoes || 1
      if (validacoes >= meta) {
        metaAtingida++
      }
    })

    stats.value = {
      total: data.total || cupons.length,
      ativos,
      expirados,
      metaAtingida,
    }
  } catch (e) {
    console.error('Erro ao carregar estatísticas:', e)
  }
}

onMounted(() => {
  loadStats()
  loadData({ page: 1, itemsPerPage: 10 })
})
</script>
