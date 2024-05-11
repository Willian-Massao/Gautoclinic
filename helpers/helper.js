const nodemailer = require('nodemailer');
const multer = require('multer');
const envioDAO = require("../database/melhorenvioDAO.js");

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

async function add2cart(usuario, owner, itens){
    const melhorEnvio = new envioDAO();
    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    const apiRes = await fetch('https://melhorenvio.com.br/api/v2/me/cart',
    {
        method: 'POST',
        headers: 
        {
            "Accept":"application/json",
            "Content-Type": "application/json",
            "Authorization": bearerMelhorEnvio,
            "User-Agent": "Contatar servidorclientesaws@gmail.com",
        },
        body:JSON.stringify
        ({
            // tableUsuario.shipping.id é o id do item, não da transportadora
            // na criação do frete adicionei um campo vazio para o id da transportadora (userShipping)
            // quando o usuário seleciona a transportadora, e gera as informações para mandar pra sumup
            // eu pego o id da transportadora e coloco no campo userShipping
            "service": usuario.info.userShipping,//Id transportadora
            "from": 
            {
                "name": owner.nome_completo,
                "phone": owner.phone,
                "email": owner.email,
                "company_document": "89794131000100",//owner.companydocument, //CNPJ
                "state_register": owner.stateRegister,// Inscricao estadual Perguntar ao Gauto
                "address": owner.adress,//Logradouro Remetente
                "complement": owner.complement,// Complemento
                "number": owner.number,//Numero
                "district": owner.district,//Bairro
                "city": owner.city,//Cidade
                "country_id": owner.countryId,//Pais
                "postal_code": "03532040",//owner.postalCode,//Cep
                "state_abbr": "SP",//owner.stateAbbr,//Estado
                "note": "observação",//Observacao
            },
            "to": 
            {
                "name": usuario.nome_completo,
                "phone": usuario.tel,
                "email": usuario.email,
                "document": usuario.cpf,//CPF
                "address": usuario.info.to.adress,//Logradouro Destinatario
                "complement":  "teste",//usuario.info.to.complemento,// Complemento
                "number": usuario.info.to.numero,//Numero
                "district": usuario.info.to.district,//Bairro
                "city": usuario.info.to.city,//Cidade
                "country_id": usuario.info.to.country_id,//Pais
                "postal_code": usuario.info.to.CEP,//Cep
                "state_abbr": usuario.info.to.state_abbr,//Estado
                "note": "observação"//Observacao
            },
            // os produtos precisa estar no array, por que estamos passando todos os produtos que o frete calculou
            // então voltei com Shipping = []
            "products": itens.products, //passei os produtos para o array na linha 47
            "volumes": itens.volumes, //tambem fiz para os volumes
            "plataform": "Gauto Clinic",
            "options": {
                "insurance_value": 11.78,
                "receipt": false,
                "own_hand": false,
                "reverse": false,
                "non_commercial": false,
                "invoice": {
                    "key": "31190307586261000184550010000092481404848162"
                },
                "platform": "Nome da Plataforma",
                "tags": [
                    {
                        "tag": "Identificação do pedido na plataforma, exemplo: 1000007",
                        "url": "Link direto para o pedido na plataforma, se possível, caso contrário pode ser passado o valor null"
                    }
                ]
            }
        })

    }); 
    const resp = await apiRes.json();
    return resp;
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
    ensureFunc,
    add2cart
}