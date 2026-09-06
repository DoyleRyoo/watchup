import { readdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
const names=(await readdir('../watch_up_infra/UI')).filter(n=>n.endsWith('.png')).map(n=>n.slice(0,-4))
const run=(args)=>new Promise((resolve,reject)=>{let output='';const p=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>output+=d);p.on('exit',c=>c===0?resolve(output):reject(new Error(output)))})
const results=[]
for(let i=0;i<names.length;i+=3){
 await Promise.all(names.slice(i,i+3).map(async name=>{
   const output=await run(['verification/capture.mjs',`--name=${name}`,'--out=verification/artifacts/current'])
   await run(['verification/compare.mjs',name])
   results.push({name,result:'captured and compared',capture:JSON.parse(output)})
   console.log(name)
 }))
}
await writeFile('verification/artifacts/visual-run.json',JSON.stringify(results,null,2))
