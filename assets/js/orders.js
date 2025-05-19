document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const filterType = document.getElementById('filterType');
    const usuarioFilterDiv = document.getElementById('usuarioFilterDiv');
    const estadoFilterDiv = document.getElementById('estadoFilterDiv');
    const numeroFilterDiv = document.getElementById('numeroFilterDiv');
    const btnBuscar = document.getElementById('btnBuscar');
    const loadingMsg = document.getElementById('loadingMsg');
    const noOrdersMsg = document.getElementById('noOrdersMsg');
    const errorMsg = document.getElementById('errorMsg');
    const ordersContainer = document.getElementById('ordersContainer');
    const connectionStatus = document.getElementById('connectionStatus');
    const apiStatusText = document.getElementById('apiStatusText');
    
    // Botones de prueba
    const testConnection = document.getElementById('testConnection');
    const testFullOrder = document.getElementById('testFullOrder');
    
    // Elementos del modal
    let changeStatusModal;
    const modalOrderId = document.getElementById('modalOrderId');
    const modalOrderNumber = document.getElementById('modalOrderNumber');
    const modalCurrentStatus = document.getElementById('modalCurrentStatus');
    const modalNewStatus = document.getElementById('modalNewStatus');
    const modalComment = document.getElementById('modalComment');
    const btnSaveStatus = document.getElementById('btnSaveStatus');
    
    // Inicializar modal si Bootstrap está disponible
    if (typeof bootstrap !== 'undefined') {
        changeStatusModal = new bootstrap.Modal(document.getElementById('changeStatusModal'));
    }
    
    // Verificar si es admin y mostrar elementos correspondientes
    const userRole = getUserRole();
    const isAdmin = userRole === 'admin';
    
    // Mostrar u ocultar opciones según el rol
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
    
    // Si no es administrador, ocultar la opción de filtrar por estado
    if (!isAdmin) {
        const estadoOption = filterType.querySelector('option[value="estado"]');
        if (estadoOption) {
            estadoOption.style.display = 'none';
        }
    }
    
    // Si el usuario está autenticado, obtener su ID
    let usuarioId = 1; // Valor por defecto
    if (isAuthenticated()) {
        try {
            const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
            usuarioId = userData.id || 1;
            document.getElementById('usuarioId').value = usuarioId;
        } catch (e) {
            console.error('Error al obtener ID de usuario:', e);
        }
    } else {
        // Redirigir a la página de login si no está autenticado
        window.location.href = '/pages/login.html?redirect=orders.html';
    }
    
    // Función para formatear fecha
    function formatDate(dateString) {
        if (!dateString) return 'Fecha no disponible';
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
    
    // Función para formatear precio
    function formatPrice(price) {
        if (!price) return '0';
        return Number(price).toLocaleString('es-CL');
    }
    
    // Función para mostrar mensajes de tipo toast
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'danger' ? 'times-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        
        if (typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
            toast.show();
            
            // Eliminar el toast del DOM después de ocultarse
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        } else {
            // Fallback si Bootstrap no está disponible
            setTimeout(() => {
                toastEl.remove();
            }, 5000);
        }
    }
    
    // Verificar estado de conexión
    async function checkApiStatus() {
        try {
            // Cambiar a "verificando"
            apiStatusText.textContent = 'Verificando conexión...';
            connectionStatus.className = 'alert alert-info d-flex align-items-center mb-4';
            
            // Intenta hacer una solicitud simple
            const result = await window.PedidoAPI.testConnection();
            
            if (result.success) {
                // Actualizar UI para conexión exitosa
                apiStatusText.textContent = `Conectado (${result.responseTime}ms)`;
                connectionStatus.className = 'alert alert-success d-flex align-items-center mb-4';
                return true;
            } else {
                // Actualizar UI para error de conexión
                apiStatusText.textContent = `Error de conexión: ${result.error}`;
                connectionStatus.className = 'alert alert-danger d-flex align-items-center mb-4';
                return false;
            }
        } catch (error) {
            console.error('Error verificando API:', error);
            apiStatusText.textContent = `Error de conexión: ${error.message}`;
            connectionStatus.className = 'alert alert-danger d-flex align-items-center mb-4';
            return false;
        }
    }
    
    // Probar conexión con API
    testConnection.addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Probando...';
        
        const result = await checkApiStatus();
        
        if (result) {
            showToast('✅ Conexión con API exitosa!', 'success');
        } else {
            showToast('❌ Error de conexión con API', 'danger');
        }
        
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-plug me-1"></i> Probar API';
    });
    
    // Verificación completa de datos
    testFullOrder.addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Verificando...';
        
        try {
            // Primero verificamos la conexión
            const connectionResult = await window.PedidoAPI.testConnection();
            if (!connectionResult.success) {
                showToast('❌ No se puede verificar los datos: Error de conexión', 'danger');
                return;
            }
            
            // Intentamos consultar pedidos por usuario
            const result = await window.PedidoAPI.consultarPedidosPorUsuario(usuarioId);
            
            if (result.exito && result.pedidos && result.pedidos.length > 0) {
                // Verificar estructura de datos
                const pedido = result.pedidos[0];
                const requiredFields = ['id', 'numero_pedido', 'estado', 'fecha_pedido', 'detalles', 'total_final'];
                
                const missingFields = requiredFields.filter(field => !pedido.hasOwnProperty(field));
                
                if (missingFields.length > 0) {
                    showToast(`⚠️ Faltan campos en los datos: ${missingFields.join(', ')}`, 'warning');
                } else {
                    showToast('✅ Estructura de datos correcta', 'success');
                    
                    // Mostrar ejemplo de estructura
                    console.log('Ejemplo de estructura de pedido:', pedido);
                }
            } else if (result.exito && (!result.pedidos || result.pedidos.length === 0)) {
                showToast('⚠️ No hay pedidos para verificar la estructura', 'warning');
            } else {
                showToast(`❌ Error al verificar datos: ${result.mensaje}`, 'danger');
            }
        } catch (error) {
            console.error('Error en verificación completa:', error);
            showToast(`❌ Error: ${error.message}`, 'danger');
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-tasks me-1"></i> Verificar Datos';
        }
    });
    
    // Función para renderizar pedidos
    function renderOrders(orders) {
        ordersContainer.innerHTML = '';
        
        if (!orders || orders.length === 0) {
            loadingMsg.style.display = 'none';
            errorMsg.style.display = 'none';
            noOrdersMsg.style.display = 'block';
            return;
        }
        
        loadingMsg.style.display = 'none';
        errorMsg.style.display = 'none';
        noOrdersMsg.style.display = 'none';
        
        // Verificar estructura
        if (orders && orders.length > 0) {
            console.log('Verificando estructura de pedidos recibidos:');
            
            // Verificar campos necesarios en el primer pedido
            const firstOrder = orders[0];
            const requiredFields = ['id', 'numero_pedido', 'estado', 'fecha_pedido', 'detalles'];
            
            const missingFields = requiredFields.filter(field => !firstOrder.hasOwnProperty(field));
            
            if (missingFields.length > 0) {
                console.warn('⚠️ Faltan campos en la estructura de pedidos:', missingFields);
                console.log('Estructura recibida:', firstOrder);
            } else {
                console.log('✅ Estructura de pedidos correcta');
            }
        }
        
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'card order-card shadow-sm mb-4';
            
            // Calcular total de productos
            const totalItems = order.detalles && Array.isArray(order.detalles) 
                ? order.detalles.reduce((sum, detalle) => sum + (parseInt(detalle.cantidad) || 0), 0)
                : 0;
            
            // Crear HTML del pedido
            orderCard.innerHTML = `
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-shopping-bag me-2 text-primary"></i>
                        Pedido #${order.numero_pedido}
                    </h5>
                    <span class="status-badge status-${order.estado}">${order.estado.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 mb-3 mb-md-0">
                            <p class="text-muted mb-1"><i class="far fa-calendar-alt me-1"></i> Fecha:</p>
                            <p class="fw-bold">${formatDate(order.fecha_pedido)}</p>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <p class="text-muted mb-1"><i class="fas fa-user me-1"></i> Cliente ID:</p>
                            <p class="fw-bold">${order.usuario_id}</p>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <p class="text-muted mb-1"><i class="fas fa-box me-1"></i> Productos:</p>
                            <p class="fw-bold">${totalItems} ${totalItems === 1 ? 'item' : 'items'}</p>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <p class="text-muted mb-1"><i class="fas fa-dollar-sign me-1"></i> Total:</p>
                            <p class="fw-bold text-success">$${formatPrice(order.total_final)}</p>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <button class="btn btn-outline-primary btn-sm me-2 btn-toggle-details">
                            <i class="fas fa-eye me-1"></i>Ver detalles
                        </button>
                        ${isAdmin ? `
                        <button class="btn btn-outline-success btn-sm me-2 btn-change-status" 
                                data-order-id="${order.id}" 
                                data-order-number="${order.numero_pedido}"
                                data-order-status="${order.estado}">
                            <i class="fas fa-exchange-alt me-1"></i>Cambiar estado
                        </button>` : ''}
                    </div>
                    
                    <div class="order-details mt-4">
                        <h6 class="border-bottom pb-2 text-primary">Detalles del Pedido</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-center">Cantidad</th>
                                        <th class="text-end">Precio Unit.</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.detalles && Array.isArray(order.detalles) ? order.detalles.map(detalle => `
                                        <tr>
                                            <td>${detalle.nombre_producto}</td>
                                            <td class="text-center">${detalle.cantidad}</td>
                                            <td class="text-end">$${formatPrice(detalle.precio_unitario)}</td>
                                            <td class="text-end">$${formatPrice(detalle.cantidad * detalle.precio_unitario)}</td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="4" class="text-center">No hay detalles disponibles</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            ordersContainer.appendChild(orderCard);
            
            // Agregar eventos
            const btnToggleDetails = orderCard.querySelector('.btn-toggle-details');
            const orderDetails = orderCard.querySelector('.order-details');
            
            btnToggleDetails.addEventListener('click', function() {
                orderDetails.classList.toggle('show');
                this.innerHTML = orderDetails.classList.contains('show') ? 
                    '<i class="fas fa-eye-slash me-1"></i>Ocultar detalles' : 
                    '<i class="fas fa-eye me-1"></i>Ver detalles';
            });
            
            // Si es admin, agregar evento para cambiar estado
            if (isAdmin && changeStatusModal) {
                const btnChangeStatus = orderCard.querySelector('.btn-change-status');
                btnChangeStatus.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    const orderNumber = this.getAttribute('data-order-number');
                    const orderStatus = this.getAttribute('data-order-status');
                    
                    modalOrderId.value = orderId;
                    modalOrderNumber.value = orderNumber;
                    modalCurrentStatus.value = orderStatus.toUpperCase();
                    modalNewStatus.value = orderStatus;
                    modalComment.value = '';
                    
                    changeStatusModal.show();
                });
            }
        });
    }
    
    // Cambiar controles de filtro según selección
    filterType.addEventListener('change', function() {
        usuarioFilterDiv.style.display = 'none';
        estadoFilterDiv.style.display = 'none';
        numeroFilterDiv.style.display = 'none';
        
        switch(this.value) {
            case 'usuario':
                usuarioFilterDiv.style.display = 'block';
                break;
            case 'estado':
                estadoFilterDiv.style.display = 'block';
                break;
            case 'numero':
                numeroFilterDiv.style.display = 'block';
                break;
        }
    });
    
    // Buscar pedidos
    btnBuscar.addEventListener('click', async function() {
        loadingMsg.style.display = 'block';
        noOrdersMsg.style.display = 'none';
        errorMsg.style.display = 'none';
        ordersContainer.innerHTML = '';
        
        try {
            let result;
            
            switch(filterType.value) {
                case 'usuario':
                    const usuarioId = document.getElementById('usuarioId').value;
                    result = await window.PedidoAPI.consultarPedidosPorUsuario(usuarioId);
                    renderOrders(result.pedidos);
                    break;
                    
                case 'estado':
                    const estado = document.getElementById('estadoPedido').value;
                    result = await window.PedidoAPI.consultarPedidosPorEstado(estado);
                    renderOrders(result.pedidos);
                    break;
                    
                case 'numero':
                    const numeroPedido = document.getElementById('numeroPedido').value;
                    if (!numeroPedido) {
                        showToast('Por favor ingrese un número de pedido', 'warning');
                        loadingMsg.style.display = 'none';
                        return;
                    }
                    result = await window.PedidoAPI.consultarPedido(null, numeroPedido);
                    if (result.exito && result.pedido) {
                        renderOrders([result.pedido]);
                    } else {
                        renderOrders([]);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error al buscar pedidos:', error);
            loadingMsg.style.display = 'none';
            errorMsg.style.display = 'block';
        }
    });
    
    // Cambiar estado de pedido (solo para administradores)
    if (isAdmin && btnSaveStatus) {
        btnSaveStatus.addEventListener('click', async function() {
            const orderId = modalOrderId.value;
            const orderNumber = modalOrderNumber.value;
            const newStatus = modalNewStatus.value;
            const comment = modalComment.value;
            
            try {
                btnSaveStatus.disabled = true;
                btnSaveStatus.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
                
                const result = await window.PedidoAPI.actualizarEstadoPedido(orderId, newStatus, comment);
                
                if (result.exito) {
                    if (changeStatusModal) {
                        changeStatusModal.hide();
                    }
                    showToast(`Estado del pedido #${orderNumber} actualizado correctamente`, 'success');
                    
                    // Recargar la búsqueda actual
                    btnBuscar.click();
                } else {
                    showToast(`Error: ${result.mensaje}`, 'danger');
                }
            } catch (error) {
                console.error('Error al actualizar estado:', error);
                showToast('Error al actualizar el estado. Por favor intente nuevamente.', 'danger');
            } finally {
                btnSaveStatus.disabled = false;
                btnSaveStatus.innerHTML = '<i class="fas fa-save me-1"></i> Guardar Cambios';
            }
        });
    }
    
    // Escuchar eventos de la API
    document.addEventListener('pedidoapi:response', function(e) {
        console.log(`Evento de respuesta API [${e.detail.operation}]:`, e.detail);
        
        // Actualizar indicador de estado de conexión
        apiStatusText.textContent = `Conectado (${e.detail.responseTime}ms)`;
        connectionStatus.className = 'alert alert-success d-flex align-items-center mb-4';
    });
    
    document.addEventListener('pedidoapi:error', function(e) {
        console.error(`Evento de error API [${e.detail.operation}]:`, e.detail);
        
        // Actualizar indicador de estado de conexión
        apiStatusText.textContent = `Error: ${e.detail.error}`;
        connectionStatus.className = 'alert alert-danger d-flex align-items-center mb-4';
    });
    
    // Inicialización: verificar conexión y cargar pedidos
    setTimeout(async () => {
        await checkApiStatus();
        btnBuscar.click();
    }, 500);
});