<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Validar Cupom</h1>

    <v-row>
      <v-col cols="12" md="6">
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
            />
            <v-btn color="primary" block @click="buscarCupom" :loading="buscando">
              Buscar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" v-if="cupomEncontrado">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            Cupom: <code class="text-primary">{{ cupomEncontrado.codigo }}</code>
          </v-card-title>
          <v-card-text>
            <div><strong>Embaixador:</strong> {{ cupomEncontrado.embaixador?.nome }}</div>
            <div><strong>Mecânica:</strong> {{ cupomEncontrado.mecanica?.nome }}</div>
            <div><strong>Benefício:</strong> {{ cupomEncontrado.mecanica?.beneficio }}</div>
            <v-divider class="my-3" />
            <v-form @submit.prevent="validarCupom">
              <v-text-field v-model="nomeCliente" label="Nome do Cliente *" :rules="[r.required]" />
              <v-text-field v-model="telefoneCliente" label="Telefone do Cliente" />
              <v-textarea v-model="observacao" label="Observação" rows="2" />
              <v-btn color="success" block type="submit" :loading="validando" class="mt-2">
                <v-icon start>mdi-check</v-icon>
                Validar Cupom
              </v-btn>
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
        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.criadoEm="{ item }">
          {{ formatDate(item.criadoEm) }}
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()

const codigoBusca = ref('')
const buscando = ref(false)
const cupomEncontrado = ref<any>(null)
const nomeCliente = ref('')
const telefoneCliente = ref('')
const observacao = ref('')
const validando = ref(false)

const indicacoes = ref<any[]>([])
const totalInd = ref(0)
const loadingInd = ref(false)

const r = { required: (v: string) => !!v || 'Obrigatório' }

const headers = [
  { title: 'Cupom', key: 'cupom.codigo' },
  { title: 'Cliente', key: 'nomeCliente' },
  { title: 'Status', key: 'status' },
  { title: 'Data', key: 'criadoEm' },
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
    const { data } = await api.get(`/cupons/codigo/${codigoBusca.value.trim()}`)
    cupomEncontrado.value = data
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Cupom não encontrado')
  } finally {
    buscando.value = false
  }
}

async function validarCupom() {
  if (!nomeCliente.value || !cupomEncontrado.value) return
  validando.value = true
  try {
    await api.post('/indicacoes', {
      cupomId: cupomEncontrado.value.id,
      nomeCliente: nomeCliente.value,
      telefoneCliente: telefoneCliente.value,
      observacao: observacao.value,
    })
    snackbar.success('Cupom validado com sucesso!')
    cupomEncontrado.value = null
    codigoBusca.value = ''
    nomeCliente.value = ''
    telefoneCliente.value = ''
    observacao.value = ''
    loadIndicacoes({ page: 1, itemsPerPage: 10 })
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Erro ao validar')
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

onMounted(() => loadIndicacoes({ page: 1, itemsPerPage: 10 }))
</script>
