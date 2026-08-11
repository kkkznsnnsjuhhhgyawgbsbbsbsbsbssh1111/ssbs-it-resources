export default function LoginPage() {
  return (
    <main className="teacherPage">
      <header className="siteHeader teacherHeader">
        <a className="brand" href="/">
          <span className="brandIcon">SSBS</span>
          <span>
            <strong>信息科技课堂资源中心</strong>
            <small>教师端</small>
          </span>
        </a>
        <nav className="topNav" aria-label="主导航">
          <a href="/">返回首页</a>
        </nav>
      </header>

      <section className="teacherLoginShell">
        <div className="teacherLoginIntro">
          <p className="eyebrow">Teacher Portal</p>
          <h1>教师资源管理入口</h1>
          <p>登录后可以上传课堂素材、维护课程目录、设置置顶资源，并管理教师账号。</p>
          <div className="teacherLoginBadges">
            <span>资源上传</span>
            <span>课程管理</span>
            <span>账号管理</span>
          </div>
        </div>

        <form className="loginCard teacherLoginCard" action="/admin">
          <h2>教师登录</h2>
          <label>
            用户名
            <input name="username" autoComplete="username" placeholder="teacher01" />
          </label>
          <label>
            密码
            <input name="password" type="text" autoComplete="current-password" />
          </label>
          <button type="submit">进入后台</button>
          <small>登录使用后台创建的用户名和密码。</small>
        </form>
      </section>
    </main>
  );
}
