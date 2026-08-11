import { readDownloadObject } from "../../../../../storage";

type Context = {
  params: {
    id: string;
  };
};

function encodeDownloadName(filename: string) {
  return encodeURIComponent(filename).replace(/['()]/g, escape);
}

export async function GET(_request: Request, context: Context) {
  const result = await readDownloadObject(context.params.id);

  if (!result) {
    return Response.json({ error: "资源不存在、未公开或文件未找到。" }, { status: 404 });
  }

  return new Response(result.body, {
    headers: {
      "content-type": result.contentType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeDownloadName(result.resource.filename)}`,
    },
  });
}
