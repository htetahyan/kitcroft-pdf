import { createFileRoute, notFound } from "@tanstack/react-router";
import { getTool, isToolSlug } from "@/lib/tools";
import { pageHead } from "@/lib/seo";
import { ToolPage } from "@/components/tools/tool-page";

export const Route = createFileRoute("/$tool")({
  beforeLoad: ({ params }) => {
    if (!isToolSlug(params.tool)) throw notFound();
  },
  head: ({ params }) => {
    const tool = getTool(params.tool);
    if (!tool) return { meta: [{ title: "Not found" }] };
    return pageHead({
      title: tool.title,
      description: tool.description,
      path: `/${tool.slug}`,
      keywords: tool.keywords,
    });
  },
  component: ToolRoute,
});

function ToolRoute() {
  const { tool: slug } = Route.useParams();
  const tool = getTool(slug);
  if (!tool) return null;
  return <ToolPage tool={tool} />;
}
