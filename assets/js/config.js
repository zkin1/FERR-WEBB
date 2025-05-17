(function() {
    // Obtener la base URL para asegurar que funcione en red local
    const getServerBaseUrl = function() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        return `${protocol}//${hostname}${port}`;
    };
    
    // URL base del servidor
    const serverBaseUrl = getServerBaseUrl();
    
    window.APP_CONFIG = {
        // URLs directas a las APIs a través del middleware (sin proxy.php)
        API_URL: `${serverBaseUrl}/api`,
        SOAP_URL: `${serverBaseUrl}/api/soap`,
        
        // URLs de assets
        ASSETS_URL: `${serverBaseUrl}/assets`,
        DEFAULT_IMAGE: `${serverBaseUrl}/assets/images/default.jpg`,
        
        // Helper para obtener URL completa para API
        getApiUrl: function(endpoint) {
            // Asegurar que el endpoint no tenga barras al inicio
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
            return `${this.API_URL}/${cleanEndpoint}`;
        },
        
        // Helper para obtener URL completa para SOAP
        getSoapUrl: function(service, method) {
            // Limpiar barras iniciales
            const cleanService = service.startsWith('/') ? service.substring(1) : service;
            const cleanMethod = method.startsWith('/') ? method.substring(1) : method;
            
            return `${this.SOAP_URL}/${cleanService}/${cleanMethod}`;
        },
        
        // Función para verificar conexión a la API
        verifyApiConnection: async function() {
            try {
                const testUrl = `${serverBaseUrl}/api/middleware/health`;
                console.log('Verificando conexión al middleware:', testUrl);
                
                const response = await fetch(testUrl);
                
                if (!response.ok) {
                    throw new Error(`Error de conexión: ${response.status}`);
                }
                
                console.log('✅ Conexión al middleware verificada correctamente');
                return true;
            } catch (error) {
                console.error('❌ ERROR DE CONEXIÓN: No se pudo conectar al middleware.', error);
                return false;
            }
        }
    };
    
    // Log de configuración para debugging
    console.log('APP_CONFIG cargada con las siguientes URLs:');
    console.log('- API_URL:', window.APP_CONFIG.API_URL);
    console.log('- SOAP_URL:', window.APP_CONFIG.SOAP_URL);
    console.log('- Base URL del servidor:', serverBaseUrl);
})();