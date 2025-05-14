// Función para cargar productos destacados en la página de inicio
async function loadFeaturedProducts() {
    try {
        const featuredContainer = document.getElementById('featured-products');
        if (!featuredContainer) return;
        
        // Limpiar el contenedor
        featuredContainer.innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Obtener productos destacados
        const productos = await getProductosDestacados(8);
        
        // Verificar si hay productos
        if (!productos || productos.length === 0) {
            featuredContainer.innerHTML = '<p class="no-products">No hay productos destacados disponibles</p>';
            return;
        }
        
        // Limpiar el contenedor
        featuredContainer.innerHTML = '';
        
        // Crear tarjetas de productos
        productos.forEach(producto => {
            const card = createProductCard(producto);
            featuredContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) {
            featuredContainer.innerHTML = '<p class="error">Error al cargar productos. Por favor, intente nuevamente.</p>';
        }
    }
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
    
    // Obtener URL de la imagen (aquí asociamos el código del producto con la imagen)
    const imageUrl = `assets/images/productos/${producto.codigo}.jpg`;
    const defaultImage = 'assets/images/productos/default.jpg';
    
    // HTML interno del card
    card.innerHTML = `
        <div class="product-image">
            <a href="producto.html?id=${producto.id}">
                <img src="${imageUrl}" alt="${producto.nombre}" onerror="this.src='${defaultImage}'">
            </a>
        </div>
        <div class="product-details">
            <h3 class="product-title">
                <a href="producto.html?id=${producto.id}">${producto.nombre}</a>
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
            if (producto.stock <= 0) return;
            
            const cantidad = parseInt(quantityInput.value);
            if (cantidad < 1 || cantidad > producto.stock) return;
            
            const productData = {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio_oferta || producto.precio,
                imagen: mainImageUrl,
                cantidad: cantidad
            };
            
            addToCart(productData);
            showNotification('Producto agregado al carrito');
        });
        
        // Cargar productos relacionados
        loadRelatedProducts(producto.categoria_id, producto.id);
        
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
                <a href="categorias.html?id=${categoria.id}">
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