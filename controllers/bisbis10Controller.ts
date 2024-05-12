import { NextFunction, Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Dish, Order, OrderItem, Restaurant } from "../types/types";
import { roundToDp } from "../lib/helpers/roundToDp";
import {
  findForbidden,
  findMissing,
  findUnrecognized,
} from "../lib/checkObjectProperties";

const router = Router();

const validateIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that :id, e.g. in GET /restaurants/:id is correctly formatted
    and that a restaurant with that id exists in the DB.
  */

  try {
    const { id } = req.params;

    const nonDigitRegex = new RegExp(/\D/);

    if (id === "0" || nonDigitRegex.test(id)) {
      return res.status(400).send("Bad Request. id must be a positive integer");
    }

    const checkExistenceResponse = await client.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [id]
    );

    if (checkExistenceResponse.rowCount === 0) {
      return res
        .status(404)
        .send("The restaurant with the specified id was not found");
    }
  } catch (err) {
    return res.status(500).send("Internal Server Error. Unable to validate id");
  }

  next();
};

const validateRestaurantReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that only "name", "isKosher" and "cuisines" properties are in req.body
    and have correct types.
    
    If request method is POST, checks that ALL these properties are present.
  */

  try {
    const {
      name,
      isKosher,
      cuisines,
    }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

    const allowedProperties = ["name", "isKosher", "cuisines"];
    const forbiddenProperties = ["id", "averageRating", "dishes", "nextDishId"];

    if (req.method === "POST") {
      // Check for missing required properties in request body
      const missingPropertiesInRequest = findMissing(
        req.body,
        allowedProperties
      );

      if (missingPropertiesInRequest.length > 0) {
        return res
          .status(400)
          .send(
            `Bad Request. Required properties are missing: ${missingPropertiesInRequest.join(
              ", "
            )}`
          );
      }
    }

    // Check for not allowed properties being sent in request body
    const forbiddenPropertiesInRequest = findForbidden(
      req.body,
      forbiddenProperties
    );

    if (forbiddenPropertiesInRequest.length > 0) {
      return res
        .status(422)
        .send(
          `Unprocessable Entity. The following properties cannot be included in the request: ${forbiddenPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    // Check for unrecognized properties being sent in request body
    const unrecognizedPropertiesInRequest = findUnrecognized(
      req.body,
      allowedProperties,
      forbiddenProperties
    );

    if (unrecognizedPropertiesInRequest.length > 0) {
      return res
        .status(400)
        .send(
          `Bad Request. Unrecognized properties in request: ${unrecognizedPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    // Check that all data types of columns to be updated are correct
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return res
        .status(400)
        .send("Bad Request. name must be a non-empty string");
    }

    if (isKosher !== undefined && typeof isKosher !== "boolean") {
      return res.status(400).send("Bad Request. isKosher must be a boolean");
    }

    if (
      cuisines !== undefined &&
      (!Array.isArray(cuisines) ||
        cuisines.some(
          (cuisine) =>
            typeof cuisine !== "string" || cuisine.trim().length === 0
        ))
    ) {
      return res
        .status(400)
        .send("Bad Request. cuisines must be an array of non-empty strings");
    }
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to validate request body");
  }

  next();
};

const validateIdInReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that "restaurantId" property is in req.body and has correct type/format,
    and that a restaurant with that id exists in the DB.
  */

  try {
    const { restaurantId } = req.body;

    if (restaurantId === undefined) {
      return res
        .status(400)
        .send("Bad Request. Required properties are missing: restaurantId");
    }

    if (typeof restaurantId !== "number") {
      return res.status(400).send("Bad Request. restaurantId must be a number");
    }

    if (!Number.isInteger(restaurantId) || restaurantId < 1) {
      return res
        .status(400)
        .send("Bad Request. restaurantId must be a positive integer");
    }

    const checkExistenceResponse = await client.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (checkExistenceResponse.rowCount === 0) {
      return res
        .status(404)
        .send("The restaurant with the specified restaurantId was not found");
    }
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to validate restaurantId");
  }

  next();
};

const validateDishReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that only "name", "description" and "price" properties are in req.body
    and have correct types.
    
    If request method is POST, checks that ALL these properties are present.
  */

  try {
    const {
      name,
      description,
      price,
    }: Pick<Dish, "name" | "description" | "price"> = req.body;

    const allowedProperties = ["name", "description", "price"];
    const forbiddenProperties = ["id"];

    if (req.method === "POST") {
      // Check for missing required properties in request body
      const missingPropertiesInRequest = findMissing(
        req.body,
        allowedProperties
      );

      if (missingPropertiesInRequest.length > 0) {
        return res
          .status(400)
          .send(
            `Bad Request. Required properties are missing: ${missingPropertiesInRequest.join(
              ", "
            )}`
          );
      }
    }

    // Check for not allowed properties being sent in request body
    const forbiddenPropertiesInRequest = findForbidden(
      req.body,
      forbiddenProperties
    );

    if (forbiddenPropertiesInRequest.length > 0) {
      return res
        .status(422)
        .send(
          `Unprocessable Entity. The following properties cannot be included in the request: ${forbiddenPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    // Check for unrecognized properties being sent in request body
    const unrecognizedPropertiesInRequest = findUnrecognized(
      req.body,
      allowedProperties,
      forbiddenProperties
    );

    if (unrecognizedPropertiesInRequest.length > 0) {
      return res
        .status(400)
        .send(
          `Bad Request. Unrecognized properties in request: ${unrecognizedPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    // Check that all data types of dish properties are correct
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return res
        .status(400)
        .send("Bad Request. name must be a non-empty string");
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).send("Bad Request. description must be a string");
    }

    if ((price !== undefined && typeof price !== "number") || price < 0) {
      return res
        .status(400)
        .send("Bad Request. price must be a number greater than or equal to 0");
    }
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to validate request body");
  }

  next();
};

const validateDishIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that :dishId, e.g. in PUT /restaurants/:id/dishes/:dishId is correctly formatted
    and that a dish with the specified dishId exists 
    in the dishes array of the DB record associated with 
    the restaurant with the specified id.

    If checks pass, adds the array of restaurant dishes 
    and the array index of the specified dish to req.body to be used in endpoint logic.
  */

  try {
    const { id, dishId } = req.params;

    const nonDigitRegex = new RegExp(/\D/);

    if (dishId === "0" || nonDigitRegex.test(dishId)) {
      {
        return res
          .status(400)
          .send("Bad Request. dishId must be a positive integer");
      }
    }

    const getDishesQuery: QueryConfig = {
      text: `
        SELECT dishes
        FROM restaurants
        WHERE id = $1
        ;`,
      values: [id],
    };

    const result: QueryResult<Restaurant> = await client.query(getDishesQuery);
    const dishes = result.rows[0].dishes;

    const dishIndex = dishes.findIndex((dish) => dish.id === dishId);

    if (dishIndex === -1) {
      return res
        .status(404)
        .send(
          `A dish with id ${dishId} was not found in the specified restaurant's menu`
        );
    } else {
      req.body.restaurantDishes = dishes;
      req.body.dishIndex = dishIndex;
    }
  } catch (err) {
    return res
      .status(500)
      .send(
        "Internal Server Error. Unable to check if restaurant menu contains the specified dish"
      );
  }

  next();
};

const validateOrderReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that both "restaurantId" and "orderItems" properties are in req.body
    and have correct types, and that there are no other properties present.
    
    Includes checking types of each object within "orderItems" array.
  */

  try {
    const orderItems: OrderItem[] = req.body.orderItems;

    const allowedProperties = ["restaurantId", "orderItems"];
    const forbiddenProperties = ["id"];

    const missingPropertiesInRequest = findMissing(req.body, allowedProperties);

    if (missingPropertiesInRequest.length > 0) {
      return res
        .status(400)
        .send(
          `Bad Request. Required properties are missing: ${missingPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    const forbiddenPropertiesInRequest = findForbidden(
      req.body,
      forbiddenProperties
    );

    if (forbiddenPropertiesInRequest.length > 0) {
      return res
        .status(422)
        .send(
          `Unprocessable Entity. The following properties cannot be included in the request: ${forbiddenPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    const unrecognizedPropertiesInRequest = findUnrecognized(
      req.body,
      allowedProperties,
      forbiddenProperties
    );

    if (unrecognizedPropertiesInRequest.length > 0) {
      return res
        .status(400)
        .send(
          `Bad Request. Unrecognized properties in request: ${unrecognizedPropertiesInRequest.join(
            ", "
          )}`
        );
    }

    // Check that data type of orderItems is correct
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .send(`Bad Request. orderItems must be a non-empty array`);
    }

    // Do not check data type of restaurantId - this is handled in validateIdInReqBodyMiddleware

    const allowedOrderItemProperties = ["dishId", "amount"];

    for (let i = 0; i < orderItems.length; i++) {
      const orderItem = orderItems[i];

      if (typeof orderItem !== "object") {
        return res
          .status(400)
          .send(
            `Bad Request. Item at index ${i} of orderItems array must be an object. Please ensure each item is formatted correctly`
          );
      }

      // Check for missing required properties in element of orderItems array
      const missingPropertiesInOrderItem = findMissing(
        orderItem,
        allowedOrderItemProperties
      );

      if (missingPropertiesInOrderItem.length > 0) {
        return res
          .status(400)
          .send(
            `Bad Request. Required properties are missing at index ${i} of orderItems array: ${missingPropertiesInOrderItem.join(
              ", "
            )}`
          );
      }

      // Check for unrecognized properties in element of orderItems array
      const unrecognizedPropertiesInOrderItem = findUnrecognized(
        orderItem,
        allowedOrderItemProperties,
        []
      );

      if (unrecognizedPropertiesInOrderItem.length > 0) {
        return res
          .status(400)
          .send(
            `Bad Request. Unrecognized properties at index ${i} of orderItems array: ${unrecognizedPropertiesInOrderItem.join(
              ", "
            )}`
          );
      }

      // Check that all data types of orderItem properties are correct
      if (typeof orderItem.dishId !== "number") {
        return res
          .status(400)
          .send(
            `Bad Request. dishId property at index ${i} of orderItems array must be a number`
          );
      }

      if (!Number.isInteger(orderItem.dishId) || orderItem.dishId < 1) {
        return res
          .status(400)
          .send(
            `Bad Request. dishId property at index ${i} of orderItems array must be a positive integer`
          );
      }

      if (typeof orderItem.amount !== "number") {
        return res
          .status(400)
          .send(
            `Bad Request. amount property at index ${i} of orderItems array must be a number`
          );
      }

      if (!Number.isInteger(orderItem.amount) || orderItem.amount < 1) {
        return res
          .status(400)
          .send(
            `Bad Request. amount property at index ${i} of orderItems array must be a positive integer`
          );
      }
    }
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to validate request body");
  }

  next();
};

const validateOrderDishesExistenceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
    Checks that the dishes array of the DB record associated with 
    the restaurant with the specified id has every 
    dishId in req.body.orderItems
  */

  try {
    const { restaurantId, orderItems }: Order = req.body;

    const getDishesQuery: QueryConfig = {
      text: `
        SELECT dishes
        FROM restaurants
        WHERE id = $1
        ;`,
      values: [restaurantId],
    };

    const getDishesQueryResult: QueryResult<Pick<Restaurant, "dishes">> =
      await client.query(getDishesQuery);

    const restaurantDishes = getDishesQueryResult.rows[0].dishes;

    const restaurantDishesIdArray = restaurantDishes.map((dish) =>
      Number.parseInt(dish.id)
    );

    const restaurantDishesIdSet = new Set(restaurantDishesIdArray);

    const orderDishesIdArray = orderItems.map((orderItem) => orderItem.dishId);

    const missingOrderItems = orderDishesIdArray.filter(
      (dishId) => !restaurantDishesIdSet.has(dishId)
    );

    if (missingOrderItems.length > 0) {
      return res
        .status(404)
        .send(
          `Unable to process the order. The following dishIds were not found in the specified restaurant's menu: ${missingOrderItems.join(
            ", "
          )}`
        );
    }
  } catch (err) {
    return res
      .status(500)
      .send(
        "Internal Server Error. Unable to check if restaurant menu contains all ordered dishes"
      );
  }

  next();
};

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to BISBIS10 Server");
});

router.get("/restaurants", async (req: Request, res: Response) => {
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

router.get(
  "/restaurants/:id",
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

router.post(
  "/restaurants",
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

router.put(
  "/restaurants/:id",
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

router.delete(
  "/restaurants/:id",
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

router.post(
  "/ratings",
  [validateIdInReqBodyMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { restaurantId, rating } = req.body;

      if (typeof rating === "undefined") {
        return res
          .status(400)
          .send("Bad Request. Required properties are missing: rating");
      }

      if (typeof rating !== "number" || rating < 0 || rating > 5) {
        return res
          .status(400)
          .send("Bad Request. rating must be a number between 0 and 5");
      }

      const addRatingQuery: QueryConfig = {
        text: `
          INSERT INTO ratings ("restaurantId", rating)
          VALUES ($1, $2)
          ;`,
        values: [restaurantId, rating],
      };

      const updateAverageRatingQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET "averageRating" = 
            (
              SELECT AVG(rating)
              FROM ratings
              WHERE "restaurantId" = $1
            )
          WHERE id = $1
          ;`,
        values: [restaurantId],
      };

      await client.query("BEGIN");
      await client.query(addRatingQuery);
      await client.query(updateAverageRatingQuery);
      await client.query("COMMIT");

      return res.status(200).send();
    } catch (err) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new rating");
    }
  }
);

router.post(
  "/order",
  [
    validateIdInReqBodyMiddleware,
    validateOrderReqBodyMiddleware,
    validateOrderDishesExistenceMiddleware,
  ],
  async (req: Request, res: Response) => {
    try {
      const { restaurantId, orderItems }: Order = req.body;

      const combinedOrderItems: OrderItem[] = orderItems.reduce(
        (accumulator: OrderItem[], current: OrderItem) => {
          const existingItemIndex = accumulator.findIndex(
            (elem) => elem.dishId === current.dishId
          );
          if (existingItemIndex === -1) {
            accumulator.push(current);
          } else {
            accumulator[existingItemIndex].amount += current.amount;
          }
          return accumulator;
        },
        []
      );

      const addOrderQuery: QueryConfig = {
        text: `
            INSERT INTO orders ("restaurantId", "orderItems")
            VALUES ($1, $2)
            RETURNING "orderId"
            ;`,
        values: [restaurantId, combinedOrderItems],
      };

      const result: QueryResult<Order> = await client.query(addOrderQuery);

      return res.status(200).send(result.rows[0]);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new order");
    }
  }
);

router.post(
  "/restaurants/:id/dishes",
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

router.put(
  "/restaurants/:id/dishes/:dishId",
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

router.delete(
  "/restaurants/:id/dishes/:dishId",
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

router.get(
  "/restaurants/:id/dishes",
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
