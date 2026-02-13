<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Ganhadores</h1>

    <!-- Cards de Resumo -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card color="#F97316" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalGanhadores }}</div>
              <div class="text-subtitle-1 mt-1">Total Ganhadores</div>
            </div>
            <v-icon size="48" icon="mdi-trophy" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#10B981" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalValidacoes }}</div>
              <div class="text-subtitle-1 mt-1">Total Validações</div>
            </div>
            <v-icon size="48" icon="mdi-check-decagram" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#3B82F6" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.cuponsComMeta }}</div>
              <div class="text-subtitle-1 mt-1">Cupons com Meta</div>
            </div>
            <v-icon size="48" icon="mdi-ticket-percent" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="#8B5CF6" theme="dark" class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.embaixadoresAtivos }}</div>
              <div class="text-subtitle-1 mt-1">Embaixadores Ativos</div>
            </div>
            <v-icon size="48" icon="mdi-account-star" class="opacity-50" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtro -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="filtro"
              label="Buscar por nome do embaixador, cupom ou regra"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="filtrarDados"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtroStatus"
              label="Status"
              :items="['Todos', 'Meta Atingida', 'Em Andamento']"
              variant="outlined"
              density="comfortable"
              @update:model-value="filtrarDados"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtroRegra"
              label="Regra de Cupom"
              :items="regrasDisponiveis"
              item-title="nome"
              item-value="id"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="filtrarDados"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="ganhadoresFiltrados"
        :loading="loading"
        :items-per-page="20"
        class="elevation-1"
      >
        <template v-slot:item.embaixador="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" size="36" class="mr-3">
              <span class="text-white">{{ item.embaixador.nome.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.embaixador.nome }}</div>
              <div class="text-caption text-grey">{{ formatCpf(item.embaixador.cpf) }}</div>
            </div>
          </div>
        </template>
        <template v-slot:item.codigo="{ item }">
          <code class="text-primary font-weight-bold">{{ item.codigo }}</code>
        </template>
        <template v-slot:item.regra="{ item }">
          {{ item.mecanica?.nome || '-' }}
        </template>
        <template v-slot:item.progresso="{ item }">
          <div class="d-flex align-center" style="min-width: 150px;">
            <v-progress-linear
              :model-value="item.progresso"
              :color="item.progresso >= 100 ? 'success' : 'primary'"
              height="20"
              striped
              class="flex-grow-1 mr-2"
            >
              <template #default>
                <span class="text-caption font-weight-bold">{{ item.validadas }}/{{ item.meta }}</span>
              </template>
            </v-progress-linear>
          </div>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.progresso >= 100 ? 'success' : 'warning'"
            size="small"
            label
          >
            {{ item.progresso >= 100 ? 'META ATINGIDA' : 'EM ANDAMENTO' }}
          </v-chip>
        </template>
        <template v-slot:item.beneficio="{ item }">
          <div class="text-body-2">
            <v-icon size="16" color="success" class="mr-1">mdi-gift</v-icon>
            {{ item.mecanica?.beneficioEmbaixador || '-' }}
          </div>
        </template>
        <template v-slot:item.dataAtingimento="{ item }">
          {{ item.dataAtingimento ? formatDate(item.dataAtingimento) : '-' }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()
const loading = ref(false)
const ganhadores = ref<any[]>([])
const filtro = ref('')
const filtroStatus = ref('Todos')
const filtroRegra = ref<number | null>(null)
const regrasDisponiveis = ref<any[]>([])

const stats = ref({
  totalGanhadores: 0,
  totalValidacoes: 0,
  cuponsComMeta: 0,
  embaixadoresAtivos: 0,
})

const headers = [
  { title: 'Embaixador', key: 'embaixador', sortable: true },
  { title: 'Cupom', key: 'codigo', sortable: true },
  { title: 'Regra', key: 'regra', sortable: true },
  { title: 'Progresso', key: 'progresso', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Benefício', key: 'beneficio', sortable: false },
  { title: 'Data Atingimento', key: 'dataAtingimento', sortable: true },
]

const ganhadoresFiltrados = computed(() => {
  let resultado = ganhadores.value

  // Filtro por texto
  if (filtro.value) {
    const termo = filtro.value.toLowerCase()
    resultado = resultado.filter((g) =>
      g.embaixador.nome.toLowerCase().includes(termo) ||
      g.codigo.toLowerCase().includes(termo) ||
      g.mecanica?.nome?.toLowerCase().includes(termo) ||
      g.embaixador.cpf?.includes(termo)
    )
  }

  // Filtro por status
  if (filtroStatus.value === 'Meta Atingida') {
    resultado = resultado.filter((g) => g.progresso >= 100)
  } else if (filtroStatus.value === 'Em Andamento') {
    resultado = resultado.filter((g) => g.progresso < 100)
  }

  // Filtro por regra
  if (filtroRegra.value) {
    resultado = resultado.filter((g) => g.mecanica?.id === filtroRegra.value)
  }

  return resultado
})

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatCpf(cpf: string) {
  if (!cpf || cpf.length !== 11) return cpf
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function filtrarDados() {
  // O computed já faz o filtro automaticamente
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/cupons/ganhadores')
    ganhadores.value = data.ganhadores || []
    stats.value = {
      totalGanhadores: data.stats?.totalGanhadores || 0,
      totalValidacoes: data.stats?.totalValidacoes || 0,
      cuponsComMeta: data.stats?.cuponsComMeta || 0,
      embaixadoresAtivos: data.stats?.embaixadoresAtivos || 0,
    }
    
    // Extrair regras únicas para o filtro
    const regras = new Map()
    ganhadores.value.forEach((g) => {
      if (g.mecanica?.id && !regras.has(g.mecanica.id)) {
        regras.set(g.mecanica.id, { id: g.mecanica.id, nome: g.mecanica.nome })
      }
    })
    regrasDisponiveis.value = Array.from(regras.values())
  } catch (e) {
    snackbar.error('Erro ao carregar ganhadores')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
