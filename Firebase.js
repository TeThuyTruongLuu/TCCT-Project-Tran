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
    // Hàm lưu điểm vào Firestore
	window.updateLeaderboard = function(playerName, totalTime, playerScore) {
		return db.add({
			playerName: playerName,
			totalTime: totalTime,
			finalScore: playerScore
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
        .get()
        .then((querySnapshot) => {
            const leaderboardElement = document.getElementById("leaderboard");
            leaderboardElement.innerHTML = "<tr><th>Tên</th><th>Thời gian hoàn thành</th><th>Điểm</th></tr>";

            // Tạo object để lưu điểm cao nhất của mỗi người
            const uniquePlayers = {};

            // Loại bỏ các tên trùng lặp và chỉ giữ điểm cao nhất
            querySnapshot.forEach((doc) => {
                const entry = doc.data();
                if (!uniquePlayers[entry.playerName] || uniquePlayers[entry.playerName].finalScore < entry.finalScore) {
                    uniquePlayers[entry.playerName] = entry;
                }
            });

            // Chuyển object uniquePlayers thành mảng và sắp xếp theo điểm
            const leaderboardData = Object.values(uniquePlayers)
                .sort((a, b) => b.finalScore - a.finalScore)
                .slice(0, 10); // Chỉ lấy top 10

            // Tính điểm cho từng vị trí
            leaderboardData.forEach((entry, index) => {
                let points;
                if (index === 0) points = 10;
                else if (index === 1) points = 9;
                else if (index === 2) points = 8;
                else if (index < 5) points = 7;
                else if (index < 10) points = 6;
                else points = 5;

                // Tạo dòng mới cho từng mục trong bảng xếp hạng
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.playerName}</td>
                    <td>${entry.totalTime}</td>
                    <td>${points}</td>
                `;
                leaderboardElement.appendChild(row);
            });
        })
        .catch((error) => {
            console.log("Error getting leaderboard data: ", error);
        });
}

// Đảm bảo initializeApp được gọi khi trang web load
initializeApp();