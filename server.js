/**
 * 教学站点服务器
 * - 托管 public/ 下的静态文件
 * - 提供 /api/health 健康检查（Render 用）
 * - 监听 process.env.PORT，绑定 0.0.0.0（Render 要求）
 */
const path = require('path');
const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- 基础安全 / 杂项 ----------
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ---------- 静态资源 ----------
app.use(
  express.static(PUBLIC_DIR, {
    maxAge: '1h',          // 静态资源缓存 1 小时
    etag: true,
    extensions: ['html']   // /about 能匹配 about.html
  })
);

// ---------- API：健康检查 ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
    node: process.version
  });
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).type('html').send(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>404</title>
<style>body{font-family:system-ui,sans-serif;background:#f2f4f7;display:grid;
place-items:center;height:100vh;margin:0;color:#374151}
a{color:#2563eb}</style></head>
<body><div style="text-align:center">
  <h1 style="font-size:56px;margin:0">404</h1>
  <p>这个页面不存在</p>
  <a href="/">← 回到首页</a>
</div></body></html>`);
});

// ---------- 错误兜底 ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).type('text').send('500 Internal Server Error');
});

// ---------- 启动 ----------
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});

// Render 发 SIGTERM 时优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => process.exit(0));
});
