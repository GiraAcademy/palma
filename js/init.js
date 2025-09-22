// Script de inicialización mejorado para Panama AZORD
(function () {
  'use strict';

  console.log('Iniciando carga de aplicación Panama AZORD...');

  // Función para verificar si todas las dependencias están cargadas
  function checkDependencies() {
    const dependencies = [
      { name: 'Leaflet', check: () => typeof L !== 'undefined' },
      { name: 'Autolinker', check: () => typeof Autolinker !== 'undefined' },
      { name: 'DOM elementos', check: () => document.getElementById('map') !== null },
  // Eliminadas dependencias de datos locales, solo se verifica Leaflet y DOM
      { name: 'Main.js', check: () => typeof initializeApp === 'function' }
    ];

    const missing = dependencies.filter(dep => !dep.check());

    if (missing.length > 0) {
      console.warn('Dependencias faltantes:', missing.map(d => d.name));
      return false;
    }

    console.log('✓ Todas las dependencias están disponibles');
    return true;
  }

  // Función de inicialización con retry
  function tryInitialize(attempt = 1) {
    console.log(`Intento de inicialización #${attempt}`);

    if (checkDependencies()) {
      try {
        // Verificar que los elementos DOM críticos existan
        const mapElement = document.getElementById('map');
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');

        console.log(`Elementos encontrados: mapa=${!!mapElement}, botones=${tabButtons.length}, paneles=${tabPanels.length}`);

        if (mapElement && tabButtons.length > 0 && tabPanels.length > 0) {
          // Inicializar la aplicación
          initializeApp();

          // Verificar que las pestañas funcionen
          setTimeout(() => {
            console.log('Verificando funcionalidad de pestañas...');
            const activeButton = document.querySelector('.tab-button.active');
            const activePanel = document.querySelector('.tab-panel.active');

            if (activeButton && activePanel) {
              console.log('✓ Sistema de pestañas funcionando correctamente');
            } else {
              console.warn('⚠ Problema con el sistema de pestañas, aplicando fix...');
              // Fix manual para pestañas
              const firstButton = document.querySelector('.tab-button');
              if (firstButton) {
                const tabName = firstButton.getAttribute('aria-controls');
                if (tabName && window.showTab) {
                  window.showTab(tabName);
                }
              }
            }
          }, 1000);

          console.log('✓ Aplicación inicializada exitosamente');
          return;
        } else {
          throw new Error('Elementos DOM críticos no encontrados');
        }
      } catch (error) {
        console.error('Error en inicialización:', error);

        if (attempt < 3) {
          console.log(`Reintentando en 500ms...`);
          setTimeout(() => tryInitialize(attempt + 1), 500);
        } else {
          console.error('❌ Falló la inicialización después de 3 intentos');
        }
      }
    } else {
      if (attempt < 5) {
        console.log(`Esperando dependencias... reintento en 200ms`);
        setTimeout(() => tryInitialize(attempt + 1), 200);
      } else {
        console.error('❌ Dependencias no disponibles después de 5 intentos');
      }
    }
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryInitialize());
  } else {
    // DOM ya está listo
    tryInitialize();
  }

})();
