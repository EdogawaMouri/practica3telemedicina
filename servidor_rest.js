var conexion = require("./conexion_mysql.js")
var express = require("express");
var jwt = require('jwt-simple');
var clave = 'miSecretoMasOscuro'; // clave para codificar / decodificar el token


var app = express(); // crear servidor express


var datosServidor= require("./datos.js");
var gestores=datosServidor.ges;
var sanitarios=datosServidor.san;
var ubicaciones=datosServidor.ubi;
var categorias=datosServidor.cat;
var modelos=datosServidor.mod;
var recursos=datosServidor.rec;
var reservas=datosServidor.resr;
var resenyas=datosServidor.resy;


app.use("/appCliente", express.static("cliente_rest")); 
app.use(express.json()); 

app.listen(3000, function(){console.log("Servidor escuchando en http://localhost:3000")} );


//SEGURIDAD CON TOKENS
app.post("/api/gestores/login", function (req, res) {

    var sql = "SELECT id FROM gestores WHERE usuario = ? AND password = ?";

    conexion.query(sql, [req.body.login, req.body.password], function (err, resultados) {

        if (err) {
            console.log("Error en MySQL:", err);
            return res.status(500).json("Error en la base de datos");
        }

        if (resultados.length == 1) {

            // Crear un token
            var contenido = {
                usuario: resultados[0].id,
                expira: Date.now() + 60 * 60 * 1000
            };

            var token = jwt.encode(contenido, clave);
            console.log("todo bien");

            res.status(201).json({
                id: resultados[0].id,
                token: token
            });

        } else {
            console.log("usuario mal");
            res.status(403).json("Usuario o contraseña incorrectos");
        }

    });
});

app.post("/api/gestores",function(req,res){
    var nuevo_gestor=req.body;//{nombre, apellidos, usuario, password}

    for(let i=0;gestores.length>i;i++){
        if(gestores[i].usuario=== nuevo_gestor.usuario){
            res.status(403).json({error:"El usuario ya existe"});
            return;
        }
    }

    var sql = "INSERT INTO gestores (id, nombre, apellidos, usuario, password) VALUES(null, '" + nuevo_gestor.nombre + "','" + nuevo_gestor.apellidos + "','"+ nuevo_gestor.usuario + "','"+ nuevo_gestor.password + "')";
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el insert", err);
            res.status(500).json("Error al realizar la insercion");
            return
        } else {
            console.log("Hospital insertado:", resultado);
            res.status(201).json(resultado.insertId);
            return
        }
    
    /**
    var id_max=0;
    for (let i=0; gestores.length>i;i++){
        if (gestores[i].id>id_max){
            id_max=gestores[i].id;
        }
    }
    var nuevo_id=id_max+1;
    nuevo_gestor.id=nuevo_id;
    gestores.push(nuevo_gestor);
    res.status(201).json({id:nuevo_gestor.id});
    */
});
});


// Antes de este use, los servicios son públicos (no necesitan token)
// Con esta función intermedia validamos el token. Si no es correcto terminamos con un error. Si es correcto continuamos.
app.use("/api", function (req, res, next) {
    var token = req.query.token; // obtengo el token de una query de la URL: http://MI_SERVIDOR/MI_RUTA?token=XXXXXXXX
    if (!token) { // no se ha pasado un token
        res.status(301).json("No se ha encontrado token");
        return;
    }

    // Decodificar el token
    try { // capturamos el error por si el token no es correcto
        var contenidoToken = jwt.decode(token, clave); // decodificamos el token para obtener su contenido con la misma clave que se codificó
    } catch (error) {
        res.status(301).json("El token es incorrecto");
        return;
    }
    console.log("El contenido del token es:", contenidoToken);

    // Validar el token
    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) { // validamos el formato del token
        res.status(301).json("El formato del token no es adecuado")
        return;
    }

    // Comprobar la fecha de expiración
    if (contenidoToken.expira < Date.now()) {
        res.status(301).json("El token ha expirado");
        return
    }
    // Todo ha ido bien. con next hago que express continue con el procesado
    next();
});
// Después de este use, los servicios son privados (necesitan el token)


//GET

    //PRÁCTICA 3
app.get("/api/ministerio", function(req,res){
    var datos = [];
    var sql = "SELECT * FROM reservas";
    conexion.query(sql, function (err, reservas) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Número reservas" + reservas.length); 

            //Filtro para v  er si no hay reservas
            if (reservas.length == 0) {
                return res.status(200).json(datos); 
            } 

            var completadas = 0;
            for (let i = 0; i<reservas.length;i++) {
                //console.log("Reserva actual:", i, reservas[i]);
                
                let nombre = "";
                let apellidos = "";
                let categoria = "";
                let horas_estimadas = String(reservas[i].horas_estimadas);
                let fec_pet = String(reservas[i].fecha_peticion);
                let fec_ini = String(reservas[i].fecha_inicio);
                let fec_fin = String(reservas[i].fecha_fin);

                //NOMBRE Y APELLIDO DEL SANITARIO
                var sql = "SELECT * from sanitarios where id = " + reservas[i].sanitario;
                conexion.query(sql, function (err, sanitarios) {
                    if (err) {
                        console.log("Error al realizar la select", err);
                        res.status(500).json("Error al realizar la consulta");
                    } else {
                        nombre = sanitarios[0].nombre;
                        apellidos = sanitarios[0].apellidos; 
                    }
                

                    //CATEGORIA DEL RECURSO DE LA RESERVA
                    var sql = "SELECT * from recursos r, modelos m, categorias c where r.id = " + reservas[i].recurso + " AND r.modelo = m.id AND m.categoria = c.id" ;
                    conexion.query(sql, function (err, categorias) {
                        if (err) {
                            console.log("Error al realizar la select", err);
                            res.status(500).json("Error al realizar la consulta");
                        } else {
                            categoria = categorias[0].nombre; 
                        }
                    

                        console.log(nombre, apellidos, categoria)
                        var dato = {
                            nombre : nombre, 
                            apellidos : apellidos,
                            categoría : categoria,
                            horas_estimadas :  horas_estimadas,
                            fec_pet : fec_pet, 
                            fec_ini : fec_ini,
                            fec_fin : fec_fin 
                        };
                        console.log("Reserva procesada:", i, dato);
                        datos[i] = dato;
                        completadas++;

                        if (completadas == reservas.length) {
                            console.log("Todas las reservas:", datos);
                            res.status(200).json(datos);
                        }
                    });
                });
            }
            
        }
    });
});


app.get("/api/ubicaciones", function(req,res){
    //res.status(200).json(ubicaciones);
    var sql = "SELECT * FROM ubicaciones";
    conexion.query(sql, function (err, ubicaciones) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Ubicaciones:", ubicaciones);
            res.json(ubicaciones);
        }
    });
});

app.get("/api/categorias",function(req,res){
    var sql = "SELECT * FROM categorias";
    conexion.query(sql, function (err, categorias) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Categorias:", categorias);
            res.json(categorias);
        }
    });
})
app.get("/api/modelos",function(req,res){
    var sql = "SELECT * FROM modelos";
    conexion.query(sql, function (err, modelos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Modelos:", modelos);
            res.json(modelos);
        }
    });
})

app.get("/api/gestores/:id", function(req,res){
    if (isNaN(req.params.id)){ //comprobar que el numero intoducido en un numero
        res.status(404).json({error:"No es un numero"});
        return
    }
    var id= parseInt(req.params.id);

    //var long_gestores = "SELECT COUNT(*) FROM gestores"; //longitud de gestores
    
    var sql = "SELECT * FROM gestores"; //es la orden que mi variable sql es un select de toda la tabla gestores
    console.log(sql);

    conexion.query(sql, function (err, gestores) { //enlazo mi variable sql con la tabla gestores y ahora trabajo con la tabla-variable gestores
        if (err) { //en caso de error
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else { // en caso de NO error
            console.log("Gestores:", gestores);
            console.log("Gestores:", gestores.length);
            console.log("id:", id);
            for (let i=0; gestores.length>i;i++){
                if(gestores[i].id===id){
                    var devolver={
                        id:gestores[i].id,
                        nombre:gestores[i].nombre,
                        apellidos:gestores[i].apellidos,
                        usuario:gestores[i].usuario
                    }
                    res.status(200).json(devolver);
                    return;
                }
            }
            res.status(404).json({error:"Error, usuario no encontrado"})
        }
    });

    
})

app.get("/api/sanitarios/:id",function(req,res){
    if (isNaN(req.params.id)){
        res.status(404).json({error:"No es un numero"});
        return;
    }
    var id= parseInt(req.params.id);

    var sql = "SELECT * FROM sanitarios";
    conexion.query(sql, function (err, sanitarios) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            for (let i=0;sanitarios.length>i;i++){
                if (sanitarios[i].id==id){
                    var devolver={
                        id:sanitarios[i].id,
                        nombre:sanitarios[i].nombre,
                        apellidos:sanitarios[i].apellidos,
                        usuario:sanitarios[i].usuario
                    }
                    res.status(200).json(devolver);
                    return
                }
            }
            res.status(404).json({error:"Usuario no encontrado"}) 
        }
    });

    
})

app.get("/api/recursos",function(req,res){
    var categoria= req.query.categoria;
    var modelo= req.query.modelo;
    var ubicacion= req.query.ubicacion;
    var estado= req.query.estado;
    var lista=[];

    var sql = "SELECT * FROM recursos";

    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            for (let i=0; recursos.length>i;i++){
                var cumple=true;
                var existe=false;
        
                if(modelo!=undefined && modelo!=recursos[i].modelo ){
                    cumple=false;
                }
                if(ubicacion!=undefined && ubicacion!=recursos[i].ubicacion){
                    cumple=false;
                }
                if(estado!=undefined && estado!=recursos[i].estado){
                    cumple=false;
                }
                if(categoria!=undefined){
                    for (let j=0;j<modelos.length;j++){
                        if (modelos[j].id==recursos[i].modelo){
                            existe=true;
                            if (modelos[j].categoria!=categoria){
                                cumple=false;
                            }
                            break;
                        }
                    }
                }
                else{
                    existe=true;
                }
                if (existe==false){
                    cumple=false;
                }
                if (cumple){
                    lista.push(recursos[i]);
                }
            }
            
            res.status(200).json(lista);

        }
    });


})

app.get("/api/recursos/:id",function(req,res){
    if (isNaN(req.params.id)){
        res.status(404).json({error:"error al introducir id"});
        return;
    }
    var id=parseInt(req.params.id);

    var sql = "SELECT * FROM recursos";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            for (let i=0;recursos.length>i;i++){
                if (recursos[i].id==id){
                    res.status(200).json(recursos[i])
                    return
                }
            }
            res.status(404).json({error:"error, id no encontrado"})
        }
    });

    
})

app.get("/api/recursos/:id/reservas", function(req, res) {  
    if (isNaN(req.params.id)) {
        res.status(404).json({error:"id invalido"});
        return;
    }

    var id = parseInt(req.params.id);
    var reservasRecurso=[];

    var sql = "SELECT * FROM recursos";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            for (var i = 0; i < reservas.length; i++) {
                if (reservas[i].recurso==id) {
                    var nombreSanitario = "-";
                    for (var j=0;j<sanitarios.length;j++) {
                        if (sanitarios[j].id==reservas[i].sanitario) {
                            nombreSanitario=sanitarios[j].nombre + " " + sanitarios[j].apellidos;
                            break;
                        }
                    }

                    reservasRecurso.push({
                        nombre_sanitario: nombreSanitario,
                        fecha_peticion: reservas[i].fecha_peticion,
                        fecha_inicio: reservas[i].fecha_inicio,
                        fecha_fin: reservas[i].fecha_fin,
                        horas_estimadas: reservas[i].horas_estimadas
                    });
                }
            }

            res.status(200).json(reservasRecurso);
        }
    });

    
});

app.get("/api/recursos/:id/resenyas", function(req, res) {
    if (isNaN(req.params.id)) {
        res.status(400).json({ error: "ID inválido" });
        return;
    }

    var id = parseInt(req.params.id);
    var resenyasRecurso = [];

    var sql = "SELECT * FROM recursos";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            for (var i = 0; i < resenyas.length; i++) {
                if (resenyas[i].recurso==id) {
                    var nombreSanitario="-";
                    for (var j = 0; j < sanitarios.length; j++) {
                        if (sanitarios[j].id == resenyas[i].sanitario) {
                            nombreSanitario = sanitarios[j].nombre + " " + sanitarios[j].apellidos;
                            break;
                        }
                    }

                    resenyasRecurso.push({
                        nombre_sanitario: nombreSanitario,
                        descripcion: resenyas[i].descripcion,
                        fecha: resenyas[i].fecha,
                        valor: resenyas[i].valor
                    });
                }
            }
            res.status(200).json(resenyasRecurso);
        }
    });

    
});

//POST menos login

app.post("/api/areas_salud", function(req, res){
    var nueva_area=req.body;
    //var nombre_gestor = nueva_area.gestor
    
    var sql = "SELECT * FROM areas_salud";  //orden para trabajar con la tabla areas_salud
    conexion.query(sql, function (err, areas_salud) { //nos enlazamos con la tabla areas_salud
        if (err) {
            console.log("Error al realizar el update", err);
            return res.status(500).json("Error al realizar la actualización"); //si hay un error enlazando me saca 
        } 

        for(let i=0;areas_salud.length>i;i++){
            if(areas_salud[i].codigo_postal=== nueva_area.codigo_postal){
                res.status(403).json({error:"El área de salud ya existe"});
                return;
            }
        }

        var sql = "INSERT INTO areas_salud (codigo_postal, nombre, gestor, sanitario) VALUES('" + nueva_area.codigo_postal + "','" + nueva_area.nombre + "','"+ nueva_area.gestor + "', null)";
        conexion.query(sql, function (err, resultado) {
            if (err) {
                console.log("Error al realizar el insert", err);
                res.status(500).json("Error al realizar la insercion");
                return
            } else {
                console.log("Área de salud insertada:", resultado);
                res.status(201).json(resultado.insertId);
                return
            }


        });
    });
});


app.post("/api/recursos",function(req,res){
    var nuevoRecurso= req.body; // modelo, ubicacion, numero_serie, estado

    var sql = "INSERT INTO recursos (id, modelo, ubicacion, numero_serie, estado) VALUES(null, '" + nuevoRecurso.modelo + "','" + nuevoRecurso.ubicacion + "','" + nuevoRecurso.numero_serie + "','" + nuevoRecurso.estado + "')";

    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el insert", err);
            res.status(500).json("Error al realizar la insercion");
        } else {
            console.log("Recurso insertado:", resultado);
            res.status(201).json(resultado.insertId);
        }
    });
    
    /** 
    var maxid=0;
    for (let i=0;recursos.length>i;i++){
        if (recursos[i].id>=maxid){
            maxid=recursos[i].id;
            maxid=maxid+1;
        }
    }
    nuevoRecurso.id=maxid;
    recursos.push(nuevoRecurso);
    res.status(201).json({id:nuevoRecurso.id});
    */
})

//PUT

app.put("/api/gestores/:id",function(req,res){
    if(isNaN(req.params.id)){ //comprobar que sí es un numero
        res.status(404).json({error:"No es un numero"});
        return
    }
    var sql = "SELECT * FROM gestores";  //orden para trabajar con la tabla gestores
    conexion.query(sql, function (err, gestores) { //nos enlazamos con la tabla gestores
        if (err) {
            console.log("Error al realizar el update", err);
            return res.status(500).json("Error al realizar la actualización"); //si hay un error enlazando me saca 
        } 
            
        var id= parseInt(req.params.id); //variable del id del gestor a modificar
        //var nombre= req.body.nombre;
        //var apellidos= req.body.apellidos;
        var usuario=req.body.usuario; 
        var gestorEncontrado = false;
        //var password=req.body.password;  
        for (let i=0;i<gestores.length;i++){
            if (gestores[i].id===id){ //bucle para buscar el gestor
                gestorEncontrado = true; //si es el gestor que busco continuo
                for (let j=0;j<gestores.length;j++){ //bucle para comprobar que el usuario que cambio no esté repetido
                    if (gestores[j].usuario==usuario && gestores[j].id!=id){
                        res.status(403).json({error:"error, usuario repetido"}) //si está repetido me da error
                        return
                    }
                }
                    /*gestores[i].nombre=nombre;
                    gestores[i].apellidos=apellidos;
                    gestores[i].usuario=usuario;
                    gestores[i].password=password;*/
                var sqlUpdate = "UPDATE gestores SET nombre = '"    //orden para hacer un insert en la tabla gestores
                + req.body.nombre + "', apellidos = '"
                + req.body.apellidos + "', usuario = '"
                + req.body.usuario + "', password = '"
                + req.body.password + "' WHERE id = " + req.params.id;

                conexion.query(sqlUpdate, function (err, resultado) { //enlazo mi insert con mi tabla gestores
                if (err) {
                    console.log("Error al realizar el update", err);
                    res.status(500).json("Error al realizar la actualización");
                    return //si hay algún error enlazando me da error
                } else {
                    console.log("Gestor actualizado:", resultado); //mi tabla actualixada correctamente
                    res.status(200).json({
                        id: parseInt(req.params.id),
                        nombre: req.body.nombre,
                        apellidos: req.body.apellidos,
                        usuario: req.body.usuario,
                        password: req.body.password
                    });
                    return
                }
                });
            }
    
        }
    });

    
    
  
})

app.put("/api/recursos/:id",function(req,res){
    if (isNaN(req.params.id)){
        res.status(404).json({error:"Erros, id incorrecto"})
        return;
    }

    var sqlUpdate = "UPDATE recursos SET modelo = '"    //orden para hacer un insert en la tabla recursos
        + req.body.modelo + "', ubicacion = '"
        + req.body.ubicacion + "', numero_serie = '"
        + req.body.numero_serie + "', estado = '"
        + req.body.estado + "' WHERE id = " + req.params.id;
    
    conexion.query(sqlUpdate, function (err, resultado) { //enlazo mi insert con mi tabla recursos
        if (err) {
            console.log("Error al realizar el update", err);
            res.status(500).json("Error al realizar la actualización");
            return //si hay algún error enlazando me da error
        } else {
            console.log("Recurso actualizado:", resultado); //mi tabla actualizada correctamente
            res.status(200).json("Recurso actualizado")
            return
        }
        });
        /** 
    for (let i=0;i<recursos.length;i++){
        if (recursos[i].id==id){
            recursos[i].modelo=modelo;
            recursos[i].ubicacion=ubicacion;
            recursos[i].numero_serie=numero_serie;
            recursos[i].estado=estado;
            res.status(200).json(recursos[i]);
            return;
        }
            */
    })

//DELETE

app.delete("/api/recursos/:id",function(req,res){
    if (isNaN(req.params.id)){
        res.status(404).json({error:"Error, id no es un numero"})
        return;
    }

    var id= req.params.id;

    var sql = "DELETE FROM recursos WHERE id = " + req.params.id;
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el delete", err);
            res.status(500).json("Error al realizar el borrado");
        } else {
            for(let i=0;recursos.length>i;i++){
                if (recursos[i].id==id){
                    recursos.splice(i,1);
                    console.log("Hospital borrado:", resultado);
                    res.status(200).json({mensaje:"Elemento eliminado"})
                    return;
                }
            }
            res.status(404).json({error:"Error, id no encontrado"})
        }
    });

    
})

