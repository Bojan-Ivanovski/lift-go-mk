import saved from '../content/site.json';

// Editors enter one phone number. Display text and the call link cannot drift apart.
const digits = saved.business.phoneDisplay.replace(/\D/g, '');
const phoneInternational = digits.startsWith('389') ? `+${digits}` : `+389${digits.slice(1)}`;

export default {
  ...saved,
  business: { ...saved.business, phoneInternational },
};
