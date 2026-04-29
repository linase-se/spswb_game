const GameStatus = {
    STANDBY: 'standby',
    PLAYING: 'playing',
    CANNON_TURN: 'cannon_turn',
    SOLDIER_TURN: 'soldier_turn',
    GAME_OVER: 'game_over',
    RESETTING: 'resetting',
    PAUSED: 'paused'
};

class Game {
    constructor() {
        this.COLS = 5;
        this.ROWS = 5;
        
        this.board = [];
        this.status = GameStatus.STANDBY;
        this.currentTurn = 'cannon';
        this.selectedPiece = null;
        this.validMoves = [];
        this.validCaptures = [];
        this.winner = null;
        this.history = [];
        this.moveHistory = [];
        
        this.aiEnabled = true;
        this.aiSide = 'soldier';
        this.difficulty = 'easy';
        
        this.moveCount = 0;
        this.repeatCount = 0;
        this.lastBoardState = '';
        this.lastMove = null;
        this.maxRepeats = 8;
        this.maxMoves = 150;
        
        this.cannonCount = 3;
        this.soldierCount = 15;
        
        this.timer = null;
        this.turnTime = 0;
        this.maxTurnTime = 30;
        
        this.stats = {
            wins: parseInt(localStorage.getItem('cannonWins') || '0'),
            losses: parseInt(localStorage.getItem('cannonLosses') || '0'),
            draws: parseInt(localStorage.getItem('cannonDraws') || '0')
        };
        
        this.init();
    }
    
    init(reverse = false) {
        this.setupBoard();
        
        if (reverse) {
            this.reverseBoard();
        }
        
        this.status = GameStatus.PLAYING;
        this.currentTurn = 'cannon';
        this.selectedPiece = null;
        this.validMoves = [];
        this.validCaptures = [];
        this.winner = null;
        this.moveHistory = [];
        this.moveCount = 0;
        this.repeatCount = 0;
        this.lastBoardState = '';
        this.lastMove = null;
        this.cannonCount = 3;
        this.soldierCount = 15;
        
        this.setAISideBasedOnCannonPosition();
        
        this.startTurnTimer();
        this.render();
        this.updateUI();
    }
    
    setAISideBasedOnCannonPosition() {
        if (!this.aiEnabled) return;
        
        let cannonOnBottom = false;
        for (let j = 0; j < this.COLS; j++) {
            if (this.board[this.ROWS - 1][j] === 'cannon') {
                cannonOnBottom = true;
                break;
            }
        }
        
        if (cannonOnBottom) {
            this.aiSide = 'soldier';
        } else {
            this.aiSide = 'cannon';
        }
    }
    
    setupBoard() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));
        
        for (let i = 0; i < this.ROWS; i++) {
            for (let j = 0; j < this.COLS; j++) {
                if (i === this.ROWS - 1 && (j === 1 || j === 2 || j === 3)) {
                    this.board[i][j] = 'cannon';
                } else if (i <= 2) {
                    this.board[i][j] = 'soldier';
                } else {
                    this.board[i][j] = null;
                }
            }
        }
    }
    
    getIndex(row, col) {
        return row * this.COLS + col;
    }
    
    getRowCol(index) {
        return {
            row: Math.floor(index / this.COLS),
            col: index % this.COLS
        };
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS;
    }
    
    getAdjacentPositions(row, col) {
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];
        
        return directions
            .map(dir => ({ row: row + dir.row, col: col + dir.col }))
            .filter(pos => this.isValidPosition(pos.row, pos.col));
    }
    
    validateSelection(index) {
        if (this.status === GameStatus.GAME_OVER || this.status === GameStatus.PAUSED) return false;
        
        const { row, col } = this.getRowCol(index);
        const piece = this.board[row][col];
        
        if (piece === null) return false;
        if (piece !== this.currentTurn) return false;
        
        return true;
    }
    
    validateMove(fromIndex, toIndex) {
        if (this.status === GameStatus.GAME_OVER || this.status === GameStatus.PAUSED) return { valid: false, type: null };
        
        const { row: fromRow, col: fromCol } = this.getRowCol(fromIndex);
        const { row: toRow, col: toCol } = this.getRowCol(toIndex);
        
        const piece = this.board[fromRow][fromCol];
        if (piece !== this.currentTurn) return { valid: false, type: null };
        
        const adjacent = this.getAdjacentPositions(fromRow, fromCol);
        const isAdjacent = adjacent.some(pos => pos.row === toRow && pos.col === toCol);
        
        if (isAdjacent) {
            if (this.board[toRow][toCol] === null) {
                return { valid: true, type: 'move' };
            }
            return { valid: false, type: null };
        }
        
        if (piece === 'cannon') {
            const captureResult = this.validateCannonCapture(fromRow, fromCol, toRow, toCol);
            if (captureResult.valid) {
                return { valid: true, type: 'capture' };
            }
        }
        
        return { valid: false, type: null };
    }
    
    validateCannonCapture(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) {
            return { valid: false, reason: '不在同一直线' };
        }
        
        const dr = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const dc = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        const distance = Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol));
        if (distance !== 2) {
            return { valid: false, reason: '中间必须恰好隔一个空格' };
        }
        
        const midRow = fromRow + dr;
        const midCol = fromCol + dc;
        
        if (this.board[midRow][midCol] !== null) {
            return { valid: false, reason: '中间格子被占用' };
        }
        
        if (this.board[toRow][toCol] !== 'soldier') {
            return { valid: false, reason: '目标不是敌方兵' };
        }
        
        return { valid: true, reason: null };
    }
    
    getValidMoves(index) {
        const { row, col } = this.getRowCol(index);
        const piece = this.board[row][col];
        
        if (!piece || piece !== this.currentTurn) return { moves: [], captures: [] };
        
        const moves = [];
        const captures = [];
        
        const adjacent = this.getAdjacentPositions(row, col);
        adjacent.forEach(pos => {
            if (this.board[pos.row][pos.col] === null) {
                moves.push(this.getIndex(pos.row, pos.col));
            }
        });
        
        if (piece === 'cannon') {
            const cannonCaptures = this.getCannonCaptures(row, col);
            captures.push(...cannonCaptures);
        }
        
        return { moves, captures };
    }
    
    getCannonCaptures(row, col) {
        const captures = [];
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];
        
        directions.forEach(({ dr, dc }) => {
            const midRow = row + dr;
            const midCol = col + dc;
            const targetRow = midRow + dr;
            const targetCol = midCol + dc;
            
            if (this.isValidPosition(midRow, midCol) && this.isValidPosition(targetRow, targetCol)) {
                if (this.board[midRow][midCol] === null && this.board[targetRow][targetCol] === 'soldier') {
                    captures.push(this.getIndex(targetRow, targetCol));
                }
            }
        });
        
        return captures;
    }
    
    isCannonTrapped(row, col) {
        if (this.board[row][col] !== 'cannon') return false;
        
        const adjacent = this.getAdjacentPositions(row, col);
        return adjacent.every(pos => this.board[pos.row][pos.col] !== null);
    }
    
    checkWinCondition() {
        if (this.soldierCount <= 3) {
            this.endGame('cannon');
            return true;
        }
        
        let cannonCount = 0;
        let allTrapped = true;
        
        for (let i = 0; i < this.ROWS; i++) {
            for (let j = 0; j < this.COLS; j++) {
                if (this.board[i][j] === 'cannon') {
                    cannonCount++;
                    if (!this.isCannonTrapped(i, j)) {
                        allTrapped = false;
                    }
                }
            }
        }
        
        if (cannonCount === 0) {
            this.endGame('soldier');
            return true;
        }
        
        if (allTrapped) {
            this.endGame('soldier');
            return true;
        }
        
        if (this.repeatCount >= this.maxRepeats) {
            this.endGame('draw');
            return true;
        }
        
        if (this.moveCount >= this.maxMoves) {
            this.endGame('draw');
            return true;
        }
        
        return false;
    }
    
    boardToString() {
        return this.board.map(row => row.join(',')).join('|');
    }
    
    makeMove(fromIndex, toIndex) {
        if (this.status === GameStatus.GAME_OVER || this.status === GameStatus.PAUSED) return false;
        
        const { row: fromRow, col: fromCol } = this.getRowCol(fromIndex);
        const { row: toRow, col: toCol } = this.getRowCol(toIndex);
        
        const piece = this.board[fromRow][fromCol];
        if (piece !== this.currentTurn) return false;
        
        const validation = this.validateMove(fromIndex, toIndex);
        if (!validation.valid) return false;
        
        this.saveHistory();
        
        const moveType = validation.type;
        const capturedPiece = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        if (moveType === 'capture') {
            this.soldierCount--;
        }
        
        const currentMove = {
            from: fromIndex,
            to: toIndex,
            type: moveType,
            captured: capturedPiece
        };
        this.moveHistory.push(currentMove);
        
        this.moveCount++;
        
        if (this.lastMove && 
            this.lastMove.from === currentMove.from && 
            this.lastMove.to === currentMove.to) {
            this.repeatCount++;
        } else {
            this.repeatCount = 0;
        }
        this.lastMove = currentMove;
        
        if (!this.checkWinCondition()) {
            this.switchTurn();
        }
        
        this.selectedPiece = null;
        this.validMoves = [];
        this.validCaptures = [];
        
        this.render();
        this.updateUI();
        
        return true;
    }
    
    saveHistory() {
        this.history.push({
            board: this.board.map(row => [...row]),
            currentTurn: this.currentTurn,
            cannonCount: this.cannonCount,
            soldierCount: this.soldierCount,
            moveCount: this.moveCount,
            repeatCount: this.repeatCount,
            lastBoardState: this.lastBoardState,
            lastMove: this.lastMove ? { ...this.lastMove } : null
        });
    }
    
    undo() {
        if (this.history.length === 0 || this.status === GameStatus.GAME_OVER) return false;
        
        const lastState = this.history.pop();
        this.board = lastState.board;
        this.currentTurn = lastState.currentTurn;
        this.cannonCount = lastState.cannonCount;
        this.soldierCount = lastState.soldierCount;
        this.moveCount = lastState.moveCount;
        this.repeatCount = lastState.repeatCount;
        this.lastBoardState = lastState.lastBoardState;
        this.lastMove = lastState.lastMove ? { ...lastState.lastMove } : null;
        
        if (this.moveHistory.length > 0) {
            this.moveHistory.pop();
        }
        
        this.selectedPiece = null;
        this.validMoves = [];
        this.validCaptures = [];
        
        this.render();
        this.updateUI();
        
        return true;
    }
    
    switchTurn() {
        this.currentTurn = this.currentTurn === 'cannon' ? 'soldier' : 'cannon';
        this.startTurnTimer();
        
        if (this.currentTurn === 'cannon') {
            this.status = GameStatus.CANNON_TURN;
        } else {
            this.status = GameStatus.SOLDIER_TURN;
        }
    }
    
    endGame(winner) {
        this.status = GameStatus.GAME_OVER;
        this.winner = winner;
        this.stopTurnTimer();
        
        if (winner === 'cannon') {
            this.stats.wins++;
        } else if (winner === 'soldier') {
            this.stats.losses++;
        } else {
            this.stats.draws++;
        }
        
        this.saveStats();
    }
    
    saveStats() {
        localStorage.setItem('cannonWins', this.stats.wins.toString());
        localStorage.setItem('cannonLosses', this.stats.losses.toString());
        localStorage.setItem('cannonDraws', this.stats.draws.toString());
    }
    
    resetStats() {
        this.stats = { wins: 0, losses: 0, draws: 0 };
        localStorage.removeItem('cannonWins');
        localStorage.removeItem('cannonLosses');
        localStorage.removeItem('cannonDraws');
        this.updateUI();
    }
    
    startTurnTimer() {
        this.stopTurnTimer();
        this.turnTime = 30;
        this.timer = setInterval(() => {
            this.turnTime--;
            this.updateUI();
            if (this.turnTime <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }
    
    handleTimeout() {
        const loser = this.currentTurn;
        const winner = loser === 'cannon' ? 'soldier' : 'cannon';
        this.endGame(winner);
        this.render();
        this.updateUI();
    }
    
    stopTurnTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const btn = document.getElementById('ai-toggle-btn');
        btn.textContent = this.aiEnabled ? '切换双人对战' : '切换人机对战';
        
        this.init();
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }
    
    switchSide() {
        if (this.status === GameStatus.GAME_OVER || !this.aiEnabled) return;
        
        this.init(true);
    }
    
    reverseBoard() {
        this.board = this.board.reverse();
    }
    
    selectPiece(index) {
        if (this.status === GameStatus.GAME_OVER) return;
        
        if (this.selectedPiece === index) {
            this.selectedPiece = null;
            this.validMoves = [];
            this.validCaptures = [];
            this.render();
            return;
        }
        
        if (this.validateSelection(index)) {
            this.selectedPiece = index;
            const { moves, captures } = this.getValidMoves(index);
            this.validMoves = moves;
            this.validCaptures = captures;
            this.render();
            return;
        }
        
        if (this.selectedPiece !== null) {
            if (this.validMoves.includes(index)) {
                this.makeMove(this.selectedPiece, index);
            } else if (this.validCaptures.includes(index)) {
                this.makeMove(this.selectedPiece, index);
            }
        }
    }
    
    render() {
        const boardElement = document.getElementById('board');
        const oldCells = boardElement.querySelectorAll('.cell');
        
        oldCells.forEach(cell => {
            const index = parseInt(cell.dataset.index);
            const { row, col } = this.getRowCol(index);
            const piece = this.board[row][col];
            
            const pieceElement = cell.querySelector('.piece');
            if (pieceElement) {
                if (piece === null) {
                    pieceElement.remove();
                } else {
                    pieceElement.className = `piece ${piece}`;
                    pieceElement.textContent = piece === 'cannon' ? '炮' : '兵';
                }
            } else if (piece !== null) {
                const newPiece = document.createElement('div');
                newPiece.className = `piece ${piece}`;
                newPiece.textContent = piece === 'cannon' ? '炮' : '兵';
                cell.appendChild(newPiece);
            }
            
            cell.classList.remove('selected', 'valid-move', 'valid-capture');
            if (this.selectedPiece === index) {
                cell.classList.add('selected');
            }
            if (this.validMoves.includes(index)) {
                cell.classList.add('valid-move');
            }
            if (this.validCaptures.includes(index)) {
                cell.classList.add('valid-capture');
            }
        });
    }
    
    renderFull() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.ROWS; i++) {
            for (let j = 0; j < this.COLS; j++) {
                const index = this.getIndex(i, j);
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.index = index;
                
                if (this.board[i][j] === 'cannon') {
                    const piece = document.createElement('div');
                    piece.className = 'piece cannon';
                    piece.textContent = '炮';
                    cell.appendChild(piece);
                } else if (this.board[i][j] === 'soldier') {
                    const piece = document.createElement('div');
                    piece.className = 'piece soldier';
                    piece.textContent = '兵';
                    cell.appendChild(piece);
                }
                
                cell.addEventListener('click', () => this.selectPiece(index));
                boardElement.appendChild(cell);
            }
        }
    }
    
    updateUI() {
        document.getElementById('current-turn').textContent = 
            `当前回合：${this.currentTurn === 'cannon' ? '炮方' : '兵方'}`;
        document.getElementById('cannon-count').textContent = this.cannonCount;
        document.getElementById('soldier-count').textContent = this.soldierCount;
        
        const timerElement = document.getElementById('turn-timer');
        if (timerElement) {
            timerElement.textContent = `回合时间：${this.turnTime}s`;
        }
        
        const moveCounterElement = document.getElementById('move-counter');
        if (moveCounterElement) {
            moveCounterElement.textContent = `当前步数：${this.moveCount}`;
        }
        
        const statusElement = document.getElementById('game-status');
        statusElement.className = 'game-status';
        
        if (this.status === GameStatus.GAME_OVER) {
            if (this.winner === 'cannon') {
                statusElement.textContent = '🎉 炮方胜利！';
                statusElement.classList.add('win');
            } else if (this.winner === 'soldier') {
                statusElement.textContent = '🎉 兵方胜利！';
                statusElement.classList.add('lose');
            } else {
                statusElement.textContent = '🤝 平局！';
                statusElement.classList.add('draw');
            }
        } else if (this.status === GameStatus.PAUSED) {
            statusElement.textContent = '⏸️ 游戏暂停';
            statusElement.classList.add('paused');
        } else {
            statusElement.textContent = '';
        }
        
        const sideElement = document.getElementById('player-side');
        if (sideElement && this.aiEnabled) {
            const playerSide = this.aiSide === 'soldier' ? '炮' : '兵';
            sideElement.textContent = `你操控：${playerSide}方`;
        }
        
        const statsElement = document.getElementById('game-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span>胜：${this.stats.wins}</span>
                <span>负：${this.stats.losses}</span>
                <span>平：${this.stats.draws}</span>
            `;
        }
    }
    
    togglePause() {
        if (this.status === GameStatus.PLAYING || 
            this.status === GameStatus.CANNON_TURN || 
            this.status === GameStatus.SOLDIER_TURN) {
            this.status = GameStatus.PAUSED;
            this.stopTurnTimer();
        } else if (this.status === GameStatus.PAUSED) {
            this.status = this.currentTurn === 'cannon' ? GameStatus.CANNON_TURN : GameStatus.SOLDIER_TURN;
            this.startTurnTimer();
        }
        this.updateUI();
    }
    
    getBoardCopy() {
        return this.board.map(row => [...row]);
    }
    
    getCurrentTurn() {
        return this.currentTurn;
    }
    
    getGameStatus() {
        return this.status;
    }
    
    getMoveHistory() {
        return [...this.moveHistory];
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    game.renderFull();
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        game.init();
        game.renderFull();
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => {
        game.undo();
    });
    
    document.getElementById('ai-toggle-btn').addEventListener('click', () => {
        game.toggleAI();
    });
    
    document.getElementById('difficulty').addEventListener('change', (e) => {
        game.setDifficulty(e.target.value);
    });
    
    document.getElementById('pause-btn')?.addEventListener('click', () => {
        game.togglePause();
    });
    
    document.getElementById('reset-stats-btn')?.addEventListener('click', () => {
        game.resetStats();
    });
    
    window.game = game;
});