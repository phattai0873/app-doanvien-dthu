const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve('..', 'Docs', 'Copy of DanhSachDoanvien chi doan 1.xlsx');
try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("Header (row 5):", data[4]);
    console.log("Sample row (row 7):", data[6]);
} catch (e) {
    console.error(e.message);
}
