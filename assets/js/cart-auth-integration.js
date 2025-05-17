function setupCartAuthEvents() {
    console.log('Configurando eventos de autenticación para carrito...');
    
    // Patching logout function to handle cart
    if (typeof logout === 'function') {
        console.log('Extendiendo función logout...');
        const originalLogout = logout;
        window.logout = function() {
            // Dispatch event before logging out
            console.log('Cerrando sesión, notificando para limpiar carrito...');
            const event = new CustomEvent('auth_state_changed', {
                detail: { state: 'logout' }
            });
            window.dispatchEvent(event);
            
            // Document event for other components
            document.dispatchEvent(new Event('logout_success'));
            
            // Call original logout function
            return originalLogout.apply(this, arguments);
        };
    }
    
    // Patching updateAuthUI function to handle login detection
    if (typeof updateAuthUI === 'function') {
        console.log('Extendiendo función updateAuthUI...');
        const originalUpdateAuthUI = updateAuthUI;
        window.updateAuthUI = function() {
            // Get current auth state
            const wasAuthenticated = isAuthenticatedCheck();
            
            // Call original function
            const result = originalUpdateAuthUI.apply(this, arguments);
            
            // Check if auth state changed to logged in
            const isNowAuthenticated = isAuthenticatedCheck();
            
            // If just logged in, trigger event
            if (!wasAuthenticated && isNowAuthenticated) {
                console.log('Usuario recién autenticado, cargando carrito guardado...');
                const event = new CustomEvent('auth_state_changed', {
                    detail: { state: 'login' }
                });
                window.dispatchEvent(event);
                
                // Document event for other components
                document.dispatchEvent(new Event('login_success'));
            }
            
            return result;
        };
    }
    
    // Helper function to check authentication status
    function isAuthenticatedCheck() {
        const token = localStorage.getItem('userAuthToken');
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return !!token && Object.keys(userData).length > 0;
    }
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('cart-auth-integration.js - DOM loaded');
    
    // Setup cart auth events
    setupCartAuthEvents();
});

// Utility function to manually trigger auth events
// This can be useful for debugging or when integrating with external auth systems
window.triggerCartAuthEvent = function(state) {
    console.log(`Triggering manual auth event: ${state}`);
    const event = new CustomEvent('auth_state_changed', {
        detail: { state: state }
    });
    window.dispatchEvent(event);
    
    // Also dispatch document event
    document.dispatchEvent(new Event(`${state}_success`));
};