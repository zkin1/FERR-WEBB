        // Script para manejar la página de confirmación
        document.addEventListener('DOMContentLoaded', function() {
            // Obtener parámetros de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const pedidoId = urlParams.get('pedido');
            const estado = urlParams.get('estado') || 'pendiente';
            const aprobacionId = urlParams.get('aprobacion');
            const token = urlParams.get('token');
            
            const confirmationContent = document.getElementById('confirmation-content');
            
            // Mostrar indicador de carga
            document.querySelector('.confirmation-loader').style.display = 'block';
            
            // Función para mostrar mensaje de error
            function showError(message) {
                const errorContainer = document.getElementById('confirmation-error');
                errorContainer.textContent = message;
                errorContainer.style.display = 'block';
                document.querySelector('.confirmation-loader').style.display = 'none';
            }
            
            // Verificar que tengamos un ID de pedido
            if (!pedidoId) {
                showError('No se ha especificado un pedido para confirmar');
                return;
            }
            
            // Si tenemos un token WebPay, confirmar la transacción
            if (token && window.webpaySoap) {
                window.webpaySoap.confirmarTransaccion(token)
                    .then(result => {
                        if (result.exito) {
                            // Aprobar el pedido con el servicio SOAP
                            if (window.aprobacionSoap) {
                                return window.aprobacionSoap.aprobarPedido(pedidoId);
                            } else {
                                return { exito: true, numeroAprobacion: 'SIM-' + Date.now() };
                            }
                        } else {
                            throw new Error(result.mensaje || 'Error al confirmar transacción');
                        }
                    })
                    .then(result => {
                        if (result.exito) {
                            // Mostrar confirmación exitosa
                            mostrarConfirmacionExitosa(pedidoId, result.numeroAprobacion);
                        } else {
                            throw new Error(result.mensaje || 'Error al aprobar pedido');
                        }
                    })
                    .catch(error => {
                        showError(error.message || 'Error al procesar la transacción');
                    });
            } else {
                // Mostrar la confirmación según el estado
                if (estado === 'aprobado' && aprobacionId) {
                    mostrarConfirmacionExitosa(pedidoId, aprobacionId);
                } else {
                    mostrarConfirmacionPendiente(pedidoId);
                }
            }
            
            // Función para mostrar confirmación exitosa
            function mostrarConfirmacionExitosa(pedidoId, aprobacionId) {
                confirmationContent.innerHTML = `
                    <div class="confirmation-card">
                        <div class="card-header bg-success text-white py-3">
                            <h2 class="mb-0 text-center">¡Pedido Confirmado!</h2>
                        </div>
                        <div class="card-body p-5">
                            <div class="confirmation-success text-center">
                                <div class="icon-container">
                                    <i class="fas fa-check icon-success"></i>
                                </div>
                                <h3 class="mb-4">Gracias por su compra</h3>
                                <p class="lead mb-4">Su pedido ha sido confirmado y está siendo procesado.</p>
                                
                                <div class="order-details">
                                    <div class="order-item">
                                        <strong>Número de Pedido:</strong>
                                        <span>#${pedidoId}</span>
                                    </div>
                                    <div class="order-item">
                                        <strong>Número de Aprobación:</strong>
                                        <span>${aprobacionId}</span>
                                    </div>
                                    <div class="order-item">
                                        <strong>Estado:</strong>
                                        <span class="badge bg-success">Aprobado</span>
                                    </div>
                                    <div class="order-item">
                                        <strong>Fecha:</strong>
                                        <span>${new Date().toLocaleDateString('es-CL')}</span>
                                    </div>
                                </div>
                                
                                <p class="mt-4">Hemos enviado un correo electrónico con los detalles de su compra.</p>
                                <p>Puede ver el estado de su pedido en su <a href="/pages/orders.html">historial de pedidos</a>.</p>
                                
                                <div class="actions-container">
                                    <a href="/index.html" class="btn btn-primary btn-lg">
                                        <i class="fas fa-home me-2"></i> Volver a la Tienda
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Ocultar loader
                document.querySelector('.confirmation-loader').style.display = 'none';
            }
            
            // Función para mostrar confirmación pendiente (transferencia)
            function mostrarConfirmacionPendiente(pedidoId) {
                confirmationContent.innerHTML = `
                    <div class="confirmation-card">
                        <div class="card-header bg-warning text-dark py-3">
                            <h2 class="mb-0 text-center">Pedido Pendiente de Pago</h2>
                        </div>
                        <div class="card-body p-5">
                            <div class="confirmation-pending text-center">
                                <div class="icon-container">
                                    <i class="fas fa-clock icon-pending"></i>
                                </div>
                                <h3 class="mb-4">Su pedido está en espera de confirmación de pago</h3>
                                <p class="lead mb-4">Hemos registrado su pedido. Una vez que confirmemos su transferencia, procesaremos su pedido.</p>
                                
                                <div class="order-details">
                                    <div class="order-item">
                                        <strong>Número de Pedido:</strong>
                                        <span>#${pedidoId}</span>
                                    </div>
                                    <div class="order-item">
                                        <strong>Estado:</strong>
                                        <span class="badge bg-warning text-dark">Pendiente</span>
                                    </div>
                                    <div class="order-item">
                                        <strong>Fecha:</strong>
                                        <span>${new Date().toLocaleDateString('es-CL')}</span>
                                    </div>
                                </div>
                                
                                <div class="bank-details mt-4">
                                    <h4 class="mb-3">Datos para Transferencia</h4>
                                    <p class="bank-info"><strong>Banco:</strong> Banco FERREMAS</p>
                                    <p class="bank-info"><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
                                    <p class="bank-info"><strong>Número de Cuenta:</strong> 1234567890</p>
                                    <p class="bank-info"><strong>RUT:</strong> 76.123.456-7</p>
                                    <p class="bank-info"><strong>Nombre:</strong> FERREMAS S.A.</p>
                                    <p class="bank-info"><strong>Email para comprobante:</strong> pagos@ferremas.cl</p>
                                    <p class="important-note">IMPORTANTE: Indica el número de pedido #${pedidoId} en el comentario de la transferencia</p>
                                </div>
                                
                                <p class="mt-4">Hemos enviado un correo electrónico con los detalles de su pedido y pago.</p>
                                <p>Puede ver el estado de su pedido en su <a href="/pages/orders.html">historial de pedidos</a>.</p>
                                
                                <div class="actions-container">
                                    <a href="/index.html" class="btn btn-primary btn-lg">
                                        <i class="fas fa-home me-2"></i> Volver a la Tienda
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Ocultar loader
                document.querySelector('.confirmation-loader').style.display = 'none';
            }
        });
