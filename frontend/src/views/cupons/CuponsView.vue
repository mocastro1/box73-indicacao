<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Cupons</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Gerar Cupom
      </v-btn>
    </div>

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
          <code class="text-primary font-weight-bold">{{ item.codigo }}</code>
        </template>
        <template v-slot:item.embaixador="{ item }">
          {{ item.embaixador?.nome || '-' }}
        </template>
        <template v-slot:item.mecanica="{ item }">
          {{ item.mecanica?.nome || '-' }}
        </template>
        <template v-slot:item.criadoEm="{ item }">
          {{ formatDate(item.criadoEm) }}
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card>
        <v-card-title>Gerar Novo Cupom</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-autocomplete
              v-model="formData.embaixadorId"
              label="Embaixador *"
              :items="embaixadores"
              item-title="nome"
              item-value="id"
              :rules="[r.required]"
              :loading="loadingEmb"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>CPF: {{ item.raw.cpf }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-select
              v-model="formData.mecanicaId"
              label="Mecânica *"
              :items="mecanicas"
              item-title="nome"
              item-value="id"
              :rules="[r.required]"
              :loading="loadingMec"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>{{ item.raw.beneficio }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-form>

          <v-alert v-if="generatedCode" type="success" variant="tonal" class="mt-4">
            <div class="text-h5 font-weight-bold text-center">{{ generatedCode }}</div>
            <div class="text-center mt-2">Cupom gerado com sucesso!</div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false; generatedCode = ''">Fechar</v-btn>
          <v-btn v-if="!generatedCode" color="primary" :loading="saving" @click="save">Gerar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

const r = { required: (v: any) => !!v || 'Obrigatório' }
const formData = ref({ embaixadorId: '', mecanicaId: '' })

const headers = [
  { title: 'Código', key: 'codigo' },
  { title: 'Embaixador', key: 'embaixador' },
  { title: 'Mecânica', key: 'mecanica' },
  { title: 'Criado em', key: 'criadoEm' },
]

async function loadData({ page, itemsPerPage }: any = { page: 1, itemsPerPage: 10 }) {
  loading.value = true
  try {
    const { data } = await api.get('/cupons', { params: { page, limit: itemsPerPage } })
    items.value = data.data
    total.value = data.total
  } catch (e) {
    snackbar.error('Erro ao carregar cupons')
  } finally {
    loading.value = false
  }
}

async function openDialog() {
  formData.value = { embaixadorId: '', mecanicaId: '' }
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

async function save() {
  if (!formData.value.embaixadorId || !formData.value.mecanicaId) return
  saving.value = true
  try {
    const { data } = await api.post('/cupons', formData.value)
    generatedCode.value = data.codigo
    snackbar.success('Cupom gerado!')
    loadData()
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Erro ao gerar cupom')
  } finally {
    saving.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

onMounted(loadData)
</script>
