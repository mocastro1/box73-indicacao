// ==========================================
// Box 73 - Configuration Template
// ==========================================
// 
// IMPORTANT: Copy this file to config.js and fill in your credentials
// DO NOT commit config.js to version control!
//
// Instructions:
// 1. Create a Google Sheet with 3 tabs: Embaixadores, Indicacoes, Configuracoes
// 2. Enable Google Sheets API in Google Cloud Console
// 3. Create an API Key with Sheets API enabled
// 4. Copy your Spreadsheet ID from the URL
// 5. Make the sheet publicly readable (or use OAuth for better security)

const CONFIG = {
    // Google Sheets API Configuration
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
    
    // Sheet Names (must match exactly)
    SHEET_EMBAIXADORES: 'Embaixadores',
    SHEET_INDICACOES: 'Indicacoes',
    SHEET_CONFIGURACOES: 'Configuracoes',
    
    // Default Settings (can be overridden by Configuracoes sheet)
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

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
