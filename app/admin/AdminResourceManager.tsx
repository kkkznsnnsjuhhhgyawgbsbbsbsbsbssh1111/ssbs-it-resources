"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminResource, Resource } from "../data";

type Props = {
  courses: string[];
  resourceTypes: string[];
  resources: Resource[];
};

function toAdminResource(resource: Resource): AdminResource {
  return {
    ...resource,
    status: "公开",
  };
}

export function AdminResourceManager({ courses, resourceTypes, resources }: Props) {
  const [items, setItems] = useState<AdminResource[]>(resources.map(toAdminResource));
  const [selectedCourse, setSelectedCourse] = useState(courses[0] ?? "");
  const [selectedType, setSelectedType] = useState(resourceTypes[0] ?? "");
  const [selectedFileName, setSelectedFileName] = useState("blank.html");
  const [message, setMessage] = useState("已连接后台接口；部署绑定 D1/R2 后会永久保存。");
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    const published = items.filter((item) => item.status === "公开").length;
    const hidden = items.length - published;
    const downloads = items.reduce((total, item) => total + item.downloads, 0);

    return {
      total: items.length,
      published,
      hidden,
      downloads,
    };
  }, [items]);

  useEffect(() => {
    let ignore = false;

    async function loadResources() {
      const response = await fetch("/api/admin/resources");

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { resources?: AdminResource[] };

      if (!ignore && data.resources) {
        setItems(data.resources);
      }
    }

    loadResources().catch(() => {
      setMessage("当前仍在使用页面内的示例数据。");
    });

    return () => {
      ignore = true;
    };
  }, []);

  async function addResource(formData: FormData) {
    setIsSaving(true);
    setMessage("正在保存资源...");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { resource?: AdminResource; error?: string };

      if (!response.ok || !data.resource) {
        throw new Error(data.error || "资源保存失败。");
      }

      setItems((current) => [data.resource!, ...current]);
      setSelectedFileName("blank.html");
      setMessage("资源已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "资源保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateResource(id: string, action: "togglePinned" | "toggleWeekly" | "toggleStatus") {
    const response = await fetch(`/api/admin/resources/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as { resource?: AdminResource; error?: string };

    if (!response.ok || !data.resource) {
      setMessage(data.error || "资源更新失败。");
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? data.resource! : item)),
    );
    setMessage("资源状态已更新。");
  }

  async function deleteResource(id: string) {
    const response = await fetch(`/api/admin/resources/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error || "资源删除失败。");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setMessage("资源已删除。");
  }

  return (
    <>
      <section id="overview" className="overviewSection">
        <div className="overviewHeader">
          <div className="sectionTitle">
            <p className="eyebrow">Overview</p>
            <h1>后台概况</h1>
          </div>
          <div className="statGrid">
            <div>
              <span>资源总数</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>公开资源</span>
              <strong>{stats.published}</strong>
            </div>
            <div>
              <span>隐藏资源</span>
              <strong>{stats.hidden}</strong>
            </div>
            <div>
              <span>总下载次数</span>
              <strong>{stats.downloads}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="adminPanel" id="upload">
        <div className="sectionTitle">
          <p className="eyebrow">Upload</p>
          <h2>上传资源</h2>
        </div>
        <p className="adminNotice">{message}</p>
        <form className="uploadForm" action={addResource}>
          <label>
            资源标题
            <input name="title" placeholder="例如：六年级 IT 第 1 课课堂素材" />
          </label>
          <label>
            所属课程
            <select
              name="course"
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>
          <label>
            资源类型
            <select
              name="type"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="wideField">
            简介
            <textarea name="summary" placeholder="给学生看的简短说明" rows={3} />
          </label>
          <label>
            附件
            <input
              accept=".html,.zip,.pdf,.pptx,.docx,.xlsx,.txt"
              name="file"
              type="file"
              onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "blank.html")}
            />
          </label>
          <div className="filePreview">当前附件：{selectedFileName}</div>
          <label className="checkRow">
            <input name="pinned" type="checkbox" />
            置顶
          </label>
          <label className="checkRow">
            <input name="weekly" type="checkbox" />
            本周资源
          </label>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "保存中..." : "保存资源"}
          </button>
        </form>
      </section>

      <section className="adminPanel" id="resources">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Resources</p>
            <h2>资源管理</h2>
          </div>
          <a className="secondaryButton" href="/resources">
            查看公共页
          </a>
        </div>
        <div className="tableLike adminResourceTable">
          {items.map((resource) => (
            <div className="tableRow" key={resource.id}>
              <strong>{resource.title}</strong>
              <span>{resource.course}</span>
              <span>{resource.type}</span>
              <span>{resource.status}</span>
              <span>{resource.pinned ? "已置顶" : "未置顶"}</span>
              <div>
                <button type="button" onClick={() => updateResource(resource.id, "togglePinned")}>
                  {resource.pinned ? "取消置顶" : "置顶"}
                </button>
                <button type="button" onClick={() => updateResource(resource.id, "toggleWeekly")}>
                  {resource.weekly ? "取消本周" : "本周"}
                </button>
                <button type="button" onClick={() => updateResource(resource.id, "toggleStatus")}>
                  {resource.status === "公开" ? "隐藏" : "公开"}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteResource(resource.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
