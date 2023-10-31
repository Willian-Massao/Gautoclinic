/*jshint esversion: 6 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//const connection = require('./database/database');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const multer = require('multer');

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
const pessoa = require("./database/pessoaDB.js");
const itens = require("./database/ItensDB.js");

// porta do servidor
const port = 3000;

// cria tabela
const user = new pessoa();
const item = new itens();

item.createTable();
user.createTable();


// Autenticação
passport.use(new LocalStrategy({
    usernameField: 'email', // nome do campo de email no formulário de login
    passwordField: 'password' // nome do campo de senha no formulário de login
}, (email, password, done) => {
    // Verifica se o email do usuário existe no banco de dados
    const usuario = new pessoa();

    usuario.findPessoaByEmail(email)
    .then(user => {
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

passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser((id, done) => {
    const usuario = new pessoa();

    usuario.findPessoaById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => done(err));
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
}

// Conexão com o banco de dados
//connection.authenticate()
//.then(() => {
//    console.log("Conexão realizada com sucesso");
//})
//.catch((error) => {
//    console.log("Erro ao se conectar com o banco de dados: " + error);
//});

// Configuração do express
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Configuração da sessão
app.use(session({ secret: 'seu-segredo', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Rotas post
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true  }));

app.post('/cadastro', (req, res) => {
    const { name, email, password , end} = req.body;
    // Verifica se o email já está cadastrado
    const usuario = new pessoa();

    usuario.findPessoaByEmail(email)
    .then(user => {
        if (user) {
            return res.render('cadastro', { message: 'Email já cadastrado.' });
        }
        // Gera o salt e a senha criptografada
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                // Salva o usuário no banco de dados
                usuario.insertPessoa({name, email, end, password: hash, salt}).then(
                    res.redirect('/login')
                );
            });
        });
    })
});

app.post('/carrinho' ,async(req, res) => {
    const item = new itens();
    let id = req.body.itemArr;
    let itemList = [];

    try{
        for(let i in id){
            itemList.push(await item.findItemById(id[i]));
        };
    }catch(err){
        console.log(err);
    }
    res.send(itemList);
});

app.post('/item/add', upload.single('image') , (req, res) => {
    const item = new itens();
    const { name, price, description, section } = req.body;
    const image = req.file.filename;
    const userId = req.user.id;

    item.insertItem({name, price, image, section, description, userId}).then(
        res.redirect('/profile')
    );
})

// Rotas get
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.get('/', (req, res) =>{
    const item = new itens();

    item.findItemAll().then( itens =>{
        if(req.isAuthenticated()){
            res.render('homelogged', {itens: itens, user: req.user});
        }else{
            res.render('home', {itens: itens});
        }
    })
});

app.get('/profile', ensureAuthenticated, (req, res) => {
    const item = new itens();

    item.findItemByUserId(req.user.id).then( itens =>{
        res.render('profile', { user: req.user, itens: itens});
    })
});

app.get('/section/:sec', (req, res) => {
    const item = new itens();

    item.findItemBySection(req.params.sec).then( itens =>{
        if(req.isAuthenticated()){
            res.render('sectionlogged', {itens: itens, user: req.user});
        }else{
            res.render('section', {itens: itens});
        }
    })
});

app.get('/product/:id', (req, res) => {
    const item = new itens();
    const user = new pessoa();

    item.findItemById(req.params.id).then( itens =>{
            itens.price = itens.price.toFixed(2);
        if(req.isAuthenticated()){
            user.findPessoaById(req.user.id).then( user =>{
                res.render('productlogged', {itens: itens, user: user});
            })
        }else{
            res.render('product', {itens: itens});
        }
    })
});
app.get('/carrinho', (req, res) => {
    const item = new itens();

    item.findItemById(req.params.id).then( itens =>{
        if(req.isAuthenticated()){
            res.render('carrinhologged', {itens: itens, user: req.user});
        }else{
            res.render('carrinho', {itens: itens});
        }
    })
});

app.get('/pagamento',ensureAuthenticated, (req, res) => {
    res.render('pagamento', { user: req.user});
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});