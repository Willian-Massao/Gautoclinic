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
const userDAO = require("./database/UserDAO.js");
const itemDAO = require("./database/itemDAO.js");
const transactionDAO = require("./database/transactionDAO.js");
const commentDAO = require("./database/commentDAO.js");
const imageDAO = require("./database/imageDAO.js");
const adminDAO = require("./database/adminDAO.js");
const passwordForgotDAO = require("./database/passwordFogotDAO.js");
const envioDAO = require("./database/melhorenvioDAO.js");
const refoundDAO = require("./database/refoundDAO.js");
const routes = require('./routes/profile.routes.js');

// porta do servidor
const port = 3000;

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

itens.create();
users.create();
transaction.create();
refound.create();
comments.create();
images.create();
admins.create();
passwordForgot.create();
envio.create();

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
    const transaction = new transactionDAO();
    const itens = new itemDAO();
    let databaseRes = await itens.select();
    const cacheItens = req.body.itens;

    let id;
    let idUser;
    let check_ref = uuid.create().toString();
    let price = 0;
    let currency = process.env.SUMUP_CURRENCY;
    let pay2mail = process.env.SUMUP_EMAIL;
    let status = '';
    let date = '';

    cacheItens.forEach(item => {
        databaseRes.forEach(res => {
            if(res.id == item.id){
                price += res.price * item.qtd;
            }
        });
    });

    const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts',{
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + process.env.SUMUP_KEY,
            "Content-Type": "application/json",
        }, body:JSON.stringify({
            "checkout_reference": check_ref,
            "amount": price,
            "currency": currency,
            "pay_to_email": pay2mail,
        })
    });
    
    if(apiRes.ok){
        let data = await apiRes.json();

        id = data.id;
        idUser = req.user.id;
        check_ref = data.checkout_reference;
        status = data.status;
        date = data.date;
        price = data.amount;

        transaction.insert({id, idUser, check_ref, price, currency, pay2mail, status, date}).then(()=>{
            res.json({ url: check_ref})
        }).catch(err => {
                res.status(500).send('Something broke!')
        });
    }else{
        res.status(500).send('sumup unauthorized')
    }

});

app.post('/make/refund', async(req, res) => {
    const { check_ref } = req.body;
    const refund = new refoundDAO();

    refund.like({check_ref: check_ref}).then( async itens =>{
        console.log('https://api.sumup.com/v0.1/me/refund/' + itens[0].idrefund);
        let fetchres = await fetch('https://api.sumup.com/v0.1/me/refund/' + itens[0].idrefund,{
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + process.env.SUMUP_KEY,
            }
        });
        console.log(await fetchres.json());
        if(fetchres.ok){
            res.redirect('/admin/refund');
        }else{
            req.flash('error', 'erro ao fazer o reembolso');
            res.redirect('/admin/refund');
        }
    });
});

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
        console.log(data);
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

app.use('/database/', routerDatabase)

app.use('/admin/', routerAdmin)

app.use('/profile/', routerProfile)

app.use('/user/', routerUser)

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});