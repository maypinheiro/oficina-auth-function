import archiver from "archiver";
import { createWriteStream, mkdirSync } from "node:fs";

mkdirSync("artifact", { recursive: true });
const output = createWriteStream("artifact/oficina-auth.zip");
const archive = archiver("zip", { zlib: { level: 9 } });
archive.pipe(output);
archive.directory("dist", "dist");
archive.directory("node_modules", "node_modules");
archive.file("package.json", { name: "package.json" });
await archive.finalize();
