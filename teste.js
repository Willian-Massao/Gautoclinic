const userDAO = require("./database/userDAO.js");
const itemDAO = require("./database/itemDAO.js");
const cardDAO = require("./database/cardDAO.js");
const commentDAO = require("./database/commentDAO.js");
const imageDAO = require("./database/imageDAO.js");

// cria tabela
const users = new userDAO();
const itens = new itemDAO();
const cards = new cardDAO();
const comments = new commentDAO();
const images = new imageDAO();

async function teste() {
    let res = await itens.query('SELECT P.name, P.qtd, P.price, P.descount, P.description, P.mRate, I.id as idImage, I.image, C.id as idComment, C.rate, C.nameUser, C.comment from gauto.itens P inner join gauto.images I on I.idProduct = P.id inner join gauto.comments C on C.idProduct = P.id');

    let temp = {
        name: res[0].name,
        qtd: res[0].qtd,
        price: res[0].price,
        descount: res[0].descount,
        description: res[0].description,
        mRate: res[0].mRate,
        images: [],
        comments: []
    };

    res.forEach((element) => {
        if(temp.images.length == 0 || temp.images[temp.images.length - 1].id != element.idImage){
            temp.images.push({
                id: element.idImage,
                image: element.image
            });
        }

        if(temp.comments.length == 0 || temp.comments[temp.comments.length - 1].id != element.idComment){
            temp.comments.push({
                id: element.idComment,
                rate: element.rate,
                nameUser: element.nameUser,
                comment: element.comment
            });
        }
    });

    return temp;
}
teste().then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
});