// services/soap/webpay/webpay.wsdl.js
const config = require('../../../config/env.config');

// Definición del WSDL para el servicio de WebPay
const wsdl = `<?xml version="1.0" encoding="UTF-8"?>
<wsdl:definitions 
  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" 
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" 
  xmlns:tns="${config.service.namespace}" 
  xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
  targetNamespace="${config.service.namespace}">

  <wsdl:types>
    <xsd:schema targetNamespace="${config.service.namespace}">
      <!-- Solicitud para iniciar transacción -->
      <xsd:element name="IniciarTransaccionRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="pedidoId" type="xsd:int"/>
            <xsd:element name="monto" type="xsd:decimal"/>
            <xsd:element name="urlRetorno" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      
      <!-- Respuesta de iniciar transacción -->
      <xsd:element name="IniciarTransaccionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="exito" type="xsd:boolean"/>
            <xsd:element name="mensaje" type="xsd:string"/>
            <xsd:element name="token" type="xsd:string"/>
            <xsd:element name="url" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      
      <!-- Solicitud para confirmar transacción -->
      <xsd:element name="ConfirmarTransaccionRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="token" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      
      <!-- Respuesta de confirmar transacción -->
      <xsd:element name="ConfirmarTransaccionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="exito" type="xsd:boolean"/>
            <xsd:element name="mensaje" type="xsd:string"/>
            <xsd:element name="ordenCompra" type="xsd:string"/>
            <xsd:element name="pedidoId" type="xsd:int"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </wsdl:types>

  <!-- Mensajes para IniciarTransaccion -->
  <wsdl:message name="IniciarTransaccionRequest">
    <wsdl:part name="parameters" element="tns:IniciarTransaccionRequest"/>
  </wsdl:message>
  <wsdl:message name="IniciarTransaccionResponse">
    <wsdl:part name="parameters" element="tns:IniciarTransaccionResponse"/>
  </wsdl:message>
  
  <!-- Mensajes para ConfirmarTransaccion -->
  <wsdl:message name="ConfirmarTransaccionRequest">
    <wsdl:part name="parameters" element="tns:ConfirmarTransaccionRequest"/>
  </wsdl:message>
  <wsdl:message name="ConfirmarTransaccionResponse">
    <wsdl:part name="parameters" element="tns:ConfirmarTransaccionResponse"/>
  </wsdl:message>

  <!-- Port Type -->
  <wsdl:portType name="WebPayPortType">
    <wsdl:operation name="IniciarTransaccion">
      <wsdl:input message="tns:IniciarTransaccionRequest"/>
      <wsdl:output message="tns:IniciarTransaccionResponse"/>
    </wsdl:operation>
    <wsdl:operation name="ConfirmarTransaccion">
      <wsdl:input message="tns:ConfirmarTransaccionRequest"/>
      <wsdl:output message="tns:ConfirmarTransaccionResponse"/>
    </wsdl:operation>
  </wsdl:portType>

  <!-- Binding -->
  <wsdl:binding name="WebPaySOAP" type="tns:WebPayPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="IniciarTransaccion">
      <soap:operation soapAction="${config.service.namespace}/IniciarTransaccion"/>
      <wsdl:input>
        <soap:body use="literal"/>
      </wsdl:input>
      <wsdl:output>
        <soap:body use="literal"/>
      </wsdl:output>
    </wsdl:operation>
    <wsdl:operation name="ConfirmarTransaccion">
      <soap:operation soapAction="${config.service.namespace}/ConfirmarTransaccion"/>
      <wsdl:input>
        <soap:body use="literal"/>
      </wsdl:input>
      <wsdl:output>
        <soap:body use="literal"/>
      </wsdl:output>
    </wsdl:operation>
  </wsdl:binding>

  <!-- Service -->
  <wsdl:service name="WebPayService">
    <wsdl:port binding="tns:WebPaySOAP" name="WebPaySOAP">
      <soap:address location="http://localhost:${config.port}/api/soap/webpay"/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>`;

module.exports = wsdl;