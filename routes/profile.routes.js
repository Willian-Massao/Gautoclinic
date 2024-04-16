const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/UserDAO.js');
const transactionDAO = require('../database/transactionDAO.js');

//Profile routes
routes.get('/account', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
});

routes.get('/request', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
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
        res.render('orderinfo', { user: req.user, orders: orders, error: errorMessage});
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

module.exports = routes;