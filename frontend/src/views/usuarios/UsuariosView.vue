<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Usuários</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Novo Usuário
      </v-btn>
    </div>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
      >
        <template v-slot:item.role="{ item }">
          <v-chip :color="roleColor(item.role)" size="small" label>{{ item.role }}</v-chip>
        </template>
        <template v-slot:item.ativo="{ item }">
          <v-icon :color="item.ativo ? 'success' : 'grey'">
            {{ item.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click="toggleAtivo(item)">
            <v-icon :color="item.ativo ? 'warning' : 'success'">
              {{ item.ativo ? 'mdi-account-off' : 'mdi-account-check' }}
            </v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ editing ? 'Editar' : 'Novo' }} Usuário</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formData.nome" label="Nome *" :rules="[r.required]" />
            <v-text-field v-model="formData.email" label="E-mail *" :rules="[r.required, r.email]" />
            <v-text-field
              v-if="!editing"
              v-model="formData.senha"
              label="Senha *"
              type="password"
              :rules="[r.required]"
            />
            <v-select
              v-model="formData.role"
              label="Perfil *"
              :items="roles"
              :rules="[r.required]"
            />
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
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const dialog = ref(false)
const editing = ref(false)
const editingId = ref('')

const roles = ['ADMIN', 'GERENTE', 'ATENDENTE']
const r = {
  required: (v: string) => !!v || 'Obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail inválido',
}
const formData = ref({ nome: '', email: '', senha: '', role: 'ATENDENTE' })

const headers = [
  { title: 'Nome', key: 'nome' },
  { title: 'E-mail', key: 'email' },
  { title: 'Perfil', key: 'role' },
  { title: 'Ativo', key: 'ativo' },
  { title: 'Ações', key: 'actions', sortable: false, width: 120 },
]

function roleColor(role: string) {
  return { ADMIN: 'error', GERENTE: 'primary', ATENDENTE: 'info' }[role] || 'grey'
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/usuarios')
    items.value = data.data || data
  } catch (e) {
    snackbar.error('Erro ao carregar usuários')
  } finally {
    loading.value = false
  }
}

function openDialog(item?: any) {
  if (item) {
    editing.value = true
    editingId.value = item.id
    formData.value = { nome: item.nome, email: item.email, senha: '', role: item.role }
  } else {
    editing.value = false
    formData.value = { nome: '', email: '', senha: '', role: 'ATENDENTE' }
  }
  dialog.value = true
}

async function save() {
  if (!formData.value.nome || !formData.value.email) return
  saving.value = true
  try {
    if (editing.value) {
      const { senha, ...rest } = formData.value
      await api.patch(`/usuarios/${editingId.value}`, rest)
      snackbar.success('Usuário atualizado!')
    } else {
      await api.post('/usuarios', formData.value)
      snackbar.success('Usuário criado!')
    }
    dialog.value = false
    loadData()
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Erro ao salvar')
  } finally {
    saving.value = false
  }
}

async function toggleAtivo(item: any) {
  try {
    await api.patch(`/usuarios/${item.id}/toggle`)
    snackbar.success(`Usuário ${item.ativo ? 'desativado' : 'ativado'}!`)
    loadData()
  } catch (e) {
    snackbar.error('Erro ao alterar status')
  }
}

onMounted(loadData)
</script>
