const routes = require('express').Router();
const helper = require('../helpers/helper');

//Profile routes
routes.get('/account', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
});

routes.get('/request', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');

    res.render('profile', { user: req.user, error: errorMessage});
});

routes.get('/edit', helper.ensureAuthenticated, (req, res) => {
    const errorMessage = req.flash('error');
    
    res.render('profile', { user: req.user, error: errorMessage});
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