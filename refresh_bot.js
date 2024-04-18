const transactionDAO = require('./database/transactionDAO.js');
const melhorenvioDAO = require('./database/melhorenvioDAO.js')

require('dotenv/config');
const transactions = new transactionDAO();

    async function refreshTransactions() {
        let res = await transactions.select()
        let temp;

        res.forEach(async (trans) => {
            console.log(trans.check_ref)
            if(trans.status == 'PENDING'){
                const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + trans.id,{
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + process.env.sumup_key,
                        'Content-Type': 'application/json'
                    }
                });
                temp = await apiRes.json();
                if(temp.status != 'PENDING'){
                    transactions.update(temp).then( async() =>{
                        const melhorEnvio = new melhorenvioDAO();
                        let bearerMelhorEnvio = 'Bearer ';
                        melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

                        await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/cart',{
                            method: 'POST',
                            headers: 
                            {
                                "Accept":"application/json",
                                "Content-Type": "application/json",
                                "Authorization": bearerMelhorEnvio,
                                "User-Agent": "Aplicação (email para contato técnico)",
                            },body:
                            JSON.stringify(
                            {
                                "service": 0,//Id transportadora
                                "agency": 0,//Nao necessario
                                "from": {
                                    "name": "string",
                                    "phone": "string",
                                    "email": "string",
                                    "document": "string",//CPF
                                    "company_document": "string", //CNPJ
                                    "state_register": "string",// Inscricao estadual Perguntar ao Gauto
                                    "address": "string",//Logradouro Remetente
                                    "complement": "string",// Complemento
                                    "number": "string",//Numero
                                    "district": "string",//Bairro
                                    "city": "string",//Cidade
                                    "country_id": "string",//Pais
                                    "postal_code": "string",//Cep
                                    "state_abbr": "string",//Estado
                                    "note": "string"//Observacao
                                },
                                "to": {
                                    "name": "string",
                                    "phone": "string",
                                    "email": "string",
                                    "document": "string",//CPF
                                    "company_document": "string", //CNPJ
                                    "state_register": "string",// Inscricao estadual Perguntar ao Gauto
                                    "address": "string",//Logradouro Destinatario
                                    "complement": "string",// Complemento
                                    "number": "string",//Numero
                                    "district": "string",//Bairro
                                    "city": "string",//Cidade
                                    "country_id": "string",//Pais
                                    "postal_code": "string",//Cep
                                    "state_abbr": "string",//Estado
                                    "note": "string"//Observacao
                                },
                                "products": [
                                    {
                                      "name": "string",//Nome Produto
                                      "quantity": "string",//Quantidade
                                      "unitary_value": "string"//Valor Unitario
                                    }
                                ],
                                "volumes": [
                                    {
                                      "height": 0,//Altura
                                      "width": 0,//Largura
                                      "length": 0,//Comprimento
                                      "weight": 0//Peso
                                    }
                                ],
                                "plataform": "Gauto Clinic",
                                "tags": [
                                    {
                                      "tag": "string",//Transaction
                                      "Url": "string"//url do produto
                                    }
                                ]
                            })
                            
                        });
                    });
            }
        }
    });
}

setInterval(refreshTransactions, 600000); // 10 minutos