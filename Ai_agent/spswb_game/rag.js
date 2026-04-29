class RAGSystem {
    constructor() {
        this.knowledgeBase = this.buildKnowledgeBase();
    }

    buildKnowledgeBase() {
        return [
            {
                id: 'rule-1',
                category: 'rules',
                title: '游戏基本规则',
                content: '三炮十五兵是一个经典的中国民间棋类游戏。棋盘为5×5的网格，共25个点位。炮方有3枚炮，可以移动和隔子吃兵。兵方有15枚兵，只能移动，不能吃子。炮吃子需要在同一条直线上，中间隔一个空格才能吃掉敌方的兵。'
            },
            {
                id: 'rule-2',
                category: 'rules',
                title: '炮的移动规则',
                content: '炮可以向上下左右四个方向移动，每次只能移动一格到相邻的空位。炮不能斜着移动，只能走直线。'
            },
            {
                id: 'rule-3',
                category: 'rules',
                title: '炮的吃子规则',
                content: '炮吃子必须满足以下条件：1. 目标位置必须有敌方的兵；2. 炮和目标兵之间必须恰好隔一个空格；3. 必须在同一条直线上（横或竖）。例如：炮在位置21，兵在位置16，中间位置17是空的，那么炮可以从21跳到16吃掉兵。'
            },
            {
                id: 'rule-4',
                category: 'rules',
                title: '兵的移动规则',
                content: '兵只能向上下左右四个方向移动，每次只能移动一格到相邻的空位。兵不能吃任何棋子，只能通过围困炮来获胜。'
            },
            {
                id: 'rule-5',
                category: 'rules',
                title: '胜利条件',
                content: '炮方胜利：吃掉大部分兵，使兵的数量减少到3个或以下。兵方胜利：将所有炮围困在无法移动的位置，即所有炮的周围四个方向都被兵堵住。'
            },
            {
                id: 'strat-1',
                category: 'strategy',
                title: '炮方策略：主动进攻',
                content: '炮方应该积极寻找吃兵的机会，利用隔子吃子的能力消灭敌方兵力。优先攻击那些孤立的兵，或者可以连续吃子的位置。'
            },
            {
                id: 'strat-2',
                category: 'strategy',
                title: '炮方策略：保持灵活性',
                content: '炮方要避免被兵围困，尽量保持在开阔的位置，确保至少有一个方向可以移动。不要让炮陷入角落或被多个兵包围。'
            },
            {
                id: 'strat-3',
                category: 'strategy',
                title: '兵方策略：包围战术',
                content: '兵方应该逐步包围炮，限制炮的活动空间。可以采用分散包围的策略，从多个方向逼近炮，逐步缩小包围圈。'
            },
            {
                id: 'strat-4',
                category: 'strategy',
                title: '兵方策略：封锁路线',
                content: '兵方要封锁炮可能的逃跑路线，特别是炮吃子需要的空格位置。通过占据关键位置，可以有效限制炮的活动能力。'
            },
            {
                id: 'strat-5',
                category: 'strategy',
                title: '开局策略',
                content: '炮方开局应该尽快向棋盘中央移动，占据有利位置。兵方开局应该向前推进，形成封锁线，同时保护好自己的兵不被吃掉。'
            },
            {
                id: 'strat-6',
                category: 'strategy',
                title: '残局策略',
                content: '当兵的数量减少到一定程度时，炮方要更加谨慎，避免被围困。兵方则要抓住机会，集中兵力围困剩余的炮。'
            },
            {
                id: 'pos-1',
                category: 'position',
                title: '位置编号说明',
                content: '棋盘位置编号如下：\n行号: 0  1  2  3  4\n      5  6  7  8  9\n     10 11 12 13 14\n     15 16 17 18 19\n     20 21 22 23 24\n炮初始位置：21, 22, 23（底部中间）\n兵初始位置：0-14（前3行）'
            },
            {
                id: 'pos-2',
                category: 'position',
                title: '关键位置',
                content: '棋盘中心位置12是最重要的战略位置，控制中心可以获得更大的活动空间。四个角位置（0,4,20,24）是比较危险的位置，容易被围困。'
            },
            {
                id: 'faq-1',
                category: 'faq',
                title: '常见问题：炮可以吃炮吗？',
                content: '不可以。炮只能吃兵，不能吃其他炮。炮和炮之间可以互相阻挡，但不能互相吃掉。'
            },
            {
                id: 'faq-2',
                category: 'faq',
                title: '常见问题：兵可以吃炮吗？',
                content: '不可以。兵只能移动，不能吃任何棋子。兵方的胜利方式是围困所有炮。'
            },
            {
                id: 'faq-3',
                category: 'faq',
                title: '常见问题：炮可以跳过多个兵吗？',
                content: '不可以。炮吃子必须恰好隔一个空格，不能跳过多个棋子。如果中间有多个棋子或者没有空格，都不能吃子。'
            },
            {
                id: 'faq-4',
                category: 'faq',
                title: '常见问题：游戏可以平局吗？',
                content: '理论上可以，如果双方都无法移动或者局面重复多次，可能会被判为平局。但通常情况下，一方会最终获胜。'
            },
            {
                id: 'tip-1',
                category: 'tips',
                title: '新手提示：控制节奏',
                content: '无论是炮方还是兵方，都要注意控制游戏节奏。炮方不要急于求成，兵方不要过于冒进。'
            },
            {
                id: 'tip-2',
                category: 'tips',
                title: '新手提示：观察全局',
                content: '下棋前要观察整个棋盘，不仅要看自己的棋子，也要注意对手的位置和可能的动向。'
            }
        ];
    }

    search(query, topK = 3) {
        const results = [];
        
        this.knowledgeBase.forEach(item => {
            let score = 0;
            
            if (item.title.toLowerCase().includes(query.toLowerCase())) {
                score += 3;
            }
            if (item.content.toLowerCase().includes(query.toLowerCase())) {
                score += 2;
            }
            if (item.category.toLowerCase().includes(query.toLowerCase())) {
                score += 1;
            }
            
            if (score > 0) {
                results.push({
                    ...item,
                    score: score
                });
            }
        });
        
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, topK);
    }

    getByCategory(category) {
        return this.knowledgeBase.filter(item => item.category === category);
    }

    getRelevantKnowledge(query) {
        const results = this.search(query, 3);
        
        if (results.length === 0) {
            return '';
        }
        
        let knowledge = '参考知识库：\n';
        results.forEach(item => {
            knowledge += `【${item.title}】\n${item.content}\n\n`;
        });
        
        return knowledge;
    }
}

let ragSystem;

document.addEventListener('DOMContentLoaded', () => {
    ragSystem = new RAGSystem();
    window.ragSystem = ragSystem;
});

window.ragSystem = ragSystem;
