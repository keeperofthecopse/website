import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages } from "../src/content/pages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const site = await readJson("src/data/site.json");
const orders = await readJson("src/data/orders.json");

const generatedPages = [
  ...pages,
  renderOrdersIndex(),
  ...orders.map(renderOrderPage)
];

for (const page of generatedPages) {
  const outputPath = path.join(root, page.path);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderLayout(page), "utf8");
}

console.log(`Built ${generatedPages.length} pages.`);

async function readJson(relativePath) {
  const file = await readFile(path.join(root, relativePath), "utf8");
  return JSON.parse(file);
}

function renderLayout(page) {
  const prefix = relativePrefix(page.path);
  const bodyClass = page.bodyClass ?? "";
  const mainClass = page.mainClass ? ` class="${page.mainClass}"` : "";
  const description = page.description ?? site.description;
  const title = `${page.title} | ${site.name}`;
  const stylesheet = `${prefix}assets/css/styles.css?v=${site.stylesheetVersion}`;

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${stylesheet}">
</head>
<body class="${bodyClass}">
${renderHeader(prefix)}
<main${mainClass}>
${page.content.trim()}
</main>
${renderFooter(prefix)}
</body>
</html>
`;
}

function renderHeader(prefix) {
  const nav = site.nav
    .map((item) => `<a href="${prefix}${item.href}">${item.label}</a>`)
    .join("\n      ");

  return `<header class="site-header topbar">
  <nav class="nav">
    <a class="brand" href="${prefix}index.html">${site.name}</a>
    <div class="nav-links" id="site-navigation">
      ${nav}
    </div>
  </nav>
</header>`;
}

function renderFooter(prefix) {
  const links = site.footerLinks
    .map((item) => `<a href="${prefix}${item.href}">${item.label}</a>`)
    .join("\n      ");

  return `<footer class="footer">
  <div class="footer-inner">
    ${links}
    <p>${site.footerText}</p>
  </div>
</footer>`;
}

function renderOrdersIndex() {
  const orderLinks = orders
    .map((order) => {
      return `    <li><a href="orders/${order.slug}.html">${order.title} <span>→</span></a></li>`;
    })
    .join("\n");

  return {
    path: "pages/orders.html",
    title: "Orders",
    content: `
<section class="hero">
  <h1>Orders of Longspooning</h1>
  <p class="lede">An Order is a gathering of longspooners bound by custom, memory, place, and repeated humiliation.</p>
  <p>The Association does not create Orders. It does not approve them. An Order exists because longspooners gather, compete, preserve local custom, produce champions, survive shame, and are remembered by others.</p>
</section>
<section class="section">
  <p class="quote-line">Any fool may declare an Order. Only champions make one remembered.</p>
  <h2>The Nature of an Order</h2>
  <p>Orders are local by habit and irregular by nature. Some gather often. Some gather only when the weather, drink, grievance, or pride demands it.</p>
  <h2>Types of Order</h2>
  <h3>Active Orders</h3>
  <p>Active Orders continue to gather, compete, submit accounts, or otherwise trouble the Archive.</p>
  <h3>Sleeping Orders</h3>
  <p>A sleeping Order has not gathered in recent memory, but is not considered extinguished.</p>
  <h3>Lost Orders</h3>
  <p>A lost Order is known only through account, fragment, repeated claim, or fireside contradiction.</p>
  <h3>Disputed Orders</h3>
  <p>A disputed Order is one whose existence, legitimacy, conduct, or claimed history is challenged.</p>
  <h2>Recorded Orders</h2>
  <ul class="link-list">
${orderLinks}
  </ul>
</section>`
  };
}

function renderOrderPage(order) {
  const meta = [
    ["Region", order.region],
    ["Status", order.status],
    ["Recognition", order.recognition]
  ]
    .map(([label, value]) => `    <div>${label}: ${value}</div>`)
    .join("\n");

  const sections = order.sections.map(renderOrderSection).join("\n");

  return {
    path: `pages/orders/${order.slug}.html`,
    title: order.title,
    content: `
<section class="hero">
  <h1>${order.title}</h1>
  <div class="meta">
${meta}
  </div>
</section>
<section class="section">
${sections}
</section>`
  };
}

function renderOrderSection(section) {
  const body = section.items
    ? renderList(section.items)
    : section.html;

  return `  <h2>${section.heading}</h2>
  ${body}`;
}

function renderList(items) {
  const listItems = items.map((item) => `    <li>${item}</li>`).join("\n");
  return `<ul>
${listItems}
  </ul>`;
}

function relativePrefix(outputPath) {
  const directory = path.dirname(outputPath);
  if (directory === ".") {
    return "";
  }
  return "../".repeat(directory.split(path.sep).length);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
