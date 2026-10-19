document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita que la página se recargue sola

    const usuario = document.getElementById('username').value;
    const clave = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');
    const btnIngresar = document.querySelector('button');

    // Estado de carga visual
    mensajeError.textContent = "";
    btnIngresar.textContent = "Verificando...";
    btnIngresar.disabled = true;

    try {
        // Conexión al microservicio de Usuarios (Puerto 5001)
        const respuesta = await fetch('http://localhost:5001/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usuario, password: clave })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            // 1. Guardar sesión en el navegador
            localStorage.setItem('usuario_bolivar', datos.usuario);
            localStorage.setItem('rol_bolivar', datos.rol); // Guardamos también el rol
            localStorage.setItem('token_bolivar', datos.token);

            // 2. Redirigir al Dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Error de credenciales (Usuario o contraseña mal)
            mensajeError.textContent = "Error: " + (datos.mensaje || "Credenciales inválidas");
            btnIngresar.textContent = "Ingresar";
            btnIngresar.disabled = false;
        }

    } catch (error) {
        console.error("Error de conexión:", error);
        mensajeError.textContent = "Error: No se puede conectar con el servidor.";
        btnIngresar.textContent = "Ingresar";
        btnIngresar.disabled = false;
    }
});