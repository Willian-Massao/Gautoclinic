const routes = require('express').Router();
const helper = require('../helpers/helper');
require('dotenv/config');

const User = require('../controllers/UserController.js');

const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcryptjs');

const userDAO = require('../database/UserDAO.js');
const melhorenvioDAO = require('../database/melhorenvioDAO.js')
const freteDAO = require('../database/freteDAO.js')

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
        user.hasAdmin = controllerUser.hasAdmin;
        done(null, user);
    }).catch(err => done(err));
});


routes.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true  }));

routes.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

routes.post('/esqueceuSenha', function(req,res){
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

routes.post('/confirmarCodigo',function(req,res){
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

routes.post('/alterarSenha',function(req,res){
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

routes.post('/register', async (req, res) => {
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

routes.post('/calcularFrete', async (req, res) => {
    const {itens, CEP} = req.body;
    const melhorEnvio = new melhorenvioDAO();
    const fretesDAO = new freteDAO();
    let bearerMelhorEnvio = 'Bearer ';
    melhorEnvio.buscaToken()
    .then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let produtos = '';
    //Verifica se o CEP existe
    if (CEP != '' && CEP != undefined){   
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
                fretesDAO.InsertorUpdate([req.user.id, jsonfretes])
                res.status(200).send('Sucesso');  
            }else{
                res.status(500).send('MelhorEnvio falhou na busca dos fretes')
            }
        }else{
            req.flash('error', 'Por favor digite um CEP valido');
            res.redirect('/carrinho');
        }
    }else{
        req.flash('error', 'Por favor digite um CEP valido');
        res.redirect('/carrinho');
    }   
})

routes.get('/fretes', helper.ensureAuthenticated, (req, res) => {
    const fretesDAO = new freteDAO();
    const errorMessage = req.flash('error');
    let freteJson;
    fretesDAO.findId(req.user.id).then( freteTable => {
        freteJson = freteTable.fretes;
        console.log(freteTable)
        res.render('fretes', { user: req.user,fretes: freteJson, error: errorMessage});
    });     
});

routes.get('/login', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('login',{error: errorMessage});
});

routes.get('/esqueceuSenha', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('esqueceuSenha',{error: errorMessage});
});

routes.get('/alterarSenha', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('alterarSenha', {error: errorMessage});
});

routes.get('/register', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('register', {error: errorMessage});
});


module.exports = routes;