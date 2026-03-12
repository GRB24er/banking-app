export const API_BASE_URL = 'https://www.horizonglobalcapital.com';

export const endpoints = {
  auth: {
    login: '/api/auth/mobile',
    verify: '/api/auth/mobile',
    register: '/api/auth/register',
  },
  transactions: '/api/mobile/transactions',
  cards: '/api/mobile/cards',
  transfers: '/api/mobile/transfers',
  deposits: '/api/mobile/deposits',
};
