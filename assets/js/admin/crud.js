// assets/js/admin/crud.js
document.addEventListener('DOMContentLoaded', function() {
    // Variables para paginación
    let currentProductPage = 1;
    let currentStockPage = 1;
    let productoSearchQuery = '';
    let productoFilterCategoria = '';
    let productoOrder = 'nombre_asc';
    let stockSearchQuery = '';
    let stockFilterUbicacion = '';
    let isLowStock = false;
    
    // Inicializar todas las secciones
    initProductosSection();
    initStockSection();
    initCategoriasSection();
    
    // Función para mostrar spinner de carga
    function showSpinner() {
        document.getElementById('spinnerOverlay').classList.add('show');
    }
    
    // Función para ocultar spinner de carga
    function hideSpinner() {
        document.getElementById('spinnerOverlay').classList.remove('show');
    }
    
    // Función para mostrar alertas
    function showAlert(message, type = 'info', container = 'body') {
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.setAttribute('role', 'alert');
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        if (container === 'body') {
            // Insertar al inicio del contenedor principal
            document.querySelector('.container-fluid').prepend(alertElement);
        } else {
            // Insertar en un contenedor específico
            const containerElement = document.getElementById(container);
            if (containerElement) {
                containerElement.prepend(alertElement);
            } else {
                document.querySelector('.container-fluid').prepend(alertElement);
            }
        }
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.remove();
            }, 500);
        }, 5000);
    }
    
    // ********** SECCIÓN DE PRODUCTOS **********
    async function initProductosSection() {
        try {
            // Cargar datos iniciales
            await loadProductos(currentProductPage);
            
            // Cargar categorías para el filtro
            await loadCategoriasDropdown('filtroCategoriaProducto');
            await loadCategoriasDropdown('productoCategoria');
            
            // Cargar marcas para el dropdown
            await loadMarcasDropdown();
            
            // Configurar eventos
            document.getElementById('btnBuscarProducto').addEventListener('click', searchProductos);
            document.getElementById('buscarProducto').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchProductos();
                }
            });
            
            document.getElementById('filtroCategoriaProducto').addEventListener('change', function() {
                productoFilterCategoria = this.value;
                currentProductPage = 1;
                loadProductos(currentProductPage);
            });
            
            document.getElementById('ordenProducto').addEventListener('change', function() {
                productoOrder = this.value;
                currentProductPage = 1;
                loadProductos(currentProductPage);
            });
            
            document.getElementById('btnNuevoProducto').addEventListener('click', function() {
                resetFormProducto();
                document.getElementById('modalProductoLabel').textContent = 'Nuevo Producto';
                const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
                modal.show();
            });
            
            document.getElementById('btnGuardarProducto').addEventListener('click', saveProducto);
            
            // Delegación de eventos para botones de acción en tabla de productos
            document.getElementById('tablaProductos').addEventListener('click', function(e) {
                const target = e.target.closest('button');
                if (!target) return;
                
                const productoId = target.dataset.id;
                
                if (target.classList.contains('btn-edit-producto')) {
                    editProducto(productoId);
                } else if (target.classList.contains('btn-delete-producto')) {
                    deleteProducto(productoId);
                } else if (target.classList.contains('btn-stock-producto')) {
                    // Abrir modal de stock con el producto pre-seleccionado
                    openStockModal(productoId);
                }
            });
            
        } catch (error) {
            console.error('Error al inicializar sección de productos:', error);
            showAlert('Error al cargar la sección de productos. Por favor, intente nuevamente más tarde.', 'danger');
        }
    }
    
    async function loadProductos(page = 1) {
        try {
            showSpinner();
            
            const tablaProductos = document.getElementById('tablaProductos');
            tablaProductos.innerHTML = '<tr><td colspan="8" class="text-center">Cargando productos...</td></tr>';
            
            let url = `/productos?page=${page}&limit=10`;
            
            // Aplicar filtros y ordenamiento
            if (productoSearchQuery) {
                url += `&q=${encodeURIComponent(productoSearchQuery)}`;
            }
            
            if (productoFilterCategoria) {
                url += `&categoria=${productoFilterCategoria}`;
            }
            
            if (productoOrder) {
                const [campo, orden] = productoOrder.split('_');
                url += `&sort=${campo}&order=${orden}`;
            }
            
            const response = await fetchAPI(url);
            
            if (!response || !response.productos || !response.productos.length) {
                tablaProductos.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron productos</td></tr>';
                document.getElementById('paginacionProductos').innerHTML = '';
                hideSpinner();
                return;
            }
            
            // Limpiar tabla
            tablaProductos.innerHTML = '';
            
            // Cargar datos en la tabla
            response.productos.forEach(producto => {
                const row = document.createElement('tr');
                
                // Determinar clase de stock
                let stockClass = '';
                let stockCantidad = producto.stock || 0;
                
                if (stockCantidad === 0) {
                    stockClass = 'text-danger fw-bold';
                } else if (producto.stock_minimo && stockCantidad <= producto.stock_minimo) {
                    stockClass = 'text-warning fw-bold';
                }
                
                row.innerHTML = `
                    <td>${producto.id}</td>
                    <td>${producto.codigo}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.categoria_nombre || `Categoría ID: ${producto.categoria_id}`}</td>
                    <td>$${producto.precio.toLocaleString()}</td>
                    <td class="${stockClass}">${stockCantidad}</td>
                    <td>
                        <span class="badge ${producto.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                            ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-edit-producto" data-id="${producto.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info btn-stock-producto" data-id="${producto.id}">
                            <i class="fas fa-boxes"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-producto" data-id="${producto.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tablaProductos.appendChild(row);
            });
            
            // Generar paginación
            if (response.pagination) {
                generatePagination(
                    response.pagination,
                    document.getElementById('paginacionProductos'),
                    loadProductos,
                    currentProductPage
                );
            }
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar productos:', error);
            document.getElementById('tablaProductos').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar datos</td></tr>';
            hideSpinner();
        }
    }
    
    function searchProductos() {
        productoSearchQuery = document.getElementById('buscarProducto').value.trim();
        currentProductPage = 1;
        loadProductos(currentProductPage);
    }
    
    async function loadCategoriasDropdown(elementId) {
        try {
            const select = document.getElementById(elementId);
            if (!select) return;
            
            // Mantener la primera opción (placeholder)
            const firstOption = select.options[0];
            
            // Obtener categorías
            const categorias = await getCategorias();
            
            // Limpiar dropdown
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Añadir categorías al dropdown
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar categorías para dropdown:', error);
        }
    }
    
    async function loadMarcasDropdown() {
        try {
            const select = document.getElementById('productoMarca');
            if (!select) return;
            
            // Mantener la primera opción (placeholder)
            const firstOption = select.options[0];
            
            // Obtener marcas
            const marcas = await getMarcas();
            
            // Limpiar dropdown
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Añadir marcas al dropdown
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id;
                option.textContent = marca.nombre;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar marcas para dropdown:', error);
        }
    }
    
    function resetFormProducto() {
        document.getElementById('formProducto').reset();
        document.getElementById('productoId').value = '';
    }
    
    async function editProducto(id) {
        try {
            showSpinner();
            
            // Obtener datos del producto
            const producto = await getProductoById(id);
            
            // Llenar formulario
            document.getElementById('productoId').value = producto.id;
            document.getElementById('productoCodigo').value = producto.codigo;
            document.getElementById('productoNombre').value = producto.nombre;
            document.getElementById('productoCategoria').value = producto.categoria_id;
            document.getElementById('productoPrecio').value = producto.precio;
            document.getElementById('productoDescripcion').value = producto.descripcion || '';
            document.getElementById('productoMarca').value = producto.marca_id || '';
            document.getElementById('productoEstado').value = producto.estado || 'activo';
            document.getElementById('productoDestacado').checked = producto.destacado || false;
            
            // Cambiar título del modal
            document.getElementById('modalProductoLabel').textContent = 'Editar Producto';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
            modal.show();
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar datos del producto:', error);
            showAlert('Error al cargar datos del producto', 'danger');
            hideSpinner();
        }
    }
    
    async function saveProducto() {
        try {
            // Obtener valores del formulario
            const id = document.getElementById('productoId').value;
            const codigo = document.getElementById('productoCodigo').value.trim();
            const nombre = document.getElementById('productoNombre').value.trim();
            const categoria_id = document.getElementById('productoCategoria').value;
            const precio = parseFloat(document.getElementById('productoPrecio').value);
            const descripcion = document.getElementById('productoDescripcion').value.trim();
            const marca_id = document.getElementById('productoMarca').value || null;
            const estado = document.getElementById('productoEstado').value;
            const destacado = document.getElementById('productoDestacado').checked;
            
            // Validaciones
            if (!codigo || !nombre || !categoria_id || isNaN(precio) || precio < 0) {
                showAlert('Por favor, complete todos los campos obligatorios correctamente', 'danger');
                return;
            }
            
            // Preparar datos
            const productoData = {
                codigo,
                nombre,
                categoria_id: parseInt(categoria_id),
                precio,
                descripcion,
                marca_id: marca_id ? parseInt(marca_id) : null,
                estado,
                destacado
            };
            
            showSpinner();
            
            let response;
            if (id) {
                // Actualizar producto existente
                response = await fetch(`${API_URL}/productos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
            } else {
                // Crear nuevo producto
                response = await fetch(`${API_URL}/productos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoData)
                });
            }
            
            hideSpinner();
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar el producto');
            }
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
            
            // Mostrar mensaje de éxito
            showAlert(id ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
            
            // Recargar datos
            loadProductos(currentProductPage);
            
        } catch (error) {
            console.error('Error al guardar producto:', error);
            showAlert(`Error al guardar producto: ${error.message}`, 'danger');
            hideSpinner();
        }
    }
    
    async function deleteProducto(id) {
        // Confirmar eliminación
        if (!confirm('¿Está seguro que desea eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            showSpinner();
            
            // Eliminar producto
            const response = await fetch(`${API_URL}/productos/${id}`, {
                method: 'DELETE'
            });
            
            hideSpinner();
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el producto');
            }
            
            // Mostrar mensaje de éxito
            showAlert('Producto eliminado correctamente', 'success');
            
            // Recargar datos
            loadProductos(currentProductPage);
            
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            showAlert(`Error al eliminar producto: ${error.message}`, 'danger');
            hideSpinner();
        }
    }
    
    // ********** SECCIÓN DE STOCK **********
    async function initStockSection() {
        try {
            // Cargar datos iniciales
            await loadStock(currentStockPage);
            
            // Cargar ubicaciones para el filtro
            await loadUbicacionesDropdown();
            
            // Configurar eventos
            document.getElementById('btnBuscarStock').addEventListener('click', searchStock);
            document.getElementById('buscarStock').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchStock();
                }
            });
            
            document.getElementById('filtroUbicacionStock').addEventListener('change', function() {
                stockFilterUbicacion = this.value;
                currentStockPage = 1;
                loadStock(currentStockPage);
            });
            
            document.getElementById('btnStockBajo').addEventListener('click', function() {
                isLowStock = !isLowStock;
                if (isLowStock) {
                    this.innerHTML = '<i class="fas fa-list me-1"></i>Ver Todo el Stock';
                    this.classList.remove('btn-warning');
                    this.classList.add('btn-info');
                } else {
                    this.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Ver Stock Bajo';
                    this.classList.remove('btn-info');
                    this.classList.add('btn-warning');
                }
                currentStockPage = 1;
                loadStock(currentStockPage);
            });
            
            document.getElementById('btnNuevoStock').addEventListener('click', function() {
                resetFormStock();
                document.getElementById('modalStockLabel').textContent = 'Asignar Stock';
                const modal = new bootstrap.Modal(document.getElementById('modalStock'));
                modal.show();
            });
            
            document.getElementById('btnGuardarStock').addEventListener('click', saveStock);
            
            // Cargar productos para el dropdown
            await loadProductosDropdown();
            
            // Delegación de eventos para botones de acción en tabla de stock
            document.getElementById('tablaStock').addEventListener('click', function(e) {
                const target = e.target.closest('button');
                if (!target) return;
                
                const stockId = target.dataset.id;
                
                if (target.classList.contains('btn-edit-stock')) {
                    editStock(stockId);
                } else if (target.classList.contains('btn-adjust-stock')) {
                    adjustStock(stockId);
                }
            });
            
            // Eventos para cambios en el form de stock
            document.getElementById('stockProducto').addEventListener('change', updateStockForm);
            document.getElementById('stockUbicacion').addEventListener('change', updateStockForm);
            
        } catch (error) {
            console.error('Error al inicializar sección de stock:', error);
            showAlert('Error al cargar la sección de stock. Por favor, intente nuevamente más tarde.', 'danger');
        }
    }
    
    async function loadStock(page = 1) {
        try {
            showSpinner();
            
            const tablaStock = document.getElementById('tablaStock');
            tablaStock.innerHTML = '<tr><td colspan="7" class="text-center">Cargando datos de stock...</td></tr>';
            
            // Obtener datos de stock
            let stockData;
            if (isLowStock) {
                stockData = await window.inventarioSoap.getLowStockProducts(page, 10);
            } else {
                stockData = await window.inventarioSoap.getAllStock(page, 10);
            }
            
            if (!stockData || !stockData.stockItems || !stockData.stockItems.stockItem) {
                tablaStock.innerHTML = '<tr><td colspan="7" class="text-center">No hay datos de stock disponibles</td></tr>';
                document.getElementById('paginacionStock').innerHTML = '';
                hideSpinner();
                return;
            }
            
            // Normalizar el resultado (siempre un array)
            const stockItems = Array.isArray(stockData.stockItems.stockItem) 
                ? stockData.stockItems.stockItem
                : [stockData.stockItems.stockItem];
            
            // Limpiar tabla
            tablaStock.innerHTML = '';
            
            // Enriquecer datos con nombres de productos
            for (const item of stockItems) {
                try {
                    if (!item.producto) {
                        // Obtener datos del producto desde la API de productos
                        const productoResponse = await fetch(`${API_URL}/productos/${item.producto_id}`);
                        if (productoResponse.ok) {
                            const productoData = await productoResponse.json();
                            item.producto = productoData;
                        }
                    }
                } catch (error) {
                    console.error(`Error al obtener datos del producto ${item.producto_id}:`, error);
                    item.producto = { nombre: `Producto ID: ${item.producto_id}` };
                }
            }
            
            // Generar filas de la tabla
            stockItems.forEach(item => {
                // Determinar clase para el stock
                let stockClass = '';
                if (item.cantidad <= (item.stock_minimo || 0)) {
                    stockClass = 'text-danger fw-bold';
                } else if (item.cantidad <= (item.stock_minimo || 0) * 1.2) {
                    stockClass = 'text-warning fw-bold';
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.producto ? item.producto.nombre : `Producto ID: ${item.producto_id}`}</td>
                    <td>${item.ubicacion_nombre || `Ubicación ID: ${item.ubicacion_id}`}</td>
                    <td class="${stockClass}">${item.cantidad}</td>
                    <td>${item.stock_minimo || 0}</td>
                    <td>${item.stock_maximo || 0}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-edit-stock" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-adjust-stock" data-id="${item.id}">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </td>
                `;
                
                tablaStock.appendChild(row);
            });
            
            // Generar paginación
            if (stockData.pagination) {
                generatePagination(
                    stockData.pagination,
                    document.getElementById('paginacionStock'),
                    loadStock,
                    currentStockPage
                );
            }
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar datos de stock:', error);
            document.getElementById('tablaStock').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar datos</td></tr>';
            hideSpinner();
        }
    }
    
    function searchStock() {
        stockSearchQuery = document.getElementById('buscarStock').value.trim();
        currentStockPage = 1;
        loadStock(currentStockPage);
    }
    
    async function loadUbicacionesDropdown() {
        try {
            const select = document.getElementById('filtroUbicacionStock');
            const stockUbicacionSelect = document.getElementById('stockUbicacion');
            
            if (!select && !stockUbicacionSelect) return;
            
            // Obtener ubicaciones
            const ubicaciones = await window.inventarioSoap.getAllLocations();
            
            if (!ubicaciones || !ubicaciones.ubicaciones || !ubicaciones.ubicaciones.ubicacion) {
                return;
            }
            
            // Normalizar el resultado (siempre un array)
            const ubicacionesData = Array.isArray(ubicaciones.ubicaciones.ubicacion) 
                ? ubicaciones.ubicaciones.ubicacion
                : [ubicaciones.ubicaciones.ubicacion];
            
            // Actualizar dropdown de filtro
            if (select) {
                // Mantener la primera opción (placeholder)
                const firstOption = select.options[0];
                
                // Limpiar dropdown
                select.innerHTML = '';
                select.appendChild(firstOption);
                
                // Añadir ubicaciones al dropdown
                ubicacionesData.forEach(ubicacion => {
                    const option = document.createElement('option');
                    option.value = ubicacion.id;
                    option.textContent = ubicacion.nombre;
                    select.appendChild(option);
                });
            }
            
            // Actualizar dropdown de formulario
            if (stockUbicacionSelect) {
                // Mantener la primera opción (placeholder)
                const firstOption = stockUbicacionSelect.options[0];
                
                // Limpiar dropdown
                stockUbicacionSelect.innerHTML = '';
                stockUbicacionSelect.appendChild(firstOption);
                
                // Añadir ubicaciones al dropdown
                ubicacionesData.forEach(ubicacion => {
                    const option = document.createElement('option');
                    option.value = ubicacion.id;
                    option.textContent = ubicacion.nombre;
                    stockUbicacionSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar ubicaciones para dropdown:', error);
        }
    }
    
    async function loadProductosDropdown() {
        try {
            const select = document.getElementById('stockProducto');
            if (!select) return;
            
            // Mantener la primera opción (placeholder)
            const firstOption = select.options[0];
            
            // Obtener productos
            const response = await fetchAPI('/productos?limit=100');
            
            if (!response || !response.productos) {
                return;
            }
            
            // Limpiar dropdown
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Añadir productos al dropdown
            response.productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.codigo} - ${producto.nombre}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar productos para dropdown:', error);
        }
    }
    
    function resetFormStock() {
        document.getElementById('formStock').reset();
        document.getElementById('stockId').value = '';
        document.getElementById('stockProducto').disabled = false;
        document.getElementById('stockUbicacion').disabled = false;
    }
    
    async function editStock(id) {
        try {
            showSpinner();
            
            // Obtener datos del stock
            const allStockData = await window.inventarioSoap.getAllStock(1, 100);
            
            if (!allStockData || !allStockData.stockItems || !allStockData.stockItems.stockItem) {
                throw new Error('No se pudieron cargar datos de stock');
            }
            
            const stockItems = Array.isArray(allStockData.stockItems.stockItem) 
                ? allStockData.stockItems.stockItem
                : [allStockData.stockItems.stockItem];
            
            const stockItem = stockItems.find(item => item.id == id);
            
            if (!stockItem) {
                throw new Error('No se encontró el stock seleccionado');
            }
            
            // Llenar formulario
            document.getElementById('stockId').value = stockItem.id;
            document.getElementById('stockProducto').value = stockItem.producto_id;
            document.getElementById('stockUbicacion').value = stockItem.ubicacion_id;
            document.getElementById('stockCantidad').value = stockItem.cantidad;
            document.getElementById('stockMinimo').value = stockItem.stock_minimo || 0;
            document.getElementById('stockMaximo').value = stockItem.stock_maximo || 0;
            
            // Desactivar cambios de producto y ubicación en edición
            document.getElementById('stockProducto').disabled = true;
            document.getElementById('stockUbicacion').disabled = true;
            
            // Ocultar campos de motivo para edición de mínimos/máximos
            document.getElementById('divStockMotivo').style.display = 'none';
            
            // Cambiar título del modal
            document.getElementById('modalStockLabel').textContent = 'Editar Stock Mínimo/Máximo';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalStock'));
            modal.show();
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar datos del stock:', error);
            showAlert('Error al cargar datos del stock: ' + error.message, 'danger');
            hideSpinner();
        }
    }
    
    async function adjustStock(id) {
        try {
            showSpinner();
            
            // Obtener datos del stock
            const allStockData = await window.inventarioSoap.getAllStock(1, 100);
            
            if (!allStockData || !allStockData.stockItems || !allStockData.stockItems.stockItem) {
                throw new Error('No se pudieron cargar datos de stock');
            }
            
            const stockItems = Array.isArray(allStockData.stockItems.stockItem) 
                ? allStockData.stockItems.stockItem
                : [allStockData.stockItems.stockItem];
            
            const stockItem = stockItems.find(item => item.id == id);
            
            if (!stockItem) {
                throw new Error('No se encontró el stock seleccionado');
            }
            
            // Llenar formulario
            document.getElementById('stockId').value = stockItem.id;
            document.getElementById('stockProducto').value = stockItem.producto_id;
            document.getElementById('stockUbicacion').value = stockItem.ubicacion_id;
            document.getElementById('stockCantidad').value = stockItem.cantidad;
            document.getElementById('stockMinimo').value = stockItem.stock_minimo || 0;
            document.getElementById('stockMaximo').value = stockItem.stock_maximo || 0;
            
            // Desactivar cambios de producto y ubicación en ajuste
            document.getElementById('stockProducto').disabled = true;
            document.getElementById('stockUbicacion').disabled = true;
            
            // Mostrar campos de motivo para ajuste
            document.getElementById('divStockMotivo').style.display = 'block';
            
            // Cambiar título del modal
            document.getElementById('modalStockLabel').textContent = 'Ajustar Stock';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalStock'));
            modal.show();
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar datos del stock:', error);
            showAlert('Error al cargar datos del stock: ' + error.message, 'danger');
            hideSpinner();
        }
    }
    
    async function updateStockForm() {
        const productoId = document.getElementById('stockProducto').value;
        const ubicacionId = document.getElementById('stockUbicacion').value;
        
        if (!productoId || !ubicacionId) return;
        
        try {
            // Mostrar indicador de carga
            showSpinner();
            
            // Verificar si ya existe stock para este producto/ubicación
            const stockData = await window.inventarioSoap.getProductStock(productoId);
            
            if (stockData && stockData.stockItems && stockData.stockItems.stockItem) {
                // Normalizar el resultado (siempre un array)
                const stockItems = Array.isArray(stockData.stockItems.stockItem) 
                    ? stockData.stockItems.stockItem 
                    : [stockData.stockItems.stockItem];
                
                // Buscar el stock en la ubicación seleccionada
                const stockItem = stockItems.find(item => item.ubicacion_id == ubicacionId);
                
                if (stockItem) {
                    // Ya existe stock para esta combinación
                    document.getElementById('stockId').value = stockItem.id;
                    document.getElementById('stockCantidad').value = stockItem.cantidad;
                    document.getElementById('stockMinimo').value = stockItem.stock_minimo || 0;
                    document.getElementById('stockMaximo').value = stockItem.stock_maximo || 0;
                    
                    // Mostrar mensaje
                    showAlert('Ya existe stock para este producto en esta ubicación. Los datos se han cargado.', 'info');
                } else {
                    // No existe stock para esta ubicación
                    document.getElementById('stockId').value = '';
                    document.getElementById('stockCantidad').value = '0';
                    document.getElementById('stockMinimo').value = '0';
                    document.getElementById('stockMaximo').value = '0';
                }
            } else {
                // No hay stock para este producto
                document.getElementById('stockId').value = '';
                document.getElementById('stockCantidad').value = '0';
                document.getElementById('stockMinimo').value = '0';
                document.getElementById('stockMaximo').value = '0';
            }
            
            hideSpinner();
        } catch (error) {
            console.error('Error al verificar stock existente:', error);
            hideSpinner();
        }
    }
    
    function openStockModal(productoId) {
        resetFormStock();
        document.getElementById('stockProducto').value = productoId;
        document.getElementById('stockProducto').disabled = true;
        document.getElementById('modalStockLabel').textContent = 'Gestionar Stock';
        
        // Actualizar formulario con base en el producto seleccionado
        updateStockForm();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalStock'));
        modal.show();
    }
    
    async function saveStock() {
        try {
            // Obtener valores del formulario
            const stockId = document.getElementById('stockId').value;
            const productoId = document.getElementById('stockProducto').value;
            const ubicacionId = document.getElementById('stockUbicacion').value;
            const cantidad = parseInt(document.getElementById('stockCantidad').value);
            const stockMinimo = parseInt(document.getElementById('stockMinimo').value);
            const stockMaximo = parseInt(document.getElementById('stockMaximo').value);
            const motivo = document.getElementById('stockMotivo').value;
            const descripcion = document.getElementById('stockDescripcion').value;
            
            // Validaciones
            if (!productoId) {
                showAlert('Debe seleccionar un producto', 'danger');
                return;
            }
            
            if (!ubicacionId) {
                showAlert('Debe seleccionar una ubicación', 'danger');
                return;
            }
            
            if (isNaN(cantidad) || cantidad < 0) {
                showAlert('La cantidad debe ser un número mayor o igual a cero', 'danger');
                return;
            }
            
            if (isNaN(stockMinimo) || stockMinimo < 0) {
                showAlert('El stock mínimo debe ser un número mayor o igual a cero', 'danger');
                return;
            }
            
            if (isNaN(stockMaximo) || stockMaximo < 0) {
                showAlert('El stock máximo debe ser un número mayor o igual a cero', 'danger');
                return;
            }
            
            if (stockMinimo > stockMaximo) {
                showAlert('El stock mínimo no puede ser mayor al máximo', 'danger');
                return;
            }
            
            showSpinner();
            
            // Si estamos editando min/max o es un registro nuevo sin ajuste
            if (stockId && document.getElementById('divStockMotivo').style.display === 'none') {
                // Actualizar mínimo/máximo
                const minMaxResult = await window.inventarioSoap.updateStockMinMax(stockId, stockMinimo, stockMaximo);
                
                if (minMaxResult && minMaxResult.error) {
                    showAlert('Error al actualizar mínimo/máximo: ' + minMaxResult.error, 'danger');
                    hideSpinner();
                    return;
                }
                
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('modalStock')).hide();
                
                // Mostrar mensaje de éxito
                showAlert('Stock mínimo y máximo actualizados correctamente', 'success');
                
                // Recargar datos
                loadStock(currentStockPage);
            } else {
                // Si hay stock existente, obtener la cantidad actual
                let cantidadAnterior = 0;
                if (stockId) {
                    try {
                        const allStockData = await window.inventarioSoap.getAllStock(1, 100);
                        if (allStockData && allStockData.stockItems && allStockData.stockItems.stockItem) {
                            const stockItems = Array.isArray(allStockData.stockItems.stockItem) 
                                ? allStockData.stockItems.stockItem
                                : [allStockData.stockItems.stockItem];
                            
                            const stockItem = stockItems.find(item => item.id == stockId);
                            if (stockItem) {
                                cantidadAnterior = stockItem.cantidad;
                            }
                        }
                    } catch (error) {
                        console.error('Error al obtener cantidad anterior:', error);
                    }
                }
                
                // Si la cantidad ha cambiado o es un nuevo registro, registrar ajuste
                if (cantidad !== cantidadAnterior || !stockId) {
                    if (!motivo && document.getElementById('divStockMotivo').style.display !== 'none') {
                        showAlert('Debe seleccionar un motivo para el ajuste', 'danger');
                        hideSpinner();
                        return;
                    }
                    
                    const ajusteData = {
                        producto_id: productoId,
                        ubicacion_id: ubicacionId,
                        cantidad_anterior: cantidadAnterior,
                        cantidad_nueva: cantidad,
                        motivo: motivo || 'Ajuste manual',
                        descripcion: descripcion || 'Ajuste desde formulario de stock'
                    };
                    
                    console.log('Registrando ajuste de stock:', ajusteData);
                    
                    const ajusteResult = await window.inventarioSoap.registerAdjustment(ajusteData);
                    
                    if (ajusteResult && ajusteResult.error) {
                        showAlert('Error al ajustar stock: ' + ajusteResult.error, 'danger');
                        hideSpinner();
                        return;
                    }
                }
                
                // Si hay ID de stock, actualizar mínimo/máximo
                if (stockId) {
                    const minMaxResult = await window.inventarioSoap.updateStockMinMax(stockId, stockMinimo, stockMaximo);
                    
                    if (minMaxResult && minMaxResult.error) {
                        showAlert('Error al actualizar mínimo/máximo: ' + minMaxResult.error, 'danger');
                        hideSpinner();
                        return;
                    }
                }
                
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('modalStock')).hide();
                
                // Mostrar mensaje de éxito
                showAlert('Stock actualizado correctamente', 'success');
                
                // Recargar datos
                loadStock(currentStockPage);
            }
            
            hideSpinner();
        } catch (error) {
            console.error('Error al guardar stock:', error);
            showAlert('Error al guardar stock: ' + error.message, 'danger');
            hideSpinner();
        }
    }
    
    // ********** SECCIÓN DE CATEGORÍAS **********
    async function initCategoriasSection() {
        try {
            // Cargar datos iniciales
            await loadCategorias();
            
            // Configurar eventos
            document.getElementById('btnNuevaCategoria').addEventListener('click', function() {
                resetFormCategoria();
                document.getElementById('modalCategoriaLabel').textContent = 'Nueva Categoría';
                const modal = new bootstrap.Modal(document.getElementById('modalCategoria'));
                modal.show();
            });
            
            document.getElementById('btnGuardarCategoria').addEventListener('click', saveCategoria);
            
            // Delegación de eventos para botones de acción en tabla de categorías
            document.getElementById('tablaCategorias').addEventListener('click', function(e) {
                const target = e.target.closest('button');
                if (!target) return;
                
                const categoriaId = target.dataset.id;
                
                if (target.classList.contains('btn-edit-categoria')) {
                    editCategoria(categoriaId);
                } else if (target.classList.contains('btn-delete-categoria')) {
                    deleteCategoria(categoriaId);
                }
            });
            
            // Auto-generar slug a partir del nombre
            document.getElementById('categoriaNombre').addEventListener('input', function() {
                const nombre = this.value.trim();
                const slugInput = document.getElementById('categoriaSlug');
                
                // Solo actualizar si el campo de slug está vacío o no ha sido modificado manualmente
                if (!slugInput.dataset.modified) {
                    slugInput.value = generateSlug(nombre);
                }
            });
            
            document.getElementById('categoriaSlug').addEventListener('input', function() {
                // Marcar que ha sido modificado manualmente
                this.dataset.modified = true;
            });
            
        } catch (error) {
            console.error('Error al inicializar sección de categorías:', error);
            showAlert('Error al cargar la sección de categorías. Por favor, intente nuevamente más tarde.', 'danger');
        }
    }
    
    async function loadCategorias() {
        try {
            showSpinner();
            
            const tablaCategorias = document.getElementById('tablaCategorias');
            tablaCategorias.innerHTML = '<tr><td colspan="5" class="text-center">Cargando categorías...</td></tr>';
            
            // Obtener categorías
            const categorias = await getCategorias();
            
            if (!categorias || !categorias.length) {
                tablaCategorias.innerHTML = '<tr><td colspan="5" class="text-center">No hay categorías disponibles</td></tr>';
                hideSpinner();
                return;
            }
            
            // Limpiar tabla
            tablaCategorias.innerHTML = '';
            
            // Cargar datos en la tabla
            for (const categoria of categorias) {
                // Obtener conteo de productos
                let productosCount = 0;
                try {
                    const productosData = await getProductosByCategoria(categoria.id, 1, 1);
                    if (productosData && productosData.pagination) {
                        productosCount = productosData.pagination.totalItems || 0;
                    }
                } catch (error) {
                    console.error(`Error al obtener productos de categoría ${categoria.id}:`, error);
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${categoria.id}</td>
                    <td>${categoria.nombre}</td>
                    <td>${categoria.slug}</td>
                    <td>${productosCount}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-edit-categoria" data-id="${categoria.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-categoria" data-id="${categoria.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tablaCategorias.appendChild(row);
            }
            
            // Actualizar dropdown de categoría padre
            await updateCategoriaParentDropdown();
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            document.getElementById('tablaCategorias').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>';
            hideSpinner();
        }
    }
    
    async function updateCategoriaParentDropdown() {
        try {
            const select = document.getElementById('categoriaParent');
            if (!select) return;
            
            // Mantener la primera opción (placeholder)
            const firstOption = select.options[0];
            
            // Obtener categorías
            const categorias = await getCategorias();
            
            // Limpiar dropdown
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Añadir categorías al dropdown
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al actualizar dropdown de categoría padre:', error);
        }
    }
    
    function resetFormCategoria() {
        const form = document.getElementById('formCategoria');
        form.reset();
        document.getElementById('categoriaId').value = '';
        document.getElementById('categoriaSlug').dataset.modified = false;
    }
    
    async function editCategoria(id) {
        try {
            showSpinner();
            
            // Obtener datos de la categoría
            const categoria = await getCategoriaById(id);
            
            // Llenar formulario
            document.getElementById('categoriaId').value = categoria.id;
            document.getElementById('categoriaNombre').value = categoria.nombre;
            document.getElementById('categoriaSlug').value = categoria.slug;
            document.getElementById('categoriaDescripcion').value = categoria.descripcion || '';
            document.getElementById('categoriaParent').value = categoria.parent_id || '';
            
            // Marcar slug como modificado para evitar que se sobrescriba
            document.getElementById('categoriaSlug').dataset.modified = true;
            
            // Cambiar título del modal
            document.getElementById('modalCategoriaLabel').textContent = 'Editar Categoría';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalCategoria'));
            modal.show();
            
            hideSpinner();
        } catch (error) {
            console.error('Error al cargar datos de la categoría:', error);
            showAlert('Error al cargar datos de la categoría', 'danger');
            hideSpinner();
        }
    }
    
    async function saveCategoria() {
        try {
            // Obtener valores del formulario
            const id = document.getElementById('categoriaId').value;
            const nombre = document.getElementById('categoriaNombre').value.trim();
            let slug = document.getElementById('categoriaSlug').value.trim();
            const descripcion = document.getElementById('categoriaDescripcion').value.trim();
            const parent_id = document.getElementById('categoriaParent').value || null;
            
            // Validaciones
            if (!nombre) {
                showAlert('El nombre de la categoría es obligatorio', 'danger');
                return;
            }
            
            // Generar slug si está vacío
            if (!slug) {
                slug = generateSlug(nombre);
            }
            
            // Preparar datos
            const categoriaData = {
                nombre,
                slug,
                descripcion,
                parent_id: parent_id ? parseInt(parent_id) : null
            };
            
            showSpinner();
            
            let response;
            if (id) {
                // Actualizar categoría existente
                response = await fetch(`${API_URL}/categorias/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
            } else {
                // Crear nueva categoría
                response = await fetch(`${API_URL}/categorias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoriaData)
                });
            }
            
            hideSpinner();
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar la categoría');
            }
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
            
            // Mostrar mensaje de éxito
            showAlert(id ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente', 'success');
            
            // Recargar datos
            loadCategorias();
            
            // Actualizar dropdowns en otras secciones
            loadCategoriasDropdown('filtroCategoriaProducto');
            loadCategoriasDropdown('productoCategoria');
            
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            showAlert(`Error al guardar categoría: ${error.message}`, 'danger');
            hideSpinner();
        }
    }
    
    async function deleteCategoria(id) {
        // Confirmar eliminación
        if (!confirm('¿Está seguro que desea eliminar esta categoría? Esta acción no se puede deshacer y podría afectar a los productos asociados.')) {
            return;
        }
        
        try {
            showSpinner();
            
            // Eliminar categoría
            const response = await fetch(`${API_URL}/categorias/${id}`, {
                method: 'DELETE'
            });
            
            hideSpinner();
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la categoría');
            }
            
            // Mostrar mensaje de éxito
            showAlert('Categoría eliminada correctamente', 'success');
            
            // Recargar datos
            loadCategorias();
            
            // Actualizar dropdowns en otras secciones
            loadCategoriasDropdown('filtroCategoriaProducto');
            loadCategoriasDropdown('productoCategoria');
            
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            showAlert(`Error al eliminar categoría: ${error.message}`, 'danger');
            hideSpinner();
        }
    }
    
    // ********** UTILIDADES **********
    
    // Generar slug a partir de un texto
    function generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
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
});