// ==========================================
// Box 73 - Configuration
// ==========================================

const CONFIG = {
    // Google Sheets API Configuration
    // TODO: Replace with your actual credentials when ready
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

    // Sheet Names (must match exactly)
    SHEET_EMBAIXADORES: 'Embaixadores',
    SHEET_INDICACOES: 'Indicacoes',
    SHEET_CONFIGURACOES: 'Configuracoes',

    // Default Settings
    DEFAULT_DISCOUNT: 10,
    DEFAULT_WHATSAPP_MESSAGE: `🏍️ Oi! Conhece a Box 73?

É a melhor oficina de motos que já usei!

Use meu cupom *{{CODE}}* e ganhe {{DISCOUNT}}% de desconto no seu primeiro serviço!

📍 Instagram: @box73br`,

    // Instagram
    INSTAGRAM_URL: 'https://www.instagram.com/box73br/',

    // App Settings
    USE_MOCK_DATA: true, // Set to false when Google Sheets is configured
};
