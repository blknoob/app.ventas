/**
 * CLIENTE JAVASCRIPT - ACTUALIZACIÓN DINÁMICA DE PRECIOS
 * 
 * Script para actualizar precios de productos en tiempo real
 * consumiendo la API de cotización del EUR. Actualiza los precios
 * mostrados en las tarjetas de productos sin recargar la página.
 * 
 * FUNCIONALIDADES:
 * - Actualización automática cada 5 minutos
 * - Actualización manual mediante botón
 * - Indicador visual de estado de actualización
 * - Manejo de errores y fallbacks
 * - Cache local para optimización
 * 
 * INTEGRACIÓN:
 * - Compatible con productCard.hbs
 * - Utiliza API /api/currency/eur
 * - Preserva UX durante actualizaciones
 * - Progressive Enhancement
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

class PriceUpdater {
  constructor() {
    this.apiUrl = '/api/currency/eur';
    this.updateInterval = 5 * 60 * 1000; // 5 minutos
    this.isUpdating = false;
    this.lastUpdate = null;
    this.currentRate = null;
    
    this.init();
  }

  /**
   * Inicializa el sistema de actualización de precios
   * 
   * Configura eventos, intervalos de actualización y
   * estado inicial del sistema.
   */
  init() {
    console.log('💰 PriceUpdater: Inicializando sistema de actualización de precios');
    
    // Crear botón de actualización manual
    this.createUpdateButton();
    
    // Actualización inicial
    this.updatePrices();
    
    // Configurar actualización automática
    this.startAutoUpdate();
    
    // Mostrar último tiempo de actualización
    this.updateTimestamp();
  }

  /**
   * Crea botón de actualización manual en la interfaz
   */
  createUpdateButton() {
    const button = document.createElement('button');
    button.id = 'price-update-btn';
    button.innerHTML = '🔄 Actualizar Precios';
    button.className = 'price-update-button';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', () => this.updatePrices(true));
    document.body.appendChild(button);
    
    // Crear indicador de estado
    const statusDiv = document.createElement('div');
    statusDiv.id = 'price-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 65px;
      right: 20px;
      z-index: 1000;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 8px 12px;
      border-radius: 3px;
      font-size: 12px;
      color: #6c757d;
      max-width: 250px;
    `;
    
    document.body.appendChild(statusDiv);
  }

  /**
   * Inicia actualización automática de precios
   */
  startAutoUpdate() {
    setInterval(() => {
      if (!this.isUpdating) {
        this.updatePrices();
      }
    }, this.updateInterval);
  }

  /**
   * Actualiza precios consumiendo la API de cotización
   * 
   * @param {boolean} manual - Si la actualización es manual
   */
  async updatePrices(manual = false) {
    if (this.isUpdating) {
      console.log('⏳ PriceUpdater: Actualización en progreso, omitiendo');
      return;
    }

    try {
      this.isUpdating = true;
      this.updateButtonState(true);
      this.updateStatus('Actualizando precios...', 'info');
      
      console.log('🔄 PriceUpdater: Obteniendo cotización EUR');
      
      const response = await fetch(this.apiUrl);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error obteniendo cotización');
      }
      
      const cotization = result.data;
      this.currentRate = cotization.venta;
      this.lastUpdate = new Date();
      
      console.log('💱 PriceUpdater: Cotización recibida', { 
        rate: this.currentRate, 
        source: cotization.source 
      });
      
      // Actualizar precios en la interfaz
      this.updateProductPrices(cotization);
      
      this.updateStatus(
        `Precios actualizados (EUR: $${this.currentRate.toFixed(4)})`,
        'success'
      );
      
      if (manual) {
        setTimeout(() => {
          this.updateStatus('Actualización completada', 'success');
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ PriceUpdater: Error actualizando precios', error);
      this.updateStatus('Error actualizando precios', 'error');
    } finally {
      this.isUpdating = false;
      this.updateButtonState(false);
      this.updateTimestamp();
    }
  }

  /**
   * Actualiza precios de productos en la interfaz
   * 
   * @param {Object} cotization - Datos de cotización
   */
  updateProductPrices(cotization) {
    const productCards = document.querySelectorAll('.product-card');
    let updatedCount = 0;
    
    productCards.forEach(card => {
      const priceElement = card.querySelector('.product-price:nth-of-type(3)'); // Precio convertido
      
      if (priceElement) {
        // Buscar el precio original en EUR
        const refElement = card.querySelector('.product-price:first-of-type');
        if (refElement) {
          const refText = refElement.textContent;
          const eurPriceMatch = refText.match(/€(\d+\.?\d*)/);
          
          if (eurPriceMatch) {
            const eurPrice = parseFloat(eurPriceMatch[1]);
            const markup = 0.15; // 15% margen
            const convertedPrice = (eurPrice * cotization.venta * (1 + markup)).toFixed(2);
            
            // Actualizar el precio mostrado
            priceElement.innerHTML = `
              <strong>Precio:</strong> $${convertedPrice} USD
              <small style="color: #666; font-size: 0.9em;">
                (Cotización: ${cotization.venta.toFixed(4)} - ${cotization.source})
              </small>
            `;
            
            updatedCount++;
          }
        }
      }
    });
    
    console.log(`✅ PriceUpdater: ${updatedCount} precios actualizados`);
  }

  /**
   * Actualiza estado del botón de actualización
   * 
   * @param {boolean} updating - Si está actualizando
   */
  updateButtonState(updating) {
    const button = document.getElementById('price-update-btn');
    if (button) {
      button.disabled = updating;
      button.innerHTML = updating ? '⏳ Actualizando...' : '🔄 Actualizar Precios';
      button.style.background = updating ? '#6c757d' : '#28a745';
    }
  }

  /**
   * Actualiza mensaje de estado
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: info, success, error
   */
  updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('price-status');
    if (statusDiv) {
      const colors = {
        info: '#17a2b8',
        success: '#28a745',
        error: '#dc3545'
      };
      
      statusDiv.textContent = message;
      statusDiv.style.color = colors[type] || colors.info;
    }
  }

  /**
   * Actualiza timestamp de última actualización
   */
  updateTimestamp() {
    if (this.lastUpdate) {
      const timeStr = this.lastUpdate.toLocaleTimeString();
      this.updateStatus(`Última actualización: ${timeStr}`, 'info');
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar en páginas con productos
  if (document.querySelector('.product-card')) {
    window.priceUpdater = new PriceUpdater();
  }
});

// Exponer funciones para debugging
window.updatePricesNow = () => {
  if (window.priceUpdater) {
    window.priceUpdater.updatePrices(true);
  }
};