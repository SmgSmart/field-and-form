import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id?.trim() ?? "";
        if (!id) return new Response("Not found", { status: 404 });
        const sql = await getSql();
        const rows = await sql<{ content_type: string; data: string }>`
          select content_type, data from service_images where id = ${id}
          union all
          select content_type, data from category_images where id = ${id}
          limit 1
        `;
        const row = rows[0];
        if (!row) return new Response("Not found", { status: 404 });
        const bytes = Uint8Array.from(atob(row.data), (char) => char.charCodeAt(0));
        return new Response(bytes, {
          headers: {
            "content-type": row.content_type,
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
