export type Partner = 'printemps' | 'redoute' | 'darty' | 'fnac' | 'ikea' | 'castorama' | 'sofinco';

export interface PartnerLogo {
  src: string;
  alt: string;
  bgColor?: string;
}

export const getPartnerLogo = (partner?: Partner): PartnerLogo | null => {
  if (!partner) return null;

  const logos: Record<Partner, PartnerLogo> = {
    printemps: {
      src: '/images/printemps2.jpg',
      alt: 'Printemps',
      bgColor: '#00D76A'
    },
    redoute: {
      src: '/images/laredoute.svg',
      alt: 'La Redoute',
      bgColor: '#FF3B57'
    },
    darty: {
      src: '/images/darty.png',
      alt: 'Darty',
      bgColor: '#00D76A'
    },
    fnac: {
      src: '/images/fnac.jpg',
      alt: 'Fnac',
      bgColor: '#00D76A'
    },
    ikea: {
      src: '/images/ikea.jpg',
      alt: 'Ikea',
      bgColor: '#00D76A'
    },
    castorama: {
      src: '/images/castorama.jpg',
      alt: 'Castorama',
      bgColor: '#0070CC'
    },
    sofinco: {
      src: '/logo.svg',
      alt: 'Sofinco'
    }
  };

  return logos[partner] || null;
};

export const getPartnerColor = (partner?: Partner): string => {
  const colors: Record<Partner, string> = {
    printemps: '#00D76A',
    redoute: '#FF3B57',
    darty: '#EF3032',
    fnac: '#FFCB00',
    ikea: '#0052A5',
    castorama: '#0070CC',
    sofinco: '#E30613'
  };

  return partner ? colors[partner] : '#6B7280';
};

export const mapPartnerIdToPartner = (partnerId: string): Partner | null => {
  const normalizedId = partnerId.toLowerCase().trim();

  const mapping: Record<string, Partner> = {
    'web_castorama': 'castorama',
    'castorama': 'castorama',
    'web_darty': 'darty',
    'web_fnac': 'fnac',
    'web_ikea': 'ikea',
    'web_printemps': 'printemps',
    'web_redoute': 'redoute',
    'web_laredoute': 'redoute',
    'sofinco': 'sofinco',
    'darty': 'darty',
    'fnac': 'fnac',
    'ikea': 'ikea',
    'printemps': 'printemps',
    'redoute': 'redoute',
    'laredoute': 'redoute'
  };

  return mapping[normalizedId] || null;
};

// Détecte le partenaire à partir d'un texte quelconque (nom de test, périmètre, etc.)
// Retourne sofinco par défaut si aucun partenaire trouvé
export const detectPartnerFromText = (text: string): Partner => {
  const normalized = text.toLowerCase();

  if (normalized.includes('castorama')) return 'castorama';
  if (normalized.includes('darty')) return 'darty';
  if (normalized.includes('fnac')) return 'fnac';
  if (normalized.includes('ikea')) return 'ikea';
  if (normalized.includes('printemps')) return 'printemps';
  if (normalized.includes('redoute') || normalized.includes('laredoute')) return 'redoute';
  if (normalized.includes('sofinco')) return 'sofinco';

  return 'sofinco';
};
