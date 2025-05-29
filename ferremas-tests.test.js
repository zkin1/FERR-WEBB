// ferremas-complete-tests.test.js
// 30 Tests unitarios completos para Ferremas E-commerce

// Jest globals están disponibles automáticamente
// No es necesario importar jest, describe, test, expect, etc.

// ==================== FUNCIONES DE LA APLICACIÓN ====================

// 1. Funciones de Autenticación
function isAuthenticated() {
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return token && Object.keys(userData).length > 0;
}

function getCurrentUserId() {
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return userData.id || userData.userId || null;
    } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('auth_token') || localStorage.getItem('userAuthToken');
}

function logout() {
    localStorage.removeItem('userAuthToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    document.cookie = 'authToken=; path=/; max-age=0';
    return true;
}

function verificarAccesoAdmin() {
    const token = localStorage.getItem('userAuthToken') || localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!token) return false;
    if (!userData || userData.rol !== 'admin') return false;
    
    return true;
}

// 2. Funciones de Carrito
function getUserCartKey() {
    const userId = getCurrentUserId();
    return userId ? `user_cart_${userId}` : 'carrito';
}

function getCartFromStorage() {
    try {
        const storageKey = getUserCartKey();
        const cartData = localStorage.getItem(storageKey);
        if (!cartData) {
            return { items: [], total: 0 };
        }
        return JSON.parse(cartData);
    } catch (error) {
        console.error('Error al leer carrito:', error);
        return { items: [], total: 0 };
    }
}

function addToCart(product) {
    if (!isAuthenticated()) {
        return { error: 'Usuario no autenticado' };
    }
    
    if (!product || !product.id) {
        return { error: 'Producto inválido' };
    }
    
    let cart = getCartFromStorage();
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].cantidad += product.cantidad || 1;
        cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].precio * cart.items[existingItemIndex].cantidad;
    } else {
        product.cantidad = product.cantidad || 1;
        cart.items.push({
            ...product,
            subtotal: product.precio * product.cantidad
        });
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad), 0);
    
    const storageKey = getUserCartKey();
    localStorage.setItem(storageKey, JSON.stringify(cart));
    return cart;
}

function removeFromCart(productId) {
    if (!isAuthenticated()) {
        return { error: 'Usuario no autenticado' };
    }
    
    let cart = getCartFromStorage();
    const originalLength = cart.items.length;
    
    cart.items = cart.items.filter(item => item.id !== productId);
    
    if (cart.items.length === originalLength) {
        return { error: 'Producto no encontrado' };
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad), 0);
    
    const storageKey = getUserCartKey();
    localStorage.setItem(storageKey, JSON.stringify(cart));
    return cart;
}

function clearCart() {
    if (!isAuthenticated()) {
        return { error: 'Usuario no autenticado' };
    }
    
    const emptyCart = { items: [], total: 0 };
    const storageKey = getUserCartKey();
    localStorage.setItem(storageKey, JSON.stringify(emptyCart));
    return emptyCart;
}

// 3. Funciones de API
async function fetchAPI(endpoint, options = {}) {
    try {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : '/api';
        const url = `${API_URL}/${cleanEndpoint}`;
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en la API:', error);
        
        if (endpoint.includes('categorias')) {
            return [];
        } else if (endpoint.includes('productos')) {
            return { productos: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
        }
        return {};
    }
}

async function getProductoById(id) {
    if (!id || id <= 0) {
        throw new Error('ID de producto inválido');
    }
    return await fetchAPI(`productos/${id}`);
}

async function getCategorias() {
    const categorias = await fetchAPI('categorias');
    if (!Array.isArray(categorias)) {
        return [];
    }
    return categorias;
}

// 4. Funciones de Utilidades
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) {
        return '0';
    }
    return new Intl.NumberFormat('es-CL').format(price);
}

function formatRut(rut) {
    if (!rut || rut.length === 0) return '';
    
    const cleanRut = rut.replace(/\./g, '').replace('-', '');
    const dv = cleanRut.slice(-1);
    const rutBody = cleanRut.slice(0, -1);
    
    let formattedRut = '';
    for (let i = rutBody.length - 1, j = 0; i >= 0; i--, j++) {
        formattedRut = rutBody.charAt(i) + formattedRut;
        if ((j + 1) % 3 === 0 && i !== 0) {
            formattedRut = '.' + formattedRut;
        }
    }
    
    return `${formattedRut}-${dv}`;
}

function validateRut(rut) {
    if (!rut || rut.length < 3) return false;
    
    const cleanRut = rut.replace(/\./g, '').replace('-', '');
    const dv = cleanRut.slice(-1).toUpperCase();
    const rutBody = parseInt(cleanRut.slice(0, -1), 10);
    
    if (isNaN(rutBody)) return false;
    
    let sum = 0;
    let multiplier = 2;
    
    let rutString = rutBody.toString();
    for (let i = rutString.length - 1; i >= 0; i--) {
        sum += parseInt(rutString.charAt(i), 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDV = 11 - (sum % 11);
    
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

function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 5. Funciones de UI
function showToast(message, type = 'success') {
    if (!message) return false;
    
    const toastContainer = document.getElementById('toast-container') || document.createElement('div');
    const toast = document.createElement('div');
    toast.className = `toast bg-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    return true;
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return false;
    
    if (input.type === 'password') {
        input.type = 'text';
        return 'text';
    } else {
        input.type = 'password';
        return 'password';
    }
}

// 6. Funciones de Configuración
function getServerBaseUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    return `${protocol}//${hostname}${port}`;
}

function getSoapServiceUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3002';
    
    return `${protocol}//${hostname}:${port}`;
}

// 7. Funciones de Checkout
function processWebPayPayment(orderData) {
    if (!orderData || !orderData.id || !orderData.total) {
        return { error: 'Datos de pedido inválidos' };
    }
    
    if (orderData.total <= 0) {
        return { error: 'El monto debe ser mayor a 0' };
    }
    
    return {
        success: true,
        token: `WP-${Date.now()}-${orderData.id}`,
        mensaje: 'Pago iniciado correctamente'
    };
}

function calculateShipping(items, address) {
    if (!items || items.length === 0) {
        return { error: 'No hay productos para envío' };
    }
    
    if (!address || !address.ciudad) {
        return { error: 'Dirección incompleta' };
    }
    
    const baseShipping = 5000;
    const weightFactor = items.length * 500;
    
    return {
        cost: baseShipping + weightFactor,
        estimatedDays: address.ciudad.toLowerCase() === 'santiago' ? 1 : 3
    };
}

// ==================== TESTS UNITARIOS ====================

describe('🏪 FERREMAS E-COMMERCE - 30 TESTS COMPLETOS', () => {

    beforeEach(() => {
        // Reset mocks antes de cada test
        localStorage.clear();
        jest.clearAllMocks();
        
        // Setup básico para window
        global.window = {
            ...global.window,
            APP_CONFIG: { API_URL: 'http://localhost:3002/api' }
        };
    });

    // ==================== AUTENTICACIÓN (Tests 1-8) ====================
    
    describe('🔐 AUTENTICACIÓN', () => {
        
        test('1. isAuthenticated - usuario autenticado correctamente', () => {
            localStorage.setItem('userAuthToken', 'valid-token');
            localStorage.setItem('currentUser', '{"id": 123, "nombre": "Juan"}');
            
            expect(isAuthenticated()).toBe(true);
        });

        test('2. isAuthenticated - usuario no autenticado', () => {
            expect(isAuthenticated()).toBe(false);
        });

        test('3. getCurrentUserId - obtiene ID correctamente', () => {
            localStorage.setItem('currentUser', '{"id": 456, "nombre": "María"}');
            
            expect(getCurrentUserId()).toBe(456);
        });

        test('4. getCurrentUserId - maneja JSON inválido', () => {
            localStorage.setItem('currentUser', 'invalid-json');
            
            expect(getCurrentUserId()).toBe(null);
        });

        test('5. getAuthToken - obtiene token principal', () => {
            localStorage.setItem('auth_token', 'primary-token');
            
            expect(getAuthToken()).toBe('primary-token');
        });

        test('6. getAuthToken - fallback a userAuthToken', () => {
            localStorage.setItem('userAuthToken', 'fallback-token');
            
            expect(getAuthToken()).toBe('fallback-token');
        });

        test('7. logout - limpia datos correctamente', () => {
            localStorage.setItem('userAuthToken', 'token');
            localStorage.setItem('currentUser', '{"id": 123}');
            
            const result = logout();
            
            expect(result).toBe(true);
            expect(localStorage.getItem('userAuthToken')).toBe(null);
            expect(localStorage.getItem('currentUser')).toBe(null);
        });

        test('8. verificarAccesoAdmin - permite acceso a admin', () => {
            localStorage.setItem('userAuthToken', 'admin-token');
            localStorage.setItem('currentUser', '{"id": 1, "rol": "admin"}');
            
            expect(verificarAccesoAdmin()).toBe(true);
        });
    });

    // ==================== CARRITO DE COMPRAS (Tests 9-16) ====================
    
    describe('🛒 CARRITO DE COMPRAS', () => {
        
        beforeEach(() => {
            localStorage.setItem('userAuthToken', 'valid-token');
            localStorage.setItem('currentUser', '{"id": 123}');
        });

        test('9. getUserCartKey - genera clave específica del usuario', () => {
            expect(getUserCartKey()).toBe('user_cart_123');
        });

        test('10. getUserCartKey - usa clave genérica sin usuario', () => {
            localStorage.setItem('currentUser', '{}');
            
            expect(getUserCartKey()).toBe('carrito');
        });

        test('11. getCartFromStorage - obtiene carrito existente', () => {
            const cartData = { items: [{ id: 1, nombre: 'Producto' }], total: 100 };
            localStorage.setItem('user_cart_123', JSON.stringify(cartData));
            
            const result = getCartFromStorage();
            
            expect(result).toEqual(cartData);
        });

        test('12. getCartFromStorage - maneja carrito vacío', () => {
            const result = getCartFromStorage();
            
            expect(result).toEqual({ items: [], total: 0 });
        });

        test('13. addToCart - agrega producto correctamente', () => {
            const product = { id: 1, nombre: 'Martillo', precio: 15000, cantidad: 2 };
            
            const result = addToCart(product);
            
            expect(result.items).toHaveLength(1);
            expect(result.items[0].subtotal).toBe(30000);
            expect(result.total).toBe(30000);
        });

        test('14. addToCart - rechaza usuario no autenticado', () => {
            localStorage.clear();
            
            const result = addToCart({ id: 1, precio: 100 });
            
            expect(result).toEqual({ error: 'Usuario no autenticado' });
        });

        test('15. removeFromCart - elimina producto correctamente', () => {
            const cartData = {
                items: [{ id: 1, nombre: 'Producto', precio: 100, cantidad: 1, subtotal: 100 }],
                total: 100
            };
            localStorage.setItem('user_cart_123', JSON.stringify(cartData));
            
            const result = removeFromCart(1);
            
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        test('16. clearCart - vacía carrito completamente', () => {
            const cartData = { items: [{ id: 1 }], total: 100 };
            localStorage.setItem('user_cart_123', JSON.stringify(cartData));
            
            const result = clearCart();
            
            expect(result).toEqual({ items: [], total: 0 });
        });
    });

    // ==================== API Y SERVICIOS (Tests 17-22) ====================
    
    describe('🌐 API Y SERVICIOS', () => {
        
        beforeEach(() => {
            global.fetch = jest.fn();
        });

        test('17. fetchAPI - respuesta exitosa', async () => {
            const mockData = { data: 'success' };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await fetchAPI('test-endpoint');
            
            expect(result).toEqual(mockData);
        });

        test('18. fetchAPI - maneja error de red', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await fetchAPI('categorias');
            
            expect(result).toEqual([]);
        });

        test('19. getProductoById - obtiene producto válido', async () => {
            const mockProduct = { id: 1, nombre: 'Producto' };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockProduct
            });

            const result = await getProductoById(1);
            
            expect(result).toEqual(mockProduct);
        });

        test('20. getProductoById - rechaza ID inválido', async () => {
            await expect(getProductoById(-1)).rejects.toThrow('ID de producto inválido');
            await expect(getProductoById(0)).rejects.toThrow('ID de producto inválido');
        });

        test('21. getCategorias - obtiene lista de categorías', async () => {
            const mockCategorias = [{ id: 1, nombre: 'Herramientas' }];
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategorias
            });

            const result = await getCategorias();
            
            expect(result).toEqual(mockCategorias);
        });

        test('22. getCategorias - maneja respuesta no array', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ error: 'not array' })
            });

            const result = await getCategorias();
            
            expect(result).toEqual([]);
        });
    });

    // ==================== UTILIDADES (Tests 23-27) ====================
    
    describe('🔧 UTILIDADES Y VALIDACIONES', () => {
        
        test('23. formatPrice - formatea precios correctamente', () => {
            expect(formatPrice(1000)).toBe('1.000');
            expect(formatPrice(1500000)).toBe('1.500.000');
        });

        test('24. formatPrice - maneja valores inválidos', () => {
            expect(formatPrice('invalid')).toBe('0');
            expect(formatPrice(null)).toBe('0');
            expect(formatPrice(NaN)).toBe('0');
        });

        test('25. validateRut - valida RUTs correctos', () => {
            expect(validateRut('12.345.678-5')).toBe(true);
            expect(validateRut('11.111.111-1')).toBe(true);
        });

        test('26. validateRut - rechaza RUTs incorrectos', () => {
            expect(validateRut('12.345.678-9')).toBe(false);
            expect(validateRut('invalid-rut')).toBe(false);
            expect(validateRut('')).toBe(false);
        });

        test('27. validateEmail - valida emails correctamente', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });
    });

    // ==================== INTERFAZ DE USUARIO (Tests 28-29) ====================
    
    describe('🎨 INTERFAZ DE USUARIO', () => {
        
        test('28. showToast - crea notificación correctamente', () => {
            const result = showToast('Mensaje de prueba', 'success');
            
            expect(result).toBe(true);
        });

        test('29. togglePassword - cambia tipo de input', () => {
            const mockInput = { type: 'password' };
            document.getElementById = jest.fn().mockReturnValue(mockInput);

            const result = togglePassword('password-input');
            
            expect(result).toBe('text');
            expect(mockInput.type).toBe('text');
        });
    });

    // ==================== CHECKOUT Y PAGOS (Test 30) ====================
    
    describe('💳 CHECKOUT Y PAGOS', () => {
        
        test('30. processWebPayPayment - procesa pago correctamente', () => {
            const orderData = { id: 123, total: 50000 };
            
            const result = processWebPayPayment(orderData);
            
            expect(result.success).toBe(true);
            expect(result.token).toContain('WP-');
            expect(result.token).toContain('123');
        });
    });

});

// ==================== TESTS DE INTEGRACIÓN ====================

describe('🔗 TESTS DE INTEGRACIÓN', () => {
    
    test('Flujo completo: Login → Agregar al carrito → Checkout', () => {
        // 1. Simular login
        localStorage.setItem('userAuthToken', 'valid-token');
        localStorage.setItem('currentUser', '{"id": 123, "nombre": "Juan"}');
        
        expect(isAuthenticated()).toBe(true);
        
        // 2. Agregar producto al carrito
        const product = { id: 1, nombre: 'Martillo', precio: 15000, cantidad: 1 };
        const cartResult = addToCart(product);
        
        expect(cartResult.items).toHaveLength(1);
        expect(cartResult.total).toBe(15000);
        
        // 3. Simular checkout
        const orderData = { id: Date.now(), total: cartResult.total };
        const paymentResult = processWebPayPayment(orderData);
        
        expect(paymentResult.success).toBe(true);
    });
    
});

console.log('✅ 30 Tests unitarios listos para ejecutar con: npm test');