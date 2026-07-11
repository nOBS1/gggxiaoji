# 三国卡牌合成

一个轻量的纯前端网页小游戏：拆卡包收集三国武将，重复卡用于合成升星，卡牌战力会随星级提升。

## 对战开发状态

回合制对战的阶段 A 规则引擎已经建立，包括 12 张战团、军令、三个阵位、出牌、攻击、武将技能、阵亡、疲劳与胜负判定。当前页面仍保持拆包和升星玩法，对战界面将在下一阶段接入。

完整规则与开发顺序见 [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md)，统一术语见 [`CONTEXT.md`](CONTEXT.md)。

## 功能

- 初始 6 个卡包，每包 5 张卡
- 刘备、关羽、张飞、诸葛亮、曹操、孙权六张三国武将卡
- 重复 3 张同名卡可合成升 1 星，最高 5 星
- 一键合成、领取补给、本地存档与重置存档
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
│   │   ├── main.css
│   │   └── cards.css
│   └── js/
│       ├── battle/
│       │   ├── battleCore.js
│       │   ├── cardDefinitions.js
│       │   └── skillEffects.js
│       ├── main.js
│       ├── cardGame.js
│       └── cardGameCore.js
├── tests/
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
