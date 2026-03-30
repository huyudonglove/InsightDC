# InsightDC - 数据中心可视化系统

> 基于 Three.js + Vue 3 构建的 3D 数据中心可视化平台，支持机柜状态监控、温度热力图、功耗可视化等功能。

---

### 演示视频

https://github.com/user-attachments/assets/eb389771-1b9f-489f-a3e8-e4f868d666c3

---

### 技术栈

| 分类     | 技术                 |
| -------- | -------------------- |
| 前端框架 | Vue 3.5 + TypeScript |
| 构建工具 | Vite 4               |
| 3D 渲染  | Three.js 0.152       |
| 动画     | GSAP 3               |
| 图表     | ECharts 5            |
| 状态管理 | Pinia 2              |
| 部署     | Docker + Nginx       |

---

### 核心功能

- **机柜状态监控** - 正常 / 警告 / 紧急三级状态颜色编码，支持全局概览
- **温度热力图** - 机柜表面热力颜色渲染，直观展示温度分布
- **功耗可视化** - 功率条高度映射功耗强度，绿色到红色渐变
- **机柜详情面板** - 点击机柜从右侧滑入详情，展示服务器列表与运行状态
- **告警闪烁动画** - 紧急状态机柜自动闪烁提醒
- **天空盒切换** - 支持白天 / 黄昏 / 夜晚三种环境光效
- **多分辨率适配** - 基于 rem（1rem=100px）实现 1080p / 2K / iPad 自适应

---

### 项目启动

```shell
npm i

npm start
```

### Docker 部署

```shell
docker build -t insightdc .
docker run -p 80:80 insightdc
```
