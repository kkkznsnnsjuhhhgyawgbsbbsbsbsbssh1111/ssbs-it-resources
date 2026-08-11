import { extensionCourses, itCourses } from "./data";

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
              {itCourses.map((course) => (
                <a href={`/resources?course=${encodeURIComponent(course)}`} key={course}>
                  <strong>{course}</strong>
                  <span>进入资源</span>
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
                <a href={`/resources?course=${encodeURIComponent(course)}`} key={course}>
                  {course}
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
