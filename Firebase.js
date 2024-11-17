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

// Hàm so sánh chuỗi thời gian "mm:ss"
function compareTimeStrings(timeA, timeB) {
    const [minutesA, secondsA] = timeA.split(':').map(Number);
    const [minutesB, secondsB] = timeB.split(':').map(Number);

    if (minutesA !== minutesB) {
        return minutesA - minutesB;
    } else {
        return secondsA - secondsB;
    }
}

// Hàm tính điểm dựa trên thứ hạng
function getPointsForRank(rank) {
    if (rank === 1) return 10;
    else if (rank === 2) return 9;
    else if (rank === 3) return 8;
    else if (rank <= 5) return 7;
    else if (rank <= 10) return 6;
    return 5;
}

// Hàm cập nhật kết quả cho người chơi mới hoặc cập nhật thời gian mới cho người chơi hiện tại
async function updatePlayerResult(playerName, newTotalTime) {
    const leaderboardRef = db;

    try {
        // Tìm xem người chơi có bản ghi nào trong hệ thống chưa
        const playerSnapshot = await leaderboardRef.where('playerName', '==', playerName).get();
        let existingRecord = null;

        playerSnapshot.forEach(doc => {
            existingRecord = { id: doc.id, ...doc.data() };
        });

        if (!existingRecord) {
            // Người chơi mới, thêm bản ghi đầu tiên và xác định hạng ngay lập tức
            const rank = await determineRank(playerName, newTotalTime);
            const points = getPointsForRank(rank);

            await leaderboardRef.add({
                playerName,
                totalTime: newTotalTime,
                points,
                rank
            });

            return {
                success: true,
                playerName,
                newTotalTime,
                rank,
                points,
                message: "Người chơi mới đã được thêm vào hệ thống."
            };
        }

        // Nếu người chơi cũ có kỷ lục, chỉ cập nhật nếu thời gian mới nhanh hơn
        if (compareTimeStrings(existingRecord.totalTime, newTotalTime) <= 0) {
            return {
                success: false,
                playerName,
                newTotalTime,
                oldRecordTime: existingRecord.totalTime,
                message: "Kỷ lục mới không được ghi nhận do không tốt hơn kỷ lục hiện tại."
            };
        }

        // Nếu là kết quả tốt hơn, cập nhật thời gian, tính lại hạng và điểm cho người chơi này
        const rank = await determineRank(playerName, newTotalTime);
        const points = getPointsForRank(rank);

        await leaderboardRef.doc(existingRecord.id).update({
            totalTime: newTotalTime,
            points,
            rank
        });

        return {
            success: true,
            playerName,
            newTotalTime,
            rank,
            points,
            message: "Đã cập nhật kỷ lục mới thành công."
        };

    } catch (error) {
        console.error("Error updating player result: ", error);
        return { success: false, error: error.message };
    }
}

// Hàm chuyển đổi thời gian "mm:ss" thành giây
function convertTimeToSeconds(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Hàm tính toán lại thứ hạng và điểm cho tất cả người chơi
async function recalculateAllRanksAndPoints() {
    try {
        // Lấy tất cả các bản ghi
        const allScoresSnapshot = await db.get();

        // Sắp xếp các bản ghi dựa trên tổng số giây
        const sortedDocs = allScoresSnapshot.docs.sort((a, b) => {
            const timeA = convertTimeToSeconds(a.data().totalTime);
            const timeB = convertTimeToSeconds(b.data().totalTime);
            return timeA - timeB;
        });

        let uniqueRank = 1;
        let previousTime = null;
        let groupPlayers = [];

        for (const doc of sortedDocs) {
            const data = doc.data();
            const currentTime = convertTimeToSeconds(data.totalTime);

            // Nếu thời gian của người chơi khác với thời gian của nhóm hiện tại
            if (previousTime !== null && currentTime !== previousTime) {
                // Cấp điểm cho nhóm người chơi hiện tại
                const points = getPointsForRank(uniqueRank);
                for (const playerDoc of groupPlayers) {
                    await db.doc(playerDoc.id).update({
                        rank: uniqueRank,
                        points: points
                    });
                }

                // Tăng `uniqueRank` lên đúng bằng số lượng người chơi trong nhóm hiện tại
                uniqueRank += groupPlayers.length;
                groupPlayers = [];
            }

            // Thêm người chơi vào nhóm hiện tại
            groupPlayers.push(doc);
            previousTime = currentTime;
        }

        // Xử lý nhóm cuối cùng (nếu có)
        if (groupPlayers.length > 0) {
            const points = getPointsForRank(uniqueRank);
            for (const playerDoc of groupPlayers) {
                await db.doc(playerDoc.id).update({
                    rank: uniqueRank,
                    points: points
                });
            }
        }

        console.log("Thứ hạng và điểm số đã được tính toán lại cho toàn bộ người chơi.");
        return { success: true, message: "Thứ hạng và điểm số đã được cập nhật." };
    } catch (error) {
        console.error("Error recalculating ranks and points: ", error);
        return { success: false, error: error.message };
    }
}


// Hàm hiển thị bảng xếp hạng
window.displayLeaderboard = async function() {
    try {
        const recalculateResult = await recalculateAllRanksAndPoints();

        if (!recalculateResult.success) {
            console.log("Lỗi khi tính toán lại thứ hạng và điểm số:", recalculateResult.message);
            return;
        }

        const querySnapshot = await db.orderBy("rank", "asc").get();

        const leaderboardElement = document.getElementById("leaderboard");
        leaderboardElement.innerHTML = "<tr><th>Hạng</th><th>Tên</th><th>Thời gian hoàn thành</th><th>Điểm</th></tr>";

        querySnapshot.forEach((doc) => {
            const entry = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
				<td>${entry.rank}</td>
                <td>${entry.playerName}</td>
                <td>${entry.totalTime}</td>
                <td>${entry.points}</td>
            `;
            leaderboardElement.appendChild(row);
        });
    } catch (error) {
        console.log("Error getting leaderboard data: ", error);
    }
}

// Đảm bảo initializeApp được gọi khi trang web load
initializeApp();
