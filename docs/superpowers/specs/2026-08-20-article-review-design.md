# 文章发布与审核功能设计

日期：2026-08-20

## 需求摘要

- 未登录访客：可浏览已通过文章列表，并查看详情。
- 所有已登录用户：可发布文章、查看自己的文章状态、删除自己的文章、编辑被驳回的文章并重新提交。
- 管理员（admin 角色）：可审核文章（通过 / 驳回并填写意见），可删除任意文章。
- 审核状态：PENDING（待审核）、APPROVED（已通过）、REJECTED（未通过）。
- 通知方式：用户在“我的文章”列表中看到状态和审核意见。

## 数据表

新增 article 表：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT 自增 | 主键 |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 正文 |
| author_id | BIGINT | 作者，关联 sys_user.id |
| status | VARCHAR(20) | PENDING / APPROVED / REJECTED |
| audit_comment | VARCHAR(500) | 审核意见 |
| create_time | DATETIME | 发布时间 |
| update_time | DATETIME | 更新时间 |
| audit_time | DATETIME | 审核时间 |

## 后端接口

公共接口（无需登录）：

- GET /public/article：已通过文章分页列表
- GET /public/article/{id}：已通过文章详情

登录用户接口：

- POST /article：发布文章
- GET /article/my：我的文章分页列表
- PUT /article/{id}：编辑被驳回文章并重新提交
- DELETE /article/{id}：删除文章（自己的；管理员可删任意）

管理员接口：

- GET /article/audit：审核列表（默认待审核）
- PUT /article/{id}/audit：审核（通过 / 驳回 + 意见）

## 权限

- 公共接口：SaTokenConfig 放行 /public/**
- 发布、我的文章、编辑、删除：登录即可
- 删除：Service 判断作者本人或 admin 角色
- 审核：@SaCheckRole("admin")

## 前端

页面与路由：

| 页面 | 路由 | 访问 |
| --- | --- | --- |
| 公共文章列表 | /articles | 无需登录 |
| 公共文章详情 | /articles/:id | 无需登录 |
| 我的文章 | /article/my | 登录 |
| 文章审核 | /article/audit | admin |

- 路由守卫放行 /articles 与 /articles/:id。
- 侧边栏：“我的文章”对所有登录用户固定显示；“文章审核”仅 admin 角色显示。

## 核心流程

用户发布 -> PENDING -> 管理员审核 -> APPROVED（进入公共列表）或 REJECTED（用户可编辑重交）。

被驳回文章编辑后状态重新变为 PENDING。
