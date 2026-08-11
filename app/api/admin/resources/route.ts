import { createResource, listResources } from "../../../storage";

export async function GET() {
  const resources = await listResources({ includeHidden: true });

  return Response.json({ resources });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resource = await createResource(formData);

    return Response.json({ resource }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "资源保存失败。" },
      { status: 400 },
    );
  }
}
