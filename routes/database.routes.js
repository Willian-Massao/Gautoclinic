const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/UserDAO.js');
const imageDAO = require('../database/imageDAO.js');
const itemDAO = require('../database/itemDAO.js');
const adminDAO = require('../database/adminDAO.js');

routes.post('/add/images', helper.upload.single('image') ,async (req, res) => {
    const img = new imageDAO();
    let { idItem } = req.body;
    const image = await helper.removeFile('./public/products/' + req.file.filename);

    img.insert({idproduct: idItem, image: image}).then(
        res.redirect('/admin/images')
    ).catch(err => {
        req.flash('error', 'Preenchido incorretamente!');
        res.redirect('/admin/images');
    });
});
routes.post('/add/admins', (req, res) => {
    const { id, name } = req.body;
    const admin = new adminDAO();

    admin.insert({ id, name }).then(()=>{
        res.redirect('/admin/products');
    }).catch(err => {
        req.flash('error', 'ID do usuario incorreto!');
        res.redirect('/admin/admins');
    });
});
routes.post('/add/products', (req, res) => {
    const { name, qtd, price, descount, type, description, mRate, height, width, depth, weight } = req.body;
    const itens = new itemDAO();
    console.log(req.body);

    itens.insert({ name, qtd, price, descount, type, description, mRate, height, width, depth, weight }).then(()=>{
        res.redirect('/admin/products')}
    ).catch(err => {
        req.flash('error', 'Preenchido incorretamente!');
        res.redirect('/admin/admins');
    });
});

module.exports = routes;