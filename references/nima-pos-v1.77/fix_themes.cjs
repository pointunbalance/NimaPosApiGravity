const fs = require('fs');

const themes = [
    { name: 'nature', c50: '#ecfdf5', c100: '#dcfce7', c200: '#bbf7d0', c300: '#6ee7b7', c600: '#059669', c700: '#047857', c900: '#064e3b' },
    { name: 'rose', c50: '#fff1f2', c100: '#ffe4e6', c200: '#fecdd3', c300: '#fda4af', c600: '#e11d48', c700: '#be123c', c900: '#881337' },
    { name: 'lavender', c50: '#f5f3ff', c100: '#ede9fe', c200: '#ddd6fe', c300: '#c4b5fd', c600: '#7c3aed', c700: '#6d28d9', c900: '#4c1d95' },
    { name: 'sunset', c50: '#fffbeb', c100: '#fef3c7', c200: '#fde68a', c300: '#fcd34d', c600: '#d97706', c700: '#b45309', c900: '#78350f' }
];

for (const t of themes) {
    const css = `/* ${t.name} Theme */
html.${t.name} body, html.${t.name} {
  background-color: ${t.c100} !important;
  color: ${t.c900} !important;
}

html.${t.name} .bg-white { background: linear-gradient(135deg, #ffffff 0%, ${t.c50} 100%) !important; }
html.${t.name} .bg-slate-50, html.${t.name} .bg-gray-50 { background: linear-gradient(135deg, ${t.c50} 0%, ${t.c100} 100%) !important; }
html.${t.name} .bg-slate-100, html.${t.name} .bg-gray-100 { background-color: ${t.c200} !important; }
html.${t.name} .border-slate-100, html.${t.name} .border-gray-100, html.${t.name} .border-slate-200, html.${t.name} .border-gray-200 { border-color: ${t.c200} !important; }
html.${t.name} .border-slate-300, html.${t.name} .border-gray-300 { border-color: ${t.c300} !important; }

html.${t.name} .text-slate-500, html.${t.name} .text-gray-500 { color: ${t.c600} !important; }
html.${t.name} .text-slate-600, html.${t.name} .text-gray-600, html.${t.name} .text-slate-700, html.${t.name} .text-gray-700 { color: ${t.c700} !important; }
html.${t.name} .text-slate-800, html.${t.name} .text-gray-800, html.${t.name} .text-slate-900, html.${t.name} .text-gray-900, html.${t.name} .text-black, html.${t.name} .text-indigo-900 { color: ${t.c900} !important; }

/* Dashboard Active Tabs Override */
html.${t.name} .bg-indigo-50 { background-color: ${t.c200} !important; }
html.${t.name} .text-indigo-700, html.${t.name} .text-indigo-600, html.${t.name} .text-indigo-500 { color: ${t.c700} !important; }
`;
    fs.writeFileSync('public/themes/' + t.name + '.css', css);
}

console.log('Themes updated successfully!');
