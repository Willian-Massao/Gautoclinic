let item;

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

function createProduct(Name, Price, Img, Class, Id, isOnly) {
    // criar div por classe
    if(document.getElementById(Class.replaceAll(" ", "_")) == null){
        $("main").append(`
        <div class="product-container${isOnly ? "-only": ""}" id="${Class.replaceAll(" ", "_")}">
            <div class="product-text">
                <p class="product-class">${Class}s</p>
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
    console.log(Name, Price, Img, Class, Id);
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
    let qtdP = 0;
    let item = getItem();

    item.forEach(i => {
        qtdP += parseInt(i.qtd);
    });

    document.getElementById("littlecar").innerHTML = qtdP + "<br>produto(s)";
}

function addLittleCar(){
    let isInside = false;
    let index = 0;
    let item = getItem();

    item.findIndex(function(x, i){
        if(x.id == window.location.href.split("/")[4]){
            isInside = true;
            console.log(i);
            index = i;
        }
    });
    if(!isInside){
        item.push({
            id: window.location.href.split("/")[4],
            name: document.getElementById("name-info").innerText,
            price: document.getElementById("preco-info").innerText.replace("R$ ",""),
            section: document.getElementById("sec-info").innerText,
            img: document.getElementById("img-info").src.split("/")[4],
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