var KEY="inv_tienda_v1";
var AUTH_KEY="station_auth_demo";
var THEME_KEY="station_theme_pref";
var items=[], hist=[], cart=[], cf=null, cr=false;

var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function fmt(ts){return new Date(ts).toLocaleString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
function fmtCOP(val){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(val)}

function toast(t){
  var e=$("toast");
  e.textContent=t;
  e.style.display="block";
  clearTimeout(toast.t);
  toast.t=setTimeout(function(){e.style.display="none"},4000);
}

/* Modo Oscuro */
function initTheme(){
  var saved = localStorage.getItem(THEME_KEY);
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}
function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  $("theme-btn").textContent = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
}
$("theme-btn").addEventListener("click", function(){
  var current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* Autenticación Demo */
function checkAuth(){
  var authed = localStorage.getItem(AUTH_KEY) === "true";
  $("login-screen").style.display = authed ? "none" : "flex";
}
$("login-form").addEventListener("submit", function(e){
  e.preventDefault();
  localStorage.setItem(AUTH_KEY, "true");
  checkAuth();
  toast("¡Bienvenido a Station Ropa Deportiva!");
});
$("logout-btn").addEventListener("click", function(){
  localStorage.removeItem(AUTH_KEY);
  checkAuth();
});

/* Almacenamiento & Kardex */
function store(){try{localStorage.setItem(KEY,JSON.stringify({items:items,hist:hist}))}catch(e){toast("Error al guardar localmente.")}}
function load(){
  try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&d.items){items=d.items;hist=d.hist||[];return}}catch(e){}
  seed();
}
function seed(){
  var seedData = getSeedFromHTML();
  var t = Date.now() - seedData.length * 60000;
  items = seedData.map(function(s,i){return {id:"s"+i, name:s[0], qty:s[1], img:s[2]||getGenericImagePath(s[0])}});
  hist = seedData.map(function(s,i){return {id:"h"+i, name:s[0], delta:s[1], qty:s[1], label:"stock inicial", ts:t+i*60000}});
  store();
}
function log(name,delta,qty,label,price){
  hist.push({id:uid(),name:name,delta:delta,qty:qty,label:label||"",price:price||null,ts:Date.now()});
}
function change(id,d,label,price){
  var it=items.find(function(x){return x.id===id});if(!it)return false;
  if(it.qty+d<0){toast("Stock insuficiente de "+it.name+" (disponibles: "+it.qty+").");return false;}
  it.qty+=d;
  log(it.name,d,it.qty,label||(d>0?"entrada":"salida"),price);
  store();render();
  return true;
}
function amt(id){var v=parseInt($("a_"+id).value,10);return v>0?v:1}

/* Modal Edición de Producto */
function openEdit(id){
  var it = items.find(function(x){return x.id === id});
  if(!it) return;
  $("edit-id").value = it.id;
  $("edit-name").value = it.name;
  $("edit-img").value = it.img || "";
  $("edit-modal").style.display = "flex";
}
$("btn-cancel-edit").addEventListener("click", function(){
  $("edit-modal").style.display = "none";
});
$("btn-save-edit").addEventListener("click", function(){
  var id = $("edit-id").value;
  var name = $("edit-name").value.trim();
  var img = $("edit-img").value.trim() || getGenericImagePath(name);

  if(!name){ toast("Ingresa un nombre válido."); return; }
  var it = items.find(function(x){return x.id === id});
  if(it){
    it.name = name;
    it.img = img;
    store();
    render();
    toast("Producto actualizado correctamente.");
    $("edit-modal").style.display = "none";
  }
});

/* Carrito de Ventas */
function renderCart(){
  var tbody = $("cart-list");
  var total = 0;
  tbody.innerHTML = cart.length ? cart.map(function(c, i){
    var sub = c.qty * c.price;
    total += sub;
    return '<tr>'+
             '<td><b>'+esc(c.name)+'</b></td>'+
             '<td>'+c.qty+'</td>'+
             '<td>'+fmtCOP(c.price)+'</td>'+
             '<td>'+fmtCOP(sub)+'</td>'+
             '<td><button class="x" style="padding:2px 6px;" data-delcart="'+i+'">✕</button></td>'+
           '</tr>';
  }).join("") : '<tr><td colspan="5" class="mu" style="text-align:center;">El carrito está vacío.</td></tr>';
  
  $("cart-total").textContent = fmtCOP(total);
}

$("btn-add-cart").addEventListener("click", function(){
  var itemId = $("v-item").value;
  var qty = parseInt($("v-qty").value, 10) || 0;
  var price = parseFloat($("v-price").value) || 0;

  if(!itemId){ toast("Selecciona un producto."); return; }
  if(qty <= 0){ toast("Ingresa una cantidad mayor a 0."); return; }

  var it = items.find(function(x){return x.id === itemId});
  if(!it) return;

  var inCart = cart.find(function(c){return c.id === itemId});
  var currentCartQty = inCart ? inCart.qty : 0;

  if(it.qty < currentCartQty + qty){
    toast("No hay suficiente stock. Disponibles: "+it.qty);
    return;
  }

  if(inCart){
    inCart.qty += qty;
    inCart.price = price;
  } else {
    cart.push({ id: it.id, name: it.name, qty: qty, price: price });
  }

  $("v-qty").value = "1";
  renderCart();
});

document.addEventListener("click", function(e){
  if(e.target.dataset.delcart !== undefined){
    var idx = parseInt(e.target.dataset.delcart, 10);
    cart.splice(idx, 1);
    renderCart();
  }
});

$("btn-submit-cart").addEventListener("click", function(){
  if(!cart.length){ toast("El carrito está vacío."); return; }

  var note = $("v-note").value.trim();
  var label = "Venta" + (note ? " (" + note + ")" : "");
  
  var successCount = 0;
  cart.forEach(function(c){
    if(change(c.id, -c.qty, label, c.price)){
      successCount++;
    }
  });

  if(successCount > 0){
    toast("¡Venta de "+successCount+" productos realizada con éxito!");
    cart = [];
    $("v-note").value = "";
    renderCart();
  }
});

/* Renderizado Principal */
function renderSelectOptions(){
  var sel = $("v-item");
  if(!sel) return;
  var currentVal = sel.value;
  var sorted = items.slice().sort(function(a,b){return a.name.localeCompare(b.name)});
  sel.innerHTML = sorted.map(function(i){
    return '<option value="'+i.id+'"'+(i.qty===0?' disabled':'')+'>'+esc(i.name)+' ('+i.qty+' dispon.)</option>';
  }).join("");
  if(currentVal) sel.value = currentVal;
}

function renderSalesHistory(){
  var sales = hist.filter(function(h){return h.delta < 0 && h.label.indexOf("Venta") === 0}).sort(function(a,b){return b.ts-a.ts}).slice(0,30);
  $("sales-history").innerHTML = sales.length ? sales.map(function(s){
    var total = (s.price || 0) * Math.abs(s.delta);
    return '<div class="h"><div><b>'+esc(s.name)+'</b> <span class="m">'+s.delta+' un.</span></div>'+
           '<div class="mu">'+esc(s.label)+' · <b>'+fmtCOP(total)+'</b></div>'+
           '<div class="mu" style="font-size:0.75em;">'+fmt(s.ts)+'</div></div>';
  }).join("") : '<div class="mu">No hay ventas recientes.</div>';
}

function render(){
  var tot=items.reduce(function(a,i){return a+i.qty},0),ag=items.filter(function(i){return i.qty===0}).length,lo=items.filter(function(i){return i.qty>0&&i.qty<=5}).length;
  $("stats").innerHTML='<div><b>'+items.length+'</b><span class="mu">Productos</span></div><div><b>'+tot+'</b><span class="mu">Unidades</span></div><div class="warn"><b>'+lo+'</b><span class="mu">Bajo Stock</span></div><div class="zero"><b>'+ag+'</b><span class="mu">Agotados</span></div>';
  var term=$("q").value.toLowerCase();
  var L=items.filter(function(x){return x.name.toLowerCase().indexOf(term)>-1}).sort(function(a,b){return a.name.localeCompare(b.name)});
  
  $("items").innerHTML=L.length?L.map(function(it){
    var imgUrl = it.img || getGenericImagePath(it.name);
    return '<div class="item">'+
             '<img src="'+esc(imgUrl)+'" class="item-thumb" alt="'+esc(it.name)+'" onerror="this.src=\'assets/products/default.jpg\'">'+
             '<div class="item-info">'+
               '<div class="nm">'+esc(it.name)+'</div>'+
               '<div class="qty'+(it.qty===0?' z':it.qty<=5?' l':'')+'">'+it.qty+' dispon.</div>'+
             '</div>'+
             '<div class="row">'+
               '<input type="number" min="1" value="1" style="width:55px" id="a_'+it.id+'" aria-label="Cantidad">'+
               '<button class="pri" data-in="'+it.id+'">+</button><button data-out="'+it.id+'">−</button>'+
               '<button data-edit="'+it.id+'">✏️</button>'+
               '<button class="x" data-del="'+it.id+'">'+(cf===it.id?'¿Seguro?':'Eliminar')+'</button>'+
             '</div>'+
           '</div>';
  }).join("") : '<div class="mu">Sin resultados.</div>';

  var H=hist.slice().sort(function(a,b){return b.ts-a.ts}).slice(0,100);
  $("hist").innerHTML=H.length?H.map(function(h){
    return '<div class="h"><div><b>'+esc(h.name)+'</b> <span class="'+(h.delta>0?'p':'m')+'">'+(h.delta>0?'+':'')+h.delta+'</span>'+(h.label?' <span class="mu">'+esc(h.label)+'</span>':'')+'</div><div class="mu">Quedan '+h.qty+' · '+fmt(h.ts)+'</div></div>'}).join("")
    :'<div class="mu">Sin movimientos.</div>';
  $("rs").textContent=cr?"¿Confirmar restablecimiento?":"Restablecer demo";

  renderSelectOptions();
  renderSalesHistory();
}

function exportar(){
  var A=items.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).map(function(i){return {"Artículo":i.name,"Cantidad":i.qty}});
  var H=hist.slice().sort(function(a,b){return b.ts-a.ts}).map(function(h){return {"Fecha":new Date(h.ts).toLocaleString("es-CO"),"Artículo":h.name,"Movimiento":h.delta,"Quedan":h.qty,"Nota":h.label||"", "Precio Unitario": h.price || "-"}});
  var d=new Date().toISOString().slice(0,10);
  if(typeof XLSX!=="undefined"){
    var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(A),"Inventario");
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(H),"Historial");
    XLSX.writeFile(wb,"inventario-"+d+".xlsx");
  }
}

/* Pestañas */
function tab(name){
  ["ventas","inv"].forEach(function(k){
    var on=k===name;
    $("v-"+k).hidden=!on;
    $("t-"+k).setAttribute("aria-selected",on);
  });
  if(location.hash!=="#"+name)history.replaceState(null,"","#"+name);
}

document.addEventListener("click",function(e){
  var t=e.target,ds=t.dataset;
  if(ds.tab){tab(ds.tab);return}
  if(t.id==="add"){
    var name=$("n").value.trim(),c=parseInt($("c").value,10)||0;
    var imgUrl=$("img-url").value.trim()||getGenericImagePath(name);
    if(!name){toast("Escribe el nombre del artículo.");return}
    if(items.some(function(x){return x.name.toLowerCase()===name.toLowerCase()})){toast("El producto ya existe.");return}
    items.push({id:uid(),name:name,qty:c,img:imgUrl});log(name,c,c,"artículo creado");store();
    $("n").value="";$("c").value="0";$("img-url").value="";render();
  }
  else if(ds.edit){
    openEdit(ds.edit);
  }
  else if(ds.in)change(ds.in,amt(ds.in));
  else if(ds.out)change(ds.out,-amt(ds.out));
  else if(ds.del){
    var it=items.find(function(x){return x.id===ds.del});if(!it)return;
    if(cf===it.id){cf=null;log(it.name,-it.qty,0,"artículo eliminado");items=items.filter(function(x){return x.id!==it.id});store();render()}
    else{cf=it.id;render();setTimeout(function(){if(cf===it.id){cf=null;render()}},4000)}
  }
  else if(t.id==="xl")exportar();
  else if(t.id==="rs"){
    if(cr){cr=false;seed();render();toast("Datos de prueba restablecidos.")}
    else{cr=true;render();setTimeout(function(){cr=false;render()},4000)}
  }
});

$("q").addEventListener("input",render);
initTheme();
checkAuth();
load();
render();
renderCart();
tab(location.hash==="#inv"?"inv":"ventas");