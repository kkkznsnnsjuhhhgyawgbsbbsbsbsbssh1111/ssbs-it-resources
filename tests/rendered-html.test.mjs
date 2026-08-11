import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders a simplified homepage without all-resources nav", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /信息科技课堂资源中心/);
  assert.match(html, /SSBS/);
  assert.match(html, /选择课程/);
  assert.match(html, /教师登录/);
  assert.match(html, /IT学科/);
  assert.match(html, /六年级 IT/);
  assert.match(html, /七年级 IT/);
  assert.match(html, /八年级 IT/);
  assert.match(html, /拓展课/);
  assert.match(html, /六年级 Python/);
  assert.match(html, /七年级 Python/);
  assert.match(html, /人工智能课程/);
  assert.doesNotMatch(html, /<a href="\/resources">全部资源<\/a>/);
  assert.doesNotMatch(html, /课堂资源下载/);
  assert.doesNotMatch(html, /最近更新/);
});

test("renders resources, detail, login and admin pages", async () => {
  for (const path of [
    "/resources",
    "/resources/grade6-it-materials",
    "/login",
    "/admin",
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
  }
});

test("course directory keeps only keyword search and matching materials", async () => {
  const response = await render(`/resources?course=${encodeURIComponent("六年级 IT")}`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /六年级 IT目录/);
  assert.match(html, /六年级 IT 课堂素材包/);
  assert.doesNotMatch(html, /六年级 Python 入门素材包/);
  assert.doesNotMatch(html, /全部课程/);
  assert.doesNotMatch(html, /全部类型/);
});

test("teacher login page uses a unified teacher portal layout", async () => {
  const response = await render("/login");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /教师资源管理入口/);
  assert.match(html, /用户名/);
  assert.match(html, /密码/);
  assert.match(html, /资源上传/);
  assert.match(html, /课程管理/);
  assert.match(html, /账号管理/);
});

test("admin page exposes upload, course and teacher controls", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /上传资源/);
  assert.match(html, /所属课程/);
  assert.match(html, /电子练习单/);
  assert.match(html, /课堂素材/);
  assert.match(html, /课件/);
  assert.match(html, /课堂练习/);
  assert.match(html, /blank\.html/);
  assert.match(html, /取消置顶|置顶/);
  assert.match(html, /课程管理/);
  assert.match(html, /新增课程/);
  assert.match(html, /改名/);
  assert.match(html, /教师账号/);
  assert.match(html, /老师姓名/);
  assert.match(html, /登录用户名/);
  assert.match(html, /初始密码/);
  assert.match(html, /新增账号/);
  assert.match(html, /删除账号/);
});
