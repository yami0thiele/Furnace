import { exists, mkdir, copyFile, readFile, readdir } from "fs/promises";
import matter from "gray-matter";
import { marked } from "marked";

// assetsの中身 を public にコピー
const assets = await readdir("./assets", {
  recursive: true,
  withFileTypes: true,
});
for (const asset of assets) {
  const path = asset.parentPath.replace(/^assets/, "public");
  if (asset.isDirectory()) {
    !exists(path) && (await mkdir(path, { recursive: true }));
    continue;
  }
  await copyFile(`${asset.parentPath}/${asset.name}`, `${path}/${asset.name}`);
}

// pages の中身をコンパイル
const files = await readdir("./pages", {
  recursive: true,
  withFileTypes: true,
});

const layouts = files.filter((file) => file.name === "_layout.html");

files
  .filter((file) => file.name.endsWith(".md"))
  .forEach(async (file) => {
    // 一番近い _layout.html を探す。
    // NOTE: pages/blogs-2 のようなディレクトリが存在する場合は検証に失敗する。
    const layout = layouts
      .filter((layout) => file.parentPath.startsWith(layout.parentPath))
      .sort((a, b) => b.parentPath.length - a.parentPath.length)[0];

    // layout を開く。
    const layoutContent = await Bun.file(
      `${layout.parentPath}/${layout.name}`,
    ).text();

    const parsed = matter(
      await Bun.file(`${file.parentPath}/${file.name}`).text(),
    );

    const result = layoutContent
      .replace("{{#Title}}", parsed.data.title)
      .replace("{{#Body}}", await marked(parsed.content));

    console.log(result);

    // ファイルを書き出す。
    const dirPath = file.parentPath.replace(/^pages/, "public");
    !exists(dirPath) && (await mkdir(dirPath, { recursive: true }));
    await Bun.file(`${dirPath}/${file.name}`.replace(".md", ".html")).write(
      result,
    );
  });
