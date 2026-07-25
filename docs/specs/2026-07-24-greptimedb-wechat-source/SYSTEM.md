# 系统设计

## 官方来源记录

`greptimedb-wechat` 使用既有 Source 模型：

- `tier=1`、`role=primary`、`category=database-vendor`；
- `adapter=manual`、`acquisition=social`；
- `enabled=false`、`lifecycleStatus=shadow`、`maintenanceStatus=restricted`；
- `robotsPolicy=manual-only`、`cadence=manual`；
- 官方主页为 `https://greptime.cn/`，内部 endpoint 为已核验微信文章。

账号名 `GreptimeDB` 和 Biz ID `Mzg3MTgxMzczNg==` 保存到内部 `socialHandles`。共享平台域名 `mp.weixin.qq.com` 不作为唯一 identity host，避免把不同公众号错误合并。

## 个人专家来源记录

`zhuang-xiaodan-wechat` 使用同一 Source 模型：

- 名称为“庄晓丹（此间山林）公众号”，`owner=Greptime / 格睿科技`；
- `tier=3`、`role=expert`、`category=expert`；
- `adapter=manual`、`acquisition=social`；
- `enabled=false`、`lifecycleStatus=shadow`、`maintenanceStatus=restricted`；
- `robotsPolicy=manual-only`、`cadence=manual`；
- 公开主页为 `https://github.com/killme2008`，内部 endpoint 为已核验微信文章；
- `identityHosts=["greptime.cn"]`，与官方号共享证据所有者和机构身份。

账号名“此间山林”、署名“此间的山林”、微信 username `gh_8e1963838cae`、Biz ID `MzkyNjQzNTU3OQ==` 和 GitHub handle `killme2008` 保存到内部 `socialHandles`。身份核验引用庄晓丹的 GitHub 资料与 Greptime 官方团队页；专家观察目录保存其 GitHub 和 Greptime 官方作者资料，但不绑定自动 feed。

## 运行边界

两条来源的审计均在 acquisition policy 门禁处产生 `skipped / restricted` 检查记录，不调用 fetcher 或 adapter。将来只有取得平台批准的稳定 API/RSS，并补齐独立 adapter、fixture、漂移测试和真实观察窗后，才能提出自动采集升级。

独立性继续按现有 source、owner 和 author 门禁计算。官方号与个人号使用相同 owner，因此即使未来产生合规 Signal，也只计一个 Greptime 证据所有者。

## 公开边界

静态来源目录新增两条公开记录：官方号链接 Greptime 官方主页，个人号链接庄晓丹 GitHub 身份页。微信文章 endpoint、Biz ID、username、原始页面和正文不进入公开 DTO；本次不新增 Signal 或 Event。“此间山林”文章仅核验个人来源身份，其非官方社区发布不构成 Greptime 公司事实。
