<template>
  <v-container class="fill-height d-flex align-center justify-center" fluid>
    <v-row align="center" justify="center" class="w-100">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="elevation-6 rounded-lg overflow-hidden" style="border: 2px solid #000000;">
          <!-- Header com logo -->
          <div style="background-color: #000000;" class="pa-6 d-flex flex-column align-center">
            <img src="@/assets/LOGO-BOX73_V2.png" alt="BOX 73" height="70" class="mb-2" />
            <div class="text-subtitle-1 text-white font-weight-light" style="letter-spacing: 0.08em;">
              Sistema de Indicação
            </div>
          </div>

          <!-- Form Section -->
          <v-card-text class="pa-8">
            <v-form @submit.prevent="handleLogin" ref="form">
              <v-text-field
                v-model="email"
                label="E-mail"
                type="email"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.email]"
                :disabled="loading"
                class="mb-4"
                prepend-inner-icon="mdi-email-outline"
                color="primary"
                autocomplete="email"
              />
              
              <v-text-field
                v-model="senha"
                label="Senha"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                :disabled="loading"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                prepend-inner-icon="mdi-lock-outline"
                color="primary"
                autocomplete="current-password"
                class="mb-2"
              />

              <v-alert
                v-if="errorMsg"
                type="error"
                variant="tonal"
                class="mb-4"
                density="compact"
                closable
                @click:close="errorMsg = ''"
              >
                {{ errorMsg }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                :disabled="loading"
                class="font-weight-bold mt-2"
                style="letter-spacing: 0.08em;"
                elevation="2"
              >
                <v-icon start>mdi-login</v-icon>
                ENTRAR
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Footer -->
          <v-divider />
          <v-card-text class="text-center py-4" style="background-color: #fafafa;">
            <v-btn
              variant="text"
              color="primary"
              to="/cliente"
              size="small"
              class="text-none"
            >
              <v-icon start size="small">mdi-account-circle-outline</v-icon>
              Portal do Cliente
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Powered by -->
        <div class="text-center mt-4 text-grey-darken-1 text-caption">
          Box 73 Motopeças &copy; {{ new Date().getFullYear() }}
        </div>
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
  if (!email.value || !senha.value) {
    errorMsg.value = 'Preencha todos os campos'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, senha.value)
  } catch (e: any) {
    console.error('Erro ao fazer login:', e)
    errorMsg.value = e.response?.data?.message || e.message || 'Credenciais inválidas. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Input border colors */
:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 0.3;
}

:deep(.v-field--variant-outlined:hover .v-field__outline) {
  --v-field-border-opacity: 0.8;
}

:deep(.v-field--variant-outlined.v-field--focused .v-field__outline) {
  color: #F97316 !important;
}

/* Card hover effect */
.v-card {
  transition: box-shadow 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

/* Button style */
:deep(.v-btn--variant-elevated) {
  text-transform: none;
}

/* Container background */
.v-container {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  min-height: 100vh;
}
</style>
