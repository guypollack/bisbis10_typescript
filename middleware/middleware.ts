import { NextFunction, Request, Response } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Dish, Order, OrderItem, Restaurant } from "../types/types";
import {
  findForbidden,
  findMissing,
  findUnrecognized,
} from "../lib/checkObjectProperties";

/**
 * Checks that "id" route parameter is a positive integer
 * and that a restaurant with that id exists in the DB.
 */
export const validateIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Checks that only "name", "isKosher" and "cuisines" properties are in req.body and have correct types.
 *
 * If request method is POST, checks that ALL these properties are present.
 *
 * Enforces constraints on "name" and "cuisines".
 */
export const validateRestaurantReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      isKosher,
      cuisines,
    }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

    if (req.method === "PUT" && Object.keys(req.body).length === 0) {
      return res.status(200).send();
    }

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

    if (Array.isArray(cuisines) && cuisines.length === 0) {
      return res
        .status(400)
        .send("Bad Request. cuisines must contain at least one value");
    }
  } catch (err) {
    return res
      .status(500)
      .send("Internal Server Error. Unable to validate request body");
  }

  next();
};

/**
 * Checks that "restaurantId" property is in req.body, has correct type and fits constraints,
 * and that a restaurant with that id exists in the DB.
 */
export const validateIdInReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Checks that only "name", "description" and "price" properties are in req.body,
 *  have correct types.
 *
 * If request method is POST, checks that ALL these properties are present.
 *
 * Enforces constraints on "name" and "price".
 */
export const validateDishReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      price,
    }: Pick<Dish, "name" | "description" | "price"> = req.body;

    if (req.method === "PUT" && Object.keys(req.body).length === 0) {
      return res.status(200).send();
    }

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

/**
 * Checks that "dishId" route parameter is a positive integer
 * and that a dish with the specified dishId exists
 * in the dishes array of the DB record associated with
 * the restaurant with the specified id.
 *
 * If checks pass, adds the array of restaurant dishes
 * and the array index of the specified dish to req.body to be used in endpoint logic.
 */
export const validateDishIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Checks that both "restaurantId" and "orderItems" properties are in req.body
 * and that there are no other properties present.
 *
 * Checks type and enforces constraints on "orderItem" and each object within "orderItems" array.
 * Does not check type of "restaurantId" - this is checked in validateIdInReqBodyMiddleware
 */
export const validateOrderReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    // Check type and enforce constraints on orderItems
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .send(`Bad Request. orderItems must be a non-empty array`);
    }

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

      // Check type and enforce constraints on orderItem object
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

/**
 * Checks that the dishes array of the DB record associated with
 * the restaurant with the specified id contains every
 * dishId listed in req.body.orderItems
 */
export const validateOrderDishesExistenceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
