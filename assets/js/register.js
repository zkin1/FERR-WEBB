document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario ya está autenticado
    if (localStorage.getItem('userAuthToken')) {
        window.location.href = '/index.html'; // Redirigir a inicio si ya está autenticado
        return;
    }
    
    // Validador de RUT
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                const formattedRut = formatRut(this.value);
                this.value = formattedRut;
                
                if (!validateRut(formattedRut)) {
                    this.setCustomValidity('RUT inválido');
                    this.classList.add('is-invalid');
                } else {
                    this.setCustomValidity('');
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            }
        });
    }
    
    // Manejar el formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Ocultar mensajes previos
            document.getElementById('register-error').style.display = 'none';
            document.getElementById('register-success').style.display = 'none';
            
            // Validar contraseñas
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                document.getElementById('error-message').textContent = 'Las contraseñas no coinciden';
                document.getElementById('register-error').style.display = 'block';
                return;
            }
            
            // Validar RUT si se proporcionó
            const rut = document.getElementById('rut').value;
            if (rut && !validateRut(rut)) {
                document.getElementById('error-message').textContent = 'El RUT ingresado no es válido';
                document.getElementById('register-error').style.display = 'block';
                return;
            }
            
            // Deshabilitar botón mientras se procesa
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando...';
            
            // Preparar datos
            const userData = {
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                email: document.getElementById('email').value,
                password: password,
                rut: rut || '',
                telefono: document.getElementById('telefono').value || '',
                direccion: document.getElementById('direccion').value || '',
                comuna: document.getElementById('comuna').value || '',
                ciudad: document.getElementById('ciudad').value || '',
                region: document.getElementById('region').value || ''
            };
            
            try {
                // Llamar a la API
                const response = await window.userApi.register(userData);
                
                // Guardar token y datos del usuario
                window.userApi.setToken(response.token);
                localStorage.setItem('currentUser', JSON.stringify(response.usuario));
                
                // Mostrar mensaje de éxito
                document.getElementById('success-message').textContent = 'Registro exitoso. Redirigiendo...';
                document.getElementById('register-success').style.display = 'block';
                
                // Redirigir
                setTimeout(function() {
                    window.location.href = '/index.html';
                }, 1500);
                
            } catch (error) {
                // Mostrar error
                document.getElementById('error-message').textContent = error.message || 'Error al registrar. Intenta con un email diferente.';
                document.getElementById('register-error').style.display = 'block';
                
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
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Función para formatear RUT chileno
function formatRut(rut) {
    if (!rut || rut.length === 0) return '';
    
    // Eliminar puntos y guiones
    const cleanRut = rut.replace(/\./g, '').replace('-', '');
    
    // Obtener dígito verificador
    const dv = cleanRut.slice(-1);
    // Obtener cuerpo del RUT
    const rutBody = cleanRut.slice(0, -1);
    
    // Formatear con puntos
    let formattedRut = '';
    for (let i = rutBody.length - 1, j = 0; i >= 0; i--, j++) {
        formattedRut = rutBody.charAt(i) + formattedRut;
        if ((j + 1) % 3 === 0 && i !== 0) {
            formattedRut = '.' + formattedRut;
        }
    }
    
    return `${formattedRut}-${dv}`;
}

// Función para validar RUT chileno
function validateRut(rut) {
    if (!rut || rut.length < 3) return false;
    
    // Eliminar puntos y guiones
    const cleanRut = rut.replace(/\./g, '').replace('-', '');
    
    // Obtener dígito verificador
    const dv = cleanRut.slice(-1).toUpperCase();
    
    // Obtener cuerpo del RUT
    const rutBody = parseInt(cleanRut.slice(0, -1), 10);
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    let rutString = rutBody.toString();
    for (let i = rutString.length - 1; i >= 0; i--) {
        sum += parseInt(rutString.charAt(i), 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDV = 11 - (sum % 11);
    
    // Convertir a string según regla
    let expectedDV;
    if (calculatedDV === 11) {
        expectedDV = '0';
    } else if (calculatedDV === 10) {
        expectedDV = 'K';
    } else {
        expectedDV = calculatedDV.toString();
    }
    
    return dv === expectedDV;
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