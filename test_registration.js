const axios = require('axios');

async function testRegistration() {
    const email = `test_${Date.now()}@example.com`;
    try {
        const response = await axios.post('http://localhost:5001/auth/register', {
            name: "Test User",
            email: email,
            password: "password123"
        });

        console.log("Status:", response.status);
        console.log("Body:", JSON.stringify(response.data, null, 2));
        console.log("Cookies:", response.headers['set-cookie']);

        if (response.status === 201 && response.headers['set-cookie']) {
            console.log("SUCCESS: Backend registration is working and issuing a cookie.");
        } else {
            console.log("FAILURE: Registration failed or no cookie issued.");
        }
    } catch (error) {
        console.error("ERROR:", error.response ? error.response.data : error.message);
    }
}

testRegistration();
