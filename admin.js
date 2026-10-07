"use strict";

/* =========================================================
   KASHI BHAI — ADMIN PANEL
   Supabase Product Management
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL = "https://lytutzarjtuijwijlhmt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mkYT6acCz3YnmLFZjGM2UQ_x9tUFtGY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allProducts = [];

let filteredProducts = [];

let editingProductId = null;

let pendingAction = null;

let currentImageUrl = "";

let toastTimer = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const loginSection =
  document.getElementById("loginSection");

const adminSection =
  document.getElementById("adminSection");

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginError =
  document.getElementById("loginError");

const logoutButton =
  document.getElementById("logoutButton");


/* Dashboard */

const totalProducts =
  document.getElementById("totalProducts");

const activeProducts =
  document.getElementById("activeProducts");

const hiddenProducts =
  document.getElementById("hiddenProducts");

const outOfStockProducts =
  document.getElementById("outOfStockProducts");


/* Filters */

const productSearch =
  document.getElementById("productSearch");

const statusFilter =
  document.getElementById("statusFilter");

const categoryFilter =
  document.getElementById("categoryFilter");


/* Products */

const productsTableBody =
  document.getElementById("productsTableBody");

const emptyProducts =
  document.getElementById("emptyProducts");


/* Product modal */

const productModal =
  document.getElementById("productModal");

const modalTitle =
  document.getElementById("modalTitle");

const modalSubtitle =
  document.getElementById("modalSubtitle");

const closeModalButton =
  document.getElementById("closeModalButton");

const cancelProductButton =
  document.getElementById("cancelProductButton");

const addProductButton =
  document.getElementById("addProductButton");

const productForm =
  document.getElementById("productForm");

const productId =
  document.getElementById("productId");

const productCode =
  document.getElementById("productCode");

const productName =
  document.getElementById("productName");

const productCategory =
  document.getElementById("productCategory");

const productStock =
  document.getElementById("productStock");

const productPrice =
  document.getElementById("productPrice");

const productOldPrice =
  document.getElementById("productOldPrice");

const productDescription =
  document.getElementById("productDescription");

const productActive =
  document.getElementById("productActive");

const productImage =
  document.getElementById("productImage");

const imagePreview =
  document.getElementById("imagePreview");

const imagePlaceholder =
  document.getElementById("imagePlaceholder");

const imageUploadStatus =
  document.getElementById("imageUploadStatus");

const saveProductButton =
  document.getElementById("saveProductButton");

const formError =
  document.getElementById("formError");


/* Confirmation */

const confirmModal =
  document.getElementById("confirmModal");

const confirmTitle =
  document.getElementById("confirmTitle");

const confirmMessage =
  document.getElementById("confirmMessage");

const cancelConfirmButton =
  document.getElementById("cancelConfirmButton");

const confirmActionButton =
  document.getElementById("confirmActionButton");


/* Toast */

const toast =
  document.getElementById("toast");

const toastMessage =
  document.getElementById("toastMessage");


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);


async function initializeAdmin() {

  if (!window.supabase) {

    showLoginError(
      "Supabase library could not be loaded."
    );

    return;
  }


  setupEventListeners();

  await checkExistingSession();

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  /* Login */

  loginForm.addEventListener(
    "submit",
    handleLogin
  );


  /* Logout */

  logoutButton.addEventListener(
    "click",
    handleLogout
  );


  /* Add */

  addProductButton.addEventListener(
    "click",
    openAddProductModal
  );


  /* Product modal */

  closeModalButton.addEventListener(
    "click",
    closeProductModal
  );

  cancelProductButton.addEventListener(
    "click",
    closeProductModal
  );


  /* Product form */

  productForm.addEventListener(
    "submit",
    handleProductSubmit
  );


  /* Image preview */

  productImage.addEventListener(
    "change",
    handleImagePreview
  );


  /* Filters */

  productSearch.addEventListener(
    "input",
    applyFilters
  );

  statusFilter.addEventListener(
    "change",
    applyFilters
  );

  categoryFilter.addEventListener(
    "change",
    applyFilters
  );


  /* Confirmation */

  cancelConfirmButton.addEventListener(
    "click",
    closeConfirmModal
  );

  confirmActionButton.addEventListener(
    "click",
    executePendingAction
  );


  /* Close modal by clicking overlay */

  productModal
    .querySelector(".modal-overlay")
    .addEventListener(
      "click",
      closeProductModal
    );

  confirmModal
    .querySelector(".modal-overlay")
    .addEventListener(
      "click",
      closeConfirmModal
    );


  /* Escape key */

  document.addEventListener(
    "keydown",
    function (event) {

      if (event.key !== "Escape") {
        return;
      }

      closeProductModal();

      closeConfirmModal();

    }
  );

}


/* =========================================================
   AUTH — CHECK EXISTING SESSION
   ========================================================= */

async function checkExistingSession() {

  try {

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


    const session = data.session;


    if (!session) {

      showLoginScreen();

      return;
    }


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      showLoginScreen();

      showLoginError(
        "This account does not have admin access."
      );

      return;
    }


    showAdminScreen();

    await loadProducts();


  } catch (error) {

    console.error(
      "Session check failed:",
      error
    );

    showLoginScreen();

  }

}


/* =========================================================
   AUTH — LOGIN
   ========================================================= */

async function handleLogin(event) {

  event.preventDefault();


  const email =
    loginEmail.value.trim();

  const password =
    loginPassword.value;


  if (!email || !password) {

    showLoginError(
      "Please enter email and password."
    );

    return;
  }


  setLoginLoading(true);

  hideLoginError();


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      throw error;
    }


    if (!data.session) {

      throw new Error(
        "Login session could not be created."
      );

    }


    const isAdmin =
      await verifyAdmin();


    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      throw new Error(
        "This account is not authorized as an admin."
      );

    }


    loginForm.reset();

    showAdminScreen();

    await loadProducts();

    showToast(
      "Welcome to KASHI BHAI Admin Panel."
    );


  } catch (error) {

    console.error(
      "Login failed:",
      error
    );

    showLoginError(
      getFriendlyError(error)
    );

  } finally {

    setLoginLoading(false);

  }

}


/* =========================================================
   AUTH — VERIFY ADMIN
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
      "Admin verification failed:",
      error
    );

    return false;

  }

}


/* =========================================================
   AUTH — LOGOUT
   ========================================================= */

async function handleLogout() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  allProducts = [];

  filteredProducts = [];

  showLoginScreen();

  showToast(
    "You have been logged out."
  );

}


/* =========================================================
   AUTH UI
   ========================================================= */

function showLoginScreen() {

  loginSection.classList.remove(
    "hidden"
  );

  adminSection.classList.add(
    "hidden"
  );

}


function showAdminScreen() {

  loginSection.classList.add(
    "hidden"
  );

  adminSection.classList.remove(
    "hidden"
  );

}


function setLoginLoading(loading) {

  loginButton.disabled =
    loading;

  loginButton.textContent =
    loading
      ? "Signing in..."
      : "Login to Admin Panel";

}


function showLoginError(message) {

  loginError.textContent =
    message;

  loginError.style.display =
    "block";

}


function hideLoginError() {

  loginError.textContent =
    "";

  loginError.style.display =
    "none";

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  productsTableBody.innerHTML = `
    <tr>
      <td colspan="9" class="loading-cell">
        Loading products...
      </td>
    </tr>
  `;

  emptyProducts.classList.add(
    "hidden"
  );


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
          "id",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    allProducts =
      Array.isArray(data)
        ? data
        : [];


    updateDashboardStats();

    populateCategoryFilter();

    applyFilters();


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    productsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="loading-cell">
          Failed to load products.
          <br>
          <small>${escapeHtml(
            getFriendlyError(error)
          )}</small>
        </td>
      </tr>
    `;


    showToast(
      "Could not load products.",
      "error"
    );

  }

}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function updateDashboardStats() {

  const total =
    allProducts.length;


  const active =
    allProducts.filter(
      product =>
        product.is_active === true
    ).length;


  const hidden =
    allProducts.filter(
      product =>
        product.is_active !== true
    ).length;


  const outOfStock =
    allProducts.filter(
      product =>
        Number(product.stock) <= 0
    ).length;


  totalProducts.textContent =
    total;


  activeProducts.textContent =
    active;


  hiddenProducts.textContent =
    hidden;


  outOfStockProducts.textContent =
    outOfStock;

}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateCategoryFilter() {

  const categories =
    [
      ...new Set(
        allProducts
          .map(product =>
            String(
              product.category || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ]
    .sort(
      (a, b) =>
        a.localeCompare(b)
    );


  const currentValue =
    categoryFilter.value;


  categoryFilter.innerHTML = `
    <option value="all">
      All Categories
    </option>
  `;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        category;

      option.textContent =
        category;

      categoryFilter.appendChild(
        option
      );

    }
  );


  if (
    categories.includes(
      currentValue
    )
  ) {

    categoryFilter.value =
      currentValue;

  }

}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function applyFilters() {

  const search =
    productSearch.value
      .trim()
      .toLowerCase();


  const status =
    statusFilter.value;


  const category =
    categoryFilter.value;


  filteredProducts =
    allProducts.filter(
      product => {

        const name =
          String(
            product.name || ""
          ).toLowerCase();


        const code =
          String(
            product.product_code || ""
          ).toLowerCase();


        const productCategory =
          String(
            product.category || ""
          );


        const matchesSearch =
          !search ||
          name.includes(search) ||
          code.includes(search);


        const matchesStatus =
          status === "all" ||
          (
            status === "active" &&
            product.is_active === true
          ) ||
          (
            status === "hidden" &&
            product.is_active !== true
          );


        const matchesCategory =
          category === "all" ||
          productCategory === category;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory
        );

      }
    );


  renderProducts();

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  if (
    filteredProducts.length === 0
  ) {

    productsTableBody.innerHTML =
      "";

    emptyProducts.classList.remove(
      "hidden"
    );

    return;

  }


  emptyProducts.classList.add(
    "hidden"
  );


  productsTableBody.innerHTML =
    filteredProducts
      .map(
        product =>
          createProductRow(product)
      )
      .join("");


  attachProductRowEvents();

}


/* =========================================================
   CREATE PRODUCT ROW
   ========================================================= */

function createProductRow(product) {

  const imageHtml =
    product.image_url
      ? `
        <img
          src="${escapeAttribute(
            product.image_url
          )}"
          alt="${escapeAttribute(
            product.name
          )}"
          class="product-table-image"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        >
        <div
          class="product-image-placeholder"
          style="display:none;"
        >
          🖼️
        </div>
      `
      : `
        <div class="product-image-placeholder">
          🖼️
        </div>
      `;


  const statusHtml =
    product.is_active
      ? `
        <span class="status-badge status-active">
          Active
        </span>
      `
      : `
        <span class="status-badge status-hidden">
          Hidden
        </span>
      `;


  const stock =
    Number(product.stock || 0);


  let stockClass =
    "stock-good";


  if (stock <= 0) {

    stockClass =
      "stock-out";

  } else if (stock <= 5) {

    stockClass =
      "stock-low";

  }


  const stockHtml = `
    <span class="stock-badge ${stockClass}">
      ${formatNumber(stock)}
    </span>
  `;


  const oldPriceHtml =
    product.old_price !== null &&
    product.old_price !== undefined &&
    product.old_price !== ""
      ? `Rs. ${formatNumber(
          product.old_price
        )}`
      : "—";


  const actionHtml =
    product.is_active
      ? `
        <button
          type="button"
          class="action-btn"
          data-action="edit"
          data-id="${product.id}"
          title="Edit product"
        >
          ✏️
        </button>

        <button
          type="button"
          class="action-btn danger"
          data-action="hide"
          data-id="${product.id}"
          title="Hide product"
        >
          🗑️
        </button>
      `
      : `
        <button
          type="button"
          class="action-btn"
          data-action="edit"
          data-id="${product.id}"
          title="Edit product"
        >
          ✏️
        </button>

        <button
          type="button"
          class="action-btn success"
          data-action="reactivate"
          data-id="${product.id}"
          title="Reactivate product"
        >
          ♻️
        </button>
      `;


  return `
    <tr>

      <td>
        ${imageHtml}
      </td>


      <td class="product-name-cell">

        <div class="product-name">
          ${escapeHtml(
            product.name || "Unnamed Product"
          )}
        </div>

        <div class="product-description-small">
          ${escapeHtml(
            product.description || ""
          )}
        </div>

      </td>


      <td>
        ${escapeHtml(
          product.product_code || "—"
        )}
      </td>


      <td>
        <strong>
          Rs. ${formatNumber(
            product.price
          )}
        </strong>
      </td>


      <td>
        ${oldPriceHtml}
      </td>


      <td>
        ${stockHtml}
      </td>


      <td>
        ${escapeHtml(
          product.category || "—"
        )}
      </td>


      <td>
        ${statusHtml}
      </td>


      <td>

        <div class="action-buttons">

          ${actionHtml}

        </div>

      </td>

    </tr>
  `;

}


/* =========================================================
   ROW BUTTON EVENTS
   ========================================================= */

function attachProductRowEvents() {

  const buttons =
    productsTableBody.querySelectorAll(
      "[data-action]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        function () {

          const action =
            this.dataset.action;

          const id =
            this.dataset.id;


          if (
            action === "edit"
          ) {

            openEditProductModal(
              id
            );

          }


          if (
            action === "hide"
          ) {

            openHideConfirmation(
              id
            );

          }


          if (
            action === "reactivate"
          ) {

            openReactivateConfirmation(
              id
            );

          }

        }
      );

    }
  );

}


/* =========================================================
   ADD PRODUCT MODAL
   ========================================================= */

function openAddProductModal() {

  editingProductId =
    null;

  currentImageUrl =
    "";


  productForm.reset();


  productId.value =
    "";


  productActive.checked =
    true;


  imagePreview.src =
    "";

  imagePreview.classList.add(
    "hidden"
  );

  imagePlaceholder.classList.remove(
    "hidden"
  );


  imageUploadStatus.textContent =
    "";


  formError.textContent =
    "";

  formError.classList.add(
    "hidden"
  );


  modalTitle.textContent =
    "Add New Product";


  modalSubtitle.textContent =
    "Add a new product to your store.";


  saveProductButton.textContent =
    "Save Product";


  productModal.classList.remove(
    "hidden"
  );


  setTimeout(
    () => productCode.focus(),
    100
  );

}


/* =========================================================
   EDIT PRODUCT MODAL
   ========================================================= */

function openEditProductModal(id) {

  const product =
    findProductById(id);


  if (!product) {

    showToast(
      "Product not found.",
      "error"
    );

    return;
  }


  editingProductId =
    product.id;


  currentImageUrl =
    product.image_url || "";


  productId.value =
    product.id;


  productCode.value =
    product.product_code || "";


  productName.value =
    product.name || "";


  productCategory.value =
    product.category || "";


  productStock.value =
    product.stock ?? 0;


  productPrice.value =
    product.price ?? "";


  productOldPrice.value =
    product.old_price ?? "";


  productDescription.value =
    product.description || "";


  productActive.checked =
    product.is_active === true;


  productImage.value =
    "";


  if (currentImageUrl) {

    imagePreview.src =
      currentImageUrl;

    imagePreview.classList.remove(
      "hidden"
    );

    imagePlaceholder.classList.add(
      "hidden"
    );

  } else {

    imagePreview.src =
      "";

    imagePreview.classList.add(
      "hidden"
    );

    imagePlaceholder.classList.remove(
      "hidden"
    );

  }


  imageUploadStatus.textContent =
    "";


  formError.textContent =
    "";

  formError.classList.add(
    "hidden"
  );


  modalTitle.textContent =
    "Edit Product";


  modalSubtitle.textContent =
    "Update product information.";


  saveProductButton.textContent =
    "Update Product";


  productModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CLOSE PRODUCT MODAL
   ========================================================= */

function closeProductModal() {

  productModal.classList.add(
    "hidden"
  );

  editingProductId =
    null;

  currentImageUrl =
    "";

}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function handleImagePreview() {

  const file =
    productImage.files[0];


  if (!file) {

    imageUploadStatus.textContent =
      "";

    return;

  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    productImage.value =
      "";

    showFormError(
      "Please select a JPG, PNG or WEBP image."
    );

    return;

  }


  const maxSize =
    5 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    productImage.value =
      "";

    showFormError(
      "Image size must be 5MB or less."
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload =
    function (event) {

      imagePreview.src =
        event.target.result;

      imagePreview.classList.remove(
        "hidden"
      );

      imagePlaceholder.classList.add(
        "hidden"
      );

    };


  reader.readAsDataURL(file);


  imageUploadStatus.textContent =
    "New image selected.";

  imageUploadStatus.style.color =
    "#159957";

}


/* =========================================================
   PRODUCT FORM SUBMIT
   ========================================================= */

async function handleProductSubmit(event) {

  event.preventDefault();


  hideFormError();


  const code =
    productCode.value.trim();

  const name =
    productName.value.trim();

  const category =
    productCategory.value.trim();

  const stock =
    Number(productStock.value);

  const price =
    Number(productPrice.value);

  const oldPriceValue =
    productOldPrice.value.trim();

  const oldPrice =
    oldPriceValue === ""
      ? null
      : Number(oldPriceValue);

  const description =
    productDescription.value.trim();

  const isActive =
    productActive.checked;


  /* Validation */

  if (!code) {

    showFormError(
      "Product code is required."
    );

    productCode.focus();

    return;

  }


  if (!name) {

    showFormError(
      "Product name is required."
    );

    productName.focus();

    return;

  }


  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    showFormError(
      "Please enter a valid product price."
    );

    productPrice.focus();

    return;

  }


  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {

    showFormError(
      "Stock must be a whole number 0 or greater."
    );

    productStock.focus();

    return;

  }


  if (
    oldPrice !== null &&
    (
      !Number.isFinite(oldPrice) ||
      oldPrice < 0
    )
  ) {

    showFormError(
      "Please enter a valid old price."
    );

    productOldPrice.focus();

    return;

  }


  /* Check duplicate product code */

  const duplicate =
    allProducts.find(
      product => {

        const sameCode =
          String(
            product.product_code || ""
          )
          .trim()
          .toLowerCase() ===
          code.toLowerCase();


        const differentProduct =
          String(product.id) !==
          String(editingProductId);


        return (
          sameCode &&
          differentProduct
        );

      }
    );


  if (duplicate) {

    showFormError(
      `Product code "${code}" is already in use.`
    );

    productCode.focus();

    return;

  }


  setSaveLoading(true);


  try {

    let imageUrl =
      currentImageUrl || null;


    /* Upload new image if selected */

    if (
      productImage.files &&
      productImage.files.length > 0
    ) {

      imageUploadStatus.textContent =
        "Uploading image...";

      imageUploadStatus.style.color =
        "#6d4aff";


      imageUrl =
        await uploadProductImage(
          productImage.files[0],
          code
        );


      imageUploadStatus.textContent =
        "Image uploaded successfully.";

      imageUploadStatus.style.color =
        "#159957";

    }


    const productData = {

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
        imageUrl,

      stock:
        stock,

      description:
        description || null,

      is_active:
        isActive,

      status:
        isActive
          ? "Active"
          : "Deleted",

      updated_at:
        new Date().toISOString()

    };


    if (editingProductId) {

      await updateProduct(
        editingProductId,
        productData
      );

      showToast(
        "Product updated successfully."
      );

    } else {

      await insertProduct(
        productData
      );

      showToast(
        "Product added successfully."
      );

    }


    closeProductModal();

    await loadProducts();


  } catch (error) {

    console.error(
      "Product save error:",
      error
    );


    showFormError(
      getFriendlyError(error)
    );


  } finally {

    setSaveLoading(false);

  }

}


/* =========================================================
   INSERT PRODUCT
   ========================================================= */

async function insertProduct(
  productData
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .insert(
        productData
      )
      .select()
      .single();


  if (error) {

    throw error;

  }


  return data;

}


/* =========================================================
   UPDATE PRODUCT
   ========================================================= */

async function updateProduct(
  id,
  productData
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .update(
        productData
      )
      .eq(
        "id",
        id
      )
      .select()
      .single();


  if (error) {

    throw error;

  }


  return data;

}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadProductImage(
  file,
  productCode
) {

  const extension =
    getFileExtension(
      file.name
    );


  const safeCode =
    String(productCode)
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      );


  const timestamp =
    Date.now();


  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8);


  const filePath =
    `${safeCode}-${timestamp}-${randomPart}.${extension}`;


  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from("product-images")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType:
            file.type
        }
      );


  if (uploadError) {

    throw uploadError;

  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(
        filePath
      );


  if (
    !data ||
    !data.publicUrl
  ) {

    throw new Error(
      "Image uploaded, but public URL could not be created."
    );

  }


  return data.publicUrl;

}


/* =========================================================
   HIDE PRODUCT — CONFIRMATION
   ========================================================= */

function openHideConfirmation(id) {

  const product =
    findProductById(id);


  if (!product) {
    return;
  }


  pendingAction = {
    type: "hide",
    id: product.id
  };


  confirmTitle.textContent =
    "Hide Product?";


  confirmMessage.textContent =
    `"${product.name}" will be hidden from the website. The product record and old orders will remain safe.`;


  confirmActionButton.textContent =
    "Hide Product";


  confirmActionButton.className =
    "danger-btn";


  confirmModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   REACTIVATE PRODUCT — CONFIRMATION
   ========================================================= */

function openReactivateConfirmation(
  id
) {

  const product =
    findProductById(id);


  if (!product) {
    return;
  }


  pendingAction = {
    type: "reactivate",
    id: product.id
  };


  confirmTitle.textContent =
    "Reactivate Product?";


  confirmMessage.textContent =
    `"${product.name}" will become visible on the website again.`;


  confirmActionButton.textContent =
    "Reactivate";


  confirmActionButton.className =
    "primary-btn";


  confirmModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   EXECUTE CONFIRMED ACTION
   ========================================================= */

async function executePendingAction() {

  if (!pendingAction) {

    closeConfirmModal();

    return;

  }


  const action =
    pendingAction.type;

  const id =
    pendingAction.id;


  confirmActionButton.disabled =
    true;


  confirmActionButton.textContent =
    "Please wait...";


  try {

    if (
      action === "hide"
    ) {

      await setProductVisibility(
        id,
        false
      );

      showToast(
        "Product hidden from website."
      );

    }


    if (
      action === "reactivate"
    ) {

      await setProductVisibility(
        id,
        true
      );

      showToast(
        "Product reactivated successfully."
      );

    }


    closeConfirmModal();

    await loadProducts();


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

    confirmActionButton.disabled =
      false;

    pendingAction =
      null;

  }

}


/* =========================================================
   CHANGE PRODUCT VISIBILITY
   ========================================================= */

async function setProductVisibility(
  id,
  isActive
) {

  const {
    error
  } =
    await supabaseClient
      .from("products")
      .update({

        is_active:
          isActive,

        status:
          isActive
            ? "Active"
            : "Deleted",

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        id
      );


  if (error) {

    throw error;

  }

}


/* =========================================================
   CLOSE CONFIRM MODAL
   ========================================================= */

function closeConfirmModal() {

  confirmModal.classList.add(
    "hidden"
  );

  pendingAction =
    null;

}


/* =========================================================
   SAVE BUTTON LOADING
   ========================================================= */

function setSaveLoading(
  loading
) {

  saveProductButton.disabled =
    loading;


  if (loading) {

    saveProductButton.textContent =
      editingProductId
        ? "Updating..."
        : "Saving...";

  } else {

    saveProductButton.textContent =
      editingProductId
        ? "Update Product"
        : "Save Product";

  }

}


/* =========================================================
   FORM ERRORS
   ========================================================= */

function showFormError(
  message
) {

  formError.textContent =
    message;

  formError.classList.remove(
    "hidden"
  );

}


function hideFormError() {

  formError.textContent =
    "";

  formError.classList.add(
    "hidden"
  );

}


/* =========================================================
   FIND PRODUCT
   ========================================================= */

function findProductById(id) {

  return allProducts.find(
    product =>
      String(product.id) ===
      String(id)
  );

}


/* =========================================================
   FILE EXTENSION
   ========================================================= */

function getFileExtension(
  filename
) {

  const parts =
    String(filename)
      .split(".");


  if (
    parts.length < 2
  ) {

    return "jpg";

  }


  const extension =
    parts
      .pop()
      .toLowerCase();


  const allowed = [
    "jpg",
    "jpeg",
    "png",
    "webp"
  ];


  return allowed.includes(
    extension
  )
    ? extension
    : "jpg";

}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return "0";

  }


  return number.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2
    }
  );

}


/* =========================================================
   ESCAPE HTML
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


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   FRIENDLY ERROR
   ========================================================= */

function getFriendlyError(
  error
) {

  if (!error) {

    return "Something went wrong.";

  }


  const message =
    String(
      error.message || error
    );


  if (
    message.includes(
      "Invalid login credentials"
    )
  ) {

    return "Incorrect email or password.";

  }


  if (
    message.includes(
      "Email not confirmed"
    )
  ) {

    return "Please confirm your admin email first.";

  }


  if (
    message.includes(
      "row-level security"
    ) ||
    message.includes(
      "violates row-level security"
    )
  ) {

    return "Permission denied. Please make sure this account is registered as an admin.";

  }


  if (
    message.includes(
      "duplicate"
    )
  ) {

    return "This product information already exists.";

  }


  return message;

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message,
  type = "success"
) {

  clearTimeout(
    toastTimer
  );


  toastMessage.textContent =
    message;


  if (
    type === "error"
  ) {

    toast.style.background =
      "#c62828";

  } else {

    toast.style.background =
      "#22212a";

  }


  toast.classList.add(
    "show"
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3500
    );

}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    /*
      We only react to explicit sign-out here.
      Login/session checking is handled separately
      to avoid duplicate product loading.
    */

    if (
      event === "SIGNED_OUT" ||
      !session
    ) {

      showLoginScreen();

    }

  }
);
