<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="secondary" dark flat>
            <v-toolbar-title class="d-flex align-center gap-2">
              <v-icon>mdi-motorbike</v-icon>
              Box 73 - Oficina
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pt-6">
            <v-form @submit.prevent="handleLogin" ref="form">
              <v-text-field
                v-model="email"
                label="E-mail"
                prepend-icon="mdi-email"
                type="email"
                :rules="[rules.required, rules.email]"
                :disabled="loading"
              />
              <v-text-field
                v-model="senha"
                label="Senha"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                :rules="[rules.required]"
                :disabled="loading"
              />
            </v-form>

            <v-alert v-if="errorMsg" type="error" variant="tonal" class="mt-2" density="compact">
              {{ errorMsg }}
            </v-alert>
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-spacer />
            <v-btn
              color="primary"
              variant="elevated"
              size="large"
              block
              :loading="loading"
              @click="handleLogin"
            >
              Entrar
            </v-btn>
          </v-card-actions>

          <v-divider />

          <v-card-text class="text-center">
            <v-btn variant="text" color="primary" to="/cliente" size="small">
              <v-icon start>mdi-account</v-icon>
              Portal do Cliente
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const senha = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail inválido',
}

async function handleLogin() {
  if (!email.value || !senha.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, senha.value)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>
