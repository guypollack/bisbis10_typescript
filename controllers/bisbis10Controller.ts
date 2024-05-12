import { NextFunction, Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Dish, Order, OrderItem, Restaurant } from "../types/types";
import { roundToDp } from "../lib/helpers/roundToDp";

const router = Router();

const validateIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const nonDigitRegex = new RegExp(/\D/);

  if (id === "0" || nonDigitRegex.test(id)) {
    return res
      .status(400)
      .send("Bad Request. Restaurant id must be a positive integer");
  }

  try {
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
  const {
    name,
    isKosher,
    cuisines,
  }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

  const allowedProperties = ["name", "isKosher", "cuisines"];

  if (req.method === "POST") {
    // Check for missing required properties in request body
    const missingPropertiesInRequest = allowedProperties.filter(
      (property) =>
        !Object.keys(req.body).includes(property) ||
        req.body[property] === undefined
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
  const forbiddenProperties = ["id", "averageRating", "dishes", "nextDishId"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    const requestType =
      req.method === "POST"
        ? "creation request"
        : req.method === "PUT"
        ? "update request"
        : "request";

    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the ${requestType}: ${forbiddenPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check for unrecognized properties being sent in request body
  const unrecognizedPropertiesInRequest = Object.keys(req.body).filter(
    (property) =>
      !allowedProperties.includes(property) &&
      !forbiddenProperties.includes(property)
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
  if (name !== undefined && typeof name !== "string") {
    return res.status(400).send("Bad Request. name must be a string");
  }

  if (isKosher !== undefined && typeof isKosher !== "boolean") {
    return res.status(400).send("Bad Request. isKosher must be a boolean");
  }

  if (
    cuisines !== undefined &&
    !(
      Array.isArray(cuisines) &&
      cuisines.every((elem) => typeof elem === "string")
    )
  ) {
    return res
      .status(400)
      .send("Bad Request. cuisines must be an array of strings");
  }

  next();
};

const validateIdInReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

  try {
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
  const {
    name,
    description,
    price,
  }: Pick<Dish, "name" | "description" | "price"> = req.body;

  const allowedProperties = ["name", "description", "price"];

  if (req.method === "POST") {
    // Check for missing required properties in request body
    const missingPropertiesInRequest = allowedProperties.filter(
      (property) =>
        !Object.keys(req.body).includes(property) ||
        req.body[property] === undefined
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
  const forbiddenProperties = ["id"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    const requestType =
      req.method === "POST"
        ? "creation request"
        : req.method === "PUT"
        ? "update request"
        : "request";

    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the ${requestType}: ${forbiddenPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check for unrecognized properties being sent in request body
  const unrecognizedPropertiesInRequest = Object.keys(req.body).filter(
    (property) =>
      !allowedProperties.includes(property) &&
      !forbiddenProperties.includes(property)
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
  if (name !== undefined && typeof name !== "string") {
    return res.status(400).send("Bad Request. name must be a string");
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).send("Bad Request. description must be a string");
  }

  if ((price !== undefined && typeof price !== "number") || price < 0) {
    return res
      .status(400)
      .send("Bad Request. price must be a number greater than or equal to 0");
  }

  next();
};

const validateDishIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, dishId } = req.params;

  const nonDigitRegex = new RegExp(/\D/);

  if (dishId === "0" || nonDigitRegex.test(dishId)) {
    {
      return res
        .status(400)
        .send("Bad Request. dishId must be a positive integer");
    }
  }

  try {
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
          "The dish with the specified dishId was not found at the restaurant with the specified id"
        );
    } else {
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
  const orderItems: OrderItem[] = req.body.orderItems;

  if (orderItems === undefined) {
    return res
      .status(400)
      .send(`Bad Request. Required properties are missing: orderItems`);
  }

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res
      .status(400)
      .send(`Bad Request. orderItems must be a non-empty array`);
  }

  const requiredProperties = ["dishId", "amount"];

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
    const missingPropertiesInOrderItem = requiredProperties.filter(
      (property) => !(property in orderItem)
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
    const unrecognizedPropertiesInOrderItem = Object.keys(orderItem).filter(
      (property) => !requiredProperties.includes(property)
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

  next();
};

const validateOrderDishesExistenceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId, orderItems }: Order = req.body;

  try {
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
  const { cuisine } = req.query;

  let result: QueryResult<Omit<Restaurant, "dishes">>;

  if (cuisine) {
    const query: QueryConfig = {
      text: `
        SELECT id::VARCHAR, name, ROUND("averageRating"::numeric, 2) AS "averageRating", "isKosher", cuisines
        FROM restaurants
        WHERE $1 = ANY(cuisines)
        ORDER BY id ASC
        ;`,
      values: [cuisine],
    };
    result = await client.query(query);
  } else {
    result = await client.query(`
      SELECT id::VARCHAR, name, ROUND("averageRating"::numeric, 2) AS "averageRating", "isKosher", cuisines
      FROM restaurants
      ORDER BY id ASC
      ;`);
  }

  return res.status(200).send(result.rows);
});

router.get(
  "/restaurants/:id",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const query: QueryConfig = {
        text: `
          SELECT id::VARCHAR, name, ROUND("averageRating"::numeric, 2) as "averageRating", "isKosher", cuisines, dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(query);

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
    const {
      name,
      isKosher,
      cuisines,
    }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

    try {
      const query: QueryConfig = {
        text: `
          INSERT INTO restaurants (name, "isKosher", cuisines)
          VALUES ($1, $2, $3)
          ;`,
        values: [name, isKosher, cuisines],
      };

      await client.query(query);

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

    try {
      const query: QueryConfig = {
        text: `
          UPDATE restaurants
          SET ${setClauseComponents.join(", ")}
          WHERE id = $1
          ;`,
        values: [id, ...setClauseParameters],
      };

      await client.query(query);

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
    const { id } = req.params;

    try {
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
    const { restaurantId, rating } = req.body;

    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return res
        .status(400)
        .send("Bad Request. rating must be a number between 0 and 5");
    }

    try {
      const insertRatingQuery: QueryConfig = {
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
      await client.query(insertRatingQuery);
      await client.query(updateAverageRatingQuery);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new rating");
    }
    return res.status(200).send();
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
    const { restaurantId, orderItems }: Order = req.body;

    try {
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

      const query: QueryConfig = {
        text: `
            INSERT INTO orders ("restaurantId", "orderItems")
            VALUES ($1, $2)
            RETURNING id
            ;`,
        values: [restaurantId, combinedOrderItems],
      };

      const result: QueryResult<Order> = await client.query(query);

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
    const { id } = req.params;

    const {
      name,
      description,
      price,
    }: Pick<Dish, "name" | "description" | "price"> = req.body;

    try {
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
      const currentDishes = dishes.slice();

      const nextDishId = result.rows[0].nextDishId;
      const nextIdString = nextDishId.toString();

      const newDish = {
        id: nextIdString,
        name,
        description,
        price: roundToDp(price, 2),
      };

      const addNewDishQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1, "nextDishId" = $2
          WHERE id = $3
          ;`,
        values: [[...currentDishes, newDish], nextDishId + 1, id],
      };

      await client.query(addNewDishQuery);

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
    const { id } = req.params;
    const dishIndex: number = req.body.dishIndex;

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

    try {
      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };

      const getDishesQueryResult: QueryResult<Pick<Restaurant, "dishes">> =
        await client.query(getDishesQuery);

      const dishes = getDishesQueryResult.rows[0].dishes;

      const dishToUpdate = dishes[dishIndex];
      const updatedDish = { ...dishToUpdate, ...updatedDishProperties };

      const updatedDishes = dishes.slice();
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
    const { id } = req.params;
    const dishIndex: number = req.body.dishIndex;

    try {
      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(
        getDishesQuery
      );
      const dishes = result.rows[0].dishes;

      const updatedDishes = dishes.slice();
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
    const { id } = req.params;

    try {
      const query: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Pick<Restaurant, "dishes">> =
        await client.query(query);

      return res.status(200).send(result.rows[0].dishes);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to get dishes");
    }
  }
);

export default router;
