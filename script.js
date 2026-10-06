/* =========================================================
   KASHI BHAI STORE
   Complete Frontend Script
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

let cart = JSON.parse(
  localStorage.getItem("kashiBhaiCart") || "[]"
);

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

  /* Header Cart */
  if (headerCartButton) {
    headerCartButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCart();
    });
  }

  /* Search */
  if (productSearch) {
    productSearch.addEventListener("input", () => {
      searchText =
        productSearch.value.trim().toLowerCase();

      applyFilters();
    });
  }

  /* Status Filters */
  if (statusFilters) {
    statusFilters.addEventListener("click", (e) => {

      const button =
        e.target.closest("[data-status-filter]");

      if (!button) return;

      selectedStatus =
        button.dataset.statusFilter || "all";

      document
        .querySelectorAll(
          "[data-status-filter]"
        )
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      applyFilters();
    });
  }

  /* Category Filters */
  if (categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {

      const button =
        e.target.closest("[data-category]");

      if (!button) return;

      selectedCategory =
        button.dataset.category || "All";

      document
        .querySelectorAll(
          "[data-category]"
        )
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      applyFilters();
    });
  }

  /* Product Buttons */
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {

      const button =
        e.target.closest(".add-to-cart");

      if (!button) return;

      const productId =
        Number(button.dataset.productId);

      addToCart(productId);
    });
  }

  /* Cart Buttons */
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
          Number(minus.dataset.cartMinus),
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

  /* Checkout */
  if (checkoutButton) {
    checkoutButton.addEventListener(
      "click",
      openCheckout
    );
  }

  /* Checkout Form */
  if (checkoutForm) {
    checkoutForm.addEventListener(
      "submit",
      handleCheckout
    );
  }

  /* Success Close */
  if (successCloseButton) {
    successCloseButton.addEventListener(
      "click",
      () => {
        closeModal("successModal");
        window.location.hash = "shop";
      }
    );
  }

  /* Modal close buttons */
  document.addEventListener("click", (e) => {

    const closeButton =
      e.target.closest("[data-close]");

    if (closeButton) {
      closeModal(
        closeButton.dataset.close
      );
    }

    const overlay =
      e.target.closest("[data-close-modal]");

    if (overlay) {
      closeModal(
        overlay.dataset.closeModal
      );
    }
  });

  /* ESC */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });

  /* Mobile Menu */
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
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  if (productStatusText) {
    productStatusText.textContent =
      "Loading products...";
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

    allProducts = data || [];

    console.log(
      "Products loaded:",
      allProducts.length
    );

    buildCategoryFilters();
    applyFilters();

  } catch (error) {

    console.error(error);

    if (productStatusText) {
      productStatusText.textContent =
        "Products are temporarily unavailable.";
    }

    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="loading-card">
          <p>Products could not be loaded.</p>
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
    "filter-button active";

  allButton.dataset.category = "All";
  allButton.textContent = "All Categories";

  categoryFilters.appendChild(
    allButton
  );

  categories.forEach((category) => {

    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "filter-button";

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
    String(selectedStatus)
      .toLowerCase();

  filteredProducts =
    allProducts.filter((product) => {

      /* Search */
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

      /* Category */
      if (
        selectedCategory !== "All" &&
        String(product.category || "")
          .toLowerCase() !==
          selectedCategory.toLowerCase()
      ) {
        return false;
      }

      /* Status */
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

  if (
    !filteredProducts.length
  ) {

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

  const image =
    product.image_url ||
    "";

  const description =
    product.description ||
    "Quality product from KASHI BHAI.";

  let imageUrl = image;

  /*
   If image_url contains only a filename/path,
   convert it into Supabase Storage public URL.
  */
  if (
    image &&
    !image.startsWith("http")
  ) {
    imageUrl =
      `${SUPABASE_URL}/storage/v1/object/public/product-images/${encodeURIComponent(
        image
      )}`;
  }

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(product.name || "Product")}"
          class="product-image"
          onerror="this.style.display='none';"
        >

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
          data-product-id="${product.id}"
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
   CART
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

    if (
      existing.quantity >= stock
    ) {
      showToast(
        "Maximum available stock reached."
      );
      return;
    }

    existing.quantity += 1;

  } else {

    cart.push({
      id: Number(product.id),
      product_code:
        product.product_code,
      name: product.name,
      price: Number(product.price || 0),
      old_price:
        Number(product.old_price || 0),
      image_url:
        product.image_url || "",
      stock: stock,
      quantity: 1
    });
  }

  saveCart();
  updateCartCount();
  renderCart();

  showToast(
    "Product added to cart successfully."
  );

  /* Open cart automatically */
  setTimeout(() => {
    openCart();
  }, 200);

  /* Cart button animation */
  pulseCartButton();
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

  const newQuantity =
    item.quantity + amount;

  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  if (
    Number(item.stock || 0) > 0 &&
    newQuantity >
      Number(item.stock)
  ) {
    showToast(
      "Maximum available stock reached."
    );
    return;
  }

  item.quantity =
    newQuantity;

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

  localStorage.setItem(
    "kashiBhaiCart",
    JSON.stringify(cart)
  );
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
    count;
}

/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  if (!cartItems) return;

  if (!cart.length) {

    cartItems.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to continue.</p>
      </div>
    `;

    updateCartTotal(0);

    return;
  }

  cartItems.innerHTML =
    cart.map((item) => {

      const itemTotal =
        Number(item.price) *
        Number(item.quantity);

      let imageUrl =
        item.image_url || "";

      if (
        imageUrl &&
        !imageUrl.startsWith("http")
      ) {
        imageUrl =
          `${SUPABASE_URL}/storage/v1/object/public/product-images/${encodeURIComponent(
            imageUrl
          )}`;
      }

      return `
        <div class="cart-item">

          <div class="cart-item-image">

            ${
              imageUrl
                ? `
                  <img
                    src="${escapeHtml(imageUrl)}"
                    alt="${escapeHtml(item.name)}"
                  >
                `
                : ""
            }

          </div>

          <div class="cart-item-info">

            <h4>
              ${escapeHtml(item.name)}
            </h4>

            <span>
              Rs. ${formatNumber(item.price)}
            </span>

            <div class="cart-item-controls">

              <button
                type="button"
                data-cart-minus="${item.id}"
              >
                −
              </button>

              <strong>
                ${item.quantity}
              </strong>

              <button
                type="button"
                data-cart-plus="${item.id}"
              >
                +
              </button>

            </div>

          </div>

          <div class="cart-item-right">

            <strong>
              Rs. ${formatNumber(itemTotal)}
            </strong>

            <button
              type="button"
              class="cart-remove"
              data-cart-remove="${item.id}"
            >
              Remove
            </button>

          </div>

        </div>
      `;
    }).join("");

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
    document.getElementById("cartModal");

  if (!modal) {
    console.error(
      "cartModal not found in HTML"
    );
    return;
  }

  modal.classList.add("active");
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

  closeModal("cartModal");

  renderCart();

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (!modal) return;

  modal.classList.add("active");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}

/* =========================================================
   MODAL HELPERS
   ========================================================= */

function closeModal(modalId) {

  const modal =
    document.getElementById(modalId);

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
   CHECKOUT
   ========================================================= */

async function handleCheckout(e) {

  e.preventDefault();

  if (!cart.length) {
    showToast(
      "Your cart is empty."
    );
    return;
  }

  const formData =
    new FormData(checkoutForm);

  const name =
    String(
      formData.get("name") || ""
    ).trim();

  const phone =
    String(
      formData.get("phone") || ""
    ).trim();

  const alternatePhone =
    String(
      formData.get("alternate_phone") ||
      formData.get("alternatePhone") ||
      ""
    ).trim();

  const city =
    String(
      formData.get("city") || ""
    ).trim();

  const address =
    String(
      formData.get("address") || ""
    ).trim();

  const notes =
    String(
      formData.get("notes") || ""
    ).trim();

  const courier =
    String(
      formData.get("courier") || ""
    ).trim();

  const paymentMethod =
    String(
      formData.get("payment_method") ||
      formData.get("paymentMethod") ||
      "COD"
    ).trim();

  const transactionId =
    String(
      formData.get("transaction_id") ||
      formData.get("transactionId") ||
      ""
    ).trim();

  if (!name) {
    showToast("Please enter your name.");
    return;
  }

  if (!phone) {
    showToast("Please enter your phone number.");
    return;
  }

  if (!city) {
    showToast("Please enter your city.");
    return;
  }

  if (!address) {
    showToast("Please enter your address.");
    return;
  }

  if (!courier) {
    showToast("Please select a courier.");
    return;
  }

  if (
    paymentMethod.toLowerCase()
      .includes("wallet") &&
    !transactionId
  ) {
    showToast(
      "Please enter your transaction ID."
    );
    return;
  }

  const subtotal =
    calculateCartTotal();

  const deliveryFee = 0;

  const total =
    subtotal + deliveryFee;

  const button =
    document.getElementById(
      "placeOrderButton"
    );

  if (button) {
    button.disabled = true;
    button.textContent =
      "Placing Order...";
  }

  try {

    /* =========================================
       CUSTOMER
       ========================================= */

    let customer = null;

    const {
      data: existingCustomers,
      error: customerSearchError
    } = await kbSupabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .limit(1);

    if (customerSearchError) {
      throw customerSearchError;
    }

    if (
      existingCustomers &&
      existingCustomers.length
    ) {

      customer =
        existingCustomers[0];

    } else {

      const memberId =
        await generateMemberId();

      const {
        data: newCustomer,
        error: customerInsertError
      } = await kbSupabase
        .from("customers")
        .insert({
          member_id: memberId,
          name: name,
          phone: phone,
          alternate_phone:
            alternatePhone || null,
          city: city,
          address: address
        })
        .select()
        .single();

      if (customerInsertError) {
        throw customerInsertError;
      }

      customer =
        newCustomer;
    }

    /* =========================================
       ORDER ID
       ========================================= */

    const orderId =
      await generateOrderId();

    /* =========================================
       ORDER
       ========================================= */

    const {
      data: order,
      error: orderError
    } = await kbSupabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_id: customer.id,

        customer_name: name,
        phone: phone,
        alternate_phone:
          alternatePhone || null,

        city: city,
        address: address,
        notes: notes || null,

        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,

        payment_method:
          paymentMethod,

        payment_status:
          paymentMethod
            .toLowerCase()
            .includes("wallet")
            ? "pending"
            : "pending",

        order_status: "Pending",

        courier: courier,
        tracking_id: null
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    /* =========================================
       ORDER ITEMS
       ========================================= */

    const orderItems =
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_code:
          item.product_code || null,
        product_name:
          item.name,
        quantity:
          Number(item.quantity),
        unit_price:
          Number(item.price),
        total_price:
          Number(item.price) *
          Number(item.quantity)
      }));

    const {
      error: itemsError
    } = await kbSupabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    /* =========================================
       TRACKING ENTRY
       ========================================= */

    try {

      await kbSupabase
        .from("order_tracking")
        .insert({
          order_id: order.id,
          status: "Order Placed",
          location: city,
          note: "Order successfully placed."
        });

    } catch (trackingError) {

      console.warn(
        "Tracking entry skipped:",
        trackingError
      );
    }

    /* =========================================
       STOCK UPDATE
       ========================================= */

    for (const item of cart) {

      const currentProduct =
        allProducts.find(
          (product) =>
            Number(product.id) ===
            Number(item.id)
        );

      if (!currentProduct) continue;

      const newStock =
        Math.max(
          0,
          Number(currentProduct.stock || 0) -
          Number(item.quantity || 0)
        );

      const {
        error: stockError
      } = await kbSupabase
        .from("products")
        .update({
          stock: newStock
        })
        .eq("id", item.id);

      if (stockError) {
        console.warn(
          "Stock update failed:",
          stockError
        );
      }
    }

    /* =========================================
       SUCCESS
       ========================================= */

    const memberId =
      customer.member_id || "—";

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
        `Rs. ${formatNumber(total)}`;
    }

    /* Clear cart */
    cart = [];

    saveCart();
    updateCartCount();

    closeModal(
      "checkoutModal"
    );

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

    /* Reload products for fresh stock */
    setTimeout(() => {
      loadProducts();
    }, 500);

    if (checkoutForm) {
      checkoutForm.reset();
    }

  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );

    showToast(
      "Unable to place order. Please try again."
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "Place Order";
    }
  }
}

/* =========================================================
   MEMBER ID
   ========================================================= */

async function generateMemberId() {

  try {

    const {
      data,
      error
    } = await kbSupabase
      .from("customers")
      .select("member_id")
      .order("id", {
        ascending: false
      })
      .limit(1);

    if (
      !error &&
      data &&
      data.length &&
      data[0].member_id
    ) {

      const match =
        String(
          data[0].member_id
        ).match(/(\d+)$/);

      if (match) {

        const next =
          Number(match[1]) + 1;

        return `KB${String(next).padStart(
          6,
          "0"
        )}`;
      }
    }

  } catch (error) {

    console.warn(
      "Member ID generation:",
      error
    );
  }

  return `KB${String(
    Date.now()
  ).slice(-6)}`;
}

/* =========================================================
   ORDER ID
   ========================================================= */

async function generateOrderId() {

  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `KB-${year}${month}${day}-${random}`;
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  let toast =
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
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2500);
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
}

/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(number) {

  return Number(
    number || 0
  ).toLocaleString(
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

window.addToCart =
  addToCart;
// ===============================
// MODAL CLOSE HANDLER - FIX
// ===============================

document.addEventListener("click", function (e) {

  // Close button: X / Continue Shopping
  const closeButton = e.target.closest("[data-close]");

  if (closeButton) {
    const modalId = closeButton.getAttribute("data-close");

    if (modalId) {
      closeModal(modalId);
    }

    return;
  }

  // Click on modal overlay
  const overlay = e.target.closest("[data-close-modal]");

  if (overlay) {
    const modalId = overlay.getAttribute("data-close-modal");

    if (modalId) {
      closeModal(modalId);
    }

    return;
  }
});
