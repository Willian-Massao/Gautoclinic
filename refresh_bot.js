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
                    // transactions.update(temp).then( 
                    //     async() =>
                    //     {
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

                                        const apiRes = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/cart',
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
                                                "from": 
                                                {
                                                    "name": tableOwner.nome_completo,
                                                    "phone": tableOwner.phone,
                                                    "email": tableOwner.email,
                                                    "company_document": "89794131000100",//tableOwner.companydocument, //CNPJ
                                                    "state_register": tableOwner.stateRegister,// Inscricao estadual Perguntar ao Gauto
                                                    "address": tableOwner.adress,//Logradouro Remetente
                                                    "complement": tableOwner.complement,// Complemento
                                                    "number": tableOwner.number,//Numero
                                                    "district": tableOwner.district,//Bairro
                                                    "city": tableOwner.city,//Cidade
                                                    "country_id": tableOwner.countryId,//Pais
                                                    "postal_code": "03532040",//tableOwner.postalCode,//Cep
                                                    "state_abbr": "SP",//tableOwner.stateAbbr,//Estado
                                                    "note": "observação",//Observacao
                                                },
                                                "to": 
                                                {
                                                    "name": tableUsuario.nome_completo,
                                                    "phone": tableUsuario.tel,
                                                    "email": tableUsuario.email,
                                                    "document": tableUsuario.cpf,//CPF
                                                    "address": tableUsuario.info.to.adress,//Logradouro Destinatario
                                                    "complement":  "teste",//tableUsuario.info.to.complemento,// Complemento
                                                    "number": tableUsuario.info.to.numero,//Numero
                                                    "district": tableUsuario.info.to.district,//Bairro
                                                    "city": tableUsuario.info.to.city,//Cidade
                                                    "country_id": tableUsuario.info.to.country_id,//Pais
                                                    "postal_code": tableUsuario.info.to.CEP,//Cep
                                                    "state_abbr": tableUsuario.info.to.state_abbr,//Estado
                                                    "note": "observação"//Observacao
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
                                                      "height": tableUsuario.shipping.dimensions.height,//Altura
                                                      "width": tableUsuario.shipping.dimensions.width,//Largura
                                                      "length": tableUsuario.shipping.dimensions.depth,//Comprimento
                                                      "weight": tableUsuario.shipping.dimensions.weight//Peso
                                                    }
                                                ],
                                                "plataform": "Gauto Clinic",
                                                "options": {
                                                    "insurance_value": 11.78,
                                                    "receipt": false,
                                                    "own_hand": false,
                                                    "reverse": false,
                                                    "non_commercial": false,
                                                    "invoice": {
                                                        "key": "31190307586261000184550010000092481404848162"
                                                    },
                                                    "platform": "Nome da Plataforma",
                                                    "tags": [
                                                        {
                                                            "tag": "Identificação do pedido na plataforma, exemplo: 1000007",
                                                            "url": "Link direto para o pedido na plataforma, se possível, caso contrário pode ser passado o valor null"
                                                        }
                                                    ]
                                                }
                                            })

                                        }); 
                                        console.log(apiRes);
                                        const resp = await apiRes.json();
                                        console.log(resp);
                                    }
                                )
                                
                            }
                        ) 
                    // });
                }
            }
        });
    }
refreshTransactions();
//setnterval(refreshTransactions, 20000); // 10 minutos