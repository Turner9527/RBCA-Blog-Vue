# 文章发布与审核功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现文章发布、审核、公共浏览、我的文章管理。

**Architecture:** 后端新增 article 表和 Article 相关分层；公共接口放行 /public/**；前端新增公共文章页、我的文章页、审核页，并在侧边栏添加入口。

**Tech Stack:** Spring Boot 4 + MyBatis-Plus + Sa-Token + Vue 3 + Element Plus + Axios。

---

## 文件结构

后端：
- 修改 `src/main/resources/sql/init.sql`
- 新增 `src/main/java/com/example/demo/Entity/Article.java`
- 新增 `src/main/java/com/example/demo/vo/ArticleVO.java`
- 新增 `src/main/java/com/example/demo/dto/AuditDTO.java`
- 新增 `src/main/java/com/example/demo/mapper/ArticleMapper.java`
- 新增 `src/main/java/com/example/demo/service/ArticleService.java`
- 新增 `src/main/java/com/example/demo/service/impl/ArticleServiceImpl.java`
- 新增 `src/main/java/com/example/demo/controller/ArticleController.java`
- 修改 `src/main/java/com/example/demo/config/SaTokenConfig.java`

前端：
- 修改 `src/router/index.js`
- 修改 `src/layout/LayoutView.vue`
- 新增 `src/views/article/PublicArticleListView.vue`
- 新增 `src/views/article/PublicArticleDetailView.vue`
- 新增 `src/views/article/MyArticlesView.vue`
- 新增 `src/views/article/AuditView.vue`

---

### Task 1: 建表 SQL

**Files:**
- Modify: `E:/Java/Project/demo/src/main/resources/sql/init.sql`

- [ ] **Step 1: 在 init.sql 末尾追加 article 表**

```sql
CREATE TABLE IF NOT EXISTS article (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    title         VARCHAR(200) NOT NULL COMMENT '标题',
    content       TEXT         NOT NULL COMMENT '正文',
    author_id     BIGINT       NOT NULL COMMENT '作者id',
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED',
    audit_comment VARCHAR(500) DEFAULT NULL COMMENT '审核意见',
    create_time   DATETIME     DEFAULT NULL COMMENT '发布时间',
    update_time   DATETIME     DEFAULT NULL COMMENT '更新时间',
    audit_time    DATETIME     DEFAULT NULL COMMENT '审核时间',
    PRIMARY KEY (id),
    KEY idx_author_id (author_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';
```

---

### Task 2: Article 实体与 VO/DTO

**Files:**
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/Entity/Article.java`
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/vo/ArticleVO.java`
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/dto/AuditDTO.java`

- [ ] **Step 1: 创建 Article.java**

```java
package com.example.demo.Entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@TableName("article")
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private String content;

    private Long authorId;

    private String status;

    private String auditComment;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime auditTime;
}
```

- [ ] **Step 2: 创建 ArticleVO.java**

```java
package com.example.demo.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ArticleVO {
    private Long id;
    private String title;
    private String content;
    private Long authorId;
    private String authorName;
    private String status;
    private String auditComment;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime auditTime;
}
```

- [ ] **Step 3: 创建 AuditDTO.java**

```java
package com.example.demo.dto;

import lombok.Data;

@Data
public class AuditDTO {
    private Boolean approved;
    private String comment;
}
```

---

### Task 3: Article 数据访问与业务层

**Files:**
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/mapper/ArticleMapper.java`
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/service/ArticleService.java`
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/service/impl/ArticleServiceImpl.java`

- [ ] **Step 1: 创建 ArticleMapper.java**

```java
package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.Entity.Article;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
```

- [ ] **Step 2: 创建 ArticleService.java**

```java
package com.example.demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.Entity.Article;

public interface ArticleService extends IService<Article> {
}
```

- [ ] **Step 3: 创建 ArticleServiceImpl.java**

```java
package com.example.demo.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.Entity.Article;
import com.example.demo.mapper.ArticleMapper;
import com.example.demo.service.ArticleService;
import org.springframework.stereotype.Service;

@Service
public class ArticleServiceImpl extends ServiceImpl<ArticleMapper, Article> implements ArticleService {
}
```

---

### Task 4: ArticleController

**Files:**
- Create: `E:/Java/Project/demo/src/main/java/com/example/demo/controller/ArticleController.java`

- [ ] **Step 1: 创建 ArticleController.java**

```java
package com.example.demo.controller;

import cn.dev33.satoken.annotation.SaCheckRole;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.Entity.Article;
import com.example.demo.Entity.SysUser;
import com.example.demo.common.Result;
import com.example.demo.dto.AuditDTO;
import com.example.demo.service.ArticleService;
import com.example.demo.service.SysUserService;
import com.example.demo.vo.ArticleVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "文章管理", description = "文章发布、查询、审核")
@RestController
public class ArticleController {

    @Resource
    private ArticleService articleService;

    @Resource
    private SysUserService sysUserService;

    @Operation(summary = "已通过文章列表")
    @GetMapping("/public/article")
    public Result publicList(@RequestParam(defaultValue = "1") Integer pageNum,
                             @RequestParam(defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getStatus, Article.STATUS_APPROVED)
                .orderByDesc(Article::getAuditTime)
                .orderByDesc(Article::getId);
        Page<Article> page = articleService.page(new Page<>(pageNum, pageSize), wrapper);
        Page<ArticleVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        voPage.setRecords(toVOList(page.getRecords()));
        return Result.success(voPage);
    }

    @Operation(summary = "已通过文章详情")
    @GetMapping("/public/article/{id}")
    public Result publicDetail(@PathVariable Long id) {
        Article article = articleService.getById(id);
        if (article == null || !Article.STATUS_APPROVED.equals(article.getStatus())) {
            return Result.error("文章不存在或未通过审核");
        }
        return Result.success(toVO(article));
    }

    @Operation(summary = "发布文章")
    @PostMapping("/article")
    public Result publish(@RequestBody Article article) {
        if (article.getTitle() == null || article.getTitle().isEmpty()
                || article.getContent() == null || article.getContent().isEmpty()) {
            return Result.error("标题和正文不能为空");
        }
        Long userId = Long.valueOf(StpUtil.getLoginId().toString());
        article.setId(null);
        article.setAuthorId(userId);
        article.setStatus(Article.STATUS_PENDING);
        article.setAuditComment(null);
        article.setAuditTime(null);
        articleService.save(article);
        return Result.success();
    }

    @Operation(summary = "我的文章列表")
    @GetMapping("/article/my")
    public Result myList(@RequestParam(defaultValue = "1") Integer pageNum,
                         @RequestParam(defaultValue = "10") Integer pageSize) {
        Long userId = Long.valueOf(StpUtil.getLoginId().toString());
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getAuthorId, userId).orderByDesc(Article::getId);
        Page<Article> page = articleService.page(new Page<>(pageNum, pageSize), wrapper);
        Page<ArticleVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        voPage.setRecords(toVOList(page.getRecords()));
        return Result.success(voPage);
    }

    @Operation(summary = "编辑文章")
    @PutMapping("/article/{id}")
    public Result update(@PathVariable Long id, @RequestBody Article article) {
        Long userId = Long.valueOf(StpUtil.getLoginId().toString());
        Article db = articleService.getById(id);
        if (db == null) return Result.error("文章不存在");
        if (!db.getAuthorId().equals(userId)) return Result.error("只能编辑自己的文章");
        if (!Article.STATUS_REJECTED.equals(db.getStatus())) return Result.error("只有被驳回的文章才能编辑");
        if (article.getTitle() == null || article.getTitle().isEmpty()
                || article.getContent() == null || article.getContent().isEmpty()) {
            return Result.error("标题和正文不能为空");
        }
        db.setTitle(article.getTitle());
        db.setContent(article.getContent());
        db.setStatus(Article.STATUS_PENDING);
        db.setAuditComment(null);
        db.setAuditTime(null);
        articleService.updateById(db);
        return Result.success();
    }

    @Operation(summary = "删除文章")
    @DeleteMapping("/article/{id}")
    public Result delete(@PathVariable Long id) {
        Long userId = Long.valueOf(StpUtil.getLoginId().toString());
        Article db = articleService.getById(id);
        if (db == null) return Result.error("文章不存在");
        boolean isAdmin = StpUtil.hasRole("admin");
        if (!db.getAuthorId().equals(userId) && !isAdmin) {
            return Result.error("只能删除自己的文章");
        }
        articleService.removeById(id);
        return Result.success();
    }

    @Operation(summary = "审核列表")
    @SaCheckRole("admin")
    @GetMapping("/article/audit")
    public Result auditList(@RequestParam(defaultValue = "1") Integer pageNum,
                            @RequestParam(defaultValue = "10") Integer pageSize,
                            @RequestParam(defaultValue = "") String status) {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Article::getStatus, status);
        }
        wrapper.orderByAsc(Article::getCreateTime).orderByAsc(Article::getId);
        Page<Article> page = articleService.page(new Page<>(pageNum, pageSize), wrapper);
        Page<ArticleVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        voPage.setRecords(toVOList(page.getRecords()));
        return Result.success(voPage);
    }

    @Operation(summary = "审核文章")
    @SaCheckRole("admin")
    @PutMapping("/article/{id}/audit")
    public Result audit(@PathVariable Long id, @RequestBody AuditDTO dto) {
        Article db = articleService.getById(id);
        if (db == null) return Result.error("文章不存在");
        if (dto.getApproved() == null) return Result.error("请指定审核结果");
        if (Boolean.TRUE.equals(dto.getApproved())) {
            db.setStatus(Article.STATUS_APPROVED);
            db.setAuditComment(dto.getComment());
        } else {
            db.setStatus(Article.STATUS_REJECTED);
            db.setAuditComment(dto.getComment() == null || dto.getComment().isEmpty() ? "未通过" : dto.getComment());
        }
        db.setAuditTime(LocalDateTime.now());
        articleService.updateById(db);
        return Result.success();
    }

    private List<ArticleVO> toVOList(List<Article> articles) {
        if (articles == null || articles.isEmpty()) return new ArrayList<>();
        List<Long> authorIds = articles.stream().map(Article::getAuthorId).distinct().collect(Collectors.toList());
        Map<Long, String> nameMap = sysUserService.listByIds(authorIds).stream()
                .collect(Collectors.toMap(SysUser::getId, u -> u.getNickname() != null ? u.getNickname() : u.getUsername()));
        return articles.stream().map(a -> toVO(a, nameMap)).collect(Collectors.toList());
    }

    private ArticleVO toVO(Article article) {
        return toVO(article, null);
    }

    private ArticleVO toVO(Article article, Map<Long, String> nameMap) {
        ArticleVO vo = new ArticleVO();
        vo.setId(article.getId());
        vo.setTitle(article.getTitle());
        vo.setContent(article.getContent());
        vo.setAuthorId(article.getAuthorId());
        vo.setStatus(article.getStatus());
        vo.setAuditComment(article.getAuditComment());
        vo.setCreateTime(article.getCreateTime());
        vo.setUpdateTime(article.getUpdateTime());
        vo.setAuditTime(article.getAuditTime());
        if (nameMap != null) {
            vo.setAuthorName(nameMap.get(article.getAuthorId()));
        } else if (article.getAuthorId() != null) {
            SysUser author = sysUserService.getById(article.getAuthorId());
            if (author != null) {
                vo.setAuthorName(author.getNickname() != null ? author.getNickname() : author.getUsername());
            }
        }
        return vo;
    }
}
```

---

### Task 5: 放行公共接口

**Files:**
- Modify: `E:/Java/Project/demo/src/main/java/com/example/demo/config/SaTokenConfig.java`

- [ ] **Step 1: 在 SaTokenConfig 放行 /public/****

在 `.addExclude("/auth/isLogin")` 后追加：

```java
                .addExclude("/public/**")
```

---

### Task 6: 编译后端

- [ ] **Step 1: 编译**

Run: `$env:JAVA_HOME='C:\Users\wh\.jdks\corretto-17.0.12'; .\mvnw.cmd -q -DskipTests compile`
Expected: 编译通过

---

### Task 7: 前端路由

**Files:**
- Modify: `E:/Java/Project/demo-vue/src/router/index.js`

- [ ] **Step 1: 更新 router/index.js**

```js
import { createRouter, createWebHistory } from 'vue-router'
import LayoutView from '@/layout/LayoutView.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/articles', name: 'public-articles', component: () => import('../views/article/PublicArticleListView.vue') },
    { path: '/articles/:id', name: 'public-article-detail', component: () => import('../views/article/PublicArticleDetailView.vue') },
    {
      path: '/',
      component: LayoutView,
      redirect: '/home',
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'system/user', name: 'system-user', component: () => import('../views/system/UserView.vue') },
        { path: 'system/role', name: 'system-role', component: () => import('../views/system/RoleView.vue') },
        { path: 'system/menu', name: 'system-menu', component: () => import('../views/system/MenuView.vue') },
        { path: 'article/my', name: 'article-my', component: () => import('../views/article/MyArticlesView.vue') },
        { path: 'article/audit', name: 'article-audit', component: () => import('../views/article/AuditView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const isPublic = to.path === '/articles' || to.path.startsWith('/articles/')
  if (!token && to.path !== '/login' && !isPublic) {
    return { path: '/login' }
  }
  if (token && to.path === '/login') {
    return { path: '/' }
  }
})

export default router
```

---

### Task 8: 侧边栏入口

**Files:**
- Modify: `E:/Java/Project/demo-vue/src/layout/LayoutView.vue`

- [ ] **Step 1: 在动态菜单后加固定菜单**

在 `</el-menu>` 前、动态循环 `</template>` 后追加：

```vue
        <el-menu-item index="/article/my">我的文章</el-menu-item>
        <el-menu-item v-if="userStore.roles.includes('admin')" index="/article/audit">文章审核</el-menu-item>
```

---

### Task 9: 前端公共文章页面

**Files:**
- Create: `E:/Java/Project/demo-vue/src/views/article/PublicArticleListView.vue`
- Create: `E:/Java/Project/demo-vue/src/views/article/PublicArticleDetailView.vue`

- [ ] **Step 1: 创建 PublicArticleListView.vue**

```vue
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10 })

async function load() {
  const res = await request.get('/public/article', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  }
}

function goDetail(row) {
  router.push('/articles/' + row.id)
}

onMounted(load)
</script>

<template>
  <div class="public-wrap">
    <div class="topbar">
      <span class="brand">文章广场</span>
      <el-button link type="primary" @click="router.push('/login')">登录 / 发布</el-button>
    </div>
    <el-card v-for="item in list" :key="item.id" class="card" shadow="hover" @click="goDetail(item)">
      <div class="title">{{ item.title }}</div>
      <div class="meta">作者：{{ item.authorName }} · {{ item.auditTime || item.createTime }}</div>
    </el-card>
    <el-pagination
      class="pager"
      v-model:current-page="query.pageNum"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
      @size-change="load"
    />
  </div>
</template>

<style scoped>
.public-wrap { max-width: 760px; margin: 0 auto; padding: 20px; }
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.brand { font-size: 20px; font-weight: bold; }
.card { margin-bottom: 12px; cursor: pointer; }
.title { font-size: 16px; font-weight: 600; }
.meta { margin-top: 6px; color: #909399; font-size: 13px; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
```

- [ ] **Step 2: 创建 PublicArticleDetailView.vue**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const article = ref(null)

async function load() {
  const res = await request.get('/public/article/' + route.params.id)
  if (res.code === 200) {
    article.value = res.data
  }
}

onMounted(load)
</script>

<template>
  <div class="detail-wrap">
    <el-button link @click="router.back()">返回列表</el-button>
    <el-card v-if="article">
      <h1>{{ article.title }}</h1>
      <div class="meta">作者：{{ article.authorName }} · {{ article.auditTime || article.createTime }}</div>
      <el-divider />
      <div class="content">{{ article.content }}</div>
    </el-card>
  </div>
</template>

<style scoped>
.detail-wrap { max-width: 760px; margin: 0 auto; padding: 20px; }
.meta { color: #909399; font-size: 13px; margin: 8px 0; }
.content { white-space: pre-wrap; line-height: 1.8; }
</style>
```

---

### Task 10: 我的文章页面

**Files:**
- Create: `E:/Java/Project/demo-vue/src/views/article/MyArticlesView.vue`

- [ ] **Step 1: 创建 MyArticlesView.vue**

```vue
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, title: '', content: '' })

const statusText = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过' }
const statusType = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

async function load() {
  const res = await request.get('/article/my', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  }
}

function openPublish() {
  isEdit.value = false
  form.id = null
  form.title = ''
  form.content = ''
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.content = row.content
  dialogVisible.value = true
}

async function save() {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和正文')
    return
  }
  const res = isEdit.value
    ? await request.put('/article/' + form.id, form)
    : await request.post('/article', form)
  if (res.code === 200) {
    ElMessage.success(isEdit.value ? '已重新提交审核' : '发布成功')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '操作失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除该文章吗？', '提示', { type: 'warning' })
  const res = await request.delete('/article/' + row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    load()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="load">刷新</el-button>
        <el-button type="success" @click="openPublish">发布文章</el-button>
      </div>
      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditComment" label="审核意见" />
        <el-table-column prop="createTime" label="发布时间" width="170" />
        <el-table-column prop="auditTime" label="审核时间" width="170" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="row.status === 'REJECTED'" link type="primary" @click="openEdit(row)">编辑重交</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
        @size-change="load"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑文章' : '发布文章'" width="600px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
```

---

### Task 11: 审核页面

**Files:**
- Create: `E:/Java/Project/demo-vue/src/views/article/AuditView.vue`

- [ ] **Step 1: 创建 AuditView.vue**

```vue
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, status: '' })

const dialogVisible = ref(false)
const currentId = ref(null)
const form = reactive({ approved: true, comment: '' })

const statusText = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过' }
const statusType = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

async function load() {
  const res = await request.get('/article/audit', { params: query })
  if (res.code === 200) {
    list.value = res.data.records
    total.value = res.data.total
  }
}

function openAudit(row) {
  currentId.value = row.id
  form.approved = true
  form.comment = ''
  dialogVisible.value = true
}

async function submitAudit() {
  const res = await request.put('/article/' + currentId.value + '/audit', form)
  if (res.code === 200) {
    ElMessage.success('审核完成')
    dialogVisible.value = false
    load()
  } else {
    ElMessage.error(res.msg || '审核失败')
  }
}

async function remove(row) {
  await ElMessageBox.confirm('确定删除该文章吗？', '提示', { type: 'warning' })
  const res = await request.delete('/article/' + row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    load()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <div class="toolbar">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 160px" @change="load">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="未通过" value="REJECTED" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>
      <el-table :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="authorName" label="作者" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditComment" label="审核意见" />
        <el-table-column prop="createTime" label="发布时间" width="170" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button v-if="row.status === 'PENDING'" link type="primary" @click="openAudit(row)">审核</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
        @size-change="load"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="审核文章" width="480px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="结果">
          <el-radio-group v-model="form.approved">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意见">
          <el-input v-model="form.comment" type="textarea" :rows="4" placeholder="审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
```

---

### Task 12: 构建前端

- [ ] **Step 1: 构建**

Run: `npm run build`
Expected: 构建通过

---

## Self-Review

- Spec 覆盖：发布、我的文章、删除、编辑重交、审核、公共列表/详情均已覆盖。
- 类型一致性：Article 状态常量为 PENDING/APPROVED/REJECTED，前后端一致。
- 公共路由守卫与后端 /public/** 放行一致。
