const SUPABASE_URL = "https://lytutzarjtuijwijlhmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_mkYT6acCz3YnmLFZjGM2UQ_x9tUFtGY";

const kbSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
let cart = [];
let selectedCategory = "All";
let selectedStatus = "All";

console.log("KASHI BHAI: Store starting...");

/* =========================
   BASIC HELPERS
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

function money(value) {
  return "Rs. " + Number(value || 0).toLocaleString("en-PK");
}

/* =========================
   IMAGE URL
========================= */

function getProductImage(imagePath) {
  const fallback = "images/logo.jpg";

  if (!imagePath) {
    console.warn("KASHI BHAI: No image path found");
    return fallback;
  }

  const value = String(imagePath).trim();

  if (!value) {
    return fallback;
  }

  // Already a complete URL
  if (/^https?:\/\//i.test(value)) {
    console.log("KASHI BHAI IMAGE:", value);
    return value;
  }

  // Remove leading slash
  let fileName = value.replace(/^\/+/, "");

  // If database contains product-images/Filename.jpg,
  // only send Filename.jpg to Supabase Storage.
  fileName = fileName.replace(/^product-images\//i, "");

  const { data } = kbSupabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  const publicUrl = data?.publicUrl || fallback;

  console.log(
    "KASHI BHAI IMAGE:",
    value,
    "=>",
    publicUrl
  );

  return publicUrl;
}

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
  console.log("KASHI BHAI: Loading products from Supabase...");

  try {
    const { data, error } = await kbSupabase
      .from("products")
      .select(`
        id,
        product_code,
        name,
        price,
        old_price,
        category,
        image_url,
        stock,
        description,
        is_active
      `)
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("KASHI BHAI: Supabase error:", error);
      showProductsError();
      return;
    }

    products = data || [];

    console.log(
      "KASHI BHAI: Products received:",
      products
    );

    console.log(
      "KASHI BHAI: Products loaded:",
      products.length
    );

    console.table(
      products.map(product => ({
        code: product.product_code,
        name: product.name,
        image_url: product.image_url,
        final_image: getProductImage(product.image_url)
      }))
    );

    populateCategories();
    renderProducts();

  } catch (error) {
    console.error(
      "KASHI BHAI: Product loading failed:",
      error
    );

    showProductsError();
  }
}

/* =========================
   CATEGORIES
========================= */

function populateCategories() {
  const container =
    document.getElementById("categoryFilters");

  if (!container) return;

  const categories = [
    ...new Set(
      products
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  container.innerHTML = `
    <button class="filter-btn active" data-category="All">
      All
    </button>
    ${categories.map(category => `
      <button
        class="filter-btn"
        data-category="${escapeAttribute(category)}"
      >
        ${escapeHTML(category)}
      </button>
    `).join("")}
  `;

  container
    .querySelectorAll("[data-category]")
    .forEach(button => {
      button.addEventListener("click", () => {
        selectedCategory =
          button.dataset.category;

        container
          .querySelectorAll(".filter-btn")
          .forEach(btn =>
            btn.classList.remove("active")
          );

        button.classList.add("active");

        renderProducts();
      });
    });
}

/* =========================
   PRODUCT FILTERING
========================= */

function getFilteredProducts() {
  const searchInput =
    document.getElementById("productSearch");

  const search =
    searchInput?.value
      ?.trim()
      .toLowerCase() || "";

  return products.filter(product => {

    const matchesSearch =
      !search ||
      String(product.name || "")
        .toLowerCase()
        .includes(search) ||
      String(product.product_code || "")
        .toLowerCase()
        .includes(search) ||
      String(product.category || "")
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    let matchesStatus = true;

    if (selectedStatus === "Available") {
      matchesStatus = Number(product.stock) > 0;
    }

    if (selectedStatus === "Out of Stock") {
      matchesStatus = Number(product.stock) <= 0;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    );
  });
}

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {
  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;

  const filtered =
    getFilteredProducts();

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML =
    filtered.map(createProductCard).join("");

  console.log(
    "KASHI BHAI: Rendered products:",
    filtered.length
  );
}

/* =========================
   PRODUCT CARD
========================= */

function createProductCard(product) {
  const image =
    getProductImage(product.image_url);

  const stock =
    Number(product.stock || 0);

  const outOfStock =
    stock <= 0;

  const oldPrice =
    Number(product.old_price || 0);

  const currentPrice =
    Number(product.price || 0);

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        <img
          class="product-image"
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          decoding="async"
          onload="console.log('KASHI BHAI IMAGE LOADED:', this.src)"
          onerror="
            console.error('KASHI BHAI IMAGE FAILED:', this.src);
            this.onerror=null;
            this.src='images/logo.jpg';
          "
        >

        <span class="stock-badge ${
          outOfStock
            ? "out"
            : "in"
        }">
          ${
            outOfStock
              ? "Out of Stock"
              : "In Stock"
          }
        </span>

      </div>

      <div class="product-info">

        <div class="product-category">
          ${escapeHTML(product.category || "")}
        </div>

        <h3>
          ${escapeHTML(product.name || "")}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description || "")}
        </p>

        <div class="product-price">

          <strong>
            ${money(currentPrice)}
          </strong>

          ${
            oldPrice > currentPrice
              ? `
                <span class="old-price">
                  ${money(oldPrice)}
                </span>
              `
              : ""
          }

        </div>

        <div class="product-actions">

          <button
            class="btn primary add-cart-btn"
            data-product-id="${product.id}"
            ${outOfStock ? "disabled" : ""}
          >
            ${
              outOfStock
                ? "Out of Stock"
                : "Add to Cart"
            }
          </button>

        </div>

      </div>

    </article>
  `;
}

/* =========================
   CART
========================= */

function addToCart(productId) {
  const product =
    products.find(
      p => Number(p.id) === Number(productId)
    );

  if (!product) return;

  if (Number(product.stock) <= 0) {
    showToast("This product is out of stock.");
    return;
  }

  const existing =
    cart.find(
      item =>
        Number(item.id) === Number(product.id)
    );

  if (existing) {

    if (
      existing.quantity <
      Number(product.stock)
    ) {
      existing.quantity++;
    } else {
      showToast(
        "You cannot add more than available stock."
      );
      return;
    }

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }

  saveCart();
  updateCartUI();

  showToast(
    "Product added to cart successfully."
  );
}

/* =========================
   CART UI
========================= */

function updateCartUI() {
  const count =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

  const countElements =
    document.querySelectorAll(
      "#cartCount, .cart-count"
    );

  countElements.forEach(element => {
    element.textContent = count;
  });

  renderCart();
}

function renderCart() {
  const container =
    document.getElementById("cartItems");

  if (!container) return;

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add some products to continue.</p>
      </div>
    `;

    updateCartTotal();
    return;
  }

  container.innerHTML =
    cart.map(item => {

      const image =
        getProductImage(item.image_url);

      return `
        <div class="cart-item">

          <img
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(item.name)}"
            decoding="async"
            onerror="
              this.onerror=null;
              this.src='images/logo.jpg';
            "
          >

          <div class="cart-item-info">

            <h4>
              ${escapeHTML(item.name)}
            </h4>

            <p>
              ${money(item.price)}
            </p>

            <div class="cart-quantity">

              <button
                data-cart-minus="${item.id}"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                data-cart-plus="${item.id}"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove-cart-item"
            data-cart-remove="${item.id}"
          >
            Remove
          </button>

        </div>
      `;

    }).join("");

  updateCartTotal();
}

function updateCartTotal() {
  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );

  const elements =
    document.querySelectorAll(
      "#cartTotal, .cart-total-value"
    );

  elements.forEach(element => {
    element.textContent =
      money(total);
  });
}

/* =========================
   CART ACTIONS
========================= */

function changeCartQuantity(
  productId,
  amount
) {
  const item =
    cart.find(
      p =>
        Number(p.id) ===
        Number(productId)
    );

  if (!item) return;

  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(productId)
    );

  const newQuantity =
    Number(item.quantity) +
    Number(amount);

  if (newQuantity <= 0) {
    cart =
      cart.filter(
        p =>
          Number(p.id) !==
          Number(productId)
      );
  } else if (
    product &&
    newQuantity <= Number(product.stock)
  ) {
    item.quantity = newQuantity;
  } else {
    showToast(
      "Available stock limit reached."
    );
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart =
    cart.filter(
      item =>
        Number(item.id) !==
        Number(productId)
    );

  saveCart();
  updateCartUI();
}

/* =========================
   LOCAL STORAGE
========================= */

function saveCart() {
  try {
    localStorage.setItem(
      "kashi_bhai_cart",
      JSON.stringify(cart)
    );
  } catch (error) {
    console.warn(
      "Could not save cart:",
      error
    );
  }
}

function loadCart() {
  try {
    const saved =
      localStorage.getItem(
        "kashi_bhai_cart"
      );

    if (saved) {
      cart = JSON.parse(saved);
    }

  } catch (error) {
    console.warn(
      "Could not load cart:",
      error
    );

    cart = [];
  }
}

/* =========================
   MODALS
========================= */

function openModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

function closeModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("active");

  if (
    !document.querySelector(
      ".modal.active"
    )
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}

function openCart() {
  openModal("cartModal");
}

function closeCart() {
  closeModal("cartModal");
}

function openCheckout() {
  if (!cart.length) {
    showToast("Your cart is empty.");
    return;
  }

  closeCart();
  openModal("checkoutModal");
}

/* =========================
   TOAST
========================= */

function showToast(message) {
  let toast =
    document.getElementById(
      "kbToast"
    );

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id = "kbToast";

    toast.style.position =
      "fixed";

    toast.style.bottom =
      "25px";

    toast.style.right =
      "25px";

    toast.style.zIndex =
      "99999";

    toast.style.padding =
      "14px 20px";

    toast.style.borderRadius =
      "10px";

    toast.style.background =
      "#111";

    toast.style.color =
      "#fff";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.2)";

    document.body.appendChild(
      toast
    );
  }

  toast.textContent = message;

  toast.style.display =
    "block";

  clearTimeout(
    window.kbToastTimer
  );

  window.kbToastTimer =
    setTimeout(() => {
      toast.style.display =
        "none";
    }, 2500);
}

/* =========================
   PRODUCT ERROR
========================= */

function showProductsError() {
  const grid =
    document.getElementById(
      "productsGrid"
    );

  if (!grid) return;

  grid.innerHTML = `
    <div class="empty-state">
      <h3>Products could not be loaded</h3>
      <p>
        Please refresh the page and try again.
      </p>
    </div>
  `;
}

/* =========================
   EVENT LISTENERS
========================= */

function setupEvents() {

  // Search
  const search =
    document.getElementById(
      "productSearch"
    );

  if (search) {
    search.addEventListener(
      "input",
      renderProducts
    );
  }

  // Status filters
  const statusContainer =
    document.getElementById(
      "statusFilters"
    );

  if (statusContainer) {

    statusContainer
      .querySelectorAll(
        "[data-status]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            selectedStatus =
              button.dataset.status;

            statusContainer
              .querySelectorAll(
                ".filter-btn"
              )
              .forEach(btn =>
                btn.classList.remove(
                  "active"
                )
              );

            button.classList.add(
              "active"
            );

            renderProducts();
          }
        );

      });

  }

  // Add to cart
  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-product-id]"
        );

      if (
        button &&
        button.classList.contains(
          "add-cart-btn"
        )
      ) {

        addToCart(
          Number(
            button.dataset.productId
          )
        );

      }

    }
  );

  // Cart plus
  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-cart-plus]"
        );

      if (!button) return;

      changeCartQuantity(
        Number(
          button.dataset.cartPlus
        ),
        1
      );

    }
  );

  // Cart minus
  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-cart-minus]"
        );

      if (!button) return;

      changeCartQuantity(
        Number(
          button.dataset.cartMinus
        ),
        -1
      );

    }
  );

  // Cart remove
  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-cart-remove]"
        );

      if (!button) return;

      removeFromCart(
        Number(
          button.dataset.cartRemove
        )
      );

    }
  );

  // Close modal by clicking outside
  document.addEventListener(
    "click",
    event => {

      if (
        event.target.classList.contains(
          "modal"
        )
      ) {
        event.target.classList.remove(
          "active"
        );

        if (
          !document.querySelector(
            ".modal.active"
          )
        ) {
          document.body.classList.remove(
            "modal-open"
          );
        }
      }

    }
  );

  // ESC
  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        document
          .querySelectorAll(
            ".modal.active"
          )
          .forEach(modal =>
            modal.classList.remove(
              "active"
            )
          );

        document.body.classList.remove(
          "modal-open"
        );
      }

    }
  );
}

/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    loadCart();

    setupEvents();

    updateCartUI();

    await loadProducts();

    console.log(
      "KASHI BHAI: Store ready"
    );

  }
);