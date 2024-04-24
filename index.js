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
let freteCon;

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
        data = freteCon.getAgencias()[0];
        data.forEach(element => {
            if(element.id == parseInt(cache.frete[0].id)){
                transaction.price += parseFloat(element.price);
            }
        });
        cache.itens.forEach(item => {
            databaseRes.forEach(res => {
                if(res.id == item.id){
                    transaction.price += res.price * item.qtd;
                    transaction.shipping.push({
                        id: res.id,
                        name: res.name,
                        price: res.price,
                        qtd: item.qtd,
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
        req.flash('error', 'Por favor selecione um frete');
        res.json({err: 'Por favor selecione um frete'});
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
            freteCon.setEscolha(userShipping)
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
            req.flash('error', 'erro ao fazer o reembolso');
            res.redirect('/admin/refund');
        }
    });
});

app.post('/calcularFrete', async (req, res) => {
    let {itens, CEP, numero, complemento} = req.body;
    const melhorEnvio = new envioDAO();
    //const fretesDAO = new freteDAO();
    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken()
    .then(bearer => {  bearerMelhorEnvio += bearer.access_token});

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

        if(apiRes.ok){
            //let produtos = "";
            itens.forEach(i => {
                produtos += "id:" + i.id + ", width: "+ i.width + ", height: " + i.height + ", length: " + i.depth +", weight: " + i.weight + ", insurance_value: "+ i.price+", quantity: " + i.qtd
            });  
            const calculoFretes = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',{
                method: 'POST',
                headers: 
                {
                    "Accept":"application/json",
                    "Content-Type": "application/json",
                    "Authorization": bearerMelhorEnvio,
                    "User-Agent": "Aplicação (email para contato técnico)",
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
                    freteCon = new FreteController({agencias: jsonfretes, to: jsoninfo.to, from: jsoninfo.from});
                    //fretesDAO.InsertorUpdate({idUser: req.user.id, fretes: jsonfretes, info: jsoninfo}).then(()=>{
                        //});
                    res.status(200).send('Sucesso');  
                    }else{
                    req.flash('error', 'Não existem opções de frete para este CEP');
                    res.json({err: 'Por favor digite um CEP válido'});;
                }
            }else{
                req.flash('error', 'MelhorEnvio falhou na busca dos fretes');
                res.json({err: 'Por favor digite um CEP válido'});
            }
        }else{
            req.flash('error', 'Por favor digite um CEP válido');
            res.json({err: 'Por favor digite um CEP válido'});
        }
    }else{
        req.flash('error', 'Por favor digite um CEP válido');
        res.json({err: 'Por favor digite um CEP válido'});
    }   
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

app.get('/search', (req, res) =>{
    const itens = new itemDAO();
    const errorMessage = req.flash('error');

    itens.search(req.query.e).then( data =>{
        res.render('search', {itens: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/fretes', helper.ensureAuthenticated, (req, res) => {
    const frete = new freteDAO();
    const errorMessage = req.flash('error');
    let freteJson = freteCon.getAgencias()[0];

    res.render('fretes', { user: req.user, fretes: freteJson, error: errorMessage});
});

routes.get('/agendamentos', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    
    res.render('agendamentos', { user: req.user, error: errorMessage});
});

app.use('/database/', routerDatabase)

app.use('/admin/', routerAdmin)

app.use('/profile/', routerProfile)

app.use('/user/', routerUser)

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});