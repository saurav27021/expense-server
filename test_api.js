const BASE_URL = 'http://localhost:5001';

async function testApi() {
    const testUser = {
        name: "Test User",
        email: `test_${Date.now()}@example.com`,
        password: "password123"
    };

    console.log("--- Testing API ---");

    // 1. Test Register
    try {
        console.log(`\n[1] Registering user: ${testUser.email}...`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        console.log("Response:", regData);

        if (regRes.ok) {
            console.log("✅ Registration successful!");
        } else {
            console.log("❌ Registration failed.");
        }
    } catch (err) {
        console.error("Error during registration test:", err.message);
    }

    // 2. Test Login
    try {
        console.log(`\n[2] Logging in with: ${testUser.email}...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();
        console.log("Response:", loginData);

        if (loginRes.ok) {
            console.log("✅ Login successful!");
            console.log("Cookies set:", loginRes.headers.get('set-cookie'));
        } else {
            console.log("❌ Login failed.");
        }
    } catch (err) {
        console.error("Error during login test:", err.message);
    }
}

testApi();
