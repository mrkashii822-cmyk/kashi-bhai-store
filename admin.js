/* =========================================================
   KASHI BHAI ADMIN PANEL
   Supabase Product Manager
========================================================= */

"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://lytutzarjtuijwijlhmt.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_mkYT6acCz3YnmLFZjGM2UQ_x9tUFtGY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   STATE
========================================================= */

let products = [];
let filteredProducts = [];

let currentConfirmAction = null;

let toastTimer = null;


/* =========================================================
   DOM
========================================================= */

const loginScreen =
  document.getElementById("loginScreen");

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginButtonText =
  document.getElementById("loginButtonText");

const loginMessage =
  document.getElementById("loginMessage");

const adminApp =
  document.getElementById("adminApp");

const logoutButton =
  document.getElementById("logoutButton");

const addProductButton =
  document.getElementById("addProductButton");

const adminSearch =
  document.getElementById("adminSearch");

const adminStatusFilter =
  document.getElementById("adminStatusFilter");

const refreshProductsButton =
  document.getElementById("refreshProductsButton");

const adminStatus =
  document.getElementById("adminStatus");

const productsTableBody =
  document.getElementById("productsTableBody");

const emptyTable =
  document.getElementById("emptyTable");

const totalProducts =
  document.getElementById("totalProducts");

const activeProducts =
  document.getElementById("activeProducts");

const hiddenProducts =
  document.getElementById("hiddenProducts");

const outOfStockProducts =
  document.getElementById("outOfStockProducts");


/* PRODUCT MODAL */

const productModal =
  document.getElementById("productModal");

const productModalOverlay =
  document.getElementById("productModalOverlay");

const closeProductModal =
  document.getElementById("closeProductModal");

const cancelProductButton =
  document.getElementById("cancelProductButton");

const productModalTitle =
  document.getElementById("productModalTitle");

const productForm =
  document.getElementById("productForm");

const editingProductId =
  document.getElementById("editingProductId");

const imagePreview =
  document.getElementById("imagePreview");

const productImage =
  document.getElementById("productImage");

const currentImageText =
  document.getElementById("currentImageText");

const productCode =
  document.getElementById("productCode");

const productName =
  document.getElementById("productName");

const productPrice =
  document.getElementById("productPrice");

const productOldPrice =
  document.getElementById("productOldPrice");

const productStock =
  document.getElementById("productStock");

const productCategory =
  document.getElementById("productCategory");

const productDescription =
  document.getElementById("productDescription");

const productActive =
  document.getElementById("productActive");

const saveProductButton =
  document.getElementById("saveProductButton");

const productFormMessage =
  document.getElementById("productFormMessage");


/* CONFIRM */

const confirmModal =
  document.getElementById("confirmModal");

const confirmModalOverlay =
  document.getElementById("confirmModalOverlay");

const confirmTitle =
  document.getElementById("confirmTitle");

const confirmText =
  document.getElementById("confirmText");

const confirmActionButton =
  document.getElementById("confirmActionButton");

const cancelConfirmButton =
  document.getElementById("cancelConfirmButton");


/* TOAST */

const adminToast =
  document.getElementById("adminToast");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);


async function initializeAdmin() {

  /*
    Make absolutely sure modals cannot cover
    the login screen on first page load.
  */

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
    loginScreen.style.display = "flex";
  }

  if (adminApp) {
    adminApp.classList.add("hidden");
    adminApp.style.display = "none";
  }

  setupEventListeners();

  try {

    supabaseClient.auth.onAuthStateChange(
      async (event, session) => {

        console.log(
          "Auth event:",
          event
        );

        if (
          session &&
          session.user
        ) {

          await handleAuthenticatedUser(
            session.user
          );

        } else {

          showLoginScreen();

        }

      }
    );

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(
        "Session error:",
        error
      );

      showLoginScreen();

      return;
    }

    if (
      data &&
      data.session &&
      data.session.user
    ) {

      await handleAuthenticatedUser(
        data.session.user
      );

    } else {

      showLoginScreen();

    }

  } catch (error) {

    console.error(
      "Admin initialization error:",
      error
    );

    showLoginScreen();

  }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEventListeners() {

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      handleLogin
    );
  }

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      handleLogout
    );
  }

  if (addProductButton) {
    addProductButton.addEventListener(
      "click",
      () => openAddProductModal()
    );
  }

  if (refreshProductsButton) {
    refreshProductsButton.addEventListener(
      "click",
      () => loadProducts(true)
    );
  }

  if (adminSearch) {
    adminSearch.addEventListener(
      "input",
      applyFilters
    );
  }

  if (adminStatusFilter) {
    adminStatusFilter.addEventListener(
      "change",
      applyFilters
    );
  }

  if (productForm) {
    productForm.addEventListener(
      "submit",
      handleProductSubmit
    );
  }

  if (productImage) {
    productImage.addEventListener(
      "change",
      handleImagePreview
    );
  }

  if (closeProductModal) {
    closeProductModal.addEventListener(
      "click",
      () => closeModal(productModal)
    );
  }

  if (cancelProductButton) {
    cancelProductButton.addEventListener(
      "click",
      () => closeModal(productModal)
    );
  }

  if (productModalOverlay) {
    productModalOverlay.addEventListener(
      "click",
      () => closeModal(productModal)
    );
  }

  if (cancelConfirmButton) {
    cancelConfirmButton.addEventListener(
      "click",
      () => closeModal(confirmModal)
    );
  }

  if (confirmModalOverlay) {
    confirmModalOverlay.addEventListener(
      "click",
      () => closeModal(confirmModal)
    );
  }

  if (confirmActionButton) {
    confirmActionButton.addEventListener(
      "click",
      executeConfirmAction
    );
  }

  if (productsTableBody) {

    productsTableBody.addEventListener(
      "click",
      handleProductTableClick
    );

  }

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeModal(productModal);
        closeModal(confirmModal);

      }

    }
  );

}


/* =========================================================
   AUTH
========================================================= */

async function handleLogin(event) {

  event.preventDefault();

  const email =
    loginEmail?.value.trim() || "";

  const password =
    loginPassword?.value || "";

  if (!email || !password) {

    showLoginMessage(
      "Please enter email and password.",
      "error"
    );

    return;
  }

  setButtonLoading(
    loginButton,
    loginButtonText,
    true,
    "Signing in..."
  );

  clearLoginMessage();

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    if (
      !data ||
      !data.user
    ) {
      throw new Error(
        "Login failed. Please try again."
      );
    }

    const isAdmin =
      await verifyAdmin();

    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      throw new Error(
        "This account does not have admin access."
      );

    }

    showToast(
      "Login successful.",
      "success"
    );

    await showAdminApp();

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    showLoginMessage(
      getFriendlyError(error),
      "error"
    );

  } finally {

    setButtonLoading(
      loginButton,
      loginButtonText,
      false,
      "Login"
    );

  }

}


async function handleLogout() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

  showLoginScreen();

}


/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "is_admin"
      );

    if (error) {

      console.error(
        "Admin verification error:",
        error
      );

      return false;
    }

    return data === true;

  } catch (error) {

    console.error(
      "Admin verification exception:",
      error
    );

    return false;
  }

}


async function handleAuthenticatedUser(user) {

  if (!user) {

    showLoginScreen();

    return;
  }

  const isAdmin =
    await verifyAdmin();

  if (!isAdmin) {

    console.warn(
      "Authenticated user is not an admin."
    );

    await supabaseClient.auth.signOut();

    showLoginMessage(
      "This account does not have admin access.",
      "error"
    );

    return;
  }

  await showAdminApp();

}


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showLoginScreen() {

  /*
    VERY IMPORTANT:
    Close every modal before showing login.
    This prevents any overlay from blurring/covering
    the login screen.
  */

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);

  document.body.style.overflow = "";

  if (loginScreen) {

    loginScreen.classList.remove("hidden");

    loginScreen.style.display = "flex";

    loginScreen.style.visibility = "visible";

    loginScreen.style.opacity = "1";

    loginScreen.style.filter = "none";

    loginScreen.style.backdropFilter = "none";

  }

  if (adminApp) {

    adminApp.classList.add("hidden");

    adminApp.style.display = "none";

  }

  if (loginEmail) {

    setTimeout(
      () => loginEmail.focus(),
      50
    );

  }

}


async function showAdminApp() {

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);

  if (loginScreen) {

    loginScreen.classList.add("hidden");

    loginScreen.style.display = "none";

  }

  if (adminApp) {

    adminApp.classList.remove("hidden");

    adminApp.style.display = "block";

  }

  await loadProducts();

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts(showLoading = false) {

  if (showLoading) {

    setAdminStatus(
      "Refreshing products..."
    );

  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
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
          is_active,
          created_at,
          updated_at,
          status
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    products =
      Array.isArray(data)
        ? data
        : [];

    updateStats();

    applyFilters();

    setAdminStatus(
      `${products.length} product${products.length === 1 ? "" : "s"} loaded.`
    );

  } catch (error) {

    console.error(
      "Load products error:",
      error
    );

    setAdminStatus(
      "Could not load products: " +
      getFriendlyError(error),
      true
    );

    products = [];

    updateStats();

    applyFilters();

  }

}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

  const search =
    (
      adminSearch?.value || ""
    )
      .trim()
      .toLowerCase();

  const status =
    adminStatusFilter?.value || "all";

  filteredProducts =
    products.filter(product => {

      const matchesSearch =
        !search ||
        String(product.product_code || "")
          .toLowerCase()
          .includes(search) ||
        String(product.name || "")
          .toLowerCase()
          .includes(search) ||
        String(product.category || "")
          .toLowerCase()
          .includes(search);

      if (!matchesSearch) {
        return false;
      }

      if (status === "active") {

        return (
          product.is_active === true &&
          Number(product.stock || 0) > 0
        );

      }

      if (status === "hidden") {

        return product.is_active === false;

      }

      if (status === "out_of_stock") {

        return Number(product.stock || 0) <= 0;

      }

      return true;

    });

  renderProducts();

}


/* =========================================================
   RENDER
========================================================= */

function renderProducts() {

  if (!productsTableBody) {
    return;
  }

  productsTableBody.innerHTML = "";

  if (!filteredProducts.length) {

    if (emptyTable) {
      emptyTable.classList.remove("hidden");
    }

    return;
  }

  if (emptyTable) {
    emptyTable.classList.add("hidden");
  }

  filteredProducts.forEach(
    product => {

      productsTableBody.appendChild(
        createProductRow(product)
      );

    }
  );

}


function createProductRow(product) {

  const tr =
    document.createElement("tr");

  const image =
    product.image_url
      ? `
        <div class="product-table-image">
          <img
            src="${escapeAttribute(product.image_url)}"
            alt="${escapeAttribute(product.name || "Product")}"
            loading="lazy"
          >
        </div>
      `
      : `
        <div class="product-table-image">
          <div class="product-image-placeholder">
            No Image
          </div>
        </div>
      `;

  const stock =
    Number(product.stock || 0);

  let stockClass =
    "stock-value";

  if (stock <= 0) {
    stockClass += " stock-out";
  } else if (stock <= 5) {
    stockClass += " stock-low";
  }

  const statusHtml =
    product.is_active
      ? (
          stock <= 0
            ? `<span class="status-badge status-out">Out of Stock</span>`
            : `<span class="status-badge status-active">Active</span>`
        )
      : `<span class="status-badge status-hidden">Hidden</span>`;

  const oldPrice =
    product.old_price !== null &&
    product.old_price !== undefined &&
    Number(product.old_price) > 0
      ? `
        <span class="old-price">
          ${formatPrice(product.old_price)}
        </span>
      `
      : "";

  tr.innerHTML = `

    <td>

      <div class="product-table-product">

        ${image}

        <div class="product-table-info">

          <strong>
            ${escapeHtml(product.name || "Unnamed")}
          </strong>

          <span>
            ${escapeHtml(product.category || "No category")}
          </span>

        </div>

      </div>

    </td>


    <td>
      <span class="product-code">
        ${escapeHtml(product.product_code || "-")}
      </span>
    </td>


    <td class="price-cell">

      <strong>
        ${formatPrice(product.price)}
      </strong>

      ${oldPrice}

    </td>


    <td>

      <span class="${stockClass}">
        ${stock}
      </span>

    </td>


    <td>
      ${statusHtml}
    </td>


    <td>

      <div class="product-actions">

        <button
          type="button"
          class="table-action"
          data-action="edit"
          data-id="${product.id}"
        >
          Edit
        </button>

        ${
          product.is_active
            ? `
              <button
                type="button"
                class="table-action danger"
                data-action="hide"
                data-id="${product.id}"
              >
                Hide
              </button>
            `
            : `
              <button
                type="button"
                class="table-action"
                data-action="reactivate"
                data-id="${product.id}"
              >
                Reactivate
              </button>
            `
        }

      </div>

    </td>

  `;

  return tr;
}


/* =========================================================
   TABLE ACTIONS
========================================================= */

function handleProductTableClick(event) {

  const button =
    event.target.closest(
      "[data-action]"
    );

  if (!button) {
    return;
  }

  const action =
    button.dataset.action;

  const id =
    button.dataset.id;

  const product =
    products.find(
      item =>
        String(item.id) === String(id)
    );

  if (!product) {
    return;
  }

  if (action === "edit") {

    openEditProductModal(product);

  } else if (action === "hide") {

    askProductAction(
      product,
      "hide"
    );

  } else if (action === "reactivate") {

    askProductAction(
      product,
      "reactivate"
    );

  }

}


/* =========================================================
   ADD PRODUCT
========================================================= */

function openAddProductModal() {

  if (!productForm) {
    return;
  }

  productForm.reset();

  if (editingProductId) {
    editingProductId.value = "";
  }

  if (productModalTitle) {
    productModalTitle.textContent =
      "Add Product";
  }

  if (productActive) {
    productActive.checked = true;
  }

  if (imagePreview) {

    imagePreview.innerHTML =
      "<span>Product Image</span>";

  }

  if (currentImageText) {

    currentImageText.textContent =
      "JPG, PNG or WEBP";

  }

  clearProductFormMessage();

  openModal(productModal);

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function openEditProductModal(product) {

  if (!productForm) {
    return;
  }

  if (editingProductId) {
    editingProductId.value =
      product.id || "";
  }

  if (productModalTitle) {
    productModalTitle.textContent =
      "Edit Product";
  }

  if (productCode) {
    productCode.value =
      product.product_code || "";
  }

  if (productName) {
    productName.value =
      product.name || "";
  }

  if (productPrice) {
    productPrice.value =
      product.price ?? "";
  }

  if (productOldPrice) {
    productOldPrice.value =
      product.old_price ?? "";
  }

  if (productStock) {
    productStock.value =
      product.stock ?? 0;
  }

  if (productCategory) {
    productCategory.value =
      product.category || "";
  }

  if (productDescription) {
    productDescription.value =
      product.description || "";
  }

  if (productActive) {
    productActive.checked =
      product.is_active !== false;
  }

  if (productImage) {
    productImage.value = "";
  }

  if (product.image_url) {

    if (imagePreview) {

      imagePreview.innerHTML = `
        <img
          src="${escapeAttribute(product.image_url)}"
          alt="Current product image"
        >
      `;

    }

    if (currentImageText) {

      currentImageText.textContent =
        "Current image will remain unless you choose a new one.";

    }

  } else {

    if (imagePreview) {
      imagePreview.innerHTML =
        "<span>Product Image</span>";
    }

    if (currentImageText) {
      currentImageText.textContent =
        "No image uploaded.";
    }

  }

  clearProductFormMessage();

  openModal(productModal);

}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function handleProductSubmit(event) {

  event.preventDefault();

  clearProductFormMessage();

  const productId =
    editingProductId?.value || "";

  const code =
    productCode?.value.trim() || "";

  const name =
    productName?.value.trim() || "";

  const price =
    Number(productPrice?.value);

  const oldPriceRaw =
    productOldPrice?.value.trim() || "";

  const oldPrice =
    oldPriceRaw === ""
      ? null
      : Number(oldPriceRaw);

  const stock =
    Number(productStock?.value);

  const category =
    productCategory?.value.trim() || "";

  const description =
    productDescription?.value.trim() || "";

  const isActive =
    productActive?.checked !== false;

  if (!code) {

    showProductFormMessage(
      "Product code is required.",
      "error"
    );

    return;
  }

  if (!name) {

    showProductFormMessage(
      "Product name is required.",
      "error"
    );

    return;
  }

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    showProductFormMessage(
      "Please enter a valid price.",
      "error"
    );

    return;
  }

  if (
    oldPrice !== null &&
    (
      !Number.isFinite(oldPrice) ||
      oldPrice < 0
    )
  ) {

    showProductFormMessage(
      "Please enter a valid old price.",
      "error"
    );

    return;
  }

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {

    showProductFormMessage(
      "Stock must be a whole number.",
      "error"
    );

    return;
  }

  setButtonLoading(
    saveProductButton,
    null,
    true,
    "Saving..."
  );

  try {

    let imageUrl =
      getExistingProductImage(productId);

    if (
      productImage &&
      productImage.files &&
      productImage.files.length > 0
    ) {

      imageUrl =
        await uploadProductImage(
          productImage.files[0],
          code
        );

    }

    const payload = {

      product_code: code,

      name,

      price,

      old_price: oldPrice,

      category:
        category || null,

      image_url:
        imageUrl || null,

      stock,

      description:
        description || null,

      is_active:
        isActive,

      updated_at:
        new Date().toISOString()

    };


    if (productId) {

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .update(payload)
          .eq("id", productId);

      if (error) {
        throw error;
      }

      showToast(
        "Product updated successfully.",
        "success"
      );

    } else {

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .insert({
            ...payload,
            created_at:
              new Date().toISOString()
          });

      if (error) {
        throw error;
      }

      showToast(
        "Product added successfully.",
        "success"
      );

    }

    closeModal(productModal);

    await loadProducts(true);

  } catch (error) {

    console.error(
      "Save product error:",
      error
    );

    showProductFormMessage(
      getFriendlyError(error),
      "error"
    );

  } finally {

    setButtonLoading(
      saveProductButton,
      null,
      false,
      "Save Product"
    );

  }

}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

async function uploadProductImage(
  file,
  productCode
) {

  if (!file) {
    return null;
  }

  if (
    !file.type ||
    !file.type.startsWith("image/")
  ) {

    throw new Error(
      "Please select a valid image file."
    );

  }

  const maxSize =
    8 * 1024 * 1024;

  if (file.size > maxSize) {

    throw new Error(
      "Image size must be less than 8 MB."
    );

  }

  const extension =
    getFileExtension(file.name);

  const safeCode =
    productCode
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase();

  const uniqueName =
    `${safeCode}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

  const path =
    uniqueName;


  const {
    error
  } =
    await supabaseClient
      .storage
      .from("product-images")
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );

  if (error) {
    throw error;
  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(path);

  if (
    !data ||
    !data.publicUrl
  ) {

    throw new Error(
      "Image uploaded but public URL could not be created."
    );

  }

  return data.publicUrl;

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function handleImagePreview() {

  const file =
    productImage?.files?.[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/")
  ) {

    showProductFormMessage(
      "Please choose an image file.",
      "error"
    );

    productImage.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload =
    event => {

      if (imagePreview) {

        imagePreview.innerHTML = `
          <img
            src="${event.target.result}"
            alt="Selected image preview"
          >
        `;

      }

    };

  reader.readAsDataURL(file);

  if (currentImageText) {

    currentImageText.textContent =
      file.name;

  }

}


/* =========================================================
   EXISTING IMAGE
========================================================= */

function getExistingProductImage(productId) {

  if (!productId) {
    return null;
  }

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(productId)
    );

  return product?.image_url || null;

}


/* =========================================================
   HIDE / REACTIVATE
========================================================= */

function askProductAction(
  product,
  action
) {

  currentConfirmAction =
    {
      productId: product.id,
      action
    };

  if (action === "hide") {

    confirmTitle.textContent =
      "Hide Product";

    confirmText.textContent =
      `"${product.name}" will be hidden from the store. You can reactivate it later.`;

    confirmActionButton.textContent =
      "Hide Product";

    confirmActionButton.classList.add(
      "danger-btn"
    );

  } else {

    confirmTitle.textContent =
      "Reactivate Product";

    confirmText.textContent =
      `"${product.name}" will become visible on the store again.`;

    confirmActionButton.textContent =
      "Reactivate";

  }

  openModal(confirmModal);

}


async function executeConfirmAction() {

  if (!currentConfirmAction) {
    return;
  }

  const {
    productId,
    action
  } =
    currentConfirmAction;

  setButtonLoading(
    confirmActionButton,
    null,
    true,
    action === "hide"
      ? "Hiding..."
      : "Activating..."
  );

  try {

    const isActive =
      action !== "hide";

    const {
      error
    } =
      await supabaseClient
        .from("products")
        .update({
          is_active: isActive,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", productId);

    if (error) {
      throw error;
    }

    closeModal(confirmModal);

    showToast(
      action === "hide"
        ? "Product hidden successfully."
        : "Product reactivated successfully.",
      "success"
    );

    currentConfirmAction = null;

    await loadProducts(true);

  } catch (error) {

    console.error(
      "Product status error:",
      error
    );

    showToast(
      getFriendlyError(error),
      "error"
    );

  } finally {

    setButtonLoading(
      confirmActionButton,
      null,
      false,
      "Confirm"
    );

  }

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  const total =
    products.length;

  const active =
    products.filter(
      product =>
        product.is_active === true
    ).length;

  const hidden =
    products.filter(
      product =>
        product.is_active === false
    ).length;

  const outOfStock =
    products.filter(
      product =>
        Number(product.stock || 0) <= 0
    ).length;

  if (totalProducts) {
    totalProducts.textContent =
      total;
  }

  if (activeProducts) {
    activeProducts.textContent =
      active;
  }

  if (hiddenProducts) {
    hiddenProducts.textContent =
      hidden;
  }

  if (outOfStockProducts) {
    outOfStockProducts.textContent =
      outOfStock;
  }

}


/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {

  if (!modal) {
    return;
  }

  modal.style.display = "flex";

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeModal(modal) {

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  modal.style.display =
    "none";

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !productModal?.classList.contains("open") &&
    !confirmModal?.classList.contains("open")
  ) {

    document.body.style.overflow =
      "";

  }

}


function forceCloseModal(modal) {

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  modal.style.display =
    "none";

  modal.style.visibility =
    "hidden";

  modal.style.opacity =
    "0";

  modal.style.pointerEvents =
    "none";

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   MESSAGES
========================================================= */

function showLoginMessage(
  message,
  type = "info"
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.className =
    `form-message ${type}`;

}


function clearLoginMessage() {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    "";

  loginMessage.className =
    "form-message";

}


function showProductFormMessage(
  message,
  type = "info"
) {

  if (!productFormMessage) {
    return;
  }

  productFormMessage.textContent =
    message;

  productFormMessage.className =
    `form-message ${type}`;

}


function clearProductFormMessage() {

  if (!productFormMessage) {
    return;
  }

  productFormMessage.textContent =
    "";

  productFormMessage.className =
    "form-message";

}


function setAdminStatus(
  message,
  isError = false
) {

  if (!adminStatus) {
    return;
  }

  adminStatus.textContent =
    message;

  adminStatus.style.color =
    isError
      ? "var(--danger)"
      : "var(--muted)";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "info"
) {

  if (!adminToast) {
    return;
  }

  clearTimeout(toastTimer);

  adminToast.textContent =
    message;

  adminToast.className =
    `admin-toast show ${type}`;

  toastTimer =
    setTimeout(
      () => {

        adminToast.classList.remove(
          "show"
        );

      },
      3500
    );

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
  button,
  textElement,
  loading,
  text
) {

  if (!button) {
    return;
  }

  button.disabled =
    loading;

  button.classList.toggle(
    "loading",
    loading
  );

  if (textElement) {

    textElement.textContent =
      text;

  } else {

    if (!button.dataset.originalText) {

      button.dataset.originalText =
        button.textContent;

    }

    button.textContent =
      loading
        ? text
        : button.dataset.originalText;

  }

}


/* =========================================================
   FORMATTING
========================================================= */

function formatPrice(value) {

  const number =
    Number(value || 0);

  return (
    "Rs. " +
    number.toLocaleString(
      "en-PK",
      {
        maximumFractionDigits: 2
      }
    )
  );

}


function getFileExtension(
  filename
) {

  const parts =
    String(filename || "")
      .split(".");

  return (
    parts.length > 1
      ? parts.pop()
      : "jpg"
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    ) || "jpg";

}


/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
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


function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================================================
   ERROR HANDLING
========================================================= */

function getFriendlyError(error) {

  if (!error) {
    return "Something went wrong.";
  }

  const message =
    error.message ||
    error.error_description ||
    String(error);

  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {

    return "Incorrect email or password.";

  }

  if (
    lower.includes(
      "email not confirmed"
    )
  ) {

    return "Please confirm your email before logging in.";

  }

  if (
    lower.includes(
      "row-level security"
    ) ||
    lower.includes(
      "violates row-level security"
    )
  ) {

    return (
      "Permission denied. Please check the admin RLS policies."
    );

  }

  if (
    lower.includes(
      "duplicate key"
    )
  ) {

    return (
      "This product code already exists."
    );

  }

  if (
    lower.includes(
      "bucket"
    )
  ) {

    return (
      "Storage error. Please check the product-images bucket and its admin policies."
    );

  }

  return message;

}
