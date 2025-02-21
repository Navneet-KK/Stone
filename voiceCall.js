const socket = new WebSocket("wss://elycheon.onrender.com"); // WebSocket signaling server
let localStream;
let peerConnection;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Start voice call
async function startVoiceCall() {
    try {
        // Get user microphone stream
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

// Handle incoming WebRTC messages
socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "offer") {
        peerConnection = new RTCPeerConnection(config);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = (event) => {
            const audioElement = document.createElement("audio");
            audioElement.srcObject = event.streams[0];
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
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
};
