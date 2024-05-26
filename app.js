document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const propertyForm = document.getElementById('propertyForm');
    const filtersForm = document.getElementById('filters');

    let currentPage = 1;
    const propertiesContainer = document.getElementById('properties');
    const paginationContainer = document.getElementById('pagination');

    const loadProperties = async (page = 1) => {
        const formData = new FormData(filtersForm);
        const params = new URLSearchParams(formData);
        params.append('page', page);
        const response = await fetch(`/api/properties?${params.toString()}`);
        const { properties, total, limit } = await response.json();
        propertiesContainer.innerHTML = properties.map(property => `
            <div class="property">
                <h3>${property.place}</h3>
                <p>${property.area} sq ft, ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms</p>
                <p>Price: $${property.price}</p>
                <button class="like-button" data-id="${property.id}">Like</button>
                <button class="interest-button" data-seller="${property.seller}" data-id="${property.id}">I'm Interested</button>
            </div>
        `).join('');
        renderPagination(total, limit, page);

        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const propertyId = e.target.getAttribute('data-id');
                const response = await fetch('/api/like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ propertyId })
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Property liked! Total likes: ${result.likes}`);
                } else {
                    alert('Failed to like property');
                }
            });
        });

        document.querySelectorAll('.interest-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const sellerEmail = e.target.getAttribute('data-seller');
                const propertyId = e.target.getAttribute('data-id');
                const response = await fetch('/api/seller-details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sellerEmail })
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Seller Details: ${result.details}`);
                    await fetch('/api/interest', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ sellerEmail, propertyId })
                    });
                } else {
                    alert(result.message);
                    window.location.href = 'login.html';
                }
            });
        });
    };

    const renderPagination = (total, limit, currentPage) => {
        const totalPages = Math.ceil(total / limit);
        paginationContainer.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} onclick="loadProperties(${currentPage - 1})">Previous</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button ${currentPage === totalPages ? 'disabled' : ''} onclick="loadProperties(${currentPage + 1})">Next</button>
        `;
    };

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            alert(result.message);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const response = await fetch('/api/login', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                window.location.href = 'view_properties.html';
            } else {
                alert(result.message);
            }
        });
    }

    if (propertyForm) {
        propertyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(propertyForm);
            const response = await fetch('/api/properties', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            alert(result.message);
        });
    }

    if (filtersForm) {
        filtersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadProperties(1);
        });
    }

    loadProperties();
});
