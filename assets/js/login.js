document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando página de login...');
    
    // Verificar parámetros en la URL para debugging
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    console.log('URL de redirección detectada:', redirectUrl);
    
    // Verificar si el usuario ya está autenticado
    if (localStorage.getItem('userAuthToken')) {
        console.log('Usuario ya autenticado, redirigiendo...');
        
        // Obtener información del usuario
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Redirección inteligente basada en el rol
        if (currentUser && currentUser.rol === 'admin') {
            // Si es admin y está intentando acceder a una sección admin, respetar la redirección
            if (redirectUrl && redirectUrl.includes('/admin/')) {
                console.log('Redirigiendo admin a:', decodeURIComponent(redirectUrl));
                window.location.href = decodeURIComponent(redirectUrl);
            } 
            // Si es admin pero no tiene redirección específica o va al index, enviarlo al panel admin
            else {
                console.log('Redirigiendo admin a panel de control');
                window.location.href = '/admin/crud.html';
            }
        } else {
            // Para usuarios normales, seguir la redirección normal o ir a index
            if (redirectUrl) {
                console.log('Redirigiendo usuario a:', decodeURIComponent(redirectUrl));
                window.location.href = decodeURIComponent(redirectUrl);
            } else {
                console.log('Redirigiendo usuario a index');
                window.location.href = '/index.html';
            }
        }
        return;
    }
    
    // Manejar el formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Formulario de login encontrado, configurando evento');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener datos
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember-me')?.checked || false;
            
            console.log('Procesando login para:', email);
            
            // Validación básica
            if (!email || !password) {
                const errorMessage = document.getElementById('error-message');
                const loginError = document.getElementById('login-error');
                
                if (errorMessage) errorMessage.textContent = 'Por favor ingresa email y contraseña';
                if (loginError) loginError.style.display = 'block';
                return;
            }
            
            // Ocultar mensajes previos
            const loginError = document.getElementById('login-error');
            const loginSuccess = document.getElementById('login-success');
            
            if (loginError) loginError.style.display = 'none';
            if (loginSuccess) loginSuccess.style.display = 'none';
            
            // Deshabilitar botón mientras se procesa
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            let originalBtnText = '';
            
            if (submitBtn) {
                originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Iniciando sesión...';
            }
            
            try {
                // Verificar que userApi existe
                if (!window.userApi) {
                    throw new Error('Error en la inicialización de la API de usuario');
                }
                
                console.log('Enviando solicitud login a API...');
                
                // Llamar a la API
                const response = await window.userApi.login(email, password);
                
                console.log('Login exitoso, guardando token');
                
                // Guardar token en localStorage
                window.userApi.setToken(response.token);
                localStorage.setItem('currentUser', JSON.stringify(response.usuario));
                
                // Configurar el tiempo de expiración basado en "recordarme"
                const expirationTime = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 días o 1 día
                
                // Guardar token en cookie con tiempo de expiración adecuado
                document.cookie = `authToken=${response.token}; path=/; max-age=${expirationTime}; samesite=strict`;
                
                // Si recordarme está marcado, guardar también esa preferencia
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                // Mostrar mensaje de éxito
                if (loginSuccess) {
                    const successMessage = document.getElementById('success-message');
                    if (successMessage) successMessage.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                    loginSuccess.style.display = 'block';
                } else {
                    // Alternativa si no existe el elemento de éxito
                    alert('Inicio de sesión exitoso. Redirigiendo...');
                }
                
                // Notificar al carrito sobre el cambio de autenticación
                if (typeof notifyAuthChange === 'function') {
                    console.log('Notificando cambio de autenticación al carrito');
                    notifyAuthChange('login');
                }
                
                // Actualizar contador del carrito si está disponible
                if (typeof updateCartCount === 'function') {
                    console.log('Actualizando contador del carrito');
                    updateCartCount();
                }
                
                console.log('Procesando redirección después de login exitoso');
                
                // Redirección inteligente basada en el rol
                setTimeout(function() {
                    let redirectTarget = urlParams.get('redirect');
                    console.log('Destino de redirección:', redirectTarget);
                    
                    // Si es administrador y está accediendo al panel admin
                    if (response.usuario && response.usuario.rol === 'admin') {
                        if (redirectTarget && redirectTarget.includes('/admin/')) {
                            window.location.href = decodeURIComponent(redirectTarget);
                        } 
                        // Si es admin sin redirección específica, ir a CRUD (no a index)
                        else {
                            window.location.href = '/admin/crud.html';
                        }
                    } 
                    // En otros casos, seguir la redirección normal o ir a index
                    else {
                        if (redirectTarget) {
                            // Asegurarnos de decodificar la URL correctamente
                            console.log('Redirigiendo a:', decodeURIComponent(redirectTarget));
                            window.location.href = decodeURIComponent(redirectTarget);
                        } else {
                            console.log('Redirigiendo a página principal');
                            window.location.href = '/index.html';
                        }
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Error durante el login:', error);
                
                // Mostrar error
                if (loginError) {
                    const errorMessage = document.getElementById('error-message');
                    if (errorMessage) {
                        errorMessage.textContent = error.message || 'Error al iniciar sesión. Comprueba tus credenciales.';
                    }
                    loginError.style.display = 'block';
                } else {
                    // Alternativa si no existe el elemento de error
                    alert('Error: ' + (error.message || 'Error al iniciar sesión. Comprueba tus credenciales.'));
                }
                
                // Habilitar botón
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    } else {
        console.warn('No se encontró el formulario de login');
    }
    
    // Verificar si hay una sesión guardada con "recordarme"
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
        const rememberMeCheckbox = document.getElementById('remember-me');
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }
    
    // Inicializar contador del carrito
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    
    // Agregar rastreador para debugging
    console.log('=== ESTADO ACTUAL ===');
    console.log('Token en localStorage:', !!localStorage.getItem('userAuthToken'));
    console.log('Usuario en localStorage:', !!localStorage.getItem('currentUser'));
    console.log('URL actual:', window.location.href);
    console.log('Servicios disponibles:', {
        userApi: !!window.userApi,
        updateCartCount: typeof updateCartCount === 'function',
        notifyAuthChange: typeof notifyAuthChange === 'function'
    });
});

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Función para mostrar toast
function showToast(message, type = 'success') {
    // Crear toast container si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Crear el toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    let icon = 'check-circle';
    if (type === 'danger') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'info') icon = 'info-circle';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${icon} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Inicializar y mostrar el toast
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000
    });
    bsToast.show();
    
    // Eliminar el toast después de ocultarse
    toast.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// Añadir código para manejar botones de checkout desde páginas de carrito
document.addEventListener('cart-ready', function() {
    console.log('Detectado evento cart-ready, configurando botones de checkout');
    
    // Buscar todos los botones de checkout en la página
    const allButtons = document.querySelectorAll('button, a');
    const checkoutButtons = Array.from(allButtons).filter(btn => 
        btn.textContent.includes('Proceder al pago') || 
        btn.id === 'checkout-button' || 
        btn.id === 'checkout-btn' ||
        btn.classList.contains('btn-proceder-pago') ||
        btn.querySelector('i.fa-lock')
    );
    
    console.log('Botones de checkout encontrados:', checkoutButtons.length);
    
    // Configurar cada botón
    checkoutButtons.forEach(btn => {
        // Clonar para eliminar eventos previos
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
        }
        
        // Añadir nuevo evento
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('Botón de checkout clickeado');
            
            // Verificar autenticación
            if (!window.isAuthenticated || !window.isAuthenticated()) {
                console.log('Usuario no autenticado, redirigiendo a login');
                
                if (typeof window.showToast === 'function') {
                    window.showToast('Debes iniciar sesión para continuar', 'warning');
                } else {
                    alert('Debes iniciar sesión para continuar');
                }
                
                // Redireccionar a login con la URL de checkout como destino
                setTimeout(() => {
                    window.location.href = '/pages/login.html?redirect=' + encodeURIComponent('/checkout.html');
                }, 1000);
                return;
            }
            
            // Verificar carrito no vacío
            const cart = getCartFromStorage();
            if (!cart || !cart.items || cart.items.length === 0) {
                if (typeof window.showToast === 'function') {
                    window.showToast('El carrito está vacío', 'warning');
                } else {
                    alert('El carrito está vacío');
                }
                return;
            }
            
            // Redireccionar a checkout
            window.location.href = '/checkout.html';
        });
    });
    
    // Función auxiliar para obtener carrito
    function getCartFromStorage() {
        try {
            const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userId = userData.id || userData.userId;
            const storageKey = userId ? `user_cart_${userId}` : 'carrito';
            
            const cartData = localStorage.getItem(storageKey);
            if (!cartData) {
                return { items: [], total: 0 };
            }
            return JSON.parse(cartData);
        } catch (error) {
            console.error('Error al obtener carrito:', error);
            return { items: [], total: 0 };
        }
    }
});

// Disparar evento cart-ready cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para asegurar que todos los scripts se hayan cargado
    setTimeout(() => {
        document.dispatchEvent(new Event('cart-ready'));
    }, 500);
});