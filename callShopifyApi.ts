function getAllVariants(products){
  var variants = products.map(function (product) {
    return product.variants.map(function (variant) {
      return variant
    })
  })
  variants = variants.reduce(function (a, b) {
    return a.concat(b)
  })
  return variants
}

function getAllProducts(){
  var count = getResourceAsJson("products/count")
  var products = []
  let limit = 250.0
  var pages = Math.ceil(count / limit)
  var page = 1
  while(page <= pages){
    var productsRes = getResourceAsJson("products",  { limit: 250, page: page })
    products = products.concat(productsRes);
    page += 1
  }
  return products
}

function makeUrl(resource, params){
  var SHOPIFY_BASE_URL = shopifyUrl()
  var paramsString = ""
  if(params){
    paramsString = "?"
    Object.keys(params).forEach(function(key){
      paramsString += key + "=" + params[key] + "&"
    })
    paramsString = paramsString.slice(0, -1)
  }
  
  return SHOPIFY_BASE_URL + resource + ".json" + paramsString
}

function getResourceAsJson(resource, params){
  var res = getResource(resource, params)
  // In case of a nested resource, get the nested key
  // i.e. "products/count' will return count
  var nestedResources = resource.split("/")
  var resourceKey = nestedResources[nestedResources.length - 1]
  return JSON.parse(res)[resourceKey]
}

function getResource(resource, params){
  var SHOPIFY_API_KEY = shopifyApiKey()
  var SHOPIFY_API_SECRET = shopifyApiSecret()
  var AUTH_HEADER = {
    Authorization: "Basic " + Utilities.base64Encode(SHOPIFY_API_KEY + ":" + SHOPIFY_API_SECRET)
  }
  var endpoint = makeUrl(resource, params)
  var res = UrlFetchApp.fetch(endpoint, {
    headers: AUTH_HEADER
  })
  return res
}