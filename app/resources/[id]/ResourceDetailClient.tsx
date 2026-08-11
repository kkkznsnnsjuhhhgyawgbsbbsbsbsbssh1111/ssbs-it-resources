"use client";

import { useEffect, useState } from "react";
import type { Resource } from "../../data";

type Props = {
  initialResource: Resource;
  resourceId: string;
};

export function ResourceDetailClient({ initialResource, resourceId }: Props) {
  const [resource, setResource] = useState(initialResource);

  useEffect(() => {
    let ignore = false;

    async function loadResource() {
      const response = await fetch(`/api/public/resources/${resourceId}`);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { resource?: Resource };

      if (!ignore && data.resource) {
        setResource(data.resource);
      }
    }

    loadResource().catch(() => {});

    return () => {
      ignore = true;
    };
  }, [resourceId]);

  return (
    <section className="detailShell">
      <div className="detailMain">
        <div className="cardMeta">
          <span>{resource.course}</span>
          <span>{resource.type}</span>
        </div>
        <h1>{resource.title}</h1>
        <p className="lead">{resource.description}</p>
        <div className="detailGrid">
          <div>
            <span>文件名</span>
            <strong>{resource.filename}</strong>
          </div>
          <div>
            <span>文件类型</span>
            <strong>{resource.fileType}</strong>
          </div>
          <div>
            <span>文件大小</span>
            <strong>{resource.size}</strong>
          </div>
          <div>
            <span>下载次数</span>
            <strong>{resource.downloads}</strong>
          </div>
        </div>
      </div>
      <aside className="downloadPanel">
        <p className="eyebrow">Download</p>
        <h2>课堂直接下载</h2>
        <p>学生无需登录。服务端会校验资源公开状态后，再读取 R2 文件。</p>
        <a className="downloadButton wide" href={`/api/public/resources/${resource.id}/download`}>
          下载 {resource.size}
        </a>
        <small>更新于 {resource.updatedAt}</small>
      </aside>
    </section>
  );
}
