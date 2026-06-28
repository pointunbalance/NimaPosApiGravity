const fs = require('fs');
const styleTag = `
    <style>
      /* Atomic Design Global Visual Feedback for Buttons */
      button:not(:disabled):not(.no-feedback) {
          transition: transform 0.1s ease-in-out, filter 0.1s ease-in-out, background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s !important;
      }
      button:not(:disabled):not(.no-feedback):active {
          transform: scale(0.96) !important;
          filter: brightness(0.95);
      }
    </style>
`;
const indexHtmlContent = fs.readFileSync('index.html', 'utf8');
if (!indexHtmlContent.includes('Atomic Design Global Visual Feedback')) {
    const updatedHtml = indexHtmlContent.replace('</head>', styleTag + '</head>');
    fs.writeFileSync('index.html', updatedHtml);
    console.log('Global button styles injected into index.html');
} else {
    console.log('Styles already exist in index.html');
}
