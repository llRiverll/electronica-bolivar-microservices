from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        return mysql.connector.connect(host='mysqldb', user='root', password='root', database='electronica_db', port=3306)
    except: return None

@app.route('/')
def index(): return "Microservicio Usuarios: ONLINE"

# 1. LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    conn = get_db_connection()
    if not conn: return jsonify({"error": "No DB"}), 500
    cursor = conn.cursor(dictionary=True)
    # Verificamos también que el estado sea ACTIVO
    cursor.execute("SELECT * FROM usuarios WHERE username = %s AND password_hash = %s AND estado = 'ACTIVO'", (data['username'], data['password']))
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"mensaje": "Login OK", "usuario": user['username'], "rol": user['rol']}), 200
    return jsonify({"mensaje": "Credenciales inválidas o cuenta inactiva"}), 401

# 2. LISTAR (Con todos los datos nuevos)
@app.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios ORDER BY id DESC")
    users = cursor.fetchall()
    conn.close()
    return jsonify(users), 200

# 3. CREAR / ACTUALIZAR
@app.route('/usuarios', methods=['POST'])
def gestionar_usuario():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Datos completos
    vals = (
        data['username'], data['password'], data['rol'],
        data.get('nombre_completo', ''), data.get('email', ''), 
        data.get('telefono', ''), data.get('cargo', 'Vendedor'), 
        data.get('estado', 'ACTIVO')
    )

    try:
        sql = """INSERT INTO usuarios (username, password_hash, rol, nombre_completo, email, telefono, cargo, estado) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        cursor.execute(sql, vals)
        conn.commit()
        msg = "Usuario creado"
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
        
    return jsonify({"mensaje": msg}), 201

# 4. ELIMINAR
@app.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Eliminado"}), 200

# 5. ACTUALIZAR (PUT)
@app.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = """UPDATE usuarios SET 
             username=%s, password_hash=%s, rol=%s, nombre_completo=%s, 
             email=%s, telefono=%s, cargo=%s, estado=%s 
             WHERE id=%s"""
    vals = (
        data['username'], data['password'], data['rol'],
        data['nombre_completo'], data['email'], data['telefono'], 
        data['cargo'], data['estado'], id
    )
    cursor.execute(sql, vals)
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Actualizado"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)