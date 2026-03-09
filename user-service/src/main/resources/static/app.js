// API Configuration
const API_BASE_URL = 'http://localhost:8081/auth';

// Utility functions
function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Register Page
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            patientName: document.getElementById('patientName').value,
            email: document.getElementById('email').value,
            passwordHash: document.getElementById('password').value,
            contactNumber: document.getElementById('contactNumber').value,
            age: document.getElementById('age').value,
            role: document.getElementById('role').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const data = await response.json();
                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                const error = await response.text();
                showMessage(error || 'Registration failed', 'error');
            }
        } catch (error) {
            showMessage('Error connecting to server: ' + error.message, 'error');
        }
    });
}

// Login Page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify({
                    id: data.userId,
                    email: data.email,
                    role: data.role
                }));
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                const error = await response.text();
                showMessage(error || 'Login failed', 'error');
            }
        } catch (error) {
            showMessage('Error connecting to server: ' + error.message, 'error');
        }
    });
}

// Dashboard Page
if (document.getElementById('logoutBtn')) {
    // Check authentication
    const token = getToken();
    const userData = getUserData();
    
    if (!token || !userData) {
        window.location.href = 'login.html';
    }
    
    // Set welcome message
    document.getElementById('welcomeMessage').textContent = 
        `Welcome, ${userData.email}! (${userData.role})`;
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            if (tabName === 'users') {
                loadUsers();
            } else if (tabName === 'profile') {
                loadProfile();
            }
        });
    });
    
    // Load users function
    async function loadUsers() {
        const loading = document.getElementById('usersLoading');
        const container = document.getElementById('usersContainer');
        const tbody = document.getElementById('usersTableBody');
        
        loading.style.display = 'block';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                tbody.innerHTML = '';
                
                users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${user.patientName}</td>
                        <td>${user.email}</td>
                        <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
                        <td>${user.contactNumber}</td>
                        <td>${user.age}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editUser('${user.id}')">Edit</button>
                            ${userData.role === 'ADMIN' ? 
                                `<button class="btn btn-danger" onclick="deleteUser('${user.id}')" style="margin-left: 5px;">Delete</button>` 
                                : ''}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                loading.style.display = 'none';
                container.style.display = 'block';
            } else if (response.status === 403) {
                showMessage('Access denied. You do not have permission to view users.', 'error');
                loading.style.display = 'none';
            } else {
                throw new Error('Failed to load users');
            }
        } catch (error) {
            showMessage('Error loading users: ' + error.message, 'error');
            loading.style.display = 'none';
        }
    }
    
    // Load profile function
    async function loadProfile() {
        const loading = document.getElementById('profileLoading');
        const container = document.getElementById('profileContainer');
        const userData = getUserData();
        
        loading.style.display = 'block';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`${API_BASE_URL}/profile?email=${userData.email}`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            
            if (response.ok) {
                const profile = await response.json();
                
                document.getElementById('profileId').value = profile.id;
                document.getElementById('profilePasswordHash').value = profile.passwordHash;
                document.getElementById('profileName').value = profile.patientName;
                document.getElementById('profileEmail').value = profile.email;
                document.getElementById('profileContact').value = profile.contactNumber;
                document.getElementById('profileAge').value = profile.age;
                document.getElementById('profileRole').value = profile.role;
                
                loading.style.display = 'none';
                container.style.display = 'block';
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            showMessage('Error loading profile: ' + error.message, 'error');
            loading.style.display = 'none';
        }
    }
    
    // Update profile form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = document.getElementById('profileId').value;
        const profileData = {
            id: userId,
            patientName: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            passwordHash: document.getElementById('profilePasswordHash').value,
            contactNumber: document.getElementById('profileContact').value,
            age: document.getElementById('profileAge').value,
            role: document.getElementById('profileRole').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
                showMessage('Profile updated successfully!', 'success');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            showMessage('Error updating profile: ' + error.message, 'error');
        }
    });
    
    // Refresh users button
    document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
    
    // Load users on page load
    loadUsers();
    
    // Modal functionality
    const modal = document.getElementById('editModal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    // Edit user form
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = document.getElementById('editUserId').value;
        const userData = {
            id: userId,
            patientName: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            passwordHash: document.getElementById('editPasswordHash').value,
            contactNumber: document.getElementById('editContact').value,
            age: document.getElementById('editAge').value,
            role: document.getElementById('editRole').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                showMessage('User updated successfully!', 'success');
                modal.style.display = 'none';
                loadUsers();
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            showMessage('Error updating user: ' + error.message, 'error');
        }
    });
}

// Global functions for edit and delete
async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editPasswordHash').value = user.passwordHash;
            document.getElementById('editName').value = user.patientName;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editContact').value = user.contactNumber;
            document.getElementById('editAge').value = user.age;
            document.getElementById('editRole').value = user.role;
            
            document.getElementById('editModal').style.display = 'block';
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        showMessage('Error loading user: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            showMessage('User deleted successfully!', 'success');
            // Reload users list
            if (typeof loadUsers !== 'undefined') {
                window.location.reload();
            }
        } else if (response.status === 403) {
            showMessage('Access denied. Only admins can delete users.', 'error');
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        showMessage('Error deleting user: ' + error.message, 'error');
    }
}
