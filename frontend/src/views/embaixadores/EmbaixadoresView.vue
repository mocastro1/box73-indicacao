<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Embaixadores</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Novo Embaixador
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar por nome, CPF ou telefone..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mb-4"
          @update:model-value="debouncedSearch"
        />
      </v-card-text>

      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        :items-per-page="10"
        @update:options="loadData"
      >
        <template v-slot:item.cpf="{ item }">
          {{ formatCpf(item.cpf) }}
        </template>
        <template v-slot:item.criadoEm="{ item }">
          {{ formatDate(item.criadoEm) }}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialog Criar/Editar -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editing ? 'Editar' : 'Novo' }} Embaixador</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formData.nome" label="Nome *" :rules="[r.required]" />
            <v-text-field v-model="formData.cpf" label="CPF *" :rules="[r.required]" />
            <v-text-field v-model="formData.telefone" label="Telefone" />
            <v-text-field v-model="formData.email" label="E-mail" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const search = ref('')
const dialog = ref(false)
const editing = ref(false)
const editingId = ref('')

const r = { required: (v: string) => !!v || 'Obrigatório' }

const formData = ref({ nome: '', cpf: '', telefone: '', email: '' })

const headers = [
  { title: 'Nome', key: 'nome' },
  { title: 'CPF', key: 'cpf' },
  { title: 'Telefone', key: 'telefone' },
  { title: 'E-mail', key: 'email' },
  { title: 'Desde', key: 'criadoEm' },
  { title: 'Ações', key: 'actions', sortable: false, width: 80 },
]

let debounceTimer: any
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadData({ page: 1, itemsPerPage: 10 }), 400)
}

async function loadData({ page, itemsPerPage }: any) {
  loading.value = true
  try {
    const params: any = { page, limit: itemsPerPage }
    if (search.value) params.search = search.value
    const { data } = await api.get('/embaixadores', { params })
    items.value = data.data
    total.value = data.total
  } catch (e) {
    snackbar.error('Erro ao carregar embaixadores')
  } finally {
    loading.value = false
  }
}

function openDialog(item?: any) {
  if (item) {
    editing.value = true
    editingId.value = item.id
    formData.value = { nome: item.nome, cpf: item.cpf, telefone: item.telefone || '', email: item.email || '' }
  } else {
    editing.value = false
    editingId.value = ''
    formData.value = { nome: '', cpf: '', telefone: '', email: '' }
  }
  dialog.value = true
}

async function save() {
  if (!formData.value.nome || !formData.value.cpf) return
  saving.value = true
  try {
    if (editing.value) {
      await api.patch(`/embaixadores/${editingId.value}`, formData.value)
      snackbar.success('Embaixador atualizado!')
    } else {
      await api.post('/embaixadores', formData.value)
      snackbar.success('Embaixador criado!')
    }
    dialog.value = false
    loadData({ page: 1, itemsPerPage: 10 })
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Erro ao salvar')
  } finally {
    saving.value = false
  }
}

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}
</script>
