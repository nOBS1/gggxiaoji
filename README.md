# 合成方块小游戏

一个轻量的 2048 风格网页小游戏。使用方向键或触屏滑动移动方块，合成更大的数字，挑战最高分。

## 功能

- 4x4 合成方块棋盘
- 键盘方向键和移动端滑动操作
- 当前得分与本地最高分记录
- 新游戏与清除最高分
- 纯前端静态部署，无后端、无登录、无广告、无第三方市场系统

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
├── src/
│   ├── css/
│   │   ├── main.css
│   │   └── merge.css
│   └── js/
│       ├── main.js
│       └── merge/
│           ├── mergeCore.js
│           └── mergeManager.js
├── tests/
│   └── mergeCore.test.js
├── vite.config.js
└── vitest.config.js
```

## 安全约定

这个仓库只保留静态小游戏代码。不要提交任何密钥、令牌、后端环境变量或 OAuth 配置文件。

已在 `.gitignore` 中屏蔽常见敏感文件类型，例如 `.env*`、`*.pem`、`*.key`、`client_secret*.json` 和 `wrangler.toml`。
