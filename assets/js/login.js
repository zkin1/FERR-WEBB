document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario ya está autenticado
    if (localStorage.getItem('userAuthToken')) {
        window.location.href = '/index.html'; // Redirigir a inicio si ya está autenticado
        return;
    }
    
    // Manejar el formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener datos
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validación básica
            if (!email || !password) {
                document.getElementById('error-message').textContent = 'Por favor ingresa email y contraseña';
                document.getElementById('login-error').style.display = 'block';
                return;
            }
            
            // Ocultar mensajes previos
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('login-success').style.display = 'none';
            
            // Deshabilitar botón mientras se procesa
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Iniciando sesión...';
            
            try {
                // Llamar a la API
                const response = await window.userApi.login(email, password);
                
                // Guardar token y datos del usuario
                window.userApi.setToken(response.token);
                localStorage.setItem('currentUser', JSON.stringify(response.usuario));
                
                // Mostrar mensaje de éxito
                document.getElementById('success-message').textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                document.getElementById('login-success').style.display = 'block';
                
                // Redirigir
                setTimeout(function() {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/index.html';
                    window.location.href = redirectUrl;
                }, 1500);
                
            } catch (error) {
                // Mostrar error
                document.getElementById('error-message').textContent = error.message || 'Error al iniciar sesión. Comprueba tus credenciales.';
                document.getElementById('login-error').style.display = 'block';
                
                // Habilitar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Inicializar contador del carrito
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
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
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>${message}
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