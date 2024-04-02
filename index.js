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
const xml = require('xml');
const xml2js = require('xml-js');
const User = require('./controllers/UserController.js');

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
const cardDAO = require("./database/cardDAO.js");
const commentDAO = require("./database/commentDAO.js");
const imageDAO = require("./database/imageDAO.js");
const adminDAO = require("./database/adminDAO.js");

// porta do servidor
const port = 3000;

// cria tabela
const users = new userDAO();
const itens = new itemDAO();
const cards = new cardDAO();
const comments = new commentDAO();
const images = new imageDAO();
const admins = new adminDAO();

itens.create();
users.create();
cards.create();
comments.create();
images.create();
admins.create();

let controllerUser

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

app.post('/cadastro', (req, res) => {
    const { name, email, lastname, tel, cpf, cep, city, district, adress, number, password} = req.body;
    // Verifica se o email já está cadastrado
    const users = new userDAO();

    users.findEmail(email)
    .then(user => {
        if (user) {
            return res.render('cadastro', { message: 'Email já cadastrado.' });
        }
        // Gera o salt e a senha criptografada
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                // Salva o usuário no banco de dados
                users.insert({name, email, lastname, tel, cpf, cep, city, district, adress, number, password: hash, salt}).then(
                    res.redirect('/login')
                );
            });
        });
    })
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
    let id = 1;
    const image = await removeFile('./public/products/' + req.file.filename);

    images.insert({idproduct: id, image: image}).then(
        res.redirect('/debug/tabela/item')
    );
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
            );
        });
    }else{
        res.redirect(`/item/${id}`);
    }
});

// Rotas get
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/', (req, res) =>{
    res.render('home', {itens: itens, user: req.user });
});

app.get('/produtos/:sec', (req, res) =>{
    const itens = new itemDAO();
    const images = new imageDAO();

    itens.findType(req.params.sec).then( itens =>{
        images.findId(1).then( image =>{
            res.render('produtos', {itens: itens, user: req.user, image: image});
        });
    })
});

app.get('/item/:id', (req, res) =>{
    const itens = new itemDAO();


    let rates = 0;

    itens.getItem(req.params.id).then( data =>{
        data.comments.forEach(element => {
            rates+= element.rate;
        });
        console.log(data);
        itens.newRate({mRate: (rates/(data.comments.length)), id: req.params.id});
        res.render('item', {item: data, user: req.user, image: data.images});
    })
});

app.get('/profile', ensureAuthenticated, (req, res) => {
    const itens = new itemDAO();

    itens.findId(req.user.id).then( itens =>{
        res.render('profile', { user: req.user, itens: itens});
    })
});

app.get('/carrinho', (req, res) => {
    const itens = new itemDAO();

    itens.findId(req.params.id).then( itens =>{
        res.render('carrinho', {itens: itens, user: req.user});
    })
});

app.get('/admin/users', ensureAdmin, (req, res) => {
    const users = new userDAO();

    users.select().then( item =>{
        res.render('admin', {data: item, table: 'users'});
    })
});
app.get('/admin/products', ensureAdmin, (req, res) => {
    const itens = new itemDAO();

    itens.select().then( item =>{
        res.render('admin', {data: item, table: 'products'});
    })
});
app.get('/admin/admins', ensureAdmin, (req, res) => {
    const admins = new adminDAO();

    admins.select().then( item =>{
        res.render('admin', {data: item, table: 'admins'});
    })
});

app.get('/info', (req, res)=>{
    res.render('info', {user: req.user});
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});