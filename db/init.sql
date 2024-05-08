CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "averageRating" FLOAT,
  "isKosher" BOOLEAN NOT NULL,
  cuisines VARCHAR(255)[] NOT NULL,
  dishes JSON[] NOT NULL DEFAULT ARRAY[]::JSON[],
  "nextDishId" INTEGER DEFAULT 1
);

INSERT INTO restaurants (name, "averageRating", "isKosher", cuisines, dishes)
VALUES (
  'Taizu', 
  4.83, 
  false, 
  ARRAY['Asian', 'Mexican', 'Indian'], 
  ARRAY['{"id": "1", "name": "Noodles", "description": "Amazing one", "price": 59}']::JSON[]
);

UPDATE restaurants
SET "nextDishId" = 2
WHERE id = 1 AND name = 'Taizu';

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  "restaurantId" INTEGER NOT NULL REFERENCES restaurants(id),
  rating FLOAT NOT NULL CHECK (rating >= 0 AND rating <= 5)
);

INSERT INTO ratings ("restaurantId", rating)
VALUES (1, 4.83);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "restaurantId" INTEGER NOT NULL REFERENCES restaurants(id),
  "orderItems" JSON[] NOT NULL
)