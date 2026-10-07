/* =========================================================
   KASHI BHAI STORE
   Complete Frontend Script
   Supabase Version
   Production RPC Checkout
   ========================================================= */

const SUPABASE_URL = "https://lytutzarjtuijwijlhmt.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_mkYT6acCz3YnmLFZjGM2UQ_x9tUFtGY";

const kbSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   STATE
   ========================================================= */

let allProducts = [];
let filteredProducts = [];

let cart = [];

try {
  const savedCart =
    localStorage.getItem("kashiBhaiCart");

  cart = savedCart
    ? JSON.parse(savedCart)
    : [];

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch (error) {
  console.warn("Cart restore failed:", error);
  cart = [];
}

let selectedCategory = "All";
let selectedStatus = "all";
let searchText = "";


/* =========================================================
   DOM
   ========================================================= */

const productsGrid =
  document.getElementById("productsGrid");

const emptyProducts =
  document.getElementById("emptyProducts");

const productStatusText =
  document.getElementById("productStatusText");

const productSearch =
  document.getElementById("productSearch");

const categoryFilters =
  document.getElementById("categoryFilters");

const statusFilters =
  document.getElementById("statusFilters");

const cartCount =
  document.getElementById("cartCount");

const cartItems =
  document.getElementById("cartItems");

const cartTotal =
  document.getElementById("cartTotal");

const checkoutTotal =
  document.getElementById("checkoutTotal");

const headerCartButton =
  document.getElementById("headerCartButton");

const checkoutButton =
  document.getElementById("checkoutButton");

const checkoutForm =
  document.getElementById("checkoutForm");

const successCloseButton =
  document.getElementById("successCloseButton");


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  updateCartCount();

  setupEvents();

  loadProducts();

});


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

  /* -------------------------------------------------------
     HEADER CART
     ------------------------------------------------------- */

  if (headerCartButton) {

    headerCartButton.addEventListener("click", (e) => {

      e.preventDefault();
      e.stopPropagation();

      openCart();

    });

  }


  /* -------------------------------------------------------
     SEARCH
     ------------------------------------------------------- */

  if (productSearch) {

    productSearch.addEventListener("input", () => {

      searchText =
        String(productSearch.value || "")
          .trim()
          .toLowerCase();

      applyFilters();

    });

  }


  /* -------------------------------------------------------
     STATUS FILTERS
     ------------------------------------------------------- */

  if (statusFilters) {

    statusFilters.addEventListener("click", (e) => {

      const button =
        e.target.closest("[data-status-filter]");

      if (!button) return;

      selectedStatus =
        button.dataset.statusFilter || "all";

      statusFilters
        .querySelectorAll("[data-status-filter]")
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      applyFilters();

    });

  }


  /* -------------------------------------------------------
     CATEGORY FILTERS
     ------------------------------------------------------- */

  if (categoryFilters) {

    categoryFilters.addEventListener("click", (e) => {

      const button =
        e.target.closest("[data-category]");

      if (!button) return;

      selectedCategory =
        button.dataset.category || "All";

      categoryFilters
        .querySelectorAll("[data-category]")
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      applyFilters();

    });

  }


  /* -------------------------------------------------------
     PRODUCT BUTTONS
     ------------------------------------------------------- */

  if (productsGrid) {

    productsGrid.addEventListener("click", (e) => {

      const button =
        e.target.closest(".add-to-cart");

      if (!button) return;

      if (button.disabled) return;

      const productId =
        Number(button.dataset.productId);

      if (!Number.isFinite(productId)) {
        showToast("Invalid product.");
        return;
      }

      addToCart(productId);

    });

  }


  /* -------------------------------------------------------
     CART BUTTONS
     ------------------------------------------------------- */

  if (cartItems) {

    cartItems.addEventListener("click", (e) => {

      const plus =
        e.target.closest("[data-cart-plus]");

      if (plus) {

        changeCartQuantity(
          Number(plus.dataset.cartPlus),
          1
        );

        return;
      }


      const minus =
        e.target.closest("[data-cart-minus]");

      if (minus) {

        changeCartQuantity(
          Number(
            plusOrMinusId(
              minus,
              "data-cart-minus"
            )
          ),
          -1
        );

        return;
      }


      const remove =
        e.target.closest("[data-cart-remove]");

      if (remove) {

        removeFromCart(
          Number(remove.dataset.cartRemove)
        );

      }

    });

  }


  /* -------------------------------------------------------
     CHECKOUT BUTTON
     ------------------------------------------------------- */

  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      openCheckout
    );

  }


  /* -------------------------------------------------------
     CHECKOUT FORM
     ------------------------------------------------------- */

  if (checkoutForm) {

    checkoutForm.addEventListener(
      "submit",
      handleCheckout
    );

  }


  /* -------------------------------------------------------
     PAYMENT METHOD
     ------------------------------------------------------- */

  const paymentInputs =
    document.querySelectorAll(
      'input[name="paymentMethod"]'
    );

  const walletSection =
    document.getElementById("walletSection");

  const transactionIdInput =
    document.getElementById("transactionId");


  function updateWalletVisibility() {

    const selected =
      document.querySelector(
        'input[name="paymentMethod"]:checked'
      );

    const selectedValue =
      selected
        ? String(selected.value || "").toLowerCase()
        : "";

    const isWallet =
      selectedValue.includes("wallet");


    if (walletSection) {

      walletSection.classList.toggle(
        "hidden",
        !isWallet
      );

    }


    if (transactionIdInput) {

      transactionIdInput.required =
        isWallet;

    }

  }


  paymentInputs.forEach((input) => {

    input.addEventListener(
      "change",
      updateWalletVisibility
    );

  });


  updateWalletVisibility();


  /* -------------------------------------------------------
     SUCCESS CLOSE
     ------------------------------------------------------- */

  if (successCloseButton) {

    successCloseButton.addEventListener(
      "click",
      () => {

        closeModal("successModal");

        window.location.hash = "shop";

      }
    );

  }


  /* -------------------------------------------------------
     MODAL CLOSE
     SINGLE HANDLER ONLY
     ------------------------------------------------------- */

  document.addEventListener("click", (e) => {

    const closeButton =
      e.target.closest("[data-close]");

    if (closeButton) {

      const modalId =
        closeButton.getAttribute("data-close");

      if (modalId) {

        closeModal(modalId);

      }

      return;
    }


    const overlay =
      e.target.closest("[data-close-modal]");

    if (overlay) {

      const modalId =
        overlay.getAttribute("data-close-modal");

      if (modalId) {

        closeModal(modalId);

      }

    }

  });


  /* -------------------------------------------------------
     ESCAPE
     ------------------------------------------------------- */

  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

      closeAllModals();

    }

  });


  /* -------------------------------------------------------
     MOBILE MENU
     ------------------------------------------------------- */

  const menuButton =
    document.getElementById("menuButton");

  const mainNav =
    document.querySelector(".main-nav");


  if (menuButton && mainNav) {

    menuButton.addEventListener(
      "click",
      () => {

        mainNav.classList.toggle("open");

      }
    );

  }

}


/* =========================================================
   SMALL HELPER
   ========================================================= */

function plusOrMinusId(element, attribute) {

  return element.getAttribute(attribute);

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  if (productStatusText) {

    productStatusText.textContent =
      "Loading products...";

  }


  if (productsGrid) {

    productsGrid.classList.add("loading");

  }


  try {

    const {
      data,
      error
    } = await kbSupabase

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
        "Products error:",
        error
      );

      throw error;

    }


    allProducts =
      Array.isArray(data)
        ? data
        : [];


    console.log(
      "Products loaded:",
      allProducts.length
    );


    buildCategoryFilters();

    cleanInvalidCartItems();

    applyFilters();


  } catch (error) {

    console.error(
      "Product loading failed:",
      error
    );


    if (productStatusText) {

      productStatusText.textContent =
        "Products are temporarily unavailable.";

    }


    if (productsGrid) {

      productsGrid.innerHTML = `

        <div class="loading-card">

          <p>
            Products could not be loaded.
          </p>

          <button
            type="button"
            class="primary-btn"
            onclick="loadProducts()"
          >
            Try Again
          </button>

        </div>

      `;

    }

  } finally {

    if (productsGrid) {

      productsGrid.classList.remove("loading");

    }

  }

}


/* =========================================================
   CATEGORY FILTERS
   ========================================================= */

function buildCategoryFilters() {

  if (!categoryFilters) return;


  const categories = [
    ...new Set(

      allProducts

        .map((product) =>
          String(
            product.category || ""
          ).trim()
        )

        .filter(Boolean)

    )
  ];


  categoryFilters.innerHTML = "";


  const allButton =
    document.createElement("button");


  allButton.type = "button";

  allButton.className =
    "filter-button";


  if (selectedCategory === "All") {

    allButton.classList.add("active");

  }


  allButton.dataset.category =
    "All";

  allButton.textContent =
    "All Categories";


  categoryFilters.appendChild(
    allButton
  );


  categories.forEach((category) => {

    const button =
      document.createElement("button");


    button.type = "button";

    button.className =
      "filter-button";


    if (
      selectedCategory.toLowerCase() ===
      category.toLowerCase()
    ) {

      button.classList.add("active");

    }


    button.dataset.category =
      category;

    button.textContent =
      category;


    categoryFilters.appendChild(
      button
    );

  });

}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function applyFilters() {

  const status =
    String(selectedStatus || "")
      .toLowerCase();


  filteredProducts =
    allProducts.filter((product) => {

      const searchable = [

        product.name,

        product.product_code,

        product.category,

        product.description

      ]

        .filter(Boolean)

        .join(" ")

        .toLowerCase();


      if (
        searchText &&
        !searchable.includes(searchText)
      ) {

        return false;

      }


      if (
        selectedCategory !== "All" &&
        String(product.category || "")
          .toLowerCase() !==
        selectedCategory.toLowerCase()
      ) {

        return false;

      }


      const stock =
        Number(product.stock || 0);


      const oldPrice =
        Number(product.old_price || 0);

      const price =
        Number(product.price || 0);


      if (
        status === "available" &&
        stock <= 0
      ) {

        return false;

      }


      if (
        status === "out" &&
        stock > 0
      ) {

        return false;

      }


      if (
        status === "discount" &&
        !(
          oldPrice > price &&
          oldPrice > 0
        )
      ) {

        return false;

      }


      return true;

    });


  renderProducts();

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  if (!productsGrid) return;


  if (productStatusText) {

    productStatusText.textContent =
      `${filteredProducts.length} product${
        filteredProducts.length === 1
          ? ""
          : "s"
      }`;

  }


  if (!filteredProducts.length) {

    productsGrid.innerHTML = "";


    if (emptyProducts) {

      emptyProducts.classList.remove(
        "hidden"
      );

    }

    return;

  }


  if (emptyProducts) {

    emptyProducts.classList.add(
      "hidden"
    );

  }


  productsGrid.innerHTML =
    filteredProducts
      .map(renderProductCard)
      .join("");

}


/* =========================================================
   IMAGE URL HELPER
   ========================================================= */

function getProductImageUrl(value) {

  const raw =
    String(value || "").trim();


  if (!raw) {

    return "";

  }


  if (
    /^https?:\/\//i.test(raw)
  ) {

    return raw;

  }


  let path =
    raw.replace(/^\/+/, "");


  const storageMarker =
    "/storage/v1/object/public/product-images/";


  const markerIndex =
    path.indexOf(storageMarker);


  if (markerIndex !== -1) {

    path =
      path.slice(
        markerIndex +
        storageMarker.length
      );

  }


  path =
    path.replace(
      /^product-images\//i,
      ""
    );


  const encodedPath =
    path
      .split("/")
      .map((part) =>
        encodeURIComponent(part)
      )
      .join("/");


  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/product-images/` +
    encodedPath
  );

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function renderProductCard(product) {

  const stock =
    Number(product.stock || 0);


  const price =
    Number(product.price || 0);


  const oldPrice =
    Number(product.old_price || 0);


  const discounted =
    oldPrice > price &&
    oldPrice > 0;


  const available =
    stock > 0;


  const imageUrl =
    getProductImageUrl(
      product.image_url
    );


  const description =
    String(
      product.description ||
      "Quality product from KASHI BHAI."
    );


  return `

    <article class="product-card">

      <div class="product-image-wrap">

        ${
          imageUrl
            ? `
              <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(
                  product.name || "Product"
                )}"
                class="product-image"
                loading="lazy"
                onerror="handleProductImageError(this)"
              >
            `
            : `
              <div class="product-image-placeholder">
                <span>No Image</span>
              </div>
            `
        }

        ${
          discounted
            ? `
              <span class="discount-badge">
                SALE
              </span>
            `
            : ""
        }

        <span class="stock-badge ${
          available
            ? "available"
            : "out"
        }">

          ${
            available
              ? `${stock} Available`
              : "Out of Stock"
          }

        </span>

      </div>


      <div class="product-info">

        <div class="product-category">

          ${escapeHtml(
            product.category || "Product"
          )}

        </div>


        <h3>

          ${escapeHtml(
            product.name || "Product"
          )}

        </h3>


        <p class="product-description">

          ${escapeHtml(description)}

        </p>


        <div class="product-price">

          <strong>

            Rs. ${formatNumber(price)}

          </strong>


          ${
            discounted
              ? `
                <del>
                  Rs. ${formatNumber(oldPrice)}
                </del>
              `
              : ""
          }

        </div>


        <button
          type="button"
          class="primary-btn add-to-cart add-cart-btn"
          data-product-id="${Number(product.id)}"
          ${
            !available
              ? "disabled"
              : ""
          }
        >

          ${
            available
              ? "Add to Cart"
              : "Out of Stock"
          }

        </button>


      </div>

    </article>

  `;

}


/* =========================================================
   PRODUCT IMAGE ERROR
   ========================================================= */

function handleProductImageError(img) {

  if (!img) return;


  img.style.display =
    "none";


  const wrapper =
    img.closest(".product-image-wrap");


  if (!wrapper) return;


  if (
    wrapper.querySelector(
      ".image-error-placeholder"
    )
  ) {

    return;

  }


  const placeholder =
    document.createElement("div");


  placeholder.className =
    "product-image-placeholder image-error-placeholder";


  placeholder.innerHTML =
    "<span>Image unavailable</span>";


  wrapper.insertBefore(
    placeholder,
    img
  );

}


/* =========================================================
   CART CLEANUP
   ========================================================= */

function cleanInvalidCartItems() {

  if (!Array.isArray(cart)) {

    cart = [];

    saveCart();

    return;

  }


  let changed = false;


  cart =
    cart.filter((item) => {

      const product =
        allProducts.find(
          (p) =>
            Number(p.id) ===
            Number(item.id)
        );


      if (!product) {

        changed = true;

        return false;

      }


      const stock =
        Number(product.stock || 0);


      if (stock <= 0) {

        changed = true;

        return false;

      }


      const quantity =
        Math.min(
          Math.max(
            Number(item.quantity || 1),
            1
          ),
          stock
        );


      if (
        quantity !==
        Number(item.quantity)
      ) {

        item.quantity =
          quantity;

        changed = true;

      }


      item.name =
        product.name;

      item.price =
        Number(product.price || 0);

      item.product_code =
        product.product_code || null;

      item.image_url =
        product.image_url || "";

      item.stock =
        stock;


      return true;

    });


  if (changed) {

    saveCart();

  }


  updateCartCount();

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(productId) {

  const product =
    allProducts.find(
      (item) =>
        Number(item.id) ===
        Number(productId)
    );


  if (!product) {

    showToast(
      "Product could not be found."
    );

    return;

  }


  const stock =
    Number(product.stock || 0);


  if (stock <= 0) {

    showToast(
      "This product is out of stock."
    );

    return;

  }


  const existing =
    cart.find(
      (item) =>
        Number(item.id) ===
        Number(product.id)
    );


  if (existing) {

    const currentQuantity =
      Number(existing.quantity || 0);


    if (
      currentQuantity >= stock
    ) {

      showToast(
        "Maximum available stock reached."
      );

      return;

    }


    existing.quantity =
      currentQuantity + 1;


    existing.stock =
      stock;

    existing.price =
      Number(product.price || 0);

    existing.name =
      product.name;

    existing.image_url =
      product.image_url || "";

    existing.product_code =
      product.product_code || null;


  } else {

    cart.push({

      id:
        Number(product.id),

      product_code:
        product.product_code || null,

      name:
        product.name || "Product",

      price:
        Number(product.price || 0),

      old_price:
        Number(product.old_price || 0),

      image_url:
        product.image_url || "",

      stock:
        stock,

      quantity:
        1

    });

  }


  saveCart();

  updateCartCount();

  renderCart();


  showToast(
    "Product added to cart successfully."
  );


  pulseCartButton();


  setTimeout(() => {

    openCart();

  }, 200);

}


/* =========================================================
   CART QUANTITY
   ========================================================= */

function changeCartQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      (product) =>
        Number(product.id) ===
        Number(productId)
    );


  if (!item) return;


  const latestProduct =
    allProducts.find(
      (product) =>
        Number(product.id) ===
        Number(productId)
    );


  const latestStock =
    latestProduct
      ? Number(latestProduct.stock || 0)
      : Number(item.stock || 0);


  const currentQuantity =
    Number(item.quantity || 0);


  const newQuantity =
    currentQuantity + Number(amount);


  if (newQuantity <= 0) {

    removeFromCart(productId);

    return;

  }


  if (
    latestStock <= 0
  ) {

    showToast(
      "This product is now out of stock."
    );

    removeFromCart(productId);

    return;

  }


  if (
    newQuantity > latestStock
  ) {

    showToast(
      "Maximum available stock reached."
    );

    return;

  }


  item.quantity =
    newQuantity;


  item.stock =
    latestStock;


  saveCart();

  updateCartCount();

  renderCart();

}


/* =========================================================
   REMOVE CART ITEM
   ========================================================= */

function removeFromCart(productId) {

  cart =
    cart.filter(
      (item) =>
        Number(item.id) !==
        Number(productId)
    );


  saveCart();

  updateCartCount();

  renderCart();


  showToast(
    "Product removed from cart."
  );

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {

  try {

    localStorage.setItem(
      "kashiBhaiCart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn(
      "Cart save failed:",
      error
    );

  }

}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {

  if (!cartCount) return;


  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );


  cartCount.textContent =
    String(count);

}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  if (!cartItems) return;


  if (!cart.length) {

    cartItems.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🛒
        </div>

        <h3>
          Your cart is empty
        </h3>

        <p>
          Add some products to continue.
        </p>

      </div>

    `;


    updateCartTotal(0);

    return;

  }


  cartItems.innerHTML =
    cart
      .map((item) => {

        const itemTotal =
          Number(item.price || 0) *
          Number(item.quantity || 0);


        const imageUrl =
          getProductImageUrl(
            item.image_url || ""
          );


        return `

          <div class="cart-item">

            <div class="cart-item-image">

              ${
                imageUrl
                  ? `
                    <img
                      src="${escapeHtml(imageUrl)}"
                      alt="${escapeHtml(
                        item.name || "Product"
                      )}"
                      loading="lazy"
                    >
                  `
                  : ""
              }

            </div>


            <div class="cart-item-info">

              <h4>

                ${escapeHtml(
                  item.name || "Product"
                )}

              </h4>


              <span>

                Rs.
                ${formatNumber(item.price)}

              </span>


              <div class="cart-item-controls cart-qty">

                <button
                  type="button"
                  aria-label="Decrease quantity"
                  data-cart-minus="${Number(item.id)}"
                >
                  −
                </button>


                <strong>

                  ${Number(item.quantity || 0)}

                </strong>


                <button
                  type="button"
                  aria-label="Increase quantity"
                  data-cart-plus="${Number(item.id)}"
                >
                  +
                </button>

              </div>

            </div>


            <div class="cart-item-right">

              <strong>

                Rs.
                ${formatNumber(itemTotal)}

              </strong>


              <button
                type="button"
                class="cart-remove"
                data-cart-remove="${Number(item.id)}"
              >
                Remove
              </button>

            </div>

          </div>

        `;

      })
      .join("");


  const total =
    calculateCartTotal();


  updateCartTotal(total);

}


/* =========================================================
   CART TOTAL
   ========================================================= */

function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>

      total +

      Number(item.price || 0) *

      Number(item.quantity || 0),

    0
  );

}


function updateCartTotal(total) {

  if (cartTotal) {

    cartTotal.textContent =
      `Rs. ${formatNumber(total)}`;

  }


  if (checkoutTotal) {

    checkoutTotal.textContent =
      `Rs. ${formatNumber(total)}`;

  }

}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

  renderCart();


  const modal =
    document.getElementById(
      "cartModal"
    );


  if (!modal) {

    console.error(
      "cartModal not found in HTML"
    );

    return;

  }


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


/* =========================================================
   OPEN CHECKOUT
   ========================================================= */

function openCheckout() {

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }


  let invalidItem = false;


  cart =
    cart.filter((item) => {

      const product =
        allProducts.find(
          (p) =>
            Number(p.id) ===
            Number(item.id)
        );


      if (!product) {

        invalidItem = true;

        return false;

      }


      const stock =
        Number(product.stock || 0);


      if (
        stock <= 0
      ) {

        invalidItem = true;

        return false;

      }


      if (
        Number(item.quantity) >
        stock
      ) {

        item.quantity =
          stock;

        invalidItem = true;

      }


      item.stock =
        stock;

      item.price =
        Number(product.price || 0);

      item.name =
        product.name;

      item.image_url =
        product.image_url || "";

      item.product_code =
        product.product_code || null;


      return true;

    });


  saveCart();

  updateCartCount();

  renderCart();


  if (!cart.length) {

    showToast(
      "Products in your cart are no longer available."
    );

    return;

  }


  if (invalidItem) {

    showToast(
      "Cart was updated according to current stock."
    );

  }


  closeModal(
    "cartModal"
  );


  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (!modal) {

    console.error(
      "checkoutModal not found in HTML"
    );

    return;

  }


  updateCartTotal(
    calculateCartTotal()
  );


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

}/* =========================================================
   MODAL HELPERS
   ========================================================= */

function closeModal(modalId) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) return;


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  const anyOpen =
    document.querySelector(
      ".modal.active"
    );


  if (!anyOpen) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}


function closeAllModals() {

  document
    .querySelectorAll(".modal.active")
    .forEach((modal) => {

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


/* =========================================================
   FORM VALUE HELPER
   ========================================================= */

function getFieldValue(id) {

  const field =
    document.getElementById(id);


  if (!field) {

    return "";

  }


  return String(
    field.value || ""
  ).trim();

}


/* =========================================================
   CHECKOUT
   PRODUCTION RPC VERSION
   ========================================================= */

async function handleCheckout(e) {

  e.preventDefault();


  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;

  }


  /* -------------------------------------------------------
     GET CUSTOMER DETAILS
     ------------------------------------------------------- */

  const name =
    getFieldValue("customerName");

  const phone =
    getFieldValue("phone");

  const alternatePhone =
    getFieldValue("altPhone");

  const city =
    getFieldValue("city");

  const address =
    getFieldValue("address");

  const notes =
    getFieldValue("notes");

  const courier =
    getFieldValue("courier");

  const transactionId =
    getFieldValue("transactionId");


  const paymentInput =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    );


  const paymentMethod =
    paymentInput
      ? String(
          paymentInput.value || "COD"
        ).trim()
      : "COD";


  /* -------------------------------------------------------
     VALIDATION
     ------------------------------------------------------- */

  if (!name) {

    showToast(
      "Please enter your name."
    );

    return;

  }


  if (!phone) {

    showToast(
      "Please enter your phone number."
    );

    return;

  }


  if (!city) {

    showToast(
      "Please enter your city."
    );

    return;

  }


  if (!address) {

    showToast(
      "Please enter your address."
    );

    return;

  }


  if (!courier) {

    showToast(
      "Please select a courier."
    );

    return;

  }


  const isWalletPayment =
    paymentMethod
      .toLowerCase()
      .includes("wallet");


  if (
    isWalletPayment &&
    !transactionId
  ) {

    showToast(
      "Please enter your transaction ID."
    );

    return;

  }


  /* -------------------------------------------------------
     FINAL CLIENT-SIDE STOCK CHECK
     -------------------------------------------------------
     This is only for user experience.

     The REAL stock protection happens
     inside the database RPC.
     ------------------------------------------------------- */

  for (const item of cart) {

    const product =
      allProducts.find(
        (p) =>
          Number(p.id) ===
          Number(item.id)
      );


    if (!product) {

      showToast(
        "One of the products is no longer available."
      );

      await loadProducts();

      return;

    }


    const currentStock =
      Number(product.stock || 0);


    if (
      currentStock <= 0
    ) {

      showToast(
        `${product.name} is now out of stock.`
      );

      await loadProducts();

      return;

    }


    if (
      Number(item.quantity) >
      currentStock
    ) {

      showToast(
        `Only ${currentStock} unit(s) of ${product.name} are available.`
      );


      item.quantity =
        currentStock;


      item.stock =
        currentStock;


      saveCart();

      updateCartCount();

      renderCart();

      return;

    }

  }


  /* -------------------------------------------------------
     BUTTON
     ------------------------------------------------------- */

  const button =
    document.getElementById(
      "placeOrderButton"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Placing Order...";

  }


  try {

    /* =====================================================
       PREPARE RPC ITEMS
       ===================================================== */

    const rpcItems =
      cart.map((item) => ({

        id:
          Number(item.id),

        quantity:
          Number(item.quantity)

      }));


    if (!rpcItems.length) {

      throw new Error(
        "Cart is empty."
      );

    }


    /* =====================================================
       ATOMIC DATABASE ORDER
       =====================================================

       IMPORTANT:

       We are NOT creating:

       customers
       orders
       order_items
       order_tracking

       separately anymore.

       Supabase RPC handles everything
       inside one database transaction.
       ===================================================== */

    const {
      data,
      error
    } =
      await kbSupabase.rpc(
        "place_order",
        {

          p_customer_name:
            name,

          p_phone:
            phone,

          p_alternate_phone:
            alternatePhone || null,

          p_city:
            city,

          p_address:
            address,

          p_notes:
            notes || null,

          p_courier:
            courier,

          p_payment_method:
            paymentMethod,

          p_transaction_id:
            transactionId || null,

          p_items:
            rpcItems

        }
      );


    /* -------------------------------------------------------
       RPC ERROR
       ------------------------------------------------------- */

    if (error) {

      console.error(
        "place_order RPC error:",
        error
      );

      throw error;

    }


    /* -------------------------------------------------------
       VALIDATE RPC RESPONSE
       ------------------------------------------------------- */

    if (!data) {

      throw new Error(
        "The server did not return an order response."
      );

    }


    console.log(
      "Order RPC response:",
      data
    );


    if (
      data.success !== true
    ) {

      throw new Error(
        "Order could not be completed."
      );

    }


    /* =====================================================
       SERVER VALUES
       ===================================================== */

    const orderId =
      data.order_id || "—";


    const memberId =
      data.member_id || "—";


    const serverTotal =
      Number(
        data.total ?? calculateCartTotal()
      );


    /* =====================================================
       SUCCESS UI
       ===================================================== */

    const successOrderId =
      document.getElementById(
        "successOrderId"
      );


    const successMemberId =
      document.getElementById(
        "successMemberId"
      );


    const successTotal =
      document.getElementById(
        "successTotal"
      );


    if (successOrderId) {

      successOrderId.textContent =
        orderId;

    }


    if (successMemberId) {

      successMemberId.textContent =
        memberId;

    }


    if (successTotal) {

      successTotal.textContent =
        `Rs. ${formatNumber(serverTotal)}`;

    }


    /* =====================================================
       CLEAR CART
       ===================================================== */

    cart = [];


    saveCart();

    updateCartCount();

    renderCart();


    /* =====================================================
       CLOSE CHECKOUT
       ===================================================== */

    closeModal(
      "checkoutModal"
    );


    /* =====================================================
       SUCCESS MODAL
       ===================================================== */

    const successModal =
      document.getElementById(
        "successModal"
      );


    if (successModal) {

      successModal.classList.add(
        "active"
      );


      successModal.setAttribute(
        "aria-hidden",
        "false"
      );


      document.body.classList.add(
        "modal-open"
      );

    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    if (checkoutForm) {

      checkoutForm.reset();

    }


    /* =====================================================
       REFRESH PRODUCTS
       ===================================================== */

    /*
       The RPC has already decreased stock.

       Reloading products gets the real database
       stock values instead of calculating them
       in JavaScript.
    */

    await loadProducts();


  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );


    /* -----------------------------------------------------
       FRIENDLY DATABASE ERROR
       ----------------------------------------------------- */

    let message =
      "Unable to place order. Please try again.";


    const rawMessage =
      error &&
      error.message
        ? String(error.message)
        : "";


    console.error(
      "Checkout error message:",
      rawMessage
    );


    if (rawMessage) {

      const lower =
        rawMessage.toLowerCase();


      if (
        lower.includes("not enough stock") ||
        lower.includes("out of stock") ||
        lower.includes("stock changed") ||
        lower.includes("stock update failed")
      ) {

        message =
          rawMessage;

      }

      else if (
        lower.includes("cart is empty")
      ) {

        message =
          "Your cart is empty.";

      }

      else if (
        lower.includes("customer name")
      ) {

        message =
          "Please enter a valid customer name.";

      }

      else if (
        lower.includes("phone number")
      ) {

        message =
          "Please enter a valid phone number.";

      }

      else if (
        lower.includes("city is required")
      ) {

        message =
          "Please enter your city.";

      }

      else if (
        lower.includes("address is required")
      ) {

        message =
          "Please enter your address.";

      }

      else if (
        lower.includes("product id")
      ) {

        message =
          "One of the products is no longer available.";

      }

    }


    showToast(
      message
    );


    /*
       Refresh products after an error.

       This is important because another customer
       may have purchased the same product.
    */

    await loadProducts();


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Place Order";

    }

  }

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  let toast =
    document.getElementById(
      "kbToast"
    );


  if (!toast) {

    toast =
      document.createElement("div");


    toast.id =
      "kbToast";


    toast.className =
      "kb-toast";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    String(message || "");


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3000);

}


/* =========================================================
   CART BUTTON ANIMATION
   ========================================================= */

function pulseCartButton() {

  if (!headerCartButton) return;


  headerCartButton.classList.remove(
    "pulse"
  );


  void headerCartButton.offsetWidth;


  headerCartButton.classList.add(
    "pulse"
  );


  setTimeout(() => {

    headerCartButton.classList.remove(
      "pulse"
    );

  }, 600);

}/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(number) {

  const value =
    Number(number || 0);


  return value.toLocaleString(
    "en-PK"
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   EXPOSE FUNCTIONS
   ========================================================= */

window.loadProducts =
  loadProducts;

window.openCart =
  openCart;

window.openCheckout =
  openCheckout;

window.closeModal =
  closeModal;

window.closeAllModals =
  closeAllModals;

window.addToCart =
  addToCart;

window.changeCartQuantity =
  changeCartQuantity;

window.removeFromCart =
  removeFromCart;

window.handleProductImageError =
  handleProductImageError;


/* =========================================================
   END
   ========================================================= */
