from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        return mysql.connector.connect(host='mysqldb', user='root', password='root', database='electronica_db', port=3306)
    except: return None

@app.route('/')
def index(): return "Microservicio Pagos: ONLINE"

# LISTA MAESTRA DE PAGOS
@app.route('/pagos', methods=['GET'])
def listar_pagos():
    conn = get_db_connection()
    if conn is None: return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT p.id, c.nombre as cliente, c.documento as dni, p.monto, p.fecha_pago, p.metodo, p.pedido_id 
        FROM pagos p
        JOIN pedidos ped ON p.pedido_id = ped.id
        JOIN clientes c ON ped.cliente_id = c.id
        ORDER BY p.fecha_pago DESC
    """
    cursor.execute(sql)
    res = cursor.fetchall()
    conn.close()
    return jsonify(res), 200

# DETALLE DE UN PAGO (NUEVO)
@app.route('/pagos/<int:pedido_id>', methods=['GET'])
def ver_detalle_pago(pedido_id):
    conn = get_db_connection()
    if conn is None: return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    
    # Traemos los productos de ese pedido
    sql = """
        SELECT dp.cantidad, p.nombre, dp.precio, (dp.cantidad * dp.precio) as subtotal
        FROM detalle_pedidos dp
        JOIN productos p ON dp.producto_id = p.id
        WHERE dp.pedido_id = %s
    """
    cursor.execute(sql, (pedido_id,))
    items = cursor.fetchall()
    conn.close()
    return jsonify(items), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)