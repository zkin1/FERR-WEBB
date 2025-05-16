function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling?.querySelector('i') || 
                document.querySelector(`.toggle-password[onclick*="${inputId}"] i`);
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fas fa-eye';
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

// Función para formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
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