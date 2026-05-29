// lib/message-filter.ts

const RESTRICTED_PATTERNS = {
  phone: /(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  whatsapp: /(whatsapp|wa\.me|wa\.link|chat\.whatsapp)/gi,
  telegram: /(t\.me|telegram\.me|telegram\.dog)/gi,
  instagram: /(instagram\.com\/|instagr\.am\/|@[a-zA-Z0-9_.]{2,})/gi,
  twitter: /(twitter\.com\/|x\.com\/|@[a-zA-Z0-9_]{2,})/gi,
  facebook: /(facebook\.com\/|fb\.com\/|fb\.me\/)/gi,
  tiktok: /(tiktok\.com\/|@tiktok)/gi,
  snapchat: /(snapchat\.com\/|snapchat\.me\/)/gi,
  linkedin: /(linkedin\.com\/in\/)/gi
};

const CONTACT_PHRASES = [
  /call\s+me\s+at\s+[\d\s\-\(\)]+/gi,
  /text\s+me\s+at\s+[\d\s\-\(\)]+/gi,
  /my\s+(phone|number|cell|mobile|contact)\s+is\s+[\d\s\-\(\)]+/gi,
  /email\s+me\s+at\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  /contact\s+me\s+via\s+(email|phone|whatsapp)/gi,
  /hit\s+me\s+up\s+at\s+[\d\s\-\(\)@\.]+/gi,
  /you\s+can\s+(call|text|email|message)\s+me\s+at\s+[\d\s\-\(\)@\.]+/gi
];

export interface DetectionResult {
  hasRestricted: boolean;
  types: string[];
}

export function detectRestrictedContent(message: string): DetectionResult {
  const detectedTypes: string[] = [];
  
  for (const [type, pattern] of Object.entries(RESTRICTED_PATTERNS)) {
    if (pattern.test(message)) {
      detectedTypes.push(type);
    }
  }
  
  for (const pattern of CONTACT_PHRASES) {
    if (pattern.test(message)) {
      detectedTypes.push('contact_request');
      break;
    }
  }
  
  return {
    hasRestricted: detectedTypes.length > 0,
    types: [...new Set(detectedTypes)]
  };
}

export function getRestrictedTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    phone: 'Phone Number',
    email: 'Email Address',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    linkedin: 'LinkedIn',
    contact_request: 'Contact Information'
  };
  return labels[type] || type;
}