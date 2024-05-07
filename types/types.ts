export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Restaurant {
  id: number;
  name: string;
  averageRating: number;
  isKosher: boolean;
  cuisines: string[];
  dishes: Dish[];
  nextDishId: number;
}

export interface Rating {
  id: number;
  restaurantId: number;
  rating: number;
}
