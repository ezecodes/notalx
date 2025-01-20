import { NextFunction, Request, Response } from "express";
import {
  ApiError,
  fanOutNotification,
  isValidEmail,
  validateUsername,
} from "../helpers";
import { ErrorCodes, IUser, IUserPublic, NotificationType } from "../type";
import User from "./user.model";
import { Op } from "sequelize";

export async function findUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pagination = req.__pagination__!;
  const query = req.query.value as string;

  const rows: IUserPublic[] = (await User.findAll({
    where: {
      name: {
        [Op.like]: `%${query}%`,
      },
    },
    attributes: ["id", "name"],
    limit: pagination.page_size,
    offset: pagination.offset,
  })) as any;

  res.json({
    status: "ok",
    data: {
      rows,
      pagination,
    },
  });
}

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const body: Partial<IUser> = req.body;
  let { name, email } = body;
  if (!name || !email || !isValidEmail(email)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "Please provide a valid name and email address to proceed."
      )
    );

    return;
  }
  name = name.trim();
  const valid = validateUsername(name);
  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));
    return;
  }

  const count = await User.count({ where: { name } });
  if (count > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Account already exists"));
    return;
  }
  const countEmail = await User.count({ where: { email } });
  if (countEmail > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Email already exists"));
    return;
  }
  const user = (await User.create(
    { name, email: (email as string) ?? null },
    { returning: true, raw: true }
  )) as any as IUser;

  fanOutNotification(
    NotificationType.WelcomeMessage,
    {
      title: "Welcome to Our Platform!",
      message: "Thank you for registering. We're excited to have you on board!",
      metadata: {},
    },
    [user.id]
  );

  res.json({ status: "ok", message: "Account created!" });
}
