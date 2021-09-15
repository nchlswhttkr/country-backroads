import core from "puppeteer-core";
import chromium from "chrome-aws-lambda";

export default async (req, res) => {
  if (process.env.SECRET && req.headers.secret !== process.env.SECRET) {
    throw new Error("Bad request");
  }
  const browser = await core.launch({
    headless: true,
    args: chromium.args,
    executablePath: await chromium.executablePath,
    defaultViewport: { width: 1800, height: 900 },
  });
  const page = await browser.newPage();
  // prettier-ignore
  await page.setContent(`
    <!DOCTYPE html>
    <body style="padding: 180px 90px; display: flex; margin: 0; align-items: center; justify-content: center;">
        <img style="height: 540px; box-shadow: 12px 12px 8px #ccc; margin-right: 120px; display: inline" src="data:image/png;base64,${req.body.artwork}" alt="No image" />
        <p style="font-size: 48px; display: inline; width: auto;">
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
