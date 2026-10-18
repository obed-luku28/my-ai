import { PHOTOGRAPHERS_DATA } from '../data/mockData.js';

const STORAGE_KEY_GEMINI = 'nora_gemini_api_key';
const STORAGE_KEY_MODEL = 'nora_gemini_model';

// User's Gemini API key from environment (.env) or localStorage
export const DEFAULT_GEMINI_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

export class GeminiService {
  constructor() {
    const hasStorage = typeof localStorage !== 'undefined';
    const savedKey = hasStorage ? localStorage.getItem(STORAGE_KEY_GEMINI) : null;
    // Use user's key if not set or if placeholder
    if (!savedKey || savedKey === 'AIzaSy...' || savedKey.trim() === '') {
      this.apiKey = DEFAULT_GEMINI_KEY;
      if (hasStorage && DEFAULT_GEMINI_KEY) localStorage.setItem(STORAGE_KEY_GEMINI, DEFAULT_GEMINI_KEY);
    } else {
      this.apiKey = savedKey;
    }

    const savedModel = hasStorage ? localStorage.getItem(STORAGE_KEY_MODEL) : null;
    // Ensure we use a supported fast flash model (gemini-flash-latest or gemini-3.8-flash)
    if (!savedModel || savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-2.0-flash') {
      this.model = DEFAULT_GEMINI_MODEL;
      if (hasStorage) localStorage.setItem(STORAGE_KEY_MODEL, DEFAULT_GEMINI_MODEL);
    } else {
      this.model = savedModel;
    }

    this.history = [];
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    if (typeof localStorage !== 'undefined') {
      if (this.apiKey) {
        localStorage.setItem(STORAGE_KEY_GEMINI, this.apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_GEMINI);
      }
    }
  }

  getModel() {
    return this.model;
  }

  setModel(model) {
    this.model = model || DEFAULT_GEMINI_MODEL;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MODEL, this.model);
    }
  }

  hasKey() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  clearHistory() {
    this.history = [];
  }

  /**
   * Detects if user query is asking to create or generate an image
   */
  isImagePrompt(prompt, activeMode = null) {
    if (activeMode === 'image') return true;
    const clean = prompt.trim().toLowerCase();
    if (clean.startsWith('/image') || clean.startsWith('[image]')) return true;

    // French and English flexible patterns for image creation
    const imagePatterns = [
      /^(créer?|crée|générer?|génère|dessiner?|dessine|peins|peindre|fais|imagine)(-moi)?\s+(une?\s+)?(image|photo|illustration|dessin|tableau|visuel|avatar|logo)/i,
      /(générer?|génère|créer?|crée|dessiner?|dessine|faire)(-moi)?\s+(une?\s+)?(image|photo|illustration|dessin|visuel)/i,
      /(peindre|illustrer|croquer)\s+(une?\s+)?(image|visuel|scène)/i,
      /^(create|generate|draw|paint|imagine)(-me)?\s+(an?\s+)?(image|picture|photo|illustration|drawing|artwork)/i,
      /(je veux|j'aimerais|peux-tu (me )?(faire|créer|générer|dessiner))\s+(une?\s+)?(image|illustration|photo)/i,
      /^(dessine|illustre)(-moi)?\s+/i
    ];

    return imagePatterns.some(pattern => pattern.test(clean));
  }

  /**
   * Cleans and prepares prompt for image generation
   */
  extractImagePrompt(prompt) {
    let clean = prompt.trim();
    clean = clean.replace(/^\/image\s*/i, '');
    clean = clean.replace(/^\[image\]\s*/i, '');

    // Strip out introductory filler words
    clean = clean.replace(/^(créer?|crée|générer?|génère|dessiner?|dessine|fais|peins|imagine)(-moi)?\s+(une?\s+)?(image|photo|illustration|dessin|tableau|picture)?\s*(de|d'|du|des|of|showing|representing)?\s*/i, '');
    clean = clean.replace(/^(je veux|j'aimerais|peux-tu (me )?(faire|créer|générer|dessiner))\s+(une?\s+)?(image|illustration|photo)?\s*(de|d'|du|des)?\s*/i, '');
    clean = clean.replace(/^(dessine|illustre)(-moi)?\s*/i, '');
    clean = clean.trim();
    if (!clean) clean = prompt;
    return clean;
  }

  /**
   * Generates a high quality image using Pollinations FLUX engine
   */
  async generateImage(prompt) {
    const cleanDesc = this.extractImagePrompt(prompt);
    const seed = Math.floor(Math.random() * 9999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanDesc)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    return {
      isImage: true,
      imageUrl: imageUrl,
      prompt: cleanDesc,
      seed: seed,
      header: 'Création d’image NORA',
      message: `Voici votre création visuelle générée avec succès pour : **"${cleanDesc}"**`,
      footer: 'Cliquez sur l’image pour la voir en plein écran ou téléchargez-la en haute définition.'
    };
  }

  /**
   * Main conversational query (handles chat, image generation, code creation)
   */
  async sendMessage(userPrompt, mode = 'ai', activeMode = null) {
    // If it's an image request, handle image generation directly and quickly
    if (this.isImagePrompt(userPrompt, activeMode)) {
      return await this.generateImage(userPrompt);
    }

    if (!this.hasKey()) {
      return this.mockResponse(userPrompt, mode);
    }

    try {
      return await this.callGeminiAPI(userPrompt, mode, activeMode);
    } catch (error) {
      console.warn('Gemini API Error:', error);
      throw error;
    }
  }

  async callGeminiAPI(userPrompt, mode, activeMode = null) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Read connected plugins from localStorage
    let connectedPluginsText = '';
    try {
      const savedPlugins = JSON.parse(localStorage.getItem('nora_plugins_config') || '{}');
      const activeIds = Object.keys(savedPlugins).filter(k => savedPlugins[k]?.connected);
      if (activeIds.length > 0) {
        connectedPluginsText = `\nActive connected integrations available to you: ${activeIds.join(', ')}. When the user requests actions related to these tools (such as sending emails via Gmail, messaging via WhatsApp, adding notes to Notion, or checking Drive files), confirm the action smoothly and explain what you will do.`;
      }
    } catch (e) {}

    let modeSpecificInstruction = '';
    if (activeMode === 'code' || /^(code|programmer|écris(-moi)? un code|script|fonction|créer? (du|des|un) code)/i.test(userPrompt)) {
      modeSpecificInstruction = `\nThe user is requesting CODE CREATION. You are a senior principal software engineer. Provide clean, modern, bug-free, and well-commented code. Always wrap all code in Markdown code blocks specifying the language name (e.g., \`\`\`javascript, \`\`\`python, \`\`\`html, \`\`\`css, \`\`\`sql). Give a concise summary of how the code works and how to run it.`;
    }

    const systemInstruction = `You are NORA, an ultra-modern, warm, empathetic, and exceptionally capable AI assistant.${connectedPluginsText}${modeSpecificInstruction}
Always answer in the language used by the user (French if user writes in French, English if English). Respond swiftly and with elegance.
When the user asks for recommendations, vendors, photographers, places or products:
Include a structured recommendation card block in your output formatted as valid JSON inside a \`\`\`json\`\`\` code fence with this schema:
{
  "type": "recommendations",
  "header": "Results",
  "message": "A short, warm intro sentence (1-2 sentences)",
  "items": [
    {
      "id": "item-id",
      "name": "Full Name or Title",
      "price": "From US$XXX or Price Range",
      "rating": 4.9,
      "tags": ["Tag 1", "Tag 2"],
      "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      "location": "City or Region",
      "bio": "Short description of style and specialty"
    }
  ],
  "footer": "A friendly closing offer to help further."
For coding or script requests, always format code in clean Markdown code blocks \`\`\`language.
Structure and layout requirements for your answers:
- Organize your answers into clear, beautifully structured thematic sections (Thèmes), paragraphs, and bullet points.
- For thematic section titles, write clear headings with an emoji: '### 🚀 Nom du thème' or '### 💡 Sujet'.
- Write clean, well-spaced paragraphs (2-3 sentences max) that are enjoyable to read.
- For lists or feature breakdowns, always use bullet points with '• '. Bold the key label at the start of each point (e.g., '• **Nom du projet** : Explication claire et concise.').
- Avoid raw unformatted text blocks. Prioritize clarity, brevity, and elegance.`;

    // Append user message to history
    this.history.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: this.history,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Erreur serveur HTTP ${response.status}`;
      // Remove last user prompt if failed
      this.history.pop();
      throw new Error(msg);
    }

    const data = await response.json();
    const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Append assistant response to history
    this.history.push({
      role: 'model',
      parts: [{ text: rawReply }]
    });

    return this.parseGeminiReply(rawReply, userPrompt);
  }

  parseGeminiReply(text, prompt) {
    // Check if reply contains a ```json ... ``` recommendations block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type === 'recommendations' && Array.isArray(parsed.items)) {
          // Clean the surrounding text if any
          const cleanText = text.replace(/```json[\s\S]*?```/, '').trim();
          return {
            isRecommendation: true,
            header: parsed.header || 'Results',
            message: parsed.message || cleanText || 'Voici les résultats sélectionnés pour vous :',
            items: parsed.items,
            footer: parsed.footer || 'Faites-moi savoir si vous souhaitez plus de détails ou d’autres suggestions !'
          };
        }
      } catch (e) {
        console.warn('JSON parsing failed from Gemini output, displaying as markdown:', e);
      }
    }

    // Default conversational reply
    return {
      isRecommendation: false,
      header: 'NORA',
      message: text,
      footer: ''
    };
  }

  /**
   * Smart Mock Response for testing without API key
   */
  async mockResponse(userPrompt, mode) {
    await new Promise(r => setTimeout(r, 750));

    const lower = userPrompt.toLowerCase();

    if (lower.includes('photographer') || lower.includes('wedding') || lower.includes('s.f') || lower.includes('mariage') || lower.includes('photo')) {
      return {
        isRecommendation: true,
        header: 'Results',
        message: 'Got it! These top picks in SF are all experienced female photographers who know how to capture love stories beautifully.',
        items: PHOTOGRAPHERS_DATA,
        footer: 'Hope one of these photographers captures your love story perfectly! Let me know if you need anything else 😊'
      };
    }

    if (lower.includes('vœu') || lower.includes('mariage') || lower.includes('voeu')) {
      return {
        isRecommendation: false,
        header: 'NORA',
        message: `Voici une proposition de vœu poétique et émouvante :\n\n*"Je te choisis aujourd’hui, non pas seulement pour ce que tu es, mais pour tout ce que je deviens à tes côtés. Devant nos proches, je promets d'être ton havre de paix dans la tempête, ton complice de chaque rire, et la main qui ne lâchera jamais la tienne. À travers chaque saison de la vie, je t'aimerai avec tendresse, patience et émerveillement."*\n\nSouhaitez-vous que nous l'adaptions avec des souvenirs ou anecdotes qui vous sont chers ? ✨`,
        footer: ''
      };
    }

    return {
      isRecommendation: false,
      header: 'NORA',
      message: `Je suis bien là ! Vous avez demandé : **"${userPrompt}"**.\n\nEn tant qu'assistante NORA, je peux vous aider à rechercher des prestataires, concevoir des projets créatifs, rédiger des textes inspirants, ou répondre à n'importe quelle question complexe.\n\n*Astuce : Vous pouvez connecter votre propre clé API Gemini en haut à droite pour dialoguer en illimité !* 😊`,
      footer: ''
    };
  }
}

export const geminiService = new GeminiService();
