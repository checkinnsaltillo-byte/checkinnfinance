
const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
app.use(cors());

function loadBudgetFromExcel() {
  const filePath = './presupuesto_sys.xlsx';
  if (!fs.existsSync(filePath)) return [];

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  return data.map(row => ({
    categoria: row.CATEGORIA || '',
    concepto: row.CONCEPTO || '',
    mensual: Number(row.MENSUAL || 0),
    anual: Number(row.ANUAL || 0)
  }));
}

app.get('/api/data', async (req, res) => {
  try {
    // Simulación: aquí debes mantener tu fetch real de records
    const records = []; 

    const budget = loadBudgetFromExcel();

    res.json({ records, budget });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server running on port', PORT));
