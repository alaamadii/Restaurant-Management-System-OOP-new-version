from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from resturant import Restaurant
import os

app = Flask(__name__, static_folder='static')
CORS(app) # Enable CORS for all routes

restaurant = Restaurant("Grand GSG Restaurant")

# Make sure static and images folders exist
os.makedirs('static', exist_ok=True)
os.makedirs('static/images', exist_ok=True)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/menu', methods=['GET'])
def get_menu():
    return jsonify(restaurant.get_menu())

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    table_number = data.get('table_number')
    items = data.get('items')
    
    if not table_number or not items:
        return jsonify({"error": "Missing table_number or items"}), 400
        
    try:
        order = restaurant.place_order(table_number, items)
        return jsonify(order.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify(restaurant.get_all_orders())

@app.route('/api/orders/<order_id>', methods=['PATCH'])
def update_order(order_id):
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Missing status"}), 400
        
    try:
        order = restaurant.update_order_status(order_id, status)
        return jsonify(order.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)