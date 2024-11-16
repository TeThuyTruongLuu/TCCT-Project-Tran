// Khai báo biến toàn cục
let db;

function initializeApp() {
    // Cấu hình Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDrRgPPldi8hy04k8aSy8r2wCy91RrgqUM",
        authDomain: "tcct-project-tran.firebaseapp.com",
        databaseURL: "https://tcct-project-tran-default-rtdb.firebaseio.com",
        projectId: "tcct-project-tran",
        storageBucket: "tcct-project-tran.firebasestorage.app",
        messagingSenderId: "826272441955",
        appId: "1:826272441955:web:86a1f521ccee2e9d3e3a56",
        measurementId: "G-D9EN3NEFD6"
    };

    // Khởi tạo Firebase
    firebase.initializeApp(firebaseConfig);
    const firestore = firebase.firestore();
    db = firestore.collection("leaderboard");  // Gán giá trị cho biến toàn cục

    // Hàm lưu điểm vào Firestore
    window.updateLeaderboard = function(playerName, finalScore, totalTime) {
        return db.add({
            playerName: playerName,
            finalScore: parseFloat(finalScore),
            totalTime: totalTime,
        })
        .then((docRef) => {
            console.log("Score added with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error adding score: ", error);
        });
    }
}

// Hàm hiển thị bảng xếp hạng từ Firestore
window.displayLeaderboard = function() {
    return db.orderBy("finalScore", "desc")
        .limit(10)
        .get()
        .then((querySnapshot) => {
            const leaderboardElement = document.getElementById("leaderboard");
            leaderboardElement.innerHTML = "";

            querySnapshot.forEach((doc, index) => {
                const entry = doc.data();
                const li = document.createElement("li");
                li.textContent = `#${index + 1}: ${entry.playerName} - ${entry.finalScore} điểm - ${entry.totalTime} phút`;
                leaderboardElement.appendChild(li);
            });
        })
        .catch((error) => {
            console.log("Error getting leaderboard data: ", error);
        });
}

// Đảm bảo initializeApp được gọi khi trang web load
initializeApp();