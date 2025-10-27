/**
 * 本地日志系统
 * 将日志写入内存，支持导出到文件
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 5000; // 最多保存 5000 条日志
    this.isEnabled = true;
    
    // 拦截 console 方法
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    // 启动时记录
    this.log('INFO', 'Logger initialized');
  }
  
  /**
   * 记录日志
   */
  log(level, ...args) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    const logEntry = {
      timestamp,
      level,
      message
    };
    
    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // 在开发环境仍然输出到控制台（可选）
    if (import.meta.env.DEV) {
      const consoleMethod = this.originalConsole[level.toLowerCase()] || this.originalConsole.log;
      consoleMethod(`[${timestamp}] [${level}]`, ...args);
    }
  }
  
  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs;
  }
  
  /**
   * 获取格式化的日志文本
   */
  getLogsText() {
    return this.logs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.message}`
    ).join('\n');
  }
  
  /**
   * 导出日志到文件
   */
  exportLogs() {
    const text = this.getLogsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.log('INFO', 'Logs exported');
  }
  
  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
    this.log('INFO', 'Logs cleared');
  }
  
  /**
   * 过滤日志
   */
  filterLogs(level = null, keyword = null) {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (keyword) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    return filtered;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {}
    };
    
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });
    
    return stats;
  }
}

// 创建全局日志实例
export const logger = new Logger();

// 导出便捷方法
export const log = (...args) => logger.log('INFO', ...args);
export const logWarn = (...args) => logger.log('WARN', ...args);
export const logError = (...args) => logger.log('ERROR', ...args);

// 全局暴露以便调试
if (typeof window !== 'undefined') {
  window._logger = logger;
  window._exportLogs = () => logger.exportLogs();
}
