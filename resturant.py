from menuitem import MenuItem
from order import Order
from typing import List, Dict

class Restaurant:
    def __init__(self, name: str):
        self.name = name
        self.menu: Dict[str, MenuItem] = {}
        self.orders: Dict[str, Order] = {}
        self._seed_initial_menu()

    def add_menu_item(self, name: str, description: str, price: float, category: str, image_url: str = "") -> MenuItem:
        item = MenuItem(name, description, price, category, image_url)
        self.menu[item.id] = item
        return item

    def get_menu(self) -> List[dict]:
        return [item.to_dict() for item in self.menu.values()]
        
    def get_menu_item(self, item_id: str) -> MenuItem:
        return self.menu.get(item_id)

    def place_order(self, table_number: int, items: List[Dict]) -> Order:
        """
        items format: [{"menu_item_id": str, "quantity": int}]
        """
        order_items_data = []
        for item_data in items:
            menu_item = self.get_menu_item(item_data['menu_item_id'])
            if menu_item:
                order_items_data.append({
                    "menu_item_id": menu_item.id,
                    "name": menu_item.name,
                    "price": menu_item.price,
                    "quantity": item_data['quantity']
                })
        
        if not order_items_data:
            raise ValueError("No valid items in order")

        order = Order(table_number, order_items_data)
        self.orders[order.id] = order
        return order

    def update_order_status(self, order_id: str, status: str) -> Order:
        order = self.orders.get(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
            
        if status == "completed":
            order.complete_order()
        elif status == "cancelled":
            order.cancel_order()
        elif status == "pending":
            order.status = "pending"
        else:
            raise ValueError(f"Invalid status: {status}")
            
        return order

    def get_all_orders(self) -> List[dict]:
        return [order.to_dict() for order in self.orders.values()]

    def _seed_initial_menu(self):
        self.add_menu_item(
            "Truffle Burger",
            "Wagyu beef patty, truffle mayo, caramelized onions, brioche bun.",
            18.50,
            "Main Course",
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        )
        self.add_menu_item(
            "Margherita Pizza",
            "San Marzano tomato sauce, fresh mozzarella, basil, EVOO.",
            14.00,
            "Main Course",
            "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        )
        self.add_menu_item(
            "Caesar Salad",
            "Romaine lettuce, parmesan, croutons, house-made Caesar dressing.",
            10.00,
            "Starter",
            "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        )
        self.add_menu_item(
            "Chocolate Lava Cake",
            "Warm chocolate cake with a molten center, served with vanilla ice cream.",
            9.00,
            "Dessert",
            "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        )
        self.add_menu_item(
            "Craft Lemonade",
            "Freshly squeezed lemons, mint, and a touch of agave.",
            5.00,
            "Beverage",
            "https://images.unsplash.com/photo-1513364776144-60967b0f8007?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        )
