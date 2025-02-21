document.addEventListener("DOMContentLoaded", () => {
    const socket = new WebSocket("wss://elycheon.onrender.com"); // Connect to WebSocket server

    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message");
    const sendButton = document.getElementById("sendButton"); // Fix for button click event

    // Event: When connection is established
    socket.onopen = () => {
        console.log("Connected to WebSocket server.");
    };

    // Event: When receiving a message from the server
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "chat") {
                displayMessage(data.message, "other");
            }
        } catch (error) {
            console.error("Error parsing received message:", error);
        }
    };

    // Event: When WebSocket connection closes
    socket.onclose = () => {
        console.log("Disconnected from WebSocket server.");
    };

    // Function: Send message to WebSocket server
    function sendMessage() {
        console.log("Send Button Clicked.");
        const message = messageInput.value.trim();
        if (message === "") return; // Prevent empty messages

        const data = { type: "chat", message: message };
        socket.send(JSON.stringify(data)); // Send to server

        displayMessage(message, "self"); // Display message locally
        messageInput.value = ""; // Clear input field
    }

    // Function: Display message in chat box
    function displayMessage(message, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.className = sender === "self" ? "bg-blue-300 p-2 rounded self-end" : "bg-gray-200 p-2 rounded";
        msgDiv.innerText = message;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
    }

    // Attach event listener to button
    sendButton.addEventListener("click", sendMessage);

    // 🚀 Listen for Enter key in the input field
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent new line in input field
            sendMessage(); // Call send function
        }
    });
});    
