document.addEventListener("DOMContentLoaded", () => {
    let socket;
    let localStream;
    let screenStream;  // Variable to hold the screen stream
    let peerConnection;
    const config = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    // Function to connect to the WebSocket server
    function connectWebSocket() {
        socket = new WebSocket("wss://elycheon.onrender.com"); // WebSocket signaling server

        // Event: When connection is established
        socket.onopen = () => {
            console.log("Connected to WebSocket server.");
            document.getElementById("onlineStatus").style.color = "red"; // Red dot for online
        };

        // Event: When receiving a message from the server
        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            // Handle WebRTC signaling
            if (data.type === "offer") {
                if (!peerConnection) {
                    peerConnection = new RTCPeerConnection(config);
                }
        
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                    }
                };
        
                peerConnection.ontrack = (event) => {
                    console.log("Received track:", event.track.kind);
        
                    if (event.track.kind === "video") {
                        let videoElement = document.getElementById("remoteVideo");
        
                        if (!videoElement) {
                            videoElement = document.createElement("video");
                            videoElement.id = "remoteVideo";
                            videoElement.autoplay = true;
                            videoElement.controls = true;
                            //a = document.getElementById("startScreenShare");
                            //document.body.innerHTML="";
                            document.body.appendChild(videoElement);
                            //document.body.appendChild(a);
                        }
        
                        videoElement.srcObject = event.streams[0];
                    } 
                    else if (event.track.kind === "audio") {
                        let audioElement = document.createElement("audio");
                        audioElement.srcObject = event.streams[0];
                        audioElement.autoplay = true;
                        document.body.appendChild(audioElement);
                    }
                };
        
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: "answer", answer }));
            }
            else if (data.type === "answer") {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            else if (data.type === "candidate") {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            // Handle chat message
            else if (data.type === "chat") {
                displayMessage(data.message, "other");
            }
        };

        // Event: When WebSocket connection closes
        socket.onclose = () => {
            console.log("Disconnected from WebSocket server.");
            document.getElementById("onlineStatus").style.color = "gray"; // Gray dot when disconnected
            setTimeout(connectWebSocket, 3000); // Attempt reconnection every 3 seconds
        };

        // Event: When WebSocket connection has an error
        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close(); // Close the connection so it triggers the onclose event
        };
    }

    // Start voice call
    async function startVoiceCall() {
        try {
            // Get user microphone stream
            console.log("Voice call clicked");
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create WebRTC peer connection
            peerConnection = new RTCPeerConnection(config);

            // Add local audio stream to connection
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            // When ICE candidates are available, send to the other peer
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                }
            };

            // When remote stream is received, play it
            peerConnection.ontrack = (event) => {
                const audioElement = document.createElement("audio");
                audioElement.srcObject = event.streams[0];
                audioElement.autoplay = true;
                document.body.appendChild(audioElement);
            };

            // Create WebRTC offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Send offer to signaling server
            socket.send(JSON.stringify({ type: "offer", offer }));

        } catch (error) {
            console.error("Error starting voice call:", error);
        }
    }

    // Start screen sharing
    async function startScreenShare() {
        try {

            if (!peerConnection) {
                peerConnection = new RTCPeerConnection(config);
            }
            // Get the screen media stream (this captures the screen)
            //screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

            // Add the screen stream to the WebRTC peer connection
            //screenStream.getTracks().forEach(track => peerConnection.addTrack(track, screenStream));

            // Send the screen stream offer to the other peer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.send(JSON.stringify({ type: "offer", offer }));

            console.log("Screen sharing started.");
        } catch (error) {
            console.error("Error starting screen sharing:", error);
        }
    }

    // Function to stop screen sharing (if needed)
    function stopScreenShare() {
        // Stop all screen sharing tracks
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            console.log("Screen sharing stopped.");
        }
    }

    // Function to display message in chat box
    function displayMessage(message, sender) {
        const chatBox = document.getElementById("chat-box");
        const msgDiv = document.createElement("div");
        msgDiv.className = sender === "self" ? "bg-blue-300 p-2 rounded self-end" : "bg-gray-200 p-2 rounded";
        msgDiv.innerText = message;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
    }

    // Start WebSocket connection on page load
    connectWebSocket();

    // Event listener for send button
    const sendButton = document.getElementById("sendButton");
    const messageInput = document.getElementById("message");

    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message !== "") {
            socket.send(JSON.stringify({ type: "chat", message }));
            displayMessage(message, "self");
            messageInput.value = ""; // Clear input field
        }
    });

    // 🚀 Listen for Enter key in the input field
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent new line in input field
            sendButton.click(); // Trigger send button click
        }
    });

    // Event listener for starting a voice call
    const startCallButton = document.getElementById("startCallButton");
    startCallButton.addEventListener("click", startVoiceCall);

    // Event listener for starting screen sharing.
    const startScreenButton = document.getElementById("startScreenShare");
    startScreenButton.addEventListener("click", startScreenShare);
});
