const axios = require('axios');

async function testApi() {
    const baseUrl = 'http://localhost:5000/api';
    try {
        console.log('Testing Activities API with multiple statuses...');
        const response = await axios.get(`${baseUrl}/activities`, {
            params: {
                status: 'in_progress,approved',
                limit: 1
            }
        });
        console.log('Success!', response.data.success);
        console.log('Count:', response.data.data.totalItems);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
    }
}

testApi();
