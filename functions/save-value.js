// functions/save-value.js

const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'POST') {
    try {
      // Parse incoming data (value sent from the frontend)
      const { value } = JSON.parse(event.body);

      // Path to the file where we store the value
      const filePath = path.join(__dirname, '../value.json');
      
      // Save the value in a file (or update it if already exists)
      fs.writeFileSync(filePath, JSON.stringify({ value }, null, 2));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Value saved successfully!' }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save value' }),
      };
    }
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }
};
