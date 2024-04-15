const token = require('./database/melhorenvioDAO');


async function teste(){
    let envio = new token();

    let res = await envio.buscaToken();
    console.log(res);
}

teste();