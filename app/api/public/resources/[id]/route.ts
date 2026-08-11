import { getStoredResource } from "../../../../storage";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: Context) {
  const stored = await getStoredResource(context.params.id);

  if (!stored) {
    return Response.json({ error: "资源不存在或未公开。" }, { status: 404 });
  }

  return Response.json({ resource: stored.resource });
}
