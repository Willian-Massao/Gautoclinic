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
                                        let products = [];
                                        let volumes = [];

                                        tableUsuario.shipping.forEach((e)=>{
                                            products.push({
                                                "name": e.name,//Nome Produto
                                                "quantity": e.qtd,//Quantidade
                                                "unitary_value": e.price//Valor Unitario
                                            });
                                            volumes.push(e.dimensions)//Volume
                                        })
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
                                                // tableUsuario.shipping.id é o id do item, não da transportadora
                                                // na criação do frete adicionei um campo vazio para o id da transportadora (userShipping)
                                                // quando o usuário seleciona a transportadora, e gera as informações para mandar pra sumup
                                                // eu pego o id da transportadora e coloco no campo userShipping
                                                "service": tableUsuario.info.userShipping,//Id transportadora
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
                                                // os produtos precisa estar no array, por que estamos passando todos os produtos que o frete calculou
                                                // então voltei com Shipping = []
                                                "products": products, //passei os produtos para o array na linha 47
                                                "volumes": volumes, //tambem fiz para os volumes
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