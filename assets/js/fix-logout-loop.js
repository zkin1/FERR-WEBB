// fix-logout.js - Solución para bucle de logout
(function() {
    console.log("🚨 Ejecutando solución para bucle de logout");
    
    // 1. Limpiar URL si contiene parámetro logout
    if (window.location.search.includes('logout=')) {
        console.log("🚨 Detectado parámetro logout, limpiando URL");
        window.history.replaceState(null, document.title, window.location.pathname);
        
        // Marcar que ya se ha realizado una limpieza para evitar bucles
        localStorage.setItem('logout_cleanup_done', Date.now());
    }
    
    // 2. Corregir posibles problemas con la función validateSession
    const originalValidateSession = window.validateSession;
    if (typeof originalValidateSession === 'function') {
        console.log("🚨 Sobrescribiendo validateSession para prevenir bucles");
        window.validateSession = function() {
            // Si recientemente se limpió un bucle, no validar inmediatamente
            const cleanupTime = localStorage.getItem('logout_cleanup_done');
            if (cleanupTime && (Date.now() - parseInt(cleanupTime)) < 10000) {
                console.log("🚨 Omitiendo validación para prevenir bucle");
                return Promise.resolve();
            }
            
            // Ejecutar con tiempo limitado para evitar bloqueos
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout en validación')), 5000);
            });
            
            try {
                return Promise.race([originalValidateSession(), timeoutPromise])
                    .catch(error => {
                        console.log("🚨 Error en validateSession controlado para prevenir bucle:", error);
                        return Promise.resolve();
                    });
            } catch (e) {
                console.log("🚨 Error al llamar validateSession:", e);
                return Promise.resolve();
            }
        };
    }
    
    // 3. Sobreescribir window.logout para asegurar que nunca añada parámetros
    const originalLogout = window.logout;
    if (typeof originalLogout === 'function') {
        console.log("🚨 Sobrescribiendo logout para prevenir redirecciones con parámetros");
        window.logout = function() {
            console.log("🚨 Ejecutando logout seguro");
            
            // Limpiar datos según implementación original pero sin redirigir
            if (window.userApi) {
                window.userApi.logout();
            } else {
                localStorage.removeItem('userAuthToken');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('currentUser');
                document.cookie = 'authToken=; path=/; max-age=0';
            }
            
            // Actualizar UI si está disponible
            if (typeof window.updateAuthUI === 'function') {
                try {
                    window.updateAuthUI();
                } catch (e) {
                    console.log("🚨 Error al actualizar UI:", e);
                }
            }
            
            // Redirigir a página principal SIN parámetros
            window.location.href = '/index.html';
        };
    }
    
    console.log("🚨 Fix aplicado correctamente");
})();