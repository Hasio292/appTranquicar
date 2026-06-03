const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");
const targetButtons = document.querySelectorAll("[data-target]");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const plateInput = document.getElementById("plateInput");
const vehicleProfile = document.getElementById("vehicleProfile");
const profilePlate = document.getElementById("profilePlate");
const profileModel = document.getElementById("profileModel");
const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const dismissInstall = document.getElementById("dismissInstall");
const installText = document.getElementById("installText");
const focusDestination = document.getElementById("focusDestination");
const closeDestinationMode = document.getElementById("closeDestinationMode");
const routeStatus = document.getElementById("routeStatus");
const routeSummary = document.getElementById("routeSummary");
const routeTime = document.getElementById("routeTime");
const routeRisk = document.getElementById("routeRisk");
const routeAlerts = document.getElementById("routeAlerts");
const locateUser = document.getElementById("locateUser");

let deferredInstallPrompt = null;
let safeRouteMap = null;
let referenceLayer = null;
let routeLayer = null;
let userLocationMarker = null;
let destinationMarker = null;
let currentOrigin = null;
let selectingDestination = false;

const vehicles = {
  "ABC-123": {
    model: "Toyota Yaris 2020 · Gris",
    risk: "Riesgo bajo"
  },
  "BCD-456": {
    model: "Hyundai Accent 2019 · Blanco",
    risk: "Riesgo medio"
  },
  "TQC-777": {
    model: "Kia Rio 2022 · Azul",
    risk: "Riesgo bajo"
  }
};

const ABANCAY_CENTER = [-13.6356, -72.8814];
const SIMULATED_ORIGIN = [-13.6368, -72.8836];
const NEARBY_ALERT_RADIUS_KM = 0.9;
const ROUTE_ALERT_RADIUS_KM = 0.35;
const ALERT_TYPES = new Set(["traffic", "accident"]);

const centralAlerts = [
  // Centro de Abancay
  { type: "traffic",    coords: [-13.6355, -72.8825],    title: "Atasco",                                detail: "Congestión simulada cerca del centro." },
  { type: "traffic",    coords: [-13.6369, -72.8801],    title: "Tráfico lento",                         detail: "Flujo denso en vía principal." },
  { type: "traffic",    coords: [-13.6338, -72.8786],    title: "Paraderos cargados",                    detail: "Vehículos detenidos por varios minutos." },
  { type: "accident",   coords: [-13.6382, -72.8846],    title: "Accidente leve",                        detail: "Choque menor reportado, carril lento." },
  { type: "danger",     coords: [-13.6326, -72.8837],    title: "Zona de riesgo",                        detail: "Evitar detenerse en calles laterales." },
  { type: "traffic",    coords: [-13.6410, -72.8773],    title: "Atasco",                                detail: "Entrada al terminal con tránsito pesado." },
  { type: "accident",   coords: [-13.6316, -72.8804],    title: "Accidente reportado",                   detail: "Intervencion visual de referencia." },
  { type: "traffic",    coords: [-13.6395, -72.8902],    title: "Tráfico pesado",                        detail: "Retención cerca de acceso principal." },
  { type: "traffic",    coords: [-13.6298, -72.8758],    title: "Congestión",                            detail: "Flujo lento por cruce cargado." },
  { type: "accident",   coords: [-13.6426, -72.8818],    title: "Incidente vial",                        detail: "Carril reducido temporalmente." },
  { type: "control",    coords: [-13.6348, -72.8810],    title: "Punto de apoyo",                        detail: "Serenazgo y municipalidad cercanos." },
  { type: "health",     coords: [-13.6396, -72.8874],    title: "Centro de salud",                       detail: "Referencia visual para emergencias." },
  { type: "health",     coords: [-13.6322, -72.8789],    title: "Posta médica",                          detail: "Punto informativo cercano." },
  { type: "fuel",       coords: [-13.6376, -72.8795],    title: "Gasolinera",                            detail: "Referencia visual de abastecimiento." },
  { type: "fuel",       coords: [-13.6308, -72.8855],    title: "Grifo",                                 detail: "Punto informativo de combustible." },
  { type: "fuel",       coords: [-13.6420, -72.8754],    title: "Gasolinera",                            detail: "Referencia cerca del terminal." },
  { type: "health",     coords: [-13.641833, -72.896801], title: "Hospital II EsSalud Abancay",          detail: "Centro de salud de referencia en la ciudad." },
  // UNAMBA y alrededores
  { type: "university", coords: [-13.617414, -72.866708], title: "Universidad Nacional Micaela Bastidas", detail: "Punto de referencia principal." },
  { type: "health",     coords: [-13.616700, -72.865900], title: "Hospital Universitario",               detail: "Centro de atención médica de emergencia." },
  { type: "control",    coords: [-13.615900, -72.867000], title: "Comisaría Central",                    detail: "Punto de apoyo policial." },
  { type: "traffic",    coords: [-13.617800, -72.866100], title: "Congestión Vehicular",                 detail: "Flujo lento por alta demanda." },
  { type: "fuel",       coords: [-13.617900, -72.864900], title: "Grifo Universitario",                  detail: "Abastecimiento de combustible." },
  // Norte
  { type: "fire",       coords: [-13.611500, -72.861200], title: "Estación de Bomberos N°1",             detail: "Respuesta rápida ante incendios." },
  { type: "danger",     coords: [-13.610800, -72.864500], title: "Zona de Riesgo",                       detail: "Curva con poca visibilidad." },
  // Sur
  { type: "health",     coords: [-13.623400, -72.869800], title: "Posta Médica Sur",                     detail: "Atención primaria y primeros auxilios." },
  { type: "traffic",    coords: [-13.624200, -72.867300], title: "Tráfico Pesado",                       detail: "Retención temporal de vehículos." },
  // Este
  { type: "control",    coords: [-13.618600, -72.858900], title: "Puesto de Seguridad",                  detail: "Patrullaje permanente." },
  { type: "accident",   coords: [-13.620100, -72.860300], title: "Accidente Reportado",                  detail: "Choque leve con reducción de carril." },
  // Oeste
  { type: "fire",       coords: [-13.619200, -72.874800], title: "Unidad de Rescate",                    detail: "Atención de emergencias y rescate." },
  { type: "fuel",       coords: [-13.614000, -72.873500], title: "Estación Sur",                         detail: "Punto de abastecimiento cercano." }
];

function showScreen(target) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === `${target}-screen`);
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === target);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (target === "home" && safeRouteMap) {
    setTimeout(() => safeRouteMap.invalidateSize(), 260);
  }
}

function openModal(title, text, danger = false) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  document.getElementById("confirmModal").classList.toggle("danger-button", danger);
  modalBackdrop.classList.add("visible");
}

function closeModal() {
  modalBackdrop.classList.remove("visible");
}

targetButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.target));
});

function buildMapIcon(type) {
  const icons = {
    start: "fa-location-arrow",
    end: "fa-flag-checkered",
    danger: "fa-triangle-exclamation",
    traffic: "fa-car-burst",
    accident: "fa-car-burst",
    control: "fa-building-shield",
    fuel: "fa-gas-pump",
    health: "fa-kit-medical",
    university: "fa-graduation-cap",
    fire: "fa-fire-extinguisher"
  };

  return L.divIcon({
    className: "",
    html: `<span class="map-pin ${type}"><i class="fa-solid ${icons[type]}"></i></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16]
  });
}

function buildUserLocationIcon() {
  return L.divIcon({
    className: "",
    html: '<span class="user-location-dot"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function toLatLng(coords) {
  return Array.isArray(coords) ? L.latLng(coords[0], coords[1]) : L.latLng(coords.lat, coords.lng);
}

function distanceKm(a, b) {
  const first = toLatLng(a);
  const second = toLatLng(b);
  const toRad = (value) => (value * Math.PI) / 180;
  const latDistance = toRad(second.lat - first.lat);
  const lngDistance = toRad(second.lng - first.lng);
  const lat1 = toRad(first.lat);
  const lat2 = toRad(second.lat);
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDistance / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function pointToSegmentDistanceKm(point, start, end) {
  const pointLatLng = toLatLng(point);
  const startLatLng = toLatLng(start);
  const endLatLng = toLatLng(end);
  const x = pointLatLng.lng;
  const y = pointLatLng.lat;
  const x1 = startLatLng.lng;
  const y1 = startLatLng.lat;
  const x2 = endLatLng.lng;
  const y2 = endLatLng.lat;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const projection = length ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length)) : 0;

  return distanceKm(pointLatLng, [y1 + projection * dy, x1 + projection * dx]);
}

function isTrafficAlert(point) {
  return ALERT_TYPES.has(point.type);
}

function getNearbyAlerts(origin) {
  return centralAlerts.filter((alert) => isTrafficAlert(alert) && distanceKm(origin, alert.coords) <= NEARBY_ALERT_RADIUS_KM);
}

function getRouteAlerts(origin, routePath) {
  return centralAlerts.filter((alert) => {
    if (!isTrafficAlert(alert)) return false;

    const closeToRoute = routePath.some((point, index) => {
      if (index === routePath.length - 1) return false;
      return pointToSegmentDistanceKm(alert.coords, point, routePath[index + 1]) <= ROUTE_ALERT_RADIUS_KM;
    });
    const closeToUser = distanceKm(origin, alert.coords) <= NEARBY_ALERT_RADIUS_KM;
    return closeToRoute || closeToUser;
  });
}

function snapCoordinate(value, grid = 0.0012) {
  return Math.round(value / grid) * grid;
}

function buildStreetLikeRoute(origin, destination) {
  const start = toLatLng(origin);
  const end = toLatLng(destination);
  const midLat = snapCoordinate((start.lat + end.lat) / 2);
  const midLng = snapCoordinate((start.lng + end.lng) / 2);

  return [
    [start.lat, start.lng],
    [start.lat, midLng],
    [midLat, midLng],
    [midLat, end.lng],
    [end.lat, end.lng]
  ];
}

function getRiskLabel(alertCount) {
  if (alertCount >= 5) return "Alto";
  if (alertCount >= 3) return "Medio";
  return "Bajo";
}

function estimateRouteMinutes(distance) {
  return Math.max(3, Math.round((distance / 22) * 60));
}

function updateUserPosition(coords, sourceText) {
  if (!safeRouteMap || typeof L === "undefined") return;

  currentOrigin = coords;

  if (userLocationMarker) safeRouteMap.removeLayer(userLocationMarker);

  userLocationMarker = L.marker(coords, {
    icon: buildUserLocationIcon(),
    zIndexOffset: 1000
  })
    .bindPopup(`<strong>Tu ubicación</strong>${sourceText}`)
    .addTo(safeRouteMap);

  safeRouteMap.setView(coords, 14);
  const nearbyAlerts = getNearbyAlerts(coords).length;
  routeStatus.textContent = `Ubicación activa · ${nearbyAlerts} alertas cercanas`;

  if (!destinationMarker) {
    routeSummary.classList.add("is-hidden");
  }
}

function useSimulatedOrigin() {
  updateUserPosition(SIMULATED_ORIGIN, "Posición simulada para el boceto en Abancay");
}

function requestUserLocation(showPermissionModal = false) {
  if (!navigator.geolocation || !safeRouteMap || typeof L === "undefined") {
    useSimulatedOrigin();
    if (showPermissionModal) {
      openModal("Ubicación simulada", "Este boceto usará una posición de referencia en Abancay.");
    }
    return;
  }

  routeStatus.textContent = "Buscando tu ubicación...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateUserPosition(
        [position.coords.latitude, position.coords.longitude],
        "Posición detectada por el navegador"
      );
    },
    () => {
      useSimulatedOrigin();
      if (showPermissionModal) {
        openModal("Permiso de ubicación", "No se pudo activar el GPS. Se muestra una ubicación simulada en Abancay para continuar el boceto.");
      }
    },
    { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
  );
}

function renderReferenceMarkers() {
  if (!safeRouteMap || typeof L === "undefined") return;

  if (referenceLayer) safeRouteMap.removeLayer(referenceLayer);
  referenceLayer = L.layerGroup().addTo(safeRouteMap);

  centralAlerts.forEach((alert) => {
    L.marker(alert.coords, { icon: buildMapIcon(alert.type) })
      .bindPopup(`<strong>${alert.title}</strong>${alert.detail}`)
      .addTo(referenceLayer);
  });
}

function drawDestinationRoute(destination) {
  if (!safeRouteMap || !currentOrigin || typeof L === "undefined") return;

  if (routeLayer) safeRouteMap.removeLayer(routeLayer);
  if (destinationMarker) safeRouteMap.removeLayer(destinationMarker);

  const routePath = buildStreetLikeRoute(currentOrigin, destination);
  const routeAlerts = getRouteAlerts(currentOrigin, routePath);
  const distance = distanceKm(currentOrigin, destination);
  const minutes = estimateRouteMinutes(distance);

  routeLayer = L.layerGroup().addTo(safeRouteMap);

  L.polyline(routePath, {
    color: "#0f766e",
    weight: 7,
    opacity: 0.96,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(routeLayer);

  L.polyline(routePath, {
    color: "#ffffff",
    weight: 2,
    opacity: 0.9,
    dashArray: "8 12"
  }).addTo(routeLayer);

  destinationMarker = L.marker(destination, {
    icon: buildMapIcon("end"),
    zIndexOffset: 900
  })
    .bindPopup("<strong>Destino</strong>Punto elegido en el mapa")
    .addTo(safeRouteMap);

  routeStatus.textContent = "Destino marcado · ruta visual generada";
  routeTime.textContent = `${minutes} min`;
  routeRisk.textContent = getRiskLabel(routeAlerts.length);
  routeAlerts.textContent = routeAlerts.length;
  routeSummary.classList.remove("is-hidden");
  safeRouteMap.fitBounds(routePath, { padding: [72, 72], maxZoom: 16 });
}

function enterDestinationMode() {
  const mapShell = document.querySelector(".real-map");
  if (!safeRouteMap || !mapShell) return;

  if (!currentOrigin) useSimulatedOrigin();

  selectingDestination = true;
  document.body.classList.add("map-fullscreen");
  mapShell.classList.add("destination-selecting");
  routeStatus.textContent = "Toca el mapa para seleccionar destino";
  setTimeout(() => {
    safeRouteMap.invalidateSize();
    safeRouteMap.setView(currentOrigin || ABANCAY_CENTER, 15);
  }, 120);
}

function exitDestinationMode() {
  const mapShell = document.querySelector(".real-map");
  selectingDestination = false;
  document.body.classList.remove("map-fullscreen");
  mapShell?.classList.remove("destination-selecting");

  if (!destinationMarker && currentOrigin) {
    const nearbyAlerts = getNearbyAlerts(currentOrigin).length;
    routeStatus.textContent = `Ubicación activa · ${nearbyAlerts} alertas cercanas`;
  }

  if (safeRouteMap) {
    setTimeout(() => safeRouteMap.invalidateSize(), 120);
  }
}

function initSafeRouteMap() {
  const mapElement = document.getElementById("safeRouteMap");
  if (!mapElement || typeof L === "undefined") {
    routeStatus.textContent = "Mapa no disponible. Revisa la conexión.";
    return;
  }

  safeRouteMap = L.map(mapElement, {
    zoomControl: true,
    attributionControl: false,
    dragging: true,
    tap: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(safeRouteMap);

  safeRouteMap.setView(ABANCAY_CENTER, 14);
  renderReferenceMarkers();
  requestUserLocation(false);

  safeRouteMap.on("click", (event) => {
    if (!selectingDestination) return;
    drawDestinationRoute(event.latlng);
    exitDestinationMode();
  });

  setTimeout(() => safeRouteMap.invalidateSize(), 300);
}

function clearDestination() {
  if (routeLayer) { safeRouteMap.removeLayer(routeLayer); routeLayer = null; }
  if (destinationMarker) { safeRouteMap.removeLayer(destinationMarker); destinationMarker = null; }
  routeSummary.classList.add("is-hidden");
  const nearbyAlerts = currentOrigin ? getNearbyAlerts(currentOrigin).length : 0;
  routeStatus.textContent = currentOrigin
    ? `Ubicación activa · ${nearbyAlerts} alertas cercanas`
    : "Detectando tu ubicación...";
}

function openDestinationMenu() {
  const menu = document.getElementById("destinationMenu");
  if (menu) menu.classList.add("visible");
}

function closeDestinationMenu() {
  const menu = document.getElementById("destinationMenu");
  if (menu) menu.classList.remove("visible");
}

document.getElementById("destMenuDelete")?.addEventListener("click", () => {
  clearDestination();
  closeDestinationMenu();
});

document.getElementById("destMenuCancel")?.addEventListener("click", () => {
  closeDestinationMenu();
});

document.getElementById("destMenuAccept")?.addEventListener("click", () => {
  closeDestinationMenu();
  clearDestination();
  enterDestinationMode();
});

focusDestination?.addEventListener("click", () => {
  if (destinationMarker) {
    openDestinationMenu();
  } else {
    enterDestinationMode();
  }
});
closeDestinationMode?.addEventListener("click", exitDestinationMode);
locateUser?.addEventListener("click", () => requestUserLocation(true));

document.getElementById("scanButton").addEventListener("click", () => {
  const plate = (plateInput.value || "ABC-123").trim().toUpperCase();
  const vehicle = vehicles[plate] || {
    model: "Vehículo no registrado · Datos comunitarios limitados",
    risk: "Sin historial"
  };

  profilePlate.textContent = plate;
  profileModel.textContent = vehicle.model;
  vehicleProfile.querySelector(".risk-badge").textContent = vehicle.risk;
  vehicleProfile.classList.add("visible");
  vehicleProfile.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("sosButton").addEventListener("click", () => {
  openModal(
    "🚨 Llamar a la Policía",
    "Se compartirá tu ubicación GPS con la Policía Nacional (105). ¿Confirmas la llamada de emergencia?",
    true
  );
  document.getElementById("confirmModal").onclick = () => {
    closeModal();
    startSimulatedCall();
  };
  document.getElementById("closeModal").onclick = closeModal;
});

function startSimulatedCall() {
  const callScreen = document.getElementById("callScreen");
  const callStatus = document.getElementById("callStatus");
  const callTimer  = document.getElementById("callTimer");
  const callEndBtn = document.getElementById("callEndBtn");

  callScreen.setAttribute("aria-hidden", "false");
  callScreen.classList.add("active");
  callStatus.textContent = "Llamando...";
  callTimer.textContent  = "";

  let seconds = 0;
  let timerInterval = null;

  // Simular que contesta a los 3 segundos
  const connectTimeout = setTimeout(() => {
    callStatus.textContent = "En llamada";
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      callTimer.textContent = `${m}:${s}`;
    }, 1000);
  }, 3000);

  function endCall() {
    clearTimeout(connectTimeout);
    clearInterval(timerInterval);
    callScreen.classList.remove("active");
    callScreen.setAttribute("aria-hidden", "true");
    callStatus.textContent = "Llamando...";
    callTimer.textContent  = "";
    seconds = 0;
  }

  callEndBtn.onclick = endCall;
  // También cerrar tocando fuera (fondo)
  callScreen.onclick = (e) => { if (e.target === callScreen || e.target.classList.contains("call-bg")) endCall(); };
}

document.getElementById("complaintButton").addEventListener("click", () => {
  openModal("Queja registrada", "Tu reporte quedaría pendiente de validación por la comunidad vial.");
});

document.getElementById("rateButton").addEventListener("click", () => {
  openModal("Valoración enviada", "Gracias por ayudar a construir una reputación vial más confiable.");
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("confirmModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showInstallBanner() {
  if (!installBanner || localStorage.getItem("tranquicar-install-dismissed") === "true") return;
  if (isStandaloneApp() || !isMobileDevice()) return;

  if (isIOSDevice() && !deferredInstallPrompt) {
    installButton.textContent = "Cómo";
    installText.textContent = "En iPhone: compartir y luego Agregar a pantalla de inicio.";
  }

  installBanner.classList.add("visible");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallBanner();
});

installButton?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    openModal(
      "Instalar en iPhone",
      "Toca el botón Compartir de Safari y elige Agregar a pantalla de inicio. Al abrirla desde ahí, Tranquicar se verá sin la barra del navegador."
    );
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBanner.classList.remove("visible");
});

dismissInstall?.addEventListener("click", () => {
  localStorage.setItem("tranquicar-install-dismissed", "true");
  installBanner.classList.remove("visible");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBanner?.classList.remove("visible");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

initSafeRouteMap();
setTimeout(showInstallBanner, 1200);

// ── Weather sheet ──
const weatherPillBtn  = document.getElementById("weatherPillBtn");
const weatherSheet    = document.getElementById("weatherSheet");
const weatherBackdrop = document.getElementById("weatherBackdrop");
const weatherCloseBtn = document.getElementById("weatherCloseBtn");

function openWeatherSheet() {
  weatherSheet.classList.add("open");
  weatherBackdrop.classList.add("visible");
  weatherSheet.setAttribute("aria-hidden", "false");
  weatherBackdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeWeatherSheet() {
  weatherSheet.classList.remove("open");
  weatherBackdrop.classList.remove("visible");
  weatherSheet.setAttribute("aria-hidden", "true");
  weatherBackdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

weatherPillBtn?.addEventListener("click", openWeatherSheet);
weatherCloseBtn?.addEventListener("click", closeWeatherSheet);
weatherBackdrop?.addEventListener("click", closeWeatherSheet);

// Swipe down to close
let touchStartY = 0;
weatherSheet?.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });
weatherSheet?.addEventListener("touchend", (e) => {
  if (e.changedTouches[0].clientY - touchStartY > 80) closeWeatherSheet();
}, { passive: true });

// ── Alerts filter ──
document.querySelectorAll(".alert-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".alert-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    document.querySelectorAll(".alert-item").forEach((item) => {
      const match = filter === "all" || item.dataset.alertType === filter;
      item.style.display = match ? "" : "none";
    });
  });
});

// ── News tabs ──
const newsList = document.querySelector(".news-list");
const personalSection = document.getElementById("personalSection");

document.querySelectorAll(".news-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".news-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const filter = tab.dataset.news;

    if (filter === "personal") {
      newsList.style.display = "none";
      personalSection.style.display = "grid";
    } else {
      newsList.style.display = "";
      personalSection.style.display = "none";
      document.querySelectorAll(".news-card").forEach((card) => {
        const type = card.dataset.newsType;
        const match = filter === "all" || type === filter || (!type && filter === "all");
        card.style.display = match ? "" : "none";
      });
    }
  });
});

// ── Fuel sheet ──
const fuelTileBtn  = document.getElementById("fuelTileBtn");
const fuelSheet    = document.getElementById("fuelSheet");
const fuelBackdrop = document.getElementById("fuelBackdrop");
const fuelCloseBtn = document.getElementById("fuelCloseBtn");

function openFuelSheet() {
  fuelSheet.classList.add("open");
  fuelBackdrop.classList.add("visible");
  fuelSheet.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeFuelSheet() {
  fuelSheet.classList.remove("open");
  fuelBackdrop.classList.remove("visible");
  fuelSheet.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

fuelTileBtn?.addEventListener("click", openFuelSheet);
fuelCloseBtn?.addEventListener("click", closeFuelSheet);
fuelBackdrop?.addEventListener("click", closeFuelSheet);

let fuelTouchStartY = 0;
fuelSheet?.addEventListener("touchstart", (e) => {
  fuelTouchStartY = e.touches[0].clientY;
}, { passive: true });
fuelSheet?.addEventListener("touchend", (e) => {
  if (e.changedTouches[0].clientY - fuelTouchStartY > 80) closeFuelSheet();
}, { passive: true });