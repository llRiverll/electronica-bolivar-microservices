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
def index(): return "Microservicio Inventario: ONLINE"

# 1. VER STOCK (Con Valorización)
@app.route('/inventario', methods=['GET'])
def ver_stock():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT p.id as producto_id, p.nombre, p.categoria, p.marca, p.imagen_url, p.precio_unitario,
        IFNULL(i.stock_actual, 0) as stock, (p.precio_unitario * IFNULL(i.stock_actual, 0)) as valor_total
        FROM productos p LEFT JOIN inventario i ON p.id = i.producto_id
        ORDER BY i.stock_actual ASC
    """
    cursor.execute(sql)
    res = cursor.fetchall()
    conn.close()
    return jsonify(res), 200

# 2. AJUSTE DE STOCK CON KARDEX (PROFESIONAL)
@app.route('/inventario/ajuste', methods=['POST'])
def ajuste_stock():
    data = request.get_json()
    prod_id = data['producto_id']
    cantidad = int(data['cantidad']) # Cantidad a mover
    tipo = data['tipo']              # 'ENTRADA' o 'SALIDA'
    motivo = data['motivo']          # 'COMPRA', 'MERMA', 'AJUSTE'
    referencia = data.get('referencia', '-') # Factura F001, etc.

    conn = get_db_connection()
    cursor = conn.cursor()

    # Obtener stock actual
    cursor.execute("SELECT stock_actual FROM inventario WHERE producto_id = %s", (prod_id,))
    row = cursor.fetchone()
    
    stock_actual = row[0] if row else 0
    stock_nuevo = stock_actual

    if tipo == 'ENTRADA':
        stock_nuevo += cantidad
    else: # SALIDA
        stock_nuevo -= cantidad
        if stock_nuevo < 0:
            conn.close()
            return jsonify({"error": "Stock insuficiente"}), 400

    # 1. Actualizar Inventario
    if row:
        cursor.execute("UPDATE inventario SET stock_actual = %s WHERE producto_id = %s", (stock_nuevo, prod_id))
    else:
        cursor.execute("INSERT INTO inventario (producto_id, stock_actual) VALUES (%s, %s)", (prod_id, stock_nuevo))

    # 2. Registrar en KARDEX
    sql_kardex = """INSERT INTO kardex (producto_id, tipo_movimiento, motivo, cantidad, stock_anterior, stock_nuevo, referencia)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)"""
    cursor.execute(sql_kardex, (prod_id, tipo, motivo, cantidad, stock_actual, stock_nuevo, referencia))

    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Movimiento registrado en Kardex"}), 200

# 3. VER HISTORIAL KARDEX (NUEVO)
@app.route('/inventario/kardex/<int:prod_id>', methods=['GET'])
def ver_kardex(prod_id):
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM kardex WHERE producto_id = %s ORDER BY fecha DESC", (prod_id,))
    res = cursor.fetchall()
    conn.close()
    return jsonify(res), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)