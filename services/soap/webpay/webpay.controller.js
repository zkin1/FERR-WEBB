// services/soap/webpay/webpay.controller.js
const soap = require('soap');
const logger = require('../../../utils/logger');
const webpayService = require('./webpay.service');
const wsdl = require('./webpay.wsdl');
const config = require('../../../config/env.config');

/**
 * Inicializa el servidor SOAP de WebPay
 * @param {Object} app - Instancia de Express
 * @returns {Promise<Object>} Servidor SOAP
 */
function iniciarServidorSOAP(app) {
  return new Promise((resolve, reject) => {
    try {
      // Crear el servidor SOAP
      const soapServer = soap.listen(
        app, 
        '/api/soap/webpay', 
        webpayService, 
        wsdl
      );
      
      // Configurar eventos del servidor SOAP
      soapServer.on('headers', headers => {
        logger.debug('Encabezados SOAP WebPay recibidos:', headers);
      });
      
      soapServer.on('request', (request, methodName) => {
        logger.debug(`Solicitud SOAP WebPay recibida: ${methodName}`);
      });
      
      soapServer.on('response', (response, methodName) => {
        logger.debug(`Respuesta SOAP WebPay enviada: ${methodName}`);
      });
      
      logger.info(`Servidor SOAP WebPay iniciado en: /api/soap/webpay`);
      logger.info(`WSDL WebPay disponible en: /api/soap/webpay?wsdl`);
      
      resolve(soapServer);
    } catch (error) {
      logger.error('Error al iniciar servidor SOAP WebPay:', error);
      reject(error);
    }
  });
}

module.exports = { iniciarServidorSOAP };