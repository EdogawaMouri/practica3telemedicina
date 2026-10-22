var conexion = require("./conexion_mysql.js")
var express = require("express");
var app = express();

//app.use("/appCliente", express.static());
app.use(express.json()); 

app.get("/hola", function (req, res) {
    console.log("Hola!!!");
    res.json("Hola Mundo!!!");
});

app.get("/hospitales", function (req, res) {
    var sql = "SELECT * FROM hospitales";
    conexion.query(sql, function (err, hospitales) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Hospitales:", hospitales);
            res.json(hospitales);
        }
    });
});

app.get("/hospital/:id", function (req, res) {
    var idHospital = req.params.id;
    var sql = "SELECT * FROM hospitales WHERE id = " + idHospital;
    conexion.query(sql, function (err, hospitales) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            if (hospitales.length === 1) {
                console.log("Hospital:", hospitales[0]);
                res.status(200).json(hospitales[0]);
            } else {
                console.log("No se ha encontrado el hospital con id:", idHospital);
                res.status(404).json("No se ha encontrado el hospital");
            }
        }
    });
});

app.post("/hospitales", function (req, res) {
    var hospital = req.body;
    var sql = "INSERT INTO hospitales (nombre, provincia, camas) VALUES('" + hospital.nombre + "','" + hospital.provincia + "'," + hospital.camas + ")";
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el insert", err);
            res.status(500).json("Error al realizar la insercion");
        } else {
            console.log("Hospital insertado:", resultado);
            res.status(201).json(resultado.insertId);
        }
    });
});

app.delete("/hospital/:id", function (req, res) {
    var sql = "DELETE FROM hospitales WHERE id = " + req.params.id;
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el delete", err);
            res.status(500).json("Error al realizar el borrado");
        } else {
            console.log("Hospital borrado:", resultado);
            res.status(200).json("Hospital eliminado");
        }
    });
});

app.put("/hospital/:id", function (req, res) {
    var sql = "UPDATE hospitales SET nombre = '"
        + req.body.nombre + "', provincia = '"
        + req.body.provincia + "', camas = "
        + req.body.camas + " WHERE id = " + req.params.id;
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el update", err);
            res.status(500).json("Error al realizar la actualización");
        } else {
            console.log("Hospital actualizado:", resultado);
            res.status(200).json("Hospital actualizado");
        }
    });
});

app.listen(3000, function () {
    console.log("Servidor de ejemplo en el puerto 3000");
});