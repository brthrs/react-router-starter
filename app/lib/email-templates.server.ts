import { readFileSync } from "node:fs";
import { join } from "node:path";
import Handlebars from "handlebars";

const TEMPLATES_DIR = join(process.cwd(), "emails");

const compiledCache = new Map<string, HandlebarsTemplateDelegate>();

function compileTemplate(filePath: string): HandlebarsTemplateDelegate {
  const cached = compiledCache.get(filePath);
  if (cached) return cached;

  const source = readFileSync(filePath, "utf-8");
  const compiled = Handlebars.compile(source);
  compiledCache.set(filePath, compiled);
  return compiled;
}

interface RenderEmailResult {
  html: string;
  text: string;
}

export function renderEmail(
  templateName: string,
  variables: Record<string, string>,
): RenderEmailResult {
  const htmlPath = join(TEMPLATES_DIR, templateName, "html.hbs");
  const textPath = join(TEMPLATES_DIR, templateName, "text.hbs");
  const layoutPath = join(TEMPLATES_DIR, "layouts", "default.html.hbs");

  const htmlTemplate = compileTemplate(htmlPath);
  const textTemplate = compileTemplate(textPath);
  const layoutTemplate = compileTemplate(layoutPath);

  const baseVars = {
    appName: process.env.APP_NAME ?? "My App",
    year: new Date().getFullYear().toString(),
    ...variables,
  };

  const bodyHtml = htmlTemplate(baseVars);
  const html = layoutTemplate({ ...baseVars, body: bodyHtml });
  const text = textTemplate(baseVars);

  return { html, text };
}
