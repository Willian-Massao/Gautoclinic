// Função para criar produtos e as divs das classes se necessário
function createProduct(productName, productPrice, productImg, productClass, productId) {
    // criar div por classe
    if(document.getElementById(productClass) == null){
        $("main").append(`
        <div class="product-container" id="${productClass}">
            <div class="product-text">
                <h3>${productClass}</h3>
                <a href="/section/${productClass}"><h3>Veja Mais</h3></a>
            </div>
            <div class="scroll-effect">
                <button onclick="scrollR('${productClass}')"><i class="fi fi-rr-angle-left"></i></button>
                <div class="product-cards-cotainer">
                </div>
                <button onclick="scrollL('${productClass}')"><i class="fi fi-rr-angle-right"></i>
        </button>
            </div>
        </div>`
        );
    }
    addProduct(productName, productPrice, productImg, productClass, productId);
}
function createProductOnly(productName, productPrice, productImg, productClass, productId) {
    // criar div por classe
    if(document.getElementById(productClass) == null){
        $("main").append(`
        <div class="product-container-only" id="${productClass}">
            <div class="product-text">
                <a href="/section/${productClass}"><h3>${productClass}</h3></a>
            </div>
            <div class="scroll-effect">
                <div class="product-cards-cotainer-only">
                </div>
        </button>
            </div>
        </div>`
        );
    }
    addProductOnly(productName, productPrice, productImg, productClass, productId);
}
function addProduct(productName, productPrice, productImg, productClass, productId){
    $(`#${productClass}`).children(".scroll-effect").children(".product-cards-cotainer")
    .append(`
        <a class="product-cards" href="/product/${productId}">
            <div class="img-container">
                <img src="/${productImg}" alt="">
            </div>
            <div class="product-price">
                <p class="price">${productPrice}</p>
                <p class="name">${productName}</p>
            </div>
            <button class="product-button">Adicionar</button>
        </a>
    `)
}
function addProductOnly(productName, productPrice, productImg, productClass, productId){
    $(`#${productClass}`).children(".scroll-effect").children(".product-cards-cotainer-only")
    .append(`
        <a class="product-cards-only" href="/product/${productId}">
            <div class="img-container">
                <img src="/${productImg}" alt="">
            </div>
            <div class="product-price">
                <p class="price">${productPrice}</p>
                <p class="name">${productName}</p>
            </div>
            <button class="product-button">Adicionar</button>
        </a>
    `)
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