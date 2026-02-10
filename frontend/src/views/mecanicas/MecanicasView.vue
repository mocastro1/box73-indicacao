<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Mecânicas de Cupom</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Nova Mecânica
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="mec in items" :key="mec.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            <span>{{ mec.nome }}</span>
            <v-chip :color="statusColor(mec.status)" size="small" label>{{ mec.status }}</v-chip>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-2">{{ mec.descricao || 'Sem descrição' }}</p>
            <v-divider class="my-2" />
            <div class="text-caption">
              <div><strong>Benefício:</strong> {{ mec.beneficio }}</div>
              <div><strong>Limite:</strong> {{ mec.cuponsUsados || 0 }}/{{ mec.limiteTotal || '∞' }}</div>
              <div><strong>Por CPF:</strong> max {{ mec.limitePorCpf || '∞' }}</div>
              <div><strong>Período:</strong> {{ formatDate(mec.dataInicio) }} - {{ formatDate(mec.dataFim) }}</div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn size="small" variant="text" @click="openDialog(mec)">
              <v-icon start>mdi-pencil</v-icon> Editar
            </v-btn>
            <v-spacer />
            <v-btn
              size="small"
              :color="mec.status === 'ATIVA' ? 'warning' : 'success'"
              variant="tonal"
              @click="toggleStatus(mec)"
            >
              {{ mec.status === 'ATIVA' ? 'Pausar' : 'Ativar' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="700" persistent>
      <v-card>
        <v-card-title>{{ editing ? 'Editar' : 'Nova' }} Mecânica</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formData.nome" label="Nome *" :rules="[r.required]" />
            <v-textarea v-model="formData.descricao" label="Descrição" rows="2" />
            <v-text-field v-model="formData.beneficio" label="Benefício (ex: 10% desconto) *" :rules="[r.required]" />
            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="formData.limiteTotal" label="Limite Total" type="number" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="formData.limitePorCpf" label="Limite por CPF" type="number" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="formData.dataInicio" label="Data Início *" type="date" :rules="[r.required]" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="formData.dataFim" label="Data Fim *" type="date" :rules="[r.required]" />
              </v-col>
            </v-row>
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

const r = { required: (v: string) => !!v || 'Obrigatório' }
const formData = ref({
  nome: '', descricao: '', beneficio: '',
  limiteTotal: null as number | null, limitePorCpf: null as number | null,
  dataInicio: '', dataFim: ''
})

function statusColor(s: string) {
  return { ATIVA: 'success', PAUSADA: 'warning', RASCUNHO: 'grey', ENCERRADA: 'error' }[s] || 'grey'
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/mecanicas')
    items.value = data.data || data
  } catch (e) {
    snackbar.error('Erro ao carregar mecânicas')
  } finally {
    loading.value = false
  }
}

function openDialog(item?: any) {
  if (item) {
    editing.value = true
    editingId.value = item.id
    formData.value = {
      nome: item.nome, descricao: item.descricao || '',
      beneficio: item.beneficio, limiteTotal: item.limiteTotal,
      limitePorCpf: item.limitePorCpf,
      dataInicio: item.dataInicio?.split('T')[0] || '',
      dataFim: item.dataFim?.split('T')[0] || ''
    }
  } else {
    editing.value = false
    formData.value = { nome: '', descricao: '', beneficio: '', limiteTotal: null, limitePorCpf: null, dataInicio: '', dataFim: '' }
  }
  dialog.value = true
}

async function save() {
  if (!formData.value.nome || !formData.value.beneficio) return
  saving.value = true
  try {
    const payload = { ...formData.value }
    if (editing.value) {
      await api.patch(`/mecanicas/${editingId.value}`, payload)
      snackbar.success('Mecânica atualizada!')
    } else {
      await api.post('/mecanicas', payload)
      snackbar.success('Mecânica criada!')
    }
    dialog.value = false
    loadData()
  } catch (e: any) {
    snackbar.error(e.response?.data?.message || 'Erro ao salvar')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(mec: any) {
  try {
    await api.patch(`/mecanicas/${mec.id}/toggle-status`)
    snackbar.success('Status alterado!')
    loadData()
  } catch (e) {
    snackbar.error('Erro ao alterar status')
  }
}

onMounted(loadData)
</script>
