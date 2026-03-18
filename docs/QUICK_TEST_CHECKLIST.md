# 快速测试清单 ✅

部署后的快速验证清单，5-10 分钟完成。

---

## 🚀 部署信息

- **URL**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- **测试时间**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- **测试人**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

---

## ✅ 核心功能测试（必做）

### 1. 基础访问

- [ ] 网站可以正常打开
- [ ] 首页加载时间 < 3 秒
- [ ] 无明显的控制台错误

### 2. 新闻功能

- [ ] 首页显示新闻列表
- [ ] 点击刷新按钮可以更新新闻
- [ ] 新闻链接可以打开

### 3. 页面旋转

- [ ] 页面有旋转动画
- [ ] 暂停/继续按钮工作正常
- [ ] 可以切换旋转模式

### 4. 用户认证

- [ ] 可以点击登录按钮
- [ ] Google OAuth 登录流程正常
- [ ] 登录后显示用户信息
- [ ] 登出功能正常

### 5. 设置功能

- [ ] 可以切换主题（浅色/深色）
- [ ] 可以切换语言（中文/英文）
- [ ] 刷新页面后设置保持
- [ ] 登录用户设置可以云端同步

---

## 🔍 快速检查（推荐）

### 6. 响应式设计

- [ ] 在手机上可以正常显示
- [ ] 在平板上可以正常显示
- [ ] 触摸操作正常

### 7. 性能检查

- [ ] 运行 Lighthouse 测试（Performance > 80）
- [ ] 检查 Vercel Analytics 数据

### 8. 错误处理

- [ ] 访问不存在的页面显示 404
- [ ] 断网后显示友好的错误提示

---

## 🎯 关键环境变量确认

在 Vercel Dashboard → Settings → Environment Variables 中确认：

- [ ] `AUTH_SECRET` 已配置
- [ ] `NEXT_PUBLIC_APP_URL` 已配置（生产 URL）
- [ ] `AUTH_GOOGLE_ID` 已配置
- [ ] `AUTH_GOOGLE_SECRET` 已配置
- [ ] `UPSTASH_REDIS_REST_URL` 已配置
- [ ] `UPSTASH_REDIS_REST_TOKEN` 已配置
- [ ] 如需 Pro 白名单，已配置 `PRO_USER_IDS` / `PRO_USER_EMAILS`
- [ ] `NEWS_API_BASE_URL` 已配置

---

## 🔧 Google OAuth 配置确认

在 [Google Cloud Console](https://console.cloud.google.com/) 中确认：

- [ ] 已添加生产环境回调 URL:
  ```
  https://your-domain.com/api/auth/callback/google
  ```
- [ ] OAuth 同意屏幕已配置
- [ ] 应用状态为"已发布"或"测试中"

---

## 📊 测试结果

### 通过的测试

总数: **\_** / 20

### 发现的问题

1. ***
2. ***
3. ***

### 总体评估

- [ ] ✅ 可以发布使用
- [ ] ⚠️ 有小问题但不影响使用
- [ ] ❌ 有严重问题需要修复

---

## 🚨 如果测试失败

### 立即检查

1. **Vercel Dashboard** → Deployments → 查看部署日志
2. **Vercel Dashboard** → Functions → 查看函数日志
3. **浏览器控制台** → 查看 JavaScript 错误
4. **Network 标签** → 查看 API 请求状态

### 常见问题快速修复

#### 问题：网站打不开

→ 检查 Vercel 部署状态，查看构建日志

#### 问题：登录失败

→ 检查 Google OAuth 回调 URL 配置

#### 问题：设置不保存

→ 检查 Upstash Redis 环境变量

#### 问题：新闻不显示

→ 检查 NEWS_API_BASE_URL 环境变量

---

## 📞 需要帮助？

- **Vercel 日志**: Dashboard → Functions → Logs
- **项目文档**: 查看 `docs/PRODUCTION_TESTING.md`
- **详细测试**: 查看 `docs/PRODUCTION_TESTING.md`

---

**测试完成后，记得在 GitHub 上创建一个 Release！** 🎉
