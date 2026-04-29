class SmartAIAgent {
    constructor(game) {
        this.game = game;
        this.difficulty = 'hard';
        this.thinking = false;
        this.history = [];
        this.maxDepth = 3;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.maxDepth = this.getMaxDepth();
        });
    }

    getMaxDepth() {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            default: return 2;
        }
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

        const thinkTime = this.getThinkTime();
        await this.delay(thinkTime);

        const bestMove = this.findBestMove();

        if (bestMove) {
            this.game.makeMove(bestMove.from, bestMove.to);
            this.history.push({
                board: this.game.getBoardCopy(),
                move: bestMove,
                turn: this.game.currentTurn
            });
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
            case 'easy': return 300;
            case 'medium': return 600;
            case 'hard': return 1000;
            default: return 500;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    findBestMove() {
        const pieceType = this.game.aiSide;
        const moves = this.getAllValidMoves(pieceType);

        if (moves.length === 0) return null;

        if (this.difficulty === 'easy') {
            return this.getRandomMove(moves);
        }

        return this.minimax(moves, pieceType);
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

    getRandomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    minimax(moves, pieceType) {
        let bestMove = null;
        let bestScore = pieceType === 'cannon' ? -Infinity : Infinity;

        for (const move of moves) {
            const tempBoard = this.simulateMove(move);
            const score = this.minimaxRecursive(tempBoard, this.maxDepth - 1, 
                pieceType === 'cannon' ? 'soldier' : 'cannon',
                pieceType === 'cannon');
            
            if (pieceType === 'cannon') {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }

        return bestMove;
    }

    minimaxRecursive(board, depth, currentPlayer, isMaximizing) {
        if (depth === 0 || this.isGameOver(board)) {
            return this.evaluateBoard(board, isMaximizing ? 'cannon' : 'soldier');
        }

        const moves = this.getAllValidMovesForBoard(board, currentPlayer);

        if (moves.length === 0) {
            return isMaximizing ? -1000 : 1000;
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of moves) {
                const newBoard = this.simulateMoveOnBoard(board, move, currentPlayer);
                const score = this.minimaxRecursive(newBoard, depth - 1, 'soldier', false);
                maxScore = Math.max(maxScore, score);
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves) {
                const newBoard = this.simulateMoveOnBoard(board, move, currentPlayer);
                const score = this.minimaxRecursive(newBoard, depth - 1, 'cannon', true);
                minScore = Math.min(minScore, score);
            }
            return minScore;
        }
    }

    getAllValidMovesForBoard(board, pieceType) {
        const moves = [];

        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === pieceType) {
                    const index = this.game.getIndex(i, j);
                    const { moves: normalMoves, captures } = this.getValidMovesForBoard(board, index, pieceType);

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

    getValidMovesForBoard(board, index, pieceType) {
        const { row, col } = this.game.getRowCol(index);
        const moves = [];
        const captures = [];

        const adjacent = this.game.getAdjacentPositions(row, col);
        adjacent.forEach(pos => {
            if (board[pos.row][pos.col] === null) {
                moves.push(this.game.getIndex(pos.row, pos.col));
            }
        });

        if (pieceType === 'cannon') {
            const cannonCaptures = this.getCannonCapturesForBoard(board, row, col);
            captures.push(...cannonCaptures);
        }

        return { moves, captures };
    }

    getCannonCapturesForBoard(board, row, col) {
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

            if (this.game.isValidPosition(midRow, midCol) && this.game.isValidPosition(targetRow, targetCol)) {
                if (board[midRow][midCol] === null && board[targetRow][targetCol] === 'soldier') {
                    captures.push(this.game.getIndex(targetRow, targetCol));
                }
            }
        });

        return captures;
    }

    simulateMove(move) {
        const board = this.game.getBoardCopy();
        const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
        const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
        
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = null;
        
        return board;
    }

    simulateMoveOnBoard(board, move, pieceType) {
        const newBoard = board.map(row => [...row]);
        const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
        const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
        
        newBoard[toRow][toCol] = pieceType;
        newBoard[fromRow][fromCol] = null;
        
        return newBoard;
    }

    isGameOver(board) {
        let cannonCount = 0;
        let soldierCount = 0;

        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'cannon') cannonCount++;
                if (board[i][j] === 'soldier') soldierCount++;
            }
        }

        if (soldierCount <= 3) return true;
        if (cannonCount === 0) return true;

        let allTrapped = true;
        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'cannon') {
                    const adjacent = this.game.getAdjacentPositions(i, j);
                    const hasEmpty = adjacent.some(pos => board[pos.row][pos.col] === null);
                    if (hasEmpty) {
                        allTrapped = false;
                        break;
                    }
                }
            }
            if (!allTrapped) break;
        }

        return allTrapped;
    }

    evaluateBoard(board, perspective) {
        let score = 0;

        if (perspective === 'cannon') {
            score += this.evaluateCannonPerspective(board);
        } else {
            score += this.evaluateSoldierPerspective(board);
        }

        return score;
    }

    evaluateCannonPerspective(board) {
        let score = 0;

        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'cannon') {
                    score += this.evaluateCannonPosition(board, i, j);
                }
            }
        }

        return score;
    }

    evaluateSoldierPerspective(board) {
        let score = 0;

        const cannonPositions = [];
        const soldierPositions = [];

        for (let i = 0; i < this.game.ROWS; i++) {
            for (let j = 0; j < this.game.COLS; j++) {
                if (board[i][j] === 'cannon') {
                    cannonPositions.push({ row: i, col: j });
                } else if (board[i][j] === 'soldier') {
                    soldierPositions.push({ row: i, col: j });
                }
            }
        }

        score += this.evaluateSoldierTactics(board, cannonPositions, soldierPositions);

        return score;
    }

    evaluateCannonPosition(board, row, col) {
        let score = 0;

        score += this.checkCaptureOpportunities(board, row, col);
        score += this.checkEscapeRoutes(board, row, col);
        score += this.checkOpenSpace(board, row, col);
        score += this.checkCentralPosition(row, col);

        return score;
    }

    checkCaptureOpportunities(board, row, col) {
        let score = 0;
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

            if (this.game.isValidPosition(midRow, midCol) && this.game.isValidPosition(targetRow, targetCol)) {
                if (board[midRow][midCol] === null && board[targetRow][targetCol] === 'soldier') {
                    score += 500;
                }
            }
        });

        return score;
    }

    checkEscapeRoutes(board, row, col) {
        let score = 0;
        const adjacent = this.game.getAdjacentPositions(row, col);
        const emptySpaces = adjacent.filter(pos => board[pos.row][pos.col] === null);

        if (emptySpaces.length === 0) {
            score -= 1000;
        } else {
            score += emptySpaces.length * 50;
        }

        return score;
    }

    checkOpenSpace(board, row, col) {
        let score = 0;

        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (this.game.isValidPosition(nr, nc) && board[nr][nc] === null) {
                    const dist = Math.abs(dr) + Math.abs(dc);
                    score += Math.max(0, 30 - dist * 5);
                }
            }
        }

        return score;
    }

    checkCentralPosition(row, col) {
        const centerRow = (this.game.ROWS - 1) / 2;
        const centerCol = (this.game.COLS - 1) / 2;
        const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        
        return Math.max(0, 40 - dist * 10);
    }

    evaluateSoldierTactics(board, cannonPositions, soldierPositions) {
        let score = 0;

        cannonPositions.forEach(cannon => {
            score += this.evaluateCannonPressure(board, cannon, soldierPositions);
            score += this.evaluateCannonBlocking(board, cannon);
        });

        score += this.evaluateSurroundingStrategy(board, cannonPositions, soldierPositions);

        return score;
    }

    evaluateCannonPressure(board, cannon, soldierPositions) {
        let score = 0;

        soldierPositions.forEach(soldier => {
            const dist = Math.abs(soldier.row - cannon.row) + Math.abs(soldier.col - cannon.col);
            
            if (dist <= 2) {
                score += (3 - dist) * 40;
            }
            
            if (dist === 1) {
                score += 60;
            }
        });

        return score;
    }

    evaluateCannonBlocking(board, cannon) {
        let score = 0;
        const adjacent = this.game.getAdjacentPositions(cannon.row, cannon.col);
        const blockedSides = adjacent.filter(pos => board[pos.row][pos.col] === 'soldier').length;

        if (blockedSides === 4) {
            score += 2000;
        } else if (blockedSides === 3) {
            score += 500;
        } else if (blockedSides >= 2) {
            score += 100;
        }

        return score;
    }

    evaluateSurroundingStrategy(board, cannonPositions, soldierPositions) {
        let score = 0;

        cannonPositions.forEach(cannon => {
            const surroundingSoldiers = this.getSurroundingSoldiers(board, cannon);
            const escapeRoutes = this.getEscapeRoutes(board, cannon);

            if (surroundingSoldiers >= 3 && escapeRoutes <= 1) {
                score += 300;
            }

            if (surroundingSoldiers >= 4) {
                score += 500;
            }
        });

        return score;
    }

    getSurroundingSoldiers(board, cannon) {
        let count = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = cannon.row + dr;
                const nc = cannon.col + dc;
                if (this.game.isValidPosition(nr, nc) && board[nr][nc] === 'soldier') {
                    count++;
                }
            }
        }

        return count;
    }

    getEscapeRoutes(board, cannon) {
        let count = 0;
        const adjacent = this.game.getAdjacentPositions(cannon.row, cannon.col);

        adjacent.forEach(pos => {
            if (board[pos.row][pos.col] === null) {
                count++;
            }
        });

        return count;
    }
}

let smartAI;

document.addEventListener('DOMContentLoaded', () => {
    const initSmartAI = () => {
        if (window.game) {
            smartAI = new SmartAIAgent(window.game);
            window.smartAI = smartAI;
        } else {
            setTimeout(initSmartAI, 50);
        }
    };

    initSmartAI();
});

window.smartAI = smartAI;
