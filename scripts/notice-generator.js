const fs = require('fs');

const inputFile = 'licenses.json';
const outputFile = 'NOTICE';

const generateNotice = () => {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const notice = [
    'This project includes software developed by third parties.',
    '',
    '### Dependencies and Licenses:',
    '',
  ];

  Object.entries(data).forEach(([key, value]) => {
    notice.push(
      `${key.split('@')[0]} (v${key.split('@')[1]})`,
      `   - License: ${value.licenses}`,
      `   - Repository: ${value.repository || 'N/A'}`,
      `   - Publisher: ${value.publisher || 'N/A'}`,
      `   - Email: ${value.email || 'N/A'}`,
      '',
    );
  });

  fs.writeFileSync(outputFile, notice.join('\n'), 'utf-8');
  console.log(`NOTICE file has been generated: ${outputFile}`);
};

generateNotice();
