<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Dashboard</h1>

    <v-row>
      <v-col cols="12" sm="6" md="3" v-for="card in cards" :key="card.title">
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

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Últimas Indicações</v-card-title>
          <v-data-table
            :headers="headers"
            :items="recentIndicacoes"
            :loading="loading"
            density="compact"
            hide-default-footer
          >
            <template v-slot:item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="small" label>
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.criadoEm="{ item }">
              {{ formatDate(item.criadoEm) }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-card-title>Acesso Rápido</v-card-title>
          <v-card-text>
            <v-btn block color="primary" class="mb-3" to="/cupons">
              <v-icon start>mdi-ticket-percent</v-icon>
              Gerar Cupom
            </v-btn>
            <v-btn block color="secondary" class="mb-3" to="/validacoes">
              <v-icon start>mdi-check-decagram</v-icon>
              Validar Cupom
            </v-btn>
            <v-btn block variant="outlined" color="primary" to="/embaixadores">
              <v-icon start>mdi-account-plus</v-icon>
              Novo Embaixador
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const cards = ref([
  { title: 'Embaixadores', value: '0', icon: 'mdi-account-group', color: 'primary' },
  { title: 'Cupons Ativos', value: '0', icon: 'mdi-ticket-percent', color: 'secondary' },
  { title: 'Indicações', value: '0', icon: 'mdi-check-decagram', color: 'success' },
  { title: 'Mecânicas Ativas', value: '0', icon: 'mdi-cog', color: 'info' },
])

const headers = [
  { title: 'Cupom', key: 'cupom.codigo' },
  { title: 'Embaixador', key: 'cupom.embaixador.nome' },
  { title: 'Cliente', key: 'nomeCliente' },
  { title: 'Status', key: 'status' },
  { title: 'Data', key: 'criadoEm' },
]

const recentIndicacoes = ref([])

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDENTE: 'warning',
    VALIDADO: 'success',
    USADO: 'info',
    CANCELADO: 'error',
  }
  return map[status] || 'grey'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

onMounted(async () => {
  try {
    const [emb, cupons, ind, mec] = await Promise.all([
      api.get('/embaixadores?limit=1'),
      api.get('/cupons?limit=1'),
      api.get('/indicacoes?limit=5'),
      api.get('/mecanicas?status=ATIVA'),
    ])
    cards.value[0].value = String(emb.data.total || 0)
    cards.value[1].value = String(cupons.data.total || 0)
    cards.value[2].value = String(ind.data.total || 0)
    cards.value[3].value = String(mec.data.data?.length || 0)
    recentIndicacoes.value = ind.data.data || []
  } catch (e) {
    console.error('Erro ao carregar dashboard:', e)
  } finally {
    loading.value = false
  }
})
</script>
