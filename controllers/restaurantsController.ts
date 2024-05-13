import { Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Dish, Restaurant } from "../types/types";
import { roundToDp } from "../lib/helpers/roundToDp";
import {
  validateDishIdParamMiddleware,
  validateDishReqBodyMiddleware,
  validateIdParamMiddleware,
  validateRestaurantReqBodyMiddleware,
} from "../middleware/middleware";

// Handles routes beginning with "/restaurants"

const router = Router();

/**
 * GET /restaurants
 * or
 * GET /restaurants?cuisine=Mexican
 * Gets a list of all restaurants
 * Optional query parameter cuisine can be used to filter by cuisine
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { cuisine } = req.query;

    let getRestaurantsQuery: QueryConfig;

    if (cuisine) {
      getRestaurantsQuery = {
        text: `
          SELECT id::VARCHAR, name, ROUND("averageRating"::NUMERIC, 2)::FLOAT AS "averageRating", "isKosher", cuisines
          FROM restaurants
          WHERE $1 = ANY(cuisines)
          ORDER BY id ASC
          ;`,
        values: [cuisine],
      };
    } else {
      getRestaurantsQuery = {
        text: `
          SELECT id::VARCHAR, name, ROUND("averageRating"::NUMERIC, 2)::FLOAT AS "averageRating", "isKosher", cuisines
          FROM restaurants
          ORDER BY id ASC
          ;`,
      };
    }

    const result: QueryResult<Omit<Restaurant, "dishes">> = await client.query(
      getRestaurantsQuery
    );

    return res.status(200).send(result.rows);
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to get restaurants");
  }
});

/**
 * GET /restaurants/:id
 * Gets a specific restaurant identified by id
 */
router.get(
  "/:id",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const getRestaurantQuery: QueryConfig = {
        text: `
          SELECT id::VARCHAR, name, ROUND("averageRating"::NUMERIC, 2)::FLOAT as "averageRating", "isKosher", cuisines, dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(
        getRestaurantQuery
      );

      return res.status(200).send(result.rows[0]);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to get restaurant");
    }
  }
);

/**
 * POST /restaurants
 * Adds a new restaurant
 */
router.post(
  "/",
  [validateRestaurantReqBodyMiddleware],
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        isKosher,
        cuisines,
      }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

      const addRestaurantQuery: QueryConfig = {
        text: `
          INSERT INTO restaurants (name, "isKosher", cuisines)
          VALUES ($1, $2, $3)
          ;`,
        values: [name, isKosher, cuisines],
      };

      await client.query(addRestaurantQuery);

      return res.status(201).send();
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new restaurant");
    }
  }
);

/**
 * PUT /restaurants/:id
 * Updates a restaurant identified by id
 */
router.put(
  "/:id",
  [validateIdParamMiddleware, validateRestaurantReqBodyMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const allowedProperties = ["name", "isKosher", "cuisines"];

      if (
        allowedProperties.every((property) => req.body[property] === undefined)
      ) {
        return res.status(200).send();
      }

      const columnsToUpdate = allowedProperties.filter((property) =>
        Object.keys(req.body).includes(property)
      );

      const setClauseComponents: string[] = [];
      const setClauseParameters: Pick<
        Restaurant,
        "name" | "isKosher" | "cuisines"
      >[] = [];

      columnsToUpdate.forEach((columnName, index) => {
        setClauseComponents.push(`"${columnName}" = $${index + 2}`);
        setClauseParameters.push(req.body[columnName]);
      });

      const updateRestaurantQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET ${setClauseComponents.join(", ")}
          WHERE id = $1
          ;`,
        values: [id, ...setClauseParameters],
      };

      await client.query(updateRestaurantQuery);

      return res.status(200).send();
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to update restaurant");
    }
  }
);

/**
 * DELETE /restaurants/:id
 * Deletes a restaurant identified by id
 */
router.delete(
  "/:id",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleteRatingsQuery: QueryConfig = {
        text: `DELETE FROM ratings WHERE "restaurantId" = $1`,
        values: [id],
      };

      const deleteOrdersQuery: QueryConfig = {
        text: `DELETE FROM orders WHERE "restaurantId" = $1`,
        values: [id],
      };

      const deleteRestaurantQuery: QueryConfig = {
        text: "DELETE FROM restaurants WHERE id = $1",
        values: [id],
      };

      await client.query("BEGIN");
      await client.query(deleteRatingsQuery);
      await client.query(deleteOrdersQuery);
      await client.query(deleteRestaurantQuery);
      await client.query("COMMIT");

      return res.status(204).send();
    } catch (err) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .send("Internal Server Error. Unable to delete restaurant");
    }
  }
);

/**
 * POST /restaurants/:id/dishes
 * Adds a new dish to a restaurant identified by id
 */
router.post(
  "/:id/dishes",
  [validateIdParamMiddleware, validateDishReqBodyMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const {
        name,
        description,
        price,
      }: Pick<Dish, "name" | "description" | "price"> = req.body;

      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes, "nextDishId"
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Pick<Restaurant, "dishes" | "nextDishId">> =
        await client.query(getDishesQuery);
      const dishes = result.rows[0].dishes;

      const nextDishId = result.rows[0].nextDishId;
      const nextIdString = nextDishId.toString();

      const newDish = {
        id: nextIdString,
        name,
        description,
        price: roundToDp(price, 2),
      };

      const addDishQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1, "nextDishId" = $2
          WHERE id = $3
          ;`,
        values: [[...dishes, newDish], nextDishId + 1, id],
      };

      await client.query(addDishQuery);

      return res.status(201).send();
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new dish");
    }
  }
);

/**
 * PUT /restaurants/:id/dishes/:dishId
 * Updates a dish, identified by dishId, at a restaurant identified by id
 */
router.put(
  "/:id/dishes/:dishId",
  [
    validateIdParamMiddleware,
    validateDishReqBodyMiddleware,
    validateDishIdParamMiddleware,
  ],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const {
        restaurantDishes,
        dishIndex,
      }: {
        restaurantDishes: Dish[];
        dishIndex: number;
      } = req.body;

      const allowedProperties: (keyof Omit<Dish, "id">)[] = [
        "name",
        "description",
        "price",
      ];

      if (
        allowedProperties.every((property) => req.body[property] === undefined)
      ) {
        return res.status(200).send();
      }

      const updatedDishProperties: Partial<Omit<Dish, "id">> = allowedProperties
        .filter((property) => Object.keys(req.body).includes(property))
        .reduce(
          (accumulator, current) => ({
            ...accumulator,
            [current]: req.body[current],
          }),
          {}
        );

      const dishToUpdate = restaurantDishes[dishIndex];
      const updatedDish = { ...dishToUpdate, ...updatedDishProperties };

      const updatedDishes = restaurantDishes.slice();
      updatedDishes.splice(dishIndex, 1, updatedDish);

      const updateDishesQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1
          WHERE id = $2
          ;`,
        values: [updatedDishes, id],
      };

      await client.query(updateDishesQuery);

      return res.status(200).send();
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to update dish");
    }
  }
);

/**
 * PUT /restaurants/:id/dishes/:dishId
 * Deletes a dish, identified by dishId, from a restaurant identified by id
 */
router.delete(
  "/:id/dishes/:dishId",
  [validateIdParamMiddleware, validateDishIdParamMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        restaurantDishes,
        dishIndex,
      }: {
        restaurantDishes: Dish[];
        dishIndex: number;
      } = req.body;

      const updatedDishes = restaurantDishes.slice();
      updatedDishes.splice(dishIndex, 1);

      const deleteDishQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1
          WHERE id = $2
          ;`,
        values: [updatedDishes, id],
      };

      await client.query(deleteDishQuery);

      return res.status(204).send();
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to delete dish");
    }
  }
);

/**
 * GET /restaurants/:id/dishes
 * Gets a list of all dishes at a restaurant identified by id
 */
router.get(
  "/:id/dishes",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Pick<Restaurant, "dishes">> =
        await client.query(getDishesQuery);

      return res.status(200).send(result.rows[0].dishes);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to get dishes");
    }
  }
);

export default router;
