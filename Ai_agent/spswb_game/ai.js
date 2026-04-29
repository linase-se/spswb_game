class AI {
    constructor(game) {
        this.game = game;
        this.difficulty = 'easy';
        this.thinking = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (window.game) {
                window.game.init();
            }
        });
    }
    
    shouldAct() {
        return this.game.aiEnabled && 
               this.game.getGameStatus() !== 'game_over' && 
               !this.thinking &&
               this.game.getCurrentTurn() === this.game.aiSide;
    }
    
    async act() {
        if (!this.shouldAct()) return;
        
        this.thinking = true;
        
        await this.delay(this.getThinkTime());
        
        let move;
        const pieceType = this.game.aiSide;
        
        switch (this.difficulty) {
            case 'easy':
                move = this.getEasyMove(pieceType);
                break;
            case 'medium':
                move = this.getMediumMove(pieceType);
                break;
            case 'hard':
                move = this.getHardMove(pieceType);
                break;
        }
        
        if (move) {
            this.game.makeMove(move.from, move.to);
        }
        
        this.thinking = false;
        
        setTimeout(() => {
            if (this.shouldAct()) {
                this.act();
            }
        }, 300);
    }
    
    getThinkTime() {
        switch (this.difficulty) {
            case 'easy': return 200;
            case 'medium': return 400;
            case 'hard': return 600;
            default: return 200;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getAllValidMoves(pieceType) {
        const moves = [];
        const board = this.game.board;
        
        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === pieceType) {
                    const index = this.game.getIndex(i, j);
                    const { moves: normalMoves, captures } = this.game.getValidMoves(index);
                    
                    normalMoves.forEach(toIndex => {
                        moves.push({ from: index, to: toIndex, type: 'move' });
                    });
                    
                    captures.forEach(toIndex => {
                        moves.push({ from: index, to: toIndex, type: 'capture' });
                    });
                }
            }
        }
        
        return moves;
    }
    
    getEasyMove(pieceType) {
        const moves = this.getAllValidMoves(pieceType);
        if (moves.length === 0) return null;
        
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    getMediumMove(pieceType) {
        const moves = this.getAllValidMoves(pieceType);
        if (moves.length === 0) return null;
        
        if (pieceType === 'soldier') {
            return this.getMediumSoldierMove(moves);
        } else {
            return this.getMediumCannonMove(moves);
        }
    }
    
    getMediumSoldierMove(moves) {
        const cannonPositions = this.getCannonPositions();
        
        const movesWithScore = moves.map(move => {
            let score = 0;
            
            const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
            
            cannonPositions.forEach(({ row: cannonRow, col: cannonCol }) => {
                const dist = Math.abs(toRow - cannonRow) + Math.abs(toCol - cannonCol);
                
                if (dist <= 2) {
                    score += (3 - dist) * 10;
                }
                
                const adjacent = this.game.getAdjacentPositions(cannonRow, cannonCol);
                const isAdjacent = adjacent.some(pos => pos.row === toRow && pos.col === toCol);
                if (isAdjacent) {
                    score += 25;
                }
            });
            
            return { move, score };
        });
        
        movesWithScore.sort((a, b) => b.score - a.score);
        
        const bestScore = movesWithScore[0].score;
        const bestMoves = movesWithScore.filter(m => m.score === bestScore);
        
        if (Math.random() < 0.7) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
        } else {
            return moves[Math.floor(Math.random() * moves.length)];
        }
    }
    
    getMediumCannonMove(moves) {
        const soldierPositions = this.getSoldierPositions();
        
        const movesWithScore = moves.map(move => {
            let score = 0;
            
            const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
            const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
            
            soldierPositions.forEach(({ row: soldierRow, col: soldierCol }) => {
                const dist = Math.abs(toRow - soldierRow) + Math.abs(toCol - soldierCol);
                const oldDist = Math.abs(fromRow - soldierRow) + Math.abs(fromCol - soldierCol);
                
                if (dist < oldDist) {
                    score += (oldDist - dist) * 15;
                }
                
                if (move.type === 'capture') {
                    score += 100;
                }
            });
            
            const edgeBonus = this.getEdgeBonus(toRow, toCol);
            score += edgeBonus * 10;
            
            return { move, score };
        });
        
        movesWithScore.sort((a, b) => b.score - a.score);
        
        const bestScore = movesWithScore[0].score;
        const bestMoves = movesWithScore.filter(m => m.score === bestScore);
        
        if (Math.random() < 0.7) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
        } else {
            return moves[Math.floor(Math.random() * moves.length)];
        }
    }
    
    getHardMove(pieceType) {
        const moves = this.getAllValidMoves(pieceType);
        if (moves.length === 0) return null;
        
        if (pieceType === 'soldier') {
            return this.getHardSoldierMove(moves);
        } else {
            return this.getHardCannonMove(moves);
        }
    }
    
    getHardSoldierMove(moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const score = this.evaluateSoldierMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    getHardCannonMove(moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const score = this.evaluateCannonMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    evaluateSoldierMove(move) {
        let score = 0;
        
        const cannonPositions = this.getCannonPositions();
        const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
        const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
        
        cannonPositions.forEach(({ row: cannonRow, col: cannonCol }) => {
            const oldDist = Math.abs(fromRow - cannonRow) + Math.abs(fromCol - cannonCol);
            const newDist = Math.abs(toRow - cannonRow) + Math.abs(toCol - cannonCol);
            
            if (newDist < oldDist) {
                score += (oldDist - newDist) * 15;
            }
            
            const adjacent = this.game.getAdjacentPositions(cannonRow, cannonCol);
            const isAdjacent = adjacent.some(pos => pos.row === toRow && pos.col === toCol);
            if (isAdjacent) {
                score += 30;
            }
            
            const trappedBefore = this.game.isCannonTrapped(cannonRow, cannonCol);
            
            const tempBoard = this.game.board.map(row => [...row]);
            tempBoard[toRow][toCol] = 'soldier';
            tempBoard[fromRow][fromCol] = null;
            
            const trappedAfter = this.isCannonTrappedInBoard(tempBoard, cannonRow, cannonCol);
            if (trappedAfter && !trappedBefore) {
                score += 150;
            }
            
            const cannonMoves = this.getCannonMovesInBoard(tempBoard, cannonRow, cannonCol);
            score -= cannonMoves.length * 8;
        });
        
        score += this.getEdgeBonus(toRow, toCol) * 5;
        score += this.getCenterBonus(move.to);
        
        return score;
    }
    
    getCannonPositions() {
        const positions = [];
        const board = this.game.board;
        
        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'cannon') {
                    positions.push({ row: i, col: j });
                }
            }
        }
        
        return positions;
    }
    
    getSoldierPositions() {
        const positions = [];
        const board = this.game.board;
        
        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'soldier') {
                    positions.push({ row: i, col: j });
                }
            }
        }
        
        return positions;
    }
    
    evaluateCannonMove(move) {
        let score = 0;
        
        const soldierPositions = this.getSoldierPositions();
        const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
        const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
        
        if (move.type === 'capture') {
            score += 200;
        }
        
        soldierPositions.forEach(({ row: soldierRow, col: soldierCol }) => {
            const dist = Math.abs(toRow - soldierRow) + Math.abs(toCol - soldierCol);
            const oldDist = Math.abs(fromRow - soldierRow) + Math.abs(fromCol - soldierCol);
            
            if (dist < oldDist) {
                score += (oldDist - dist) * 10;
            }
            
            if (dist === 2) {
                const midRow = Math.floor((toRow + soldierRow) / 2);
                const midCol = Math.floor((toCol + soldierCol) / 2);
                if (this.game.board[midRow][midCol] === null) {
                    score += 30;
                }
            }
        });
        
        const edgeBonus = this.getEdgeBonus(toRow, toCol);
        score += edgeBonus * 15;
        
        const tempBoard = this.game.board.map(row => [...row]);
        tempBoard[toRow][toCol] = 'cannon';
        tempBoard[fromRow][fromCol] = null;
        
        const remainingSoldiers = this.game.soldierCount - (move.type === 'capture' ? 1 : 0);
        if (remainingSoldiers <= 3) {
            score += 100;
        }
        
        const trapped = this.isCannonTrappedInBoard(tempBoard, toRow, toCol);
        if (trapped) {
            score -= 200;
        }
        
        return score;
    }
    
    isCannonTrappedInBoard(board, row, col) {
        const adjacent = this.game.getAdjacentPositions(row, col);
        return adjacent.every(pos => board[pos.row][pos.col] !== null);
    }
    
    getCannonMovesInBoard(board, row, col) {
        const moves = [];
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];
        
        directions.forEach(({ dr, dc }) => {
            let r = row + dr;
            let c = col + dc;
            
            if (!this.game.isValidPosition(r, c)) return;
            
            if (board[r][c] === null) {
                moves.push({ type: 'move', to: this.game.getIndex(r, c) });
            } else {
                let obstacleCount = 0;
                r += dr;
                c += dc;
                
                while (this.game.isValidPosition(r, c)) {
                    if (board[r][c] !== null) {
                        obstacleCount++;
                        if (obstacleCount > 1) break;
                    }
                    
                    r += dr;
                    c += dc;
                    
                    if (!this.game.isValidPosition(r, c)) break;
                    
                    if (board[r][c] === 'soldier' && obstacleCount === 1) {
                        moves.push({ type: 'capture', to: this.game.getIndex(r, c) });
                        break;
                    } else if (board[r][c] !== null) {
                        break;
                    }
                }
            }
        });
        
        return moves;
    }
    
    getEdgeBonus(row, col) {
        if (row === 0 || row === this.game.ROWS - 1 || 
            col === 0 || col === this.game.COLS - 1) {
            return 1;
        }
        return 0;
    }
    
    getCenterBonus(index) {
        const { row, col } = this.game.getRowCol(index);
        const centerRow = (this.game.ROWS - 1) / 2;
        const centerCol = (this.game.COLS - 1) / 2;
        
        const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        return Math.max(0, 15 - dist * 4);
    }
}

let ai;

document.addEventListener('DOMContentLoaded', () => {
    const initAI = () => {
        if (window.game) {
            ai = new AI(window.game);
            
            const observer = new MutationObserver(() => {
                setTimeout(() => {
                    ai.act();
                }, 150);
            });
            
            const board = document.getElementById('board');
            observer.observe(board, { childList: true, subtree: true });
            
            window.game.ai = ai;
        } else {
            setTimeout(initAI, 50);
        }
    };
    
    initAI();
});

window.ai = ai;