# Phase 1 快速启动指南
## 小鸡生蛋益智版 - 基础问答系统

**目标**: 2周内实现最小可行产品(MVP)  
**核心功能**: 点击小鸡→弹出问题→答对产蛋

---

## 🎯 Phase 1 目标

### 必须完成
- ✅ 点击小鸡触发问题弹窗
- ✅ 200题静态题库（算术+逻辑）
- ✅ 答案验证和反馈
- ✅ 答题统计记录

### 不包含（Phase 2）
- ❌ 挑战关卡系统
- ❌ 高级统计面板
- ❌ 排行榜
- ❌ 市场集成

---

## 📁 新增文件结构

```
xiaoji-game/
├── src/
│   ├── data/
│   │   └── questions/
│   │       ├── math-easy.json      # 100道简单算术题
│   │       └── logic-easy.json     # 100道简单逻辑题
│   ├── js/
│   │   ├── puzzle/
│   │   │   ├── questionEngine.js   # 问题引擎
│   │   │   ├── puzzleModal.js      # 问题弹窗
│   │   │   └── puzzleState.js      # 答题状态管理
│   │   └── gameLogic.js            # 修改：集成问答逻辑
│   └── css/
│       └── puzzle.css               # 问题弹窗样式
└── tests/
    └── puzzle/
        ├── questionEngine.test.js
        └── puzzleModal.test.js
```

---

## 🛠️ 实施步骤

### Step 1: 创建题库 (Day 1-2)

#### 1.1 创建题库JSON文件

**`src/data/questions/math-easy.json`**
```json
[
  {
    "id": "math_001",
    "type": "math",
    "difficulty": 1,
    "question": "5 + 3 = ?",
    "answer": "8",
    "explanation": "5加3等于8"
  },
  {
    "id": "math_002",
    "type": "math",
    "difficulty": 1,
    "question": "10 - 4 = ?",
    "answer": "6",
    "explanation": "10减4等于6"
  }
  // ... 98 more questions
]
```

**题库要求**:
- 100道算术题（加减乘除）
- 100道逻辑题（找规律、选择题）
- 难度1-3（简单）
- 答案简短（数字或单词）

#### 1.2 题库加载器

**`src/js/puzzle/questionLoader.js`**
```javascript
/**
 * 题库加载器
 */
class QuestionLoader {
  constructor() {
    this.questions = new Map()
    this.loaded = false
  }
  
  /**
   * 加载所有题库
   */
  async loadAll() {
    if (this.loaded) return
    
    try {
      const mathQuestions = await this.loadJSON('/src/data/questions/math-easy.json')
      const logicQuestions = await this.loadJSON('/src/data/questions/logic-easy.json')
      
      this.questions.set('math', mathQuestions)
      this.questions.set('logic', logicQuestions)
      
      this.loaded = true
      console.log('✅ 题库加载完成:', this.getTotalCount())
    } catch (error) {
      console.error('❌ 题库加载失败:', error)
      throw error
    }
  }
  
  /**
   * 加载JSON文件
   */
  async loadJSON(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load: ${url}`)
    }
    return response.json()
  }
  
  /**
   * 获取指定类型的题目
   */
  getQuestionsByType(type) {
    return this.questions.get(type) || []
  }
  
  /**
   * 获取题库总数
   */
  getTotalCount() {
    let total = 0
    for (const questions of this.questions.values()) {
      total += questions.length
    }
    return total
  }
}

export const questionLoader = new QuestionLoader()
```

---

### Step 2: 创建问题引擎 (Day 3-4)

**`src/js/puzzle/questionEngine.js`**
```javascript
import { questionLoader } from './questionLoader.js'

/**
 * 问题引擎
 */
class QuestionEngine {
  constructor() {
    this.currentQuestion = null
    this.askedQuestions = new Set() // 避免重复
    this.difficulty = 1
  }
  
  /**
   * 初始化
   */
  async init() {
    await questionLoader.loadAll()
  }
  
  /**
   * 获取下一个问题
   */
  getNextQuestion() {
    // 随机选择题型
    const type = Math.random() < 0.5 ? 'math' : 'logic'
    const questions = questionLoader.getQuestionsByType(type)
    
    // 过滤已答题目
    const availableQuestions = questions.filter(q => !this.askedQuestions.has(q.id))
    
    // 如果所有题都答过了，重置
    if (availableQuestions.length === 0) {
      this.askedQuestions.clear()
      return this.getNextQuestion()
    }
    
    // 随机选择一题
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    this.currentQuestion = availableQuestions[randomIndex]
    this.currentQuestion.startTime = Date.now()
    
    // 标记为已答
    this.askedQuestions.add(this.currentQuestion.id)
    
    return this.currentQuestion
  }
  
  /**
   * 验证答案
   */
  validateAnswer(answer) {
    if (!this.currentQuestion) {
      return { correct: false, message: '无效的问题' }
    }
    
    const userAnswer = answer.toString().trim().toLowerCase()
    const correctAnswer = this.currentQuestion.answer.toString().trim().toLowerCase()
    const correct = userAnswer === correctAnswer
    const timeSpent = Date.now() - this.currentQuestion.startTime
    
    // 保存到统计
    this.saveAnswerHistory({
      questionId: this.currentQuestion.id,
      correct,
      timeSpent,
      timestamp: Date.now()
    })
    
    return {
      correct,
      explanation: this.currentQuestion.explanation,
      correctAnswer: this.currentQuestion.answer,
      timeSpent
    }
  }
  
  /**
   * 保存答题历史
   */
  saveAnswerHistory(record) {
    const history = JSON.parse(localStorage.getItem('puzzle_history') || '[]')
    history.push(record)
    
    // 只保留最近100条
    if (history.length > 100) {
      history.shift()
    }
    
    localStorage.setItem('puzzle_history', JSON.stringify(history))
  }
  
  /**
   * 获取统计数据
   */
  getStats() {
    const history = JSON.parse(localStorage.getItem('puzzle_history') || '[]')
    
    if (history.length === 0) {
      return { totalAnswered: 0, totalCorrect: 0, accuracy: 0 }
    }
    
    const totalCorrect = history.filter(r => r.correct).length
    const accuracy = totalCorrect / history.length
    
    return {
      totalAnswered: history.length,
      totalCorrect,
      accuracy: Math.round(accuracy * 100)
    }
  }
}

export const questionEngine = new QuestionEngine()
```

---

### Step 3: 创建问题弹窗UI (Day 5-6)

**`src/css/puzzle.css`**
```css
/* 问题弹窗样式 */
.puzzle-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.puzzle-modal-overlay.show {
  display: flex;
}

.puzzle-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.puzzle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.puzzle-type {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.puzzle-content {
  margin: 24px 0;
}

.question-text {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.4;
}

.answer-input {
  margin: 24px 0;
}

.answer-input input {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  transition: border-color 0.3s;
}

.answer-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.puzzle-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.puzzle-btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-skip {
  background: #f5f5f5;
  color: #666;
}

.btn-skip:hover {
  background: #e0e0e0;
}

/* 反馈样式 */
.puzzle-feedback {
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  text-align: center;
  font-weight: 600;
}

.puzzle-feedback.correct {
  background: #d4edda;
  color: #155724;
}

.puzzle-feedback.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.puzzle-explanation {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
```

**`src/js/puzzle/puzzleModal.js`**
```javascript
import { questionEngine } from './questionEngine.js'

/**
 * 问题弹窗
 */
class PuzzleModal {
  constructor() {
    this.overlay = null
    this.currentQuestion = null
    this.onSuccess = null
    this.onSkip = null
  }
  
  /**
   * 初始化DOM
   */
  init() {
    // 创建弹窗HTML
    const html = `
      <div class="puzzle-modal-overlay" id="puzzleModal">
        <div class="puzzle-modal">
          <div class="puzzle-header">
            <span class="puzzle-type" id="puzzleType">🧮 算术题</span>
          </div>
          
          <div class="puzzle-content">
            <div class="question-text" id="questionText"></div>
            
            <div class="answer-input">
              <input 
                type="text" 
                id="answerInput" 
                placeholder="输入答案..." 
                autocomplete="off"
              />
            </div>
            
            <div id="puzzleFeedback"></div>
          </div>
          
          <div class="puzzle-actions">
            <button class="puzzle-btn btn-skip" id="btnSkip">
              跳过 (-10% 进度)
            </button>
            <button class="puzzle-btn btn-submit" id="btnSubmit">
              提交答案
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', html)
    
    // 获取DOM元素
    this.overlay = document.getElementById('puzzleModal')
    this.questionText = document.getElementById('questionText')
    this.answerInput = document.getElementById('answerInput')
    this.feedback = document.getElementById('puzzleFeedback')
    this.typeLabel = document.getElementById('puzzleType')
    
    // 绑定事件
    document.getElementById('btnSubmit').addEventListener('click', () => this.submit())
    document.getElementById('btnSkip').addEventListener('click', () => this.skip())
    
    // 回车提交
    this.answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submit()
    })
    
    // 点击背景关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close()
    })
  }
  
  /**
   * 显示问题
   */
  show(onSuccess, onSkip) {
    this.onSuccess = onSuccess
    this.onSkip = onSkip
    
    // 获取新问题
    this.currentQuestion = questionEngine.getNextQuestion()
    
    // 更新UI
    this.questionText.textContent = this.currentQuestion.question
    this.typeLabel.textContent = this.currentQuestion.type === 'math' ? '🧮 算术题' : '🧩 逻辑题'
    this.answerInput.value = ''
    this.feedback.innerHTML = ''
    
    // 显示弹窗
    this.overlay.classList.add('show')
    
    // 聚焦输入框
    setTimeout(() => this.answerInput.focus(), 100)
  }
  
  /**
   * 提交答案
   */
  submit() {
    const answer = this.answerInput.value.trim()
    
    if (!answer) {
      this.showFeedback('请输入答案！', false)
      return
    }
    
    // 验证答案
    const result = questionEngine.validateAnswer(answer)
    
    if (result.correct) {
      this.showFeedback('✅ 回答正确！', true)
      setTimeout(() => {
        this.close()
        if (this.onSuccess) this.onSuccess()
      }, 1500)
    } else {
      this.showFeedback(
        `❌ 回答错误！正确答案是: ${result.correctAnswer}<br>
         <span class="puzzle-explanation">${result.explanation}</span>`,
        false
      )
    }
  }
  
  /**
   * 跳过问题
   */
  skip() {
    this.close()
    if (this.onSkip) this.onSkip()
  }
  
  /**
   * 显示反馈
   */
  showFeedback(message, correct) {
    this.feedback.innerHTML = message
    this.feedback.className = `puzzle-feedback ${correct ? 'correct' : 'incorrect'}`
  }
  
  /**
   * 关闭弹窗
   */
  close() {
    this.overlay.classList.remove('show')
  }
}

export const puzzleModal = new PuzzleModal()
```

---

### Step 4: 集成到游戏逻辑 (Day 7-8)

**修改 `src/js/gameLogic.js`**

```javascript
import { puzzleModal } from './puzzle/puzzleModal.js'
import { questionEngine } from './puzzle/questionEngine.js'

// 在文件顶部添加初始化
async function initPuzzleSystem() {
  await questionEngine.init()
  puzzleModal.init()
  console.log('✅ 问答系统初始化完成')
}

// 修改handleClick函数
export function handleClick(x, y) {
  // 首次点击初始化音效
  initAudio()
  
  // 显示问题弹窗
  puzzleModal.show(
    // 答对回调
    () => {
      // 原有的点击逻辑
      const clickValue = state.clickPower
      state.peckProgress = Math.min(100, state.peckProgress + clickValue)
      
      // 产蛋检查
      if (state.peckProgress >= 100) {
        layEgg()
        state.peckProgress = 0
      }
      
      // 更新显示
      updateAllDisplays()
      
      // 显示浮动文字
      showFloatText(x, y, `+${clickValue}%`)
    },
    // 跳过回调
    () => {
      // 跳过扣10%进度
      state.peckProgress = Math.max(0, state.peckProgress - 10)
      updateAllDisplays()
      showFloatText(x, y, '-10%')
    }
  )
}

// 在init函数中调用
export async function init() {
  // ... 现有代码
  
  // 初始化问答系统
  await initPuzzleSystem()
  
  // ... 其余初始化代码
}
```

---

### Step 5: 测试与优化 (Day 9-10)

#### 5.1 功能测试清单

- [ ] 点击小鸡弹出问题
- [ ] 答对后增加进度
- [ ] 答错后显示正确答案
- [ ] 跳过扣除进度
- [ ] 题目不重复（至少200题内）
- [ ] 回车键提交
- [ ] ESC键关闭（可选）
- [ ] 答题统计正确保存

#### 5.2 性能优化

```javascript
// 预加载题库
window.addEventListener('DOMContentLoaded', async () => {
  await questionEngine.init()
})

// 缓存题目
const CACHE_KEY = 'puzzle_questions_cache'
const CACHE_VERSION = '1.0'

async function loadWithCache() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const data = JSON.parse(cached)
    if (data.version === CACHE_VERSION) {
      return data.questions
    }
  }
  
  // 加载并缓存
  const questions = await loadQuestions()
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    version: CACHE_VERSION,
    questions
  }))
  
  return questions
}
```

---

## 📊 成功标准

### 必须达成
- ✅ 点击小鸡100%触发问题
- ✅ 答题正确率统计准确
- ✅ 无明显bug或卡顿
- ✅ 移动端正常运行

### 用户反馈目标
- 至少10位测试用户
- 平均满意度 ≥ 7/10
- 愿意继续玩 ≥ 70%

---

## 🐛 常见问题

### Q1: 题库加载失败怎么办？
```javascript
// 添加降级方案
const FALLBACK_QUESTIONS = [
  { id: '1', question: '1+1=?', answer: '2', type: 'math' },
  // ... 10道备用题
]

if (loadError) {
  console.warn('使用备用题库')
  this.questions = FALLBACK_QUESTIONS
}
```

### Q2: 用户觉得太难怎么办？
- 添加"提示"按钮（看1次广告获得提示）
- 降低难度（只用1-2难度的题）
- 允许多次尝试

### Q3: 题目答完了怎么办？
- 重置askedQuestions
- 添加变量（例如改变数字）
- 提示用户"题库循环"

---

## 🚀 部署清单

### 前端部署
```bash
# 1. 确认新文件已添加
git add src/data/questions/*.json
git add src/js/puzzle/*.js
git add src/css/puzzle.css

# 2. 提交
git commit -m "feat: add puzzle system phase 1"

# 3. 部署
npm run deploy
# 或
git push origin main
```

### 测试链接
- 开发环境: http://localhost:3000
- 预览环境: https://preview.chickgamehub.online
- 生产环境: https://chickgamehub.online

---

## 📈 数据收集

### Google Analytics事件
```javascript
// 答题事件
gtag('event', 'puzzle_answer', {
  'event_category': 'puzzle',
  'event_label': correct ? 'correct' : 'incorrect',
  'value': question.difficulty
})

// 跳过事件
gtag('event', 'puzzle_skip', {
  'event_category': 'puzzle',
  'event_label': question.type
})
```

### 关键指标监控
- 答题总数
- 正确率
- 跳过率
- 平均答题时间

---

## 下一步（Phase 2）

Phase 1完成后进入Phase 2：
- [ ] 挑战关卡系统
- [ ] 升级需完成关卡
- [ ] 更多题型（图片题）
- [ ] 高级统计面板

---

**预计完成时间**: 2周  
**负责人**: 前端开发团队  
**审核人**: 产品经理  

开始开发吧！🚀
