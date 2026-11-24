// Copy only the files used by the website; keep the original asset collection untouched.
import { readFileSync, mkdirSync, copyFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'outputs/site');
if (existsSync(output)) throw new Error('outputs/site already exists. Use a new output folder or review it before replacing it.');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'script.js'), 'utf8');
// These declarations contain only the local site's content configuration, before any DOM code.
const { TASKS, EVALUATIONS, ROLLOUTS, GENERATED_DATA, APPEARANCE_KEYS } = vm.runInNewContext(script.slice(0, script.indexOf('const $ =')) + '; ({TASKS,EVALUATIONS,ROLLOUTS,GENERATED_DATA,APPEARANCE_KEYS})', Object.create(null), {timeout:1000});
const files = new Set(['index.html','styles.css','script.js','favicon.svg','.nojekyll']);
for (const match of html.matchAll(/(?:src|poster|data-src|data-image|href)="([^"#]+)"/g)) {
  if (!/^(?:https?:|data:)/.test(match[1])) files.add(match[1]);
}
for (const task of Object.keys(TASKS)) {
  files.add(`assets/web/demo-${task}.mp4`);
  files.add(`assets/posters/demo-${task}.jpg`);
  for (const scene of ROLLOUTS[task]) {
    files.add(`assets/web/rollout-${task}-${scene.id}.mp4`);
    files.add(`assets/posters/rollout-${task}-${scene.id}.jpg`);
  }
}
for (const [task, appearance, folder] of GENERATED_DATA) {
  files.add(`assets/roboexpand-generated-datasets-cases/${folder}/generated_three_views.mp4`);
  files.add(`assets/posters/dataset-${task}-${APPEARANCE_KEYS[appearance]}-generated_three_views.jpg`);
}
for (const [mode, evaluation] of Object.entries(EVALUATIONS)) {
  for (const item of evaluation.cases) {
    files.add(`assets/${evaluation.folder}/${item.file}`);
    files.add(`assets/posters/${mode}-${item.id}.jpg`);
  }
}
let bytes = 0;
// Verify everything before writing a partial package.
for (const file of files) {
  const source = resolve(root,file);
  if (!source.startsWith(resolve(root)+sep)) throw new Error(`Outside repository: ${file}`);
  const stat = statSync(source);
  if (!stat.isFile() || (!stat.size && file !== '.nojekyll')) throw new Error(`Missing or empty file: ${file}`);
  bytes += stat.size;
}
for (const file of files) {
  const target = resolve(output,file);
  mkdirSync(dirname(target), {recursive:true});
  copyFileSync(resolve(root,file),target);
}
const manifest = { files:[...files].sort(), fileCount:files.size, bytes };
writeFileSync(resolve(root,'outputs/site-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${relative(root,output)}: ${files.size} files, ${(bytes/1e6).toFixed(1)} MB`);
