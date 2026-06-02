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
    const recalculateRoute = document.getElementById("recalculateRoute");
    const routeStatus = document.getElementById("routeStatus");
    const routeTime = document.getElementById("routeTime");
    const routeRisk = document.getElementById("routeRisk");
    const routeAlerts = document.getElementById("routeAlerts");
    const locateUser = document.getElementById("locateUser");
    let deferredInstallPrompt = null;
    let safeRouteMap = null;
    let safeRouteLayer = null;
    let userLocationMarker = null;
    let safeRouteIndex = 0;

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

    const safeRoutes = [
      {
        name: "Centro de Lima → Miraflores",
        time: "24 min",
        risk: "Bajo",
        alerts: 3,
        color: "#0f766e",
        path: [
          [-12.0464, -77.0428],
          [-12.0561, -77.0401],
          [-12.0666, -77.0373],
          [-12.0792, -77.0369],
          [-12.0957, -77.0362],
          [-12.1119, -77.0336],
          [-12.1217, -77.0298]
        ],
        alertsData: [
          { type: "danger", coords: [-12.0621, -77.0392], title: "Zona peligrosa", detail: "Reportes recientes cerca de Av. Arequipa." },
          { type: "traffic", coords: [-12.0858, -77.0371], title: "Tráfico intenso", detail: "Congestión media. Ruta evita el tramo crítico." },
          { type: "control", coords: [-12.1062, -77.0345], title: "Punto de apoyo", detail: "Municipalidad y serenazgo cercanos." }
        ]
      },
      {
        name: "San Isidro → Barranco",
        time: "18 min",
        risk: "Medio",
        alerts: 4,
        color: "#2563eb",
        path: [
          [-12.0971, -77.0365],
          [-12.1047, -77.0368],
          [-12.1144, -77.0374],
          [-12.1265, -77.0332],
          [-12.1357, -77.0258],
          [-12.1434, -77.0219]
        ],
        alertsData: [
          { type: "traffic", coords: [-12.1082, -77.0372], title: "Accidente reportado", detail: "Carril derecho con avance lento." },
          { type: "danger", coords: [-12.1308, -77.0305], title: "Zona de riesgo", detail: "Evitar detenerse en calles laterales." },
          { type: "control", coords: [-12.1392, -77.0238], title: "Apoyo cercano", detail: "Bomberos a menos de 1 km." }
        ]
      },
      {
        name: "La Molina → Surco",
        time: "31 min",
        risk: "Bajo",
        alerts: 2,
        color: "#16a34a",
        path: [
          [-12.0879, -76.9636],
          [-12.0912, -76.9784],
          [-12.0969, -76.9943],
          [-12.1044, -77.0069],
          [-12.1191, -77.0136],
          [-12.1297, -77.0183]
        ],
        alertsData: [
          { type: "traffic", coords: [-12.0988, -76.9974], title: "Tránsito moderado", detail: "Flujo estable, mantener distancia." },
          { type: "control", coords: [-12.1221, -77.0148], title: "Punto municipal", detail: "Canal de apoyo habilitado." }
        ]
      }
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
        control: "fa-building-shield"
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

    function renderSafeRoute(index) {
      if (!safeRouteMap || typeof L === "undefined") return;

      const route = safeRoutes[index];
      if (safeRouteLayer) safeRouteMap.removeLayer(safeRouteLayer);

      safeRouteLayer = L.layerGroup().addTo(safeRouteMap);
      L.polyline(route.path, {
        color: route.color,
        weight: 7,
        opacity: 0.96,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(safeRouteLayer);

      L.polyline(route.path, {
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        dashArray: "8 12"
      }).addTo(safeRouteLayer);

      L.marker(route.path[0], { icon: buildMapIcon("start") })
        .bindPopup("<strong>Inicio</strong>Ubicación actual simulada")
        .addTo(safeRouteLayer);

      L.marker(route.path[route.path.length - 1], { icon: buildMapIcon("end") })
        .bindPopup("<strong>Destino</strong>Ruta recomendada por menor riesgo")
        .addTo(safeRouteLayer);

      route.alertsData.forEach((alert) => {
        L.marker(alert.coords, { icon: buildMapIcon(alert.type) })
          .bindPopup(`<strong>${alert.title}</strong>${alert.detail}`)
          .addTo(safeRouteLayer);
      });

      routeStatus.textContent = route.name;
      routeTime.textContent = route.time;
      routeRisk.textContent = route.risk;
      routeAlerts.textContent = route.alerts;
      safeRouteMap.fitBounds(route.path, { padding: [44, 44], maxZoom: 13 });
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

      renderSafeRoute(safeRouteIndex);
      setTimeout(() => safeRouteMap.invalidateSize(), 300);
    }

    recalculateRoute?.addEventListener("click", () => {
      safeRouteIndex = (safeRouteIndex + 1) % safeRoutes.length;
      renderSafeRoute(safeRouteIndex);
      openModal(
        "Ruta segura recalculada",
        `Nueva ruta recomendada: ${safeRoutes[safeRouteIndex].name}. Se priorizó menor exposición a zonas peligrosas y apoyo cercano.`
      );
    });

    locateUser?.addEventListener("click", () => {
      if (!navigator.geolocation || !safeRouteMap || typeof L === "undefined") {
        openModal("Ubicación no disponible", "Tu navegador no permite geolocalización en este momento.");
        return;
      }

      routeStatus.textContent = "Buscando tu ubicación...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          if (userLocationMarker) safeRouteMap.removeLayer(userLocationMarker);

          userLocationMarker = L.marker(coords, { icon: buildUserLocationIcon(), zIndexOffset: 1000 })
            .bindPopup("<strong>Tu ubicación</strong>Posición detectada por el navegador")
            .addTo(safeRouteMap);

          safeRouteMap.setView(coords, 15);
          routeStatus.textContent = "Tu ubicación actual detectada";
        },
        () => {
          routeStatus.textContent = safeRoutes[safeRouteIndex].name;
          openModal("Permiso de ubicación", "Activa el permiso de ubicación del navegador para ver tu posición en el mapa.");
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
      );
    });

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
        "SOS inmediato activado",
        "Se enviaría tu ubicación al centro de control y se contactaría a policía, bomberos o municipalidad según la emergencia.",
        true
      );
    });

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
