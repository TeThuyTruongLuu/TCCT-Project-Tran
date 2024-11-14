<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game with Leaderboard</title>
</head>
<body>
    <h1>Game</h1>
    <div id="timer">0</div>
    <div id="score">Score: 0</div>
    <ul id="leaderboard"></ul>

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
        const timerDisplay = document.getElementById('timer');
        const scoreDisplay = document.getElementById('score');

        // Start the timer (increasing)
        function startTimer() {
            const timerInterval = setInterval(() => {
                timeElapsed++;
                timerDisplay.textContent = timeElapsed;

                // This condition is just a placeholder. Replace with your game-ending logic
                if (/* game condition for end */) {
                    clearInterval(timerInterval);
                    endGame();
                }
            }, 1000);
        }

        function endGame() {
            alert("Game over! Your time: " + timeElapsed + " seconds");
            updateLeaderboard(timeElapsed); // Update leaderboard with the completion time
        }

        // Leaderboard functions with Firebase
        async function getLeaderboard() {
            const leaderboard = [];
            const leaderboardQuery = query(collection(db, "leaderboard"), orderBy("time", "asc"), limit(5));
            const querySnapshot = await getDocs(leaderboardQuery);
            querySnapshot.forEach((doc) => {
                leaderboard.push(doc.data().time);
            });
            return leaderboard;
        }

        async function updateLeaderboard(completionTime) {
            try {
                // Add new time to Firestore
                await addDoc(collection(db, "leaderboard"), { time: completionTime });
                displayLeaderboard(); // Display leaderboard after updating
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }

        async function displayLeaderboard() {
            const leaderboard = await getLeaderboard();
            const leaderboardElement = document.getElementById('leaderboard');
            leaderboardElement.innerHTML = '';
            leaderboard.forEach((time, index) => {
                const li = document.createElement('li');
                li.textContent = `#${index + 1}: ${time} seconds`;
                leaderboardElement.appendChild(li);
            });
        }

        // Start the game and the timer
        startTimer();
        displayLeaderboard();
    </script>
</body>
</html>
