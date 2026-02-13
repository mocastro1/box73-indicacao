<template>
  <v-container class="py-4 py-md-8" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Header -->
        <div class="text-center mb-6 mb-md-8">
          <img src="@/assets/LOGO-BOX73_V2.png" alt="BOX 73" height="70" class="d-md-none mb-3" />
          <img src="@/assets/LOGO-BOX73_V2.png" alt="BOX 73" height="90" class="d-none d-md-block mb-4 mx-auto" />
          <p class="text-subtitle-2 text-md-subtitle-1 text-grey font-weight-light letter-spacing-1">Consulte seus cupons e indicações</p>
        </div>

        <!-- Search -->
        <v-card class="mb-6">
          <v-card-text>
            <v-text-field
              v-model="cpf"
              label="Digite seu CPF"
              prepend-inner-icon="mdi-card-account-details"
              variant="outlined"
              placeholder="000.000.000-00"
              @keyup.enter="buscar"
              :loading="loading"
              hide-details
              @update:model-value="cpf = formatCpfMask(cpf)"
            />
            <v-btn color="primary" block class="mt-4" @click="buscar" :loading="loading" size="large">
              <v-icon start>mdi-magnify</v-icon>
              Consultar
            </v-btn>
          </v-card-text>
        </v-card>

        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4">{{ errorMsg }}</v-alert>

        <!-- Results -->
        <template v-if="historico">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon start color="primary">mdi-account</v-icon>
              {{ historico.embaixador.nome }}
            </v-card-title>
            <v-card-subtitle>CPF: {{ formatCpfDisplay(historico.embaixador.cpf) }}</v-card-subtitle>
            <v-card-text>
              <v-chip color="primary" variant="tonal" class="mr-2">
                {{ historico.cupons.length }} cupons
              </v-chip>
              <v-chip color="success" variant="tonal">
                {{ totalIndicacoes }} indicações
              </v-chip>
            </v-card-text>
          </v-card>

          <v-card v-for="entry in historico.cupons" :key="entry.cupom.id" class="mb-3">
            <v-card-title class="d-flex justify-space-between align-center">
              <div class="flex-grow-1">
                <code class="text-primary text-h6">{{ entry.cupom.codigo }}</code>
                <div class="text-caption text-grey-darken-1">
                  Meta: {{ entry.meta }} validação{{ entry.meta === 1 ? '' : 'es' }} · Validada{{ entry.validadas === 1 ? '' : 's' }}: {{ entry.validadas }}
                </div>
              </div>
              <div class="d-flex gap-2 align-center">
                <v-chip
                  size="small"
                  :color="entry.progresso >= 100 ? 'success' : 'warning'"
                  class="text-white"
                >
                  {{ entry.progresso >= 100 ? 'Meta atingida' : 'Meta em andamento' }}
                </v-chip>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="toggleExpand(entry.cupom.id)"
                >
                  <v-icon>{{ expandedCupons.has(entry.cupom.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
              </div>
            </v-card-title>
            <v-card-subtitle>
              {{ entry.mecanica.nome }} · {{ entry.mecanica.beneficioCliente }}
            </v-card-subtitle>
            <v-card-text>
              <v-progress-linear
                :value="entry.progresso"
                striped
                color="primary"
                height="10"
                class="mb-3"
              >
                <template #default>
                  {{ entry.progresso }}%
                </template>
              </v-progress-linear>
              <v-row class="mb-2" align="center">
                <v-col cols="auto" class="text-caption text-grey-darken-1">
                  {{ entry.validadas }} de {{ entry.meta }} validações completas
                </v-col>
                <v-col cols="auto" class="text-caption text-grey-darken-1">
                  {{ entry.totalIndicacoes }} indicações registradas
                </v-col>
              </v-row>
              
              <!-- Botão de Compartilhar -->
              <v-btn
                color="primary"
                variant="tonal"
                block
                class="mb-3"
                @click="compartilhar(entry)"
                prepend-icon="mdi-share-variant"
              >
                Compartilhar Cupom
              </v-btn>

              <v-expand-transition>
                <div v-show="expandedCupons.has(entry.cupom.id)">
                  <v-divider class="mb-3" />
                  <v-list density="compact" v-if="entry.indicacoes?.length">
                    <v-list-subheader>Indicações</v-list-subheader>
                    <v-list-item v-for="ind in entry.indicacoes" :key="ind.id">
                      <template v-slot:prepend>
                        <v-icon :color="statusColor(ind.status)" size="small">mdi-circle</v-icon>
                      </template>
                      <v-list-item-content>
                        <v-list-item-title>{{ ind.nomeIndicado }}</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ ind.status }} · {{ formatDate(ind.createdAt) }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                  <p v-else class="text-grey text-body-2">Nenhuma indicação registrada para este cupom.</p>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </template>

        <!-- Back to login -->
        <div class="text-center mt-6">
          <v-btn variant="text" color="primary" to="/login" size="small">
            <v-icon start>mdi-arrow-left</v-icon>
            Área da Oficina
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'
import { formatCpfMask, formatCpfDisplay, cleanDigits } from '@/utils/masks'
import { useSnackbarStore } from '@/stores/snackbar'

const snackbar = useSnackbarStore()
const cpf = ref('')
const loading = ref(false)
const errorMsg = ref('')
const historico = ref<any>(null)
const totalIndicacoes = ref(0)
const expandedCupons = ref(new Set<number>())

function statusColor(s: string) {
  return { PENDENTE: 'warning', VALIDADO: 'success', USADO: 'info', CANCELADO: 'error' }[s] || 'grey'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function toggleExpand(cupomId: number) {
  if (expandedCupons.value.has(cupomId)) {
    expandedCupons.value.delete(cupomId)
  } else {
    expandedCupons.value.add(cupomId)
  }
}

function compartilhar(entry: any) {
  const codigo = entry.cupom.codigo
  const beneficio = entry.mecanica.beneficioCliente
  const dataFim = entry.mecanica.dataFim
    ? new Date(entry.mecanica.dataFim).toLocaleDateString('pt-BR')
    : 'utilização do cupom'
  
  const texto = `🎁 Use meu cupom no Box73 e ganhe ${beneficio}!

🎫 Código: ${codigo}
⏰ Válido até: ${dataFim}

👉 Apresente este cupom e aproveite!`

  // Tentar compartilhar com a API nativa (mobile)
  if (navigator.share) {
    navigator.share({
      title: 'Cupom Box73',
      text: texto,
    }).catch(() => {
      // Se falhar, copiar para clipboard
      copiarTexto(texto)
    })
  } else {
    // Copiar para clipboard (desktop)
    copiarTexto(texto)
  }
}

function copiarTexto(texto: string) {
  navigator.clipboard.writeText(texto).then(() => {
    snackbar.success('Texto do cupom copiado! Cole em sua mensagem.')
  }).catch(() => {
    snackbar.error('Não foi possível copiar o texto')
  })
}

async function buscar() {
  const digits = cleanDigits(cpf.value)
  if (digits.length !== 11) {
    errorMsg.value = 'CPF deve ter 11 dígitos'
    return
  }
  loading.value = true
  errorMsg.value = ''
  historico.value = null
  try {
    const { data } = await api.get(`/indicacoes/historico/${digits}`)
    historico.value = data
    totalIndicacoes.value = data.cupons.reduce((sum: number, entry: any) => sum + (entry.totalIndicacoes || 0), 0)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Nenhum registro encontrado para este CPF'
  } finally {
    loading.value = false
  }
}
</script>
