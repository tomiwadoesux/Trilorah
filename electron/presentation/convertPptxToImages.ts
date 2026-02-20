import { exec } from "child_process";
import path from "path";
import fs from "fs";

export function convertPptxToImages(
  pptxPath: string,
  outputDir: string
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `soffice --headless --convert-to png --outdir "${outputDir}" "${pptxPath}"`;

    exec(command, (error) => {
      if (error) {
        reject(error);
        return;
      }

      // Collect slide images
      const files = fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith(".png"))
        .sort(); // slide1.png, slide2.png…

      const imagePaths = files.map((f) => path.join(outputDir, f));

      resolve(imagePaths);
    });
  });
}
