// URL base de la API
const API_URL = 'http://localhost:3001';

// Función para obtener datos de la API
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en la API:', error);
        throw error;
    }
}

// Obtener todas las categorías
async function getCategorias() {
    return await fetchAPI('/categorias');
}

// Obtener una categoría por ID
async function getCategoriaById(id) {
    return await fetchAPI(`/categorias/${id}`);
}

// Obtener subcategorías por ID de categoría
async function getSubcategoriasByCategoria(categoriaId) {
    return await fetchAPI(`/categorias/${categoriaId}/subcategorias`);
}

// Obtener todos los productos (paginados)
async function getProductos(page = 1, limit = 10) {
    return await fetchAPI(`/productos?page=${page}&limit=${limit}`);
}

// Obtener producto por ID
async function getProductoById(id) {
    return await fetchAPI(`/productos/${id}`);
}

// Obtener productos por categoría
async function getProductosByCategoria(categoriaId, page = 1, limit = 10) {
    return await fetchAPI(`/categorias/${categoriaId}/productos?page=${page}&limit=${limit}`);
}

// Obtener productos por subcategoría
async function getProductosBySubcategoria(subcategoriaId, page = 1, limit = 10) {
    return await fetchAPI(`/subcategorias/${subcategoriaId}/productos?page=${page}&limit=${limit}`);
}

// Obtener productos destacados
async function getProductosDestacados(limit = 8) {
    return await fetchAPI(`/productos/destacados?limit=${limit}`);
}

// Obtener productos nuevos
async function getProductosNuevos(limit = 8) {
    return await fetchAPI(`/productos/nuevos?limit=${limit}`);
}

// Buscar productos
async function buscarProductos(query, page = 1, limit = 10) {
    return await fetchAPI(`/productos/buscar?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
}

// Obtener imágenes de un producto
async function getImagenesProducto(productoId) {
    return await fetchAPI(`/productos/${productoId}/imagenes`);
}

// Obtener especificaciones de un producto
async function getEspecificacionesProducto(productoId) {
    return await fetchAPI(`/productos/${productoId}/especificaciones`);
}

// Obtener marcas
async function getMarcas() {
    return await fetchAPI('/marcas');
}

// Obtener marca por ID
async function getMarcaById(id) {
    return await fetchAPI(`/marcas/${id}`);
}