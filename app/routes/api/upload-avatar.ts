import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth/server";
import { uploadFile, deleteFile } from "~/lib/storage.server";
import { prisma } from "~/lib/db.server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireAuth(request);

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File) || !file.size) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadFile(buffer, file.name, file.type);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (user?.image) {
    await deleteFile(user.image).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: key },
  });

  return Response.json({ success: true, key });
}
