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

// porta do servidor
const port = 3000;

// cria tabela
const users = new userDAO();
const itens = new itemDAO();
const cards = new cardDAO();
const comments = new commentDAO();
const images = new imageDAO();

itens.create();
users.create();
cards.create();
comments.create();
images.create();


// Autenticação
passport.use(new LocalStrategy({
    usernameField: 'email', // nome do campo de email no formulário de login
    passwordField: 'password' // nome do campo de senha no formulário de login
}, (email, password, done) => {
    // Verifica se o email do usuário existe no banco de dados
    const users = new userDAO();

    users.findEmail(email)
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
    const users = new userDAO();

    users.findId(id)
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
    //const user = new userDAO();
    //let admin = false;
    //try{
    // users.findId(req.user.id).then( user => {
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

app.post('/carrinho' ,async(req, res) => {
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

// dubug/add/pessoa
//app.post('/debug/add/pessoa', (req, res) => {
//    const { name, email, lastname, tel, cpf, cep, city, district, adress, number, password} = req.body;
//    // Verifica se o email já está cadastrado
//    const users = new userDAO();
//
//    users.findEmail(email)
//    .then(user => {
//        // Gera o salt e a senha criptografada
//        bcrypt.genSalt(10, (err, salt) => {
//            bcrypt.hash(password, salt, (err, hash) => {
//                // Salva o usuário no banco de dados
//                users.insert({name, email, lastname, tel, cpf, cep, city, district, adress, number, password: hash, salt}).then(
//                    res.redirect('/login')
//                );
//            });
//        });
//    })
//});

app.post('/image', upload.single('image') ,async (req, res) => {
    const images = new imageDAO();
    let id = 1;
    const image = await coisa('./public/products/' + req.file.filename);

    images.insert({idproduct: id, image: image}).then(
        res.redirect('/debug/tabela/item')
    );
})

async function removeFile(file){
    let contents = await fs.readFile(file, {encoding: 'base64'});
    await fs.unlink(file);

    return contents;
}
//
//// update item
//app.post('/debug/update/item', upload.single('image') , (req, res) => {
//    const itens = new itemDAO();
//
//    const { name, price, description, section, userId, id } = req.body;
//    const image = req.file.filename;
//
//    item.update({name, price, image, section, description, userId, id}).then(
//        res.redirect('/debug/tabela/item')
//    );
//});
//
//// update pessoa
//app.post('/debug/update/pessoa', (req, res) => {
//    const user = new userDAO();
//
//    const { name, email, end, cpf, tel, id } = req.body;
//    let admin;
//
//    if(req.body.admin == "" || req.body.admin == undefined){
//        admin = 0;
//    }else{
//        admin = req.body.admin;
//    }
//
//    user.updatePessoa({name, email, end, cpf, tel, id, admin}).then(
//        res.redirect('/debug/tabela/pessoa')
//    );
//});
//
//app.post('/debug/delete/item', (req, res) => {
//    const itens = new itemDAO();
//
//    item.deleteItem(req.body.id).then(
//        console.log("Item deletado com sucesso!"),
//    ).finally(
//        res.redirect('/debug/tabela/item')
//    );
//});
//
//app.post('/debug/delete/pessoa', (req, res) => {
//    const user = new userDAO();
//
//    user.deletePessoa(req.body.id).then( result =>{
//        console.log("Pessoa deletada com sucesso!");
//        res.redirect('/debug/tabela/pessoa');
//    })
//});

app.post('/comment/add/:id', async(req, res) => {
    const comments = new commentDAO();
    const users = new userDAO();

    let rate = 5;
    let id = req.params.id;
    let comment = req.body.comment;

    console.log(req.body.comment);

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

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
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

//app.get('/section/:sec', (req, res) => {
//    const itens = new itemDAO();
//
//    itens.findType(req.params.sec).then( itens =>{
//        if(req.isAuthenticated()){
//            res.render('sectionlogged', {itens: itens, user: req.user});
//        }else{
//            res.render('section', {itens: itens});
//        }
//    })
//});

//app.get('/product/:id', (req, res) => {
//    const itens = new itemDAO();
//    const user = new userDAO();
//
//    itens.findId(req.params.id).then( itens =>{
//            console.log(itens);
//            itens.price = itens.price.toFixed(2);
//        if(req.isAuthenticated()){
//         users.findId(req.user.id).then( user =>{
//                res.render('productlogged', {itens: itens, user: user});
//            })
//        }else{
//            res.render('product', {itens: itens});
//        }
//    })
//});

//app.get('/pagamento',ensureAuthenticated, (req, res) => {
//    const user = new userDAO();
//
// users.findId(req.user.id).then( user =>{
//        res.render('pagamento', { user: user});
//    });
//});

//app.get('/debug/pessoa/xml', ensureAdmin, (req, res) => {
//    const user = new userDAO();
//    user.executeQuery("SELECT * FROM user").then( user =>{
//        let xml = `<?xml version="1.0" encoding="UTF-8"?>`
//        xml += `<usuarios>`
//        user.forEach(element => {
//            xml += `<usuario>`
//            xml += `<id>${element.id}</id>`
//            xml += `<name>${element.name}</name>`
//            xml += `<email>${element.email}</email>`
//            xml += `<end>${element.end}</end>`
//            xml += `<password>${element.password}</password>`
//            xml += `<salt>${element.salt}</salt>`
//            xml += `</usuario>`
//        });
//        xml += `</usuarios>`
//        res.header('Content-Type', 'application/xml')
//        res.status(200).send(xml)
//    })
//});
//
//app.get('/debug/pessoa/json', ensureAdmin, (req, res) => {
//    const user = new userDAO();
//
//    user.executeQuery("SELECT * FROM user").then( user =>{
//        res.json(user);
//    })
//});
//
//app.get('/debug/item/xml', ensureAdmin, (req, res) => {
//    const itens = new itemDAO();
//    item.executeQuery("SELECT * FROM item").then( item =>{
//        let xml = ``
//        xml += `<?xml version="1.0" encoding="UTF-8"?>`
//        xml += `<itens>`
//        item.forEach(element => {
//            xml += `<item>`
//            xml += `<id>${element.id}</id>`
//            xml += `<name>${element.name}</name>`
//            xml += `<price>${element.price}</price>`
//            xml += `<image>${element.image}</image>`
//            xml += `<section>${element.section}</section>`
//            xml += `<description>${element.description}</description>`
//            xml += `<userId>${element.userId}</userId>`
//            xml += `</item>`
//        });
//        xml += `</itens>`
//        res.header('Content-Type', 'application/xml')
//        res.status(200).send(xml)
//    })
//});

//app.get('/debug/item/json', ensureAdmin, (req, res) => {
//    const itens = new itemDAO();
//
//    item.executeQuery("SELECT * FROM item").then( item =>{
//        res.json(item);
//    })
//});

//app.get('/debug/tabela/pessoa', ensureAuthenticated, (req, res) => {
//    const user = new userDAO();
//
//    user.executeQuery("SELECT * FROM user").then( result =>{
//        result.forEach(element => {
//            element.password = "🤫 é segredo";
//            element.salt = "ninguem pode saber 🤗";
//        });
//        res.render('debug',{ result: result, crypt: "", user: req.user.id} );
//    })
//});

//app.get('/debug/tabela/item', ensureAdmin, (req, res) => {
//    const itens = new itemDAO();
//
//    item.executeQuery("SELECT * FROM item").then( result =>{
//        res.render('debug',{ result: result, crypt: `enctype=multipart/form-data`, user: ""} );
//    })
//});

// update
//app.get('/debug/update/pessoa', ensureAdmin, (req, res) => {
//    const user = new userDAO();
//
// users.findId(req.user.id).then( user =>{
//        res.render('update', { user: user});
//    })
//});
//
//// item update
//app.get('/debug/update/item', ensureAdmin, (req, res) => {
//    const itens = new itemDAO();
//
//    itens.findId(req.body.id).then( item =>{
//        res.render('update', { item: item});
//    })
//});
//
//app.get('/debug/painel', (req, res) => {
//    res.render('paineldubug');
//});
//
//app.get('/debug/lista', (req, res) => {
//    res.render('lista');
//});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});