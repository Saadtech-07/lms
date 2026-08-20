const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchRegex = (search) => {
  const trimmed = String(search || '').trim();

  if (!trimmed) {
    return null;
  }

  return new RegExp(escapeRegex(trimmed), 'i');
};

const buildExactMatchRegex = (value) => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return null;
  }

  return new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
};

const isAllFilterValue = (value) => {
  if (!isPresentValue(value)) {
    return true;
  }

  return String(value).trim().toUpperCase() === 'ALL';
};

const isPresentValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

module.exports = {
  escapeRegex,
  buildSearchRegex,
  buildExactMatchRegex,
  isAllFilterValue,
  isPresentValue,
};
