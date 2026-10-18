import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_URL = 'nora_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'nora_supabase_key';
const STORAGE_KEY_CURRENT_USER = 'nora_current_user';
const STORAGE_KEY_LOCAL_USERS = 'nora_local_registered_users';

export const DEFAULT_SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://meslwflzjpvcimsvwbmx.supabase.co';
export const DEFAULT_SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_H2fbkN4guUawv4UXfwIG1g_BZyX1maN';

export class AuthService {
  constructor() {
    this.supabaseKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;
    this.supabaseUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    this.supabase = null;
    this.currentUser = null;
    this.listeners = [];

    this.initSupabaseClient();
    this.loadCurrentSession();
    this.initSupabaseAuthListener();
  }

  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyAuthChange() {
    this.listeners.forEach(cb => {
      try { cb(this.getCurrentUser()); } catch (e) { console.error(e); }
    });
  }

  initSupabaseClient() {
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (err) {
        console.warn('Erreur initialisation client Supabase:', err);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }

  getSupabaseUrl() {
    return this.supabaseUrl;
  }

  setSupabaseUrl(url) {
    this.supabaseUrl = (url || '').trim();
    if (this.supabaseUrl) {
      localStorage.setItem(STORAGE_KEY_SUPABASE_URL, this.supabaseUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    }
    this.initSupabaseClient();
  }

  getSupabaseKey() {
    return this.supabaseKey;
  }

  setSupabaseKey(key) {
    this.supabaseKey = (key || '').trim() || DEFAULT_SUPABASE_KEY;
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, this.supabaseKey);
    this.initSupabaseClient();
  }

  isCloudConfigured() {
    return Boolean(this.supabaseUrl && this.supabaseUrl.startsWith('http') && this.supabase);
  }

  loadCurrentSession() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.currentUser.id);
  }

  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    return {
      id: null,
      name: 'Invité',
      email: 'non_connecté@nora.ai',
      initials: 'N',
      plan: 'Free',
      isGuest: true
    };
  }

  computeInitials(name) {
    if (!name) return 'N';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  /**
   * Création d'un nouveau compte utilisateur
   */
  async signUp({ name, email, password, supabaseUrl = '' }) {
    if (supabaseUrl) {
      this.setSupabaseUrl(supabaseUrl);
    }

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password || password.length < 6) {
      throw new Error('Email valide et mot de passe de 6 caractères minimum requis.');
    }

    let supabaseAuthUser = null;

    // 1. Tenter la création via Supabase si l'URL est configurée
    if (this.isCloudConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { full_name: cleanName }
          }
        });

        if (error) {
          console.warn('Supabase Auth SignUp error:', error);
          // Si erreur réseau ou domaine, on informe l'utilisateur
          throw error;
        }
        supabaseAuthUser = data.user;
      } catch (err) {
        console.warn('Tentative Supabase cloud échouée, bascule locale sécurisée:', err);
        // Si Supabase renvoie une erreur critique non-réseau, relancer
        if (err.status && err.status !== 0 && !err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // 2. Persistance locale sécurisée du profil utilisateur
    const userId = supabaseAuthUser ? supabaseAuthUser.id : 'usr_' + Date.now();
    const userProfile = {
      id: userId,
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      initials: this.computeInitials(cleanName || cleanEmail),
      plan: 'Free',
      isGuest: false,
      createdAt: new Date().toISOString(),
      cloudSynced: Boolean(supabaseAuthUser)
    };

    // Sauvegarder dans la liste des utilisateurs enregistrés localement
    const localUsers = this.getLocalUsers();
    localUsers[cleanEmail] = {
      profile: userProfile,
      passwordHash: btoa(password) // encodage basique pour persistance locale
    };
    this.saveLocalUsers(localUsers);

    // Définir comme session active
    this.setCurrentSession(userProfile);

    return userProfile;
  }

  /**
   * Connexion utilisateur
   */
  async signIn({ email, password, supabaseUrl = '' }) {
    if (supabaseUrl) {
      this.setSupabaseUrl(supabaseUrl);
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Veuillez renseigner votre email et mot de passe.');
    }

    let supabaseAuthUser = null;

    // 1. Tenter la connexion Supabase Cloud si configuré
    if (this.isCloudConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) {
          console.warn('Supabase signInWithPassword:', error.message);
          // Si l'erreur est identifiants invalides sur cloud, vérifier localement d'abord
        } else {
          supabaseAuthUser = data.user;
        }
      } catch (err) {
        console.warn('Supabase cloud error:', err);
      }
    }

    // 2. Vérification dans les utilisateurs locaux
    const localUsers = this.getLocalUsers();
    const localRecord = localUsers[cleanEmail];

    if (!supabaseAuthUser && !localRecord) {
      throw new Error('Aucun compte trouvé avec cet email. Veuillez créer un compte.');
    }

    if (!supabaseAuthUser && localRecord) {
      if (localRecord.passwordHash !== btoa(password)) {
        throw new Error('Mot de passe incorrect.');
      }
    }

    const profile = localRecord ? localRecord.profile : {
      id: supabaseAuthUser.id,
      name: supabaseAuthUser.user_metadata?.full_name || cleanEmail.split('@')[0],
      email: cleanEmail,
      initials: this.computeInitials(supabaseAuthUser.user_metadata?.full_name || cleanEmail),
      plan: 'Free',
      isGuest: false,
      cloudSynced: true
    };

    this.setCurrentSession(profile);
    return profile;
  }

  /**
   * Déconnexion
   */
  async signOut() {
    if (this.supabase && this.isCloudConfigured()) {
      try {
        await this.supabase.auth.signOut();
      } catch (e) {}
    }

    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile({ name, email }) {
    if (!this.currentUser) return;

    if (name) this.currentUser.name = name.trim();
    if (email) this.currentUser.email = email.trim();
    this.currentUser.initials = this.computeInitials(this.currentUser.name);

    this.setCurrentSession(this.currentUser);

    // Mettre à jour dans la liste locale
    const localUsers = this.getLocalUsers();
    if (localUsers[this.currentUser.email]) {
      localUsers[this.currentUser.email].profile = this.currentUser;
      this.saveLocalUsers(localUsers);
    }

    // Mettre à jour dans Supabase si connecté
    if (this.isCloudConfigured()) {
      try {
        await this.supabase.auth.updateUser({
          data: { full_name: this.currentUser.name }
        });
      } catch (e) {}
    }

    return this.currentUser;
  }

  initSupabaseAuthListener() {
    if (!this.supabase) return;
    try {
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          const user = session.user;
          const profile = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
            initials: this.computeInitials(user.user_metadata?.full_name || user.email),
            plan: 'Free',
            isGuest: false,
            cloudSynced: true
          };
          this.setCurrentSession(profile);
          this.notifyAuthChange();
          // Sync conversations from cloud after login
          this.syncConversationsFromCloud();
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          this.notifyAuthChange();
        }
      });
    } catch (e) {
      console.warn('Supabase auth state listener error:', e);
    }
  }

  isValidUuid(str) {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  generateUuid() {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  setCurrentSession(userProfile) {
    this.currentUser = userProfile;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(userProfile));
    this.notifyAuthChange();
  }

  getLocalUsers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveLocalUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
    } catch (e) {}
  }

  /**
   * Synchronisation des conversations par utilisateur et Cloud Supabase
   */
  getUserConversationsKey() {
    if (this.currentUser && this.currentUser.id) {
      return `nora_conversations_${this.currentUser.id}`;
    }
    return 'nora_conversations_guest';
  }

  loadUserConversations() {
    const key = this.getUserConversationsKey();
    let localList = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        localList = parsed.filter(c => c && !String(c.id).startsWith('sample-'));
      }
    } catch (e) {
      localList = [];
    }

    // Déclencher en arrière-plan la synchronisation avec la table ai_conversations de Supabase
    this.syncConversationsFromCloud().catch(() => {});

    return localList;
  }

  async syncConversationsFromCloud() {
    if (!this.supabase || !this.isCloudConfigured()) return;

    try {
      let query = this.supabase
        .from('ai_conversations')
        .select('*');

      if (this.currentUser && this.isValidUuid(this.currentUser.id)) {
        query = query.eq('user_id', this.currentUser.id);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Erreur lecture Supabase ai_conversations:', error.message);
        return;
      }

      if (data && Array.isArray(data)) {
        const cloudConversations = data.map(row => ({
          id: row.id,
          uuid: row.id,
          title: row.titre || 'Discussion NORA',
          date: 'Synchronisé',
          prompt: (Array.isArray(row.messages) && row.messages[0]?.content) || '',
          response: (Array.isArray(row.messages) && row.messages[1]?.content) || '',
          messages: Array.isArray(row.messages) ? row.messages : []
        }));

        if (cloudConversations.length > 0) {
          const key = this.getUserConversationsKey();
          const existing = this.loadUserConversations();
          // Fusionner en évitant les doublons
          const mergedMap = new Map();
          cloudConversations.forEach(c => mergedMap.set(c.id, c));
          existing.forEach(c => {
            if (!mergedMap.has(c.id) && !mergedMap.has(c.uuid)) {
              mergedMap.set(c.id, c);
            }
          });
          const merged = Array.from(mergedMap.values());
          localStorage.setItem(key, JSON.stringify(merged));
          if (window.noraAppInstance && typeof window.noraAppInstance.onConversationsCloudSynced === 'function') {
            window.noraAppInstance.onConversationsCloudSynced(merged);
          }
        }
      }
    } catch (err) {
      console.warn('Sync cloud exception:', err);
    }
  }

  async saveUserConversations(conversations) {
    const key = this.getUserConversationsKey();
    try {
      localStorage.setItem(key, JSON.stringify(conversations));
    } catch (e) {}

    // Sauvegarde en temps réel dans la table public.ai_conversations de Supabase
    if (this.supabase && this.isCloudConfigured()) {
      for (const conv of conversations) {
        try {
          const targetId = (conv.uuid && this.isValidUuid(conv.uuid)) 
            ? conv.uuid 
            : (this.isValidUuid(conv.id) ? conv.id : this.generateUuid());
          
          conv.uuid = targetId;

          const messagesData = conv.messages && conv.messages.length ? conv.messages : [
            { role: 'user', content: conv.prompt || '' },
            { role: 'assistant', content: conv.response || '' }
          ];

          const payload = {
            id: targetId,
            titre: conv.title || 'Discussion sans titre',
            messages: messagesData
          };

          if (this.currentUser && this.isValidUuid(this.currentUser.id)) {
            payload.user_id = this.currentUser.id;
          }

          const { error } = await this.supabase
            .from('ai_conversations')
            .upsert(payload, { onConflict: 'id' });

          if (error) {
            console.warn('Erreur Supabase upsert ai_conversations:', error.message);
          }
        } catch (err) {
          console.warn('Exception sauvegarde ai_conversations:', err);
        }
      }
    }
  }
}

export const authService = new AuthService();
