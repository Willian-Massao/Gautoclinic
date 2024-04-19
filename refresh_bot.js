const transactionDAO = require('./database/transactionDAO.js');
const melhorenvioDAO = require('./database/melhorenvioDAO.js')
const userDAO = require('./database/userDAO.js')
const ownershopDAO = require("./database/ownershopDAO.js")

require('dotenv/config');
const transactions = new transactionDAO();

    async function refreshTransactions() 
    {
        let res = await transactions.select()
        let temp;

        res.forEach(
            async (trans) => 
            {
            console.log(trans.check_ref)
            if(trans.status == 'PENDING')
            {
                const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + trans.id,
                {
                    method: 'GET',
                    headers: 
                    {
                        'Authorization': 'Bearer ' + process.env.sumup_key,
                        'Content-Type': 'application/json'
                    }
                });
                temp = await apiRes.json();
                if(temp.status != 'PENDING')
                {
                    transactions.update(temp).then( 
                        async() =>
                        {
                        const melhorEnvio = new melhorenvioDAO();
                        const ownershop = new ownershopDAO();

                        let bearerMelhorEnvio = 'Bearer ';
                        await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});
                        await ownershop.buscaOwner().then
                        ( 
                            async tableOwner =>
                            {
                                await transactions.buscaUsuarioFreteTransaction(trans.check_ref).then
                                ( 
                                    async tableUsuario => 
                                    {
                                        await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/cart',
                                        {
                                            method: 'POST',
                                            headers: 
                                            {
                                                "Accept":"application/json",
                                                "Content-Type": "application/json",
                                                "Authorization": bearerMelhorEnvio,
                                                "User-Agent": "Aplicação (email para contato técnico)",
                                            },
                                            body:JSON.stringify
                                            ({
                                                "service": tableUsuario.shipping.id,//Id transportadora
                                                // "agency": 0,//Nao necessario
                                                "from": 
                                                {
                                                    "name": tableOwner.nome_completo,
                                                    "phone": tableOwner.phone,
                                                    "email": tableOwner.email,
                                                    // "document": "string",//CPF
                                                    "company_document": tableOwner.companydocument, //CNPJ
                                                    "state_register": tableOwner,stateRegister,// Inscricao estadual Perguntar ao Gauto
                                                    "address": tableOwner.adress,//Logradouro Remetente
                                                    "complement": tableOwner.complement,// Complemento
                                                    "number": tableOwner.number,//Numero
                                                    "district": tableOwner.district,//Bairro
                                                    "city": tableOwner.city,//Cidade
                                                    "country_id": tableOwner.countryId,//Pais
                                                    "postal_code": tableOwner.postalCode,//Cep
                                                    "state_abbr": tableOwner.stateAbbr,//Estado
                                                    // "note": "string"//Observacao
                                                },
                                                "to": 
                                                {
                                                    "name": tableUsuario.nome_completo,
                                                    "phone": tableUsuario.tel,
                                                    "email": tableUsuario.email,
                                                    "document": tableUsuario.cpf,//CPF
                                                    // "company_document": "string", //CNPJ
                                                    // "state_register": "string",// Inscricao estadual Perguntar ao Gauto
                                                    "address": tableUsuario.frete.to.adress,//Logradouro Destinatario
                                                    "complement":  tableUsuario.frete.to.complemento,// Complemento
                                                    "number": tableUsuario.frete.to.numero,//Numero
                                                    "district": tableUsuario.frete.to.district,//Bairro
                                                    "city": tableUsuario.frete.to.city,//Cidade
                                                    "country_id": tableUsuario.frete.to.country_id,//Pais
                                                    "postal_code": tableUsuario.frete.to.CEP,//Cep
                                                    "state_abbr": tableUsuario.frete.to.state_abbr,//Estado
                                                    "note": "string"//Observacao
                                                },
                                                "products": 
                                                [
                                                    {
                                                      "name": tableUsuario.shipping.name,//Nome Produto
                                                      "quantity": tableUsuario.shipping.qtd,//Quantidade
                                                      "unitary_value": tableUsuario.shipping.price//Valor Unitario
                                                    }
                                                ],
                                                "volumes": 
                                                [
                                                    {
                                                      "height": tableUsuario.shipping.height,//Altura
                                                      "width": tableUsuario.shipping.width,//Largura
                                                      "length": tableUsuario.shipping.length,//Comprimento
                                                      "weight": tableUsuario.shipping.weight//Peso
                                                    }
                                                ],
                                                "plataform": "Gauto Clinic",
                                                "tags": 
                                                [
                                                    {
                                                      "tag": "string",//Transaction
                                                      "Url": "string"//url do produto
                                                    }
                                                ]
                                            })

                                        });    
                                    }
                                )
                                
                            }
                        ) 
                    });
                }
            }
        });
    }

setInterval(refreshTransactions, 1000); // 10 minutos