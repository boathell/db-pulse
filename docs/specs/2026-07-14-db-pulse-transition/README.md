# DB Pulse 转型规格

本目录定义 Agent Pulse 向 DB Pulse 的跨层迁移。实现顺序固定为：规格与门禁、schema 与领域隔离、数据库行业目录与内容、公开 DTO 与静态站、自动运营、验收与发布准备。

本次保持 `Source -> Signal -> Event -> Track/Actor -> static export` 架构和现有路由，不执行推送、GitHub Release 或 Pages 部署。

