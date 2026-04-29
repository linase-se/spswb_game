# 三炮十五兵 - DeepSeek AI 集成版

一个经典的中国民间棋类游戏，集成了 DeepSeek AI 智能助手，提供智能游戏指导和交互体验。

## 🎮 游戏介绍

三炮十五兵是一款传统中国棋类游戏：
- **炮方**：3枚炮，可以移动和隔子吃兵
- **兵方**：15枚兵，只能移动，不能吃子
- **胜利条件**：炮方吃掉大部分兵，或兵方围困所有炮

## 🤖 DeepSeek AI 功能

项目已集成 DeepSeek AI，提供以下智能功能：

### AI 助手能力
- 🎯 **游戏指导**：解释游戏规则和策略
- 💡 **走棋建议**：分析当前棋局，提供最佳走法
- 📊 **棋局分析**：实时分析双方优劣势
- 🎲 **游戏控制**：通过自然语言控制游戏
- ❓ **问题解答**：回答关于游戏的各种问题

### 支持的命令
- `startGame` - 开始新游戏
- `makeMove(from, to)` - 移动棋子，例如：`makeMove(21, 16)`
- `undoMove` - 悔棋
- `setDifficulty(level)` - 设置难度（easy/medium/hard）
- `toggleAI` - 切换人机/双人对战
- `switchSide` - 切换阵营
- `resetStats` - 重置战绩

## 🚀 快速开始

### 1. 配置 DeepSeek API Key

编辑 `deepseek.config.json` 文件，将 `YOUR_DEEPSEEK_API_KEY` 替换为你的真实 API Key：

```json
{
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "maxTokens": 1000,
  "temperature": 0.7
}
```

### 2. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账户
3. 进入 API 管理页面
4. 创建新的 API Key

### 3. 运行游戏

#### 方法一：直接打开
直接在浏览器中打开 `index.html` 文件

#### 方法二：使用本地服务器（推荐）
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .
```

然后在浏览器中访问 `http://localhost:8000`

## 💬 使用 AI 助手

### 打开 AI 助手
点击页面右下角的 🤖 按钮打开 AI 助手聊天窗口

### 交互示例

```
用户: 开始新游戏
AI: 好的！我来帮你开始新游戏。
    ✅ 新游戏已开始！

用户: 分析一下当前局势
AI: 当前棋局分析：
    • 炮方（你）：3枚炮，位置在底部
    • 兵方（AI）：15枚兵，分布在前三行
    • 建议：炮方应该利用隔子吃子的优势，优先攻击边缘的兵

用户: 帮我走一步棋
AI: 建议走法：makeMove(21, 16)
    将炮从位置21移动到16，这样可以更好地控制棋盘中心

用户: 设置为困难模式
AI: ✅ 难度已设置为：hard
    困难模式下AI会使用更复杂的策略，祝你好运！
```

## 📋 棋盘位置说明

棋盘是 5×5 的网格，位置索引如下：

```
行号: 0  1  2  3  4
      5  6  7  8  9
     10 11 12 13 14
     15 16 17 18 19
     20 21 22 23 24
```

- **炮**初始位置：21, 22, 23（底部中间）
- **兵**初始位置：0-14（前3行）

## 🎯 游戏规则

### 移动规则
- 所有棋子只能上下左右走相邻1格
- 炮可以移动到相邻空格
- 兵只能移动到相邻空格，不能吃子

### 吃子规则
- 炮吃子：同一条直线，中间隔一个空格吃敌方兵
- 例如：炮在位置21，兵在位置11，位置16为空，则炮可以吃掉位置11的兵

### 胜利条件
- **炮胜**：吃掉大部分兵，兵方无法翻盘（兵数≤3）
- **兵胜**：围困所有炮，使其无法移动

## 🛠️ 技术栈

- **前端**：原生 JavaScript + HTML5 + CSS3
- **AI 集成**：DeepSeek API（OpenAI 兼容）
- **游戏逻辑**：面向对象设计，模块化架构

## 📁 项目结构

```
spswb_game/
├── index.html              # 主页面
├── style.css               # 样式文件
├── game.js                 # 游戏核心逻辑
├── ai.js                   # AI 对手逻辑
├── app.js                  # 应用初始化
├── deepseek.js             # DeepSeek AI 集成
├── deepseek.config.json    # DeepSeek 配置
├── mcp.config.json         # MCP 配置（已废弃）
└── README.md               # 项目说明
```

## 🎨 功能特性

### 游戏功能
- ✅ 完整的游戏逻辑实现
- ✅ 三种难度级别（简单/中等/困难）
- ✅ 人机对战和双人对战模式
- ✅ 悔棋功能
- ✅ 回合计时器
- ✅ 战绩统计
- ✅ 新手教程
- ✅ 响应式设计

### AI 功能
- ✅ DeepSeek AI 智能助手
- ✅ 自然语言交互
- ✅ 棋局分析
- ✅ 走棋建议
- ✅ 游戏控制
- ✅ 实时状态更新

## 🔧 配置选项

### DeepSeek 配置（deepseek.config.json）
```json
{
  "apiKey": "your-api-key",        // DeepSeek API Key
  "baseUrl": "https://api.deepseek.com/v1",  // API 地址
  "model": "deepseek-chat",        // 模型名称
  "maxTokens": 1000,               // 最大回复长度
  "temperature": 0.7               // 创造性程度（0-1）
}
```

## 📝 注意事项

1. **API Key 安全**：不要将 `deepseek.config.json` 中的真实 API Key 提交到公开仓库
2. **网络要求**：需要联网才能使用 DeepSeek AI 功能
3. **浏览器兼容**：建议使用现代浏览器（Chrome、Firefox、Edge 等）
4. **API 限制**：注意 DeepSeek API 的调用频率限制

## 🐛 常见问题

### Q: AI 助手无法响应？
A: 检查 `deepseek.config.json` 中的 API Key 是否正确配置，以及网络连接是否正常。

### Q: 如何重置游戏？
A: 点击游戏界面上的"重新开始"按钮，或在 AI 助手中输入 `startGame`。

### Q: 可以离线使用吗？
A: 游戏本身可以离线使用，但 AI 助手功能需要联网。

## 📄 许可证

本项目仅供学习和交流使用。

## 🙏 致谢

- DeepSeek 提供的强大 AI 能力
- 三炮十五兵游戏的传统规则
