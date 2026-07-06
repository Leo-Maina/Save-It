// ============================================================
// Formatting utilities — Kenyan Shillings only, no conversion.
// ============================================================

export function formatKSh(amount, { decimals = 0 } = {}) {
    const value = Number(amount) || 0;
    return `KSh ${value.toLocaleString('en-KE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}`;
}

export function formatDate(dateString, options = {}) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options
    });
}

export function formatDateShort(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export function toInputDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}

export function daysUntil(dateString) {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export const CATEGORY_COLORS = {
    Food: '#E8623D',
    Transport: '#D8A53D',
    Accommodation: '#0F5C4D',
    Academic: '#5B7FBF',
    Miscellaneous: '#9A8C78',
    Allowance: '#7FA88F',
    'Part-time earnings': '#0F5C4D',
    Bursary: '#D8A53D',
    'Other income': '#9A8C78'
};

export function colorForCategory(name) {
    return CATEGORY_COLORS[name] || '#7FA88F';
}
