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
    db = firestore.collection("leaderboard"); // Gán db trực tiếp là collection "leaderboard"
}

// Hàm xác định hạng cho người chơi mới dựa trên thời gian hoàn thành của họ (dựa trên unique totalTime)
async function determineRank(playerName, newTotalTime) {
    const allScoresSnapshot = await db.orderBy('totalTime', 'asc').get(); // Sắp xếp từ nhanh nhất đến chậm nhất
    const uniqueTimes = new Set(); // Tập hợp lưu trữ các thời gian hoàn thành duy nhất

    // Lấy các giá trị `totalTime` duy nhất
    allScoresSnapshot.forEach((doc) => {
        const data = doc.data();
        uniqueTimes.add(data.totalTime); // Thêm thời gian hoàn thành vào tập hợp
    });

    // Chuyển `uniqueTimes` thành một mảng và sắp xếp
    const sortedUniqueTimes = Array.from(uniqueTimes).sort((a, b) => a - b);

    let rank = 1; // Bắt đầu từ hạng cao nhất
    for (let time of sortedUniqueTimes) {
        if (newTotalTime < time) {
            // Nếu thời gian hoàn thành của người chơi mới nhanh hơn, giữ nguyên `rank`
            break;
        } else if (newTotalTime === time) {
            // Nếu thời gian hoàn thành bằng nhau, giữ nguyên `rank` và ngừng tìm kiếm
            break;
        } else {
            // Nếu thời gian hoàn thành chậm hơn, tăng `rank`
            rank++;
        }
    }

    return rank;
}



// Hàm lưu điểm vào Firestore nếu người chơi đạt kỷ lục mới và hiển thị lại bảng xếp hạng ngay sau đó
window.updateLeaderboard = async function(playerName, newTotalTime) {
    const leaderboardRef = db;

    try {
        // 1. Lấy kết quả trước của người chơi hiện tại
        const playerSnapshot = await leaderboardRef.where('playerName', '==', playerName).get();
        let existingRecord = null;

        playerSnapshot.forEach(doc => {
            existingRecord = { id: doc.id, ...doc.data() };
        });

        // 2. Nếu người chơi là mới hoàn toàn (không có bản ghi trước đó)
        if (!existingRecord) {
            console.log("Người chơi mới, thêm kỷ lục đầu tiên.");

            // 3. Xác định hạng cho người chơi mới
            const rank = await determineRank(playerName, newTotalTime);

            // 4. Tính điểm dựa trên thứ hạng
            const points = getPointsForRank(rank);

            // 5. Thêm bản ghi mới vào Firestore cho người chơi mới
            await leaderboardRef.add({
                playerName,
                totalTime: newTotalTime,
                points,
                rank
            });

            // Trả về kết quả thành công cho người chơi mới
            return {
                success: true,
                playerName,
                newTotalTime,
                points,
                rank,
                message: "Đã thêm kỷ lục đầu tiên cho người chơi mới."
            };
        }

        // 3. Kiểm tra thời gian kỷ lục cũ của người chơi (nếu người chơi đã có kỷ lục)
        if (compareTimeStrings(existingRecord.totalTime, newTotalTime) <= 0) {
            console.log("Thời gian hoàn thành mới dài hơn hoặc bằng, không cập nhật.");
            await displayLeaderboard(); // Hiển thị lại bảng xếp hạng để đảm bảo cập nhật

            // Trả về kết quả để thông báo cho người chơi rằng kỷ lục không được cập nhật
            return {
                success: false,
                playerName,
                newTotalTime,
                oldRecordTime: existingRecord.totalTime,
                message: "Rất tiếc cơ mà bồ chưa vượt qua kỷ lục, kết quả này sẽ không được ghi nhận nha."
            };
        }

        // 4. Xác định hạng cho người chơi nếu thời gian mới nhanh hơn
        const rank = await determineRank(playerName, newTotalTime);

        // 5. Tính điểm dựa trên thứ hạng
        const points = getPointsForRank(rank);

        // 6. Cập nhật bản ghi của người chơi trong Firestore
        await leaderboardRef.doc(existingRecord.id).update({
            totalTime: newTotalTime,
            points,
            rank
        });

        console.log("Đã cập nhật leaderboard với kỷ lục mới.");
        await displayLeaderboard(); // Hiển thị lại bảng xếp hạng sau khi cập nhật

        // Trả về kết quả thành công khi cập nhật kỷ lục mới
        return {
            success: true,
            playerName,
            newTotalTime,
            points,
            rank,
            message: "Đã cập nhật kỷ lục mới thành công."
        };
    } catch (error) {
        console.error("Error updating leaderboard: ", error);
        return { success: false, error: error.message };
    }
};




// Hàm tính điểm dựa trên thứ hạng
function getPointsForRank(rank) {
    if (rank === 1) return 10;
    else if (rank === 2) return 9;
    else if (rank === 3) return 8;
    else if (rank <= 5) return 7;
    else if (rank <= 10) return 6;
    return 5;
}

// Hàm hiển thị bảng xếp hạng từ Firestore
window.displayLeaderboard = async function() {
    return db.orderBy("rank", "asc") // Sử dụng thứ hạng đã tính sẵn
        .get()
        .then((querySnapshot) => {
            const leaderboardElement = document.getElementById("leaderboard");
            leaderboardElement.innerHTML = "<tr><th>Tên</th><th>Thời gian hoàn thành</th><th>Điểm</th></tr>";

            querySnapshot.forEach((doc) => {
                const entry = doc.data();
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.playerName}</td>
                    <td>${entry.totalTime}</td>
                    <td>${entry.points}</td>
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
