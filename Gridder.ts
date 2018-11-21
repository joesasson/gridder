function onOpen(e){
  SpreadsheetApp.getUi().createAddonMenu()
    .addItem('Pull Stock Data From Shopify', 'gridder')
    .addToUi()
}

function gridder(){
  // declare spreadsheet, sheet, and data
  let ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getActiveSheet()
  let sheetData = sheet.getDataRange().getValues()
  // get list of skus - must be in the first column
  let skus = sheetData.map(row => row[0]) // -> ['14598-b', '14556-t', ...]
  // get product data from api
  
  // get all possible sizes
  // set size headers
  // map size data per sku
  // set rows via map
}