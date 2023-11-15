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
const xml = require('xml');
const xml2js = require('xml-js');

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

function ensureAdmin(req, res, next) {
    //const user = new pessoa();
    //let admin = false;
    //try{
    //    user.findPessoaById(req.user.id).then( user => {
    //        if(user.admin == 1){
    //            admin = true;
    //        }
    //        if (req.isAuthenticated() && admin) {
    //            return next();
    //        }
    //        res.redirect('/');
    //    })
    //}catch(err){
    //    console.log(err);
    //}
    ////verificar no banco de dados se o usuario é admin
    return next();
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
    const { name, email, password , end, tel, cpf} = req.body;
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
                usuario.insertPessoa({name, email, end, cpf, tel, password: hash, salt}).then(
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

// dubug/add/pessoa
app.post('/debug/add/pessoa', (req, res) => {
    const { name, email, password , end, tel, cpf, admin} = req.body;
    // Verifica se o email já está cadastrado
    const usuario = new pessoa();

    usuario.findPessoaByEmail(email)
    .then(user => {
        // Gera o salt e a senha criptografada
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                // Salva o usuário no banco de dados
                usuario.insertPessoa({name, email, end, admin, cpf, tel, password: hash, salt}).then(
                    res.redirect('/login')
                );
            });
        });
    })
});

app.post('/debug/add/item', upload.single('image') , (req, res) => {
    const item = new itens();
    const { name, price, description, section, userId } = req.body;
    const image = req.file.filename;

    item.insertItem({name, price, image, section, description, userId}).then(
        res.redirect('/debug/tabela/item')
    );
})

// update item
app.post('/debug/update/item', upload.single('image') , (req, res) => {
    const item = new itens();

    const { name, price, description, section, userId, id } = req.body;
    const image = req.file.filename;

    console.log(req.body);

    item.updateItem({name, price, image, section, description, userId, id}).then(
        res.redirect('/debug/tabela/item')
    );
});

// update pessoa
app.post('/debug/update/pessoa', (req, res) => {
    const user = new pessoa();

    const { name, email, end, cpf, tel, id } = req.body;
    let admin;

    if(req.body.admin == "" || req.body.admin == undefined){
        admin = 0;
    }else{
        admin = req.body.admin;
    }
    //id = Number(id);
    console.log(req.body);

    user.updatePessoa({name, email, end, cpf, tel, id, admin}).then(
        res.redirect('/debug/tabela/pessoa')
    );
});

app.post('/debug/delete/item', (req, res) => {
    const item = new itens();

    item.deleteItem(req.body.id).then(
        console.log("Item deletado com sucesso!"),
    ).finally(
        res.redirect('/debug/tabela/item')
    );
});

app.post('/debug/delete/pessoa', (req, res) => {
    const user = new pessoa();

    user.deletePessoa(req.body.id).then( result =>{
        console.log("Pessoa deletada com sucesso!");
        res.redirect('/debug/tabela/pessoa');
    })
});

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
    const user = new pessoa();

    user.findPessoaById(req.user.id).then( user =>{
        res.render('pagamento', { user: user});
    });
});

app.get('/debug/pessoa/xml', ensureAdmin, (req, res) => {
    const user = new pessoa();
    user.executeQuery("SELECT * FROM user").then( user =>{
        let xml = `<?xml version="1.0" encoding="UTF-8"?>`
        xml += `<usuarios>`
        user.forEach(element => {
            xml += `<usuario>`
            xml += `<id>${element.id}</id>`
            xml += `<name>${element.name}</name>`
            xml += `<email>${element.email}</email>`
            xml += `<end>${element.end}</end>`
            xml += `<password>${element.password}</password>`
            xml += `<salt>${element.salt}</salt>`
            xml += `</usuario>`
        });
        xml += `</usuarios>`
        res.header('Content-Type', 'application/xml')
        res.status(200).send(xml)
    })
});

app.get('/debug/pessoa/json', ensureAdmin, (req, res) => {
    const user = new pessoa();

    user.executeQuery("SELECT * FROM user").then( user =>{
        res.json(user);
    })
});

app.get('/debug/item/xml', ensureAdmin, (req, res) => {
    const item = new itens();
    item.executeQuery("SELECT * FROM item").then( item =>{
        let xml = ``
        xml += `<?xml version="1.0" encoding="UTF-8"?>`
        xml += `<itens>`
        item.forEach(element => {
            xml += `<item>`
            xml += `<id>${element.id}</id>`
            xml += `<name>${element.name}</name>`
            xml += `<price>${element.price}</price>`
            xml += `<image>${element.image}</image>`
            xml += `<section>${element.section}</section>`
            xml += `<description>${element.description}</description>`
            xml += `<userId>${element.userId}</userId>`
            xml += `</item>`
        });
        xml += `</itens>`
        res.header('Content-Type', 'application/xml')
        res.status(200).send(xml)
    })
});

app.get('/debug/item/json', ensureAdmin, (req, res) => {
    const item = new itens();

    item.executeQuery("SELECT * FROM item").then( item =>{
        res.json(item);
    })
});

app.get('/debug/tabela/pessoa', ensureAuthenticated, (req, res) => {
    const user = new pessoa();

    user.executeQuery("SELECT * FROM user").then( result =>{
        result.forEach(element => {
            element.password = "🤫 é segredo";
            element.salt = "ninguem pode saber 🤗";
        });
        res.render('debug',{ result: result, crypt: "", user: req.user.id} );
    })
});

app.get('/debug/tabela/item', ensureAdmin, (req, res) => {
    const item = new itens();

    item.executeQuery("SELECT * FROM item").then( result =>{
        res.render('debug',{ result: result, crypt: `enctype="multipart/form-data"`, user: ""} );
    })
});

// update
app.get('/debug/update/pessoa', ensureAdmin, (req, res) => {
    const user = new pessoa();

    user.findPessoaById(req.user.id).then( user =>{
        res.render('update', { user: user});
    })
});

// item update
app.get('/debug/update/item', ensureAdmin, (req, res) => {
    const item = new itens();

    item.findItemById(req.body.id).then( item =>{
        res.render('update', { item: item});
    })
});

app.get('/debug/painel', (req, res) => {
    res.render('paineldubug');
});

app.get('/debug/lista', (req, res) => {
    res.render('lista');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});