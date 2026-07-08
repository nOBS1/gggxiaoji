# 三国卡牌合成

一个轻量的纯前端网页小游戏：拆卡包收集三国武将，重复卡用于合成升星，卡牌战力会随星级提升。

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
│   └── cards/
│       └── three-kingdoms-card-sheet.png
├── src/
│   ├── css/
│   │   ├── main.css
│   │   └── cards.css
│   └── js/
│       ├── main.js
│       ├── cardGame.js
│       └── cardGameCore.js
├── tests/
│   └── cardGameCore.test.js
├── vite.config.js
└── vitest.config.js
```

## 安全约定

这个仓库只保留静态小游戏代码。不要提交任何密钥、令牌、后端环境变量或 OAuth 配置文件。

已在 `.gitignore` 中屏蔽常见敏感文件类型，例如 `.env*`、`*.pem`、`*.key`、`client_secret*.json` 和 `wrangler.toml`。
