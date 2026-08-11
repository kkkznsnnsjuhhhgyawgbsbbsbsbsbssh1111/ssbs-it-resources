import { AdminOperations } from "./AdminOperations";
import { courses, resourceTypes, resources } from "../data";

export default function AdminPage() {
  return (
    <main>
      <header className="siteHeader adminHeader">
        <a className="brand" href="/">
          <span className="brandIcon">SSBS</span>
          <span>
            <strong>管理后台</strong>
            <small>资源上传、课程、教师账号管理</small>
          </span>
        </a>
        <nav className="topNav adminTopNav" aria-label="后台导航">
          <a href="/resources">公共资源页</a>
          <a href="/">退出</a>
        </nav>
      </header>

      <section className="adminShell">
        <aside className="adminSide">
          <a className="active" href="#overview">概览</a>
          <a href="#upload">上传资源</a>
          <a href="#resources">资源管理</a>
          <a href="#courses">课程管理</a>
          <a href="#teachers">教师账号</a>
        </aside>

        <div className="adminMain">
          <AdminOperations
            initialCourses={courses}
            resourceTypes={resourceTypes}
            resources={resources}
          />
        </div>
      </section>
    </main>
  );
}
