/*jshint esversion: 6 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const uuid = require("uuid-lib");
require('dotenv/config');

const routerDatabase = require('./routes/database.routes.js');
const routerAdmin = require('./routes/admin.routes.js');
const routerProfile = require('./routes/profile.routes.js');
const routerUser = require('./routes/user.routes.js');
const routerConsulta = require('./routes/consulta.routes.js');

const helper = require('./helpers/helper.js');

// database
const userDAO = require("./database/userDAO.js");
const itemDAO = require("./database/itemDAO.js");
const transactionDAO = require("./database/transactionDAO.js");
const commentDAO = require("./database/commentDAO.js");
const imageDAO = require("./database/imageDAO.js");
const adminDAO = require("./database/adminDAO.js");
const passwordForgotDAO = require("./database/passwordFogotDAO.js");
const envioDAO = require("./database/melhorenvioDAO.js");
const refoundDAO = require("./database/refoundDAO.js");
const freteDAO = require("./database/freteDAO.js");
const ownershopDAO = require("./database/ownershopDAO.js")
const procedimentosDAO = require("./database/procedimentosDAO.js")
const funcionariosDAO = require("./database/funcionariosDAO.js")
const funcionariosProcedimentosDAO = require("./database/funcionariosProcedimentosDAO.js")
const agendamentosDAO = require("./database/agendamentosDAO.js")
const routes = require('./routes/profile.routes.js');


// porta do servidor
const port = 3000;

// Controllers
let FreteController = require('./controllers/FreteController.js');

// cria tabela
const users = new userDAO();
const itens = new itemDAO();
const transaction = new transactionDAO();
const comments = new commentDAO();
const images = new imageDAO();
const admins = new adminDAO();
const passwordForgot = new passwordForgotDAO();
const envio = new envioDAO();
const refound = new refoundDAO();
//const frete = new freteDAO();
const ownershop = new ownershopDAO();
const procedimentos = new procedimentosDAO();
const funcionarios = new funcionariosDAO();
const funcionariosProcedimentos = new funcionariosProcedimentosDAO();
const agendamentos = new agendamentosDAO();

users.create();
itens.create();
transaction.create();
refound.create();
comments.create();
images.create();
admins.create();
passwordForgot.create();
envio.create();
//frete.create();
ownershop.create();
procedimentos.create();
funcionarios.create();
funcionariosProcedimentos.create();
agendamentos.create();

// Configuração do express
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: false}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuração da sessão
app.use(session({ secret: 'seu-segredo', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(routes);


// Rotas post
app.post('/carrinho' ,async  (req, res) => {
    const itens = new itemDAO();
    let id = req.body.itemArr;
    let itemList = [];

    try{
        for(let i in id){
            itemList.push(await itens.findId(id[i]));
        };
    }catch(err){
        console.log(err);
    }
    res.send(itemList);
});

app.post('/payment', async(req, res) => {
    //const frete = new freteDAO();
    const itens = new itemDAO();
    let databaseRes = await itens.select();
    const CacheFrete = req.body.frete;
    const cacheItens = req.body.itens;
    let transaction = {
        id: '',
        idUser: '',
        check_ref: uuid.create().toString(),
        price: 0,
        currency: process.env.SUMUP_CURRENCY,
        pay2mail: process.env.SUMUP_EMAIL,
        status: '',
        date: '',
        shipping: []
    }

    let cache = {
        frete: CacheFrete,
        itens: cacheItens
    }

    if(cache.frete != undefined && cache.frete.length > 0){
        data = req.session.freteCon.agencias[0];
        data.forEach(element => {
            if(element.id == parseInt(cache.frete[0].id)){
                transaction.price += parseFloat(element.price);
            }
        });
        cache.itens.forEach(item => {
            databaseRes.forEach(res => {
                if(res.id == item.id){
                    transaction.price += (res.price - (res.price * (res.descount/100))) * item.qtd;
                    transaction.shipping.push({
                        id: res.id,
                        name: res.name,
                        price: (res.price - (res.price * (res.descount/100))),
                        qtd: item.qtd,
                        track_code: '',
                        track_id: '',
                        dimensions:{
                            width: res.width,
                            height: res.height,
                            depth: res.depth,
                            weight: res.weight
                        }
                    });
                }
            });
        });
        sumupReq(transaction, cache, req, res);
    }else{
        req.flash('error', 'Por favor selecione um frete!');
        res.json({err: 'Por favor selecione um frete!'});
    }

    
});

async function sumupReq(trans, cache, req, res){
    const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts',{
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + process.env.SUMUP_KEY,
            "Content-Type": "application/json",
        }, body:JSON.stringify({
            "checkout_reference": trans.check_ref,
            "amount": trans.price,
            "currency": trans.currency,
            "pay_to_email": trans.pay2mail,
            "payment_type": "pix",
            "redirect_url": "https://gautoclinic.com.br/",
            "return_url": "https://gautoclinic.com.br/status"
        })
    });
    if(apiRes.ok){
        let data = await apiRes.json();

        trans.id = data.id;
        trans.idUser = req.user.id;
        trans.check_ref = data.checkout_reference;
        trans.status = data.status;
        trans.date = data.date;
        trans.price = data.amount;

        transaction.insert(trans).then(()=>{
            res.json({ url: trans.check_ref})
        }).catch(err => {
            res.status(500).send('Something broke!')
        });

        if(cache.frete != undefined && cache.frete.length > 0){
            let userShipping = cache.frete[0].id;
            req.session.freteCon.escolha = userShipping;
        }
    }else{
        res.status(500).send('sumup unauthorized')
    }
}

app.post('/make/refund', async(req, res) => {
    const { check_ref } = req.body;
    const refund = new refoundDAO();

    refund.like({check_ref: check_ref}).then( async itens =>{
        let fetchres = await fetch('https://api.sumup.com/v0.1/me/refund/' + itens[0].idrefund,{
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + process.env.SUMUP_KEY,
            }
        });
        if(fetchres.ok){
            res.redirect('/admin/refund');
        }else{
            req.flash('error', 'Erro ao fazer o reembolso');
            res.redirect('/admin/refund');
        }
    });
});

app.post('/calcularFrete', async (req, res) => {
    let {itens, CEP, numero, complemento} = req.body;
    let inStoque = true;
    const item = new itemDAO();
    const melhorEnvio = new envioDAO();
    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token}).then(async ()=>{

        let produtos = '';
        //Verifica se o CEP foi digitado
        if (CEP != '' && CEP != undefined){   
            //Verifica se o CEP existe
            const apiRes = await fetch('https://viacep.com.br/ws/'+CEP+'/json/',{
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if(itens.length > 0){
                for(let i = 0; i < itens.length; i++){
                    await item.findId(itens[i].id).then( data =>{
                        if(itens[i].qtd > data.qtd){
                            inStoque = false;
                        }
                    });
                }
                if(inStoque){
                    if(apiRes.ok){
                        itens.forEach(i => {
                            produtos += "id:" + i.id + ", width: "+ i.width + ", height: " + i.height + ", length: " + i.depth +", weight: " + i.weight + ", insurance_value: "+ i.price+", quantity: " + i.qtd
                        });  
                        const calculoFretes = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate',{
                            method: 'POST',
                            headers: 
                            {
                                "Accept":"application/json",
                                "Content-Type": "application/json",
                                "Authorization": bearerMelhorEnvio,
                                "User-Agent": "Contatar servidorclientesaws@gmail.com",
                            },
                            body:
                            JSON.stringify(
                                {
                                   "from": 
                                    {
                                        "postal_code": process.env.CEP_ENVIO
                                    },
                                    "to": 
                                    {
                                        "postal_code": CEP
                                    },
                                    "products": [{ 
                                        produtos
                                    }],
                                })
                        });
                        if(calculoFretes.ok){
                            let jsonfretes = await calculoFretes.json();
                            jsonfretes = removerPela("error", undefined, jsonfretes);
                            if (jsonfretes.length >0){
                                if (complemento === undefined ||complemento === ''){
                                    complemento = null;
                                }
                            let cepJson = await apiRes.json();
                                let jsoninfo = {
                                    "from": process.env.CEP_ENVIO, 
                                    "to": {
                                            "CEP": CEP, 
                                            "numero": numero, 
                                            "complemento": complemento, 
                                            "adress": cepJson.logradouro, 
                                            "district": cepJson.bairro, 
                                            "city": cepJson.localidade, 
                                            "state_abbr": cepJson.uf, 
                                            "country_id": "BR" 
                                            },
                                    "userShipping": ""
                                    };
                                req.session.freteCon = new FreteController({userId: req.user.id ,agencias: jsonfretes, to: jsoninfo.to, from: jsoninfo.from});
                                //let freteTemp = new FreteController({userId: req.user.id ,agencias: jsonfretes, to: jsoninfo.to, from: jsoninfo.from})
                                //freteCon.push(freteTemp);
                                res.status(200).send('Sucesso');  
                                }else{
                                req.flash('error', 'Não existem opções de frete para este CEP');
                                res.json({err: 'Por favor digite um CEP válido'});
                            }
                        }else{
                            let refreshMelhorEnvio;
                                    await melhorEnvio.buscaRefreshToken().then(tokenAtivo => {  refreshMelhorEnvio = tokenAtivo.refresh_token})
                                    let fetchres = await fetch('https://melhorenvio.com.br/oauth/token',{
                                        method: 'POST',
                                        headers: {
                                            "Content-Type": "routeslication/json",
                                        }, body:JSON.stringify({
                                            "client_id": process.env.MELHORENVIO_CLIENT_ID,
                                            "refresh_token": refreshMelhorEnvio,
                                            "client_secret": process.env.MELHORENVIO_SECRET,
                                            "grant_type": "refresh_token"
                                        })
                                    });
                                    if (fetchres.ok){
                                        let responseRefresh = await fetchres.json();
                                        let d = new Date();
                                        d.setDate(d.getDate() + ((responseRefresh.expires_in)/86400));
                                        responseRefresh.expired_at = d;
                                        await melhorEnvio.alteraRefreshToken(responseRefresh);
                                    }
        
                            req.flash('error', 'MelhorEnvio falhou na busca dos fretes');
                            res.json({err: 'Por favor digite um CEP válido'});
                        }
                    }else{
                        req.flash('error', 'Por favor digite um CEP válido');
                        res.json({err: 'Por favor digite um CEP válido'});
                    }
                }else{
                    req.flash('error', 'Quantidade de itens no estoque insuficiente');
                    res.json({err: 'Quantidade de itens no estoque insuficiente'});
                }
            }
    
        }else{
            req.flash('error', 'Por favor digite um CEP válido');
            res.json({err: 'Por favor digite um CEP válido'});
        }   
    }).catch(err => {
        req.flash('error', 'Erro ao buscar o token, contate o administrador');
        res.redirect('/');
    });

})

function removerPela(chave, valor, json){
    json = json.filter(function(jsonObject) {
        return jsonObject[chave] === valor;
    });
    return json
}

// Rotas get

app.get('/', (req, res) =>{
    const errorMessage = req.flash('error');
    res.render('home', {itens: itens, user: req.user, error: errorMessage  });
});

app.get('/produtos/:sec', (req, res) =>{
    const errorMessage = req.flash('error');
    const itens = new itemDAO();

    itens.findType(req.params.sec).then( itens =>{
            res.render('produtos', {itens: itens, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/item/:id', (req, res) =>{
    const errorMessage = req.flash('error');
    const itens = new itemDAO();

    let rates = 0;

    itens.getItem(req.params.id).then( data =>{
        if(data.comments.length != 0){
            data.comments.forEach(element => {
                rates+= element.rate;
            })
            itens.newRate({mRate: (rates/(data.comments.length)), id: req.params.id});
        }
            res.render('item', {item: data, user: req.user, image: data.images, error: errorMessage});
    })
});

app.get('/carrinho', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const itens = new itemDAO();

    itens.findId(req.params.id).then( itens =>{
        res.render('carrinho', {itens: itens, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});


app.get('/info', (req, res)=>{
    const errorMessage = req.flash('error');
    res.render('info', {user: req.user, error: errorMessage});
});

app.get('/payment/:id', (req, res)=>{
    const errorMessage = req.flash('error');
    const transaction = new transactionDAO();
    transaction.findId(req.params.id).then( data =>{
        res.render('payment', {data: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.post('/status', async (req, res)=>{
    const transactions = new transactionDAO();
    const itens = new itemDAO();
    const { id, status, event_type } = req.body;

    //não coloquei para atualizar direto pq a chance de alguem mal intencionado fazer um post para atualizar o status
    //ai preferi vereficar com eles denovo de foi paga ou não

    //se a requisição for de sucesso e for de mudança de status
    if(status == 'SUCCESSFUL' && event_type == 'CHECKOUT_STATUS_CHANGED'){
        try{
            //vai verificar com a pripria sumup se ela foi realmente paga
            const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + id,{
                method: 'GET',
                headers: 
                {
                    'Authorization': 'Bearer ' + process.env.SUMUP_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if(apiRes.ok){
                let temp = await apiRes.json();

                //se a resposta da api for diferente de pendente
                if(temp.status != 'PENDING'){
                    
                    try{
                        let products = [];
                        let volumes = [];
                        let itens;
                        let company;

                        //atualiza o banco de dados
                        await transactions.update(temp);
                        //se foi paga coloca dentro do carrinho do melhor envio;
                        if(temp.status == 'PAID'){
                            const ownershop = new ownershopDAO();
                            let tableOwner = await ownershop.buscaOwner();
                            let tableUsuario = await transactions.buscaUsuarioFreteTransaction(temp.checkout_reference);

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
                                itens.AtualizarQtd({id: e.id, qtd: e.qtd})
                            })

                            itens = {
                                products: products,
                                volumes: volumes
                            }

                            //tableUsuario.fretes.forEach((e)=>{
                            //    if(e.id == tableUsuario.info.userShipping){
                            //        company = e.name;
                            //    }
                            //})
                            let freteSession = req.session.freteCon;
                            let agencias = freteSession.agencias[0];
                            let escolha = freteSession.escolha;
                            company = agencias.map((x) => {
                                if(x.id == escolha){
                                    return x.name;
                                }
                            }).filter((word) => word != undefined);

                            if(company[0] == 'SEDEX'){
                                for(let i = 0; i < itens.products.length; i++){
                                    let Ptemp = {
                                        products: [products[i]],
                                        volumes: [volumes[i]]
                                    }
                                    helper.add2cart(tableUsuario, tableOwner, Ptemp).then((res)=>{
                                        //comparar se o nome do tableUsuario.shipping.name é igual ao res.products.name, se forem iguais
                                        //colocar o res.id no tableUsuario.shipping.track_id
                                        tableUsuario.shipping.forEach((e)=>{
                                            if(e.name == res.products[0].name){
                                                e.track_id = res.id;
                                            }
                                        })
                                    })
                                }
                                transactions.updateShipping({shipping: tableUsuario.shipping, check_ref: temp.checkout_reference})
                            }else{
                                helper.add2cart(tableUsuario, tableOwner, itens).then((res)=>{
                                    //comparar se o nome do tableUsuario.shipping.name é igual ao res.products.name, se forem iguais
                                    //colocar o res.id no tableUsuario.shipping.track_id
                                    //sendo que aqui vem todos os itens de uma vez no res
                                    tableUsuario.shipping.forEach((e)=>{
                                        res.products.forEach((r)=>{
                                            if(e.name == r.name){
                                                e.track_id = r.id;
                                            }
                                        })
                                    })
                                    //console.log({shipping: tableUsuario.shipping, check_ref: temp.checkout_reference, type: 'other'});
                                    transactions.updateShipping({shipping: tableUsuario.shipping, check_ref: temp.checkout_reference});

                                })
                            }
                        }
                    }catch(err){
                        console.log(err);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    }

    res.send('ok');
});

app.get('/search', (req, res) =>{
    const itens = new itemDAO();
    const errorMessage = req.flash('error');

    itens.search(req.query.e).then( data =>{
        res.render('search', {itens: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/fretes', helper.ensureAuthenticated, (req, res) => {
    const frete = new freteDAO();
    const errorMessage = req.flash('error');
    //console.log(freteCon);
    //let freteJson = freteCon.getAgencias()[0];
    //console.log(req.session.freteCon)
    let freteJson = req.session.freteCon;

    res.render('fretes', { user: req.user, fretes: freteJson.agencias[0], error: errorMessage});
});

app.get('/marcar', helper.ensureAuthenticated, async (req, res) => {
    const procedimentos = new procedimentosDAO();
    const funcionarios = new funcionariosDAO();
    const agendamentos = new agendamentosDAO();  
    const errorMessage = req.flash('error');
    let func,proc,agend;
    
    try{
        func = await funcionarios.select();
        proc = await procedimentos.select();
        agend = await agendamentos.selecionaAgendamentos();
    }catch(err){
        console.log(err);
    }finally{
        //console.log(req.user.forms)
        if(req.user.forms === null){
            req.user.forms = {
                "historico": {
                        "antecedentesCirurgicos": {"valor": false,"nome": "Antecedentes cirúrgicos ?"},
                        "tratamentosEsteticosAnteriores": {"valor": false,"nome": "Tratamentos estéticos anteriores ?"},
                        "antecedentesAlergicos": {"valor": false,"nome": "Antecedentes alérgicos ?"},
                        "funcionamentoRegularIntestino": {"valor": false,"nome": "Funcionamento regular do intestino ?"},
                        "praticaAtividadeFisica": {"valor": false,"nome": "Já pratica alguma atividade física ?"},
                        "usoDrogasLicitas": {"valor": false,"nome": "Faz uso de drogas lícitas ?"},
                        "alimentacaoBalanceada": {"valor": false,"nome": "Possui uma alimentação balanceada ?"},
                        "ingereLiquidosFrequencia": {"valor": false,"nome": "Ingere líquidos com frequência ?"},
                        "gestante": {"valor": false,"nome": "É gestante ?"},
                        "condicaoOrtopedica": {"valor": false,"nome": "Tem alguma condição ortopédica ?"},
                        "tratamentoMedico": {"valor": false,"nome": "faz algum tratamento médico ?"},
                        "portadorMarcapasso": {"valor": false,"nome": "Portador(a) de marcapasso ?"},
                        "usoRoacutan": {"valor": false,"nome": "Ja fez o uso de ROACUTAN ?"},
                        "sensibilidadeDor": {"valor": false,"nome": "Possui alguma sensibilidade a dor ?"},
                        "pressaoAlta": {"valor": false,"nome": "Possui pressão alta ?"},
                        "problemasCoracao": {"valor": false,"nome": "Possui problemas no coração ?"},
                        "diabetesGrau": {"valor": false,"nome": "Diabetes? Qual grau ?", "grau": ""},
                        "menstruada": {"valor": false,"nome": "Menstruada ?"},
                        "usoMedicamentoDiario": {"valor": false,"nome": "Faz o uso de algum medicamento diário ?"},
                        "herpesLabial": {"valor": false,"nome": "Possui HERPES LABIAL ?"},
                        "outraPatologia": {"valor": false,"nome": "Possui alguma outra patalogia não citada aqui ?", "value": ''}
                },
                "firstTime": true
            }
        }
        res.render('marcar', { procedimentos: proc, funcionarios: func, agendamentos: JSON.stringify(agend), user: req.user, error: errorMessage});
    }
});

app.get('/politica/envio',(req, res) => {
    const errorMessage = req.flash('error');
    res.render('sendPolitics', {user: req.user, error: errorMessage});
});

app.get('/politica/reembolso',(req, res) => {
    const errorMessage = req.flash('error');
    res.render('refundPolitics', {user: req.user, error: errorMessage});
});

app.use('/database/', routerDatabase);

app.use('/admin/', routerAdmin);

app.use('/profile/', routerProfile);

app.use('/user/', routerUser);

app.use('/consulta/', routerConsulta);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});