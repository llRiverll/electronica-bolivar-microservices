from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import time

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        return mysql.connector.connect(
            host='mysqldb', user='root', password='root', database='electronica_db', port=3306
        )
    except: return None

@app.route('/pedidos', methods=['POST'])
def crear_pedido():
    data = request.get_json()
    cliente_nombre = data.get('cliente_nombre', 'Cliente General')
    cliente_dni = data.get('cliente_dni', '00000000')
    metodo_pago = data.get('metodo_pago', 'EFECTIVO') # <--- NUEVO: Recibimos el método
    items = data.get('items') 
    total = data.get('total')

    if not items: return jsonify({"error": "Carrito vacío"}), 400
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Error BD"}), 500
    
    try:
        cursor = conn.cursor()
        
        # 1. Cliente
        cursor.execute("SELECT id FROM clientes WHERE documento = %s", (cliente_dni,))
        cliente = cursor.fetchone()
        if cliente:
            cliente_id = cliente[0]
        else:
            cursor.execute("INSERT INTO clientes (nombre, documento) VALUES (%s, %s)", (cliente_nombre, cliente_dni))
            cliente_id = cursor.lastrowid

        # 2. Pedido
        cursor.execute("INSERT INTO pedidos (cliente_id, total, estado, fecha) VALUES (%s, %s, 'PAGADO', NOW())", (cliente_id, total))
        pedido_id = cursor.lastrowid

        # 3. Pago (Ahora guardamos el método real)
        cursor.execute("INSERT INTO pagos (pedido_id, monto, fecha_pago, metodo) VALUES (%s, %s, NOW(), %s)", (pedido_id, total, metodo_pago))

        # 4. Detalles y Stock
        sql_det = "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio) VALUES (%s, %s, %s, %s)"
        sql_stk = "UPDATE inventario SET stock_actual = stock_actual - %s WHERE producto_id = %s"

        for item in items:
            cursor.execute(sql_det, (pedido_id, item['id'], item['cantidad'], item['precio']))
            cursor.execute(sql_stk, (item['cantidad'], item['id']))

        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Venta OK", "pedido_id": pedido_id}), 201

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)