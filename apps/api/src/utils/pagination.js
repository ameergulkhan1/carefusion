const { PAGINATION } = require('./constants');

// Pagination helper
exports.paginate = (page, limit) => {
  const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
  const pageSize = Math.min(parseInt(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (currentPage - 1) * pageSize;

  return {
    page: currentPage,
    limit: pageSize,
    skip
  };
};

// Generate pagination response
exports.paginationResponse = (data, page, limit, total) => {
  const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
  const pageSize = parseInt(limit) || PAGINATION.DEFAULT_LIMIT;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      currentPage,
      pageSize,
      totalItems: total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  };
};
