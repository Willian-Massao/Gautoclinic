const nodemailer = require('nodemailer');
const multer = require('multer');

const fs = require('fs').promises;
const crypto = require('crypto').webcrypto;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.returnTo = req.originalUrl; 
    res.redirect('/user/login');
}

async function ensureAdmin(req, res, next) {
    if(req.isAuthenticated()){
        if(req.user.hasAdmin == 1){
            return next();
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/user/login');
    }
}

async function ensureFunc(req, res, next) {
    if(req.isAuthenticated()){
        if(req.user.hasFunc == 1){
            return next();
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/user/login');
    }
}

async function removeFile(file){
    let contents = await fs.readFile(file, {encoding: 'base64'});
    await fs.unlink(file);

    return contents;
}

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

const upload = multer({ storage });

function calcularIdade(data){
    let nascimento = new Date(data);
    let hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    let mes = hoje.getMonth() - nascimento.getMonth();
    if(mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())){
        idade--;
    }
    return idade;
}

function calcularData(data){
    let hoje = new Date();
    hoje.setHours(7);
    let dataAgendamento = new Date(data);
    let diferenca = dataAgendamento - hoje;
    let dias = diferenca/(1000*60*60*24);
    return dias;
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    removeFile,
    numeroAleatorioRange,
    sendEmail,
    mailer,
    upload,
    calcularIdade,
    calcularData,
    ensureFunc
}