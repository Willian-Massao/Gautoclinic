const transactionDAO = require('./database/transactionDAO.js');
const melhorenvioDAO = require('./database/melhorenvioDAO.js')
const userDAO = require('./database/userDAO.js')
const ownershopDAO = require("./database/ownershopDAO.js")

let ownershop = new ownershopDAO();
ownershop.create();

require('dotenv/config');
const transactions = new transactionDAO();

    async function refreshTransactions() 
    {
        let res = await transactions.select()
        let temp;

        res.forEach(async (trans) =>{
            if(trans.status == 'PENDING'){
                const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + trans.id,{
                    method: 'GET',
                    headers: 
                    {
                        'Authorization': 'Bearer ' + process.env.sumup_key,
                        'Content-Type': 'application/json'
                    }
                });
                temp = await apiRes.json();
                //if(true)
                if(temp.status != 'PENDING'){
                    //console.log(temp);
                    try{
                        let products = [];
                        let volumes = [];
                        let itens;
                        let company;

                        await transactions.update(temp);
                        const ownershop = new ownershopDAO();
                        let tableOwner = await ownershop.buscaOwner();
                        let tableUsuario = await transactions.buscaUsuarioFreteTransaction(trans.check_ref);

                        tableUsuario.shipping.forEach((e)=>{
                            products.push({
                                "name": e.name,//Nome Produto
                                "quantity": e.qtd,//Quantidade
                                "unitary_value": e.price//Valor Unitario
                            });
                            volumes.push({
                                "height": e.dimensions.height,//Altura
                                "length": e.dimensions.depth,//Comprimento
                                "width": e.dimensions.width,//Largura
                                "weight": e.dimensions.weight//Peso
                            })//Volume
                        })

                        itens = {
                            products: products,
                            volumes: volumes
                        }

                        tableUsuario.fretes.forEach((e)=>{
                            if(e.id == tableUsuario.info.userShipping){
                                company = e.name;
                            }
                        })

                        if(company == 'SEDEX'){
                            for(let i = 0; i < itens.products.length; i++){
                                let temp = {
                                    products: [products[i]],
                                    volumes: [volumes[i]]
                                }
                                add2cart(tableUsuario, tableOwner, temp).then((res)=>{
                                    console.log(res);
                                })
                            }
                        }else{
                            add2cart(tableUsuario, tableOwner, itens).then((res)=>{
                                console.log(res);
                            })
                        }
                    }catch(err){
                        console.log(err);
                    }
                }
            }
        });
    }
refreshTransactions();
//setnterval(refreshTransactions, 20000); // 10 minutos

async function add2cart(usuario, owner, itens){
    const melhorEnvio = new melhorenvioDAO();
    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    console.log(owner);

    const apiRes = await fetch('https://melhorenvio.com.br/api/v2/me/cart',
    {
        method: 'POST',
        headers: 
        {
            "Accept":"application/json",
            "Content-Type": "application/json",
            "Authorization": bearerMelhorEnvio,
            "User-Agent": "Contatar servidorclientesaws@gmail.com",
        },
        body:JSON.stringify
        ({
            // tableUsuario.shipping.id é o id do item, não da transportadora
            // na criação do frete adicionei um campo vazio para o id da transportadora (userShipping)
            // quando o usuário seleciona a transportadora, e gera as informações para mandar pra sumup
            // eu pego o id da transportadora e coloco no campo userShipping
            "service": usuario.info.userShipping,//Id transportadora
            "from": 
            {
                "name": owner.nome_completo,
                "phone": owner.phone,
                "email": owner.email,
                "company_document": "89794131000100",//owner.companydocument, //CNPJ
                "state_register": owner.stateRegister,// Inscricao estadual Perguntar ao Gauto
                "address": owner.adress,//Logradouro Remetente
                "complement": owner.complement,// Complemento
                "number": owner.number,//Numero
                "district": owner.district,//Bairro
                "city": owner.city,//Cidade
                "country_id": owner.countryId,//Pais
                "postal_code": "03532040",//owner.postalCode,//Cep
                "state_abbr": "SP",//owner.stateAbbr,//Estado
                "note": "observação",//Observacao
            },
            "to": 
            {
                "name": usuario.nome_completo,
                "phone": usuario.tel,
                "email": usuario.email,
                "document": usuario.cpf,//CPF
                "address": usuario.info.to.adress,//Logradouro Destinatario
                "complement":  "teste",//usuario.info.to.complemento,// Complemento
                "number": usuario.info.to.numero,//Numero
                "district": usuario.info.to.district,//Bairro
                "city": usuario.info.to.city,//Cidade
                "country_id": usuario.info.to.country_id,//Pais
                "postal_code": usuario.info.to.CEP,//Cep
                "state_abbr": usuario.info.to.state_abbr,//Estado
                "note": "observação"//Observacao
            },
            // os produtos precisa estar no array, por que estamos passando todos os produtos que o frete calculou
            // então voltei com Shipping = []
            "products": itens.products, //passei os produtos para o array na linha 47
            "volumes": itens.volumes, //tambem fiz para os volumes
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
    const resp = await apiRes.json();
    return resp;
}