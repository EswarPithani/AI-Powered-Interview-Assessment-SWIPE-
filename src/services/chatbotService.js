// chatbotService.js

// ✅ Hugging Face API Configuration (working models)
const API_CONFIG = {
  HUGGING_FACE: {
    url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
    apiKey: '',
    enabled: true
  },
  HUGGING_FACE_BACKUP: {
    url: 'https://api-inference.huggingface.co/models/facebook/blenderbot-90M',
    apiKey: '',
    enabled: true
  },
  HUGGING_FACE_TEXT: {
    url: 'https://api-inference.huggingface.co/models/gpt2-medium',
    apiKey: '',
    enabled: true
  }
};

export class ResumeChatbot {
  constructor(useAI = true) {
    this.conversationState = {
      step: 'welcome',        // welcome → collect_missing → interview → complete
      collectedData: {},      // name, email, phone
      missingFields: [],      // fields yet to collect
      interviewStep: 0        // current question index
    };
    this.useAI = useAI;
    this.conversationHistory = [];
  }

  // Process user message and return bot response
  async processMessage(userMessage, currentState = null) {
    if (currentState) {
      this.conversationState = { ...this.conversationState, ...currentState };
    }

    const userInput = userMessage.trim();
    this.conversationHistory.push({ role: 'user', content: userInput });

    // Update missing fields state if needed
    this.updateStateWithUserInput(userInput);

    let botResponse;
    if (this.useAI) {
      botResponse = await this.generateAIResponse(userInput);
    } else {
      botResponse = await this.generateResponse();
    }

    this.conversationHistory.push({ role: 'assistant', content: botResponse });

    return {
      message: botResponse,
      state: this.conversationState,
      isComplete: this.conversationState.step === 'complete'
    };
  }

  // Initialize chatbot with parsed resume data
  initialize(parsedResume) {
    this.conversationState.collectedData = { ...parsedResume };
    this.conversationState.missingFields = this.findMissingFields(parsedResume);

    if (this.conversationState.missingFields.length === 0) {
      this.conversationState.step = 'complete';
      return "Great! I have all the information I need from your resume. Ready to start the interview?";
    } else {
      this.conversationState.step = 'collect_missing';
      return this.generateMissingFieldsMessage();
    }
  }

  // Generate AI response with fallbacks
  async generateAIResponse(userMessage) {
    try {
      // First handle missing fields
      if (this.conversationState.step === 'collect_missing' &&
        this.conversationState.missingFields.length > 0) {
        const currentField = this.conversationState.missingFields[0];
        const extracted = this.extractFieldData(currentField, userMessage);

        if (extracted) {
          this.conversationState.missingFields = this.conversationState.missingFields.slice(1);
          if (this.conversationState.missingFields.length === 0) {
            this.conversationState.step = 'complete';
          }

          if (this.conversationState.missingFields.length > 0) {
            return this.getFieldPrompt(this.conversationState.missingFields[0]);
          } else {
            return `Perfect! I have all your information. Let me confirm:
• Name: ${this.conversationState.collectedData.name}
• Email: ${this.conversationState.collectedData.email}
• Phone: ${this.conversationState.collectedData.phone || 'Not provided'}

Are you ready to start your AI-powered interview?`;
          }
        }
      }

      // Try DialoGPT first
      if (API_CONFIG.HUGGING_FACE.enabled) {
        try {
          const response = await this.callHuggingFaceAPI(userMessage, API_CONFIG.HUGGING_FACE.url);
          if (response) return response;
        } catch (e) {
          console.warn('DialoGPT failed:', e.message);
        }
      }

      // Backup: BlenderBot
      if (API_CONFIG.HUGGING_FACE_BACKUP.enabled) {
        try {
          const response = await this.callHuggingFaceAPI(userMessage, API_CONFIG.HUGGING_FACE_BACKUP.url);
          if (response) return response;
        } catch (e) {
          console.warn('BlenderBot failed:', e.message);
        }
      }

      // Backup: GPT-2
      if (API_CONFIG.HUGGING_FACE_TEXT.enabled) {
        try {
          const response = await this.callGPT2API(userMessage);
          if (response) return response;
        } catch (e) {
          console.warn('GPT-2 failed:', e.message);
        }
      }

      // Fallback to local AI
      return await this.callEnhancedLocalAI(userMessage);

    } catch (error) {
      console.error('All AI APIs failed:', error);
      return this.generateResponse();
    }
  }

  // Hugging Face API call
  async callHuggingFaceAPI(userMessage, apiUrl) {
    const prompt = this.buildAIPrompt(userMessage);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.HUGGING_FACE.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!res.ok) {
      if (res.status === 404) throw new Error('Model not found');
      throw new Error(`HF API error: ${res.status}`);
    }

    const data = await res.json();
    let generatedText = '';
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      generatedText = data[0].generated_text;
    }

    return this.cleanAIResponse(generatedText);
  }

  // GPT-2 API call
  async callGPT2API(userMessage) {
    const prompt = this.buildAIPrompt(userMessage);

    const res = await fetch(API_CONFIG.HUGGING_FACE_TEXT.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.HUGGING_FACE.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!res.ok) throw new Error(`GPT-2 API error: ${res.status}`);

    const data = await res.json();
    let generatedText = '';
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      generatedText = data[0].generated_text;
    }

    return this.cleanAIResponse(generatedText);
  }

  // Local fallback AI
  async callEnhancedLocalAI(userMessage) {
    const { step, missingFields } = this.conversationState;
    const input = userMessage.toLowerCase().trim();

    // Missing field prompts
    if (step === 'collect_missing' && missingFields.length > 0) {
      return this.getFieldPrompt(missingFields[0]);
    }

    // Basic conversational fallback
    if (input.includes('hello') || input.includes('hi')) return "Hello! I'm here to help you.";
    if (input.includes('thank')) return "You're welcome!";
    return "I understand. Let's continue.";
  }

  // Build AI prompt with context
  buildAIPrompt(userMessage) {
    const { step, missingFields, collectedData } = this.conversationState;
    let context = `You are a friendly recruitment assistant. Keep responses short and helpful.`;
    if (step === 'collect_missing' && missingFields.length > 0) {
      context += ` Collecting: ${missingFields.join(', ')}. Current data: ${JSON.stringify(collectedData)}.`;
    }

    const recentHistory = this.conversationHistory.slice(-4);
    if (recentHistory.length > 0) {
      context += ` Recent conversation: ${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join(' | ')}`;
    }

    return `${context}\nUser: ${userMessage}\nAssistant:`;
  }

  // Clean AI response
  cleanAIResponse(response) {
    if (!response) return "I understand. Please continue.";
    return response.split('\n')[0].replace(/Assistant:\s*/gi, '').trim().substring(0, 150);
  }

  // Collect missing fields from resume
  generateMissingFieldsMessage() {
    const missingCount = this.conversationState.missingFields.length;
    const fieldsList = this.conversationState.missingFields.join(', ');
    return `I found your resume but I need ${missingCount} more details: ${fieldsList}. Let's start with your ${this.conversationState.missingFields[0]}.`;
  }

  findMissingFields(resumeData) {
    const requiredFields = ['name', 'email', 'phone'];
    return requiredFields.filter(field =>
      !resumeData[field] || resumeData[field].trim() === ''
    );
  }

  updateStateWithUserInput(userInput) {
    const { step, missingFields } = this.conversationState;
    if (step === 'collect_missing' && missingFields.length > 0 && !this.useAI) {
      const currentField = missingFields[0];
      this.extractFieldData(currentField, userInput);
      if (this.conversationState.collectedData[currentField]) {
        this.conversationState.missingFields = missingFields.slice(1);
      }
      if (this.conversationState.missingFields.length === 0) {
        this.conversationState.step = 'complete';
      }
    }
  }

  extractFieldData(field, userInput) {
    const input = userInput.trim();
    switch (field) {
      case 'name':
        if (input.length > 1 && !input.includes('@') && !/\d/.test(input)) {
          this.conversationState.collectedData.name = this.formatName(input);
          return true;
        }
        break;
      case 'email':
        const emailMatch = input.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          this.conversationState.collectedData.email = emailMatch[0];
          return true;
        }
        break;
      case 'phone':
        const phoneMatch = input.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          this.conversationState.collectedData.phone = phoneMatch[0];
          return true;
        }
        break;
    }
    return false;
  }

  getFieldPrompt(field) {
    const prompts = {
      name: "What's your full name?",
      email: "What's your email address?",
      phone: "What's your phone number?"
    };
    return prompts[field] || `Please provide your ${field}:`;
  }

  formatName(input) {
    return input.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Default fallback response
  async generateResponse() {
    const { step } = this.conversationState;
    switch (step) {
      case 'welcome':
        return "Hello! I'm here to help you complete your profile before the interview.";
      case 'collect_missing':
        if (this.conversationState.missingFields.length > 0)
          return this.getFieldPrompt(this.conversationState.missingFields[0]);
        break;
      case 'complete':
        return "Perfect! Ready to start your AI-powered interview?";
      default:
        return "Let's continue.";
    }
  }
}

export const createChatbot = (useAI = true) => new ResumeChatbot(useAI);
