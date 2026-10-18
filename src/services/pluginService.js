const STORAGE_KEY_PLUGINS = 'nora_plugins_config';

export const AVAILABLE_PLUGINS = [
  {
    id: 'gmail',
    name: 'Gmail & Mail',
    category: 'communication',
    iconClass: 'fa-solid fa-envelope',
    iconColor: '#EA4335',
    iconBg: '#FCE8E6',
    summary: 'Lecture, rédaction de brouillons et envoi automatisé d’emails.',
    description: 'Permet à NORA d’interagir avec vos emails, de résumer vos courriels reçus et de préparer des réponses soignées.',
    fields: [
      { key: 'apiKey', label: 'Clé API Google / Client ID', type: 'password', placeholder: 'AIzaSy... ou client_id.apps.googleusercontent.com' },
      { key: 'email', label: 'Adresse Email associée', type: 'email', placeholder: 'votre.nom@gmail.com' }
    ],
    helpUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'communication',
    iconClass: 'fa-brands fa-whatsapp',
    iconColor: '#25D366',
    iconBg: '#E9F9EF',
    summary: 'Envoi de messages, notifications et réponses automatiques WhatsApp.',
    description: 'Connectez l’API WhatsApp Cloud ou Meta for Developers pour envoyer des messages de confirmation et dialoguer avec vos contacts.',
    fields: [
      { key: 'accessToken', label: 'Token d’accès temporaire ou permanent (Bearer)', type: 'password', placeholder: 'EAA...' },
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: '109876543210987' },
      { key: 'wabaId', label: 'WhatsApp Business Account ID (WABA)', type: 'text', placeholder: '987654321098765' }
    ],
    helpUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api'
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    iconClass: 'fa-solid fa-book-bookmark',
    iconColor: '#000000',
    iconBg: '#F3F4F6',
    summary: 'Création de pages, synchronisation de notes et bases de données.',
    description: 'Permet à NORA de rechercher dans vos documents Notion, d’ajouter de nouvelles tâches et de structurer vos synthèses de réunion.',
    fields: [
      { key: 'integrationToken', label: 'Internal Integration Token (secret_...)', type: 'password', placeholder: 'secret_AbCdEf123456...' },
      { key: 'databaseId', label: 'ID de base de données par défaut (Optionnel)', type: 'text', placeholder: '32 caractères hexadécimaux' }
    ],
    helpUrl: 'https://www.notion.so/my-integrations'
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    category: 'storage',
    iconClass: 'fa-brands fa-google-drive',
    iconColor: '#0F9D58',
    iconBg: '#E6F4EA',
    summary: 'Accès aux documents, lecture de fichiers PDF et sauvegarde cloud.',
    description: 'Donne accès à vos documents de travail, feuilles de calcul et fichiers partagés pour que NORA puisse les analyser.',
    fields: [
      { key: 'apiKey', label: 'Clé API Google Drive / Service Account', type: 'password', placeholder: 'AIzaSy...' },
      { key: 'folderId', label: 'ID du dossier racine partagé (Optionnel)', type: 'text', placeholder: '1a2b3c4d5e...' }
    ],
    helpUrl: 'https://console.cloud.google.com/apis/library/drive.googleapis.com'
  },
  {
    id: 'gcalendar',
    name: 'Google Calendar',
    category: 'productivity',
    iconClass: 'fa-regular fa-calendar-check',
    iconColor: '#1A73E8',
    iconBg: '#E8F0FE',
    summary: 'Consultation de l’agenda, planification de créneaux et rappels.',
    description: 'NORA peut vérifier vos disponibilités et bloquer des événements dans votre calendrier.',
    fields: [
      { key: 'apiKey', label: 'Clé API Google Calendar', type: 'password', placeholder: 'AIzaSy...' }
    ],
    helpUrl: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com'
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    iconClass: 'fa-brands fa-slack',
    iconColor: '#4A154B',
    iconBg: '#F5ECF5',
    summary: 'Diffusion d’alertes et partage de résumés dans vos canaux.',
    description: 'Envoyez des messages automatisés et des rapports synthétiques directement dans les canaux de votre équipe.',
    fields: [
      { key: 'botToken', label: 'Bot User OAuth Token (xoxb-...)', type: 'password', placeholder: 'xoxb-...' },
      { key: 'defaultChannel', label: 'Canal par défaut (#general, etc.)', type: 'text', placeholder: '#general' }
    ],
    helpUrl: 'https://api.slack.com/apps'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'developer',
    iconClass: 'fa-brands fa-github',
    iconColor: '#24292F',
    iconBg: '#F3F4F6',
    summary: 'Exploration de dépôts, suivi des issues et revue de pull requests.',
    description: 'Permet à NORA d’inspecter votre code source, d’ouvrir des tickets et d’automatiser des workflows de développement.',
    fields: [
      { key: 'patToken', label: 'Personal Access Token (ghp_...)', type: 'password', placeholder: 'ghp_...' },
      { key: 'repo', label: 'Dépôt principal (ex: username/repo)', type: 'text', placeholder: 'mon-compte/mon-projet' }
    ],
    helpUrl: 'https://github.com/settings/tokens'
  }
];

export class PluginService {
  constructor() {
    this.configs = this.loadConfigs();
  }

  loadConfigs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLUGINS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveConfigs() {
    try {
      localStorage.setItem(STORAGE_KEY_PLUGINS, JSON.stringify(this.configs));
    } catch (e) {}
  }

  getPluginConfig(pluginId) {
    return this.configs[pluginId] || { connected: false, enabled: false, data: {} };
  }

  setPluginConfig(pluginId, data, enabled = true) {
    this.configs[pluginId] = {
      connected: true,
      enabled: Boolean(enabled),
      updatedAt: Date.now(),
      data: data || {}
    };
    this.saveConfigs();
  }

  disconnectPlugin(pluginId) {
    if (this.configs[pluginId]) {
      delete this.configs[pluginId];
      this.saveConfigs();
    }
  }

  isPluginConnected(pluginId) {
    return Boolean(this.configs[pluginId]?.connected);
  }

  getConnectedCount() {
    return Object.values(this.configs).filter(c => c.connected).length;
  }

  getConnectedPluginsList() {
    return AVAILABLE_PLUGINS.filter(p => this.isPluginConnected(p.id));
  }
}

export const pluginService = new PluginService();
