const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const filePath = path.join(__dirname, '../data.txt');

    if (event.httpMethod === 'GET') {
        // Read the number from the text file
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return {
            statusCode: 200,
            body: JSON.stringify({ number: parseInt(data, 10) })
        };
    } else if (event.httpMethod === 'POST') {
        // Increment the number and write back to the file
        const currentNumber = parseInt(await fs.promises.readFile(filePath, 'utf-8'), 10);
        const newNumber = currentNumber + 1;

        await fs.promises.writeFile(filePath, newNumber.toString(), 'utf-8');

        return {
            statusCode: 200,
            body: JSON.stringify({ number: newNumber })
        };
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' })
    };
};
