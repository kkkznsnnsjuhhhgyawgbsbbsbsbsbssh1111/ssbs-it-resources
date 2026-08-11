import { extensionCourses, itCourses } from "./data";

const courseSubtitles: Record<string, string> = {
  "六年级 IT": "课堂资源 · 练习素材",
  "七年级 IT": "课堂资源 · 示例文件",
  "八年级 IT": "课堂资源 · 项目素材",
  "六年级 Python": "代码示例 · 课堂练习",
  "七年级 Python": "代码示例 · 拓展任务",
  人工智能课程: "课程素材 · AI 体验",
};

export default function Home() {
  return (
    <main className="homePage">
      <header className="siteHeader homeHeader">
        <a className="brand" href="/">
          <span className="brandIcon">SSBS</span>
          <span>
            <strong>信息科技课堂资源中心</strong>
          </span>
        </a>
        <nav className="topNav singleNav" aria-label="主导航">
          <a href="/login">教师登录</a>
        </nav>
      </header>

      <section className="homeShell">
        <div className="homeIntro">
          <h1>选择课程，进入资源目录</h1>
          <form className="searchPanel homeSearch" action="/resources">
            <label className="srOnly" htmlFor="home-search">
              搜索资源
            </label>
            <input id="home-search" name="q" placeholder="搜索资源名称或关键词" />
            <button type="submit">搜索</button>
          </form>
        </div>

        <div className="homeCoursePanel">
          <section className="homeCourseGroup">
            <div className="sectionTitle">
              <h2>IT学科</h2>
            </div>
            <div className="quickGrid">
              {itCourses.map((course, index) => (
                <a
                  className="courseEntry"
                  href={`/resources?course=${encodeURIComponent(course)}`}
                  key={course}
                >
                  <span className="courseBadge">{index + 6}</span>
                  <strong>{course}</strong>
                  <span>{courseSubtitles[course] ?? "进入资源目录"}</span>
                  <small>进入资源</small>
                </a>
              ))}
            </div>
          </section>

          <section className="homeCourseGroup">
            <div className="sectionTitle">
              <h2>拓展课</h2>
            </div>
            <div className="courseGrid">
              {extensionCourses.map((course) => (
                <a
                  className="courseEntry extensionEntry"
                  href={`/resources?course=${encodeURIComponent(course)}`}
                  key={course}
                >
                  <span className="courseBadge">+</span>
                  <strong>{course}</strong>
                  <span>{courseSubtitles[course] ?? "进入资源目录"}</span>
                  <small>进入资源</small>
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
