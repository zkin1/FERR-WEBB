document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('userAuthToken');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!token || Object.keys(userData).length === 0) {
        // No hay usuario autenticado, redirigir al login
        window.location.href = '/pages/login.html?redirect=/pages/profile.html';
        return;
    }
    
    // Cargar datos del perfil
    loadUserProfile();
    
    // Cargar direcciones si existe la sección
    if (document.getElementById('userAddresses')) {
        loadUserAddresses();
    }
    
    // Manejar eventos de formularios
    setupFormHandlers();
});

// Cargar información del perfil del usuario
async function loadUserProfile() {
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Si tenemos ID de usuario, intentar cargar datos actualizados desde la API
        if (userData.id && window.userApi) {
            try {
                const freshUserData = await window.userApi.getUserById(userData.id);
                if (freshUserData) {
                    // Actualizar datos en localStorage
                    localStorage.setItem('currentUser', JSON.stringify(freshUserData));
                    // Usar los datos actualizados
                    displayUserProfile(freshUserData);
                    return;
                }
            } catch (error) {
                console.warn('Error al obtener datos actualizados del usuario:', error);
                // Continuar con los datos almacenados en localStorage
            }
        }
        
        // Si no pudimos obtener datos actualizados, usar los que están en localStorage
        displayUserProfile(userData);
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        showAlert('error', 'No se pudieron cargar los datos del perfil');
    }
}

// Mostrar datos del perfil en la página
function displayUserProfile(user) {
    console.log('Mostrando perfil del usuario:', user);
    
    // Actualizar los campos del formulario si existen
    const fields = [
        { id: 'nombre', value: user.nombre || '' },
        { id: 'apellido', value: user.apellido || '' },
        { id: 'email', value: user.email || '' },
        { id: 'rut', value: user.rut || '' },
        { id: 'telefono', value: user.telefono || '' }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value;
        }
    });
    
    // Mostrar información adicional si existe el contenedor
    const userInfoContainer = document.getElementById('userInfo');
    if (userInfoContainer) {
        userInfoContainer.innerHTML = `
            <div class="mb-3">
                <strong>Tipo de cuenta:</strong> ${user.rol ? (user.rol.charAt(0).toUpperCase() + user.rol.slice(1)) : 'Cliente'}
            </div>
            <div class="mb-3">
                <strong>Registro:</strong> ${user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : 'No disponible'}
            </div>
            <div class="mb-3">
                <strong>Último acceso:</strong> ${user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString() : 'Primer inicio de sesión'}
            </div>
        `;
    }
    
    // También actualizar cualquier otro elemento que muestre el nombre del usuario
    const usernameElements = document.querySelectorAll('.profile-username');
    usernameElements.forEach(element => {
        element.textContent = user.nombre || 'Usuario';
    });
}

// Cargar direcciones del usuario
async function loadUserAddresses() {
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!userData.id || !window.userApi) return;
        
        // Obtener direcciones del usuario desde la API
        const addresses = await window.userApi.getUserAddresses(userData.id);
        
        // Mostrar direcciones
        displayUserAddresses(addresses);
    } catch (error) {
        console.error('Error al cargar direcciones:', error);
        const addressesContainer = document.getElementById('userAddresses');
        if (addressesContainer) {
            addressesContainer.innerHTML = '<div class="alert alert-danger">Error al cargar las direcciones. Intenta nuevamente más tarde.</div>';
        }
    }
}

// Mostrar direcciones en la página
function displayUserAddresses(addresses) {
    const addressesContainer = document.getElementById('userAddresses');
    if (!addressesContainer) return;
    
    if (!addresses || addresses.length === 0) {
        addressesContainer.innerHTML = '<div class="alert alert-info">No tienes direcciones registradas.</div>';
        return;
    }
    
    // Mostrar direcciones
    let html = '<div class="row">';
    addresses.forEach(address => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card ${address.predeterminada ? 'border-primary' : ''} h-100">
                    <div class="card-body">
                        ${address.predeterminada ? '<span class="badge bg-primary float-end">Predeterminada</span>' : ''}
                        <h5 class="card-title">${address.direccion}</h5>
                        <p class="card-text">
                            ${address.comuna}, ${address.ciudad}<br>
                            ${address.region}
                            ${address.codigo_postal ? `<br>CP: ${address.codigo_postal}` : ''}
                            ${address.telefono ? `<br>Tel: ${address.telefono}` : ''}
                        </p>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary edit-address" data-id="${address.id}">
                                <i class="fas fa-pencil-alt"></i> Editar
                            </button>
                            ${!address.predeterminada ? `
                                <button class="btn btn-sm btn-outline-success set-default-address" data-id="${address.id}">
                                    <i class="fas fa-check"></i> Predeterminada
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-danger delete-address" data-id="${address.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    addressesContainer.innerHTML = html;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.edit-address').forEach(btn => {
        btn.addEventListener('click', () => editAddress(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-address').forEach(btn => {
        btn.addEventListener('click', () => deleteAddress(btn.dataset.id));
    });
    
    document.querySelectorAll('.set-default-address').forEach(btn => {
        btn.addEventListener('click', () => setDefaultAddress(btn.dataset.id));
    });
}

// Configurar manejadores de eventos para formularios
function setupFormHandlers() {
    // Formulario de actualización de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateUserProfile);
    }
    
    // Formulario de cambio de contraseña
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changeUserPassword);
    }
    
    // Formulario de nueva dirección
    const addressForm = document.getElementById('newAddressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', addUserAddress);
    }
}

// Actualizar perfil de usuario
async function updateUserProfile(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
    
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!userData.id || !window.userApi) {
            throw new Error('No se puede actualizar el perfil');
        }
        
        const updateData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            telefono: document.getElementById('telefono').value
        };
        
        // Actualizar perfil
        const response = await window.userApi.updateUser(userData.id, updateData);
        
        // Actualizar datos en localStorage
        if (response.usuario) {
            localStorage.setItem('currentUser', JSON.stringify(response.usuario));
        }
        
        showAlert('success', 'Perfil actualizado exitosamente');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showAlert('error', 'Error al actualizar perfil: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Cambiar contraseña
async function changeUserPassword(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cambiando...';
    
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!userData.id || !window.userApi) {
            throw new Error('No se puede cambiar la contraseña');
        }
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            throw new Error('Las contraseñas nuevas no coinciden');
        }
        
        // Cambiar contraseña
        await window.userApi.changePassword(userData.id, currentPassword, newPassword);
        
        // Limpiar formulario
        this.reset();
        
        showAlert('success', 'Contraseña actualizada exitosamente');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showAlert('error', 'Error al cambiar contraseña: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Agregar nueva dirección
async function addUserAddress(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
    
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!userData.id || !window.userApi) {
            throw new Error('No se puede agregar la dirección');
        }
        
        const addressData = {
            usuario_id: userData.id,
            direccion: document.getElementById('nuevaDireccion').value,
            comuna: document.getElementById('nuevaComuna').value,
            ciudad: document.getElementById('nuevaCiudad').value,
            region: document.getElementById('nuevaRegion').value,
            codigo_postal: document.getElementById('nuevoCodigoPostal')?.value || '',
            telefono: document.getElementById('nuevoTelefono')?.value || '',
            instrucciones: document.getElementById('nuevasInstrucciones')?.value || '',
            predeterminada: document.getElementById('nuevaPredeterminada')?.checked || false
        };
        
        // Crear dirección
        await window.userApi.createAddress(addressData);
        
        // Recargar direcciones
        loadUserAddresses();
        
        // Limpiar formulario
        this.reset();
        
        // Cerrar modal si existe
        const modal = bootstrap.Modal.getInstance(document.getElementById('newAddressModal'));
        if (modal) {
            modal.hide();
        }
        
        showAlert('success', 'Dirección agregada exitosamente');
    } catch (error) {
        console.error('Error al agregar dirección:', error);
        showAlert('error', 'Error al agregar dirección: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Editar dirección existente
async function editAddress(addressId) {
    try {
        if (!window.userApi) {
            throw new Error('API no disponible');
        }
        
        // Obtener datos de la dirección
        const address = await window.userApi.getAddressById(addressId);
        
        // Abrir modal de edición si existe
        const editModal = new bootstrap.Modal(document.getElementById('editAddressModal'));
        
        // Llenar formulario con datos actuales
        document.getElementById('editAddressId').value = address.id;
        document.getElementById('editDireccion').value = address.direccion;
        document.getElementById('editComuna').value = address.comuna;
        document.getElementById('editCiudad').value = address.ciudad;
        document.getElementById('editRegion').value = address.region;
        document.getElementById('editCodigoPostal').value = address.codigo_postal || '';
        document.getElementById('editTelefono').value = address.telefono || '';
        document.getElementById('editInstrucciones').value = address.instrucciones || '';
        document.getElementById('editPredeterminada').checked = address.predeterminada;
        
        // Mostrar modal
        editModal.show();
        
        // Configurar evento de guardado
        const editForm = document.getElementById('editAddressForm');
        if (editForm) {
            // Clonar para eliminar eventos anteriores
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            
            newEditForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = newEditForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
                
                try {
                    const addressData = {
                        direccion: document.getElementById('editDireccion').value,
                        comuna: document.getElementById('editComuna').value,
                        ciudad: document.getElementById('editCiudad').value,
                        region: document.getElementById('editRegion').value,
                        codigo_postal: document.getElementById('editCodigoPostal').value,
                        telefono: document.getElementById('editTelefono').value,
                        instrucciones: document.getElementById('editInstrucciones').value,
                        predeterminada: document.getElementById('editPredeterminada').checked
                    };
                    
                    // Actualizar dirección
                    await window.userApi.updateAddress(addressId, addressData);
                    
                    // Cerrar modal
                    bootstrap.Modal.getInstance(document.getElementById('editAddressModal')).hide();
                    
                    // Recargar direcciones
                    loadUserAddresses();
                    
                    showAlert('success', 'Dirección actualizada exitosamente');
                } catch (error) {
                    console.error('Error al actualizar dirección:', error);
                    showAlert('error', 'Error al actualizar dirección: ' + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            });
        }
    } catch (error) {
        console.error('Error al obtener dirección para editar:', error);
        showAlert('error', 'Error al cargar datos de la dirección: ' + error.message);
    }
}

// Eliminar dirección
async function deleteAddress(addressId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
        return;
    }
    
    try {
        if (!window.userApi) {
            throw new Error('API no disponible');
        }
        
        await window.userApi.deleteAddress(addressId);
        
        // Recargar direcciones
        loadUserAddresses();
        
        showAlert('success', 'Dirección eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        showAlert('error', 'Error al eliminar dirección: ' + error.message);
    }
}

// Establecer dirección como predeterminada
async function setDefaultAddress(addressId) {
    try {
        if (!window.userApi) {
            throw new Error('API no disponible');
        }
        
        await window.userApi.setDefaultAddress(addressId);
        
        // Recargar direcciones
        loadUserAddresses();
        
        showAlert('success', 'Dirección establecida como predeterminada');
    } catch (error) {
        console.error('Error al establecer dirección predeterminada:', error);
        showAlert('error', 'Error al establecer dirección predeterminada: ' + error.message);
    }
}

// Función para mostrar alertas
function showAlert(type, message) {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) {
        // Si no existe el contenedor, usar la función de toast global si está disponible
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
        return;
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertsContainer.appendChild(alertDiv);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}