import { listResources } from "../../../storage";

export async function GET() {
  const resources = await listResources();

  return Response.json({ resources });
}
