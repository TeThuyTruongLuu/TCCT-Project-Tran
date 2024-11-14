<script type="module">
    // Import Firebase modules
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDrRgPPldi8hy04k8aSy8r2wCy91RrgqUM",
        authDomain: "tcct-project-tran.firebaseapp.com",
        projectId: "tcct-project-tran",
        storageBucket: "tcct-project-tran.firebasestorage.app",
        messagingSenderId: "826272441955",
        appId: "1:826272441955:web:86a1f521ccee2e9d3e3a56",
        measurementId: "G-D9EN3NEFD6"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Game variables
    let score = 0;
    let timeElapsed = 0;
    let playerNickname = ''; // Store player's nickname
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');

    // Start the timer (increasing)
    function startTimer() {
        const timerInterval = setInterval(() => {
            timeElapsed++;
            timerDisplay.textContent = timeElapsed;

            // Game-ending condition (update based on your game logic)
            if (/* game condition for end */) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        alert("Game over! Your time: " + timeElapsed + " seconds");
        updateLeaderboard(playerNickname, timeElapsed); // Update leaderboard with name and completion time
    }

    // Leaderboard functions with Firebase
    async function getLeaderboard() {
        const leaderboard = [];
        const leaderboardQuery = query(collection(db, "leaderboard"), orderBy("time", "asc"), limit(5));
        const querySnapshot = await getDocs(leaderboardQuery);
        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });
        return leaderboard;
    }

    async function updateLeaderboard(name, completionTime) {
        try {
            // Add player score to Firestore
            await addDoc(collection(db, "leaderboard"), { name: name, time: completionTime });
            displayLeaderboard(); // Display leaderboard after updating
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    async function displayLeaderboard() {
        const leaderboard = await getLeaderboard();
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        leaderboard.forEach(({ name, time }, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${name} - ${time} seconds`;
            leaderboardElement.appendChild(li);
        });
    }

    // Handle "Start" button click to verify code and name
    document.getElementById('start-button').addEventListener('click', () => {
        const codeInput = document.getElementById('code-input').value.trim();
        const nicknameInput = document.getElementById('nickname-input').value.trim();

        if (codeInput === "TCCT" && nicknameInput) {
            // Store player's nickname
            playerNickname = nicknameInput;
            // Hide login modal and start the game
            document.getElementById('login-modal').style.display = 'none';
            startTimer(); // Start the timer
            displayLeaderboard(); // Display leaderboard
        } else {
            alert("Invalid code or nickname. Please enter code 'TCCT' and a valid nickname.");
        }
    });
</script>
