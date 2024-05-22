import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1qWP8M3jEauxL1QzCOz-zb-kI9MumwyY",
    authDomain: "votaciononline-502dd.firebaseapp.com",
    databaseURL: "https://votaciononline-502dd-default-rtdb.firebaseio.com",
    projectId: "votaciononline-502dd",
    storageBucket: "votaciononline-502dd.appspot.com",
    messagingSenderId: "223964095350",
    appId: "1:223964095350:web:6db96fb5b4fa8bd5895057"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Función para mostrar el cuadro de diálogo (modal)
function mostrarModal(mensaje) {
    document.getElementById('modal-texto').innerText = mensaje;
    document.getElementById('modal').style.display = 'block';
}

// Función para cerrar el cuadro de diálogo (modal)
window.cerrarModal = function() {
    document.getElementById('modal').style.display = 'none';
};

// Función para login de usuario
window.loginUsuario = async function() {
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `usuarios/${usuario}`));

    if (snapshot.exists() && snapshot.val().contrasena === contrasena) {
        if (snapshot.val().havotado) {
            mostrarModal("Usted ya ha votado.");
            location.href = 'index.html';
        } else {
            document.getElementById('login').style.display = 'none';
            document.getElementById('votacion').style.display = 'block';
            const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));
            if (votacionSnapshot.val().titulo === "No hay datos") {
                mostrarModal("Lo siento, no hay votación actualmente.");
                location.href = 'index.html';
            } else {
                document.getElementById('mensajeBienvenida').innerHTML = `Hola, <span class="nombre">${snapshot.val().nombre}</span>, realiza tu voto...`;
                document.getElementById('titulo').innerText = votacionSnapshot.val().titulo;
                document.getElementById('descripcion').innerText = votacionSnapshot.val().subtitulo;
            }
        }
    } else {
        mostrarModal("Usuario o contraseña incorrectos.");
    }
};

// Función para seleccionar una opción de voto
window.seleccionarOpcion = function(opcion) {
    const botones = document.querySelectorAll('#votacion button');
    botones.forEach(boton => boton.classList.remove('selected'));
    document.querySelector(`#votacion button[onclick="seleccionarOpcion('${opcion}')"]`).classList.add('selected');
    window.voto = opcion;
    document.getElementById('votar-button').classList.add('selected');
};

// Función para registrar el voto
window.votar = async function() {
    const usuario = document.getElementById('usuario').value;
    const dbRef = ref(db);

    if (window.voto) {
        const updates = {};
        updates[`usuarios/${usuario}/havotado`] = true;
        updates[`votacion/${window.voto}`] = (await get(child(dbRef, `votacion/${window.voto}`))).val() + 1;
        await update(dbRef, updates);
        mostrarModal("Gracias por su voto!");
        location.href = 'index.html';
    } else {
        mostrarModal("Por favor, seleccione una opción para votar.");
    }
};

// Función para login de administrador
window.loginAdmin = async function() {
    const usuario = document.getElementById('adminUsuario').value;
    const contrasena = document.getElementById('adminContrasena').value;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `admin`));

    if (snapshot.exists() && snapshot.val().user === usuario && snapshot.val().contrasena === contrasena) {
        document.getElementById('login').style.display = 'none';
        if (document.getElementById('registro')) {
            document.getElementById('registro').style.display = 'block';
            cargarUsuarios();
        } else if (document.getElementById('crearVotacion')) {
            document.getElementById('crearVotacion').style.display = 'block';
            mostrarVotacionActual();
        } else if (document.getElementById('resultados')) {
            document.getElementById('resultados').style.display = 'block';
            mostrarResultados();
        }
    } else {
        mostrarModal("Usuario o contraseña incorrectos.");
    }
};

// Función para registrar un nuevo usuario
window.registrarUsuario = async function() {
    const nombreCompleto = document.getElementById('nombreCompleto').value;
    const nuevoUsuario = document.getElementById('nuevoUsuario').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `usuarios/${nuevoUsuario}`));

    if (snapshot.exists()) {
        mostrarModal("El usuario ya existe.");
    } else {
        await set(ref(db, `usuarios/${nuevoUsuario}`), {
            nombre: nombreCompleto,
            contrasena: nuevaContrasena,
            havotado: false,
            id: nuevoUsuario
        });
        mostrarModal("Usuario registrado exitosamente.");
        cargarUsuarios();
    }
};

// Función para cargar los usuarios en la tabla
async function cargarUsuarios() {
    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    const tbody = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    usuariosSnapshot.forEach((childSnapshot) => {
        const usuario = childSnapshot.key;
        const row = tbody.insertRow();
        const cellUsuario = row.insertCell(0);
        const cellAcciones = row.insertCell(1);

        cellUsuario.textContent = usuario;
        cellAcciones.innerHTML = `
            <button onclick="editarUsuario('${usuario}')">Editar</button>
            <button onclick="borrarUsuario('${usuario}')">Borrar</button>
        `;
    });
}

// Función para editar un usuario
window.editarUsuario = async function(usuario) {
    const nuevaContrasena = prompt("Ingrese la nueva contraseña para " + usuario);
    if (nuevaContrasena) {
        await update(ref(db, `usuarios/${usuario}`), {
            contrasena: nuevaContrasena
        });
        mostrarModal("Contraseña actualizada exitosamente.");
        cargarUsuarios();
    }
};

// Función para borrar un usuario
window.borrarUsuario = async function(usuario) {
    if (confirm("¿Está seguro de que desea borrar el usuario " + usuario + "?")) {
        await remove(ref(db, `usuarios/${usuario}`));
        mostrarModal("Usuario borrado exitosamente.");
        cargarUsuarios();
    }
};

// Función para crear una nueva votación
window.crearVotacion = async function() {
    const titulo = document.getElementById('tituloVotacion').value;
    const descripcion = document.getElementById('descripcionVotacion').value;

    await set(ref(db, 'votacion'), {
        si: 0,
        no: 0,
        abstencion: 0,
        dequetrata: {
            subtitulo: descripcion,
            titulo: titulo
        }
    });

    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    usuariosSnapshot.forEach((childSnapshot) => {
        update(ref(db, `usuarios/${childSnapshot.key}`), { havotado: false });
    });

    mostrarModal("Votación creada exitosamente.");
    location.href = 'index.html';
};

// Función para mostrar la votación actual
async function mostrarVotacionActual() {
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));

    document.getElementById('votacionActualTitulo').innerText = `Título: ${votacionSnapshot.val().titulo}`;
    document.getElementById('votacionActualSubtitulo').innerText = `Descripción: ${votacionSnapshot.val().subtitulo}`;
}

// Función para borrar la votación
window.borrarVotacion = async function() {
    await set(ref(db, 'votacion'), {
        si: 0,
        no: 0,
        abstencion: 0,
        dequetrata: {
            subtitulo: "No hay datos",
            titulo: "No hay datos"
        }
    });

    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    usuariosSnapshot.forEach((childSnapshot) => {
        update(ref(db, `usuarios/${childSnapshot.key}`), { havotado: false });
    });

    mostrarModal("Votación borrada exitosamente.");
    mostrarVotacionActual();
};

// Función para mostrar los resultados de la votación
async function mostrarResultados() {
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion'));

    const si = votacionSnapshot.val().si;
    const no = votacionSnapshot.val().no;
    const abstencion = votacionSnapshot.val().abstencion;

    const ctx = document.getElementById('grafica').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sí', 'No', 'Abstención'],
            datasets: [{
                label: 'Votos',
                data: [si, no, abstencion],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    let mensajeResultado = '';
    if (si > no && si > abstencion) {
        mensajeResultado = 'La propuesta ha sido aprobada.';
    } else if (no > si && no > abstencion) {
        mensajeResultado = 'La propuesta ha sido rechazada.';
    } else if (si === no) {
        mensajeResultado = 'Hay un empate entre sí y no.';
    } else {
        mensajeResultado = 'No hay una decisión clara.';
    }

    document.getElementById('mensajeResultado').innerText = mensajeResultado;
}

