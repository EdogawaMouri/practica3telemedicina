// Servidor de telemedicina adaptado a Supabase (PostgreSQL).
// IMPORTANTE: la clave secret/service_role solo debe existir en el servidor (Render), nunca en el navegador.
require('dotenv').config();
const express = require('express');
const jwt = require('jwt-simple');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const jwtSecret = process.env.JWT_SECRET;
const supabaseUrl ='https://yiufarozroxrqadlpqqd.supabase.co';
const supabaseSecret ='sb_publishable_H-nWcNHNLpZB9G8VY-h6Lw_NL6-MCXC';
if (!jwtSecret || !supabaseUrl || !supabaseSecret) {
  throw new Error('Faltan las variables de entorno JWT_SECRET, SUPABASE_URL o SUPABASE_SECRET_KEY');
}
const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { persistSession: false, autoRefreshToken: false }
});

app.use('/appCliente', express.static('cliente_rest'));
app.use(express.json());

function errorBD(res, error) {
  console.error('Error en Supabase:', error);
  return res.status(500).json('Error en la base de datos');
}
function idValido(v) { return /^\d+$/.test(String(v)) && Number(v) > 0; }
function requerirCampos(obj, campos) {
  return campos.every(c => obj && obj[c] !== undefined && obj[c] !== null && String(obj[c]).trim() !== '');
}
function captura(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

// Rutas públicas
app.post('/api/gestores/login', captura(async (req, res) => {
  if (!requerirCampos(req.body, ['login', 'password'])) return res.status(400).json('Falta usuario o contraseña');
  // Compatibilidad con los datos existentes: passwords en claro. Migrar a hash antes de producción.
  const { data, error } = await supabase.from('gestores').select('id')
    .eq('usuario', req.body.login).eq('password', req.body.password).limit(2);
  if (error) return errorBD(res, error);
  if (data.length !== 1) return res.status(403).json('Usuario o contraseña incorrectos');
  const contenido = { usuario: data[0].id, expira: Date.now() + 60 * 60 * 1000 };
  return res.status(201).json({ id: data[0].id, token: jwt.encode(contenido, jwtSecret) });
}));

// Esta ruta era pública en el archivo original. Mantener solo si la inscripción pública es deseada.
app.post('/api/gestores', captura(async (req, res) => {
  if (!requerirCampos(req.body, ['nombre','apellidos','usuario','password'])) {
    return res.status(400).json({error:'Faltan campos obligatorios'});
  }
  const { data: previos, error: errorPrevio } = await supabase.from('gestores').select('id')
    .eq('usuario', req.body.usuario).limit(1);
  if (errorPrevio) return errorBD(res, errorPrevio);
  if (previos.length) return res.status(403).json({error:'El usuario ya existe'});
  const { data, error } = await supabase.from('gestores').insert({
    nombre: req.body.nombre, apellidos: req.body.apellidos,
    usuario: req.body.usuario, password: req.body.password
  }).select('id').single();
  if (error) return errorBD(res, error);
  return res.status(201).json(data.id);
}));

// Rutas privadas: el frontend actual proporciona token mediante ?token=...
app.use('/api', (req, res, next) => {
  const token = req.query.token;
  if (!token || typeof token !== 'string') return res.status(401).json('No se ha encontrado token');
  let contenido;
  try { contenido = jwt.decode(token, jwtSecret); }
  catch (e) { return res.status(401).json('El token es incorrecto'); }
  if (!contenido || !contenido.expira || !contenido.usuario) return res.status(401).json('El formato del token no es adecuado');
  if (contenido.expira < Date.now()) return res.status(401).json('El token ha expirado');
  req.gestorId = contenido.usuario;
  next();
});

app.get('/api/ministerio', captura(async (req,res) => {
  const {data: reservas, error} = await supabase.from('reservas')
    .select('id,recurso,sanitario,horas_estimadas,fecha_peticion,fecha_inicio,fecha_fin').order('id');
  if (error) return errorBD(res,error);
  if (!reservas.length) return res.status(200).json([]);
  const {data: sanitarios, error: es} = await supabase.from('sanitarios').select('id,nombre,apellidos');
  if (es) return errorBD(res,es);
  const {data: recursos, error: er} = await supabase.from('recursos').select('id,modelo');
  if (er) return errorBD(res,er);
  const {data: modelos, error: em} = await supabase.from('modelos').select('id,categoria');
  if (em) return errorBD(res,em);
  const {data: categorias, error: ec} = await supabase.from('categorias').select('id,nombre');
  if (ec) return errorBD(res,ec);
  const san = new Map(sanitarios.map(x=>[x.id,x]));
  const rec = new Map(recursos.map(x=>[x.id,x]));
  const mod = new Map(modelos.map(x=>[x.id,x]));
  const cat = new Map(categorias.map(x=>[x.id,x]));
  const datos = reservas.map(r => {
    const s = san.get(r.sanitario);
    const m = mod.get(rec.get(r.recurso)?.modelo);
    return {
      nombre: s?.nombre || '', apellidos: s?.apellidos || '',
      'categoría': cat.get(m?.categoria)?.nombre || '',
      horas_estimadas: String(r.horas_estimadas),
      fec_pet: String(r.fecha_peticion), fec_ini: String(r.fecha_inicio), fec_fin: String(r.fecha_fin)
    };
  });
  res.status(200).json(datos);
}));

for (const tabla of ['ubicaciones', 'categorias', 'modelos']) {
  app.get(`/api/${tabla}`, captura(async (req,res) => {
    const {data,error} = await supabase.from(tabla).select('*');
    if (error) return errorBD(res,error);
    res.json(data);
  }));
}

for (const tabla of ['gestores','sanitarios']) {
  app.get(`/api/${tabla}/:id`, captura(async (req,res) => {
    if (!idValido(req.params.id)) return res.status(404).json({error:'No es un numero'});
    // No devolvemos nunca la contraseña.
    const {data,error} = await supabase.from(tabla).select('id,nombre,apellidos,usuario')
      .eq('id', Number(req.params.id)).maybeSingle();
    if (error) return errorBD(res,error);
    if (!data) return res.status(404).json({error:'Usuario no encontrado'});
    res.status(200).json(data);
  }));
}

app.get('/api/recursos', captura(async (req,res) => {
  let query = supabase.from('recursos').select('*');
  for (const campo of ['modelo','ubicacion','estado']) {
    if (req.query[campo] !== undefined) {
      if (!/^\d+$/.test(String(req.query[campo]))) return res.status(400).json({error:`Filtro ${campo} inválido`});
      query = query.eq(campo, Number(req.query[campo]));
    }
  }
  if (req.query.categoria !== undefined) {
    if (!/^\d+$/.test(String(req.query.categoria))) return res.status(400).json({error:'Categoría inválida'});
    const {data: modelos,error} = await supabase.from('modelos').select('id').eq('categoria', Number(req.query.categoria));
    if (error) return errorBD(res,error);
    if (!modelos.length) return res.status(200).json([]);
    query = query.in('modelo', modelos.map(m => m.id));
  }
  const {data,error} = await query.order('id');
  if (error) return errorBD(res,error);
  res.status(200).json(data);
}));

app.get('/api/recursos/:id', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(404).json({error:'ID inválido'});
  const {data,error} = await supabase.from('recursos').select('*').eq('id', Number(req.params.id)).maybeSingle();
  if (error) return errorBD(res,error);
  if (!data) return res.status(404).json({error:'ID no encontrado'});
  res.status(200).json(data);
}));

app.get('/api/recursos/:id/reservas', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(404).json({error:'ID inválido'});
  const {data: reservas,error} = await supabase.from('reservas').select('*').eq('recurso', Number(req.params.id));
  if (error) return errorBD(res,error);
  const {data: sanitarios, error: es} = await supabase.from('sanitarios').select('id,nombre,apellidos');
  if (es) return errorBD(res,es);
  const san = new Map(sanitarios.map(s => [s.id,s]));
  res.status(200).json(reservas.map(r => ({
    nombre_sanitario: san.has(r.sanitario) ? `${san.get(r.sanitario).nombre} ${san.get(r.sanitario).apellidos}` : '-',
    fecha_peticion: r.fecha_peticion, fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin,
    horas_estimadas: r.horas_estimadas
  })));
}));

app.get('/api/recursos/:id/resenyas', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(400).json({error:'ID inválido'});
  const {data: resenyas,error} = await supabase.from('resenyas').select('*').eq('recurso', Number(req.params.id));
  if (error) return errorBD(res,error);
  const {data: sanitarios, error: es} = await supabase.from('sanitarios').select('id,nombre,apellidos');
  if (es) return errorBD(res,es);
  const san = new Map(sanitarios.map(s => [s.id,s]));
  res.status(200).json(resenyas.map(r => ({
    nombre_sanitario: san.has(r.sanitario) ? `${san.get(r.sanitario).nombre} ${san.get(r.sanitario).apellidos}` : '-',
    descripcion: r.descripcion, fecha: r.fecha, valor: r.valor
  })));
}));

app.post('/api/areas_salud', captura(async (req,res) => {
  if (!requerirCampos(req.body,['codigo_postal','nombre','gestor'])) return res.status(400).json({error:'Faltan datos'});
  const {data: previa,error: ep} = await supabase.from('areas_salud').select('codigo_postal')
    .eq('codigo_postal', req.body.codigo_postal).maybeSingle();
  if (ep) return errorBD(res,ep);
  if (previa) return res.status(403).json({error:'El área de salud ya existe'});
  const {data,error} = await supabase.from('areas_salud').insert({
    codigo_postal: req.body.codigo_postal, nombre: req.body.nombre,
    gestor: req.body.gestor, sanitario: null
  }).select('codigo_postal').single();
  if (error) return errorBD(res,error);
  res.status(201).json(data.codigo_postal);
}));

app.post('/api/recursos', captura(async (req,res) => {
  if (!requerirCampos(req.body,['modelo','ubicacion','numero_serie','estado'])) return res.status(400).json({error:'Faltan datos'});
  const {data,error} = await supabase.from('recursos').insert({
    modelo: req.body.modelo, ubicacion: req.body.ubicacion,
    numero_serie: req.body.numero_serie, estado: req.body.estado
  }).select('id').single();
  if (error) return errorBD(res,error);
  res.status(201).json(data.id);
}));

app.put('/api/gestores/:id', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(404).json({error:'No es un numero'});
  if (!requerirCampos(req.body,['nombre','apellidos','usuario','password'])) return res.status(400).json({error:'Faltan datos'});
  const id = Number(req.params.id);
  const {data: iguales,error: ep} = await supabase.from('gestores').select('id')
    .eq('usuario',req.body.usuario).neq('id',id).limit(1);
  if (ep) return errorBD(res,ep);
  if (iguales.length) return res.status(403).json({error:'Usuario repetido'});
  const {data,error} = await supabase.from('gestores').update({
    nombre:req.body.nombre, apellidos:req.body.apellidos,
    usuario:req.body.usuario, password:req.body.password
  }).eq('id',id).select('id,nombre,apellidos,usuario').maybeSingle();
  if (error) return errorBD(res,error);
  if (!data) return res.status(404).json({error:'Gestor no encontrado'});
  res.status(200).json(data);
}));

app.put('/api/recursos/:id', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(404).json({error:'ID inválido'});
  if (!requerirCampos(req.body,['modelo','ubicacion','numero_serie','estado'])) return res.status(400).json({error:'Faltan datos'});
  const {data,error} = await supabase.from('recursos').update({
    modelo:req.body.modelo, ubicacion:req.body.ubicacion,
    numero_serie:req.body.numero_serie, estado:req.body.estado
  }).eq('id',Number(req.params.id)).select('id').maybeSingle();
  if (error) return errorBD(res,error);
  if (!data) return res.status(404).json({error:'Recurso no encontrado'});
  res.status(200).json('Recurso actualizado');
}));

app.delete('/api/recursos/:id', captura(async (req,res) => {
  if (!idValido(req.params.id)) return res.status(404).json({error:'ID inválido'});
  const {data,error} = await supabase.from('recursos').delete().eq('id',Number(req.params.id)).select('id').maybeSingle();
  if (error) return errorBD(res,error);
  if (!data) return res.status(404).json({error:'ID no encontrado'});
  res.status(200).json({mensaje:'Elemento eliminado'});
}));

app.use((err,req,res,next) => {
  console.error('Error inesperado:',err);
  if (!res.headersSent) res.status(500).json('Error interno del servidor');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',()=>console.log(`Servidor escuchando en el puerto ${PORT}`));
