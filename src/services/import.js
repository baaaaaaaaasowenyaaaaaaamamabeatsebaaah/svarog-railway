import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importCSV(filePath) {
  console.log(`Starting CSV import from file: ${filePath}`);

  // Check if the file exists before processing
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .on('error', (error) => {
        console.error(`Error opening the file: ${error}`);
        reject(error);
      })
      .pipe(csv())
      .on('headers', (headers) => {
        console.log(`CSV headers found: ${headers.join(', ')}`);
      })
      .on('data', (row) => {
        console.log(`Processing row: ${JSON.stringify(row)}`);
        try {
          const parsedRow = {
            artikelNummer: row['ARTIKELNUMMER'], // Correct Prisma schema field
            artikelBezeichnung: row['ARTIKELBEZEICHNUNG'], // Correct Prisma schema field
            ean: row['EAN'],
            beschreibung: row['BESCHREIBUNG'],
            herstellerArtikelNummer: row['HERSTELLERARTIKELNUMMER'], // Correct Prisma schema field
            einkaufsPreis:
              parseFloat(row['EINKAUFSPREIS']?.replace('$', '').trim()) || 0,
            nettPreis:
              parseFloat(row['NETTOPREIS1']?.replace('$', '').trim()) || 0,
            gewicht: parseFloat(row['GEWICHT']) || 0,
          };

          // Check if parsed row data is valid
          if (!parsedRow.artikelNummer || !parsedRow.artikelBezeichnung) {
            console.warn(
              `Row missing essential fields: ${JSON.stringify(row)}`
            );
          } else {
            results.push(parsedRow);
          }
        } catch (error) {
          console.error(`Error parsing row: ${error.message}`);
        }
      })
      .on('end', async () => {
        console.log(`Finished reading CSV. Total rows: ${results.length}`);

        if (results.length === 0) {
          console.warn('No data to import from the CSV.');
          resolve();
          return;
        }

        try {
          for (const row of results) {
            console.log(
              `Upserting manufacturer and device for row: ${JSON.stringify(
                row
              )}`
            );

            const manufacturerName = row.artikelBezeichnung.split(' ')[2]; // Extract manufacturer name from 'artikelBezeichnung'
            console.log(`Extracted manufacturer name: ${manufacturerName}`);

            // Upsert the manufacturer using your custom field `UniqueManufacturer`
            const manufacturer = await prisma.uniqueManufacturer.upsert({
              where: { name: manufacturerName },
              update: {},
              create: { name: manufacturerName },
            });

            console.log(`Upserted manufacturer with ID: ${manufacturer.id}`);

            // Upsert the device using your custom field `UniqueDevice`
            const device = await prisma.uniqueDevice.upsert({
              where: {
                artikelNummer: row.artikelNummer, // Using correct unique field `artikelNummer`
              },
              update: {
                artikelBezeichnung: row.artikelBezeichnung,
                ean: row.ean,
                beschreibung: row.beschreibung,
                herstellerArtikelNummer: row.herstellerArtikelNummer,
                einkaufsPreis: row.einkaufsPreis,
                nettPreis: row.nettPreis,
                gewicht: row.gewicht,
                uniqueManufacturerId: manufacturer.id, // Correct relation ID
              },
              create: {
                artikelNummer: row.artikelNummer,
                artikelBezeichnung: row.artikelBezeichnung,
                ean: row.ean,
                beschreibung: row.beschreibung,
                herstellerArtikelNummer: row.herstellerArtikelNummer,
                einkaufsPreis: row.einkaufsPreis,
                nettPreis: row.nettPreis,
                gewicht: row.gewicht,
                uniqueManufacturerId: manufacturer.id, // Correct relation ID
              },
            });

            console.log(`Upserted device with ID: ${device.id}`);
          }

          console.log('CSV data successfully imported!');
          resolve();
        } catch (error) {
          console.error(`Error importing CSV data to Prisma: ${error.message}`);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file: ${error.message}`);
        reject(error);
      });
  });
}

(async () => {
  try {
    const filePath = path.resolve('./cleaned_device_data.csv'); // Replace this with the correct file path
    console.log(`Resolved file path: ${filePath}`);
    await importCSV(filePath);
  } catch (error) {
    console.error(`Import process failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from Prisma');
  }
})();
