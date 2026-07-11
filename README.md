# 三国卡牌合成

一个轻量的纯前端三国卡牌游戏：拆卡包收集武将、重复卡升星，并在虎牢关演武场进行回合制 PVE 对战。

## 对战开发状态

回合制规则引擎与第一版 PVE 界面已经接通，包括起手全换、12 张演武战团、军令、三个阵位、出牌、攻击、基础 AI、武将技能、阵亡、疲劳与胜负判定。战团编辑和更多关卡将在后续阶段加入。

完整规则与开发顺序见 [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md)，统一术语见 [`CONTEXT.md`](CONTEXT.md)。

## 功能

- 初始 6 个卡包，每包 5 张卡
- 刘备、关羽、张飞、诸葛亮、曹操、孙权六张三国武将卡
- 重复 3 张同名卡可合成升 1 星，最高 5 星
- 一键合成、每 24 小时领取补给、本地存档与重置存档
- 虎牢关回合制 PVE、起手换牌、三阵位战场与基础 AI
- Anime.js 拆包与升星动画，transitions.dev motion token 与卡片 hover tilt

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 常用命令

```bash
npm run build
npm test
npm run lint
```

## 项目结构

```text
.
├── index.html
├── public/
│   ├── cards/
│   │   └── three-kingdoms-card-sheet.png
│   └── ui/
│       ├── battlefield-bg.png
│       ├── card-back.png
│       └── command-hall-bg.png
├── src/
│   ├── css/
│   │   ├── battle.css
│   │   ├── main.css
│   │   └── cards.css
│   └── js/
│       ├── battle/
│       │   ├── battleAi.js
│       │   ├── battleCore.js
│       │   ├── cardDefinitions.js
│       │   ├── skillEffects.js
│       │   └── battleGame.js
│       ├── main.js
│       ├── cardGame.js
│       └── cardGameCore.js
├── tests/
│   ├── battleAi.test.js
│   ├── battleCore.test.js
│   ├── battleSimulation.test.js
│   ├── battleStateTransitions.test.js
│   ├── fixtures/
│   │   └── battleFixtures.js
│   └── cardGameCore.test.js
├── vite.config.js
└── vitest.config.js
```

## 安全约定

这个仓库只保留静态小游戏代码。不要提交任何密钥、令牌、后端环境变量或 OAuth 配置文件。

已在 `.gitignore` 中屏蔽常见敏感文件类型，例如 `.env*`、`*.pem`、`*.key`、`client_secret*.json` 和 `wrangler.toml`。
