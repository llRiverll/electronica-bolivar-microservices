from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        return mysql.connector.connect(
            host='mysqldb', user='root', password='root', database='electronica_db', port=3306
        )
    except: return None

# 1. LISTAR
@app.route('/productos', methods=['GET'])
def listar_productos():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM productos ORDER BY id DESC")
    productos = cursor.fetchall()
    conn.close()
    return jsonify(productos), 200

# 2. CREAR
@app.route('/productos', methods=['POST'])
def crear_producto():
    data = request.get_json()
    sql = """INSERT INTO productos (nombre, descripcion, marca, categoria, subcategoria, precio_unitario, imagen_url) 
             VALUES (%s, %s, %s, %s, %s, %s, %s)"""
    vals = (data['nombre'], data['descripcion'], data['marca'], data['categoria'], data['subcategoria'], data['precio_unitario'], data.get('imagen_url', ''))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, vals)
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Creado"}), 201

# 3. ACTUALIZAR (NUEVO)
@app.route('/productos/<int:id>', methods=['PUT'])
def actualizar_producto(id):
    data = request.get_json()
    sql = """UPDATE productos SET 
             nombre=%s, descripcion=%s, marca=%s, categoria=%s, subcategoria=%s, precio_unitario=%s, imagen_url=%s
             WHERE id=%s"""
    vals = (data['nombre'], data['descripcion'], data['marca'], data['categoria'], data['subcategoria'], data['precio_unitario'], data.get('imagen_url', ''), id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, vals)
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Actualizado"}), 200

# 4. ELIMINAR (NUEVO)
@app.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM productos WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Eliminado"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)