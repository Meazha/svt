function initStorage() {
    if (!localStorage.getItem('brands')) 
        localStorage.setItem('brands', JSON.stringify([]));
    if (!localStorage.getItem('products')) 
        localStorage.setItem('products', JSON.stringify([]));
    if (!localStorage.getItem('bills')) 
        localStorage.setItem('bills', JSON.stringify([]));
}

// Call initStorage when the page loads
window.onload = initStorage;

const appVersion = "1.0.1";

if (localStorage.getItem("appVersion") !== appVersion) {
    localStorage.clear(); // Clear outdated data
    localStorage.setItem("appVersion", appVersion);
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('app-cache-v1').then(cache => {
            return cache.addAll([
                '/index.html',
                '/styles.css',
                '/script.js'
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== 'app-cache-v1') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


function isLocalStorageAvailable() {
    try {
        const testKey = "__test__";
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

if (!isLocalStorageAvailable()) {
    alert("LocalStorage is not supported in this browser. Please use a supported browser.");
}


function getCurrentBillNumber() {
    return parseInt(localStorage.getItem('currentBillNumber')) || 1;
}

function incrementBillNumber() {
    const nextNumber = getCurrentBillNumber() + 1;
    localStorage.setItem('currentBillNumber', nextNumber);
    return nextNumber - 1; // Return the current number before increment
}

// Navigation
function showSection(sectionName) {
    ['products', 'billing', 'reports'].forEach(section => {
        document.getElementById(`${section}-section`).style.display = 
            section === sectionName ? 'block' : 'none';
    });

    // Refresh data when switching sections
    if (sectionName === 'products') loadProductsList();
    if (sectionName === 'billing') loadBrandsList();
    if (sectionName === 'reports') loadReportData();
}

window.onload = function () {
    showSection('billing');
};

let isManualBrand = false;
let isManualProduct = false;

function toggleBrandInput() {
    const selectElement = document.getElementById('billing-brand');
    const manualInput = document.getElementById('billing-brand-manual');
    isManualBrand = !isManualBrand;
    
    selectElement.style.display = isManualBrand ? 'none' : 'block';
    manualInput.style.display = isManualBrand ? 'block' : 'none';
    
    // Clear values when switching
    selectElement.value = '';
    manualInput.value = '';
    
    // Update product list if switching back to dropdown
    if (!isManualBrand) {
        updateProductList();
    }
}

function toggleProductInput() {
    const selectElement = document.getElementById('billing-product');
    const manualInput = document.getElementById('billing-product-manual');
    const manualPrice = document.getElementById('billing-manual-price');
    isManualProduct = !isManualProduct;
    
    selectElement.style.display = isManualProduct ? 'none' : 'block';
    manualInput.style.display = isManualProduct ? 'block' : 'none';
    manualPrice.style.display = isManualProduct ? 'block' : 'none';
    
    // Clear values when switching
    selectElement.value = '';
    manualInput.value = '';
    manualPrice.value = '';
}

// Brand Management
function addBrand() {
    const brandName = document.getElementById('brand-name').value;
    const brandDescription = document.getElementById('brand-description').value;

    if (!brandName) {
        alert('Please enter a brand name');
        return;
    }

    const brands = JSON.parse(localStorage.getItem('brands'));
    const newBrand = {
        id: Date.now(),
        name: brandName,
        description: brandDescription
    };

    brands.push(newBrand);
    localStorage.setItem('brands', JSON.stringify(brands));

    // Clear inputs
    document.getElementById('brand-name').value = '';
    document.getElementById('brand-description').value = '';

    loadBrandsList();
    loadProductsList();
}

// Product Management
function addProduct() {
    const brandSelect = document.getElementById('product-brand');
    const productName = document.getElementById('product-name').value;
    const productPrice = parseFloat(document.getElementById('product-price').value);
    const brandId = brandSelect.value;

    if (!brandId || !productName || !productPrice) {
        alert('Please fill all product details');
        return;
    }

    const products = JSON.parse(localStorage.getItem('products'));
    const newProduct = {
        id: Date.now(),
        brandId: brandId,
        name: productName,
        price: productPrice,
        tax: 0 // Default tax to 0
    };

    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));

    // Clear inputs
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';

    filterProductsByBrand();
}

function loadBrandsList() {
    const brands = JSON.parse(localStorage.getItem('brands'));
    const brandSelects = [
        document.getElementById('product-brand'),
        document.getElementById('billing-brand')
    ];

    brandSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Brand</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            select.appendChild(option);
        });
    });
}

function loadProductsList(filterBrandId = '') {
    const products = JSON.parse(localStorage.getItem('products'));
    const brands = JSON.parse(localStorage.getItem('brands'));
    const tableBody = document.getElementById('products-table-body');
    
    tableBody.innerHTML = '';

    // Filter products if a brand is selected
    const filteredProducts = filterBrandId 
        ? products.filter(product => product.brandId == filterBrandId)
        : products;
    
    if (filteredProducts.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td colspan="4" style="text-align: center;">
                ${filterBrandId ? 'No products found for this brand' : 'No products available'}
            </td>
        `;
        return;
    }

    filteredProducts.forEach(product => {
        const brand = brands.find(b => b.id == product.brandId);
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td style="text-align: center;">${brand ? brand.name : 'Unknown'}</td>
            <td style="text-align: center;">${product.name}</td>
            <td style="text-align: center;">₹${product.price.toFixed(2)}</td>
            <td style="text-align: center;">
                <button class="btn btn-primary" onclick="editProduct(${product.id})">
                    <i class="icon">✎</i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="icon">×</i> Delete
                </button>
            </td>
        `;
    });
}

function editProduct(productId) {
    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.id == productId);
    
    if (!product) return;

    // Populate form fields with product data
    document.getElementById('product-brand').value = product.brandId;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    
    // Change Add button to Update button
    const addButton = document.querySelector('button[onclick="addProduct()"]');
    addButton.innerHTML = '<i class="icon">✓</i> Update Product';
    addButton.onclick = () => updateProduct(productId);
}

function updateProduct(productId) {
    const brandId = document.getElementById('product-brand').value;
    const productName = document.getElementById('product-name').value;
    const productPrice = parseFloat(document.getElementById('product-price').value);

    if (!brandId || !productName || !productPrice) {
        alert('Please fill all product details');
        return;
    }

    const products = JSON.parse(localStorage.getItem('products'));
    const productIndex = products.findIndex(p => p.id == productId);
    
    if (productIndex === -1) return;

    // Update product
    products[productIndex] = {
        ...products[productIndex],
        brandId: brandId,
        name: productName,
        price: productPrice
    };

    localStorage.setItem('products', JSON.stringify(products));

    // Reset form
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    
    // Reset button to Add mode
    const updateButton = document.querySelector('button[onclick*="updateProduct"]');
    updateButton.innerHTML = '<i class="icon">+</i> Add Product';
    updateButton.onclick = addProduct;

    loadProductsList();
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    const products = JSON.parse(localStorage.getItem('products'));
    const filteredProducts = products.filter(p => p.id != productId);
    localStorage.setItem('products', JSON.stringify(filteredProducts));
    loadProductsList();
}

// Billing Section
function updateProductList() {
    const brandId = document.getElementById('billing-brand').value;
    const productSelect = document.getElementById('billing-product');
    const products = JSON.parse(localStorage.getItem('products'));

    productSelect.innerHTML = '<option value="">Select Product</option>';
    products.filter(p => p.brandId == brandId).forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
}

function filterProductsByBrand() {
    const selectedBrandId = document.getElementById('product-brand').value;
    loadProductsList(selectedBrandId);
}

function validateCustomerInfo() {
    const customerName = document.getElementById('customer-name').value.trim();
    const customerMobile = document.getElementById('customer-mobile').value.trim();
    const customerAddress = document.getElementById('customer-address').value.trim();

    if (!customerName || !customerMobile || !customerAddress) {
        alert('Please fill in all customer details');
        return null;
    }

    if (!/^[0-9]{10}$/.test(customerMobile)) {
        alert('Please enter a valid 10-digit mobile number');
        return null;
    }

    return {
        name: customerName,
        mobile: customerMobile,
        address: customerAddress
    };
}

let currentBillItems = [];

function addProductToBill() {
    let brandName, productName, productPrice;
    const quantity = parseFloat(document.getElementById('billing-quantity').value);

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    if (isManualBrand) {
        brandName = document.getElementById('billing-brand-manual').value.trim();
        if (!brandName) {
            alert('Please enter a brand name');
            return;
        }
    } else {
        const brandSelect = document.getElementById('billing-brand');
        if (!brandSelect.value) {
            alert('Please select a brand');
            return;
        }
        const brands = JSON.parse(localStorage.getItem('brands'));
        const brand = brands.find(b => b.id == brandSelect.value);
        brandName = brand.name;
    }

    if (isManualProduct) {
        productName = document.getElementById('billing-product-manual').value.trim();
        productPrice = parseFloat(document.getElementById('billing-manual-price').value);
        if (!productName || !productPrice || productPrice <= 0) {
            alert('Please enter product name and valid price');
            return;
        }
    } else {
        const productSelect = document.getElementById('billing-product');
        if (!productSelect.value) {
            alert('Please select a product');
            return;
        }
        const products = JSON.parse(localStorage.getItem('products'));
        const product = products.find(p => p.id == productSelect.value);
        productName = product.name;
        productPrice = product.price;
    }

    const billItem = {
        productId: isManualProduct ? `manual-${Date.now()}` : document.getElementById('billing-product').value,
        brandName: brandName,
        productName: productName,
        quantity: quantity,
        price: productPrice,
        tax: 0
    };

    currentBillItems.push(billItem);
    updateBillItemsTable();

    // Clear inputs
    document.getElementById('billing-quantity').value = '';
    if (isManualProduct) {
        document.getElementById('billing-product-manual').value = '';
        document.getElementById('billing-manual-price').value = '';
    }
    if (isManualBrand) {
        document.getElementById('billing-brand-manual').value = '';
    }
}

function updateProductPrice() {
    const productId = document.getElementById('billing-product').value;
    if (!productId) return;

    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.id == productId);
    if (product) {
        // You could display the price somewhere in the UI if needed
        console.log(`Selected product price: ₹${product.price}`);
    }
}

function updateBillItemsTable() {
    const tableBody = document.getElementById('bill-items-body');
    tableBody.innerHTML = '';
    let subtotal = 0;

    currentBillItems.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;

        const row = tableBody.insertRow();
        row.innerHTML = `
            <td style="text-align: center;"><strong>${item.brandName}</strong> - ${item.productName}</td>
            <td style="text-align: center;">${item.quantity} KG</td>
            <td style="text-align: center;">₹${item.price.toFixed(2)}</td>
            <td style="text-align: center;">₹${itemTotal.toFixed(2)}</td>
            <td style="text-align: center;">
                <button class="btn btn-danger" onclick="removeFromBill(${index})">Remove</button>
            </td>
        `;
    });

    updateBillTotals(subtotal);
}

function updateBillTotals(subtotal = null) {
    if (subtotal === null) {
        subtotal = currentBillItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    const gstPercentage = parseFloat(document.getElementById('gst-percentage').value) || 0;
    const gstAmount = subtotal * (gstPercentage / 100);
    const grandTotal = subtotal + gstAmount;

    document.getElementById('bill-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('gst-amount').textContent = gstAmount.toFixed(2);
    document.getElementById('bill-total-amount').textContent = grandTotal.toFixed(2);
}

function removeFromBill(index) {
    currentBillItems.splice(index, 1);
    updateBillItemsTable();
}

function generateBill() {
    if (currentBillItems.length === 0) {
        alert('Please add items to the bill');
        return;
    }

    const customerInfo = validateCustomerInfo();
    if (!customerInfo) {
        return;
    }

    const billNumber = incrementBillNumber();
    const subtotal = currentBillItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const gstPercentage = parseFloat(document.getElementById('gst-percentage').value) || 0;
    const gstAmount = subtotal * (gstPercentage / 100);
    const grandTotal = subtotal + gstAmount;

    const bill = {
        id: Date.now(),
        billNumber: billNumber,
        date: new Date().toISOString(),
        customer: customerInfo, // Add customer information
        items: currentBillItems.map(item => ({
            ...item,
            itemTotal: item.quantity * item.price
        })),
        subtotal: subtotal,
        gstPercentage: gstPercentage,
        gstAmount: gstAmount,
        totalAmount: grandTotal,
        status: 'ACTIVE'
    };

    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    bills.push(bill);
    localStorage.setItem('bills', JSON.stringify(bills));

    // Clear form
    currentBillItems = [];
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-mobile').value = '';
    document.getElementById('customer-address').value = '';
    updateBillItemsTable();
    alert(`Bill #${billNumber} Generated Successfully!`);
}

function cancelBill(billId) {
    if (!confirm('Are you sure you want to cancel this bill?')) {
        return;
    }

    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    const billIndex = bills.findIndex(b => b.id === billId);
    
    if (billIndex !== -1) {
        bills[billIndex].status = 'CANCELLED';
        bills[billIndex].cancellationDate = new Date().toISOString();
        localStorage.setItem('bills', JSON.stringify(bills));
        generateReport(); // Refresh the report table
    }
}

function showBillDetails(bill) {
    // Add customer information section
    const customerInfo = `
        <div class="customer-details">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${bill.customer?.name || 'N/A'}</p>
            <p><strong>Mobile:</strong> ${bill.customer?.mobile || 'N/A'}</p>
            <p><strong>Address:</strong> ${bill.customer?.address || 'N/A'}</p>
        </div>
    `;

    // Rest of your existing showBillDetails code...
    const itemsList = bill.items.map(item => 
        `<tr>
            <td style="text-align: center;">${item.productName}</td>
            <td style="text-align: center;">${item.quantity} KG</td>
            <td style="text-align: center;">₹${item.price.toFixed(2)}</td>
            <td style="text-align: center;">₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>`
    ).join('');

    const statusBadge = `
        <div class="status-container">
            <span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span>
            ${bill.status === 'CANCELLED' ? 
                `<p class="cancelled-info">Cancelled on ${new Date(bill.cancellationDate).toLocaleDateString()}</p>` : 
                ''
            }
        </div>
    `;

    const detailsHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
            <h3>Bill Details : ${bill.billNumber}</h3>
            <p>Date: ${new Date(bill.date).toLocaleString()}</p>
            ${customerInfo}
            ${statusBadge}
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: center;">Product</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: center;">Price/KG</th>
                        <th style="text-align: center;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                        <td style="text-align: center;"><b>₹${bill.subtotal.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>GST (${bill.gstPercentage}%):</strong></td>
                        <td style="text-align: center;"><b>₹${bill.gstAmount.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
                        <td style="text-align: center;"><b>₹${bill.totalAmount.toFixed(2)}</b></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    let detailsContainer = document.getElementById('bill-details-container');
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.id = 'bill-details-container';
        document.getElementById('report-table').parentNode.appendChild(detailsContainer);
    }
    detailsContainer.innerHTML = detailsHTML;
}

function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    const reportTableBody = document.getElementById('report-table-body');
    reportTableBody.innerHTML = '';

    // Format today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Filter today's bills
    const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.date);
        billDate.setHours(0, 0, 0, 0);
        return billDate.toISOString().split('T')[0] === todayStr;
    });

    // Calculate today's totals
    const todayTotals = todayBills.reduce((acc, bill) => ({
        billCount: acc.billCount + 1,
        totalAmount: acc.totalAmount + (bill.totalAmount || 0),
        subtotal: acc.subtotal + (bill.subtotal || 0),
        gstAmount: acc.gstAmount + (bill.gstAmount || 0)
    }), {
        billCount: 0,
        totalAmount: 0,
        subtotal: 0,
        gstAmount: 0
    });

    // Display today's summary
    const todaySummaryDiv = document.getElementById('today-summary');
    todaySummaryDiv.innerHTML = `
        <h3>Today's Summary (${new Date().toLocaleDateString()})</h3>
        <p>Total Bills: ${todayTotals.billCount}</p>
        <p>Subtotal: ₹${todayTotals.subtotal.toFixed(2)}</p>
        <p>GST Amount: ₹${todayTotals.gstAmount.toFixed(2)}</p>
        <p>Total Sales Amount: ₹${todayTotals.totalAmount.toFixed(2)}</p>
    `;

    let filteredBills = [];

    // Filter bills based on report type
    switch(reportType) {
        case 'daily':
            filteredBills = todayBills;
            break;
        case 'weekly':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            oneWeekAgo.setHours(0, 0, 0, 0);
            filteredBills = bills.filter(bill => new Date(bill.date) >= oneWeekAgo);
            break;
        case 'monthly':
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            oneMonthAgo.setHours(0, 0, 0, 0);
            filteredBills = bills.filter(bill => new Date(bill.date) >= oneMonthAgo);
            break;
        case 'custom':
            if (startDate && endDate) {
                const startDateTime = new Date(startDate);
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= startDateTime && billDate <= endDateTime;
                });
            }
            break;
        default:
            filteredBills = bills;
    }

    // Sort bills by date (newest first)
    filteredBills.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update table headers to include Bill ID
    const reportTable = document.getElementById('report-table');
    reportTable.querySelector('thead').innerHTML = `
        <tr>
            <th style="text-align: center;">Bill Number</th>
            <th style="text-align: center;">Subtotal</th>
            <th style="text-align: center;">GST Amount</th>
            <th style="text-align: center;">Total Amount</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: center;">Action</th>
        </tr>
    `;

    // Populate report table with individual bills
    filteredBills.forEach(bill => {
        const row = reportTableBody.insertRow();
        const billDateTime = new Date(bill.date);
        const statusClass = bill.status === 'CANCELLED' ? 'cancelled-bill' : '';
        
        row.className = statusClass;
        row.innerHTML = `
            <td style="text-align: center;"><b>${bill.billNumber}</b></td>
            <td style="text-align: center;">₹${bill.subtotal.toFixed(2)}</td>
            <td style="text-align: center;">₹${bill.gstAmount.toFixed(2)}</td>
            <td style="text-align: center;"><b>₹${bill.totalAmount.toFixed(2)}</b></td>
            <td style="text-align: center;"><span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span></td>
            <td style="text-align: center;">
                ${bill.status === 'ACTIVE' ? 
                    `<button class="btn btn-danger" onclick="cancelBill(${bill.id})">Cancel Bill</button>` : 
                    `<span class="cancelled-date">Cancelled on ${new Date(bill.cancellationDate).toLocaleDateString()}</span>`
                }
            </td>
        `;
        
        // Make row clickable to show bill details
        row.style.cursor = 'pointer';
        const cells = row.getElementsByTagName('td');
        for (let i = 0; i < cells.length - 1; i++) { // Exclude the action column
            cells[i].onclick = () => showBillDetails(bill);
        }
    });

    
}

// Initialize brands and products list on page load
window.addEventListener('load', () => {
    loadBrandsList();
    loadProductsList('');
    generateReport(); // Automatically generate report on load
});
