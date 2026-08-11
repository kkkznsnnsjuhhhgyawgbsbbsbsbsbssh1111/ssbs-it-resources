import { getResource, resources } from "../../data";
import { ResourceDetailClient } from "./ResourceDetailClient";

type Props = {
  params: {
    id: string;
  };
};

export function generateStaticParams() {
  return resources.map((resource) => ({ id: resource.id }));
}

export default function ResourceDetailPage({ params }: Props) {
  const resource = getResource(params.id) ?? resources[0];

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="/">
          <span className="brandIcon">SSBS</span>
          <span>
            <strong>信息科技课堂资源中心</strong>
            <small>资源详情</small>
          </span>
        </a>
        <nav className="topNav" aria-label="主导航">
          <a href="/resources">全部资源</a>
          <a href="/login">教师登录</a>
        </nav>
      </header>

      <ResourceDetailClient initialResource={resource} resourceId={params.id} />
    </main>
  );
}
