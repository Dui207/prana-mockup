// PRANA · mockup · comportamiento de la página
// Todo lo de aquí es de ejemplo: en el sitio real, los productos y el carrito
// viven en el servidor (Django) y el pago lo confirma Mercado Pago.

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const money = (n) => "$" + n.toLocaleString("es-MX");

/* ---------- Aviso breve (toast) ---------- */
const toast = $("#toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- Productos: una sola fuente de datos (las tarjetas de abajo) ---------- */
const products = $$(".product");
const findProduct = (name) => products.find((card) => card.dataset.name === name);

/* ---------- Filtro por categoría + búsqueda ---------- */
const chips = $$(".chip");
const search = $("#search");
const searchInput = $("#search-input");
let activeFilter = "todo";

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  products.forEach((card) => {
    const matchesCat = activeFilter === "todo" || card.dataset.cat === activeFilter;
    const matchesText = card.dataset.name.toLowerCase().includes(query);
    const show = matchesCat && matchesText;
    card.hidden = !show;
    // Las piezas impares visibles bajan un poco: así la cuadrícula no se ve rígida
    card.classList.toggle("drop", show && visible % 2 === 1);
    if (show) visible++;
  });
  $("#empty").hidden = visible > 0;
}

function setFilter(name) {
  activeFilter = name;
  chips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.filter === name));
  applyFilters();
}

chips.forEach((chip) => chip.addEventListener("click", () => setFilter(chip.dataset.filter)));

// Los enlaces de colecciones y del pie también filtran la lista de productos
$$("a[data-filter]").forEach((link) =>
  link.addEventListener("click", () => setFilter(link.dataset.filter))
);

// Cuántas piezas hay en cada colección
$$("[data-count]").forEach((el) => {
  const total = products.filter((card) => card.dataset.cat === el.dataset.count).length;
  el.textContent = total === 1 ? "1 pieza" : `${total} piezas`;
});

$("#search-toggle").addEventListener("click", () => {
  search.hidden = !search.hidden;
  if (!search.hidden) searchInput.focus();
});
searchInput.addEventListener("input", applyFilters);

/* ---------- Favoritos ---------- */
$$(".fav").forEach((btn) =>
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "♥" : "♡";
  })
);

/* ---------- Carrito ---------- */
const cart = new Map(); // nombre -> { name, price, qty }
const cartEl = $("#cart");
const scrim = $("#scrim");

function openCart() {
  cartEl.classList.add("open");
  cartEl.setAttribute("aria-hidden", "false");
  scrim.hidden = false;
}
function closeCart() {
  cartEl.classList.remove("open");
  cartEl.setAttribute("aria-hidden", "true");
  scrim.hidden = true;
}

function renderCart() {
  const list = $("#cart-list");
  list.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
    count += item.qty;

    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${money(item.price)}</span>
      </div>
      <div class="qty">
        <button type="button" aria-label="Quitar uno">−</button>
        <span>${item.qty}</span>
        <button type="button" aria-label="Agregar uno">+</button>
      </div>`;
    const [minus, plus] = $$(".qty button", li);
    minus.addEventListener("click", () => changeQty(item.name, -1));
    plus.addEventListener("click", () => changeQty(item.name, 1));
    list.appendChild(li);
  });

  $("#cart-total").textContent = money(total);
  $("#cart-empty").hidden = count > 0;
  $("#cart-foot").hidden = count === 0;

  const badge = $("#cart-count");
  badge.textContent = count;
  badge.hidden = count === 0;
}

function changeQty(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(name);
  renderCart();
}

// Agregar al carrito: la usan los botones de las tarjetas y la tarjeta de las escenas
function addToCart(name) {
  const card = findProduct(name);
  if (!card) return;
  const item = cart.get(name) || { name, price: Number(card.dataset.price), qty: 0 };
  item.qty += 1;
  cart.set(name, item);
  renderCart();
  showToast(`🛍️ ${name} agregado`);
}

products.forEach((card) => {
  $(".add", card).addEventListener("click", () => addToCart(card.dataset.name));
});

$("#cart-open").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
scrim.addEventListener("click", closeCart);
$("#checkout").addEventListener("click", () =>
  showToast("En el sitio real aquí se abre Mercado Pago 💳")
);

/* ---------- Escenas del hero ---------- */
const stage = $("#stage");
const spotCard = $("#spot-card");
let openSpot = null;

function closeSpotCard() {
  spotCard.hidden = true;
  if (openSpot) openSpot.setAttribute("aria-expanded", "false");
  openSpot = null;
}

function showSpotCard(spot) {
  const card = findProduct(spot.dataset.product);
  if (!card) return;

  $("#spot-name").textContent = card.dataset.name;
  $("#spot-price").innerHTML = $(".price", card).innerHTML;
  spotCard.dataset.product = card.dataset.name;
  spotCard.hidden = false;
  spot.setAttribute("aria-expanded", "true");
  openSpot = spot;

  // Colocar la tarjeta junto al punto sin salirse de la foto
  const stageBox = stage.getBoundingClientRect();
  const spotBox = spot.getBoundingClientRect();
  const w = spotCard.offsetWidth;
  const h = spotCard.offsetHeight;
  const cx = spotBox.left - stageBox.left + spotBox.width / 2;
  const cy = spotBox.top - stageBox.top + spotBox.height / 2;
  const left = Math.min(Math.max(cx - w / 2, 8), stageBox.width - w - 8);
  const below = cy + 28 + h < stageBox.height;
  spotCard.style.left = left + "px";
  spotCard.style.top = (below ? cy + 28 : cy - 28 - h) + "px";
}

$$(".spot").forEach((spot) =>
  spot.addEventListener("click", (e) => {
    e.stopPropagation();
    const same = openSpot === spot;
    closeSpotCard();
    if (!same) showSpotCard(spot);
  })
);

$("#spot-add").addEventListener("click", () => {
  addToCart(spotCard.dataset.product);
  closeSpotCard();
});

// Tocar fuera de la tarjeta la cierra
document.addEventListener("click", (e) => {
  if (!spotCard.hidden && !spotCard.contains(e.target)) closeSpotCard();
});

// Cambiar de escena
const tabs = $$(".tab");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    $$(".scene").forEach((scene) => scene.classList.toggle("is-active", scene.id === tab.dataset.scene));
    closeSpotCard();
  })
);

/* ---------- Popup ---------- */
const popup = $("#popup");
$("#popup-open").addEventListener("click", () => popup.showModal());
$("#popup-close").addEventListener("click", () => popup.close());
popup.addEventListener("click", (e) => { if (e.target === popup) popup.close(); });
// index.html#popup abre el popup al cargar (útil para compartir el enlace)
if (location.hash === "#popup") popup.showModal();

/* ---------- Teclado ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCart();
    closeSpotCard();
  }
});

applyFilters();
renderCart();
