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

/* ---------- Filtro por categoría + búsqueda ---------- */
const chips = $$(".chip");
const products = $$(".product");
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

products.forEach((card) => {
  $(".add", card).addEventListener("click", () => {
    const { name, price } = card.dataset;
    const item = cart.get(name) || { name, price: Number(price), qty: 0 };
    item.qty += 1;
    cart.set(name, item);
    renderCart();
    showToast(`🛍️ ${name} agregado`);
  });
});

$("#cart-open").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
scrim.addEventListener("click", closeCart);
$("#checkout").addEventListener("click", () =>
  showToast("En el sitio real aquí se abre Mercado Pago 💳")
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
  if (e.key === "Escape") closeCart();
});

renderCart();
