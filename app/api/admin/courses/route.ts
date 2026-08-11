import {
  createCourseInStorage,
  deleteCourseInStorage,
  listCoursesFromStorage,
  renameCourseInStorage,
} from "../../../storage";

export async function GET() {
  const courses = await listCoursesFromStorage();

  return Response.json({ courses });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const courses = await createCourseInStorage(String(formData.get("courseName") ?? ""));

    return Response.json({ courses }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "课程保存失败。" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const courses = await renameCourseInStorage(String(body.oldName ?? ""), String(body.newName ?? ""));

    return Response.json({ courses });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "课程改名失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const courses = await deleteCourseInStorage(String(body.courseName ?? ""));

    return Response.json({ courses });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "课程删除失败。" },
      { status: 400 },
    );
  }
}
