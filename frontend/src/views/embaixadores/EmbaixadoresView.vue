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
        <template v-slot:item.nome="{ item }">
          <v-btn
            variant="text"
            color="primary"
            class="text-none font-weight-medium"
            @click="showDetails(item)"
          >
            <v-icon start size="small">mdi-account-circle</v-icon>
            {{ item.nome }}
          </v-btn>
        </template>
        <template v-slot:item.cpf="{ item }">
          {{ formatCpfDisplay(item.cpf) }}
        </template>
        <template v-slot:item.telefone="{ item }">
          {{ formatTelefoneDisplay(item.telefone) }}
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
            <v-text-field
              v-model="formData.cpf"
              label="CPF *"
              :rules="[r.required, r.validCpf]"
              placeholder="000.000.000-00"
              @update:model-value="formData.cpf = formatCpfMask(formData.cpf)"
            />
            <v-text-field
              v-model="formData.telefone"
              label="Telefone"
              placeholder="(00) 00000-0000"
              @update:model-value="formData.telefone = formatTelefoneMask(formData.telefone)"
            />
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

    <!-- Drawer de Detalhes do Embaixador -->
    <v-navigation-drawer
      v-model="detailsDrawer"
      location="right"
      temporary
      width="500"
    >
      <div v-if="selectedEmbaixador">
        <!-- Header -->
        <v-toolbar color="primary" dark>
          <v-btn icon @click="detailsDrawer = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Embaixador</v-toolbar-title>
        </v-toolbar>

        <!-- Dados do Embaixador -->
        <v-card flat class="ma-4">
          <v-card-title class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-2">mdi-account-circle</v-icon>
            {{ selectedEmbaixador.nome }}
          </v-card-title>
          <v-card-text>
            <div class="d-flex flex-column ga-2">
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2" color="grey">mdi-card-account-details</v-icon>
                <strong class="mr-1">CPF:</strong> {{ formatCpfDisplay(selectedEmbaixador.cpf) }}
              </div>
              <div v-if="selectedEmbaixador.telefone" class="d-flex align-center">
                <v-icon size="small" class="mr-2" color="grey">mdi-phone</v-icon>
                <strong class="mr-1">Telefone:</strong> {{ formatTelefoneDisplay(selectedEmbaixador.telefone) }}
              </div>
              <div v-if="selectedEmbaixador.email" class="d-flex align-center">
                <v-icon size="small" class="mr-2" color="grey">mdi-email</v-icon>
                <strong class="mr-1">E-mail:</strong> {{ selectedEmbaixador.email }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Estatísticas -->
        <v-card flat class="ma-4">
          <v-card-title class="text-subtitle-1">
            <v-icon size="small" class="mr-1">mdi-chart-box</v-icon>
            Estatísticas
          </v-card-title>
          <v-card-text v-if="loadingDetails" class="text-center">
            <v-progress-circular indeterminate color="primary" />
          </v-card-text>
          <v-card-text v-else-if="embaixadorDetails">
            <v-row dense>
              <v-col cols="6">
                <v-card variant="tonal" color="primary">
                  <v-card-text class="text-center">
                    <div class="text-h4 font-weight-bold">{{ embaixadorDetails.cupons?.length || 0 }}</div>
                    <div class="text-caption">Cupons Gerados</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center">
                    <div class="text-h4 font-weight-bold">{{ totalValidacoes }}</div>
                    <div class="text-caption">Validações</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Cupons -->
        <v-card flat class="ma-4">
          <v-card-title class="text-subtitle-1">
            <v-icon size="small" class="mr-1">mdi-ticket-percent</v-icon>
            Cupons
          </v-card-title>
          <v-card-text v-if="loadingDetails">
            <v-progress-circular indeterminate color="primary" size="24" />
          </v-card-text>
          <v-card-text v-else-if="embaixadorDetails?.cupons?.length">
            <v-list dense>
              <v-list-item
                v-for="cupom in embaixadorDetails.cupons"
                :key="cupom.id"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon :color="cupom.ativo ? 'success' : 'grey'">
                    {{ cupom.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                </template>
                <v-list-item-title>
                  <code class="text-primary">{{ cupom.codigo }}</code>
                  <v-chip
                    v-if="cupom.mecanica?.metaValidacoes"
                    :color="getMetaColor(cupom._count?.indicacoes || 0, cupom.mecanica.metaValidacoes)"
                    size="x-small"
                    class="ml-2"
                  >
                    {{ cupom._count?.indicacoes || 0 }}/{{ cupom.mecanica.metaValidacoes }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ cupom.mecanica?.nome }}
                  <span v-if="cupom.mecanica?.metaValidacoes">
                    • {{ getMetaPercentual(cupom._count?.indicacoes || 0, cupom.mecanica.metaValidacoes) }}% da meta
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-text v-else class="text-grey text-center">
            Nenhum cupom emitido
          </v-card-text>
        </v-card>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useSnackbarStore } from '@/stores/snackbar'
import { formatCpfMask, formatTelefoneMask, formatCpfDisplay, formatTelefoneDisplay, cleanDigits, isValidCpf } from '@/utils/masks'

const snackbar = useSnackbarStore()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const search = ref('')
const dialog = ref(false)
const editing = ref(false)
const editingId = ref('')

// Details drawer
const detailsDrawer = ref(false)
const selectedEmbaixador = ref<any>(null)
const embaixadorDetails = ref<any>(null)
const loadingDetails = ref(false)

const totalValidacoes = computed(() => {
  if (!embaixadorDetails.value?.cupons) return 0
  return embaixadorDetails.value.cupons.reduce((sum: number, cupom: any) => {
    return sum + (cupom._count?.indicacoes || 0)
  }, 0)
})

const r = {
  required: (v: string) => !!v || 'Obrigatório',
  validCpf: (v: string) => !v || isValidCpf(cleanDigits(v)) || 'CPF inválido'
}

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
    formData.value = {
      nome: item.nome,
      cpf: formatCpfDisplay(item.cpf),
      telefone: formatTelefoneDisplay(item.telefone) || '',
      email: item.email || ''
    }
  } else {
    editing.value = false
    editingId.value = ''
    formData.value = { nome: '', cpf: '', telefone: '', email: '' }
  }
  dialog.value = true
}

async function showDetails(embaixador: any) {
  selectedEmbaixador.value = embaixador
  detailsDrawer.value = true
  loadingDetails.value = true
  embaixadorDetails.value = null
  
  try {
    // Carrega cupons do embaixador
    const { data } = await api.get(`/cupons/embaixador/${embaixador.id}`)
    embaixadorDetails.value = { cupons: data }
  } catch (e) {
    snackbar.error('Erro ao carregar detalhes do embaixador')
  } finally {
    loadingDetails.value = false
  }
}

async function save() {
  if (!formData.value.nome || !formData.value.cpf) return
  const cpfDigits = cleanDigits(formData.value.cpf)
  if (!isValidCpf(cpfDigits)) {
    snackbar.error('CPF inválido')
    return
  }
  saving.value = true
  try {
    const payload = {
      nome: formData.value.nome,
      cpf: cpfDigits,
      telefone: cleanDigits(formData.value.telefone) || undefined,
      email: formData.value.email || undefined,
    }
    if (editing.value) {
      await api.patch(`/embaixadores/${editingId.value}`, payload)
      snackbar.success('Embaixador atualizado!')
    } else {
      await api.post('/embaixadores', payload)
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

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-BR')
}

function getMetaColor(validacoes: number, meta: number) {
  const percentual = (validacoes / meta) * 100
  if (percentual >= 100) return 'success'
  if (percentual >= 50) return 'warning'
  return 'grey'
}

function getMetaPercentual(validacoes: number, meta: number) {
  return Math.min(Math.round((validacoes / meta) * 100), 100)
}
</script>
