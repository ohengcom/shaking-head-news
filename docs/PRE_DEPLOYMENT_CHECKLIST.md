# 部署前检查清单

## 项目状态概览

**项目名称**: 摇头看新闻 (Shaking Head News)  
**技术栈**: Next.js 16.1 + React 19.2 + TypeScript  
**检查日期**: 2025-01-07  
**当前状态**: 生产运行中

---

## ✅ 已完成任务 (1-15)

### 核心功能

- [x] **任务 1-4**: 项目初始化、类型定义、认证配置、基础布局
- [x] **任务 5-7**: 新闻服务、新闻展示、页面旋转动画
- [x] **任务 8-9**: 用户设置管理、国际化支持
- [x] **任务 10-12**: RSS 源管理、统计数据、UI/UX 增强
- [x] **任务 13-15**: 性能优化、错误处理、安全加固

### 功能完整性

✅ 用户认证 (Google OAuth)  
✅ 新闻获取和展示  
✅ 页面旋转动画 (固定/连续模式)  
✅ 用户设置管理  
✅ 多语言支持 (中文/英文)  
✅ RSS 源管理  
✅ 统计数据和健康提醒  
✅ 主题切换 (深色/浅色)  
✅ 性能优化 (ISR、代码分割、图片优化)  
✅ 错误处理和边界  
✅ 安全加固 (CSP、速率限制、输入验证)

---

## 📋 待完成任务 (16-20)

### 任务 16: 部署配置 ⚠️ **必需**

- [ ] 创建 vercel.json 配置文件
- [ ] 配置环境变量文档 (.env.example)
- [ ] 验证 next.config.js 配置
- [ ] 配置图片域名白名单
- [ ] 设置重定向和 headers
- [ ] 配置 Vercel 区域

### 任务 17: 测试实施 (可选)

- [ ] 配置 Vitest 和 React Testing Library
- [ ] 配置 Playwright
- [ ] 编写 Server Actions 单元测试
- [ ] 编写组件单元测试
- [ ] 编写 E2E 测试

### 任务 18: 监控和日志 (推荐)

- [ ] 集成 Sentry 错误监控
- [ ] 配置 Vercel Analytics
- [ ] 添加性能监控

### 任务 19: CI/CD 配置 (推荐)

- [ ] 创建 GitHub Actions workflow
- [ ] 配置自动部署

### 任务 20: 文档 (推荐)

- [ ] 更新 README.md
- [ ] 创建 MIGRATION.md
- [ ] 编写 API 文档

---

## 🧹 项目清理

### 需要清理的文件/目录

#### 1. 旧项目备份

```
old-vue-project-backup-20251112-102218/
```

**建议**: 可以删除或移到项目外部

#### 2. 临时文件

```
.next/                    # 构建缓存 (保留)
node_modules/             # 依赖 (保留)
tsconfig.tsbuildinfo      # TypeScript 缓存 (保留)
```

#### 3. 重复的 README

```
README.md                 # 旧版本
README.new.md             # 新版本
```

**建议**: 合并内容，删除 README.new.md

#### 4. 未使用的配置

```
supabase/                 # 如果不使用 Supabase
.tool-versions            # 如果不使用 asdf
```

#### 5. 空目录

```
config/.gitkeep
lib/.gitkeep
messages/.gitkeep
types/.gitkeep
```

**建议**: 如果目录已有文件，删除 .gitkeep

---

## 🔍 代码质量检查

### TypeScript 编译

```bash
npm run type-check
```

**状态**: ✅ 通过 (无错误)

### ESLint 检查

```bash
npm run lint
```

**状态**: ⚠️ 有警告 (非阻塞性)

- 一些 `any` 类型警告
- 一些 `window` 和 `performance` 未定义警告 (可忽略，运行时存在)

### 构建测试

```bash
npm run build
```

**状态**: 需要验证

### 依赖审计

```bash
npm audit
```

**状态**: 需要检查

---

## 🔐 环境变量检查

### 必需的环境变量

#### 应用配置

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### NextAuth.js

```env
AUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Google OAuth

```env
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

#### Upstash Redis (Vercel Marketplace Storage)

```env
UPSTASH_REDIS_REST_URL=your-upstash-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token
```

> 生产环境必须配置 Upstash Redis，应用不会回退到内存存储。

#### 新闻 API

```env
NEWS_API_BASE_URL=https://news.ravelloh.top
```

### 环境变量文件状态

- [x] `.env.example` 存在
- [ ] 验证所有必需变量已文档化
- [ ] 验证 Vercel 项目中已配置

---

## 📦 依赖检查

### 核心依赖

```json
{
  "next": "^16.1.1",
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "typescript": "^5.7.3"
}
```

### 关键依赖

- ✅ next-auth (认证)
- ✅ @upstash/redis (存储)
- ✅ next-intl (国际化)
- ✅ zustand (状态管理)
- ✅ framer-motion (动画)
- ✅ zod (验证)
- ✅ recharts (图表)
- ✅ tailwindcss (样式)

### 未使用的依赖

检查是否有未使用的依赖可以移除：

```bash
npx depcheck
```

---

## 🚀 部署配置

### Vercel 项目设置

#### 1. 构建设置

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2. 环境变量

在 Vercel 项目设置中配置所有必需的环境变量

#### 3. 域名配置

- [ ] 配置自定义域名
- [ ] 配置 SSL 证书 (自动)
- [ ] 配置 DNS 记录

#### 4. 区域设置

推荐区域：

- 香港 (hkg1)
- 新加坡 (sin1)

#### 5. 函数配置

```json
{
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 10
    }
  }
}
```

---

## 🔒 安全检查

### 已实施的安全措施

- ✅ Content Security Policy (CSP) headers
- ✅ 速率限制 (4 个层级)
- ✅ 输入验证和清理
- ✅ CORS 配置
- ✅ 用户权限验证
- ✅ XSS 防护
- ✅ CSRF 防护
- ✅ SQL 注入防护

### 需要验证的安全配置

- [ ] HTTPS 强制重定向 (生产环境)
- [ ] 安全 headers 正确应用
- [ ] OAuth 回调 URL 白名单
- [ ] API 速率限制正常工作
- [ ] 敏感数据不在日志中

---

## 📊 性能检查

### 性能优化措施

- ✅ ISR 缓存策略
- ✅ 图片优化 (Next.js Image)
- ✅ 代码分割 (dynamic import)
- ✅ 字体预加载
- ✅ DNS 预取
- ✅ Bundle 分析配置

### 性能目标

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTI < 3.5s

### 性能测试工具

- Lighthouse
- WebPageTest
- Vercel Analytics

---

## 📝 文档状态

### 已有文档

- ✅ `.kiro/specs/project-upgrade/requirements.md` - 需求文档
- ✅ `.kiro/specs/project-upgrade/design.md` - 设计文档
- ✅ `.kiro/specs/project-upgrade/tasks.md` - 任务列表
- ✅ `docs/SETUP.md` - 设置指南
- ✅ `docs/PERFORMANCE_GUIDE.md` - 性能指南
- ✅ `docs/MONITORING_QUICK_START.md` - 监控快速开始
- ✅ `docs/PROJECT_STATUS.md` - 项目状态
- ✅ 各组件的 README.md 文件

### 需要更新的文档

- [ ] `README.md` - 主要项目文档
- [ ] `.env.example` - 环境变量示例
- [ ] API 文档
- [ ] 部署指南

---

## 🧪 测试状态

### 当前测试覆盖率

- 单元测试: 0% (未实施)
- 集成测试: 0% (未实施)
- E2E 测试: 0% (未实施)

### 推荐的测试优先级

1. **高优先级**: Server Actions 单元测试
2. **中优先级**: 关键用户流程 E2E 测试
3. **低优先级**: UI 组件单元测试

---

## 🎯 部署前必做事项

### 1. 代码清理

- [ ] 删除或移动旧项目备份
- [ ] 合并 README 文件
- [ ] 删除未使用的 .gitkeep 文件
- [ ] 删除未使用的配置文件

### 2. 配置验证

- [ ] 验证 .env.example 完整性
- [ ] 验证 next.config.js 配置
- [ ] 验证 vercel.json 配置
- [ ] 验证 package.json scripts

### 3. 构建测试

- [ ] 本地构建成功
- [ ] 本地生产模式运行正常
- [ ] 所有页面可访问
- [ ] 所有功能正常工作

### 4. 安全检查

- [ ] 敏感信息不在代码中
- [ ] .gitignore 配置正确
- [ ] 环境变量正确配置
- [ ] OAuth 配置正确

### 5. Vercel 配置

- [ ] 创建 Vercel 项目
- [ ] 配置环境变量
- [ ] 配置域名
- [ ] 配置 Upstash Redis
- [ ] 配置 Google OAuth 回调 URL

---

## 📈 部署后验证

### 功能验证

- [ ] 首页加载正常
- [ ] 用户登录正常
- [ ] 新闻获取正常
- [ ] 页面旋转正常
- [ ] 设置保存正常
- [ ] 语言切换正常
- [ ] RSS 管理正常
- [ ] 统计数据正常
- [ ] 主题切换正常

### 性能验证

- [ ] Lighthouse 分数 > 90
- [ ] 首屏加载时间 < 3s
- [ ] 图片加载优化正常
- [ ] 缓存策略生效

### 安全验证

- [ ] CSP headers 正确应用
- [ ] 速率限制正常工作
- [ ] 认证保护正常
- [ ] HTTPS 强制重定向

---

## 🔄 回滚计划

### 回滚触发条件

- 严重功能故障
- 性能严重下降
- 安全漏洞发现
- 数据丢失风险

### 回滚步骤

1. 在 Vercel 控制台回滚到上一个部署
2. 验证回滚后功能正常
3. 通知用户 (如需要)
4. 修复问题后重新部署

---

## 📞 支持和监控

### 错误监控

- [ ] 配置 Sentry
- [ ] 配置错误通知
- [ ] 配置错误日志

### 性能监控

- [ ] 配置 Vercel Analytics
- [ ] 配置 Web Vitals 监控
- [ ] 配置性能告警

### 用户反馈

- [ ] 配置反馈渠道
- [ ] 配置问题追踪系统

---

## ✅ 最终检查清单

在点击部署按钮前，确认：

- [ ] 所有代码已提交到 Git
- [ ] 所有必需的环境变量已配置
- [ ] 本地构建和运行成功
- [ ] 所有核心功能已测试
- [ ] 文档已更新
- [ ] 团队成员已通知
- [ ] 回滚计划已准备
- [ ] 监控已配置

---

## 📅 部署时间建议

**推荐部署时间**: 工作日下午 (避免高峰期)  
**避免部署时间**: 周五晚上、节假日前

**部署后监控时间**: 至少 2 小时

---

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 部署指南](https://vercel.com/docs)
- [NextAuth.js 部署](https://next-auth.js.org/deployment)
- [Upstash Redis 文档](https://docs.upstash.com/redis)

---

**最后更新**: 2025-11-12  
**更新人**: Kiro AI Assistant  
**版本**: 1.0
