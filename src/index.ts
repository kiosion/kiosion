import GenerateClass from './generate.ts';

const Generate = new GenerateClass();
await Generate.init();

const cwd = Deno.cwd();
if (cwd.includes('src')) {
  Deno.chdir('../');
}

const template = await Deno.readTextFile('./src/template.md');

const readme = Generate.fillTemplate(template);

if (!readme || readme === ' ') {
  throw new Error('Failed to regenerate readme');
}

await Deno.writeTextFile('./readme.md', readme);
