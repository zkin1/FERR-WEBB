// assets/js/admin/inventario.js
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las secciones
    initStockSection();
    initUbicacionesSection();
    initMovimientosSection();
    initAjustesSection();
    
    // Manejar navegación por tabs/secciones
    setupTabNavigation();
});

// Variables para paginación
let currentStockPage = 1;
let currentMovimientosPage = 1;
let currentAjustesPage = 1;


// Función para inicializar la sección de Stock
async function initStockSection() {
    try {
        // Cargar datos iniciales de stock
        await loadStockData(currentStockPage);
        
        // Configurar búsqueda
        document.getElementById('btn-search-stock').addEventListener('click', handleStockSearch);
        
        // Configurar botón de stock bajo
        document.getElementById('btn-low-stock').addEventListener('click', handleLowStockView);
        
        // Inicializar eventos para edición de mínimo/máximo
        setupStockMinMaxEvents();

        console.log('Entorno actual:', {
        hostname: window.location.hostname,
        APP_CONFIG: window.APP_CONFIG,
        inventarioSoap: window.inventarioSoap ? 'disponible' : 'no disponible'
    });

    } catch (error) {
        console.error('Error al inicializar sección de stock:', error);
        showAlert('stock', 'Error al cargar datos de stock', 'danger');
    }
}


async function initMovimientosSection() {
    console.log("Inicializando sección de movimientos...");
    // Implementación básica para evitar errores
    const movimientosTableBody = document.getElementById('movimientos-table-body');
    if (movimientosTableBody) {
        movimientosTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Funcionalidad en desarrollo</td></tr>';
    }
}

async function initAjustesSection() {
    console.log("Inicializando sección de ajustes...");

    await loadAjustesData(currentAjustesPage);
    
    document.getElementById('btn-add-ajuste').addEventListener('click', function() {
        prepareAjusteModal();
    });

    // Configurar evento para guardar ajuste
    document.getElementById('btn-save-ajuste').addEventListener('click', async function() {
        await saveAjuste();
    });
    
    // Configurar evento para seleccionar producto
    document.getElementById('ajuste-producto-id').addEventListener('change', async function() {
        await loadProductoStockInfo();
    });
    
    // Configurar evento para seleccionar ubicación
    document.getElementById('ajuste-ubicacion-id').addEventListener('change', async function() {
        await loadProductoStockInfo();
    });

    // Implementación básica para evitar errores
    const ajustesTableBody = document.getElementById('ajustes-table-body');
    
    if (ajustesTableBody) {
        ajustesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Funcionalidad en desarrollo</td></tr>';
    }
}

async function loadProductoStockInfo() {
    const productoId = document.getElementById('ajuste-producto-id').value;
    const ubicacionId = document.getElementById('ajuste-ubicacion-id').value;
    
    if (!productoId || !ubicacionId) {
        document.getElementById('ajuste-cantidad-actual').value = '';
        return;
    }
    
    try {
        // Obtener stock del producto en la ubicación seleccionada
        const stockData = await window.inventarioSoap.getProductStock(productoId);
        
        if (stockData && stockData.stockItems && stockData.stockItems.stockItem) {
            // Normalizar el resultado (siempre un array)
            const stockItems = Array.isArray(stockData.stockItems.stockItem) 
                ? stockData.stockItems.stockItem 
                : [stockData.stockItems.stockItem];
            
            // Buscar el stock en la ubicación seleccionada
            const stockItem = stockItems.find(item => item.ubicacion_id == ubicacionId);
            
            if (stockItem) {
                document.getElementById('ajuste-cantidad-actual').value = stockItem.cantidad;
            } else {
                document.getElementById('ajuste-cantidad-actual').value = '0';
                showAlert('modal', 'El producto no tiene stock en esta ubicación', 'warning');
            }
        } else {
            document.getElementById('ajuste-cantidad-actual').value = '0';
        }
    } catch (error) {
        console.error('Error al cargar información de stock:', error);
        showAlert('modal', 'Error al cargar información de stock', 'danger');
    }
}

async function saveAjuste() {
    try {
        // Obtener valores del formulario
        const productoId = document.getElementById('ajuste-producto-id').value;
        const ubicacionId = document.getElementById('ajuste-ubicacion-id').value;
        const cantidadActual = parseInt(document.getElementById('ajuste-cantidad-actual').value) || 0;
        const cantidadNueva = parseInt(document.getElementById('ajuste-cantidad-nueva').value);
        const motivo = document.getElementById('ajuste-motivo').value;
        const descripcion = document.getElementById('ajuste-descripcion').value;
        
        // Validar datos
        if (!productoId) {
            showAlert('modal', 'Debe seleccionar un producto', 'danger');
            return;
        }
        
        if (!ubicacionId) {
            showAlert('modal', 'Debe seleccionar una ubicación', 'danger');
            return;
        }
        
        if (isNaN(cantidadNueva) || cantidadNueva < 0) {
            showAlert('modal', 'La cantidad debe ser un número mayor o igual a cero', 'danger');
            return;
        }
        
        if (!motivo) {
            showAlert('modal', 'Debe seleccionar un motivo', 'danger');
            return;
        }
        
        // Crear objeto de ajuste con nombres de propiedad correctos para el servicio SOAP
        const ajuste = {
            producto_id: productoId,
            ubicacion_id: ubicacionId,
            cantidad_anterior: cantidadActual,
            cantidad_nueva: cantidadNueva,
            motivo,
            descripcion
        };
        
        // Registrar ajuste
        console.log('Registrando ajuste:', ajuste);
        const result = await window.inventarioSoap.registerAdjustment(ajuste);
        
        if (result && result.error) {
            showAlert('modal', result.error, 'danger');
            return;
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ajusteModal'));
        modal.hide();
        
        // Mostrar mensaje de éxito
        showAlert('ajustes', 'Ajuste registrado correctamente', 'success');
        
        // Recargar datos
        await loadAjustesData(currentAjustesPage);
        
        // También recargar datos de stock ya que han cambiado
        await loadStockData(currentStockPage);
    } catch (error) {
        console.error('Error al guardar ajuste:', error);
        showAlert('modal', 'Error al registrar ajuste: ' + error.message, 'danger');
    }
}

async function loadAjustesData(page = 1) {
    const ajustesTableBody = document.getElementById('ajustes-table-body');
    const ajustesPagination = document.getElementById('ajustes-pagination');
    
    try {
        // Mostrar indicador de carga
        ajustesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
        
        // Obtener ajustes
        const result = await callSoapService('ajustes', 'GetAllAjustes', { page, limit: 10 });
        
        if (!result || !result.ajustes || !result.ajustes.ajuste) {
            ajustesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ajustes disponibles</td></tr>';
            return;
        }
        
        // Normalizar el resultado (siempre un array)
        const ajustes = Array.isArray(result.ajustes.ajuste) 
            ? result.ajustes.ajuste
            : [result.ajustes.ajuste];
        
        // Limpiar tabla
        ajustesTableBody.innerHTML = '';
        
        // Generar filas de la tabla
        ajustes.forEach(ajuste => {
            const fechaAjuste = new Date(ajuste.created_at);
            const formattedDate = fechaAjuste.toLocaleString();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ajuste.id}</td>
                <td>${formattedDate}</td>
                <td>${ajuste.producto_nombre || 'Producto ID: ' + ajuste.producto_id}</td>
                <td>${ajuste.ubicacion_nombre || 'Ubicación ID: ' + ajuste.ubicacion_id}</td>
                <td>${ajuste.cantidad_anterior}</td>
                <td>${ajuste.cantidad_nueva}</td>
                <td>${ajuste.motivo}</td>
            `;
            ajustesTableBody.appendChild(row);
        });
        
        // Generar paginación
        if (result.pagination) {
            generatePagination(result.pagination, ajustesPagination, loadAjustesData, currentAjustesPage);
        }
    } catch (error) {
        console.error('Error al cargar ajustes:', error);
        ajustesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
}


async function prepareAjusteModal() {
    try {
        // Limpiar formulario
        document.getElementById('ajuste-form').reset();
        
        // Cargar productos
        const productosSelect = document.getElementById('ajuste-producto-id');
        productosSelect.innerHTML = '<option value="">Seleccione producto</option>';
        
        try {
            // Obtener productos desde la API
            const response = await fetch('http://localhost:3000/api/productos');
            const productos = await response.json();
            
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = producto.nombre;
                productosSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar productos:', error);
            showAlert('modal', 'Error al cargar productos', 'danger');
        }
        
        // Cargar ubicaciones
        const ubicacionesSelect = document.getElementById('ajuste-ubicacion-id');
        ubicacionesSelect.innerHTML = '<option value="">Seleccione ubicación</option>';
        
        try {
            const ubicaciones = await window.inventarioSoap.getAllLocations();
            
            if (ubicaciones && ubicaciones.ubicaciones && ubicaciones.ubicaciones.ubicacion) {
                const ubicacionesData = Array.isArray(ubicaciones.ubicaciones.ubicacion) 
                    ? ubicaciones.ubicaciones.ubicacion 
                    : [ubicaciones.ubicaciones.ubicacion];
                
                ubicacionesData.forEach(ubicacion => {
                    const option = document.createElement('option');
                    option.value = ubicacion.id;
                    option.textContent = ubicacion.nombre;
                    ubicacionesSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar ubicaciones:', error);
            showAlert('modal', 'Error al cargar ubicaciones', 'danger');
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('ajusteModal'));
        modal.show();
    } catch (error) {
        console.error('Error al preparar modal de ajuste:', error);
        showAlert('ajustes', 'Error al preparar formulario de ajuste', 'danger');
    }
}


async function callSoapService(endpoint, method, params = {}) {
    if (window.inventarioSoap && typeof window.inventarioSoap.callSoapService === 'function') {
        return await window.inventarioSoap.callSoapService(endpoint, method, params);
    } else {
        try {
            // Usar configuración global para la URL
            const soapUrl = window.APP_CONFIG ? 
                window.APP_CONFIG.SOAP_URL : 
                'http://localhost:3002/api/soap';
                
            console.log(`Llamando a servicio SOAP ${endpoint}/${method}`, params);
            const response = await fetch(`${soapUrl}/${endpoint}/${method}`, {
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
    }
}

// Función para cargar datos de stock
async function loadStockData(page = 1, isLowStock = false) {
    const stockTableBody = document.getElementById('stock-table-body');
    const stockPagination = document.getElementById('stock-pagination');
    
    try {
        // Mostrar indicador de carga
        stockTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
        
        // Obtener datos de stock
        let stockData;
        if (isLowStock) {
            stockData = await window.inventarioSoap.getLowStockProducts(page, 10);
        } else {
            // Usar la función getAllStock en vez de callSoapService directamente
            stockData = await window.inventarioSoap.getAllStock(page, 10);
        }
        console.log('Datos de stock recibidos:', stockData);

        if (!stockData || !stockData.stockItems || !stockData.stockItems.stockItem) {
            stockTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos disponibles</td></tr>';
            stockPagination.innerHTML = '';
            return;
        }
        
        // Normalizar el resultado (siempre un array)
        const stockItems = Array.isArray(stockData.stockItems.stockItem) 
            ? stockData.stockItems.stockItem
            : [stockData.stockItems.stockItem];
        
        // Limpiar tabla
        stockTableBody.innerHTML = '';
        
        // Enriquecer datos con nombres de productos
        for (const item of stockItems) {
            try {
                if (!item.producto) {
                    // Obtener datos del producto desde la API de productos
                    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 'http://localhost:3000/api';
                    const productoResponse = await fetch(`${apiUrl}/productos/${item.producto_id}`);
                    const productoData = await productoResponse.json();
                    item.producto = productoData;
                }
            } catch (error) {
                console.error(`Error al obtener datos del producto ${item.producto_id}:`, error);
                item.producto = { nombre: `Producto ID: ${item.producto_id}` };
            }
        }
        
        // Generar filas de la tabla
        stockItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.producto ? item.producto.nombre : `Producto ID: ${item.producto_id}`}</td>
                <td>${item.ubicacion_nombre || `Ubicación ID: ${item.ubicacion_id}`}</td>
                <td>
                    <span class="${getStockClass(item)}">${item.cantidad}</span>
                </td>
                <td>${item.stock_minimo || 0} / ${item.stock_maximo || 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-minmax" data-stock-id="${item.id}" 
                        data-bs-toggle="modal" data-bs-target="#stockMinMaxModal">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            stockTableBody.appendChild(row);
        });
        
        // Generar paginación
        generatePagination(stockData.pagination, stockPagination, loadStockData, currentStockPage);
        
    } catch (error) {
        console.error('Error al cargar datos de stock:', error);
        stockTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
}

// Función para manejar búsqueda de stock
function handleStockSearch() {
    const searchTerm = document.getElementById('search-stock').value.trim();
    
    if (searchTerm) {
        // Implementar búsqueda de stock
        // Como no hay un método SOAP específico para búsqueda, podríamos:
        // 1. Hacer una búsqueda del producto en la API de productos
        // 2. Con el ID del producto, consultar su stock
        
        // Por simplicidad, mostraremos un mensaje
        showAlert('stock', 'Funcionalidad de búsqueda en desarrollo', 'info');
    } else {
        // Si el campo está vacío, cargar todos los datos
        loadStockData(1);
    }
}

// Función para manejar vista de stock bajo
function handleLowStockView() {
    // Cargar productos con stock bajo
    loadStockData(1, true);
}

// Función para configurar eventos de edición de mínimo/máximo
function setupStockMinMaxEvents() {
    // Delegación de eventos para los botones de editar
    document.getElementById('stock-table-body').addEventListener('click', async function(event) {
        // Verificar si el clic fue en un botón de editar o en alguno de sus elementos internos
        const editButton = event.target.closest('.btn-edit-minmax');
        if (editButton) {
            const stockId = editButton.dataset.stockId;
            console.log('Clic en botón editar stock ID:', stockId);
            
            // Cargar datos del stock
            loadStockItemData(stockId);
        }
    });

    // Función para cargar datos del stock
    async function loadStockItemData(stockId) {
        try {
            console.log('Cargando datos para stock ID:', stockId);
            
            // Intentar primero con un método específico para obtener un stock por ID
            let stockItem = null;
            
            try {
                // Método directo si existe en tu API SOAP
                const stockData = await window.inventarioSoap.callSoapService('stock', 'GetStockById', { id: stockId });
                if (stockData && stockData.stockItem) {
                    stockItem = stockData.stockItem;
                }
            } catch (error) {
                console.log('GetStockById no disponible, obteniendo de lista completa');
                // Si no existe el método específico, obtener todos y filtrar
                const allStockData = await window.inventarioSoap.getAllStock(1, 100);
                
                if (allStockData && allStockData.stockItems && allStockData.stockItems.stockItem) {
                    const stocks = Array.isArray(allStockData.stockItems.stockItem) 
                        ? allStockData.stockItems.stockItem 
                        : [allStockData.stockItems.stockItem];
                    
                    stockItem = stocks.find(item => item.id == stockId);
                }
            }
            
            if (stockItem) {
                console.log('Stock encontrado:', stockItem);
                
                // Verificar que tenemos los campos obligatorios
                if (!stockItem.producto_id) {
                    console.error('El stock no tiene producto asociado', stockItem);
                    showAlert('stock', 'Error: El stock no tiene producto asociado', 'danger');
                    return;
                }
                
                if (!stockItem.ubicacion_id) {
                    console.error('El stock no tiene ubicación asociada', stockItem);
                    showAlert('stock', 'Error: El stock no tiene ubicación asociada', 'danger');
                    return;
                }
                
                // Llenar el formulario con datos del stock
                document.getElementById('stock-id').value = stockItem.id;
                document.getElementById('stock-id').setAttribute('data-producto-id', stockItem.producto_id);
                document.getElementById('stock-id').setAttribute('data-ubicacion-id', stockItem.ubicacion_id);
                
                // Obtener información adicional del producto si es necesario
                try {
                    if (!stockItem.producto) {
                        const productoResponse = await fetch(`http://localhost:3000/api/productos/${stockItem.producto_id}`);
                        const productoData = await productoResponse.json();
                        stockItem.producto = productoData;
                    }
                } catch (error) {
                    console.warn('No se pudo obtener datos adicionales del producto:', error);
                    stockItem.producto = { nombre: `Producto ID: ${stockItem.producto_id}` };
                }
                
                // Nombre del producto
                document.getElementById('producto-nombre').value = stockItem.producto ? 
                    stockItem.producto.nombre : `Producto ID: ${stockItem.producto_id}`;
                
                // Nombre de la ubicación
                document.getElementById('ubicacion-nombre-minmax').value = stockItem.ubicacion_nombre || 
                    `Ubicación ID: ${stockItem.ubicacion_id}`;
                
                // Stock actual con valor original para comparación
                document.getElementById('stock-actual').value = stockItem.cantidad;
                document.getElementById('stock-actual').setAttribute('data-original-value', stockItem.cantidad);
                
                // Stock mínimo y máximo
                document.getElementById('stock-minimo').value = stockItem.stock_minimo || 0;
                document.getElementById('stock-maximo').value = stockItem.stock_maximo || 0;
                
                // Asegurar que tenemos un motivo por defecto
                if (document.getElementById('stock-motivo')) {
                    document.getElementById('stock-motivo').value = "Ajuste manual";
                }
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('stockMinMaxModal'));
                modal.show();
            } else {
                showAlert('stock', 'No se encontró el stock seleccionado', 'danger');
            }
        } catch (error) {
            console.error('Error al cargar datos del stock:', error);
            showAlert('stock', 'Error al cargar datos del stock: ' + error.message, 'danger');
        }
    }

    // Configurar evento de guardar
    document.getElementById('btn-save-stock-minmax').addEventListener('click', async function() {
        try {
            // Obtener y validar datos
            const stockId = document.getElementById('stock-id').value;
            const productoId = document.getElementById('stock-id').getAttribute('data-producto-id');
            const ubicacionId = document.getElementById('stock-id').getAttribute('data-ubicacion-id');
            const stockMinimo = parseInt(document.getElementById('stock-minimo').value);
            const stockMaximo = parseInt(document.getElementById('stock-maximo').value);
            const stockActual = parseInt(document.getElementById('stock-actual').value);
            const stockAnterior = parseInt(document.getElementById('stock-actual').getAttribute('data-original-value') || '0');
            const motivo = document.getElementById('stock-motivo').value || "Ajuste manual";
            
            console.log('Datos a guardar:', { 
                stockId, productoId, ubicacionId, 
                stockMinimo, stockMaximo, stockActual, stockAnterior, motivo
            });
            
            // Validaciones
            if (isNaN(stockMinimo) || isNaN(stockMaximo) || isNaN(stockActual)) {
                showAlert('modal', 'Los valores deben ser números válidos', 'danger');
                return;
            }
            
            if (stockMinimo < 0 || stockMaximo < 0 || stockActual < 0) {
                showAlert('modal', 'Los valores no pueden ser negativos', 'danger');
                return;
            }
            
            if (stockMinimo > stockMaximo) {
                showAlert('modal', 'El stock mínimo no puede ser mayor al máximo', 'danger');
                return;
            }
            
            // Si cambió el stock actual, registrar un ajuste
            if (stockActual !== stockAnterior) {
                const ajusteData = {
                    producto_id: productoId,
                    ubicacion_id: ubicacionId,
                    cantidad_anterior: stockAnterior,
                    cantidad_nueva: stockActual,
                    motivo: motivo,
                    descripcion: "Ajuste desde formulario de mínimos/máximos"
                };
                
                console.log('Registrando ajuste de stock:', ajusteData);
                
                try {
                    const ajusteResult = await window.inventarioSoap.registerAdjustment(ajusteData);
                    
                    if (ajusteResult && ajusteResult.error) {
                        console.error('Error en respuesta de ajuste:', ajusteResult);
                        showAlert('modal', 'Error al ajustar stock: ' + ajusteResult.error, 'danger');
                        return;
                    }
                    
                    console.log('Ajuste registrado correctamente:', ajusteResult);
                } catch (ajusteError) {
                    console.error('Error al registrar ajuste:', ajusteError);
                    showAlert('modal', 'Error al ajustar stock: ' + ajusteError.message, 'danger');
                    return;
                }
            }
            
            // Actualizar mínimo/máximo
            try {
                console.log('Actualizando stock mínimo/máximo:', { id: stockId, stockMinimo, stockMaximo });
                const minMaxResult = await window.inventarioSoap.updateStockMinMax(stockId, stockMinimo, stockMaximo);
                
                if (minMaxResult && minMaxResult.error) {
                    showAlert('modal', 'Error al actualizar mínimo/máximo: ' + minMaxResult.error, 'danger');
                    return;
                }
                
                console.log('Stock min/max actualizado correctamente:', minMaxResult);
                
                // Cerrar modal de forma segura
                closeModalCompletely('stockMinMaxModal');
                
                // Mostrar mensaje de éxito
                if (stockActual !== stockAnterior) {
                    showAlert('stock', 'Stock actual, mínimo y máximo actualizados correctamente', 'success');
                } else {
                    showAlert('stock', 'Stock mínimo y máximo actualizados correctamente', 'success');
                }
                
                // Recargar datos
                setTimeout(() => {
                    loadStockData(currentStockPage);
                }, 500);
            } catch (minMaxError) {
                console.error('Error al actualizar mínimo/máximo:', minMaxError);
                showAlert('modal', 'Error al actualizar mínimo/máximo: ' + minMaxError.message, 'danger');
            }
        } catch (error) {
            console.error('Error general al guardar cambios:', error);
            showAlert('modal', 'Error al guardar cambios: ' + error.message, 'danger');
        }
    });
}

function closeModalCompletely(modalId) {
    try {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;
        
        // Intentar usar API de Bootstrap
        try {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        } catch (err) {
            console.warn('Error al usar API de Bootstrap:', err);
        }
        
        // Asegurar limpieza completa
        setTimeout(() => {
            if (modalElement) {
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
                modalElement.setAttribute('aria-hidden', 'true');
            }
            
            document.body.classList.remove('modal-open');
            
            // Eliminar backdrop
            const backdrops = document.getElementsByClassName('modal-backdrop');
            while (backdrops.length > 0) {
                backdrops[0].parentNode.removeChild(backdrops[0]);
            }
        }, 100);
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
}

// Función para inicializar la sección de Ubicaciones
async function initUbicacionesSection() {
    try {
        // Cargar datos de ubicaciones
        await loadUbicacionesData();
        
        // Configurar eventos para CRUD de ubicaciones
        setupUbicacionesEvents();
    } catch (error) {
        console.error('Error al inicializar sección de ubicaciones:', error);
        showAlert('ubicaciones', 'Error al cargar datos de ubicaciones', 'danger');
    }
}

// Función para cargar datos de ubicaciones
async function loadUbicacionesData() {
    const ubicacionesTableBody = document.getElementById('ubicaciones-table-body');
    
    try {
        // Mostrar indicador de carga
        ubicacionesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
        
        // Obtener ubicaciones
        const result = await window.inventarioSoap.getAllLocations();
        
        if (!result || !result.ubicaciones || !result.ubicaciones.ubicacion) {
            ubicacionesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay ubicaciones disponibles</td></tr>';
            return;
        }
        
        // Normalizar el resultado (siempre un array)
        const ubicaciones = Array.isArray(result.ubicaciones.ubicacion) 
            ? result.ubicaciones.ubicacion
            : [result.ubicaciones.ubicacion];
        
        // Limpiar tabla
        ubicacionesTableBody.innerHTML = '';
        
        // Generar filas de la tabla
        ubicaciones.forEach(ubicacion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ubicacion.id}</td>
                <td>${ubicacion.codigo}</td>
                <td>${ubicacion.nombre}</td>
                <td>${ubicacion.descripcion || '-'}</td>
                <td>
                    <span class="badge ${ubicacion.activo ? 'bg-success' : 'bg-danger'}">
                        ${ubicacion.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-ubicacion" data-ubicacion-id="${ubicacion.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-ubicacion" data-ubicacion-id="${ubicacion.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            ubicacionesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar ubicaciones:', error);
        ubicacionesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
}

// Función para inicializar eventos de ubicaciones
function setupUbicacionesEvents() {
    // Evento para agregar nueva ubicación
    document.getElementById('btn-add-ubicacion').addEventListener('click', function() {
        // Limpiar formulario
        document.getElementById('ubicacion-id').value = '';
        document.getElementById('ubicacion-codigo').value = '';
        document.getElementById('ubicacion-nombre').value = '';
        document.getElementById('ubicacion-descripcion').value = '';
        document.getElementById('ubicacion-activo').checked = true;
        
        // Cambiar título
        document.getElementById('ubicacionModalLabel').textContent = 'Nueva Ubicación';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('ubicacionModal'));
        modal.show();
    });
    
    // Delegación de eventos para editar ubicación
    document.getElementById('ubicaciones-table-body').addEventListener('click', async function(event) {
        // Verificar si el clic fue en un botón de editar
        if (event.target.closest('.btn-edit-ubicacion')) {
            const button = event.target.closest('.btn-edit-ubicacion');
            const ubicacionId = button.dataset.ubicacionId;
            
            try {
                // Obtener datos de la ubicación
                const result = await window.inventarioSoap.getLocationById(ubicacionId);
                
                if (result && result.ubicacion) {
                    // Llenar formulario
                    document.getElementById('ubicacion-id').value = result.ubicacion.id;
                    document.getElementById('ubicacion-codigo').value = result.ubicacion.codigo;
                    document.getElementById('ubicacion-nombre').value = result.ubicacion.nombre;
                    document.getElementById('ubicacion-descripcion').value = result.ubicacion.descripcion || '';
                    document.getElementById('ubicacion-activo').checked = result.ubicacion.activo === true;
                    
                    // Cambiar título
                    document.getElementById('ubicacionModalLabel').textContent = 'Editar Ubicación';
                    
                    // Mostrar modal
                    const modal = new bootstrap.Modal(document.getElementById('ubicacionModal'));
                    modal.show();
                }
            } catch (error) {
                console.error('Error al cargar datos de la ubicación:', error);
                showAlert('ubicaciones', 'Error al cargar datos de la ubicación', 'danger');
            }
        }
        
        // Verificar si el clic fue en un botón de eliminar
        if (event.target.closest('.btn-delete-ubicacion')) {
            const button = event.target.closest('.btn-delete-ubicacion');
            const ubicacionId = button.dataset.ubicacionId;
            
            // Confirmar eliminación
            if (confirm('¿Está seguro que desea eliminar esta ubicación?')) {
                try {
                    // Llamar a función de eliminar
                    const result = await callSoapService('ubicaciones', 'DeleteUbicacion', { id: ubicacionId });
                    
                    if (result && result.error) {
                        showAlert('ubicaciones', result.error, 'danger');
                        return;
                    }
                    
                    // Mostrar mensaje de éxito
                    showAlert('ubicaciones', 'Ubicación eliminada correctamente', 'success');
                    
                    // Recargar datos
                    loadUbicacionesData();
                } catch (error) {
                    console.error('Error al eliminar ubicación:', error);
                    showAlert('ubicaciones', 'Error al eliminar la ubicación', 'danger');
                }
            }
        }
    });
    
    // Evento para guardar ubicación
    document.getElementById('btn-save-ubicacion').addEventListener('click', async function() {
        // Obtener valores del formulario
        const ubicacionId = document.getElementById('ubicacion-id').value;
        const codigo = document.getElementById('ubicacion-codigo').value.trim();
        const nombre = document.getElementById('ubicacion-nombre').value.trim();
        const descripcion = document.getElementById('ubicacion-descripcion').value.trim();
        const activo = document.getElementById('ubicacion-activo').checked;
        
        // Validar datos
        if (!codigo || !nombre) {
            showAlert('modal', 'El código y nombre son obligatorios', 'danger');
            return;
        }
        
        try {
            let result;
            const ubicacionData = {
                codigo,
                nombre,
                descripcion,
                activo
            };
            
            if (ubicacionId) {
                // Editar ubicación existente
                ubicacionData.id = ubicacionId;
                result = await callSoapService('ubicaciones', 'UpdateUbicacion', { ubicacion: ubicacionData });
            } else {
                // Crear nueva ubicación
                result = await callSoapService('ubicaciones', 'CreateUbicacion', { ubicacion: ubicacionData });
            }
            
            if (result && result.error) {
                showAlert('modal', result.error, 'danger');
                return;
            }
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('ubicacionModal'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            showAlert('ubicaciones', ubicacionId ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente', 'success');
            
            // Recargar datos
            loadUbicacionesData();
        } catch (error) {
            console.error('Error al guardar ubicación:', error);
            showAlert('modal', 'Error al guardar la ubicación', 'danger');
        }
    });
}

// Utilidades

// Función para determinar la clase CSS según el nivel de stock
function getStockClass(item) {
    if (!item.stock_minimo) return '';
    
    if (item.cantidad <= item.stock_minimo) {
        return 'text-danger fw-bold';
    } else if (item.cantidad <= item.stock_minimo * 1.2) {
        return 'text-warning fw-bold';
    }
    
    return 'text-success';
}

// Función para generar paginación
function generatePagination(paginationData, container, loadFunction, currentPage) {
    if (!paginationData || !container) return;
    
    const { total, page, limit, totalPages } = paginationData;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Botón anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page <= 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1">Anterior</a>`;
    container.appendChild(prevLi);
    
    // Páginas
    const maxPages = 5;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === page ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', function(e) {
            e.preventDefault();
            loadFunction(i);
        });
        container.appendChild(pageLi);
    }
    
    // Botón siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page >= totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
    container.appendChild(nextLi);
    
    // Agregar eventos
    if (page > 1) {
        prevLi.addEventListener('click', function(e) {
            e.preventDefault();
            loadFunction(page - 1);
        });
    }
    
    if (page < totalPages) {
        nextLi.addEventListener('click', function(e) {
            e.preventDefault();
            loadFunction(page + 1);
        });
    }
}

// Función para mostrar alertas
function showAlert(section, message, type = 'info') {
    // Si la alerta es para un modal
    if (section === 'modal') {
        // Buscar cualquier modal abierto
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            // Crear o actualizar alerta en el modal
            let alertElement = openModal.querySelector('.alert');
            if (!alertElement) {
                alertElement = document.createElement('div');
                alertElement.className = `alert alert-${type} mt-3`;
                alertElement.setAttribute('role', 'alert');
                
                // Insertar al principio del cuerpo del modal
                const modalBody = openModal.querySelector('.modal-body');
                modalBody.insertBefore(alertElement, modalBody.firstChild);
            } else {
                alertElement.className = `alert alert-${type} mt-3`;
            }
            
            alertElement.textContent = message;
            
            // Auto-cerrar después de 3 segundos
            setTimeout(() => {
                alertElement.remove();
            }, 3000);
            
            return;
        }
    }
    
    // Para secciones normales
    const sectionElement = document.getElementById(section);
    if (!sectionElement) return;
    
    // Crear elemento de alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar al principio de la sección
    sectionElement.insertBefore(alertElement, sectionElement.firstChild);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
    }, 5000);
}

// Función para configurar navegación por tabs
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.sidebar .nav-link');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Quitar clase active de todos los tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Agregar clase active al tab actual
            this.classList.add('active');
            
            // Obtener id de la sección
            const sectionId = this.getAttribute('href').substring(1);
            
            // Ocultar todas las secciones
            document.querySelectorAll('main section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Mostrar la sección correspondiente
            document.getElementById(sectionId).style.display = 'block';
        });
    });
}