<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Header -->
        <div class="text-center mb-8">
          <v-icon size="64" color="primary">mdi-motorbike</v-icon>
          <h1 class="text-h3 font-weight-bold mt-2" style="color: #FF6B00">Box 73</h1>
          <p class="text-subtitle-1 text-grey">Consulte seus cupons e indicações</p>
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
            <v-card-subtitle>CPF: {{ formatCpf(historico.embaixador.cpf) }}</v-card-subtitle>
            <v-card-text>
              <v-chip color="primary" variant="tonal" class="mr-2">
                {{ historico.totalCupons }} cupons
              </v-chip>
              <v-chip color="success" variant="tonal">
                {{ historico.totalIndicacoes }} indicações
              </v-chip>
            </v-card-text>
          </v-card>

          <v-card v-for="cupom in historico.cupons" :key="cupom.id" class="mb-3">
            <v-card-title class="d-flex justify-space-between align-center">
              <code class="text-primary text-h6">{{ cupom.codigo }}</code>
              <v-chip size="small" color="info" label>{{ cupom.mecanica }}</v-chip>
            </v-card-title>
            <v-card-subtitle>{{ cupom.beneficio }}</v-card-subtitle>
            <v-card-text v-if="cupom.indicacoes?.length">
              <v-list density="compact">
                <v-list-subheader>Indicações</v-list-subheader>
                <v-list-item v-for="ind in cupom.indicacoes" :key="ind.id">
                  <template v-slot:prepend>
                    <v-icon :color="statusColor(ind.status)" size="small">mdi-circle</v-icon>
                  </template>
                  <v-list-item-title>{{ ind.nomeCliente }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ ind.status }} · {{ formatDate(ind.criadoEm) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-text v-else>
              <p class="text-grey text-body-2">Nenhuma indicação registrada para este cupom.</p>
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

const cpf = ref('')
const loading = ref(false)
const errorMsg = ref('')
const historico = ref<any>(null)

function statusColor(s: string) {
  return { PENDENTE: 'warning', VALIDADO: 'success', USADO: 'info', CANCELADO: 'error' }[s] || 'grey'
}

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

async function buscar() {
  const digits = cpf.value.replace(/\D/g, '')
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
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Nenhum registro encontrado para este CPF'
  } finally {
    loading.value = false
  }
}
</script>
