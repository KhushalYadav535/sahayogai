const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = 'd:\\sahayog\\Sahayog_AI_Test_Data_Kit_v2.0_Roles.xlsx';
const outDir = path.join(__dirname, '..', 'tests', 'fixtures');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

console.log('Reading Excel file...');
const workbook = xlsx.readFile(excelPath);

workbook.SheetNames.forEach(sheetName => {
    // Skip empty or purely informative sheets if you want, or just dump them all
    const sheet = workbook.Sheets[sheetName];
    // Skip the first title row, use row 2 as headers
    const data = xlsx.utils.sheet_to_json(sheet, { range: 1 });
    
    const fileName = sheetName.replace(/[^a-zA-Z0-9-]/g, '_') + '.json';
    const filePath = path.join(outDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Generated ${fileName} (${data.length} records)`);
});

console.log('Successfully generated JSON fixtures.');
