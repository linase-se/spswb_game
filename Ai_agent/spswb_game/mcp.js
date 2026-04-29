class MCPPlugin {
    constructor() {
        this.game = null;
        this.smartAI = null;
        this.ragSystem = null;
        this.initialize();
    }

    initialize() {
        this.setupMCPHandlers();
        this.waitForGame();
        this.waitForSmartAI();
        this.waitForRAG();
    }

    waitForRAG() {
        if (window.ragSystem) {
            this.ragSystem = window.ragSystem;
        } else {
            setTimeout(() => this.waitForRAG(), 50);
        }
    }

    waitForGame() {
        if (window.game) {
            this.game = window.game;
            this.setupGameListeners();
        } else {
            setTimeout(() => this.waitForGame(), 50);
        }
    }

    waitForSmartAI() {
        if (window.smartAI) {
            this.smartAI = window.smartAI;
        } else {
            setTimeout(() => this.waitForSmartAI(), 50);
        }
    }

    setupMCPHandlers() {
        if (typeof mcp !== 'undefined') {
            mcp.commands.register('startGame', this.handleStartGame.bind(this));
            mcp.commands.register('makeMove', this.handleMakeMove.bind(this));
            mcp.commands.register('getBoard', this.handleGetBoard.bind(this));
            mcp.commands.register('getGameStatus', this.handleGetGameStatus.bind(this));
            mcp.commands.register('undoMove', this.handleUndoMove.bind(this));
            mcp.commands.register('setDifficulty', this.handleSetDifficulty.bind(this));
            mcp.commands.register('toggleAI', this.handleToggleAI.bind(this));
            mcp.commands.register('resetStats', this.handleResetStats.bind(this));
            mcp.commands.register('switchSide', this.handleSwitchSide.bind(this));

            mcp.commands.register('getAIRecommendation', this.handleGetAIRecommendation.bind(this));
            mcp.commands.register('getAIAnalysis', this.handleGetAIAnalysis.bind(this));
            mcp.commands.register('setAIDifficulty', this.handleSetAIDifficulty.bind(this));
            mcp.commands.register('getAIStatus', this.handleGetAIStatus.bind(this));
            mcp.commands.register('forceAIMove', this.handleForceAIMove.bind(this));

            mcp.commands.register('searchKnowledge', this.handleSearchKnowledge.bind(this));
            mcp.commands.register('getKnowledgeByCategory', this.handleGetKnowledgeByCategory.bind(this));
            mcp.commands.register('getAllKnowledge', this.handleGetAllKnowledge.bind(this));

            mcp.events.on('activated', this.onActivated.bind(this));
            mcp.events.on('deactivated', this.onDeactivated.bind(this));
        }
    }

    setupGameListeners() {
        if (!this.game) return;

        const observer = new MutationObserver(() => {
            this.notifyGameStateChange();
        });

        const board = document.getElementById('board');
        if (board) {
            observer.observe(board, { childList: true, subtree: true });
        }
    }

    notifyGameStateChange() {
        if (typeof mcp !== 'undefined' && this.game) {
            mcp.events.emit('gameStateChanged', this.getGameState());
        }
    }

    getGameState() {
        if (!this.game) {
            return {
                board: [],
                currentTurn: 'cannon',
                status: 'standby',
                winner: null,
                cannonCount: 3,
                soldierCount: 15,
                moveCount: 0,
                aiEnabled: true,
                aiSide: 'soldier',
                difficulty: 'easy'
            };
        }

        return {
            board: this.game.board.map(row => [...row]),
            currentTurn: this.game.currentTurn,
            status: this.game.status,
            winner: this.game.winner,
            cannonCount: this.game.cannonCount,
            soldierCount: this.game.soldierCount,
            moveCount: this.game.moveCount,
            aiEnabled: this.game.aiEnabled,
            aiSide: this.game.aiSide,
            difficulty: this.game.difficulty,
            stats: { ...this.game.stats }
        };
    }

    handleStartGame() {
        if (this.game) {
            this.game.init();
            this.game.renderFull();
        }
        return { success: true, message: '游戏已开始' };
    }

    handleMakeMove(args) {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        const { from, to } = args;
        if (typeof from !== 'number' || typeof to !== 'number') {
            return { success: false, error: '参数类型错误' };
        }

        const result = this.game.makeMove(from, to);
        return {
            success: result,
            message: result ? '移动成功' : '移动失败'
        };
    }

    handleGetBoard() {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        return {
            success: true,
            board: this.game.board.map(row => [...row]),
            cannonCount: this.game.cannonCount,
            soldierCount: this.game.soldierCount
        };
    }

    handleGetGameStatus() {
        return {
            success: true,
            ...this.getGameState()
        };
    }

    handleUndoMove() {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        const result = this.game.undo();
        return {
            success: result,
            message: result ? '悔棋成功' : '无法悔棋'
        };
    }

    handleSetDifficulty(args) {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        const { level } = args;
        const validLevels = ['easy', 'medium', 'hard'];
        
        if (!validLevels.includes(level)) {
            return { success: false, error: '无效的难度级别' };
        }

        this.game.setDifficulty(level);
        
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = level;
        }

        return { success: true, message: `难度已设置为: ${level}` };
    }

    handleToggleAI() {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        this.game.toggleAI();
        return {
            success: true,
            aiEnabled: this.game.aiEnabled,
            message: this.game.aiEnabled ? '已切换为人机对战' : '已切换为双人对战'
        };
    }

    handleResetStats() {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        this.game.resetStats();
        return { success: true, message: '战绩已重置' };
    }

    handleSwitchSide() {
        if (!this.game) {
            return { success: false, error: '游戏未初始化' };
        }

        this.game.switchSide();
        return { success: true, message: '阵营已切换' };
    }

    handleGetAIRecommendation() {
        if (!this.smartAI || !this.game) {
            return { success: false, error: 'AI 或游戏未初始化' };
        }

        const pieceType = this.game.getCurrentTurn();
        const moves = this.smartAI.getAllValidMoves(pieceType);
        
        if (moves.length === 0) {
            return { success: true, recommendation: null, message: '没有可用的走法' };
        }

        const bestMove = this.smartAI.findBestMove();
        
        if (bestMove) {
            return {
                success: true,
                recommendation: {
                    from: bestMove.from,
                    to: bestMove.to,
                    type: bestMove.type,
                    message: this.getMoveDescription(bestMove)
                },
                availableMoves: moves.length
            };
        }

        return { success: false, error: '无法获取推荐' };
    }

    handleGetAIAnalysis() {
        if (!this.smartAI || !this.game) {
            return { success: false, error: 'AI 或游戏未初始化' };
        }

        const board = this.game.getBoardCopy();
        const cannonScore = this.smartAI.evaluateBoard(board, 'cannon');
        const soldierScore = this.smartAI.evaluateBoard(board, 'soldier');
        
        const analysis = {
            cannonScore: cannonScore,
            soldierScore: soldierScore,
            advantage: cannonScore > soldierScore ? 'cannon' : 'soldier',
            advantagePercent: Math.abs(cannonScore - soldierScore) / Math.max(cannonScore, soldierScore, 1) * 100,
            cannonCount: this.game.cannonCount,
            soldierCount: this.game.soldierCount,
            currentTurn: this.game.currentTurn,
            status: this.game.status,
            moveCount: this.game.moveCount
        };

        return { success: true, analysis };
    }

    handleSetAIDifficulty(args) {
        if (!this.smartAI) {
            return { success: false, error: '智能 AI 未初始化' };
        }

        const { level } = args;
        const validLevels = ['easy', 'medium', 'hard'];
        
        if (!validLevels.includes(level)) {
            return { success: false, error: '无效的难度级别' };
        }

        this.smartAI.difficulty = level;
        this.smartAI.maxDepth = this.smartAI.getMaxDepth();

        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = level;
        }

        return {
            success: true,
            message: `智能 AI 难度已设置为: ${level}`,
            depth: this.smartAI.maxDepth
        };
    }

    handleGetAIStatus() {
        if (!this.smartAI) {
            return {
                success: true,
                active: false,
                message: '智能 AI 未初始化'
            };
        }

        return {
            success: true,
            active: true,
            difficulty: this.smartAI.difficulty,
            maxDepth: this.smartAI.maxDepth,
            thinking: this.smartAI.thinking,
            historyLength: this.smartAI.history.length
        };
    }

    handleForceAIMove() {
        if (!this.smartAI || !this.game) {
            return { success: false, error: 'AI 或游戏未初始化' };
        }

        if (this.smartAI.thinking) {
            return { success: false, error: 'AI 正在思考中' };
        }

        const pieceType = this.game.getCurrentTurn();
        const moves = this.smartAI.getAllValidMoves(pieceType);
        
        if (moves.length === 0) {
            return { success: false, error: '没有可用的走法' };
        }

        const bestMove = this.smartAI.findBestMove();
        
        if (bestMove) {
            this.game.makeMove(bestMove.from, bestMove.to);
            return {
                success: true,
                move: {
                    from: bestMove.from,
                    to: bestMove.to,
                    type: bestMove.type
                },
                message: `AI 执行了移动: ${this.getMoveDescription(bestMove)}`
            };
        }

        return { success: false, error: 'AI 无法决定移动' };
    }

    getMoveDescription(move) {
        const { row: fromRow, col: fromCol } = this.game.getRowCol(move.from);
        const { row: toRow, col: toCol } = this.game.getRowCol(move.to);
        
        const type = move.type === 'capture' ? '吃子' : '移动';
        
        return `${type}: (${fromRow},${fromCol}) → (${toRow},${toCol})`;
    }

    handleSearchKnowledge(args) {
        if (!this.ragSystem) {
            return { success: false, error: 'RAG 系统未初始化' };
        }

        const { query, topK = 3 } = args;
        
        if (!query) {
            return { success: false, error: '请提供搜索查询' };
        }

        const results = this.ragSystem.search(query, topK);
        
        return {
            success: true,
            query: query,
            results: results.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category,
                content: item.content,
                score: item.score
            }))
        };
    }

    handleGetKnowledgeByCategory(args) {
        if (!this.ragSystem) {
            return { success: false, error: 'RAG 系统未初始化' };
        }

        const { category } = args;
        
        if (!category) {
            return { success: false, error: '请提供分类名称' };
        }

        const results = this.ragSystem.getByCategory(category);
        
        return {
            success: true,
            category: category,
            results: results.map(item => ({
                id: item.id,
                title: item.title,
                content: item.content
            }))
        };
    }

    handleGetAllKnowledge() {
        if (!this.ragSystem) {
            return { success: false, error: 'RAG 系统未初始化' };
        }

        const categories = ['rules', 'strategy', 'position', 'faq', 'tips'];
        const knowledge = {};

        categories.forEach(category => {
            knowledge[category] = this.ragSystem.getByCategory(category).map(item => ({
                id: item.id,
                title: item.title,
                content: item.content
            }));
        });

        return {
            success: true,
            knowledge: knowledge,
            totalCount: this.ragSystem.knowledgeBase.length
        };
    }

    onActivated() {
        console.log('MCP 插件已激活');
        this.notifyGameStateChange();
    }

    onDeactivated() {
        console.log('MCP 插件已停用');
    }
}

let mcpPlugin;

document.addEventListener('DOMContentLoaded', () => {
    mcpPlugin = new MCPPlugin();
    window.mcpPlugin = mcpPlugin;
});

window.mcpPlugin = mcpPlugin;
