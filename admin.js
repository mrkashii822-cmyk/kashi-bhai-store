/* =========================================================
   KASHI BHAI ADMIN PANEL
   Product Manager + Staff Manager + Activity Log
   Owner + Staff Authentication
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
let filteredStaffProfiles = [];

let auditLogs = [];
let filteredAuditLogs = [];

let currentConfirmAction = null;
let toastTimer = null;

let currentUser = null;
let currentUserProfile = null;
let currentUserRole = null;

let authInitialized = false;
let handlingAuthUserId = null;
let loginAuditRecordedFor = null;


/* =========================================================
   DOM
========================================================= */

/* LOGIN */

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


/* APP */

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
   STAFF
========================================================= */

const staffManagementSection =
  document.getElementById("staffManagementSection");

const addStaffButton =
  document.getElementById("addStaffButton");

const refreshStaffButton =
  document.getElementById("refreshStaffButton");

const staffSearch =
  document.getElementById("staffSearch");

const staffStatusFilter =
  document.getElementById("staffStatusFilter");

const staffTableBody =
  document.getElementById("staffTableBody");

const staffEmptyState =
  document.getElementById("staffEmptyState");

const totalStaff =
  document.getElementById("totalStaff");

const activeStaff =
  document.getElementById("activeStaff");

const disabledStaff =
  document.getElementById("disabledStaff");


/* STAFF MODAL */

const staffModal =
  document.getElementById("staffModal");

const staffModalOverlay =
  document.getElementById("staffModalOverlay");

const closeStaffModal =
  document.getElementById("closeStaffModal");

const cancelStaffButton =
  document.getElementById("cancelStaffButton");

const staffForm =
  document.getElementById("staffForm");

const staffName =
  document.getElementById("staffName");

const staffEmail =
  document.getElementById("staffEmail");

const staffPassword =
  document.getElementById("staffPassword");

const staffPasswordConfirm =
  document.getElementById("staffPasswordConfirm");

const createStaffButton =
  document.getElementById("createStaffButton");

const staffFormMessage =
  document.getElementById("staffFormMessage");


/* =========================================================
   ACTIVITY LOG
========================================================= */

const refreshAuditButton =
  document.getElementById("refreshAuditButton");

const auditSearch =
  document.getElementById("auditSearch");

const auditActionFilter =
  document.getElementById("auditActionFilter");

const auditTableBody =
  document.getElementById("auditTableBody");

const auditEmptyState =
  document.getElementById("auditEmptyState");


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
  forceCloseModal(staffModal);
  forceCloseModal(confirmModal);

  showLoginScreen();

  setupEventListeners();

  try {

    supabaseClient.auth.onAuthStateChange(
      (event, session) => {

        console.log(
          "Auth event:",
          event
        );

        if (
          session?.user
        ) {

          /*
            Do not perform heavy Supabase calls
            directly inside the auth callback.
          */

          setTimeout(
            () => {

              handleAuthenticatedUser(
                session.user,
                {
                  auditLogin:
                    event === "SIGNED_IN"
                }
              );

            },
            0
          );

          return;
        }


        if (
          event === "SIGNED_OUT"
        ) {

          currentUser = null;
          currentUserProfile = null;
          currentUserRole = null;
          handlingAuthUserId = null;

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


    authInitialized = true;


    if (
      data?.session?.user
    ) {

      await handleAuthenticatedUser(
        data.session.user,
        {
          auditLogin: false
        }
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

  /* LOGIN */

  loginForm?.addEventListener(
    "submit",
    handleLogin
  );


  /* LOGOUT */

  logoutButton?.addEventListener(
    "click",
    handleLogout
  );


  /* PRODUCTS */

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


  productsTableBody?.addEventListener(
    "click",
    handleProductTableClick
  );


  /* STAFF */

  addStaffButton?.addEventListener(
    "click",
    openStaffModal
  );


  refreshStaffButton?.addEventListener(
    "click",
    () => loadStaffProfiles(true)
  );


  staffSearch?.addEventListener(
    "input",
    applyStaffFilters
  );


  staffStatusFilter?.addEventListener(
    "change",
    applyStaffFilters
  );


  staffForm?.addEventListener(
    "submit",
    handleCreateStaff
  );


  closeStaffModal?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeModal(staffModal);

    }
  );


  cancelStaffButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeModal(staffModal);

    }
  );


  staffModalOverlay?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        staffModalOverlay
      ) {

        closeModal(staffModal);

      }

    }
  );


  staffTableBody?.addEventListener(
    "click",
    handleStaffTableClick
  );


  /* AUDIT */

  refreshAuditButton?.addEventListener(
    "click",
    () => loadAuditLogs(true)
  );


  auditSearch?.addEventListener(
    "input",
    applyAuditFilters
  );


  auditActionFilter?.addEventListener(
    "change",
    applyAuditFilters
  );


  /* CONFIRM */

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


  /* GLOBAL MODAL */

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
        closeModal(staffModal);
        closeModal(confirmModal);

        currentConfirmAction = null;

      }

    }
  );

}


/* =========================================================
   GLOBAL MODAL CLICK
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
      "#closeStaffModal"
    )
  ) {

    event.preventDefault();

    closeModal(staffModal);

    return;

  }


  if (
    event.target.closest(
      "#cancelStaffButton"
    )
  ) {

    event.preventDefault();

    closeModal(staffModal);

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


    if (!data?.user) {

      throw new Error(
        "Login failed. Please try again."
      );

    }


    /*
      IMPORTANT:
      We now accept either:

      1. Owner → admin_users
      2. Staff → staff_profiles
    */

    const access =
      await getUserAccess(
        data.user
      );


    if (!access.allowed) {

      await supabaseClient.auth.signOut();

      throw new Error(
        access.message ||
        "This account does not have admin access."
      );

    }


    currentUser =
      data.user;

    currentUserProfile =
      access.profile;

    currentUserRole =
      access.role;


    await updateCurrentUserLogin();


    /*
      Only record LOGIN once per actual login.
    */

    await recordLoginAudit();


    showToast(
      currentUserRole === "owner"
        ? "Owner login successful."
        : "Staff login successful.",
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

    const {
      data
    } =
      await supabaseClient.auth.getUser();


    const user =
      data?.user ||
      currentUser;


    if (user) {

      await createAuditLog(
        "LOGOUT",
        "auth_user",
        user.id,
        `${
          currentUserRole === "staff"
            ? "Staff"
            : "Owner"
        } logout: ${user.email}`
      );

    }


    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  currentUser = null;
  currentUserProfile = null;
  currentUserRole = null;
  handlingAuthUserId = null;

  showLoginScreen();

}


/* =========================================================
   USER ACCESS CHECK
========================================================= */

async function getUserAccess(user) {

  if (!user?.id) {

    return {
      allowed: false,
      role: null,
      profile: null,
      message:
        "Unable to identify the logged-in account."
    };

  }


  /*
    STEP 1:
    Check existing admin_users table.

    This is the Owner path.
  */

  try {

    const {
      data: ownerRow,
      error: ownerError
    } =
      await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();


    if (
      !ownerError &&
      ownerRow
    ) {

      /*
        Owner profile is useful for
        audit/login information.
      */

      let profile = null;


      try {

        const {
          data
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
            .eq(
              "user_id",
              user.id
            )
            .maybeSingle();


        profile =
          data || null;

      } catch (_) {
        /* Owner can continue even if profile read fails */
      }


      return {
        allowed: true,
        role: "owner",
        profile
      };

    }

  } catch (error) {

    console.warn(
      "Owner table check failed:",
      error
    );

  }


  /*
    STEP 2:
    Check staff_profiles.

    A staff account must:
      role = staff
      is_active = true
  */

  try {

    const {
      data: staffRow,
      error: staffError
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
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();


    if (staffError) {

      console.error(
        "Staff access check error:",
        staffError
      );

      return {
        allowed: false,
        role: null,
        profile: null,
        message:
          "Unable to verify staff permissions."
      };

    }


    if (!staffRow) {

      return {
        allowed: false,
        role: null,
        profile: null,
        message:
          "This account does not have admin access."
      };

    }


    if (
      staffRow.role !== "staff"
    ) {

      return {
        allowed: false,
        role: null,
        profile: staffRow,
        message:
          "This account has an invalid staff role."
      };

    }


    if (
      staffRow.is_active !== true
    ) {

      return {
        allowed: false,
        role: null,
        profile: staffRow,
        message:
          "This staff account has been disabled."
      };

    }


    return {
      allowed: true,
      role: "staff",
      profile: staffRow
    };

  } catch (error) {

    console.error(
      "Staff access exception:",
      error
    );

    return {
      allowed: false,
      role: null,
      profile: null,
      message:
        "Unable to verify staff permissions."
    };

  }

}


/* =========================================================
   AUTHENTICATED USER
========================================================= */

async function handleAuthenticatedUser(
  user,
  options = {}
) {

  if (!user) {

    showLoginScreen();

    return;

  }


  /*
    Prevent duplicate INITIAL_SESSION /
    getSession processing.
  */

  if (
    handlingAuthUserId === user.id &&
    adminApp &&
    !adminApp.classList.contains("hidden")
  ) {

    return;

  }


  handlingAuthUserId =
    user.id;


  try {

    const access =
      await getUserAccess(
        user
      );


    if (!access.allowed) {

      console.warn(
        "Authenticated account rejected:",
        access.message
      );


      await supabaseClient.auth.signOut();


      currentUser = null;
      currentUserProfile = null;
      currentUserRole = null;


      showLoginScreen();


      showLoginMessage(
        access.message ||
        "This account does not have admin access.",
        "error"
      );


      return;

    }


    currentUser =
      user;

    currentUserProfile =
      access.profile;

    currentUserRole =
      access.role;


    await updateCurrentUserLogin();


    /*
      Existing session on page refresh:
      do NOT create another LOGIN audit.

      Real SIGNED_IN event:
      create LOGIN audit.
    */

    if (
      options.auditLogin === true
    ) {

      await recordLoginAudit();

    }


    await showAdminApp();

  } finally {

    /*
      Keep ID while app is active so
      INITIAL_SESSION doesn't reload everything.
    */

  }

}


/* =========================================================
   LOGIN AUDIT
========================================================= */

async function recordLoginAudit() {

  if (!currentUser?.id) {
    return;
  }


  /*
    Prevent duplicate login records.
  */

  if (
    loginAuditRecordedFor ===
    currentUser.id
  ) {

    return;

  }


  loginAuditRecordedFor =
    currentUser.id;


  await createAuditLog(
    "LOGIN",
    "auth_user",
    currentUser.id,
    `${
      currentUserRole === "owner"
        ? "Owner"
        : "Staff"
    } login: ${currentUser.email}`
  );

}


/* =========================================================
   CURRENT USER LOGIN TIME
========================================================= */

async function updateCurrentUserLogin() {

  if (!currentUser?.id) {
    return;
  }


  try {

    const now =
      new Date().toISOString();


    const {
      data,
      error
    } =
      await supabaseClient
        .from("staff_profiles")
        .update({
          last_login_at: now
        })
        .eq(
          "user_id",
          currentUser.id
        )
        .select()
        .maybeSingle();


    if (error) {

      console.warn(
        "Could not update last login:",
        error
      );

      return;

    }


    if (data) {

      currentUserProfile =
        data;

    }

  } catch (error) {

    console.warn(
      "Last login update exception:",
      error
    );

  }

}


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showLoginScreen() {

  forceCloseModal(productModal);
  forceCloseModal(staffModal);
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
   SHOW ADMIN APP
========================================================= */

async function showAdminApp() {

  forceCloseModal(productModal);
  forceCloseModal(staffModal);
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


  /*
    Owner-only sections.
  */

  applyRoleBasedUI();


  /*
    Product Manager is available
    to authenticated owner/staff.

    Note:
    Product write permissions must also
    exist in Supabase RLS for staff.
  */

  await loadProducts();


  /*
    Only Owner loads staff manager
    and activity log.
  */

  if (
    currentUserRole === "owner"
  ) {

    await loadStaffProfiles();

    await loadAuditLogs();

  }

}


/* =========================================================
   ROLE BASED UI
========================================================= */

function applyRoleBasedUI() {

  const isOwner =
    currentUserRole === "owner";


  /*
    Staff Management
  */

  if (staffManagementSection) {

    staffManagementSection.style.display =
      isOwner
        ? ""
        : "none";

  }


  /*
    Hide staff controls for non-owner
    even if section exists elsewhere.
  */

  if (!isOwner) {

    if (addStaffButton) {
      addStaffButton.style.display = "none";
    }

    if (refreshStaffButton) {
      refreshStaffButton.style.display = "none";
    }

    if (refreshAuditButton) {
      refreshAuditButton.style.display = "none";
    }

  }

}


/* =========================================================
   PRODUCTS
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
   PRODUCT FILTERS
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
   PRODUCT RENDER
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
    editingProductId.value = "";
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

    productImage.value = "";

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


      await createAuditLog(
        "UPDATE_PRODUCT",
        "product",
        String(data.id),
        `Updated product ${data.product_code} — ${data.name}`,
        oldProduct || null,
        data
      );


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


      await createAuditLog(
        "CREATE_PRODUCT",
        "product",
        String(data.id),
        `Created product ${data.product_code} — ${data.name}`,
        null,
        data
      );


      showToast(
        "Product added successfully.",
        "success"
      );

    }


    closeModal(productModal);

    await loadProducts(true);

    if (
      currentUserRole === "owner"
    ) {

      await loadAuditLogs();

    }


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
   PRODUCT CONFIRM
========================================================= */

function askProductAction(
  product,
  action
) {

  currentConfirmAction = {
    type: "product",
    productId:
      product.id,
    action:
      action
  };


  if (action === "hide") {

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
   STAFF MANAGEMENT
========================================================= */

async function loadStaffProfiles(
  showLoading = false
) {

  if (
    currentUserRole !== "owner"
  ) {

    return;

  }


  if (showLoading) {

    showToast(
      "Refreshing staff...",
      "info"
    );

  }


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


    updateStaffStats();

    applyStaffFilters();


  } catch (error) {

    console.error(
      "Load staff error:",
      error
    );


    staffProfiles = [];

    updateStaffStats();

    applyStaffFilters();


    showToast(
      "Could not load staff: " +
      getFriendlyError(error),
      "error"
    );

  }

}


/* =========================================================
   STAFF STATS
========================================================= */

function updateStaffStats() {

  const total =
    staffProfiles.filter(
      profile =>
        profile.role === "staff"
    ).length;


  const active =
    staffProfiles.filter(
      profile =>
        profile.role === "staff" &&
        profile.is_active === true
    ).length;


  const disabled =
    staffProfiles.filter(
      profile =>
        profile.role === "staff" &&
        profile.is_active === false
    ).length;


  if (totalStaff) {
    totalStaff.textContent = total;
  }


  if (activeStaff) {
    activeStaff.textContent = active;
  }


  if (disabledStaff) {
    disabledStaff.textContent = disabled;
  }

}


/* =========================================================
   STAFF FILTER
========================================================= */

function applyStaffFilters() {

  const search =
    (
      staffSearch?.value || ""
    )
      .trim()
      .toLowerCase();


  const status =
    staffStatusFilter?.value || "all";


  filteredStaffProfiles =
    staffProfiles.filter(
      profile => {

        if (
          profile.role !== "staff"
        ) {

          return false;

        }


        const matchesSearch =
          !search ||
          String(
            profile.full_name || ""
          )
            .toLowerCase()
            .includes(search) ||

          String(
            profile.email || ""
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
            profile.is_active === true
          );

        }


        if (
          status === "disabled"
        ) {

          return (
            profile.is_active === false
          );

        }


        return true;

      }
    );


  renderStaff();

}


/* =========================================================
   STAFF RENDER
========================================================= */

function renderStaff() {

  if (!staffTableBody) {
    return;
  }


  staffTableBody.innerHTML = "";


  if (
    !filteredStaffProfiles.length
  ) {

    if (staffEmptyState) {

      staffEmptyState.style.display =
        "block";

    }

    return;

  }


  if (staffEmptyState) {

    staffEmptyState.style.display =
      "none";

  }


  filteredStaffProfiles.forEach(
    profile => {

      staffTableBody.appendChild(
        createStaffRow(profile)
      );

    }
  );

}


/* =========================================================
   STAFF ROW
========================================================= */

function createStaffRow(
  profile
) {

  const tr =
    document.createElement("tr");


  const statusClass =
    profile.is_active
      ? "active"
      : "disabled";


  const statusText =
    profile.is_active
      ? "Active"
      : "Disabled";


  const lastLogin =
    profile.last_login_at
      ? formatDateTime(
          profile.last_login_at
        )
      : "Never";


  const created =
    profile.created_at
      ? formatDate(
          profile.created_at
        )
      : "-";


  tr.innerHTML = `

    <td>

      <div class="staff-name-cell">

        <strong>
          ${escapeHtml(
            profile.full_name ||
            "Unnamed Staff"
          )}
        </strong>

        <span>
          ${escapeHtml(
            profile.email ||
            "-"
          )}
        </span>

      </div>

    </td>


    <td>

      <span class="role-badge staff">
        Staff
      </span>

    </td>


    <td>

      <span class="staff-status-badge ${statusClass}">
        ${statusText}
      </span>

    </td>


    <td>
      ${escapeHtml(created)}
    </td>


    <td>
      ${escapeHtml(lastLogin)}
    </td>


    <td>

      <button
        type="button"
        class="staff-action-btn ${
          profile.is_active
            ? "danger"
            : ""
        }"
        data-staff-action="${
          profile.is_active
            ? "disable"
            : "enable"
        }"
        data-user-id="${escapeAttribute(
          profile.user_id
        )}"
      >

        ${
          profile.is_active
            ? "Disable"
            : "Enable"
        }

      </button>

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

  if (
    currentUserRole !== "owner"
  ) {

    return;

  }


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


  const profile =
    staffProfiles.find(
      item =>
        String(item.user_id) ===
        String(userId)
    );


  if (!profile) {

    showToast(
      "Staff account could not be found.",
      "error"
    );

    return;

  }


  if (
    profile.role !== "staff"
  ) {

    showToast(
      "Owner accounts cannot be changed here.",
      "error"
    );

    return;

  }


  if (
    action === "disable"
  ) {

    askStaffAction(
      profile,
      false
    );

    return;

  }


  if (
    action === "enable"
  ) {

    askStaffAction(
      profile,
      true
    );

  }

}


/* =========================================================
   STAFF CONFIRM
========================================================= */

function askStaffAction(
  profile,
  enable
) {

  if (
    currentUserRole !== "owner"
  ) {

    return;

  }


  currentConfirmAction = {
    type: "staff",
    userId:
      profile.user_id,
    enable:
      enable
  };


  if (confirmTitle) {

    confirmTitle.textContent =
      enable
        ? "Enable Staff Account"
        : "Disable Staff Account";

  }


  if (confirmText) {

    confirmText.textContent =
      enable

        ? `"${profile.full_name}" will be allowed to sign in again.`

        : `"${profile.full_name}" will no longer be allowed to use the staff portal.`;

  }


  if (confirmActionButton) {

    confirmActionButton.textContent =
      enable
        ? "Enable Staff"
        : "Disable Staff";


    if (enable) {

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

function openStaffModal() {

  if (
    currentUserRole !== "owner"
  ) {

    showToast(
      "Only the owner can create staff accounts.",
      "error"
    );

    return;

  }


  if (staffForm) {

    staffForm.reset();

  }


  clearStaffFormMessage();

  openModal(staffModal);


  setTimeout(
    () => {

      staffName?.focus();

    },
    100
  );

}


/* =========================================================
   CREATE STAFF
========================================================= */

async function handleCreateStaff(
  event
) {

  event.preventDefault();


  if (
    currentUserRole !== "owner"
  ) {

    showStaffFormMessage(
      "Only the owner can create staff accounts.",
      "error"
    );

    return;

  }


  clearStaffFormMessage();


  const name =
    staffName?.value.trim() || "";


  const email =
    staffEmail?.value.trim().toLowerCase() || "";


  const password =
    staffPassword?.value || "";


  const confirmPassword =
    staffPasswordConfirm?.value || "";


  if (!name) {

    showStaffFormMessage(
      "Full name is required.",
      "error"
    );

    return;

  }


  if (!email) {

    showStaffFormMessage(
      "Email is required.",
      "error"
    );

    return;

  }


  if (
    !isValidEmail(email)
  ) {

    showStaffFormMessage(
      "Please enter a valid email address.",
      "error"
    );

    return;

  }


  if (
    password.length < 8
  ) {

    showStaffFormMessage(
      "Password must be at least 8 characters.",
      "error"
    );

    return;

  }


  if (
    password !== confirmPassword
  ) {

    showStaffFormMessage(
      "Passwords do not match.",
      "error"
    );

    return;

  }


  setButtonLoading(
    createStaffButton,
    null,
    true,
    "Creating..."
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
            responseBody?.error ||
            responseBody?.message ||
            detail;

        } catch (_) {}

      }


      throw new Error(detail);

    }


    if (
      !data?.success
    ) {

      throw new Error(
        data?.error ||
        "Staff account could not be created."
      );

    }


    showToast(
      `Staff account created for ${email}.`,
      "success"
    );


    closeModal(staffModal);


    await loadStaffProfiles();

    await loadAuditLogs();


  } catch (error) {

    console.error(
      "Create staff error:",
      error
    );


    showStaffFormMessage(
      getFriendlyError(error),
      "error"
    );


  } finally {

    setButtonLoading(
      createStaffButton,
      null,
      false,
      "Create Staff"
    );

  }

}


/* =========================================================
   CONFIRM ACTION
========================================================= */

async function executeConfirmAction() {

  if (!currentConfirmAction) {
    return;
  }


  if (
    currentConfirmAction.type ===
    "staff"
  ) {

    await executeStaffStatusChange();

    return;

  }


  await executeProductConfirmAction();

}


/* =========================================================
   STAFF STATUS CHANGE
========================================================= */

async function executeStaffStatusChange() {

  if (
    currentUserRole !== "owner"
  ) {

    closeModal(confirmModal);

    currentConfirmAction = null;

    return;

  }


  const {
    userId,
    enable
  } =
    currentConfirmAction;


  setButtonLoading(
    confirmActionButton,
    null,
    true,
    enable
      ? "Enabling..."
      : "Disabling..."
  );


  try {

    const profile =
      staffProfiles.find(
        item =>
          String(item.user_id) ===
          String(userId)
      );


    if (!profile) {

      throw new Error(
        "Staff profile could not be found."
      );

    }


    if (
      profile.role !== "staff"
    ) {

      throw new Error(
        "Owner account cannot be disabled here."
      );

    }


    const oldData =
      {
        ...profile
      };


    const {
      data,
      error
    } =
      await supabaseClient
        .from("staff_profiles")
        .update({
          is_active:
            enable
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
        "Staff status could not be changed."
      );

    }


    await createAuditLog(
      enable
        ? "ENABLE_STAFF"
        : "DISABLE_STAFF",
      "staff_profile",
      String(userId),
      enable
        ? `Enabled staff account: ${data.full_name}`
        : `Disabled staff account: ${data.full_name}`,
      oldData,
      data
    );


    closeModal(confirmModal);

    currentConfirmAction = null;


    showToast(
      enable
        ? "Staff account enabled."
        : "Staff account disabled.",
      "success"
    );


    await loadStaffProfiles();

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
   PRODUCT STATUS CONFIRM
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

    const oldProduct =
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


    await createAuditLog(
      action === "hide"
        ? "HIDE_PRODUCT"
        : "REACTIVATE_PRODUCT",
      "product",
      String(productId),
      action === "hide"
        ? `Hidden product ${data.product_code} — ${data.name}`
        : `Reactivated product ${data.product_code} — ${data.name}`,
      oldProduct || null,
      data
    );


    closeModal(confirmModal);

    currentConfirmAction = null;


    showToast(
      action === "hide"
        ? "Product hidden successfully."
        : "Product reactivated successfully.",
      "success"
    );


    await loadProducts(true);


    if (
      currentUserRole === "owner"
    ) {

      await loadAuditLogs();

    }


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
   AUDIT LOG
========================================================= */

async function loadAuditLogs(
  showLoading = false
) {

  if (
    currentUserRole !== "owner"
  ) {

    return;

  }


  if (showLoading) {

    showToast(
      "Refreshing activity log...",
      "info"
    );

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("audit_logs")
        .select(`
          id,
          user_id,
          user_email,
          user_name,
          user_role,
          action,
          entity_type,
          entity_id,
          description,
          old_data,
          new_data,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(100);


    if (error) {
      throw error;
    }


    auditLogs =
      Array.isArray(data)
        ? data
        : [];


    populateAuditActionFilter();

    applyAuditFilters();


  } catch (error) {

    console.error(
      "Load audit logs error:",
      error
    );


    auditLogs = [];

    applyAuditFilters();


    showToast(
      "Could not load activity log: " +
      getFriendlyError(error),
      "error"
    );

  }

}


/* =========================================================
   AUDIT ACTION FILTER OPTIONS
========================================================= */

function populateAuditActionFilter() {

  if (!auditActionFilter) {
    return;
  }


  const currentValue =
    auditActionFilter.value || "all";


  const actions =
    [
      ...new Set(
        auditLogs
          .map(
            log =>
              log.action
          )
          .filter(Boolean)
      )
    ]
      .sort();


  auditActionFilter.innerHTML = `
    <option value="all">
      All Actions
    </option>
  `;


  actions.forEach(
    action => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        action;

      option.textContent =
        action;

      auditActionFilter.appendChild(
        option
      );

    }
  );


  if (
    actions.includes(
      currentValue
    )
  ) {

    auditActionFilter.value =
      currentValue;

  } else {

    auditActionFilter.value =
      "all";

  }

}


/* =========================================================
   AUDIT FILTER
========================================================= */

function applyAuditFilters() {

  const search =
    (
      auditSearch?.value || ""
    )
      .trim()
      .toLowerCase();


  const action =
    auditActionFilter?.value || "all";


  filteredAuditLogs =
    auditLogs.filter(
      log => {

        const searchableText =
          [
            log.user_name,
            log.user_email,
            log.user_role,
            log.action,
            log.entity_type,
            log.entity_id,
            log.description
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );


        const matchesAction =
          action === "all" ||
          log.action === action;


        return (
          matchesSearch &&
          matchesAction
        );

      }
    );


  renderAuditLogs();

}


/* =========================================================
   AUDIT RENDER
========================================================= */

function renderAuditLogs() {

  if (!auditTableBody) {
    return;
  }


  auditTableBody.innerHTML = "";


  if (
    !filteredAuditLogs.length
  ) {

    if (auditEmptyState) {

      auditEmptyState.style.display =
        "block";

    }

    return;

  }


  if (auditEmptyState) {

    auditEmptyState.style.display =
      "none";

  }


  filteredAuditLogs.forEach(
    log => {

      auditTableBody.appendChild(
        createAuditRow(log)
      );

    }
  );

}


/* =========================================================
   AUDIT ROW
========================================================= */

function createAuditRow(
  log
) {

  const tr =
    document.createElement("tr");


  const userName =
    log.user_name ||
    log.user_email ||
    "Unknown User";


  const userEmail =
    log.user_email ||
    "";


  const entity =
    log.entity_type
      ? `${log.entity_type}${
          log.entity_id
            ? ` #${log.entity_id}`
            : ""
        }`
      : "-";


  tr.innerHTML = `

    <td>

      <div class="audit-date">
        ${escapeHtml(
          formatDateTime(
            log.created_at
          )
        )}
      </div>

    </td>


    <td>

      <div class="audit-user">

        <strong>
          ${escapeHtml(
            userName
          )}
        </strong>

        <span>
          ${escapeHtml(
            userEmail
          )}
        </span>

      </div>

    </td>


    <td>

      <span class="activity-badge">
        ${escapeHtml(
          log.action ||
          "-"
        )}
      </span>

    </td>


    <td>

      ${escapeHtml(
        entity
      )}

    </td>


    <td>

      <div
        class="audit-description"
        title="${escapeAttribute(
          log.description ||
          ""
        )}"
      >
        ${escapeHtml(
          log.description ||
          "-"
        )}
      </div>

    </td>

  `;


  return tr;

}


/* =========================================================
   AUDIT CREATE
========================================================= */

async function createAuditLog(
  action,
  entityType = null,
  entityId = null,
  description = null,
  oldData = null,
  newData = null
) {

  try {

    const {
      data: authData
    } =
      await supabaseClient.auth.getUser();


    const user =
      authData?.user ||
      currentUser;


    if (!user?.id) {

      console.warn(
        "Audit skipped: no authenticated user."
      );

      return false;

    }


    let profile =
      currentUserProfile;


    if (
      !profile
    ) {

      const {
        data
      } =
        await supabaseClient
          .from("staff_profiles")
          .select(`
            user_id,
            full_name,
            email,
            role,
            is_active
          `)
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();


      profile =
        data || null;

    }


    const {
      error
    } =
      await supabaseClient
        .from("audit_logs")
        .insert({
          user_id:
            user.id,

          user_email:
            user.email || null,

          user_name:
            profile?.full_name ||
            user.email ||
            "Unknown User",

          user_role:
            currentUserRole ||
            profile?.role ||
            "owner",

          action:
            action,

          entity_type:
            entityType,

          entity_id:
            entityId == null
              ? null
              : String(entityId),

          description:
            description,

          old_data:
            oldData,

          new_data:
            newData
        });


    if (error) {

      console.warn(
        "Audit log insert failed:",
        error
      );

      return false;

    }


    return true;

  } catch (error) {

    console.warn(
      "Audit log exception:",
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
    !staffModal?.classList.contains(
      "open"
    ) &&
    !confirmModal?.classList.contains(
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


function showStaffFormMessage(
  message,
  type = "info"
) {

  if (!staffFormMessage) {
    return;
  }


  staffFormMessage.textContent =
    message;


  staffFormMessage.className =
    `form-message ${type}`;

}


function clearStaffFormMessage() {

  if (!staffFormMessage) {
    return;
  }


  staffFormMessage.textContent =
    "";


  staffFormMessage.className =
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
   VALIDATE EMAIL
========================================================= */

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      String(email || "")
    );

}


/* =========================================================
   PRICE
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


/* =========================================================
   DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  try {

    return new Date(
      value
    ).toLocaleDateString(
      "en-PK",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

  } catch (_) {

    return String(value);

  }

}


/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(
  value
) {

  if (!value) {
    return "-";
  }


  try {

    return new Date(
      value
    ).toLocaleString(
      "en-PK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  } catch (_) {

    return String(value);

  }

}


/* =========================================================
   FILE EXTENSION
========================================================= */

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

  return escapeHtml(value);

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
      "disabled"
    ) &&
    lower.includes(
      "staff"
    )
  ) {

    return (
      "This staff account has been disabled."
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
      "Permission denied. Supabase RLS policy is blocking this action."
    );

  }


  if (
    lower.includes(
      "duplicate key"
    )
  ) {

    return (
      "This product code or staff account already exists."
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
      "failed to send a request"
    ) ||
    lower.includes(
      "functions"
    )
  ) {

    return (
      "Could not contact the staff creation service. Check the Supabase Edge Function."
    );

  }


  return message;

}
