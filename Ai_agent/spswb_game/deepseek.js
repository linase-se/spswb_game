class DeepSeekPlugin {
    constructor() {
        this.game = null;
        this.smartAI = null;
        this.ragSystem = null;
        this.config = null;
        this.conversationHistory = [];
        this.initialize();
    }

    async initialize() {
        await this.loadConfig();
        await this.waitForGameAsync();
        await this.waitForSmartAIAsync();
        await this.waitForRAGAsync();
        this.setupUI();
    }

    waitForRAGAsync() {
        return new Promise((resolve) => {
            const checkRAG = () => {
                if (window.ragSystem) {
                    this.ragSystem = window.ragSystem;
                    resolve();
                } else {
                    setTimeout(checkRAG, 50);
                }
            };
            checkRAG();
        });
    }

    waitForGameAsync() {
        return new Promise((resolve) => {
            const checkGame = () => {
                if (window.game) {
                    this.game = window.game;
                    this.setupGameListeners();
                    resolve();
                } else {
                    setTimeout(checkGame, 50);
                }
            };
            checkGame();
        });
    }

    waitForSmartAIAsync() {
        return new Promise((resolve) => {
            const checkAI = () => {
                if (window.smartAI) {
                    this.smartAI = window.smartAI;
                    resolve();
                } else {
                    setTimeout(checkAI, 50);
                }
            };
            checkAI();
        });
    }

    async loadConfig() {
        try {
            const response = await fetch('deepseek.config.json');
            this.config = await response.json();
        } catch (error) {
            console.error('加载 DeepSeek 配置失败:', error);
        }
    }

    setupGameListeners() {
        if (!this.game) return;

        const observer = new MutationObserver(() => {
            this.onGameStateChanged();
        });

        const board = document.getElementById('board');
        if (board) {
            observer.observe(board, { childList: true, subtree: true });
        }
    }

    setupUI() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'deepseek-chat-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <h3>🤖 DeepSeek AI 助手</h3>
                <button class="close-chat">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="输入指令或问题..." />
                <button id="send-button">发送</button>
            </div>
        `;

        document.body.appendChild(chatContainer);

        const toggleButton = document.createElement('button');
        toggleButton.className = 'deepseek-toggle-btn';
        toggleButton.innerHTML = '🤖';
        toggleButton.title = '打开 AI 助手';
        document.body.appendChild(toggleButton);

        const messagesContainer = document.getElementById('chat-messages');
        const input = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const closeBtn = chatContainer.querySelector('.close-chat');

        toggleButton.addEventListener('click', () => {
            chatContainer.classList.toggle('show');
        });

        closeBtn.addEventListener('click', () => {
            chatContainer.classList.remove('show');
        });

        sendButton.addEventListener('click', () => this.handleUserMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });

        this.addSystemMessage('你好！我是 DeepSeek AI 助手。我可以帮你：\n\n• 开始新游戏\n• 分析棋局\n• 提供走棋建议\n• 解释游戏规则\n• 设置难度\n\n输入你的指令或问题吧！');
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addAIMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async handleUserMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.addUserMessage(text);

        const gameState = this.getGameState();
        const systemPrompt = this.buildSystemPrompt(gameState, text);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.slice(-10),
            { role: 'user', content: text }
        ];

        try {
            const response = await this.callDeepSeekAPI(messages);
            this.addAIMessage(response);
            this.conversationHistory.push(
                { role: 'user', content: text },
                { role: 'assistant', content: response }
            );

            this.executeCommands(response);
        } catch (error) {
            this.addAIMessage('抱歉，我遇到了一些问题：' + error.message);
        }
    }

    buildSystemPrompt(gameState, userQuery = '') {
        let knowledge = '';
        if (this.ragSystem && userQuery) {
            knowledge = this.ragSystem.getRelevantKnowledge(userQuery);
        }

        return `你是一个三炮十五兵游戏的智能助手，集成了高级AI下棋代理和RAG知识库系统。

游戏规则：
- 棋盘：5×5网格，共25个点位（索引0-24）
- 炮方：3枚炮，可以移动和隔子吃兵
- 兵方：15枚兵，只能移动，不能吃子
- 炮吃子：同一条直线，中间隔一个空格吃敌方兵
- 胜利条件：炮方吃掉大部分兵，兵方围困所有炮

当前游戏状态：
- 当前回合：${gameState.currentTurn === 'cannon' ? '炮方' : '兵方'}
- 炮数量：${gameState.cannonCount}
- 兵数量：${gameState.soldierCount}
- 步数：${gameState.moveCount}
- AI模式：${gameState.aiEnabled ? '开启' : '关闭'}
- 难度：${gameState.difficulty}

棋盘状态（0-24位置）：
${this.formatBoard(gameState.board)}

${knowledge}

你可以执行以下命令：
1. startGame() - 开始新游戏
2. makeMove(from, to) - 移动棋子，例如：makeMove(21, 16)
3. undoMove() - 悔棋
4. setDifficulty(level) - 设置难度（easy/medium/hard）
5. toggleAI() - 切换人机/双人对战
6. switchSide() - 切换阵营
7. resetStats() - 重置战绩
8. getAIRecommendation() - 获取AI推荐的最佳走法
9. getAIAnalysis() - 获取AI对当前局势的分析
10. setAIDifficulty(level) - 设置智能AI难度
11. getAIStatus() - 获取AI状态信息
12. forceAIMove() - 强制AI执行一步棋

请用中文回答用户的问题，并在需要时执行相应的命令。`;
    }

    formatBoard(board) {
        const symbols = {
            'cannon': '炮',
            'soldier': '兵',
            'null': '·'
        };
        
        if (!board || !Array.isArray(board)) {
            return '无法获取棋盘状态';
        }
        
        let result = '';
        for (let i = 0; i < 5; i++) {
            if (!board[i] || !Array.isArray(board[i])) {
                result += '· · · · ·\n';
                continue;
            }
            for (let j = 0; j < 5; j++) {
                const piece = board[i][j];
                result += symbols[piece] || '·';
                if (j < 4) result += ' ';
            }
            result += '\n';
        }
        return result;
    }

    async callDeepSeekAPI(messages) {
        if (!this.config || !this.config.apiKey || this.config.apiKey === 'YOUR_DEEPSEEK_API_KEY') {
            throw new Error('请先在 deepseek.config.json 中配置 API Key');
        }

        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API 请求失败');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    executeCommands(response) {
        const commands = [
            { pattern: /startGame\s*\(\s*\)/i, handler: () => this.handleStartGame() },
            { pattern: /makeMove\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i, handler: (match) => this.handleMakeMove(parseInt(match[1]), parseInt(match[2])) },
            { pattern: /undoMove\s*\(\s*\)/i, handler: () => this.handleUndoMove() },
            { pattern: /setDifficulty\s*\(\s*(\w+)\s*\)/i, handler: (match) => this.handleSetDifficulty(match[1]) },
            { pattern: /toggleAI\s*\(\s*\)/i, handler: () => this.handleToggleAI() },
            { pattern: /switchSide\s*\(\s*\)/i, handler: () => this.handleSwitchSide() },
            { pattern: /resetStats\s*\(\s*\)/i, handler: () => this.handleResetStats() },
            { pattern: /getAIRecommendation\s*\(\s*\)/i, handler: () => this.handleGetAIRecommendation() },
            { pattern: /getAIAnalysis\s*\(\s*\)/i, handler: () => this.handleGetAIAnalysis() },
            { pattern: /setAIDifficulty\s*\(\s*(\w+)\s*\)/i, handler: (match) => this.handleSetAIDifficulty(match[1]) },
            { pattern: /getAIStatus\s*\(\s*\)/i, handler: () => this.handleGetAIStatus() },
            { pattern: /forceAIMove\s*\(\s*\)/i, handler: () => this.handleForceAIMove() }
        ];

        commands.forEach(({ pattern, handler }) => {
            const match = response.match(pattern);
            if (match) {
                handler();
            }
        });
    }

    handleStartGame() {
        if (this.game) {
            this.game.init();
            this.game.renderFull();
            this.addSystemMessage('✅ 新游戏已开始！');
        }
    }

    handleMakeMove(from, to) {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        const result = this.game.makeMove(from, to);
        if (result) {
            this.addSystemMessage(`✅ 移动成功：从位置 ${from} 到 ${to}`);
        } else {
            this.addSystemMessage('❌ 移动失败，请检查棋子位置和规则');
        }
    }

    handleUndoMove() {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        const result = this.game.undo();
        if (result) {
            this.addSystemMessage('✅ 悔棋成功');
        } else {
            this.addSystemMessage('❌ 无法悔棋');
        }
    }

    handleSetDifficulty(level) {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        const validLevels = ['easy', 'medium', 'hard'];
        if (!validLevels.includes(level.toLowerCase())) {
            this.addSystemMessage('❌ 无效的难度级别，请使用：easy, medium, hard');
            return;
        }

        this.game.setDifficulty(level.toLowerCase());
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = level.toLowerCase();
        }
        this.addSystemMessage(`✅ 难度已设置为：${level}`);
    }

    handleToggleAI() {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        this.game.toggleAI();
        this.addSystemMessage(`✅ 已切换为：${this.game.aiEnabled ? '人机对战' : '双人对战'}`);
    }

    handleSwitchSide() {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        this.game.switchSide();
        this.addSystemMessage('✅ 阵营已切换');
    }

    handleResetStats() {
        if (!this.game) {
            this.addSystemMessage('❌ 游戏未初始化');
            return;
        }

        this.game.resetStats();
        this.addSystemMessage('✅ 战绩已重置');
    }

    handleGetAIRecommendation() {
        if (!this.smartAI || !this.game) {
            this.addSystemMessage('❌ AI 或游戏未初始化');
            return;
        }

        const pieceType = this.game.currentTurn;
        const moves = this.smartAI.getAllValidMoves(pieceType);
        
        if (moves.length === 0) {
            this.addSystemMessage('❌ 没有可用的走法');
            return;
        }

        const bestMove = this.smartAI.findBestMove();
        
        if (bestMove) {
            const { row: fromRow, col: fromCol } = this.game.getRowCol(bestMove.from);
            const { row: toRow, col: toCol } = this.game.getRowCol(bestMove.to);
            const type = bestMove.type === 'capture' ? '吃子' : '移动';
            
            this.addSystemMessage(`🎯 AI 推荐走法：${type} (${fromRow},${fromCol}) → (${toRow},${toCol})`);
            this.addSystemMessage(`📊 共有 ${moves.length} 种可用走法`);
        } else {
            this.addSystemMessage('❌ AI 无法推荐走法');
        }
    }

    handleGetAIAnalysis() {
        if (!this.smartAI || !this.game) {
            this.addSystemMessage('❌ AI 或游戏未初始化');
            return;
        }

        const board = this.game.getBoardCopy();
        const cannonScore = this.smartAI.evaluateBoard(board, 'cannon');
        const soldierScore = this.smartAI.evaluateBoard(board, 'soldier');
        
        const advantage = cannonScore > soldierScore ? '炮方' : '兵方';
        const advantagePercent = Math.abs(cannonScore - soldierScore) / Math.max(cannonScore, soldierScore, 1) * 100;
        
        this.addSystemMessage('📊 局势分析：');
        this.addSystemMessage(`  - 炮方评分：${cannonScore}`);
        this.addSystemMessage(`  - 兵方评分：${soldierScore}`);
        this.addSystemMessage(`  - 当前优势：${advantage} (${advantagePercent.toFixed(1)}%)`);
        this.addSystemMessage(`  - 炮数量：${this.game.cannonCount}`);
        this.addSystemMessage(`  - 兵数量：${this.game.soldierCount}`);
        this.addSystemMessage(`  - 当前回合：${this.game.currentTurn === 'cannon' ? '炮方' : '兵方'}`);
        this.addSystemMessage(`  - 步数：${this.game.moveCount}`);
    }

    handleSetAIDifficulty(level) {
        if (!this.smartAI) {
            this.addSystemMessage('❌ 智能 AI 未初始化');
            return;
        }

        const validLevels = ['easy', 'medium', 'hard'];
        if (!validLevels.includes(level.toLowerCase())) {
            this.addSystemMessage('❌ 无效的难度级别，请使用：easy, medium, hard');
            return;
        }

        this.smartAI.difficulty = level.toLowerCase();
        this.smartAI.maxDepth = this.smartAI.getMaxDepth();

        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = level.toLowerCase();
        }

        this.addSystemMessage(`✅ 智能 AI 难度已设置为：${level}（搜索深度：${this.smartAI.maxDepth}）`);
    }

    handleGetAIStatus() {
        if (!this.smartAI) {
            this.addSystemMessage('❌ 智能 AI 未初始化');
            return;
        }

        this.addSystemMessage('🤖 AI 状态信息：');
        this.addSystemMessage(`  - 状态：${this.smartAI.thinking ? '思考中' : '就绪'}`);
        this.addSystemMessage(`  - 难度：${this.smartAI.difficulty}`);
        this.addSystemMessage(`  - 搜索深度：${this.smartAI.maxDepth}`);
        this.addSystemMessage(`  - 历史记录：${this.smartAI.history.length} 步`);
    }

    handleForceAIMove() {
        if (!this.smartAI || !this.game) {
            this.addSystemMessage('❌ AI 或游戏未初始化');
            return;
        }

        if (this.smartAI.thinking) {
            this.addSystemMessage('⏳ AI 正在思考中，请稍候');
            return;
        }

        const pieceType = this.game.currentTurn;
        const moves = this.smartAI.getAllValidMoves(pieceType);
        
        if (moves.length === 0) {
            this.addSystemMessage('❌ 没有可用的走法');
            return;
        }

        const bestMove = this.smartAI.findBestMove();
        
        if (bestMove) {
            this.game.makeMove(bestMove.from, bestMove.to);
            const { row: fromRow, col: fromCol } = this.game.getRowCol(bestMove.from);
            const { row: toRow, col: toCol } = this.game.getRowCol(bestMove.to);
            const type = bestMove.type === 'capture' ? '吃子' : '移动';
            
            this.addSystemMessage(`✅ AI 执行了${type}：(${fromRow},${fromCol}) → (${toRow},${toCol})`);
        } else {
            this.addSystemMessage('❌ AI 无法决定移动');
        }
    }

    getGameState() {
        if (!this.game) {
            return {
                board: Array(5).fill(null).map(() => Array(5).fill(null)),
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
            difficulty: this.game.difficulty
        };
    }

    onGameStateChanged() {
        if (this.conversationHistory.length > 0) {
            const gameState = this.getGameState();
            const statusMessage = `游戏状态更新：当前回合 ${gameState.currentTurn === 'cannon' ? '炮方' : '兵方'}，步数 ${gameState.moveCount}`;
            this.addSystemMessage(statusMessage);
        }
    }
}

let deepSeekPlugin;

document.addEventListener('DOMContentLoaded', () => {
    deepSeekPlugin = new DeepSeekPlugin();
    window.deepSeekPlugin = deepSeekPlugin;
});

window.deepSeekPlugin = deepSeekPlugin;
