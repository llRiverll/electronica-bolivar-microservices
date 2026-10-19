from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        return mysql.connector.connect(
            host='mysqldb', user='root', password='root', database='electronica_db', port=3306
        )
    except: return None

@app.route('/')
def index(): return "Microservicio Reportes: ONLINE"

@app.route('/reportes/resumen', methods=['GET'])
def obtener_resumen():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Sin DB"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. KPIs Generales (Esto es simple, no falla)
        cursor.execute("SELECT IFNULL(SUM(total),0) as total, COUNT(*) as cantidad FROM pedidos")
        general = cursor.fetchone()
        
        # 2. Ticket Promedio
        ticket = 0
        if general['cantidad'] > 0:
            ticket = float(general['total']) / general['cantidad']

        # 3. Método Favorito
        # Usamos ANY_VALUE implícito al seleccionar solo el método
        cursor.execute("SELECT metodo, COUNT(*) as uso FROM pagos GROUP BY metodo ORDER BY uso DESC LIMIT 1")
        top_metodo = cursor.fetchone()
        metodo_nombre = top_metodo['metodo'] if top_metodo else "N/A"

        # 4. GRÁFICO DE LÍNEAS (SOLUCIÓN PYTHON)
        # Pedimos TODAS las ventas sin agrupar para evitar el error MySQL 1055
        cursor.execute("SELECT total, fecha FROM pedidos ORDER BY fecha ASC")
        todas_ventas = cursor.fetchall()

        # Agrupamos manualmente en Python (Diccionario fecha -> suma)
        ventas_por_dia = {}
        for venta in todas_ventas:
            # Convertimos fecha a string "DD/MM"
            dia = venta['fecha'].strftime('%d/%m')
            monto = float(venta['total'])
            
            if dia in ventas_por_dia:
                ventas_por_dia[dia] += monto
            else:
                ventas_por_dia[dia] = monto
        
        # Convertimos el diccionario a la lista que espera el Frontend
        # Tomamos solo los últimos 7 días
        grafico_ventas = []
        dias_ordenados = list(ventas_por_dia.keys())[-7:] 
        
        for dia in dias_ordenados:
            grafico_ventas.append({
                "fecha": dia,
                "venta": ventas_por_dia[dia]
            })

        # 5. Gráfico Dona (Categorías)
        cursor.execute("""
            SELECT p.categoria, COUNT(dp.id) as cantidad 
            FROM detalle_pedidos dp 
            JOIN productos p ON dp.producto_id = p.id 
            GROUP BY p.categoria
        """)
        grafico_categorias = cursor.fetchall()

        conn.close()
        
        return jsonify({
            "kpis": {
                "dinero_total": float(general['total']),
                "cantidad_ventas": general['cantidad'],
                "ticket_promedio": float(ticket),
                "metodo_top": metodo_nombre
            },
            "graficos": {
                "ventas_tiempo": grafico_ventas,
                "ventas_categoria": grafico_categorias
            }
        })

    except Exception as e:
        print(f"ERROR REPORTES: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)