const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/userDAO.js');
const transactionDAO = require('../database/transactionDAO.js');
const refundDAO = require('../database/refoundDAO.js');
const commentDAO = require('../database/commentDAO.js');
const agendamentoDAO = require('../database/agendamentosDAO.js');

//Profile routes
routes.get('/account', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
});

routes.get('/request', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
});

routes.get('/comments/:check_ref/:idItem', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const transaction = new transactionDAO();
    const { check_ref, idItem } = req.params;
    let isEqual = false;

    transaction.like({check_ref: check_ref, idUser: req.user.id}).then( itens => {
        itens[0].shipping.forEach(item => {
            if(item.id == idItem){
                isEqual = true;
            }
        });
    }).finally(() => {
        if(isEqual){
            data = {
                idItem: idItem,
                check_ref: check_ref
            }
            res.render('comment', { data: data, user: req.user, error: errorMessage});
        }else{
            req.flash('error', 'Produto não encontrado!');
            res.redirect('/orders');
        }
    });
});

routes.post('/comments/add/:check_ref/:idItem', async(req, res) => {
    const errorMessage = req.flash('error');
    const transaction = new transactionDAO();
    const comments = new commentDAO();
    var { check_ref, idItem } = req.params;
    const { comment, rate } = req.body;
    let isEqual = false;

    transaction.like({check_ref: check_ref, idUser: req.user.id}).then( itens => {
        itens[0].shipping.forEach(item => {
            check_ref = itens[0].check_ref;
            if(item.id == idItem){
                isEqual = true;
            }
        });
    }).finally(() => {
        if(isEqual){
            comments.insert({check_ref: check_ref, idProduct: idItem, idUser: req.user.id, name: req.user.name, comment, rate}).then(() => {
                res.redirect(`/orders`)
            }).catch(err => {
                if(err.code == 'ER_DUP_ENTRY'){
                    comments.update({check_ref: check_ref, idItem: idItem, idUser: req.user.id, comment, rate}).then(() => { 
                        res.redirect(`/orders`);
                    })
                }else{
                    req.flash('error', 'Erro ao enviar comentario!');
                    res.redirect(`/orders`)
                }
            });
        }else{
            req.flash('error', 'Produto não encontrado!');
            res.redirect('/orders');
        }
    });
});

routes.get('/orders', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const trans = new transactionDAO();
    const ptTable = {
        'PENDING': 'Pendente',
        'PAID': 'Aprovado',
        'FAILED': 'Recusado',
        'FINISH': 'Entregue'
    }

    trans.findUser(req.user.id).then( orders => {
        orders.forEach(element => {
            element.status = ptTable[element.status];
        });
        res.render('orders', { user: req.user, orders: orders, error: errorMessage});
    });
});

routes.get('/orders/:check_ref', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const trans = new transactionDAO();
    const check_ref = req.params.check_ref;
    const idItem = req.params.idItem;
    const ptTable = {
        'PENDING': 'Pendente',
        'PAID': 'Aprovado',
        'FAILED': 'Recusado',
        'FINISH': 'Entregue'
    }

    trans.like({check_ref: check_ref, idUser: req.user.id }).then( orders => {
        orders.forEach(element => {
            element.status = ptTable[element.status];
        });
        res.render('orderInfo', { user: req.user, orders: orders, error: errorMessage});
    });
});

routes.get('/consultasAgendamento', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const agendamento = new agendamentoDAO();
    const ptTable = {
        'Pendente': 'PENDING',
        'Marcado': 'PAID',
        'Desmarcado': 'FAILED',
        'Finalizado': 'FINISH'
    }

    agendamento.findUser({idUser: req.user.id}).then( orders => {
        let temp = [];
        orders.forEach(element => {
            if(element.status != 'PENDING'){
                if(temp.length == 0){
                    temp.push(element)
                    temp.status = ptTable[element.status];
                }else{
                    let isEqual = false;
                    temp.forEach(item => {
                        if(item.check_ref == element.check_ref){
                            isEqual = true;
                        }
                    });
                    if(!isEqual){
                        temp.push(element)
                        temp.status = ptTable[element.status];
                    }
                }
            }
        });
        res.render('consultasorders', { user: req.user, orders: temp, error: errorMessage});
    });
});

routes.get('/consultasAgendamento/:check_ref', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const agend = new agendamentoDAO();
    const check_ref = req.params.check_ref;
    const idItem = req.params.idItem;
    const ptTable = {
        'PENDING': 'Pendente',
        'PAID': 'Pago',
        'FAILED': 'Recusado',
        'FINISH': 'Entregue'
    }

    agend.findCheck_ref({ idFuncionario: 1, check_ref: check_ref }).then( orders => {
        orders.forEach(element => {
            element.status = ptTable[element.status];
        });
            res.render('consultaAgendamentoInfo', { user: req.user, orders: orders, error: errorMessage});
    });
});

routes.get('/edit', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    
    res.render('editprofile', { user: req.user, error: errorMessage});
});

routes.post('/edit', helper.ensureAuthenticated, (req, res) => {
    const { name, lastname, email, cpf, tel, cep, adress, district, city, number } = req.body;
    const user = new userDAO();

    user.update({ name, lastname, email, cpf, tel, cep, adress, district, city, number, id: req.user.id }).then( itens =>{
        res.redirect('/account');
    }).catch(err => {
        req.flash('error', 'campo preenchido incorretamente!');
        res.redirect('/edit');
    });
});

routes.post('/refund', helper.ensureAuthenticated, async (req, res) => {
    const { check_ref } = req.body;
    const transaction = new transactionDAO();
    const refund = new refundDAO();

    //console.log(check_ref);

    transaction.like({check_ref: check_ref, idUser: req.user.id}).then( async itens =>{
        //console.log(itens);
        let fetchres = await fetch('https://api.sumup.com/v0.1/checkouts/' + itens[0].id,{
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + process.env.SUMUP_KEY,
            }
        });
        if(fetchres.ok){
            let data = await fetchres.json();
            //console.log(data);
            if(data.status == 'PAID'){
                refund.insert({idrefund: data.transaction_id, idUser: req.user.id, uuid_check_ref: data.checkout_reference, status: data.status}).then(()=>{
                    res.redirect(`/profile/orders/${check_ref.slice(0,10)}`)
                }).catch(err => {
                    req.flash('error', 'Requisição ja foi feita!');
                    res.redirect(`/profile/orders/${check_ref.slice(0,10)}`)
                });
            }else{
                req.flash('error', 'Transação ainda não aprovada!');
                res.redirect(`/profile/orders/${check_ref.slice(0,10)}`)
            }
        }
    }).catch(err => {
        console.log(err);
        req.flash('error', 'Transação ainda não aprovada!');
        res.redirect('/order');
    });
});

routes.get('/consultas', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    const transaction = new transactionDAO();
    const ptTable = {
        'PENDING': 'Pendente',
        'PAID': 'Aprovado',
        'FAILED': 'Recusado',
        'FINISH': 'Entregue'
    }

    transaction.findUser(req.user.id).then( orders => {
        orders.forEach(element => {
            element.status = ptTable[element.status];
        });
        res.render('consultas', { user: req.user, orders: orders, error: errorMessage});
    });
});

module.exports = routes;