import {
  createTeacherInStorage,
  deleteTeacherInStorage,
  listTeachersFromStorage,
} from "../../../storage";

export async function GET() {
  const teachers = await listTeachersFromStorage();

  return Response.json({ teachers });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const teachers = await createTeacherInStorage(formData);

    return Response.json({ teachers }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "教师账号保存失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const teachers = await deleteTeacherInStorage(String(body.id ?? ""));

    return Response.json({ teachers });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "教师账号删除失败。" },
      { status: 400 },
    );
  }
}
