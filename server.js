const express = require('express');
const hbs = require('hbs');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir archivos estáticos (CSS, imágenes, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Cargar el JSON de datos
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Ruta para visualizar las tablas en HTML
app.get('/', (req, res) => {
  res.render('tables', { data });
});

// Ruta para generar el PDF y almacenarlo en la carpeta public/pdfs
app.get('/generate-pdf', async (req, res) => {
  try {
    // Asegúrate de que la carpeta public/pdfs existe, si no, la crea
    const pdfDir = path.join(__dirname, 'public', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Iniciar Puppeteer en modo headless
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Navegar a la página local donde se renderizan las tablas
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Definir la ruta donde se almacenará el archivo PDF
    const pdfFilePath = path.join(pdfDir, 'output.pdf');

    // Generar y guardar el PDF en la carpeta public/pdfs
    await page.pdf({
      path: pdfFilePath,  // Guardar en el sistema de archivos
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    // Cerrar el navegador
    await browser.close();

    // Enviar una respuesta al cliente
    res.send(`PDF generado y guardado en: <a href="/public/pdfs/output.pdf">Descargar PDF</a>`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).send('Error al generar PDF');
  }
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
