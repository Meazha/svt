// Admin password - in a real application, this should be handled securely on a server
const ADMIN_PASSWORD = "123"; // Change this to your desired password

// Check if already logged in
window.onload = function() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminPanel();
        loadBills();
        initStaffStorage();
    }
};

// Function to show sections including staff management
function showSection(section) {
    const dataManagement = document.getElementById('data-management-section');
    const billRecords = document.getElementById('bill-records-section');
    const staffManagement = document.getElementById('staff-management-section');

    dataManagement.style.display = section === 'data-management' ? 'block' : 'none';
    billRecords.style.display = section === 'bill-records' ? 'block' : 'none';
    staffManagement.style.display = section === 'staff-management' ? 'block' : 'none';

    if (section === 'staff-management') {
        loadStaffList();
    }
}

// Initialize staff storage
function initStaffStorage() {
    if (!localStorage.getItem('staff')) {
        localStorage.setItem('staff', JSON.stringify([]));
    }
}

// Add new staff
function addStaff() {
    const name = document.getElementById('staff-name').value.trim();
    const mobile = document.getElementById('staff-mobile').value.trim();
    const role = document.getElementById('staff-role').value.trim();

    if (!name || !mobile || !role) {
        alert('Please fill in all fields');
        return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        alert('Please enter a valid 10-digit mobile number');
        return;
    }
    const staff = JSON.parse(localStorage.getItem('staff')) || [];
    
    const newStaff = {
        id: Date.now(),
        name,
        mobile,
        role
    };

    staff.push(newStaff);
    localStorage.setItem('staff', JSON.stringify(staff));

    // Clear form
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-mobile').value = '';
    document.getElementById('staff-role').value = '';

    loadStaffList();
    alert('Staff added successfully!');
}

// Load staff list
function loadStaffList() {
    const staff = JSON.parse(localStorage.getItem('staff')) || [];
    const tableBody = document.getElementById('staff-table-body');
    tableBody.innerHTML = '';

    staff.forEach(member => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.mobile}</td>
            <td>${member.role}</td>
            <td>
                <button class="btn btn-primary" onclick="editStaff(${member.id})">
                    <i class="icon">✎</i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteStaff(${member.id})">
                    <i class="icon">×</i> Delete
                </button>
            </td>
        `;
    });
}

// Edit staff
function editStaff(staffId) {
    const staff = JSON.parse(localStorage.getItem('staff')) || [];
    const member = staff.find(s => s.id === staffId);
    
    if (!member) return;

    document.getElementById('staff-name').value = member.name;
    document.getElementById('staff-mobile').value = member.mobile;
    document.getElementById('staff-role').value = member.role;

    const addButton = document.querySelector('button[onclick="addStaff()"]');
    addButton.innerHTML = '<i class="icon">✓</i> Update Staff';
    addButton.onclick = () => updateStaff(staffId);
}

// Update staff
function updateStaff(staffId) {
    const name = document.getElementById('staff-name').value.trim();
    const mobile = document.getElementById('staff-mobile').value.trim();
    const role = document.getElementById('staff-role').value.trim();

    if (!name || !mobile || !role) {
        alert('Please fill in all fields');
        return;
    }

    const staff = JSON.parse(localStorage.getItem('staff')) || [];
    const staffIndex = staff.findIndex(s => s.id === staffId);
    
    if (staffIndex === -1) return;

    staff[staffIndex] = {
        ...staff[staffIndex],
        name,
        mobile,
        role
    };

    localStorage.setItem('staff', JSON.stringify(staff));

    // Reset form and button
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-mobile').value = '';
    document.getElementById('staff-role').value = '';

    const updateButton = document.querySelector('button[onclick*="updateStaff"]');
    updateButton.innerHTML = '<i class="icon">+</i> Add Staff';
    updateButton.onclick = addStaff;

    loadStaffList();
    alert('Staff updated successfully!');
}

// Delete staff
function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) {
        return;
    }

    const staff = JSON.parse(localStorage.getItem('staff')) || [];
    const filteredStaff = staff.filter(s => s.id !== staffId);
    localStorage.setItem('staff', JSON.stringify(filteredStaff));
    loadStaffList();
}

function resetBillNumber() {
    if (confirm('Are you sure you want to reset the bill number to 1? This action cannot be undone!')) {
        localStorage.setItem('currentBillNumber', '1');
        alert('Bill number has been reset to 1');
    }
}


// Show Bill Records by default on page load
window.onload = function () {
    showSection('bill-records');
};

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

function validateStorageData(data) {
    try {
        if (!Array.isArray(data.brands) || !Array.isArray(data.products) || !Array.isArray(data.bills)) {
            return false;
        }
        
        // Validate brands structure
        if (!data.brands.every(brand => 
            typeof brand.id === 'number' && 
            typeof brand.name === 'string' &&
            (!brand.description || typeof brand.description === 'string')
        )) {
            return false;
        }

        // Validate products structure
        if (!data.products.every(product => 
            typeof product.id === 'number' &&
            typeof product.brandId === 'string' &&
            typeof product.name === 'string' &&
            typeof product.price === 'number'
        )) {
            return false;
        }

        // Validate bills structure
        if (!data.bills.every(bill => 
            typeof bill.id === 'number' &&
            typeof bill.billNumber === 'number' &&
            typeof bill.date === 'string' &&
            Array.isArray(bill.items) &&
            typeof bill.subtotal === 'number' &&
            typeof bill.totalAmount === 'number'
        )) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Data validation error:', error);
        return false;
    }
}

function safeGetStorageData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return defaultValue;
    }
}

function safeSetStorageData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error);
        return false;
    }
}

function validateLogin() {
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        loadBills();
    } else {
        alert('Invalid password!');
    }
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

function showAdminPanel() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'block';
}

function loadBills() {
    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    displayBills(bills);
}

function displayBills(bills) {
    const container = document.getElementById('bills-container');
    container.innerHTML = '';

    if (bills.length === 0) {
        container.innerHTML = '<p>No bills found.</p>';
        return;
    }

    // Sort bills by date (newest first)
    bills.sort((a, b) => new Date(b.date) - new Date(a.date));

    bills.forEach(bill => {
        const billElement = createBillElement(bill);
        container.appendChild(billElement);
    });
}

function createBillElement(bill) {
    const billDiv = document.createElement('div');
    billDiv.className = `bill-details ${bill.status === 'CANCELLED' ? 'cancelled-bill' : ''}`;

    const date = new Date(bill.date).toLocaleDateString();
    const time = new Date(bill.date).toLocaleTimeString();

    billDiv.innerHTML = `
        <div class="bill-header">
            <div>
                <strong>Bill No: ${bill.billNumber || 'N/A'}</strong>
                <br>
                <strong>Date:</strong> ${date}
                <strong>Time:</strong> ${time}
                <br>
                <strong>Customer:</strong> ${bill.customer?.name || 'N/A'}
                <br>
                <strong>Mobile:</strong> ${bill.customer?.mobile || 'N/A'}
                <br>
                <strong>Address:</strong> ${bill.customer?.address || 'N/A'}
                <br>
                <strong>Staff:</strong> ${bill.staff?.name || 'N/A'} (${bill.staff?.role || 'N/A'})
                <br>
                <span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span>
                ${bill.status === 'CANCELLED' ? 
                    `<br><span class="cancelled-date">Cancelled on ${new Date(bill.cancellationDate).toLocaleDateString()}</span>` : 
                    ''
                }
            </div>
            <div>
                ${bill.status === 'ACTIVE' ? 
                    `<button class="btn btn-danger" onclick="cancelBill(${bill.id})">Cancel Bill</button>` : 
                    ''
                }
                <button class="expand-btn" onclick="toggleBillDetails(${bill.id})">Show ▼</button>
            </div>
        </div>
        <div class="bill-totals">
            <p><strong>Subtotal:</strong> ₹${bill.subtotal.toFixed(2)}</p>
            <p><strong>GST (${bill.gstPercentage}%):</strong> ₹${bill.gstAmount.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> ₹${bill.totalAmount.toFixed(2)}</p>
        </div>
        <table class="bill-items-table" id="bill-items-${bill.id}">
            <thead>
                <tr>
                    <th style="text-align: center;">Product</th>
                    <th style="text-align: center;">Quantity (KG)</th>
                    <th style="text-align: center;">Price/KG</th>
                    <th style="text-align: center;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${bill.items.map(item => `
                    <tr>
                        <td style="text-align: center;"><strong>${item.brandName || ''}</strong> - ${item.productName}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: center;">₹${item.price.toFixed(2)}</td>
                        <td style="text-align: center;">₹${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    return billDiv;
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
        loadBills(); // Refresh the bills list
    }
}

function toggleBillDetails(billId) {
    const itemsTable = document.getElementById(`bill-items-${billId}`);
    const expandBtn = itemsTable.parentElement.querySelector('.expand-btn');
    
    if (itemsTable.style.display === 'none' || !itemsTable.style.display) {
        itemsTable.style.display = 'table';
        expandBtn.textContent = 'Hide ▲';
    } else {
        itemsTable.style.display = 'none';
        expandBtn.textContent = 'Show ▼';
    }
}

function applyFilters() {
    const dateFilter = document.getElementById('filter-date').value;
    const billNumberFilter = document.getElementById('filter-billnumber').value;
    const amountFilter = document.getElementById('filter-amount').value;

    let bills = JSON.parse(localStorage.getItem('bills')) || [];

    // Apply date filter
    if (dateFilter) {
        bills = bills.filter(bill => {
            const billDate = new Date(bill.date).toISOString().split('T')[0];
            return billDate === dateFilter;
        });
    }

    // Apply bill number filter
    if (billNumberFilter) {
        bills = bills.filter(bill => 
            bill.billNumber.toString() === billNumberFilter
        );
    }

    // Apply amount filter
    if (amountFilter) {
        bills = bills.filter(bill => {
            const amount = bill.totalAmount;
            switch(amountFilter) {
                case '0-1000':
                    return amount <= 1000;
                case '1000-5000':
                    return amount > 1000 && amount <= 5000;
                case '5000+':
                    return amount > 5000;
                default:
                    return true;
            }
        });
    }

    displayBills(bills);
}

function backupData() {
    try {
        const backup = {
            brands: JSON.parse(localStorage.getItem('brands')) || [],
            products: JSON.parse(localStorage.getItem('products')) || [],
            bills: JSON.parse(localStorage.getItem('bills')) || [],
            staff: JSON.parse(localStorage.getItem('staff')) || [],
            currentBillNumber: parseInt(localStorage.getItem('currentBillNumber')) || 1,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        // Create a JSON string of the backup data
        const backupString = JSON.stringify(backup, null, 2);

        // Create a downloadable JSON file
        const blob = new Blob([backupString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;

        // Trigger the download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Backup created successfully!');
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Failed to create backup. Please try again.');
    }
}

// Improved restore function
function restoreData(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected.');
        return;
    }

    if (file.type !== 'application/json') {
        alert('Please select a valid JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validate the backup structure
            if (!backup.version || !backup.timestamp || !backup.brands || !backup.products || !backup.bills || !backup.staff) {
                throw new Error('Invalid backup file format.');
            }

            // Confirm restoration
            if (confirm('This will replace all current data. Are you sure you want to proceed?')) {
                localStorage.setItem('brands', JSON.stringify(backup.brands));
                localStorage.setItem('products', JSON.stringify(backup.products));
                localStorage.setItem('bills', JSON.stringify(backup.bills));
                localStorage.setItem('staff', JSON.stringify(backup.staff));
                localStorage.setItem('currentBillNumber', backup.currentBillNumber.toString());

                alert('Data restored successfully! The page will now reload.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error restoring data:', error);
            alert('Failed to restore data. Please ensure the backup file is valid.');
        }
    };

    reader.readAsText(file);
}

// Improved clear data function
function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        return;
    }

    try {
        // Backup current data before clearing
        const backupBeforeClear = {
            brands: JSON.parse(localStorage.getItem('brands')) || [],
            products: JSON.parse(localStorage.getItem('products')) || [],
            bills: JSON.parse(localStorage.getItem('bills')) || [],
            staff: JSON.parse(localStorage.getItem('staff')) || [],
            currentBillNumber: parseInt(localStorage.getItem('currentBillNumber')) || 1,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        // Save backup in sessionStorage for recovery in case of errors
        sessionStorage.setItem('clearBackup', JSON.stringify(backupBeforeClear));

        // Clear all relevant data
        localStorage.removeItem('brands');
        localStorage.removeItem('products');
        localStorage.removeItem('bills');
        localStorage.removeItem('staff');
        localStorage.removeItem('currentBillNumber');

        alert('All data cleared successfully! The page will now reload.');
        window.location.reload();
    } catch (error) {
        console.error('Clear data failed:', error);
        alert('Failed to clear data. Please try again.');

        // Attempt to recover data from sessionStorage backup
        try {
            const recoveryData = JSON.parse(sessionStorage.getItem('clearBackup'));
            if (recoveryData) {
                localStorage.setItem('brands', JSON.stringify(recoveryData.brands));
                localStorage.setItem('products', JSON.stringify(recoveryData.products));
                localStorage.setItem('bills', JSON.stringify(recoveryData.bills));
                localStorage.setItem('staff', JSON.stringify(recoveryData.staff));
                localStorage.setItem('currentBillNumber', recoveryData.currentBillNumber.toString());
            }
            alert('Data has been recovered from the last backup.');
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            alert('Critical error: Please contact support.');
        }
    }
}

function clearFilters() {
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-billnumber').value = '';
    document.getElementById('filter-amount').value = '';
    loadBills();
}
