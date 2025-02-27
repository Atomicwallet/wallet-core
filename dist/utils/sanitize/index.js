export const sanitizeString = (str) => {
    if (typeof str === 'number') {
        return str;
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
//# sourceMappingURL=index.js.map