import { courses, resources, resourceTypes } from "../data";
import { ResourceDirectory } from "./ResourceDirectory";

type Props = {
  searchParams?: {
    course?: string;
    type?: string;
    q?: string;
  };
};

function includesKeyword(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export default function ResourcesPage({ searchParams }: Props) {
  const selectedCourse = searchParams?.course;
  const selectedType = searchParams?.type;
  const keyword = searchParams?.q?.trim() ?? "";
  const isCourseDirectory = Boolean(selectedCourse);
  const pageTitle = selectedCourse ?? "全部资源";
  const initialResources = resources.filter((resource) => {
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
  });

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="/">
          <span className="brandIcon">SSBS</span>
          <span>
            <strong>信息科技课堂资源中心</strong>
            <small>{isCourseDirectory ? `${pageTitle}目录` : "全部公开资源"}</small>
          </span>
        </a>
        <nav className="topNav" aria-label="主导航">
          <a href="/">首页</a>
          <a href="/login">教师登录</a>
        </nav>
      </header>

      <section className="pageIntro">
        <p className="eyebrow">Resources</p>
        <h1>{pageTitle}</h1>
        <p>
          {isCourseDirectory
            ? `这里显示${pageTitle}的全部公开素材，可用关键词快速查找。`
            : "查看全部公开资源，也可以按课程或资源类型筛选。"}
        </p>
      </section>

      <section className={isCourseDirectory ? "directoryLayout" : "resourceLayout"}>
        <aside className="filterPanel" aria-label="资源筛选">
          <form action="/resources">
            {selectedCourse ? <input type="hidden" name="course" value={selectedCourse} /> : null}

            <label>
              关键词
              <input
                name="q"
                placeholder="输入标题、文件名或关键词"
                defaultValue={keyword}
              />
            </label>

            {!isCourseDirectory ? (
              <>
                <label>
                  课程
                  <select name="course" defaultValue={selectedCourse ?? ""}>
                    <option value="">全部课程</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  类型
                  <select name="type" defaultValue={selectedType ?? ""}>
                    <option value="">全部类型</option>
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <button type="submit">搜索</button>
          </form>
        </aside>

        <ResourceDirectory
          initialResources={initialResources}
          selectedCourse={selectedCourse}
          selectedType={selectedType}
          keyword={keyword}
          isCourseDirectory={isCourseDirectory}
        />
      </section>
    </main>
  );
}
