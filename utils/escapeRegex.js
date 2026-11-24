/**
 * دالة لتنظيف وتأمين نصوص الاستعلامات لمنع ثغرات ReDoS (Regular Expression Denial of Service)
 */
function escapeRegex(text = '') {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = escapeRegex;
