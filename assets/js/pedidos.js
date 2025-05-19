// assets/js/pedidos.js

// Configuración y variables globales
let currentPage = 1;
let totalPages = 1;
let pageSize = 5;
let currentFilters = {
    status: 'todos',
    date: 'todos',
    search: ''
};
let userOrders = [];

// Inicialización al cargar el documento
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }

    // Verificar que el servicio SOAP esté disponible
    if (!window.pedidosSoap) {
        console.error('El servicio pedidosSoap no está disponible. Cargando versión fallback...');
        cargarScriptPedidosSoap().then(() => {
            console.log('Script pedidosSoap cargado manualmente.');
            // Inicializar controladores de eventos
            initEventListeners();
            // Cargar los pedidos
            loadOrders();
        }).catch(err => {
            console.error('Error al cargar script pedidosSoap:', err);
            showErrorMessage('Error al cargar el módulo de pedidos. Intente recargar la página.');
        });
    } else {
        // Inicializar controladores de eventos
        initEventListeners();
        // Cargar los pedidos
        loadOrders();
    }
});

// Función para cargar script de pedidosSoap si no está disponible
function cargarScriptPedidosSoap() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/js/pedidosSoap.js';
        script.onload = () => {
            // Si el script cargó pero no inicializó el objeto, crearlo en modo failsafe
            if (!window.pedidosSoap) {
                console.warn('El script cargó pero no inicializó pedidosSoap. Creando modo failsafe...');
                window.pedidosSoap = {
                    getPedidosUsuario: async function(userId, filtros) {
                        console.log('Usando getPedidosUsuario fallback');
                        return { pedidos: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
                    },
                    getPedidoById: async function(pedidoId) {
                        console.log('Usando getPedidoById fallback');
                        return null;
                    },
                    cancelarPedido: async function(pedidoId, motivo) {
                        console.log('Usando cancelarPedido fallback');
                        return { success: false, message: 'No disponible en modo fallback' };
                    },
                    confirmarEntrega: async function(pedidoId) {
                        console.log('Usando confirmarEntrega fallback');
                        return { success: false, message: 'No disponible en modo fallback' };
                    }
                };
            }
            resolve();
        };
        script.onerror = () => {
            reject(new Error('No se pudo cargar el script pedidosSoap.js'));
        };
        document.head.appendChild(script);
    });
}

// Inicializar los controladores de eventos
function initEventListeners() {
    // Filtros
    document.getElementById('filter-status').addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        loadOrders();
    });
    
    document.getElementById('filter-date').addEventListener('change', function() {
        currentFilters.date = this.value;
        currentPage = 1;
        loadOrders();
    });
    
    // Búsqueda
    document.getElementById('btn-search-order').addEventListener('click', function() {
        const searchInput = document.getElementById('search-order');
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadOrders();
    });
    
    document.getElementById('search-order').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            currentFilters.search = this.value.trim();
            currentPage = 1;
            loadOrders();
        }
    });
    
    // Botón de actualizar
    document.getElementById('btn-refresh-orders').addEventListener('click', function() {
        loadOrders(true); // true para forzar recarga
    });
}

// Cargar pedidos del usuario
async function loadOrders(forceRefresh = false) {
    try {
        showLoading(true);
        
        // Obtener usuario actual
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            throw new Error('No se ha podido obtener información del usuario');
        }
        
        // Preparar filtros para el servicio SOAP
        const filtros = {
            pagina: currentPage,
            limite: pageSize
        };
        
        // Aplicar filtros
        if (currentFilters.status !== 'todos') {
            filtros.estado = currentFilters.status;
        }
        
        if (currentFilters.date !== 'todos') {
            const daysAgo = parseInt(currentFilters.date);
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - daysAgo);
            filtros.fechaDesde = fromDate.toISOString().split('T')[0];
        }
        
        if (currentFilters.search) {
            filtros.buscar = currentFilters.search;
        }
        
        console.log('Cargando pedidos con filtros:', filtros);
        
        // Llamar al servicio SOAP a través de pedidosSoap.js
        const data = await window.pedidosSoap.getPedidosUsuario(userId, filtros);
        
        // Guardar datos y actualizar UI
        userOrders = data.pedidos || [];
        totalPages = data.pagination?.totalPages || 1;
        
        // Actualizar la interfaz
        renderOrders();
        renderPagination();
        
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        showErrorMessage('No se pudieron cargar los pedidos. ' + error.message);
        
        // Cargar datos de ejemplo en caso de error (para desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            loadSampleOrders();
        }
    } finally {
        showLoading(false);
    }
}

// Renderizar los pedidos en la UI
function renderOrders() {
    const container = document.getElementById('orders-container');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Verificar si hay pedidos
    if (!userOrders || userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders text-center">
                <i class="fas fa-shopping-bag fa-4x text-muted mb-3"></i>
                <h3 class="text-muted">No tienes pedidos</h3>
                <p class="text-muted mb-4">No se encontraron pedidos con los filtros seleccionados.</p>
                <a href="/index.html" class="btn btn-primary">
                    <i class="fas fa-shopping-cart me-2"></i>Comprar ahora
                </a>
            </div>
        `;
        return;
    }
    
    // Crear tarjeta para cada pedido
    userOrders.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'card shadow-sm mb-4 order-card';
        
        // Determinar el color de la etiqueta de estado
        let statusColor = 'secondary';
        switch (pedido.estado.toLowerCase()) {
            case 'pagado': statusColor = 'primary'; break;
            case 'procesando': statusColor = 'info'; break;
            case 'enviado': statusColor = 'warning'; break;
            case 'entregado': statusColor = 'success'; break;
            case 'cancelado': statusColor = 'danger'; break;
            case 'pendiente': statusColor = 'secondary'; break;
        }
        
        // Formatear fecha
        const fecha = new Date(pedido.fecha_creacion);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Construir el HTML de la tarjeta
        card.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <span class="fw-bold">Pedido #${pedido.id}</span>
                    <span class="text-muted ms-2 d-none d-md-inline">
                        <i class="far fa-calendar-alt me-1"></i>${fechaFormateada}
                    </span>
                </div>
                <span class="badge bg-${statusColor} status-badge">${pedido.estado.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-7">
                        <p class="mb-2">
                            <i class="fas fa-box me-2"></i>
                            <strong>Productos:</strong> ${pedido.items?.length || 0} productos
                        </p>
                        <p class="mb-2">
                            <i class="fas fa-map-marker-alt me-2"></i>
                            <strong>Dirección:</strong> ${pedido.direccion_envio || 'No especificada'}
                        </p>
                        <p class="mb-2 d-md-none">
                            <i class="far fa-calendar-alt me-2"></i>
                            <strong>Fecha:</strong> ${fechaFormateada}
                        </p>
                    </div>
                    <div class="col-md-5 text-md-end mt-3 mt-md-0">
                        <h5 class="mb-3 text-primary">Total: $${formatPrice(pedido.total || 0)}</h5>
                        <button class="btn btn-outline-primary me-2 btn-sm view-details" data-id="${pedido.id}">
                            <i class="fas fa-eye me-1"></i>Ver detalles
                        </button>
                        ${pedido.estado === 'pendiente' ? 
                            `<button class="btn btn-danger btn-sm btn-cancel-order" data-id="${pedido.id}">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
        
        // Agregar la tarjeta al contenedor
        container.appendChild(card);
        
        // Agregar event listener para el botón de detalles
        card.querySelector('.view-details').addEventListener('click', function() {
            const orderId = this.dataset.id;
            showOrderDetail(orderId);
        });
        
        // Agregar event listener para el botón de cancelar (si existe)
        const cancelBtn = card.querySelector('.btn-cancel-order');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                confirmCancelOrder(orderId);
            });
        }
    });
}

// Renderizar paginación
function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Botón anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    if (currentPage > 1) {
        prevLi.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            currentPage--;
            loadOrders();
        });
    }
    paginationContainer.appendChild(prevLi);
    
    // Determinar qué páginas mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Asegurar que siempre mostramos 5 páginas si es posible
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Botones de página
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        
        if (i !== currentPage) {
            pageLi.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = i;
                loadOrders();
            });
        }
        
        paginationContainer.appendChild(pageLi);
    }
    
    // Botón siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Siguiente">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    if (currentPage < totalPages) {
        nextLi.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            currentPage++;
            loadOrders();
        });
    }
    paginationContainer.appendChild(nextLi);
}

// Mostrar detalle de un pedido específico
async function showOrderDetail(orderId) {
    try {
        showLoading(true);
        
        // Buscar el pedido en la lista actual
        let pedido = userOrders.find(p => p.id == orderId);
        
        // Si no lo encontramos, lo buscamos en la API SOAP
        if (!pedido) {
            pedido = await window.pedidosSoap.getPedidoById(orderId);
        }
        
        // Verificar que el pedido existe y es del usuario actual
        if (!pedido) {
            throw new Error('No se pudo encontrar el pedido');
        }
        
        // Verificar el stock actual de los productos
        await checkProductsStock(pedido);
        
        // Crear el contenido del modal
        const modalContent = document.getElementById('order-detail-content');
        const modalTitle = document.getElementById('orderDetailModalLabel');
        
        modalTitle.textContent = `Pedido #${pedido.id}`;
        
        // Formatear fecha
        const fecha = new Date(pedido.fecha_creacion);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determinar el color de la etiqueta de estado
        let statusColor = 'secondary';
        switch (pedido.estado.toLowerCase()) {
            case 'pagado': statusColor = 'primary'; break;
            case 'procesando': statusColor = 'info'; break;
            case 'enviado': statusColor = 'warning'; break;
            case 'entregado': statusColor = 'success'; break;
            case 'cancelado': statusColor = 'danger'; break;
            case 'pendiente': statusColor = 'secondary'; break;
        }
        
        // Construir HTML
        let itemsHTML = '';
        
        // Si el pedido tiene ítems
        if (pedido.items && pedido.items.length > 0) {
            itemsHTML = `
                <div class="table-responsive mt-3">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                                <th>Subtotal</th>
                                <th>Stock</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            pedido.items.forEach(item => {
                const stockClass = item.stockActual < item.cantidad ? 'text-danger' : 'text-success';
                const stockIcon = item.stockActual < item.cantidad ? 
                    '<i class="fas fa-exclamation-triangle"></i>' : 
                    '<i class="fas fa-check-circle"></i>';
                
                itemsHTML += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="/assets/images/productos/${item.codigo || item.id}.jpg" 
                                     class="product-img-sm me-3" 
                                     alt="${item.nombre}"
                                     onerror="this.src='/assets/images/productos/default.jpg'">
                                <div>
                                    <h6 class="mb-0">${item.nombre}</h6>
                                    <small class="text-muted">Código: ${item.codigo || 'N/A'}</small>
                                </div>
                            </div>
                        </td>
                        <td>${formatPrice(item.precio)}</td>
                        <td>${item.cantidad}</td>
                        <td>${formatPrice(item.precio * item.cantidad)}</td>
                        <td class="${stockClass}">
                            ${stockIcon} ${item.stockActual || 0} unidades
                        </td>
                    </tr>
                `;
            });
            
            itemsHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            itemsHTML = `<div class="alert alert-warning">No hay detalles de productos disponibles</div>`;
        }
        
        // Información de seguimiento
        const seguimientoHTML = generarHTMLSeguimiento(pedido);
        
        // Construir el contenido completo
        modalContent.innerHTML = `
            <div class="order-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <p class="mb-0 text-muted">
                        <i class="far fa-calendar-alt me-1"></i>
                        Realizado el ${fechaFormateada}
                    </p>
                </div>
                <span class="badge bg-${statusColor} status-badge">${pedido.estado.toUpperCase()}</span>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="border-bottom pb-2 mb-3">Información de Envío</h5>
                    <p><strong>Dirección:</strong> ${pedido.direccion_envio || 'No especificada'}</p>
                    <p><strong>Ciudad:</strong> ${pedido.ciudad || 'No especificada'}</p>
                    <p><strong>Método de envío:</strong> ${pedido.metodo_envio || 'Estándar'}</p>
                </div>
                <div class="col-md-6">
                    <h5 class="border-bottom pb-2 mb-3">Información de Pago</h5>
                    <p><strong>Método:</strong> ${pedido.metodo_pago || 'No especificado'}</p>
                    <p><strong>Estado:</strong> ${pedido.estado_pago || pedido.estado || 'No disponible'}</p>
                    ${pedido.codigo_autorizacion ? 
                        `<p><strong>Código de autorización:</strong> ${pedido.codigo_autorizacion}</p>` : ''}
                </div>
            </div>
            
            <h5 class="border-bottom pb-2 mb-3">Productos</h5>
            ${itemsHTML}
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h5 class="border-bottom pb-2 mb-3">Seguimiento</h5>
                    ${seguimientoHTML}
                </div>
                <div class="col-md-6">
                    <h5 class="border-bottom pb-2 mb-3">Resumen</h5>
                    <div class="d-flex justify-content-between mt-3">
                        <span>Subtotal:</span>
                        <span>${formatPrice(pedido.subtotal || (pedido.total - (pedido.envio || 0)))}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-2">
                        <span>Envío:</span>
                        <span>${formatPrice(pedido.envio || 0)}</span>
                    </div>
                    ${pedido.descuento ? 
                        `<div class="d-flex justify-content-between mt-2 text-success">
                            <span>Descuento:</span>
                            <span>-${formatPrice(pedido.descuento)}</span>
                        </div>` : ''}
                    <div class="d-flex justify-content-between mt-3 pt-3 border-top">
                        <strong>Total:</strong>
                        <strong class="text-primary">${formatPrice(pedido.total || 0)}</strong>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-end mt-4">
                ${pedido.estado === 'pendiente' ? 
                    `<button class="btn btn-danger me-2 btn-cancel-order-modal" data-id="${pedido.id}">
                        <i class="fas fa-times me-1"></i>Cancelar Pedido
                    </button>` : ''}
                ${pedido.estado === 'enviado' ? 
                    `<button class="btn btn-success me-2 btn-confirm-delivery" data-id="${pedido.id}">
                        <i class="fas fa-check me-1"></i>Confirmar Recepción
                    </button>` : ''}
            </div>
        `;
        
        // Agregar event listeners a los botones del modal
        const cancelBtn = modalContent.querySelector('.btn-cancel-order-modal');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                // Cerrar modal primero
                const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
                modal.hide();
                // Luego confirmar cancelación
                setTimeout(() => {
                    confirmCancelOrder(orderId);
                }, 500);
            });
        }
        
        const confirmDeliveryBtn = modalContent.querySelector('.btn-confirm-delivery');
        if (confirmDeliveryBtn) {
            confirmDeliveryBtn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                confirmDelivery(orderId);
            });
        }
        
        // Abrir el modal
        const orderModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        orderModal.show();
        
    } catch (error) {
        console.error('Error al mostrar detalles del pedido:', error);
        showErrorMessage('No se pudieron cargar los detalles del pedido.');
    } finally {
        showLoading(false);
    }
}

// Generar HTML para el seguimiento del pedido
function generarHTMLSeguimiento(pedido) {
    // Definir posibles estados en orden
    const estadosOrdenados = ['pendiente', 'pagado', 'procesando', 'enviado', 'entregado'];
    
    // Si el pedido está cancelado, manejarlo de manera especial
    if (pedido.estado === 'cancelado') {
        return `
            <div class="timeline">
                <div class="timeline-item canceled">
                    <span class="fw-bold">Pedido cancelado</span>
                    <p class="mb-0 text-muted small">
                        ${pedido.fecha_cancelacion ? 
                            `El ${new Date(pedido.fecha_cancelacion).toLocaleDateString('es-ES')}` : 
                            'Fecha no disponible'}
                    </p>
                    <p class="text-danger small">${pedido.motivo_cancelacion || 'No se especificó motivo'}</p>
                </div>
            </div>
        `;
    }
    
    // Obtener el índice del estado actual
    const indiceEstadoActual = estadosOrdenados.indexOf(pedido.estado.toLowerCase());
    
    // Construir la línea de tiempo
    let timelineHTML = '<div class="timeline">';
    
    estadosOrdenados.forEach((estado, index) => {
        // Determinar la clase para este elemento
        let clase = '';
        if (index < indiceEstadoActual) {
            clase = 'completed'; // Estados ya pasados
        } else if (index === indiceEstadoActual) {
            clase = 'current'; // Estado actual
        } else {
            clase = 'pending'; // Estados futuros
        }
        
        // Obtener fecha para este estado (si existe)
        let fecha = '';
        switch (estado) {
            case 'pendiente': 
                fecha = pedido.fecha_creacion;
                break;
            case 'pagado': 
                fecha = pedido.fecha_pago;
                break;
            case 'procesando': 
                fecha = pedido.fecha_procesamiento;
                break;
            case 'enviado': 
                fecha = pedido.fecha_envio;
                break;
            case 'entregado': 
                fecha = pedido.fecha_entrega;
                break;
        }
        
        // Formatear fecha si existe
        const fechaFormateada = fecha ? 
            new Date(fecha).toLocaleDateString('es-ES', {
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric'
            }) : '';
        
        // Traducir el estado para mostrar
        let estadoTraducido = '';
        switch (estado) {
            case 'pendiente': estadoTraducido = 'Pedido realizado'; break;
            case 'pagado': estadoTraducido = 'Pago confirmado'; break;
            case 'procesando': estadoTraducido = 'En preparación'; break;
            case 'enviado': estadoTraducido = 'Enviado'; break;
            case 'entregado': estadoTraducido = 'Entregado'; break;
        }
        
        // Construcción del elemento de la línea de tiempo
        timelineHTML += `
            <div class="timeline-item ${clase}">
                <span class="fw-bold">${estadoTraducido}</span>
                ${fechaFormateada ? 
                    `<p class="mb-0 text-muted small">${fechaFormateada}</p>` : 
                    (clase === 'pending' ? 
                        `<p class="mb-0 text-muted small">Pendiente</p>` : 
                        '')
                }
                ${estado === 'enviado' && pedido.numero_seguimiento ? 
                    `<p class="mb-0 small">
                        <strong>Seguimiento:</strong>
                        <a href="#" class="tracking-link" data-tracking="${pedido.numero_seguimiento}">${pedido.numero_seguimiento}</a>
                    </p>` : 
                    ''
                }
            </div>
        `;
    });
    
    timelineHTML += '</div>';
    return timelineHTML;
}

// Verificar stock actual de productos
async function checkProductsStock(pedido) {
    if (!pedido.items || pedido.items.length === 0) {
        return;
    }
    
    try {
        // Verificar que el servicio inventarioSoap esté disponible
        if (!window.inventarioSoap || !window.inventarioSoap.getProductStock) {
            console.warn('Servicio inventarioSoap no disponible para verificar stock');
            // Asignar valores de stock de prueba
            pedido.items.forEach(item => {
                // Valor aleatorio para simulación
                item.stockActual = Math.floor(Math.random() * 20);
            });
            return;
        }
        
        // Para cada producto en el pedido, verificar stock
        for (const item of pedido.items) {
            try {
                // Obtener stock mediante el servicio SOAP
                const stockResult = await window.inventarioSoap.getProductStock(item.producto_id || item.id);
                
                // Procesar respuesta SOAP
                let stockTotal = 0;
                
                if (stockResult.stockItems && stockResult.stockItems.stockItem) {
                    // Puede ser un solo objeto o un array
                    const stockItems = Array.isArray(stockResult.stockItems.stockItem) ? 
                        stockResult.stockItems.stockItem : 
                        [stockResult.stockItems.stockItem];
                    
                    // Sumar el stock de todas las ubicaciones
                    stockItems.forEach(stockItem => {
                        stockTotal += parseInt(stockItem.cantidad || 0);
                    });
                }
                
                // Guardar el stock actual en el item
                item.stockActual = stockTotal;
            } catch (itemError) {
                console.error(`Error al obtener stock para producto ${item.id}:`, itemError);
                // Asignar un valor por defecto
                item.stockActual = 0;
            }
        }
    } catch (error) {
        console.error('Error al verificar stock de productos:', error);
        // No lanzar error, simplemente continuar sin datos de stock
        pedido.items.forEach(item => {
            item.stockActual = 0;
        });
    }
}

// Confirmar cancelación de pedido
function confirmCancelOrder(orderId) {
    if (confirm('¿Estás seguro que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
        cancelOrder(orderId);
    }
}

// Cancelar pedido
async function cancelOrder(orderId) {
    try {
        showLoading(true);
        
        // Usar servicio SOAP para cancelar el pedido
        const result = await window.pedidosSoap.cancelarPedido(orderId, 'Cancelado por el cliente');
        
        if (!result.success) {
            throw new Error(result.message || 'Error al cancelar el pedido');
        }
        
        showToast('Pedido cancelado correctamente', 'success');
        
        // Recargar pedidos
        loadOrders();
        
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        showErrorMessage('No se pudo cancelar el pedido. ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Confirmar recepción de pedido
async function confirmDelivery(orderId) {
    try {
        if (!confirm('¿Confirmas que has recibido este pedido?')) {
            return;
        }
        
        showLoading(true);
        
        // Usar servicio SOAP para confirmar la entrega
        const result = await window.pedidosSoap.confirmarEntrega(orderId);
        
        if (!result.success) {
            throw new Error(result.message || 'Error al confirmar la entrega');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
        modal.hide();
        
        showToast('Recepción del pedido confirmada correctamente', 'success');
        
        // Recargar pedidos
        loadOrders();
        
    } catch (error) {
        console.error('Error al confirmar entrega:', error);
        showErrorMessage('No se pudo confirmar la entrega. ' + error.message);
    } finally {
        showLoading(false);
    }
}

// =================== UTILIDADES ===================

// Mostrar/ocultar indicador de carga
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (show) {
        loadingIndicator.style.display = 'block';
    } else {
        loadingIndicator.style.display = 'none';
    }
}

// Mostrar un mensaje de error
function showErrorMessage(message) {
    showToast(message, 'danger');
}

// Mostrar toast
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastContainer.removeChild(toastEl);
    });
    
    toast.show();
}

// Formatear precio como string
function formatPrice(price) {
    if (typeof window.formatPrice === 'function') {
        return window.formatPrice(price);
    }
    
    return Number(price).toLocaleString('es-CL');
}

// =================== DATOS DE PRUEBA ===================

// Cargar pedidos de ejemplo (para desarrollo)
function loadSampleOrders() {
    const fechaActual = new Date();
    const fechaAnterior1 = new Date();
    fechaAnterior1.setDate(fechaAnterior1.getDate() - 5);
    const fechaAnterior2 = new Date();
    fechaAnterior2.setDate(fechaAnterior2.getDate() - 15);
    
    userOrders = [
        {
            id: 12345,
            fecha_creacion: fechaActual.toISOString(),
            estado: 'pendiente',
            items: [
                { id: 1, producto_id: 1, nombre: 'Martillo Profesional', codigo: 'MART001', precio: 12990, cantidad: 1 },
                { id: 2, producto_id: 3, nombre: 'Sierra Circular', codigo: 'SIER001', precio: 89990, cantidad: 1 }
            ],
            direccion_envio: 'Av. Principal 123, Santiago',
            ciudad: 'Santiago',
            total: 102980,
            subtotal: 102980,
            envio: 0,
            metodo_pago: 'WebPay',
            estado_pago: 'Pendiente',
            metodo_envio: 'Estándar'
        },
        {
            id: 12344,
            fecha_creacion: fechaAnterior1.toISOString(),
            fecha_pago: fechaAnterior1.toISOString(),
            estado: 'pagado',
            items: [
                { id: 3, producto_id: 2, nombre: 'Destornillador Eléctrico', codigo: 'DEST001', precio: 19990, cantidad: 2 }
            ],
            direccion_envio: 'Calle Secundaria 456, Santiago',
            ciudad: 'Santiago',
            total: 39980,
            subtotal: 39980,
            envio: 0,
            metodo_pago: 'WebPay',
            estado_pago: 'Pagado',
            codigo_autorizacion: '123456',
            metodo_envio: 'Express'
        },
        {
            id: 12343,
            fecha_creacion: fechaAnterior2.toISOString(),
            fecha_pago: fechaAnterior2.toISOString(),
            fecha_procesamiento: new Date(fechaAnterior2.getTime() + 86400000).toISOString(),
            fecha_envio: new Date(fechaAnterior2.getTime() + 172800000).toISOString(),
            fecha_entrega: new Date(fechaAnterior2.getTime() + 432000000).toISOString(),
            estado: 'entregado',
            items: [
                { id: 4, producto_id: 4, nombre: 'Cemento 25kg', codigo: 'CEM001', precio: 5990, cantidad: 3 }
            ],
            direccion_envio: 'Av. Principal 123, Santiago',
            ciudad: 'Santiago',
            total: 17970,
            subtotal: 17970,
            envio: 0,
            metodo_pago: 'WebPay',
            estado_pago: 'Pagado',
            codigo_autorizacion: '654321',
            metodo_envio: 'Estándar',
            numero_seguimiento: 'TRACK123456789'
        }
    ];
    
    totalPages = 1;
    renderOrders();
    renderPagination();
}