import uuid

class MenuItem:
    def __init__(self, name: str, description: str, price: float, category: str, image_url: str = ""):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.price = price
        self.category = category
        self.image_url = image_url

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "category": self.category,
            "image_url": self.image_url
        }
