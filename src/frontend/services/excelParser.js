import * as XLSX from 'xlsx';

export function parseScheduleFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets = workbook.SheetNames;

        const result = {};
        sheets.forEach(name => {
          const sheet = workbook.Sheets[name];
          result[name] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
