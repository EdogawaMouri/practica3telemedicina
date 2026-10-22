document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("miBoton").addEventListener("click", () => {
    if (conexion) {
        conexion.close();
        conexion = null;
        document.getElementById("cuerpoAvisos").innerHTML = "";
    }
  });
});

var anterior="A"
var recursoActivoId = null;
var usuarioActivoId= null;
var token = null;

var conexion=null;

document.getElementById("botonAnalisis").addEventListener("click", function() {
    // MIS RESERVAS
    rest.get(`/api/ministerio?token=${encodeURIComponent(token)}`, function(estado,respuesta) {
        if (estado==200){
            var info = respuesta;
            console.log("info", info);
    
            var fecha = new Date().toLocaleDateString("en-CA");
            console.log(fecha)

            rest.post("https://undefined.ua.es/telemedicina/api/datos",{id_area : 1, fecha : fecha, datos : info},function(estado, respuesta){
                console.log("Estado del POST:", estado);
                console.log("Respuesta del POST:", respuesta);

                if (estado == 200 || estado == 201) {
                    console.log("Subido correctamente");
                } else {
                    console.log("Error al subir los datos");
                }
            });
        } else {
            console.log("Error al obtener reservas:", estado);
            console.log("Respuesta:", respuesta);
        }
    
        // TODAS LAS RESERVAS
        rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado,respuesta) {
            console.log("Estado del GET externo:", estado);
            console.log("Datos del servidor externo:", respuesta);

            if (estado == 200) {
                console.log("GET externo correcto");
                var ranking = [
                    {nombre : "Alergología", votos : 0},
                    {nombre : "Anestesiología", votos : 0}, 
                    {nombre : "Cardiología", votos : 0},
                    {nombre : "Cirugía General", votos : 0},
                    {nombre : "Dermatología", votos : 0},
                    {nombre : "Aparato Digestivo", votos : 0},
                    {nombre : "Endocrinología", votos : 0},
                    {nombre : "Ginecología", votos : 0},
                    {nombre : "Hematología", votos : 0},
                    {nombre : "Medicina Interna", votos : 0},
                    {nombre : "Neumología", votos : 0},
                    {nombre : "Neurología", votos : 0},
                    {nombre : "Oftalmología", votos : 0},
                    {nombre : "Oncología", votos : 0},
                    {nombre : "Pediatría", votos : 0},
                    {nombre : "Psiquiatría", votos : 0},
                    {nombre : "Traumatología", votos : 0},
                    {nombre : "Urología", votos : 0}
                ]

                //Recuento de reservas por area
                for (let i = 0; i < respuesta.length; i++){
                    let id = respuesta[i].id_area;  //id del aarea
                    
                    //COMPROBACIONES 
                    // Si el ID no es válido, saltamos a la siguiente area
                    if (!Number.isInteger(id) || id < 1 || id > ranking.length) {
                        continue;
                    }

                    // Comprobar que los datos son un array
                    if (!Array.isArray(respuesta[i].datos)) {
                        continue;
                    }
                    

                    let total = respuesta[i].datos.length; // nº reservas por area

                    ranking[id-1].votos += total;
                }

                //Ordenar ranking por votos
                ranking.sort(function(a, b) {
                    return b.votos - a.votos;
                });


                //Pintar ranking
                var tabla = document.getElementById("cuerpoRanking");
                tabla.innerHTML = "";

                    // MOSTRAR SOLO LAS 5 PRIMERAS ÁREAS
                for (let i = 0; i < 5; i++) {

                    let posicion = i+1;
                    let nombre = ranking[i].nombre;
                    let total = ranking[i].votos;

                    let fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${posicion}</td>
                        <td>${nombre}</td>
                        <td>${total}</td>
                    `;

                    tabla.appendChild(fila)
                    }




            } else {
                console.log("Error al obtener los datos externos:", estado);
            }
        });
    });
    
    
})

function cargarFiltros() {
    // Categorías
    rest.get(`/api/categorias?token=${encodeURIComponent(token)}`, function(estado,respuesta) {
        if (estado==200){
            let select = document.getElementById("filtroCategoria");
            select.innerHTML= '<option value="">Todos</option>';
            for (let i=0;i<respuesta.length;i++){
                let opt = document.createElement("option");
                opt.value = respuesta[i].id;
                opt.textContent = respuesta[i].nombre;
                select.appendChild(opt);
            }
            console.log("modelos cargadaos")

        }
    });

    // Modelos
    rest.get(`/api/modelos?token=${encodeURIComponent(token)}`, function(estado, respuesta) {
        console.log("modelos hola")
        if (estado==200){
            console.log(respuesta.length)
            let select= document.getElementById("filtroModelo");
            select.innerHTML = '<option value="">Todos</option>';
            for (let i=0;i<respuesta.length;i++){
                let opt=document.createElement("option");
                opt.value=respuesta[i].id;
                opt.textContent=respuesta[i].nombre;
                select.appendChild(opt);
            }
            console.log("modelos cargadaos")
        }
    });

    // Ubicaciones
    rest.get(`/api/ubicaciones?token=${encodeURIComponent(token)}`, function(estado,respuesta) {
        if (estado==200){
            let select=document.getElementById("filtroUbicacion");
            select.innerHTML='<option value="">Todos</option>';
            for (let i=0;i<respuesta.length;i++){
                let opt=document.createElement("option");
                opt.value=respuesta[i].id;
                opt.textContent=respuesta[i].nombre;
                select.appendChild(opt);
            }
        }
    });
}

/**
function cargarTablaRecursos() {
    let categoria = document.getElementById("filtroCategoria").value;
    let modelo = document.getElementById("filtroModelo").value;
    let ubicacion = document.getElementById("filtroUbicacion").value;
    let estado = document.getElementById("filtroEstado").value;

    let url = `/api/recursos?`;
    if (categoria) url += `categoria=${categoria}&`;
    if (modelo) url += `modelo=${modelo}&`;
    if (ubicacion) url += `ubicacion=${ubicacion}&`;
    if (estado !== "") url += `estado=${estado}&`;
    url += `token=${encodeURIComponent(token)}`;
    console.log(url)

    rest.get(url, function(estadoReq, recursos) {
        if (estadoReq==200) {
            let tabla=document.getElementById("tablaRecursos");
            tabla.innerHTML= `
                <tr>
                    <th>N. Serie</th>
                    <th>Categoría</th>
                    <th>Modelo</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            `;

            for (let i=0;i<recursos.length; i++) {
                let r=recursos[i];

                // Obtener modelo y categoría
                rest.get(`/api/modelos?token=${encodeURIComponent(token)}`, function(eMod, modelos) {
                    let modeloR="-";
                    let categoriaR= "-";
                    for (let j=0; j<modelos.length; j++) {
                        if (modelos[j].id==r.modelo) {
                            modeloR=modelos[j].nombre;
                            categoriaR=modelos[j].categoria;
                            break;
                        }
                    }
                });

                // Obtener nombre de categoría
                rest.get(`/api/categorias?token}`, function(eCat, categorias) {
                    var catNombre= "-";
                    for (let k = 0; k < categorias.length; k++) {
                        if (categorias[k].id==categoriaR) {
                            catNombre=categorias[k].nombre;
                            break;
                        }
                    }
                });

                // Obtener ubicación
                rest.get(`/api/ubicaciones?token=${encodeURIComponent(token)}`, function(eUbi, ubicaciones) {
                    let ubicNombre = "-";
                    for (let l = 0; l < ubicaciones.length; l++) {
                        if (ubicaciones[l].id==r.ubicacion) {
                            ubicNombre = ubicaciones[l].nombre;
                            break;
                        }
                    }
                });

                let fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${r.numero_serie}</td>
                    <td>${catNombre}</td>
                    <td>${modeloR}</td>
                    <td>${ubicNombre}</td>
                    <td>${r.estado==0?"Operativo":"No operativo"}</td>
                    <td>
                        <button id="ficha${r.id}">Abrir</button>
                        <button id="borrar${r.id}">X</button>
                        
                    </td>
                `;
                tabla.appendChild(fila);

                document.getElementById(`borrar${r.id}`).addEventListener("click", function() {
                    if (!confirm("¿Seguro que quieres borrar este recurso?")) return;
                    rest.delete(`/api/recursos/${r.id}?token=${encodeURIComponent(token)}`, function(estadoDel, resp) {
                        if (estadoDel == 200) {
                            alert("Recurso eliminado");
                            cargarTablaRecursos(); // recarga la tabla
                        } else {
                            alert("Error al eliminar recurso");
                        }
                    });
                });

                document.getElementById(`ficha${r.id}`).addEventListener("click", function() {
                    recursoActivoId=r.id;
                    document.getElementById("inicio").style.display="none";
                    document.getElementById("ficha").style.display="block";
                    cargarFichaRecurso();

                });
            }
        } 
    });
}
*/


function cargarTablaRecursos() {
    let categoria = document.getElementById("filtroCategoria").value;
    let modelo = document.getElementById("filtroModelo").value;
    let ubicacion = document.getElementById("filtroUbicacion").value;
    let estado = document.getElementById("filtroEstado").value;

    let url = `/api/recursos?`;
    if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;
    if (modelo) url += `modelo=${encodeURIComponent(modelo)}&`;
    if (ubicacion) url += `ubicacion=${encodeURIComponent(ubicacion)}&`;
    if (estado !== "") url += `estado=${encodeURIComponent(estado)}&`;
    url += `token=${encodeURIComponent(token)}`;

    rest.get(url, function(estadoReq, recursos) {
        if (estadoReq != 200) {
            console.log("Error al cargar recursos:", estadoReq);
            return;
        }

        // Obtener modelos
        rest.get(`/api/modelos?token=${encodeURIComponent(token)}`, function(eMod, modelos) {
            if (eMod != 200) {
                console.log("Error al cargar modelos:", eMod);
                return;
            }

            // Obtener categorías
            rest.get(`/api/categorias?token=${encodeURIComponent(token)}`, function(eCat, categorias) {
                if (eCat != 200) {
                    console.log("Error al cargar categorías:", eCat);
                    return;
                }

                // Obtener ubicaciones
                rest.get(`/api/ubicaciones?token=${encodeURIComponent(token)}`, function(eUbi, ubicaciones) {
                    if (eUbi != 200) {
                        console.log("Error al cargar ubicaciones:", eUbi);
                        return;
                    }

                    let tabla = document.getElementById("tablaRecursos");

                    tabla.innerHTML = `
                        <tr>
                            <th>N. Serie</th>
                            <th>Categoría</th>
                            <th>Modelo</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    `;

                    for (let i = 0; i < recursos.length; i++) {
                        let r = recursos[i];

                        let modeloR = "-";
                        let categoriaR = null;
                        let catNombre = "-";
                        let ubicNombre = "-";

                        // Buscar el modelo del recurso
                        for (let j = 0; j < modelos.length; j++) {
                            if (modelos[j].id == r.modelo) {
                                modeloR = modelos[j].nombre;
                                categoriaR = modelos[j].categoria;
                                break;
                            }
                        }

                        // Buscar el nombre de la categoría
                        for (let k = 0; k < categorias.length; k++) {
                            if (categorias[k].id == categoriaR) {
                                catNombre = categorias[k].nombre;
                                break;
                            }
                        }

                        // Buscar el nombre de la ubicación
                        for (let l = 0; l < ubicaciones.length; l++) {
                            if (ubicaciones[l].id == r.ubicacion) {
                                ubicNombre = ubicaciones[l].nombre;
                                break;
                            }
                        }

                        let fila = document.createElement("tr");

                        fila.innerHTML = `
                            <td>${r.numero_serie}</td>
                            <td>${catNombre}</td>
                            <td>${modeloR}</td>
                            <td>${ubicNombre}</td>
                            <td>${r.estado == 0 ? "Operativo" : "No operativo"}</td>
                            <td>
                                <button id="ficha${r.id}">Abrir</button>
                                <button id="borrar${r.id}">X</button>
                            </td>
                        `;

                        tabla.appendChild(fila);

                        // Botón borrar
                        document.getElementById(`borrar${r.id}`).addEventListener("click", function() {
                            if (!confirm("¿Seguro que quieres borrar este recurso?")) return;

                            rest.delete(`/api/recursos/${r.id}?token=${encodeURIComponent(token)}`, function(estadoDel, resp) {
                                if (estadoDel == 200) {
                                    alert("Recurso eliminado");
                                    cargarTablaRecursos();
                                } else {
                                    alert("Error al eliminar recurso");
                                }
                            });
                        });

                        // Botón abrir ficha
                        document.getElementById(`ficha${r.id}`).addEventListener("click", function() {
                            recursoActivoId = r.id;

                            document.getElementById("inicio").style.display = "none";
                            document.getElementById("ficha").style.display = "block";

                            cargarFichaRecurso();
                        });
                    }
                });
            });
        });
    });
}

            
// APARTADO A
document.getElementById("botonRegistro").addEventListener("click",function(){
    anterior="A"
    document.getElementById("usuario").value="";
    document.getElementById("password").value="";

    document.getElementById("acceso").style.display="none";
    document.getElementById("registro").style.display="block"
    
})

document.getElementById("botonLogin").addEventListener("click",function(){
    anterior="A"
    var usuario= document.getElementById("usuario").value;
    var password= document.getElementById("password").value;
    
    if (usuario==""||password==""){
        alert("Introduce usuario y contrasenya");
        return;
    }

    rest.post("/api/gestores/login",{login: usuario, password: password},function(estado, respuesta){
        if (estado==403){
            alert("Error/Datos incorrectos")
        }
        else if(estado==201){
            console.log("login correcto")
            console.log(respuesta.id)
            var usuario_activo=respuesta.id;
            token = respuesta.token;

            rest.get(`/api/gestores/${usuario_activo}?token=${encodeURIComponent(token)}`, function(estado, respuesta) {
                console.log(`/api/gestores/${usuario_activo}?token=${encodeURIComponent(token)}`);
                console.log("Estado de la segunda petición:", estado);
                console.log("Datos recibidos:", respuesta);
                if (estado==404){
                    alert ("Error con el id")
                }
                else if (estado==200){
                    usuarioActivoId = respuesta.id;
                    document.getElementById("usuario_activo").textContent= "Bienvenido "+respuesta.nombre+" "+ respuesta.apellidos;
                    document.getElementById("usuario").value="";
                    document.getElementById("password").value="";
                    document.getElementById("acceso").style.display="none";
                    document.getElementById("inicio").style.display="block";
                    cargarFiltros();
                    conexion = new WebSocket("ws://localhost:4444", "rpc");
                    conexion.addEventListener("open", function () {
                        console.log("Conectado");
                        conexion.send(JSON.stringify({
                            operacion: "identificar",
                            id: usuarioActivoId,
                            tipo: "gestor",
                            nombre: respuesta.nombre + " " + respuesta.apellidos
                        }));
                        eventosWS();
                    });
                    

                }
            
            
            
            })
            
        }

    })
})

//APARTADO B
document.getElementById("botonVolverLogin").addEventListener("click", function() {
    // Limpiar formulario
    document.getElementById("usuarioRegistro").value= "";
    document.getElementById("passwordRegistro").value= "";
    document.getElementById("nombreRegistro").value= "";
    document.getElementById("apellidosRegistro").value= "";

    document.getElementById("registro").style.display="none";

    if (anterior=="inicio") {
        document.getElementById("inicio").style.display= "block";
    } else {
        document.getElementById("acceso").style.display= "block";
    }
});


document.getElementById("botonRegistrar").addEventListener("click", function() {
    var nombre = document.getElementById("nombreRegistro").value;
    var apellidos = document.getElementById("apellidosRegistro").value;
    var usuario = document.getElementById("usuarioRegistro").value;
    var password = document.getElementById("passwordRegistro").value;

    if (!nombre || !apellidos || !usuario || !password) {
        alert("Completa todos los campos");
        return;
    }

    if (usuarioActivoId) {
        // Editar usuario existente
        rest.put(`/api/gestores/${usuarioActivoId}?token=${encodeURIComponent(token)}`, {
            nombre: nombre,
            apellidos: apellidos,
            usuario: usuario,
            password: password}, function(estado, respuesta) {
            if (estado==200) {
                alert("Datos actualizados");
                document.getElementById("registro").style.display="none";
                document.getElementById("inicio").style.display="block";
                document.getElementById("usuario_activo").textContent="Bienvenido " + respuesta.nombre + " " + respuesta.apellidos;        
                cargarFiltros();
                
            } else {
                alert("Error al actualizar datos");
            }
        });
    } else {
        // Registro normal
        rest.post("/api/gestores", {
            nombre: nombre,
            apellidos: apellidos,
            usuario: usuario,
            password: password
        }, function(estado, respuesta) {
            if (estado == 403) {
                alert("El usuario ya existe");
            } 
            else if (estado == 201) {
                alert("Registro completado");
                document.getElementById("registro").style.display = "none";
                document.getElementById("acceso").style.display = "block";
            } 
            else {
                alert("Error inesperado: " + estado);
            }
        });
    }
});

//APARTADO C
document.getElementById("buscarRecursos").addEventListener("click", cargarTablaRecursos);

document.getElementById("editarDatos").addEventListener("click", function() {
    if (!usuarioActivoId) {
        alert("No hay usuario activo");
        return;
    }

    anterior = "inicio"; // Para volver a inicio
    document.getElementById("inicio").style.display="none";
    document.getElementById("registro").style.display="block";

    // Cargar datos del usuario activo
    rest.get(`/api/gestores/${usuarioActivoId}`, function(estado, respuesta) {
        if (estado == 200) {
            document.getElementById("nombreRegistro").value=respuesta.nombre;
            document.getElementById("apellidosRegistro").value=respuesta.apellidos;
            document.getElementById("usuarioRegistro").value=respuesta.usuario;
            document.getElementById("passwordRegistro").value="";
        } else {
            alert("Error cargando datos del usuario");
        }
    });

});

//crear area nueva
document.getElementById("botonArea").addEventListener("click", function() {
    var codigo_postal = parseInt(document.getElementById("codigo_postal").value);
    var nombre = document.getElementById("nombre_area").value;
    var gestor = 1;
    console.log(codigo_postal)
    console.log(nombre)
    console.log(gestor)
    rest.post(`/api/areas_salud?token=${encodeURIComponent(token)}`, {
        codigo_postal: codigo_postal, 
        nombre: nombre, 
        gestor:gestor}, function(estado, respuesta){
            if (estado == 403) {
                    alert("El área ya existe");
                } 
                else if (estado == 201) {
                    alert("Área completada");
                } 
                else {
                    alert("Error inesperado: " + estado);
                }

        });
    });

document.getElementById("salir").addEventListener("click", function() {
    // Limpiar formulario de login
    document.getElementById("usuario").value="";
    document.getElementById("password").value="";

    document.getElementById("inicio").style.display="none";
    document.getElementById("acceso").style.display="block";

    // Limpiar usuario activo
    document.getElementById("usuario_activo").textContent="";
    usuarioActivoId=null;

    // Reiniciar tabla 
    document.getElementById("tablaRecursos").innerHTML=`
        <tr>
            <th>N. Serie</th>
            <th>Categoría</th>
            <th>Modelo</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Acciones</th>
        </tr>
    `;
    if (conexion) {
        conexion.close();
        conexion = null;
        document.getElementById("cuerpoAvisos").innerHTML = "";
    }
});

function cargarFichaRecurso() {

    if (!recursoActivoId) return;

    rest.get(`/api/recursos/${recursoActivoId}?token=${encodeURIComponent(token)}`, function(estado, recurso) {

        if (estado==200) {

            let div = document.getElementById("ficha");

            div.innerHTML = `
                <h2>Recurso ${recurso.numero_serie}</h2>

                <h3>Datos recurso</h3>

                <label>Categoría:</label>
                <select id="fCategoria"></select><br>

                <label>Modelo:</label>
                <select id="fModelo"></select><br>

                <label>Nº Serie:</label>
                <input type="text" id="fNumero" value="${recurso.numero_serie}"><br>

                <label>Ubicación:</label>
                <select id="fUbicacion"></select><br>

                <label>Estado:</label>
                <select id="fEstado">
                    <option value="0" ${recurso.estado==0?"selected":""}>Operativo</option>
                    <option value="1" ${recurso.estado==1?"selected":""}>No operativo</option>
                </select><br><br>

                <button id="guardarRecurso">Guardar</button>
                <button id="volverInicio">Volver</button>

                <h3>Reseñas</h3>
                <table id="tablaResenyas">
                    <tr>
                        <th>Usuario</th>
                        <th>Comentario</th>
                    </tr>
                </table>

                <h3>Reservas</h3>
                <table id="tablaReservas">
                    <tr>
                        <th>Usuario</th>
                        <th>Fecha inicio</th>
                        <th>Fecha fin</th>
                    </tr>
                </table>
            `;
            cargarModelos(recurso.modelo);
            cargarUbicaciones(recurso.ubicacion);
            cargarCategorias(recurso.categoria);
            cargarReservas();
            cargarResenyas();

            document.getElementById("volverInicio").addEventListener("click", function() {
                document.getElementById("ficha").style.display = "none";
                document.getElementById("inicio").style.display = "block";
            });

            document.getElementById("guardarRecurso").addEventListener("click", function() {

                let numero = document.getElementById("fNumero").value;
                let modelo = document.getElementById("fModelo").value;
                let ubicacion = document.getElementById("fUbicacion").value;
                let estadoNuevo = document.getElementById("fEstado").value;
                let categoria = document.getElementById("fCategoria").value;

                rest.put(`/api/recursos/${recursoActivoId}?token=${encodeURIComponent(token)}`, {
                    numero_serie: numero,
                    modelo: modelo,
                    ubicacion: ubicacion,
                    categoria: categoria,
                    estado: estadoNuevo
                }, function(est, resp) {
                    if (est==200) {
                        alert("Recurso actualizado");
                        cargarTablaRecursos();
                    } else {
                        alert("Error actualizando recurso");
                    }
                });

            });

        } else {
            alert("Error cargando recurso");
        }

    });

}

function cargarModelos(modeloActual) {

    rest.get(`/api/modelos?token=${encodeURIComponent(token)}`, function(estado, modelos) {

        if (estado==200) {

            let select=document.getElementById("fModelo");
            select.innerHTML= "";

            for (let i=0; i<modelos.length; i++) {

                let option= document.createElement("option");
                option.value= modelos[i].id;
                option.textContent= modelos[i].nombre;

                if (modelos[i].id==modeloActual) {
                    option.selected=true;
                }

                select.appendChild(option);
            }
        }

    });

}

function cargarUbicaciones(ubicacionActual) {

    rest.get(`/api/ubicaciones?token=${encodeURIComponent(token)}`, function(estado, ubicaciones) {

        if (estado==200) {

            let select= document.getElementById("fUbicacion");
            select.innerHTML= "";

            for (let i=0; i<ubicaciones.length; i++) {

                let option=document.createElement("option");
                option.value=ubicaciones[i].id;
                option.textContent=ubicaciones[i].nombre;

                if (ubicaciones[i].id==ubicacionActual) {
                    option.selected=true;
                }

                select.appendChild(option);
            }
        }

    });

}

function cargarCategorias(categoriaActual) {

    rest.get(`/api/categorias?token=${encodeURIComponent(token)}`, function(estado, categorias) {

        if (estado==200) {

            let select=document.getElementById("fCategoria");
            select.innerHTML= "";

            for (let i=0; i<categorias.length; i++) {

                let option=document.createElement("option");
                option.value=categorias[i].id;
                option.textContent=categorias[i].nombre;

                if (categorias[i].id==categoriaActual) {
                    option.selected=true;
                }

                select.appendChild(option);
            }
        }

    });

}
function cargarResenyas() {

    rest.get(`/api/recursos/${recursoActivoId}/resenyas?token=${encodeURIComponent(token)}`, function(estado, resenyas) {

        if (estado==200) {

            let tabla=document.getElementById("tablaResenyas");
            tabla.innerHTML = `
                <tr>
                    <th>Sanitario</th>
                    <th>Comentario</th>
                    <th>Valoración</th>
                    <th>Fecha</th>
                </tr>
            `;

            for (let i=0; i<resenyas.length; i++) {

                let fila = document.createElement("tr");

                // Formatear fecha 
                let fecha = new Date(resenyas[i].fecha);
                let fechaStr = fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();
                fila.innerHTML = `
                    <td>${resenyas[i].nombre_sanitario}</td>
                    <td>${resenyas[i].descripcion}</td>
                    <td>${resenyas[i].valor}</td>
                    <td>${fechaStr}</td>
                `;

                tabla.appendChild(fila);
            }
        }

    });
}

function cargarReservas() {

    rest.get(`/api/recursos/${recursoActivoId}/reservas?token=${encodeURIComponent(token)}`, function(estado, reservas) {

        if (estado==200) {

            let tabla = document.getElementById("tablaReservas");
            tabla.innerHTML = `
                <tr>
                    <th>Sanitario</th>
                    <th>Fecha petición</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Horas estimadas</th>
                </tr>
            `;

            const ahora = new Date();

            for (let i=0;i<reservas.length; i++) {

                let fila=document.createElement("tr");

                let fechaPeticion=new Date(reservas[i].fecha_peticion);
                let fechaInicio=reservas[i].fecha_inicio ? new Date(reservas[i].fecha_inicio) : null;
                let fechaFin=reservas[i].fecha_fin ? new Date(reservas[i].fecha_fin) : null;
                let horasEstimadas=reservas[i].horas_estimadas;

               
                let color = "#ffffff"; // blanco 
                if (!fechaInicio) {
                    color = "#b3ffb3"; // verde pastel, pendiente
                } else if (fechaFin && fechaFin < ahora) {
                    color = "#ffffff"; // blanco, finalizada
                } else if (fechaInicio && (!fechaFin || fechaFin > ahora)) {
                    const finEstimado = new Date(fechaInicio.getTime() + horasEstimadas * 60 * 60 * 1000);
                    if (ahora > finEstimado) {
                        color = "#ffb3b3"; // rojo pastel, sobrepasado
                    } else {
                        color = "#b3d9ff"; // azul pastel, en uso
                    }
                }

                fila.style.backgroundColor = color;

                fila.innerHTML = `
                    <td>${reservas[i].nombre_sanitario}</td>
                    <td>${fechaPeticion.toLocaleDateString()} ${fechaPeticion.toLocaleTimeString()}</td>
                    <td>${fechaInicio ? fechaInicio.toLocaleDateString() + " " + fechaInicio.toLocaleTimeString() : "-"}</td>
                    <td>${fechaFin ? fechaFin.toLocaleDateString() + " " + fechaFin.toLocaleTimeString() : "-"}</td>
                    <td>${horasEstimadas}</td>
                `;

                tabla.appendChild(fila);
            }
        }

    });
}

document.getElementById("anadirRecurso").addEventListener("click", function() {
    recursoActivoId = null; 
    document.getElementById("inicio").style.display = "none";
    document.getElementById("ficha").style.display = "block";
    let div = document.getElementById("ficha");
    div.innerHTML = `
        <h2>Nuevo Recurso</h2>

        <h3>Datos recurso</h3>

        <label>Categoría:</label>
        <select id="fCategoria"></select><br>

        <label>Modelo:</label>
        <select id="fModelo"></select><br>

        <label>Nº Serie:</label>
        <input type="text" id="fNumero" value=""><br>

        <label>Ubicación:</label>
        <select id="fUbicacion"></select><br>

        <label>Estado:</label>
        <select id="fEstado">
            <option value="0">Operativo</option>
            <option value="1">No operativo</option>
        </select><br><br>

        <button id="guardarRecurso">Guardar</button>
        <button id="volverInicio">Volver</button>
    `;

    document.getElementById("volverInicio").addEventListener("click", function() {
        document.getElementById("ficha").style.display = "none";
        document.getElementById("inicio").style.display = "block";
    });

    cargarCategorias(null);
    cargarModelos(null);
    cargarUbicaciones(null);

    document.getElementById("guardarRecurso").addEventListener("click", function() {
        let numero = document.getElementById("fNumero").value.trim();
        let modelo = parseInt(document.getElementById("fModelo").value);
        let ubicacion = parseInt(document.getElementById("fUbicacion").value);
        let estadoNuevo = parseInt(document.getElementById("fEstado").value);
        let categoria = parseInt(document.getElementById("fCategoria").value);

        if (!numero || !modelo || !ubicacion || !categoria) {
            alert("Completa todos los campos");
            return;
        }

        rest.post(`/api/recursos?token=${encodeURIComponent(token)}`, {
            numero_serie: numero,
            modelo: modelo,
            ubicacion: ubicacion,
            categoria: categoria,
            estado: estadoNuevo
        }, function(estado, resp) {
            if (estado==201) {
                alert("Recurso creado");
                document.getElementById("ficha").style.display = "none";
                document.getElementById("inicio").style.display = "block";
                cargarTablaRecursos();
                rest.get(`/api/modelos?token=${encodeURIComponent(token)}`, function(estado,respuesta){
                    if (estado==200){
                        for (let i=0;i<respuesta.length;i++){
                            if (respuesta[i].id==modelo){
                                modelows=respuesta[i].nombre;
                                break;
                            }
                        }
                        rest.get(`/api/categorias?token=${encodeURIComponent(token)}`, function(estado,respuesta){
                            if (estado==200){
                                for (let j=0;j<respuesta.length;j++){
                                    if (respuesta[j].id==categoria){
                                        categoriaws=respuesta[j].nombre;
                                        break;
                                    }
                                }
                                conexion.send(JSON.stringify({
                                    operacion: "nueva_reserva",
                                    categoria: categoriaws,
                                    modelo: modelows,
                                    numero_serie: numero,
                                }));
                            }
                        });
                    }
                });

            } 
            else if (estado==403) {
                alert("El número de serie ya existe");
            } 
            else {
                alert("Error al crear recurso: " + estado);
            }
        });
    });
});

   
    
function eventosWS() {
    conexion.addEventListener("message", function (msg) {
        console.log("Mensaje recibido del servidor:", msg.data);
        msg = JSON.parse(msg.data); // pasar cadena a objeto
        switch (msg.operacion) {
            case "nueva_resenya":
                var tbody = document.getElementById("cuerpoAvisos");

                var tr = document.createElement("tr");
                tr.style.backgroundColor = "green";
                tr.style.color = "white";

                var tdFecha = document.createElement("td");
                tdFecha.textContent = msg.fecha;

                var tdOrigen = document.createElement("td");
                tdOrigen.textContent = msg.origen;

                var tdTexto = document.createElement("td");
                tdTexto.textContent =
                    `SE HA CREADO UNA RESEÑA PARA ${msg.categoria} ` +
                    `MODELO ${msg.modelo} ` +
                    `CON CÓDIGO ${msg.codigo} ` +
                    `Y PUNTUACIÓN ${msg.puntuacion}`;

                tr.appendChild(tdFecha);
                tr.appendChild(tdOrigen);
                tr.appendChild(tdTexto);

                tbody.appendChild(tr);

                break;
            case "nueva_reserva":
                var tbody = document.getElementById("cuerpoAvisos");

                var tr = document.createElement("tr");
                tr.style.backgroundColor = "blue";
                tr.style.color = "white";

                var tdFecha = document.createElement("td");
                tdFecha.textContent = msg.fecha;

                var tdOrigen = document.createElement("td");
                tdOrigen.textContent = msg.origen;

                var tdTexto = document.createElement("td");
                tdTexto.textContent =
                    `SE HA CREADO UNA RESERVA PARA ${msg.categoria} ` +
                    `MODELO ${msg.modelo} ` +
                    `CON NÚMERO DE SERIE ${msg.numero_serie}`;

                tr.appendChild(tdFecha);
                tr.appendChild(tdOrigen);
                tr.appendChild(tdTexto);

                tbody.appendChild(tr);
                break;
            case "iniciarReserva":
                var tbody = document.getElementById("cuerpoAvisos");

                var tr = document.createElement("tr");
                tr.style.backgroundColor = "red";
                tr.style.color = "white";

                var tdFecha = document.createElement("td");
                tdFecha.textContent = msg.fecha;

                var tdOrigen = document.createElement("td");
                tdOrigen.textContent = msg.origen;

                var tdTexto = document.createElement("td");
                tdTexto.textContent =
                    `SE HA INICIADO UNA RESERVA PARA ${msg.categoria} ` +
                    `MODELO ${msg.modelo} ` +
                    `CON NÚMERO DE SERIE ${msg.numero_serie}`;

                tr.appendChild(tdFecha);
                tr.appendChild(tdOrigen);
                tr.appendChild(tdTexto);

                tbody.appendChild(tr);
                
                break; 
            case "finalizarReserva":
                var tbody = document.getElementById("cuerpoAvisos");

                var tr = document.createElement("tr");
                tr.style.backgroundColor = "red";
                tr.style.color = "white";

                var tdFecha = document.createElement("td");
                tdFecha.textContent = msg.fecha;

                var tdOrigen = document.createElement("td");
                tdOrigen.textContent = msg.origen;

                var tdTexto = document.createElement("td");
                tdTexto.textContent =
                    `SE HA FINALIZADO UNA RESERVA PARA ${msg.categoria} ` +
                    `MODELO ${msg.modelo} ` +
                    `CON NÚMERO DE SERIE ${msg.numero_serie}`;

                tr.appendChild(tdFecha);
                tr.appendChild(tdOrigen);
                tr.appendChild(tdTexto);

                tbody.appendChild(tr);
                break; 
                
        }
            
    });
}
