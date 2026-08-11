import { deleteStoredResource, updateResourceFlag } from "../../../../storage";

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await request.json();
    const resource = await updateResourceFlag(context.params.id, String(body.action ?? ""));

    return Response.json({ resource });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "资源更新失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await deleteStoredResource(context.params.id);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "资源删除失败。" },
      { status: 400 },
    );
  }
}
