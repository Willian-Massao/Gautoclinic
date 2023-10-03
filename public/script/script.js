// Função para criar produtos e as divs das classes se necessário
function createProduct(Name, Price, Img, Class, Id, isOnly) {
    // criar div por classe
    if(document.getElementById(Class) == null){
        $("main").append(`
        <div class="product-container${isOnly ? "-only": ""}" id="${Class}">
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
    addProduct(Name, Price, Img, Class, Id, isOnly ? true : false);
}
function addProduct(Name, Price, Img, Class, Id, isOnly){
    $(`#${Class}`).children(".scroll-effect").children(`.product-cards-cotainer${isOnly ? "-only": ""}`)
    .append(`
    <a class="product-cards${isOnly ? "-only": ""}" href="/product/${Id}">
            <div class="img-container">
                <img src="/${Img}" alt="">
            </div>
            <div class="product-price">
                <p class="price">${Price}</p>
                <p class="name">${Name}</p>
            </div>
            <button class="product-button">Adicionar</button>
            </a>
            `)
}
function addLittleCar(){
    let isInside = false;
    let index = 0;
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

//  function createProductOnly(Name, Price, Img, Class, Id) {
//      // criar div por classe
//      if(document.getElementById(Class) == null){
//          $("main").append(`
//          <div class="product-container-only" id="${Class}">
//              <div class="product-text">
//                  <a href="/section/${Class}"><h3>${Class}</h3></a>
//              </div>
//              <div class="scroll-effect">
//                  <div class="product-cards-cotainer-only">
//                  </div>
//          </button>
//              </div>
//          </div>`
//          );
//      }
//      addProductOnly(Name, Price, Img, Class, Id);
//  }
//  function addProduct(Name, Price, Img, Class, Id){
//      $(`#${Class}`).children(".scroll-effect").children(".product-cards-cotainer")
//      .append(`
//          <a class="product-cards" href="/product/${Id}">
//              <div class="img-container">
//                  <img src="/${Img}" alt="">
//              </div>
//              <div class="product-price">
//                  <p class="price">${Price}</p>
//                  <p class="name">${Name}</p>
//              </div>
//              <button class="product-button">Adicionar</button>
//          </a>
//      `)
//  }
//  function addProductOnly(Name, Price, Img, Class, Id){
//      $(`#${Class}`).children(".scroll-effect").children(".product-cards-cotainer-only")
//      .append(`
//          <a class="product-cards-only" href="/product/${Id}">
//              <div class="img-container">
//                  <img src="/${Img}" alt="">
//              </div>
//              <div class="product-price">
//                  <p class="price">${Price}</p>
//                  <p class="name">${Name}</p>
//              </div>
//              <button class="product-button">Adicionar</button>
//          </a>
//      `)
//  }