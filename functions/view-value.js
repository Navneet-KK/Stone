// functions/view-value.js

const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // Path to the file where the value is stored
    const filePath = path.join(__dirname, '../value.json');
    
    // Read the saved value from the file
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : { value: null };

    return {
      statusCode: 200,
      body: JSON.stringify({ value: data.value }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve value' }),
    };
  }
};
