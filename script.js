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
    return fallback;
  }

  const value = String(imagePath).trim();

  if (!value) {
    return fallback;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  let fileName = value.replace(/^\/+/, "");

  fileName = fileName.replace(
    /^product-images\//i,
    ""
  );

  const { data } =
    kbSupabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

  return data?.publicUrl || fallback;
}

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
  console.log(
    "KASHI BHAI: Loading products..."
  );

  try {
    const { data, error } =
      await kbSupabase
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
        .order("id", {
          ascending: true
        });

    if (error) {
      console.error(
        "KASHI BHAI: Supabase error:",
        error
      );

      showProductsError();
      return;
    }

    products = data || [];

    console.log(
      "KASHI BHAI: Products loaded:",
      products.length
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
    document.getElementById(
      "categoryFilters"
    );

  if (!container) return;

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  container.innerHTML = `
    <button
      class="filter-button active"
      data-category="All"
      type="button"
    >
      All
    </button>

    ${categories.map(category => `
      <button
        class="filter-button"
        data-category="${escapeAttribute(category)}"
        type="button"
      >
        ${escapeHTML(category)}
      </button>
    `).join("")}
  `;

  container
    .querySelectorAll("[data-category]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedCategory =
            button.dataset.category;

          container
            .querySelectorAll(
              "[data-category]"
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

/* =========================
   PRODUCT FILTERING
========================= */

function getFilteredProducts() {

  const searchInput =
    document.getElementById(
      "productSearch"
    );

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

    if (
      selectedStatus === "Available"
    ) {
      matchesStatus =
        Number(product.stock) > 0;
    }

    if (
      selectedStatus === "Out of Stock"
    ) {
      matchesStatus =
        Number(product.stock) <= 0;
    }

    if (
      selectedStatus === "Discounts"
    ) {
      matchesStatus =
        Number(product.old_price || 0) >
        Number(product.price || 0);
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
    document.getElementById(
      "productsGrid"
    );

  const empty =
    document.getElementById(
      "emptyProducts"
    );

  if (!grid) return;

  const filtered =
    getFilteredProducts();

  if (!filtered.length) {

    grid.innerHTML = "";

    if (empty) {
      empty.classList.remove(
        "hidden"
      );
    }

    return;
  }

  if (empty) {
    empty.classList.add(
      "hidden"
    );
  }

  grid.innerHTML =
    filtered
      .map(createProductCard)
      .join("");

  const statusText =
    document.getElementById(
      "productStatusText"
    );

  if (statusText) {
    statusText.textContent =
      `${filtered.length} product${filtered.length === 1 ? "" : "s"} available`;
  }

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
    getProductImage(
      product.image_url
    );

  const stock =
    Number(product.stock || 0);

  const outOfStock =
    stock <= 0;

  const oldPrice =
    Number(product.old_price || 0);

  const currentPrice =
    Number(product.price || 0);

  const hasDiscount =
    oldPrice > currentPrice;

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        <img
          class="product-image"
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          decoding="async"
          onerror="
            this.onerror=null;
            this.src='images/logo.jpg';
          "
        >

        <span class="stock-badge ${
          outOfStock
            ? "out"
            : "available"
        }">
          ${
            outOfStock
              ? "Out of Stock"
              : "In Stock"
          }
        </span>

        ${
          hasDiscount
            ? `
              <span class="product-badge discount">
                Discount
              </span>
            `
            : ""
        }

      </div>

      <div class="product-info">

        <div class="product-category">
          ${escapeHTML(
            product.category || ""
          )}
        </div>

        <h3>
          ${escapeHTML(
            product.name || ""
          )}
        </h3>

        <p class="product-description">
          ${escapeHTML(
            product.description || ""
          )}
        </p>

        <div class="product-price">

          <strong>
            ${money(currentPrice)}
          </strong>

          ${
            hasDiscount
              ? `
                <del>
                  ${money(oldPrice)}
                </del>
              `
              : ""
          }

        </div>

        <div class="product-actions">

          <button
            class="add-to-cart add-cart-btn"
            data-product-id="${product.id}"
            type="button"
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
   ADD TO CART
========================= */

function addToCart(productId) {

  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(productId)
    );

  if (!product) return;

  if (
    Number(product.stock) <= 0
  ) {
    showToast(
      "This product is out of stock."
    );

    return;
  }

  const existing =
    cart.find(
      item =>
        Number(item.id) ===
        Number(product.id)
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

  /* Cart button animation */

  const cartButton =
    document.getElementById(
      "headerCartButton"
    );

  if (cartButton) {

    cartButton.classList.remove(
      "pulse"
    );

    void cartButton.offsetWidth;

    cartButton.classList.add(
      "pulse"
    );

    setTimeout(() => {
      cartButton.classList.remove(
        "pulse"
      );
    }, 600);
  }

  showToast(
    "Product added to cart successfully."
  );

  /* Automatically open cart */

  setTimeout(() => {
    openCart();
  }, 250);
}

/* =========================
   CART UI
========================= */

function updateCartUI() {

  const count =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  const countElements =
    document.querySelectorAll(
      "#cartCount, .cart-count"
    );

  countElements.forEach(
    element => {
      element.textContent =
        count;
    }
  );

  renderCart();
}

/* =========================
   RENDER CART
========================= */

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!container) return;

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>
          Add some products to continue.
        </p>
      </div>
    `;

    updateCartTotal();

    return;
  }

  container.innerHTML =
    cart.map(item => {

      const image =
        getProductImage(
          item.image_url
        );

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
              ${escapeHTML(
                item.name
              )}
            </h4>

            <p>
              ${money(item.price)}
            </p>

            <div class="cart-quantity">

              <button
                type="button"
                data-cart-minus="${item.id}"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                type="button"
                data-cart-plus="${item.id}"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove-cart-item"
            type="button"
            data-cart-remove="${item.id}"
          >
            Remove
          </button>

        </div>
      `;

    }).join("");

  updateCartTotal();
}

/* =========================
   CART TOTAL
========================= */

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

  elements.forEach(
    element => {
      element.textContent =
        money(total);
    }
  );

  const checkoutTotal =
    document.getElementById(
      "checkoutTotal"
    );

  if (checkoutTotal) {
    checkoutTotal.textContent =
      money(total);
  }
}

/* =========================
   CART QUANTITY
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
    newQuantity <=
      Number(product.stock)
  ) {

    item.quantity =
      newQuantity;

  } else {

    showToast(
      "Available stock limit reached."
    );

    return;
  }

  saveCart();
  updateCartUI();
}

/* =========================
   REMOVE CART ITEM
========================= */

function removeFromCart(
  productId
) {

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
      cart =
        JSON.parse(saved);
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

  modal.classList.add(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.remove(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
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

function openCart() {
  openModal("cartModal");
}

function closeCart() {
  closeModal("cartModal");
}

function openCheckout() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;
  }

  closeCart();
  openModal(
    "checkoutModal"
  );
}

/* =========================
   TOAST
========================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "kbToast"
    );

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    window.kbToastTimer
  );

  window.kbToastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

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

      <h3>
        Products could not be loaded
      </h3>

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

  /* Search */

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

  /* Status Filters */

  const statusContainer =
    document.getElementById(
      "statusFilters"
    );

  if (statusContainer) {

    statusContainer
      .querySelectorAll(
        "[data-status-filter]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            selectedStatus =
              button.dataset
                .statusFilter;

            statusContainer
              .querySelectorAll(
                "[data-status-filter]"
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

  /* Header Cart */

  const headerCart =
    document.getElementById(
      "headerCartButton"
    );

  if (headerCart) {

    headerCart.addEventListener(
      "click",
      openCart
    );
  }

  /* Add To Cart */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".add-cart-btn"
        );

      if (!button) return;

      if (button.disabled) return;

      const productId =
        Number(
          button.dataset.productId
        );

      addToCart(productId);
    }
  );

  /* Cart Plus */

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

  /* Cart Minus */

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

  /* Cart Remove */

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

  /* Checkout Button */

  const checkoutButton =
    document.getElementById(
      "checkoutButton"
    );

  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      openCheckout
    );
  }

  /* Close Buttons */

  document.addEventListener(
    "click",
    event => {

      const closeButton =
        event.target.closest(
          "[data-close]"
        );

      if (!closeButton) return;

      const modalId =
        closeButton.dataset.close;

      if (modalId) {
        closeModal(modalId);
      }
    }
  );

  /* Overlay */

  document.addEventListener(
    "click",
    event => {

      const overlay =
        event.target.closest(
          "[data-close-modal]"
        );

      if (!overlay) return;

      const modalId =
        overlay.dataset.closeModal;

      if (modalId) {
        closeModal(modalId);
      }
    }
  );

  /* ESC */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) return;

      document
        .querySelectorAll(
          ".modal.active"
        )
        .forEach(modal => {

          modal.classList.remove(
            "active"
          );

          modal.setAttribute(
            "aria-hidden",
            "true"
          );
        });

      document.body.classList.remove(
        "modal-open"
      );
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
