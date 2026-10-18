/**
 * Service de gestion PWA (Progressive Web App) pour NORA
 * Prise en charge d'Android, PC/Mac et iPhone (iOS Safari)
 */

export class PwaService {
  constructor() {
    this.deferredPrompt = null;
    this.isIos = this.detectIos();
    this.isStandalone = this.detectStandalone();
    this.callbacks = [];

    this.registerServiceWorker();
    this.initInstallPromptListener();
  }

  detectIos() {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  detectStandalone() {
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  isInstallable() {
    if (this.isStandalone) return false;
    // Sur iOS, l'installation est toujours possible via le menu Partager Safari
    if (this.isIos) return true;
    // Sur Android / Desktop, dépend de l'événement beforeinstallprompt
    return Boolean(this.deferredPrompt);
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        const swUrl = new URL('./sw.js', window.location.href).href;
        navigator.serviceWorker.register(swUrl)
          .then((reg) => {
            console.log('NORA PWA ServiceWorker enregistré avec succès:', reg.scope);
          })
          .catch((err) => {
            console.warn('Erreur enregistrement ServiceWorker:', err);
          });
      });
    }
  }

  initInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Empêche la mini-bannière par défaut de Chrome
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
      console.log('NORA PWA a été installée avec succès !');
      this.notifyListeners();
    });
  }

  onInstallStateChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  notifyListeners() {
    this.callbacks.forEach((cb) => {
      try { cb({ isInstallable: this.isInstallable(), isIos: this.isIos, isStandalone: this.isStandalone }); } catch (e) {}
    });
  }

  /**
   * Déclenche le flux d'installation de l'application
   * @param {Function} showIosInstructionsModal Fonction d'affichage du guide iPhone
   */
  async promptInstall(showIosInstructionsModal) {
    if (this.isStandalone) {
      alert('NORA est déjà installée sur cet appareil.');
      return;
    }

    // Cas iPhone / iOS : Safari ne supporte pas prompt() automatique, on ouvre le guide illustré
    if (this.isIos) {
      if (typeof showIosInstructionsModal === 'function') {
        showIosInstructionsModal();
      } else {
        alert("Pour installer NORA sur votre iPhone :\n1. Touchez l'icône Partager en bas de Safari (carré avec flèche vers le haut)\n2. Faites défiler vers le bas et touchez 'Sur l'écran d'accueil'\n3. Touchez 'Ajouter' en haut à droite.");
      }
      return;
    }

    // Cas Android / Chrome / Edge / Windows / Mac
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('Utilisateur a accepté l\'installation de NORA');
        }
        this.deferredPrompt = null;
        this.notifyListeners();
      } catch (err) {
        console.warn('Erreur prompt install:', err);
      }
    } else {
      if (typeof showIosInstructionsModal === 'function') {
        showIosInstructionsModal();
      } else {
        alert("Pour installer l'application sur votre appareil :\nOuvrez le menu de votre navigateur (trois points) puis cliquez sur 'Installer NORA' ou 'Ajouter à l'écran d'accueil'.");
      }
    }
  }
}

export const pwaService = new PwaService();
