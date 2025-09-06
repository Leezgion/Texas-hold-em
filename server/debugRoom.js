/**
 * 房间状态调试脚本
 * 检查指定房间的玩家和游戏状态
 */

const io = require('socket.io-client');

async function checkRoomStatus(roomId = 'O03G44') {
    console.log(`🔍 检查房间状态: ${roomId}`);
    
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
        console.log('✅ 连接到服务器');
        
        // 注册临时设备
        socket.emit('registerDevice', {
            deviceId: 'debug_device_' + Date.now(),
            socketId: socket.id
        });
        
        // 尝试加入房间进行观察
        setTimeout(() => {
            socket.emit('joinRoom', {
                roomId: roomId,
                deviceId: 'debug_device_' + Date.now()
            });
        }, 1000);
    });
    
    socket.on('roomJoined', (data) => {
        console.log('🏠 成功加入房间，房间信息:', data);
    });
    
    socket.on('roomUpdate', (data) => {
        console.log('📊 房间更新:', data);
        if (data.players) {
            console.log('👥 当前玩家列表:');
            data.players.forEach((player, index) => {
                console.log(`  ${index + 1}. ${player.name || '未知'} (ID: ${player.id}) - 筹码: ${player.chips}`);
            });
        }
    });
    
    socket.on('gameStateUpdate', (data) => {
        console.log('🎮 游戏状态更新:', {
            phase: data.phase,
            pot: data.pot,
            currentPlayer: data.currentPlayerIndex,
            players: data.players?.length || 0
        });
    });
    
    socket.on('error', (error) => {
        console.log('❌ 错误:', error);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 连接断开');
    });
    
    // 10秒后断开连接
    setTimeout(() => {
        console.log('🔍 调试完成，断开连接');
        socket.disconnect();
        process.exit(0);
    }, 10000);
}

// 如果直接运行此文件
if (require.main === module) {
    const roomId = process.argv[2] || 'O03G44';
    checkRoomStatus(roomId);
}

module.exports = checkRoomStatus;
