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

	// Hàm lưu điểm vào Firestore và chỉ giữ lại 3 kết quả cao nhất của mỗi người chơi
	window.updateLeaderboard = async function(playerName, totalTime, playerScore) {
		const leaderboardRef = db.collection('leaderboard');
		
		try {
			// 1. Tìm tất cả các kết quả của người chơi hiện tại
			const snapshot = await leaderboardRef.where('playerName', '==', playerName).get();
			const playerScores = [];

			snapshot.forEach(doc => {
				playerScores.push({ id: doc.id, ...doc.data() });
			});

			// 2. Thêm kết quả mới vào danh sách kết quả của người chơi
			playerScores.push({
				playerName: playerName,
				totalTime: totalTime,
				finalScore: playerScore
			});

			// 3. Sắp xếp các kết quả theo điểm từ cao đến thấp
			playerScores.sort((a, b) => b.finalScore - a.finalScore || a.totalTime - b.totalTime);

			// 4. Giữ lại 3 kết quả cao nhất và xác định các kết quả cần xóa
			const topScores = playerScores.slice(0, 3); // 3 kết quả cao nhất
			const scoresToDelete = playerScores.slice(3); // Các kết quả còn lại để xóa

			// 5. Lưu các kết quả mới vào Firestore (nếu chưa có trong cơ sở dữ liệu)
			for (const score of topScores) {
				if (!score.id) {
					// Nếu kết quả này chưa tồn tại (không có `id`), thêm mới vào Firestore
					await leaderboardRef.add({
						playerName: score.playerName,
						totalTime: score.totalTime,
						finalScore: score.finalScore
					});
				}
			}

			// 6. Xóa các kết quả thấp hơn (trong scoresToDelete)
			for (const score of scoresToDelete) {
				if (score.id) {
					// Xóa nếu có `id` (tức là đã tồn tại trong Firestore)
					await leaderboardRef.doc(score.id).delete();
				}
			}

			console.log("Đã cập nhật leaderboard và chỉ giữ lại 3 kết quả cao nhất của người chơi.");
		} catch (error) {
			console.error("Error updating leaderboard: ", error);
		}
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