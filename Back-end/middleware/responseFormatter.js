import { buildSuccess, buildPaginated } from '../utils/apiResponse.js';

/**
 * responseFormatter middleware
 *
 * Mount this once, before your routes:
 *   app.use(responseFormatter);
 *
 * Attaches consistent helper methods to `res` so controllers never
 * hand-build response JSON themselves.
 *
 *   res.success(data);                 // 200 { data }
 *   res.created(data);                 // 201 { data }
 *   res.paginated(data, paginationObj);// 200 { data, pagination }
 *   res.noContent();                   // 204, no body
 */
export default function responseFormatter(req, res, next) {
  res.success = (data, statusCode = 200) => {
    return res.status(statusCode).json(buildSuccess(data));
  };

  res.created = (data) => {
    return res.status(201).json(buildSuccess(data));
  };

  res.paginated = (data, pagination, statusCode = 200) => {
    return res.status(statusCode).json(buildPaginated(data, pagination));
  };

  res.noContent = () => {
    return res.status(204).send();
  };

  next();
}