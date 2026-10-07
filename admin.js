/* =========================================================
   KASHI BHAI ADMIN PANEL
   Supabase Product + Staff + Audit Manager
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

const STORAGE_BUCKET =
  "product-images";


/* =========================================================
   STATE
========================================================= */

let products = [];
let filteredProducts = [];

let staffProfiles = [];
let auditLogs = [];

let currentUser = null;
let currentOwnerProfile = null;

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


/* =========================================================
   PRODUCT MODAL
========================================================= */

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


/* =========================================================
   CONFIRM MODAL
========================================================= */

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


/* =========================================================
   TOAST
========================================================= */

const adminToast =
  document.getElementById("adminToast");


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);


async function initializeAdmin() {

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);

  showLoginScreen();

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

          currentUser = null;
          currentOwnerProfile = null;

          showLoginScreen();

        }

      }
    );


    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      showLoginScreen();

      return;
    }


    if (
      data?.session?.user
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

  loginForm?.addEventListener(
    "submit",
    handleLogin
  );


  logoutButton?.addEventListener(
    "click",
    handleLogout
  );


  addProductButton?.addEventListener(
    "click",
    openAddProductModal
  );


  refreshProductsButton?.addEventListener(
    "click",
    () => loadProducts(true)
  );


  adminSearch?.addEventListener(
    "input",
    applyFilters
  );


  adminStatusFilter?.addEventListener(
    "change",
    applyFilters
  );


  productForm?.addEventListener(
    "submit",
    handleProductSubmit
  );


  productImage?.addEventListener(
    "change",
    handleImagePreview
  );


  closeProductModal?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeModal(productModal);

    }
  );


  cancelProductButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeModal(productModal);

    }
  );


  productModalOverlay?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        productModalOverlay
      ) {

        closeModal(productModal);

      }

    }
  );


  cancelConfirmButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeModal(confirmModal);

      currentConfirmAction = null;

    }
  );


  confirmModalOverlay?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        confirmModalOverlay
      ) {

        closeModal(confirmModal);

        currentConfirmAction = null;

      }

    }
  );


  confirmActionButton?.addEventListener(
    "click",
    executeConfirmAction
  );


  productsTableBody?.addEventListener(
    "click",
    handleProductTableClick
  );


  document.addEventListener(
    "click",
    handleGlobalModalClicks
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeModal(productModal);

        closeModal(confirmModal);

        currentConfirmAction = null;

      }

    }
  );

}


/* =========================================================
   GLOBAL MODAL CLICK PROTECTION
========================================================= */

function handleGlobalModalClicks(event) {

  if (
    event.target.closest(
      "#closeProductModal"
    )
  ) {

    event.preventDefault();

    closeModal(productModal);

    return;

  }


  if (
    event.target.closest(
      "#cancelProductButton"
    )
  ) {

    event.preventDefault();

    closeModal(productModal);

    return;

  }


  if (
    event.target.closest(
      "#cancelConfirmButton"
    )
  ) {

    event.preventDefault();

    closeModal(confirmModal);

    currentConfirmAction = null;

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

  event.preventDefault();

  const email =
    loginEmail?.value.trim() || "";

  const password =
    loginPassword?.value || "";


  if (
    !email ||
    !password
  ) {

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


    if (!data?.user) {

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


    currentUser =
      data.user;


    await loadCurrentOwnerProfile();

    await updateLastLogin();


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


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

  try {

    if (currentUser) {

      await writeAuditLog({
        action: "LOGOUT",
        entityType: "authentication",
        entityId: currentUser.id,
        description:
          `${currentOwnerProfile?.full_name || "Owner"} logged out.`
      });

    }


    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  currentUser = null;

  currentOwnerProfile = null;

  showLoginScreen();

}


/* =========================================================
   ADMIN CHECK
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


/* =========================================================
   AUTH USER
========================================================= */

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


    showLoginScreen();


    showLoginMessage(
      "This account does not have admin access.",
      "error"
    );


    return;

  }


  currentUser =
    user;


  await loadCurrentOwnerProfile();

  await updateLastLogin();


  await showAdminApp();

}


/* =========================================================
   CURRENT OWNER PROFILE
========================================================= */

async function loadCurrentOwnerProfile() {

  if (!currentUser) {
    return null;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("staff_profiles")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .eq(
          "role",
          "owner"
        )
        .eq(
          "is_active",
          true
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Owner profile error:",
        error
      );

      return null;

    }


    currentOwnerProfile =
      data || null;


    return currentOwnerProfile;

  } catch (error) {

    console.error(
      "Owner profile exception:",
      error
    );

    return null;

  }

}


/* =========================================================
   UPDATE LAST LOGIN
========================================================= */

async function updateLastLogin() {

  if (!currentUser) {
    return;
  }


  try {

    await supabaseClient
      .from("staff_profiles")
      .update({
        last_login_at:
          new Date().toISOString()
      })
      .eq(
        "user_id",
        currentUser.id
      );

  } catch (error) {

    console.error(
      "Last login update error:",
      error
    );

  }

}


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showLoginScreen() {

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);

  currentConfirmAction = null;

  document.body.style.overflow = "";


  if (loginScreen) {

    loginScreen.classList.remove(
      "hidden"
    );

    loginScreen.style.display =
      "flex";

    loginScreen.style.visibility =
      "visible";

    loginScreen.style.opacity =
      "1";

    loginScreen.style.filter =
      "none";

    loginScreen.style.pointerEvents =
      "auto";

  }


  if (adminApp) {

    adminApp.classList.add(
      "hidden"
    );

    adminApp.style.display =
      "none";

  }


  if (loginEmail) {

    setTimeout(
      () => loginEmail.focus(),
      50
    );

  }

}


/* =========================================================
   SHOW ADMIN
========================================================= */

async function showAdminApp() {

  forceCloseModal(productModal);
  forceCloseModal(confirmModal);


  if (loginScreen) {

    loginScreen.classList.add(
      "hidden"
    );

    loginScreen.style.display =
      "none";

  }


  if (adminApp) {

    adminApp.classList.remove(
      "hidden"
    );

    adminApp.style.display =
      "block";

  }


  await loadProducts();

  await loadStaff();

  await loadAuditLogs();

  injectStaffManager();

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts(
  showLoading = false
) {

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
      `${products.length} product${
        products.length === 1
          ? ""
          : "s"
      } loaded.`
    );


  } catch (error) {

    console.error(
      "Load products error:",
      error
    );


    products = [];

    updateStats();

    applyFilters();


    setAdminStatus(
      "Could not load products: " +
      getFriendlyError(error),
      true
    );

  }

}


/* =========================================================
   IMAGE URL
========================================================= */

function getProductImageUrl(
  imageValue
) {

  if (!imageValue) {
    return null;
  }


  const value =
    String(imageValue).trim();


  if (!value) {
    return null;
  }


  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {

    return value;

  }


  const cleanPath =
    value
      .replace(/^\/+/, "")
      .replace(
        /^product-images\//i,
        ""
      );


  const {
    data
  } =
    supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(
        cleanPath
      );


  return data?.publicUrl || null;

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
    adminStatusFilter?.value ||
    "all";


  filteredProducts =
    products.filter(
      product => {

        const matchesSearch =
          !search ||
          String(
            product.product_code || ""
          )
            .toLowerCase()
            .includes(search) ||

          String(
            product.name || ""
          )
            .toLowerCase()
            .includes(search) ||

          String(
            product.category || ""
          )
            .toLowerCase()
            .includes(search);


        if (!matchesSearch) {
          return false;
        }


        if (
          status === "active"
        ) {

          return (
            product.is_active === true &&
            Number(
              product.stock || 0
            ) > 0
          );

        }


        if (
          status === "hidden"
        ) {

          return (
            product.is_active === false
          );

        }


        if (
          status === "out_of_stock"
        ) {

          return (
            Number(
              product.stock || 0
            ) <= 0
          );

        }


        return true;

      }
    );


  renderProducts();

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

  if (!productsTableBody) {
    return;
  }


  productsTableBody.innerHTML = "";


  if (!filteredProducts.length) {

    emptyTable?.classList.remove(
      "hidden"
    );

    return;

  }


  emptyTable?.classList.add(
    "hidden"
  );


  filteredProducts.forEach(
    product => {

      productsTableBody.appendChild(
        createProductRow(product)
      );

    }
  );

}


/* =========================================================
   PRODUCT ROW
========================================================= */

function createProductRow(
  product
) {

  const tr =
    document.createElement("tr");


  const imageUrl =
    getProductImageUrl(
      product.image_url
    );


  const image =
    imageUrl

      ? `
        <div class="product-table-image">
          <img
            src="${escapeAttribute(imageUrl)}"
            alt="${escapeAttribute(
              product.name ||
              "Product"
            )}"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;>No Image</div>'"
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
    Number(
      product.stock || 0
    );


  let stockClass =
    "stock-value";


  if (stock <= 0) {

    stockClass +=
      " stock-out";

  } else if (stock <= 5) {

    stockClass +=
      " stock-low";

  }


  const statusHtml =
    product.is_active

      ? (
          stock <= 0

            ? `
              <span class="status-badge status-out">
                Out of Stock
              </span>
            `

            : `
              <span class="status-badge status-active">
                Active
              </span>
            `
        )

      : `
        <span class="status-badge status-hidden">
          Hidden
        </span>
      `;


  const oldPrice =
    product.old_price !== null &&
    product.old_price !== undefined &&
    Number(product.old_price) > 0

      ? `
        <span class="old-price">
          ${formatPrice(
            product.old_price
          )}
        </span>
      `

      : "";


  tr.innerHTML = `

    <td>

      <div class="product-table-product">

        ${image}

        <div class="product-table-info">

          <strong>
            ${escapeHtml(
              product.name ||
              "Unnamed"
            )}
          </strong>

          <span>
            ${escapeHtml(
              product.category ||
              "No category"
            )}
          </span>

        </div>

      </div>

    </td>


    <td>
      <span class="product-code">
        ${escapeHtml(
          product.product_code ||
          "-"
        )}
      </span>
    </td>


    <td class="price-cell">

      <strong>
        ${formatPrice(
          product.price
        )}
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
          data-id="${escapeAttribute(
            product.id
          )}"
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
                data-id="${escapeAttribute(
                  product.id
                )}"
              >
                Hide
              </button>
            `

            : `
              <button
                type="button"
                class="table-action"
                data-action="reactivate"
                data-id="${escapeAttribute(
                  product.id
                )}"
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
   PRODUCT TABLE ACTIONS
========================================================= */

function handleProductTableClick(
  event
) {

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
        String(item.id) ===
        String(id)
    );


  if (!product) {

    showToast(
      "Product could not be found.",
      "error"
    );

    return;

  }


  if (
    action === "edit"
  ) {

    openEditProductModal(
      product
    );

    return;

  }


  if (
    action === "hide"
  ) {

    askProductAction(
      product,
      "hide"
    );

    return;

  }


  if (
    action === "reactivate"
  ) {

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

    editingProductId.value =
      "";

  }


  if (productModalTitle) {

    productModalTitle.textContent =
      "Add Product";

  }


  if (productActive) {

    productActive.checked =
      true;

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

function openEditProductModal(
  product
) {

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

    productImage.value =
      "";

  }


  const imageUrl =
    getProductImageUrl(
      product.image_url
    );


  if (imageUrl) {

    if (imagePreview) {

      imagePreview.innerHTML = `
        <img
          src="${escapeAttribute(
            imageUrl
          )}"
          alt="Current product image"
          onerror="this.parentElement.innerHTML='<span>Image not found</span>'"
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

async function handleProductSubmit(
  event
) {

  event.preventDefault();

  clearProductFormMessage();


  const productId =
    editingProductId?.value || "";


  const code =
    productCode?.value.trim() || "";


  const name =
    productName?.value.trim() || "";


  const price =
    Number(
      productPrice?.value
    );


  const oldPriceRaw =
    productOldPrice?.value.trim() || "";


  const oldPrice =
    oldPriceRaw === ""
      ? null
      : Number(oldPriceRaw);


  const stock =
    Number(
      productStock?.value
    );


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
      getExistingProductImage(
        productId
      );


    if (
      productImage?.files?.length > 0
    ) {

      imageUrl =
        await uploadProductImage(
          productImage.files[0],
          code
        );

    }


    const payload = {

      product_code:
        code,

      name:
        name,

      price:
        price,

      old_price:
        oldPrice,

      category:
        category || null,

      image_url:
        imageUrl || null,

      stock:
        stock,

      description:
        description || null,

      is_active:
        isActive,

      updated_at:
        new Date().toISOString()

    };


    let savedProduct = null;


    if (productId) {

      const oldProduct =
        products.find(
          item =>
            String(item.id) ===
            String(productId)
        );


      const {
        data,
        error
      } =
        await supabaseClient
          .from("products")
          .update(payload)
          .eq(
            "id",
            productId
          )
          .select()
          .single();


      if (error) {
        throw error;
      }


      if (!data) {

        throw new Error(
          "Product was not updated. Please check your admin permissions."
        );

      }


      savedProduct =
        data;


      await writeAuditLog({

        action:
          "PRODUCT_UPDATED",

        entityType:
          "product",

        entityId:
          String(productId),

        description:
          `Updated product "${name}".`,

        oldData:
          oldProduct || null,

        newData:
          data

      });


      showToast(
        "Product updated successfully.",
        "success"
      );


    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("products")
          .insert({
            ...payload,

            created_at:
              new Date().toISOString()
          })
          .select()
          .single();


      if (error) {
        throw error;
      }


      if (!data) {

        throw new Error(
          "Product could not be added."
        );

      }


      savedProduct =
        data;


      await writeAuditLog({

        action:
          "PRODUCT_CREATED",

        entityType:
          "product",

        entityId:
          String(data.id),

        description:
          `Created product "${name}".`,

        oldData:
          null,

        newData:
          data

      });


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
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "Please select a valid image file."
    );

  }


  const maxSize =
    8 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    throw new Error(
      "Image size must be less than 8 MB."
    );

  }


  const extension =
    getFileExtension(
      file.name
    );


  const safeCode =
    productCode
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      )
      .toLowerCase();


  const uniqueName =
    `${safeCode}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;


  const {
    error
  } =
    await supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .upload(
        uniqueName,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
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
      .from(STORAGE_BUCKET)
      .getPublicUrl(
        uniqueName
      );


  if (
    !data?.publicUrl
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
    !file.type.startsWith(
      "image/"
    )
  ) {

    showProductFormMessage(
      "Please choose an image file.",
      "error"
    );


    productImage.value =
      "";

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

function getExistingProductImage(
  productId
) {

  if (!productId) {
    return null;
  }


  const product =
    products.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (!product) {
    return null;
  }


  return (
    getProductImageUrl(
      product.image_url
    ) || null
  );

}


/* =========================================================
   HIDE / REACTIVATE
========================================================= */

function askProductAction(
  product,
  action
) {

  currentConfirmAction = {

    productId:
      product.id,

    action:
      action

  };


  if (
    action === "hide"
  ) {

    if (confirmTitle) {

      confirmTitle.textContent =
        "Hide Product";

    }


    if (confirmText) {

      confirmText.textContent =
        `"${product.name}" will be hidden from the store. You can reactivate it later.`;

    }


    if (confirmActionButton) {

      confirmActionButton.textContent =
        "Hide Product";

      confirmActionButton.classList.add(
        "danger-btn"
      );

    }

  } else {

    if (confirmTitle) {

      confirmTitle.textContent =
        "Reactivate Product";

    }


    if (confirmText) {

      confirmText.textContent =
        `"${product.name}" will become visible on the store again.`;

    }


    if (confirmActionButton) {

      confirmActionButton.textContent =
        "Reactivate";

      confirmActionButton.classList.remove(
        "danger-btn"
      );

    }

  }


  openModal(confirmModal);

}


/* =========================================================
   EXECUTE HIDE / REACTIVATE
========================================================= */

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

    const product =
      products.find(
        item =>
          String(item.id) ===
          String(productId)
      );


    const isActive =
      action !== "hide";


    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .update({

          is_active:
            isActive,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          productId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        "Product status could not be changed."
      );

    }


    await writeAuditLog({

      action:
        action === "hide"
          ? "PRODUCT_HIDDEN"
          : "PRODUCT_REACTIVATED",

      entityType:
        "product",

      entityId:
        String(productId),

      description:
        action === "hide"
          ? `Hidden product "${product?.name || ""}".`
          : `Reactivated product "${product?.name || ""}".`,

      oldData:
        product || null,

      newData:
        data

    });


    closeModal(confirmModal);


    showToast(
      action === "hide"
        ? "Product hidden successfully."
        : "Product reactivated successfully.",
      "success"
    );


    currentConfirmAction =
      null;


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
        Number(
          product.stock || 0
        ) <= 0
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
   STAFF MANAGEMENT
========================================================= */

/*
 * Staff manager is created dynamically.
 * The matching HTML will also be provided separately.
 */

function injectStaffManager() {

  if (!adminApp) {
    return;
  }


  if (
    document.getElementById(
      "staffManagementSection"
    )
  ) {

    renderStaffManager();

    return;

  }


  const section =
    document.createElement("section");


  section.id =
    "staffManagementSection";


  section.className =
    "admin-section staff-management-section";


  section.innerHTML = `

    <div class="section-header">

      <div>
        <span class="section-kicker">
          OWNER ONLY
        </span>

        <h2>
          Staff Management
        </h2>

        <p>
          Manage individual staff accounts and access.
        </p>
      </div>

      <div class="section-actions">

        <button
          type="button"
          class="primary-btn"
          id="addStaffButton"
        >
          + Add Staff
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="refreshStaffButton"
        >
          Refresh
        </button>

      </div>

    </div>


    <div class="admin-stats staff-stats">

      <div class="stat-card">

        <span>
          Total Staff
        </span>

        <strong id="totalStaff">
          0
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Active Staff
        </span>

        <strong id="activeStaff">
          0
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Disabled Staff
        </span>

        <strong id="disabledStaff">
          0
        </strong>

      </div>

    </div>


    <div class="admin-toolbar">

      <div class="search-box">

        <input
          type="search"
          id="staffSearch"
          placeholder="Search staff by name or email..."
        >

      </div>

      <select
        id="staffStatusFilter"
      >

        <option value="all">
          All Staff
        </option>

        <option value="active">
          Active
        </option>

        <option value="disabled">
          Disabled
        </option>

      </select>

    </div>


    <div class="table-wrapper">

      <table class="admin-table">

        <thead>

          <tr>

            <th>
              Staff
            </th>

            <th>
              Role
            </th>

            <th>
              Status
            </th>

            <th>
              Last Login
            </th>

            <th>
              Created
            </th>

            <th>
              Actions
            </th>

          </tr>

        </thead>

        <tbody id="staffTableBody">
        </tbody>

      </table>

    </div>


    <div
      id="staffEmptyTable"
      class="empty-table hidden"
    >
      No staff accounts found.
    </div>


    <div class="section-header activity-header">

      <div>

        <span class="section-kicker">
          SECURITY
        </span>

        <h2>
          Activity Log
        </h2>

        <p>
          Login, staff and admin activity history.
        </p>

      </div>

      <button
        type="button"
        class="secondary-btn"
        id="refreshAuditButton"
      >
        Refresh
      </button>

    </div>


    <div class="admin-toolbar">

      <div class="search-box">

        <input
          type="search"
          id="auditSearch"
          placeholder="Search activity..."
        >

      </div>

    </div>


    <div class="table-wrapper">

      <table class="admin-table">

        <thead>

          <tr>

            <th>
              Date / Time
            </th>

            <th>
              User
            </th>

            <th>
              Role
            </th>

            <th>
              Action
            </th>

            <th>
              Entity
            </th>

            <th>
              Description
            </th>

          </tr>

        </thead>

        <tbody id="auditTableBody">
        </tbody>

      </table>

    </div>


    <div
      id="auditEmptyTable"
      class="empty-table hidden"
    >
      No activity found.
    </div>

  `;


  adminApp.appendChild(
    section
  );


  setupStaffEvents();

  renderStaffManager();

  renderAuditLogs();

}


/* =========================================================
   STAFF EVENTS
========================================================= */

function setupStaffEvents() {

  const addStaffButton =
    document.getElementById(
      "addStaffButton"
    );


  const refreshStaffButton =
    document.getElementById(
      "refreshStaffButton"
    );


  const refreshAuditButton =
    document.getElementById(
      "refreshAuditButton"
    );


  const staffSearch =
    document.getElementById(
      "staffSearch"
    );


  const staffStatusFilter =
    document.getElementById(
      "staffStatusFilter"
    );


  const auditSearch =
    document.getElementById(
      "auditSearch"
    );


  addStaffButton?.addEventListener(
    "click",
    openCreateStaffModal
  );


  refreshStaffButton?.addEventListener(
    "click",
    async () => {

      await loadStaff();

      showToast(
        "Staff list refreshed.",
        "success"
      );

    }
  );


  refreshAuditButton?.addEventListener(
    "click",
    async () => {

      await loadAuditLogs();

      showToast(
        "Activity log refreshed.",
        "success"
      );

    }
  );


  staffSearch?.addEventListener(
    "input",
    renderStaffManager
  );


  staffStatusFilter?.addEventListener(
    "change",
    renderStaffManager
  );


  auditSearch?.addEventListener(
    "input",
    renderAuditLogs
  );


  const staffTableBody =
    document.getElementById(
      "staffTableBody"
    );


  staffTableBody?.addEventListener(
    "click",
    handleStaffTableClick
  );

}


/* =========================================================
   LOAD STAFF
========================================================= */

async function loadStaff() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("staff_profiles")
        .select(`
          user_id,
          full_name,
          email,
          role,
          is_active,
          created_at,
          last_login_at
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


    staffProfiles =
      Array.isArray(data)
        ? data
        : [];


    renderStaffManager();


  } catch (error) {

    console.error(
      "Load staff error:",
      error
    );


    showToast(
      "Could not load staff: " +
      getFriendlyError(error),
      "error"
    );

  }

}


/* =========================================================
   STAFF RENDER
========================================================= */

function renderStaffManager() {

  const tbody =
    document.getElementById(
      "staffTableBody"
    );


  if (!tbody) {
    return;
  }


  const search =
    (
      document.getElementById(
        "staffSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const status =
    document.getElementById(
      "staffStatusFilter"
    )?.value ||
    "all";


  const filtered =
    staffProfiles.filter(
      staff => {

        const matchesSearch =
          !search ||
          String(
            staff.full_name || ""
          )
            .toLowerCase()
            .includes(search) ||

          String(
            staff.email || ""
          )
            .toLowerCase()
            .includes(search);


        if (!matchesSearch) {
          return false;
        }


        if (
          status === "active"
        ) {

          return (
            staff.is_active === true
          );

        }


        if (
          status === "disabled"
        ) {

          return (
            staff.is_active === false
          );

        }


        return true;

      }
    );


  const staffOnly =
    staffProfiles.filter(
      staff =>
        staff.role === "staff"
    );


  const active =
    staffOnly.filter(
      staff =>
        staff.is_active === true
    ).length;


  const disabled =
    staffOnly.filter(
      staff =>
        staff.is_active === false
    ).length;


  setText(
    "totalStaff",
    staffOnly.length
  );


  setText(
    "activeStaff",
    active
  );


  setText(
    "disabledStaff",
    disabled
  );


  tbody.innerHTML = "";


  const empty =
    document.getElementById(
      "staffEmptyTable"
    );


  if (!filtered.length) {

    empty?.classList.remove(
      "hidden"
    );

    return;

  }


  empty?.classList.add(
    "hidden"
  );


  filtered.forEach(
    staff => {

      tbody.appendChild(
        createStaffRow(staff)
      );

    }
  );

}


/* =========================================================
   CREATE STAFF ROW
========================================================= */

function createStaffRow(
  staff
) {

  const tr =
    document.createElement("tr");


  const isCurrentOwner =
    currentUser &&
    String(staff.user_id) ===
    String(currentUser.id);


  const status =
    staff.is_active
      ? `
        <span class="status-badge status-active">
          Active
        </span>
      `
      : `
        <span class="status-badge status-hidden">
          Disabled
        </span>
      `;


  let actionHtml =
    "";


  if (
    staff.role === "staff"
  ) {

    actionHtml =
      staff.is_active

        ? `
          <button
            type="button"
            class="table-action danger"
            data-staff-action="disable"
            data-user-id="${escapeAttribute(
              staff.user_id
            )}"
          >
            Disable
          </button>
        `

        : `
          <button
            type="button"
            class="table-action"
            data-staff-action="enable"
            data-user-id="${escapeAttribute(
              staff.user_id
            )}"
          >
            Enable
          </button>
        `;

  } else {

    actionHtml =
      `
        <span class="owner-label">
          Owner
        </span>
      `;

  }


  if (isCurrentOwner) {

    actionHtml =
      `
        <span class="owner-label">
          Current Owner
        </span>
      `;

  }


  tr.innerHTML = `

    <td>

      <div class="product-table-info">

        <strong>
          ${escapeHtml(
            staff.full_name ||
            "Unnamed"
          )}
        </strong>

        <span>
          ${escapeHtml(
            staff.email ||
            "-"
          )}
        </span>

      </div>

    </td>


    <td>

      <span class="status-badge status-active">
        ${escapeHtml(
          staff.role || "staff"
        )}
      </span>

    </td>


    <td>
      ${status}
    </td>


    <td>
      ${formatDateTime(
        staff.last_login_at
      )}
    </td>


    <td>
      ${formatDateTime(
        staff.created_at
      )}
    </td>


    <td>

      <div class="product-actions">

        ${actionHtml}

      </div>

    </td>

  `;


  return tr;

}


/* =========================================================
   STAFF TABLE ACTION
========================================================= */

function handleStaffTableClick(
  event
) {

  const button =
    event.target.closest(
      "[data-staff-action]"
    );


  if (!button) {
    return;
  }


  const action =
    button.dataset.staffAction;


  const userId =
    button.dataset.userId;


  const staff =
    staffProfiles.find(
      item =>
        String(item.user_id) ===
        String(userId)
    );


  if (!staff) {

    showToast(
      "Staff member could not be found.",
      "error"
    );

    return;

  }


  if (
    staff.role === "owner"
  ) {

    showToast(
      "The owner account cannot be disabled.",
      "error"
    );

    return;

  }


  if (
    action === "disable"
  ) {

    askStaffStatusAction(
      staff,
      false
    );

    return;

  }


  if (
    action === "enable"
  ) {

    askStaffStatusAction(
      staff,
      true
    );

  }

}


/* =========================================================
   STAFF CONFIRM
========================================================= */

function askStaffStatusAction(
  staff,
  newStatus
) {

  currentConfirmAction = {

    type:
      "staff_status",

    userId:
      staff.user_id,

    newStatus:
      newStatus

  };


  if (confirmTitle) {

    confirmTitle.textContent =
      newStatus
        ? "Enable Staff Account"
        : "Disable Staff Account";

  }


  if (confirmText) {

    confirmText.textContent =
      newStatus

        ? `"${staff.full_name}" will be able to log in again.`

        : `"${staff.full_name}" will no longer be able to use the admin system.`;

  }


  if (confirmActionButton) {

    confirmActionButton.textContent =
      newStatus
        ? "Enable Staff"
        : "Disable Staff";


    if (newStatus) {

      confirmActionButton.classList.remove(
        "danger-btn"
      );

    } else {

      confirmActionButton.classList.add(
        "danger-btn"
      );

    }

  }


  openModal(confirmModal);

}


/* =========================================================
   CREATE STAFF MODAL
========================================================= */

function openCreateStaffModal() {

  const existing =
    document.getElementById(
      "createStaffModal"
    );


  if (existing) {

    openModal(existing);

    return;

  }


  const modal =
    document.createElement("div");


  modal.id =
    "createStaffModal";


  modal.className =
    "admin-modal";


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.innerHTML = `

    <div
      class="admin-modal-overlay"
      data-close-staff-modal
    ></div>


    <div
      class="admin-modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="createStaffTitle"
    >

      <div class="modal-header">

        <div>

          <h2 id="createStaffTitle">
            Add Staff Account
          </h2>

          <p>
            Create a separate login for a staff member.
          </p>

        </div>

        <button
          type="button"
          class="modal-close"
          id="closeCreateStaffModal"
        >
          ×
        </button>

      </div>


      <form
        id="createStaffForm"
        class="admin-form"
      >

        <div class="form-group">

          <label for="staffFullName">
            Full Name
          </label>

          <input
            type="text"
            id="staffFullName"
            autocomplete="name"
            required
            maxlength="100"
            placeholder="Staff member name"
          >

        </div>


        <div class="form-group">

          <label for="staffEmail">
            Email
          </label>

          <input
            type="email"
            id="staffEmail"
            autocomplete="email"
            required
            placeholder="staff@gmail.com"
          >

        </div>


        <div class="form-group">

          <label for="staffPassword">
            Password
          </label>

          <input
            type="password"
            id="staffPassword"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="Minimum 8 characters"
          >

        </div>


        <div class="form-group">

          <label for="staffPasswordConfirm">
            Confirm Password
          </label>

          <input
            type="password"
            id="staffPasswordConfirm"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="Repeat password"
          >

        </div>


        <div
          id="createStaffMessage"
          class="form-message"
        ></div>


        <div class="modal-actions">

          <button
            type="button"
            class="secondary-btn"
            id="cancelCreateStaff"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="primary-btn"
            id="createStaffSubmit"
          >
            Create Staff
          </button>

        </div>

      </form>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  setupCreateStaffModalEvents();


  openModal(modal);

}


/* =========================================================
   CREATE STAFF MODAL EVENTS
========================================================= */

function setupCreateStaffModalEvents() {

  const modal =
    document.getElementById(
      "createStaffModal"
    );


  const form =
    document.getElementById(
      "createStaffForm"
    );


  const closeButton =
    document.getElementById(
      "closeCreateStaffModal"
    );


  const cancelButton =
    document.getElementById(
      "cancelCreateStaff"
    );


  const overlay =
    modal?.querySelector(
      "[data-close-staff-modal]"
    );


  closeButton?.addEventListener(
    "click",
    () => closeModal(modal)
  );


  cancelButton?.addEventListener(
    "click",
    () => closeModal(modal)
  );


  overlay?.addEventListener(
    "click",
    () => closeModal(modal)
  );


  form?.addEventListener(
    "submit",
    handleCreateStaff
  );

}


/* =========================================================
   CREATE STAFF
========================================================= */

async function handleCreateStaff(
  event
) {

  event.preventDefault();


  const name =
    document.getElementById(
      "staffFullName"
    )?.value.trim() || "";


  const email =
    document.getElementById(
      "staffEmail"
    )?.value.trim().toLowerCase() || "";


  const password =
    document.getElementById(
      "staffPassword"
    )?.value || "";


  const confirmPassword =
    document.getElementById(
      "staffPasswordConfirm"
    )?.value || "";


  const message =
    document.getElementById(
      "createStaffMessage"
    );


  const button =
    document.getElementById(
      "createStaffSubmit"
    );


  if (!name) {

    showDynamicMessage(
      message,
      "Please enter the staff member's name.",
      "error"
    );

    return;

  }


  if (!email) {

    showDynamicMessage(
      message,
      "Please enter an email address.",
      "error"
    );

    return;

  }


  if (password.length < 8) {

    showDynamicMessage(
      message,
      "Password must be at least 8 characters.",
      "error"
    );

    return;

  }


  if (
    password !==
    confirmPassword
  ) {

    showDynamicMessage(
      message,
      "Passwords do not match.",
      "error"
    );

    return;

  }


  setButtonLoading(
    button,
    null,
    true,
    "Creating..."
  );


  clearDynamicMessage(
    message
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "create-staff-user",
        {
          body: {
            name,
            email,
            password
          }
        }
      );


    if (error) {

      let detail =
        error.message ||
        "Could not create staff account.";


      if (error.context) {

        try {

          const responseBody =
            await error.context.json();


          detail =
            responseBody?.message ||
            responseBody?.error ||
            detail;

        } catch {

          /* Ignore response parsing errors. */

        }

      }


      throw new Error(
        detail
      );

    }


    if (
      !data?.success
    ) {

      throw new Error(
        data?.message ||
        "Staff account could not be created."
      );

    }


    closeModal(
      document.getElementById(
        "createStaffModal"
      )
    );


    showToast(
      "Staff account created successfully.",
      "success"
    );


    await loadStaff();

    await loadAuditLogs();


  } catch (error) {

    console.error(
      "Create staff error:",
      error
    );


    showDynamicMessage(
      message,
      getFriendlyError(error),
      "error"
    );

  } finally {

    setButtonLoading(
      button,
      null,
      false,
      "Create Staff"
    );

  }

}


/* =========================================================
   EXECUTE CONFIRM ACTION
========================================================= */

const originalExecuteConfirmAction =
  executeConfirmAction;


/*
 * Replace confirm action dispatcher so both
 * products and staff use the same modal.
 */

executeConfirmAction =
  async function () {

    if (!currentConfirmAction) {
      return;
    }


    if (
      currentConfirmAction.type ===
      "staff_status"
    ) {

      await executeStaffStatusAction();

      return;

    }


    await executeProductConfirmAction();

  };


/* =========================================================
   PRODUCT CONFIRM ACTION
========================================================= */

async function executeProductConfirmAction() {

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

    const product =
      products.find(
        item =>
          String(item.id) ===
          String(productId)
      );


    const isActive =
      action !== "hide";


    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .update({

          is_active:
            isActive,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          productId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        "Product status could not be changed."
      );

    }


    await writeAuditLog({

      action:
        action === "hide"
          ? "PRODUCT_HIDDEN"
          : "PRODUCT_REACTIVATED",

      entityType:
        "product",

      entityId:
        String(productId),

      description:
        action === "hide"
          ? `Hidden product "${product?.name || ""}".`
          : `Reactivated product "${product?.name || ""}".`,

      oldData:
        product || null,

      newData:
        data

    });


    closeModal(
      confirmModal
    );


    showToast(
      action === "hide"
        ? "Product hidden successfully."
        : "Product reactivated successfully.",
      "success"
    );


    currentConfirmAction =
      null;


    await loadProducts(true);

    await loadAuditLogs();


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
   STAFF STATUS ACTION
========================================================= */

async function executeStaffStatusAction() {

  const {
    userId,
    newStatus
  } =
    currentConfirmAction;


  setButtonLoading(
    confirmActionButton,
    null,
    true,
    newStatus
      ? "Enabling..."
      : "Disabling..."
  );


  try {

    const staff =
      staffProfiles.find(
        item =>
          String(item.user_id) ===
          String(userId)
      );


    if (!staff) {

      throw new Error(
        "Staff member could not be found."
      );

    }


    if (
      staff.role === "owner"
    ) {

      throw new Error(
        "The owner account cannot be disabled."
      );

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("staff_profiles")
        .update({

          is_active:
            newStatus

        })
        .eq(
          "user_id",
          userId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        "Staff account status could not be changed."
      );

    }


    await writeAuditLog({

      action:
        newStatus
          ? "STAFF_ENABLED"
          : "STAFF_DISABLED",

      entityType:
        "staff_profile",

      entityId:
        String(userId),

      description:
        newStatus
          ? `Enabled staff account for "${staff.full_name}".`
          : `Disabled staff account for "${staff.full_name}".`,

      oldData:
        staff,

      newData:
        data

    });


    closeModal(
      confirmModal
    );


    currentConfirmAction =
      null;


    showToast(
      newStatus
        ? "Staff account enabled."
        : "Staff account disabled.",
      "success"
    );


    await loadStaff();

    await loadAuditLogs();


  } catch (error) {

    console.error(
      "Staff status error:",
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
   AUDIT LOGS
========================================================= */

async function loadAuditLogs() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("audit_logs")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(200);


    if (error) {
      throw error;
    }


    auditLogs =
      Array.isArray(data)
        ? data
        : [];


    renderAuditLogs();


  } catch (error) {

    console.error(
      "Load audit logs error:",
      error
    );


    auditLogs = [];

    renderAuditLogs();


    showToast(
      "Could not load activity log: " +
      getFriendlyError(error),
      "error"
    );

  }

}


/* =========================================================
   RENDER AUDIT LOGS
========================================================= */

function renderAuditLogs() {

  const tbody =
    document.getElementById(
      "auditTableBody"
    );


  if (!tbody) {
    return;
  }


  const search =
    (
      document.getElementById(
        "auditSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    auditLogs.filter(
      log => {

        if (!search) {
          return true;
        }


        const combined = [

          log.user_name,

          log.user_email,

          log.user_role,

          log.action,

          log.entity_type,

          log.entity_id,

          log.description

        ]
          .map(
            value =>
              String(
                value || ""
              )
                .toLowerCase()
          )
          .join(" ");


        return combined.includes(
          search
        );

      }
    );


  tbody.innerHTML = "";


  const empty =
    document.getElementById(
      "auditEmptyTable"
    );


  if (!filtered.length) {

    empty?.classList.remove(
      "hidden"
    );

    return;

  }


  empty?.classList.add(
    "hidden"
  );


  filtered.forEach(
    log => {

      const tr =
        document.createElement("tr");


      tr.innerHTML = `

        <td>
          ${formatDateTime(
            log.created_at
          )}
        </td>


        <td>

          <div class="product-table-info">

            <strong>
              ${escapeHtml(
                log.user_name ||
                "Unknown"
              )}
            </strong>

            <span>
              ${escapeHtml(
                log.user_email ||
                "-"
              )}
            </span>

          </div>

        </td>


        <td>
          ${escapeHtml(
            log.user_role ||
            "-"
          )}
        </td>


        <td>

          <span class="status-badge status-active">
            ${escapeHtml(
              log.action ||
              "-"
            )}
          </span>

        </td>


        <td>
          ${escapeHtml(
            log.entity_type ||
            "-"
          )}
        </td>


        <td>
          ${escapeHtml(
            log.description ||
            "-"
          )}
        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );

}


/* =========================================================
   WRITE AUDIT LOG
========================================================= */

async function writeAuditLog({
  action,
  entityType = null,
  entityId = null,
  description = null,
  oldData = null,
  newData = null
}) {

  if (!currentUser) {
    return false;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("audit_logs")
        .insert({

          user_id:
            currentUser.id,

          user_email:
            currentUser.email ||
            currentOwnerProfile?.email ||
            null,

          user_name:
            currentOwnerProfile?.full_name ||
            "KASHI BHAI Owner",

          user_role:
            currentOwnerProfile?.role ||
            "owner",

          action:
            action,

          entity_type:
            entityType,

          entity_id:
            entityId,

          description:
            description,

          old_data:
            oldData,

          new_data:
            newData

        });


    if (error) {

      console.error(
        "Audit insert error:",
        error
      );

      return false;

    }


    return true;

  } catch (error) {

    console.error(
      "Audit insert exception:",
      error
    );

    return false;

  }

}


/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {

  if (!modal) {
    return;
  }


  modal.style.display =
    "flex";

  modal.style.visibility =
    "visible";

  modal.style.opacity =
    "1";

  modal.style.pointerEvents =
    "auto";


  modal.classList.add(
    "open"
  );


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


  modal.classList.remove(
    "open"
  );


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


  if (
    !productModal?.classList.contains(
      "open"
    ) &&
    !confirmModal?.classList.contains(
      "open"
    ) &&
    !document.getElementById(
      "createStaffModal"
    )?.classList.contains(
      "open"
    )
  ) {

    document.body.style.overflow =
      "";

  }

}


function forceCloseModal(modal) {

  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


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
   LOGIN MESSAGES
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


/* =========================================================
   PRODUCT FORM MESSAGES
========================================================= */

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


/* =========================================================
   DYNAMIC MESSAGE
========================================================= */

function showDynamicMessage(
  element,
  message,
  type = "info"
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    `form-message ${type}`;

}


function clearDynamicMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.className =
    "form-message";

}


/* =========================================================
   ADMIN STATUS
========================================================= */

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


  clearTimeout(
    toastTimer
  );


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

    return;

  }


  if (
    !button.dataset.originalText
  ) {

    button.dataset.originalText =
      button.textContent.trim();

  }


  button.textContent =
    loading
      ? text
      : button.dataset.originalText;

}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(
  value
) {

  const number =
    Number(
      value || 0
    );


  return (
    "Rs. " +
    number.toLocaleString(
      "en-PK",
      {
        maximumFractionDigits:
          2
      }
    )
  );

}


/* =========================================================
   DATE / TIME
========================================================= */

function formatDateTime(
  value
) {

  if (!value) {
    return "Never";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleString(
    "en-PK",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short"
    }
  );

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
  filename
) {

  const parts =
    String(
      filename || ""
    )
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
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value
) {

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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   ERROR HANDLING
========================================================= */

function getFriendlyError(
  error
) {

  if (!error) {

    return (
      "Something went wrong."
    );

  }


  const message =
    error.message ||
    error.error_description ||
    String(error);


  const lower =
    message.toLowerCase();


  console.error(
    "Supabase error:",
    error
  );


  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {

    return (
      "Incorrect email or password."
    );

  }


  if (
    lower.includes(
      "email not confirmed"
    )
  ) {

    return (
      "Please confirm your email before logging in."
    );

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
      "Permission denied. Admin RLS policy is blocking this action."
    );

  }


  if (
    lower.includes(
      "duplicate key"
    )
  ) {

    return (
      "This record already exists."
    );

  }


  if (
    lower.includes(
      "bucket"
    ) ||
    lower.includes(
      "storage"
    )
  ) {

    return (
      "Storage error. Check the product-images bucket and storage policies."
    );

  }


  if (
    lower.includes(
      "permission denied"
    )
  ) {

    return (
      "Permission denied. Please check the admin permissions."
    );

  }


  if (
    lower.includes(
      "owner access required"
    )
  ) {

    return (
      "Only the store owner can perform this action."
    );

  }


  if (
    lower.includes(
      "staff account with this email already exists"
    )
  ) {

    return (
      "A staff account with this email already exists."
    );

  }


  return message;

}
