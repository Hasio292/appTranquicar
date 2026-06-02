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
    let deferredInstallPrompt = null;

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

    function showScreen(target) {
      screens.forEach((screen) => {
        screen.classList.toggle("active", screen.id === `${target}-screen`);
      });

      navItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.target === target);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
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

    setTimeout(showInstallBanner, 1200);
