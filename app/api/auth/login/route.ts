export async function POST() {
  return Response.json(
    {
      error: "登录接口已预留。下一步接入 D1 users、密码哈希校验、限流和 HttpOnly Cookie。",
    },
    { status: 501 },
  );
}
