<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Regras de Cupom</h1>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Nova Regra
      </v-btn>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Empty state -->
    <v-card v-else-if="items.length === 0" class="pa-8 text-center" variant="outlined">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-ticket-percent-outline</v-icon>
      <div class="text-h6 text-grey-darken-1 mb-2">Nenhuma regra cadastrada</div>
      <div class="text-body-2 text-grey mb-4">Crie sua primeira regra de cupom para começar.</div>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon>
        Criar Regra
      </v-btn>
    </v-card>

    <!-- Cards -->
    <v-row v-else>
      <v-col v-for="mec in items" :key="mec.id" cols="12" md="6" lg="4">
        <v-card class="h-100" hover>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-truncate" style="max-width: 70%;">{{ mec.nome }}</span>
            <v-chip :color="getStatusColor(mec)" size="small" label>{{ getStatus(mec) }}</v-chip>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3 text-grey-darken-1">{{ mec.descricao || 'Sem descrição' }}</p>
            <v-divider class="mb-3" />
            <div class="d-flex flex-column ga-1">
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="primary">mdi-gift-outline</v-icon>
                <strong class="mr-1">Embaixador:</strong> {{ mec.beneficioEmbaixador }}
              </div>
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="secondary">mdi-account-outline</v-icon>
                <strong class="mr-1">Cliente:</strong> {{ mec.beneficioCliente }}
              </div>
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="primary">mdi-counter</v-icon>
                <strong class="mr-1">Cupons:</strong> {{ mec.cuponsEmitidos || 0 }}/{{ mec.limiteCupons || '∞' }}
              </div>
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="success">mdi-target</v-icon>
                <strong class="mr-1">Meta validações:</strong> {{ mec.metaValidacoes }}
              </div>
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="warning">mdi-check-decagram</v-icon>
                <strong class="mr-1">Validações:</strong> {{ mec.totalValidacoes || 0 }}
              </div>
              <div class="d-flex align-center text-body-2">
                <v-icon size="16" class="mr-2" color="grey">mdi-calendar-range</v-icon>
                <strong class="mr-1">Período:</strong> {{ formatDate(mec.dataInicio) }} - {{ formatDate(mec.dataFim) }}
              </div>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-3">
            <v-btn size="small" variant="text" @click="openDialog(mec)">
              <v-icon start size="small">mdi-pencil</v-icon> Editar
            </v-btn>
            <v-btn size="small" variant="text" color="info" @click="duplicate(mec)">
              <v-icon start size="small">mdi-content-copy</v-icon> Duplicar
            </v-btn>
            <v-spacer />
            <v-btn
              size="small"
              :color="mec.status === 'ATIVA' ? 'warning' : 'success'"
              variant="tonal"
              @click="toggleStatus(mec)"
              :disabled="isExpired(mec)"
            >
              {{ mec.status === 'ATIVA' ? 'Pausar' : 'Ativar' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="700" persistent>
      <v-card>
        <v-card-title class="d-flex align-center pa-4" style="background-color: #000; color: #fff;">
          <v-icon color="primary" class="mr-2">mdi-ticket-percent</v-icon>
          {{ editing ? 'Editar' : 'Nova' }} Regra de Cupom
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="form" @submit.prevent="save">
            <!-- Nome -->
            <v-text-field
              v-model="formData.nome"
              label="Nome da Regra *"
              :rules="[r.required]"
              variant="outlined"
              density="comfortable"
              class="mb-1"
            >
              <template v-slot:append-inner>
                <v-tooltip location="top" max-width="300">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                  </template>
                  Nome identificador da regra de cupom. Ex: "Campanha Troca de Óleo", "Promoção Revisão Completa".
                </v-tooltip>
              </template>
            </v-text-field>

            <!-- Descrição -->
            <v-textarea
              v-model="formData.descricao"
              label="Descrição"
              rows="2"
              variant="outlined"
              density="comfortable"
              class="mb-1"
            >
              <template v-slot:append-inner>
                <v-tooltip location="top" max-width="300">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                  </template>
                  Descrição detalhada da regra. Campo opcional para anotações internas.
                </v-tooltip>
              </template>
            </v-textarea>

            <!-- Benefícios -->
            <div class="text-subtitle-2 text-grey-darken-2 mb-2 mt-1">
              <v-icon size="small" class="mr-1">mdi-gift-outline</v-icon>
              Benefícios
            </div>

            <v-text-field
              v-model="formData.beneficioEmbaixador"
              label="Benefício do Embaixador *"
              :rules="[r.required]"
              variant="outlined"
              density="comfortable"
              class="mb-1"
              placeholder="Ex: R$ 20 de desconto na próxima compra"
            >
              <template v-slot:append-inner>
                <v-tooltip location="top" max-width="300">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                  </template>
                  Recompensa que o embaixador (quem indicou) recebe quando a indicação é validada. Ex: "R$ 20 de desconto", "Brinde especial".
                </v-tooltip>
              </template>
            </v-text-field>

            <v-text-field
              v-model="formData.beneficioCliente"
              label="Benefício do Cliente *"
              :rules="[r.required]"
              variant="outlined"
              density="comfortable"
              class="mb-1"
              placeholder="Ex: 10% de desconto na troca de óleo"
            >
              <template v-slot:append-inner>
                <v-tooltip location="top" max-width="300">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                  </template>
                  Benefício que o cliente indicado recebe ao apresentar o cupom. Ex: "10% de desconto", "Troca de óleo grátis".
                </v-tooltip>
              </template>
            </v-text-field>

            <!-- Limites -->
            <div class="text-subtitle-2 text-grey-darken-2 mb-2 mt-2">
              <v-icon size="small" class="mr-1">mdi-tune</v-icon>
              Limites e Metas
            </div>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formData.limiteCupons"
                  label="Limite de Cupons *"
                  type="number"
                  :rules="[r.required, r.minOne]"
                  variant="outlined"
                  density="comfortable"
                  min="1"
                >
                  <template v-slot:append-inner>
                    <v-tooltip location="top" max-width="300">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                      </template>
                      Quantidade máxima total de cupons que podem ser emitidos nesta regra. Quando atingir esse limite, não será mais possível gerar novos cupons.
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formData.metaValidacoes"
                  label="Meta de Validações *"
                  type="number"
                  :rules="[r.required, r.minOne]"
                  variant="outlined"
                  density="comfortable"
                  min="1"
                >
                  <template v-slot:append-inner>
                    <v-tooltip location="top" max-width="300">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                      </template>
                      Número de indicações que o embaixador precisa ter validadas para receber o benefício. Ex: se a meta é 5, o embaixador precisa de 5 cupons validados para ganhar a recompensa.
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <!-- Período -->
            <div class="text-subtitle-2 text-grey-darken-2 mb-2 mt-1">
              <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
              Período de Vigência
            </div>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.dataInicio"
                  label="Data Início *"
                  type="date"
                  :rules="[r.required]"
                  variant="outlined"
                  density="comfortable"
                >
                  <template v-slot:append-inner>
                    <v-tooltip location="top" max-width="300">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                      </template>
                      Data a partir da qual os cupons desta regra começam a valer.
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.dataFim"
                  label="Data Fim *"
                  type="date"
                  :rules="[r.required]"
                  variant="outlined"
                  density="comfortable"
                >
                  <template v-slot:append-inner>
                    <v-tooltip location="top" max-width="300">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="small" color="grey">mdi-help-circle-outline</v-icon>
                      </template>
                      Data em que os cupons desta regra expiram e não podem mais ser utilizados.
                    </v-tooltip>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="save">
            <v-icon start>mdi-content-save</v-icon>
            Salvar
          </v-btn>
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
const editingId = ref<number | string>('')

const r = {
  required: (v: any) => !!v || v === 0 ? true : 'Campo obrigatório',
  minOne: (v: any) => (v && v >= 1) || 'Valor mínimo é 1',
}

const emptyForm = () => ({
  nome: '',
  descricao: '',
  beneficioEmbaixador: '',
  beneficioCliente: '',
  limiteCupons: 100,
  metaValidacoes: 5,
  dataInicio: '',
  dataFim: '',
})

const formData = ref(emptyForm())

function statusColor(s: string) {
  return { ATIVA: 'success', PAUSADA: 'warning', ENCERRADA: 'error', EXPIRADA: 'grey-darken-1' }[s] || 'grey'
}

function isExpired(mec: any) {
  if (!mec.dataFim) return false
  return new Date(mec.dataFim) < new Date()
}

function getStatus(mec: any) {
  if (isExpired(mec)) return 'EXPIRADA'
  return mec.status
}

function getStatusColor(mec: any) {
  return statusColor(getStatus(mec))
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/mecanicas')
    items.value = data.data || data
  } catch (e) {
    snackbar.error('Erro ao carregar regras')
  } finally {
    loading.value = false
  }
}

function openDialog(item?: any) {
  if (item) {
    editing.value = true
    editingId.value = item.id
    formData.value = {
      nome: item.nome,
      descricao: item.descricao || '',
      beneficioEmbaixador: item.beneficioEmbaixador || '',
      beneficioCliente: item.beneficioCliente || '',
      limiteCupons: item.limiteCupons,
      metaValidacoes: item.metaValidacoes,
      dataInicio: item.dataInicio?.split('T')[0] || '',
      dataFim: item.dataFim?.split('T')[0] || '',
    }
  } else {
    editing.value = false
    editingId.value = ''
    formData.value = emptyForm()
  }
  dialog.value = true
}

async function save() {
  const f = formData.value
  if (!f.nome || !f.beneficioEmbaixador || !f.beneficioCliente || !f.dataInicio || !f.dataFim) {
    snackbar.error('Preencha todos os campos obrigatórios')
    return
  }
  if (!f.limiteCupons || f.limiteCupons < 1 || !f.metaValidacoes || f.metaValidacoes < 1) {
    snackbar.error('Limite de cupons e meta de validações devem ser no mínimo 1')
    return
  }

  saving.value = true
  try {
    const payload = {
      nome: f.nome,
      descricao: f.descricao || undefined,
      beneficioEmbaixador: f.beneficioEmbaixador,
      beneficioCliente: f.beneficioCliente,
      limiteCupons: Number(f.limiteCupons),
      metaValidacoes: Number(f.metaValidacoes),
      dataInicio: f.dataInicio,
      dataFim: f.dataFim,
    }

    if (editing.value) {
      await api.patch(`/mecanicas/${editingId.value}`, payload)
      snackbar.success('Regra atualizada com sucesso!')
    } else {
      await api.post('/mecanicas', payload)
      snackbar.success('Regra criada com sucesso!')
    }
    dialog.value = false
    loadData()
  } catch (e: any) {
    const msg = e.response?.data?.message
    snackbar.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao salvar regra')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(mec: any) {
  try {
    await api.patch(`/mecanicas/${mec.id}/toggle-status`)
    snackbar.success('Status alterado com sucesso!')
    loadData()
  } catch (e) {
    snackbar.error('Erro ao alterar status')
  }
}

function duplicate(mec: any) {
  editing.value = false
  editingId.value = ''
  formData.value = {
    nome: `${mec.nome} (Cópia)`,
    descricao: mec.descricao || '',
    beneficioEmbaixador: mec.beneficioEmbaixador || '',
    beneficioCliente: mec.beneficioCliente || '',
    limiteCupons: mec.limiteCupons,
    metaValidacoes: mec.metaValidacoes,
    dataInicio: '',
    dataFim: '',
  }
  dialog.value = true
}

onMounted(loadData)
</script>
