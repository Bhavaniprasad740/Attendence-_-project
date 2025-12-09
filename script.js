// --- UTILITY FUNCTIONS ---

// Gets the data from localStorage or initializes it if empty
function getAttendanceRecords() {
    const records = localStorage.getItem('attendanceRecords');
    // Initializes with a dummy admin and user for testing
    if (!records) {
        return {
            'ADMIN001': { id: 'ADMIN001', records: [] }, // Admin placeholder
            'E101': { id: 'E101', records: [] },
            'E102': { id: 'E102', records: [] }
        };
    }
    return JSON.parse(records);
}

// Saves the data to localStorage
function saveAttendanceRecords(records) {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

// Get the currently logged in user ID from session storage
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// --- LOGIN/LOGOUT LOGIC ---

function employeeLogin() {
    const employeeId = document.getElementById('employee-id-input').value.toUpperCase();
    const records = getAttendanceRecords();
    
    // Check if the ID exists (simple check for this project)
    if (records[employeeId]) {
        sessionStorage.setItem('currentUser', employeeId);
        window.location.href = 'employee.html'; // Redirect
    } else {
        alert('Employee ID not found. Please try again or contact Admin.');
    }
}

function adminLogin() {
    const password = document.getElementById('admin-password-input').value;
    // Simple hardcoded check for the project
    if (password === 'admin123') { 
        sessionStorage.setItem('currentUser', 'ADMIN001'); // Use the admin placeholder ID
        window.location.href = 'admin.html'; // Redirect
    } else {
        alert('Invalid Admin Password.');
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// --- EMPLOYEE DASHBOARD LOGIC ---

function initializeEmployeeDashboard() {
    const userId = getCurrentUser();
    if (!userId) {
        logout(); // Kick out if no user logged in
        return;
    }

    // Set welcome message
    document.getElementById('welcome-message').textContent = `Welcome, ${userId}!`;
    
    // Run the automatic checkout check
    checkAutoCheckout(userId);
    
    // Load and display status and history
    displayEmployeeStatus(userId);
    displayEmployeeHistory(userId);
}

// 📌 THE CORE AUTOMATION LOGIC 📌
function checkAutoCheckout(userId) {
    const records = getAttendanceRecords();
    const user = records[userId];

    if (!user || user.records.length === 0) return;

    // Find the latest record
    const latestRecord = user.records[user.records.length - 1];

    // Check if the user is currently checked in (no checkOut time)
    if (latestRecord && !latestRecord.checkOut) {
        const checkInTime = new Date(latestRecord.checkIn).getTime();
        const eightHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const currentTime = new Date().getTime();
        
        // If 8 hours have passed since check in
        if (currentTime > checkInTime + eightHours) {
            
            // Calculate the 8-hour auto-checkout time
            const autoCheckoutTime = new Date(checkInTime + eightHours);

            // Record the auto checkout
            latestRecord.checkOut = autoCheckoutTime.toLocaleString();
            latestRecord.totalHours = 8; // Exactly 8 hours
            
            saveAttendanceRecords(records);
            alert(`You were automatically checked out after 8 hours! Check-Out Time: ${latestRecord.checkOut}`);
        }
    }
}

function displayEmployeeStatus(userId) {
    const records = getAttendanceRecords();
    const user = records[userId];
    const statusEl = document.getElementById('current-status');
    const checkInBtn = document.getElementById('check-in-btn');
    const checkOutBtn = document.getElementById('check-out-btn');

    const latestRecord = user.records[user.records.length - 1];
    
    if (latestRecord && !latestRecord.checkOut) {
        statusEl.textContent = `Status: Checked In since ${latestRecord.checkIn.split(',')[1]}`;
        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;
    } else {
        statusEl.textContent = 'Status: Checked Out';
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
    }
}

function displayEmployeeHistory(userId) {
    const records = getAttendanceRecords();
    const user = records[userId];
    const tbody = document.querySelector('#attendance-table tbody');
    tbody.innerHTML = ''; // Clear existing records

    user.records.slice(-5).reverse().forEach(record => { // Show last 5 records
        const row = tbody.insertRow();
        row.insertCell().textContent = new Date(record.checkIn).toLocaleDateString();
        row.insertCell().textContent = record.checkIn.split(',')[1].trim();
        row.insertCell().textContent = record.checkOut ? record.checkOut.split(',')[1].trim() : 'N/A';
        row.insertCell().textContent = record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : 'N/A';
    });
}

function checkIn() {
    const userId = getCurrentUser();
    const records = getAttendanceRecords();
    
    const newRecord = {
        checkIn: new Date().toLocaleString(),
        checkOut: null,
        totalHours: null
    };

    records[userId].records.push(newRecord);
    saveAttendanceRecords(records);
    
    alert('Checked In successfully!');
    initializeEmployeeDashboard(); // Refresh status and history
}

function checkOut() {
    const userId = getCurrentUser();
    const records = getAttendanceRecords();
    const user = records[userId];

    const latestRecord = user.records[user.records.length - 1];
    
    if (latestRecord && !latestRecord.checkOut) {
        const checkOutTime = new Date();
        const checkInTime = new Date(latestRecord.checkIn);
        
        // Calculate the difference in milliseconds
        const timeDiffMs = checkOutTime.getTime() - checkInTime.getTime();
        // Convert to hours (1000 ms/s * 60 s/m * 60 m/h)
        const totalHours = timeDiffMs / (1000 * 60 * 60);

        latestRecord.checkOut = checkOutTime.toLocaleString();
        latestRecord.totalHours = totalHours;

        saveAttendanceRecords(records);
        alert(`Checked Out successfully! Total time: ${totalHours.toFixed(2)} hours.`);
    } else {
        alert('You are not currently checked in.');
    }
    initializeEmployeeDashboard(); // Refresh status and history
}

// --- ADMIN DASHBOARD LOGIC ---

function initializeAdminDashboard() {
    const userId = getCurrentUser();``
    if (userId !== 'ADMIN001') {
        alert('Access Denied. Redirecting to login.');
        logout();
        return;
    }
    displayAllRecords();
}

function displayAllRecords() {
    const records = getAttendanceRecords();
    const tbody = document.querySelector('#admin-attendance-table tbody');
    tbody.innerHTML = ''; // Clear existing records

    for (const userId in records) {
        // Skip the admin entry itself if it has no real attendance records
        if (userId === 'ADMIN001') continue; 

        records[userId].records.forEach(record => {
            const row = tbody.insertRow();
            row.insertCell().textContent = userId;
            row.insertCell().textContent = new Date(record.checkIn).toLocaleDateString();
            row.insertCell().textContent = record.checkIn.split(',')[1].trim();
            row.insertCell().textContent = record.checkOut ? record.checkOut.split(',')[1].trim() : 'N/A';
            row.insertCell().textContent = record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : 'N/A';
        });
    }
}