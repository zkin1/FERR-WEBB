const SOAP_SERVICE_URL = 'http://localhost:3002';  // Para servicios SOAP
const API_URL = 'http://localhost:3004/api';       // Para API REST de carrito 
const TOKEN_KEY = 'auth_token';
const WEBPAY_TOKEN_KEY = 'webpay_transaction_token';

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('userAuthToken');
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return !!getAuthToken();
}

function getWebPayToken() {
    return localStorage.getItem(WEBPAY_TOKEN_KEY);
}


// Estado del checkout
let checkoutState = {
    loading: false,
    error: null,
    carritoId: null,
    orderData: null,
    step: 1 // 1: datos, 2: pago, 3: confirmación
};

// Inicializar checkout
async function initCheckout() {
    console.log('Iniciando checkout...');
    updateCheckoutUI({ loading: true });
    
    try {
        const authToken = getAuthToken();
        console.log('Token de autenticación:', authToken ? 'Presente' : 'No encontrado');

        
        // Redirigir al login si no está autenticado
        if (!isAuthenticated()) {
            console.log('Usuario no autenticado, redirigiendo a login');
            window.location.href = 'login.html?redirect=checkout.html';
            return;
        }
        
        // Obtener carrito activo
        const carrito = await fetchCarritoActivo();
        
        if (!carrito || !carrito.items || carrito.items.length === 0) {
            // Redirigir si el carrito está vacío
            alert('Su carrito está vacío');
            window.location.href = 'index.html';
            return;
        }
        
        // Guardar ID del carrito
        checkoutState.carritoId = carrito.id;
        
        // Renderizar resumen del carrito
        renderCartSummary(carrito);
        
        // Cargar datos del usuario
        await loadUserData();
        
        // Comprobar si venimos de un paso anterior
        const urlParams = new URLSearchParams(window.location.search);
        const step = urlParams.get('step');
        
        if (step === '2') {
            goToPaymentStep();
        } else if (step === '3') {
            // Aquí implementaremos la lógica para el paso 3
            const token = urlParams.get('token');
            if (token) {
                handlePaymentConfirmation(token);
            }
        }
        console.log('Usuario autenticado, continuando...');
    } catch (error) {
        console.error('Error al inicializar checkout:', error);
        updateCheckoutUI({ error: 'Error al cargar los datos del checkout' });
    } finally {
        updateCheckoutUI({ loading: false });
    }
}

// Obtener carrito activo
async function fetchCarritoActivo() {
    try {
        const token = getAuthToken();
        console.log(`Obteniendo carrito activo, token disponible: ${!!token}`);
        
        if (!token) {
            console.log('No hay token de autenticación, usando carrito local');
            return getCartFromLocalStorage();
        }
        
        console.log(`Intentando obtener carrito desde API: ${API_URL}/carrito/activo`);
        
        const response = await fetch(`${API_URL}/carrito/activo`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Error 401: Token no válido, usando carrito local');
                return getCartFromLocalStorage();
            }
            throw new Error('Error al obtener el carrito');
        }
        
        const data = await response.json();
        console.log('Datos del carrito recibidos:', data);
        
        // Formatear respuesta
        const formattedCart = {
            id: data.carrito.id,
            items: data.items.map(item => ({
                id: item.producto_id,
                nombre: item.producto.nombre,
                precio: item.precio_unitario,
                cantidad: item.cantidad,
                imagen: item.producto.imagen_principal || 'assets/images/productos/default.jpg',
                subtotal: item.subtotal
            })),
            total: data.carrito.total
        };
        
        return formattedCart;
    } catch (error) {
        console.error('Error al obtener carrito activo:', error);
        console.log('Usando datos de carrito de localStorage como respaldo');
        return getCartFromLocalStorage();
    }
}

function getCartFromLocalStorage() {
    try {
        // Usar la misma lógica que en carrito.js para obtener la clave
        const storageKey = getUserCartKey();
        console.log('Intentando obtener carrito desde localStorage con clave:', storageKey);
        
        const cartData = localStorage.getItem(storageKey);
        if (!cartData) {
            console.warn('No se encontró carrito en localStorage');
            return { id: 'local-' + Date.now(), items: [], total: 0 };
        }
        
        const cart = JSON.parse(cartData);
        console.log('Carrito obtenido desde localStorage:', cart);
        
        return {
            id: 'local-' + Date.now(),
            items: cart.items || [],
            total: cart.total || 0
        };
    } catch (error) {
        console.error('Error al leer carrito desde localStorage:', error);
        return { id: 'local-' + Date.now(), items: [], total: 0 };
    }
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Aquí se cargarían los datos del usuario desde el servidor
        // Por ahora, solo cargaremos los datos almacenados localmente o
        // mostraremos un formulario vacío
        
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        
        // Llenar el formulario con los datos del usuario
        const form = document.getElementById('checkout-form');
        if (form) {
            for (const key in userData) {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = userData[key];
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// Renderizar resumen del carrito
function renderCartSummary(cart) {
    const summaryContainer = document.getElementById('cart-summary');
    
    if (!summaryContainer) return;
    
    let html = '';
    
    // Listar productos
    html += '<ul class="cart-summary-list">';
    cart.items.forEach(item => {
        html += `
            <li>
                <span class="product-name">${item.nombre}</span>
                <span class="product-qty">x${item.cantidad}</span>
                <span class="product-price">$${formatPrice(item.subtotal)}</span>
            </li>
        `;
    });
    html += '</ul>';
    
    // Mostrar total
    html += `
        <div class="cart-summary-total">
            <span>Total</span>
            <span>$${formatPrice(cart.total)}</span>
        </div>
    `;
    
    summaryContainer.innerHTML = html;
}

// Procesar formulario de checkout (paso 1: datos de envío)
async function processShippingForm(formData) {
    updateCheckoutUI({ loading: true });
    
    try {
        // Guardar datos del formulario para futuras compras
        localStorage.setItem('user_data', JSON.stringify(formData));
        
        // Avanzar al paso de pago
        goToPaymentStep();
    } catch (error) {
        console.error('Error al procesar datos de envío:', error);
        updateCheckoutUI({ error: error.message || 'Error al procesar datos de envío' });
    } finally {
        updateCheckoutUI({ loading: false });
    }
}

// Ir al paso de pago (paso 2)
function goToPaymentStep() {
    console.log('Avanzando al paso de pago...');
    
    // Actualizar el estado
    checkoutState.step = 2;
    
    // Actualizar UI para mostrar paso 2
    updateCheckoutSteps(2);
    
    // Ocultar formulario de envío
    const shippingForm = document.querySelector('.card-body');
    
    if (shippingForm) {
        console.log('Formulario de envío encontrado, actualizando a paso 2');
        
        // Guardar contenido anterior por si necesitamos volver
        const prevContent = shippingForm.innerHTML;
        
        shippingForm.innerHTML = `
            <div class="payment-methods">
                <h4>Seleccione su método de pago</h4>
                
                <div class="payment-options mt-4">
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="payment-method" id="webpay" value="webpay" checked>
                        <label class="form-check-label d-flex align-items-center" for="webpay">
                            <img src="/assets/images/webpay-logo.png" alt="WebPay" height="30" class="me-2" onerror="this.src='/assets/images/logo.png'">
                            WebPay (Tarjeta de crédito/débito)
                        </label>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="payment-method" id="transferencia" value="transferencia">
                        <label class="form-check-label" for="transferencia">
                            <i class="fas fa-university me-2"></i>
                            Transferencia Bancaria
                        </label>
                    </div>
                </div>
                
                <div class="mt-4">
                    <button class="btn btn-primary btn-lg w-100" id="btn-pay">
                        Proceder al Pago <i class="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Añadir evento al botón de pago con pequeño retraso para asegurar DOM actualizado
        setTimeout(() => {
            const payButton = document.getElementById('btn-pay');
            if (payButton) {
                console.log('Botón de pago creado correctamente');
                payButton.addEventListener('click', processPayment);
            } else {
                console.error('Error: No se pudo encontrar el botón de pago después de crearlo');
            }
        }, 50);
    } else {
        console.error('Error: No se encontró el contenedor para el paso de pago');
    }
    
    // Actualizar la URL para mantener el estado
    history.pushState(null, '', 'checkout.html?step=2');
}

// Procesar pago (paso 2)
async function processPayment() {
    updateCheckoutUI({ loading: true });
    
    try {
        // Obtener método de pago seleccionado
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Verificar si estamos manejando un carrito local (inicio con local-)
        const isLocalCart = checkoutState.carritoId.toString().startsWith('local-');
        
        if (isLocalCart) {
            console.log('Procesando carrito local sin llamada a API');
            
            // Crear datos de pedido localmente
            const cart = getCartFromLocalStorage();
            const orderData = {
                id: Date.now(), // ID temporal
                total: cart.total,
                items: cart.items
            };
            
            checkoutState.orderData = orderData;
            
            // Procesar según método de pago seleccionado
            if (paymentMethod === 'webpay') {
                await processWebPayPayment(orderData);
            } else if (paymentMethod === 'transferencia') {
                showTransferInstructions(orderData);
            }
            
            return; // Salir, el resto del código no es necesario para carritos locales
        }
        
        // Si no es carrito local, continuar con el flujo normal
        console.log('Procesando carrito desde API:', checkoutState.carritoId);
        
        // Primero procesamos el pedido en el sistema
        const response = await fetch(`${API_URL}/carrito/${checkoutState.carritoId}/procesar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // Si es un error de autorización, probamos el flujo local
            if (response.status === 401) {
                console.log('Error 401 al procesar carrito, usando flujo local');
                
                // Obtener carrito actual de localStorage
                const cart = getCartFromLocalStorage();
                const orderData = {
                    id: Date.now(), // ID temporal
                    total: cart.total,
                    items: cart.items
                };
                
                checkoutState.orderData = orderData;
                
                // Procesar según método de pago seleccionado
                if (paymentMethod === 'webpay') {
                    await processWebPayPayment(orderData);
                } else if (paymentMethod === 'transferencia') {
                    showTransferInstructions(orderData);
                }
                
                return;
            }
            
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el pedido');
        }
        
        const orderData = await response.json();
        checkoutState.orderData = orderData;
        
        // Verificar que el pedido pueda ser aprobado (usando nuestro servicio SOAP)
        if (window.aprobacionSoap) {
            const verificacion = await window.aprobacionSoap.verificarAprobacion(orderData.id);
            
            if (!verificacion.aprobado) {
                throw new Error(`No se puede procesar el pedido: ${verificacion.mensaje}`);
            }
        }
        
        // Procesar según método de pago seleccionado
        if (paymentMethod === 'webpay') {
            await processWebPayPayment(orderData);
        } else if (paymentMethod === 'transferencia') {
            showTransferInstructions(orderData);
        }
    } catch (error) {
        console.error('Error al procesar el pago:', error);
        updateCheckoutUI({ error: error.message || 'Error al procesar el pago' });
    } finally {
        updateCheckoutUI({ loading: false });
    }
}

// Procesar pago con WebPay
async function processWebPayPayment(orderData) {
    try {
        // Verificar que el servicio esté disponible
        if (!window.webpaySoap) {
            throw new Error('Servicio WebPay no disponible');
        }
        
        console.log('Iniciando pago WebPay para pedido:', orderData);
        
        // Usar una variable para guardar el token y evitar confusiones
        let webpayToken = null;
        
        // Mostrar interfaz de simulación de WebPay
        window.webpaySoap.simularFormularioPago(
            orderData.id, 
            orderData.total, 
            async function(resultado) {
                if (resultado.exito) {
                    // Guardar el token en variable local
                    webpayToken = resultado.token;
                    
                    // Guardar en localStorage con clave específica
                    localStorage.setItem('webpay_transaction_token', webpayToken);
                    
                    console.log('Token WebPay recibido:', webpayToken);
                    
                    // Asegurar que no se guarde en auth_token
                    if (localStorage.getItem('auth_token') === webpayToken) {
                        console.error('¡ALERTA! Token WebPay guardado incorrectamente en auth_token');
                        // Restaurar token anterior si está disponible
                        const userToken = localStorage.getItem('userAuthToken');
                        if (userToken) {
                            localStorage.setItem('auth_token', userToken);
                        }
                    }
                    
                    // Confirmar transacción
                    const confirmacion = await window.webpaySoap.confirmarTransaccion(webpayToken);
                    
                    if (confirmacion.exito) {
                        // Aprobar pedido usando nuestro servicio SOAP
                        if (window.aprobacionSoap) {
                            const aprobacion = await window.aprobacionSoap.aprobarPedido(orderData.id);
                            
                            if (aprobacion.exito) {
                                // MODIFICADO: Limpiar token de WebPay al finalizar transacción
                                localStorage.removeItem('webpay_transaction_token');
                                
                                // Ir al paso de confirmación
                                goToConfirmationStep({
                                    pedidoId: orderData.id,
                                    aprobacionId: aprobacion.numeroAprobacion,
                                    estado: 'aprobado'
                                });
                            } else {
                                throw new Error(`Error al aprobar pedido: ${aprobacion.mensaje}`);
                            }
                        } else {
                            // Si no está disponible el servicio de aprobación, simular éxito
                            
                            // MODIFICADO: Limpiar token de WebPay al finalizar transacción
                            localStorage.removeItem('webpay_transaction_token');
                            
                            goToConfirmationStep({
                                pedidoId: orderData.id,
                                aprobacionId: 'SIM-' + Date.now(),
                                estado: 'aprobado'
                            });
                        }
                    } else {
                        throw new Error(`Error al confirmar transacción: ${confirmacion.mensaje}`);
                    }
                } else {
                    throw new Error('Pago rechazado o cancelado por el usuario');
                }
            }
        );
    } catch (error) {
        // Limpiar token de WebPay si hubo error
        localStorage.removeItem('webpay_transaction_token');
        throw error;
    }
}

// Mostrar instrucciones de transferencia
function showTransferInstructions(orderData) {
    // Crear modal con instrucciones de transferencia
    const modal = document.createElement('div');
    modal.className = 'transferencia-modal';
    modal.innerHTML = `
        <div class="transferencia-contenedor">
            <h2>Instrucciones de Transferencia</h2>
            <div class="transferencia-detalles">
                <p><strong>Pedido:</strong> #${orderData.id}</p>
                <p><strong>Monto:</strong> $${formatPrice(orderData.total)}</p>
                <p><strong>Banco:</strong> Banco FERREMAS</p>
                <p><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
                <p><strong>Número de Cuenta:</strong> 1234567890</p>
                <p><strong>RUT:</strong> 76.123.456-7</p>
                <p><strong>Nombre:</strong> FERREMAS S.A.</p>
                <p><strong>Email para comprobante:</strong> pagos@ferremas.cl</p>
                <p class="transferencia-importante">IMPORTANTE: Indica el número de pedido #${orderData.id} en el comentario de la transferencia</p>
            </div>
            <div class="transferencia-acciones">
                <button id="btn-close-transfer" class="btn btn-primary">Entendido</button>
            </div>
        </div>
    `;
    
    // Agregar estilos para el modal
    const style = document.createElement('style');
    style.textContent = `
        .transferencia-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .transferencia-contenedor {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
        }
        .transferencia-detalles {
            margin: 20px 0;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .transferencia-importante {
            color: #dc3545;
            font-weight: bold;
            margin-top: 15px;
            border-top: 1px solid #dc3545;
            padding-top: 15px;
        }
        .transferencia-acciones {
            display: flex;
            justify-content: center;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Agregar evento al botón de cierre
    document.getElementById('btn-close-transfer').addEventListener('click', function() {
        document.body.removeChild(modal);
        
        // Ir al paso de confirmación (pendiente)
        goToConfirmationStep({
            pedidoId: orderData.id,
            estado: 'pendiente'
        });
    });
}

// Ir al paso de confirmación (paso 3)
function goToConfirmationStep(data) {
    // Actualizar estado
    checkoutState.step = 3;
    
    // Actualizar UI para mostrar paso 3
    updateCheckoutSteps(3);
    
    // Mostrar confirmación
    const confirmacionContainer = document.querySelector('.card-body');
    if (confirmacionContainer) {
        if (data.estado === 'aprobado') {
            confirmacionContainer.innerHTML = `
                <div class="confirmation-success text-center">
                    <div class="mb-4">
                        <i class="fas fa-check-circle text-success" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="mb-3">¡Su pedido ha sido confirmado!</h3>
                    <p class="mb-4">Hemos recibido su pago y su pedido está siendo procesado.</p>
                    
                    <div class="order-details p-3 mb-4 bg-light rounded">
                        <p><strong>Número de pedido:</strong> #${data.pedidoId}</p>
                        <p><strong>Número de aprobación:</strong> ${data.aprobacionId}</p>
                    </div>
                    
                    <p>Recibirá un correo con los detalles de su compra.</p>
                    
                    <div class="mt-4">
                        <a href="/index.html" class="btn btn-primary">
                            <i class="fas fa-home me-2"></i> Volver a la Tienda
                        </a>
                    </div>
                </div>
            `;
        } else {
            confirmacionContainer.innerHTML = `
                <div class="confirmation-pending text-center">
                    <div class="mb-4">
                        <i class="fas fa-clock text-warning" style="font-size: 5rem;"></i>
                    </div>
                    <h3 class="mb-3">Su pedido está pendiente de pago</h3>
                    <p class="mb-4">Hemos registrado su pedido pero está a la espera de la confirmación de pago.</p>
                    
                    <div class="order-details p-3 mb-4 bg-light rounded">
                        <p><strong>Número de pedido:</strong> #${data.pedidoId}</p>
                    </div>
                    
                    <p>Una vez que recibamos su transferencia, procesaremos su pedido.</p>
                    <p>Recibirá un correo con los detalles para seguimiento.</p>
                    
                    <div class="mt-4">
                        <a href="/index.html" class="btn btn-primary">
                            <i class="fas fa-home me-2"></i> Volver a la Tienda
                        </a>
                    </div>
                </div>
            `;
        }
    }
    
    // Actualizar la URL para mantener el estado
    history.pushState(null, '', 'checkout.html?step=3');
}

// Actualizar pasos del checkout en la UI
function updateCheckoutSteps(currentStep) {
    const steps = document.querySelectorAll('.checkout-step');
    
    if (steps.length === 3) {
        // Limpiar clases activas
        steps.forEach(step => step.classList.remove('active'));
        
        // Activar pasos completados y actual
        for (let i = 0; i < currentStep; i++) {
            steps[i].classList.add('active');
        }
    }
}

// Formatear precios
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

// Actualizar UI de checkout
function updateCheckoutUI({ loading, error }) {
    if (loading !== undefined) {
        checkoutState.loading = loading;
        
        // Mostrar/ocultar loader
        const loaders = document.querySelectorAll('.checkout-loader');
        loaders.forEach(loader => {
            loader.style.display = loading ? 'block' : 'none';
        });
        
        // Desactivar/activar botones durante carga
        const buttons = document.querySelectorAll('.checkout-btn');
        buttons.forEach(button => {
            button.disabled = loading;
        });
    }
    
    if (error !== undefined) {
        checkoutState.error = error;
        
        // Mostrar mensaje de error si existe
        if (error) {
            const errorContainer = document.getElementById('checkout-error');
            if (errorContainer) {
                errorContainer.textContent = error;
                errorContainer.style.display = 'block';
            } else {
                // Si no hay contenedor de error, mostrar alert
                alert(`Error: ${error}`);
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar checkout si estamos en la página de checkout
    if (window.location.pathname.includes('checkout.html')) {
        // Añadir loader y contenedor de errores si no existen
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            if (!document.querySelector('.checkout-loader')) {
                checkoutContainer.insertAdjacentHTML('afterbegin', '<div class="checkout-loader" style="display:none;"><p>Procesando...</p></div>');
            }
            
            if (!document.getElementById('checkout-error')) {
                checkoutContainer.insertAdjacentHTML('afterbegin', '<div id="checkout-error" style="display:none;" class="alert alert-danger"></div>');
            }
        }
        
        // Inicializar checkout
        initCheckout();
        
        // Añadir evento al formulario de checkout
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Recoger datos del formulario
                const formData = {};
                const formElements = this.elements;
                
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.value) {
                        formData[element.name] = element.value;
                    }
                }
                
                // Procesar el formulario de envío (paso 1)
                processShippingForm(formData);
            });
        }
    }
});

function processWebPayPayment() {
    try {
        console.log('Procesando pago con WebPay...');
        
        // Obtener datos del carrito
        const cart = getCartFromStorage();
        
        if (!cart || !cart.items || cart.items.length === 0) {
            showToast('No hay productos en el carrito', 'warning');
            return;
        }
        
        // Mostrar indicador de carga
        showLoader('Procesando pago');
        
        // Verificar disponibilidad del servicio WebPay
        if (!window.webpaySoap || typeof window.webpaySoap.simularFormularioPago !== 'function') {
            console.error('Error: Servicio WebPay no disponible');
            showToast('Servicio de pago no disponible en este momento', 'error');
            hideLoader();
            return;
        }
        
        // Crear ID de pedido simulado (en producción se obtendría de la API)
        const pedidoId = Date.now();
        
        // Simular pago con WebPay
        window.webpaySoap.simularFormularioPago(
            pedidoId,
            cart.total,
            async function(resultado) {
                hideLoader();
                
                if (!resultado.exito) {
                    showToast('Pago cancelado o rechazado', 'warning');
                    return;
                }
                
                // Mostrar indicador para confirmación
                showLoader('Confirmando transacción');
                
                try {
                    // Confirmar transacción
                    const confirmacion = await window.webpaySoap.confirmarTransaccion(resultado.token);
                    
                    if (!confirmacion.exito) {
                        throw new Error(confirmacion.mensaje || 'Error al confirmar la transacción');
                    }
                    
                    // Aprobar pedido
                    let aprobacion;
                    if (window.aprobacionSoap && typeof window.aprobacionSoap.aprobarPedido === 'function') {
                        aprobacion = await window.aprobacionSoap.aprobarPedido(pedidoId);
                        
                        if (!aprobacion.exito) {
                            throw new Error(aprobacion.mensaje || 'Error al aprobar el pedido');
                        }
                    } else {
                        // Simulación si no existe el servicio
                        aprobacion = {
                            exito: true,
                            numeroAprobacion: 'SIM-' + Date.now()
                        };
                    }
                    
                    // Vaciar carrito
                    if (typeof clearCart === 'function') {
                        clearCart();
                    } else {
                        // Implementación alternativa
                        const emptyCart = { items: [], total: 0 };
                        localStorage.setItem(getUserCartKey(), JSON.stringify(emptyCart));
                    }
                    
                    // Mostrar mensaje de éxito
                    showToast('Pago procesado con éxito', 'success');
                    
                    // Redirigir a página de confirmación
                    window.location.href = `/confirmacion.html?pedido=${pedidoId}&estado=aprobado&aprobacion=${aprobacion.numeroAprobacion}`;
                    
                } catch (error) {
                    console.error('Error en proceso de confirmación:', error);
                    showToast(error.message || 'Error al procesar el pago', 'error');
                    hideLoader();
                }
            }
        );
        
    } catch (error) {
        console.error('Error al procesar pago WebPay:', error);
        showToast(error.message || 'Error al procesar el pago', 'error');
        hideLoader();
    }
}

function processTransferPayment() {
    try {
        console.log('Procesando pago con transferencia...');
        
        // Obtener datos del carrito
        const cart = getCartFromStorage();
        
        if (!cart || !cart.items || cart.items.length === 0) {
            showToast('No hay productos en el carrito', 'warning');
            return;
        }
        
        // Crear ID de pedido simulado (en producción se obtendría de la API)
        const pedidoId = Date.now();
        
        // Crear modal de instrucciones de transferencia
        const modalHtml = `
            <div class="modal fade" id="transferModal" tabindex="-1" aria-labelledby="transferModalTitle" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title" id="transferModalTitle">Instrucciones de Transferencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>Importante:</strong> Guarda esta información para completar tu pago.
                            </div>
                            <div class="transfer-details">
                                <p><strong>Número de Pedido:</strong> #${pedidoId}</p>
                                <p><strong>Monto a Transferir:</strong> $${formatPrice(cart.total)}</p>
                                <hr>
                                <p><strong>Banco:</strong> Banco FERREMAS</p>
                                <p><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
                                <p><strong>Número de Cuenta:</strong> 1234567890</p>
                                <p><strong>RUT:</strong> 76.123.456-7</p>
                                <p><strong>Nombre:</strong> FERREMAS S.A.</p>
                                <p><strong>Email para comprobante:</strong> pagos@ferremas.cl</p>
                                <p class="text-danger fw-bold mt-3">IMPORTANTE: Indica el número de pedido #${pedidoId} en el comentario de la transferencia</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" id="btn-confirm-transfer">Confirmar Pedido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Mostrar modal
        const transferModal = new bootstrap.Modal(document.getElementById('transferModal'));
        transferModal.show();
        
        // Configurar botón de confirmación
        document.getElementById('btn-confirm-transfer').addEventListener('click', function() {
            // Ocultar modal
            transferModal.hide();
            
            // Limpiar carrito
            if (typeof clearCart === 'function') {
                clearCart();
            } else {
                // Implementación alternativa
                const emptyCart = { items: [], total: 0 };
                localStorage.setItem(getUserCartKey(), JSON.stringify(emptyCart));
            }
            
            // Mostrar mensaje de éxito
            showToast('Pedido registrado correctamente', 'success');
            
            // Redirigir a página de confirmación
            setTimeout(() => {
                window.location.href = `/confirmacion.html?pedido=${pedidoId}&estado=pendiente`;
            }, 1000);
        });
        
        // Limpiar modal cuando se cierre
        document.getElementById('transferModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalContainer);
        });
        
    } catch (error) {
        console.error('Error al procesar pago por transferencia:', error);
        showToast(error.message || 'Error al procesar el pago', 'error');
    }
}

function showLoader(message) {
    // Verificar si ya existe un loader
    let loader = document.querySelector('.checkout-loader');
    
    if (!loader) {
        // Crear loader
        loader = document.createElement('div');
        loader.className = 'checkout-loader';
        loader.innerHTML = `
            <div class="loader-backdrop"></div>
            <div class="loader-content">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">${message || 'Procesando...'}</p>
            </div>
        `;
        
        // Estilos para el loader
        const style = document.createElement('style');
        style.textContent = `
            .checkout-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .loader-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            .loader-content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                position: relative;
                box-shadow: 0 0 20px rgba(0,0,0,0.2);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loader);
    } else {
        // Actualizar mensaje si ya existe
        const messageEl = loader.querySelector('p');
        if (messageEl) {
            messageEl.textContent = message || 'Procesando...';
        }
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.querySelector('.checkout-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function getUserCartKey() {
    try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = userData.id || userData.userId;
        return userId ? `user_cart_${userId}` : 'carrito';
    } catch (error) {
        console.error('Error al obtener clave de carrito:', error);
        return 'carrito';
    }
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
        console.error('Error al obtener carrito:', error);
        return { items: [], total: 0 };
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando checkout...');
    
    // === NUEVO: Verificar que las funciones del carrito estén disponibles ===
    if (typeof window.updateCartCount === 'function') {
        // Actualizar contador del carrito
        window.updateCartCount();
    }
    
    // === NUEVO: Añadir comprobación del token de autenticación ===
    const token = localStorage.getItem('auth_token') || localStorage.getItem('userAuthToken');
    console.log('Token de autenticación disponible:', !!token);
    
    // === NUEVO: Actualizar el getAuthToken para usar cualquiera de los dos tokens ===
    window.getAuthToken = function() {
        return localStorage.getItem('auth_token') || localStorage.getItem('userAuthToken');
    };
    
    // Inicializar checkout
    if (window.location.pathname.includes('checkout.html')) {
        console.log('Estamos en la página de checkout');
        
        // Verificar si hay elementos esenciales
        const checkoutContainer = document.querySelector('.checkout-container');
        console.log('Container de checkout encontrado:', !!checkoutContainer);
        
        // Añadir loader y contenedor de errores si no existen
        if (checkoutContainer) {
            if (!document.querySelector('.checkout-loader')) {
                console.log('Añadiendo loader al DOM');
                checkoutContainer.insertAdjacentHTML('afterbegin', '<div class="checkout-loader" style="display:none;"><p>Procesando...</p></div>');
            }
            
            if (!document.getElementById('checkout-error')) {
                console.log('Añadiendo contenedor de errores al DOM');
                checkoutContainer.insertAdjacentHTML('afterbegin', '<div id="checkout-error" style="display:none;" class="alert alert-danger"></div>');
            }
        } else {
            console.error('Container de checkout no encontrado - posible problema con HTML');
        }
        
        // Inicializar checkout con pequeño retraso para asegurarse de que todo está cargado
        setTimeout(() => {
            initCheckout();
            
            // Revisar botones después de inicialización
            const checkoutBtns = document.querySelectorAll('.checkout-btn, #btn-pay');
            console.log(`Botones de checkout encontrados: ${checkoutBtns.length}`);
            
            // Añadir listeners a los botones
            checkoutBtns.forEach(btn => {
                console.log('Configurando botón:', btn.id || 'sin id');
                btn.addEventListener('click', function(e) {
                    console.log('Botón de checkout clickeado');
                    e.preventDefault();
                    
                    if (btn.id === 'btn-pay') {
                        console.log('Procesando pago...');
                        processPayment();
                    } else {
                        console.log('Procesando formulario...');
                        const form = document.getElementById('checkout-form');
                        if (form) {
                            const formData = {};
                            for (let i = 0; i < form.elements.length; i++) {
                                const element = form.elements[i];
                                if (element.name && element.value) {
                                    formData[element.name] = element.value;
                                }
                            }
                            processShippingForm(formData);
                        }
                    }
                });
            });
        }, 100);
    }
});

// Al inicio del checkout.js
(function() {
    console.log('Verificando disponibilidad de servicios SOAP...');
    
    // Verificar servicio WebPay
    if (!window.webpaySoap) {
        console.warn('Servicio WebPay no disponible, creando simulación...');
        window.webpaySoap = {
            simularFormularioPago: function(pedidoId, monto, callback) {
                console.warn('Usando simulación de WebPay');
                setTimeout(() => {
                    callback({exito: true, token: 'SIM-' + Date.now()});
                }, 1000);
            },
            confirmarTransaccion: async function() {
                return {exito: true, mensaje: 'Transacción simulada'};
            }
        };
    }
    
    // Verificar servicio de aprobación
    if (!window.aprobacionSoap) {
        console.warn('Servicio Aprobación no disponible, creando simulación...');
        window.aprobacionSoap = {
            verificarAprobacion: async function() {
                return {aprobado: true, mensaje: 'Aprobación simulada'};
            },
            aprobarPedido: async function(pedidoId) {
                return {exito: true, numeroAprobacion: 'SIM-' + Date.now()};
            }
        };
    }
        if (window.location.search.includes('logout=')) {
        console.log('Detectado parámetro de logout, limpiando URL...');
        
        // Limpiar la URL para evitar bucles de redirección
        const cleanUrl = window.location.pathname;
        history.replaceState(null, document.title, cleanUrl);
        
        console.log('URL limpiada:', window.location.href);
    }
    console.log('Servicios SOAP verificados y listos para usar');
})();