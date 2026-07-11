# 测试与验收

## 数据源可靠性

- 可重试：network、timeout、408、425、429、5xx；永久 4xx 和安全/契约错误不重试。
- 退避具备指数增长、上限与可注入随机抖动；429 尊重 `Retry-After`。
- ETag / Last-Modified 被写入 state，下次请求发送条件头；304 不产生 item 且计为成功。
- 批次并发不超过 `COLLECTOR_CONCURRENCY`，单源失败不影响其他来源。
- response 体积、协议、凭据 URL、私网地址和重定向后地址受到安全保护。

## 生命周期

- draft/retired/quarantined 不进入常规批次，shadow 只允许显式验证。
- 连续失败触发 active -> degraded -> quarantined，成功恢复健康度但不自动解除 quarantine。
- verify 成功进入 shadow，activate 需要验证成功；retire 保留 signal provenance。
- 每次来源执行都创建完整 SourceRun，错误内容被截断且不泄露 token。

## 星探

- 只基于 published Event 生成；没有证据不生成。
- 每条输出包含观察、假设、why now、最小行动和产物建议。
- cooldown key 在窗口内去重；超过窗口可以重新评估。
- 状态转换合法，只有 published 输出到静态站。
- 静态 JSON 不含私人备注、dismissed/inbox 卡片或内部运行信息。

## API 与 UI

- 管理 API 的 lifecycle action、运行历史、星探生成和状态修改受 ADMIN_TOKEN 保护。
- 非法状态转换和非法输入返回 4xx。
- 管理台在来源失败时显示错误类型、健康分和最近运行，而不是只有通用报错。
- 公开页精灵可关闭，选择持久化，移动端不遮挡核心 timeline。

## 完整验收

```bash
npm run lint
npm run typecheck
npm test
npm run export
npm run check
```

## Catalog / Roadmap / Evaluation

- Source Catalog 至少 100 个唯一 slug、12 个类别、中国 ≥25、海外 ≥60，restricted 来源默认关闭。
- Roadmap 固定 State 1–5，每个 State 至少 3 个 milestone；release 必须关联 capability delta。
- Evaluation 每个维度包含 score、weight、status、sampleSize、summary、evidence、nextAction。
- 证据不足维度不参与 overall score；空运行历史不能得到“稳定性良好”。
- 静态导出只包含公开评测摘要，不导出内部错误、私有反馈、策略密钥或本机路径。
