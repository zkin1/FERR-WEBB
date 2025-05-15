(function() {
    // Detectar si estamos en localhost o accediendo desde otra IP
    const isLocalhost = 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
    
    // Configurar la URL base de la API
    window.APP_CONFIG = {
        // URL de la API basada en el hostname actual
        API_URL: isLocalhost 
            ? 'http://localhost:3000/api'  
            : `http://${window.location.hostname}:3000/api`,
        
        // URLs del sistema
        BASE_URL: window.location.origin,
        
        // Otras configuraciones comunes
        ASSETS_URL: '/assets',
        DEFAULT_IMAGE: '/assets/images/default.jpg',
        
        // Configuraciones temporales
        TEMPORARY_STOCK_FIX: true,
        
        // Obtener la URL completa de la API para un endpoint
        getApiUrl: function(endpoint) {
            // Asegurarse de que el endpoint comience con /
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            return this.API_URL + endpoint;
        }
    };
    
    console.log('Configuración cargada:', window.APP_CONFIG);
})();