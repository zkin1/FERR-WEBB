(function() {
    window.APP_CONFIG = {
        // URL de la API usando el proxy PHP
        API_URL: '/proxy.php?target=api',
        
        // URL del servicio SOAP usando el proxy PHP
        SOAP_URL: '/proxy.php?target=soap',
        
        // Otras configuraciones
        ASSETS_URL: '/assets',
        DEFAULT_IMAGE: '/assets/images/default.jpg',
        
        // Helper para obtener URL completa para API
        getApiUrl: function(endpoint) {
            return this.API_URL + '&path=' + encodeURIComponent(endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
        },
        
        // Helper para obtener URL completa para SOAP
        getSoapUrl: function(endpoint, method) {
            return this.SOAP_URL + '&path=' + encodeURIComponent(endpoint + '/' + method);
        }
    };
    
    console.log('APP_CONFIG cargada con proxy:', window.APP_CONFIG);
})();