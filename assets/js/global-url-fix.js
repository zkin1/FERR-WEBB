    // global-url-fix.js - Corrige todas las URLs hardcodeadas en la aplicación
    (function() {
        console.log('🔧 Aplicando corrección global de URLs...');
        
        // ===== FUNCIONES DE UTILIDAD =====
        
        // Función para obtener URL base dinámica con puerto específico
        function getApiBaseUrl(port) {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            return `${protocol}//${hostname}:${port}`;
        }
        
        // ===== CORRECCIONES GLOBALES =====
        
        // 1. Corregir cualquier URL global hardcodeada
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // Si la URL comienza con http://localhost, reemplazarla
            if (typeof url === 'string' && url.match(/^http:\/\/localhost:\d+/)) {
                const port = url.match(/^http:\/\/localhost:(\d+)/)[1];
                const path = url.replace(/^http:\/\/localhost:\d+/, '');
                const newUrl = getApiBaseUrl(port) + path;
                
                console.log(`🔄 URL corregida: ${url} -> ${newUrl}`);
                url = newUrl;
            }
            
            return originalFetch.call(this, url, options);
        };
        
        // 2. Proteger contra posibles defectos en la carga de scripts
        window.addEventListener('error', function(event) {
            // Capturar errores específicos de scripts no encontrados
            if (event.target && event.target.tagName === 'SCRIPT') {
                const src = event.target.src || '';
                if (src.includes('localhost')) {
                    console.error(`Error de carga de script: ${src}`);
                    // Intentar cargar nuevamente con la URL corregida
                    if (src.match(/^http:\/\/localhost:\d+/)) {
                        const port = src.match(/^http:\/\/localhost:(\d+)/)[1];
                        const path = src.replace(/^http:\/\/localhost:\d+/, '');
                        const newSrc = getApiBaseUrl(port) + path;
                        
                        console.log(`🔄 Intentando cargar script con URL corregida: ${newSrc}`);
                        const newScript = document.createElement('script');
                        newScript.src = newSrc;
                        document.head.appendChild(newScript);
                    }
                }
            }
        }, true);
        
        // ===== CORRECCIONES ESPECÍFICAS =====
        
        // 3. Corregir definiciones de API_URL
        document.addEventListener('DOMContentLoaded', function() {
            // API principal (productos)
            window.API_URL = getApiBaseUrl(3000) + '/api';
            console.log('API_URL definida globalmente como:', window.API_URL);
            
            // API de usuarios
            if (window.userApi) {
                window.userApi.baseUrl = getApiBaseUrl(3003) + '/api';
                console.log('userApi.baseUrl actualizada a:', window.userApi.baseUrl);
            }
            
            // Servicios SOAP
            if (window.inventarioSoap) {
                window.SOAP_SERVICE_URL = getApiBaseUrl(3002);
                console.log('SOAP_SERVICE_URL actualizada a:', window.SOAP_SERVICE_URL);
                
                // Reescribir la función callSoapService para usar la URL dinámica
                window.inventarioSoap.callSoapService = async function(endpoint, method, params = {}) {
                    try {
                        const url = `${getApiBaseUrl(3002)}/api/soap/${endpoint}/${method}`;
                        console.log(`Llamando a ${url} con parámetros:`, params);
                        
                        const response = await fetch(url, {
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
            }
        });
        
        // 4. Verificar y corregir APP_CONFIG
        if (window.APP_CONFIG) {
            window.APP_CONFIG.API_URL = getApiBaseUrl(3000) + '/api';
            window.APP_CONFIG.SOAP_URL = getApiBaseUrl(3002) + '/api/soap';
            console.log('APP_CONFIG actualizada:', window.APP_CONFIG);
        }
        
        // 5. Detectar y corregir problemas de carga dinámica
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.target.tagName === 'SCRIPT' && mutation.attributeName === 'src') {
                    const src = mutation.target.src;
                    
                    if (src && src.includes('localhost')) {
                        console.warn(`Script con URL sospechosa detectado: ${src}`);
                    }
                }
                
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'SCRIPT' && node.src && node.src.includes('localhost')) {
                            console.warn(`Nuevo script con URL sospechosa: ${node.src}`);
                            // Podríamos corregir esto si fuera necesario
                        }
                    });
                }
            });
        });
        
        observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true
        });
        
        console.log('✅ Corrección global de URLs completada');
    })();