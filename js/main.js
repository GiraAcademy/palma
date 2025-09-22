  console.log('Inicializando Leaflet map...');
  console.log('Configurando capas base...');
  console.log('Configurando capas vectoriales y fetch de potreros...');
// Aplicación principal Panama AZORD - Control de Imágenes Caña de Azúcar

// Variables globales
var map;
var hash;
var autolinker;
var bounds_group;
var labels = [];
var totalMarkers = 0;

// Inicialización del mapa
function initializeMap() {
  map = L.map('map', {
    zoomControl: false,
    maxZoom: 28,
    minZoom: 1
  }).setView([8.442552824913611, -82.55167253653119], 18);

  hash = new L.Hash(map);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');

  autolinker = new Autolinker({ truncate: { length: 30, location: 'smart' } });
  bounds_group = new L.featureGroup([]);
}

// Funciones de utilidad para popups
function removeEmptyRowsFromPopupContent(content, feature) {
  var tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  var rows = tempDiv.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    var td = rows[i].querySelector('td.visible-with-data');
    var key = td ? td.id : '';
    if (td && td.classList.contains('visible-with-data') && feature.properties[key] == null) {
      rows[i].parentNode.removeChild(rows[i]);
    }
  }
  return tempDiv.innerHTML;
}

function addClassToPopupIfMedia(content, popup) {
  var tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  if (tempDiv.querySelector('td img')) {
    popup._contentNode.classList.add('media');
    setTimeout(function () {
      popup.update();
    }, 10);
  } else {
    popup._contentNode.classList.remove('media');
  }
}

// Configuración inicial de controles
function setupControls() {
  var zoomControl = L.control.zoom({
    position: 'topleft'
  }).addTo(map);

  L.control.locate({ locateOptions: { maxZoom: 19 } }).addTo(map);

  // Control personalizado Home
  var HomeControl = L.Control.extend({
    options: {
      position: 'topleft'
    },

    onAdd: function (map) {
      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

      container.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
      container.style.border = '1px solid rgba(148, 163, 184, 0.3)';
      container.style.borderRadius = '8px';
      container.style.boxShadow = '0 2px 8px rgba(148, 163, 184, 0.15)';
      container.style.width = '34px';
      container.style.height = '34px';
      container.style.cursor = 'pointer';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.transition = 'all 0.2s ease';

      container.innerHTML = '<img src="images/casa.png" alt="Home" style="width: 18px; height: 18px; filter: brightness(0.2);">';
      container.title = 'Volver a la vista inicial';

      container.onmouseover = function () {
        this.style.background = 'linear-gradient(135deg, #0d9488 0%, #3b82f6 100%)';
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
        // Cambiar el filtro de la imagen a blanco en hover
        this.querySelector('img').style.filter = 'brightness(0) invert(1)';
      }

      container.onmouseout = function () {
        this.style.background = 'rgba(255, 255, 255, 0.98)';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 8px rgba(148, 163, 184, 0.15)';
        // Restaurar el filtro original de la imagen
        this.querySelector('img').style.filter = 'brightness(0.2)';
      }

      L.DomEvent.on(container, 'click', function (e) {
        L.DomEvent.stopPropagation(e);
        // Regresar a las coordenadas y zoom iniciales
        map.setView([9.6659, -68.3426], 13);
      });

      // Prevenir propagación de eventos del mapa
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });

  // Agregar el control Home al mapa
  map.addControl(new HomeControl());
}

// Configuración de capas base
function setupBaseLayers() {
  // Google Satellite Hybrid
  map.createPane('pane_GoogleSatelliteHybrid_0');
  map.getPane('pane_GoogleSatelliteHybrid_0').style.zIndex = 400;
  var layer_GoogleSatelliteHybrid_0 = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    pane: 'pane_GoogleSatelliteHybrid_0',
    opacity: 1.0,
    attribution: '',
    minZoom: 1,
    maxZoom: 28,
  });
  map.addLayer(layer_GoogleSatelliteHybrid_0);

  // Actualizar objeto global de capas
  if (!window.mapLayers) window.mapLayers = {};
  window.mapLayers['GoogleSatelliteHybrid'] = layer_GoogleSatelliteHybrid_0;
  window.mapLayers['Potreros'] = window.mapLayers['Potreros'] || null;
}

// Configuración de capas vectoriales
function setupVectorLayers() {
  // ...solo lógica para potreros...


  // --- NUEVO: Cargar datos desde endpoint remoto ---
  map.createPane('pane_Potreros');
  map.getPane('pane_Potreros').style.zIndex = 403;
  map.getPane('pane_Potreros').style['mix-blend-mode'] = 'normal';

  fetch('https://palma.gira360.com/potreros')
    .then(response => response.json())
    .then(data => {
      // Se espera que el endpoint retorne un objeto con propiedades "potreros" tipo GeoJSON
      const potrerosGeoJson = data.potreros || data.Potreros || data;

      // Capa Potreros
      var layer_Potreros = new L.geoJson(potrerosGeoJson, {
        attribution: '',
        interactive: true,
        dataVar: 'json_Potreros',
        layerName: 'layer_Potreros',
        pane: 'pane_Potreros',
        style: function(feature) {
          return {
            pane: 'pane_Potreros',
            opacity: 1,
            color: 'rgba(24, 236, 64, 1.0)',
            dashArray: '',
            lineCap: 'square',
            lineJoin: 'bevel',
            weight: 2.0,
            fillOpacity: 0, // sin relleno
            interactive: true,
          };
        },
        onEachFeature: function(feature, layer) {
          try {
            var props = feature.properties || {};
            var nombre = props.nombre || props.NOMBRE || 'Sin nombre';
            var super_ha = (props.super_ha !== undefined) ? props.super_ha : (props.superficie || 'N/A');
            var popupHtml = '<div style="font-weight:700;color:#0d9488;">' + nombre + '</div>' +
              '<div style="margin-top:6px;font-size:13px;color:#374151;">Superficie: ' + super_ha + ' ha</div>';
            layer.bindPopup(popupHtml);
          } catch (e) {
            console.warn('Error binding popup Potrero', e);
          }
        }
      });
      bounds_group.addLayer(layer_Potreros);
      map.addLayer(layer_Potreros);
      window.mapLayers['Potreros'] = layer_Potreros;

      // Centrar y ajustar el extent del mapa
      let bounds = null;
      if (layer_Potreros.getBounds) {
        bounds = layer_Potreros.getBounds();
      }
      if (bounds) {
        map.fitBounds(bounds, { maxZoom: 19 });
      }

      // Asignar listeners a los checkboxes después de crear la capa
      setupLayerCheckboxes();
    })
    .catch(error => {
      console.error('Error al cargar datos desde el endpoint:', error);
    });
}

// Funcionalidad de pestañas accesible y semántica
window.showTab = function (tabName, evt) {
  console.log('showTab llamada con:', tabName, evt ? 'con evento' : 'sin evento');

  const panels = document.querySelectorAll('.tab-panel');
  const buttons = document.querySelectorAll('.tab-button');

  console.log('Paneles encontrados:', panels.length, 'Botones encontrados:', buttons.length);

  panels.forEach(panel => {
    panel.classList.remove('active');
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-hidden', 'true');
  });
  buttons.forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('tabindex', '-1');
  });

  const panel = document.getElementById(tabName);
  if (!panel) {
    console.error('Panel no encontrado:', tabName);
    return;
  }

  panel.classList.add('active');
  panel.removeAttribute('hidden');
  panel.setAttribute('aria-hidden', 'false');

  // Buscar el botón relacionado
  let button = null;
  if (evt && evt.currentTarget) {
    button = evt.currentTarget;
  } else {
    // fallback: buscar por aria-controls
    button = document.querySelector('.tab-button[aria-controls="' + tabName + '"]');
  }
  if (button) {
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    button.setAttribute('tabindex', '0');
    button.focus();
    console.log('Pestaña activada:', tabName);
  } else {
    console.error('Botón no encontrado para:', tabName);
  }
};

// Nuevo control de capas del mapa, usando evento change
function handleLayerToggle(evt) {
  const checkbox = evt.target;
  const layerName = checkbox.id;
  const layer = window.mapLayers[layerName];
  if (!layer) {
    console.log(`[LayerToggle] Layer '${layerName}' not available.`);
    return;
  }
  if (checkbox.checked) {
    if (!map.hasLayer(layer)) {
      console.log(`[LayerToggle] Adding layer '${layerName}' to map.`);
      map.addLayer(layer);
    } else {
      console.log(`[LayerToggle] Layer '${layerName}' already on map.`);
    }
  } else {
    if (map.hasLayer(layer)) {
      console.log(`[LayerToggle] Removing layer '${layerName}' from map.`);
      map.removeLayer(layer);
    } else {
      console.log(`[LayerToggle] Layer '${layerName}' already removed.`);
    }
  }
}

// Asignar listeners a los checkboxes de capas
function setupLayerCheckboxes() {
  const layerIds = ['GoogleSatelliteHybrid', 'Potreros'];
  layerIds.forEach(id => {
    const checkbox = document.getElementById(id);
    const layer = window.mapLayers[id];
    if (checkbox) {
      checkbox.removeEventListener('change', handleLayerToggle); // evitar duplicados
      checkbox.addEventListener('change', handleLayerToggle);
      // Set checkbox state to match layer visibility
      if (layer) {
        checkbox.disabled = false;
        checkbox.checked = map.hasLayer(layer);
      } else {
        checkbox.disabled = true;
        checkbox.checked = false;
      }
    }
  });
}


// Estado de usuario por fotocentro (persistente en localStorage)
let fotocentroUserData = {};

function loadFotocentroUserData() {
  try {
    const data = localStorage.getItem('fotocentroUserData');
    if (data) fotocentroUserData = JSON.parse(data);
    else fotocentroUserData = {};
  } catch (e) {
    fotocentroUserData = {};
  }
}
function saveFotocentroUserData() {
  try {
    localStorage.setItem('fotocentroUserData', JSON.stringify(fotocentroUserData));
  } catch (e) { }
}
// Cargar al inicio
loadFotocentroUserData();

// Función para actualizar estilos de fotocentros según datos del usuario
function updateFotocentroStyles() {
  if (!window.mapLayers || !window.mapLayers['Fotocentro']) {
    console.log('Capa de fotocentros no disponible para actualizar estilos');
    return;
  }

  console.log('Actualizando estilos de fotocentros...');

  window.mapLayers['Fotocentro'].eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties) {
      const newStyle = style_Fotocentro_4_0(layer.feature);
      layer.setStyle(newStyle);
    }
  });

  console.log('Estilos de fotocentros actualizados');
}

// Funcionalidad de visualización de imágenes
window.showFotocentroImage = function (properties, layer) {
  const imageViewer = document.getElementById('image-viewer');
  const fotocentroInfo = document.getElementById('selected-fotocentro-info');
  const fotocentroCode = document.getElementById('fotocentro-code');

  showTab('analisis');
  highlightFotocentro(layer);

  // Mostrar controles de acciones
  const actions = document.getElementById('fotocentro-actions');
  if (actions) actions.style.display = 'block';

  // Guardar código actual
  const currentCode = properties.codigo;
  fotocentroCode.textContent = currentCode || '';
  fotocentroInfo.style.display = currentCode ? 'block' : 'none';

  // Actualizar UI de botones y nota
  updateFotocentroActionsUI(currentCode);

  // Asignar listeners (solo una vez)
  setupFotocentroActionsListeners();

  if (properties['Enlace Pú']) {
    const googleDriveUrl = properties['Enlace Pú'];
    console.log('URL original:', googleDriveUrl);

    const fileId = extractGoogleDriveFileId(googleDriveUrl);
    if (!fileId) {
      console.error('No se pudo extraer el ID del archivo de Google Drive');
      showImageError();
      return;
    }

    console.log('ID extraído:', fileId);

    imageViewer.innerHTML = `
            <div class="loading-spinner" style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">⏳</div>
                    <div>Cargando imagen...</div>
                </div>
            </div>
        `;

    const img = new Image();
    let urlIndex = 0;
    const possibleUrls = [
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}&export=download`
    ];

    function tryLoadImage() {
      if (urlIndex >= possibleUrls.length) {
        console.error('No se pudo cargar la imagen con ningún formato de URL');
        showImageError();
        return;
      }

      const currentUrl = possibleUrls[urlIndex];
      console.log(`Intentando cargar imagen con URL ${urlIndex + 1}:`, currentUrl);

      img.onload = function () {
        imageViewer.innerHTML = `
                    <img src="${currentUrl}" alt="Fotocentro ${properties.codigo}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div class="image-info" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 12px;">
                        <strong>Imagen:</strong> ${properties.codigo || 'N/A'}<br>
                        X: ${properties.Este || 'N/A'}; Y: ${properties.Norte || 'N/A'}<br>
                        <strong>Enlace:</strong> <a href="${googleDriveUrl}" target="_blank" style="color: #3b82f6;">🔍 Ver imagen</a>
                    </div>
                `;
        imageViewer.classList.add('has-image');
      };

      img.onerror = function () {
        console.log(`Falló URL ${urlIndex + 1}, intentando siguiente...`);
        urlIndex++;
        tryLoadImage();
      };

      img.src = currentUrl;
    }

    tryLoadImage();
  } else {
    showNoImageAvailable();
  }
};

// Resaltar fotocentro seleccionado
window.highlightFotocentro = function (layer) {
  if (window.selectedMarker) {
    window.selectedMarker.setStyle({
      fillColor: '#F0EA04',
      color: '#000000',
      weight: 2,
      fillOpacity: 1,
      radius: 4.4
    });
  }

  if (layer) {
    layer.setStyle({
      fillColor: '#ff6b6b',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
      radius: 10
    });

    map.setView(layer.getLatLng(), Math.max(map.getZoom(), 16));
    window.selectedMarker = layer;
  }
};

// Extraer ID de Google Drive
window.extractGoogleDriveFileId = function (url) {
  if (!url) return null;

  console.log('Extrayendo ID de:', url);

  const patterns = [
    /[?&]id=([a-zA-Z0-9-_]+)/,
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/,
    /\/([a-zA-Z0-9-_]{25,})/
  ];

  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length >= 25) {
      console.log('ID encontrado:', match[1]);
      return match[1];
    }
  }

  console.log('No se pudo extraer ID de la URL');
  return null;
};

// Mostrar error de imagen
window.showImageError = function () {
  const imageViewer = document.getElementById('image-viewer');
  imageViewer.innerHTML = `
        <div class="image-placeholder" style="text-align: center; padding: 40px; border: 2px dashed #ddd; border-radius: 8px; color: #666;">
            <div style="font-size: 48px; color: #ff6b6b; margin-bottom: 15px;">⚠️</div>
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Error al cargar la imagen</div>
            <div style="font-size: 12px; color: #888; line-height: 1.4;">
                La imagen no está disponible o el enlace no es válido.<br>
                Verifica que el archivo sea público en Google Drive.
            </div>
        </div>
    `;
  imageViewer.classList.remove('has-image');
};

// Mostrar cuando no hay imagen disponible
window.showNoImageAvailable = function () {
  const imageViewer = document.getElementById('image-viewer');
  imageViewer.innerHTML = `
        <div class="image-placeholder" style="text-align: center; padding: 40px; border: 2px dashed #ddd; border-radius: 8px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 15px;">📷</div>
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">No hay imagen disponible</div>
            <div style="font-size: 12px; color: #888;">
                Este fotocentro no tiene un enlace de imagen asociado
            </div>
        </div>
    `;
  imageViewer.classList.remove('has-image');
};

// Configuración de búsqueda y etiquetas
function setupSearchAndLabels() {
  var i = 0;
  window.mapLayers['Fotocentro'].eachLayer(function (layer) {
    var context = {
      feature: layer.feature,
      variables: {}
    };
    layer.bindTooltip((layer.feature.properties['codigo'] !== null ?
      String('<div style="color: #000000; font-size: 6pt; font-weight: bold; font-family: \'Arial Black\', sans-serif;">' +
        layer.feature.properties['codigo']) + '</div>' : ''),
      { permanent: true, offset: [-0, -16], className: 'css_Fotocentro_4' });
    labels.push(layer);
    totalMarkers += 1;
    layer.added = true;
    addLabel(layer, i);
    i++;
  });

  map.addControl(new L.Control.Search({
    layer: window.mapLayers['Fotocentro'],
    initial: false,
    hideMarkerOnCollapse: true,
    propertyName: 'codigo'
  }));

  document.getElementsByClassName('search-button')[0].className += ' fa fa-binoculars';
}

// Event listeners del mapa
function setupMapEvents() {
  map.on("zoomend", function () {
    resetLabels([window.mapLayers['Fotocentro']]);
  });
  map.on("layeradd", function () {
    resetLabels([window.mapLayers['Fotocentro']]);
  });
  map.on("layerremove", function () {
    resetLabels([window.mapLayers['Fotocentro']]);
  });
}

// Inicialización de la aplicación
function initializeApp() {
  console.log('Iniciando initializeApp...');

  // Configurar listeners para pestañas accesibles
  const tabButtons = document.querySelectorAll('.tab-button');
  console.log('Configurando listeners para', tabButtons.length, 'botones de pestaña');

  tabButtons.forEach(button => {
    button.addEventListener('click', function (evt) {
      const tab = button.getAttribute('aria-controls');
      console.log('Clic en botón de pestaña:', tab);
      window.showTab(tab, evt);
    });
    button.addEventListener('keydown', function (evt) {
      // Navegación con flechas
      if (evt.key === 'ArrowRight' || evt.key === 'ArrowLeft') {
        const buttons = Array.from(document.querySelectorAll('.tab-button'));
        const idx = buttons.indexOf(evt.currentTarget);
        let nextIdx = evt.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (nextIdx < 0) nextIdx = buttons.length - 1;
        if (nextIdx >= buttons.length) nextIdx = 0;
        buttons[nextIdx].focus();
      }
    });
  });

  // Inicializar variables globales
  if (!window.mapLayers) window.mapLayers = {};
  window.selectedMarker = null;

  console.log('Configurando mapa y capas...');

  // Configurar mapa y capas
  initializeMap();
  setupControls();
  setupBaseLayers();
  setupVectorLayers();

  // Inicializar estado de capas (Clasificación empieza oculta)
  if (window.mapLayers['Clasificacion'] && map.hasLayer(window.mapLayers['Clasificacion'])) {
    map.removeLayer(window.mapLayers['Clasificacion']);
  }

  console.log('Configurando funcionalidades adicionales...');

  // Configurar funcionalidades adicionales
  setBounds();
  setupSearchAndLabels();
  setupMapEvents();
  setupLayerCheckboxes(); // listeners para los checkboxes

  // Configurar sistema de coordenadas
  // sistema de coordenadas eliminado

  // Extensiones de Leaflet
  L.ImageOverlay.include({
    getBounds: function () {
      return this._bounds;
    }
  });

  resetLabels([window.mapLayers['Fotocentro']]);
  resetLabels([window.mapLayers['Fotocentro']]);

}

// --- Funcionalidad del menú móvil responsive ---
function setupMobileMenu() {
  if (window._mobileMenuSetup) return;
  window._mobileMenuSetup = true;

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const mainContent = document.querySelector('.main-content');

  if (!mobileMenuBtn || !sidebarCloseBtn || !sidebar || !sidebarOverlay || !mainContent) {
    console.warn('Elementos del menú móvil no encontrados');
    return;
  }

  // Función para abrir el sidebar
  function openSidebar() {
    sidebar.classList.add('sidebar-open');
    sidebarOverlay.style.opacity = '1';
    sidebarOverlay.style.pointerEvents = 'auto';
    mainContent.classList.add('sidebar-open');

    // Prevent body scroll cuando el sidebar está abierto en mobile
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }
  }

  // Función para cerrar el sidebar
  function closeSidebar() {
    sidebar.classList.remove('sidebar-open');
    sidebarOverlay.style.opacity = '0';
    sidebarOverlay.style.pointerEvents = 'none';
    mainContent.classList.remove('sidebar-open');

    // Restore body scroll
    document.body.style.overflow = '';
  }

  // Event listeners
  mobileMenuBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    openSidebar();
  });

  sidebarCloseBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeSidebar();
  });

  // Cerrar al hacer click en el overlay
  sidebarOverlay.addEventListener('click', function (e) {
    if (e.target === sidebarOverlay) {
      closeSidebar();
    }
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });

  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) {
      // En pantallas grandes, cerrar el sidebar móvil y restaurar scroll
      closeSidebar();
    }
  });

  console.log('Menú móvil configurado correctamente');
}

// Script principal preparado para inicialización externa
console.log('main.js cargado - funciones disponibles para inicialización');

// Coordinate display system removed per user request
