CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "averageRating" FLOAT,
  "isKosher" BOOLEAN NOT NULL,
  cuisines VARCHAR(255)[] NOT NULL,
  dishes JSON[]
);

INSERT INTO restaurants (name, "averageRating", "isKosher", cuisines, dishes)
VALUES (
  'Taizu', 
  4.83, 
  false, 
  ARRAY['Asian', 'Mexican', 'Indian'], 
  ARRAY['{"id": "1", "name": "Noodles", "description": "Amazing one", "price": 59}']::JSON[]
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  "restaurantId" INTEGER NOT NULL REFERENCES restaurants(id),
  rating FLOAT NOT NULL
);

INSERT INTO ratings ("restaurantId", rating)
VALUES (1, 4.83);