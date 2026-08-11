"use client";

import { useEffect, useState } from "react";
import { AdminResourceManager } from "./AdminResourceManager";
import type { Resource } from "../data";

type Teacher = {
  id: string;
  name: string;
  username: string;
  password: string;
};

type Props = {
  initialCourses: string[];
  resourceTypes: string[];
  resources: Resource[];
};

const initialTeachers: Teacher[] = [
  {
    id: "teacher-1",
    name: "信息科技教师",
    username: "teacher01",
    password: "teacher123",
  },
];

export function AdminOperations({ initialCourses, resourceTypes, resources }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [operationsMessage, setOperationsMessage] = useState("课程和教师账号会保存到 D1。");

  useEffect(() => {
    let ignore = false;

    async function loadOperations() {
      const [courseResponse, teacherResponse] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch("/api/admin/teachers"),
      ]);

      if (courseResponse.ok) {
        const data = (await courseResponse.json()) as { courses?: string[] };
        if (!ignore && data.courses) {
          setCourses(data.courses);
        }
      }

      if (teacherResponse.ok) {
        const data = (await teacherResponse.json()) as { teachers?: Teacher[] };
        if (!ignore && data.teachers) {
          setTeachers(data.teachers);
        }
      }
    }

    loadOperations().catch(() => {
      setOperationsMessage("当前环境未连接 D1，课程和教师账号仅作预览。");
    });

    return () => {
      ignore = true;
    };
  }, []);

  async function addCourse(formData: FormData) {
    const response = await fetch("/api/admin/courses", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { courses?: string[]; error?: string };

    if (!response.ok || !data.courses) {
      setOperationsMessage(data.error || "课程保存失败。");
      return;
    }

    setCourses(data.courses);
    setOperationsMessage("课程已保存。");
  }

  async function renameCourse(formData: FormData) {
    const oldName = String(formData.get("oldName") ?? "");
    const newName = String(formData.get("newName") ?? "").trim();
    const response = await fetch("/api/admin/courses", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    const data = (await response.json()) as { courses?: string[]; error?: string };

    if (!response.ok || !data.courses) {
      setOperationsMessage(data.error || "课程改名失败。");
      return;
    }

    setCourses(data.courses);
    setOperationsMessage("课程已更新。");
  }

  async function deleteCourse(courseName: string) {
    const response = await fetch("/api/admin/courses", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseName }),
    });
    const data = (await response.json()) as { courses?: string[]; error?: string };

    if (!response.ok || !data.courses) {
      setOperationsMessage(data.error || "课程删除失败。");
      return;
    }

    setCourses(data.courses);
    setOperationsMessage("课程已删除。");
  }

  async function addTeacher(formData: FormData) {
    const response = await fetch("/api/admin/teachers", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { teachers?: Teacher[]; error?: string };

    if (!response.ok || !data.teachers) {
      setOperationsMessage(data.error || "教师账号保存失败。");
      return;
    }

    setTeachers(data.teachers);
    setOperationsMessage("教师账号已保存。");
  }

  async function deleteTeacher(id: string) {
    const response = await fetch("/api/admin/teachers", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await response.json()) as { teachers?: Teacher[]; error?: string };

    if (!response.ok || !data.teachers) {
      setOperationsMessage(data.error || "教师账号删除失败。");
      return;
    }

    setTeachers(data.teachers);
    setOperationsMessage("教师账号已删除。");
  }

  return (
    <>
      <AdminResourceManager
        courses={courses}
        resourceTypes={resourceTypes}
        resources={resources}
      />

      <section className="adminColumns">
        <div className="adminPanel" id="courses">
          <p className="eyebrow">Courses</p>
          <h2>课程管理</h2>
          <p className="adminNotice">{operationsMessage}</p>
          <form className="inlineCreateForm" action={addCourse}>
            <input name="courseName" placeholder="新增课程名称" />
            <button type="submit">新增课程</button>
          </form>
          <div className="manageList">
            {courses.map((course) => (
              <form className="manageRow" action={renameCourse} key={course}>
                <input name="oldName" type="hidden" value={course} />
                <input name="newName" defaultValue={course} aria-label={`${course}课程名`} />
                <button type="submit">改名</button>
                <button type="button" className="danger" onClick={() => deleteCourse(course)}>
                  删除
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="adminPanel teacherPanel" id="teachers">
          <p className="eyebrow">Teachers</p>
          <h2>教师账号</h2>
          <form className="teacherCreateForm" action={addTeacher}>
            <input name="name" placeholder="老师姓名" />
            <input name="username" placeholder="登录用户名" />
            <input name="password" placeholder="初始密码" type="text" />
            <button type="submit">新增账号</button>
          </form>
          <div className="teacherTable">
            <div className="teacherTableHead">
              <span>老师姓名</span>
              <span>用户名</span>
              <span>密码</span>
              <span>操作</span>
            </div>
            {teachers.map((teacher) => (
              <div className="teacherTableRow" key={teacher.id}>
                <strong>{teacher.name}</strong>
                <span>{teacher.username}</span>
                <span>{teacher.password}</span>
                <button type="button" className="danger" onClick={() => deleteTeacher(teacher.id)}>
                  删除账号
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
