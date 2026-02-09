// ==========================================
// Box 73 - Configuration (Supabase Version)
// ==========================================

const CONFIG = {
    // Supabase Configuration
    // TODO: Replace with your actual Supabase credentials
    // Get these from: Project Settings > API in your Supabase dashboard
    SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL', // Example: https://xxxxx.supabase.co
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY', // Example: eyJhbGc...

    // Application Settings
    DEFAULT_DISCOUNT: 10,
    DEFAULT_WHATSAPP_MESSAGE: 'Oi! Estou indicando a Box 73 pra você! 🏍️ Use meu cupom {{CODE}} e ganhe {{DISCOUNT}}% de desconto na sua próxima revisão! 🔧',

    // Development Mode
    // Set to true to use mock data (for testing without Supabase)
    // Set to false to use real Supabase database
    USE_MOCK_DATA: false
};
