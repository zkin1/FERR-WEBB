// Función para cargar productos destacados en la página de inicio
async function loadFeaturedProducts() {
    try {
        const featuredContainer = document.getElementById('featured-products');
        if (!featuredContainer) return;
        
        // Limpiar el contenedor
        featuredContainer.innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Intentar obtener productos de la API
        let productos = [];
        try {
            const resultado = await getProductosDestacados(8);
            if (resultado && Array.isArray(resultado)) {
                productos = resultado;
            } else if (resultado && resultado.productos) {
                productos = resultado.productos;
            }
        } catch (error) {
            console.error('Error al cargar productos destacados:', error);
        }
        
        // Si no hay productos de la API, usar datos de muestra
        if (!productos || productos.length === 0) {
            productos = [
                { id: 1, nombre: 'Martillo Profesional', codigo: 'MART001', precio: 12990, categoria_id: 1 },
                { id: 2, nombre: 'Destornillador Eléctrico', codigo: 'DEST001', precio: 19990, categoria_id: 3 },
                { id: 3, nombre: 'Sierra Circular', codigo: 'SIER001', precio: 89990, categoria_id: 3 },
                { id: 4, nombre: 'Cemento 25kg', codigo: 'CEM001', precio: 5990, categoria_id: 4 }
            ];
        }
        
        // Limpiar el contenedor
        featuredContainer.innerHTML = '';
        
        // Crear tarjetas de productos
        productos.forEach(producto => {
            const card = createProductCard(producto);
            featuredContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error general al cargar productos destacados:', error);
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) {
            featuredContainer.innerHTML = `
                <p class="error">Error al cargar productos. Por favor, intente nuevamente.</p>
                <div class="products-grid">
                    ${createSampleProductsHTML()}
                </div>
            `;
        }
    }
}

// Función para crear HTML de productos de muestra
function createSampleProductsHTML() {
    const productos = [
        { id: 1, nombre: 'Martillo Profesional', codigo: 'MART001', precio: 12990 },
        { id: 2, nombre: 'Destornillador Eléctrico', codigo: 'DEST001', precio: 19990 },
        { id: 3, nombre: 'Sierra Circular', codigo: 'SIER001', precio: 89990 },
        { id: 4, nombre: 'Cemento 25kg', codigo: 'CEM001', precio: 5990 }
    ];
    
    return productos.map(producto => `
        <div class="product-card">
            <div class="product-image">
                <a href="product-detail.html?id=${producto.id}">
                    <img src="../assets/images/default.jpg" alt="${producto.nombre}">
                </a>
            </div>
            <div class="product-details">
                <h3 class="product-title">
                    <a href="product-detail.html?id=${producto.id}">${producto.nombre}</a>
                </h3>
                <div class="product-price">$${formatPrice(producto.precio)}</div>
                <button class="btn add-to-cart" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}" data-imagen="../assets/images/default.jpg">
                    Agregar al carrito
                </button>
            </div>
        </div>
    `).join('');
}

// Función para cargar productos nuevos en la página de inicio
async function loadNewProducts() {
    try {
        const newProductsContainer = document.getElementById('new-products');
        if (!newProductsContainer) return;
        
        // Limpiar el contenedor
        newProductsContainer.innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Obtener productos nuevos
        const productos = await getProductosNuevos(8);
        
        // Verificar si hay productos
        if (!productos || productos.length === 0) {
            newProductsContainer.innerHTML = '<p class="no-products">No hay productos nuevos disponibles</p>';
            return;
        }
        
        // Limpiar el contenedor
        newProductsContainer.innerHTML = '';
        
        // Crear tarjetas de productos
        productos.forEach(producto => {
            const card = createProductCard(producto);
            newProductsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar productos nuevos:', error);
        const newProductsContainer = document.getElementById('new-products');
        if (newProductsContainer) {
            newProductsContainer.innerHTML = '<p class="error">Error al cargar productos. Por favor, intente nuevamente.</p>';
        }
    }
}

// Función para crear una tarjeta de producto
function createProductCard(producto) {
    // Crear elemento principal
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Usar ruta simple y directa
    const productDetailUrl = `product-detail.html?id=${producto.id}`;
    
    // Usar rutas simples para imágenes
    const imageUrl = `/assets/images/default.jpg`;
    
    // HTML interno del card con URL simplificadas
    card.innerHTML = `
        <div class="product-image">
            <a href="${productDetailUrl}">
                <img src="${imageUrl}" alt="${producto.nombre}">
            </a>
        </div>
        <div class="product-details">
            <h3 class="product-title">
                <a href="${productDetailUrl}">${producto.nombre}</a>
            </h3>
            <div class="product-price">
                ${producto.precio_oferta ? 
                    `<span class="original-price">$${formatPrice(producto.precio)}</span> $${formatPrice(producto.precio_oferta)}` : 
                    `$${formatPrice(producto.precio)}`
                }
            </div>
            <button class="btn add-to-cart" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio_oferta || producto.precio}" data-imagen="${imageUrl}">
                Agregar al carrito
            </button>
        </div>
    `;
    
    // Agregar evento al botón de agregar al carrito
    const addButton = card.querySelector('.add-to-cart');
    addButton.addEventListener('click', function() {
        const productData = {
            id: this.dataset.id,
            nombre: this.dataset.nombre,
            precio: parseFloat(this.dataset.precio),
            imagen: this.dataset.imagen,
            cantidad: 1
        };
        
        addToCart(productData);
        showNotification('Producto agregado al carrito');
    });
    
    return card;
}

// Función para cargar detalle de un producto
async function loadProductDetail(productId) {
    try {
        const productContainer = document.getElementById('product-container');
        if (!productContainer) return;
        
        // Limpiar el contenedor
        productContainer.innerHTML = '<div class="loading">Cargando producto...</div>';
        
        // Obtener datos del producto
        const producto = await getProductoById(productId);

         // NUEVO: Obtener stock del producto
        let stockInfo = { disponible: 0, ubicaciones: [] };
        try {
            const stockResult = await window.inventarioSoap.getProductStock(productId);
            
            if (stockResult && stockResult.stockItems && stockResult.stockItems.stockItem) {
                const stockItems = Array.isArray(stockResult.stockItems.stockItem) ? 
                    stockResult.stockItems.stockItem : [stockResult.stockItems.stockItem];
                
                // Calcular stock total disponible
                stockInfo.disponible = stockItems.reduce((total, item) => total + item.cantidad, 0);
                
                // Guardar información de ubicaciones
                stockInfo.ubicaciones = stockItems.map(item => ({
                    ubicacionId: item.ubicacion_id,
                    ubicacionNombre: item.ubicacion_nombre,
                    cantidad: item.cantidad
                }));
            }
        } catch (error) {
            console.error('Error al obtener stock:', error);
        }

                const stockHtml = `
            <div class="stock-info">
                <span class="${stockInfo.disponible > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${stockInfo.disponible > 0 ? `Stock disponible: ${stockInfo.disponible} unidades` : 'Sin stock'}
                </span>
                ${stockInfo.ubicaciones.length > 0 ? `
                <div class="ubicaciones-stock mt-2">
                    <small>Disponible en:</small>
                    <ul class="ps-3 mt-1">
                        ${stockInfo.ubicaciones.map(ubi => 
                            `<li>${ubi.ubicacionNombre}: ${ubi.cantidad} unidades</li>`).join('')}
                    </ul>
                </div>` : ''}
            </div>
        `;
        
        // Obtener imágenes del producto
        const imagenes = await getImagenesProducto(productId);
        
        // Obtener especificaciones del producto
        const especificaciones = await getEspecificacionesProducto(productId);
        
        // Obtener datos de la categoría
        const categoria = await getCategoriaById(producto.categoria_id);
        
        // Verificar si el producto existe
        if (!producto) {
            productContainer.innerHTML = '<p class="error">Producto no encontrado</p>';
            return;
        }
        
        // Actualizar el breadcrumb y título
        document.getElementById('product-category').textContent = categoria ? categoria.nombre : 'Categoría';
        document.getElementById('product-name').textContent = producto.nombre;
        document.title = `${producto.nombre} - FERREMAS`;
        
        // Crear URL de la imagen principal (asociando código de producto)
        const mainImageUrl = imagenes && imagenes.length > 0 ? 
            `assets/images/productos/${producto.codigo}_1.jpg` : 
            `assets/images/productos/${producto.codigo}.jpg`;
        const defaultImage = 'assets/images/productos/default.jpg';
        
        // Crear HTML del detalle del producto
        let thumbnailsHtml = '';
        if (imagenes && imagenes.length > 0) {
            thumbnailsHtml = '<div class="thumbnails">';
            for (let i = 0; i < imagenes.length; i++) {
                const thumbUrl = `assets/images/productos/${producto.codigo}_${i+1}.jpg`;
                thumbnailsHtml += `
                    <div class="thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">
                        <img src="${thumbUrl}" alt="${producto.nombre}" onerror="this.src='${defaultImage}'">
                    </div>
                `;
            }
            thumbnailsHtml += '</div>';
        }
        
        // Crear HTML de especificaciones
        let specsHtml = '';
        if (especificaciones && especificaciones.length > 0) {
            specsHtml = `
                <div class="product-specs">
                    <h3>Especificaciones</h3>
                    <table class="specs-table">
                        <tbody>
            `;
            
            especificaciones.forEach(spec => {
                specsHtml += `
                    <tr>
                        <th>${spec.nombre}</th>
                        <td>${spec.valor}</td>
                    </tr>
                `;
            });
            
            specsHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Generar HTML completo del detalle
        productContainer.innerHTML = `
            <div class="product-images">
                <div class="main-image">
                    <img src="${mainImageUrl}" alt="${producto.nombre}" id="main-product-image" onerror="this.src='${defaultImage}'">
                </div>
                ${thumbnailsHtml}
            </div>
            <div class="product-info">
                <h1>${producto.nombre}</h1>
                <p class="product-code">Código: ${producto.codigo}</p>
                <div class="product-price-detail">
                    ${producto.precio_oferta ? 
                        `<span class="original-price">$${formatPrice(producto.precio)}</span> $${formatPrice(producto.precio_oferta)}` : 
                        `$${formatPrice(producto.precio)}`
                    }
                </div>
                <div class="product-description">
                    ${producto.descripcion || 'Sin descripción disponible'}
                </div>
                <div class="stock-info">
                    <span class="${producto.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${producto.stock > 0 ? `Stock disponible: ${producto.stock} unidades` : 'Sin stock'}
                    </span>
                </div>
                <div class="product-quantity">
                    <button class="quantity-btn" id="decrease-quantity">-</button>
                    <input type="number" id="product-quantity" class="quantity-input" value="1" min="1" max="${producto.stock}">
                    <button class="quantity-btn" id="increase-quantity">+</button>
                </div>
                <button class="btn add-to-cart-detail" id="add-to-cart-btn" ${producto.stock <= 0 ? 'disabled' : ''}>
                    ${producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                </button>
                ${specsHtml}
            </div>
        `;
        
        // Agregar eventos a los botones de cantidad
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        const quantityInput = document.getElementById('product-quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        
        decreaseBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value > 1) {
                quantityInput.value = value - 1;
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value < producto.stock) {
                quantityInput.value = value + 1;
            }
        });
        
        // Agregar evento para las miniaturas
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Remover clase active de todas las miniaturas
                thumbnails.forEach(t => t.classList.remove('active'));
                // Agregar clase active al thumbnail clickeado
                this.classList.add('active');
                
                // Cambiar imagen principal
                const index = this.dataset.index;
                const mainImage = document.getElementById('main-product-image');
                mainImage.src = `assets/images/productos/${producto.codigo}_${parseInt(index)+1}.jpg`;
                mainImage.onerror = function() {
                    this.src = defaultImage;
                };
            });
        });
        
        // Agregar evento al botón de agregar al carrito
        addToCartBtn.addEventListener('click', function() {
            if (stockInfo.disponible <= 0) return;
            
            const cantidad = parseInt(quantityInput.value);
            if (cantidad < 1 || cantidad > stockInfo.disponible) return;
            
            const productData = {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio_oferta || producto.precio,
                imagen: mainImageUrl,
                cantidad: cantidad,
                stock: stockInfo.disponible // Añadimos el stock disponible
            };
            
            addToCart(productData);
            showNotification('Producto agregado al carrito');
        });
    } catch (error) {
        console.error('Error al cargar detalle del producto:', error);
        const productContainer = document.getElementById('product-container');
        if (productContainer) {
            productContainer.innerHTML = '<p class="error">Error al cargar el producto. Por favor, intente nuevamente.</p>';
        }
    }
}

// Función para cargar productos relacionados
async function loadRelatedProducts(categoriaId, currentProductId) {
    try {
        const relatedContainer = document.getElementById('related-products');
        if (!relatedContainer) return;
        
        // Limpiar el contenedor
        relatedContainer.innerHTML = '<div class="loading">Cargando productos relacionados...</div>';
        
        // Obtener productos de la misma categoría
        const resultado = await getProductosByCategoria(categoriaId, 1, 4);
        const productos = resultado.productos;
        
        // Verificar si hay productos
        if (!productos || productos.length === 0) {
            relatedContainer.innerHTML = '<p class="no-products">No hay productos relacionados disponibles</p>';
            return;
        }
        
        // Filtrar para excluir el producto actual
        const related = productos.filter(p => p.id !== parseInt(currentProductId));
        
        // Limpiar el contenedor
        relatedContainer.innerHTML = '';
        
        // Crear tarjetas de productos relacionados
        related.forEach(producto => {
            const card = createProductCard(producto);
            relatedContainer.appendChild(card);
        });
        
        // Si no hay suficientes relacionados, mostrar mensaje
        if (related.length === 0) {
            relatedContainer.innerHTML = '<p class="no-products">No hay productos relacionados disponibles</p>';
        }
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
        const relatedContainer = document.getElementById('related-products');
        if (relatedContainer) {
            relatedContainer.innerHTML = '<p class="error">Error al cargar productos relacionados.</p>';
        }
    }
}

// Función para cargar categorías en la página principal
async function loadCategories() {
    try {
        const categoriesContainer = document.getElementById('categories-container');
        if (!categoriesContainer) return;
        
        // Limpiar el contenedor
        categoriesContainer.innerHTML = '<div class="loading">Cargando categorías...</div>';
        
        // Obtener categorías
        const categorias = await getCategorias();
        
        // Verificar si hay categorías
        if (!categorias || categorias.length === 0) {
            categoriesContainer.innerHTML = '<p class="no-categories">No hay categorías disponibles</p>';
            return;
        }
        
        // Limpiar el contenedor
        categoriesContainer.innerHTML = '';
        
        // Crear tarjetas de categorías
        categorias.forEach(categoria => {
            const card = document.createElement('div');
            card.className = 'category-card';
            
            // URL de la imagen (asociación)
            const imageUrl = `assets/images/categorias/${categoria.slug}.jpg`;
            const defaultImage = 'assets/images/categorias/default.jpg';
            
            card.innerHTML = `
                <a href="/pages/categorias.html?id=${categoria.id}">
                    <img src="${imageUrl}" alt="${categoria.nombre}" onerror="this.src='${defaultImage}'">
                    <div class="category-overlay">
                        <h3 class="category-name">${categoria.nombre}</h3>
                    </div>
                </a>
            `;
            
            categoriesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        const categoriesContainer = document.getElementById('categories-container');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '<p class="error">Error al cargar categorías.</p>';
        }
    }
}

// Función para mostrar notificación
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Agregar al documento
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Esconder después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Función para formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar elementos en la página principal
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadCategories();
        loadFeaturedProducts();
        loadNewProducts();
    }
    
    // Inicializar contador del carrito
    updateCartCount();
});