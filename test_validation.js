const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testValidation() {
    console.log("--- Testing Validation ---");

    // 1. Test invalid registration (short password)
    try {
        console.log("\n[1] Registering with short password...");
        const res = await axios.post(`${BASE_URL}/auth/register`, {
            name: "Test",
            email: "test@example.com",
            password: "12"
        });
        console.log("Response (unexpected success):", res.data);
    } catch (err) {
        console.log("Response (expected failure):", err.response ? err.response.data : err.message);
        if (err.response && err.response.status === 400 && err.response.data.errors) {
            console.log("✅ Validation caught short password.");
        } else {
            console.log("❌ Validation failed to catch short password correctly.");
        }
    }

    // 2. Test invalid login (bad email)
    try {
        console.log("\n[2] Logging in with invalid email...");
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: "not-an-email",
            password: "password123"
        });
        console.log("Response (unexpected success):", res.data);
    } catch (err) {
        console.log("Response (expected failure):", err.response ? err.response.data : err.message);
        if (err.response && err.response.status === 400 && err.response.data.errors) {
            console.log("✅ Validation caught invalid email.");
        } else {
            console.log("❌ Validation failed to catch invalid email correctly.");
        }
    }

    // 3. Test missing name in registration
    try {
        console.log("\n[3] Registering without name...");
        const res = await axios.post(`${BASE_URL}/auth/register`, {
            email: "test_noname@example.com",
            password: "password123"
        });
        console.log("Response (unexpected success):", res.data);
    } catch (err) {
        console.log("Response (expected failure):", err.response ? err.response.data : err.message);
        if (err.response && err.response.status === 400 && err.response.data.errors) {
            console.log("✅ Validation caught missing name.");
        } else {
            console.log("❌ Validation failed to catch missing name correctly.");
        }
    }
}

testValidation();
