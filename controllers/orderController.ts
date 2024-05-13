import { Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Order, OrderItem } from "../types/types";
import {
  validateIdInReqBodyMiddleware,
  validateOrderDishesExistenceMiddleware,
  validateOrderReqBodyMiddleware,
} from "../middleware/middleware";

// Handles routes beginning with "/order"

const router = Router();

/**
 * POST /order
 * Adds a new order
 */
router.post(
  "/",
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

export default router;
