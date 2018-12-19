function onOpen(e){
  SpreadsheetApp.getUi().createAddonMenu()
    .addItem('Pull Stock Data From Shopify', 'gridder')
    .addToUi()
}

function gridder(){
  
  // declare spreadsheet, sheet, and data
  let ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1CN_IAUYJKLvTiDre_HgD1ayq_o7AXU-ZfDHn4sqi-I0/edit#gid=0')
  let sheet = ss.getActiveSheet()
  let sheetData = sheet.getDataRange().getValues()
  // get list of skus - must be in the first column
  let styles = sheetData.map((row, i) => row[0]) // -> ['Sku', '14598-b', '14556-t', ...]
  // get product data from api
  let products = getAllProducts()
  let variants: Object[] = getAllVariants(products)
  // get all possible sizes
  let sizeHeaders = getSizeHeaders(variants)
  // set size headers
  // start from third column on top row 
  let headerTargetRange = sheet.getRange(1, 3, 1, sizeHeaders.length)
  // wrap sizeHeaders in an array to set 2d array as values
  headerTargetRange.setValues([sizeHeaders])
  // map size data per sku - nested objects
  let stockBySku = mapStockBySku(variants, sizeHeaders)
  // set rows via map
  let badList = []
  let sizeData = sheetData.map((row, i) => {
    let style = row[0].toUpperCase()
    // skip header and blanks
    if(i === 0 || !style) { return null }
    if(!stockBySku[style]){
      badList.push(style)
    }
    let styleRow = generateStyleRow(style, sizeHeaders, stockBySku)
    return styleRow
  }).filter(row => row)
  // setValues
  let sizeRange = sheet.getRange(2, 3, sizeData.length, sizeData[0].length)
  sizeRange.setValues(sizeData)

  // show errors
  if(badList.length > 0){
    const htmlOutput = HtmlService
    .createHtmlOutput(`<ul>${badList.map(style => `<li>${style}</li>`)}</ul>`)
    .setTitle('Styles Not Found');
    SpreadsheetApp.getUi().showSidebar(htmlOutput)
  }
  
}

const generateStyleRow = (style, sizeHeaders, stockBySku) => {
  try {
    if(!stockBySku[style]){ throw new Error(`Style not found: ${style}`)}
  }
  catch (e){
    return sizeHeaders.map(size => 0)
  }
  // map through sizeHeaders and return the qty for each one
  return sizeHeaders.map(size => stockBySku[style][size])
}

const mapStockBySku = (variants, sizeHeaders) => {
  let stockBySku = {}
  let emptySizeRun = {}
  sizeHeaders.forEach(size => emptySizeRun[size] = 0)
  variants.forEach(variant => {
    if(!variant.sku){ return }
    let style = getStyleFromSku(variant.sku).toUpperCase()
    let size = getSizeFromSku(variant.sku)
    let stockQty = variant.inventory_quantity
    // if the style already exists as a key, set the value for the key of size as stockQty
    if(stockBySku[style]){
      // if(sizeHeaders.indexOf(size) > -1){
        stockBySku[style][size] = stockQty
      // }
    } else {
      // if not, add a key for each sizeHeader within the key that I created for the style
      // also set the size key to stock quantity
      stockBySku[style] = {...emptySizeRun}
      stockBySku[style][size] = stockQty
    }
  })
 return stockBySku
}



const getSizeHeaders = variants => {
  // map through all variant objects and get all the sizes
  let sizeCollection = variants.map(variant => {
    let sku = variant.sku
    if(!sku){ return }
    let size = getSizeFromSku(sku)
    return size
  })
  // Then filter out all the duplicates
  let sizes: number[] = unique(sizeCollection)
  let minSize = 1
  let maxSize = 13.5
  // exclude 12.5 because we don't have it
  // let excludedSize = 12.5 && value != excludedSize
  // sort ascending
  return sizes.sort((a, b) => a - b)
  // filter out text
  .filter(value => !isNaN(value))
  // filter out everything besides sizes from 5 to 13
  .filter(value => value >= minSize && value <= maxSize)
}

const unique = array => array.filter((value, i, self) => self.indexOf(value) === i)

const getSizeFromOptionName = optionName => {
  let size = optionName.split(" / ")[0]
  return size
}

const getStyleFromSku = sku => sku.split("_")[0].toUpperCase()

const getSizeFromSku = sku => sku.split("_")[1]