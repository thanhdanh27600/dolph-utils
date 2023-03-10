import Handlebars from 'handlebars';
import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import { isProduction } from 'types/constants';
import { log } from 'utils/clg';
import HttpStatusCode from 'utils/statusCode';
import { validateOgSchema } from 'utils/validateMiddleware';
import { z } from 'zod';

const templateHTMLOg = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <style>{{styles}}</style>
  </head>
  <body id="body">
    <main>
      <div class='logo'>
        {{#if logoUrl}}
          <img src="{{logoUrl}}" alt="logo" />
        {{else}}
          <span>clickdi.TOP</span>
        {{/if}}
      </div>
      <div class="title">{{title}}</div>
      <div>
        {{#if tags}}
          <ul class="tags">
          {{#each tags}}
            <li class="tag-item">#{{this}}</li>
          {{/each}}
          </ul>
        {{/if}}
        {{#if path}}
          <p class="path">{{path}}</p>
        {{/if}}
      </div>
    </main>
  </body>
</html>
`;

const templateStylesOg = `
* {
  box-sizing: border-box;
}
:root {
  font-size: 16px;
  font-family: monospace;
}
body {
  padding: 3rem;
  width: 1200px;
  height: 630px;
  overflow: hidden;
  background: #06b6d4;
  {{#if bgUrl}}
  background-image: url({{bgUrl}});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  {{else}}
  color: black;
  {{/if}}
}
main {
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 4px double;
  padding: 2rem;
}
.logo {
  width: fit-content;
  align-self: center;
  height: 3rem;
}
.logo img {
  width: 100%;
  height: 100%;
}
.logo span {
  font-size: 1rem;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  border: 1px dashed;
}
.title {
  font-size: {{fontSize}};
  text-transform: capitalize;
  margin: 0.25rem 0;
  font-weight: bold;
  color: #fff;
  text-shadow: .15em .15em 0 hsl(200 50% 30%);
}
.tags {
  display: flex;
  list-style-type: none;
  padding-left: 0;
  color: #ff00d2;
  font-size: 1.5rem;
}
.tag-item {
  margin-right: 0.5rem;
}
.path {
  color: #6dd6ff;
  font-size: 1.25rem;
}
`;

// Get dynamic font size for title depending on its length
function getFontSize(title = '') {
  if (!title || typeof title !== 'string') return '';
  const titleLength = title.length;
  log(['titleLength', titleLength + '']);
  if (titleLength > 100) return '2.5rem';
  if (titleLength > 80) return '3rem';
  if (titleLength > 60) return '3.5rem';
  if (titleLength > 40) return '4rem';
  if (titleLength > 30) return '4.5rem';
  return '5rem';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    if (req.method !== 'GET') {
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({ errorMessage: 'Method Not Allowed' });
    }
    await validateOgSchema.parseAsync({
      query: req.query,
    });
    // compile templateStyles
    const compiledStyles = Handlebars.compile(templateStylesOg)({
      bgUrl: req.query.bgUrl,
      fontSize: getFontSize(req.query.title as string),
    });

    // compile templateHTML
    const compiledHTML = Handlebars.compile(templateHTMLOg)({
      logoUrl: req.query.logoUrl,
      title: req.query.title,
      tags: req.query.tags,
      path: req.query.path,
      styles: compiledStyles,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disabled-setupid-sandbox', '--disable-gpu'],
      defaultViewport: {
        width: 1200,
        height: 630,
        deviceScaleFactor: 1,
      },
      executablePath: isProduction ? '/usr/bin/chromium-browser' : undefined,
    });
    const page = await browser.newPage();

    // Set the content to our rendered HTML
    await page.setContent(compiledHTML, { waitUntil: 'domcontentloaded' });
    // Wait until all images and fonts have loaded
    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll('img'));
      await Promise.all([
        document.fonts.ready,
        ...selectors.map((img) => {
          // Image has already finished loading, let???s see if it worked
          if (img.complete) {
            // Image loaded and has presence
            if (img.naturalHeight !== 0) return;
            // Image failed, so it has no height
            throw new Error('Image failed to load');
          }
          // Image hasn???t loaded yet, added an event listener to know when it does
          return new Promise((resolve, reject) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', reject);
          });
        }),
      ]);
    });

    const element = await page.$('#body');
    const image = await element?.screenshot({ type: 'jpeg' });
    await browser.close();
    //  image as response, or debug with compiledHTML

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': `immutable, no-transform, s-max-age=2592000, max-age=2592000`,
    });
    res.end(image);
    // res.status(200).send(compiledHTML);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.issues);
    }
    res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ errorMessage: (error as any).message || 'Something when wrong.' });
  }
}
