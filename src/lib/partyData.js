export const partyCatalog = {
  'all india trinamool congress': {
    shortName: 'AITC',
    bengaliName: 'সর্বভারতীয় তৃণমূল কংগ্রেস',
    symbol: 'Flowers & Grass',
    bengaliSymbol: 'ফুল ও ঘাস',
    symbolImage: '/api/party-symbols/aitc-symbol.png',
    color: '#22c55e',
  },
  'bharatiya janata party': {
    shortName: 'BJP',
    bengaliName: 'ভারতীয় জনতা পার্টি',
    symbol: 'Lotus',
    bengaliSymbol: 'পদ্ম',
    symbolImage: '/api/party-symbols/bjp-symbol.svg',
    color: '#f97316',
  },
  'communist party of india (marxist)': {
    shortName: 'CPI(M)',
    bengaliName: 'ভারতের কমিউনিস্ট পার্টি (মার্কসবাদী)',
    symbol: 'Hammer, Sickle & Star',
    bengaliSymbol: 'হাতুড়ি, কাস্তে ও তারা',
    symbolImage: '/api/party-symbols/cpim-symbol.png',
    color: '#ef4444',
  },
  'indian national congress': {
    shortName: 'INC',
    bengaliName: 'ভারতীয় জাতীয় কংগ্রেস',
    symbol: 'Hand',
    bengaliSymbol: 'হাত',
    symbolImage: '/api/party-symbols/inc-symbol.svg',
    color: '#3b82f6',
  },
  'all india forward bloc': {
    shortName: 'OTH',
    bengaliName: 'Others',
    symbol: 'Election Symbol',
    bengaliSymbol: 'Election Symbol',
    symbolImage: '/api/party-symbols/oth-symbol.svg',
    color: '#64748b',
  },
  oth: {
    shortName: 'OTH',
    bengaliName: 'Others',
    symbol: 'Election Symbol',
    bengaliSymbol: 'Election Symbol',
    symbolImage: '/api/party-symbols/oth-symbol.svg',
    color: '#64748b',
  },
};

export const defaultParties = [
  { name: 'All India Trinamool Congress', seats: 96 },
  { name: 'Bharatiya Janata Party', seats: 75 },
  { name: 'Communist Party of India (Marxist)', seats: 37 },
  { name: 'Indian National Congress', seats: 24 },
  { name: 'OTH', seats: 8 },
];

export const defaultTemplateMeta = {
  stateName: 'West Bengal',
  totalSeats: 254,
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
};

export function enrichParty(party) {
  const key = party.name?.trim().toLowerCase();
  const entry = key ? partyCatalog[key] : null;

  if (!entry) {
    return party;
  }

  return {
    ...entry,
    ...party,
    shortName: party.shortName ?? entry.shortName,
    bengaliName: party.bengaliName ?? entry.bengaliName,
    symbol: party.symbol ?? entry.symbol,
    bengaliSymbol: party.bengaliSymbol ?? entry.bengaliSymbol,
    symbolImage: party.symbolImage ?? entry.symbolImage,
    color: party.color ?? entry.color,
  };
}
