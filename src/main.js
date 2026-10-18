import { geminiService } from './services/geminiService.js';
import { pluginService, AVAILABLE_PLUGINS } from './services/pluginService.js';
import { authService } from './services/authService.js';
import { pwaService } from './services/pwaService.js';
import { PHOTOGRAPHERS_DATA } from './data/mockData.js';

const STORAGE_KEY_CONVERSATIONS = 'nora_recent_conversations';
const STORAGE_KEY_CUSTOM_CONTEXT = 'nora_custom_context';
const STORAGE_KEY_CUSTOM_TONE = 'nora_custom_tone';
const STORAGE_KEY_FONT_SIZE = 'nora_font_size';

class NoraConversationalApp {
  constructor() {
    this.inChatMode = false;
    this.isGenerating = false;
    this.currentConversationId = null;
    this.conversations = this.loadConversations();
    this.fontSizeOffset = parseInt(localStorage.getItem(STORAGE_KEY_FONT_SIZE) || '0', 10);
    this.activePluginFilter = 'all';
    this.selectedPluginForConfig = null;
    this.activeMode = null; // null | 'image' | 'code' | 'recommendations'

    this.cacheDom();
    this.bindEvents();
    this.updateUserSessionUI();
    this.renderRecentConversations();
    this.updateApiStatusUI();
    this.loadCustomizationSettings();
    this.applyFontSize();
    this.renderPluginsCatalog();
    this.updatePluginsBadge();

    // Subscribe to authentication state changes
    authService.onAuthStateChange(() => {
      this.updateUserSessionUI();
      this.conversations = this.loadConversations();
      this.renderRecentConversations();
    });

    // Auto-prompt API key modal on first load if no key is saved
    if (!geminiService.hasKey()) {
      setTimeout(() => this.openSettingsModal('apikey'), 600);
    }
  }

  cacheDom() {
    this.noraApp = document.getElementById('noraApp');
    this.headerCenter = document.getElementById('headerCenter');
    this.currentModelBadge = document.getElementById('currentModelBadge');

    // Sidebar
    this.btnOpenSidebar = document.getElementById('btnOpenSidebar');
    this.btnCloseSidebar = document.getElementById('btnCloseSidebar');
    this.btnToggleSearchDiscussions = document.getElementById('btnToggleSearchDiscussions');
    this.sidebarSearchContainer = document.getElementById('sidebarSearchContainer');
    this.inputSearchDiscussions = document.getElementById('inputSearchDiscussions');
    this.btnClearSearchDiscussions = document.getElementById('btnClearSearchDiscussions');
    this.sidebarDrawer = document.getElementById('sidebarDrawer');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.btnSidebarNewChat = document.getElementById('btnSidebarNewChat');
    this.btnOpenPlugins = document.getElementById('btnOpenPlugins');
    this.pluginsBadgeCount = document.getElementById('pluginsBadgeCount');
    this.recentChatsList = document.getElementById('recentChatsList');

    // ChatGPT Style Account Components
    this.btnToggleAccountPopover = document.getElementById('btnToggleAccountPopover');
    this.chatgptAccountPopover = document.getElementById('chatgptAccountPopover');
    this.btnUpgradePill = document.getElementById('btnUpgradePill');
    this.popoverUserProfile = document.getElementById('popoverUserProfile');
    this.menuItemUpgrade = document.getElementById('menuItemUpgrade');
    this.menuItemCustomization = document.getElementById('menuItemCustomization');
    this.menuItemSettings = document.getElementById('menuItemSettings');
    this.menuItemHelp = document.getElementById('menuItemHelp');
    this.menuItemLogout = document.getElementById('menuItemLogout');

    // NORA Unified Settings Modal (ChatGPT style)
    this.noraSettingsModal = document.getElementById('noraSettingsModal');
    this.btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
    this.inputFilterSettings = document.getElementById('inputFilterSettings');
    this.settingsTabsList = document.getElementById('settingsTabsList');
    this.inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
    this.btnToggleKeyVisibility = document.getElementById('btnToggleKeyVisibility');
    this.selectGeminiModel = document.getElementById('selectGeminiModel');
    this.keyStatusText = document.getElementById('keyStatusText');
    this.btnUseDemoMode = document.getElementById('btnUseDemoMode');
    this.btnSaveApiKey = document.getElementById('btnSaveApiKey');
    this.customUserContext = document.getElementById('customUserContext');
    this.customTone = document.getElementById('customTone');
    this.btnSaveCustomization = document.getElementById('btnSaveCustomization');
    this.btnSettingsLogout = document.getElementById('btnSettingsLogout');
    this.btnClearAllHistory = document.getElementById('btnClearAllHistory');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontReset = document.getElementById('btnFontReset');

    // Plugins Catalog inside Settings
    this.pluginsCatalogGrid = document.getElementById('pluginsCatalogGrid');
    this.pluginsFilterBar = document.querySelector('.plugins-filter-bar');

    // Plugin Config Modal
    this.pluginConfigModal = document.getElementById('pluginConfigModal');
    this.btnClosePluginModal = document.getElementById('btnClosePluginModal');
    this.btnCancelPluginConfig = document.getElementById('btnCancelPluginConfig');
    this.btnSavePluginConfig = document.getElementById('btnSavePluginConfig');
    this.btnDisconnectPlugin = document.getElementById('btnDisconnectPlugin');
    this.pluginModalName = document.getElementById('pluginModalName');
    this.pluginModalCategory = document.getElementById('pluginModalCategory');
    this.pluginModalIconBadge = document.getElementById('pluginModalIconBadge');
    this.pluginModalDesc = document.getElementById('pluginModalDesc');
    this.pluginDocLink = document.getElementById('pluginDocLink');
    this.pluginConfigForm = document.getElementById('pluginConfigForm');
    this.pluginStatusText = document.getElementById('pluginStatusText');

    // Upgrade Modal
    this.upgradeModal = document.getElementById('upgradeModal');
    this.btnCloseUpgradeModal = document.getElementById('btnCloseUpgradeModal');

    // Hero & Chat
    this.heroView = document.getElementById('heroView');
    this.heroOrbWrapper = document.getElementById('heroOrbWrapper');
    this.noraOrb = document.getElementById('noraOrb');
    this.suggestionsGrid = document.getElementById('suggestionsGrid');

    this.chatStream = document.getElementById('chatStream');
    this.searchForm = document.getElementById('searchForm');
    this.promptInput = document.getElementById('promptInput');
    this.btnSend = document.getElementById('btnSend');

    // Bouton Plus & Popover d'outils
    this.btnInputPlus = document.getElementById('btnInputPlus');
    this.inputActionsPopover = document.getElementById('inputActionsPopover');
    this.actCreateImage = document.getElementById('actCreateImage');
    this.actCreateCode = document.getElementById('actCreateCode');
    this.actRecommendations = document.getElementById('actRecommendations');
    this.actAttachFile = document.getElementById('actAttachFile');
    this.hiddenFileInput = document.getElementById('hiddenFileInput');

    // Badge Mode Actif dans le champ de saisie
    this.activeModeTag = document.getElementById('activeModeTag');
    this.activeModeText = document.getElementById('activeModeText');
    this.activeModeIcon = document.getElementById('activeModeIcon');
    this.btnRemoveActiveMode = document.getElementById('btnRemoveActiveMode');

    // Lightbox Modal Agrandissement d'Image
    this.imageLightboxModal = document.getElementById('imageLightboxModal');
    this.btnCloseLightbox = document.getElementById('btnCloseLightbox');
    this.lightboxImg = document.getElementById('lightboxImg');
    this.lightboxPromptText = document.getElementById('lightboxPromptText');
    this.btnDownloadLightbox = document.getElementById('btnDownloadLightbox');

    // Header API Key Element
    this.btnApiKey = document.getElementById('btnApiKey');
    this.apiStatusDot = document.getElementById('apiStatusDot');
    this.apiStatusText = document.getElementById('apiStatusText');

    // Detail Modal Elements
    this.detailModal = document.getElementById('detailModal');
    this.btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    this.detailModalBody = document.getElementById('detailModalBody');

    // NORA Auth & Account Synchronisation Elements
    this.noraAuthModal = document.getElementById('noraAuthModal');
    this.btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
    this.tabBtnSignIn = document.getElementById('tabBtnSignIn');
    this.tabBtnSignUp = document.getElementById('tabBtnSignUp');
    this.formSignIn = document.getElementById('formSignIn');
    this.formSignUp = document.getElementById('formSignUp');
    this.signInEmail = document.getElementById('signInEmail');
    this.signInPassword = document.getElementById('signInPassword');
    this.btnToggleSignInPassword = document.getElementById('btnToggleSignInPassword');
    this.btnSubmitSignIn = document.getElementById('btnSubmitSignIn');
    this.signInAlert = document.getElementById('signInAlert');
    this.btnSwitchToSignUp = document.getElementById('btnSwitchToSignUp');

    this.signUpFullName = document.getElementById('signUpFullName');
    this.signUpEmail = document.getElementById('signUpEmail');
    this.signUpPassword = document.getElementById('signUpPassword');
    this.btnToggleSignUpPassword = document.getElementById('btnToggleSignUpPassword');
    this.btnSubmitSignUp = document.getElementById('btnSubmitSignUp');
    this.signUpAlert = document.getElementById('signUpAlert');
    this.btnSwitchToSignIn = document.getElementById('btnSwitchToSignIn');

    this.btnToggleCloudConfig = document.getElementById('btnToggleCloudConfig');
    this.cloudConfigDrawer = document.getElementById('cloudConfigDrawer');
    this.cloudConfigChevron = document.getElementById('cloudConfigChevron');
    this.supabaseProjectUrlInput = document.getElementById('supabaseProjectUrlInput');
    this.supabaseApiKeyInput = document.getElementById('supabaseApiKeyInput');
    this.btnSaveCloudConfig = document.getElementById('btnSaveCloudConfig');

    // Dynamic Account & User Session Displays
    this.sidebarTriggerUserName = document.getElementById('sidebarTriggerUserName');
    this.sidebarTriggerAvatar = document.getElementById('sidebarTriggerAvatar');
    this.sidebarTriggerUserPlan = document.getElementById('sidebarTriggerUserPlan');
    this.sidebarPopoverUserName = document.getElementById('sidebarPopoverUserName');
    this.sidebarPopoverAvatar = document.getElementById('sidebarPopoverAvatar');
    this.sidebarPopoverUserPlan = document.getElementById('sidebarPopoverUserPlan');
    this.menuItemAuth = document.getElementById('menuItemAuth');
    this.menuItemAuthLabel = document.getElementById('menuItemAuthLabel');
    this.menuItemLogoutLabel = document.getElementById('menuItemLogoutLabel');

    this.settingsAccountName = document.getElementById('settingsAccountName');
    this.settingsAccountEmail = document.getElementById('settingsAccountEmail');
    this.settingsAccountAvatar = document.getElementById('settingsAccountAvatar');
    this.settingsAccountPlan = document.getElementById('settingsAccountPlan');
    this.btnSettingsOpenAuthModal = document.getElementById('btnSettingsOpenAuthModal');
    this.btnSettingsConfigureSupabase = document.getElementById('btnSettingsConfigureSupabase');
    this.btnHeaderAuth = document.getElementById('btnHeaderAuth');
    this.headerAuthLabel = document.getElementById('headerAuthLabel');
    this.heroTitle = document.getElementById('heroTitle');

    // PWA & iOS Elements
    this.btnInstallPwa = document.getElementById('btnInstallPwa');
    this.iosInstallModal = document.getElementById('iosInstallModal');
    this.btnCloseIosInstall = document.getElementById('btnCloseIosInstall');
    this.btnIosInstallDone = document.getElementById('btnIosInstallDone');
  }

  bindEvents() {
    // Sidebar Drawer toggles
    this.btnOpenSidebar.addEventListener('click', () => this.openSidebar());
    this.btnCloseSidebar.addEventListener('click', () => this.closeSidebar());
    this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    this.btnSidebarNewChat.addEventListener('click', () => {
      this.closeSidebar();
      this.resetConversation();
    });

    // PWA & iPhone Installation listener
    if (this.btnInstallPwa) {
      this.btnInstallPwa.addEventListener('click', () => {
        this.closeSidebar();
        pwaService.promptInstall(() => this.openIosInstallModal());
      });
    }

    if (this.btnCloseIosInstall) {
      this.btnCloseIosInstall.addEventListener('click', () => this.closeIosInstallModal());
    }
    if (this.btnIosInstallDone) {
      this.btnIosInstallDone.addEventListener('click', () => this.closeIosInstallModal());
    }
    if (this.iosInstallModal) {
      this.iosInstallModal.addEventListener('click', (e) => {
        if (e.target === this.iosInstallModal) {
          this.closeIosInstallModal();
        }
      });
    }

    pwaService.onInstallStateChange((state) => {
      if (this.btnInstallPwa && state.isStandalone) {
        this.btnInstallPwa.innerHTML = `
          <div class="btn-install-left">
            <i class="fa-solid fa-circle-check" style="color: #10B981;"></i>
            <span>Application installée</span>
          </div>
          <span class="install-pwa-badge" style="background: #10B981;">Actif</span>
        `;
      }
    });

    // Plugins button in sidebar drawer
    this.btnOpenPlugins.addEventListener('click', () => {
      this.closeSidebar();
      this.openSettingsModal('plugins');
    });

    // Toggle search discussions in sidebar
    this.btnToggleSearchDiscussions.addEventListener('click', () => {
      const isHidden = this.sidebarSearchContainer.style.display === 'none';
      this.sidebarSearchContainer.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) {
        this.inputSearchDiscussions.focus();
      } else {
        this.inputSearchDiscussions.value = '';
        this.renderRecentConversations();
      }
    });

    // Live search filter in discussions
    this.inputSearchDiscussions.addEventListener('input', () => {
      const query = this.inputSearchDiscussions.value.trim().toLowerCase();
      this.btnClearSearchDiscussions.style.display = query ? 'block' : 'none';
      this.renderRecentConversations(query);
    });

    this.btnClearSearchDiscussions.addEventListener('click', () => {
      this.inputSearchDiscussions.value = '';
      this.btnClearSearchDiscussions.style.display = 'none';
      this.renderRecentConversations();
      this.inputSearchDiscussions.focus();
    });

    // ChatGPT Style Account Trigger
    this.btnToggleAccountPopover.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleAccountPopover();
    });

    // Upgrade pill
    this.btnUpgradePill.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAccountPopover();
      this.openUpgradeModal();
    });

    // Popover Menu Items
    if (this.menuItemAuth) {
      this.menuItemAuth.addEventListener('click', () => {
        this.closeAccountPopover();
        this.closeSidebar();
        window.location.href = './signup.html';
      });
    }
    if (this.btnSettingsOpenAuthModal) {
      this.btnSettingsOpenAuthModal.addEventListener('click', () => {
        this.closeSettingsModal();
        window.location.href = './signup.html';
      });
    }
    if (this.popoverUserProfile) {
      this.popoverUserProfile.addEventListener('click', () => {
        this.closeAccountPopover();
        this.closeSidebar();
        this.openSettingsModal('account');
      });
    }
    if (this.menuItemUpgrade) {
      this.menuItemUpgrade.addEventListener('click', () => {
        this.closeAccountPopover();
        this.openUpgradeModal();
      });
    }
    if (this.menuItemCustomization) {
      this.menuItemCustomization.addEventListener('click', () => {
        this.closeAccountPopover();
        this.closeSidebar();
        this.openSettingsModal('customization');
      });
    }
    if (this.menuItemSettings) {
      this.menuItemSettings.addEventListener('click', () => {
        this.closeAccountPopover();
        this.closeSidebar();
        this.openSettingsModal('general');
      });
    }
    if (this.menuItemHelp) {
      this.menuItemHelp.addEventListener('click', () => {
        this.closeAccountPopover();
        window.open('https://aistudio.google.com/app/apikey', '_blank');
      });
    }
    if (this.menuItemLogout) {
      this.menuItemLogout.addEventListener('click', () => {
        this.closeAccountPopover();
        this.handleLogout();
      });
    }

    // Close account popover on outside click
    document.addEventListener('click', (e) => {
      if (!this.chatgptAccountPopover.contains(e.target) && !this.btnToggleAccountPopover.contains(e.target)) {
        this.closeAccountPopover();
      }
    });

    // Settings Modal Tabs
    this.settingsTabsList.addEventListener('click', (e) => {
      const btn = e.target.closest('.settings-tab-btn');
      if (!btn) return;
      const tab = btn.dataset.tab;
      this.switchSettingsTab(tab);
    });

    // Filter settings search box
    this.inputFilterSettings.addEventListener('input', () => {
      const q = this.inputFilterSettings.value.toLowerCase().trim();
      const tabs = this.settingsTabsList.querySelectorAll('.settings-tab-btn');
      tabs.forEach(t => {
        const text = t.textContent.toLowerCase();
        t.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    });

    this.btnCloseSettingsModal.addEventListener('click', () => this.closeSettingsModal());
    this.noraSettingsModal.addEventListener('click', (e) => {
      if (e.target === this.noraSettingsModal) this.closeSettingsModal();
    });

    // Plugins Filter Pills in pane-plugins
    if (this.pluginsFilterBar) {
      this.pluginsFilterBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.plugin-filter-pill');
        if (!pill) return;
        this.pluginsFilterBar.querySelectorAll('.plugin-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activePluginFilter = pill.dataset.filter || 'all';
        this.renderPluginsCatalog();
      });
    }

    // Plugin Config Modal Events
    this.btnClosePluginModal.addEventListener('click', () => this.closePluginConfigModal());
    this.btnCancelPluginConfig.addEventListener('click', () => this.closePluginConfigModal());
    this.pluginConfigModal.addEventListener('click', (e) => {
      if (e.target === this.pluginConfigModal) this.closePluginConfigModal();
    });
    this.btnSavePluginConfig.addEventListener('click', () => this.saveSelectedPluginConfig());
    this.btnDisconnectPlugin.addEventListener('click', () => this.disconnectSelectedPlugin());

    // API Key settings handlers
    this.btnSaveApiKey.addEventListener('click', () => this.saveApiKey());
    this.btnUseDemoMode.addEventListener('click', () => {
      geminiService.setApiKey('');
      this.updateApiStatusUI();
      this.closeSettingsModal();
    });
    this.btnToggleKeyVisibility.addEventListener('click', () => {
      const type = this.inputGeminiApiKey.type === 'password' ? 'text' : 'password';
      this.inputGeminiApiKey.type = type;
      const eyeIcon = this.btnToggleKeyVisibility.querySelector('i');
      if (eyeIcon) {
        eyeIcon.className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
      }
    });

    // Customization & Account Settings
    this.btnSaveCustomization.addEventListener('click', () => this.saveCustomizationSettings());
    this.btnSettingsLogout.addEventListener('click', () => this.handleLogout());

    // Settings Account Tab: Open Auth Modal and Cloud Sync
    if (this.btnSettingsOpenAuthModal) {
      this.btnSettingsOpenAuthModal.addEventListener('click', () => {
        this.closeSettingsModal();
        this.openAuthModal('signin');
      });
    }

    if (this.btnSettingsConfigureSupabase) {
      this.btnSettingsConfigureSupabase.addEventListener('click', () => {
        this.closeSettingsModal();
        this.openAuthModal('signin');
        this.toggleCloudConfigDrawer(true);
      });
    }

    // Auth Modal Close & Backdrop
    if (this.btnCloseAuthModal) {
      this.btnCloseAuthModal.addEventListener('click', () => this.closeAuthModal());
    }
    if (this.noraAuthModal) {
      this.noraAuthModal.addEventListener('click', (e) => {
        if (e.target === this.noraAuthModal) this.closeAuthModal();
      });
    }

    // Tabs inside Auth Modal
    if (this.tabBtnSignIn) {
      this.tabBtnSignIn.addEventListener('click', () => this.switchAuthTab('signin'));
    }
    if (this.tabBtnSignUp) {
      this.tabBtnSignUp.addEventListener('click', () => this.switchAuthTab('signup'));
    }
    if (this.btnSwitchToSignUp) {
      this.btnSwitchToSignUp.addEventListener('click', () => this.switchAuthTab('signup'));
    }
    if (this.btnSwitchToSignIn) {
      this.btnSwitchToSignIn.addEventListener('click', () => this.switchAuthTab('signin'));
    }

    // Password visibility toggles
    if (this.btnToggleSignInPassword) {
      this.btnToggleSignInPassword.addEventListener('click', () => {
        const isPass = this.signInPassword.type === 'password';
        this.signInPassword.type = isPass ? 'text' : 'password';
        this.btnToggleSignInPassword.innerHTML = `<i class="fa-solid fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
      });
    }
    if (this.btnToggleSignUpPassword) {
      this.btnToggleSignUpPassword.addEventListener('click', () => {
        const isPass = this.signUpPassword.type === 'password';
        this.signUpPassword.type = isPass ? 'text' : 'password';
        this.btnToggleSignUpPassword.innerHTML = `<i class="fa-solid fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
      });
    }

    // Auth Form Submissions
    if (this.formSignIn) {
      this.formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignIn();
      });
    }
    if (this.formSignUp) {
      this.formSignUp.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignUp();
      });
    }

    // Cloud Config Drawer & Save
    if (this.btnToggleCloudConfig) {
      this.btnToggleCloudConfig.addEventListener('click', () => this.toggleCloudConfigDrawer());
    }
    if (this.btnSaveCloudConfig) {
      this.btnSaveCloudConfig.addEventListener('click', () => this.handleSaveCloudConfig());
    }

    this.btnClearAllHistory.addEventListener('click', () => {
      if (confirm('Voulez-vous supprimer définitivement tout votre historique de discussions ?')) {
        this.conversations = [];
        this.saveConversations();
        this.renderRecentConversations();
        this.resetConversation();
        alert('Historique effacé.');
      }
    });

    // Font size stepper
    this.btnFontMinus.addEventListener('click', () => this.changeFontSize(-1));
    this.btnFontPlus.addEventListener('click', () => this.changeFontSize(1));
    this.btnFontReset.addEventListener('click', () => {
      this.fontSizeOffset = 0;
      localStorage.setItem(STORAGE_KEY_FONT_SIZE, '0');
      this.applyFontSize();
    });

    // Upgrade modal
    this.btnCloseUpgradeModal.addEventListener('click', () => this.closeUpgradeModal());
    this.upgradeModal.addEventListener('click', (e) => {
      if (e.target === this.upgradeModal) this.closeUpgradeModal();
    });

    // Bouton Plus & Popover d'outils (Créer des images, Créer des codes...)
    if (this.btnInputPlus) {
      this.btnInputPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleInputActionsPopover();
      });
    }

    if (this.actCreateImage) {
      this.actCreateImage.addEventListener('click', () => {
        this.setActiveMode('image');
      });
    }

    if (this.actCreateCode) {
      this.actCreateCode.addEventListener('click', () => {
        this.setActiveMode('code');
      });
    }

    if (this.actRecommendations) {
      this.actRecommendations.addEventListener('click', () => {
        this.setActiveMode('recommendations');
      });
    }

    if (this.actAttachFile) {
      this.actAttachFile.addEventListener('click', () => {
        this.closeInputActionsPopover();
        if (this.hiddenFileInput) this.hiddenFileInput.click();
      });
    }

    if (this.hiddenFileInput) {
      this.hiddenFileInput.addEventListener('change', (e) => this.handleFileSelected(e));
    }

    if (this.btnRemoveActiveMode) {
      this.btnRemoveActiveMode.addEventListener('click', () => {
        this.setActiveMode(null);
      });
    }

    // Lightbox Modal
    if (this.btnCloseLightbox) {
      this.btnCloseLightbox.addEventListener('click', () => this.closeLightbox());
    }

    if (this.imageLightboxModal) {
      this.imageLightboxModal.addEventListener('click', (e) => {
        if (e.target === this.imageLightboxModal) this.closeLightbox();
      });
    }

    // Fermeture du popover au clic en dehors
    document.addEventListener('click', (e) => {
      if (this.inputActionsPopover && this.inputActionsPopover.style.display !== 'none') {
        if (!this.inputActionsPopover.contains(e.target) && e.target !== this.btnInputPlus && !this.btnInputPlus?.contains(e.target)) {
          this.closeInputActionsPopover();
        }
      }
    });

    // Search form submission
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      });
    }

    // Direct Send button click
    if (this.btnSend) {
      this.btnSend.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      });
    }

    // Enter to submit (Shift+Enter for newline)
    if (this.promptInput) {
      this.promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          this.handleSend();
        }
      });

      // Auto-grow textarea
      this.promptInput.addEventListener('input', () => {
        this.promptInput.style.height = 'auto';
        this.promptInput.style.height = Math.min(this.promptInput.scrollHeight, 120) + 'px';
      });
    }

    // Suggestion chips
    this.suggestionsGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip-item');
      if (!chip) return;
      const query = chip.dataset.query || chip.innerText.trim();
      this.promptInput.value = query;
      this.handleSend();
    });

    // Header API Key Badge opens settings
    this.btnApiKey.addEventListener('click', () => this.openSettingsModal('apikey'));

    // Detail modal
    this.btnCloseDetailModal.addEventListener('click', () => this.closeDetailModal());
    this.detailModal.addEventListener('click', (e) => {
      if (e.target === this.detailModal) this.closeDetailModal();
    });

    // Escape key closes modals and popovers
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAccountPopover();
        this.closeSidebar();
        this.closeSettingsModal();
        this.closePluginConfigModal();
        this.closeDetailModal();
        this.closeUpgradeModal();
        this.closeLightbox();
        this.closeInputActionsPopover();
      }
      // Ctrl+, shortcut for settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        this.openSettingsModal('general');
      }
    });

    // Playful orb click
    this.noraOrb.addEventListener('click', () => {
      this.noraOrb.style.transform = 'scale(1.15) rotate(12deg)';
      setTimeout(() => {
        this.noraOrb.style.transform = '';
      }, 300);
    });
  }

  // ==========================================
  // Plugins & Applications Management
  // ==========================================
  updatePluginsBadge() {
    const count = pluginService.getConnectedCount();
    if (this.pluginsBadgeCount) {
      this.pluginsBadgeCount.textContent = count > 0 ? `${count} connecté${count > 1 ? 's' : ''}` : '0';
      if (count > 0) {
        this.pluginsBadgeCount.classList.add('active-badge');
      } else {
        this.pluginsBadgeCount.classList.remove('active-badge');
      }
    }
  }

  renderPluginsCatalog() {
    if (!this.pluginsCatalogGrid) return;
    this.pluginsCatalogGrid.innerHTML = '';

    const filter = this.activePluginFilter;
    const list = AVAILABLE_PLUGINS.filter(p => filter === 'all' || p.category === filter);

    list.forEach((plugin) => {
      const isConnected = pluginService.isPluginConnected(plugin.id);
      const card = document.createElement('div');
      card.className = 'plugin-card';

      card.innerHTML = `
        <div class="card-top-row">
          <div class="plugin-icon-wrap" style="background: ${plugin.iconBg}; color: ${plugin.iconColor};">
            <i class="${plugin.iconClass}"></i>
          </div>
          <div class="plugin-meta-info">
            <div class="plugin-title">${this.escapeHtml(plugin.name)}</div>
            <div class="plugin-category-badge">${this.escapeHtml(plugin.category)}</div>
          </div>
          <div class="plugin-status-dot ${isConnected ? 'connected' : ''}" title="${isConnected ? 'Connecté' : 'Non configuré'}"></div>
        </div>
        <p class="plugin-summary-text">${this.escapeHtml(plugin.summary)}</p>
        <button type="button" class="btn-configure-plugin ${isConnected ? 'connected-state' : ''}" data-plugin-id="${plugin.id}">
          <i class="${isConnected ? 'fa-solid fa-circle-check' : 'fa-solid fa-plug'}"></i>
          <span>${isConnected ? 'Configuré & Actif' : 'Configurer l’API'}</span>
        </button>
      `;

      card.querySelector('.btn-configure-plugin').addEventListener('click', () => {
        this.openPluginConfigModal(plugin);
      });

      this.pluginsCatalogGrid.appendChild(card);
    });
  }

  openPluginConfigModal(plugin) {
    this.selectedPluginForConfig = plugin;
    const config = pluginService.getPluginConfig(plugin.id);

    this.pluginModalName.textContent = plugin.name;
    this.pluginModalCategory.textContent = plugin.category;
    this.pluginModalDesc.textContent = plugin.description;
    this.pluginDocLink.href = plugin.helpUrl;

    this.pluginModalIconBadge.style.background = plugin.iconBg;
    this.pluginModalIconBadge.style.color = plugin.iconColor;
    this.pluginModalIconBadge.innerHTML = `<i class="${plugin.iconClass}"></i>`;

    // Populate fields
    this.pluginConfigForm.innerHTML = '';
    plugin.fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';
      const savedValue = config.data ? (config.data[field.key] || '') : '';

      group.innerHTML = `
        <label for="field_${field.key}">${this.escapeHtml(field.label)}</label>
        <input
          type="${field.type || 'text'}"
          id="field_${field.key}"
          name="${field.key}"
          placeholder="${this.escapeHtml(field.placeholder || '')}"
          value="${this.escapeHtml(savedValue)}"
          autocomplete="off"
        />
      `;
      this.pluginConfigForm.appendChild(group);
    });

    if (config.connected) {
      this.pluginStatusText.innerHTML = `🟢 Connecté et disponible pour NORA`;
      this.btnDisconnectPlugin.style.display = 'inline-flex';
    } else {
      this.pluginStatusText.innerHTML = `⚪ Non configuré`;
      this.btnDisconnectPlugin.style.display = 'none';
    }

    this.pluginConfigModal.classList.add('active');
  }

  closePluginConfigModal() {
    this.pluginConfigModal.classList.remove('active');
    this.selectedPluginForConfig = null;
  }

  saveSelectedPluginConfig() {
    if (!this.selectedPluginForConfig) return;
    const plugin = this.selectedPluginForConfig;
    const formData = {};

    plugin.fields.forEach(f => {
      const input = document.getElementById(`field_${f.key}`);
      if (input) {
        formData[f.key] = input.value.trim();
      }
    });

    // Check if at least one field is filled
    const hasAnyValue = Object.values(formData).some(v => v.length > 0);
    if (!hasAnyValue) {
      alert("Veuillez renseigner au moins une clé d'API ou un identifiant.");
      return;
    }

    pluginService.setPluginConfig(plugin.id, formData, true);
    this.updatePluginsBadge();
    this.renderPluginsCatalog();
    this.closePluginConfigModal();
    alert(`Plugin ${plugin.name} configuré et activé avec succès ! NORA peut maintenant l'utiliser.`);
  }

  disconnectSelectedPlugin() {
    if (!this.selectedPluginForConfig) return;
    const plugin = this.selectedPluginForConfig;
    if (confirm(`Voulez-vous déconnecter le plugin ${plugin.name} ?`)) {
      pluginService.disconnectPlugin(plugin.id);
      this.updatePluginsBadge();
      this.renderPluginsCatalog();
      this.closePluginConfigModal();
    }
  }

  // ==========================================
  // Settings Modal Methods
  // ==========================================
  openSettingsModal(tab = 'general') {
    this.inputGeminiApiKey.value = geminiService.getApiKey();
    this.selectGeminiModel.value = geminiService.getModel();
    this.updateApiStatusUI();
    this.switchSettingsTab(tab);
    this.renderPluginsCatalog();
    this.noraSettingsModal.classList.add('active');
  }

  closeSettingsModal() {
    this.noraSettingsModal.classList.remove('active');
  }

  openIosInstallModal() {
    if (this.iosInstallModal) {
      this.iosInstallModal.classList.add('active');
    }
  }

  closeIosInstallModal() {
    if (this.iosInstallModal) {
      this.iosInstallModal.classList.remove('active');
    }
  }

  switchSettingsTab(tabName) {
    const tabs = this.settingsTabsList.querySelectorAll('.settings-tab-btn');
    tabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const panes = this.noraSettingsModal.querySelectorAll('.settings-tab-pane');
    panes.forEach(p => {
      if (p.id === `pane-${tabName}`) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  changeFontSize(delta) {
    this.fontSizeOffset = Math.max(-2, Math.min(4, this.fontSizeOffset + delta));
    localStorage.setItem(STORAGE_KEY_FONT_SIZE, this.fontSizeOffset.toString());
    this.applyFontSize();
  }

  applyFontSize() {
    document.documentElement.style.setProperty('--chat-font-offset', `${this.fontSizeOffset}px`);
    if (this.chatStream) {
      this.chatStream.style.fontSize = `${14.5 + this.fontSizeOffset}px`;
    }
  }

  // Account Popover Methods
  toggleAccountPopover() {
    this.chatgptAccountPopover.classList.toggle('active');
  }

  closeAccountPopover() {
    this.chatgptAccountPopover.classList.remove('active');
  }

  openUpgradeModal() {
    this.upgradeModal.classList.add('active');
  }

  closeUpgradeModal() {
    this.upgradeModal.classList.remove('active');
  }

  loadCustomizationSettings() {
    this.customUserContext.value = localStorage.getItem(STORAGE_KEY_CUSTOM_CONTEXT) || '';
    this.customTone.value = localStorage.getItem(STORAGE_KEY_CUSTOM_TONE) || '';
  }

  saveCustomizationSettings() {
    const context = this.customUserContext.value.trim();
    const tone = this.customTone.value.trim();
    localStorage.setItem(STORAGE_KEY_CUSTOM_CONTEXT, context);
    localStorage.setItem(STORAGE_KEY_CUSTOM_TONE, tone);
    this.closeSettingsModal();
    alert('Préférences de personnalisation enregistrées avec succès !');
  }

  handleLogout() {
    if (confirm("Voulez-vous réinitialiser votre session et supprimer vos conversations ?")) {
      geminiService.setApiKey('');
      this.conversations = [];
      this.saveConversations();
      this.renderRecentConversations();
      this.resetConversation();
      this.updateApiStatusUI();
      this.closeSettingsModal();
      alert("Session réinitialisée.");
    }
  }

  openSidebar() {
    this.sidebarDrawer.classList.add('active');
    this.sidebarOverlay.classList.add('active');
  }

  closeSidebar() {
    this.closeAccountPopover();
    this.sidebarDrawer.classList.remove('active');
    this.sidebarOverlay.classList.remove('active');
  }

  updateApiStatusUI() {
    const hasKey = geminiService.hasKey();
    const model = geminiService.getModel();
    
    if (this.apiStatusDot) {
      this.apiStatusDot.className = hasKey ? 'status-dot' : 'status-dot disconnected';
    }
    if (this.btnApiKey) {
      this.btnApiKey.title = hasKey ? 'NORA Connecté' : 'Configurer la clé API';
    }
    if (this.currentModelBadge) {
      this.currentModelBadge.style.display = 'none';
      this.currentModelBadge.textContent = '';
    }
    if (this.apiStatusText) {
      this.apiStatusText.style.display = 'none';
      this.apiStatusText.textContent = '';
    }
    if (this.keyStatusText) {
      this.keyStatusText.textContent = hasKey ? `Clé active (${model})` : 'Aucune clé renseignée (Mode Démo simulé)';
    }
  }

  saveApiKey() {
    const key = this.inputGeminiApiKey.value.trim();
    const model = this.selectGeminiModel.value;

    geminiService.setApiKey(key);
    geminiService.setModel(model);
    this.updateApiStatusUI();
    this.closeSettingsModal();
  }

  toggleInputActionsPopover() {
    const isHidden = !this.inputActionsPopover || this.inputActionsPopover.style.display === 'none';
    if (isHidden) {
      this.openInputActionsPopover();
    } else {
      this.closeInputActionsPopover();
    }
  }

  openInputActionsPopover() {
    if (!this.inputActionsPopover) return;
    this.inputActionsPopover.style.display = 'block';
    if (this.btnInputPlus) this.btnInputPlus.classList.add('active');
  }

  closeInputActionsPopover() {
    if (!this.inputActionsPopover) return;
    this.inputActionsPopover.style.display = 'none';
    if (this.btnInputPlus) this.btnInputPlus.classList.remove('active');
  }

  setActiveMode(mode) {
    this.activeMode = mode;
    this.closeInputActionsPopover();

    if (!this.activeModeTag) return;

    if (mode === 'image') {
      this.activeModeTag.style.display = 'inline-flex';
      this.activeModeTag.className = 'active-mode-tag mode-image';
      if (this.activeModeIcon) this.activeModeIcon.className = 'fa-solid fa-image';
      if (this.activeModeText) this.activeModeText.textContent = 'Création d’image';
      this.promptInput.placeholder = "Décrivez l'image que vous souhaitez générer (ex: Un coucher de soleil futuriste sur Tokyo)...";
      this.promptInput.focus();
    } else if (mode === 'code') {
      this.activeModeTag.style.display = 'inline-flex';
      this.activeModeTag.className = 'active-mode-tag mode-code';
      if (this.activeModeIcon) this.activeModeIcon.className = 'fa-solid fa-code';
      if (this.activeModeText) this.activeModeText.textContent = 'Création de code';
      this.promptInput.placeholder = "Décrivez le code ou l'algorithme à concevoir (ex: Algorithme de tri rapide en Python)...";
      this.promptInput.focus();
    } else if (mode === 'recommendations') {
      this.activeModeTag.style.display = 'inline-flex';
      this.activeModeTag.className = 'active-mode-tag mode-recom';
      if (this.activeModeIcon) this.activeModeIcon.className = 'fa-solid fa-wand-magic-sparkles';
      if (this.activeModeText) this.activeModeText.textContent = 'Recommandations';
      this.promptInput.placeholder = "Que recherchez-vous ? (ex: Photographe de mariage intimiste à Paris)...";
      this.promptInput.focus();
    } else {
      this.activeMode = null;
      this.activeModeTag.style.display = 'none';
      this.promptInput.placeholder = "Start searching...";
    }
  }

  handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result || '';
      const previewText = content.length > 2000 ? content.substring(0, 2000) + '\n... [document tronqué]' : content;
      this.promptInput.value = `[Document: ${file.name}]\n\`\`\`\n${previewText}\n\`\`\`\n\nAnalyse ce document et résume les points clés :`;
      this.promptInput.style.height = 'auto';
      this.promptInput.style.height = Math.min(this.promptInput.scrollHeight, 120) + 'px';
      this.promptInput.focus();
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  openLightbox(url, prompt) {
    if (!this.imageLightboxModal) return;
    this.lightboxImg.src = url;
    this.lightboxPromptText.textContent = prompt || 'Création NORA Studio HD';
    this.btnDownloadLightbox.href = url;
    this.imageLightboxModal.classList.add('active');
  }

  closeLightbox() {
    if (!this.imageLightboxModal) return;
    this.imageLightboxModal.classList.remove('active');
    if (this.lightboxImg) this.lightboxImg.src = '';
  }

  async handleSend() {
    const prompt = this.promptInput.value.trim();
    if (!prompt || this.isGenerating) return;

    const currentMode = this.activeMode;
    // Clear mode tag after initiating message
    this.setActiveMode(null);

    this.promptInput.value = '';
    this.promptInput.style.height = 'auto';

    // Transition to chat mode if on home
    if (!this.inChatMode) {
      this.enterChatMode();
    }

    // Append user message
    this.appendUserMessage(prompt);

    // Show thinking indicator
    this.showThinking();
    this.isGenerating = true;
    this.btnSend.classList.add('loading');
    this.btnSend.disabled = true;

    try {
      const response = await geminiService.sendMessage(prompt, 'ai', currentMode);
      this.hideThinking();
      this.appendAssistantMessage(response, prompt);

      // Save conversation in history
      this.saveCurrentMessageToHistory(prompt, response);
    } catch (err) {
      this.hideThinking();
      this.appendErrorMessage(err.message || "Erreur de connexion à l'API Gemini");
    } finally {
      this.isGenerating = false;
      this.btnSend.classList.remove('loading');
      this.btnSend.disabled = false;
      this.scrollToBottom();
    }
  }

  enterChatMode() {
    this.inChatMode = true;
    this.noraApp.classList.add('in-chat-mode');

    // Move orb to top header center
    this.headerCenter.prepend(this.noraOrb);

    // Hide hero view, show chat stream
    this.heroView.style.display = 'none';
    this.chatStream.style.display = 'flex';
  }

  resetConversation() {
    this.inChatMode = false;
    this.currentConversationId = null;
    this.noraApp.classList.remove('in-chat-mode');

    // Move orb back to hero
    this.heroOrbWrapper.appendChild(this.noraOrb);

    // Show hero, hide chat stream
    this.heroView.style.display = 'flex';
    this.chatStream.style.display = 'none';
    this.chatStream.innerHTML = '';

    geminiService.clearHistory();
    this.promptInput.value = '';
    this.promptInput.focus();
  }

  appendUserMessage(text) {
    const item = document.createElement('div');
    item.className = 'message-item user-message';
    item.innerHTML = `<div class="bubble">${this.escapeHtml(text)}</div>`;
    this.chatStream.appendChild(item);
    this.scrollToBottom();
  }

  showThinking() {
    let indicator = document.getElementById('thinkingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'thinkingIndicator';
      indicator.className = 'thinking-indicator';
      indicator.innerHTML = `
        <span class="thinking-orb"></span>
        <span>NORA réfléchit...</span>
      `;
      this.chatStream.appendChild(indicator);
    }
    this.scrollToBottom();
  }

  hideThinking() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  appendAssistantMessage(response, userPrompt) {
    const item = document.createElement('div');
    item.className = 'message-item assistant-message';

    let contentHtml = `
      <div class="assistant-header">
        <span class="sparkle-icon">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </span>
        <span>${response.header || 'Results'}</span>
      </div>
      <div class="assistant-body">
        ${this.formatMarkdown(response.message)}
      </div>
    `;

    // If recommendation cards exist
    if (response.isRecommendation && Array.isArray(response.items) && response.items.length > 0) {
      contentHtml += `
        <div class="cards-carousel" role="region" aria-label="Recommandations">
          ${response.items.map((card, idx) => `
            <article class="photographer-card" data-idx="${idx}" role="button" tabindex="0">
              <div class="card-image-wrap">
                <img
                  src="${card.image}"
                  alt="${this.escapeHtml(card.name)}"
                  loading="lazy"
                  onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';"
                />
                <div class="rating-badge">
                  <i class="fa-solid fa-star" style="color: #FF9500; font-size: 9px;"></i>
                  <span>${card.rating || 4.9}</span>
                </div>
              </div>
              <div class="card-info">
                <h4 class="card-name">${this.escapeHtml(card.name)}</h4>
                <p class="card-price">${this.escapeHtml(card.price)}</p>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }

    // If image generation output exists
    if (response.isImage && response.imageUrl) {
      contentHtml += `
        <div class="generated-image-card">
          <div class="image-preview-container" data-url="${this.escapeHtml(response.imageUrl)}" data-prompt="${this.escapeHtml(response.prompt || '')}">
            <img
              src="${this.escapeHtml(response.imageUrl)}"
              alt="${this.escapeHtml(response.prompt || 'Création visuelle NORA')}"
              loading="lazy"
            />
            <div class="image-overlay-badge">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>NORA Studio HD</span>
            </div>
            <div class="image-zoom-hint" title="Agrandir l'image">
              <i class="fa-solid fa-expand"></i>
            </div>
          </div>
          <div class="image-actions-toolbar">
            <span class="image-prompt-badge" title="${this.escapeHtml(response.prompt || '')}">
              <i class="fa-solid fa-paintbrush" style="font-size: 10px; margin-right: 4px; opacity: 0.6;"></i>
              ${this.escapeHtml(response.prompt || '')}
            </span>
            <div class="toolbar-buttons">
              <button type="button" class="btn-img-tool btn-zoom-image" data-url="${this.escapeHtml(response.imageUrl)}" data-prompt="${this.escapeHtml(response.prompt || '')}">
                <i class="fa-solid fa-expand"></i>
                <span>Agrandir</span>
              </button>
              <a href="${this.escapeHtml(response.imageUrl)}" download="nora-creation.jpg" target="_blank" class="btn-img-tool primary-tool">
                <i class="fa-solid fa-download"></i>
                <span>Télécharger</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    if (response.footer) {
      contentHtml += `<p class="assistant-footer-note">${this.escapeHtml(response.footer)}</p>`;
    }

    // Action buttons below response using Font Awesome
    contentHtml += `
      <div class="message-actions">
        <button class="btn-action btn-act-again" title="Poser une autre question">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Search again</span>
        </button>
        <button class="btn-action btn-act-copy" title="Copier le message">
          <i class="fa-regular fa-copy"></i>
          <span>Copier</span>
        </button>
        <button class="btn-action btn-act-share" title="Partager">
          <i class="fa-solid fa-arrow-up-from-bracket"></i>
          <span>Share</span>
        </button>
      </div>
    `;

    item.innerHTML = contentHtml;

    // Attach card click handlers for recommendations
    if (response.items) {
      item.querySelectorAll('.photographer-card').forEach((cardEl) => {
        const idx = cardEl.dataset.idx;
        const cardData = response.items[idx];
        cardEl.addEventListener('click', () => this.openDetailModal(cardData));
      });
    }

    // Attach image zoom / lightbox handlers
    item.querySelectorAll('.image-preview-container, .btn-zoom-image').forEach((imgEl) => {
      imgEl.addEventListener('click', (e) => {
        // Prevent if user clicked download directly
        if (e.target.closest('a')) return;
        const url = imgEl.dataset.url;
        const prompt = imgEl.dataset.prompt;
        if (url) this.openLightbox(url, prompt);
      });
    });

    // Attach code copy button handlers
    item.querySelectorAll('.btn-copy-code').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rawCode = decodeURIComponent(btn.dataset.code || '');
        navigator.clipboard.writeText(rawCode).then(() => {
          const span = btn.querySelector('span');
          const icon = btn.querySelector('i');
          if (span) span.textContent = 'Copié !';
          if (icon) icon.className = 'fa-solid fa-check';
          btn.classList.add('copied');
          setTimeout(() => {
            if (span) span.textContent = 'Copier le code';
            if (icon) icon.className = 'fa-regular fa-copy';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback if clipboard API is restricted
          alert('Code copié !');
        });
      });
    });

    // Attach action button handlers
    const btnAgain = item.querySelector('.btn-act-again');
    if (btnAgain) {
      btnAgain.addEventListener('click', () => {
        this.promptInput.value = '';
        this.promptInput.focus();
      });
    }

    const btnCopy = item.querySelector('.btn-act-copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const textToCopy = `${response.message}\n${response.footer || ''}`;
        navigator.clipboard.writeText(textToCopy);
        const label = btnCopy.querySelector('span');
        label.textContent = 'Copié !';
        setTimeout(() => {
          label.textContent = 'Copier';
        }, 2000);
      });
    }

    const btnShare = item.querySelector('.btn-act-share');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'NORA AI',
            text: response.message,
            url: window.location.href
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Lien copié dans le presse-papiers !');
        }
      });
    }

    this.chatStream.appendChild(item);
    this.scrollToBottom();
  }

  appendErrorMessage(msg) {
    const item = document.createElement('div');
    item.className = 'message-item assistant-message';
    item.innerHTML = `
      <div class="assistant-header" style="color: #DC2626;">
        <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i>
        <span>Erreur</span>
      </div>
      <div class="assistant-body" style="color: #DC2626;">
        <p>${this.escapeHtml(msg)}</p>
        <p style="font-size: 13px; margin-top: 8px; color: #4B5563;">
          Vérifiez votre clé API Gemini en cliquant sur le badge <strong>Clé API</strong> en haut à droite.
        </p>
      </div>
    `;
    this.chatStream.appendChild(item);
    this.scrollToBottom();
  }

  // Conversation Storage & Filtering with Supabase Cloud Sync
  loadConversations() {
    try {
      // 1. Purger les anciens mocks par défaut (sample-1, sample-2, etc.)
      const legacy = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          const filtered = parsed.filter(c => c && !String(c.id).startsWith('sample-'));
          if (filtered.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(filtered));
          }
        } catch (e) {}
      }

      // 2. Charger les conversations propres à l'utilisateur depuis authService (sync Supabase ai_conversations)
      const userConvs = authService.loadUserConversations();
      return (userConvs || []).filter(c => c && !String(c.id).startsWith('sample-'));
    } catch (e) {
      return [];
    }
  }

  saveConversations() {
    try {
      authService.saveUserConversations(this.conversations);
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(this.conversations));
    } catch (e) {}
  }

  saveCurrentMessageToHistory(prompt, response) {
    const responseText = (typeof response === 'object' && response !== null) ? (response.message || '') : String(response || '');
    
    if (!this.currentConversationId) {
      this.currentConversationId = 'conv-' + Date.now();
      const newConv = {
        id: this.currentConversationId,
        title: prompt.length > 42 ? prompt.substring(0, 40) + '...' : prompt,
        date: 'Aujourd’hui',
        prompt: prompt,
        response: responseText,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: responseText }
        ]
      };
      this.conversations.unshift(newConv);
    } else {
      const existing = this.conversations.find(c => c.id === this.currentConversationId);
      if (existing) {
        if (!existing.messages) {
          existing.messages = [
            { role: 'user', content: existing.prompt || '' },
            { role: 'assistant', content: existing.response || '' }
          ];
        }
        existing.messages.push({ role: 'user', content: prompt });
        existing.messages.push({ role: 'assistant', content: responseText });
      }
    }
    this.saveConversations();
    this.renderRecentConversations();
  }

  onConversationsCloudSynced(syncedList) {
    if (syncedList && Array.isArray(syncedList)) {
      this.conversations = syncedList;
      this.renderRecentConversations();
    }
  }

  // ==========================================
  // Authentification & Synchronisation Methods
  // ==========================================
  openAuthModal(tab = 'signin') {
    this.switchAuthTab(tab);
    if (this.supabaseProjectUrlInput) {
      this.supabaseProjectUrlInput.value = authService.getSupabaseUrl() || '';
    }
    if (this.supabaseApiKeyInput) {
      this.supabaseApiKeyInput.value = authService.getSupabaseKey();
    }
    this.hideAuthAlerts();
    this.noraAuthModal.classList.add('active');
  }

  closeAuthModal() {
    this.noraAuthModal.classList.remove('active');
    this.hideAuthAlerts();
  }

  switchAuthTab(tab) {
    if (tab === 'signin') {
      this.tabBtnSignIn.classList.add('active');
      this.tabBtnSignUp.classList.remove('active');
      this.formSignIn.style.display = 'flex';
      this.formSignUp.style.display = 'none';
      setTimeout(() => this.signInEmail && this.signInEmail.focus(), 100);
    } else {
      this.tabBtnSignUp.classList.add('active');
      this.tabBtnSignIn.classList.remove('active');
      this.formSignUp.style.display = 'flex';
      this.formSignIn.style.display = 'none';
      setTimeout(() => this.signUpFullName && this.signUpFullName.focus(), 100);
    }
    this.hideAuthAlerts();
  }

  toggleCloudConfigDrawer(forceOpen = null) {
    const isCurrentlyHidden = this.cloudConfigDrawer.style.display === 'none';
    const shouldOpen = forceOpen !== null ? forceOpen : isCurrentlyHidden;
    this.cloudConfigDrawer.style.display = shouldOpen ? 'flex' : 'none';
    if (this.cloudConfigChevron) {
      this.cloudConfigChevron.classList.toggle('open', shouldOpen);
    }
  }

  hideAuthAlerts() {
    if (this.signInAlert) {
      this.signInAlert.style.display = 'none';
      this.signInAlert.className = 'auth-alert';
      this.signInAlert.innerHTML = '';
    }
    if (this.signUpAlert) {
      this.signUpAlert.style.display = 'none';
      this.signUpAlert.className = 'auth-alert';
      this.signUpAlert.innerHTML = '';
    }
  }

  showAuthAlert(container, type, message) {
    if (!container) return;
    container.style.display = 'flex';
    container.className = `auth-alert ${type}`;
    const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
    container.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${this.escapeHtml(message)}</span>`;
  }

  async handleSignIn() {
    const email = this.signInEmail.value.trim();
    const password = this.signInPassword.value.trim();

    if (!email || !password) {
      this.showAuthAlert(this.signInAlert, 'error', 'Veuillez saisir votre adresse e-mail et votre mot de passe.');
      return;
    }

    this.btnSubmitSignIn.disabled = true;
    this.btnSubmitSignIn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Connexion...</span>`;

    try {
      const userProfile = await authService.signIn({ email, password });
      this.showAuthAlert(this.signInAlert, 'success', `Bienvenue ${userProfile.name || userProfile.email} ! Synchronisation active.`);
      this.updateUserSessionUI();
      this.conversations = this.loadConversations();
      this.renderRecentConversations();

      setTimeout(() => {
        this.closeAuthModal();
        this.signInEmail.value = '';
        this.signInPassword.value = '';
      }, 1000);
    } catch (err) {
      this.showAuthAlert(this.signInAlert, 'error', err.message || 'Identifiants invalides.');
    } finally {
      this.btnSubmitSignIn.disabled = false;
      this.btnSubmitSignIn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> <span>Se connecter</span>`;
    }
  }

  async handleSignUp() {
    const name = this.signUpFullName.value.trim();
    const email = this.signUpEmail.value.trim();
    const password = this.signUpPassword.value.trim();

    if (!name || !email || !password) {
      this.showAuthAlert(this.signUpAlert, 'error', 'Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      this.showAuthAlert(this.signUpAlert, 'error', 'Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    this.btnSubmitSignUp.disabled = true;
    this.btnSubmitSignUp.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Création du compte...</span>`;

    try {
      const userProfile = await authService.signUp({ name, email, password });
      this.showAuthAlert(this.signUpAlert, 'success', `Compte créé avec succès ! Bienvenue, ${userProfile.name}.`);
      this.updateUserSessionUI();
      this.conversations = this.loadConversations();
      this.renderRecentConversations();

      setTimeout(() => {
        this.closeAuthModal();
        this.signUpFullName.value = '';
        this.signUpEmail.value = '';
        this.signUpPassword.value = '';
      }, 1000);
    } catch (err) {
      this.showAuthAlert(this.signUpAlert, 'error', err.message || 'Erreur lors de la création du compte.');
    } finally {
      this.btnSubmitSignUp.disabled = false;
      this.btnSubmitSignUp.innerHTML = `<i class="fa-solid fa-user-plus"></i> <span>Créer mon compte NORA</span>`;
    }
  }

  handleSaveCloudConfig() {
    const url = this.supabaseProjectUrlInput ? this.supabaseProjectUrlInput.value.trim() : '';
    const key = this.supabaseApiKeyInput ? this.supabaseApiKeyInput.value.trim() : '';

    if (url) authService.setSupabaseUrl(url);
    if (key) authService.setSupabaseKey(key);

    if (authService.isCloudConfigured()) {
      alert(`Synchronisation Supabase connectée avec succès !\nTable: ai_conversations\nURL: ${authService.getSupabaseUrl()}`);
      authService.syncConversationsFromCloud();
    } else {
      alert(`Configuration enregistrée.`);
    }
    this.updateUserSessionUI();
  }

  async handleLogout() {
    const user = authService.getCurrentUser();
    const isGuest = !authService.isAuthenticated();
    const msg = isGuest 
      ? "Voulez-vous réinitialiser votre session locale et effacer l'historique ?"
      : `Voulez-vous vous déconnecter du compte ${user.name || user.email} ?`;

    if (confirm(msg)) {
      await authService.signOut();
      this.conversations = this.loadConversations();
      this.renderRecentConversations();
      this.resetConversation();
      this.updateUserSessionUI();
      this.closeSettingsModal();
    }
  }

  updateUserSessionUI() {
    const user = authService.getCurrentUser();
    const isAuth = authService.isAuthenticated();

    const displayName = isAuth ? (user.name || user.email.split('@')[0]) : 'Mon Compte';
    const displayEmail = isAuth ? user.email : 'non_connecté@nora.ai';
    const displayInitials = isAuth ? (user.initials || 'U') : 'N';
    const plan = (user && user.plan) || 'Free';

    // Sidebar Trigger
    if (this.sidebarTriggerUserName) this.sidebarTriggerUserName.textContent = displayName;
    if (this.sidebarTriggerAvatar) this.sidebarTriggerAvatar.textContent = displayInitials;
    if (this.sidebarTriggerUserPlan) this.sidebarTriggerUserPlan.textContent = plan;

    // Sidebar Popover
    if (this.sidebarPopoverUserName) this.sidebarPopoverUserName.textContent = displayName;
    if (this.sidebarPopoverAvatar) this.sidebarPopoverAvatar.textContent = displayInitials;
    if (this.sidebarPopoverUserPlan) this.sidebarPopoverUserPlan.textContent = plan;

    // Settings Pane Account
    if (this.settingsAccountName) this.settingsAccountName.textContent = isAuth ? displayName : 'Utilisateur NORA (Invité)';
    if (this.settingsAccountEmail) this.settingsAccountEmail.textContent = displayEmail;
    if (this.settingsAccountAvatar) this.settingsAccountAvatar.textContent = displayInitials;
    if (this.settingsAccountPlan) {
      this.settingsAccountPlan.textContent = `Forfait ${plan}`;
      this.settingsAccountPlan.className = plan.toLowerCase() === 'pro' ? 'plan-tag-pro' : 'plan-tag-free';
    }

    // Auth & Logout Menu Labels
    if (this.menuItemAuthLabel) {
      this.menuItemAuthLabel.textContent = isAuth ? 'Changer de compte' : 'Connexion / Inscription';
    }
    if (this.menuItemLogoutLabel) {
      this.menuItemLogoutLabel.textContent = isAuth ? 'Se déconnecter' : 'Effacer la session';
    }

    // Header Auth Badge
    if (this.headerAuthLabel) {
      if (isAuth && user.name) {
        const firstName = user.name.split(' ')[0];
        this.headerAuthLabel.textContent = firstName;
        if (this.btnHeaderAuth) {
          this.btnHeaderAuth.title = `Connecté : ${user.name} (${user.email}) — Cliquez pour gérer votre compte`;
          this.btnHeaderAuth.classList.add('user-connected');
        }
      } else {
        this.headerAuthLabel.textContent = 'Connexion';
        if (this.btnHeaderAuth) {
          this.btnHeaderAuth.title = 'Créer un compte ou se connecter à NORA';
          this.btnHeaderAuth.classList.remove('user-connected');
        }
      }
    }

    // Hero Title
    if (this.heroTitle) {
      if (isAuth && user.name) {
        const firstName = user.name.split(' ')[0];
        this.heroTitle.textContent = `Bonjour ${firstName}, que recherchez-vous aujourd'hui ?`;
      } else {
        this.heroTitle.textContent = `Que recherchez-vous aujourd'hui ?`;
      }
    }
  }

  renderRecentConversations(filterQuery = '') {
    this.recentChatsList.innerHTML = '';
    
    let filtered = this.conversations;
    if (filterQuery) {
      filtered = this.conversations.filter(c => c.title.toLowerCase().includes(filterQuery));
    }

    if (!filtered.length) {
      this.recentChatsList.innerHTML = `<div class="empty-history-note">Aucune discussion trouvée.</div>`;
      return;
    }

    filtered.forEach((conv) => {
      const item = document.createElement('div');
      item.className = 'chat-history-item';
      if (conv.id === this.currentConversationId) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <span class="chat-title" title="${this.escapeHtml(conv.title)}">
          <i class="fa-regular fa-message" style="margin-right: 8px; font-size: 12px; opacity: 0.7;"></i>
          ${this.escapeHtml(conv.title)}
        </span>
        <button class="btn-delete-chat" title="Supprimer" aria-label="Supprimer">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-chat')) {
          e.stopPropagation();
          this.deleteConversation(conv.id);
          return;
        }
        this.loadConversation(conv);
      });

      this.recentChatsList.appendChild(item);
    });
  }

  loadConversation(conv) {
    this.closeSidebar();
    this.currentConversationId = conv.id;
    this.renderRecentConversations();
    this.promptInput.value = conv.prompt || conv.title;
    this.handleSend();
  }

  deleteConversation(id) {
    this.conversations = this.conversations.filter(c => c.id !== id);
    this.saveConversations();
    this.renderRecentConversations();
    if (this.currentConversationId === id) {
      this.resetConversation();
    }
  }

  openDetailModal(item) {
    this.detailModalBody.innerHTML = `
      <div class="detail-hero-img">
        <img src="${item.image}" alt="${this.escapeHtml(item.name)}" />
      </div>
      <div class="detail-title-row">
        <div>
          <h3>${this.escapeHtml(item.name)}</h3>
          <p style="font-size: 13px; color: #71717A; margin-top: 2px;">
            ${item.location || 'San Francisco, CA'} • ★ ${item.rating || 4.9}
          </p>
        </div>
        <div class="price-pill">${this.escapeHtml(item.price)}</div>
      </div>
      <div class="detail-tags">
        ${(item.tags || ['Wedding', 'Portrait']).map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}
      </div>
      <p class="detail-bio">${this.escapeHtml(item.bio || 'Professionnelle de l’image passionnée, capturant des émotions vraies et authentiques.')}</p>
      <button type="button" class="detail-btn-action" onclick="alert('Demande de contact transmise avec succès !')">
        Contacter & Réserver
      </button>
    `;
    this.detailModal.classList.add('active');
  }

  closeDetailModal() {
    this.detailModal.classList.remove('active');
  }

  scrollToBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  formatMarkdown(text) {
    if (!text) return '';

    // 1. Extraire et isoler les blocs de code triples backticks
    const codeBlocks = [];
    let processed = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const cleanLang = (lang || 'code').trim().toLowerCase();
      const cleanCode = code.trim();
      const index = codeBlocks.length;
      codeBlocks.push({ lang: cleanLang, code: cleanCode });
      return `\n\n___CODE_BLOCK_${index}___\n\n`;
    });

    // 2. Extraire le code inline `code`
    const inlineCodes = [];
    processed = processed.replace(/`([^`\n]+)`/g, (match, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(code);
      return `___INLINE_CODE_${index}___`;
    });

    // 3. Nettoyer les astérisques d'accroche résiduels (ex: "SpaceX)* :" ou "Tesla* :")
    processed = processed.replace(/\)\*\s*:/g, ') :');
    processed = processed.replace(/\*\s*:/g, ' :');

    // 4. Normaliser les séparateurs horizontaux (--- ou *** ou ___) avec des sauts de ligne isolés
    processed = processed.replace(/^\s*([-*_]){3,}\s*$/gm, '\n\n___THEME_DIVIDER___\n\n');

    // 5. Normaliser les titres de sections / thèmes (### ou ## ou #)
    processed = processed.replace(/^\s*(?:#{1,6})\s+(.+)$/gm, '\n\n___THEME_HEADER_$1___\n\n');

    // 6. Normaliser les points de listes (•, -, *, etc.)
    processed = processed.replace(/^\s*([•\u2022\-*])\s+(.+)$/gm, '___LIST_ITEM_BULLET___$2');
    processed = processed.replace(/^\s*(\d+)[.)]\s+(.+)$/gm, '___LIST_ITEM_NUM_$1___$2');

    // Échapper le HTML sécurisé
    let html = this.escapeHtml(processed);

    // Restaurer le balisage des listes avec structure point et badge
    html = html.replace(/___LIST_ITEM_BULLET___([\s\S]*?)(?=(?:___LIST_ITEM_BULLET___|___LIST_ITEM_NUM_|$|\n\n))/g, (match, item) => {
      return `<li class="response-point-item"><span class="point-bullet-dot"></span><div class="point-body">${item.trim()}</div></li>\n`;
    });

    html = html.replace(/___LIST_ITEM_NUM_(\d+)___([\s\S]*?)(?=(?:___LIST_ITEM_BULLET___|___LIST_ITEM_NUM_|$|\n\n))/g, (match, num, item) => {
      return `<li class="response-point-item numbered"><span class="point-number-badge">${num}</span><div class="point-body">${item.trim()}</div></li>\n`;
    });

    // Englober les <li> consécutifs dans un <ul> stylisé
    html = html.replace(/((?:<li class="response-point-item[\s\S]*?<\/li>\n*)+)/g, (match) => {
      return `\n\n<ul class="response-points-list">\n${match.trim()}\n</ul>\n\n`;
    });

    // Restaurer les titres de thèmes avec barre d'accentuation élégante
    html = html.replace(/___THEME_HEADER_([\s\S]*?)___/g, (match, title) => {
      return `\n\n<div class="response-theme-header"><span class="theme-accent-bar"></span><h3 class="theme-title">${title.trim()}</h3></div>\n\n`;
    });

    // Restaurer les séparateurs doux
    html = html.replace(/___THEME_DIVIDER___/g, '\n\n<div class="response-theme-divider"></div>\n\n');

    // Gras et Italique
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Traiter les paragraphes propres
    const chunks = html.split(/\n\s*\n/);
    const formattedBlocks = chunks.map(chunk => {
      const trimmed = chunk.trim();
      if (!trimmed) return '';
      // Si c'est déjà un conteneur bloc, ne pas englober dans <p>
      if (
        trimmed.startsWith('<div class="response-theme-header"') ||
        trimmed.startsWith('<ul class="response-points-list"') ||
        trimmed.startsWith('<div class="response-theme-divider"') ||
        trimmed.includes('___CODE_BLOCK_')
      ) {
        return trimmed;
      }
      return `<p class="response-paragraph">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    });

    let resultHtml = formattedBlocks.filter(Boolean).join('\n');

    // Restaurer le code en ligne
    inlineCodes.forEach((code, idx) => {
      const escaped = this.escapeHtml(code);
      resultHtml = resultHtml.replace(new RegExp(`___INLINE_CODE_${idx}___`, 'g'), `<code class="inline-code">${escaped}</code>`);
    });

    // Restaurer les blocs de code complets avec en-tête et bouton Copier
    codeBlocks.forEach((block, idx) => {
      const escapedCode = this.escapeHtml(block.code);
      const encodedCode = encodeURIComponent(block.code);
      const displayLang = block.lang ? block.lang.toUpperCase() : 'CODE';
      const snippetHtml = `
        <div class="code-snippet-box">
          <div class="code-header">
            <span class="code-lang"><i class="fa-solid fa-code"></i> ${displayLang}</span>
            <button type="button" class="btn-copy-code" data-code="${encodedCode}">
              <i class="fa-regular fa-copy"></i>
              <span>Copier le code</span>
            </button>
          </div>
          <pre class="code-content"><code class="language-${block.lang}">${escapedCode}</code></pre>
        </div>
      `;
      resultHtml = resultHtml.replace(new RegExp(`___CODE_BLOCK_${idx}___`, 'g'), snippetHtml);
    });

    return resultHtml;
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

// Mount application & export globally for modal buttons
document.addEventListener('DOMContentLoaded', () => {
  window.noraAppInstance = new NoraConversationalApp();
});
