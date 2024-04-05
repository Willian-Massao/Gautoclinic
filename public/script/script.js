let item;
let products = [];

sleep(300).then(() => {
    refreshCar()
});

function getItem(){
    if(localStorage.getItem("item") != null){
        item = localStorage.getItem("item");
        item = JSON.parse(item);
    }else{
        item = [];
    }
    return item;
}

function format(mask, number) {
    var s = ''+number, r = '';
    for (var im=0, is = 0; im<mask.length && is<s.length; im++) {
      r += mask.charAt(im)=='X' ? s.charAt(is++) : mask.charAt(im);
    }
    return r;
}    

function createProduct(Name, Price, Img, Class, Id, isOnly) {
    // criar div por classe
    if(document.getElementById(Class.replaceAll(" ", "_")) == null){
        $("main").append(`
        <div class="product-container${isOnly ? "-only": ""}" id="${Class.replaceAll(" ", "_")}">
            <div class="product-text">
                <p class="product-class">${Class}${Class[Class.length-1] == "s" ? "" : "s"}</p>
                <a href="/section/${Class}"><h3>Veja Mais</h3></a>
            </div>
            <div class="scroll-effect">
                <button onclick="scrollR('${Class}')"><i class="fi fi-rr-angle-left"></i></button>
                <div class="product-cards-cotainer${isOnly ? "-only": ""}">
                </div>
                <button onclick="scrollL('${Class}')"><i class="fi fi-rr-angle-right"></i>
        </button>
            </div>
        </div>`
        );
    }
    //  isOnly ? addProductOnly(Name, Price, Img, Class, Id) : addProduct(Name, Price, Img, Class, Id);
    addProduct(Name, Price, Img, Class, Id, isOnly ? true : false);
}

function addProduct(Name, Price, Img, Class, Id, isOnly){
    $(`#${Class.replaceAll(" ", "_")}`).children(".scroll-effect").children(`.product-cards-cotainer${isOnly ? "-only": ""}`)
    .append(`
    <a class="product-cards${isOnly ? "-only": ""}" href="/product/${Id}">
            <div class="img-container">
                <img src="/${Img}" alt="">
            </div>
            <div class="product-price">
                <p class="price">R$ ${Price}</p>
                <p class="name">${Name}</p>
            </div>
            <button class="product-button">Adicionar</button>
            </a>
            `)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function refreshCar(){
    let price = 0;
    let item = getItem();


    item.forEach(i => {
        price += i.qtd * i.price;
    });

    document.getElementById("littlecar").innerHTML = "Seu carrinho<br>R$ " + price.toFixed(2);
}

function addLittleCar(){
    let isInside = false;
    let index = 0;
    let item = getItem();

    item.findIndex(function(x, i){
        if(x.id == window.location.href.split("/")[4]){
            isInside = true;
            index = i;
        }
    });
    if(!isInside){
        item.push({
            id: window.location.href.split("/")[4],
            name: document.getElementById("name-info").innerText,
            price: document.getElementById("price-info").innerText.replace("R$ ",""),
            section: 'facial',
            img: document.getElementById("img-info").src,
            qtd: 1
        });
    }else{
        item[index].qtd += 1
    }
    localStorage.setItem("item", JSON.stringify(item));
    refreshCar();
}

function scrollL(father){
    $(`#${father}`)
    .children(".scroll-effect")
    .children(".product-cards-cotainer").scrollLeft($(`#${father}`)
    .children(".scroll-effect")
    .children(".product-cards-cotainer").scrollLeft() + 150);
}

function scrollR(father){
    $(`#${father}`)
    .children(".scroll-effect")
    .children(".product-cards-cotainer").scrollLeft($(`#${father}`)
    .children(".scroll-effect")
    .children(".product-cards-cotainer").scrollLeft() - 150);
}

function validarEnd(){
    validarEmpty("end");
}

function validarPasswd(){
    validarEmpty("password");
}

function validarEmpty(target){
    let val = document.getElementsByName(target)[0].value;
    isValid(val != "", target);
    return (val != "");
}

function validarName(){
    var regName = /\b[A-Za-zÀ-ú][A-Za-zÀ-ú]+,?\s[A-Za-zÀ-ú][A-Za-zÀ-ú]{2,19}\b/gi;
    var name = document.getElementsByName('name')[0].value;
    isValid(regName.test(name), "name");
    return regName.test(name);
}

function validarEmail(){
    let email = document.getElementsByName("email")[0].value;
    var regName = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    isValid(regName.test(email), "email");
    return regName.test(email);
}

function validarPhone() {
    let phone = document.getElementsByName("tel")[0].value;
    var regex = new RegExp(/^[\+]?[(]?[0-9]{2}[)]?[-\s\.]?[0-9]{4,5}[-\s\.]?[0-9]{4}$/im);
    isValid(regex.test(phone), "tel");
    return regex.test(phone);
}

function validarCpf() {
    let val = document.getElementsByName("cpf")[0].value;
    if (val.length >= 11 && val.length <= 14) {
        var cpf = val.trim();
     
        cpf = cpf.replace(/\./g, '');
        cpf = cpf.replace('-', '');
        cpf = cpf.split('');
        
        var v1 = 0;
        var v2 = 0;
        var aux = false;
        
        for (var i = 1; cpf.length > i; i++) {
            if (cpf[i - 1] != cpf[i]) {
                aux = true;   
            }
        } 
        
        if (aux == false) {
            isValid(false, "cpf"); 
            return false; 
        } 
        
        for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
            v1 += cpf[i] * p; 
        } 
        
        v1 = ((v1 * 10) % 11);
        
        if (v1 == 10) {
            v1 = 0; 
        }
        
        if (v1 != cpf[9]) {
            isValid(false, "cpf"); 
            return false; 
        } 
        
        for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
            v2 += cpf[i] * p; 
        } 
        
        v2 = ((v2 * 10) % 11);
        
        if (v2 == 10) {
            v2 = 0; 
        }
        
        if (v2 != cpf[10]) {
            isValid(false, "cpf"); 
            return false;
        } else {   
            isValid(true, "cpf"); 
            return true;
        }
    }else{
        isValid(false, "cpf");
        return false;
    }
}

function isValid(val, input){
    if(val){
        document.getElementsByName(input)[0].style.border = "none";
        document.getElementsByName(input)[0].style.boxShadow = "none";
    }else{
        document.getElementsByName(input)[0].style.border = "thin solid red";
        document.getElementsByName(input)[0].style.boxShadow = "0px 0px 2px 1px red";
    }
}

function validarCard(){
    //pegar valor do <input name="card">
    let val = document.getElementsByName("card")[0].value;
    val = val.replace(/\D/g, '');
    let sum = 0;
    let debug = "";
    if(typeof(coisa) == "number"){
        val = String(val);
    }

    for(let i = 0; i < val.length; i++){
        if((i)%2 != 0){
            debug += String(val[i]);
            sum += Number(val[i]);
        }else{
            if(val[i]*2 > 9){
                val[i] = String((val[i]*2)-9);
                debug += String((val[i]*2)-9);
                sum += Number((val[i]*2)-9);
            }else{
                val[i] = String(val[i]*2);
                debug += String(val[i]*2);
                sum += Number(val[i]*2);
            }
        }
    }

    if(sum%10 == 0){
        document.getElementById("error").textContent = "";
    }else{
        document.getElementById("error").textContent = "x Numero de cartão inválido";
        document.getElementById("error").style.color = "red";
    }
}

function makeList(){
    
    //criar um json com os produtos
    for(let i = 0; i < document.getElementsByClassName("img-container").length-1; i++){
        let img_temp = document.getElementsByClassName("img-container")[i].firstElementChild.src;
        let name_temp = document.getElementsByClassName("name")[i].innerText;
        let price_temp = document.getElementsByClassName("price")[i].innerText;
        let href_temp = document.getElementsByClassName("product-cards")[i].href;
        products.push({img_temp, name_temp, price_temp, href_temp});
    }
    
    if(products.length != 0){
        localStorage.setItem("products", JSON.stringify(products));
        console.log("localstorage criado!!");
    }

}

//carregar uma função dps q a pagina carregar usando jquery
$(document).ready(function(){
    makeList();
});

function makeListAppear(){
    let search_string = document.getElementById("search").value;
    let result = products.filter(product => product.name_temp.toLowerCase().includes(search_string.toLowerCase()));

    //se a variavel products estiver vazia, preenchela com a do localstorage
    if(products.length == 0){
        products = JSON.parse(localStorage.getItem("products"));
    }

    document.getElementById("search-result").style.display = "unset";

    if(search_string == ""){
        document.getElementById("search-list").innerHTML = "";
        document.getElementById("search-result").style.display = "none";
    }else{
        document.getElementById("search-list").innerHTML = "";
        result.forEach(product => {
            document.getElementById("search-list").innerHTML += `
            <li>
                <a href="${product.href_temp}">
                    <div class="search-list-container">
                        <div class="search-list-img-container">
                            <img src="${product.img_temp}" class="search-list-img"></img>
                        </div>
                        <p class="search-list-p">${product.name_temp}</p>
                    </div>
                </a>
            </li>`;
        });
    }
}