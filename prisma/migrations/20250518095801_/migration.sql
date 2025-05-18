-- CreateTable
CREATE TABLE "UniqueManufacturer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UniqueDevice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artikelNummer" TEXT NOT NULL,
    "artikelBezeichnung" TEXT NOT NULL,
    "ean" TEXT,
    "beschreibung" TEXT,
    "herstellerArtikelNummer" TEXT,
    "einkaufsPreis" REAL NOT NULL,
    "nettPreis" REAL NOT NULL,
    "gewicht" REAL,
    "uniqueManufacturerId" INTEGER NOT NULL,
    CONSTRAINT "UniqueDevice_uniqueManufacturerId_fkey" FOREIGN KEY ("uniqueManufacturerId") REFERENCES "UniqueManufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueManufacturer_name_key" ON "UniqueManufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueDevice_artikelNummer_key" ON "UniqueDevice"("artikelNummer");
