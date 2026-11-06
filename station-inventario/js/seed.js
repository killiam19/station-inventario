// Ruta local por defecto
const DEFAULT_IMG = "assets/products/default.jpg";

// Generador genérico de rutas locales según palabras clave en el nombre
function getGenericImagePath(name) {
  var n = name.toLowerCase();
  if (n.indexOf("balón") > -1 || n.indexOf("balon") > -1) {
    if (n.indexOf("baloncesto") > -1) return "assets/products/balon-baloncesto.jpg";
    if (n.indexOf("voleibol") > -1) return "assets/products/balon-voleibol.jpg";
    return "assets/products/balon-futbol.jpg";
  }
  if (n.indexOf("guayos") > -1) return "assets/products/guayos.jpg";
  if (n.indexOf("tenis") > -1 || n.indexOf("patines") > -1) return "assets/products/tenis.jpg";
  if (n.indexOf("camiseta") > -1 || n.indexOf("pantaloneta") > -1) return "assets/products/camiseta.jpg";
  if (n.indexOf("mancuerna") > -1 || n.indexOf("pesa") > -1) return "assets/products/mancuernas.jpg";
  if (n.indexOf("colchoneta") > -1 || n.indexOf("yoga") > -1) return "assets/products/colchoneta.jpg";
  if (n.indexOf("banda") > -1) return "assets/products/banda.jpg";
  if (n.indexOf("guantes") > -1) return "assets/products/guantes-boxeo.jpg";
  if (n.indexOf("botella") > -1 || n.indexOf("termo") > -1) return "assets/products/botella.jpg";

  return DEFAULT_IMG;
}

// Lee los productos del template HTML y asigna las rutas locales
function getSeedFromHTML() {
  var template = document.getElementById("seed-products-template");
  if (!template) return [];
  
  var nodes = template.content.querySelectorAll("div");
  var list = [];
  
  nodes.forEach(function(node) {
    var name = node.getAttribute("data-name");
    var qty = parseInt(node.getAttribute("data-qty"), 10) || 0;
    var img = node.getAttribute("data-img") || getGenericImagePath(name);
    if (name) {
      list.push([name, qty, img]);
    }
  });
  
  return list;
}