import uuid
import datetime
from typing import List, Dict

class OrderItem:
    def __init__(self, menu_item_id: str, name: str, quantity: int, price: float):
        self.menu_item_id = menu_item_id
        self.name = name
        self.quantity = quantity
        self.price = price

    def to_dict(self):
        return {
            "menu_item_id": self.menu_item_id,
            "name": self.name,
            "quantity": self.quantity,
            "price": self.price
        }

class Order:
    def __init__(self, table_number: int, items: List[Dict]):
        self.id = str(uuid.uuid4())
        self.table_number = table_number
        self.items = []
        self.total_amount = 0.0
        self.status = "pending" # pending, completed, cancelled
        self.created_at = datetime.datetime.now().isoformat()
        
        for item in items:
            self.add_item(item['menu_item_id'], item['name'], item['quantity'], item['price'])

    def add_item(self, menu_item_id: str, name: str, quantity: int, price: float):
        self.items.append(OrderItem(menu_item_id, name, quantity, price))
        self.total_amount += (price * quantity)

    def complete_order(self):
        self.status = "completed"

    def cancel_order(self):
        self.status = "cancelled"

    def to_dict(self):
        return {
            "id": self.id,
            "table_number": self.table_number,
            "items": [item.to_dict() for item in self.items],
            "total_amount": round(self.total_amount, 2),
            "status": self.status,
            "created_at": self.created_at
        }
