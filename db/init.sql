CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  average_rating FLOAT,
  is_kosher BOOLEAN,
  cuisines VARCHAR(255)[],
  dishes JSON[]
);

INSERT INTO restaurants (name, average_rating, is_kosher, cuisines, dishes)
VALUES (
  'Taizu', 
  4.83, 
  false, 
  ARRAY['Asian', 'Mexican', 'Indian'], 
  ARRAY['{"id": "1", "name": "Noodles", "description": "Amazing one", "price": 59}']::JSON[]
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  rating FLOAT NOT NULL
);

INSERT INTO ratings (restaurant_id, rating)
VALUES (1, 4.83);