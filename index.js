/*jshint esversion: 6 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const multer = require('multer');
const uuid = require("uuid-lib");
const crypto = require('crypto').webcrypto;
require('dotenv/config');

const User = require('./controllers/UserController.js');
const Envio = require('./controllers/EnvioController.js');

const routerDatabase = require('./routes/database.routes.js');
const routerAdmin = require('./routes/admin.routes.js');
const routerProfile = require('./routes/profile.routes.js');

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

itens.create();
users.create();
transaction.create();
comments.create();
images.create();
admins.create();
passwordForgot.create();
envio.create();

let id;
let controllerUser
let controllerEnvio

// Autenticação
passport.use(new LocalStrategy({
    usernameField: 'email', // nome do campo de email no formulário de login
    passwordField: 'password' // nome do campo de senha no formulário de login
}, (email, password, done) => {
    // Verifica se o email do usuário existe no banco de dados
    const users = new userDAO();
    users.findEmail(email)
    .then(user => {
        controllerUser = new User(user);
        if (!user) {
            console.log('Email ou senha incorretos.');
            return done(null, false, { message: 'Email ou senha incorretos.' });
        }
        // Verifica se a senha fornecida está correta
        bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
            return done(err);
        }
        if (!result) {
            console.log('Senha incorreta.');
            return done(null, false, { message: 'Email ou senha incorretos.' });
        }
          return done(null, user);
        });
    })
    .catch(err => done(err));
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    users.findId(user.id).then(user => {
        user.hasAdmin = controllerUser.hasAdmin;
        done(null, user);
    }).catch(err => done(err));
});

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
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true  }));

app.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

app.post('/esqueceuSenha', function(req,res){
    const {email} = req.body;
    let randomNumber;
    let assunto= 'Redefinição de senha GautoClinic';
    let html;
    let text;
    let date = new Date();
    let datetime = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
    let userEmail
    // Verifica se o email do usuário existe no banco de dados
    const users = new userDAO();
    let id;
        users.findEmail(email)
        .then(user => {        
            if (user) {
                controllerUser = new User(user);
                randomNumber = helper.numeroAleatorioRange(100000,999999)
                html = `<style>#container {width: calc(100% - 30px);background-color: #f3f4f8;}h1 {color: #000;}#img-container{width: 10%;}p{color: #6b688a;font-weight: 400;}img{flex-shrink:  0;-webkit-flex-shrink: 0;max-width:  100%;max-height:  100%;}#code{height: 50px;width: 100%;background-color: #f3f4f8;border-radius: 5px;display: flex;justify-content: center;align-items: center;}#border{background-color: white;display: flex;justify-content: center;flex-direction: column;font-family: 'Trebuchet MS', sans-serif;padding: 30px;margin: 25px;border-radius: 5px;}</style><script>function copy() {var copyText = document.querySelector("p");navigator.clipboard.writeText(copyText.innerText);}</script><div id="container"><div id="border"><h1>Seu código</h1><p>Por favor, insira o código de verificação na página de redefinição de senha. Esse código foi enviado para o seu e-mail registrado. Após inserir o código,vocêpoderácriar uma nova senha.</p><div id="code"><h3>${randomNumber}</h3></div><p>Se você não solicitou a alteração da senha, entre em contato conosco imediatamente. Sua segurança é nossa prioridade.</p></div></div>`
                text = 'Número de verificação: '+randomNumber;
                id = controllerUser.id
                userEmail = controllerUser.email
                passwordForgot.insertOrUpdate({id,userEmail,randomNumber, datetime})
                helper.sendEmail(email,assunto,html,text);
            }else{// por tudo que é mais sagrado, não abra a chave acima
                throw Error
            }
        })
        .catch(err => {
        req.flash('error', 'Email não encontrado');
        res.redirect('/register');
    });
})

app.post('/confirmarCodigo',function(req,res){
    const {codigo} = req.body;
    let date = new Date();
    let tipoErro;
    passwordForgot.findUser(controllerUser.id)  
    .then(passwordForgot =>{
        if( passwordForgot['dateTimeExpirationCod'] > date) {
                if (passwordForgot['authVerificationCod'] == codigo){
                    res.redirect('/alterarSenha');
                }else{
                    tipoErro = 1;
                    throw new Error()
                }
        }else{
            tipoErro = 2;
            throw Error()
        }
        
    }).catch(err => {
        if (tipoErro === 1){
            req.flash('error', 'Código Incorreto');
        }
        if(tipoErro === 2){
            req.flash('error', 'Código Expirado');
            res.redirect('/esqueceuSenha');
        }
    })
})

app.post('/alterarSenha',function(req,res){
    const {password}= req.body;
    let id = controllerUser.id;
    // Gera o salt e a senha criptografada
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            // Salva o usuário no banco de dados
            users.updatePass({password: hash, salt, id}).then(()=> {
                res.redirect('/login');
            }).catch(err => {
                req.flash('error', 'campo preenchido incorretamente!');
                res.redirect('/alterarSenha');
            });
        });
    });
})

app.post('/register', async (req, res) => {
    const { name, email, lastname, tel, cpf, cep, city, district, adress, number, password} = req.body;
    // Verifica se o email já está cadastrado
    const users = new userDAO();

    users.findEmail(email)
    .then(user => {
        if (user) {
            req.flash('error', 'E-mail Ja cadastrado!');
            throw Error;
        }
        // Gera o salt e a senha criptografada
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                // Salva o usuário no banco de dados
                users.insert({name, email, lastname, tel, cpf, cep, city, district, adress, number, password: hash, salt}).then(()=> {
                    res.redirect('/login');
                }).catch(err => {
                    req.flash('error', 'campo preenchido incorretamente!');
                    res.redirect('/register');
                });
            });
        });
    }).catch(err => (
        res.redirect('/register')
    ));
});

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

app.post('/comment/add/:id', async(req, res) => {
    const comments = new commentDAO();
    const users = new userDAO();

    let rate = 5;
    let id = req.params.id;
    let comment = req.body.comment;

    if(comment != ""){
        users.findId(req.user.id).then( user =>{
            comments.insert({idProduct: id, idUser: user.id, name: user.name, comment, rate}).then(
                res.redirect(`/item/${id}`)
            ).catch(err => res.status(500).send('Something broke!'));
        }).catch(err => res.status(500).send('Something broke!'));
    }else{
        res.redirect(`/item/${id}`);
    }
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

        transaction.insert({id, idUser, check_ref, price, currency, pay2mail, status, date}).then(
            res.json({ url: check_ref})
        ).catch(err => {
                res.status(500).send('Something broke!')
        });
    }else{
        res.status(500).send('sumup unauthorized')
    }

});

// Rotas get
app.get('/login', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('login',{error: errorMessage});
});

app.get('/esqueceuSenha', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('esqueceuSenha',{error: errorMessage});
});

app.get('/alterarSenha', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('alterarSenha', {error: errorMessage});
});

app.get('/register', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('register', {error: errorMessage});
});

app.get('/', (req, res) =>{
    const errorMessage = req.flash('error');
    res.render('home', {itens: itens, user: req.user, error: errorMessage  });
});

app.get('/produtos/:sec', (req, res) =>{
    const errorMessage = req.flash('error');
    const itens = new itemDAO();
    const images = new imageDAO();

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
    console.log(req.params.id);
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

app.use('/database/', routerDatabase)

app.use('/admin/', routerAdmin)

app.use('/profile/', routerProfile)

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});