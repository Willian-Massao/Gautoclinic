const routes = require('express').Router();
const helper = require('../helpers/helper');
require('dotenv/config');

const User = require('../controllers/UserController.js');
let controllerUser;

const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcryptjs');

const userDAO = require('../database/userDAO.js');
const melhorenvioDAO = require('../database/melhorenvioDAO.js')
const freteDAO = require('../database/freteDAO.js');
const passwordForgotDAO = require('../database/passwordFogotDAO.js');
const { json } = require('body-parser');

const formJSON = require('../../formulario.json');

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
        controllerUser = new User(user);
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
    users.findId(user.id).then(userData => {
        user = userData;
        done(null, user);
    }).catch(err => done(err));
});


routes.post('/login', (passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/user/login', failureFlash: true  })));

routes.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

routes.post('/esqueceuSenha', function(req,res){
    const passwordForgot = new passwordForgotDAO();
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
                html = `<style>#container {width: calc(100% - 30px);background-color: #f3f4f8;}h1 {color: #000;}#img-container{width: 10%;}p{color: #6b688a;font-weight: 400;}img{flex-shrink:  0;-webkit-flex-shrink: 0;max-width:  100%;max-height:  100%;}#code{height: 50px;width: 100%;background-color: #f3f4f8;border-radius: 5px;display: flex;justify-content: center;align-items: center;}#border{background-color: white;display: flex;justify-content: center;flex-direction: column;font-family: 'Trebuchet MS', sans-serif;padding: 30px;margin: 25px;border-radius: 5px;}</style><script>function copy() {var copyText = document.querySelector("p");navigator.clipboard.writeText(copyText.innerText);}</script><div id="container"><div id="border"><h1>Seu código</h1><p>Por favor, insira o código de verificação na página de redefinição de senha. Esse código foi enviado para o seu e-mail registrado. Após inserir o código,vocêpoderácriar uma nova senha.</p><div id="code"><h3>${randomNumber}</h3></div><p>Se você não solicitou a alteração da senha, apenas ignore esse e-mail.</p></div></div>`
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
        res.redirect('/user/register');
    });
})

routes.post('/confirmarCodigo',function(req,res){
    const passwordForgot = new passwordForgotDAO();
    const {codigo} = req.body;
    let date = new Date();
    let tipoErro;
    passwordForgot.findUser(controllerUser.id)  
    .then(passwordForgot =>{
        if( passwordForgot['dateTimeExpirationCod'] > date) {
                if (passwordForgot['authVerificationCod'] == codigo){
                    res.redirect('/user/alterarSenha');
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
            res.redirect('/user/esqueceuSenha');
        }
    })
})

routes.post('/alterarSenha',function(req,res){
    const users = new userDAO();
    const {password}= req.body;
    // Gera o salt e a senha criptografada
    if(typeof controllerUser !== 'undefined'){
        let id = controllerUser.id;
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                // Salva o usuário no banco de dados
                users.updatePass({password: hash, salt, id}).then(()=> {
                    res.redirect('/user/login');
                }).catch(err => {
                    req.flash('error', 'Campo preenchido incorretamente!');
                    res.redirect('/user/alterarSenha');
                });
            });
        });
    }else{
        req.flash('error', 'Erro ao alterar senha!');
        res.redirect('/user/esqueceuSenha');
    }
})

routes.post('/register', async (req, res) => {
    const { name, email, niverDay, niverMouth, niverYear, lastname, tel, cpf, cep, city, district, adress, number, password} = req.body;
    // Verifica se o email já está cadastrado
    const users = new userDAO();

    users.findEmail(email)
    .then(user => {
        if (user) {
            req.flash('error', 'E-mail Já cadastrado!');
            throw Error;
        }
        // Gera o salt e a senha criptografada
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                // Salva o usuário no banco de dados
                let niver = new Date(niverMouth+'-'+niverDay+'-'+niverYear);
                users.insert({name, email, lastname, niver, tel, cpf, cep, city, district, adress, number, password: hash, salt}).then(()=> {
                    res.redirect('/user/login');
                }).catch(err => {
                    req.flash('error', 'Campo preenchido incorretamente!');
                    res.redirect('/user/register');
                });
            });
        });
    }).catch(err => (
        res.redirect('/user/register')
    ));
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

routes.get('/agendamentos', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    
    res.render('agendamentos', { user: req.user, error: errorMessage});
});

routes.get('/info/:id', helper.ensureAuthenticated, async (req, res) => {
    const errorMessage = req.flash('error');
    const users = new userDAO();
    let keys = Object.keys(formJSON.historico);
    
    
    try{
        let data = await users.gettingById(req.params.id);
        //console.log(data);
        if(data.forms){
            for(let index in keys){
                data.forms.historico[keys[index]].nome = formJSON.historico[keys[index]].nome;
            }
        }
        res.render('consultasUserInfo', { user: req.user, error: errorMessage, data: data});
    }catch(err){
        console.log(err);
    }
});


module.exports = routes;