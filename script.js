document.addEventListener('DOMContentLoaded', () => {
    // 游戏元素
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const gameBoard = document.getElementById('game-board');
    const currentPlayerDisplay = document.getElementById('current-player');
    const scoresDisplay = document.getElementById('scores');
    const finalScoresDisplay = document.getElementById('final-scores');
    const winnerDisplay = document.getElementById('winner');
    
    // 按钮
    const startGameBtn = document.getElementById('start-game');
    const restartGameBtn = document.getElementById('restart-game');
    const playAgainBtn = document.getElementById('play-again');
    
    // 选择框
    const playerCountSelect = document.getElementById('player-count');
    const difficultySelect = document.getElementById('difficulty');
    
    // 添加玩家颜色选择相关元素
    const playerColorsContainer = document.getElementById('player-colors');
    const playerColorSetups = document.querySelectorAll('.player-color-setup');
    
    // 游戏状态
    let gameState = {
        players: [],
        currentPlayerIndex: 0,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: 0,
        canFlip: true
    };
    
    // 图案集合
    const emojis = [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
        '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
        '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
    ];
    
    // 监听玩家数量变化
    playerCountSelect.addEventListener('change', () => {
        const playerCount = parseInt(playerCountSelect.value);
        
        // 显示或隐藏颜色选择器
        playerColorSetups.forEach((setup, index) => {
            if (index < playerCount) {
                setup.style.display = 'flex';
            } else {
                setup.style.display = 'none';
            }
        });
    });
    
    // 添加屏幕方向变化监听
    window.addEventListener('orientationchange', adjustGameBoard);
    window.addEventListener('resize', adjustGameBoard);
    
    // 调整游戏板函数
    function adjustGameBoard() {
        // 给浏览器一点时间来完成旋转
        setTimeout(() => {
            const gameBoard = document.getElementById('game-board');
            if (!gameBoard || gameBoard.style.display === 'none') return;
            
            const difficulty = gameBoard.classList.contains('easy') ? 'easy' : 
                              gameBoard.classList.contains('medium') ? 'medium' : 
                              gameBoard.classList.contains('hard') ? 'hard' : '';
            
            // 重新创建游戏板以适应新的屏幕方向
            if (difficulty) {
                // 保存当前游戏状态
                const currentState = {...gameState};
                
                // 重新创建游戏板
                createGameBoard(difficulty);
                
                // 恢复游戏状态
                gameState.cards.forEach((card, index) => {
                    if (currentState.cards[index] && currentState.cards[index].matched) {
                        card.matched = true;
                        const cardElement = document.querySelector(`.card[data-index="${index}"]`);
                        if (cardElement) {
                            // 修改这里：隐藏已匹配的卡片
                            cardElement.style.visibility = 'hidden';
                        }
                    } else if (currentState.flippedCards.includes(index)) {
                        const cardElement = document.querySelector(`.card[data-index="${index}"]`);
                        if (cardElement) {
                            cardElement.classList.add('flipped');
                            cardElement.textContent = card.emoji;
                        }
                    }
                });
                
                // 更新游戏板边框
                updateGameBoardBorder();
            }
        }, 300);
    }
    
    // 初始化游戏
    function initGame() {
        const playerCount = parseInt(playerCountSelect.value);
        const difficulty = difficultySelect.value;
        
        // 设置玩家和颜色
        gameState.players = [];
        for (let i = 1; i <= playerCount; i++) {
            const colorSelect = document.getElementById(`player-${i}-color`);
            const color = colorSelect.value;
            
            gameState.players.push({
                name: `玩家 ${i}`,
                score: 0,
                color: color
            });
        }
        
        // 设置游戏板大小
        let gridSize;
        switch (difficulty) {
            case 'easy':
                gridSize = 4;
                break;
            case 'medium':
                gridSize = 6;
                break;
            case 'hard':
                gridSize = 8;
                break;
            default:
                gridSize = 4;
        }
        
        // 计算总对数
        gameState.totalPairs = (gridSize * gridSize) / 2;
        
        // 重置游戏状态
        gameState.currentPlayerIndex = 0;
        gameState.flippedCards = [];
        gameState.matchedPairs = 0;
        gameState.canFlip = true;
        
        // 创建卡片
        createGameBoard(difficulty);
        
        // 设置游戏板边框颜色为当前玩家颜色
        updateGameBoardBorder();
        
        // 更新显示
        updateGameInfo();
        
        // 显示游戏屏幕
        setupScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        resultScreen.style.display = 'none';
        
        // 请求全屏
        requestFullScreen();
    }
    
    // 创建卡片
    function createGameBoard(difficulty) {
        const gameBoard = document.getElementById('game-board');
        gameBoard.className = ''; // 清除现有类名
        gameBoard.classList.add(difficulty); // 添加难度类名
        
        // 清空游戏板
        gameBoard.innerHTML = '';
        
        // 设置网格大小
        let gridSize;
        switch (difficulty) {
            case 'easy':
                gridSize = 4;
                break;
            case 'medium':
                gridSize = 6;
                break;
            case 'hard':
                gridSize = 8;
                break;
            default:
                gridSize = 4;
        }
        
        // 设置网格
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // 创建卡片对
        const pairsCount = (gridSize * gridSize) / 2;
        const selectedEmojis = emojis.slice(0, pairsCount);
        
        // 创建卡片数组（每个图案两张卡片）
        gameState.cards = [];
        selectedEmojis.forEach(emoji => {
            gameState.cards.push({ emoji, matched: false });
            gameState.cards.push({ emoji, matched: false });
        });
        
        // 洗牌
        shuffleCards(gameState.cards);
        
        // 添加卡片到游戏板
        gameState.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.index = index;
            // 不在这里设置文本内容，只有在翻转时才设置
            cardElement.textContent = '';
            
            // 确保卡片可见
            cardElement.style.visibility = 'visible';
            
            // 添加点击和触摸事件
            cardElement.addEventListener('click', () => flipCard(index));
            cardElement.addEventListener('touchstart', function(e) {
                e.preventDefault();
                flipCard(index);
            }, { passive: false });
            
            gameBoard.appendChild(cardElement);
        });
    }
    
    // 洗牌算法
    function shuffleCards(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
    }
    
    // 翻牌
    function flipCard(index) {
        const card = gameState.cards[index];
        const cardElement = document.querySelector(`.card[data-index="${index}"]`);
        
        // 检查是否可以翻牌
        if (!gameState.canFlip || card.matched || gameState.flippedCards.includes(index)) {
            return;
        }
        
        // 翻牌
        cardElement.classList.add('flipped');
        cardElement.textContent = card.emoji;
        gameState.flippedCards.push(index);
        
        // 如果翻了两张牌
        if (gameState.flippedCards.length === 2) {
            gameState.canFlip = false;
            
            const firstCardIndex = gameState.flippedCards[0];
            const secondCardIndex = gameState.flippedCards[1];
            
            const firstCard = gameState.cards[firstCardIndex];
            const secondCard = gameState.cards[secondCardIndex];
            
            // 检查是否匹配
            if (firstCard.emoji === secondCard.emoji) {
                // 匹配成功
                setTimeout(() => {
                    // 修改这里：不再添加matched类，而是将卡片隐藏
                    const firstCardElement = document.querySelector(`.card[data-index="${firstCardIndex}"]`);
                    const secondCardElement = document.querySelector(`.card[data-index="${secondCardIndex}"]`);
                    
                    // 添加匹配动画效果
                    firstCardElement.classList.add('matched');
                    secondCardElement.classList.add('matched');
                    
                    // 短暂延迟后隐藏卡片
                    setTimeout(() => {
                        firstCardElement.style.visibility = 'hidden';
                        secondCardElement.style.visibility = 'hidden';
                    }, 300);
                    
                    // 更新游戏状态
                    firstCard.matched = true;
                    secondCard.matched = true;
                    gameState.matchedPairs++;
                    
                    // 当前玩家得分
                    gameState.players[gameState.currentPlayerIndex].score++;
                    
                    // 重置翻牌状态
                    gameState.flippedCards = [];
                    gameState.canFlip = true;
                    
                    // 更新显示和游戏板边框
                    updateGameInfo();
                    updateGameBoardBorder();
                    
                    // 检查游戏是否结束
                    if (gameState.matchedPairs === gameState.totalPairs) {
                        endGame();
                    }
                }, 500);
            } else {
                // 匹配失败
                setTimeout(() => {
                    const firstCardElement = document.querySelector(`.card[data-index="${firstCardIndex}"]`);
                    const secondCardElement = document.querySelector(`.card[data-index="${secondCardIndex}"]`);
                    
                    firstCardElement.classList.remove('flipped');
                    secondCardElement.classList.remove('flipped');
                    
                    // 清空卡片显示的内容
                    firstCardElement.textContent = '';
                    secondCardElement.textContent = '';
                    
                    // 切换到下一个玩家
                    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
                    
                    // 重置翻牌状态
                    gameState.flippedCards = [];
                    gameState.canFlip = true;
                    
                    // 更新显示和游戏板边框
                    updateGameInfo();
                    updateGameBoardBorder();
                }, 1000);
            }
        }
    }
    
    // 更新游戏板边框颜色
    function updateGameBoardBorder() {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // 保留难度类名（easy、medium或hard）
        const difficultyClass = gameBoard.classList.contains('easy') ? 'easy' : 
                               gameBoard.classList.contains('medium') ? 'medium' : 
                               gameBoard.classList.contains('hard') ? 'hard' : '';
        
        // 设置类名，保留难度类
        gameBoard.className = difficultyClass + ' game-board-border';
        gameBoard.style.borderColor = currentPlayer.color;
    }
    
    // 更新游戏信息显示
    function updateGameInfo() {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // 显示当前玩家和颜色提示
        currentPlayerDisplay.innerHTML = `
            <div class="current-player-indicator" style="background-color: ${currentPlayer.color}">
                当前玩家: ${currentPlayer.name}
            </div>
        `;
        
        // 显示所有玩家分数，带颜色标签
        scoresDisplay.innerHTML = gameState.players.map(player => 
            `<span class="player-tag" style="background-color: ${player.color}">${player.name}</span>: ${player.score}`
        ).join(' | ');
    }
    
    // 结束游戏
    function endGame() {
        // 显示结果屏幕
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'block';
        
        // 显示最终分数，带颜色标签
        finalScoresDisplay.innerHTML = gameState.players.map(player => 
            `<div class="player-score">
                <span class="player-tag" style="background-color: ${player.color}">${player.name}</span>: ${player.score}
            </div>`
        ).join('');
        
        // 找出赢家
        const maxScore = Math.max(...gameState.players.map(player => player.score));
        const winners = gameState.players.filter(player => player.score === maxScore);
        
        if (winners.length === 1) {
            winnerDisplay.textContent = `赢家: ${winners[0].name}!`;
        } else {
            winnerDisplay.textContent = `平局! ${winners.map(w => w.name).join(' 和 ')}`;
        }
    }
    
    // 请求全屏函数
    function requestFullScreen() {
        const container = document.querySelector('.container');
        
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) { /* Safari */
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) { /* IE11 */
            container.msRequestFullscreen();
        }
    }
    
    // 事件监听
    startGameBtn.addEventListener('click', initGame);
    
    restartGameBtn.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        setupScreen.style.display = 'block';
    });
    
    playAgainBtn.addEventListener('click', () => {
        resultScreen.style.display = 'none';
        setupScreen.style.display = 'block';
    });
}); 