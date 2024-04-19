const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/UserDAO.js');
const imageDAO = require('../database/imageDAO.js');
const itemDAO = require('../database/itemDAO.js');
const adminDAO = require('../database/adminDAO.js');
const commentDAO = require('../database/commentDAO.js');

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

    itens.insert({ name, qtd, price, descount, type, description, mRate, height, width, depth, weight }).then(()=>{
        res.redirect('/admin/products')}
    ).catch(err => {
        req.flash('error', 'Preenchido incorretamente!');
        res.redirect('/admin/admins');
    });
});
//delete products
routes.post('/delete/products', async (req, res) => {
    const { id } = req.body;
    const itens = new itemDAO();
    const images = new imageDAO();
    const comments = new commentDAO();

    try{
        await comments.deleteIdItem(id)
        await images.deleteIdItem(id)
        await itens.delete(id)
    }catch(err){
        req.flash('error', 'ID do produto incorreto!');
    }finally{
        res.redirect('/admin/products');
    }
});

//delete images
routes.post('/delete/images', (req, res) => {
    const { id } = req.body;
    const img = new imageDAO();

    img.delete(id).then(()=>{
        res.redirect('/admin/images')}
    ).catch(err => {
        req.flash('error', 'ID da imagem incorreto!');
        res.redirect('/admin/admins');
    });
});
//delete admins
routes.post('/delete/admins', (req, res) => {
    const { id } = req.body;
    const admin = new adminDAO();

    admin.delete(id).then(()=>{
        res.redirect('/admin/admins')}
    ).catch(err => {
        req.flash('error', 'ID do usuario incorreto!');
        res.redirect('/admin/admins');
    });
}); 
//delete users
routes.post('/delete/users', (req, res) => {
    const { id } = req.body;
    const user = new userDAO();

    req.flash('error', 'O usuario não pode ser deletado!');
    res.redirect('/admin/users');
});
//delete comments
routes.post('/delete/comments', (req, res) => {
    const { id } = req.body;
    const comments = new commentDAO();

    comments.delete(id).then(()=>{
        res.redirect('/admin/comments')}
    ).catch(err => {
        req.flash('error', 'ID do comentario incorreto!');
        res.redirect('/admin/comments');
    });
});

module.exports = routes;