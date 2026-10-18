import { authService } from './services/authService.js';

class NoraSignupApp {
  constructor() {
    this.isSignupMode = true;

    this.cacheDom();
    this.bindEvents();
    this.checkExistingSession();
  }

  cacheDom() {
    this.layoutContainer = document.getElementById('signupLayoutContainer');
    this.signupForm = document.getElementById('signupForm');
    this.formMainTitle = document.getElementById('formMainTitle');
    this.formMainSubtitle = document.getElementById('formMainSubtitle');
    this.signupAlert = document.getElementById('signupAlert');

    // Fields
    this.rowNames = document.getElementById('rowNames');
    this.inputFirstName = document.getElementById('inputFirstName');
    this.inputLastName = document.getElementById('inputLastName');
    this.inputEmail = document.getElementById('inputEmail');
    this.inputPassword = document.getElementById('inputPassword');
    this.inputConfirmPassword = document.getElementById('inputConfirmPassword');
    this.groupConfirmPassword = document.getElementById('groupConfirmPassword');
    this.rowTerms = document.getElementById('rowTerms');
    this.checkTerms = document.getElementById('checkTerms');

    // Toggles & Buttons
    this.btnTogglePassword = document.getElementById('btnTogglePassword');
    this.btnToggleConfirmPassword = document.getElementById('btnToggleConfirmPassword');
    this.btnSubmitSignup = document.getElementById('btnSubmitSignup');
    this.btnSubmitIcon = document.getElementById('btnSubmitIcon');
    this.btnSubmitLabel = document.getElementById('btnSubmitLabel');
    this.btnToggleAuthMode = document.getElementById('btnToggleAuthMode');
    this.switchPromptText = document.getElementById('switchPromptText');

    // Password strength
    this.passwordStrengthBox = document.getElementById('passwordStrengthBox');
    this.strBar1 = document.getElementById('strBar1');
    this.strBar2 = document.getElementById('strBar2');
    this.strBar3 = document.getElementById('strBar3');
    this.strengthLabelText = document.getElementById('strengthLabelText');

    // Detect URL param for direct login mode (e.g. ?mode=signin or ?mode=login)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signin' || mode === 'login') {
      this.toggleAuthMode();
    }
  }

  bindEvents() {
    // Password visibility toggle
    if (this.btnTogglePassword) {
      this.btnTogglePassword.addEventListener('click', () => {
        const isPass = this.inputPassword.type === 'password';
        this.inputPassword.type = isPass ? 'text' : 'password';
        this.btnTogglePassword.innerHTML = `<i class="fa-solid fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
      });
    }

    if (this.btnToggleConfirmPassword) {
      this.btnToggleConfirmPassword.addEventListener('click', () => {
        const isPass = this.inputConfirmPassword.type === 'password';
        this.inputConfirmPassword.type = isPass ? 'text' : 'password';
        this.btnToggleConfirmPassword.innerHTML = `<i class="fa-solid fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
      });
    }

    // Password strength evaluator
    if (this.inputPassword) {
      this.inputPassword.addEventListener('input', () => this.evaluatePasswordStrength());
    }

    // Toggle between Sign Up and Sign In mode
    if (this.btnToggleAuthMode) {
      this.btnToggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthMode();
      });
    }

    // Form submit
    if (this.signupForm) {
      this.signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  checkExistingSession() {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      this.showAlert('success', `Vous êtes déjà connecté en tant que ${user.name || user.email}. Redirection vers NORA...`);
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1200);
    }
  }

  toggleAuthMode() {
    this.isSignupMode = !this.isSignupMode;
    this.hideAlert();

    if (this.isSignupMode) {
      // Mode Inscription
      document.title = 'Créer un compte — NORA AI & Supabase Cloud';
      this.layoutContainer.classList.remove('signin-mode-active');
      this.formMainTitle.textContent = 'Création de compte';
      this.formMainSubtitle.textContent = 'Renseignez vos coordonnées pour créer votre profil Supabase.';
      this.btnSubmitLabel.textContent = 'Créer mon compte NORA';
      this.btnSubmitIcon.className = 'fa-solid fa-user-plus';
      this.switchPromptText.textContent = 'Déjà inscrit sur NORA ?';
      this.btnToggleAuthMode.textContent = 'Se connecter';

      this.rowNames.style.display = 'flex';
      this.groupConfirmPassword.style.display = 'flex';
      this.rowTerms.style.display = 'flex';
      this.passwordStrengthBox.style.display = 'flex';
    } else {
      // Mode Connexion
      document.title = 'Connexion — NORA AI & Supabase Cloud';
      this.layoutContainer.classList.add('signin-mode-active');
      this.formMainTitle.textContent = 'Connexion à votre compte';
      this.formMainSubtitle.textContent = 'Accédez à vos discussions synchronisées et à vos plugins.';
      this.btnSubmitLabel.textContent = 'Se connecter à NORA';
      this.btnSubmitIcon.className = 'fa-solid fa-arrow-right-to-bracket';
      this.switchPromptText.textContent = 'Pas encore de compte ?';
      this.btnToggleAuthMode.textContent = 'Créer un compte';

      this.rowNames.style.display = 'none';
      this.groupConfirmPassword.style.display = 'none';
      this.rowTerms.style.display = 'none';
      this.passwordStrengthBox.style.display = 'none';
    }
  }

  evaluatePasswordStrength() {
    const val = this.inputPassword.value;
    if (!val) {
      this.strBar1.className = 'strength-bar';
      this.strBar2.className = 'strength-bar';
      this.strBar3.className = 'strength-bar';
      this.strengthLabelText.textContent = 'Sécurité';
      return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 9 && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val) && /[A-Z]/.test(val)) score++;

    if (score <= 1) {
      this.strBar1.className = 'strength-bar active-weak';
      this.strBar2.className = 'strength-bar';
      this.strBar3.className = 'strength-bar';
      this.strengthLabelText.textContent = 'Faible';
      this.strengthLabelText.style.color = '#EF4444';
    } else if (score === 2) {
      this.strBar1.className = 'strength-bar active-medium';
      this.strBar2.className = 'strength-bar active-medium';
      this.strBar3.className = 'strength-bar';
      this.strengthLabelText.textContent = 'Moyen';
      this.strengthLabelText.style.color = '#F59E0B';
    } else {
      this.strBar1.className = 'strength-bar active-strong';
      this.strBar2.className = 'strength-bar active-strong';
      this.strBar3.className = 'strength-bar active-strong';
      this.strengthLabelText.textContent = 'Excellent';
      this.strengthLabelText.style.color = '#10B981';
    }
  }

  showAlert(type, message) {
    this.signupAlert.style.display = 'flex';
    this.signupAlert.className = `signup-alert-box ${type}`;
    const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
    this.signupAlert.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${this.escapeHtml(message)}</span>`;
  }

  hideAlert() {
    this.signupAlert.style.display = 'none';
    this.signupAlert.innerHTML = '';
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  formatAuthError(err) {
    const msg = (err && err.message) ? err.message : String(err || '');
    if (msg.includes('already registered') || msg.includes('User already registered') || msg.includes('email address has already been registered')) {
      return 'Un compte existe déjà avec cette adresse email. Vous pouvez cliquer sur "Se connecter".';
    }
    if (msg.includes('Password should be at least') || msg.includes('password is too short')) {
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    }
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
      return 'Adresse e-mail ou mot de passe incorrect.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Veuillez confirmer votre adresse e-mail en cliquant sur le lien reçu dans votre messagerie.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Trop de tentatives rapprochées. Veuillez patienter quelques instants avant de réessayer.';
    }
    if (msg.includes('valid email') || msg.includes('invalid format')) {
      return 'Veuillez saisir une adresse e-mail valide (ex: contact@exemple.com).';
    }
    return msg || 'Une erreur est survenue lors de la communication avec Supabase.';
  }

  async handleSubmit() {
    this.hideAlert();

    const email = this.inputEmail.value.trim();
    const password = this.inputPassword.value.trim();

    if (!email) {
      this.showAlert('error', 'Veuillez saisir votre adresse e-mail.');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showAlert('error', 'Format d\'adresse e-mail invalide (ex: alex.moreau@domaine.com).');
      return;
    }

    if (!password) {
      this.showAlert('error', 'Veuillez saisir votre mot de passe.');
      return;
    }

    if (this.isSignupMode) {
      const firstName = this.inputFirstName.value.trim();
      const lastName = this.inputLastName.value.trim();
      const confirmPassword = this.inputConfirmPassword.value.trim();

      if (!firstName || !lastName) {
        this.showAlert('error', 'Veuillez renseigner votre prénom et votre nom (enregistrés dans la table profiles de Supabase).');
        return;
      }

      if (password.length < 6) {
        this.showAlert('error', 'Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }

      if (password !== confirmPassword) {
        this.showAlert('error', 'Les deux mots de passe ne correspondent pas.');
        return;
      }

      if (this.checkTerms && !this.checkTerms.checked) {
        this.showAlert('error', 'Veuillez accepter les conditions d\'utilisation pour continuer.');
        return;
      }

      // Action Inscription
      this.setLoading(true, 'Création du compte et profil Supabase...');

      try {
        const userProfile = await authService.signUp({
          firstName,
          lastName,
          email,
          password
        });

        this.showAlert('success', `Bienvenue ${userProfile.name} ! Votre compte et votre profil Supabase ont été créés avec succès. Redirection vers NORA...`);

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1200);
      } catch (err) {
        this.showAlert('error', this.formatAuthError(err));
      } finally {
        this.setLoading(false);
      }
    } else {
      // Action Connexion
      this.setLoading(true, 'Connexion en cours...');

      try {
        const userProfile = await authService.signIn({ email, password });
        this.showAlert('success', `Ravi de vous revoir ${userProfile.name || userProfile.email} ! Synchronisation active.`);

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      } catch (err) {
        this.showAlert('error', this.formatAuthError(err));
      } finally {
        this.setLoading(false);
      }
    }
  }

  setLoading(isLoading, text = '') {
    if (isLoading) {
      this.btnSubmitSignup.disabled = true;
      this.btnSubmitSignup.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${text}</span>`;
    } else {
      this.btnSubmitSignup.disabled = false;
      const label = this.isSignupMode ? 'Créer mon compte NORA' : 'Se connecter à NORA';
      const icon = this.isSignupMode ? 'fa-user-plus' : 'fa-arrow-right-to-bracket';
      this.btnSubmitSignup.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${label}</span>`;
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Initialiser l'application d'inscription
document.addEventListener('DOMContentLoaded', () => {
  new NoraSignupApp();

  // Enregistrement PWA Service Worker
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
});
