// App State
const state = {
    products: [],
    discounts: [],
    currentSale: {
        items: [],
        paymentMethod: 'cash',
        subtotal: 0,
        discount: 0,
        total: 0
    },
    salesHistory: [],
    currentEvent: null,
    eventStartDate: null,
    eventEndDate: null
};

// --- Translation State ---
let currentLanguage = localStorage.getItem('marketMasterLanguage') || 'en'; // Load saved language or default to 'en'
let translations = {};

// DOM Elements
const elements = {
    productList: document.getElementById('productList'),
    discountList: document.getElementById('discountList'),
    receiptArea: document.getElementById('receiptArea'),
    receiptItems: document.getElementById('receiptItems'),
    emptyReceiptMessage: document.getElementById('emptyReceiptMessage'),
    receiptTotals: document.getElementById('receiptTotals'),
    subtotalAmount: document.getElementById('subtotalAmount'),
    discountAmount: document.getElementById('discountAmount'),
    totalAmount: document.getElementById('totalAmount'),
    quickAddButtons: document.getElementById('quickAddButtons'),
    salesHistory: document.getElementById('salesHistory'),
    totalSales: document.getElementById('totalSales'),
    
    // Modals
    productModal: document.getElementById('productModal'),
    discountModal: document.getElementById('discountModal'),
    eventModal: document.getElementById('eventModal'),
    saleCompleteModal: document.getElementById('saleCompleteModal'),
    
    // Forms
    productForm: document.getElementById('productForm'),
    discountForm: document.getElementById('discountForm'),
    eventForm: document.getElementById('eventForm'),
    
    // Buttons
    addProductBtn: document.getElementById('addProductBtn'),
    addDiscountBtn: document.getElementById('addDiscountBtn'),
    newEventBtn: document.getElementById('newEventBtn'),
    clearSaleBtn: document.getElementById('clearSaleBtn'),
    todaysSaleReportModal: document.getElementById('todaysSaleReportModal'),
    reportEventName: document.getElementById('reportEventName'),
    reportEventLocation: document.getElementById('reportEventLocation'),
    reportEventDate: document.getElementById('reportEventDate'),
    reportTotalSales: document.getElementById('reportTotalSales'),
    reportTotalProfit: document.getElementById('reportTotalProfit'),
    reportTransactionCount: document.getElementById('reportTransactionCount'),
    reportDateSelect: document.getElementById('reportDateSelect'),
    salesChart: document.getElementById('salesChart'),
    closeReportModal: document.getElementById('closeReportModal'),
    completeSaleBtn: document.getElementById('completeSaleBtn'),
    paymentMethodBtns: document.querySelectorAll('.payment-method-btn'),
    
    // Close buttons
    closeProductModal: document.getElementById('closeProductModal'),
    closeDiscountModal: document.getElementById('closeDiscountModal'),
    closeEventModal: document.getElementById('closeEventModal'),
    closeSaleCompleteModal: document.getElementById('closeSaleCompleteModal'),
    cancelProduct: document.getElementById('cancelProduct'),
    cancelDiscount: document.getElementById('cancelDiscount'),
    cancelEvent: document.getElementById('cancelEvent'),
    
    // Modal display elements
    modalTotal: document.getElementById('modalTotal'),
    modalPaymentMethod: document.getElementById('modalPaymentMethod')
};
// --- Translation Functions ---
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        currentLanguage = lang;
        localStorage.setItem('marketMasterLanguage', lang);
        document.documentElement.lang = lang; // Update html lang attribute
        applyTranslations();
        // Re-render dynamic elements that depend on translations
        renderProducts();
        renderDiscounts();
        renderReceipt();
        renderSalesHistory();
        renderQuickAddButtons(); // If quick add buttons have translatable text
        updateSalesTotal(); // Update label
        // Update modal titles and labels if they are open or need dynamic updates
        updateDynamicModalText();
    } catch (error) {
        console.error("Could not load translations:", error);
        // Fallback or error handling
    }
}

function t(key) {
    return translations[key] || key; // Return key if translation not found
}

function applyTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const targetAttribute = element.getAttribute('data-translate-attribute');

        if (targetAttribute) {
            // Translate a specific attribute (e.g., placeholder, title)
            element.setAttribute(targetAttribute, t(key));
        } else if (element.tagName === 'TITLE') {
            element.textContent = t(key);
        } else if (element.tagName === 'INPUT' && element.type === 'submit') {
             element.value = t(key); // For submit button value
        } else if (element.tagName === 'OPTION') {
             // Only translate static options, dynamic ones handled by render functions
             if (!element.closest('select[dynamic-options]')) { 
                element.textContent = t(key);
             }
        } else {
            // Use innerHTML for elements that might contain icons (like buttons)
            // Preserve existing non-text nodes (like <i> icons)
            const childNodes = Array.from(element.childNodes);
            element.innerHTML = ''; // Clear existing content
            childNodes.forEach(node => {
                if (node.nodeType !== Node.TEXT_NODE) {
                    element.appendChild(node.cloneNode(true)); // Re-append non-text nodes (like <i>)
                }
            });
            // Append the translated text node (add space for buttons etc)
            const textNode = document.createTextNode((element.tagName === 'BUTTON' || element.querySelector('i')) ? (' ' + t(key)) : t(key)); 
            element.appendChild(textNode);
        }
    });
     // Update specific elements not easily captured by data-translate
    const totalSalesLabel = elements.totalSales.previousElementSibling;
    if (totalSalesLabel) totalSalesLabel.textContent = t('todaysSalesLabel');

    // Update dynamic text placeholders if necessary (initial state messages)
    if (state.products.length === 0 && elements.productList) {
        elements.productList.innerHTML = `<div class="text-gray-500 italic">${t('noProducts')}</div>`;
    }
     if (state.discounts.length === 0 && elements.discountList) {
        elements.discountList.innerHTML = `<div class="text-gray-500 italic">${t('noDiscounts')}</div>`;
    }
    if (state.currentSale.items.length === 0 && elements.emptyReceiptMessage) {
        elements.emptyReceiptMessage.textContent = t('emptyReceiptMessage');
        elements.emptyReceiptMessage.classList.remove('hidden');
        elements.receiptItems.classList.add('hidden');
        elements.receiptTotals.classList.add('hidden');
    } else if (elements.emptyReceiptMessage) {
         elements.emptyReceiptMessage.classList.add('hidden');
         elements.receiptItems.classList.remove('hidden');
         elements.receiptTotals.classList.remove('hidden');
    }
    if (state.salesHistory.length === 0 && elements.salesHistory) {
        const historyTableBody = elements.salesHistory;
        // Check if the placeholder row exists or needs to be created
        if (historyTableBody.rows.length === 0 || (historyTableBody.rows.length === 1 && historyTableBody.rows[0].cells.length > 1)) {
             historyTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500 italic">${t('noSales')}</td></tr>`;
        } else if (historyTableBody.rows.length === 1 && historyTableBody.rows[0].cells.length === 1) {
             historyTableBody.rows[0].cells[0].textContent = t('noSales');
        }
    }
    // Update modal select placeholders dynamically
    updateDynamicModalText();

}

// Helper to update text in modals that might be generated dynamically
function updateDynamicModalText() {
    // Product Modal Categories (static options handled by applyTranslations)

    // Discount Modal - Product Select (populated dynamically)
    const discountProductSelect = document.getElementById('discountProduct');
    if (discountProductSelect) {
        // If it's populated dynamically, ensure placeholder is handled correctly
        // The populateProductDropdown function should handle adding options
        // We might need to add a placeholder option there if desired
        if (discountProductSelect.options.length === 0 && state.products.length === 0) {
             discountProductSelect.innerHTML = `<option value="" disabled selected>${t('noProducts')}</option>`;
        } else if (discountProductSelect.options.length > 0 && discountProductSelect.selectedIndex === -1) {
             // If no option is selected, maybe add/select a placeholder
             // This depends on how populateProductDropdown is implemented
        }
    }

     // Discount Modal - "With Product" Select (populated dynamically)
    const withProductSelect = document.getElementById('withProductSelect');
     if (withProductSelect) {
        if (withProductSelect.options.length === 0 && state.products.length === 0) {
            withProductSelect.innerHTML = `<option value="" disabled selected>${t('noProducts')}</option>`;
        }
    }

    // Update labels within dynamically generated discount fields
    // These labels should ideally have data-translate attributes added when generated
    document.querySelectorAll('#discountFields label[data-translate-dynamic]').forEach(label => {
        const key = label.getAttribute('data-translate-dynamic');
        label.textContent = t(key);
    });

    // Update Sale Complete Modal dynamic text
    const modalPaymentMethodSpan = elements.modalPaymentMethod;
    if (modalPaymentMethodSpan && state.currentSale.paymentMethod) { // Check if payment method exists
        const paymentMethodKey = 'payment' + state.currentSale.paymentMethod.charAt(0).toUpperCase() + state.currentSale.paymentMethod.slice(1);
        modalPaymentMethodSpan.textContent = t(paymentMethodKey);
    }
}


// --- Language Switcher ---
function setupLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher'); // Assuming an element with this ID exists
    if (switcher) {
        switcher.addEventListener('change', (event) => {
            loadTranslations(event.target.value);
        });
        // Set initial value from state
        switcher.value = currentLanguage;
    }
}


// Initialize the app
async function init() {
    // Load sample data if no data in localStorage
    if (!localStorage.getItem('marketMasterData')) {
        loadSampleData();
    } else {
        loadFromLocalStorage();
    }
    await loadTranslations(currentLanguage); // Load initial translations

    
    // Set up event listeners
    setupEventListeners();
    
    setupLanguageSwitcher(); // Setup listener for language changes

    // Render initial UI
    renderProducts();
    renderDiscounts();
    // Display event name and date
    if (state.currentEvent) {
        document.getElementById('eventName').textContent = state.currentEvent.name;
        const startDate = state.currentEvent.startDate ? new Date(state.currentEvent.startDate).toLocaleDateString() : 'Invalid Date';
        const endDate = state.currentEvent.endDate ? new Date(state.currentEvent.endDate).toLocaleDateString() : 'Invalid Date';
        document.getElementById('eventDate').textContent = `${startDate} - ${endDate}`;
        document.getElementById('eventLocation').textContent = state.currentEvent.location;
    }

    updateSalesTotal();
}

// Load sample data
function loadSampleData() {
    state.products = [
        { id: 1, name: "Organic Tomatoes", price: 3.50, cost: 1.20, category: "produce" },
        { id: 2, name: "Homemade Bread", price: 5.00, cost: 1.80, category: "bakery" },
        { id: 3, name: "Farm Eggs (Dozen)", price: 4.50, cost: 2.00, category: "dairy" },
        { id: 4, name: "Artisan Cheese", price: 8.00, cost: 3.50, category: "dairy" },
        { id: 5, name: "Handmade Soap", price: 6.00, cost: 2.00, category: "crafts" }
    ];
    
    state.discounts = [
        { 
            id: 1, 
            name: "Tomato Bundle", 
            type: "bundle", 
            productId: 1, 
            params: { quantity: 3, price: 9.00 } 
        },
        { 
            id: 2, 
            name: "Bread & Cheese", 
            type: "fixed", 
            productId: 2, 
            params: { amount: 2.00, withProduct: 4 } 
        }
    ];
    
    saveToLocalStorage();
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('marketMasterData', JSON.stringify({
        products: state.products,
        discounts: state.discounts,
        salesHistory: state.salesHistory,
        currentEvent: state.currentEvent,
        eventStartDate: state.eventStartDate,
        eventEndDate: state.eventEndDate
    }));
}

// Load from localStorage
function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('marketMasterData'));
    if (data) {
        state.products = data.products || [];
        state.discounts = data.discounts || [];
        state.salesHistory = data.salesHistory || [];
        state.currentEvent = data.currentEvent || null;
        state.eventStartDate = data.eventStartDate || null;
        state.eventEndDate = data.eventEndDate || null;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Modal toggles
    elements.addProductBtn.addEventListener('click', () => elements.productModal.classList.remove('hidden'));
    elements.addDiscountBtn.addEventListener('click', () => {
        populateProductDropdown();
        elements.discountModal.classList.remove('hidden');
    });
    elements.newEventBtn.addEventListener('click', () => elements.eventModal.classList.remove('hidden'));
    document.getElementById('todaysSaleReportBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showTodaysSaleReport();
    });
    
    // Modal closes
    elements.closeProductModal.addEventListener('click', () => elements.productModal.classList.add('hidden'));
    elements.closeDiscountModal.addEventListener('click', () => elements.discountModal.classList.add('hidden'));
    elements.closeEventModal.addEventListener('click', () => elements.eventModal.classList.add('hidden'));
    elements.closeSaleCompleteModal.addEventListener('click', () => {
        elements.saleCompleteModal.classList.add('hidden');
        clearCurrentSale();
    });
    
    // Cancel buttons
    elements.cancelProduct.addEventListener('click', () => elements.productModal.classList.add('hidden'));
    elements.cancelDiscount.addEventListener('click', () => elements.discountModal.classList.add('hidden'));
    elements.cancelEvent.addEventListener('click', () => elements.eventModal.classList.add('hidden'));
    
    // Form submissions
    elements.productForm.addEventListener('submit', handleProductSubmit);
    elements.discountForm.addEventListener('submit', handleDiscountSubmit);
    elements.eventForm.addEventListener('submit', handleEventSubmit);
    
    // Sales buttons
    elements.clearSaleBtn.addEventListener('click', clearCurrentSale);
    elements.completeSaleBtn.addEventListener('click', completeSale);
    
    // Payment method buttons
    elements.paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method;
            state.currentSale.paymentMethod = method;
            
            // Update UI
            elements.paymentMethodBtns.forEach(b => 
                b.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500')
            );
            btn.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
        });
    });
    
    // Set default payment method
    document.querySelector('.payment-method-btn[data-method="cash"]').classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
    
    // Discount type change
    document.getElementById('discountType').addEventListener('change', updateDiscountFields);

    // Hamburger menu toggle
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');

    if (menuButton && menuDropdown) {
        menuButton.addEventListener('click', () => {
            menuDropdown.classList.toggle('hidden');
        });

        todaysSaleReportBtn.addEventListener('click', () => {
            showTodaysSaleReport();
            menuDropdown.classList.add('hidden');
        });

        // Close the dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!menuButton.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuDropdown.classList.add('hidden');
            }
        });
    }
}

// Handle product form submission
function handleProductSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const cost = parseFloat(document.getElementById('productCost').value);
    const category = document.getElementById('productCategory').value;
    
    const newProduct = {
        id: Date.now(), // Simple unique ID
        name,
        price,
        cost,
        category
    };
    
    state.products.push(newProduct);
    saveToLocalStorage();
    renderProducts();
    renderQuickAddButtons();
    elements.productModal.classList.add('hidden');
    elements.productForm.reset();
}

// Handle discount form submission
function handleDiscountSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('discountName').value;
    const type = document.getElementById('discountType').value;
    const productId = parseInt(document.getElementById('discountProduct').value);
    
    let params = {};
    if (type === 'bundle') {
        params.quantity = parseInt(document.getElementById('bundleQuantity').value);
        params.price = parseFloat(document.getElementById('bundlePrice').value);
    } else if (type === 'percentage') {
        params.percentage = parseInt(document.getElementById('percentageValue').value);
    } else if (type === 'fixed') {
        params.amount = parseFloat(document.getElementById('fixedAmount').value);
        if (document.getElementById('withProductCheckbox')?.checked) {
            params.withProduct = parseInt(document.getElementById('withProductSelect').value);
        }
    }
    
    const newDiscount = {
        id: Date.now(),
        name,
        type,
        productId,
        params
    };
    
    state.discounts.push(newDiscount);
    saveToLocalStorage();
    renderDiscounts();
    elements.discountModal.classList.add('hidden');
    elements.discountForm.reset();
}

// Handle event form submission
function handleEventSubmit(e) {
    console.log('handleEventSubmit called');
    e.preventDefault();
    
    const name = document.getElementById('eventModalName').value;
    const startDate = document.getElementById('eventStartDate').value;
    const endDate = document.getElementById('eventEndDate').value;
    const location = document.getElementById('eventModalLocation').value;
 const cost = parseFloat(document.getElementById('eventCost').value);
    
    state.currentEvent = {
        id: Date.now(),
        cost,
        startTime: new Date().toISOString(),
        name,
        startDate,
        endDate,
        location
    };

    saveToLocalStorage();
    elements.eventModal.classList.add('hidden');
    elements.eventForm.reset();
    document.getElementById('eventLocation').textContent = location;
}

// Update discount fields based on selected type
function updateDiscountFields() {
    document.getElementById('eventName').textContent = name;
    const displayStartDate = startDate ? new Date(startDate).toLocaleDateString() : 'Invalid Date';
    const displayEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'Invalid Date';
    document.getElementById('eventDate').textContent = `${displayStartDate} - ${displayEndDate}`;
    document.getElementById('eventLocation').textContent = location;
    const type = document.getElementById('discountType').value;
    const discountFields = document.getElementById('discountFields');
    
    let html = '';
    
    if (type === 'bundle') {
        html = `
            <div>
                <label class="block text-gray-700 mb-2" for="bundleQuantity" data-translate-dynamic="bundleQuantityLabel">Quantity</label>
                <input type="number" id="bundleQuantity" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="2" min="2">
            </div>
            <div>
                <label class="block text-gray-700 mb-2" for="bundlePrice" data-translate-dynamic="bundlePriceLabel">Total Price ($)</label>
                <input type="number" step="0.01" id="bundlePrice" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
        `;
    } else if (type === 'percentage') {
        html = `
            <div class="col-span-2">
                <label class="block text-gray-700 mb-2" for="percentageValue" data-translate-dynamic="percentageValueLabel">Percentage Off</label>
                <div class="flex items-center">
                    <input type="number" id="percentageValue" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="10" min="1" max="100">
                    <span class="ml-2">%</span>
                </div>
            </div>
        `;
    } else if (type === 'fixed') {
        html = `
            <div class="col-span-2">
                <label class="block text-gray-700 mb-2" for="fixedAmount" data-translate-dynamic="fixedAmountLabel">Amount Off ($)</label>
                <input type="number" step="0.01" id="fixedAmount" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
        `;
        
        // Add conditional field for "with product" option
        setTimeout(() => {
            const fixedAmountField = document.getElementById('fixedAmount');
            if (fixedAmountField) {
                fixedAmountField.insertAdjacentHTML('afterend', `
                    <div class="col-span-2 mt-2">
                        <label class="inline-flex items-center">
                            <input type="checkbox" id="withProductCheckbox" class="form-checkbox">
                            <span class="ml-2" data-translate-dynamic="withProductLabel">When purchased with another product</span>
                        </label>
                        <select id="withProductSelect" class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md hidden">
                            <!-- Products will be populated here -->
                        </select>
                    </div>
                `);
                
                // Set up event listener for checkbox
                document.getElementById('withProductCheckbox').addEventListener('change', (e) => {
                    const select = document.getElementById('withProductSelect');
                    if (e.target.checked) {
                        select.classList.remove('hidden');
                        populateWithProductDropdown();
                    } else {
                        select.classList.add('hidden');
                    }
                });
            }
        }, 0);
    }
    
    discountFields.innerHTML = html;
}

// Populate product dropdown for discounts
function populateProductDropdown() {
    const select = document.getElementById('discountProduct');
    select.innerHTML = '';
    
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

// Populate "with product" dropdown
function populateWithProductDropdown() {
    const select = document.getElementById('withProductSelect');
    if (!select) return;
    
    select.innerHTML = '';
    
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

// Render products list
function renderProducts() {
    if (!elements.productList) return; // Guard clause
    if (state.products.length === 0) {
        elements.productList.innerHTML = `<div class="text-gray-500 italic">${t('noProducts')}</div>`;
        return;
    }
    
    let html = '';
    state.products.forEach(product => {
        html += `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-500">$${product.price.toFixed(2)} | Cost: $${product.cost.toFixed(2)}</div>
                </div>
                <div class="flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700 edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 delete-product" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-800 add-to-sale" data-id="${product.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.productList.innerHTML = html;
    
    // Add event listeners to new buttons
    document.querySelectorAll('.add-to-sale').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            addProductToSale(productId);
        });
    });
    
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            deleteProduct(productId);
        });
    });
    
    // Update quick add buttons
    renderQuickAddButtons();
}

// Render discounts list
function renderDiscounts() {
    if (!elements.discountList) return; // Guard clause
    if (state.discounts.length === 0) {
        elements.discountList.innerHTML = `<div class="text-gray-500 italic">${t('noDiscounts')}</div>`;
        return;
    }
    
    let html = '';
    state.discounts.forEach(discount => {
        const product = state.products.find(p => p.id === discount.productId);
        const productName = product ? product.name : 'Unknown Product';
        
        let discountText = '';
        if (discount.type === 'bundle') {
            discountText = `${discount.params.quantity} for $${discount.params.price.toFixed(2)}`;
        } else if (discount.type === 'percentage') {
            discountText = `${discount.params.percentage}% off`;
        } else if (discount.type === 'fixed') {
            discountText = `$${discount.params.amount.toFixed(2)} off`;
            if (discount.params.withProduct) {
                const withProduct = state.products.find(p => p.id === discount.params.withProduct);
                if (withProduct) {
                    discountText += ` with ${withProduct.name}`;
                }
            }
        }
        
        html += `
            <div class="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                    <div class="font-medium">${discount.name}</div>
                    <div class="text-sm text-gray-600">${productName}</div>
                    <div class="text-sm font-semibold text-yellow-700">${discountText}</div>
                </div>
                <div class="flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700 edit-discount" data-id="${discount.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 delete-discount" data-id="${discount.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.discountList.innerHTML = html;
    
    // Add event listeners to new buttons
    document.querySelectorAll('.edit-discount').forEach(btn => {
        btn.addEventListener('click', () => {
            const discountId = parseInt(btn.dataset.id);
            editDiscount(discountId);
        });
    });
    
    document.querySelectorAll('.delete-discount').forEach(btn => {
        btn.addEventListener('click', () => {
            const discountId = parseInt(btn.dataset.id);
            deleteDiscount(discountId);
        });
    });
}

// Render quick add buttons
function renderQuickAddButtons() {
    let html = '';
    
    state.products.forEach(product => {
        html += `
            <button class="bg-gray-100 hover:bg-gray-200 p-2 rounded flex flex-col items-center quick-add-btn" data-id="${product.id}">
                <span class="font-medium">${product.name}</span>
                <span class="text-sm text-gray-600">$${product.price.toFixed(2)}</span>
            </button>
        `;
    });
    
    elements.quickAddButtons.innerHTML = html;
    
    // Add event listeners to quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            addProductToSale(productId);
        });
    });
}

// Add product to current sale
function addProductToSale(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already exists in sale
    const existingItem = state.currentSale.items.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.currentSale.items.push({
            productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            discountApplied: 0
        });
    }
    
    calculateSaleTotals();
    renderReceipt();
}

// Edit product
function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Populate the form
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCost').value = product.cost;
    document.getElementById('productCategory').value = product.category;
    
    // Show the modal
    elements.productModal.classList.remove('hidden');
    
    // Temporary storage of product ID being edited
    elements.productForm.dataset.editingId = productId;
}

// Delete product
function deleteProduct(productId) {
    if (confirm(t('confirmDeleteProduct'))) {
        state.products = state.products.filter(p => p.id !== productId);
        saveToLocalStorage();
        renderProducts();
        renderQuickAddButtons();
    }
}

// Edit discount
function editDiscount(discountId) {
    const discount = state.discounts.find(d => d.id === discountId);
    if (!discount) return;
    
    // Populate the form
    document.getElementById('discountName').value = discount.name;
    document.getElementById('discountType').value = discount.type;
    populateProductDropdown();
    document.getElementById('discountProduct').value = discount.productId;
    
    // Trigger the discount type change to show appropriate fields
    document.getElementById('discountType').dispatchEvent(new Event('change'));
    
    // Wait for fields to render
    setTimeout(() => {
        if (discount.type === 'bundle') {
            document.getElementById('bundleQuantity').value = discount.params.quantity;
            document.getElementById('bundlePrice').value = discount.params.price;
        } else if (discount.type === 'percentage') {
            document.getElementById('percentageValue').value = discount.params.percentage;
        } else if (discount.type === 'fixed') {
            document.getElementById('fixedAmount').value = discount.params.amount;
            if (discount.params.withProduct) {
                document.getElementById('withProductCheckbox').checked = true;
                populateWithProductDropdown();
                document.getElementById('withProductSelect').value = discount.params.withProduct;
                document.getElementById('withProductSelect').classList.remove('hidden');
            }
        }
    }, 100);
    
    // Show the modal
    elements.discountModal.classList.remove('hidden');
    
    // Temporary storage of discount ID being edited
    elements.discountForm.dataset.editingId = discountId;
}

// Delete discount
function deleteDiscount(discountId) {
    if (confirm(t('confirmDeleteDiscount'))) {
        state.discounts = state.discounts.filter(d => d.id !== discountId);
        saveToLocalStorage();
        renderDiscounts();
    }
}

// Render receipt
function renderReceipt() {
    if (state.currentSale.items.length === 0) {
        elements.emptyReceiptMessage.classList.remove('hidden');
        elements.receiptItems.classList.add('hidden');
        elements.receiptTotals.classList.add('hidden');
        return;
    }
    
    elements.emptyReceiptMessage.classList.add('hidden');
    elements.receiptItems.classList.remove('hidden');
    elements.receiptTotals.classList.remove('hidden');
    
    let html = '';
    state.currentSale.items.forEach(item => {
        const discountApplied = item.discountApplied > 0;
        const originalPrice = item.price * item.quantity;
        const discountedPrice = originalPrice - item.discountApplied;
        
        html += `
            <div class="flex justify-between items-center py-2 receipt-item">
                <div class="flex items-center">
                    <div class="font-medium">${item.name}</div>
                    ${discountApplied ? `<span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full discount-badge">SAVED $${item.discountApplied.toFixed(2)}</span>` : ''}
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <button class="text-gray-500 hover:text-gray-700 change-quantity" data-id="${item.productId}" data-change="-1">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="font-medium">${item.quantity}</span>
                        <button class="text-gray-500 hover:text-gray-700 change-quantity" data-id="${item.productId}" data-change="1">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="text-right min-w-20">
                        <div class="font-medium">$${discountedPrice.toFixed(2)}</div>
                        ${discountApplied ? `<div class="text-xs text-gray-500 line-through">$${originalPrice.toFixed(2)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    elements.receiptItems.innerHTML = html;
    
    // Update totals display
    elements.subtotalAmount.textContent = `$${state.currentSale.subtotal.toFixed(2)}`;
    elements.discountAmount.textContent = `-$${state.currentSale.discount.toFixed(2)}`;
    elements.totalAmount.textContent = `$${state.currentSale.total.toFixed(2)}`;
    
    // Add event listeners to quantity change buttons
    document.querySelectorAll('.change-quantity').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            const change = parseInt(btn.dataset.change);
            updateProductQuantity(productId, change);
        });
    });
}

// Update product quantity in current sale
function updateProductQuantity(productId, change) {
    const item = state.currentSale.items.find(item => item.productId === productId);
    if (!item) return;
    
    item.quantity += change;
    
    // Remove item if quantity reaches 0
    if (item.quantity <= 0) {
        state.currentSale.items = state.currentSale.items.filter(i => i.productId !== productId);
    }
    
    calculateSaleTotals();
    renderReceipt();
}

// Calculate sale totals and apply discounts
function calculateSaleTotals() {
    let subtotal = 0;
    let totalDiscount = 0;
    
    // Apply discounts
    state.currentSale.items.forEach(item => {
        item.discountApplied = 0; // Reset discount before recalculation
        
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return;
        
        subtotal += product.price * item.quantity;
        
        // Apply discounts if any
        const applicableDiscounts = state.discounts.filter(d => d.productId === product.id);
        applicableDiscounts.forEach(discount => {
            if (discount.type === 'bundle') {
                const bundleCount = Math.floor(item.quantity / discount.params.quantity);
                if (bundleCount > 0) {
                    const originalPrice = product.price * discount.params.quantity;
                    const discountAmount = originalPrice - discount.params.price;
                    item.discountApplied += discountAmount * bundleCount;
                    totalDiscount += discountAmount * bundleCount;
                }
            } else if (discount.type === 'percentage') {
                if (item.quantity >= 1) { // Apply to all quantities
                    const discountAmount = (product.price * item.quantity) * (discount.params.percentage / 100);
                    item.discountApplied += discountAmount;
                    totalDiscount += discountAmount;
                }
            } else if (discount.type === 'fixed') {
                if (item.quantity >= 1) { // Fixed amount per item
                    const discountAmount = discount.params.amount * item.quantity;
                    item.discountApplied += discountAmount;
                    totalDiscount += discountAmount;
                    
                    // Check if this is a combo discount and the other product is also in the cart
                    if (discount.params.withProduct) {
                        const withProductInCart = state.currentSale.items.some(i => i.productId === discount.params.withProduct);
                        if (!withProductInCart) {
                            totalDiscount -= discountAmount;
                            item.discountApplied -= discountAmount;
                        }
                    }
                }
            }
        });
    });
    
    state.currentSale.subtotal = subtotal;
    state.currentSale.discount = totalDiscount;
    state.currentSale.total = subtotal - totalDiscount;
}

// Clear current sale
function clearCurrentSale() {
    state.currentSale = {
        items: [],
        paymentMethod: 'cash',
        subtotal: 0,
        discount: 0,
        total: 0
    };
    
    // Reset payment method UI
    elements.paymentMethodBtns.forEach(b => 
        b.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500')
    );
    document.querySelector('.payment-method-btn[data-method="cash"]').classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
    
    renderReceipt();
}

// Complete sale
function completeSale() {
    if (state.currentSale.items.length === 0) {
        alert('Cannot complete an empty sale');
        return;
    }
    
    // Add to sales history
    const saleRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        items: [...state.currentSale.items],
        paymentMethod: state.currentSale.paymentMethod,
        total: state.currentSale.total,
        eventId: state.currentEvent?.id
    };
    
    state.salesHistory.unshift(saleRecord);
    saveToLocalStorage();
    
    // Show confirmation modal
    elements.modalTotal.textContent = `$${saleRecord.total.toFixed(2)}`;
    elements.modalPaymentMethod.textContent = state.currentSale.paymentMethod;
 
 // Calculate and display event profit
    const profit = calculateEventProfit(state.currentSale, state.currentEvent);
    elements.saleCompleteModal.classList.remove('hidden');
    
    // Update sales total display
    updateSalesTotal();

    // Clear current sale
    clearCurrentSale();

// Calculate event profit
function calculateEventProfit(sale, event) {
  let totalRevenue = sale.total;
  let totalCostOfGoods = 0;
  sale.items.forEach(item => {
    const product = state.products.find(p => p.id === item.productId);
    if (product) {
      totalCostOfGoods += product.cost * item.quantity;
    }
  });
  let eventCost = event ? event.cost : 0;
  let totalProfit = totalRevenue - totalCostOfGoods - eventCost;
  return totalProfit;
}
    
    // Render sales history
    renderSalesHistory();
}

// Render sales history
function renderSalesHistory() {
    if (!elements.salesHistory) return; // Guard clause
    if (state.salesHistory.length === 0) {
        elements.salesHistory.innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-4 text-center text-gray-500 italic">${t('noSales')}</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    state.salesHistory.forEach(sale => {
        const itemsList = sale.items.map(item => 
            `${item.quantity} × ${item.name}`
        ).join(', ');
        
        let methodText = sale.paymentMethod;
        let methodIcon = '';
        if (sale.paymentMethod === 'cash') {
            methodIcon = '<i class="fas fa-money-bill-wave mr-1"></i>';
        } else if (sale.paymentMethod === 'card') {
            methodIcon = '<i class="fas fa-credit-card mr-1"></i>';
        } else if (sale.paymentMethod === 'venmo') {
            methodIcon = '<i class="fab fa-vimeo-v mr-1"></i>';
        }
        
        html += `
            <tr>
                <td class="px-4 py-3">${sale.timestamp}</td>
                <td class="px-4 py-3">${itemsList}</td>
                <td class="px-4 py-3">${methodIcon} ${methodText}</td>
                <td class="px-4 py-3 font-bold">$${sale.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    elements.salesHistory.innerHTML = html;
}

// Show Today's Sale Report
function showTodaysSaleReport() {
    // Show modal
    elements.todaysSaleReportModal.classList.remove('hidden');
    
    // Populate event details
    if (state.currentEvent) {
        elements.reportEventName.textContent = state.currentEvent.name;
        elements.reportEventLocation.textContent = state.currentEvent.location;
        elements.reportEventDate.textContent = new Date(state.currentEvent.startDate).toLocaleDateString();
    }
    
    // Calculate and display stats
    console.log('All sales:', state.salesHistory);
    const todaySales = state.salesHistory.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const today = new Date();
        console.log(`Checking sale date: ${saleDate} vs today: ${today}`);
        return saleDate.getDate() === today.getDate() &&
               saleDate.getMonth() === today.getMonth() &&
               saleDate.getFullYear() === today.getFullYear();
    });
    console.log('Today sales:', todaySales);

    // Calculate profit for a sale
    function calculateSaleProfit(sale) {
        return sale.items.reduce((profit, item) => {
            const product = state.products.find(p => p.id === item.productId);
            if (product) {
                return profit + ((item.price - product.cost) * item.quantity);
            }
            return profit;
        }, 0);
    }
    
    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = todaySales.reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);
    
    elements.reportTotalSales.textContent = `$${totalSales.toFixed(2)}`;
    elements.reportTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
    elements.reportTransactionCount.textContent = todaySales.length;
    
    // Initialize chart with hourly sales data
    const hourlySales = {};
    const hourlyProfit = {};
    
    // Initialize hours with 0 values
    for (let i = 0; i < 24; i++) {
        hourlySales[i] = 0;
        hourlyProfit[i] = 0;
    }
    
    // Aggregate sales by hour
    todaySales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        hourlySales[hour] += sale.total;
        hourlyProfit[hour] += calculateSaleProfit(sale);
    });
    
    // Convert to arrays for chart
    const hours = Array.from({length: 24}, (_, i) => i);
    const salesData = hours.map(h => hourlySales[h]);
    const profitData = hours.map(h => hourlyProfit[h]);
    
    // Create chart
    new Chart(elements.salesChart, {
        type: 'line',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [
                {
                    label: 'Sales ($)',
                    data: salesData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Profit ($)',
                    data: profitData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Hourly Sales Performance'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Close modal handler
    elements.closeReportModal.addEventListener('click', () => {
        elements.todaysSaleReportModal.classList.add('hidden');
    });
}

// Update sales total
function updateSalesTotal() {
    const total = state.salesHistory.reduce((sum, sale) => sum + sale.total, 0);
    elements.totalSales.textContent = `$${total.toFixed(2)}`;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
