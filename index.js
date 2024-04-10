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
const nodemailer = require('nodemailer');
require('dotenv/config');

const User = require('./controllers/UserController.js');
const Envio = require('./controllers/EnvioController.js');

const mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})
// configuração do multer
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/products');
    },
    filename: function(req, file, cb){
        
        const extension = file.mimetype.split('/')[1];

        const fileName = require('crypto').randomBytes(10).toString('hex');

        cb(null, `${fileName}.${extension}`);
    }
});

const upload = multer({ storage });

// database
//const pessoa = require("./database/pessoaDB.js");
//const itens = require("./database/ItensDB.js");
const userDAO = require("./database/userDAO.js");
const itemDAO = require("./database/itemDAO.js");
const transactionDAO = require("./database/transactionDAO.js");
const commentDAO = require("./database/commentDAO.js");
const imageDAO = require("./database/imageDAO.js");
const adminDAO = require("./database/adminDAO.js");
const passwordForgotDAO = require("./database/passwordFogotDAO.js");
const envioDAO = require("./database/melhorenvioDAO.js");

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
    const users = new userDAO();

    users.findId(user.id).then(user => {
        done(null, user);
    }).catch(err => done(err));
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
}

async function ensureAdmin(req, res, next) {
    if(req.isAuthenticated()){
        if(controllerUser.hasAdmin == 1){
            return next();
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/login');
    }
}

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
                randomNumber = numeroAleatorioRange(100000,999999)
                html = `<style>#container {width: calc(100% - 30px);background-color: #f3f4f8;}h1 {color: #000;}#img-container{width: 10%;}p{color: #6b688a;font-weight: 400;}img{flex-shrink:  0;-webkit-flex-shrink: 0;max-width:  100%;max-height:  100%;}#code{height: 50px;width: 100%;background-color: #f3f4f8;border-radius: 5px;display: flex;justify-content: center;align-items: center;}#border{background-color: white;display: flex;justify-content: center;flex-direction: column;font-family: 'Trebuchet MS', sans-serif;padding: 30px;margin: 25px;border-radius: 5px;}</style><script>function copy() {var copyText = document.querySelector("p");navigator.clipboard.writeText(copyText.innerText);}</script><div id="container"><div id="border"><h1>Seu código</h1><p>Por favor, insira o código de verificação na página de redefinição de senha. Esse código foi enviado para o seu e-mail registrado. Após inserir o código,vocêpoderácriar uma nova senha.</p><div id="code"><h3>${randomNumber}</h3></div><p>Se você não solicitou a alteração da senha, entre em contato conosco imediatamente. Sua segurança é nossa prioridade.</p></div></div>`
                text = 'Número de verificação: '+randomNumber;
                id = controllerUser.id
                userEmail = controllerUser.email
                passwordForgot.insertOrUpdate({id,userEmail,randomNumber, datetime})
                sendEmail(email,assunto,html,text);
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

function numeroAleatorioRange(min, max) {
    var range = max - min;
    if (range <= 0) {
        throw new Exception('max must be larger than min');
    }
    var requestBytes = Math.ceil(Math.log2(range) / 8);
    if (!requestBytes) { // No randomness required
        return min;
    }
    var maxNum = Math.pow(256, requestBytes);
    var ar = new Uint8Array(requestBytes);

    while (true) {
        crypto.getRandomValues(ar);

        var val = 0;
        for (var i = 0;i < requestBytes;i++) {
            val = (val << 8) + ar[i];
        }

        if (val < maxNum - maxNum % range) {
            return min + (val % range);
        }
    }
}

function sendEmail(destinatario, assunto,html,text){
    mailer.sendMail({
        from: 'GautoClinicEmailAutomatico@gmail.com',
        to: destinatario,
        subject: assunto,
        html: html,
        text: text
    })
    .then((response)=> console.log('Email enviado com sucesso'))
    .catch((err)=> console.log('Erro ao enviar email: ', err))
}
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

app.post('/image', upload.single('image') ,async (req, res) => {
    const images = new imageDAO();
    let id = 2;
    const image = await removeFile('./public/products/' + req.file.filename);

    images.insert({idproduct: id, image: image}).then(
        res.redirect('/')
    ).catch(err => res.status(500).send('Something broke!'));
})

async function removeFile(file){
    let contents = await fs.readFile(file, {encoding: 'base64'});
    await fs.unlink(file);

    return contents;
}

app.post('/comment/add/:id', async(req, res) => {
    const comments = new commentDAO();
    const users = new userDAO();

    let rate = 5;
    let id = req.params.id;
    let comment = req.body.comment;

    if(comment != ""){
        users.findId(req.user.id).then( user =>{
            comments.insert({idProduct: id, idUser: user.id, nameUser: user.name, comment, rate}).then(
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
    }

    transaction.insert({id, idUser, check_ref, price, currency, pay2mail, status, date}).then(
        res.json({ url: check_ref})
    ).catch(err => {
            res.status(500).send('Something broke!')
        });
});

app.put('/admin/envio', async(req, res) => {
    const envio = new envioDAO();
    const { code } = req.body;

    envio.equalsNull().then( data => {
        console.log(data);
    }).catch(err => res.status(500).send('Something broke!'));
});

app.post('/admin/envio', async(req, res) => {
    const envio = new envioDAO();
    const { client_id, client_secret, redirect_uri } = req.body;
    let url = 'https://sandbox.melhorenvio.com.br/oauth/authorize';
    let concatenatedString = '';
    controllerEnvio = new Envio({ client_id, client_secret, redirect_uri });
    console.log(controllerEnvio);

    for (const key in req.body) {
        if (req.body[key] === 'on') {
            concatenatedString += key + ' ';
        }
    }
    url += `?client_id=${client_id}`
    url += `&redirect_uri=${redirect_uri}`
    url += `&response_type=code`
    url += `&scope=${concatenatedString}`
    res.redirect(url);
});
// Rotas get
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/esqueceuSenha', (req, res) => {
    res.render('esqueceuSenha');
});

app.get('/alterarSenha', (req, res) => {
    res.render('alterarSenha');
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
    const itens = new itemDAO();
    const images = new imageDAO();

    itens.findType(req.params.sec).then( itens =>{
        res.render('produtos', {itens: itens, user: req.user});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/item/:id', (req, res) =>{
    const itens = new itemDAO();

    let rates = 0;

    itens.getItem(req.params.id).then( data =>{
        if(data.comments.length != 0){
            data.comments.forEach(element => {
                rates+= element.rate;
            })
            itens.newRate({mRate: (rates/(data.comments.length)), id: req.params.id});
        }
        res.render('item', {item: data, user: req.user, image: data.images});
    })
});

app.get('/profile/account', ensureAuthenticated, (req, res) => {
    const user = new userDAO();

    user.findId(req.user.id).then( itens =>{
        res.render('profile', { user: req.user, itens: itens, admin: controllerUser.hasAdmin});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/profile/request', ensureAuthenticated, (req, res) => {
    const user = new userDAO();

    user.findId(req.user.id).then( itens =>{
        res.render('profile', { user: req.user, itens: itens, admin: controllerUser.hasAdmin});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/profile/edit', ensureAuthenticated, (req, res) => {
    const user = new userDAO();

    user.findId(req.user.id).then( itens =>{
        res.render('editprofile', { user: req.user, itens: itens, admin: controllerUser.hasAdmin});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.put('/profile/edit', (req, res) => {
    const { } = req.body;
    const user = new userDAO();

    user.update(req.body).then( itens =>{
        res.redirect('/profile/account');
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/carrinho', ensureAuthenticated, (req, res) => {
    const itens = new itemDAO();

    itens.findId(req.params.id).then( itens =>{
        res.render('carrinho', {itens: itens, user: req.user});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/admin/users', ensureAdmin, (req, res) => {
    const users = new userDAO();

    users.select().then( item =>{
        res.render('admin', {data: item, table: 'users'});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/admin/images', ensureAdmin, (req, res) => {
    const images = new imageDAO();

    images.select().then( item =>{
        res.render('admin', {data: item, table: 'users'});
    }).catch(err => res.status(500).send('Something broke!'));
}); 
app.get('/admin/products', ensureAdmin, (req, res) => {
    const itens = new itemDAO();
    
    itens.select().then( item =>{
        res.render('admin', {data: item, table: 'products'});
    }).catch(err => res.status(500).send('Something broke!'));
});
app.get('/admin/admins', ensureAdmin, (req, res) => {
    const admins = new adminDAO();
    
    admins.select().then( item =>{
        res.render('admin', {data: item, table: 'admins'});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/admin/envio', ensureAdmin, async(req, res) => {
   if(req.query.code){
        let envio = new envioDAO();
        let code = req.query.code;
        console.log(code);
        
        let fetchres = await fetch('https://sandbox.melhorenvio.com.br/oauth/token',{
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            }, body:JSON.stringify({
                "client_id": controllerEnvio.client_id,
                "client_secret": controllerEnvio.client_secret,
                "redirect_uri": controllerEnvio.redirect_uri,
                "code": code,
                "grant_type": "authorization_code"
            })
        });

        if(fetchres.ok){
            let temp = await fetchres.json();

            controllerEnvio.access_token = temp.access_token;
            controllerEnvio.refresh_token = temp.refresh_token;
            let date = new Date();
            date.setSeconds(date.getSeconds() + temp.expires_in);
            controllerEnvio.expired_at = date;

            console.log(controllerEnvio);
            envio.insertOrUpdate(controllerEnvio);
        }
    }
    res.render('frete');
});

app.get('/info', (req, res)=>{
    res.render('info', {user: req.user});
});

app.get('/payment/:id', (req, res)=>{
    const transaction = new transactionDAO();
    console.log(req.params.id);
    transaction.findId(req.params.id).then( data =>{
        res.render('payment', {data: data, user: req.user});
    }).catch(err => res.status(500).send('Something broke!'));
});

app.get('/search', (req, res) =>{
    const itens = new itemDAO();
    const errorMessage = req.flash('error');

    itens.search(req.query.e).then( data =>{
        res.render('search', {itens: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});


app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});