const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Dummy Database
const users = [];
const properties = [];
const propertyLikes = {};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password'
    }
});

// Register Endpoint
app.post('/api/register', (req, res) => {
    const { first_name, last_name, email, phone, user_type, password } = req.body;
    users.push({ first_name, last_name, email, phone, user_type, password });
    res.json({ message: 'User registered successfully' });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        req.session.user = user;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Add Property Endpoint
app.post('/api/properties', (req, res) => {
    if (!req.session.user || req.session.user.user_type !== 'seller') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const property = { ...req.body, seller: req.session.user.email };
    properties.push(property);
    res.json({ message: 'Property posted successfully' });
});

// View Properties with Filters and Pagination Endpoint
app.get('/api/properties', (req, res) => {
    const { place, area, bedrooms, bathrooms, price_min, price_max, page = 1, limit = 10 } = req.query;
    let filteredProperties = properties;

    if (place) filteredProperties = filteredProperties.filter(p => p.place.includes(place));
    if (area) filteredProperties = filteredProperties.filter(p => p.area.includes(area));
    if (bedrooms) filteredProperties = filteredProperties.filter(p => p.bedrooms == bedrooms);
    if (bathrooms) filteredProperties = filteredProperties.filter(p => p.bathrooms == bathrooms);
    if (price_min) filteredProperties = filteredProperties.filter(p => p.price >= price_min);
    if (price_max) filteredProperties = filteredProperties.filter(p => p.price <= price_max);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    res.json({
        total: filteredProperties.length,
        page: parseInt(page),
        limit: parseInt(limit),
        properties: paginatedProperties
    });
});

// Seller Details Endpoint
app.post('/api/seller-details', (req, res) => {
    if (!req.session.user) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { sellerEmail } = req.body;
    const seller = users.find(user => user.email === sellerEmail);
    if (seller) {
        res.json({ success: true, details: `Name: ${seller.first_name} ${seller.last_name}, Email: ${seller.email}, Phone: ${seller.phone}` });
    } else {
        res.json({ success: false, message: 'Seller not found' });
    }
});

// Like Property Endpoint
app.post('/api/like', (req, res) => {
    const { propertyId } = req.body;
    if (!propertyLikes[propertyId]) {
        propertyLikes[propertyId] = 0;
    }
    propertyLikes[propertyId] += 1;
    res.json({ success: true, likes: propertyLikes[propertyId] });
});

// Sending Email on "I'm Interested"
app.post('/api/interest', (req, res) => {
    if (!req.session.user || req.session.user.user_type !== 'buyer') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const { sellerEmail, propertyId } = req.body;
    const seller = users.find(user => user.email === sellerEmail);
    const buyer = req.session.user;

    if (seller) {
        const mailOptionsSeller = {
            from: 'your_email@gmail.com',
            to: sellerEmail,
            subject: 'Property Interest Notification',
            text: `Hello ${seller.first_name},\n\n${buyer.first_name} ${buyer.last_name} is interested in your property with ID: ${propertyId}.\n\nBuyer Contact Details:\nEmail: ${buyer.email}\nPhone: ${buyer.phone}\n\nBest Regards,\nYour Property App Team`
        };

        const mailOptionsBuyer = {
            from: 'your_email@gmail.com',
            to: buyer.email,
            subject: 'Property Interest Notification',
            text: `Hello ${buyer.first_name},\n\nYou have expressed interest in the property with ID: ${propertyId}.\n\nSeller Contact Details:\nName: ${seller.first_name} ${seller.last_name}\nEmail: ${seller.email}\nPhone: ${seller.phone}\n\nBest Regards,\nYour Property App Team`
        };

        transporter.sendMail(mailOptionsSeller, (error, info) => {
            if (error) {
                return res.status(500).json({ success: false, message: 'Email sending failed' });
            } else {
                transporter.sendMail(mailOptionsBuyer, (error, info) => {
                    if (error) {
                        return res.status(500).json({ success: false, message: 'Email sending failed' });
                    } else {
                        res.json({ success: true, message: 'Interest expressed and emails sent to both buyer and seller' });
                    }
                });
            }
        });
    } else {
        res.json({ success: false, message: 'Seller not found' });
    }
});

// Start Server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
