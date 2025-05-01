document.addEventListener("DOMContentLoaded", () => {
    let socket;
    let localStream;
    let screenStream;
    let peerConnection;
    const config = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    // Function to connect to the WebSocket server
    function connectWebSocket() {
        socket = new WebSocket("wss://elycheon.onrender.com");

        socket.onopen = () => {
            console.log("Connected to WebSocket server.");
            document.getElementById("onlineStatus").style.color = "red"; // Red dot for online
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

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
                            document.body.appendChild(videoElement);
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
            else if (data.type === "chat") {
                displayMessage(data.message, "other");
            }
        };

        socket.onclose = () => {
            console.log("Disconnected from WebSocket server.");
            document.getElementById("onlineStatus").style.color = "gray"; // Gray dot when disconnected
            setTimeout(connectWebSocket, 3000); // Attempt reconnection every 3 seconds
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close();
        };
    }

    // Start Audio Call
    async function startAudioCall() {
        try {
            // Get user microphone stream (only audio)
            console.log("Audio call clicked");
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create WebRTC peer connection
            peerConnection = new RTCPeerConnection(config);

            // Add local audio stream to connection
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                }
            };

            peerConnection.ontrack = (event) => {
                if (event.track.kind === "audio") {
                    let audioElement = document.createElement("audio");
                    audioElement.srcObject = event.streams[0];
                    audioElement.autoplay = true;
                    document.body.appendChild(audioElement);
                }
            };

            // Create WebRTC offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.send(JSON.stringify({ type: "offer", offer }));
        } catch (error) {
            console.error("Error starting audio call:", error);
        }
    }

    // Start Video Call
    async function startVideoCall() {
        try {
            // Get user video and microphone stream
            console.log("Video call clicked");
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // Create WebRTC peer connection
            peerConnection = new RTCPeerConnection(config);

            // Add local video and audio stream to connection
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                }
            };

            peerConnection.ontrack = (event) => {
                if (event.track.kind === "video") {
                    let videoElement = document.getElementById("remoteVideo");

                    if (!videoElement) {
                        videoElement = document.createElement("video");
                        videoElement.id = "remoteVideo";
                        videoElement.autoplay = true;
                        videoElement.controls = true;
                        document.body.appendChild(videoElement);
                    }

                    videoElement.srcObject = event.streams[0];
                } else if (event.track.kind === "audio") {
                    let audioElement = document.createElement("audio");
                    audioElement.srcObject = event.streams[0];
                    audioElement.autoplay = true;
                    document.body.appendChild(audioElement);
                }
            };

            // Create WebRTC offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.send(JSON.stringify({ type: "offer", offer }));
        } catch (error) {
            console.error("Error starting video call:", error);
        }
    }

    // Start Screen Share
    async function startScreenShare() {
        try {
            if (!peerConnection) {
                peerConnection = new RTCPeerConnection(config);
            }

            // Get the screen media stream
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

            // Add the screen stream to WebRTC connection
            screenStream.getTracks().forEach(track => peerConnection.addTrack(track, screenStream));

            // Send screen stream offer to the other peer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.send(JSON.stringify({ type: "offer", offer }));

            console.log("Screen sharing started.");
        } catch (error) {
            console.error("Error starting screen sharing:", error);
        }
    }

    // Function to stop screen sharing
    function stopScreenShare() {
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

    // Listen for Enter key in the input field
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent new line in input field
            sendButton.click(); // Trigger send button click
        }
    });

    // Event listener for starting an audio call
    const startAudioCallButton = document.getElementById("startAudioCall");
    startAudioCallButton.addEventListener("click", startAudioCall);

    // Event listener for starting a video call
    const startVideoCallButton = document.getElementById("startVideoCall");
    startVideoCallButton.addEventListener("click", startVideoCall);

    // Event listener for starting screen sharing
    const startScreenShareButton = document.getElementById("startScreenShare");
    startScreenShareButton.addEventListener("click", startScreenShare);

    // Event listener for stopping screen sharing
    const stopScreenShareButton = document.getElementById("stopScreenShare");
    stopScreenShareButton.addEventListener("click", stopScreenShare);
});
