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

function getCurrentBillNumber() {
    return parseInt(localStorage.getItem('currentBillNumber')) || 1;
}

function incrementBillNumber() {
    const nextNumber = getCurrentBillNumber() + 1;
    localStorage.setItem('currentBillNumber', nextNumber);
    return nextNumber - 1; // Return the current number before increment
}

function loadStaffDropdown() {
    const staffSelect = document.getElementById('staff-select');
    staffSelect.innerHTML = '<option value="">Select Staff</option>'; // Clear existing options

    const staffList = JSON.parse(localStorage.getItem('staff')) || [];
    staffList.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id; // Use staff ID as the value
        option.textContent = `${staff.name} (${staff.role})`;
        staffSelect.appendChild(option);
    });
}

// Navigation
function showSection(sectionName) {
    const sections = ['products', 'billing', 'reports'];
    sections.forEach(section => {
        const sectionElement = document.getElementById(`${section}-section`);
        sectionElement.style.display = section === sectionName ? 'block' : 'none';
    });

    // Refresh data when switching sections
    if (sectionName === 'products') loadProductsList();
    if (sectionName === 'billing') loadBrandsList();
    if (sectionName === 'reports') generateReport();
}

// Show the Billing section by default on page load
window.onload = function () {
    loadStaffDropdown();
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
    try {
        // Get the input values
        const brandName = document.getElementById('brand-name').value.trim();
        const brandDescription = document.getElementById('brand-description').value.trim();

        // Validate inputs
        if (!brandName) {
            alert('Please enter a brand name.');
            return;
        }

        // Fetch the existing brands from localStorage or initialize an empty array
        const brands = JSON.parse(localStorage.getItem('brands')) || [];

        // Create a new brand object
        const newBrand = {
            id: Date.now(), // Unique ID based on timestamp
            name: brandName,
            description: brandDescription || ''
        };

        // Add the new brand to the list
        brands.push(newBrand);

        // Save the updated brands list to localStorage
        localStorage.setItem('brands', JSON.stringify(brands));

        // Clear the input fields
        document.getElementById('brand-name').value = '';
        document.getElementById('brand-description').value = '';

        // Refresh the brand list
        loadBrandsList();

        alert('Brand added successfully!');
    } catch (error) {
        console.error('Error adding brand:', error);
        alert('Failed to add the brand. Please try again.');
    }
}

// Product Management
function addProduct() {
    const brandSelect = document.getElementById('product-brand');
    const productName = document.getElementById('product-name').value.trim();
    const productPrice = parseFloat(document.getElementById('product-price').value);
    const brandId = brandSelect.value;

    if (!brandId || !productName || isNaN(productPrice) || productPrice <= 0) {
        alert('Please fill all product details correctly.');
        return;
    }

    // Fetch existing products from localStorage
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const newProduct = {
        id: Date.now(),
        brandId: brandId,
        name: productName,
        price: productPrice
    };

    // Add the new product to the list
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));

    // Clear input fields
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';

    // Reapply the filter for the selected brand
    filterProductsByBrand();
}

function loadBrandsList() {
    try {
        const brands = JSON.parse(localStorage.getItem('brands')) || [];
        const brandSelects = [
            document.getElementById('product-brand'),
            document.getElementById('billing-brand')
        ];

        // Clear existing options
        brandSelects.forEach(select => {
            select.innerHTML = '<option value="">Select Brand</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading brands:', error);
    }
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
    const transportCharges = parseFloat(document.getElementById('transport-charges').value) || 0;
    const extraCharges = parseFloat(document.getElementById('extra-charges').value) || 0;
    
    const gstAmount = subtotal * (gstPercentage / 100);
    const grandTotal = subtotal + gstAmount + transportCharges + extraCharges;

    document.getElementById('bill-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('gst-amount').textContent = gstAmount.toFixed(2);
    document.getElementById('transport-amount').textContent = transportCharges.toFixed(2);
    document.getElementById('extra-amount').textContent = extraCharges.toFixed(2);
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

    const staffId = document.getElementById('staff-select').value;
    if (!staffId) {
        alert('Please select a staff member');
        return;
    }

    const staffList = JSON.parse(localStorage.getItem('staff')) || [];
    const staff = staffList.find(s => s.id == staffId);

    const billNumber = incrementBillNumber();
    const subtotal = currentBillItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const gstPercentage = parseFloat(document.getElementById('gst-percentage').value) || 0;
    const transportCharges = parseFloat(document.getElementById('transport-charges').value) || 0;
    const extraCharges = parseFloat(document.getElementById('extra-charges').value) || 0;
    
    const gstAmount = subtotal * (gstPercentage / 100);
    const grandTotal = subtotal + gstAmount + transportCharges + extraCharges;

    const bill = {
        id: Date.now(),
        billNumber: billNumber,
        date: new Date().toISOString(),
        customer: customerInfo,
        staff: staff,
        items: currentBillItems.map(item => ({
            ...item,
            itemTotal: item.quantity * item.price
        })),
        subtotal: subtotal,
        gstPercentage: gstPercentage,
        gstAmount: gstAmount,
        transportCharges: transportCharges,
        extraCharges: extraCharges,
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
    document.getElementById('staff-select').value = '';
    document.getElementById('transport-charges').value = '0';
    document.getElementById('extra-charges').value = '0';
    document.getElementById('gst-percentage').value = '0';
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

function generateProfessionalBillPDF(bill) {
    const template = `
        <div id="bill-pdf-content" style="padding: 20px; font-family: 'Arial', sans-serif; width: 210mm; margin: auto;">
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 24px; margin: 0; font-weight: bold; color: #000;">SRI VINAYAGA TRADERS</h1>
                <p style="margin: 5px 0; font-size: 14px;">123 Main Street, First Floor</p>
                <p style="margin: 5px 0; font-size: 14px;">City Name, State - PIN Code</p>
                <p style="margin: 5px 0; font-size: 14px;">Phone: +91 1234567890, +91 9876543210</p>
                <p style="margin: 5px 0; font-size: 14px;">Email: info@srivinayagatraders.com</p>
            </div>

            <!-- Bill Info Section -->
            <div style="margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 10px;">
                <table style="width: 100%; font-size: 14px;">
                    <tr>
                        <td style="width: 50%;">
                            <strong>Bill No:</strong> ${bill.billNumber}
                        </td>
                        <td style="width: 50%; text-align: right;">
                            <strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Time:</strong> ${new Date(bill.date).toLocaleTimeString()}
                        </td>
                        <td style="text-align: right;">
                            <strong>Mode of Payment:</strong> CASH
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Customer & Staff Details -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                <div style="width: 48%; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Customer Details</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${bill.customer.name}</p>
                    <p style="margin: 5px 0;"><strong>Mobile:</strong> ${bill.customer.mobile}</p>
                    <p style="margin: 5px 0;"><strong>Address:</strong> ${bill.customer.address}</p>
                </div>
                <div style="width: 48%; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Staff Details</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${bill.staff.name}</p>
                    <p style="margin: 5px 0;"><strong>Role:</strong> ${bill.staff.role}</p>
                    <p style="margin: 5px 0;"><strong>ID:</strong> ${bill.staff.id}</p>
                </div>
            </div>

            <!-- Products Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">S.No</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Brand</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Product</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Quantity (KG)</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Price/KG</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map((item, index) => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${index + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 12px;">${item.brandName}</td>
                            <td style="border: 1px solid #ddd; padding: 12px;">${item.productName}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${item.price.toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Bill Summary -->
            <div style="width: 100%; display: flex; justify-content: flex-end; margin-bottom: 30px; font-size: 14px;">
                <table style="width: 300px;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Sub Total:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">₹${bill.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>GST (${bill.gstPercentage}%):</strong></td>
                        <td style="text-align: right; padding: 8px 0;">₹${bill.gstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Transport Charges:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">₹${(bill.transportCharges || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Extra Charges:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">₹${(bill.extraCharges || 0).toFixed(2)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #000;">
                        <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                        <td style="text-align: right; padding: 8px 0;"><strong>₹${bill.totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 50px; font-size: 14px;">
                <div style="float: left; width: 50%;">
                    <p><strong>Terms & Conditions:</strong></p>
                    <ol style="margin: 5px 0; padding-left: 20px; font-size: 12px;">
                        <li>Goods once sold will not be taken back</li>
                        <li>Subject to local jurisdiction</li>
                        <li>E. & O.E.</li>
                    </ol>
                </div>
                <div style="float: right; width: 200px; text-align: center;">
                    <div style="margin-bottom: 40px;">
                        <p style="margin-bottom: 50px;">____________________</p>
                        <p style="margin: 0;"><strong>Authorized Signature</strong></p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = template;
    document.body.appendChild(container);

    // PDF options
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Bill-${bill.billNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
        }
    };

    // Generate PDF
    html2pdf().from(container).set(opt).save()
        .then(() => {
            document.body.removeChild(container);
        });
}

function showBillDetails(bill) {
    const customerInfo = `
        <div class="customer-details">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${bill.customer?.name || 'N/A'}</p>
            <p><strong>Mobile:</strong> ${bill.customer?.mobile || 'N/A'}</p>
            <p><strong>Address:</strong> ${bill.customer?.address || 'N/A'}</p>
        </div>
    `;

    const staffInfo = `
        <div class="staff-details">
            <h4>Staff Information</h4>
            <p><strong>Staff:</strong> ${bill.staff?.name || 'N/A'} (${bill.staff?.role || 'N/A'})</p>
        </div>
    `;

    const itemsList = bill.items.map(item =>
        `<tr>
            <td style="text-align: center;">${item.productName}</td>
            <td style="text-align: center;">${item.quantity} KG</td>
            <td style="text-align: center;">₹${item.price.toFixed(2)}</td>
            <td style="text-align: center;">₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>`
    ).join('');

    // Adding status information
    const statusInfo = `
        <div class="status-container">
            <p><strong>Status:</strong> 
                <span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span>
                ${bill.status === 'CANCELLED' ? 
                    `<span class="cancelled-info">(Cancelled on ${new Date(bill.cancellationDate).toLocaleDateString()})</span>` 
                    : ''}
            </p>
        </div>
    `;

    const detailsHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
            <h3>Bill Details: #${bill.billNumber}</h3>
            <p>Date: ${new Date(bill.date).toLocaleString()}</p>
            ${statusInfo}
            ${customerInfo}
            ${staffInfo}
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
                        <td colspan="3" style="text-align: right;"><strong>Transport Charges:</strong></td>
                        <td style="text-align: center;"><b>₹${(bill.transportCharges || 0).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Extra Charges:</strong></td>
                        <td style="text-align: center;"><b>₹${(bill.extraCharges || 0).toFixed(2)}</b></td>
                    </tr>
                    <tr class="total-amount">
                        <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
                        <td style="text-align: center;"><b>₹${bill.totalAmount.toFixed(2)}</b></td>
                    </tr>
                </tfoot>
            </table>
            
            <!-- Additional Charges Details -->
            ${(bill.transportCharges || bill.extraCharges) ? `
                <div class="additional-charges-details" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    <h4 style="margin-bottom: 10px;">Additional Charges Breakdown</h4>
                    ${bill.transportCharges ? `
                        <p><strong>Transport Charges:</strong> ₹${bill.transportCharges.toFixed(2)}</p>
                    ` : ''}
                    ${bill.extraCharges ? `
                        <p><strong>Extra Charges:</strong> ₹${bill.extraCharges.toFixed(2)}</p>
                    ` : ''}
                </div>
            ` : ''}
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

    // Calculate today's totals with new charges
    const todayTotals = todayBills.reduce((acc, bill) => ({
        billCount: acc.billCount + 1,
        totalAmount: acc.totalAmount + (bill.totalAmount || 0),
        subtotal: acc.subtotal + (bill.subtotal || 0),
        gstAmount: acc.gstAmount + (bill.gstAmount || 0),
        transportCharges: acc.transportCharges + (bill.transportCharges || 0),
        extraCharges: acc.extraCharges + (bill.extraCharges || 0)
    }), {
        billCount: 0,
        totalAmount: 0,
        subtotal: 0,
        gstAmount: 0,
        transportCharges: 0,
        extraCharges: 0
    });

    // Display today's summary with new charges
    const todaySummaryDiv = document.getElementById('today-summary');
    todaySummaryDiv.innerHTML = `
        <h3>Today's Summary (${new Date().toLocaleDateString()})</h3>
        <p>Total Bills: ${todayTotals.billCount}</p>
        <p>Subtotal: ₹${todayTotals.subtotal.toFixed(2)}</p>
        <p>GST Amount: ₹${todayTotals.gstAmount.toFixed(2)}</p>
        <p>Transport Charges: ₹${(todayTotals.transportCharges || 0).toFixed(2)}</p>
        <p>Extra Charges: ₹${(todayTotals.extraCharges || 0).toFixed(2)}</p>
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

    // Update table headers to include new columns
    const reportTable = document.getElementById('report-table');
    reportTable.querySelector('thead').innerHTML = `
        <tr>
            <th style="text-align: center;">Bill Number</th>
            <th style="text-align: center;">Subtotal</th>
            <th style="text-align: center;">GST Amount</th>
            <th style="text-align: center;">Transport</th>
            <th style="text-align: center;">Extra</th>
            <th style="text-align: center;">Total Amount</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: center;">Action</th>
        </tr>
    `;

    // Populate report table with individual bills
    filteredBills.forEach(bill => {
        const row = reportTableBody.insertRow();
        const statusClass = bill.status === 'CANCELLED' ? 'cancelled-bill' : '';
        
        row.className = statusClass;
        row.innerHTML = `
            <td style="text-align: center;"><b>${bill.billNumber}</b></td>
            <td style="text-align: center;">₹${bill.subtotal.toFixed(2)}</td>
            <td style="text-align: center;">₹${bill.gstAmount.toFixed(2)}</td>
            <td style="text-align: center;">₹${(bill.transportCharges || 0).toFixed(2)}</td>
            <td style="text-align: center;">₹${(bill.extraCharges || 0).toFixed(2)}</td>
            <td style="text-align: center;"><b>₹${bill.totalAmount.toFixed(2)}</b></td>
            <td style="text-align: center;"><span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span></td>
            <td style="text-align: center;">
            ${bill.status === 'ACTIVE' ? 
                `<button class="btn btn-danger" onclick="cancelBill(${bill.id})">Cancel</button>` : 
                `<span class="cancelled-date">Cancelled on ${new Date(bill.cancellationDate).toLocaleDateString()}</span>`
            }
            <button class="btn btn-primary" onclick="generateProfessionalBillPDF(${JSON.stringify(bill).replace(/"/g, '&quot;')})">
                <i class="icon">📄</i> Download Bill
            </button>
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
