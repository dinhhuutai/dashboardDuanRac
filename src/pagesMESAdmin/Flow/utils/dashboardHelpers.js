export function cleanParams(obj = {}) {
  const result = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });

  return result;
}

export function safeValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
}

export function formatDateTime(value) {
  if (!value) return '-';

  const str = String(value).replace('T', ' ').split('.')[0];
  const parts = str.split(' ');

  if (parts.length < 2) return str;

  const [datePart, timePart] = parts;
  const [year, month, day] = datePart.split('-');

  const time = timePart.slice(0, 5); // HH:mm

  return `${time} ${day}-${month}-${year}`;
}

export function formatDateParam(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}