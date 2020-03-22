// Carga de modulos necesarios y creación de nueva aplicacion.
var express 	= require("express"); 
var app 	= express();
var bodyParser 	= require('body-parser');
var request 	= require("request");
const path = require('path');
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

//Declaramos las carpetas de los elementos
const IMG_DIR = __dirname + '/assets/img/';
const CSS_DIR = __dirname + '/assets/css/';
const JS_DIR = __dirname + '/js/';

app.use('/img', express.static(IMG_DIR));
app.use('/css', express.static(CSS_DIR));
app.use('/js', express.static(JS_DIR));

//Declaramos la variable que se utilizara para buscar y resultado de busqueda
var variable;
var busqueda;
var categoria;

//Creamos y declaramos vista del home
app.get('/',function(req, res){
	res.sendFile(__dirname + '/home.html');
  });

//Creamos nuestra API Search
app.use('/api/search', function(req, res) {

	//Definimos la URL de búsqueda
	var url = 'https://api.mercadolibre.com/sites/MLA/search?q='+ req.url + '&sort=id';
	var r = null;
	
	//Hacemos el post y almacenamos en JSON
	if(req.method === 'POST') {
		r = request.post({uri: url, json: req.body});
	} else {
		r = request(url);
	}

	req.pipe(r).pipe(res);
});

//Creamos nuestra API Items
app.use('/api/items', function(req, res) {

	//Itera los parámetros de búsqueda (Nombre de variable y el Valor de la misma).
	var searchParams = new URLSearchParams(req.url);
	for (let r of searchParams) {
		busqueda = r[1];
	}
	for(var s of searchParams.keys()) {
		variable = s;
	}

	//Definimos la URL de búsqueda
	var url 	= `https://api.mercadolibre.com/items?ids=${busqueda}`
	var r = null;

	//Hacemos el post y almacenamos en JSON
	if(req.method === 'POST') {
		r = request.post({uri: url, json: req.body});
	} else {
		r = request(url);
	}

	req.pipe(r).pipe(res);
});

//Creamos y declaramos vista de resultados búsqueda get
app.get('/search',function(req,res){

	//Itera los parámetros de búsqueda (Nombre de variable y el Valor de la misma).
	var searchParams = new URLSearchParams(req.url);
	for (let r of searchParams) {
		busqueda = r[1];
	}
	for(var s of searchParams.keys()) {
		variable = s;
	}

	//Esta variable es la URL del servidor
	var hosturl = req.protocol + '://' + req.get('host');
	//Esta variable es la URL del servidor + el texto ingresado en el campo de búsqueda
	var url = `${hosturl}/api/search?${busqueda}`
	//Hacemos la petición para buscar los resultados según lo escrito en el buscador
 	request({
		url: url,
		json: true
 	}, 
 
 	function (error, response, body) {

	//If para comprobar que el link ingresado sea correcto y no de errores de variables inexistentes al hacer la petición
	if(s != '/search?q' || body.paging.total <= 0 || body.paging.total == undefined)
	{
		res.end('La pagina no existe\nFormato de ejemplo: /search?q=Producto');
		return 1;
	}

	//Comprueba si existe la categoría en la búsqueda realizada (Caso contrario queda en blanco)
	 if(body.filters[0] !== undefined)
	 {
	 	categoria = body.filters[0].values[0].path_from_root[0].name;
	 }

	 //If para comprobar que se envien bien los datos
	 if (!error && response.statusCode === 200) {
		res.render("productos", {
		//Pasamos las variables necesarias a la vista Productos
		id: [body.results[0].id, body.results[1].id, body.results[2].id, body.results[3].id],
		ubicacion: [body.results[0].address.state_name, body.results[1].address.state_name, body.results[2].address.state_name, body.results[3].address.state_name],
		titulo: [body.results[0].title, body.results[1].title, body.results[2].title, body.results[3].title],
		imagen: [body.results[0].thumbnail, body.results[1].thumbnail, body.results[2].thumbnail, body.results[3].thumbnail],
		precio: [body.results[0].price, body.results[1].price, body.results[2].price, body.results[3].price],
		filtrar: [categoria],
		vendidos: [body.results[0].sold_quantity, body.results[1].sold_quantity, body.results[2].sold_quantity, body.results[3].sold_quantity],
		search: busqueda
	 });
	}
  })
});

//Creamos y declaramos vista de busqueda post
app.post('/search',function(req,res){

   //Obtiene el texto ingresado en el campo de busqueda
    var q = req.body.q;
	//Esta variable trae la URL del servidor
	var hosturl = req.protocol + '://' + req.get('host');
	//Esta variable es la URL del servidor + el texto ingresado en el campo de búsqueda
	var url = `${hosturl}/api/search?${q}`
	//Hacemos la petición para buscar los resultados según lo escrito en el buscador
	request({
		url: url,
		json: true
	}, 
	
	function (error, response, body) {

	//Verificamos que haya aunque sea un resultado en la búsqueda, sino retorna error 404
	if(body.paging.total <= 0 || body.paging.total == undefined)
	{
		return res.sendfile("404.html");
	}

	//Comprueba si existe la categoría en la búsqueda realizada (Caso contrario queda en blanco)
	if(body.filters[0] !== undefined)
	{
		categoria = body.filters[0].values[0].path_from_root[0].name;
	}

	//If para comprobar que el link ingresado sea correcto y no de errores de variables inexistentes al hacer la petición
	if(body.paging.total <= 0 || body.paging.total == undefined)
	{
		res.end('La pagina no existe\nFormato de ejemplo: /search?q=Producto');
		return 1;
	}

	//If para comprobar que se envien bien los datos
	if (!error && response.statusCode === 200) {
		res.render("productos", {
		//Pasamos las variables necesarias a la vista Productos
		id: [body.results[0].id, body.results[1].id, body.results[2].id, body.results[3].id],
		ubicacion: [body.results[0].address.state_name, body.results[1].address.state_name, body.results[2].address.state_name, body.results[3].address.state_name],
		titulo: [body.results[0].title, body.results[1].title, body.results[2].title, body.results[3].title],
		imagen: [body.results[0].thumbnail, body.results[1].thumbnail, body.results[2].thumbnail, body.results[3].thumbnail],
		precio: [body.results[0].price, body.results[1].price, body.results[2].price, body.results[3].price],
		filtrar: [categoria],
		vendidos: [body.results[0].sold_quantity, body.results[1].sold_quantity, body.results[2].sold_quantity, body.results[3].sold_quantity],
		search: q
	});
   }
  })
});


//Creamos y declaramos vista de items
app.get('/items', function(req, res) {

	//Itera los parámetros de búsqueda (Nombre de variable y el Valor de la misma).
	var searchParams = new URLSearchParams(req.url);
	for (let r of searchParams) {
		busqueda = r[1];
	}
	for(var s of searchParams.keys()) {
		variable = s;
	}

	//Esta variable trae la URL del servidor
	var hosturl = req.protocol + '://' + req.get('host');
	//Esta variable es la URL del servidor + el texto ingresado en el campo de búsqueda
	var url = `${hosturl}/api/items?ids=${busqueda}`
	//Hacemos la petición para buscar los resultados según lo escrito en el buscador
	request({
		url: url,
		json: true
	}, 

	function (error, response, body) {

	//If para comprobar que el link ingresado sea correcto y no de errores de variables inexistentes al hacer la petición
	if(s != '/items?id')
	{
		res.end('La pagina no existe\nFormato de ejemplo: /items?id=MLA836471436');
		return 1;
	}
	if(body[0].code != 200)
	{
		res.end('El ID al que quieres ingresar no existe');
		return 1;
	}

	//Limitamos el numero de imagenes a 3 como máximo
	var imagenes = new Array();  
	let conteo = 0;
	while(conteo < 4)
	{
		if(body[0].body.pictures[conteo] !== undefined)
		{
		var total_imgs = conteo;
		imagenes[total_imgs] = body[0].body.pictures[conteo].url;
		}
		conteo++;
	}
	
	//If para comprobar que se envien bien los datos
	if (!error && response.statusCode === 200) {
		res.render("detalles", {
		//Pasamos las variables necesarias a la vista Detalles
		title: [body[0].body.title],
		precio: [body[0].body.price],
		thumbnail: imagenes,
		total_img: total_imgs,
		shipping: [body[0].body.shipping.free_shipping],
		condicion: [body[0].body.condition],
		cantidad: [body[0].body.available_quantity],
		ventas: [body[0].body.sold_quantity],
		atributos: [body[0].body.attributes[0].name, body[0].body.attributes[1].name, body[0].body.attributes[2].name,body[0].body.attributes[3].name, body[0].body.attributes[4].name, body[0].body.attributes[5].name],
		atributosvalue: [body[0].body.attributes[0].values[0].name, body[0].body.attributes[1].values[0].name, body[0].body.attributes[2].values[0].name, body[0].body.attributes[3].values[0].name, body[0].body.attributes[4].values[0].name, body[0].body.attributes[5].values[0].name]
	});
   }
  })
})

//Declaramos el puerto de la app en el 4444 y enviamos mensaje de inicio por consola
var server = app.listen(4444, function () {
    console.log('Iniciando servidor..'); 
});