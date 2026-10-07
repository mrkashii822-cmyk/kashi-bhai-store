/* =========================================================
   KASHI BHAI - ADMIN PANEL
   Compatible with current admin.html
   ========================================================= */

"use strict";

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://lytutzarjtuijwijlhmt.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_mkYT6acCz3YnmLFZjGM2UQ_x9tUFtGY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const STORAGE_BUCKET = "product-images";


/* =========================================================
   STATE
   ========================================================= */

let allProducts = [];
let filteredProducts = [];

let editingProductId = null;
let selectedImageFile = null;

let confirmAction = null;

let initialized = false;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

let loginScreen;
let adminApp;

let loginForm;
let loginEmail;
let loginPassword;
let loginButton;
let loginMessage;

let logoutButton;
let addProductButton;
let refreshProductsButton;

let adminSearch;
let adminStatusFilter;
let adminStatus;

let productsTableBody;
let emptyTable;

let totalProducts;
let activeProducts;
let hiddenProducts;
let outOfStockProducts;

let productModal;
let productModalTitle;
let productForm;
let productFormMessage;
let saveProductButton;

let productCode;
let productName;
let productPrice;
let productOldPrice;
let productStock;
let productCategory;
let productDescription;
let productActive;
let productImage;
let imagePreview;
let currentImageText;

let confirmModal;
let confirmTitle;
let confirmText;
let confirmActionButton;

let adminToast;


/* =========================================================
   INITIALIZE DOM
   ========================================================= */

function initializeDOM() {

  loginScreen = $("loginScreen");
  adminApp = $("adminApp");

  loginForm = $("loginForm");
  loginEmail = $("loginEmail");
  loginPassword = $("loginPassword");
  loginButton = $("loginButton");
  loginMessage = $("loginMessage");

  logoutButton = $("logoutButton");
  addProductButton = $("addProductButton");
  refreshProductsButton = $("refreshProductsButton");

  adminSearch = $("adminSearch");
  adminStatusFilter = $("adminStatusFilter");
  adminStatus = $("adminStatus");

  productsTableBody = $("productsTableBody");
  emptyTable = $("emptyTable");

  totalProducts = $("totalProducts");
  activeProducts = $("activeProducts");
  hiddenProducts = $("hiddenProducts");
  outOfStockProducts = $("outOfStockProducts");

  productModal = $("productModal");
  productModalTitle = $("productModalTitle");
  productForm = $("productForm");
  productFormMessage = $("productFormMessage");
  saveProductButton = $("saveProductButton");

  productCode = $("productCode");
  productName = $("productName");
  productPrice = $("productPrice");
  productOldPrice = $("productOldPrice");
  productStock = $("productStock");
  productCategory = $("productCategory");
  productDescription = $("productDescription");
  productActive = $("productActive");
  productImage = $("productImage");
  imagePreview = $("imagePreview");
  currentImageText = $("currentImageText");

  confirmModal = $("confirmModal");
  confirmTitle = $("confirmTitle");
  confirmText = $("confirmText");
  confirmActionButton = $("confirmActionButton");

  adminToast = $("adminToast");

  initialized = true;
}


/* =========================================================
   SAFE EVENT LISTENER
   ========================================================= */

function on(element, event, handler) {

  if (!element) {
    return;
  }

  element.addEventListener(event, handler);
}


/* =========================================================
   INITIALIZE ADMIN
   ========================================================= */

async function initializeAdmin() {

  if (!initialized) {
    initializeDOM();
  }

  setupEventListeners();

  try {

    const {
      data: {
        session
      }
    } = await supabaseClient.auth.getSession();

    if (session) {
      await handleAuthenticatedUser(session);
    } else {
      showLoginScreen();
    }

  } catch (error) {

    console.error("Admin initialization error:", error);

    showLoginScreen();

    setLoginMessage(
      "Unable to initialize admin panel. Please refresh the page.",
      "error"
    );
  }


  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log("Auth event:", event);

      if (event === "SIGNED_OUT") {

        showLoginScreen();

        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {

        if (session) {
          await handleAuthenticatedUser(session);
        } else {
          showLoginScreen();
        }
      }
    }
  );
}


/* =========================================================
   AUTHENTICATED USER
   ========================================================= */

async function handleAuthenticatedUser(session) {

  if (!session || !session.user) {

    showLoginScreen();

    return;
  }

  try {

    const isAdmin = await verifyAdmin();

    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      showLoginScreen();

      setLoginMessage(
        "Access denied. This account is not authorized as an admin.",
        "error"
      );

      return;
    }

    showAdminApp();

    await loadProducts();

  } catch (error) {

    console.error("Admin verification error:", error);

    await supabaseClient.auth.signOut();

    showLoginScreen();

    setLoginMessage(
      error.message || "Admin verification failed.",
      "error"
    );
  }
}


/* =========================================================
   VERIFY ADMIN
   ========================================================= */

async function verifyAdmin() {

  const {
    data,
    error
  } = await supabaseClient.rpc("is_admin");

  if (error) {

    console.error("is_admin error:", error);

    throw new Error(
      "Could not verify admin access. Check Supabase configuration."
    );
  }

  return data === true;
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

  event.preventDefault();

  if (!loginEmail || !loginPassword || !loginButton) {
    return;
  }

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {

    setLoginMessage(
      "Please enter your email and password.",
      "error"
    );

    return;
  }

  setLoginLoading(true);

  setLoginMessage("", "");

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data || !data.session) {
      throw new Error("Login failed. No session was created.");
    }

    const isAdmin = await verifyAdmin();

    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      throw new Error(
        "Login successful, but this account is not an authorized admin."
      );
    }

    setLoginMessage(
      "Login successful. Loading admin panel...",
      "success"
    );

    showAdminApp();

    await loadProducts();

  } catch (error) {

    console.error("Login error:", error);

    setLoginMessage(
      getErrorMessage(error),
      "error"
    );

  } finally {

    setLoginLoading(false);
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function handleLogout() {

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    showLoginScreen();

  } catch (error) {

    console.error("Logout error:", error);

    showToast(
      "Logout failed. Please try again.",
      "error"
    );
  }
}


/* =========================================================
   LOGIN / ADMIN SCREEN
   ========================================================= */

function showLoginScreen() {

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
    loginScreen.style.display = "";
  }

  if (adminApp) {
    adminApp.classList.add("hidden");
    adminApp.style.display = "none";
  }

  if (loginEmail) {
    loginEmail.focus();
  }
}


function showAdminApp() {

  if (loginScreen) {
    loginScreen.classList.add("hidden");
    loginScreen.style.display = "none";
  }

  if (adminApp) {
    adminApp.classList.remove("hidden");
    adminApp.style.display = "";
  }
}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  setAdminStatus("Loading products...", "loading");

  try {

    const {
      data,
      error
    } = await supabaseClient
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
      .order("id", {
        ascending: true
      });

    if (error) {
      throw error;
    }

    allProducts = Array.isArray(data)
      ? data
      : [];

    updateStats();

    applyFilters();

    setAdminStatus(
      `${allProducts.length} product${allProducts.length === 1 ? "" : "s"} loaded.`,
      "success"
    );

  } catch (error) {

    console.error("Load products error:", error);

    allProducts = [];

    updateStats();

    renderProducts();

    setAdminStatus(
      "Could not load products: " + getErrorMessage(error),
      "error"
    );
  }
}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

  const search =
    adminSearch
      ? adminSearch.value.trim().toLowerCase()
      : "";

  const status =
    adminStatusFilter
      ? adminStatusFilter.value
      : "all";


  filteredProducts = allProducts.filter(product => {

    const productNameValue =
      String(product.name || "").toLowerCase();

    const productCodeValue =
      String(product.product_code || "").toLowerCase();

    const categoryValue =
      String(product.category || "").toLowerCase();


    const matchesSearch =
      !search ||
      productNameValue.includes(search) ||
      productCodeValue.includes(search) ||
      categoryValue.includes(search);


    let matchesStatus = true;


    if (status === "active") {

      matchesStatus =
        product.is_active === true;
    }


    if (status === "hidden") {

      matchesStatus =
        product.is_active === false;
    }


    if (status === "out") {

      matchesStatus =
        Number(product.stock) <= 0;
    }


    return matchesSearch && matchesStatus;
  });


  renderProducts();
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  if (!productsTableBody) {
    return;
  }

  if (!filteredProducts.length) {

    productsTableBody.innerHTML = "";

    if (emptyTable) {
      emptyTable.classList.remove("hidden");
      emptyTable.style.display = "";
    }

    return;
  }


  if (emptyTable) {
    emptyTable.classList.add("hidden");
    emptyTable.style.display = "none";
  }


  productsTableBody.innerHTML =
    filteredProducts
      .map(product => createProductRow(product))
      .join("");
}


/* =========================================================
   PRODUCT ROW
   ========================================================= */

function createProductRow(product) {

  const id = product.id;

  const name =
    escapeHtml(product.name || "Unnamed Product");

  const code =
    escapeHtml(product.product_code || "-");

  const category =
    escapeHtml(product.category || "Uncategorized");

  const price =
    formatPrice(product.price);

  const stock =
    Number(product.stock || 0);

  const oldPrice =
    product.old_price !== null &&
    product.old_price !== undefined &&
    product.old_price !== ""
      ? formatPrice(product.old_price)
      : "-";


  const imageUrl =
    getProductImageUrl(product.image_url);


  let productVisual = "";

  if (imageUrl) {

    productVisual = `
      <img
        src="${escapeAttribute(imageUrl)}"
        alt="${escapeAttribute(product.name || "Product")}"
        class="product-table-image"
        loading="lazy"
        onerror="this.style.display='none';"
      >
    `;
  } else {

    productVisual = `
      <div class="product-table-placeholder">
        📦
      </div>
    `;
  }


  const isActive =
    product.is_active === true;


  const statusClass =
    isActive
      ? "active"
      : "hidden";


  const statusText =
    isActive
      ? "Active"
      : "Hidden";


  const stockClass =
    stock <= 0
      ? "out"
      : stock <= 5
        ? "low"
        : "";


  return `
    <tr>

      <td>

        <div class="product-table-product">

          ${productVisual}

          <div class="product-table-info">

            <strong>
              ${name}
            </strong>

            <span>
              ${escapeHtml(product.description || "")}
            </span>

          </div>

        </div>

      </td>


      <td>
        <span class="product-code">
          ${code}
        </span>
      </td>


      <td>

        <strong>
          Rs. ${price}
        </strong>

        ${
          oldPrice !== "-"
            ? `
              <small class="old-price">
                Rs. ${oldPrice}
              </small>
            `
            : ""
        }

      </td>


      <td>

        <span class="stock-value ${stockClass}">
          ${stock}
        </span>

      </td>


      <td>
        ${category}
      </td>


      <td>

        <span class="status-badge ${statusClass}">
          ${statusText}
        </span>

      </td>


      <td>

        <div class="product-actions">

          <button
            type="button"
            class="action-btn edit"
            data-action="edit"
            data-id="${escapeAttribute(String(id))}"
          >
            Edit
          </button>


          ${
            isActive
              ? `
                <button
                  type="button"
                  class="action-btn hide"
                  data-action="hide"
                  data-id="${escapeAttribute(String(id))}"
                >
                  Hide
                </button>
              `
              : `
                <button
                  type="button"
                  class="action-btn reactivate"
                  data-action="reactivate"
                  data-id="${escapeAttribute(String(id))}"
                >
                  Reactivate
                </button>
              `
          }

        </div>

      </td>

    </tr>
  `;
}


/* =========================================================
   PRODUCT IMAGE URL
   ========================================================= */

function getProductImageUrl(imageUrl) {

  if (!imageUrl) {
    return "";
  }

  const value = String(imageUrl).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const {
    data
  } = supabaseClient
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(value);

  return data && data.publicUrl
    ? data.publicUrl
    : "";
}


/* =========================================================
   ADD PRODUCT
   ========================================================= */

function openAddProductModal() {

  editingProductId = null;

  selectedImageFile = null;

  if (productForm) {
    productForm.reset();
  }

  if (productModalTitle) {
    productModalTitle.textContent = "Add Product";
  }

  if (saveProductButton) {
    saveProductButton.textContent = "Save Product";
    saveProductButton.disabled = false;
  }

  if (productActive) {
    productActive.checked = true;
  }

  if (imagePreview) {

    imagePreview.innerHTML = `
      <span>No Image</span>
    `;
  }

  if (currentImageText) {
    currentImageText.textContent = "";
  }

  setProductFormMessage("", "");

  openModal(productModal);
}


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function openEditProductModal(id) {

  const product =
    allProducts.find(
      item => String(item.id) === String(id)
    );


  if (!product) {

    showToast(
      "Product not found.",
      "error"
    );

    return;
  }


  editingProductId = product.id;

  selectedImageFile = null;


  if (productModalTitle) {
    productModalTitle.textContent = "Edit Product";
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
      product.is_active === true;
  }


  if (productImage) {
    productImage.value = "";
  }


  const imageUrl =
    getProductImageUrl(product.image_url);


  if (imagePreview) {

    if (imageUrl) {

      imagePreview.innerHTML = `
        <img
          src="${escapeAttribute(imageUrl)}"
          alt="Product image"
        >
      `;

    } else {

      imagePreview.innerHTML = `
        <span>No Image</span>
      `;
    }
  }


  if (currentImageText) {

    currentImageText.textContent =
      imageUrl
        ? "Current product image loaded."
        : "No current image.";
  }


  if (saveProductButton) {
    saveProductButton.textContent = "Update Product";
  }


  setProductFormMessage("", "");

  openModal(productModal);
}


/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function handleProductSubmit(event) {

  event.preventDefault();


  if (
    !productCode ||
    !productName ||
    !productPrice ||
    !productStock
  ) {
    return;
  }


  const code =
    productCode.value.trim();

  const name =
    productName.value.trim();

  const category =
    productCategory
      ? productCategory.value.trim()
      : "";

  const description =
    productDescription
      ? productDescription.value.trim()
      : "";

  const price =
    Number(productPrice.value);

  const oldPriceValue =
    productOldPrice
      ? productOldPrice.value.trim()
      : "";

  const oldPrice =
    oldPriceValue === ""
      ? null
      : Number(oldPriceValue);

  const stock =
    Number(productStock.value);

  const isActive =
    productActive
      ? productActive.checked
      : true;


  /* VALIDATION */

  if (!code) {

    setProductFormMessage(
      "Product code is required.",
      "error"
    );

    productCode.focus();

    return;
  }


  if (!name) {

    setProductFormMessage(
      "Product name is required.",
      "error"
    );

    productName.focus();

    return;
  }


  if (
    Number.isNaN(price) ||
    price < 0
  ) {

    setProductFormMessage(
      "Please enter a valid price.",
      "error"
    );

    productPrice.focus();

    return;
  }


  if (
    oldPrice !== null &&
    (
      Number.isNaN(oldPrice) ||
      oldPrice < 0
    )
  ) {

    setProductFormMessage(
      "Please enter a valid old price.",
      "error"
    );

    productOldPrice.focus();

    return;
  }


  if (
    Number.isNaN(stock) ||
    stock < 0
  ) {

    setProductFormMessage(
      "Please enter a valid stock quantity.",
      "error"
    );

    productStock.focus();

    return;
  }


  /* DUPLICATE PRODUCT CODE CHECK */

  const duplicate =
    allProducts.find(product => {

      const sameCode =
        String(product.product_code || "")
          .trim()
          .toLowerCase() ===
        code.toLowerCase();


      const sameProduct =
        editingProductId !== null &&
        String(product.id) ===
        String(editingProductId);


      return sameCode && !sameProduct;
    });


  if (duplicate) {

    setProductFormMessage(
      "This product code already exists.",
      "error"
    );

    productCode.focus();

    return;
  }


  setProductSaving(true);

  setProductFormMessage(
    "Saving product...",
    "loading"
  );


  try {

    /* UPLOAD IMAGE FIRST */

    let imageUrl = null;


    if (selectedImageFile) {

      imageUrl =
        await uploadProductImage(
          selectedImageFile,
          code
        );
    }


    /* UPDATE EXISTING PRODUCT */

    if (editingProductId !== null) {

      const updateData = {

        product_code: code,

        name: name,

        price: price,

        old_price: oldPrice,

        category:
          category || null,

        stock: stock,

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


      if (imageUrl) {
        updateData.image_url = imageUrl;
      }


      const {
        error
      } = await supabaseClient
        .from("products")
        .update(updateData)
        .eq("id", editingProductId);


      if (error) {
        throw error;
      }


      showToast(
        "Product updated successfully.",
        "success"
      );


    }

    /* CREATE NEW PRODUCT */

    else {

      if (!imageUrl && selectedImageFile) {
        throw new Error(
          "Product image upload failed."
        );
      }


      const insertData = {

        product_code: code,

        name: name,

        price: price,

        old_price: oldPrice,

        category:
          category || null,

        image_url:
          imageUrl || null,

        stock: stock,

        description:
          description || null,

        is_active:
          isActive,

        status:
          isActive
            ? "Active"
            : "Deleted"
      };


      const {
        error
      } = await supabaseClient
        .from("products")
        .insert(insertData);


      if (error) {
        throw error;
      }


      showToast(
        "Product added successfully.",
        "success"
      );
    }


    closeModal(productModal);

    editingProductId = null;

    selectedImageFile = null;

    await loadProducts();


  } catch (error) {

    console.error("Save product error:", error);

    setProductFormMessage(
      getErrorMessage(error),
      "error"
    );

    showToast(
      "Could not save product.",
      "error"
    );

  } finally {

    setProductSaving(false);
  }
}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadProductImage(file, code) {

  if (!file) {
    return null;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(file.type)) {

    throw new Error(
      "Only JPG, PNG or WEBP images are allowed."
    );
  }


  const maxSize =
    5 * 1024 * 1024;


  if (file.size > maxSize) {

    throw new Error(
      "Image size must be 5MB or less."
    );
  }


  const originalName =
    file.name || "image.jpg";


  const extension =
    originalName
      .split(".")
      .pop()
      .toLowerCase();


  const safeCode =
    code
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-");


  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8);


  const fileName =
    `${safeCode}-${Date.now()}-${randomPart}.${extension}`;


  const {
    error
  } = await supabaseClient
    .storage
    .from(STORAGE_BUCKET)
    .upload(
      fileName,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      }
    );


  if (error) {

    console.error(
      "Storage upload error:",
      error
    );

    throw new Error(
      "Image upload failed: " +
      getErrorMessage(error)
    );
  }


  const {
    data
  } = supabaseClient
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);


  if (
    !data ||
    !data.publicUrl
  ) {

    throw new Error(
      "Could not create image URL."
    );
  }


  return data.publicUrl;
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function handleImageChange(event) {

  const file =
    event.target.files &&
    event.target.files[0];


  if (!file) {

    selectedImageFile = null;

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(file.type)) {

    event.target.value = "";

    selectedImageFile = null;

    setProductFormMessage(
      "Only JPG, PNG or WEBP images are allowed.",
      "error"
    );

    return;
  }


  if (file.size > 5 * 1024 * 1024) {

    event.target.value = "";

    selectedImageFile = null;

    setProductFormMessage(
      "Image size must be 5MB or less.",
      "error"
    );

    return;
  }


  selectedImageFile = file;


  const reader =
    new FileReader();


  reader.onload = function(e) {

    if (!imagePreview) {
      return;
    }

    imagePreview.innerHTML = `
      <img
        src="${escapeAttribute(e.target.result)}"
        alt="New product image"
      >
    `;
  };


  reader.readAsDataURL(file);


  if (currentImageText) {

    currentImageText.textContent =
      "New image selected.";
  }


  setProductFormMessage(
    "",
    ""
  );
}


/* =========================================================
   HIDE PRODUCT
   ========================================================= */

function requestHideProduct(id) {

  const product =
    allProducts.find(
      item => String(item.id) === String(id)
    );


  if (!product) {
    return;
  }


  confirmAction = async function() {

    await setProductActive(
      product.id,
      false
    );
  };


  if (confirmTitle) {

    confirmTitle.textContent =
      "Hide Product?";
  }


  if (confirmText) {

    confirmText.textContent =
      `"${product.name}" will be hidden from the main website. The product record and old orders will remain محفوظ.`;
  }


  if (confirmActionButton) {

    confirmActionButton.textContent =
      "Hide Product";
  }


  openModal(confirmModal);
}


/* =========================================================
   REACTIVATE PRODUCT
   ========================================================= */

function requestReactivateProduct(id) {

  const product =
    allProducts.find(
      item => String(item.id) === String(id)
    );


  if (!product) {
    return;
  }


  confirmAction = async function() {

    await setProductActive(
      product.id,
      true
    );
  };


  if (confirmTitle) {

    confirmTitle.textContent =
      "Reactivate Product?";
  }


  if (confirmText) {

    confirmText.textContent =
      `"${product.name}" will become visible on the main website again.`;
  }


  if (confirmActionButton) {

    confirmActionButton.textContent =
      "Reactivate";
  }


  openModal(confirmModal);
}


/* =========================================================
   CHANGE PRODUCT ACTIVE STATUS
   ========================================================= */

async function setProductActive(
  id,
  active
) {

  closeModal(confirmModal);

  confirmAction = null;


  try {

    const {
      error
    } = await supabaseClient
      .from("products")
      .update({

        is_active:
          active,

        status:
          active
            ? "Active"
            : "Deleted",

        updated_at:
          new Date().toISOString()

      })
      .eq("id", id);


    if (error) {
      throw error;
    }


    showToast(
      active
        ? "Product reactivated successfully."
        : "Product hidden from the website.",
      "success"
    );


    await loadProducts();


  } catch (error) {

    console.error(
      "Change product status error:",
      error
    );


    showToast(
      "Could not update product: " +
      getErrorMessage(error),
      "error"
    );
  }
}


/* =========================================================
   CONFIRM ACTION
   ========================================================= */

async function executeConfirmAction() {

  if (
    typeof confirmAction !==
    "function"
  ) {
    closeModal(confirmModal);
    return;
  }


  if (confirmActionButton) {

    confirmActionButton.disabled =
      true;

    confirmActionButton.textContent =
      "Please wait...";
  }


  try {

    await confirmAction();

  } catch (error) {

    console.error(
      "Confirm action error:",
      error
    );

  } finally {

    confirmAction = null;

    if (confirmActionButton) {

      confirmActionButton.disabled =
        false;
    }
  }
}


/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

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


  const out =
    allProducts.filter(
      product =>
        Number(product.stock || 0) <= 0
    ).length;


  if (totalProducts) {
    totalProducts.textContent = total;
  }

  if (activeProducts) {
    activeProducts.textContent = active;
  }

  if (hiddenProducts) {
    hiddenProducts.textContent = hidden;
  }

  if (outOfStockProducts) {
    outOfStockProducts.textContent = out;
  }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  on(
    loginForm,
    "submit",
    handleLogin
  );


  on(
    logoutButton,
    "click",
    handleLogout
  );


  on(
    addProductButton,
    "click",
    openAddProductModal
  );


  on(
    refreshProductsButton,
    "click",
    async () => {

      await loadProducts();
    }
  );


  on(
    adminSearch,
    "input",
    applyFilters
  );


  on(
    adminStatusFilter,
    "change",
    applyFilters
  );


  on(
    productForm,
    "submit",
    handleProductSubmit
  );


  on(
    productImage,
    "change",
    handleImageChange
  );


  on(
    confirmActionButton,
    "click",
    executeConfirmAction
  );


  /* TABLE ACTIONS */

  on(
    productsTableBody,
    "click",
    handleProductTableClick
  );


  /* MODAL CLOSE BUTTONS */

  document
    .querySelectorAll("[data-close]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const modalId =
            button.getAttribute(
              "data-close"
            );

          closeModal(
            $(modalId)
          );
        }
      );
    });


  /* MODAL OVERLAYS */

  document
    .querySelectorAll("[data-close-modal]")
    .forEach(overlay => {

      overlay.addEventListener(
        "click",
        () => {

          const modalId =
            overlay.getAttribute(
              "data-close-modal"
            );

          closeModal(
            $(modalId)
          );
        }
      );
    });


  /* ESC KEY */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }

      closeModal(productModal);
      closeModal(confirmModal);
    }
  );
}


/* =========================================================
   TABLE ACTION HANDLER
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
    button.getAttribute(
      "data-action"
    );


  const id =
    button.getAttribute(
      "data-id"
    );


  if (!id) {
    return;
  }


  if (action === "edit") {

    openEditProductModal(id);

    return;
  }


  if (action === "hide") {

    requestHideProduct(id);

    return;
  }


  if (action === "reactivate") {

    requestReactivateProduct(id);

    return;
  }
}


/* =========================================================
   MODALS
   ========================================================= */

function openModal(modal) {

  if (!modal) {
    return;
  }


  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );
}


function closeModal(modal) {

  if (!modal) {
    return;
  }


  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  const anyOpenModal =
    document.querySelector(
      ".modal.open"
    );


  if (!anyOpenModal) {

    document.body.classList.remove(
      "modal-open"
    );
  }


  if (modal === productModal) {

    editingProductId = null;

    selectedImageFile = null;

    if (productImage) {
      productImage.value = "";
    }

    setProductFormMessage(
      "",
      ""
    );
  }
}


/* =========================================================
   LOADING STATES
   ========================================================= */

function setLoginLoading(loading) {

  if (!loginButton) {
    return;
  }


  loginButton.disabled =
    loading;


  loginButton.textContent =
    loading
      ? "Signing in..."
      : "Login";
}


function setProductSaving(saving) {

  if (!saveProductButton) {
    return;
  }


  saveProductButton.disabled =
    saving;


  if (saving) {

    saveProductButton.textContent =
      "Saving...";

  } else {

    saveProductButton.textContent =
      editingProductId !== null
        ? "Update Product"
        : "Save Product";
  }
}


/* =========================================================
   MESSAGES
   ========================================================= */

function setLoginMessage(
  message,
  type
) {

  if (!loginMessage) {
    return;
  }


  loginMessage.textContent =
    message || "";


  loginMessage.className =
    "form-message";


  if (type) {
    loginMessage.classList.add(type);
  }
}


function setProductFormMessage(
  message,
  type
) {

  if (!productFormMessage) {
    return;
  }


  productFormMessage.textContent =
    message || "";


  productFormMessage.className =
    "form-message";


  if (type) {
    productFormMessage.classList.add(type);
  }
}


function setAdminStatus(
  message,
  type
) {

  if (!adminStatus) {
    return;
  }


  adminStatus.textContent =
    message || "";


  adminStatus.className =
    "admin-status";


  if (type) {
    adminStatus.classList.add(type);
  }
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(
  message,
  type = "success"
) {

  if (!adminToast) {
    return;
  }


  adminToast.textContent =
    message || "";


  adminToast.className =
    "admin-toast";


  adminToast.classList.add(
    "show"
  );


  if (type) {
    adminToast.classList.add(type);
  }


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(() => {

      if (adminToast) {

        adminToast.classList.remove(
          "show"
        );
      }

    }, 3500);
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatPrice(value) {

  const number =
    Number(value || 0);


  return number.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2
    }
  );
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getErrorMessage(error) {

  if (!error) {
    return "Unknown error.";
  }


  if (
    typeof error === "string"
  ) {
    return error;
  }


  if (error.message) {
    return error.message;
  }


  if (error.error_description) {
    return error.error_description;
  }


  return "Something went wrong.";
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

  return escapeHtml(value);
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);
