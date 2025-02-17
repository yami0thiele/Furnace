import { readdir } from "fs/promises";
import matter from "gray-matter";

export const Timeline = async () => {
  const pages = await readdir("./pages/blogs", { withFileTypes: true });
  const sortedPages = (
    await Promise.all(
      pages
        .filter((page) => page.isFile())
        .filter((page) => page.name.endsWith(".md"))
        .map(async (page) => ({
          page: page,
          matter: matter(
            await Bun.file(`${page.parentPath}/${page.name}`).text(),
          ),
        })),
    )
  ).sort(
    (a, b) =>
      new Date(b.matter.data.date).getTime() -
      new Date(a.matter.data.date).getTime(),
  );

  return `
    <ul>
      ${sortedPages
        .map((page) => {
          return `
          <li>
            <a href="/blogs/${page.page.name.replace(".md", "")}"><span class="date"> ${page.matter.data.date} </span> <span class="title"> ${page.matter.data.title} </span></a>
          </li>
        `;
        })
        .join("")}
    </ul>
  `;
};
