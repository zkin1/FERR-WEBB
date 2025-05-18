// network-fix.js - Corrige problemas de URLs al acceder desde diferentes IPs
(function() {
    console.log('🔧 Aplicando correcciones de red para acceso remoto...');
    
    // Función para obtener la URL base dinámica
    const getApiBaseUrl = function(port) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:${port}`;
    };
    
    // Corregir APIs y servicios
    const fixApis = function() {
        // 1. Configuración global
        if (window.APP_CONFIG) {
            // Servicio principal (productos) - puerto 3000
            window.APP_CONFIG.API_URL = getApiBaseUrl(3000) + '/api';
            // Middleware SOAP - puerto 3002
            window.APP_CONFIG.SOAP_URL = getApiBaseUrl(3002) + '/api/soap';
            
            console.log('🔄 URLs de APP_CONFIG actualizadas:');
            console.log('   - API_URL:', window.APP_CONFIG.API_URL);
            console.log('   - SOAP_URL:', window.APP_CONFIG.SOAP_URL);
        }
        
        // 2. Servicio de productos API
        if (typeof API_URL !== 'undefined') {
            window.API_URL = getApiBaseUrl(3000) + '/api';
            console.log('🔄 API_URL actualizada:', window.API_URL);
        }
        
        // 3. Servicio de usuarios API
        if (window.userApi && window.userApi.baseUrl) {
            window.userApi.baseUrl = getApiBaseUrl(3003) + '/api';
            console.log('🔄 USER_API_URL actualizada:', window.userApi.baseUrl);
        }
        
        // 4. Servicios SOAP
        const soapServices = ['webpaySoap', 'inventarioSoap', 'aprobacionSoap'];
        soapServices.forEach(service => {
            if (window[service]) {
                // Crear o reemplazar la URL del servicio SOAP
                const soapUrl = getApiBaseUrl(3002);
                
                // Ampliar el objeto para asegurar que use la URL correcta
                const originalFunctions = { ...window[service] };
                
                // Crear método dinámico para llamar al servicio SOAP
                window[service].callSoapService = async function(endpoint, method, params = {}) {
                    try {
                        console.log(`Llamando a ${soapUrl}/api/soap/${endpoint}/${method} con parámetros:`, params);
                        
                        const response = await fetch(`${soapUrl}/api/soap/${endpoint}/${method}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(params)
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Error ${response.status}: ${errorText}`);
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error(`Error llamando al servicio SOAP (${endpoint}/${method}):`, error);
                        throw error;
                    }
                };
                
                console.log(`🔄 Servicio ${service} configurado para usar ${soapUrl}`);
            }
        });
    };
    
    // Ejecutar correcciones cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixApis);
    } else {
        fixApis();
    }
    
    // También ejecutar después de que todas las otras dependencias estén cargadas
    window.addEventListener('load', fixApis);
    
    console.log('✅ Correcciones de red aplicadas correctamente');
})();