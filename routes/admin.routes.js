const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/userDAO.js');
const imageDAO = require('../database/imageDAO.js');
const itemDAO = require('../database/itemDAO.js');
const adminDAO = require('../database/adminDAO.js');
const envioDAO = require('../database/melhorenvioDAO.js');
const refundDAO = require('../database/refoundDAO.js');
const commentDAO = require('../database/commentDAO.js');
const melhorEnvioDAO = require('../database/melhorenvioDAO.js');
const transactionDAO = require('../database/transactionDAO.js');

const Envio = require('../controllers/EnvioController.js');

let controllerEnvio

routes.get('/users', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const users = new userDAO();

    users.select().then( item =>{
        users.describe().then( index =>{
            index.forEach((element, i) => {
                if(element.Field === 'password'){
                    index.splice(i, 2);
                }
            });
            item.forEach((e)=>{
                temp = e.niver.toISOString().split('T')[0];
                temp = temp.split('-');
                e.niver = temp[2] + '/' + temp[1] + '/' + temp[0];
            })
            res.render('admin', {data: item, indexes: index, table: 'users', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});
//comments
routes.get('/comments', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const comments = new commentDAO();

    comments.select().then( item =>{
        comments.describe().then( index =>{
            res.render('admin', {data: item, indexes: index, table: 'comments', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/images', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const images = new imageDAO();

    images.select().then( item =>{
        images.describe().then( index =>{
            res.render('admin', {data: item, indexes: index, table: 'images', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
}); 


routes.get('/edit/images/:id', helper.ensureAdmin, (req, res) => {
    const { id } = req.params;
    const errorMessage = req.flash('error');
    const images = new imageDAO();
    
    images.findId(id).then( item =>{
        images.describe().then( index =>{
            res.render('editadmin', {data: item, indexes: index, table: 'images', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/products', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const itens = new itemDAO();
    
    itens.select().then( item =>{
        itens.describe().then( index =>{
            res.render('admin', {data: item, indexes: index, table: 'products', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/edit/products/:id', helper.ensureAdmin, (req, res) => {
    const { id } = req.params;
    const errorMessage = req.flash('error');
    const itens = new itemDAO();
    
    itens.getItem(id).then( item =>{
        itens.describe().then( index =>{
            res.render('editadmin', {data: item, indexes: index, table: 'products', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/admins', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const admins = new adminDAO();
    
    admins.select().then( item =>{
        admins.describe().then( index =>{
            res.render('admin', {data: item, indexes: index, table: 'admins', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/refund', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const refund = new refundDAO();

    refund.select().then( item =>{
        refund.describe().then( index =>{
            res.render('admin', {data: item, indexes: index, table: 'refund', error: errorMessage});
        }).catch(err => res.status(500).send('Something broke!'));
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/etiqueta', helper.ensureAdmin, async (req, res) => {
    const errorMessage = req.flash('error');
    const melhorEnvio = new melhorEnvioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token}).then(async ()=>{

        let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/cart',{
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Authorization": bearerMelhorEnvio,
                "User-Agent": "Contatar servidorclientesaws@gmail.com"
            }
        });
    
        if(fetchres.ok){
            let temp = await fetchres.json();
            let filter = [];
            let index = [];
            for (const key in temp.data[0]) {
                //if(temp.data[0][key] != null && (key != "invoice" && key != "tags" && key != "products" && key != "volumes")){
                    index.push({Field: key, Type: 'varchar(255)', Null: 'YES', Key: '', Default: null, Extra: ''});
                //}
            }
            temp.data.forEach(element => {
                let temp = {};
                for (const key in element) {
                    //if(element[key] != null){
                        if(key == "from" || key == "to"){
                            temp[key] = element[key].postal_code;
                        }else if(key == "service"){
                            temp[key] = element[key].name;
                        }else{//if(key != "invoice" && key != "tags" && key != "products" && key != "volumes"){
                            temp[key] = element[key];
                        }
                    //}
                }
                filter.push(temp);
            });
            res.render('admin',{data: filter, indexes: index, table: 'etiqueta', error: errorMessage});
        }
    }).catch(err =>{
        req.flash('error', 'Sem chave de acesso!');
        res.redirect('/admin/envio');
    });
    
});

routes.get('/paying', helper.ensureAdmin, async (req, res) => {
    const errorMessage = req.flash('error');
    const melhorEnvio = new melhorEnvioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token}).then(async ()=>{
        
        let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/orders',{
        method: 'GET',
            headers: {
                "Accept": "application/json",
                "Authorization": bearerMelhorEnvio,
                "User-Agent": "Contatar servidorclientesaws@gmail.com"
            }
        });
    
        if(fetchres.ok){
            let temp = await fetchres.json();
            let filter = [];
            let index = [];
            for (const key in temp.data[0]) {
                //if(temp.data[0][key] != null && (key != "invoice" && key != "tags" && key != "products" && key != "volumes")){
                    index.push({Field: key, Type: 'varchar(255)', Null: 'YES', Key: '', Default: null, Extra: ''});
                //}
            }
            temp.data.forEach(element => {
                let temp = {};
                for (const key in element) {
                    //if(element[key] != null){
                        if(key == "from" || key == "to"){
                            temp[key] = element[key].postal_code;
                        }else if(key == "service"){
                            temp[key] = element[key].name;
                        }else{//if(key != "invoice" && key != "tags" && key != "products" && key != "volumes"){
                            temp[key] = element[key];
                        }
                    //}
                }
                filter.push(temp);
            });
            res.render('admin',{data: filter, indexes: index, table: 'paying', error: errorMessage});
        }
    }).catch(err =>{
        req.flash('error', 'Sem chave de acesso!');
        res.redirect('/admin/envio');
    });
    
});

routes.get('/paying/:id', helper.ensureAdmin, async (req, res)=>{
    const errorMessage = req.flash('error');
    const { id } = req.params;
    const melhorEnvio = new envioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/orders/' + id, {
        method: 'GET',
        headers: {
            "Accept": "application/json",
            "Authorization": bearerMelhorEnvio,
            "User-Agent": "Contatar servidorclientesaws@gmail.com"
        }
    })
    if(fetchres.ok){
        let temp = await fetchres.json();
        res.render('etiqueta', {data: temp, error: errorMessage, table: 'paying'});
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/paying');
    }
});


routes.get('/etiqueta/:id', helper.ensureAdmin, async (req, res)=>{
    const errorMessage = req.flash('error');
    const { id } = req.params;
    const melhorEnvio = new envioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/cart/' + id, {
        method: 'GET',
        headers: {
            "Accept": "application/json",
            "Authorization": bearerMelhorEnvio,
            "User-Agent": "Contatar servidorclientesaws@gmail.com"
        }
    })
    if(fetchres.ok){
        let temp = await fetchres.json();
        res.render('etiqueta', {data: temp, error: errorMessage, table: 'etiqueta'});
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/etiqueta');
    }
});

routes.get('/envio', helper.ensureAdmin, async(req, res) => {
    const errorMessage = req.flash('error');
   if(req.query.code){
        let envio = new envioDAO();
        let code = req.query.code;
        
        let fetchres = await fetch('https://melhorenvio.com.br/oauth/token',{
            method: 'POST',
            headers: {
                "Content-Type": "routeslication/json",
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
            
            envio.buscaToken().then(async (oldToken)=>{
                if(oldToken){
                    envio.desativarToken(oldToken);
                }
            });
            
            envio.insertOrUpdate(controllerEnvio);
        }
    }
    res.render('frete',{error: errorMessage});
});

routes.get('/PedidoRafa', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const user = new userDAO();

    user.BuscaPedidosClientes().then( pedidos =>{
        let converteNomeColuna = Object.keys(pedidos[0])
        let index=[];
        converteNomeColuna.forEach((cadaColuna)=>{
            index.push({Field: cadaColuna})
        })
            res.render('admin', {data: pedidos, indexes: index, table: 'PedidoRafa', error: errorMessage});
        }).catch(err =>res.status(500).send('Something broke!,'+err));
}); 

routes.get('/edit/PedidoRafa/:id', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const user = new userDAO();

    user.BuscaPedidosClientesEspecifico(req.params.id).then( pedidos =>{
        let converteNomeColuna = Object.keys(pedidos[0])
        let index=[];
        converteNomeColuna.forEach((cadaColuna)=>{
            index.push({Field: cadaColuna})
        })
        res.render('editadmin', {data: pedidos[0], indexes: index, table: 'PedidoRafa', error: errorMessage});
        }).catch(err =>res.status(500).send('Something broke!,'+err));
}); 


routes.post('/envio', async(req, res) => {
    const { client_id, client_secret, redirect_uri } = req.body;
    let url = 'https://melhorenvio.com.br/oauth/authorize';
    let concatenatedString = '';
    controllerEnvio = new Envio({ client_id, client_secret, redirect_uri });

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

routes.post('/confirm/etiqueta', async(req, res) => {
    const { id } = req.body;
    const melhorEnvio = new envioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/checkout',{
            method: 'POST',
            headers: {
                "Accept": " application/json",
                "Authorization": bearerMelhorEnvio,
                "Content-Type": "application/json",
                "User-Agent": "Contatar servidorclientesaws@gmail.com",
            },
            body: JSON.stringify({
                "orders": [
                    id
                ]
            })
        });
    if(fetchres.ok){
        res.redirect('/admin/etiqueta');
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/etiqueta');
    }
});

routes.post('/delete/etiqueta', async(req, res) => {
    const { id } = req.body;
    const melhorEnvio = new envioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/cart/' + id,{
            method: 'DELETE',
            headers: {
                "Accept": " application/json",
                "Authorization": bearerMelhorEnvio,
                "Content-Type": "application/json",
                "User-Agent": "Contatar servidorclientesaws@gmail.com",
            }
        });
    if(fetchres.ok){
        res.redirect('/admin/etiqueta');
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/etiqueta');
    }
});

routes.post('/delete/paying', async(req, res) => {
    const { id } = req.body;
    const melhorEnvio = new envioDAO();

    console.log(id);

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/cancellable',{
        method: 'POST',
        headers: {
            "Accept": " application/json",
            "Authorization": bearerMelhorEnvio,
            "Content-Type": "application/json",
            "User-Agent": "Contatar servidorclientesaws@gmail.com",
        },
        body: JSON.stringify({
            "orders": [
                id
            ]
        })
    });
    let temp = await fetchres.json();
    if(fetchres.ok){
        //console.log(temp[`${id}`]);
        if(temp[`${id}`].cancellable == true){
            console.log('entrou');
            let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/cancel',{
                method: 'POST',
                headers: {
                    "Accept": " application/json",
                    "Authorization": bearerMelhorEnvio,
                    "Content-Type": "application/json",
                    "User-Agent": "Contatar servidorclientesaws@gmail.com",
                },
                body: JSON.stringify({
                    "order": {
                        "id": id,
                        "reason_id": "2",
                        "description": "Cancelamento de etiqueta"
                    }
                })
            });
            if(fetchres.ok){
                temp = await fetchres.json();
                //console.log(temp);
                res.redirect('/admin/paying');
            }else{
                req.flash('error', 'A etiqueta não pode ser cancelada!');
                res.redirect('/admin/paying');
            }
        }else{
            req.flash('error', 'A etiqueta não pode ser cancelada!');
            res.redirect('/admin/paying');
        }
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/paying');
    }
});

routes.post('/generate/paying', async(req, res) => {
    const { id } = req.body;
    const melhorEnvio = new envioDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/generate',{
            method: 'POST',
            headers: {
                "Accept": " application/json",
                "Authorization": bearerMelhorEnvio,
                "Content-Type": "application/json",
                "User-Agent": "Contatar servidorclientesaws@gmail.com",
            },
            body: JSON.stringify({
                "orders": [
                    id
                ]
            })
        });
    if(fetchres.ok){
        res.redirect('/admin/paying');
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/paying');
    }
});

routes.post('/print/paying', async(req, res) => {
    const { id, rasCode } = req.body;
    const melhorEnvio = new envioDAO();
    const transaction = new transactionDAO();

    let bearerMelhorEnvio = 'Bearer ';
    await melhorEnvio.buscaToken().then(bearer => {  bearerMelhorEnvio += bearer.access_token});

    let fetchres = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/print',{
            method: 'POST',
            headers: {
                "Accept": " application/json",
                "Authorization": bearerMelhorEnvio,
                "Content-Type": "application/json",
                "User-Agent": "Contatar servidorclientesaws@gmail.com",
            },
            body: JSON.stringify({
                "mode": "public",
                "orders": [
                    id
                ]
            })
        });
    if(fetchres.ok){
        let temp = await fetchres.json();

        //console.log(temp);
        //console.log(id);
        transaction.getCheckrefByTrackId({track_id: id}).then( async itens =>{
            transaction.update({id: itens.id, status: 'SEND'});
            const html = `
            <h1>Código de Rastreio</h1>
            <p>Seu código de rastreio é: ${rasCode}</p>
            `;
            if(typeof itens != 'undefined'){
                itens.forEach(async element => {
                    helper.sendEmail(element.email, 'Código de Rastreio', html, '');
                });
            }else{
                console.log('a transação' + id + 'não foi encontrada');
            }
        })


        res.redirect(temp.url);
    }else{
        req.flash('error', 'ID da etiqueta incorreto!');
        res.redirect('/admin/paying');
    }
});

module.exports = routes;