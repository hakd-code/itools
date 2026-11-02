// iTools 在线工具箱 —— 入口
import { createApp } from './src/app.js';

const PORT = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[itools] 已启动: http://localhost:${PORT}`);
  // 启动任务：确保汇率库有数据 + 每 6 小时定时抓取
  app.locals.startTasks().catch((err) => console.warn('[itools] 启动任务异常:', err.message));
});
