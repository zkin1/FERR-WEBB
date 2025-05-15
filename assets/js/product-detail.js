/**
 * product-detail.js - Funcionalidad para la página de detalle de producto
 * Versión autónoma sin dependencias de variables globales
 */

// IIFE para encapsular todo el código y evitar conflictos
(function() {
    // Configuración interna
    const config = {
        apiUrl: 'http://localhost:3000/api',
        defaultImage: '/assets/images/default.jpg',
        temporaryStockFix: true // Habilitar arreglo temporal para problemas de stock
    };

    // Función principal que se ejecuta cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        // Obtener ID de producto de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        console.log('ID del producto:', productId);
        
        if (productId) {
            loadProductDetail(productId);
        } else {
            // Redirigir a la página principal si no hay ID
            window.location.href = '/index.html';
        }
    });

    // Función para cargar datos de la API
    async function fetchFromApi(endpoint) {
        try {
            console.log(`Fetching: ${config.apiUrl}${endpoint}`);
            const response = await fetch(`${config.apiUrl}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`Error API: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en petición API:', error);
            return null;
        }
    }

    // Función para cargar el detalle del producto
    async function loadProductDetail(productId) {
        const productContainer = document.getElementById('product-container');
        if (!productContainer) return;
        
        // Mostrar indicador de carga
        productContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando detalle del producto...</p>
            </div>
        `;
        
        try {
            // 1. Obtener datos del producto
            const producto = await fetchFromApi(`/productos/${productId}`);
            
            if (!producto || !producto.id) {
                throw new Error('Producto no encontrado');
            }
            
            // 2. Obtener stock del producto utilizando la API SOAP
            let stockInfo = await getProductStock(productId);
            
            // 3. Obtener categoría
            let categoria = null;
            try {
                if (producto.categoria_id) {
                    categoria = await fetchFromApi(`/categorias/${producto.categoria_id}`);
                }
            } catch (error) {
                console.error('Error al obtener categoría:', error);
            }
            
            // 4. Generar HTML del producto
            renderProductDetail(productContainer, producto, stockInfo, categoria);
            
            // 5. Cargar productos relacionados
            loadRelatedProducts(producto.categoria_id, productId);
            
        } catch (error) {
            console.error('Error al cargar detalle del producto:', error);
            productContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error al cargar el producto. Por favor, intente nuevamente.
                    </div>
                </div>
            `;
        }
    }

    // Función para obtener stock desde la API SOAP
    async function getProductStock(productId) {
        let stockInfo = { disponible: 0, ubicaciones: [] };
        
        try {
            // Verificar si el objeto window.inventarioSoap existe
            if (window.inventarioSoap && typeof window.inventarioSoap.getProductStock === 'function') {
                const stockResult = await window.inventarioSoap.getProductStock(productId);
                console.log('Respuesta API Stock:', stockResult);
                
                if (stockResult && stockResult.stockItems && stockResult.stockItems.stockItem) {
                    const stockItems = Array.isArray(stockResult.stockItems.stockItem) ? 
                        stockResult.stockItems.stockItem : [stockResult.stockItems.stockItem];
                    
                    // Calcular stock total
                    stockInfo.disponible = stockItems.reduce((total, item) => {
                        return total + parseInt(item.cantidad || 0);
                    }, 0);
                    
                    // Guardar ubicaciones con stock
                    stockInfo.ubicaciones = stockItems
                        .map(item => ({
                            ubicacionId: item.ubicacion_id,
                            ubicacionNombre: item.ubicacion_nombre || 'Ubicación desconocida',
                            cantidad: parseInt(item.cantidad || 0)
                        }))
                        .filter(item => item.cantidad > 0);
                }
            } else {
                console.warn('API de inventario no disponible, usando valores por defecto');
            }
        } catch (error) {
            console.error('Error al obtener stock:', error);
        }
        
        // Si no hay stock y está habilitado el arreglo temporal, usar valores por defecto
        if (stockInfo.disponible === 0 && config.temporaryStockFix) {
            console.log('Usando stock temporal predeterminado');
            stockInfo.disponible = 10;
            stockInfo.ubicaciones = [
                {
                    ubicacionId: 1,
                    ubicacionNombre: 'Bodega principal',
                    cantidad: 10
                }
            ];
        }
        
        return stockInfo;
    }

    // Función para renderizar el detalle del producto
    function renderProductDetail(container, producto, stockInfo, categoria) {
        // Verificar si el producto está activo
        const isProductActive = producto.estado === undefined || producto.estado === 'activo';
        
        // Determinar si hay stock disponible
        const isAvailable = isProductActive && stockInfo.disponible > 0;
        
        // Actualizar título y breadcrumb
        document.title = `${producto.nombre} - FERREMAS`;
        
        const productNameElem = document.getElementById('product-name');
        if (productNameElem) productNameElem.textContent = producto.nombre;
        
        const productCategoryElem = document.getElementById('product-category');
        if (productCategoryElem) {
            productCategoryElem.textContent = categoria ? categoria.nombre : 'Categoría';
        }
        
        // Preparar HTML del estado de stock
        let stockBadgeHtml = '';
        if (!isProductActive) {
            stockBadgeHtml = `
                <span class="badge bg-danger p-2">
                    <i class="fas fa-times-circle me-1"></i> Producto no disponible
                </span>
            `;
        } else if (stockInfo.disponible <= 0) {
            stockBadgeHtml = `
                <span class="badge bg-danger p-2">
                    <i class="fas fa-times-circle me-1"></i> Sin stock
                </span>
            `;
        } else {
            stockBadgeHtml = `
                <span class="badge bg-success p-2">
                    <i class="fas fa-check-circle me-1"></i> Stock disponible: ${stockInfo.disponible} unidades
                </span>
            `;
        }
        
        // Preparar HTML de ubicaciones
        let ubicacionesHtml = '';
        if (isAvailable && stockInfo.ubicaciones.length > 0) {
            ubicacionesHtml = `
                <div class="mt-2 small">
                    <p class="mb-1">Disponible en:</p>
                    <ul class="ps-3">
                        ${stockInfo.ubicaciones.map(ubi => 
                            `<li>${ubi.ubicacionNombre}: ${ubi.cantidad} unidades</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Renderizar HTML del producto
        container.innerHTML = `
            <div class="col-md-6 mb-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-0">
                        <img src="${config.defaultImage}" class="img-fluid w-100" alt="${producto.nombre}" id="main-product-image" style="max-height: 400px; object-fit: contain;">
                    </div>
                    <div class="card-footer bg-white p-3">
                        <div class="d-flex justify-content-center" id="image-thumbnails">
                            <div class="thumbnail-item active me-2" data-index="0">
                                <img src="${config.defaultImage}" class="img-thumbnail" alt="${producto.nombre}" style="width: 60px; height: 60px; object-fit: cover;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <h1 class="h2 mb-3">${producto.nombre}</h1>
                <p class="text-muted mb-3">Código: ${producto.codigo}</p>
                
                <div class="mb-4">
                    ${producto.precio_oferta ? 
                        `<p class="text-decoration-line-through text-muted mb-1">$${formatPrice(producto.precio)}</p>
                        <p class="h3 text-danger">$${formatPrice(producto.precio_oferta)}</p>` : 
                        `<p class="h3">$${formatPrice(producto.precio)}</p>`
                    }
                </div>
                
                <div class="mb-4">
                    <p>${producto.descripcion || 'Sin descripción disponible'}</p>
                </div>
                
                <div class="mb-4 stock-info">
                    ${stockBadgeHtml}
                    ${ubicacionesHtml}
                </div>
                
                <div class="mb-4">
                    <label for="product-quantity" class="form-label">Cantidad</label>
                    <div class="input-group" style="width: 150px;">
                        <button class="btn btn-outline-secondary" type="button" id="decrease-quantity" ${!isAvailable ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" id="product-quantity" class="form-control text-center" value="1" min="1" max="${stockInfo.disponible}" ${!isAvailable ? 'disabled' : ''}>
                        <button class="btn btn-outline-secondary" type="button" id="increase-quantity" ${!isAvailable ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-lg w-100" id="add-to-cart-btn" ${!isAvailable ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus me-2"></i> ${isAvailable ? 'Agregar al carrito' : 'No disponible'}
                </button>
            </div>
        `;
        
        // Agregar eventos solo si el producto está disponible
        if (isAvailable) {
            setupQuantityButtons(stockInfo.disponible);
            setupAddToCartButton(producto, stockInfo.disponible);
        }
    }

    // Configurar botones de cantidad
    function setupQuantityButtons(maxQuantity) {
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        const quantityInput = document.getElementById('product-quantity');
        
        if (decreaseBtn && increaseBtn && quantityInput) {
            decreaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                if (value < maxQuantity) {
                    quantityInput.value = value + 1;
                }
            });
            
            // Validar entrada directa
            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                if (isNaN(value) || value < 1) {
                    quantityInput.value = 1;
                } else if (value > maxQuantity) {
                    quantityInput.value = maxQuantity;
                }
            });
        }
    }

    // Configurar botón de agregar al carrito
    function setupAddToCartButton(producto, maxStock) {
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const quantityInput = document.getElementById('product-quantity');
        
        if (addToCartBtn && quantityInput) {
            addToCartBtn.addEventListener('click', () => {
                const cantidad = parseInt(quantityInput.value);
                
                if (isNaN(cantidad) || cantidad < 1 || cantidad > maxStock) {
                    showToast('La cantidad seleccionada no es válida', 'danger');
                    return;
                }
                
                const productData = {
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio_oferta || producto.precio,
                    imagen: config.defaultImage,
                    cantidad: cantidad,
                    stock: maxStock
                };
                
                // Verificar si la función addToCart está disponible globalmente
                if (typeof window.addToCart === 'function') {
                    window.addToCart(productData);
                    showToast('¡Producto agregado al carrito!');
                } else {
                    console.warn('Función addToCart no disponible, usando alternativa');
                    // Implementación mínima si no existe la función global
                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    
                    // Buscar si el producto ya está en el carrito
                    const existingIndex = cart.findIndex(item => item.id == productData.id);
                    
                    if (existingIndex >= 0) {
                        // Actualizar cantidad
                        cart[existingIndex].cantidad += productData.cantidad;
                    } else {
                        // Agregar nuevo producto
                        cart.push(productData);
                    }
                    
                    localStorage.setItem('cart', JSON.stringify(cart));
                    showToast('¡Producto agregado al carrito!');
                    
                    // Actualizar contador del carrito si existe
                    const cartCountElement = document.getElementById('cart-count');
                    if (cartCountElement) {
                        const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
                        cartCountElement.textContent = totalItems;
                    }
                }
            });
        }
    }

    // Cargar productos relacionados
    async function loadRelatedProducts(categoriaId, currentProductId) {
        const relatedContainer = document.getElementById('related-products');
        if (!relatedContainer) return;
        
        // Mostrar indicador de carga
        relatedContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando productos relacionados...</p>
            </div>
        `;
        
        try {
            let productosRelacionados = [];
            
            // Intentar obtener productos relacionados si hay categoría
            if (categoriaId) {
                const resultado = await fetchFromApi(`/categorias/${categoriaId}/productos?limit=4`);
                if (resultado && resultado.productos) {
                    // Filtrar para excluir el producto actual
                    productosRelacionados = resultado.productos.filter(p => p.id != currentProductId);
                }
            }
            
            // Si no hay suficientes productos relacionados, mostrar productos de muestra
            if (productosRelacionados.length === 0) {
                relatedContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">No se encontraron productos relacionados</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar productos relacionados
            relatedContainer.innerHTML = '';
            
            productosRelacionados.forEach(producto => {
                const isAvailable = producto.estado !== 'inactivo'; // Simplificado para productos relacionados
                
                const productElement = document.createElement('div');
                productElement.className = 'col';
                productElement.innerHTML = `
                    <div class="card h-100 shadow-sm">
                        <div class="card-img-top" style="height: 200px;">
                            <a href="/product-detail.html?id=${producto.id}">
                                <img src="${config.defaultImage}" class="img-fluid w-100 h-100" alt="${producto.nombre}" style="object-fit: contain;">
                            </a>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="/product-detail.html?id=${producto.id}" class="text-decoration-none">${producto.nombre}</a>
                            </h5>
                            <div class="card-text mt-auto mb-3">
                                ${producto.precio_oferta ? 
                                    `<span class="text-decoration-line-through text-muted me-2">$${formatPrice(producto.precio)}</span>
                                    <span class="fw-bold text-danger">$${formatPrice(producto.precio_oferta)}</span>` : 
                                    `<span class="fw-bold">$${formatPrice(producto.precio)}</span>`
                                }
                            </div>
                            <button class="btn btn-primary w-100 btn-add-related" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio_oferta || producto.precio}" ${!isAvailable ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
                            </button>
                        </div>
                    </div>
                `;
                
                relatedContainer.appendChild(productElement);
            });
            
            // Agregar evento a botones de productos relacionados
            document.querySelectorAll('.btn-add-related').forEach(button => {
                button.addEventListener('click', function() {
                    const productData = {
                        id: this.dataset.id,
                        nombre: this.dataset.nombre,
                        precio: parseFloat(this.dataset.precio),
                        imagen: config.defaultImage,
                        cantidad: 1
                    };
                    
                    if (typeof window.addToCart === 'function') {
                        window.addToCart(productData);
                        showToast('¡Producto agregado al carrito!');
                    } else {
                        // Implementación mínima alternativa
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        const existingIndex = cart.findIndex(item => item.id == productData.id);
                        
                        if (existingIndex >= 0) {
                            cart[existingIndex].cantidad += 1;
                        } else {
                            cart.push(productData);
                        }
                        
                        localStorage.setItem('cart', JSON.stringify(cart));
                        showToast('¡Producto agregado al carrito!');
                        
                        // Actualizar contador
                        const cartCountElement = document.getElementById('cart-count');
                        if (cartCountElement) {
                            const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
                            cartCountElement.textContent = totalItems;
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Error al cargar productos relacionados:', error);
            relatedContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Error al cargar productos relacionados</p>
                </div>
            `;
        }
    }

    // Función para mostrar notificaciones toast
    function showToast(message, type = 'success') {
        // Crear contenedor de toast si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Crear toast
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
                    <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Mostrar toast con Bootstrap
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } else {
            // Fallback si bootstrap no está disponible
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
        
        // Eliminar después de ocultarse
        toast.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }

    // Función para formatear precios
    function formatPrice(price) {
        return new Intl.NumberFormat('es-CL').format(price);
    }
})();