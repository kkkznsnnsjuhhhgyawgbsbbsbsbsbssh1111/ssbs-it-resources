"use client";

import { useEffect, useMemo, useState } from "react";
import type { Resource } from "../data";

type Props = {
  initialResources: Resource[];
  selectedCourse?: string;
  selectedType?: string;
  keyword: string;
  isCourseDirectory: boolean;
};

function includesKeyword(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export function ResourceDirectory({
  initialResources,
  selectedCourse,
  selectedType,
  keyword,
  isCourseDirectory,
}: Props) {
  const [resources, setResources] = useState(initialResources);

  useEffect(() => {
    let ignore = false;

    async function loadResources() {
      const response = await fetch("/api/public/resources");

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { resources?: Resource[] };

      if (!ignore && data.resources) {
        setResources(data.resources);
      }
    }

    loadResources().catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (selectedCourse && resource.course !== selectedCourse) {
          return false;
        }

        if (!isCourseDirectory && selectedType && resource.type !== selectedType) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        return [
          resource.title,
          resource.summary,
          resource.description,
          resource.filename,
          resource.course,
          resource.type,
        ].some((value) => includesKeyword(value, keyword));
      }),
    [isCourseDirectory, keyword, resources, selectedCourse, selectedType],
  );

  return (
    <div className="resourceList">
      {filteredResources.length > 0 ? (
        filteredResources.map((resource) => (
          <article className="resourceCard horizontal" key={resource.id}>
            <div>
              <div className="cardMeta">
                <span>{resource.course}</span>
                <span>{resource.type}</span>
                {resource.pinned ? <span className="hot">置顶</span> : null}
                {resource.weekly ? <span className="hot">本周资源</span> : null}
              </div>
              <h2>{resource.title}</h2>
              <p>{resource.summary}</p>
              <small>
                {resource.filename} · {resource.fileType} · {resource.size} · 更新于{" "}
                {resource.updatedAt}
              </small>
            </div>
            <div className="cardActions">
              <a className="secondaryButton" href={`/resources/${resource.id}`}>
                查看详情
              </a>
              <a className="downloadButton" href={`/api/public/resources/${resource.id}/download`}>
                下载 {resource.size}
              </a>
            </div>
          </article>
        ))
      ) : (
        <div className="emptyState">
          <h2>没有找到资源</h2>
          <p>换一个关键词试试，或返回首页重新选择课程。</p>
        </div>
      )}
    </div>
  );
}
