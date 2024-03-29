const fs = require('fs').promises;

async function coisa(file){
    let contents = await fs.readFile(file, {encoding: 'base64'});
    console.log(contents);
    return contents;
}

console.log(coisa('./public/src/5.png'));

