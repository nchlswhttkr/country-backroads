import core from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import got from "got";

export default async (req, res) => {
  // Reject request without a secret if one is set
  if (process.env.SECRET && req.headers.secret !== process.env.SECRET) {
    throw new Error("Bad request");
  }

  // Fetch fonts, prepare browser
  const [interRegular, interBold, interItalic] = await Promise.all([
    got(
      "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.woff2"
    )
      .buffer()
      .then((buffer) => buffer.toString("base64")),
    got(
      "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.woff2"
    )
      .buffer()
      .then((buffer) => buffer.toString("base64")),
    got(
      "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Italic.woff2"
    )
      .buffer()
      .then((buffer) => buffer.toString("base64")),
  ]);
  const browser = await core.launch({
    headless: true,
    args: chromium.args,
    executablePath: await chromium.executablePath,
    defaultViewport: { width: 1800, height: 700 },
  });
  const page = await browser.newPage();

  // Generate page and capture screenshot
  // prettier-ignore
  await page.setContent(`
    <!DOCTYPE html>
    <head>
        <style>
            @font-face {
                font-family: "Inter";
                font-style: normal;
                font-weight: normal;
                src: url(data:font/woff2;charset=utf-8;base64,${interRegular.toString('base64')}) format('woff2')
            }
            @font-face {
                font-family: "Inter";
                font-style: normal;
                font-weight: bold;
                src: url(data:font/woff2;charset=utf-8;base64,${interBold.toString('base64')}) format('woff2')
            }
            @font-face {
                font-family: "Inter";
                font-style: italic;
                font-weight: normal;
                src: url(data:font/woff2;charset=utf-8;base64,${interItalic.toString('base64')}) format('woff2')
            }

            body {
              padding: 80px 120px;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            img {
              height: 540px;
              width: 540px;
              box-shadow: 0 6px 16px #ccc;
              margin-right: 80px;
              color: #fff;
            }

            p {
              font: 48px 'Inter';
            }
        </style>
    </head>
    <body>
        <img src="data:image/png;base64,${req.body.artwork}" alt="" />
        <p>
            <strong>${req.body.title}</strong>
            <br/>
            <br/>
            ${req.body.artist}
            <br/>
            <br/>
            <em>${req.body.album}</em>
        </p>
    </body>
    `);
  const buffer = await page.screenshot({ type: "png" });
  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
};
