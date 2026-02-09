// ==========================================
// Box 73 - Configuration (Supabase Version)
// ==========================================

const CONFIG = {
    // Supabase Configuration
    // For development, using mock data
    SUPABASE_URL: 'YOUR_SUPABASE_PROJECT_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

    // Application Settings
    DEFAULT_DISCOUNT: 10,
    DEFAULT_WHATSAPP_MESSAGE: 'Oi! Estou indicando a Box 73 pra você! 🏍️ Use meu cupom {{CODE}} e ganhe {{DISCOUNT}}% de desconto na sua próxima revisão! 🔧',

    // Development Mode - set to false when you have Supabase configured
    USE_MOCK_DATA: true
};
