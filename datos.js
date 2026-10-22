const gestores = [
    {
        id: 1,
        nombre: "Ana",
        apellidos: "Gomez",
        usuario: "ana",
        password: "1234"
    },
    {
        id: 2,
        nombre: "Juan Carlos",
        apellidos: "Fisica",
        usuario: "jc",
        password: "12345"
    }
];


const ubicaciones = [
    { id: 1, nombre: "Sala 1" },
    { id: 2, nombre: "Almacén" }
];

const categorias = [
    { id: 1, nombre: "Estetoscopios" },
    { id: 2, nombre: "Termómetros" }
];

const modelos = [
    {
        id: 1,
        nombre: "Modelo A",
        categoria: 1,
        horas_maximas: 8
    },
    {
        id: 2,
        nombre: "Modelo B",
        categoria: 2,
        horas_maximas: 5
    },
    {
        id: 3,
        nombre: "Modelo C",
        categoria: 2,
        horas_maximas: 4
    }
];

const recursos = [
    {
        id: 1,
        modelo: 1,
        ubicacion: 1,
        numero_serie: "SN001",
        estado: 0
    },
    {
        id: 2,
        modelo: 2,
        ubicacion: 1,
        numero_serie: "SN002",
        estado: 0
    },
    {
        id: 3,
        modelo: 2,
        ubicacion: 1,
        numero_serie: "SN003",
        estado: 0
    },
    {
        id: 4,
        modelo: 2,
        ubicacion: 1,
        numero_serie: "SN004",
        estado: 1
    },

];

const sanitarios = [
    {
        id: 1,
        nombre: "Ruben",
        apellidos: "Garcia",
        usuario: "rub",
        password: "1234"
    },
    {
        id: 2,
        nombre: "Aldrin",
        apellidos: "Guzman",
        usuario: "ald",
        password: "12345"
    }
];

const resenyas = [
 
     {
        id: 1,
        recurso: 1,
        sanitario: 1,
        fecha: new Date(),
        valor: 5,
        descripcion: "Muy bueno"
    }
];

const reservas = [
    // Pendiente (verde pastel)
    {
        id: 1,
        recurso: 1,
        sanitario: 1,
        horas_estimadas: 4,
        fecha_peticion: new Date(new Date().getTime() - 30*60*1000),
        fecha_inicio: null,
        fecha_fin: null
    },
    // Pendiente (verde pastel)
    {
        id: 5,
        recurso: 1,
        sanitario: 1,
        horas_estimadas: 4,
        fecha_peticion: new Date(),
        fecha_inicio: null,
        fecha_fin: null
    },
    // En uso (azul pastel)
    {
        id: 2,
        recurso: 1,
        sanitario: 1,
        horas_estimadas: 2,
        fecha_peticion: new Date(new Date().getTime() - 60*60*1000), // hace 1h
        fecha_inicio: new Date(new Date().getTime() - 30*60*1000), // empezó hace 30min
        fecha_fin: null
    },
    // Sobrepasado (rojo pastel)
    {
        id: 3,
        recurso: 2,
        sanitario: 1,
        horas_estimadas: 1,
        fecha_peticion: new Date(new Date().getTime() - 3*60*60*1000), // hace 3h
        fecha_inicio: new Date(new Date().getTime() - 2*60*60*1000), // empezó hace 2h
        fecha_fin: null
    },
    // Finalizada (blanco)
    {
        id: 4,
        recurso: 1,
        sanitario: 1,
        horas_estimadas: 1,
        fecha_peticion: new Date(new Date().getTime() - 5*60*60*1000), // hace 5h
        fecha_inicio: new Date(new Date().getTime() - 4*60*60*1000), // empezó hace 4h
        fecha_fin: new Date(new Date().getTime() - 3*60*60*1000) // terminó hace 3h
    }
];

module.exports.ges=gestores;
module.exports.san=sanitarios;
module.exports.ubi=ubicaciones;
module.exports.cat=categorias;
module.exports.mod=modelos;
module.exports.rec=recursos;
module.exports.resr=reservas;
module.exports.resy=resenyas;
