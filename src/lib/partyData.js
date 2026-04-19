export const partyCatalog = {
  'all india trinamool congress': {
    shortName: 'AITC',
    bengaliName: 'সর্বভারতীয় তৃণমূল কংগ্রেস',
    symbol: 'Flowers & Grass',
    bengaliSymbol: 'ফুল ও ঘাস',
    symbolImage: '/aitc-symbol.png',
    color: '#22c55e',
  },
  'bharatiya janata party': {
    shortName: 'BJP',
    bengaliName: 'ভারতীয় জনতা পার্টি',
    symbol: 'Lotus',
    bengaliSymbol: 'পদ্ম',
    symbolImage: '/bjp-symbol.svg',
    color: '#f97316',
  },
  'communist party of india (marxist)': {
    shortName: 'CPI(M)',
    bengaliName: 'ভারতের কমিউনিস্ট পার্টি (মার্কসবাদী)',
    symbol: 'Hammer, Sickle & Star',
    bengaliSymbol: 'হাতুড়ি, কাস্তে ও তারা',
    symbolImage: '/cpim-symbol.png',
    color: '#ef4444',
  },
  'indian national congress': {
    shortName: 'INC',
    bengaliName: 'ভারতীয় জাতীয় কংগ্রেস',
    symbol: 'Hand',
    bengaliSymbol: 'হাত',
    symbolImage: '/inc-symbol.svg',
    color: '#3b82f6',
  },
  'all india forward bloc': {
    shortName: 'AIFB',
    bengaliName: 'অল ইন্ডিয়া ফরওয়ার্ড ব্লক',
    symbol: 'Lion',
    bengaliSymbol: 'সিংহ',
    symbolImage: '/aifb-symbol.png',
    color: '#a855f7',
  },
};

export const defaultParties = [
  { name: 'All India Trinamool Congress', seats: 142 },
  { name: 'Bharatiya Janata Party', seats: 110 },
  { name: 'Communist Party of India (Marxist)', seats: 54 },
  { name: 'Indian National Congress', seats: 36 },
  { name: 'All India Forward Bloc', seats: 12 },
];

export const defaultTemplateMeta = {
  stateName: 'West Bengal',
  totalSeats: 354,
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
